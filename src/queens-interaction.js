function cellId(row, col) {
  return `${row}-${col}`;
}

function cloneState({ queens, crosses }) {
  return { queens: [...queens], crosses: new Set(crosses) };
}

/** Advance a cell: empty → cross → queen → empty. */
export function cycleQueensCell(state, row, col) {
  const next = cloneState(state);
  const id = cellId(row, col);
  if (next.queens[row] === col) {
    next.queens[row] = null;
  } else if (next.crosses.has(id)) {
    next.crosses.delete(id);
    next.queens[row] = col;
  } else {
    next.crosses.add(id);
  }
  return next;
}

/** Mark a cell as ruled out; repeated calls intentionally have no extra effect. */
export function placeQueensCross(state, row, col) {
  const next = cloneState(state);
  const id = cellId(row, col);
  next.crosses.add(id);
  if (next.queens[row] === col) next.queens[row] = null;
  return next;
}

export function queensCellId(row, col) {
  return cellId(row, col);
}
