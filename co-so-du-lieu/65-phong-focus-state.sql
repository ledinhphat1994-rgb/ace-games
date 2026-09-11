-- ==============================================================================
-- 65-phong-focus-state.sql
-- Trạng thái đồng bộ phiên tập trung (Focus / Pomodoro Room) Campus
-- ==============================================================================

CREATE TABLE IF NOT EXISTS phong_focus_state (
  phong_id                INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  giai_doan               TEXT NOT NULL DEFAULT 'focus',   -- 'focus' (tập trung) | 'break' (nghỉ ngơi)
  trang_thai              TEXT NOT NULL DEFAULT 'paused',  -- 'running' | 'paused'
  thoi_luong_giay         INTEGER NOT NULL DEFAULT 1500,   -- Độ dài phiên (giây), mặc định 25 phút = 1500s
  thoi_gian_con_lai_giay  INTEGER NOT NULL DEFAULT 1500,   -- Số giây còn lại tại mốc cập nhật gần nhất
  preset                  TEXT NOT NULL DEFAULT '25_5',    -- '25_5' (25/5) | '50_10' (50/10)
  revision                INTEGER NOT NULL DEFAULT 1,      -- Khóa lạc quan chống xung đột lệnh điều khiển
  cap_nhat_luc            TEXT DEFAULT CURRENT_TIMESTAMP,  -- Thời điểm cập nhật trạng thái gần nhất
  nguoi_cap_nhat_khoa     TEXT,                            -- Khóa phiên người vừa cập nhật ('hs:...', 'gv:...')
  nguoi_cap_nhat_ten      TEXT                             -- Tên hiển thị người vừa cập nhật
);

CREATE INDEX IF NOT EXISTS idx_pfs_phong ON phong_focus_state(phong_id);
