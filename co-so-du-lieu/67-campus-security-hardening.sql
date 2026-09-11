-- ==============================================================================
-- 67-campus-security-hardening.sql
-- Phase 4A.1: Thắt chặt bảo mật Bảng tin, phân quyền Biên tập viên & Bảo vệ Privacy
--   1. Dọn dẹp dữ liệu mẫu giả mạo và mã truy cập tĩnh (10A7-2026)
--   2. Mở rộng ma_truy_cap_cong_dong: mã băm SHA-256, mã hiển thị che giấu, gắn với học sinh
--   3. Tạo bảng community_membership: lưu quyền thành viên Bảng tin bền vững ở máy chủ
-- ==============================================================================

-- 1. DỌN DẸP DỮ LIỆU MẪU GIẢ MẠO & MÃ TĨNH
DELETE FROM ma_truy_cap_cong_dong WHERE ma_code = '10A7-2026';
DELETE FROM campus_thong_bao WHERE id IN (1, 2) AND nguoi_tao_khoa = 'gvcn-dinh-quan';

-- 2. MỞ RỘNG BẢNG MÃ TRUY CẬP CỘNG ĐỒNG
ALTER TABLE ma_truy_cap_cong_dong ADD COLUMN hoc_sinh_id INTEGER REFERENCES hoc_sinh(id) ON DELETE CASCADE;
ALTER TABLE ma_truy_cap_cong_dong ADD COLUMN ma_hash TEXT;
ALTER TABLE ma_truy_cap_cong_dong ADD COLUMN ma_hien_thi TEXT;
ALTER TABLE ma_truy_cap_cong_dong ADD COLUMN da_dung_boi_hoc_sinh_id INTEGER REFERENCES hoc_sinh(id);
ALTER TABLE ma_truy_cap_cong_dong ADD COLUMN da_dung_luc TEXT;

-- Legacy shared invites cannot grant per-student membership. Remove their plaintext.
UPDATE ma_truy_cap_cong_dong
SET dang_hoat_dong = 0, ma_code = 'retired:' || id
WHERE ma_hash IS NULL;

CREATE INDEX IF NOT EXISTS idx_mtccd_hash ON ma_truy_cap_cong_dong(ma_hash);
CREATE INDEX IF NOT EXISTS idx_mtccd_hs ON ma_truy_cap_cong_dong(hoc_sinh_id);

-- 3. BẢNG QUYỀN THÀNH VIÊN BẢNG TIN CỘNG ĐỒNG (COMMUNITY MEMBERSHIP)
CREATE TABLE IF NOT EXISTS community_membership (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id     INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  lop_id          INTEGER NOT NULL REFERENCES lop(id) ON DELETE CASCADE,
  ma_truy_cap_id  INTEGER REFERENCES ma_truy_cap_cong_dong(id) ON DELETE SET NULL,
  granted_by      TEXT NOT NULL,
  granted_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  revoked_at      TEXT,
  UNIQUE(hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_cm_hs_lop ON community_membership(hoc_sinh_id, lop_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_cm_lop ON community_membership(lop_id, revoked_at);
