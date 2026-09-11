// Gamification API - Achievements, Streaks, Points, Leaderboards
// QUAN TRỌNG: điểm/streak/huy hiệu CHỈ được ghi từ các sự kiện THẬT phía máy chủ
// (gửi chat thành công, thắng cờ, được điểm danh có mặt...) qua ghiNhanHoatDong().
// Không có endpoint public nào cho phép client tự khai hoạt động — trước đây POST
// /api/gamification nhận loaiHoatDong tuỳ ý nên học sinh có thể tự cộng điểm vô hạn.
import { bocXuLy, json } from '../_lib/api.js';

// Lấy gamification data của user hiện tại và bảng xếp hạng lớp
export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const lopId = phien?.lopId || 1;

  // Lấy danh sách tất cả achievements đang có
  const allAchievements = await env.DB.prepare(`
    SELECT id, ma, ten, mo_ta, icon, diem, loai
    FROM achievements
    WHERE active = 1
    ORDER BY diem ASC
  `).all().catch(() => ({ results: [] }));

  let userAchievements = { results: [] };
  let userStreaks = { results: [] };
  let userPoints = { diemHienTai: 0, diemTong: 0, capDo: 1 };

  if (phien?.hocSinhId) {
    // Lấy achievements của user
    userAchievements = await env.DB.prepare(`
      SELECT a.ma, a.ten, a.mo_ta, a.icon, a.diem, a.loai, ua.ngay_moc AS ngayMoc
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.hoc_sinh_id = ?1 AND ua.lop_id = ?2
      ORDER BY ua.ngay_moc DESC
    `).bind(phien.hocSinhId, lopId).all().catch(() => ({ results: [] }));

    // Lấy streaks của user
    userStreaks = await env.DB.prepare(`
      SELECT loai_streak AS loaiStreak, streak_hien_tai AS streakHienTai, streak_lon_nhat AS streakLonNhat, ngay_cuoi AS ngayCuoi
      FROM user_streaks
      WHERE hoc_sinh_id = ?1 AND lop_id = ?2
    `).bind(phien.hocSinhId, lopId).all().catch(() => ({ results: [] }));

    // Lấy điểm của user
    userPoints = await env.DB.prepare(`
      SELECT diem_hien_tai AS diemHienTai, diem_tong AS diemTong, cap_do AS capDo
      FROM user_points
      WHERE hoc_sinh_id = ?1 AND lop_id = ?2
    `).bind(phien.hocSinhId, lopId).first().catch(() => null) || { diemHienTai: 0, diemTong: 0, capDo: 1 };
  }

  // Lấy leaderboard
  const currentWeek = getWeekNumber(new Date());
  const leaderboards = {
    weeklyStudy: await getLeaderboard(env, 'weekly_study', currentWeek, lopId).catch(() => []),
    topGamers: await getLeaderboard(env, 'top_gamers', currentWeek, lopId).catch(() => []),
    mostHelpful: await getLeaderboard(env, 'most_helpful', currentWeek, lopId).catch(() => []),
    attendanceStars: await getLeaderboard(env, 'attendance_stars', currentWeek, lopId).catch(() => [])
  };

  return json({
    ok: true,
    allAchievements: allAchievements.results || [],
    achievements: userAchievements.results || [],
    streaks: userStreaks.results || [],
    points: userPoints,
    leaderboards
  });
}, { canGiaoVien: false });

// Điểm thưởng theo loại hoạt động — bảng tra duy nhất, loại lạ bị từ chối hẳn.
const DIEM_THEO_HOAT_DONG = {
  chat: 1,
  study: 5,
  game: 3,
  attendance: 2,
  helpful: 10,
};

// Ghi nhận MỘT hoạt động thật cho học sinh — chỉ được gọi từ code máy chủ sau khi
// sự kiện đã xảy ra thành công (vd tin nhắn đã lưu, ván cờ đã thắng). Trả về
// { diem, huyHieuMoi } hoặc null nếu loại hoạt động/học sinh không hợp lệ.
export async function ghiNhanHoatDong(env, { hocSinhId, lopId, loaiHoatDong, moTa = '', quaHuyHieu = true }) {
  const diem = DIEM_THEO_HOAT_DONG[loaiHoatDong];
  if (!diem || !hocSinhId || !lopId) return null;

  await env.DB.prepare(`
    INSERT INTO activity_log (hoc_sinh_id, loai_hoat_dong, diem, mo_ta, lop_id)
    VALUES (?1, ?2, ?3, ?4, ?5)
  `).bind(hocSinhId, loaiHoatDong, diem, moTa, lopId).run();

  await env.DB.prepare(`
    INSERT INTO user_points (hoc_sinh_id, diem_hien_tai, diem_tong, cap_do, lop_id)
    VALUES (?1, ?2, ?3, 1, ?4)
    ON CONFLICT(hoc_sinh_id) DO UPDATE SET
      diem_hien_tai = diem_hien_tai + ?2,
      diem_tong = diem_tong + ?3,
      cap_do = cap_do + CASE WHEN diem_hien_tai + ?2 >= cap_do * 100 THEN 1 ELSE 0 END
  `).bind(hocSinhId, diem, diem, lopId).run();

  await updateStreak(env, hocSinhId, loaiHoatDong, lopId);
  const huyHieuMoi = quaHuyHieu ? await checkAchievements(env, hocSinhId, lopId) : [];
  await updateLeaderboard(env, hocSinhId, loaiHoatDong, diem, lopId);

  return { diem, huyHieuMoi };
}

