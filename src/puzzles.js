export const solutions = [
  [1, 3, 5, 0, 2, 4, 6],
  [2, 5, 1, 4, 0, 3, 6],
  [0, 3, 6, 2, 5, 1, 4]
];

export function makeRegions(solution) {
  return Array.from({ length: 7 }, (_, row) => Array.from({ length: 7 }, (_, col) => {
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
