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
  if (!Number.isInteger(size) || size < 5 || size > 9) throw new RangeError('size must be between 5 and 9');
  const rng = random(seed);
  const maxAttempts = 400;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const regions = makeGeneratedRegions(size, rng);
    if (hasExactlyOneSingleton(regions) && countQueensSolutions(regions, 2) === 1) {
      return { size, solution: findQueensSolution(regions), regions };
    }
  }
  // A bounded fallback keeps an unlucky seed from producing a blank board.
  // It is still checked before use and is transformed by seed for variation.
  const regions = transformRegions(FALLBACK_REGIONS[size], (Number(seed) >>> 0) % 8);
  if (hasExactlyOneSingleton(regions) && countQueensSolutions(regions, 2) === 1) {
    return { size, solution: findQueensSolution(regions), regions };
  }
  throw new Error(`unable to generate a unique ${size}x${size} Queens puzzle`);
}

const FALLBACK_REGIONS = {
  5: [[2,2,3,0,0],[2,2,3,0,0],[2,3,3,3,0],[2,3,3,1,1],[2,2,4,1,1]],
  6: [[3,3,3,2,2,2],[3,3,3,2,2,2],[3,2,2,2,5,2],[0,2,2,1,4,4],[0,0,0,1,4,4],[0,0,1,1,4,4]],
  7: [[3,3,1,1,1,1,1],[3,1,1,1,2,0,1],[3,3,6,2,2,0,0],[3,6,6,2,2,2,4],[3,3,6,6,2,2,4],[3,3,3,3,5,4,4],[3,3,3,3,4,4,4]],
  8: [[1,1,1,1,1,1,5,5],[1,7,7,1,1,5,5,5],[1,1,7,7,7,5,5,5],[1,3,3,7,7,5,5,5],[3,3,3,6,6,5,5,4],[2,0,3,3,6,6,5,4],[2,6,6,6,6,6,4,4],[2,2,6,6,6,6,4,4]],
  9: [[2,2,0,0,0,0,0,3,3],[2,0,0,0,0,0,0,0,3],[2,2,0,0,0,5,6,5,5],[8,2,8,4,5,5,5,5,1],[8,8,8,4,4,5,5,5,1],[8,8,4,4,4,5,5,5,5],[4,4,4,4,4,5,5,5,5],[4,4,4,4,7,7,5,5,5],[4,4,7,7,7,7,7,7,5]],
};

/** Legacy helper: grow connected regions from supplied answer cells. */
export function makeRegions(solution, rng = random(regionSeed(solution))) {
  const size = solution.length;
  const regions = Array.from({ length: size }, () => Array(size).fill(-1));
  const singleton = Math.floor(rng() * size);
  solution.forEach((queenCol, row) => { regions[row][queenCol] = row; });

  // Grow every other color once first, avoiding accidental extra singleton clues.
  for (const region of shuffled(Array.from({ length: size }, (_, index) => index), rng)) {
    if (region === singleton) continue;
    const options = shuffled(neighbors(region, solution[region], size), rng).filter(([row, col]) => regions[row][col] === -1);
    if (options.length) {
      const [row, col] = options[0];
      regions[row][col] = region;
    }
  }

  while (regions.some(row => row.includes(-1))) {
    const candidates = [];
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if (regions[row][col] !== -1) continue;
      const owners = [...new Set(neighbors(row, col, size)
        .map(([neighborRow, neighborCol]) => regions[neighborRow][neighborCol])
        .filter(region => region !== -1 && region !== singleton))];
      if (owners.length) candidates.push({ row, col, owners });
    }
    if (!candidates.length) throw new Error('unable to grow connected Queens regions');
    const target = candidates[Math.floor(rng() * candidates.length)];
    regions[target.row][target.col] = target.owners[Math.floor(rng() * target.owners.length)];
  }
  return regions;
}

