-- Bảng cấm thành viên vào phòng học cụ thể (Digital Campus v2).
-- Nâng cấp từ schema cũ (v1 dùng khoa) sang v2 gắn với tài khoản Campus (tai_khoan_id).
DROP TABLE IF EXISTS phong_ban;

CREATE TABLE IF NOT EXISTS phong_ban (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id     INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  tai_khoan_id INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  ly_do        TEXT,
  ban_boi      INTEGER,
  tao_luc      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(phong_id, tai_khoan_id)
);

CREATE INDEX IF NOT EXISTS idx_phong_ban_phong ON phong_ban(phong_id);
CREATE INDEX IF NOT EXISTS idx_phong_ban_tk    ON phong_ban(tai_khoan_id);
