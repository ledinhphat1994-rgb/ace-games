// API Tổng hợp & Xuất bản Tiêu Điểm Hoạt Động Digital Campus (Phase 4C & Server-Persisted Curation)
import { json, loi, layPhien, docThan, chuoi } from '../_lib/api.js';

const ALLOWED_ACTIONS = new Set(['game', 'video', 'focus', 'chat', 'event', 'spotlight']);
const ALLOWED_SOURCES = new Set(['manual', 'data_derived']);
const ALLOWED_AUDIENCES = new Set(['public', 'school']);

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

    // 0. KIỂM TRA BẢN BIÊN TẬP / CURATION CỦA GIÁO VIÊN ĐÃ LƯU TRÊN MÁY CHỦ (D1)
    let curatedRows = [];
    try {
      if (isSchoolMember) {
        // Thành viên trường: đọc toàn bộ tiêu điểm đang kích hoạt
        const q = await db.prepare(`
          SELECT id, source_type AS sourceType, source_id AS sourceId,
                 title, subtitle, icon, badge, category, action_type AS actionType,
                 audience, sort_order AS sortOrder
          FROM campus_highlight_curation
          WHERE active = 1
          ORDER BY sort_order ASC, id ASC
          LIMIT 4
        `).all();
        if (q && Array.isArray(q.results) && q.results.length > 0) {
          curatedRows = q.results;
        }
      } else {
        // Khách vãng lai / ngoài trường: CHỈ đọc tiêu điểm có audience = 'public'
        const q = await db.prepare(`
          SELECT id, source_type AS sourceType, source_id AS sourceId,
                 title, subtitle, icon, badge, category, action_type AS actionType,
                 audience, sort_order AS sortOrder
          FROM campus_highlight_curation
          WHERE active = 1 AND audience = 'public'
          ORDER BY sort_order ASC, id ASC
          LIMIT 4
        `).all();
        if (q && Array.isArray(q.results) && q.results.length > 0) {
          curatedRows = q.results;
        }
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

    // 3. WATCH STATS (Tự động tổng hợp phòng Xem Chung)
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
        watchTongQuan = {
          soNguoi: Number(watchStats.soNguoi) || 0,
          tenPhong: watchStats.tenPhong,
          phongId: watchStats.phongId
        };
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

export async function onRequestPost({ request, env }) {
  try {
    const db = env.DB;
    if (!db) return loi('Chưa gắn cơ sở dữ liệu D1.', 500);

    const phien = await layPhien(request, env);
    if (!phien) return loi('Chưa đăng nhập.', 401);

    // XÁC MINH DANH TÍNH TÀI KHOẢN HIỆN TẠI TRÊN CƠ SỞ DỮ LIỆU (SESSION REVOCATION GATE)
    let account = null;
    if (phien.accountId) {
      account = await db.prepare(
        'SELECT id, ten_dang_nhap AS username, ten_hien_thi AS tenHienThi, vai_tro AS vaiTro, teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong FROM tai_khoan_campus WHERE id = ?1'
      ).bind(phien.accountId).first();
    } else if (phien.username) {
      account = await db.prepare(
        'SELECT id, ten_dang_nhap AS username, ten_hien_thi AS tenHienThi, vai_tro AS vaiTro, teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong FROM tai_khoan_campus WHERE ten_dang_nhap = ?1'
      ).bind(phien.username).first();
    }

    if (!account) {
      return loi('Tài khoản không tồn tại hoặc chưa liên kết với Campus.', 403);
    }

    if (!account.dangHoatDong) {
      return loi('Tài khoản đã bị khoá.', 403);
    }

    const isVerifiedTeacher = account.vaiTro === 'teacher' && Number(account.teacherPending) === 0;
    if (!isVerifiedTeacher) {
      return loi('Chỉ giáo viên đã được phê duyệt xác minh mới có quyền xuất bản hoặc điều chỉnh Tiêu điểm Campus.', 403);
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

    if (action !== 'publish') {
      return loi('Hành động không được hỗ trợ (chỉ chấp nhận publish hoặc reset).', 400);
    }

    // 2. ACTION: PUBLISH / SAVE CURATED HIGHLIGHTS
    const list = Array.isArray(than.items) ? than.items : (Array.isArray(than.highlights) ? than.highlights : []);
    const rawItems = list.slice(0, 4);
    if (rawItems.length === 0) {
      return loi('Danh sách tiêu điểm xuất bản không được để trống (tối thiểu 1 mục, tối đa 4 mục).', 400);
    }

    // VALIDATE VÀ SANITIZE TỪNG MỤC
    const validatedItems = [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const title = chuoi(item.title || item.tieuDe, 100);
      if (!title || title.length < 2) {
        return loi(`Tiêu đề mục #${i + 1} phải có tối thiểu 2 ký tự.`, 400);
      }

      const subtitle = chuoi(item.subtitle || item.sub || item.chiTiet || '', 150);
      const icon = chuoi(item.icon || item.bieuTuong || '✨', 20);
      const badge = chuoi(item.badge || 'NỔI BẬT', 30);
      const category = chuoi(item.category || 'Hoạt động', 50);

      const rawActionType = chuoi(item.loai || item.actionType || 'event', 20).toLowerCase();
      if (!ALLOWED_ACTIONS.has(rawActionType)) {
        return loi(`Loại hành động không hợp lệ: ${rawActionType}. Hỗ trợ: game, video, focus, chat, event, spotlight.`, 400);
      }

      const rawSourceType = chuoi(item.sourceType || 'manual', 20).toLowerCase();
      if (!ALLOWED_SOURCES.has(rawSourceType)) {
        return loi(`Loại nguồn không hợp lệ: ${rawSourceType}. Hỗ trợ: manual, data_derived.`, 400);
      }

      // Phân loại audience: nếu manual hoặc không khai báo -> mặc định school để bảo vệ riêng tư học sinh
      let audience = chuoi(item.audience || (rawSourceType === 'manual' ? 'school' : 'public'), 20).toLowerCase();
      if (!ALLOWED_AUDIENCES.has(audience)) {
        audience = 'school';
      }

      const sourceId = chuoi(item.id || item.sourceId || `curated-${i + 1}`, 50);

      validatedItems.push({
        sourceType: rawSourceType,
        sourceId,
        title,
        subtitle,
        icon,
        badge,
        category,
        actionType: rawActionType,
        audience,
        sortOrder: i
      });
    }

    // THAY THẾ NGUYÊN TỬ (ATOMIC REPLACEMENT TRONG 1 BATCH DUY NHẤT)
    const setId = crypto.randomUUID();
    const actor = account.tenHienThi || account.username || 'Giáo viên';

    const deleteStmt = db.prepare('DELETE FROM campus_highlight_curation');
    const insertStmt = db.prepare(`
      INSERT INTO campus_highlight_curation (
        source_type, source_id, title, subtitle, icon, badge, category, action_type,
        audience, set_id, sort_order, active, created_by, updated_by
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 1, ?12, ?12)
    `);

    const batchStatements = [
      deleteStmt,
      ...validatedItems.map((item) => insertStmt.bind(
        item.sourceType,
        item.sourceId,
        item.title,
        item.subtitle,
        item.icon,
        item.badge,
        item.category,
        item.actionType,
        item.audience,
        setId,
        item.sortOrder,
        actor
      ))
    ];

    await db.batch(batchStatements);

    return json({
      ok: true,
      publishedCount: validatedItems.length,
      setId,
      message: 'Đã xuất bản tiêu điểm Campus lên máy chủ thành công (nguyên tử).'
    });
  } catch (e) {
    console.error('campus-highlights POST error:', e);
    return loi('Lỗi khi xuất bản tiêu điểm campus.', 500);
  }
}
