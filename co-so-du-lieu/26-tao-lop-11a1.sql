-- Tạo lớp thứ 2: Lớp 11A1 — cùng trường/năm học với lớp 10A7. Đây là thao tác VẬN HÀNH (thêm
-- một lớp mới), không phải thay đổi cấu trúc — chạy một lần khi tạo lớp, không lặp lại.
--
-- Mã đăng nhập giáo viên tạm thời: GV11A1-G3WNFYKN — giáo viên có thể tự đổi ngay trong khu
-- quản lý (mục "Mã đăng nhập") bất cứ lúc nào, không cần chạy lại SQL.
--
-- Trần lưu trữ: chia đôi 9,5 GB an toàn cho 2 lớp hiện có (lớp 10A7 mới dùng ~4 MB nên hạ
-- xuống 4,75 GB vẫn rất thoải mái).
INSERT INTO lop (id, ten, nam_hoc, truong, gioi_thieu, gioi_han_byte)
  SELECT 2, 'Lớp 11A1', '2026 – 2027', 'Trung tâm GDNN-GDTX Khu vực 1 - Phân khu 2 xã Định Quán , thành phố Đồng Nai', '', 4750000000
  WHERE NOT EXISTS (SELECT 1 FROM lop WHERE id = 2);

UPDATE lop SET gioi_han_byte = 4750000000 WHERE id = 1;

INSERT INTO ma_dang_nhap (lop_id, vai_tro, ma) VALUES (2, 'teacher', 'GV11A1-G3WNFYKN');

-- 2 học sinh giả để giáo viên thử nghiệm giao diện trước khi nhập/danh sách thật.
INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, dang_hoc) VALUES (38, 2, 1, 'Lê Văn A', 1);
INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, dang_hoc) VALUES (39, 2, 2, 'Lê Văn B', 1);
