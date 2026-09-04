-- Nhạc nền trang chủ — chỉ MỘT bài tại một thời điểm (không phải thư viện nhiều bài).
-- Nội dung file mp3 lưu trong Cloudflare KV (dùng chung kho ANH đã có), chỉ mô tả nằm ở đây.
CREATE TABLE IF NOT EXISTS nhac_nen (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  ten_bai  TEXT NOT NULL DEFAULT '',
  khoa     TEXT NOT NULL,
  kieu     TEXT NOT NULL DEFAULT 'audio/mpeg',
  co_byte  INTEGER NOT NULL DEFAULT 0,
  tao_luc  TEXT NOT NULL DEFAULT (datetime('now'))
);
