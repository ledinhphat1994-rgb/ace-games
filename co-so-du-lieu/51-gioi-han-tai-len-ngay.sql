-- Giới hạn dung lượng tải lên MỖI NGÀY cho TÀI KHOẢN ĐƯỢC CẤP QUYỀN (không áp dụng giáo viên
-- chủ nhiệm — không giới hạn) — gộp chung cả 3 thư viện (Ảnh/Âm thanh/Video), không giới hạn số
-- BÀI đăng ở Hoạt động lớp (chỉ giới hạn dung lượng file đính kèm nếu có). Mỗi lần tải lên thành
-- công ghi 1 dòng vào đây; cộng dồn theo (lop_id, danh_tinh, ngay) để biết còn tải thêm được
-- không — xem functions/_lib/thu-vien.js.
CREATE TABLE IF NOT EXISTS tai_len_theo_ngay (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  lop_id     INTEGER NOT NULL,
  danh_tinh  TEXT NOT NULL,   -- 'phu-<id tài khoản phụ>' hoặc 'hs-<id học sinh>' — AI tải lên,
                               -- ổn định dù sau này đổi mã (khác với dùng thẳng chuỗi mã).
  ngay       TEXT NOT NULL,   -- ngày giờ Việt Nam (UTC+7), dạng YYYY-MM-DD
  co_byte    INTEGER NOT NULL,
  tao_luc    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tltn_tra_cuu ON tai_len_theo_ngay (lop_id, danh_tinh, ngay);
