// API Tổng hợp Tiêu Điểm Hoạt Động Digital Campus (Phase 4A.1 Privacy Hardening)
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

    // 1. TOP STREAK: Thống kê số lượng học sinh có chuỗi chuyên cần (PRIVACY: Không lộ họ tên/ID học sinh)
    try {
      const rsStreak = await db.prepare(`
        SELECT COUNT(DISTINCT hoc_sinh_id) AS soHocSinh, MAX(streak_hien_tai) AS maxStreak
        FROM user_streaks
        WHERE streak_hien_tai > 0
      `).first();

      if (rsStreak && rsStreak.soHocSinh > 0) {
        const soHocSinh = Number(rsStreak.soHocSinh) || 0;
        const maxStreak = Number(rsStreak.maxStreak) || 0;
        topStreaks = [{ soHocSinh, maxStreak }];

        highlights.push({
          id: 'streak-summary',
          loai: 'streak',
          bieuTuong: '🔥',
          tieuDe: `${soHocSinh} học sinh duy trì chuỗi học tập tốt`,
          chiTiet: `Kỷ lục hiện tại: ${maxStreak} ngày chuyên cần liên tục`,
          badge: 'STREAK NỔI BẬT',
          mauSac: 'amber'
        });
      }
    } catch {
      // bỏ qua nếu bảng chưa có dữ liệu
    }

    // 2. ARENA GAME: Đếm số bàn cờ Caro phạm vi TOÀN TRƯỜNG theo trạng thái thực tế ('cho_nguoi', 'dang_choi')
    try {
      const gameStats = await db.prepare(`
        SELECT COUNT(*) AS soBan,
               SUM(CASE WHEN trang_thai = 'dang_choi' THEN 1 ELSE 0 END) AS dangDau
        FROM game_phong
        WHERE trang_thai IN ('cho_nguoi', 'dang_choi')
          AND pham_vi = 'truong'
          AND datetime(cap_nhat_luc) > datetime('now', '-30 minutes')
      `).first();

      if (gameStats && gameStats.soBan > 0) {
        const soBan = Number(gameStats.soBan) || 0;
        const dangDau = Number(gameStats.dangDau) || 0;
        gameDoiKhang = { soBan, dangDau };

        highlights.push({
          id: 'arena-active',
          loai: 'game',
          bieuTuong: '🎮',
          tieuDe: `Đấu trường Game có ${soBan} bàn mở toàn trường`,
          chiTiet: `${dangDau} trận cờ Caro đang so tài kịch tính`,
          badge: 'SÔI ĐỘNG',
          mauSac: 'cyan',
          hanhDong: 'vao_game'
        });
      }
    } catch {
      // bỏ qua
    }

    // 3. FOCUS STUDY STATS: Đếm số người trong phòng tự học TOÀN TRƯỜNG (pham_vi = 'truong')
    try {
      const focusStats = await db.prepare(`
        SELECT COUNT(DISTINCT v.khoa) AS soNguoi, p.ten AS tenPhong
        FROM phong_thanh_vien v
        JOIN phong p ON p.id = v.phong_id
        WHERE p.trang_thai = 'mo'
          AND p.pham_vi = 'truong'
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
          tieuDe: `${focusStats.soNguoi} người trong Focus Room`,
          chiTiet: `Không gian "${focusStats.tenPhong}" mở toàn trường`,
          badge: 'CHĂM HỌC',
          mauSac: 'emerald'
        });
      }
    } catch {
      // bỏ qua
    }

    // 4. TRENDING WATCH ROOM: Phòng xem chung TOÀN TRƯỜNG đông nhất (pham_vi = 'truong')
    try {
      const watchStats = await db.prepare(`
        SELECT COUNT(DISTINCT v.khoa) AS soNguoi, p.ten AS tenPhong, p.id AS phongId
        FROM phong_thanh_vien v
        JOIN phong p ON p.id = v.phong_id
        WHERE p.trang_thai = 'mo'
          AND p.pham_vi = 'truong'
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
          chiTiet: `${watchStats.soNguoi} bạn đang cùng theo dõi video toàn trường`,
          badge: 'HOT TREND',
          mauSac: 'purple'
        });
      }
    } catch {
      // bỏ qua
    }

    // 5. UPCOMING / ACTIVE EVENT TOÀN TRƯỜNG
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

    // Tổng hợp số phòng toàn trường đang mở
    try {
      const rTongPhong = await db.prepare("SELECT COUNT(*) AS c FROM phong WHERE trang_thai = 'mo' AND pham_vi = 'truong'").first();
      thongKe.tongPhong = Number(rTongPhong?.c) || 0;
    } catch {
      // bỏ qua
    }

    return json({
      ok: true,
      highlights,
      topStreaks,
      topStreak: topStreaks,
      focusTongQuan,
      focusSummary: { soNguoiHoc: focusTongQuan.soNguoi, tenPhong: focusTongQuan.tenPhong },
      gameDoiKhang,
      activeGameArena: { soBanChoi: gameDoiKhang.soBan, dangDau: gameDoiKhang.dangDau },
      trendingRooms: highlights.filter(h => h.loai === 'focus' || h.loai === 'video'),
      thongKe
    });
  } catch (e) {
    console.error('campus-highlights GET error:', e);
    return loi('Không tải được tin nổi bật campus.', 500);
  }
}
