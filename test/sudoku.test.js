import test from 'node:test';
import assert from 'node:assert/strict';
import { countSolutions, generateSudoku, sudokuComplete } from '../src/sudoku.js';

test('generated Sudoku solution has unique rows, columns and boxes', () => {
  const { puzzle, solution } = generateSudoku(42);
  for (const row of solution) assert.equal(new Set(row).size, 9);
  for (let col = 0; col < 9; col++) assert.equal(new Set(solution.map(row => row[col])).size, 9);
  for (let boxRow = 0; boxRow < 3; boxRow++) for (let boxCol = 0; boxCol < 3; boxCol++) {
    const values = solution.slice(boxRow * 3, boxRow * 3 + 3).flatMap(row => row.slice(boxCol * 3, boxCol * 3 + 3));
    assert.equal(new Set(values).size, 9);
  }
  assert.equal(sudokuComplete(solution, solution), true);
  assert.equal(countSolutions(puzzle), 1);
});
