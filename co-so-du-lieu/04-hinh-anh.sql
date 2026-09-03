-- Thông tin mô tả của ảnh. Nội dung ảnh nằm trong Cloudflare KV, không nằm ở đây.
CREATE TABLE IF NOT EXISTS hinh_anh (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  khoa      TEXT NOT NULL UNIQUE,      -- khoá trong KV
  chu_thich TEXT DEFAULT '',
  ngay      TEXT NOT NULL,
  kieu      TEXT NOT NULL DEFAULT 'image/jpeg',
  co_byte   INTEGER NOT NULL DEFAULT 0,
  tao_luc   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hinh_anh ON hinh_anh(ngay DESC, id DESC);
