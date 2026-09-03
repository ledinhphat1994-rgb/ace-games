-- Tài khoản đặc biệt: giáo viên cấp mã riêng cho một người (lớp trưởng, thủ quỹ...)
-- chỉ được làm đúng những việc trong cột "quyen" (danh sách phân tách bằng dấu phẩy).
CREATE TABLE IF NOT EXISTS tai_khoan_phu (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ten         TEXT NOT NULL,
  vai_tro     TEXT NOT NULL DEFAULT '',      -- Thủ quỹ, Lớp trưởng... (chỉ để hiển thị)
  ma          TEXT NOT NULL UNIQUE,
  quyen       TEXT NOT NULL DEFAULT '',      -- "quy,thong-bao" — các mục được thao tác
  hoc_sinh_id INTEGER REFERENCES hoc_sinh(id),
  dang_hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);
