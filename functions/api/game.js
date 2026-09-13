// API Trò chơi trực tuyến nhiều người (Game Hub Online)
// PHASE 3B.1 + 4D.1: Canonical Game Actor Identity + Open Campus Game Access + Server Quick Match
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { bamMatKhau, taoSalt, xacMinhMatKhau } from '../_lib/passwords.js';
import { actorKey } from '../_lib/auth.js';
import { banCoKhoiTao, apDungNuocDi, GAME_TYPES, LOAI_GAME_HOP_LE } from '../_lib/game-engines.js';

// Sinh mã số người chơi tương thích ngược (Deterministic numeric player ID)
// Đảm bảo không đụng độ giữa học sinh (1-1000), tài khoản phụ (800000+), giáo viên (900000+), và tài khoản Campus (2000000+)
function numericPlayerId(phien) {
  if (phien.hocSinhId) return Number(phien.hocSinhId);
  if (phien.accountId) return 2000000 + Number(phien.accountId);
  if (phien.role === 'teacher') return phien.id ? 900000 + Number(phien.id) : 999999;
  if (phien.phuId) return 800000 + Number(phien.phuId);
  return 100001;
}

// Xác định lop_id được phép thao tác trong phạm vi lớp
function lopIdCuaPhien(phien, reqLopIdRaw) {
  const lopId = phien.lopId || 1;
  if (phien.role === 'teacher') {
    const req = parseInt(reqLopIdRaw || '', 10);
    if (req > 0) return req;
  }
  return lopId;
}

// Phân quyền truy cập phòng cờ (Centralized Game Room Scope Authorization Helper)
function canAccessGameRoom(phien, room) {
  if (!room || !phien) return false;
  if (room.pham_vi === 'truong') {
    // Đấu trường toàn trường: bất kỳ tài khoản Campus / học sinh / giáo viên / tài khoản phụ nào đã đăng nhập đều có thể truy cập
    return Boolean(phien.accountId || phien.hocSinhId || phien.role === 'teacher' || phien.phuId);
  }
  // Phạm vi lớp ('lop'): bắt buộc là học sinh đã liên kết đúng lớp hoặc giáo viên
  if (phien.role === 'teacher') return true;
  return Boolean(phien.hocSinhId && phien.lopId && room.lop_id === phien.lopId);
}

