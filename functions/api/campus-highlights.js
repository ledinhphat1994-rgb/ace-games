// API Tổng hợp Tiêu Điểm Hoạt Động Digital Campus (Phase 4C Redesign & Privacy Hardening)
import { json, loi, layPhien } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    const isVerifiedTeacher = Boolean(phien?.role === 'teacher' && !phien?.teacherPending);
    const isLinkedStudent = Boolean(phien?.hocSinhId && phien?.lopId);
    const isSchoolMember = isVerifiedTeacher || isLinkedStudent;

    const highlights = [];
    const NHIP_HIEU_LUC = '-2 minutes';

    let topStreaks = [];
    let focusTongQuan = { soNguoi: 0, tenPhong: null };
    let gameDoiKhang = { soBan: 0, dangDau: 0 };
    const thongKe = { tongOnline: 0, tongPhong: 0 };

    // 1. GAME ARENA: Đếm số bàn Caro đang chơi/chờ
    try {
      const gameStats = await db.prepare(`
        SELECT COUNT(*) AS soBan,
               SUM(CASE WHEN trang_thai = 'dang_choi' THEN 1 ELSE 0 END) AS dangDau
        FROM game_phong
        WHERE trang_thai IN ('cho_nguoi', 'dang_choi')
          AND pham_vi = 'truong'
          AND datetime(cap_nhat_luc) > datetime('now', '-30 minutes')
      `).first();

      if (gameStats && Number(gameStats.soBan) > 0) {
        const soBan = Number(gameStats.soBan) || 0;
        const dangDau = Number(gameStats.dangDau) || 0;
        gameDoiKhang = { soBan, dangDau };

        const titleText = dangDau > 0
          ? `${dangDau} trận Caro đang đấu`
          : `${soBan} bàn Caro đang chờ`;

        highlights.push({
          id: 'arena-active',
          loai: 'game',
          bieuTuong: '🎮',
          icon: '🎮',
          tieuDe: titleText,
          title: titleText,
          chiTiet: 'Game · lúc này',
          sub: 'Game · lúc này',
          category: 'Game',
          badge: 'SÔI ĐỘNG',
          mauSac: 'cyan',
          hanhDong: 'vao_game',
        });
      }
    } catch {}

    // 2. TOP STREAK / THÀNH TÍCH CHUYÊN CẦN
    try {
      const rsStreak = await db.prepare(`
        SELECT COUNT(DISTINCT s.hoc_sinh_id) AS soHocSinh,
               MAX(s.streak_hien_tai) AS maxStreak
        FROM user_streaks s
        WHERE s.streak_hien_tai > 0
      `).first();

      if (rsStreak && Number(rsStreak.maxStreak) > 0) {
        const soHocSinh = Number(rsStreak.soHocSinh) || 0;
        const maxStreak = Number(rsStreak.maxStreak) || 0;
        topStreaks = [{ soHocSinh, maxStreak }];

        // Nếu là thành viên trường đã xác minh, thử lấy học sinh streak cao nhất
        let streakTitle = `Kỷ lục streak ${maxStreak} ngày`;
        if (isSchoolMember) {
          try {
            const topStudent = await db.prepare(`
              SELECT h.ho_ten AS ten, l.ten AS lopTen, s.streak_hien_tai AS streak
              FROM user_streaks s
              JOIN hoc_sinh h ON h.id = s.hoc_sinh_id
              JOIN lop l ON l.id = h.lop_id
              WHERE s.streak_hien_tai = ?1
              LIMIT 1
            `).bind(maxStreak).first();

            if (topStudent?.ten) {
              const tenRutGon = topStudent.ten.split(' ').slice(-2).join(' ');
              streakTitle = `${tenRutGon} (${topStudent.lopTen || 'Lớp'}) streak ${maxStreak} ngày`;
            }
          } catch {}
        }

        highlights.push({
          id: 'streak-summary',
          loai: 'streak',
          bieuTuong: '🔥',
          icon: '🔥',
          tieuDe: streakTitle,
          title: streakTitle,
          chiTiet: 'Thành tích chuyên cần',
          sub: 'Thành tích',
          category: 'Thành tích',
          badge: 'STREAK',
          mauSac: 'amber',
        });
      }
    } catch {}

    // 3. WATCH PARTY: Phòng xem chung đang có người
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

      if (watchStats && Number(watchStats.soNguoi) > 0) {
        const soNguoi = Number(watchStats.soNguoi) || 0;
        const watchTitle = `${soNguoi} bạn đang xem chung`;
        highlights.push({
          id: `watch-${watchStats.phongId}`,
          loai: 'video',
          bieuTuong: '🎬',
          icon: '🎬',
          tieuDe: watchTitle,
          title: watchTitle,
          chiTiet: 'Xem chung · lúc này',
          sub: 'Xem chung',
          category: 'Xem chung',
          badge: 'XEM CHUNG',
          mauSac: 'purple',
        });
      }
    } catch {}

    // 4. FOCUS ROOM: Phòng tự học / nghe nhạc
    try {
      const focusStats = await db.prepare(`
        SELECT COUNT(DISTINCT v.khoa) AS soNguoi, p.ten AS tenPhong, p.id AS phongId
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

      if (focusStats && Number(focusStats.soNguoi) > 0) {
        const soNguoi = Number(focusStats.soNguoi) || 0;
        focusTongQuan = { soNguoi, tenPhong: focusStats.tenPhong };
        const focusTitle = `${soNguoi} người đang Focus`;
        highlights.push({
          id: 'focus-active',
          loai: 'focus',
          bieuTuong: '📚',
          icon: '📚',
          tieuDe: focusTitle,
          title: focusTitle,
          chiTiet: 'Không gian tự học',
          sub: 'Tự học',
          category: 'Tự học',
          badge: 'FOCUS',
          mauSac: 'emerald',
        });
      }
    } catch {}

    // 5. SỰ KIỆN TOÀN TRƯỜNG (nếu còn chỗ dưới 4 items)
    if (highlights.length < 4) {
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
            icon: '⭐',
            tieuDe: sk.tieuDe,
            title: sk.tieuDe,
            chiTiet: dangDienRa ? 'Sự kiện đang diễn ra' : 'Sự kiện sắp diễn ra',
            sub: dangDienRa ? 'Đang diễn ra' : 'Sắp diễn ra',
            category: 'Sự kiện',
            badge: dangDienRa ? 'LIVE' : 'SỰ KIỆN',
            mauSac: 'amber',
          });
        }
      } catch {}
    }

    // Giới hạn tối đa 4 highlights theo đúng quy chuẩn Phase 4C
    const finalHighlights = highlights.slice(0, 4);

    // Tổng hợp số phòng toàn trường đang mở
    try {
      const rTongPhong = await db.prepare("SELECT COUNT(*) AS c FROM phong WHERE trang_thai = 'mo' AND pham_vi = 'truong'").first();
      thongKe.tongPhong = Number(rTongPhong?.c) || 0;
    } catch {}

    return json({
      ok: true,
      highlights: finalHighlights,
      topStreaks,
      topStreak: topStreaks,
      focusTongQuan,
      focusSummary: { soNguoiHoc: focusTongQuan.soNguoi, tenPhong: focusTongQuan.tenPhong },
      gameDoiKhang,
      activeGameArena: { soBanChoi: gameDoiKhang.soBan, dangDau: gameDoiKhang.dangDau },
      trendingRooms: finalHighlights.filter(h => h.loai === 'focus' || h.loai === 'video'),
      thongKe,
    });
  } catch (e) {
    console.error('campus-highlights GET error:', e);
    return loi('Không tải được tin nổi bật campus.', 500);
  }
}
