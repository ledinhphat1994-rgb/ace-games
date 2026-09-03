-- Thủ quỹ nâng cao: khoản thu định kỳ (theo tuần/tháng) + phân loại khoản chi.

-- Mẫu thu định kỳ, ví dụ "Quỹ lớp — 5.000đ/tuần". Hệ thống tự sinh từng kỳ
-- (mỗi tuần/tháng một khoản quy_khoan riêng) khi tới hạn, không cần giáo viên tạo tay.
CREATE TABLE IF NOT EXISTS quy_dinh_ky (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  ten            TEXT NOT NULL,
  chu_ky         TEXT NOT NULL DEFAULT 'tuan',   -- 'tuan' | 'thang'
  so_tien_moi_ky INTEGER NOT NULL,
  ngay_bat_dau   TEXT NOT NULL,                  -- mốc để tính kỳ 1, kỳ 2, ...
  dang_hoat_dong INTEGER NOT NULL DEFAULT 1,
  tao_luc        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mỗi khoản thu (quy_khoan) có thể thuộc về một mẫu định kỳ, ở đúng kỳ số mấy.
-- Khoản thu một lần bình thường thì hai cột này để trống (NULL).
ALTER TABLE quy_khoan ADD COLUMN dinh_ky_id INTEGER;
ALTER TABLE quy_khoan ADD COLUMN ky_so INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_quy_khoan_dinh_ky ON quy_khoan(dinh_ky_id, ky_so) WHERE dinh_ky_id IS NOT NULL;

-- Phân loại khoản chi, để xem "tiền chi cho hoạt động là bao nhiêu, văn phòng phẩm bao nhiêu...".
ALTER TABLE quy_chi ADD COLUMN loai TEXT NOT NULL DEFAULT 'khac';
