-- Digital Campus v2: Milestone N1 — Notifications & Inbox MVP
-- Migration 0020: Server-Authoritative Notifications Registry

CREATE TABLE IF NOT EXISTS notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id    INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK(type IN (
                    'friend_request',
                    'friend_accept',
                    'study_invite',
                    'study_invite_accepted',
                    'achievement_unlocked',
                    'moderation_notice',
                    'system_announcement'
                  )),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data_json       TEXT,
  read_at         INTEGER DEFAULT NULL,
  idempotency_key TEXT UNIQUE,
  created_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_idempotency ON notifications(idempotency_key);
