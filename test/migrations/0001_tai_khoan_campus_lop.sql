-- Schema dùng riêng cho test: chép nguyên văn 2 bảng Phase 0 cần từ D1 hiện có (không có dữ liệu).
CREATE TABLE lop (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ten            TEXT NOT NULL,
  nam_hoc        TEXT NOT NULL DEFAULT '',
  truong         TEXT NOT NULL DEFAULT '',
  gioi_thieu     TEXT NOT NULL DEFAULT '',
  gioi_han_byte  INTEGER NOT NULL DEFAULT 9500000000,
  dang_hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc        TEXT NOT NULL DEFAULT (datetime('now'))
, slug TEXT, banner_anh_id INTEGER, banner_hinh_url TEXT, banner_video_id INTEGER, banner_video_url TEXT, hs_cong_khai_an TEXT, hs_can_su_hien TEXT, gioi_han_tai_len_ngay_byte INTEGER);

-- Bảng giả chỉ để khoá ngoại tai_khoan_campus.hoc_sinh_id hợp lệ (D1 bật kiểm tra khoá ngoại); D1 thật có bảng đầy đủ.
CREATE TABLE hoc_sinh (id INTEGER PRIMARY KEY AUTOINCREMENT);

CREATE TABLE tai_khoan_campus (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ten_dang_nhap       TEXT NOT NULL UNIQUE,
  ten_hien_thi        TEXT NOT NULL,
  mat_khau_hash       TEXT NOT NULL,
  salt                TEXT NOT NULL,
  iterations          INTEGER NOT NULL DEFAULT 100000,
  vai_tro             TEXT NOT NULL DEFAULT 'student',
  teacher_pending     INTEGER NOT NULL DEFAULT 0,
  duyet_boi_khoa      TEXT,
  duyet_luc           TEXT,
  hoc_sinh_id         INTEGER REFERENCES hoc_sinh(id) ON DELETE SET NULL,
  lop_id              INTEGER REFERENCES lop(id) ON DELETE SET NULL,
  dang_hoat_dong      INTEGER NOT NULL DEFAULT 1,
  thiet_bi            TEXT,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP
, avatar TEXT, tieu_de_ho_so TEXT, la_admin_truong INTEGER NOT NULL DEFAULT 0);

CREATE INDEX idx_tkc_hoc_sinh_id ON tai_khoan_campus(hoc_sinh_id);
CREATE INDEX idx_tkc_role_pending ON tai_khoan_campus(vai_tro, teacher_pending);
CREATE INDEX idx_tkc_ten_dn ON tai_khoan_campus(ten_dang_nhap);
CREATE UNIQUE INDEX idx_tkc_unique_hs ON tai_khoan_campus(hoc_sinh_id) WHERE hoc_sinh_id IS NOT NULL;
