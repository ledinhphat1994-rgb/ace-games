-- ==============================================================================
-- 56-game-phong-no-fk.sql
-- Tạo lại bảng game_phong KHÔNG có FK constraint để hỗ trợ:
--   - ID giáo viên (999999, không tồn tại trong hoc_sinh)
--   - ID học sinh phụ (800000+phuId) trên các hệ thống không có bảng hoc_sinh
--   - ID mặc định (100001) khi chưa đăng nhập đầy đủ
-- ==============================================================================

-- Xoá bảng cũ có FK (nếu có dữ liệu cũ thì mất, nhưng game là dữ liệu tạm thời)
DROP TABLE IF EXISTS game_phong;

-- Tạo lại không có FK
CREATE TABLE game_phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL,
  loai_game       TEXT NOT NULL,
  ten_ban         TEXT NOT NULL,
  chu_phong_id    INTEGER NOT NULL,
  chu_phong_ten   TEXT NOT NULL,
  khach_id        INTEGER,
  khach_ten       TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'cho_nguoi',
  luot_di_id      INTEGER,
  du_lieu_ban_co  TEXT,
  nguoi_thang_id  INTEGER,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_phong_lop ON game_phong(lop_id, loai_game, trang_thai);
