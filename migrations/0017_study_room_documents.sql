-- Digital Campus v2: Milestone R1 — Study Room Documents
-- Migration 0017:
-- Tạo bảng phong_tai_lieu để quản lý siêu dữ liệu tài liệu phòng học (PDF, Slide, Ảnh bài học)

CREATE TABLE IF NOT EXISTS phong_tai_lieu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL REFERENCES phong(id),
  object_key TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1,
  file_type TEXT NOT NULL CHECK(file_type IN ('pdf', 'pptx', 'image')),
  uploaded_by_account_id INTEGER NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_phong_tai_lieu_room ON phong_tai_lieu(room_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_phong_tai_lieu_key ON phong_tai_lieu(object_key);
