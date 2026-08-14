import test from 'node:test';
import assert from 'node:assert/strict';
import { cycleQueensCell, placeQueensCross } from '../src/queens-interaction.js';

test('Queens tap cycle is empty to cross to queen to empty', () => {
  let state = { queens: [null, null, null], crosses: new Set() };
  state = cycleQueensCell(state, 1, 2);
  assert.deepEqual([...state.crosses], ['1-2']);
  state = cycleQueensCell(state, 1, 2);
  assert.equal(state.queens[1], 2);
  assert.equal(state.crosses.has('1-2'), false);
  state = cycleQueensCell(state, 1, 2);
  assert.equal(state.queens[1], null);
  assert.equal(state.crosses.size, 0);
});

test('promoting a cross replaces the queen already in that row', () => {
  const next = cycleQueensCell({ queens: [null, 0, null], crosses: new Set(['1-2']) }, 1, 2);
  assert.deepEqual(next.queens, [null, 2, null]);
  assert.equal(next.crosses.has('1-2'), false);
});

test('drag cross placement is idempotent and clears a queen on that cell', () => {
  const once = placeQueensCross({ queens: [1, null], crosses: new Set(['0-0']) }, 0, 1);
  const twice = placeQueensCross(once, 0, 1);
  assert.equal(twice.queens[0], null);
  assert.deepEqual([...twice.crosses].sort(), ['0-0', '0-1']);
});
