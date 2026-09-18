-- Migration 0009: D1-backed Password Reset Tokens and Atomic State Machine
-- Digital Campus v2: Server-Authoritative Identity Recovery and Security Closure

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id        TEXT NOT NULL UNIQUE,
  account_id      INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  username        TEXT NOT NULL,
  code_digest     TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 5,
  expires_at      INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'revoked', 'locked')),
  consumed_at     INTEGER,
  created_at      INTEGER NOT NULL,
  created_by      INTEGER NOT NULL REFERENCES tai_khoan_campus(id)
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_acc_status ON password_reset_tokens(account_id, status);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_token_id   ON password_reset_tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_username   ON password_reset_tokens(username, status);
