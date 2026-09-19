-- Test mirror of migrations/0011_engagement_layer_v1.sql

CREATE TABLE IF NOT EXISTS user_engagement_profile (
  account_id        INTEGER PRIMARY KEY REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_study_date   TEXT,
  total_xp          INTEGER NOT NULL DEFAULT 0,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS xp_ledger (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id        INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  amount            INTEGER NOT NULL CHECK(amount > 0),
  reason            TEXT NOT NULL,
  source_key        TEXT NOT NULL UNIQUE,
  study_date        TEXT NOT NULL,
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_account_date ON xp_ledger(account_id, study_date);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_study_date   ON xp_ledger(study_date);

CREATE TABLE IF NOT EXISTS achievement_unlocks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id        INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  achievement_key   TEXT NOT NULL,
  source_key        TEXT NOT NULL,
  unlocked_at       INTEGER NOT NULL,
  UNIQUE(account_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_account ON achievement_unlocks(account_id);

CREATE TABLE IF NOT EXISTS class_challenges (
  id                TEXT PRIMARY KEY,
  lop_id            INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  target_type       TEXT NOT NULL,
  target_value      INTEGER NOT NULL,
  current_value     INTEGER NOT NULL DEFAULT 0,
  reward_xp         INTEGER NOT NULL DEFAULT 30,
  start_date        TEXT NOT NULL,
  end_date          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_class_challenges_lop_status ON class_challenges(lop_id, status);

CREATE TABLE IF NOT EXISTS class_challenge_contributions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id      TEXT NOT NULL REFERENCES class_challenges(id) ON DELETE CASCADE,
  account_id        INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  source_key        TEXT NOT NULL UNIQUE,
  contribution_value INTEGER NOT NULL DEFAULT 1,
  created_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_challenge_contrib_challenge ON class_challenge_contributions(challenge_id);

CREATE TABLE IF NOT EXISTS study_invitations (
  id                TEXT PRIMARY KEY,
  sender_id         INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  recipient_id      INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  room_id           INTEGER NOT NULL,
  room_title        TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        INTEGER NOT NULL,
  expires_at        INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_study_invites_recipient_status ON study_invitations(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_study_invites_rate_limit       ON study_invitations(sender_id, recipient_id, created_at);
