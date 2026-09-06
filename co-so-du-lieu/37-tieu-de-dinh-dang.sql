-- Tiêu đề (Hoạt động lớp) và Tiêu đề + Nội dung (Thông báo) giờ cũng cho định dạng cơ bản
-- (in đậm/nghiêng/font/cỡ/màu chữ/emoji) giống hệt phần "Nội dung chi tiết" của Hoạt động lớp —
-- xem functions/_lib/html-an-toan.js. Cột cũ (tieu_de, noi_dung của thong_bao) giữ nguyên làm
-- bản văn bản thuần (tìm kiếm/hiển thị dự phòng); bài cũ chưa có các cột *_html vẫn hiện bình
-- thường bằng bản văn bản thuần như trước.
ALTER TABLE hoat_dong_lop ADD COLUMN tieu_de_html TEXT;
ALTER TABLE thong_bao ADD COLUMN tieu_de_html TEXT;
ALTER TABLE thong_bao ADD COLUMN noi_dung_html TEXT;
