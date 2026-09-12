DELETE FROM campus_block WHERE blocker_account_id IN (91001, 91002, 91003, 91004) OR blocked_account_id IN (91001, 91002, 91003, 91004);
DELETE FROM campus_report WHERE reporter_account_id IN (91001, 91002, 91003, 91004) OR target_account_id IN (91001, 91002, 91003, 91004);
DELETE FROM campus_private_message WHERE sender_account_id IN (91001, 91002, 91003, 91004) OR receiver_account_id IN (91001, 91002, 91003, 91004);
DELETE FROM campus_friendship WHERE requester_account_id IN (91001, 91002, 91003, 91004) OR addressee_account_id IN (91001, 91002, 91003, 91004);
DELETE FROM campus_chat_message WHERE sender_account_id IN (91001, 91002, 91003, 91004);
DELETE FROM tai_khoan_campus WHERE id IN (91001, 91002, 91003, 91004);

INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, hoc_sinh_id, lop_id, dang_hoat_dong)
VALUES
  (91001, 'qa4c1_hsa', 'Nguyễn Văn A', 'hash', 'salt', 'student', 35, 1, 1),
  (91002, 'qa4c1_hsb', 'Trần Thị B', 'hash', 'salt', 'student', 36, 1, 1),
  (91003, 'qa4c1_hsc', 'Lê Văn C', 'hash', 'salt', 'student', 37, 1, 1),
  (91004, 'qa4c1_gva', 'Thầy Giáo Viên', 'hash', 'salt', 'teacher', NULL, 1, 1);
