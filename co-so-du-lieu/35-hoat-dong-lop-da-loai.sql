-- "Hoạt động lớp" giờ cho phép MỘT bài đăng gộp nhiều loại cùng lúc (văn bản + ảnh + video +
-- âm thanh), giống hệt cách Thông báo đã làm — trước đây mỗi dòng chỉ đúng MỘT loại.
-- Thêm cột riêng cho từng loại link dán ngoài (trước dùng chung một cột "url" theo "loai"),
-- và cột "tieu_de" tách khỏi "chu_thich" cho phần văn bản.
ALTER TABLE hoat_dong_lop ADD COLUMN tieu_de TEXT;
ALTER TABLE hoat_dong_lop ADD COLUMN hinh_url TEXT;
ALTER TABLE hoat_dong_lop ADD COLUMN video_url TEXT;
ALTER TABLE hoat_dong_lop ADD COLUMN am_thanh_url TEXT;

-- Chuyển dữ liệu cũ: cột "url" dùng chung theo "loai" sang đúng cột riêng của loại đó.
-- Cột "url" cũ giữ nguyên không xoá (an toàn, không dùng tới nữa).
UPDATE hoat_dong_lop SET hinh_url = url WHERE loai = 'anh' AND url IS NOT NULL;
UPDATE hoat_dong_lop SET video_url = url WHERE loai = 'video' AND url IS NOT NULL;
UPDATE hoat_dong_lop SET am_thanh_url = url WHERE loai = 'am-thanh' AND url IS NOT NULL;