function makeGeneratedRegions(size, rng) {
  const regions = Array.from({ length: size }, () => Array(size).fill(-1));
  const seeds = shuffled(Array.from({ length: size * size }, (_, index) => index), rng);
  const singleton = Math.floor(rng() * size);
  for (let region = 0; region < size; region++) {
    const seed = seeds[region];
    regions[Math.floor(seed / size)][seed % size] = region;
  }

  while (regions.some(row => row.includes(-1))) {
    const candidates = [];
    for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
      if (regions[row][col] !== -1) continue;
      const owners = [...new Set(neighbors(row, col, size)
        .map(([neighborRow, neighborCol]) => regions[neighborRow][neighborCol])
        .filter(region => region !== -1 && region !== singleton))];
      if (owners.length) candidates.push({ row, col, owners });
    }
    if (!candidates.length) throw new Error('unable to grow connected Queens regions');
    const target = candidates[Math.floor(rng() * candidates.length)];
    regions[target.row][target.col] = target.owners[Math.floor(rng() * target.owners.length)];
  }
  return regions;
}

function transformRegions(regions, transform) {
  const size = regions.length;
  const output = Array.from({ length: size }, () => Array(size));
  for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
    const flip = transform >= 4;
    const turns = transform % 4;
    let nextRow = flip ? row : size - 1 - row;
    let nextCol = flip ? size - 1 - col : col;
    for (let turn = 0; turn < turns; turn++) [nextRow, nextCol] = [nextCol, size - 1 - nextRow];
    output[nextRow][nextCol] = regions[row][col];
  }
  return output;
}

function neighbors(row, col, size) {
  return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
    .filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size);
}

function regionSeed(solution) {
  return solution.reduce((seed, col, row) => Math.imul(seed ^ (col + row * 31), 16777619) >>> 0, 2166136261);
}

function regionCounts(regions) {
  const counts = Array(regions.length).fill(0);
  regions.forEach(row => row.forEach(region => { if (Number.isInteger(region) && region >= 0 && region < counts.length) counts[region]++; }));
  return counts;
}

function hasExactlyOneSingleton(regions) {
  const counts = regionCounts(regions);
  return counts.length === regions.length && counts.filter(count => count === 1).length === 1 && counts.every(count => count >= 1);
}

export function regionsAreConnected(regions) {
  const size = regions.length;
  const counts = regionCounts(regions);
  if (!size || regions.some(row => row.length !== size) || counts.some(count => count === 0)) return false;
  return counts.every((count, region) => {
    const startRow = regions.findIndex(row => row.includes(region));
    const startCol = regions[startRow].indexOf(region);
    const visited = new Set([`${startRow}-${startCol}`]);
    const queue = [[startRow, startCol]];
    while (queue.length) {
      const [row, col] = queue.shift();
      for (const [nextRow, nextCol] of neighbors(row, col, size)) {
        const id = `${nextRow}-${nextCol}`;
        if (regions[nextRow][nextCol] === region && !visited.has(id)) { visited.add(id); queue.push([nextRow, nextCol]); }
      }
    }
    return visited.size === count;
  });
}

/** Count legal placements, stopping as soon as the given limit is reached. */
export function countQueensSolutions(regions, limit = 2) {
  const size = regions.length;
  if (!Number.isInteger(limit) || limit < 1 || !regionsAreConnected(regions)) return 0;
  const usedColumns = new Set(), usedRegions = new Set();
  let count = 0;
  function place(row, previousColumn) {
    if (count >= limit) return;
    if (row === size) { count++; return; }
    for (let col = 0; col < size; col++) {
      const region = regions[row][col];
      if (usedColumns.has(col) || usedRegions.has(region) || Math.abs(previousColumn - col) === 1) continue;
      usedColumns.add(col); usedRegions.add(region);
      place(row + 1, col);
      usedColumns.delete(col); usedRegions.delete(region);
      if (count >= limit) return;
    }
  }
  place(0, -2);
  return count;
}

function findQueensSolution(regions) {
  const size = regions.length;
  const solution = Array(size).fill(null);
  const usedColumns = new Set(), usedRegions = new Set();
  function place(row, previousColumn) {
    if (row === size) return true;
    for (let col = 0; col < size; col++) {
      const region = regions[row][col];
      if (usedColumns.has(col) || usedRegions.has(region) || Math.abs(previousColumn - col) === 1) continue;
      solution[row] = col; usedColumns.add(col); usedRegions.add(region);
      if (place(row + 1, col)) return true;
      solution[row] = null; usedColumns.delete(col); usedRegions.delete(region);
    }
    return false;
  }
  if (!place(0, -2)) throw new Error('unique Queens regions unexpectedly had no solution');
  return solution;
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
