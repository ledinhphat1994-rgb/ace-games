-- Điểm khôi phục (checkpoint) của Thủ quỹ.
-- Trước MỖI lần ghi/sửa/xoá liên quan tới tiền, toàn bộ trạng thái quỹ hiện tại
-- (mọi khoản thu, mọi khoản đã đóng, mọi khoản chi) được chụp lại thành một bản ghi ở đây
-- TRƯỚC KHI áp dụng thay đổi. Nếu tài khoản bị chiếm và dữ liệu bị phá, giáo viên
-- khôi phục lại đúng bản chụp ngay trước lúc đó.
CREATE TABLE IF NOT EXISTS quy_checkpoint (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  hanh_dong   TEXT NOT NULL,             -- mô tả ngắn: "Trước khi: ghi thu 50.000đ cho..."
  nguoi_thuc_hien TEXT NOT NULL DEFAULT '', -- vai trò + tên người vừa thao tác
  du_lieu     TEXT NOT NULL,             -- JSON: { khoan:[...], dong:[...], chi:[...] }
  tao_luc     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quy_checkpoint_luc ON quy_checkpoint(tao_luc DESC);
