-- Hỗ trợ tải tệp video trực tiếp từ máy tính/điện thoại lên kho R2 cho thông báo
ALTER TABLE thong_bao ADD COLUMN video_khoa TEXT;
ALTER TABLE thong_bao ADD COLUMN video_kieu TEXT;
