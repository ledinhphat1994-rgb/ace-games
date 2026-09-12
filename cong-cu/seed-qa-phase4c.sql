DELETE FROM campus_friendship WHERE requester_account_id IN (91001, 91002, 91003) OR addressee_account_id IN (91001, 91002, 91003);
DELETE FROM campus_private_message WHERE sender_account_id IN (91001, 91002, 91003) OR receiver_account_id IN (91001, 91002, 91003);
DELETE FROM tai_khoan_campus WHERE id IN (91001, 91002, 91003);
INSERT INTO tai_khoan_campus (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, vai_tro, hoc_sinh_id, lop_id)
VALUES
  (91001, 'qa4c_hsa', 'Nguyễn Văn A', 'hash', 'salt', 'student', 35, 1),
  (91002, 'qa4c_hsb', 'Trần Thị B', 'hash', 'salt', 'student', 36, 1),
  (91003, 'qa4c_hsc', 'Lê Văn C', 'hash', 'salt', 'student', 37, 1);
