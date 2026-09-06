-- "Hoạt động lớp" — khối hiển thị ở trang chủ (trước đây gọi "Hình ảnh hoạt động", chỉ liệt kê
-- MỌI ảnh trong thư viện Ảnh một cách tự động). Giờ tách thành một danh sách RIÊNG, do giáo viên
-- (hoặc học sinh được cấp quyền quản lý Ảnh/Âm thanh/Video) CHỌN TỪNG MỤC một để đăng công khai —
-- không tự động lấy hết thư viện nữa, và nhận cả video/âm thanh chứ không chỉ ảnh.
-- Mỗi dòng là MỘT mục, đúng một trong ba loại (anh/video/am-thanh); *_id tham chiếu vào đúng
-- thư viện tương ứng, *_url là link dán từ ngoài — theo đúng mẫu đã dùng cho Thông báo/Banner.
CREATE TABLE hoat_dong_lop (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id INTEGER NOT NULL DEFAULT 1,
  loai TEXT NOT NULL,
  anh_id INTEGER,
  video_id INTEGER,
  am_thanh_id INTEGER,
  url TEXT,
  chu_thich TEXT,
  ngay TEXT NOT NULL,
  tao_luc TEXT NOT NULL DEFAULT (datetime('now'))
);
