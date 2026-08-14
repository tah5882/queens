import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQueens, makeRegions, conflicts, isSolved } from '../src/puzzles.js';

test('generates valid Queens boards in every selectable size', () => {
  for (let size = 5; size <= 9; size++) {
    const game = generateQueens(size, 1234 + size);
    assert.equal(game.solution.length, size);
    assert.equal(isSolved(game.solution, game.regions), true);
  }
});

test('duplicate columns and adjacent diagonals conflict', () => {
  const regions = makeRegions([1, 3, 0, 2, 4]);
  assert.equal(conflicts([1, 1, null, null, null, null, null], 0, 1, regions), true);
  assert.equal(conflicts([1, 2, null, null, null, null, null], 0, 1, regions), true);
});
