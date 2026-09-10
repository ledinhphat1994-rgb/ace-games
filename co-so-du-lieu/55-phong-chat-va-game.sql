-- ==============================================================================
-- 55-phong-chat-va-game.sql
-- Bảng dữ liệu cho Phòng tán gẫu lớp học (Chat Widget) và Khung mở rộng Game Hub
-- ==============================================================================

-- 1. Cấu hình phòng chat theo lớp (Rate limit, bật/tắt chat, thông báo ghim)
CREATE TABLE IF NOT EXISTS chat_cai_dat (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id              INTEGER NOT NULL UNIQUE REFERENCES lop(id),
  dang_mo             INTEGER NOT NULL DEFAULT 1,     -- 1: Mở chat, 0: Giáo viên tạm khoá
  gian_cach_giay      INTEGER NOT NULL DEFAULT 5,     -- Số giây giữa 2 tin nhắn (Rate limit)
  thong_bao_ghim      TEXT,                           -- Nội quy ghim đầu khung chat
  cap_nhat_luc        TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_cai_dat_lop ON chat_cai_dat(lop_id);

-- 2. Danh sách tin nhắn tán gẫu của lớp
CREATE TABLE IF NOT EXISTS chat_tin_nhan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL REFERENCES lop(id),
  hoc_sinh_id     INTEGER REFERENCES hoc_sinh(id) ON DELETE SET NULL, -- NULL nếu là giáo viên/hệ thống
  ten_nguoi_gui   TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh',   -- 'hoc_sinh' | 'giao_vien' | 'he_thong'
  noi_dung        TEXT NOT NULL,
  da_xoa          INTEGER NOT NULL DEFAULT 0,         -- 1: Tin đã bị giáo viên xoá
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_tin_nhan_lop ON chat_tin_nhan(lop_id, id ASC);

-- 3. Danh sách học sinh bị cấm chat (Mute/Ban)
CREATE TABLE IF NOT EXISTS chat_cam_hoc_sinh (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id     INTEGER NOT NULL REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  lop_id          INTEGER NOT NULL REFERENCES lop(id),
  ly_do           TEXT,
  den_luc         TEXT,                               -- NULL: cấm vĩnh viễn tới khi mở lại; hoặc chuỗi thời gian ISO
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(hoc_sinh_id, lop_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_cam_hs ON chat_cam_hoc_sinh(lop_id, hoc_sinh_id);

-- 4. Khung phòng chơi game đối kháng nhiều người (Cờ tướng, Cờ caro...)
CREATE TABLE IF NOT EXISTS game_phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL REFERENCES lop(id),
  loai_game       TEXT NOT NULL,                      -- 'co_tuong' | 'co_caro'
  ten_ban         TEXT NOT NULL,
  chu_phong_id    INTEGER NOT NULL REFERENCES hoc_sinh(id),
  chu_phong_ten   TEXT NOT NULL,
  khach_id        INTEGER REFERENCES hoc_sinh(id),
  khach_ten       TEXT,
  trang_thai      TEXT NOT NULL DEFAULT 'cho_nguoi',  -- 'cho_nguoi' | 'dang_choi' | 'ket_thuc' | 'huy'
  luot_di_id      INTEGER,
  du_lieu_ban_co  TEXT,                               -- Trạng thái bàn cờ lưu JSON
  nguoi_thang_id  INTEGER,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_game_phong_lop ON game_phong(lop_id, loai_game, trang_thai);
