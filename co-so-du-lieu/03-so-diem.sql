-- Sổ điểm, rèn luyện và mã tra cứu cá nhân của học sinh.
-- Theo Thông tư 22/2021/TT-BGDĐT.

-- ---------- Môn học ----------
CREATE TABLE IF NOT EXISTS mon_hoc (
  ma        TEXT PRIMARY KEY,          -- toan, ngu_van, ...
  ten       TEXT NOT NULL,
  cach_danh_gia TEXT NOT NULL DEFAULT 'diem',  -- diem | nhan_xet
  so_dgtx   INTEGER NOT NULL DEFAULT 4,        -- số cột điểm đánh giá thường xuyên
  thu_tu    INTEGER NOT NULL DEFAULT 0,
  dang_hoc  INTEGER NOT NULL DEFAULT 1
);

-- ---------- Điểm từng môn, từng học kì ----------
-- Mỗi dòng là một con điểm. Loại: tx (thường xuyên) | gk (giữa kì) | ck (cuối kì)
CREATE TABLE IF NOT EXISTS diem (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  mon         TEXT NOT NULL REFERENCES mon_hoc(ma),
  hoc_ki      INTEGER NOT NULL,          -- 1 hoặc 2
  loai        TEXT NOT NULL,             -- tx | gk | ck
  so_thu_tu   INTEGER NOT NULL DEFAULT 1,-- cột thứ mấy trong nhóm tx
  gia_tri     REAL,                      -- điểm số, để trống nếu chưa có
  nhan_xet    TEXT DEFAULT '',           -- dùng cho môn đánh giá bằng nhận xét: D (Đạt) / CD
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (hoc_sinh_id, mon, hoc_ki, loai, so_thu_tu)
);
CREATE INDEX IF NOT EXISTS idx_diem_hs ON diem(hoc_sinh_id, hoc_ki);
CREATE INDEX IF NOT EXISTS idx_diem_mon ON diem(mon, hoc_ki);

-- ---------- Kết quả rèn luyện từng học kì ----------
CREATE TABLE IF NOT EXISTS ren_luyen (
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  hoc_ki      INTEGER NOT NULL,
  muc         TEXT NOT NULL DEFAULT '',  -- Tốt | Khá | Đạt | Chưa đạt
  nhan_xet    TEXT DEFAULT '',
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (hoc_sinh_id, hoc_ki)
);

-- ---------- Mã tra cứu cá nhân của học sinh ----------
-- Học sinh nhập mã này để xem chuyên cần, điểm và nhận xét CỦA RIÊNG MÌNH.
CREATE TABLE IF NOT EXISTS ma_ca_nhan (
  hoc_sinh_id INTEGER PRIMARY KEY REFERENCES hoc_sinh(id),
  ma          TEXT NOT NULL UNIQUE,
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Môn học của lớp 10A7 ----------
DELETE FROM mon_hoc;
INSERT INTO mon_hoc (ma, ten, cach_danh_gia, so_dgtx, thu_tu) VALUES
  ('ngu_van',     'Ngữ văn',                  'diem',     4, 1),
  ('toan',        'Toán',                     'diem',     4, 2),
  ('tieng_anh',   'Tiếng Anh',                'diem',     4, 3),
  ('vat_li',      'Vật lí',                   'diem',     3, 4),
  ('hoa_hoc',     'Hoá học',                  'diem',     3, 5),
  ('sinh_hoc',    'Sinh học',                 'diem',     3, 6),
  ('lich_su',     'Lịch sử',                  'diem',     3, 7),
  ('dia_li',      'Địa lí',                   'diem',     3, 8),
  ('gdkt_pl',     'Giáo dục kinh tế & pháp luật', 'diem', 3, 9),
  ('tin_hoc',     'Tin học',                  'diem',     3, 10),
  ('the_duc',     'Giáo dục thể chất',        'nhan_xet', 0, 11),
  ('hdtn',        'Hoạt động trải nghiệm, hướng nghiệp', 'nhan_xet', 0, 12);
