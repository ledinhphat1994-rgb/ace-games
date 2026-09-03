-- Thời khoá biểu có PHIÊN BẢN: mỗi lần đổi lịch thật sự (không phải sửa lỗi gõ nhầm)
-- tạo một phiên bản mới có ngày áp dụng riêng, phiên bản cũ vẫn giữ nguyên để tra cứu lại.
-- Có cả buổi sáng và buổi chiều trong cùng một phiên bản.

CREATE TABLE IF NOT EXISTS tkb_phien_ban (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ten           TEXT NOT NULL,
  ngay_bat_dau  TEXT NOT NULL,        -- áp dụng từ ngày này
  ngay_ket_thuc TEXT,                 -- NULL = đang áp dụng (chưa bị phiên bản mới hơn thay thế)
  ghi_chu       TEXT DEFAULT '',
  tao_luc       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tkb_pb_ngay ON tkb_phien_ban(ngay_bat_dau DESC);

CREATE TABLE IF NOT EXISTS tkb_o (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phien_ban_id  INTEGER NOT NULL REFERENCES tkb_phien_ban(id),
  buoi          TEXT NOT NULL DEFAULT 'sang',   -- 'sang' | 'chieu'
  thu           INTEGER NOT NULL,               -- 2..7
  tiet          INTEGER NOT NULL,
  mon           TEXT NOT NULL,
  phong         TEXT DEFAULT '',
  UNIQUE(phien_ban_id, buoi, thu, tiet)
);
CREATE INDEX IF NOT EXISTS idx_tkb_o_pb ON tkb_o(phien_ban_id);

-- Chuyển dữ liệu thời khoá biểu cũ (bảng phẳng, chỉ có buổi sáng) thành phiên bản đầu tiên.
INSERT INTO tkb_phien_ban (ten, ngay_bat_dau, ghi_chu)
  SELECT 'Thời khoá biểu ban đầu', '2026-09-08', 'Chuyển từ hệ thống cũ (chỉ có buổi sáng)'
  WHERE NOT EXISTS (SELECT 1 FROM tkb_phien_ban);

INSERT INTO tkb_o (phien_ban_id, buoi, thu, tiet, mon)
  SELECT (SELECT id FROM tkb_phien_ban ORDER BY id ASC LIMIT 1), 'sang', thu, tiet, mon
  FROM thoi_khoa_bieu
  WHERE NOT EXISTS (SELECT 1 FROM tkb_o);

DROP TABLE IF EXISTS thoi_khoa_bieu;
