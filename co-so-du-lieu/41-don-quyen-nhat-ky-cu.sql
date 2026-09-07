-- Dọn quyền "nhat-ky" còn sót lại trong cột quyen (CSV) của các tài khoản đặc biệt đã được
-- cấp TRƯỚC KHI bỏ chức năng "Nhật ký lớp" (xem 40-xoa-nhat-ky-lop.sql) — nếu để lại, danh
-- sách quyền hiển thị ở trang quản lý sẽ hiện một thẻ vô nghĩa (mục đã không còn tồn tại).
-- Bọc thêm dấu phẩy hai đầu trước khi thay để xử lý đúng dù "nhat-ky" nằm đầu/giữa/cuối chuỗi.
UPDATE tai_khoan_phu
   SET quyen = TRIM(REPLACE(',' || quyen || ',', ',nhat-ky,', ','), ',')
 WHERE ',' || quyen || ',' LIKE '%,nhat-ky,%';

UPDATE ma_ca_nhan
   SET quyen = TRIM(REPLACE(',' || quyen || ',', ',nhat-ky,', ','), ',')
 WHERE ',' || quyen || ',' LIKE '%,nhat-ky,%';
