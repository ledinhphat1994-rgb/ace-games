-- Migration 0010: Learning Session Summary History
-- Lưu trữ lịch sử tổng kết các buổi học nhóm có cấu trúc trong phòng học

CREATE TABLE IF NOT EXISTS hoc_session_summary (
  id TEXT PRIMARY KEY,
  phong_id INTEGER NOT NULL REFERENCES phong(id),
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  summary_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hoc_session_phong
  ON hoc_session_summary(phong_id, started_at DESC);
