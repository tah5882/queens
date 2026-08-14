import { generateQueens, conflicts, isSolved } from './puzzles.js';
import { generateSudoku, sudokuComplete } from './sudoku.js';
import { loadRemoteProgress, saveRemoteProgress } from './sync.js';

const today = new Date();
const dayKey = today.toISOString().slice(0, 10);
const dayNumber = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(2026, 0, 1)) / 86400000) + 1;
const colors = ['coral', 'sky', 'mint', 'sun', 'lavender', 'rose', 'sand', 'lime', 'blue', 'peach'];
let mode = localStorage.getItem('queens-mode') || 'queens';
let size = Number(localStorage.getItem('queens-size') || 7);
let puzzleSeed = dayNumber * 101 + size;
let queensGame, queens, crosses, sudokuGame, sudokuBoard, selectedCell;
let elapsed = 0, running = true, selectedTool = 'queen', syncTimer, hydrating = true;

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <header><button class="icon-button" id="menu" aria-label="メニュー"><span></span><span></span><span></span></button><div class="brand"><span class="mini-crown">♛</span><b>PUZZLE ROOM</b></div><button class="icon-button info" id="help" aria-label="遊び方">?</button></header>
    <section class="intro"><div><span class="eyebrow" id="eyebrow">DAILY QUEENS</span><h1 id="game-title">今日のクイーン</h1><p>${today.getMonth()+1}月${today.getDate()}日 · #${String(dayNumber).padStart(3,'0')}</p></div><div class="streak"><span>🔥</span><b>${localStorage.getItem('streak') || 3}</b><small>連続</small></div></section>
    <div class="mode-switch" role="tablist"><button data-mode="queens">♛ Queens</button><button data-mode="sudoku">⌗ ナンプレ</button></div>
    <section class="game-card">
      <div class="game-meta"><div><small>タイム</small><strong id="timer">00:00</strong></div><button id="pause" aria-label="一時停止">Ⅱ</button><div class="align-right"><small id="meta-label">サイズ</small><strong id="meta-value">7 × 7</strong></div></div>
      <div id="queens-controls" class="size-controls"><span>盤面サイズ</span><div>${[5,6,7,8,9].map(value => `<button data-size="${value}">${value}</button>`).join('')}</div><button id="new-queens" class="shuffle">↻ 自動生成</button></div>
      <div id="board" class="board" role="grid"></div>
      <p class="status" id="status"></p>
      <div id="queen-actions" class="actions"><button data-tool="cross"><span class="action-icon cross">×</span><small>マーク</small></button><button data-tool="queen" class="primary active"><span class="action-icon">♛</span><small>クイーン</small></button><button id="hint"><span class="action-icon bulb">♢</span><small>ヒント</small></button></div>
      <div id="number-pad" class="number-pad hidden">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-number="${n}">${n}</button>`).join('')}<button data-number="0">消す</button></div>
    </section>
    <button class="new-puzzle" id="new-puzzle">↻ 新しいパズルを作る</button>
    <p class="quote">ひと息ついて、じっくり考えよう。<br>答えはきっと見えてくる。</p>
  </main>
  <nav><button data-nav="queens">♛<span>Queens</span></button><button data-nav="sudoku">⌗<span>ナンプレ</span></button><button id="stats">▥<span>記録</span></button></nav>
  <div class="overlay hidden" id="modal"><section class="modal-card"><button class="modal-close">×</button><div class="modal-icon">♛</div><h2>遊び方</h2><div id="help-copy"></div><button class="modal-ok">はじめる</button></section></div><div class="toast" id="toast"></div>`;

