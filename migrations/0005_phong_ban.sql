-- Bảng cấm thành viên vào phòng học cụ thể.
-- Được áp dụng tại cổng WebSocket admission; không có tính năng này thì tắt bằng cách không chèn row.
CREATE TABLE IF NOT EXISTS phong_ban (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id     INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  tai_khoan_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  ly_do        TEXT,
  ban_boi      INTEGER,
  tao_luc      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(phong_id, tai_khoan_id)
);
CREATE INDEX idx_phong_ban_phong ON phong_ban(phong_id);
CREATE INDEX idx_phong_ban_tk    ON phong_ban(tai_khoan_id);
