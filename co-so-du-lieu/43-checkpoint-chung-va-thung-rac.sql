-- Mở rộng "Lịch sử & khôi phục" (đã có cho Thủ quỹ/Điểm danh) sang 6 chức năng còn lại có thể
-- cấp quyền cho tài khoản ngoài giáo viên (xem CAC_QUYEN ở functions/api/gv/tai-khoan-phu.js):
-- Thông báo, Thời khoá biểu, Hoạt động lớp dùng CHUNG một bảng checkpoint (cột "tinh_nang" phân
-- biệt) thay vì tạo riêng 3 bảng *_checkpoint gần như giống hệt nhau — xem
-- functions/_lib/checkpoint-chung.js.
CREATE TABLE IF NOT EXISTS checkpoint_chung (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  tinh_nang       TEXT NOT NULL,              -- 'thong-bao' | 'thoi-khoa-bieu' | 'hoat-dong-lop'
  hanh_dong       TEXT NOT NULL,              -- mô tả ngắn: "Trước khi: xoá thông báo #12"
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '',   -- vai trò + tên người vừa thao tác
  du_lieu         TEXT NOT NULL,              -- JSON: { <tên bảng>: [...] } — có thể nhiều bảng
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_checkpoint_chung_tra ON checkpoint_chung(lop_id, tinh_nang, id DESC);

-- Thư viện Ảnh/Âm thanh/Video: Xoá giờ là "chuyển vào thùng rác" (ẩn khỏi thư viện, GIỮ NGUYÊN
-- file thật trong R2) thay vì xoá thẳng — vì R2 xoá là mất vĩnh viễn, không có "khôi phục" nào
-- cứu lại được file thật đã mất. Thùng rác tự dọn sau 30 ngày (xem donDepThungRacHetHan() ở
-- functions/_lib/thu-vien.js), hoặc giáo viên tự bấm "Xoá vĩnh viễn" sớm hơn.
ALTER TABLE hinh_anh ADD COLUMN da_xoa_luc TEXT;
ALTER TABLE am_thanh ADD COLUMN da_xoa_luc TEXT;
ALTER TABLE video    ADD COLUMN da_xoa_luc TEXT;
CREATE INDEX IF NOT EXISTS idx_hinh_anh_rac ON hinh_anh(lop_id, da_xoa_luc);
CREATE INDEX IF NOT EXISTS idx_am_thanh_rac ON am_thanh(lop_id, da_xoa_luc);
CREATE INDEX IF NOT EXISTS idx_video_rac ON video(lop_id, da_xoa_luc);
