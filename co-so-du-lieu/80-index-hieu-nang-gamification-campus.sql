-- Bổ sung index còn thiếu cho các truy vấn nóng phát hiện qua rà soát tối ưu tài nguyên
-- Cloudflare (09/2026). Chỉ thêm index, không đổi dữ liệu/schema hiện có — an toàn chạy trên
-- production đang có dữ liệu thật, không khoá bảng đáng kể (quy mô 1 lớp học).

-- functions/_lib/social.js: WHERE hoc_sinh_id = ?1 (tra tài khoản Campus theo học sinh liên kết)
CREATE INDEX IF NOT EXISTS idx_tkc_hoc_sinh_id ON tai_khoan_campus(hoc_sinh_id);

-- functions/api/campus-highlights.js: WHERE streak_hien_tai > 0 / = ?1 (poll mỗi 30s)
CREATE INDEX IF NOT EXISTS idx_user_streaks_streak_hien_tai ON user_streaks(streak_hien_tai);

-- functions/api/gamification.js: getLeaderboard() lọc theo cả 3 cột cùng lúc, và cập nhật hạng
-- (UPDATE ... WHERE loai_bang = ? AND tuan = ? AND lop_id = ?) — 2 index đơn lẻ sẵn có
-- (idx_leaderboard_loai_bang, idx_leaderboard_tuan) không phủ đúng hình dạng truy vấn này.
CREATE INDEX IF NOT EXISTS idx_leaderboard_bang_tuan_lop ON leaderboard(loai_bang, tuan, lop_id);

-- functions/api/gamification.js: WHERE hoc_sinh_id = ?1 AND lop_id = ?2 — lop_id chưa nằm trong
-- index nào của bảng này (chỉ có hoc_sinh_id và achievement_id riêng lẻ).
CREATE INDEX IF NOT EXISTS idx_user_achievements_hs_lop ON user_achievements(hoc_sinh_id, lop_id);