const board = document.querySelector('#board');
function queensStorageKey() { return `queens-${dayKey}-${size}-${puzzleSeed}`; }
function startQueens(seed = dayNumber * 101 + size) {
  puzzleSeed = seed; queensGame = generateQueens(size, seed);
  const saved = JSON.parse(localStorage.getItem(queensStorageKey()) || 'null');
  queens = saved?.queens?.length === size ? saved.queens : Array(size).fill(null);
  crosses = new Set(saved?.crosses || []); elapsed = saved?.elapsed || 0; running = !saved?.solved;
  render();
}
function startSudoku(seed = dayNumber * 313) {
  puzzleSeed = seed; sudokuGame = generateSudoku(seed, 'normal');
  const saved = JSON.parse(localStorage.getItem(`sudoku-${seed}`) || 'null');
  sudokuBoard = saved?.board || sudokuGame.puzzle.map(row => [...row]); elapsed = saved?.elapsed || 0; selectedCell = null; running = !sudokuComplete(sudokuBoard, sudokuGame.solution);
  render();
}

function render() {
  const isQueens = mode === 'queens';
  document.body.dataset.mode = mode;
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  document.querySelectorAll('[data-nav]').forEach(button => button.classList.toggle('selected', button.dataset.nav === mode));
  document.querySelector('#eyebrow').textContent = isQueens ? 'DAILY QUEENS' : 'DAILY SUDOKU';
  document.querySelector('#game-title').textContent = isQueens ? '今日のクイーン' : '今日のナンプレ';
  document.querySelector('#meta-label').textContent = isQueens ? 'サイズ' : '難易度';
  document.querySelector('#meta-value').textContent = isQueens ? `${size} × ${size}` : 'ふつう';
  document.querySelector('#queens-controls').classList.toggle('hidden', !isQueens);
  document.querySelector('#queen-actions').classList.toggle('hidden', !isQueens);
  document.querySelector('#number-pad').classList.toggle('hidden', isQueens);
  document.querySelectorAll('[data-size]').forEach(button => button.classList.toggle('active', Number(button.dataset.size) === size));
  board.className = `board ${isQueens ? 'queens-board' : 'sudoku-board'}`; board.innerHTML = '';
  if (isQueens) renderQueens(); else renderSudoku();
}

function renderQueens() {
  board.style.setProperty('--size', size);
  queensGame.regions.forEach((row, r) => row.forEach((region, c) => {
    const cell = document.createElement('button'); const id = `${r}-${c}`;
    cell.className = `cell ${colors[region]}`; cell.dataset.row = r; cell.dataset.col = c;
    if (queens[r] === c) cell.classList.add('has-queen');
    if (crosses.has(id)) cell.classList.add('has-cross');
    if (queens[r] === c && conflicts(queens, r, c, queensGame.regions)) cell.classList.add('error');
    cell.textContent = queens[r] === c ? '♛' : crosses.has(id) ? '×' : ''; board.append(cell);
  }));
  const solved = isSolved(queens, queensGame.regions);
  document.querySelector('#status').innerHTML = solved ? '<span>✦</span> 完成！ 新しい盤面にも挑戦しよう' : `<span>♛</span> 各行・列・色にクイーンを1つずつ`;
  const progress = { queens, crosses:[...crosses], elapsed, solved };
  localStorage.setItem(queensStorageKey(), JSON.stringify(progress));
  if (!hydrating && puzzleSeed === dayNumber * 101 + size) { clearTimeout(syncTimer); syncTimer = setTimeout(() => saveRemoteProgress(dayKey, progress).catch(()=>{}), 600); }
}

function renderSudoku() {
  sudokuBoard.forEach((row, r) => row.forEach((value, c) => {
    const cell = document.createElement('button'); const fixed = sudokuGame.puzzle[r][c] !== 0;
    cell.className = 'sudoku-cell'; cell.dataset.row = r; cell.dataset.col = c;
    if (fixed) cell.classList.add('fixed');
    if (selectedCell?.[0] === r && selectedCell?.[1] === c) cell.classList.add('selected-cell');
    if (value && value !== sudokuGame.solution[r][c]) cell.classList.add('error');
    cell.textContent = value || ''; board.append(cell);
  }));
  const solved = sudokuComplete(sudokuBoard, sudokuGame.solution);
  document.querySelector('#status').innerHTML = solved ? '<span>✦</span> 完成！ お見事です' : '<span>⌗</span> 空いているマスに1〜9を入れよう';
  localStorage.setItem(`sudoku-${puzzleSeed}`, JSON.stringify({ board:sudokuBoard, elapsed, solved }));
}

