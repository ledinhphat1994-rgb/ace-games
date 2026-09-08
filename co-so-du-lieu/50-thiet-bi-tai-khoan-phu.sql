-- Ràng buộc "1 mã = 1 thiết bị" cho TÀI KHOẢN ĐẶC BIỆT/tài khoản phụ (lớp trưởng, thủ quỹ,
-- quản trị viên ngoài lớp...) — trước đây CHỈ mã cá nhân học sinh được cấp quyền có ràng buộc
-- này (cột ma_ca_nhan.thiet_bi), tài khoản đặc biệt đăng nhập được từ bao nhiêu máy cũng được,
-- không đồng bộ. Ý nghĩa giống hệt ma_ca_nhan.thiet_bi: NULL = chưa gắn máy nào.
ALTER TABLE tai_khoan_phu ADD COLUMN thiet_bi TEXT;
