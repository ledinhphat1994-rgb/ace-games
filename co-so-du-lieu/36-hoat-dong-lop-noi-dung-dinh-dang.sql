-- "Hoạt động lớp": cho phép định dạng cơ bản trong phần "Nội dung chi tiết" (in đậm, in
-- nghiêng, cỡ chữ, màu chữ, font chữ cơ bản, chèn emoji) — giống soạn bài trên các mạng xã hội.
-- Cột "chu_thich" cũ giữ nguyên (bản văn bản thuần, dùng để tìm kiếm/hiển thị dự phòng khi
-- không có bản HTML). Thêm cột mới chỉ chứa HTML đã được lọc an toàn (xem functions/_lib/
-- html-an-toan.js) — bài cũ chưa có cột này sẽ tự động hiển thị bằng "chu_thich" như trước.
ALTER TABLE hoat_dong_lop ADD COLUMN noi_dung_html TEXT;
