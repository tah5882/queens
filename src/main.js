import './style.css';
import { solutions, makeRegions, conflicts, isSolved } from './puzzles.js';
import { loadRemoteProgress, saveRemoteProgress } from './sync.js';

const today = new Date();
const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
const dayNumber = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
const puzzleIndex = ((dayNumber % solutions.length) + solutions.length) % solutions.length;
const solution = solutions[puzzleIndex];
const regions = makeRegions(solution);
const colors = ['coral', 'sky', 'mint', 'sun', 'lavender', 'rose', 'sand'];
const dayKey = today.toISOString().slice(0, 10);
const key = `queens-${dayKey}`;
const saved = JSON.parse(localStorage.getItem(key) || 'null');
let queens = saved?.queens || Array(7).fill(null);
let crosses = new Set(saved?.crosses || []);
let elapsed = saved?.elapsed || 0;
let running = !saved?.solved;
let mistakes = 0;
let selectedTool = 'queen';
let syncTimer;
let hydrating = true;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header>
      <button class="icon-button" id="menu" aria-label="メニュー"><span></span><span></span><span></span></button>
      <div class="brand"><span class="mini-crown">♛</span><b>QUEENS</b></div>
      <button class="icon-button info" id="help" aria-label="遊び方">?</button>
    </header>
    <section class="intro">
      <div><span class="eyebrow">DAILY PUZZLE</span><h1>今日のクイーン</h1><p>${today.getMonth()+1}月${today.getDate()}日 · #${String(dayNumber).padStart(3, '0')}</p></div>
      <div class="streak"><span>🔥</span><b>${Number(localStorage.getItem('streak') || 3)}</b><small>連続</small></div>
    </section>
    <section class="game-card">
      <div class="game-meta"><div><small>タイム</small><strong id="timer">00:00</strong></div><button id="pause" aria-label="一時停止">Ⅱ</button><div class="align-right"><small>ベスト</small><strong>02:41</strong></div></div>
      <div id="board" class="board" role="grid" aria-label="7かける7のクイーンパズル"></div>
      <p class="status" id="status"><span>♛</span> 各行・列・色にクイーンを1つずつ置こう</p>
      <div class="actions">
        <button data-tool="cross"><span class="action-icon cross">×</span><small>マーク</small></button>
        <button data-tool="queen" class="primary active"><span class="action-icon">♛</span><small>クイーン</small></button>
        <button id="hint"><span class="action-icon bulb">♢</span><small>ヒント</small></button>
      </div>
    </section>
    <section class="next-card"><div class="calendar">${tomorrow.getDate()}<small>${tomorrow.toLocaleDateString('ja-JP',{weekday:'short'}).replace('曜日','')}</small></div><div><b>明日のパズル</b><p>あと <span id="countdown">--:--:--</span> で解放</p></div><span class="lock">⌁</span></section>
    <p class="quote">ひと息ついて、じっくり考えよう。<br>答えはきっと見えてくる。</p>
  </main>
  <nav><button class="selected">♛<span>デイリー</span></button><button id="archive">▦<span>アーカイブ</span></button><button id="stats">▥<span>記録</span></button></nav>
  <div class="overlay hidden" id="modal"><section class="modal-card"><button class="modal-close">×</button><div class="modal-icon">♛</div><h2>Queensの遊び方</h2><p>すべての行・列・色のエリアに、クイーンを<strong>1つずつ</strong>置きます。</p><ul><li>クイーン同士は同じ行・列に置けません</li><li>クイーン同士は斜めに隣接できません</li><li>マスをタップして置き、もう一度で消せます</li></ul><button class="modal-ok">はじめる</button></section></div>
  <div class="toast" id="toast"></div>`;

const board = document.querySelector('#board');
function render() {
  board.innerHTML = '';
  regions.forEach((row, r) => row.forEach((region, c) => {
    const cell = document.createElement('button');
    const id = `${r}-${c}`;
    cell.className = `cell ${colors[region]}`;
    cell.dataset.row = r; cell.dataset.col = c;
    cell.setAttribute('role', 'gridcell');
    if (queens[r] === c) cell.classList.add('has-queen');
    if (crosses.has(id)) cell.classList.add('has-cross');
    if (queens[r] === c && conflicts(queens, r, c, regions)) cell.classList.add('error');
    cell.textContent = queens[r] === c ? '♛' : crosses.has(id) ? '×' : '';
    board.append(cell);
  }));
  const progress = { queens, crosses: [...crosses], elapsed, solved: !running && isSolved(queens, regions) };
  localStorage.setItem(key, JSON.stringify(progress));
  if (!hydrating) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => saveRemoteProgress(dayKey, progress).catch(() => {}), 600);
  }
}

function tapCell(row, col) {
  if (!running && isSolved(queens, regions)) return;
  const id = `${row}-${col}`;
  if (selectedTool === 'cross') {
    crosses.has(id) ? crosses.delete(id) : crosses.add(id);
    if (queens[row] === col) queens[row] = null;
  } else {
    if (queens[row] === col) queens[row] = null;
    else { queens[row] = col; crosses.delete(id); navigator.vibrate?.(18); }
  }
  mistakes = queens.reduce((n, c, r) => n + (c !== null && conflicts(queens, r, c, regions) ? 1 : 0), 0);
  render();
  if (isSolved(queens, regions)) win();
  else document.querySelector('#status').innerHTML = mistakes ? `<span class="warning">!</span> ${mistakes}か所を見直してみよう` : '<span>♛</span> 各行・列・色にクイーンを1つずつ置こう';
}

board.addEventListener('click', e => { const cell = e.target.closest('.cell'); if (cell) tapCell(+cell.dataset.row, +cell.dataset.col); });
document.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => { selectedTool = btn.dataset.tool; document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b === btn)); }));
document.querySelector('#hint').addEventListener('click', () => { const row = solution.findIndex((col, r) => queens[r] !== col); if (row < 0) return; queens[row] = solution[row]; crosses.delete(`${row}-${solution[row]}`); showToast('ヒントを1つ置きました'); render(); if (isSolved(queens, regions)) win(); });

function win() {
  running = false; localStorage.setItem('streak', Number(localStorage.getItem('streak') || 3) + 1); render();
  document.querySelector('#status').innerHTML = '<span>✦</span> 完成！ 今日もすばらしいひらめきです';
  setTimeout(() => showToast(`クリア！ ${formatTime(elapsed)} · また明日`), 250);
}
function formatTime(seconds) { return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }
setInterval(() => { if (running) elapsed++; document.querySelector('#timer').textContent = formatTime(elapsed); const left = 86400 - (Math.floor(Date.now()/1000) % 86400); document.querySelector('#countdown').textContent = [left/3600, left%3600/60, left%60].map(v => String(Math.floor(v)).padStart(2,'0')).join(':'); }, 1000);
document.querySelector('#timer').textContent = formatTime(elapsed);

const modal = document.querySelector('#modal');
function toggleModal(show) { modal.classList.toggle('hidden', !show); }
document.querySelector('#help').onclick = () => toggleModal(true);
document.querySelector('.modal-close').onclick = document.querySelector('.modal-ok').onclick = () => toggleModal(false);
modal.addEventListener('click', e => { if (e.target === modal) toggleModal(false); });
document.querySelector('#pause').onclick = e => { running = !running; e.target.textContent = running ? 'Ⅱ' : '▶'; showToast(running ? '再開しました' : '一時停止中'); };
document.querySelector('#menu').onclick = () => toggleModal(true);
document.querySelector('#archive').onclick = () => showToast('アーカイブはもうすぐ公開');
document.querySelector('#stats').onclick = () => showToast(`連続 ${localStorage.getItem('streak') || 3}日 · 今日 ${formatTime(elapsed)}`);
function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
render();
loadRemoteProgress(dayKey).then(({ progress }) => {
  if (!progress || progress.updatedAt && saved?.updatedAt && progress.updatedAt <= saved.updatedAt) return;
  queens = progress.queens;
  crosses = new Set(progress.crosses);
  elapsed = Math.max(elapsed, progress.elapsed);
  running = !progress.solved;
  render();
  showToast('クラウドの続きから再開しました');
}).catch(() => {}).finally(() => { hydrating = false; render(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
