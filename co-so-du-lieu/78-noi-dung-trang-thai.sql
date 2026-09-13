-- ==============================================================================
-- 78-noi-dung-trang-thai.sql
-- Admin IA v1 Phase 4 — domain Nội dung (đổi tên từ Bảng Tin): thêm trạng thái
-- Nháp / Đã xuất bản / Đã lưu trữ cho thông báo. Tương thích ngược: DEFAULT
-- 'xuat_ban' áp cho mọi dòng cũ — dữ liệu hiện có coi như đã xuất bản, không
-- có thông báo nào bỗng dưng "biến mất" khỏi trang lớp sau migration.
-- ==============================================================================
ALTER TABLE thong_bao ADD COLUMN trang_thai TEXT NOT NULL DEFAULT 'xuat_ban';
