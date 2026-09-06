-- Nhập danh sách 30 học sinh thật của Lớp 11A1 (Phân hiệu 2)
-- Thay thế 2 học sinh thử nghiệm ban đầu (id 38, 39).

DELETE FROM ma_ca_nhan WHERE lop_id = 2;
DELETE FROM theo_doi WHERE lop_id = 2;
DELETE FROM diem_danh WHERE lop_id = 2;
DELETE FROM diem WHERE lop_id = 2;
DELETE FROM nhat_ky WHERE lop_id = 2;
DELETE FROM ren_luyen WHERE lop_id = 2;
DELETE FROM quy_dong WHERE lop_id = 2;
DELETE FROM tai_khoan_phu WHERE lop_id = 2;
DELETE FROM hoc_sinh WHERE lop_id = 2;

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (38, 2, 1, 'Nguyễn Trâm Anh', 'Nữ', '2010-09-28', '0366498385', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (38, 'TEARMK', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (39, 2, 2, 'Phu Quốc Anh', 'Nam', '2010-03-31', '0378715878', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (39, '37WFWH', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (40, 2, 3, 'Nông Thiên Ân', 'Nam', '2010-11-09', '0377456329', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (40, 'EBAJ8M', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (41, 2, 4, 'K'' Bình', 'Nam', '2009-08-15', '0367634998', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (41, 'HU8RM7', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (42, 2, 5, 'Tài Lê Bình', 'Nam', '2010-04-23', '0973366532', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (42, '78QVQV', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (43, 2, 6, 'Lý Mỹ Đình', 'Nữ', '2010-04-07', '0367731746', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (43, 'TV7TNB', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (44, 2, 7, 'Mai Thanh Hằng', 'Nữ', '2010-04-05', '0868745152', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (44, '99BBHX', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (45, 2, 8, 'Chiều Minh Hiếu', 'Nam', '2010-06-06', '0919546950', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (45, '38F9PX', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (46, 2, 9, 'Huỳnh Thị Ngọc Huyền', 'Nữ', '2009-07-27', '0399264038', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (46, 'P8U96J', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (47, 2, 10, 'Gịp Gia Khang', 'Nam', '2009-12-26', '0931457268', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (47, 'KFWXJ4', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (48, 2, 11, 'Lã Thị Tường Lam', 'Nữ', '2010-07-31', '0981130728', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (48, 'JRJHUH', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (49, 2, 12, 'Nông Tuyết Mai', 'Nữ', '2010-06-16', '0984317933', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (49, 'P8A6QU', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (50, 2, 13, 'Vày Ngọc Minh', 'Nam', '2009-12-28', '0989723924', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (50, 'T68BMU', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (51, 2, 14, 'Nguyễn Thị Bích Ngân', 'Nữ', '2010-03-20', '0348248728', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (51, 'FVXJYV', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (52, 2, 15, 'Trần Hữu Nghĩa', 'Nam', '2010-06-05', '0937364509', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (52, 'MM4NCX', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (53, 2, 16, 'Trần Mỹ Ngọc', 'Nữ', '2009-04-04', '0378057334', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (53, 'EXKTVA', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (54, 2, 17, 'Đỗ Thị Thanh Nhã', 'Nữ', '2010-03-09', '0914087172', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (54, '3FM3B3', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (55, 2, 18, 'K'' Nhật', 'Nam', '2010-10-20', '0364953940', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (55, 'G8VF3U', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (56, 2, 19, 'Phạm Lâm Minh Nhật', 'Nam', '2010-08-14', '0382763091', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (56, 'PDKMCQ', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (57, 2, 20, 'Ngô Uyển Nhi', 'Nữ', '2010-02-20', '0789994444', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (57, 'WMVCBW', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (58, 2, 21, 'Nguyễn Quỳnh Như', 'Nữ', '2010-05-17', '0387919926', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (58, '3QYJHJ', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (59, 2, 22, 'Lâm Phạm Nhật Tiên', 'Nữ', '2010-02-28', '0779315564', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (59, 'TT4EWU', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (60, 2, 23, 'Nguyễn Dương Bảo Trà', 'Nữ', '2010-03-16', '0368992664', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (60, 'YTYGC4', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (61, 2, 24, 'Lăng Khâm Ngọc Trâm', 'Nữ', '2010-03-23', '0389909598', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (61, 'HFDQ9M', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (62, 2, 25, 'Lưu Bảo Trân', 'Nữ', '2010-12-20', '0989737237', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (62, '3XP6NB', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (63, 2, 26, 'Trần Hoa Trinh', 'Nữ', '2010-04-18', '0386266686', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (63, 'FTHGQK', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (64, 2, 27, 'Nguyễn Trung Hiếu', 'Nam', '2007-05-21', '', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (64, 'H978KQ', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (65, 2, 28, 'Nguyễn Duy Tân', 'Nam', '2008-03-25', '', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (65, 'DQV3ME', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (66, 2, 29, 'Nguyễn Thị Thảo Uyên', 'Nữ', '2009-02-26', '', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (66, 'J38R73', 2);

INSERT INTO hoc_sinh (id, lop_id, so_thu_tu, ho_ten, gioi_tinh, ngay_sinh, dien_thoai_ph, to_hop, dang_hoc)
  VALUES (67, 2, 30, 'Hoàng Ngọc Bảo Long', 'Nam', '2009-07-03', '', '11A1-PH2', 1);
INSERT INTO ma_ca_nhan (hoc_sinh_id, ma, lop_id)
  VALUES (67, 'VDETAX', 2);

