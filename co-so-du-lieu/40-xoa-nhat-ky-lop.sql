-- Bỏ hẳn chức năng "Nhật ký lớp" (khen thưởng/nhắc nhở/vi phạm/hỗ trợ) theo yêu cầu giáo viên —
-- không còn giao diện nào đọc/ghi bảng này nữa (xem giao-vien/app.js, functions/api/gv/*).
-- Xoá luôn dữ liệu đã ghi từ trước, không giữ lại.
DROP INDEX IF EXISTS idx_nhat_ky_ngay;
DROP TABLE IF EXISTS nhat_ky;
