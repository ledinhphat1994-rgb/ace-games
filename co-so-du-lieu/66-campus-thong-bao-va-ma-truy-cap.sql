-- ==============================================================================
-- 66-campus-thong-bao-va-ma-truy-cap.sql
-- Tái cấu trúc Phase 4A:
--   1. campus_thong_bao: Thông báo giáo viên / Ban quản trị và biên tập viên
--   2. ma_truy_cap_cong_dong: Mã truy cập Bảng tin cộng đồng (Community Board Access Code)
--   3. campus_bien_tap_vien: Học sinh được giáo viên ủy quyền viết nháp / biên tập
-- ==============================================================================

-- 1. BẢNG THÔNG BÁO CHÍNH THỨC & BIÊN TẬP CAMPUS (TEACHER ANNOUNCEMENTS)
CREATE TABLE IF NOT EXISTS campus_thong_bao (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  tieu_de             TEXT NOT NULL,
  noi_dung            TEXT NOT NULL,
  noi_dung_dinh_dang  TEXT,
  anh_bia_url         TEXT,
  loai                TEXT NOT NULL DEFAULT 'thong_bao' CHECK (loai IN ('thong_bao', 'nhac_nho', 'lich_thi', 'tin_khan')),
  pham_vi             TEXT NOT NULL DEFAULT 'truong' CHECK (pham_vi IN ('truong', 'lop')),
  lop_id              INTEGER REFERENCES lop(id),
  trang_thai          TEXT NOT NULL DEFAULT 'published' CHECK (trang_thai IN ('draft', 'pending_review', 'published', 'archived')),
  ghim                INTEGER NOT NULL DEFAULT 0,
  uu_tien             INTEGER NOT NULL DEFAULT 0,
  nguoi_tao_khoa      TEXT NOT NULL,
  nguoi_tao_ten       TEXT NOT NULL,
  nguoi_tao_vai_tro   TEXT NOT NULL DEFAULT 'giao_vien' CHECK (nguoi_tao_vai_tro IN ('giao_vien', 'bien_tap_vien', 'admin')),
  nguoi_duyet_ten     TEXT,
  xuat_ban_luc        TEXT,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ctb_pham_vi ON campus_thong_bao(pham_vi, trang_thai, ghim DESC, tao_luc DESC);
CREATE INDEX IF NOT EXISTS idx_ctb_lop ON campus_thong_bao(lop_id, trang_thai);

-- 2. BẢNG MÃ TRUY CẬP BẢNG TIN CỘNG ĐỒNG (COMMUNITY ACCESS CODES)
CREATE TABLE IF NOT EXISTS ma_truy_cap_cong_dong (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  ma_code             TEXT NOT NULL UNIQUE,
  lop_id              INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  ten_goi             TEXT NOT NULL,
  so_lan_dung_toi_da  INTEGER DEFAULT 0,
  so_lan_da_dung      INTEGER NOT NULL DEFAULT 0,
  het_han_luc         TEXT,
  dang_hoat_dong      INTEGER NOT NULL DEFAULT 1,
  tao_boi_khoa        TEXT,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mtccd_code ON ma_truy_cap_cong_dong(ma_code, dang_hoat_dong);

-- 3. BẢNG HỌC SINH ĐƯỢC ỦY QUYỀN BIÊN TẬP (STUDENT EDITORS)
CREATE TABLE IF NOT EXISTS campus_bien_tap_vien (
  hoc_sinh_id         INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  lop_id              INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  duoc_phep_dang      INTEGER NOT NULL DEFAULT 0,
  nguoi_cap_khoa      TEXT NOT NULL,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_cbtv_lop ON campus_bien_tap_vien(lop_id);