// Định dạng dữ liệu bàn cờ trả về client (tuyệt đối không để lộ mat_khau_hash hay salt)
function formatPhong(phong, phien = null) {
  let banCo = null;
  if (phong.du_lieu_ban_co) {
    try {
      banCo = JSON.parse(phong.du_lieu_ban_co);
    } catch {
      banCo = null;
    }
  }

  const myKey = phien ? actorKey(phien) : null;
  const myNumId = phien ? numericPlayerId(phien) : null;

  const isHost = Boolean(myKey && (phong.chu_phong_khoa === myKey || (phong.chu_phong_id && phong.chu_phong_id === myNumId)));
  const isGuest = Boolean(myKey && (phong.khach_khoa === myKey || (phong.khach_id && phong.khach_id === myNumId)));
  const isParticipant = isHost || isGuest;
  const mySymbol = isHost ? 'X' : (isGuest ? 'O' : null);

  const isMyTurn = Boolean(
    phong.trang_thai === 'dang_choi' && myKey && (
      (phong.luot_di_khoa && phong.luot_di_khoa === myKey) ||
      (!phong.luot_di_khoa && ((isHost && phong.luot_di_id === phong.chu_phong_id) || (isGuest && phong.luot_di_id === phong.khach_id)))
    )
  );

  let winnerDisplayName = null;
  if (phong.nguoi_thang_khoa) {
    winnerDisplayName = phong.nguoi_thang_khoa === phong.chu_phong_khoa ? phong.chu_phong_ten : phong.khach_ten;
  } else if (phong.nguoi_thang_id) {
    winnerDisplayName = phong.nguoi_thang_id === phong.chu_phong_id ? phong.chu_phong_ten : phong.khach_ten;
  }

  const tenLopHienThi = phong.lop_ten || phong.lopTen || (phong.lop_id ? `Lớp ${phong.lop_id}` : '');
  const hasClass = Boolean(phong.lop_id && phong.lop_id > 0);

  return {
    id: phong.id,
    lopId: hasClass ? phong.lop_id : null,
    lopTen: hasClass ? tenLopHienThi : '',
    classBadge: hasClass ? tenLopHienThi : '',
    loaiGame: phong.loai_game,
    tenBan: phong.ten_ban,
    hostName: phong.chu_phong_ten,
    guestName: phong.khach_ten || null,
    isHost,
    isGuest,
    isParticipant,
    mySymbol,
    isMyTurn,
    winnerDisplayName,
    // Trường tương thích cho UI và các bài test hiện có
    chuPhongId: phong.chu_phong_id,
    chuPhongTen: phong.chu_phong_ten,
    khachId: phong.khach_id,
    khachTen: phong.khach_ten,
    trangThai: phong.trang_thai,
    luotDiId: phong.luot_di_id,
    banCo,
    nguoiThangId: phong.nguoi_thang_id,
    phamVi: phong.pham_vi || 'lop',
    kieuGhep: phong.kieu_ghep || 'thu_cong',
    accessMode: phong.access_mode || phong.accessMode || 'public',
    taoLuc: phong.tao_luc,
    capNhatLuc: phong.cap_nhat_luc,
  };
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '0', 10);
  const loaiGame = url.searchParams.get('loai') || 'co_caro';
  const tatCaLoai = loaiGame === 'tat_ca'; // 'tat_ca' = liệt kê mọi loại game
  const phamVi = url.searchParams.get('phamVi') || 'lop'; // 'lop' | 'truong'
  const lopId = lopIdCuaPhien(phien, url.searchParams.get('lopId'));

  // 1. LẤY CHI TIẾT 1 PHÒNG CỤ THỂ
  if (phongId > 0) {
    const phong = await env.DB.prepare(`
      SELECT g.*, l.ten AS lop_ten
      FROM game_phong g
      LEFT JOIN lop l ON g.lop_id = l.id
      WHERE g.id = ?1
    `).bind(phongId).first();

    if (!phong) return loi('Bàn chơi không tồn tại hoặc đã kết thúc.', 404);

    if (!canAccessGameRoom(phien, phong)) {
      return loi('Bạn không có quyền truy cập bàn chơi này.', 403);
    }

    return json({
      ok: true,
      phong: formatPhong(phong, phien),
    });
  }

  // 2. DỌN DẸP BÀN RÁC & QUICK MATCH HẾT HẠN
  await env.DB.prepare(`
    DELETE FROM game_phong
    WHERE datetime(cap_nhat_luc) < datetime('now', '-2 hours')
       OR (pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi' AND datetime(cap_nhat_luc) < datetime('now', '-5 minutes'))
  `).run().catch(() => {});

  // 3. LẤY DANH SÁCH BÀN THEO PHẠM VI
  if (phamVi === 'truong') {
    // Đấu trường toàn trường: yêu cầu đăng nhập hợp lệ (tài khoản Campus / học sinh / giáo viên / phụ huynh)
    if (!phien.hocSinhId && phien.role !== 'teacher' && !phien.phuId && !phien.accountId) {
      return loi('Vui lòng đăng nhập để xem đấu trường toàn trường.', 401);
    }

    const rs = await env.DB.prepare(`
      SELECT g.id, g.lop_id AS lopId, l.ten AS lopTen,
             g.loai_game AS loaiGame, g.ten_ban AS tenBan,
             g.chu_phong_id AS chuPhongId, g.chu_phong_ten AS chuPhongTen,
             g.khach_id AS khachId, g.khach_ten AS khachTen,
             g.trang_thai AS trangThai, g.luot_di_id AS luotDiId,
             g.pham_vi AS phamVi, g.kieu_ghep AS kieuGhep,
             g.access_mode AS accessMode,
             g.tao_luc AS taoLuc, g.cap_nhat_luc AS capNhatLuc
      FROM game_phong g
      LEFT JOIN lop l ON g.lop_id = l.id
      WHERE g.pham_vi = 'truong' ${tatCaLoai ? '' : 'AND g.loai_game = ?1'} AND g.trang_thai IN ('cho_nguoi', 'dang_choi')
      ORDER BY g.id DESC
      LIMIT 30
    `).bind(...(tatCaLoai ? [] : [loaiGame])).all();

    // Sảnh toàn trường: không để lộ id học sinh nội bộ hay thông tin nhạy cảm
    return json({
      ok: true,
      danhSachBan: (rs.results || []).map(b => {
        const hasClass = Boolean(b.lopId && b.lopId > 0);
        return {
          id: b.id,
          loaiGame: b.loaiGame,
          tenBan: b.tenBan,
          hostName: b.chuPhongTen,
          guestName: b.khachTen,
          chuPhongTen: b.chuPhongTen,
          khachTen: b.khachTen,
          trangThai: b.trangThai,
          phamVi: b.phamVi,
          kieuGhep: b.kieuGhep,
          accessMode: b.accessMode || 'public',
          classBadge: hasClass ? (b.lopTen || `Lớp ${b.lopId}`) : '',
          lopId: hasClass ? b.lopId : null,
          lopTen: hasClass ? (b.lopTen || `Lớp ${b.lopId}`) : '',
          taoLuc: b.taoLuc,
          capNhatLuc: b.capNhatLuc,
        };
      }),
    });
  }

  // Mặc định: Danh sách bàn nội bộ lớp (100% tương thích ngược)
  const rs = await env.DB.prepare(`
    SELECT g.id, g.lop_id AS lopId, l.ten AS lopTen,
           g.loai_game AS loaiGame, g.ten_ban AS tenBan,
           g.chu_phong_id AS chuPhongId, g.chu_phong_ten AS chuPhongTen,
           g.khach_id AS khachId, g.khach_ten AS khachTen,
           g.trang_thai AS trangThai, g.luot_di_id AS luotDiId,
           g.pham_vi AS phamVi, g.kieu_ghep AS kieuGhep,
           g.access_mode AS accessMode,
           g.tao_luc AS taoLuc, g.cap_nhat_luc AS capNhatLuc
    FROM game_phong g
    LEFT JOIN lop l ON g.lop_id = l.id
    WHERE g.lop_id = ?1 AND g.pham_vi = 'lop' ${tatCaLoai ? '' : 'AND g.loai_game = ?2'} AND g.trang_thai IN ('cho_nguoi', 'dang_choi')
    ORDER BY g.id DESC
    LIMIT 20
  `).bind(lopId, ...(tatCaLoai ? [] : [loaiGame])).all();

  return json({
    ok: true,
    danhSachBan: (rs.results || []).map(b => ({
      ...b,
      hostName: b.chuPhongTen,
      guestName: b.khachTen,
      accessMode: b.accessMode || 'public',
      classBadge: b.lopTen || `Lớp ${b.lopId}`,
      lopTen: b.lopTen || `Lớp ${b.lopId}`,
    })),
  });
}, { canGiaoVien: false });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const than = await docThan(request);
  const hanhDong = String(than.hanhDong || '').trim();
  const laGiaoVien = phien.role === 'teacher';
  const lopId = lopIdCuaPhien(phien, than.lopId);

  // Xác định danh tính chuẩn tắc (Canonical Actor Identity)
  const currentActorKey = actorKey(phien);
  const nguoiChoiId = numericPlayerId(phien);
  let tenNguoiChoi = phien.ten || phien.hoTen || (laGiaoVien ? 'Giáo viên' : 'Người chơi');

  // Tra cứu họ tên chính xác nếu có hoc_sinh_id hoặc tài khoản campus
  if (!laGiaoVien && phien.hocSinhId) {
    const hs = await env.DB.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1')
      .bind(phien.hocSinhId).first().catch(() => null);
    if (hs && hs.hoTen) tenNguoiChoi = hs.hoTen;
  } else if (phien.accountId) {
    const tk = await env.DB.prepare('SELECT ten_hien_thi AS tenHienThi FROM tai_khoan_campus WHERE id = ?1')
      .bind(phien.accountId).first().catch(() => null);
    if (tk && tk.tenHienThi) tenNguoiChoi = tk.tenHienThi;
  }

  // 1. TẠO BÀN MỚI THỦ CÔNG (Manual Table Creation)
  if (hanhDong === 'tao_ban') {
    const loaiGame = String(than.loaiGame || 'co_caro').trim();
    if (!LOAI_GAME_HOP_LE.includes(loaiGame)) {
      return loi('Loại game không được hỗ trợ.', 400);
    }
    const phamVi = than.phamVi === 'truong' ? 'truong' : 'lop';
    const kieuGhep = than.kieuGhep === 'nhanh' ? 'nhanh' : 'thu_cong';

    // Bàn nội bộ lớp yêu cầu phải là giáo viên hoặc học sinh đã liên kết lớp
    if (phamVi === 'lop' && !laGiaoVien && (!phien.hocSinhId || !phien.lopId)) {
      return loi('Tạo bàn nội bộ lớp yêu cầu học sinh đã xác minh liên kết lớp.', 403);
    }

    let tenBan = String(than.tenBan || '').trim();
    if (!tenBan) tenBan = `Bàn của ${tenNguoiChoi}`;
    if (tenBan.length > 40) tenBan = tenBan.slice(0, 40);

    // Chế độ mật khẩu cho bàn thủ công
    const accessMode = (than.accessMode === 'password' || than.access_mode === 'password') ? 'password' : 'public';
    let matKhauHash = null;
    let matKhauSalt = null;
    if (accessMode === 'password') {
      const pass = String(than.password || than.matKhau || '').trim();
      if (pass.length < 1) {
        return loi('Bàn chơi có mật khẩu yêu cầu nhập mật khẩu bảo vệ.', 400);
      }
      matKhauSalt = taoSalt(16);
      matKhauHash = await bamMatKhau(pass, matKhauSalt);
    }

    // Bàn cờ khởi tạo theo loại game (caro 15/9 ô trống, c4 6x7 số 0, reversi 4 quân giữa)
    const banCoRong = banCoKhoiTao(loaiGame);

    // Bàn toàn trường của tài khoản chưa liên kết lớp KHÔNG gán lopId bừa bãi
    const originLopId = phamVi === 'truong'
      ? (phien.hocSinhId && phien.lopId ? phien.lopId : null)
      : lopId;

    const tao = await env.DB.prepare(`
      INSERT INTO game_phong (
        lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
        trang_thai, luot_di_id, du_lieu_ban_co, pham_vi, kieu_ghep,
        access_mode, mat_khau_hash, mat_khau_salt,
        chu_phong_khoa, luot_di_khoa, cap_nhat_luc
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'cho_nguoi', ?4, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?12, CURRENT_TIMESTAMP)
      RETURNING id, lop_id AS lopId, loai_game AS loaiGame, ten_ban AS tenBan,
                chu_phong_id AS chuPhongId, chu_phong_ten AS chuPhongTen,
                khach_id AS khachId, khach_ten AS khachTen,
                trang_thai AS trangThai, luot_di_id AS luotDiId,
                pham_vi AS phamVi, kieu_ghep AS kieuGhep,
                access_mode AS accessMode,
                chu_phong_khoa AS chuPhongKhoa, luot_di_khoa AS luotDiKhoa,
                tao_luc AS taoLuc, cap_nhat_luc AS capNhatLuc
    `).bind(
      originLopId,
      loaiGame,
      tenBan,
      nguoiChoiId,
      tenNguoiChoi,
      JSON.stringify(banCoRong),
      phamVi,
      kieuGhep,
      accessMode,
      matKhauHash,
      matKhauSalt,
      currentActorKey
    ).first();

    let tenLop = null;
    if (originLopId) {
      const rowLop = await env.DB.prepare('SELECT ten FROM lop WHERE id = ?1').bind(originLopId).first().catch(() => null);
      if (rowLop && rowLop.ten) tenLop = rowLop.ten;
    }

    const formatted = formatPhong({
      ...tao,
      lop_id: tao.lopId,
      lop_ten: tenLop,
      loai_game: tao.loaiGame,
      ten_ban: tao.tenBan,
      chu_phong_id: tao.chuPhongId,
      chu_phong_ten: tao.chuPhongTen,
      khach_id: tao.khachId,
      khach_ten: tao.khachTen,
      trang_thai: tao.trangThai,
      luot_di_id: tao.luotDiId,
      pham_vi: tao.phamVi,
      kieu_ghep: tao.kieuGhep,
      access_mode: tao.accessMode,
      chu_phong_khoa: tao.chuPhongKhoa,
      luot_di_khoa: tao.luotDiKhoa,
      tao_luc: tao.taoLuc,
      capNhatLuc: tao.capNhatLuc,
      du_lieu_ban_co: JSON.stringify(banCoRong),
    }, phien);

    return json({ ok: true, phong: { ...formatted, banCo: banCoRong } });
  }

  // 2. VÀO BÀN CHƠI THỦ CÔNG (Manual Join)
  if (hanhDong === 'vao_ban') {
    const phongId = Number(than.phongId);
    if (!phongId) return loi('Thiếu mã bàn chơi.');

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');

    if (!canAccessGameRoom(phien, phong)) {
      return loi('Bạn không có quyền vào bàn chơi này.', 403);
    }

    const laChuPhong = (phong.chu_phong_khoa === currentActorKey || phong.chu_phong_id === nguoiChoiId);
    if (laChuPhong) {
      // Chủ bàn vào lại bàn của mình
      return json({ ok: true, phongId });
    }

    // Kiểm tra mật khẩu nếu bàn ở chế độ password và không phải chủ phòng / giáo viên
    if (phong.access_mode === 'password' && !laChuPhong && phien.role !== 'teacher') {
      const pass = String(than.password || than.matKhau || '').trim();
      const dung = await xacMinhMatKhau(pass, phong.mat_khau_hash, phong.mat_khau_salt);
      if (!dung) {
        return loi('Mật khẩu bàn chơi không chính xác.', 403);
      }
    }

    if (phong.trang_thai !== 'cho_nguoi') {
      const laKhach = (phong.khach_khoa === currentActorKey || phong.khach_id === nguoiChoiId);
      if (laKhach) {
        // Khách đã ở trong bàn, cho phép quay lại
        return json({ ok: true, phongId });
      }
      return loi('Bàn này đã đủ 2 người chơi hoặc đã kết thúc.', 409);
    }

    // Cập nhật có điều kiện NGUYÊN TỬ — chỉ nhận khách khi bàn vẫn đang chờ (chống 2 người vào cùng lúc)
    const vao = await env.DB.prepare(`
      UPDATE game_phong
      SET khach_id = ?1, khach_ten = ?2, khach_khoa = ?3, trang_thai = 'dang_choi', cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?4 AND trang_thai = 'cho_nguoi' AND khach_khoa IS NULL AND khach_id IS NULL
    `).bind(nguoiChoiId, tenNguoiChoi, currentActorKey, phongId).run();

    if (!vao.meta || vao.meta.changes === 0) {
      return loi('Bàn này vừa có người khác vào. Hãy tải lại danh sách bàn.', 409);
    }

    return json({ ok: true, phongId });
  }

  // 3. GHÉP TRẬN NHANH TOÀN TRƯỜNG (Quick Match FIFO)
  if (hanhDong === 'tim_tran_nhanh') {
    // BƯỚC 1 — ACTOR VALIDATION: Bất kỳ tài khoản Campus nào đã đăng nhập đều có thể ghép trận nhanh
    if (!phien.accountId && !phien.hocSinhId && phien.role !== 'teacher') {
      return loi('Vui lòng đăng nhập tài khoản Campus để tham gia Ghép trận nhanh.', 401);
    }

    const loaiGame = String(than.loaiGame || 'co_caro').trim();
    if (!LOAI_GAME_HOP_LE.includes(loaiGame)) {
      return loi('Loại game không được hỗ trợ.', 400);
    }
    const originLopId = (phien.hocSinhId && phien.lopId) ? phien.lopId : null;

    // BƯỚC 2 — RESUME EXISTING ACTIVE MATCH: Tiếp tục trận đấu đang diễn ra nếu có
    const matchDangChoi = await env.DB.prepare(`
      SELECT id, chu_phong_id, chu_phong_ten, khach_id, khach_ten, lop_id, chu_phong_khoa, khach_khoa
      FROM game_phong
      WHERE pham_vi = 'truong'
        AND (chu_phong_khoa = ?1 OR khach_khoa = ?1 OR chu_phong_id = ?2 OR khach_id = ?2)
        AND trang_thai = 'dang_choi'
        AND datetime(cap_nhat_luc) >= datetime('now', '-15 minutes')
      ORDER BY cap_nhat_luc DESC
      LIMIT 1
    `).bind(currentActorKey, nguoiChoiId).first();

    if (matchDangChoi) {
      return json({
        ok: true,
        matched: true,
        resumed: true,
        phongId: matchDangChoi.id,
      });
    }

    // BƯỚC 3 — RETURN OWN EXISTING QUICK WAIT: Trả về hàng đợi đang chờ của chính mình
    const banChoCuaToi = await env.DB.prepare(`
      SELECT id FROM game_phong
      WHERE (chu_phong_khoa = ?1 OR chu_phong_id = ?2) AND loai_game = ?3
        AND pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi'
        AND datetime(cap_nhat_luc) >= datetime('now', '-5 minutes')
      ORDER BY id DESC
      LIMIT 1
    `).bind(currentActorKey, nguoiChoiId, loaiGame).first();

    if (banChoCuaToi) {
      return json({
        ok: true,
        matched: false,
        waiting: true,
        phongId: banChoCuaToi.id,
      });
    }

    // BƯỚC 4 — FIND FIFO OPPONENT: Tìm đối thủ chờ lâu nhất (FIFO)
    const doiThuCho = await env.DB.prepare(`
      SELECT g.id, g.chu_phong_id, g.chu_phong_ten, g.chu_phong_khoa, g.lop_id, l.ten AS lop_ten
      FROM game_phong g
      LEFT JOIN lop l ON g.lop_id = l.id
      WHERE g.pham_vi = 'truong' AND g.kieu_ghep = 'nhanh' AND g.trang_thai = 'cho_nguoi'
        AND g.khach_khoa IS NULL AND g.khach_id IS NULL
        AND g.chu_phong_khoa != ?1 AND g.chu_phong_id != ?2 AND g.loai_game = ?3
        AND datetime(g.cap_nhat_luc) >= datetime('now', '-5 minutes')
      ORDER BY g.id ASC
      LIMIT 3
    `).bind(currentActorKey, nguoiChoiId, loaiGame).all();

    // BƯỚC 5 — ATOMIC CLAIM (Kèm điều kiện chống 1 người ghép cùng lúc 2 đối thủ)
    for (const dt of (doiThuCho.results || [])) {
      const claim = await env.DB.prepare(`
        UPDATE game_phong
        SET khach_id = ?1,
            khach_ten = ?2,
            khach_khoa = ?3,
            trang_thai = 'dang_choi',
            cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?4
          AND trang_thai = 'cho_nguoi'
          AND khach_khoa IS NULL AND khach_id IS NULL
          AND chu_phong_khoa != ?3
          AND NOT EXISTS (
            SELECT 1 FROM game_phong
            WHERE pham_vi = 'truong'
              AND (chu_phong_khoa = ?3 OR khach_khoa = ?3)
              AND trang_thai = 'dang_choi'
              AND datetime(cap_nhat_luc) >= datetime('now', '-15 minutes')
          )
      `).bind(nguoiChoiId, tenNguoiChoi, currentActorKey, dt.id).run();

      if (claim.meta && claim.meta.changes === 1) {
        return json({
          ok: true,
          matched: true,
          resumed: false,
          phongId: dt.id,
          doiThu: {
            ten: dt.chu_phong_ten,
            lopId: dt.lop_id,
            lopTen: dt.lop_id ? (dt.lop_ten || `Lớp ${dt.lop_id}`) : '',
          },
        });
      }
    }

    // BƯỚC 6 — CREATE WAITING ROW: Không claim được đối thủ -> tạo bàn chờ Quick Match
    const banCoRong = banCoKhoiTao(loaiGame);
    const tenBan = `Quick Match - ${tenNguoiChoi}`;

    try {
      const taoCho = await env.DB.prepare(`
        INSERT INTO game_phong (
          lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
          trang_thai, luot_di_id, du_lieu_ban_co, pham_vi, kieu_ghep,
          chu_phong_khoa, luot_di_khoa, cap_nhat_luc
        ) VALUES (?1, ?2, ?3, ?4, ?5, 'cho_nguoi', ?4, ?6, 'truong', 'nhanh', ?7, ?7, CURRENT_TIMESTAMP)
        RETURNING id
      `).bind(originLopId, loaiGame, tenBan, nguoiChoiId, tenNguoiChoi, JSON.stringify(banCoRong), currentActorKey).first();

      return json({
        ok: true,
        matched: false,
        waiting: true,
        phongId: taoCho.id,
      });
    } catch (err) {
      // Bắt xung đột từ Partial UNIQUE index uq_quick_match_waiting_khoa khi có race condition (double-click)
      const banDaCo = await env.DB.prepare(`
        SELECT id FROM game_phong
        WHERE (chu_phong_khoa = ?1 OR chu_phong_id = ?2) AND loai_game = ?3
          AND pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi'
        ORDER BY id DESC LIMIT 1
      `).bind(currentActorKey, nguoiChoiId, loaiGame).first().catch(() => null);

      if (banDaCo) {
        return json({
          ok: true,
          matched: false,
          waiting: true,
          phongId: banDaCo.id,
        });
      }
      throw err;
    }
  }

  // 4. HỦY TÌM TRẬN NHANH (Cancel Quick Match)
  if (hanhDong === 'huy_tim_tran') {
    const phongId = Number(than.phongId);
    if (!phongId) return json({ ok: true, cancelled: true });

    // Chỉ xoá khi bàn do chính mình tạo, là quick match và chưa có khách
    const xoa = await env.DB.prepare(`
      DELETE FROM game_phong
      WHERE id = ?1
        AND (chu_phong_khoa = ?2 OR chu_phong_id = ?3)
        AND pham_vi = 'truong' AND kieu_ghep = 'nhanh'
        AND trang_thai = 'cho_nguoi' AND khach_khoa IS NULL AND khach_id IS NULL
    `).bind(phongId, currentActorKey, nguoiChoiId).run();

    if (xoa.meta && xoa.meta.changes === 1) {
      return json({ ok: true, cancelled: true });
    }

    // Nếu không xoá được, kiểm tra xem có phải vừa bị đối thủ claim vài mili-giây trước không
    const p = await env.DB.prepare('SELECT id, trang_thai FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (p && p.trang_thai === 'dang_choi') {
      return json({ ok: true, cancelled: false, matched: true, phongId });
    }
    return json({ ok: true, cancelled: true });
  }

  // 5. ĐÁNH MỘT NƯỚC CỜ (Move Concurrency - Conditional Optimistic Update)
  if (hanhDong === 'danh_co') {
    const phongId = Number(than.phongId);
    const r = parseInt(than.r, 10);
    const c = parseInt(than.c, 10);

    if (!phongId) {
      return loi('Thiếu mã bàn chơi.');
    }

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');

    if (!canAccessGameRoom(phien, phong)) {
      return loi('Bạn không có quyền truy cập bàn chơi này.', 403);
    }

    if (phong.trang_thai !== 'dang_choi') {
      return loi('Ván cờ chưa bắt đầu hoặc đã kết thúc.');
    }

    const laChuPhong = (phong.chu_phong_khoa === currentActorKey || phong.chu_phong_id === nguoiChoiId);
    const laKhach = (phong.khach_khoa === currentActorKey || phong.khach_id === nguoiChoiId);

    if (!laChuPhong && !laKhach) {
      return loi('Bạn không ở trong bàn cờ này.', 403);
    }

    // Kiểm tra có phải lượt của mình không
    const laLuotCuaToi = Boolean(
      (phong.luot_di_khoa && phong.luot_di_khoa === currentActorKey) ||
      (!phong.luot_di_khoa && (
        (laChuPhong && phong.luot_di_id === phong.chu_phong_id) ||
        (laKhach && phong.luot_di_id === phong.khach_id)
      ))
    );

    if (!laLuotCuaToi) {
      return loi('Chưa đến lượt của bạn.', 409);
    }

    let board;
    try {
      board = JSON.parse(phong.du_lieu_ban_co || '[]');
    } catch {
      board = banCoKhoiTao(phong.loai_game);
    }
    if (!Array.isArray(board) || !Array.isArray(board[0])) {
      board = banCoKhoiTao(phong.loai_game);
    }

    // Engine dùng chung: quanIdx 0 = chủ bàn, 1 = khách — luật theo loai_game
    const quanIdx = laChuPhong ? 0 : 1;
    const ketQua = apDungNuocDi(phong.loai_game, board, { r, c }, quanIdx);
    if (!ketQua.ok) {
      return loi(ketQua.loi || 'Nước đi không hợp lệ.', 400);
    }
    board = ketQua.board;
    const quanCo = (GAME_TYPES[phong.loai_game] || GAME_TYPES.co_caro).quan[quanIdx];

    let trangThaiMoi = 'dang_choi';
    let nguoiThangId = null;
    let nguoiThangKhoa = null;
    // Reversi có thể "đi tiếp" khi đối thủ hết nước hợp lệ
    const luotTiepTheoId = ketQua.luotLai ? nguoiChoiId : (laChuPhong ? phong.khach_id : phong.chu_phong_id);
    const luotTiepTheoKhoa = ketQua.luotLai ? currentActorKey : (laChuPhong ? phong.khach_khoa : phong.chu_phong_khoa);

    if (ketQua.ketThuc === 'thang') {
      trangThaiMoi = 'ket_thuc';
      // Reversi: người thắng quyết theo số quân, có thể là đối thủ của người vừa đi
      const thangIdx = ketQua.nguoiThangIdx != null ? ketQua.nguoiThangIdx : quanIdx;
      nguoiThangId = thangIdx === 0 ? phong.chu_phong_id : phong.khach_id;
      nguoiThangKhoa = thangIdx === 0 ? phong.chu_phong_khoa : phong.khach_khoa;
    } else if (ketQua.ketThuc === 'hoa') {
      trangThaiMoi = 'hoa';
    }

    const daThang = trangThaiMoi === 'ket_thuc' && nguoiThangKhoa === currentActorKey;

    // GHI NƯỚC ĐI NGUYÊN TỬ (Optimistic Concurrency Control):
    // Phải đúng id, đang trong trạng thái 'dang_choi', VÀ luot_di_khoa (hoặc luot_di_id) đúng là người chơi này.
    // Nếu 2 request đồng thời từ cùng người chơi cùng gửi, request đầu đổi lượt -> request sau có changes === 0 và bị từ chối 409.
    const ghi = await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          luot_di_khoa = ?3,
          trang_thai = ?4,
          nguoi_thang_id = ?5,
          nguoi_thang_khoa = ?6,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?7 AND trang_thai = 'dang_choi'
        AND (luot_di_khoa = ?8 OR (luot_di_khoa IS NULL AND luot_di_id = ?9))
    `).bind(
      JSON.stringify(board),
      luotTiepTheoId,
      luotTiepTheoKhoa,
      trangThaiMoi,
      nguoiThangId,
      nguoiThangKhoa,
      phongId,
      currentActorKey,
      nguoiChoiId
    ).run();

    if (!ghi.meta || ghi.meta.changes === 0) {
      return loi('Ván cờ đã thay đổi trạng thái hoặc chưa đến lượt. Hãy tải lại bàn đấu.', 409);
    }

    // Ghi nhận thành tích học sinh thắng ván (chỉ ghi nhận khi là học sinh chính thức có hocSinhId)
    if (daThang && phien.hocSinhId && phong.lop_id) {
      const tenGame = (GAME_TYPES[phong.loai_game] || GAME_TYPES.co_caro).ten;
      const ghiDiem = ghiNhanHoatDong(env, {
        hocSinhId: phien.hocSinhId,
        lopId: phong.lop_id,
        loaiHoatDong: 'game',
        moTa: phong.pham_vi === 'truong' ? `Thắng ván ${tenGame} Đấu Trường Toàn Trường` : `Thắng ván ${tenGame} lớp`,
      }).catch(() => {});
      if (waitUntil) waitUntil(ghiDiem);
    }

    return json({
      ok: true,
      r,
      c,
      quanCo,
      trangThai: trangThaiMoi,
      nguoiThangId,
      nguoiThangKhoa,
      luotDiId: luotTiepTheoId,
      luotDiKhoa: luotTiepTheoKhoa,
      luotLai: Boolean(ketQua.luotLai),
      diemSo: ketQua.diemSo || null,
      winLine: ketQua.winLine || null,
    });
  }

  // 6. CHƠI VÁN MỚI (Scope-aware Rematch)
  if (hanhDong === 'van_moi') {
    const phongId = Number(than.phongId);
    if (!phongId) return loi('Thiếu mã bàn chơi.');

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');

    if (!canAccessGameRoom(phien, phong)) {
      return loi('Bạn không có quyền.', 403);
    }

    // Chỉ người trong bàn (hoặc giáo viên với bàn lớp) mới được mở ván mới
    const laNguoiTrongBan = (phong.chu_phong_khoa === currentActorKey || phong.khach_khoa === currentActorKey ||
      phong.chu_phong_id === nguoiChoiId || phong.khach_id === nguoiChoiId);
    if (!laNguoiTrongBan && !laGiaoVien) {
      return loi('Bạn không ở trong bàn cờ này.', 403);
    }

    // Bàn cờ khởi tạo lại theo đúng loại game của bàn
    const banCoRong = banCoKhoiTao(phong.loai_game);
    const luotMoiId = phong.chu_phong_id;
    const luotMoiKhoa = phong.chu_phong_khoa;

    await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          luot_di_khoa = ?3,
          trang_thai = 'dang_choi',
          nguoi_thang_id = NULL,
          nguoi_thang_khoa = NULL,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?4 AND (chu_phong_khoa = ?5 OR khach_khoa = ?5 OR chu_phong_id = ?6 OR khach_id = ?6)
    `).bind(JSON.stringify(banCoRong), luotMoiId, luotMoiKhoa, phongId, currentActorKey, nguoiChoiId).run();

    return json({ ok: true });
  }

  // 7. RỜI BÀN (Scope-aware Leave)
  if (hanhDong === 'roi_ban') {
    const phongId = Number(than.phongId);
    if (!phongId) return json({ ok: true });

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (phong) {
      const laChuPhong = (phong.chu_phong_khoa === currentActorKey || phong.chu_phong_id === nguoiChoiId);
      const laKhach = (phong.khach_khoa === currentActorKey || phong.khach_id === nguoiChoiId);

      if (laChuPhong) {
        // Chủ phòng rời
        if (phong.trang_thai === 'cho_nguoi') {
          await env.DB.prepare('DELETE FROM game_phong WHERE id = ?1 AND (chu_phong_khoa = ?2 OR chu_phong_id = ?3)')
            .bind(phongId, currentActorKey, nguoiChoiId).run().catch(() => {});
        } else {
          await env.DB.prepare("UPDATE game_phong SET trang_thai = 'huy', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        }
      } else if (laKhach) {
        // Khách rời
        if (phong.kieu_ghep === 'nhanh') {
          // Bàn quick match khách rời khi đang chơi -> kết thúc ván, chủ thắng
          await env.DB.prepare("UPDATE game_phong SET trang_thai = 'ket_thuc', nguoi_thang_id = chu_phong_id, nguoi_thang_khoa = chu_phong_khoa, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        } else {
          // Bàn thủ công -> đưa về chờ người
          await env.DB.prepare("UPDATE game_phong SET khach_id = NULL, khach_ten = NULL, khach_khoa = NULL, trang_thai = 'cho_nguoi', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        }
      }
    }
    return json({ ok: true });
  }

  return loi('Hành động không được hỗ trợ.');
}, { canGiaoVien: false });
