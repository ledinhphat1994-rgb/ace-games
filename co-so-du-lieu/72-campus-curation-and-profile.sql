-- ==============================================================================
-- 72-campus-curation-and-profile.sql
-- Server-side Highlights Curation & Teacher Profile Presentation Hardening
-- ==============================================================================

-- 1. BẢNG TIÊU ĐIỂM CAMPUS DO GIÁO VIÊN BIÊN SOẠN & XUẤT BẢN (CAMPUS HIGHLIGHT CURATION)
CREATE TABLE IF NOT EXISTS campus_highlight_curation (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type         TEXT NOT NULL DEFAULT 'manual', -- 'manual' (spotlight) | 'data_derived' (dữ liệu thật)
  source_id           TEXT,                           -- ID liên kết gốc nếu có (vd 'arena-active', 'watch-12')
  title               TEXT NOT NULL,                  -- Tiêu đề ngắn gọn 1 dòng
  subtitle            TEXT,                           -- Mô tả tóm tắt 1 dòng
  icon                TEXT DEFAULT '✨',              -- Biểu tượng / Emoji
  badge               TEXT DEFAULT 'NỔI BẬT',         -- Huy hiệu (HOT, SÔI ĐỘNG, LIVE, SỰ KIỆN...)
  category            TEXT DEFAULT 'Hoạt động',       -- Chuyên mục
  action_type         TEXT DEFAULT 'event',           -- 'game' | 'video' | 'focus' | 'chat' | 'event'
  sort_order          INTEGER NOT NULL DEFAULT 0,     -- Thứ tự hiển thị (0..3)
  active              INTEGER NOT NULL DEFAULT 1,     -- 1: đang hiển thị, 0: tạm ẩn
  created_by          TEXT,                           -- Tên/khoá tài khoản giáo viên tạo
  updated_by          TEXT,                           -- Tên/khoá tài khoản giáo viên cập nhật cuối
  created_at          TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at          TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chc_active_order ON campus_highlight_curation(active, sort_order, id);

-- 2. BỔ SUNG CỘT HỒ SƠ TRÌNH BÀY CHO TÀI KHOẢN CAMPUS (SAFE PRESENTATION FIELDS)
-- Cho phép giáo viên cập nhật avatar và danh xưng/chức danh hiển thị an toàn mà không ảnh hưởng quyền bảo mật
ALTER TABLE tai_khoan_campus ADD COLUMN avatar TEXT;
ALTER TABLE tai_khoan_campus ADD COLUMN tieu_de_ho_so TEXT;
