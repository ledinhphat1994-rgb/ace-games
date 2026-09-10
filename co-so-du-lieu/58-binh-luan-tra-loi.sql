-- 58-binh-luan-tra-loi.sql
-- Thêm hỗ trợ phân cấp cha - con cho bình luận bài đăng (Nested Replies)
-- và cột lượt xem cho bảng thong_bao nếu chưa có

ALTER TABLE bai_dang_binh_luan ADD COLUMN tra_loi_id INTEGER DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_bd_bl_tra_loi ON bai_dang_binh_luan(tra_loi_id);

ALTER TABLE thong_bao ADD COLUMN luot_xem INTEGER NOT NULL DEFAULT 0;
