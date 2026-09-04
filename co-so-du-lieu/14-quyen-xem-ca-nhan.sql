-- Mỗi mã cá nhân có thể bị ẨN BỚT một vài mục — mặc định XEM HẾT (chuỗi rỗng), giáo viên
-- chỉ cần tích để ẩn mục nào đó với riêng em học sinh này. Danh sách mã mục hợp lệ:
--   quy (tiền quỹ), thong-bao (thông báo), thoi-khoa-bieu (thời khoá biểu),
--   diem-danh (chuyên cần), thong-ke (sổ điểm) — xem functions/_lib/ma.js: CAC_MUC_CA_NHAN.
ALTER TABLE ma_ca_nhan ADD COLUMN an_muc TEXT NOT NULL DEFAULT '';
