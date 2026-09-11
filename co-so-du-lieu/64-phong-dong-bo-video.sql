-- ==============================================================================
-- 64-phong-dong-bo-video.sql
-- Trạng thái đồng bộ phát video cho phòng Xem chung (Watch Together) Campus
-- ==============================================================================

CREATE TABLE IF NOT EXISTS phong_dong_bo_video (
  phong_id            INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  trang_thai          TEXT NOT NULL DEFAULT 'paused',  -- 'playing' | 'paused'
  vi_tri_giay         REAL NOT NULL DEFAULT 0,         -- Vị trí mốc phát lại (giây)
  toc_do              REAL NOT NULL DEFAULT 1.0,       -- Tốc độ phát (0.5 đến 2.0)
  revision            INTEGER NOT NULL DEFAULT 1,      -- Khóa lạc quan chống xung đột lệnh
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP,  -- Thời điểm cập nhật mốc vị trí
  nguoi_cap_nhat_khoa TEXT,                            -- Khóa phiên người vừa cập nhật ('hs:...', 'gv:...')
  nguoi_cap_nhat_ten  TEXT                             -- Tên hiển thị người vừa cập nhật
);

CREATE INDEX IF NOT EXISTS idx_pdbv_phong ON phong_dong_bo_video(phong_id);
