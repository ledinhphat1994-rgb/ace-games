-- ==============================================================================
-- 77-study-room-governance.sql
-- Study Room Governance (Phase 4G): vai trò phòng + capability policy +
-- member grants + kick/ban + hàng đợi video + voice pair 1-1 + collab v2.
-- Theo STUDY_ROOM_FUNCTIONAL_AUDIT.md — P0/P1.
-- ==============================================================================

-- 1. Vai trò TRONG PHÒNG (tách khỏi vai_tro tài khoản 'hoc_sinh'/'giao_vien').
--    'host' suy ra từ phong.chu_phong_khoa (không lưu — tránh xung đột).
--    'teacher' suy ra từ phien.role. Cột này chỉ giữ 'member' | 'co_host'.
ALTER TABLE phong_thanh_vien ADD COLUMN vai_tro_phong TEXT NOT NULL DEFAULT 'member';

-- 2. Chính sách capability của phòng: mỗi capability có enabled + access_mode.
--    access_mode: 'staff_only' | 'selected_members' | 'everyone'
--    capability:  'video_control' | 'video_change' | 'queue' | 'chat' |
--                 'notes' | 'whiteboard' | 'sheet' | 'voice' | 'invite' | 'moderation'
CREATE TABLE IF NOT EXISTS phong_policy (
  phong_id    INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  capability  TEXT NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  access_mode TEXT NOT NULL DEFAULT 'staff_only',
  cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, capability)
);

-- 3. Cấp quyền cho member cụ thể (khi access_mode = 'selected_members').
--    trang_thai: 'granted' = được dùng; 'requested' = member xin quyền, chờ staff duyệt.
CREATE TABLE IF NOT EXISTS phong_grant (
  phong_id   INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa       TEXT NOT NULL,
  capability TEXT NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'granted',
  tao_luc    TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, khoa, capability)
);

-- 4. Ban trong phòng (kick không cho vào lại). Chỉ có tác dụng trong phòng đó.
CREATE TABLE IF NOT EXISTS phong_ban (
  phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa     TEXT NOT NULL,
  ten      TEXT,
  boi_khoa TEXT,
  tao_luc  TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, khoa)
);

-- 5. Hàng đợi video của phòng (queue).
CREATE TABLE IF NOT EXISTS phong_video_queue (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id   INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  video_url  TEXT NOT NULL,
  video_id   TEXT,
  title      TEXT,
  thumb      TEXT,
  added_by_khoa TEXT NOT NULL,
  added_by_ten  TEXT,
  ord        REAL NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'queued',   -- 'queued' | 'playing' | 'played' | 'skipped'
  tao_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pvq_phong ON phong_video_queue(phong_id, trang_thai, ord);

-- 6. Cặp voice 1-1 đang hoạt động — tối đa 1 cặp/phòng (v1).
CREATE TABLE IF NOT EXISTS phong_voice_pair (
  phong_id      INTEGER PRIMARY KEY REFERENCES phong(id) ON DELETE CASCADE,
  a_khoa        TEXT NOT NULL,
  a_ten         TEXT,
  b_khoa        TEXT,
  b_ten         TEXT,
  trang_thai    TEXT NOT NULL DEFAULT 'ringing',  -- 'ringing' | 'active'
  tao_luc       TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Collab v2 — ghi chú dạng entry append (thay whole-doc overwrite).
CREATE TABLE IF NOT EXISTS phong_note (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id      INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa          TEXT NOT NULL,
  ten           TEXT NOT NULL,
  noi_dung      TEXT NOT NULL,
  video_time_sec REAL,                 -- mốc thời gian video lúc ghi (timestamped notes)
  da_xoa        INTEGER NOT NULL DEFAULT 0,
  tao_luc       TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pn_phong ON phong_note(phong_id, id);

-- 8. Collab v2 — whiteboard dạng append-only stroke/clear ops.
CREATE TABLE IF NOT EXISTS phong_wb_op (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa     TEXT NOT NULL,
  op_json  TEXT NOT NULL,              -- {"type":"stroke","stroke":{...}} | {"type":"clear"}
  tao_luc  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pwbo_phong ON phong_wb_op(phong_id, id);

-- 9. Collab v2 — sheet theo từng ô (upsert độc lập, không whole-doc conflict).
CREATE TABLE IF NOT EXISTS phong_sheet_cell (
  phong_id   INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  cell       TEXT NOT NULL,            -- 'A1'..'H10'
  gia_tri    TEXT NOT NULL DEFAULT '',
  updated_by TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, cell)
);

-- 10. Chat phòng: moderation (xoá mềm) + tin nhắn gắn mốc video.
ALTER TABLE phong_tin_nhan ADD COLUMN da_xoa INTEGER NOT NULL DEFAULT 0;
ALTER TABLE phong_tin_nhan ADD COLUMN video_time_sec REAL;
