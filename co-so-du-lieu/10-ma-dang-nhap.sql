-- Mã đăng nhập của lớp (học sinh) và của giáo viên chủ nhiệm.
-- Ban đầu hai mã này là biến môi trường CLASS_CODE/TEACHER_CODE trên Cloudflare —
-- chỉ đổi được qua dashboard. Bảng này cho phép đổi NGAY TRÊN WEB.
--
-- Nếu bảng KHÔNG có dòng nào cho một vai trò, hệ thống dùng biến môi trường cũ
-- (không phá vỡ mã đang dùng). Ngay khi giáo viên đặt mã mới qua web, dòng tương ứng
-- được tạo và có hiệu lực ngay — không cần deploy lại.
CREATE TABLE IF NOT EXISTS ma_dang_nhap (
  vai_tro     TEXT PRIMARY KEY,      -- 'student' | 'teacher'
  ma          TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now'))
);
