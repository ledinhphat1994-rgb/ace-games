-- Test mirror of migrations/0007_moderation_safety.sql
-- Moderation & Safety v1: Platform Governance, Reports, and Audit Trail

-- 1. Bảng báo cáo vi phạm người dùng và nội dung (Reports)
CREATE TABLE IF NOT EXISTS reports (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id     INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  reported_id     INTEGER REFERENCES tai_khoan_campus(id) ON DELETE SET NULL,
  room_id         INTEGER REFERENCES phong(id) ON DELETE SET NULL,
  category        TEXT NOT NULL,
  reason          TEXT NOT NULL,
  content_snippet TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  resolved_by     INTEGER REFERENCES tai_khoan_campus(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at      INTEGER NOT NULL,
  resolved_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_room     ON reports(room_id);
CREATE INDEX IF NOT EXISTS idx_reports_created  ON reports(created_at);

-- 2. Bảng nhật ký kiểm duyệt và hành động nhạy cảm (Audit Logs)
CREATE TABLE IF NOT EXISTS moderation_audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  target_id   INTEGER REFERENCES tai_khoan_campus(id) ON DELETE SET NULL,
  room_id     INTEGER REFERENCES phong(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  reason      TEXT,
  metadata    TEXT,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_actor   ON moderation_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON moderation_audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_room    ON moderation_audit_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON moderation_audit_logs(created_at);