function switchMode(next) { mode = next; localStorage.setItem('queens-mode', mode); hydrating = false; mode === 'queens' ? startQueens() : startSudoku(); }
board.addEventListener('click', event => {
  const cell = event.target.closest('button'); if (!cell || !running) return; const r = +cell.dataset.row, c = +cell.dataset.col;
  if (mode === 'sudoku') { if (!sudokuGame.puzzle[r][c]) { selectedCell=[r,c]; render(); } return; }
  const id=`${r}-${c}`; if(selectedTool==='cross'){crosses.has(id)?crosses.delete(id):crosses.add(id);if(queens[r]===c)queens[r]=null;}else{queens[r]=queens[r]===c?null:c;crosses.delete(id);} render(); if(isSolved(queens,queensGame.regions)) win();
});
document.querySelectorAll('[data-number]').forEach(button => button.onclick=()=>{if(!selectedCell||!running)return; sudokuBoard[selectedCell[0]][selectedCell[1]]=+button.dataset.number;render();if(sudokuComplete(sudokuBoard,sudokuGame.solution))win();});
document.querySelectorAll('[data-mode],[data-nav]').forEach(button => button.onclick=()=>switchMode(button.dataset.mode||button.dataset.nav));
document.querySelectorAll('[data-size]').forEach(button => button.onclick=()=>{size=+button.dataset.size;localStorage.setItem('queens-size',size);startQueens();});
document.querySelectorAll('[data-tool]').forEach(button=>button.onclick=()=>{selectedTool=button.dataset.tool;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b===button));});
document.querySelector('#hint').onclick=()=>{const row=queensGame.solution.findIndex((col,r)=>queens[r]!==col);if(row>=0){queens[row]=queensGame.solution[row];render();}};
function newPuzzle(){const seed=Date.now();mode==='queens'?startQueens(seed):startSudoku(seed);showToast('新しいパズルを作りました');}
document.querySelector('#new-queens').onclick=newPuzzle; document.querySelector('#new-puzzle').onclick=newPuzzle;
function win(){running=false;localStorage.setItem('streak',Number(localStorage.getItem('streak')||3)+1);render();navigator.vibrate?.([40,40,80]);showToast(`クリア！ ${formatTime(elapsed)}`);}
function formatTime(seconds){return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
setInterval(()=>{if(running)elapsed++;document.querySelector('#timer').textContent=formatTime(elapsed);},1000);
const modal=document.querySelector('#modal');function toggleModal(show){document.querySelector('#help-copy').innerHTML=mode==='queens'?'<p>行・列・色ごとにクイーンを1つ置きます。クイーン同士は斜めに隣接できません。</p>':'<p>各行・列・3×3のブロックに、1〜9を重複しないように入れます。</p>';modal.classList.toggle('hidden',!show);}document.querySelector('#help').onclick=()=>toggleModal(true);document.querySelector('#menu').onclick=()=>toggleModal(true);document.querySelector('.modal-close').onclick=document.querySelector('.modal-ok').onclick=()=>toggleModal(false);
document.querySelector('#pause').onclick=event=>{running=!running;event.target.textContent=running?'Ⅱ':'▶';showToast(running?'再開しました':'一時停止中');};document.querySelector('#stats').onclick=()=>showToast(`連続 ${localStorage.getItem('streak')||3}日`);function showToast(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200);}

if(mode==='queens'){startQueens();loadRemoteProgress(dayKey).then(({progress})=>{if(progress?.queens?.length===size){queens=progress.queens;crosses=new Set(progress.crosses);elapsed=Math.max(elapsed,progress.elapsed);running=!progress.solved;}}).catch(()=>{}).finally(()=>{hydrating=false;render();});}else{hydrating=false;startSudoku();}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
