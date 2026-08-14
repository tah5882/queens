function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = Math.imul(value ^ value >>> 15, 1 | value) + 0x6D2B79F5) >>> 0) / 4294967296;
}

function shuffle(values, rng) {
  const copy = [...values];
  for (let i = copy.length - 1; i; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

export function generateSudoku(seed = Date.now(), difficulty = 'normal') {
  const rng = seeded(seed);
  const bands = shuffle([0, 1, 2], rng).flatMap(band => shuffle([0, 1, 2], rng).map(row => band * 3 + row));
  const stacks = shuffle([0, 1, 2], rng).flatMap(stack => shuffle([0, 1, 2], rng).map(col => stack * 3 + col));
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const solution = bands.map(row => stacks.map(col => digits[(row * 3 + Math.floor(row / 3) + col) % 9]));
  const remove = { easy: 38, normal: 46, hard: 52 }[difficulty] || 46;
  const puzzle = solution.map(row => [...row]);
  let removed = 0;
  for (const index of shuffle(Array.from({ length: 81 }, (_, i) => i), rng)) {
    if (removed >= remove) break;
    const row = Math.floor(index / 9), col = index % 9, previous = puzzle[row][col];
    puzzle[row][col] = 0;
    if (countSolutions(puzzle) === 1) removed++;
    else puzzle[row][col] = previous;
  }
  return { puzzle, solution, difficulty };
}

export function countSolutions(board, limit = 2) {
  const grid = board.map(row => [...row]);
  let count = 0;
  function solve() {
    if (count >= limit) return;
    let target = null, candidates = null;
    for (let row = 0; row < 9; row++) for (let col = 0; col < 9; col++) if (!grid[row][col]) {
      const used = new Set([...grid[row], ...grid.map(line => line[col])]);
      const startRow = Math.floor(row / 3) * 3, startCol = Math.floor(col / 3) * 3;
      for (let r = startRow; r < startRow + 3; r++) for (let c = startCol; c < startCol + 3; c++) used.add(grid[r][c]);
      const options = [1,2,3,4,5,6,7,8,9].filter(value => !used.has(value));
      if (!options.length) return;
      if (!candidates || options.length < candidates.length) { target = [row, col]; candidates = options; }
    }
    if (!target) { count++; return; }
    for (const value of candidates) { grid[target[0]][target[1]] = value; solve(); grid[target[0]][target[1]] = 0; }
  }
  solve(); return count;
}

export function sudokuComplete(board, solution) {
  return board.every((row, r) => row.every((value, c) => value === solution[r][c]));
}
