// API Tổng hợp Tiêu Điểm Hoạt Động Digital Campus
import { json, loi } from '../_lib/api.js';

export async function onRequestGet({ env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const highlights = [];
    const NHIP_HIEU_LUC = '-2 minutes';

    let topStreaks = [];
    let focusTongQuan = { soNguoi: 0, tenPhong: null };
    let gameDoiKhang = { soBan: 0, dangDau: 0 };
    const thongKe = { tongOnline: 0, tongPhong: 0 };

    // 1. TOP STREAK: Học sinh có chuỗi chuyên cần / sinh hoạt cao nhất
    try {
      const rsStreak = await db.prepare(`
        SELECT us.streak_hien_tai AS streak, hs.ho_ten AS hoTen
        FROM hoc_sinh_streak us
        JOIN hoc_sinh hs ON hs.id = us.hoc_sinh_id
        WHERE us.streak_hien_tai > 0
        ORDER BY us.streak_hien_tai DESC
        LIMIT 3
      `).all();

      if (rsStreak.results && rsStreak.results.length > 0) {
        topStreaks = rsStreak.results;
        for (const s of rsStreak.results) {
          highlights.push({
            id: `streak-${s.hoTen}-${s.streak}`,
            loai: 'streak',
            bieuTuong: '🔥',
            tieuDe: `${s.hoTen} đạt chuỗi ${s.streak} ngày`,
            chiTiet: 'Hoạt động & chuyên cần xuất sắc liên tục',
            badge: 'STREAK CAO',
            mauSac: 'amber'
          });
        }
      }
    } catch {
      // bỏ qua nếu bảng chưa có dữ liệu
    }

    // 2. ARENA GAME: Đếm số bàn cờ Caro / Game đang mở hoặc đang thi đấu
    try {
      const gameStats = await db.prepare(`
        SELECT COUNT(*) AS soBan,
               SUM(CASE WHEN trang_thai = 'playing' THEN 1 ELSE 0 END) AS dangDau
        FROM game_phong
        WHERE trang_thai IN ('waiting', 'playing')
          AND datetime(cap_nhat_luc) > datetime('now', '-30 minutes')
      `).first();

      if (gameStats && gameStats.soBan > 0) {
        gameDoiKhang = {
          soBan: Number(gameStats.soBan) || 0,
          dangDau: Number(gameStats.dangDau) || 0
        };
        highlights.push({
          id: 'arena-active',
          loai: 'game',
          bieuTuong: '🎮',
          tieuDe: `Arena Game có ${gameStats.soBan} bàn hoạt động`,
          chiTiet: `${gameStats.dangDau || 0} trận đang so tài kịch tính`,
          badge: 'SÔI ĐỘNG',
          mauSac: 'cyan',
          hanhDong: 'vao_game'
        });
      }
    } catch {
      // bỏ qua
    }

    // 3. FOCUS STUDY STATS: Đếm số học sinh đang trong phòng tự học
    try {
      const focusStats = await db.prepare(`
        SELECT COUNT(DISTINCT v.khoa) AS soNguoi, p.ten AS tenPhong
        FROM phong_thanh_vien v
        JOIN phong p ON p.id = v.phong_id
        WHERE p.trang_thai = 'mo'
          AND p.loai IN ('focus', 'nhac')
          AND datetime(v.hoat_dong_luc) > datetime('now', ?1)
        GROUP BY p.id
        ORDER BY soNguoi DESC
        LIMIT 1
      `).bind(NHIP_HIEU_LUC).first();

      if (focusStats && focusStats.soNguoi > 0) {
        focusTongQuan = {
          soNguoi: Number(focusStats.soNguoi) || 0,
          tenPhong: focusStats.tenPhong
        };
        highlights.push({
          id: 'focus-active',
          loai: 'focus',
          bieuTuong: '📚',
          tieuDe: `${focusStats.soNguoi} học sinh đang trong Focus Room`,
          chiTiet: `Phòng "${focusStats.tenPhong}" đang tập trung cao độ`,
          badge: 'CHĂM HỌC',
          mauSac: 'emerald'
        });
      }
    } catch {
      // bỏ qua
    }

    // 4. TRENDING WATCH ROOM: Phòng xem chung đông nhất
    try {
      const watchStats = await db.prepare(`
        SELECT COUNT(DISTINCT v.khoa) AS soNguoi, p.ten AS tenPhong, p.id AS phongId
        FROM phong_thanh_vien v
        JOIN phong p ON p.id = v.phong_id
        WHERE p.trang_thai = 'mo'
          AND p.loai = 'video'
          AND datetime(v.hoat_dong_luc) > datetime('now', ?1)
        GROUP BY p.id
        ORDER BY soNguoi DESC
        LIMIT 1
      `).bind(NHIP_HIEU_LUC).first();

      if (watchStats && watchStats.soNguoi > 0) {
        highlights.push({
          id: `watch-${watchStats.phongId}`,
          loai: 'video',
          bieuTuong: '🎬',
          tieuDe: `Xem chung "${watchStats.tenPhong}"`,
          chiTiet: `${watchStats.soNguoi} bạn đang cùng theo dõi video`,
          badge: 'HOT TREND',
          mauSac: 'purple'
        });
      }
    } catch {
      // bỏ qua
    }

    // 5. UPCOMING / ACTIVE EVENT
    try {
      const sk = await db.prepare(`
        SELECT id, tieu_de AS tieuDe, loai, bat_dau_luc AS batDauLuc, ket_thuc_luc AS ketThucLuc
        FROM su_kien_campus
        WHERE ket_thuc_luc > datetime('now')
        ORDER BY bat_dau_luc ASC
        LIMIT 1
      `).first();

      if (sk) {
        const bayGio = Date.now();
        const bd = Date.parse(sk.batDauLuc);
        const kt = Date.parse(sk.ketThucLuc);
        const dangDienRa = bayGio >= bd && bayGio <= kt;
        highlights.push({
          id: `event-${sk.id}`,
          loai: 'event',
          bieuTuong: '⭐',
          tieuDe: sk.tieuDe,
          chiTiet: dangDienRa ? 'Đang diễn ra trực tiếp toàn trường' : 'Sự kiện đặc biệt sắp bắt đầu',
          badge: dangDienRa ? 'LIVE' : 'SẮP DIỄN RA',
          mauSac: 'amber'
        });
      }
    } catch {
      // bỏ qua
    }

    // Tổng hợp thống kê
    try {
      const rTongPhong = await db.prepare("SELECT COUNT(*) AS c FROM phong WHERE trang_thai = 'mo'").first();
      thongKe.tongPhong = Number(rTongPhong?.c) || 0;
    } catch {
      // bỏ qua
    }

    return json({
      ok: true,
      highlights,
      topStreaks,
      focusTongQuan,
      gameDoiKhang,
      thongKe
    });
  } catch (e) {
    console.error('campus-highlights GET error:', e);
    return loi('Không tải được tin nổi bật campus.', 500);
  }
}
