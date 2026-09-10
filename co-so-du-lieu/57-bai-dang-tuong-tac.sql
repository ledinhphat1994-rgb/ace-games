-- ==============================================================================
-- 57-bai-dang-tuong-tac.sql
-- Bảng tương tác cho bài đăng trên Trang chủ Cộng đồng (Twitter/X Communities style):
--   1. Cảm xúc (Reactions): Thích, Thả tim, Haha, Wow, Buồn, Phẫn nộ
--   2. Bình luận (Comments): Mọi học sinh và giáo viên trong lớp đều có thể bình luận
--   3. Lượt xem (Views): Thống kê lượt xem bài viết
-- ==============================================================================

-- 1. Bảng cảm xúc bài đăng
CREATE TABLE IF NOT EXISTS bai_dang_cam_xuc (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL DEFAULT 1,
  bai_dang_id     INTEGER NOT NULL,
  nguoi_dung_id   INTEGER NOT NULL,
  nguoi_dung_ten  TEXT NOT NULL,
  loai_cam_xuc    TEXT NOT NULL DEFAULT 'tim', -- 'thich', 'tim', 'haha', 'wow', 'buon', 'phan_no'
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bai_dang_id, nguoi_dung_id)
);
CREATE INDEX IF NOT EXISTS idx_bd_cam_xuc ON bai_dang_cam_xuc(bai_dang_id, lop_id);

-- 2. Bảng bình luận bài đăng
CREATE TABLE IF NOT EXISTS bai_dang_binh_luan (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id          INTEGER NOT NULL DEFAULT 1,
  bai_dang_id     INTEGER NOT NULL,
  nguoi_dung_id   INTEGER NOT NULL,
  nguoi_dung_ten  TEXT NOT NULL,
  vai_tro         TEXT NOT NULL DEFAULT 'hoc_sinh', -- 'giao_vien', 'can_bo', 'hoc_sinh'
  noi_dung        TEXT NOT NULL,
  tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bd_binh_luan ON bai_dang_binh_luan(bai_dang_id, lop_id, tao_luc);

-- 3. Bổ sung cột lượt xem cho bài hoạt động lớp (nếu chưa có)
-- Lưu ý: SQLite D1 hỗ trợ ADD COLUMN an toàn
ALTER TABLE hoat_dong_lop ADD COLUMN luot_xem INTEGER NOT NULL DEFAULT 0;
