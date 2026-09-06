-- Hoàn tất việc đưa toàn bộ dữ liệu sang mô hình đa lớp (tiếp theo migration 23, 24).
--
-- "ma_dang_nhap" và "luot_truy_cap" phải REBUILD vì đổi khoá chính (ALTER ADD COLUMN không
-- đổi được khoá chính) — mỗi lớp cần mã đăng nhập riêng và bộ đếm lượt truy cập riêng. Cả hai
-- đều là bảng "lá" (không bảng nào khác tham chiếu khoá ngoại tới chúng) nên rebuild an toàn.
CREATE TABLE ma_dang_nhap_moi (
  lop_id       INTEGER NOT NULL DEFAULT 1,
  vai_tro      TEXT NOT NULL,
  ma           TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lop_id, vai_tro)
);
INSERT INTO ma_dang_nhap_moi (lop_id, vai_tro, ma, cap_nhat_luc)
  SELECT 1, vai_tro, ma, cap_nhat_luc FROM ma_dang_nhap;
DROP TABLE ma_dang_nhap;
ALTER TABLE ma_dang_nhap_moi RENAME TO ma_dang_nhap;

CREATE TABLE luot_truy_cap_moi (
  lop_id INTEGER NOT NULL DEFAULT 1,
  ngay   TEXT NOT NULL,
  luot   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lop_id, ngay)
);
INSERT INTO luot_truy_cap_moi (lop_id, ngay, luot) SELECT 1, ngay, luot FROM luot_truy_cap;
DROP TABLE luot_truy_cap;
ALTER TABLE luot_truy_cap_moi RENAME TO luot_truy_cap;

-- Các bảng còn lại chỉ cần thêm cột lop_id (không đổi khoá chính) — toàn bộ dữ liệu hiện có
-- backfill về lop_id = 1 (lớp 10A7), nhờ DEFAULT 1. Không khai báo REFERENCES lop(id) ở đây vì
-- SQLite không cho ADD COLUMN có REFERENCES kèm giá trị mặc định khác NULL — việc cô lập dữ
-- liệu giữa các lớp do TẦNG ỨNG DỤNG lọc lop_id ở mọi truy vấn đảm nhiệm.
ALTER TABLE diem_danh          ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nhat_ky            ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE thong_bao          ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE ke_hoach           ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE theo_doi           ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE diem               ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE ren_luyen           ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE ma_ca_nhan          ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE hinh_anh            ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE am_thanh            ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE video               ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quy_khoan           ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quy_dong            ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quy_chi             ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quy_checkpoint      ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE quy_dinh_ky         ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tai_khoan_phu       ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tkb_phien_ban       ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tkb_o               ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE lien_he_phu_huynh   ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nhat_ky_truy_cap    ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nhat_ky_dang_nhap   ADD COLUMN lop_id INTEGER NOT NULL DEFAULT 1;
