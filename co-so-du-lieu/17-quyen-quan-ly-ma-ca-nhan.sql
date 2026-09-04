-- Cho phép một mã cá nhân ĐƯỢC CẤP quyền quản lý (như tài khoản phụ) — gộp "quyền xem"
-- (an_muc, đã có) và "quyền quản lý" (quyen, mới) vào cùng một mã, thay vì phải tạo thêm
-- một tài khoản phụ riêng. quyen dùng chung danh mục CAC_QUYEN với tai_khoan_phu.
ALTER TABLE ma_ca_nhan ADD COLUMN quyen TEXT NOT NULL DEFAULT '';

-- Ràng buộc 1 mã = 1 thiết bị cho các mã ĐƯỢC CẤP QUYỀN quản lý (không áp dụng cho học sinh
-- thường chỉ tra cứu điểm — không có gì để mất nếu tra cứu từ nhiều máy). thiet_bi lưu một
-- mã ngẫu nhiên gắn vào cookie máy đầu tiên đăng nhập; NULL nghĩa là chưa gắn máy nào.
ALTER TABLE ma_ca_nhan ADD COLUMN thiet_bi TEXT;

-- Nhật ký đăng nhập — CHỈ GHI, không có API xoá cho tài khoản phụ/mã cá nhân (đề phòng mã
-- bị chiếm quyền rồi xoá dấu vết). Giáo viên xem để biết ai đăng nhập lúc nào, từ đâu.
CREATE TABLE IF NOT EXISTS nhat_ky_dang_nhap (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ma TEXT NOT NULL,
  hoc_sinh_id INTEGER,
  ket_qua TEXT NOT NULL,        -- 'thanh_cong' | 'sai_thiet_bi' | 'khoa'
  ip TEXT,
  thoi_diem TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_nkdn_thoi_diem ON nhat_ky_dang_nhap (thoi_diem);
