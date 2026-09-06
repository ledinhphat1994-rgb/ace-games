-- Ảnh/video nền cho khối giới thiệu đầu trang lớp (banner) — mỗi lớp một banner riêng, chọn
-- ĐÚNG MỘT TRONG HAI (ảnh HOẶC video), theo đúng mẫu "hình/video HOẶC link" đã dùng cho Thông
-- báo: *_id tham chiếu vào thư viện chung (hinh_anh/video), *_url là link dán từ ngoài
-- (YouTube/Drive cho video, link ảnh trực tiếp/Drive cho ảnh). Không có "âm thanh nền" ở đây —
-- nhạc nền trang chủ đã là một tính năng riêng (Thư viện Âm thanh → Làm nhạc nền), không lặp lại.
ALTER TABLE lop ADD COLUMN banner_anh_id INTEGER;
ALTER TABLE lop ADD COLUMN banner_hinh_url TEXT;
ALTER TABLE lop ADD COLUMN banner_video_id INTEGER;
ALTER TABLE lop ADD COLUMN banner_video_url TEXT;