// Helper functions
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function getLeaderboard(env, loaiBang, tuan, lopId) {
  const result = await env.DB.prepare(`
    SELECT lb.hoc_sinh_id AS hocSinhId, lb.diem, lb.hang, hs.ho_ten AS hoTen
    FROM leaderboard lb
    JOIN hoc_sinh hs ON lb.hoc_sinh_id = hs.id
    WHERE lb.loai_bang = ?1 AND lb.tuan = ?2 AND lb.lop_id = ?3
    ORDER BY lb.hang ASC
    LIMIT 10
  `).bind(loaiBang, tuan, lopId).all();

  return result.results || [];
}

async function updateStreak(env, hocSinhId, loaiHoatDong, lopId) {
  const today = new Date().toISOString().split('T')[0];

  // Map activity types to streak types
  const streakTypeMap = {
    'chat': 'chat',
    'study': 'study',
    'game': 'game',
    'attendance': 'attendance'
  };

  const streakType = streakTypeMap[loaiHoatDong];
  if (!streakType) return;

  const currentStreak = await env.DB.prepare(`
    SELECT streak_hien_tai, ngay_cuoi FROM user_streaks
    WHERE hoc_sinh_id = ?1 AND loai_streak = ?2 AND lop_id = ?3
  `).bind(hocSinhId, streakType, lopId).first();

  if (!currentStreak) {
    // Tạo streak mới
    await env.DB.prepare(`
      INSERT INTO user_streaks (hoc_sinh_id, loai_streak, streak_hien_tai, streak_lon_nhat, ngay_cuoi, lop_id)
      VALUES (?1, ?2, 1, 1, ?3, ?4)
    `).bind(hocSinhId, streakType, today, lopId).run();
  } else {
    // Kiểm tra có phải ngày tiếp theo không
    const lastDate = new Date(currentStreak.ngay_cuoi);
    const currentDate = new Date(today);
    const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Ngày tiếp theo -> tăng streak
      const newStreak = currentStreak.streak_hien_tai + 1;
      await env.DB.prepare(`
        UPDATE user_streaks
        SET streak_hien_tai = ?1, streak_lon_nhat = MAX(streak_lon_nhat, ?1), ngay_cuoi = ?2
        WHERE hoc_sinh_id = ?3 AND loai_streak = ?4 AND lop_id = ?5
      `).bind(newStreak, today, hocSinhId, streakType, lopId).run();
    } else if (diffDays > 1) {
      // Reset streak
      await env.DB.prepare(`
        UPDATE user_streaks
        SET streak_hien_tai = 1, ngay_cuoi = ?1
        WHERE hoc_sinh_id = ?2 AND loai_streak = ?3 AND lop_id = ?4
      `).bind(today, hocSinhId, streakType, lopId).run();
    }
  }
}

async function checkAchievements(env, hocSinhId, lopId) {
  const newAchievements = [];

  // Kiểm tra từng achievement
  const achievements = await env.DB.prepare('SELECT * FROM achievements WHERE active = 1').all();

  for (const achievement of achievements.results || []) {
    // Kiểm tra user đã có achievement này chưa
    const hasAchievement = await env.DB.prepare(`
      SELECT 1 FROM user_achievements
      WHERE hoc_sinh_id = ?1 AND achievement_id = ?2
    `).bind(hocSinhId, achievement.id).first();

    if (hasAchievement) continue;

    // Kiểm tra điều kiện (simplified logic)
    let unlocked = false;

    switch (achievement.ma) {
      case 'first_chat': {
        const chatCount = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM activity_log
          WHERE hoc_sinh_id = ?1 AND loai_hoat_dong = 'chat'
        `).bind(hocSinhId).first();
        unlocked = chatCount.count >= 1;
        break;
      }
      case 'study_streak_7': {
        const studyStreak = await env.DB.prepare(`
          SELECT streak_hien_tai FROM user_streaks
          WHERE hoc_sinh_id = ?1 AND loai_streak = 'study'
        `).bind(hocSinhId).first();
        unlocked = studyStreak && studyStreak.streak_hien_tai >= 7;
        break;
      }
      // Add more achievement checks...
    }

    if (unlocked) {
      await env.DB.prepare(`
        INSERT INTO user_achievements (hoc_sinh_id, achievement_id, lop_id)
        VALUES (?1, ?2, ?3)
      `).bind(hocSinhId, achievement.id, lopId).run();

      newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

async function updateLeaderboard(env, hocSinhId, loaiHoatDong, diem, lopId) {
  const currentWeek = getWeekNumber(new Date());

  // Map activity types to leaderboard types
  const leaderboardMap = {
    'study': 'weekly_study',
    'game': 'top_gamers',
    'helpful': 'most_helpful',
    'attendance': 'attendance_stars'
  };

  const leaderboardType = leaderboardMap[loaiHoatDong];
  if (!leaderboardType) return;

  await env.DB.prepare(`
    INSERT INTO leaderboard (hoc_sinh_id, loai_bang, diem, tuan, lop_id)
    VALUES (?1, ?2, ?3, ?4, ?5)
    ON CONFLICT(hoc_sinh_id, loai_bang, tuan) DO UPDATE SET
      diem = diem + ?3
  `).bind(hocSinhId, leaderboardType, diem, currentWeek, lopId).run();

  // Recalculate ranks
  await env.DB.prepare(`
    UPDATE leaderboard
    SET hang = (
      SELECT COUNT(*) + 1
      FROM leaderboard lb2
      WHERE lb2.loai_bang = leaderboard.loai_bang
        AND lb2.tuan = leaderboard.tuan
        AND lb2.lop_id = leaderboard.lop_id
        AND lb2.diem > leaderboard.diem
    )
    WHERE loai_bang = ?1 AND tuan = ?2 AND lop_id = ?3
  `).bind(leaderboardType, currentWeek, lopId).run();
}
