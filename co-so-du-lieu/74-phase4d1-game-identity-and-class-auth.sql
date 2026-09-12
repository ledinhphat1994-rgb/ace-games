-- ==============================================================================
-- 74-phase4d1-game-identity-and-class-auth.sql
-- Phase 4D.1: Game Identity & Class Authorization Consistency Gate
-- 1. game_phong:
--    - Cho phép lop_id = NULL đối với bàn toàn trường của tài khoản độc lập chưa gắn lớp
--    - Bổ sung các cột canonical actor key (TEXT): chu_phong_khoa, khach_khoa, luot_di_khoa, nguoi_thang_khoa
--    - Thay thế partial index uq_quick_match_waiting bằng uq_quick_match_waiting_khoa trên (chu_phong_khoa, loai_game)
--    - Bảo toàn 100% dữ liệu cũ, ánh xạ actor key an toàn cho các hàng đã tồn tại
-- 2. tai_khoan_campus:
--    - Bổ sung cột la_admin_truong (INTEGER DEFAULT 0) để phân tách School Admin vs GVCN thường
-- ==============================================================================

-- 1. MỞ RỘNG BẢNG TÀI KHOẢN CAMPUS (Phân quyền School Admin)
ALTER TABLE tai_khoan_campus ADD COLUMN la_admin_truong INTEGER NOT NULL DEFAULT 0;

-- 2. TÁI CẤU TRÚC BẢNG game_phong ĐỂ HỖ TRỢ CANONICAL ACTOR KEYS & LOP_ID NULLABLE
CREATE TABLE IF NOT EXISTS game_phong_moi (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id              INTEGER,                            -- NULL nếu là bàn toàn trường của tài khoản chưa liên kết lớp
  loai_game           TEXT NOT NULL,                      -- 'co_caro' | 'co_tuong'
  ten_ban             TEXT NOT NULL,
  chu_phong_id        INTEGER NOT NULL,                   -- Giá trị số tương thích ngược
  chu_phong_ten       TEXT NOT NULL,
  khach_id            INTEGER,
  khach_ten           TEXT,
  trang_thai          TEXT NOT NULL DEFAULT 'cho_nguoi',  -- 'cho_nguoi' | 'dang_choi' | 'ket_thuc' | 'huy' | 'hoa'
  luot_di_id          INTEGER,
  du_lieu_ban_co      TEXT,                               -- Trạng thái bàn cờ JSON
  nguoi_thang_id      INTEGER,
  pham_vi             TEXT NOT NULL DEFAULT 'lop' CHECK (pham_vi IN ('lop', 'truong')),
  kieu_ghep           TEXT NOT NULL DEFAULT 'thu_cong' CHECK (kieu_ghep IN ('thu_cong', 'nhanh')),
  access_mode         TEXT NOT NULL DEFAULT 'public',     -- 'public' | 'password'
  mat_khau_hash       TEXT,
  mat_khau_salt       TEXT,
  chu_phong_khoa      TEXT,                               -- Canonical Actor Key: 'acc:123', 'hs:45', 'phu:6', 'gv:1'
  khach_khoa          TEXT,
  luot_di_khoa        TEXT,
  nguoi_thang_khoa    TEXT,
  tao_luc             TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sao chép dữ liệu từ bảng cũ sang bảng mới kèm chuẩn hoá actor key
INSERT INTO game_phong_moi (
  id, lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
  khach_id, khach_ten, trang_thai, luot_di_id, du_lieu_ban_co,
  nguoi_thang_id, pham_vi, kieu_ghep, access_mode, mat_khau_hash,
  mat_khau_salt, chu_phong_khoa, khach_khoa, luot_di_khoa, nguoi_thang_khoa,
  tao_luc, cap_nhat_luc
)
SELECT
  id,
  lop_id,
  loai_game,
  ten_ban,
  chu_phong_id,
  chu_phong_ten,
  khach_id,
  khach_ten,
  trang_thai,
  luot_di_id,
  du_lieu_ban_co,
  nguoi_thang_id,
  pham_vi,
  kieu_ghep,
  access_mode,
  mat_khau_hash,
  mat_khau_salt,
  CASE
    WHEN chu_phong_id = 999999 THEN 'gv:legacy'
    WHEN chu_phong_id >= 800000 THEN 'phu:' || (chu_phong_id - 800000)
    WHEN chu_phong_id > 0 THEN 'hs:' || chu_phong_id
    ELSE 'anon'
  END AS chu_phong_khoa,
  CASE
    WHEN khach_id IS NULL THEN NULL
    WHEN khach_id = 999999 THEN 'gv:legacy'
    WHEN khach_id >= 800000 THEN 'phu:' || (khach_id - 800000)
    WHEN khach_id > 0 THEN 'hs:' || khach_id
    ELSE NULL
  END AS khach_khoa,
  CASE
    WHEN luot_di_id IS NULL THEN NULL
    WHEN luot_di_id = 999999 THEN 'gv:legacy'
    WHEN luot_di_id >= 800000 THEN 'phu:' || (luot_di_id - 800000)
    WHEN luot_di_id > 0 THEN 'hs:' || luot_di_id
    ELSE NULL
  END AS luot_di_khoa,
  CASE
    WHEN nguoi_thang_id IS NULL THEN NULL
    WHEN nguoi_thang_id = 999999 THEN 'gv:legacy'
    WHEN nguoi_thang_id >= 800000 THEN 'phu:' || (nguoi_thang_id - 800000)
    WHEN nguoi_thang_id > 0 THEN 'hs:' || nguoi_thang_id
    ELSE NULL
  END AS nguoi_thang_khoa,
  tao_luc,
  cap_nhat_luc
FROM game_phong;

-- Hoán đổi bảng
DROP TABLE game_phong;
ALTER TABLE game_phong_moi RENAME TO game_phong;

-- Tái tạo indexes tối ưu cho truy vấn và chống trùng hàng đợi Quick Match
CREATE INDEX IF NOT EXISTS idx_game_phong_lop ON game_phong(lop_id, loai_game, trang_thai);
CREATE INDEX IF NOT EXISTS idx_game_arena_lobby ON game_phong(pham_vi, loai_game, trang_thai, kieu_ghep);
CREATE UNIQUE INDEX IF NOT EXISTS uq_quick_match_waiting_khoa
ON game_phong(chu_phong_khoa, loai_game)
WHERE pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi';
