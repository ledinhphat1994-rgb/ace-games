-- Mở rộng Thông báo: mức độ quan trọng (mucDo — quyết định màu nhãn, để học sinh dễ nhận
-- biết thay vì luôn gán cứng "Quan trọng" theo cờ ghim) + đính kèm ảnh/nhạc/video. Từ đây
-- Thông báo đảm nhiệm luôn chức năng của "Kế hoạch năm học" cũ — KHÔNG xoá bảng ke_hoach
-- (giữ lại dữ liệu cũ phòng khi cần xem lại), chỉ ngừng dùng ở giao diện.
ALTER TABLE thong_bao ADD COLUMN muc_do TEXT NOT NULL DEFAULT '';
ALTER TABLE thong_bao ADD COLUMN hinh_khoa TEXT;
ALTER TABLE thong_bao ADD COLUMN hinh_kieu TEXT;
ALTER TABLE thong_bao ADD COLUMN nhac_khoa TEXT;
ALTER TABLE thong_bao ADD COLUMN nhac_kieu TEXT;
ALTER TABLE thong_bao ADD COLUMN video_url TEXT;

-- Thông báo đã ghim từ trước: giữ nguyên dấu hiệu "Quan trọng" để không đổi diện mạo sau
-- khi nâng cấp (trước đây cờ ghim tự động in ra nhãn này, nay mucDo mới là nguồn quyết định).
UPDATE thong_bao SET muc_do = 'danger' WHERE ghim = 1 AND muc_do = '';
