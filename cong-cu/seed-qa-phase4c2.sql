-- Dữ liệu hạt giống phục vụ kiểm thử Phase 4C.2 (Rate-Limit Correctness & Benchmark Pre-Flight)
DELETE FROM campus_block WHERE blocker_account_id IN (92001, 92002, 92003, 92004) OR blocked_account_id IN (92001, 92002, 92003, 92004);
DELETE FROM campus_report WHERE reporter_account_id IN (92001, 92002, 92003, 92004) OR target_account_id IN (92001, 92002, 92003, 92004);
DELETE FROM campus_private_message WHERE sender_account_id IN (92001, 92002, 92003, 92004) OR receiver_account_id IN (92001, 92002, 92003, 92004);
DELETE FROM campus_chat_message WHERE sender_account_id IN (92001, 92002, 92003, 92004);
DELETE FROM campus_friendship WHERE requester_account_id IN (92001, 92002, 92003, 92004) OR addressee_account_id IN (92001, 92002, 92003, 92004);
DELETE FROM tai_khoan_campus WHERE id IN (92001, 92002, 92003, 92004);

INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, teacher_pending, dang_hoat_dong, hoc_sinh_id, lop_id)
VALUES
  (92001, 'qa4c2_hsa', 'Nguyễn Tốc Độ A', 'hash', 'salt', 'student', 0, 1, 5, 1),
  (92002, 'qa4c2_hsb', 'Trần Nhịp Điệu B', 'hash', 'salt', 'student', 0, 1, 6, 1),
  (92003, 'qa4c2_hsc', 'Lê Bền Bỉ C', 'hash', 'salt', 'student', 0, 1, 7, 1),
  (92004, 'qa4c2_gva', 'Thầy Quản Trị Tải', 'hash', 'salt', 'teacher', 0, 1, NULL, 1);

-- Thiết lập sẵn quan hệ bạn bè accepted giữa 92001 (User A) và 92002 (User B) để test DM
INSERT INTO campus_friendship (id, requester_account_id, addressee_account_id, pair_low, pair_high, status, created_at, updated_at)
VALUES (92001, 92001, 92002, 92001, 92002, 'accepted', datetime('now'), datetime('now'));

-- Cấp quyền thành viên bảng tin cộng đồng cho học sinh 5 để test điều hướng rời Campus
INSERT OR REPLACE INTO community_membership (hoc_sinh_id, lop_id, granted_by)
VALUES (5, 1, 'teacher_qa');
