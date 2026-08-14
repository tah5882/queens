CREATE TABLE IF NOT EXISTS progress (
  device_id TEXT NOT NULL,
  puzzle_day TEXT NOT NULL,
  queens TEXT NOT NULL DEFAULT '[null,null,null,null,null,null,null]',
  crosses TEXT NOT NULL DEFAULT '[]',
  elapsed INTEGER NOT NULL DEFAULT 0,
  solved INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, puzzle_day)
);

CREATE INDEX IF NOT EXISTS progress_day_solved
  ON progress (puzzle_day, solved);
