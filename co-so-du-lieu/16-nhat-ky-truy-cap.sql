-- Ghi chi tiết TỪNG lượt tải trang lớp: ai (mã cá nhân, nếu máy đó từng tra cứu), lúc nào.
-- Dùng để trả lời "ai truy cập, lúc nào, bao nhiêu lần" ở tab Tương tác — luot_truy_cap
-- (bảng cũ) chỉ đếm tổng theo ngày, không biết ai. Bảng này thay thế vai trò đó, đầy đủ hơn.
CREATE TABLE IF NOT EXISTS nhat_ky_truy_cap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ma TEXT,                          -- mã cá nhân, để trống nếu máy đó chưa từng tra cứu (ẩn danh)
  hoc_sinh_id INTEGER,              -- suy ra từ mã, để join tên nhanh mà không phải tra lại
  thoi_diem TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nktc_thoi_diem ON nhat_ky_truy_cap (thoi_diem);
CREATE INDEX IF NOT EXISTS idx_nktc_hoc_sinh ON nhat_ky_truy_cap (hoc_sinh_id);
