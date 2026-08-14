import test from 'node:test';
import assert from 'node:assert/strict';
import { solutions, makeRegions, conflicts, isSolved } from '../src/puzzles.js';

test('every bundled solution satisfies the rules', () => {
  for (const solution of solutions) assert.equal(isSolved(solution, makeRegions(solution)), true);
});

test('duplicate columns and adjacent diagonals conflict', () => {
  const regions = makeRegions(solutions[0]);
  assert.equal(conflicts([1, 1, null, null, null, null, null], 0, 1, regions), true);
  assert.equal(conflicts([1, 2, null, null, null, null, null], 0, 1, regions), true);
});
