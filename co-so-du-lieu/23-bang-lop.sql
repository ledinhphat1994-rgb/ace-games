-- Bảng "lop" — nền tảng cho việc MỘT web quản lý được NHIỀU lớp chủ nhiệm, mỗi lớp dữ liệu
-- tách biệt hoàn toàn qua cột lop_id sẽ thêm ở mọi bảng khác (xem migration 24, 25).
-- Lớp 10A7 hiện có được ghi nhận thành lop_id = 1 — không ai bị ảnh hưởng, mọi dữ liệu hiện
-- tại tiếp tục thuộc đúng lớp 10A7 như trước.
CREATE TABLE IF NOT EXISTS lop (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ten            TEXT NOT NULL,
  nam_hoc        TEXT NOT NULL DEFAULT '',
  truong         TEXT NOT NULL DEFAULT '',
  gioi_thieu     TEXT NOT NULL DEFAULT '',
  gioi_han_byte  INTEGER NOT NULL DEFAULT 9500000000,  -- trần lưu trữ RIÊNG của lớp này
  dang_hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc        TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO lop (id, ten, nam_hoc, truong, gioi_thieu, gioi_han_byte)
  SELECT 1, 'Lớp 10A7', '2026 – 2027', 'Trung tâm GDNN – GDTX xã Định Quán, tỉnh Đồng Nai', '', 9500000000
  WHERE NOT EXISTS (SELECT 1 FROM lop WHERE id = 1);
