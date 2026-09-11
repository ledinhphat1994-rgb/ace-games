-- ==============================================================================
-- 61-phong-lien-lop.sql
-- Phòng hoạt động động của Digital Campus — học sinh MỌI LỚP đều tự tạo và vào
-- phòng được. pham_vi='truong' nghĩa là phòng liên lớp (toàn trung tâm).
-- ==============================================================================

-- 1. Phòng hoạt động
CREATE TABLE IF NOT EXISTS phong (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  loai            TEXT NOT NULL DEFAULT 'chat',     -- 'chat' | 'video' | 'nhac' | 'game'
  ten             TEXT NOT NULL,
  mo_ta           TEXT,
  pham_vi         TEXT NOT NULL DEFAULT 'truong',   -- 'truong' = mọi lớp vào được; 'lop' = chỉ lớp chủ phòng
  lop_id          INTEGER REFERENCES lop(id),       -- lớp của người tạo (luôn ghi nhận, kể cả phòng trường)
  chu_phong_khoa  TEXT NOT NULL,                    -- 'hs:<hoc_sinh_id>' | 'phu:<id>' | 'gv:<lop_id>' | 'he-thong'
  chu_phong_ten   TEXT NOT NULL,
  cau_hinh        TEXT,                             -- JSON tuỳ loại: {"videoUrl": "..."}
  trang_thai      TEXT NOT NULL DEFAULT 'mo',       -- 'mo' | 'dong'
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_phong_mo ON phong(trang_thai, pham_vi, lop_id);

-- 2. Ai đang ở trong phòng nào — presence bằng heartbeat (hoat_dong_luc còn "tươi" = đang online trong phòng)
CREATE TABLE IF NOT EXISTS phong_thanh_vien (
  phong_id        INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa            TEXT NOT NULL,                    -- khoá phiên: 'hs:<id>' | 'phu:<id>' | 'gv:<lop_id>'
  hoc_sinh_id     INTEGER,
  ten             TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh', -- 'hoc_sinh' | 'giao_vien'
  lop_id          INTEGER,
  hoat_dong_luc   TEXT NOT NULL,                    -- UTC 'YYYY-MM-DD HH:MM:SS' (datetime('now'))
  vao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (phong_id, khoa)
);
CREATE INDEX IF NOT EXISTS idx_ptv_phong ON phong_thanh_vien(phong_id);

-- 3. Chat riêng của từng phòng (tách khỏi chat_tin_nhan — kênh lớp giữ nguyên moderation riêng)
CREATE TABLE IF NOT EXISTS phong_tin_nhan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  phong_id        INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
  khoa            TEXT NOT NULL,
  hoc_sinh_id     INTEGER,
  ten_nguoi_gui   TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh',  -- 'hoc_sinh' | 'giao_vien' | 'he_thong'
  lop_id          INTEGER,
  noi_dung        TEXT NOT NULL,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ptn_phong ON phong_tin_nhan(phong_id, id);

-- 4. Sảnh chat chung toàn trường — phòng mặc định để mọi lớp gặp nhau ngay.
INSERT INTO phong (loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, trang_thai)
SELECT 'chat', 'Sảnh Chính Toàn Trường', 'Phòng chat chung cho học sinh mọi lớp của trung tâm — vào chào hỏi, làm quen, hẹn hoạt động.', 'truong', NULL, 'he-thong', 'Hệ thống', 'mo'
WHERE NOT EXISTS (SELECT 1 FROM phong WHERE chu_phong_khoa = 'he-thong');
