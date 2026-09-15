-- Schema dùng riêng cho test: chép nguyên văn từ sqlite_master của D1 staging (15/09/2026) — các bảng Phase 1 cần.
CREATE TABLE phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loai            TEXT NOT NULL DEFAULT 'chat',
  ten             TEXT NOT NULL,
  mo_ta           TEXT,
  pham_vi         TEXT NOT NULL DEFAULT 'truong',
  lop_id          INTEGER REFERENCES lop(id),
  chu_phong_khoa  TEXT NOT NULL,
  chu_phong_ten   TEXT NOT NULL,
  cau_hinh        TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'mo',
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
, access_mode TEXT NOT NULL DEFAULT 'public', mat_khau_hash TEXT, mat_khau_salt TEXT, suc_chua INTEGER NOT NULL DEFAULT 20);

CREATE INDEX idx_phong_access ON phong(access_mode, trang_thai);
CREATE INDEX idx_phong_mo ON phong(trang_thai, pham_vi, lop_id);

CREATE TABLE giao_vien_lop (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  giao_vien_id  INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  lop_id        INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  la_chinh      INTEGER NOT NULL DEFAULT 0,
  tao_luc       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(giao_vien_id, lop_id)
);

CREATE INDEX idx_gvl_giao_vien ON giao_vien_lop(giao_vien_id);
CREATE INDEX idx_gvl_lop ON giao_vien_lop(lop_id);

CREATE TABLE campus_chat_message (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_account_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  lop_id INTEGER,
  content TEXT NOT NULL,
  deleted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ccm_active ON campus_chat_message(deleted_at, id);
CREATE INDEX idx_ccm_id ON campus_chat_message(id);
