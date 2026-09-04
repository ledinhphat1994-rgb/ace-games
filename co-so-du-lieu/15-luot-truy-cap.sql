-- Đếm lượt tải trang lớp công khai theo từng ngày — nền tảng cho tab "Tương tác" trong
-- Thống kê, sau này gộp thêm chat nhóm/chat cá nhân/trò chơi vào cùng một chỗ xem.
CREATE TABLE IF NOT EXISTS luot_truy_cap (
  ngay TEXT PRIMARY KEY,
  luot INTEGER NOT NULL DEFAULT 0
);
