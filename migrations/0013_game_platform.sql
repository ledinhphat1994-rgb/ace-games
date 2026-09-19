-- Digital Campus Game Platform Foundation Schema
-- Migration 0013: game_sessions (solo run tracking & anti-cheat audit) and game_matches (multiplayer match settlement)

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  account_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id),
  seed INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'rejected')),
  verification_hash TEXT,
  client_metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_account ON game_sessions(account_id, game_type, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status, started_at DESC);

CREATE TABLE IF NOT EXISTS game_matches (
  id TEXT PRIMARY KEY,
  game_type TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT '1v1',
  host_account_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id),
  guest_account_id INTEGER REFERENCES tai_khoan_campus(id),
  winner_account_id INTEGER REFERENCES tai_khoan_campus(id),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'ended', 'cancelled')),
  score_host INTEGER DEFAULT 0,
  score_guest INTEGER DEFAULT 0,
  started_at INTEGER,
  ended_at INTEGER,
  end_reason TEXT CHECK (end_reason IS NULL OR end_reason IN ('normal', 'surrender', 'timeout', 'disconnect')),
  idempotency_key TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_matches_players ON game_matches(host_account_id, guest_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_matches_type ON game_matches(game_type, status, created_at DESC);
