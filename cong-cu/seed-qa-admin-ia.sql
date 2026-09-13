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

-- Hồ sơ chờ duyệt THỨ 2 (Khu Quản Trị v2) — riêng cho test duyệt/từ chối qua UI drawer "Người
-- dùng" (99825 ở trên đã bị TIÊU THỤ bởi test API duyệt ở nhóm AUDIT LOG phía trên rồi).
DELETE FROM tai_khoan_campus WHERE id = 99826;
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES (99826, 'gv_cho_duyet_qa2', 'Cô Chờ Duyệt QA2', 'hash123', 'salt123', 100000, 'student', 1, 1, null, 0, 'Đang chờ duyệt quyền Giáo viên');

-- Hồ sơ chờ duyệt THỨ 3 — riêng cho test bug #2 (GVCN THƯỜNG, không phải School Admin, phải THẤY
-- và DUYỆT được hồ sơ này qua API dù lop_id NULL không khớp phạm vi lớp thông thường của họ).
DELETE FROM tai_khoan_campus WHERE id = 99827;
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES (99827, 'gv_cho_duyet_qa3', 'Thầy Chờ Duyệt QA3', 'hash123', 'salt123', 100000, 'student', 1, 1, null, 0, 'Đang chờ duyệt quyền Giáo viên');

-- Học sinh cố định (id dành riêng 99901/99902, không đụng sổ lớp thật) để test
-- /api/gv/rieng/hoc-sinh đọc/ghi đúng theo lopId truyền vào (Phase 3 — Lớp học).
DELETE FROM diem_danh WHERE hoc_sinh_id IN (99901, 99902);
DELETE FROM theo_doi WHERE hoc_sinh_id IN (99901, 99902);
DELETE FROM hoc_sinh WHERE id IN (99901, 99902);
INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, dang_hoc) VALUES
  (99901, 1, 900, 'QA Học Sinh Lớp 1', 1),
  (99902, 2, 900, 'QA Học Sinh Lớp 2', 1);

-- Phòng Campus cố định (id 99911-99913) để test /api/gv/phong-quan-tri (Phase 3 — Campus):
-- 1 phòng riêng lớp 1, 1 phòng riêng lớp 2, 1 phòng toàn trường — đủ để test ranh giới phạm vi.
DELETE FROM phong_thanh_vien WHERE phong_id IN (99911, 99912, 99913);
DELETE FROM phong WHERE id IN (99911, 99912, 99913);
INSERT INTO phong (id, loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, trang_thai, access_mode, suc_chua) VALUES
  (99911, 'chat', 'QA Phòng Lớp 1', 'lop', 1, 'gv:1:qa', 'QA Chủ Phòng L1', 'mo', 'public', 20),
  (99912, 'video', 'QA Phòng Lớp 2', 'lop', 2, 'gv:2:qa', 'QA Chủ Phòng L2', 'mo', 'public', 20),
  (99913, 'nhac', 'QA Phòng Toàn Trường', 'truong', NULL, 'hs:1:qa', 'QA Học Sinh Toàn Trường', 'mo', 'public', 20);
INSERT INTO phong_thanh_vien (phong_id, khoa, ten, vai_tro, lop_id, hoat_dong_luc) VALUES
  (99911, 'gv:1:qa', 'QA Chủ Phòng L1', 'giao_vien', 1, datetime('now'));
