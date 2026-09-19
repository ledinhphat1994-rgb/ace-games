-- Digital Campus Game Platform Foundation G0 Closure Schema
-- Migration 0014:
-- 1. Anti-cheat & verified leaderboard trust separation on game_high_scores
-- 2. Database-enforced idempotent session identity on game_high_scores
-- 3. Persistent round sequencing on game_matches to prevent rematch PK collision

ALTER TABLE game_high_scores ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE game_high_scores ADD COLUMN session_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_game_high_scores_session
  ON game_high_scores(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_high_scores_verified
  ON game_high_scores(game_type, verified, score DESC);

ALTER TABLE game_matches ADD COLUMN round_seq INTEGER DEFAULT 1;
ALTER TABLE game_matches ADD COLUMN match_room_id TEXT;

CREATE INDEX IF NOT EXISTS idx_game_matches_room
  ON game_matches(match_room_id, round_seq);
