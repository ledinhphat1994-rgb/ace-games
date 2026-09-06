-- Thêm "slug" (mã ngắn gọn, dễ nhớ, dùng trên đường link) cho từng lớp — để mỗi lớp có một
-- đường link đăng nhập RIÊNG, học sinh mở ra là thấy ngay đúng tên lớp mình trước khi nhập mã,
-- thay vì một màn hình đăng nhập chung chung không phân biệt được lớp nào với lớp nào.
-- Slug KHÔNG phải là cơ chế bảo mật — chỉ để hiển thị đẹp trước khi đăng nhập, việc xác thực
-- thật vẫn hoàn toàn dựa vào mã cá nhân/mã giáo viên như cũ.
ALTER TABLE lop ADD COLUMN slug TEXT;

UPDATE lop SET slug = '10a7' WHERE id = 1 AND slug IS NULL;
UPDATE lop SET slug = '11a1' WHERE id = 2 AND slug IS NULL;
