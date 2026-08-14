function random(seed = Date.now()) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ result >>> 15, result | 1);
    result ^= result + Math.imul(result ^ result >>> 7, result | 61);
    return ((result ^ result >>> 14) >>> 0) / 4294967296;
  };
}

function shuffled(values, rng) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) {
    const target = Math.floor(rng() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function generateQueens(size = 7, seed = Date.now()) {
  if (!Number.isInteger(size) || size < 5 || size > 10) throw new RangeError('size must be between 5 and 10');
  const rng = random(seed);
  const solution = Array(size).fill(null);
  const used = new Set();
  function place(row) {
    if (row === size) return true;
    for (const col of shuffled(Array.from({ length: size }, (_, index) => index), rng)) {
      if (used.has(col) || row > 0 && Math.abs(solution[row - 1] - col) === 1) continue;
      solution[row] = col; used.add(col);
      if (place(row + 1)) return true;
      used.delete(col);
    }
    solution[row] = null;
    return false;
  }
  if (!place(0)) throw new Error('unable to generate puzzle');
  return { size, solution, regions: makeRegions(solution) };
}

export function makeRegions(solution) {
  const size = solution.length;
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => {
    let best = 0;
    let distance = Infinity;
    solution.forEach((queenCol, region) => {
      const next = Math.abs(row - region) + Math.abs(col - queenCol);
      if (next < distance) { distance = next; best = region; }
    });
    return best;
  }));
}

export function conflicts(queens, row, col, regions) {
  const region = regions[row][col];
  return queens.some((queenCol, queenRow) => queenCol !== null && queenRow !== row && (
    queenCol === col || regions[queenRow][queenCol] === region ||
    (Math.abs(queenRow - row) === 1 && Math.abs(queenCol - col) === 1)
  ));
}

export function isSolved(queens, regions) {
  return queens.every(col => col !== null) && queens.every((col, row) => !conflicts(queens, row, col, regions));
}
