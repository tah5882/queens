import test from 'node:test';
import assert from 'node:assert/strict';
import { countQueensSolutions, generateQueens, makeRegions, conflicts, isSolved, regionsAreConnected } from '../src/puzzles.js';

test('generates connected, uniquely solvable Queens boards in every selectable size', () => {
  for (let size = 5; size <= 9; size++) for (const seed of [7, 42, 1234 + size, 987654]) {
    const game = generateQueens(size, seed);
    assert.equal(game.solution.length, size);
    assert.equal(isSolved(game.solution, game.regions), true);
    assert.equal(countQueensSolutions(game.regions), 1);
    assert.equal(regionsAreConnected(game.regions), true);
    const regionSizes = Array(size).fill(0);
    game.regions.flat().forEach(region => regionSizes[region]++);
    assert.equal(regionSizes.filter(count => count === 1).length, 1);
    assert.equal(game.regions.flat().length, size * size);
  }
});

test('Queens generation is deterministic for a fixed seed', () => {
  for (let size = 5; size <= 9; size++) assert.deepEqual(generateQueens(size, 13579), generateQueens(size, 13579));
});

test('an unlucky seed still returns a checked 9x9 puzzle through the bounded fallback', () => {
  const game = generateQueens(9, 681043);
  assert.equal(countQueensSolutions(game.regions), 1);
  assert.equal(regionsAreConnected(game.regions), true);
});

test('duplicate columns and adjacent diagonals conflict', () => {
  const regions = makeRegions([1, 3, 0, 2, 4]);
  assert.equal(conflicts([1, 1, null, null, null, null, null], 0, 1, regions), true);
  assert.equal(conflicts([1, 2, null, null, null, null, null], 0, 1, regions), true);
});
