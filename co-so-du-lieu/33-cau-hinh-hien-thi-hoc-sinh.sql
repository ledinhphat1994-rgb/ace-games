-- Cho phép giáo viên tuỳ chỉnh: (1) cột nào trong "Danh sách lớp" công khai (trang chủ, học
-- sinh nào cũng xem được) hiện/ẩn, và (2) cán sự được cấp quyền "Học sinh" (mới) được xem THÊM
-- những trường nhạy cảm nào (SĐT phụ huynh, hoàn cảnh gia đình, ghi chú riêng, số liệu vắng/trễ)
-- ngoài các cột công khai — mặc định KHÔNG cấp thêm gì (an toàn nhất), giáo viên tự bật nếu cần.
-- Giá trị lưu dạng chuỗi các mã cách nhau bởi dấu phẩy, giống cột "quyen"/"an_muc" đã dùng.
ALTER TABLE lop ADD COLUMN hs_cong_khai_an TEXT;
ALTER TABLE lop ADD COLUMN hs_can_su_hien TEXT;
