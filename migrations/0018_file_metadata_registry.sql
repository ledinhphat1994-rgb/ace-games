-- Digital Campus v2: Milestone F1 — File Access Authorization Hardening
-- Migration 0018:
-- Tạo bảng file_metadata để quản lý quyền sở hữu và phạm vi truy cập tệp tải lên (R2 Object Registry)

CREATE TABLE IF NOT EXISTS file_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'general',
  visibility TEXT NOT NULL DEFAULT 'owner' CHECK(visibility IN ('owner', 'campus', 'public')),
  uploaded_by_account_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id),
  created_at INTEGER NOT NULL,
  deleted_at INTEGER DEFAULT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_file_metadata_key ON file_metadata(object_key);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploader ON file_metadata(uploaded_by_account_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_file_metadata_purpose_vis ON file_metadata(purpose, visibility);

-- Luỹ kế & idempotent backfill: Áp dụng cho bất kỳ avatar nào đã lưu trong tai_khoan_campus trỏ tới /api/files/
INSERT OR IGNORE INTO file_metadata (
  object_key,
  original_name,
  mime_type,
  size_bytes,
  purpose,
  visibility,
  uploaded_by_account_id,
  created_at
)
SELECT
  substr(avatar, instr(avatar, '/api/files/') + 11) AS object_key,
  'legacy_avatar' AS original_name,
  'image/jpeg' AS mime_type,
  0 AS size_bytes,
  'avatar' AS purpose,
  'campus' AS visibility,
  id AS uploaded_by_account_id,
  strftime('%s', 'now') * 1000 AS created_at
FROM tai_khoan_campus
WHERE avatar IS NOT NULL
  AND avatar LIKE '%/api/files/%'
  AND length(substr(avatar, instr(avatar, '/api/files/') + 11)) > 0;
