-- Thời khoá biểu chỉ cần hiện tên môn học, không cần ghi kèm tên giáo viên dạy môn đó (đã lỡ
-- ghi kiểu "Văn (Hằng)", "Toán (Đông)"... khi nhập TKB HK1 ở migration 30) — bỏ hẳn phần
-- "(Tên giáo viên)" phía sau tên môn, giữ nguyên tên môn ở phía trước dấu ngoặc.
UPDATE tkb_o
   SET mon = TRIM(SUBSTR(mon, 1, INSTR(mon, '(') - 1))
 WHERE mon LIKE '%(%)';
