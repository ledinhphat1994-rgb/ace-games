-- Fixtures bổ sung cho QA Admin IA v1 — chạy SAU seed-qa-phase4d1.sql (dùng lại các tài khoản đó).
-- Mô phỏng gv_class1_a (99821) kiêm nhiệm THÊM Lớp 2 (11A1), ngoài Lớp 1 (10A7) đã có sẵn qua
-- tai_khoan_campus.lop_id — đúng kịch bản "1 GVCN quản nhiều lớp" đã chốt cho Admin IA v1.
DELETE FROM giao_vien_lop WHERE giao_vien_id = 99821;
INSERT INTO giao_vien_lop (giao_vien_id, lop_id, la_chinh) VALUES
  (99821, 1, 1),
  (99821, 2, 0);

-- Dọn nhật ký quản trị cũ của các tài khoản test để đếm được chính xác trong lần chạy này.
DELETE FROM nhat_ky_quan_tri WHERE tac_nhan_id IN (99820, 99821, 99823);

-- Một hồ sơ giáo viên đang chờ duyệt, để test luồng duyệt → ghi nhật ký quản trị.
DELETE FROM tai_khoan_campus WHERE id = 99825;
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES (99825, 'gv_cho_duyet_qa', 'Thầy Chờ Duyệt QA', 'hash123', 'salt123', 100000, 'student', 1, 1, null, 0, 'Đang chờ duyệt quyền Giáo viên');
