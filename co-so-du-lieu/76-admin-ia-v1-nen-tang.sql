-- ==============================================================================
-- 76-admin-ia-v1-nen-tang.sql
-- Nền tảng cho Admin Information Architecture v1 (Khu quản trị):
--   1. giao_vien_lop — 1 GVCN có thể kiêm nhiệm NHIỀU lớp cùng lúc (trước đây
--      tai_khoan_campus.lop_id chỉ là 1 cột, không đủ). Backfill từ dữ liệu hiện có
--      để không GVCN nào bị mất quyền truy cập lớp đang phụ trách.
--   2. nhat_ky_quan_tri — Audit Log: ghi lại hành động sửa/xoá của admin (khác hẳn
--      nhat_ky_truy_cap/nhat_ky_dang_nhap vốn chỉ ghi lượt xem/đăng nhập).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS giao_vien_lop (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  giao_vien_id  INTEGER NOT NULL REFERENCES tai_khoan_campus(id) ON DELETE CASCADE,
  lop_id        INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  la_chinh      INTEGER NOT NULL DEFAULT 0,  -- lớp mặc định khi mở Khu quản trị
  tao_luc       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(giao_vien_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_gvl_giao_vien ON giao_vien_lop(giao_vien_id);
CREATE INDEX IF NOT EXISTS idx_gvl_lop ON giao_vien_lop(lop_id);

-- Backfill: mỗi giáo viên đã có lop_id sẵn trong tai_khoan_campus → 1 dòng liên kết,
-- đánh dấu là lớp chính. Không đụng tới tai_khoan_campus.lop_id (vẫn giữ làm "lớp mặc định").
INSERT INTO giao_vien_lop (giao_vien_id, lop_id, la_chinh)
  SELECT id, lop_id, 1
    FROM tai_khoan_campus
   WHERE vai_tro = 'teacher' AND lop_id IS NOT NULL
  ON CONFLICT(giao_vien_id, lop_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS nhat_ky_quan_tri (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  tac_nhan_id   INTEGER,                  -- tai_khoan_campus.id của người thực hiện
  tac_nhan_ten  TEXT NOT NULL DEFAULT '',
  hanh_dong     TEXT NOT NULL,            -- vd: 'duyet_giao_vien', 'tu_choi_giao_vien'
  doi_tuong_loai TEXT NOT NULL DEFAULT '', -- vd: 'tai_khoan', 'phong', 'thong_bao'
  doi_tuong_id  TEXT DEFAULT '',
  chi_tiet      TEXT DEFAULT '',
  lop_id        INTEGER REFERENCES lop(id),
  tao_luc       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nkqt_tao_luc ON nhat_ky_quan_tri(tao_luc DESC);
CREATE INDEX IF NOT EXISTS idx_nkqt_lop ON nhat_ky_quan_tri(lop_id, tao_luc DESC);
