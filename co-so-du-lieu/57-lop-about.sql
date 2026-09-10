-- 57. BẢNG THÔNG TIN GIỚI THIỆU TAB ABOUT CỦA LỚP (VĂN BẢN, ẢNH, VIDEO, ÂM THANH)
CREATE TABLE IF NOT EXISTS lop_about (
  lop_id        INTEGER PRIMARY KEY REFERENCES lop(id) ON DELETE CASCADE,
  van_ban       TEXT,
  anh_id        INTEGER REFERENCES hinh_anh(id) ON DELETE SET NULL,
  hinh_url      TEXT,
  video_id      INTEGER REFERENCES video(id) ON DELETE SET NULL,
  video_url     TEXT,
  am_thanh_id   INTEGER REFERENCES am_thanh(id) ON DELETE SET NULL,
  am_thanh_url  TEXT,
  cap_nhat_luc  TEXT DEFAULT CURRENT_TIMESTAMP
);
