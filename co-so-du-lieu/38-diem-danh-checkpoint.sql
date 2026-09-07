-- Điểm khôi phục (checkpoint) của Điểm danh — y hệt cơ chế đã có cho Thủ quỹ
-- (xem 07-quy-checkpoint.sql). Trước MỖI lần lưu điểm danh, toàn bộ bản ghi điểm danh hiện
-- tại CỦA ĐÚNG LỚP được chụp lại thành một dòng ở đây TRƯỚC KHI áp dụng thay đổi. Nếu ghi
-- nhầm hoặc tài khoản bị chiếm, giáo viên khôi phục lại đúng bản chụp ngay trước lúc đó.
CREATE TABLE IF NOT EXISTS diem_danh_checkpoint (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  hanh_dong       TEXT NOT NULL,             -- mô tả ngắn: "Trước khi: ghi điểm danh Sáng ngày..."
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '',  -- vai trò + tên người vừa thao tác
  du_lieu         TEXT NOT NULL,             -- JSON: { diemDanh:[...] }
  lop_id          INTEGER NOT NULL DEFAULT 1 REFERENCES lop(id),
  tao_luc         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_diem_danh_checkpoint_luc ON diem_danh_checkpoint(lop_id, tao_luc DESC);
