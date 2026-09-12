-- ==============================================================================
-- Fixtures for Phase 4D: Campus Access Model + Social Tabs + Final UI Composition
-- ==============================================================================

-- 1. Xóa bỏ hoàn toàn bất kỳ tài khoản placeholder cũ
DELETE FROM tai_khoan_campus WHERE id IN (99801, 99802, 99803, 99804, 99810, 99811) OR mat_khau_hash = 'LOCAL_AUTH';

-- 2. Giáo viên xác thực & Giáo viên pending & Giáo viên bị khóa
INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, avatar, tieu_de_ho_so)
VALUES (99801, 'gv_prescale_real', 'Thầy Phát Test', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, 'https://example.com/avatar.png', 'Giáo viên Chủ nhiệm'),
       (92136, 'gv_chu_nhiem', 'Thầy Lê Đình Phát', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, '/assets/hinh-anh/anh-lop-default.svg', 'Giáo viên chủ nhiệm'),
       (99802, 'gv_pending_test', 'Thầy Chờ Duyệt', 'hash123', 'salt123', 100000, 'teacher', 1, 1, 1, null, 'Giáo viên bộ môn'),
       (99803, 'gv_revoked_test', 'Thầy Bị Khóa', 'hash123', 'salt123', 100000, 'teacher', 0, 0, 1, null, 'Cựu giáo viên');

-- 3. Học sinh ĐÃ LIÊN KẾT lớp 10A7 (chính quy)
INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, avatar, tieu_de_ho_so)
VALUES (99804, 'hs_linked_prescale', 'Nguyễn Thị B', 'hash123', 'salt123', 100000, 'student', 0, 1, 2, 1, null, 'Học sinh lớp 10A7');

-- 4. Học sinh / Người dùng Campus CHƯA LIÊN KẾT LỚP (Tài khoản mở tự do)
INSERT OR REPLACE INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, avatar, tieu_de_ho_so)
VALUES (99810, 'hs_campus_unlinked', 'Bạn Campus Tự Do', 'hash123', 'salt123', 100000, 'student', 0, 1, null, null, null, 'Thành viên tự do'),
       (99811, 'hs_campus_unlinked_b', 'Bạn Campus B', 'hash123', 'salt123', 100000, 'student', 0, 1, null, null, null, 'Thành viên tự do B');

-- 5. Phòng Xem Chung & Focus phục vụ kiểm thử
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

-- 6. Bàn cờ Caro phục vụ kiểm thử Game Shell & Lobby
INSERT OR REPLACE INTO game_phong (id, lop_id, loai_game, ten_ban, pham_vi, chu_phong_id, chu_phong_ten, trang_thai, access_mode)
VALUES (9988, 1, 'co_caro', 'Bàn Cờ Thử Nghiệm QA Phase 4D', 'truong', 1, 'Nguyễn Văn An', 'cho_nguoi', 'public');

-- 7. Reset bạn bè và tin nhắn kiểm thử giữa 99810 và 99811
DELETE FROM campus_friendship WHERE (requester_account_id IN (99810, 99811) OR addressee_account_id IN (99810, 99811));
DELETE FROM campus_private_message WHERE (sender_account_id IN (99810, 99811) OR receiver_account_id IN (99810, 99811));
