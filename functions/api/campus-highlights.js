// API Tổng hợp & Xuất bản Tiêu Điểm Hoạt Động Digital Campus (Phase 4C & Server-Persisted Curation)
import { json, loi, layPhien, docThan, chuoi } from '../_lib/api.js';

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

    // 0. KIỂM TRA BẢN BIÊN TẬP / CURATION CỦA GIÁO VIÊN ĐÃ LƯU TRÊN MÁY CHỦ (D1)
    let curatedRows = [];
    try {
      const q = await db.prepare(`
        SELECT id, source_type AS sourceType, source_id AS sourceId,
               title, subtitle, icon, badge, category, action_type AS actionType, sort_order AS sortOrder
        FROM campus_highlight_curation
        WHERE active = 1
        ORDER BY sort_order ASC, id ASC
        LIMIT 4
      `).all();
      if (q && Array.isArray(q.results) && q.results.length > 0) {
        curatedRows = q.results;
      }
    } catch {
      // Nếu chưa có bảng campus_highlight_curation hoặc lỗi truy vấn, tiếp tục fallback
    }

    // 1. GAME ARENA STATS
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
        gameDoiKhang = {
          soBan: Number(gameStats.soBan) || 0,
          dangDau: Number(gameStats.dangDau) || 0
        };
      }
    } catch {}

    // 2. TOP STREAKS STATS
    try {
      const rsStreak = await db.prepare(`
        SELECT COUNT(DISTINCT s.hoc_sinh_id) AS soHocSinh,
               MAX(s.streak_hien_tai) AS maxStreak
        FROM user_streaks s
        WHERE s.streak_hien_tai > 0
      `).first();

      if (rsStreak && Number(rsStreak.maxStreak) > 0) {
        topStreaks = [{
          soHocSinh: Number(rsStreak.soHocSinh) || 0,
          maxStreak: Number(rsStreak.maxStreak) || 0
        }];
      }
    } catch {}

    // 3. WATCH STATS
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
        // watch stats parsed
      }
    } catch {}

    // 4. FOCUS STATS
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
        focusTongQuan = {
          soNguoi: Number(focusStats.soNguoi) || 0,
          tenPhong: focusStats.tenPhong
        };
      }
    } catch {}

    // 5. NẾU CÓ BẢN CURATION TRÊN SERVER: DÙNG CURATION VỚI PRIVACY SANITIZATION
    let finalHighlights = [];
    let isCurated = false;

    if (curatedRows.length > 0) {
      isCurated = true;
      finalHighlights = curatedRows.map(c => {
        let title = c.title;
        const subtitle = c.subtitle || '';

        // Privacy sanitization cho khách vãng lai: không để lộ danh tính cá nhân / lớp riêng
        if (!isSchoolMember && c.sourceType === 'data_derived') {
          // Bỏ qua tên cá nhân nếu có trong title
          title = title.replace(/\(.*?\)/g, '').trim();
        }

        return {
          id: c.sourceId || `curated-${c.id}`,
          curationId: c.id,
          sourceType: c.sourceType,
          loai: c.actionType || 'event',
          bieuTuong: c.icon || '✨',
          icon: c.icon || '✨',
          tieuDe: title,
          title: title,
          chiTiet: subtitle,
          sub: subtitle,
          category: c.category || 'Hoạt động',
          badge: c.badge || 'NỔI BẬT',
          mauSac: c.actionType === 'game' ? 'cyan' : (c.actionType === 'video' ? 'purple' : (c.actionType === 'focus' ? 'emerald' : 'amber')),
          hanhDong: c.actionType === 'game' ? 'vao_game' : (c.actionType === 'video' ? 'vao_watch' : (c.actionType === 'focus' ? 'vao_focus' : 'xem_chi_tiet'))
        };
      });
    } else {
      // 6. NẾU CHƯA CÓ CURATION: TỰ ĐỘNG SINH TỪ DỮ LIỆU THỰC TẾ (FALLBACK TO AUTOMATIC)
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
            });
          }
        } catch {}
      }

      finalHighlights = highlights.slice(0, 4);
    }

    // Tổng hợp số phòng toàn trường đang mở
    try {
      const rTongPhong = await db.prepare("SELECT COUNT(*) AS c FROM phong WHERE trang_thai = 'mo' AND pham_vi = 'truong'").first();
      thongKe.tongPhong = Number(rTongPhong?.c) || 0;
    } catch {}

    return json({
      ok: true,
      isCurated,
      highlights: finalHighlights,
      topStreaks,
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

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien) return loi('Chưa đăng nhập.', 401);

    const isVerifiedTeacher = Boolean(phien.role === 'teacher' && !phien.teacherPending);
    if (!isVerifiedTeacher) {
      return loi('Chỉ giáo viên đã xác minh mới có quyền xuất bản hoặc điều chỉnh Tiêu điểm Campus.', 403);
    }

    const than = await docThan(request);
    const action = String(than.action || 'publish').toLowerCase();

    // 1. ACTION: RESET (Khôi phục dữ liệu gốc tự động từ máy chủ)
    if (action === 'reset') {
      await db.prepare('DELETE FROM campus_highlight_curation').run();
      return json({
        ok: true,
        reset: true,
        message: 'Đã khôi phục tiêu điểm tự động từ dữ liệu hoạt động thực tế.'
      });
    }

    // 2. ACTION: PUBLISH / SAVE CURATED HIGHLIGHTS
    const list = Array.isArray(than.items) ? than.items : (Array.isArray(than.highlights) ? than.highlights : []);
    const rawItems = list.slice(0, 4);
    if (rawItems.length === 0) {
      return loi('Danh sách tiêu điểm xuất bản không được để trống (tối thiểu 1 mục, tối đa 4 mục).', 400);
    }

    // Xoá bản ghi cũ và lưu danh sách mới nguyên tử
    await db.prepare('DELETE FROM campus_highlight_curation').run();

    const stmt = db.prepare(`
      INSERT INTO campus_highlight_curation (
        source_type, source_id, title, subtitle, icon, badge, category, action_type, sort_order, active, created_by, updated_by
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 1, ?10, ?10)
    `);

    const actor = phien.ten || phien.username || 'Giáo viên';
    const stmts = rawItems.map((item, idx) => {
      const title = chuoi(item.title || item.tieuDe, 100);
      const subtitle = chuoi(item.subtitle || item.sub || item.chiTiet || '', 150);
      const icon = chuoi(item.icon || item.bieuTuong || '✨', 20);
      const badge = chuoi(item.badge || 'NỔI BẬT', 30);
      const category = chuoi(item.category || 'Hoạt động', 50);
      const actionType = chuoi(item.loai || item.actionType || 'event', 20);
      const sourceType = chuoi(item.sourceType || 'manual', 20);
      const sourceId = chuoi(item.id || item.sourceId || '', 50);

      return stmt.bind(
        sourceType,
        sourceId,
        title || 'Tiêu điểm Campus',
        subtitle,
        icon,
        badge,
        category,
        actionType,
        idx,
        actor
      );
    });

    await db.batch(stmts);

    return json({
      ok: true,
      publishedCount: stmts.length,
      message: 'Đã xuất bản tiêu điểm Campus lên máy chủ thành công.'
    });
  } catch (e) {
    console.error('campus-highlights POST error:', e);
    return loi('Lỗi khi xuất bản tiêu điểm campus.', 500);
  }
}
