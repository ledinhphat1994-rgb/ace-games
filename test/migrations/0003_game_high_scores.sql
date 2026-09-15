CREATE TABLE IF NOT EXISTS game_high_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_type TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_high_scores ON game_high_scores(game_type, score DESC);
