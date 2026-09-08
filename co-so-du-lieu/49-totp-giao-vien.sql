-- Xác thực 2 lớp (TOTP — mã 6 số kiểu Google Authenticator) cho ĐĂNG NHẬP GIÁO VIÊN — lớp thứ 2
-- ngay trong chính bước đăng nhập bằng mã, độc lập với Cloudflare Access đã làm ở /api/gv/rieng.
-- totp_secret_cho: khoá TẠM lúc đang thiết lập, chưa xác nhận thì CHƯA bắt buộc nhập mã khi đăng
-- nhập (totp_secret vẫn NULL). totp_secret: khoá THẬT đang bật, có giá trị thì đăng nhập giáo
-- viên bắt buộc thêm mã 6 số đúng lớp đó mới vào được.
ALTER TABLE ma_dang_nhap ADD COLUMN totp_secret TEXT;
ALTER TABLE ma_dang_nhap ADD COLUMN totp_secret_cho TEXT;
