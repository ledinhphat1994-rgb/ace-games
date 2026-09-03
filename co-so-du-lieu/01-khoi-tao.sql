-- Cấu trúc cơ sở dữ liệu lớp 10A7, năm học 2026-2027.
-- Chạy lại nhiều lần cũng không sao (đều có IF NOT EXISTS).

-- ---------- Học sinh ----------
CREATE TABLE IF NOT EXISTS hoc_sinh (
  id           INTEGER PRIMARY KEY,          -- trùng số thứ tự trong sổ lớp
  ho_ten       TEXT NOT NULL,
  gioi_tinh    TEXT,
  ngay_sinh    TEXT,                          -- dạng NĂM-THÁNG-NGÀY
  lop_nghe     TEXT,
  to_hop       TEXT,
  chuc_vu      TEXT DEFAULT '',
  to_so        INTEGER,                       -- tổ 1..4
  dien_thoai_ph TEXT DEFAULT '',              -- điện thoại phụ huynh (chỉ GVCN xem)
  hoan_canh    TEXT DEFAULT '',               -- hộ cận nghèo, GĐ khó khăn... (chỉ GVCN)
  ghi_chu      TEXT DEFAULT '',
  dang_hoc     INTEGER NOT NULL DEFAULT 1     -- 0 = đã nghỉ/chuyển trường
);

-- ---------- Điểm danh theo buổi ----------
CREATE TABLE IF NOT EXISTS diem_danh (
  ngay        TEXT NOT NULL,                  -- NĂM-THÁNG-NGÀY
  buoi        TEXT NOT NULL DEFAULT 'sang',   -- sang | chieu | hoat_dong
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  trang_thai  TEXT NOT NULL,                  -- co_mat | vang_phep | vang_khong_phep | tre
  ly_do       TEXT DEFAULT '',
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (ngay, buoi, hoc_sinh_id)
);
CREATE INDEX IF NOT EXISTS idx_diem_danh_hs ON diem_danh(hoc_sinh_id, ngay);

-- ---------- Nhật ký lớp: vi phạm, khen thưởng, việc cần theo dõi ----------
CREATE TABLE IF NOT EXISTS nhat_ky (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay        TEXT NOT NULL,
  hoc_sinh_id INTEGER REFERENCES hoc_sinh(id), -- để trống nếu là việc của cả lớp
  loai        TEXT NOT NULL,                   -- khen | nhac_nho | vi_pham | ho_tro | khac
  noi_dung    TEXT NOT NULL,
  da_xu_ly    INTEGER NOT NULL DEFAULT 0,
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_ngay ON nhat_ky(ngay DESC);

-- ---------- Thông báo hiện trên trang lớp ----------
CREATE TABLE IF NOT EXISTS thong_bao (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay      TEXT NOT NULL,
  tieu_de   TEXT NOT NULL,
  noi_dung  TEXT NOT NULL,
  loai      TEXT DEFAULT 'Chủ nhiệm',
  ghim      INTEGER NOT NULL DEFAULT 0,
  hien      INTEGER NOT NULL DEFAULT 1,
  tao_luc   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_thong_bao ON thong_bao(ghim DESC, ngay DESC);

-- ---------- Kế hoạch, sự kiện năm học ----------
CREATE TABLE IF NOT EXISTS ke_hoach (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay     TEXT NOT NULL,
  tieu_de  TEXT NOT NULL,
  mo_ta    TEXT DEFAULT '',
  muc_do   TEXT DEFAULT '',                    -- ok | warn | danger
  hoan_thanh INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ke_hoach ON ke_hoach(ngay);

-- ---------- Theo dõi đầu năm: sách, đồng phục, khoản thu ----------
CREATE TABLE IF NOT EXISTS theo_doi (
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  muc         TEXT NOT NULL,                   -- sgk | dong_phuc | bhyt | hoc_phi ...
  trang_thai  TEXT NOT NULL,
  ghi_chu     TEXT DEFAULT '',
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (hoc_sinh_id, muc)
);

-- ---------- Thời khoá biểu ----------
CREATE TABLE IF NOT EXISTS thoi_khoa_bieu (
  thu   INTEGER NOT NULL,                      -- 2..7
  tiet  INTEGER NOT NULL,                      -- 1..5
  mon   TEXT NOT NULL,
  phong TEXT DEFAULT '',
  PRIMARY KEY (thu, tiet)
);
