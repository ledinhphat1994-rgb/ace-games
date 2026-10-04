-- 0025_close_friends.sql
-- Digital Campus v2: Quan hệ Bạn thân (Close Friends)

CREATE TABLE IF NOT EXISTS close_friends (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_low_id  INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  account_high_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'confirmed', -- 'pending' hoặc 'confirmed'
  requested_by    INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  created_at      INTEGER NOT NULL,
  CHECK (account_low_id < account_high_id),
  UNIQUE(account_low_id, account_high_id)
);

CREATE INDEX IF NOT EXISTS idx_close_friends_low  ON close_friends(account_low_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_high ON close_friends(account_high_id);
