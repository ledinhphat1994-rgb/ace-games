-- Test mirror of migrations/0006_campus_social_graph.sql
-- Canonical Social Graph (Friendships, Friend Requests, Blocks)

CREATE TABLE IF NOT EXISTS friendships (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  account_low_id  INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  account_high_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  created_at      INTEGER NOT NULL,
  CHECK (account_low_id < account_high_id),
  UNIQUE(account_low_id, account_high_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_low  ON friendships(account_low_id);
CREATE INDEX IF NOT EXISTS idx_friendships_high ON friendships(account_high_id);

CREATE TABLE IF NOT EXISTS friend_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id   INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  CHECK (sender_id != receiver_id),
  UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_req_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_req_sender   ON friend_requests(sender_id);

CREATE TABLE IF NOT EXISTS blocks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
