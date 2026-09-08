-- Phân loại ảnh trong Thư viện Ảnh thành 3 "kho" xem/chuyển qua lại được: 'chung' (mặc định,
-- ảnh hoạt động thường), 'nen' (đã xếp vào kho ảnh nền, dễ tìm lại khi cần đặt lại), 'banner'
-- (đã xếp vào kho ảnh banner). Đây CHỈ là nhãn phân loại để dễ duyệt/tìm lại — không phải đang
-- LÀM nền/banner (2 việc đó vẫn do các cột/cơ chế khác quyết định như trước, không đụng tới).
ALTER TABLE hinh_anh ADD COLUMN kho TEXT NOT NULL DEFAULT 'chung';
