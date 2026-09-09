-- Nhiều bảng được thêm cột "lop_id" bằng ALTER TABLE ở migration 25 (chuyển sang đa lớp) nhưng
-- KHÔNG kèm index nào cho cột đó — trong khi hầu hết truy vấn ở /api/lop.js (trang chủ, route
-- đông người dùng nhất khi nhiều học sinh cùng vào lớp) đều lọc "WHERE lop_id = ?" kèm ORDER BY.
-- Thiếu index buộc SQLite quét toàn bảng rồi mới lọc/sắp xếp — càng chậm khi số lớp/số dòng dữ
-- liệu tăng lên theo thời gian. Thêm index composite khớp đúng WHERE + ORDER BY thực tế đang
-- dùng, không thêm thừa cột nào không cần.
CREATE INDEX IF NOT EXISTS idx_hoc_sinh_lop      ON hoc_sinh(lop_id, dang_hoc, so_thu_tu);
CREATE INDEX IF NOT EXISTS idx_thong_bao_lop     ON thong_bao(lop_id, hien, ghim, ngay);
CREATE INDEX IF NOT EXISTS idx_hoat_dong_lop_lop ON hoat_dong_lop(lop_id, ngay, id);
CREATE INDEX IF NOT EXISTS idx_quy_khoan_lop     ON quy_khoan(lop_id, tao_luc);
CREATE INDEX IF NOT EXISTS idx_quy_chi_lop       ON quy_chi(lop_id, ngay, id);
CREATE INDEX IF NOT EXISTS idx_quy_dong_lop      ON quy_dong(lop_id, khoan_id, hoc_sinh_id);
CREATE INDEX IF NOT EXISTS idx_tkb_pb_lop        ON tkb_phien_ban(lop_id, ngay_bat_dau);
CREATE INDEX IF NOT EXISTS idx_am_thanh_phat     ON am_thanh(lop_id, dang_phat, da_xoa_luc);
CREATE INDEX IF NOT EXISTS idx_hinh_anh_lop      ON hinh_anh(lop_id, da_xoa_luc);
CREATE INDEX IF NOT EXISTS idx_video_lop         ON video(lop_id, da_xoa_luc);
CREATE INDEX IF NOT EXISTS idx_diem_danh_lop     ON diem_danh(lop_id, ngay);
