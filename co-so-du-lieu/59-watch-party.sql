-- Watch Party System - Xem phim/music cùng nhau với sync playback
-- Bảng lưu trạng thái các phòng watch party để sync real-time

CREATE TABLE IF NOT EXISTS watch_party (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ten_phong TEXT NOT NULL,                    -- Tên phòng
  video_url TEXT NOT NULL,                    -- URL video/music
  loai_phong TEXT DEFAULT 'video',            -- 'video' hoặc 'music'
  nguoi_tao TEXT NOT NULL,                    -- Người tạo phòng
  dang_phat INTEGER DEFAULT 0,                 -- 0 = pause, 1 = playing
  thoi_gian_hien_tai REAL DEFAULT 0,          -- Thời gian hiện tại (giây)
  so_nguoi INTEGER DEFAULT 1,                 -- Số người đang xem
  lop_id INTEGER DEFAULT 1,                   -- Lớp sở hữu phòng
  tao_luc TEXT DEFAULT CURRENT_TIMESTAMP,     -- Thời gian tạo
  cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP -- Thời gian cập nhật cuối
);

-- Index cho tìm kiếm phòng theo lớp
CREATE INDEX IF NOT EXISTS idx_watch_party_lop_id ON watch_party(lop_id);

-- Index cho tìm kiếm phòng theo người tạo
CREATE INDEX IF NOT EXISTS idx_watch_party_nguoi_tao ON watch_party(nguoi_tao);

-- Bảng lưu lịch sử sync của watch party (để debug và analytics)
CREATE TABLE IF NOT EXISTS watch_party_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watch_party_id INTEGER NOT NULL,
  hanh_dong TEXT NOT NULL,                     -- 'play', 'pause', 'seek', 'join', 'leave'
  gia_tri REAL,                               -- Giá trị timestamp (nếu có)
  nguoi_thuc_hien TEXT NOT NULL,              -- Người thực hiện action
  thoi_gian TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_watch_party_sync_log_party_id ON watch_party_sync_log(watch_party_id);