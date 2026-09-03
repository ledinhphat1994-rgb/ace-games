-- Thủ quỹ lớp: các đợt thu, khoản đã đóng của từng em, khoản chi.
-- Tồn quỹ = tổng quy_dong.so_tien - tổng quy_chi.so_tien (tính lúc truy vấn, không lưu sẵn).

CREATE TABLE IF NOT EXISTS quy_khoan (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ten            TEXT NOT NULL,
  hoc_ky         INTEGER,
  so_tien_moi_em INTEGER NOT NULL DEFAULT 0,
  ghi_chu        TEXT DEFAULT '',
  dang_mo        INTEGER NOT NULL DEFAULT 1,
  tao_luc        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quy_dong (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  khoan_id    INTEGER NOT NULL REFERENCES quy_khoan(id),
  hoc_sinh_id INTEGER NOT NULL REFERENCES hoc_sinh(id),
  so_tien     INTEGER NOT NULL,
  ngay        TEXT NOT NULL,
  ghi_chu     TEXT DEFAULT '',
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quy_dong_khoan ON quy_dong(khoan_id, hoc_sinh_id);

CREATE TABLE IF NOT EXISTS quy_chi (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ngay      TEXT NOT NULL,
  noi_dung  TEXT NOT NULL,
  so_tien   INTEGER NOT NULL,
  ghi_chu   TEXT DEFAULT '',
  tao_luc   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quy_chi_ngay ON quy_chi(ngay DESC);
