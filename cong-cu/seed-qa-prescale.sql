-- ==============================================================================
-- Fixtures for Pre-Scale Security & Data-Correctness Gate
-- ==============================================================================

-- 1. Xóa bỏ hoàn toàn bất kỳ tài khoản placeholder LOCAL_AUTH cũ nếu có
DELETE FROM tai_khoan_campus WHERE mat_khau_hash = 'LOCAL_AUTH';

-- 2. Khởi tạo danh sách tài khoản kiểm thử chính quy
INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, avatar, tieu_de_ho_so)
VALUES (99801, 'gv_prescale_real', 'Thầy Phát Test', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, 'https://example.com/avatar.png', 'Giáo viên Chủ nhiệm'),
       (92136, 'gv_chu_nhiem', 'Thầy Lê Đình Phát', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, '/assets/hinh-anh/anh-lop-default.svg', 'Giáo viên chủ nhiệm');

INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, avatar, tieu_de_ho_so)
VALUES (99802, 'gv_pending_test', 'Thầy Chờ Duyệt', 'hash123', 'salt123', 100000, 'teacher', 1, 1, 1, null, 'Giáo viên bộ môn');

INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, avatar, tieu_de_ho_so)
VALUES (99803, 'gv_revoked_test', 'Thầy Bị Khóa', 'hash123', 'salt123', 100000, 'teacher', 0, 0, 1, null, 'Cựu giáo viên');

INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, avatar, tieu_de_ho_so)
VALUES (99804, 'hs_linked_prescale', 'Nguyễn Thị B', 'hash123', 'salt123', 100000, 'student', 0, 1, 2, 1, null, 'Học sinh lớp 10A7');

-- 3. Khởi tạo phòng Xem Chung & Focus phục vụ kiểm thử tự động tổng hợp (Watch & Focus)
INSERT OR REPLACE INTO phong (id, ten, loai, pham_vi, trang_thai, chu_phong_khoa, chu_phong_ten)
VALUES (9989, 'Rạp Phim Tài Liệu Khám Phá', 'video', 'truong', 'mo', 'gv:1', 'Thầy Phát'),
       (9990, 'Không Gian Tự Học Pomodoro Lofi', 'nhac', 'truong', 'mo', 'gv:1', 'Thầy Phát');

DELETE FROM phong_thanh_vien WHERE phong_id IN (9989, 9990);
INSERT INTO phong_thanh_vien (phong_id, khoa, ten, hoat_dong_luc)
VALUES (9989, 'user-watch-k1', 'Học sinh 1', datetime('now')),
       (9989, 'user-watch-k2', 'Học sinh 2', datetime('now')),
       (9989, 'user-watch-k3', 'Học sinh 3', datetime('now')),
       (9990, 'user-focus-k1', 'Học sinh A', datetime('now')),
       (9990, 'user-focus-k2', 'Học sinh B', datetime('now'));

-- 4. Khởi tạo Bàn Cờ Caro phục vụ kiểm thử Game Shell
INSERT OR REPLACE INTO game_phong (id, lop_id, loai_game, ten_ban, pham_vi, chu_phong_id, chu_phong_ten, trang_thai, access_mode)
VALUES (9988, 1, 'co_caro', 'Bàn Cờ Thử Nghiệm QA Shell', 'truong', 1, 'Nguyễn Văn An', 'cho_nguoi', 'public');
