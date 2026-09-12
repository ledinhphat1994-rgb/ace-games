-- ==============================================================================
-- 69-phase4b1-linkage-and-hardening.sql
-- Phase 4B.1: Account Linkage Invariant & Game Room Password Hardening
--   1. UNIQUE partial index ngăn chặn 1 học sinh liên kết vào nhiều tài khoản Campus
--   2. Mở rộng game_phong: access_mode ('public'|'password'), mat_khau_hash, mat_khau_salt
-- ==============================================================================

-- 1. RÀNG BUỘC DUY NHẤT: 1 HỌC SINH DANH SÁCH CHỈ ĐƯỢC LIÊN KẾT ĐÚNG 1 TÀI KHOẢN CAMPUS
CREATE UNIQUE INDEX IF NOT EXISTS idx_tkc_unique_hs ON tai_khoan_campus(hoc_sinh_id) WHERE hoc_sinh_id IS NOT NULL;

-- 2. MỞ RỘNG BÀN CỜ GAME ARENA THỦ CÔNG HỖ TRỢ MẬT KHẨU
ALTER TABLE game_phong ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'public';
ALTER TABLE game_phong ADD COLUMN mat_khau_hash TEXT;
ALTER TABLE game_phong ADD COLUMN mat_khau_salt TEXT;

CREATE INDEX IF NOT EXISTS idx_game_phong_access ON game_phong(access_mode, trang_thai);
