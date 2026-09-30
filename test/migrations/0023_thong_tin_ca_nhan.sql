-- 0023_thong_tin_ca_nhan.sql
-- Bổ sung các trường thông tin cá nhân cho tai_khoan_campus: ngày sinh, nơi sinh sống, SĐT, sở thích.

ALTER TABLE tai_khoan_campus ADD COLUMN ngay_sinh TEXT;
ALTER TABLE tai_khoan_campus ADD COLUMN noi_sinh_song TEXT;
ALTER TABLE tai_khoan_campus ADD COLUMN sdt_lien_he TEXT;
ALTER TABLE tai_khoan_campus ADD COLUMN so_thich TEXT;
