-- ==============================================================================
-- 63-game-arena-toan-truong.sql
-- ==============================================================================
-- PHASE 3B.1 — CAMPUS GAME ARENA CORE
-- Mở rộng bảng game_phong hỗ trợ:
-- 1. pham_vi ('lop', 'truong') — Đấu trường toàn trường liên lớp hoặc nội bộ lớp
-- 2. kieu_ghep ('thu_cong', 'nhanh') — Tạo bàn thủ công hoặc Ghép trận nhanh (Quick Match)
-- 3. Invariants DB:
--    - idx_game_arena_lobby: tối ưu truy vấn sảnh chờ theo phạm vi & trạng thái
--    - uq_quick_match_waiting: PARTIAL UNIQUE INDEX ngăn 1 người tạo nhiều hàng đợi Quick Match
-- ==============================================================================

-- 1. Thêm cột pham_vi và kieu_ghep (giá trị mặc định đảm bảo tương thích ngược 100%)
ALTER TABLE game_phong ADD COLUMN pham_vi TEXT NOT NULL DEFAULT 'lop' CHECK (pham_vi IN ('lop', 'truong'));
ALTER TABLE game_phong ADD COLUMN kieu_ghep TEXT NOT NULL DEFAULT 'thu_cong' CHECK (kieu_ghep IN ('thu_cong', 'nhanh'));

-- 2. Index cho truy vấn sảnh chờ Toàn trường và Lớp
CREATE INDEX IF NOT EXISTS idx_game_arena_lobby ON game_phong(pham_vi, loai_game, trang_thai, kieu_ghep);

-- 3. Partial UNIQUE Index: Mỗi người chơi chỉ được có tối đa 1 bàn chờ Quick Match toàn trường còn hiệu lực
CREATE UNIQUE INDEX IF NOT EXISTS uq_quick_match_waiting
ON game_phong(chu_phong_id, loai_game)
WHERE pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi';
