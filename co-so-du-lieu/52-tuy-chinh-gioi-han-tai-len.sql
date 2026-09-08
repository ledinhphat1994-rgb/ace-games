-- Cho giáo viên tự chỉnh mức trần tải lên mỗi ngày của tài khoản được cấp quyền (mặc định 50MB,
-- hằng số GIOI_HAN_TAI_LEN_NGAY_PHU trong functions/_lib/thu-vien.js) — NULL = dùng mặc định.
ALTER TABLE lop ADD COLUMN gioi_han_tai_len_ngay_byte INTEGER;
