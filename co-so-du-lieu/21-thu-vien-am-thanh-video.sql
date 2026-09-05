-- Gộp "Nhạc nền" (trước đây chỉ 1 bài duy nhất) và thêm mới "Video" thành 2 THƯ VIỆN nhiều
-- mục, cùng hình dạng với thư viện "Ảnh hoạt động" (hinh_anh) đã có sẵn — để 3 loại media
-- trên web đều có một nơi duy nhất chứa và tái sử dụng, thay vì mỗi tính năng tự tải file
-- riêng của mình.
CREATE TABLE IF NOT EXISTS am_thanh (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ten       TEXT NOT NULL DEFAULT '',
  khoa      TEXT NOT NULL UNIQUE,
  kieu      TEXT NOT NULL DEFAULT 'audio/mpeg',
  co_byte   INTEGER NOT NULL DEFAULT 0,
  dang_phat INTEGER NOT NULL DEFAULT 0,   -- 1 = bài đang phát làm nhạc nền trang chủ (chỉ 1 dòng)
  tao_luc   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS video (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  ten     TEXT NOT NULL DEFAULT '',
  khoa    TEXT NOT NULL UNIQUE,
  kieu    TEXT NOT NULL DEFAULT 'video/mp4',
  co_byte INTEGER NOT NULL DEFAULT 0,
  tao_luc TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chuyển bài nhạc nền cũ (nếu có) vào thư viện Âm thanh, đánh dấu đang phát.
INSERT INTO am_thanh (ten, khoa, kieu, co_byte, dang_phat, tao_luc)
  SELECT ten_bai, khoa, kieu, co_byte, 1, tao_luc FROM nhac_nen WHERE id = 1;

-- Thông báo giờ THAM CHIẾU vào thư viện (anh_id/am_thanh_id/video_id) thay vì tự giữ file
-- riêng — cột *_khoa/*_kieu cũ (hinh_khoa, nhac_khoa, video_khoa...) vẫn giữ tạm để không phá
-- thông báo cũ trong lúc chuyển tiếp, sẽ dọn ở migration sau khi đã xác nhận ổn định.
ALTER TABLE thong_bao ADD COLUMN anh_id INTEGER;
ALTER TABLE thong_bao ADD COLUMN hinh_url TEXT;
ALTER TABLE thong_bao ADD COLUMN am_thanh_id INTEGER;
ALTER TABLE thong_bao ADD COLUMN nhac_url TEXT;
ALTER TABLE thong_bao ADD COLUMN video_id INTEGER;

-- Thông báo cũ đang dán LINK ngoài (hinh_khoa/nhac_khoa bắt đầu bằng http) -> chuyển sang cột
-- url riêng cho rõ ràng (không còn lẫn lộn "khoá kho" và "link ngoài" trong cùng một cột).
UPDATE thong_bao SET hinh_url = hinh_khoa, hinh_khoa = NULL WHERE hinh_khoa LIKE 'http%';
UPDATE thong_bao SET nhac_url = nhac_khoa, nhac_khoa = NULL WHERE nhac_khoa LIKE 'http%';

-- Đổi tên mã quyền "nhac-nen" -> "am-thanh" cho khớp tên chức năng mới (không ai mất quyền
-- đã được cấp trước đó).
UPDATE tai_khoan_phu SET quyen = REPLACE(quyen, 'nhac-nen', 'am-thanh') WHERE quyen LIKE '%nhac-nen%';
UPDATE ma_ca_nhan SET quyen = REPLACE(quyen, 'nhac-nen', 'am-thanh') WHERE quyen LIKE '%nhac-nen%';
