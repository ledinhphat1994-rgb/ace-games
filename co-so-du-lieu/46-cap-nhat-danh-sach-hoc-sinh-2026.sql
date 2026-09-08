-- Cập nhật danh sách học sinh lớp 10A7 (lop_id=1) và 11A1 (lop_id=2) theo file Excel
-- "hoàn chỉnh" giáo viên chủ nhiệm gửi (sửa lỗi chính tả họ tên/lớp nghề đã nhập sai trước đó,
-- và bổ sung học sinh mới nhập học/chuyển đến).

-- ===== Lớp 10A7 (lop_id = 1) =====
UPDATE hoc_sinh SET ho_ten = 'Lộc Hà'            WHERE lop_id = 1 AND so_thu_tu = 8;
UPDATE hoc_sinh SET ho_ten = 'Diệp Sinh Quân'    WHERE lop_id = 1 AND so_thu_tu = 22;
UPDATE hoc_sinh SET ho_ten = 'Phùng Thanh Quang' WHERE lop_id = 1 AND so_thu_tu = 23;
UPDATE hoc_sinh SET ho_ten = 'Tăng Thanh Tuyền'  WHERE lop_id = 1 AND so_thu_tu = 30;

UPDATE hoc_sinh SET lop_nghe = 'Điện CN&ĐD'
 WHERE lop_id = 1 AND lop_nghe = 'Điện CN&ĐĐ';

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, dang_hoc)
VALUES
  ((SELECT COALESCE(MAX(id), 0) + 1 FROM hoc_sinh), 1, 38, 'Chu Bảo Ngân', 'Nữ', 1);
INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, dang_hoc)
VALUES
  ((SELECT COALESCE(MAX(id), 0) + 1 FROM hoc_sinh), 1, 39, 'Phan Nhật Trường', 'Nam', 1);

-- ===== Lớp 11A1 (lop_id = 2) =====
UPDATE hoc_sinh SET ho_ten = 'Nguyễn Thị Bích Ngàn' WHERE lop_id = 2 AND ho_ten = 'Nguyễn Thị Bích Ngân';

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, dang_hoc)
VALUES
  ((SELECT COALESCE(MAX(id), 0) + 1 FROM hoc_sinh), 2, 31, 'Trần Bình Quý', 'Nam', 1);
