-- Thùng rác 3 thư viện (xem 43-checkpoint-chung-va-thung-rac.sql) mới chỉ ghi LÚC xoá
-- (da_xoa_luc), chưa ghi AI xoá và VÌ SAO xoá — không đủ để tra soát khi có sự cố.
-- Thêm 2 cột: xoa_boi (vai trò + tên người xoá, xem taChuThich() ở
-- functions/_lib/quy-checkpoint.js) và ly_do_xoa (tự nhập, không bắt buộc).
ALTER TABLE hinh_anh ADD COLUMN xoa_boi TEXT;
ALTER TABLE hinh_anh ADD COLUMN ly_do_xoa TEXT;
ALTER TABLE am_thanh ADD COLUMN xoa_boi TEXT;
ALTER TABLE am_thanh ADD COLUMN ly_do_xoa TEXT;
ALTER TABLE video    ADD COLUMN xoa_boi TEXT;
ALTER TABLE video    ADD COLUMN ly_do_xoa TEXT;
