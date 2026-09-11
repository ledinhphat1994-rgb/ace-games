-- Gamification Engine - Achievements, Streaks, Points, Leaderboards
-- Hệ thống gamification để tăng engagement học sinh

-- Bảng lưu achievements (thành tựu)
CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ma TEXT UNIQUE NOT NULL,                     -- Mã achievement (ví dụ: 'first_chat', 'streak_7')
  ten TEXT NOT NULL,                          -- Tên achievement
  mo_ta TEXT,                                 -- Mô tả
  icon TEXT,                                  -- Icon emoji
  diem INTEGER DEFAULT 0,                     -- Điểm thưởng
  loai TEXT DEFAULT 'basic',                   -- 'basic', 'rare', 'epic', 'legendary'
  dieu_kien TEXT,                             -- Điều kiện unlock (JSON)
  active INTEGER DEFAULT 1                     -- 0 = inactive, 1 = active
);

-- Bảng lưu achievement của từng học sinh
CREATE TABLE IF NOT EXISTS user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL,
  achievement_id INTEGER NOT NULL,
  ngay_moc TEXT DEFAULT CURRENT_TIMESTAMP,    -- Ngày unlock
  lop_id INTEGER DEFAULT 1,
  FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE(hoc_sinh_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_hoc_sinh_id ON user_achievements(hoc_sinh_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Bảng lưu streaks (chuỗi ngày hoạt động)
CREATE TABLE IF NOT EXISTS user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL,
  loai_streak TEXT NOT NULL,                  -- 'study', 'chat', 'game', 'attendance'
  streak_hien_tai INTEGER DEFAULT 0,          -- Streak hiện tại
  streak_lon_nhat INTEGER DEFAULT 0,          -- Streak dài nhất
  ngay_cuoi TEXT DEFAULT CURRENT_TIMESTAMP,   -- Ngày hoạt động cuối
  lop_id INTEGER DEFAULT 1,
  FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  UNIQUE(hoc_sinh_id, loai_streak)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_hoc_sinh_id ON user_streaks(hoc_sinh_id);

-- Bảng lưu điểm của học sinh
CREATE TABLE IF NOT EXISTS user_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL,
  diem_hien_tai INTEGER DEFAULT 0,            -- Điểm hiện tại
  diem_tong INTEGER DEFAULT 0,                -- Tổng điểm đã kiếm
  cap_do INTEGER DEFAULT 1,                    -- Cấp độ (level)
  lop_id INTEGER DEFAULT 1,
  FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  UNIQUE(hoc_sinh_id)
);

CREATE INDEX IF NOT EXISTS idx_user_points_hoc_sinh_id ON user_points(hoc_sinh_id);

-- Bảng lưu lịch sử hoạt động để tính điểm
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hoc_sinh_id INTEGER NOT NULL,
  loai_hoat_dong TEXT NOT NULL,               -- 'chat', 'study', 'game', 'watch_party', 'attendance'
  diem INTEGER DEFAULT 0,                     -- Điểm kiếm được
  mo_ta TEXT,                                 -- Mô tả hoạt động
  thoi_gian TEXT DEFAULT CURRENT_TIMESTAMP,
  lop_id INTEGER DEFAULT 1,
  FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_log_hoc_sinh_id ON activity_log(hoc_sinh_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_thoi_gian ON activity_log(thoi_gian);

-- Bảng lưu leaderboard (bảng xếp hạng)
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loai_bang TEXT NOT NULL,                    -- 'weekly_study', 'top_gamers', 'most_helpful', 'attendance_stars'
  hoc_sinh_id INTEGER NOT NULL,
  diem INTEGER DEFAULT 0,                     -- Điểm theo loại bảng
  hang INTEGER DEFAULT 0,                     -- Hạng
  tuan TEXT NOT NULL,                         -- Tuần (format: '2026-W37')
  lop_id INTEGER DEFAULT 1,
  FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh(id) ON DELETE CASCADE,
  UNIQUE(hoc_sinh_id, loai_bang, tuan)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_loai_bang ON leaderboard(loai_bang);
CREATE INDEX IF NOT EXISTS idx_leaderboard_tuan ON leaderboard(tuan);

-- Dữ liệu achievements mẫu
INSERT OR IGNORE INTO achievements (ma, ten, mo_ta, icon, diem, loai) VALUES
('first_chat', 'Lần đầu chào hỏi', 'Gửi tin nhắn đầu tiên trong phòng chat', '👋', 10, 'basic'),
('chat_master', 'Bậc thầy chat', 'Gửi 100 tin nhắn', '💬', 50, 'rare'),
('study_streak_3', '3 ngày học liên tiếp', 'Học tập 3 ngày liên tiếp', '📚', 30, 'basic'),
('study_streak_7', '7 ngày học liên tiếp', 'Học tập 7 ngày liên tiếp', '🔥', 100, 'epic'),
('study_streak_30', '30 ngày học liên tiếp', 'Học tập 30 ngày liên tiếp', '⭐', 500, 'legendary'),
('game_winner', 'Chiến thắng đầu tiên', 'Thắng ván game đầu tiên', '🏆', 25, 'basic'),
('game_master', 'Vua game caro', 'Thắng 10 ván caro', '🎮', 75, 'rare'),
('perfect_attendance', 'Điểm danh hoàn hảo', 'Điểm danh đầy đủ 1 tuần', '✅', 40, 'rare'),
('helpful_friend', 'Bạn hữu thiết', 'Nhận được 50 like từ bài đăng', '❤️', 60, 'epic'),
('night_owl', 'Cú đêm chăm học', 'Hoạt động sau 11h đêm 5 lần', '🦉', 35, 'rare'),
('early_bird', 'Chim sớm tinh anh', 'Hoạt động trước 6h sáng 5 lần', '🐦', 35, 'rare'),
('social_butterfly', 'Bướm xã hội', 'Tham gia 5 phòng hoạt động khác nhau', '🦋', 45, 'rare'),
('watch_party_host', 'Host watch party', 'Tạo phòng watch party đầu tiên', '🎬', 30, 'basic'),
('music_lover', 'Melomane', 'Tham gia 3 phòng music', '🎵', 40, 'rare');