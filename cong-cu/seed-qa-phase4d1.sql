-- ==============================================================================
-- Fixtures for Phase 4D.1: Game Identity & Class Authorization Consistency Gate
-- ==============================================================================

-- 1. Đảm bảo tồn tại ít nhất 2 lớp đang hoạt động (Lớp 1 và Lớp 2)
INSERT OR IGNORE INTO lop (id, ten, nam_hoc, dang_hoat_dong)
VALUES (1, 'Lớp 10A7', '2026-2027', 1),
       (2, 'Lớp 11A1', '2026-2027', 1);

-- 2. Xóa bỏ fixtures cũ
DELETE FROM tai_khoan_campus
WHERE id IN (
  99801, 99804, 99810, 99811,
  99820, 99821, 99822, 99823, 99824,
  99830, 99831, 99832, 99833, 99834, 99835, 99836, 99837, 99838, 99839
);

-- 3. School Admin & GVCN các lớp
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES
  -- 3.1 Quản trị viên trường học (School Admin)
  (99820, 'admin_truong_phase4d1', 'Ban Giám Hiệu Admin', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, 1, 'Quản trị viên toàn trường'),
  -- 3.2 Giáo viên A phụ trách Lớp 1 (10A7)
  (99821, 'gv_class1_a', 'Thầy Giáo Viên A (Lớp 1)', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, 0, 'GVCN Lớp 10A7'),
  -- 3.3 Giáo viên B CÙNG phụ trách Lớp 1 (10A7) — Kiểm thử chống collision
  (99822, 'gv_class1_b', 'Cô Giáo Viên B (Lớp 1)', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 1, 0, 'Giáo viên bộ môn 10A7'),
  -- 3.4 Giáo viên C phụ trách Lớp 2 (11A1) — Kiểm thử chống IDOR
  (99823, 'gv_class2_c', 'Thầy Giáo Viên C (Lớp 2)', 'hash123', 'salt123', 100000, 'teacher', 0, 1, 2, 0, 'GVCN Lớp 11A1'),
  -- 3.5 Giáo viên chưa gắn lớp phụ trách (lop_id = null)
  (99824, 'gv_no_class', 'Thầy Chưa Gắn Lớp', 'hash123', 'salt123', 100000, 'teacher', 0, 1, null, 0, 'Giáo viên chưa phân công lớp');

-- 4. Học sinh chính thức đã liên kết Lớp 1 (10A7)
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES
  (99804, 'hs_linked_prescale', 'Nguyễn Thị B', 'hash123', 'salt123', 100000, 'student', 0, 1, 2, 1, 0, 'Học sinh lớp 10A7');

-- 5. Người dùng Campus Tự do CHƯA LIÊN KẾT LỚP (hoc_sinh_id = null, lop_id = null)
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, la_admin_truong, tieu_de_ho_so)
VALUES
  (99810, 'hs_campus_unlinked', 'Bạn Campus Tự Do A', 'hash123', 'salt123', 100000, 'student', 0, 1, null, null, 0, 'Thành viên tự do A'),
  (99811, 'hs_campus_unlinked_b', 'Bạn Campus Tự Do B', 'hash123', 'salt123', 100000, 'student', 0, 1, null, null, 0, 'Thành viên tự do B');

-- 6. Mười tài khoản Campus độc lập kiểm thử chống collision danh tính Game (Group B)
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id, la_admin_truong)
VALUES
  (99830, 'user_collision_00', 'Player 00', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99831, 'user_collision_01', 'Player 01', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99832, 'user_collision_02', 'Player 02', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99833, 'user_collision_03', 'Player 03', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99834, 'user_collision_04', 'Player 04', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99835, 'user_collision_05', 'Player 05', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99836, 'user_collision_06', 'Player 06', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99837, 'user_collision_07', 'Player 07', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99838, 'user_collision_08', 'Player 08', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0),
  (99839, 'user_collision_09', 'Player 09', 'hash', 'salt', 100000, 'student', 0, 1, null, null, 0);

-- 7. Dọn sạch các bàn game cũ trong phạm vi test
DELETE FROM game_phong WHERE ten_ban LIKE '%Phase 4D.1%' OR ten_ban LIKE '%QA%';
