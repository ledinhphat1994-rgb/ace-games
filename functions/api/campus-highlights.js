// API Tổng hợp & Xuất bản Tiêu Điểm Hoạt Động Digital Campus (Phase 4C & Server-Persisted Curation)
import { json, loi, layPhien } from '../_lib/api.js';


export async function onRequestGet({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    const isVerifiedTeacher = Boolean(phien?.role === 'teacher' && !phien?.teacherPending);
    const isLinkedStudent = Boolean((phien?.hocSinhId || phien?.role === 'student') && phien?.lopId);
    const isCampusAccount = Boolean(phien?.accountId);
    const isSchoolMember = isVerifiedTeacher || isLinkedStudent || isCampusAccount;

    const highlights = [];
    const NHIP_HIEU_LUC = '-2 minutes';

    let topStreaks = [];
    let focusTongQuan = { soNguoi: 0, tenPhong: null };
    let watchTongQuan = { soNguoi: 0, tenPhong: null, phongId: null };
    let gameDoiKhang = { soBan: 0, dangDau: 0 };
    const thongKe = { tongOnline: 0, tongPhong: 0 };

    // 0-4. Curation + 4 thống kê tổng hợp + đếm phòng — độc lập nhau, chạy song song bằng
    // Promise.all thay vì nối đuôi tuần tự (mẫu đã áp dụng ở functions/api/lop.js), mỗi câu tự
    // .catch() về giá trị mặc định y hệt nhánh try/catch cũ để giữ nguyên hành vi khi lỗi D1.
    let curatedRows = [];
    const [curatedQ, gameStats, rsStreak, watchStats, focusStats, rTongPhong] = await Promise.all([
      (isSchoolMember
        ? db.prepare(`
            SELECT id, source_type AS sourceType, source_id AS sourceId,
                   title, subtitle, icon, badge, category, action_type AS actionType,
                   audience, sort_order AS sortOrder
            FROM campus_highlight_curation
            WHERE active = 1
            ORDER BY sort_order ASC, id ASC
            LIMIT 4
          `)
        : db.prepare(`
            SELECT id, source_type AS sourceType, source_id AS sourceId,
                   title, subtitle, icon, badge, category, action_type AS actionType,
                   audience, sort_order AS sortOrder
            FROM campus_highlight_curation
            WHERE active = 1 AND audience = 'public'
            ORDER BY sort_order ASC, id ASC
            LIMIT 4
          `)
      ).all().catch(() => ({ results: [] })),
      // 1. GAME ARENA STATS
      db.prepare(`
        SELECT COUNT(*) AS soBan,
               SUM(CASE WHEN trang_thai = 'dang_choi' THEN 1 ELSE 0 END) AS dangDau
        FROM game_phong
        WHERE trang_thai IN ('cho_nguoi', 'dang_choi')
          AND pham_vi = 'truong'
          AND datetime(cap_nhat_luc) > datetime('now', '-30 minutes')
      `).first().catch(() => null),
      // 2. TOP STREAKS STATS
      db.prepare(`
        SELECT COUNT(DISTINCT s.hoc_sinh_id) AS soHocSinh,
               MAX(s.streak_hien_tai) AS maxStreak
        FROM user_streaks s
        WHERE s.streak_hien_tai > 0
      `).first().catch(() => null),
      // 3. WATCH STATS (Tự động tổng hợp phòng Xem Chung)
      db.prepare(`
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
      `).bind(NHIP_HIEU_LUC).first().catch(() => null),
      // 4. FOCUS STATS
      db.prepare(`
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
      `).bind(NHIP_HIEU_LUC).first().catch(() => null),
      // Tổng hợp số phòng toàn trường đang mở (trước đây tự query riêng ở cuối hàm)
      db.prepare("SELECT COUNT(*) AS c FROM phong WHERE trang_thai = 'mo' AND pham_vi = 'truong'").first().catch(() => null),
    ]);

    if (curatedQ.results?.length > 0) curatedRows = curatedQ.results;

    if (gameStats && Number(gameStats.soBan) > 0) {
      gameDoiKhang = {
        soBan: Number(gameStats.soBan) || 0,
        dangDau: Number(gameStats.dangDau) || 0
      };
    }

    if (rsStreak && Number(rsStreak.maxStreak) > 0) {
      topStreaks = [{
        soHocSinh: Number(rsStreak.soHocSinh) || 0,
        maxStreak: Number(rsStreak.maxStreak) || 0
      }];
    }

    if (watchStats && Number(watchStats.soNguoi) > 0) {
      watchTongQuan = {
        soNguoi: Number(watchStats.soNguoi) || 0,
        tenPhong: watchStats.tenPhong,
        phongId: watchStats.phongId
      };
    }

    if (focusStats && Number(focusStats.soNguoi) > 0) {
      focusTongQuan = {
        soNguoi: Number(focusStats.soNguoi) || 0,
        tenPhong: focusStats.tenPhong
      };
    }

    thongKe.tongPhong = Number(rTongPhong?.c) || 0;

    // 5. SINH DANH SÁCH DỮ LIỆU TỰ ĐỘNG (AUTOMATIC AGGREGATE HIGHLIGHTS)
    if (gameDoiKhang.soBan > 0) {
      const titleText = gameDoiKhang.dangDau > 0
        ? `${gameDoiKhang.dangDau} trận Caro đang đấu`
        : `${gameDoiKhang.soBan} bàn Caro đang chờ`;

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
        audience: 'public'
      });
    }

    if (topStreaks.length > 0 && topStreaks[0].maxStreak > 0) {
      const maxStreak = topStreaks[0].maxStreak;
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
        audience: isSchoolMember ? 'school' : 'public'
      });
    }

    if (watchTongQuan.soNguoi > 0) {
      const watchTitle = `${watchTongQuan.soNguoi} người đang xem chung`;
      const watchSub = isSchoolMember && watchTongQuan.tenPhong
        ? `Phòng: ${watchTongQuan.tenPhong}`
        : 'Phòng xem chung sôi động';

      highlights.push({
        id: `watch-${watchTongQuan.phongId || 'active'}`,
        loai: 'video',
        bieuTuong: '🎬',
        icon: '🎬',
        tieuDe: watchTitle,
        title: watchTitle,
        chiTiet: watchSub,
        sub: watchSub,
        category: 'Xem chung',
        badge: 'XEM CHUNG',
        mauSac: 'purple',
        hanhDong: 'vao_watch',
        audience: 'public'
      });
    }

    if (focusTongQuan.soNguoi > 0) {
      const focusTitle = `${focusTongQuan.soNguoi} người đang Focus`;
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
        hanhDong: 'vao_focus',
        audience: 'public'
      });
    }

    // Sự kiện toàn trường nếu còn chỗ
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
            hanhDong: 'xem_chi_tiet',
            audience: 'public'
          });
        }
      } catch {}
    }

    // 6. KẾT HỢP DỮ LIỆU CURATION VÀ PRIVACY ISOLATION
    let finalHighlights = [];
    let isCurated = false;

    if (curatedRows.length > 0) {
      isCurated = true;
      const mappedCurated = curatedRows.map(c => ({
        id: c.sourceId || `curated-${c.id}`,
        curationId: c.id,
        sourceType: c.sourceType,
        audience: c.audience || 'school',
        loai: c.actionType || 'event',
        bieuTuong: c.icon || '✨',
        icon: c.icon || '✨',
        tieuDe: c.title,
        title: c.title,
        chiTiet: c.subtitle || '',
        sub: c.subtitle || '',
        category: c.category || 'Hoạt động',
        badge: c.badge || 'NỔI BẬT',
        mauSac: c.actionType === 'game' ? 'cyan' : (c.actionType === 'video' ? 'purple' : (c.actionType === 'focus' ? 'emerald' : 'amber')),
        hanhDong: c.actionType === 'game' ? 'vao_game' : (c.actionType === 'video' ? 'vao_watch' : (c.actionType === 'focus' ? 'vao_focus' : 'xem_chi_tiet'))
      }));

      if (isSchoolMember) {
        finalHighlights = mappedCurated.slice(0, 4);
      } else {
        // Khách vãng lai: chỉ lấy các mục public, nếu chưa đủ 4 thì bù bằng automatic aggregate highlights
        const publicCurated = mappedCurated.filter(c => c.audience === 'public');
        const fallbackPublic = highlights.filter(h => h.audience === 'public' && !publicCurated.some(p => p.id === h.id));
        finalHighlights = [...publicCurated, ...fallbackPublic].slice(0, 4);
      }
    } else {
      finalHighlights = highlights.slice(0, 4);
    }

    return json({
      ok: true,
      isCurated,
      highlights: finalHighlights,
      topStreaks,
      watchTongQuan: isSchoolMember ? watchTongQuan : { soNguoi: watchTongQuan.soNguoi },
      focusTongQuan: isSchoolMember ? focusTongQuan : { soNguoi: focusTongQuan.soNguoi },
      focusSummary: isSchoolMember
        ? { soNguoiHoc: focusTongQuan.soNguoi, tenPhong: focusTongQuan.tenPhong }
        : { soNguoiHoc: focusTongQuan.soNguoi },
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
