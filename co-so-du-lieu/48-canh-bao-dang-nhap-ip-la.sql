-- Mở rộng nhật ký đăng nhập để ghi CẢ giáo viên và học sinh thường (trước đây chỉ ghi mã
-- ĐƯỢC CẤP quyền quản lý) — nhằm phát hiện "1 mã bị dùng từ IP lạ" mà KHÔNG chặn cứng theo IP
-- (mạng di động đổi IP liên tục, chặn cứng sẽ khoá nhầm học sinh dùng điện thoại/4G).
ALTER TABLE nhat_ky_dang_nhap ADD COLUMN vai_tro TEXT NOT NULL DEFAULT 'phu';
ALTER TABLE nhat_ky_dang_nhap ADD COLUMN canh_bao_ip INTEGER NOT NULL DEFAULT 0;
