-- Dọn dẹp sau khi thư viện Ảnh/Âm thanh/Video (migration 21) đã chạy ổn định một thời gian:
-- xoá bảng/cột cũ không còn ai đọc tới nữa.

-- Bước 1: đưa NỐT một đính kèm kiểu cũ còn sót (nếu có) vào đúng thư viện trước khi xoá cột
-- chứa nó — tránh mất đường dẫn tới file (file trong R2 vẫn còn, chỉ là D1 sẽ không còn cột
-- nào trỏ tới nếu không chuyển trước). co_byte đặt tạm 0 vì bước SQL này không tra được dung
-- lượng thật trong R2 — chấp nhận sai số nhỏ cho vài dòng hiếm hoi còn sót, không ảnh hưởng gì
-- vì việc dùng file (xem/nghe/xem) không phụ thuộc co_byte, chỉ khoá kiểm tra dung lượng kho
-- có thể đếm thiếu đúng phần này.
INSERT INTO hinh_anh (khoa, chu_thich, ngay, kieu, co_byte)
  SELECT hinh_khoa, 'Đính kèm cũ — thông báo #' || id, ngay, COALESCE(hinh_kieu, 'image/jpeg'), 0
    FROM thong_bao WHERE hinh_khoa IS NOT NULL AND hinh_khoa NOT LIKE 'http%';
UPDATE thong_bao SET anh_id = (SELECT id FROM hinh_anh WHERE khoa = thong_bao.hinh_khoa)
  WHERE hinh_khoa IS NOT NULL AND hinh_khoa NOT LIKE 'http%';

INSERT INTO am_thanh (khoa, ten, kieu, co_byte)
  SELECT nhac_khoa, 'Đính kèm cũ — thông báo #' || id, COALESCE(nhac_kieu, 'audio/mpeg'), 0
    FROM thong_bao WHERE nhac_khoa IS NOT NULL AND nhac_khoa NOT LIKE 'http%';
UPDATE thong_bao SET am_thanh_id = (SELECT id FROM am_thanh WHERE khoa = thong_bao.nhac_khoa)
  WHERE nhac_khoa IS NOT NULL AND nhac_khoa NOT LIKE 'http%';

INSERT INTO video (khoa, ten, kieu, co_byte)
  SELECT video_khoa, 'Đính kèm cũ — thông báo #' || id, COALESCE(video_kieu, 'video/mp4'), 0
    FROM thong_bao WHERE video_khoa IS NOT NULL;
UPDATE thong_bao SET video_id = (SELECT id FROM video WHERE khoa = thong_bao.video_khoa)
  WHERE video_khoa IS NOT NULL;

-- Bước 2: bỏ hẳn bảng nhạc nền cũ (đã thay bằng am_thanh — xem migration 21) và 6 cột đính
-- kèm kiểu cũ trên thong_bao (đã thay bằng anh_id/hinh_url, am_thanh_id/nhac_url, video_id).
DROP TABLE IF EXISTS nhac_nen;
ALTER TABLE thong_bao DROP COLUMN hinh_khoa;
ALTER TABLE thong_bao DROP COLUMN hinh_kieu;
ALTER TABLE thong_bao DROP COLUMN nhac_khoa;
ALTER TABLE thong_bao DROP COLUMN nhac_kieu;
ALTER TABLE thong_bao DROP COLUMN video_khoa;
ALTER TABLE thong_bao DROP COLUMN video_kieu;
