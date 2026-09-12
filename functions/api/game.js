// API Trò chơi trực tuyến nhiều người (Game Hub Online)
// PHASE 3B.1 — CAMPUS GAME ARENA CORE: Hybrid Open Lobby + Quick Match + Cross-Class Caro 15x15
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { bamMatKhau, taoSalt, xacMinhMatKhau } from '../_lib/passwords.js';

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
    // Đấu trường toàn trường: bất kỳ học sinh/giáo viên/tài khoản phụ/tài khoản campus nào đã đăng nhập đều có thể truy cập
    return Boolean(phien.hocSinhId || phien.role === 'teacher' || phien.phuId || phien.accountId);
  }
  // Phạm vi lớp ('lop'): bắt buộc cùng lớp hoặc giáo viên
  const lopId = phien.lopId || 1;
  if (phien.role === 'teacher') return true;
  return room.lop_id === lopId;
}

// Định dạng dữ liệu bàn cờ trả về client (tuyệt đối không để lộ mat_khau_hash hay salt)
function formatPhong(phong) {
  let banCo = null;
  if (phong.du_lieu_ban_co) {
    try {
      banCo = JSON.parse(phong.du_lieu_ban_co);
    } catch {
      banCo = null;
    }
  }
  return {
    id: phong.id,
    lopId: phong.lop_id,
    lopTen: phong.lop_ten || `Lớp ${phong.lop_id}`,
    loaiGame: phong.loai_game,
    tenBan: phong.ten_ban,
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

// Kiểm tra thắng 5 quân liên tiếp cho bàn cờ Caro 15x15
function kiemTraThangCaro(board, r, c, val) {
  if (!val) return false;
  const huong = [
    [0, 1],   // Ngang
    [1, 0],   // Dọc
    [1, 1],   // Chéo chính
    [1, -1],  // Chéo phụ
  ];

  for (const [dr, dc] of huong) {
    let count = 1;
    // Đi tới
    for (let step = 1; step < 5; step++) {
      const nr = r + dr * step;
      const nc = c + dc * step;
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === val) {
        count++;
      } else {
        break;
      }
    }
    // Đi lui
    for (let step = 1; step < 5; step++) {
      const nr = r - dr * step;
      const nc = c - dc * step;
      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === val) {
        count++;
      } else {
        break;
      }
    }
    if (count >= 5) return true;
  }
  return false;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '0', 10);
  const loaiGame = url.searchParams.get('loai') || 'co_caro';
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
      phong: formatPhong(phong),
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
    // Đấu trường toàn trường: yêu cầu đăng nhập hợp lệ
    if (!phien.hocSinhId && phien.role !== 'teacher' && !phien.phuId && !phien.accountId) {
      return loi('Vui lòng đăng nhập để xem đấu trường toàn trường.', 403);
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
      WHERE g.pham_vi = 'truong' AND g.loai_game = ?1 AND g.trang_thai IN ('cho_nguoi', 'dang_choi')
      ORDER BY g.id DESC
      LIMIT 30
    `).bind(loaiGame).all();

    return json({
      ok: true,
      danhSachBan: (rs.results || []).map(b => ({
        ...b,
        accessMode: b.accessMode || 'public',
        lopTen: b.lopTen || `Lớp ${b.lopId}`,
      })),
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
    WHERE g.lop_id = ?1 AND g.pham_vi = 'lop' AND g.loai_game = ?2 AND g.trang_thai IN ('cho_nguoi', 'dang_choi')
    ORDER BY g.id DESC
    LIMIT 20
  `).bind(lopId, loaiGame).all();

  return json({
    ok: true,
    danhSachBan: (rs.results || []).map(b => ({
      ...b,
      accessMode: b.accessMode || 'public',
      lopTen: b.lopTen || `Lớp ${b.lopId}`,
    })),
  });
}, { canGiaoVien: false });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const than = await docThan(request);
  const hanhDong = String(than.hanhDong || '').trim();
  const laGiaoVien = phien.role === 'teacher';
  const lopId = lopIdCuaPhien(phien, than.lopId);

  // Xác định danh tính người chơi
  let nguoiChoiId = phien.hocSinhId;
  let tenNguoiChoi = phien.ten || phien.hoTen || 'Học sinh';
  if (laGiaoVien) {
    nguoiChoiId = 999999;
    tenNguoiChoi = 'Giáo viên';
  } else if (!nguoiChoiId) {
    nguoiChoiId = phien.phuId ? (800000 + phien.phuId) : 100001;
  }

  // Tra cứu họ tên chính xác nếu là học sinh
  if (!laGiaoVien && phien.hocSinhId) {
    const hs = await env.DB.prepare('SELECT ho_ten AS hoTen FROM hoc_sinh WHERE id = ?1')
      .bind(phien.hocSinhId).first().catch(() => null);
    if (hs && hs.hoTen) tenNguoiChoi = hs.hoTen;
  }

  // 1. TẠO BÀN MỚI THỦ CÔNG (Manual Table Creation)
  if (hanhDong === 'tao_ban') {
    const loaiGame = String(than.loaiGame || 'co_caro').trim();
    const phamVi = than.phamVi === 'truong' ? 'truong' : 'lop';
    const kieuGhep = than.kieuGhep === 'nhanh' ? 'nhanh' : 'thu_cong';

    // Đấu trường toàn trường yêu cầu học sinh có tài khoản định danh (canonical student identity)
    if (phamVi === 'truong') {
      if (!phien.hocSinhId) {
        return loi('Đấu trường toàn trường chỉ dành cho học sinh có tài khoản định danh.', 403);
      }
      nguoiChoiId = phien.hocSinhId;
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

    // Tạo bàn cờ rỗng 15x15
    const banCoRong = Array(15).fill(null).map(() => Array(15).fill(null));

    const tao = await env.DB.prepare(`
      INSERT INTO game_phong (
        lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
        trang_thai, luot_di_id, du_lieu_ban_co, pham_vi, kieu_ghep,
        access_mode, mat_khau_hash, mat_khau_salt, cap_nhat_luc
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'cho_nguoi', ?4, ?6, ?7, ?8, ?9, ?10, ?11, CURRENT_TIMESTAMP)
      RETURNING id, lop_id AS lopId, loai_game AS loaiGame, ten_ban AS tenBan,
                chu_phong_id AS chuPhongId, chu_phong_ten AS chuPhongTen,
                khach_id AS khachId, khach_ten AS khachTen,
                trang_thai AS trangThai, luot_di_id AS luotDiId,
                pham_vi AS phamVi, kieu_ghep AS kieuGhep,
                access_mode AS accessMode,
                tao_luc AS taoLuc, cap_nhat_luc AS capNhatLuc
    `).bind(
      phamVi === 'truong' ? (phien.lopId || 1) : lopId,
      loaiGame,
      tenBan,
      nguoiChoiId,
      tenNguoiChoi,
      JSON.stringify(banCoRong),
      phamVi,
      kieuGhep,
      accessMode,
      matKhauHash,
      matKhauSalt
    ).first();

    return json({ ok: true, phong: { ...tao, banCo: banCoRong } });
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

    if (phong.pham_vi === 'truong' && !phien.hocSinhId) {
      return loi('Đấu trường toàn trường chỉ dành cho học sinh có tài khoản định danh.', 403);
    }

    if (phong.chu_phong_id === nguoiChoiId) {
      // Chủ bàn vào lại bàn của mình
      return json({ ok: true, phongId });
    }

    // Kiểm tra mật khẩu nếu bàn ở chế độ password và không phải chủ phòng / giáo viên
    if (phong.access_mode === 'password' && phong.chu_phong_id !== nguoiChoiId && phien.role !== 'teacher') {
      const pass = String(than.password || than.matKhau || '').trim();
      const dung = await xacMinhMatKhau(pass, phong.mat_khau_hash, phong.mat_khau_salt);
      if (!dung) {
        return loi('Mật khẩu bàn chơi không chính xác.', 403);
      }
    }

    if (phong.trang_thai !== 'cho_nguoi') {
      if (phong.khach_id === nguoiChoiId) {
        // Khách đã ở trong bàn, cho phép quay lại
        return json({ ok: true, phongId });
      }
      return loi('Bàn này đã đủ 2 người chơi hoặc đã kết thúc.', 409);
    }

    // Cập nhật có điều kiện NGUYÊN TỬ — chỉ nhận khách khi bàn vẫn đang chờ (chống 2 người vào cùng lúc)
    const vao = await env.DB.prepare(`
      UPDATE game_phong
      SET khach_id = ?1, khach_ten = ?2, trang_thai = 'dang_choi', cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?3 AND trang_thai = 'cho_nguoi' AND khach_id IS NULL
    `).bind(nguoiChoiId, tenNguoiChoi, phongId).run();

    if (!vao.meta || vao.meta.changes === 0) {
      return loi('Bàn này vừa có người khác vào. Hãy tải lại danh sách bàn.', 409);
    }

    return json({ ok: true, phongId });
  }

  // 3. GHÉP TRẬN NHANH TOÀN TRƯỜNG (Quick Match FIFO)
  if (hanhDong === 'tim_tran_nhanh') {
    // BƯỚC 1 — ACTOR VALIDATION: Bắt buộc là học sinh định danh (canonical student identity)
    if (!phien.hocSinhId) {
      return loi('Tính năng Ghép trận nhanh chỉ dành cho học sinh có tài khoản định danh.', 403);
    }
    const hocSinhId = phien.hocSinhId;
    const lopHocSinhId = phien.lopId || 1;
    const loaiGame = String(than.loaiGame || 'co_caro').trim();

    // BƯỚC 2 — RESUME EXISTING ACTIVE MATCH: Tiếp tục trận đấu đang diễn ra nếu có
    const matchDangChoi = await env.DB.prepare(`
      SELECT id, chu_phong_id, chu_phong_ten, khach_id, khach_ten, lop_id
      FROM game_phong
      WHERE pham_vi = 'truong'
        AND (chu_phong_id = ?1 OR khach_id = ?1)
        AND trang_thai = 'dang_choi'
        AND datetime(cap_nhat_luc) >= datetime('now', '-15 minutes')
      ORDER BY cap_nhat_luc DESC
      LIMIT 1
    `).bind(hocSinhId).first();

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
      WHERE chu_phong_id = ?1 AND loai_game = ?2
        AND pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi'
        AND datetime(cap_nhat_luc) >= datetime('now', '-5 minutes')
      ORDER BY id DESC
      LIMIT 1
    `).bind(hocSinhId, loaiGame).first();

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
      SELECT g.id, g.chu_phong_id, g.chu_phong_ten, g.lop_id, l.ten AS lop_ten
      FROM game_phong g
      LEFT JOIN lop l ON g.lop_id = l.id
      WHERE g.pham_vi = 'truong' AND g.kieu_ghep = 'nhanh' AND g.trang_thai = 'cho_nguoi'
        AND g.khach_id IS NULL AND g.chu_phong_id != ?1 AND g.loai_game = ?2
        AND datetime(g.cap_nhat_luc) >= datetime('now', '-5 minutes')
      ORDER BY g.id ASC
      LIMIT 3
    `).bind(hocSinhId, loaiGame).all();

    // BƯỚC 5 — ATOMIC CLAIM (Kèm điều kiện chống 1 người ghép cùng lúc 2 đối thủ)
    for (const dt of (doiThuCho.results || [])) {
      const claim = await env.DB.prepare(`
        UPDATE game_phong
        SET khach_id = ?1,
            khach_ten = ?2,
            trang_thai = 'dang_choi',
            cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?3
          AND trang_thai = 'cho_nguoi'
          AND khach_id IS NULL
          AND chu_phong_id != ?1
          AND NOT EXISTS (
            SELECT 1 FROM game_phong
            WHERE pham_vi = 'truong'
              AND (chu_phong_id = ?1 OR khach_id = ?1)
              AND trang_thai = 'dang_choi'
              AND datetime(cap_nhat_luc) >= datetime('now', '-15 minutes')
          )
      `).bind(hocSinhId, tenNguoiChoi, dt.id).run();

      if (claim.meta && claim.meta.changes === 1) {
        return json({
          ok: true,
          matched: true,
          resumed: false,
          phongId: dt.id,
          doiThu: {
            ten: dt.chu_phong_ten,
            lopId: dt.lop_id,
            lopTen: dt.lop_ten || `Lớp ${dt.lop_id}`,
          },
        });
      }
    }

    // BƯỚC 6 — CREATE WAITING ROW: Không claim được đối thủ -> tạo bàn chờ Quick Match
    const banCoRong = Array(15).fill(null).map(() => Array(15).fill(null));
    const tenBan = `Quick Match - ${tenNguoiChoi}`;

    try {
      const taoCho = await env.DB.prepare(`
        INSERT INTO game_phong (
          lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
          trang_thai, luot_di_id, du_lieu_ban_co, pham_vi, kieu_ghep, cap_nhat_luc
        ) VALUES (?1, ?2, ?3, ?4, ?5, 'cho_nguoi', ?4, ?6, 'truong', 'nhanh', CURRENT_TIMESTAMP)
        RETURNING id
      `).bind(lopHocSinhId, loaiGame, tenBan, hocSinhId, tenNguoiChoi, JSON.stringify(banCoRong)).first();

      return json({
        ok: true,
        matched: false,
        waiting: true,
        phongId: taoCho.id,
      });
    } catch (err) {
      // Bắt xung đột từ Partial UNIQUE index uq_quick_match_waiting khi có race condition (double-click)
      const banDaCo = await env.DB.prepare(`
        SELECT id FROM game_phong
        WHERE chu_phong_id = ?1 AND loai_game = ?2
          AND pham_vi = 'truong' AND kieu_ghep = 'nhanh' AND trang_thai = 'cho_nguoi'
        ORDER BY id DESC LIMIT 1
      `).bind(hocSinhId, loaiGame).first().catch(() => null);

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
    if (!phongId || !phien.hocSinhId) return json({ ok: true, cancelled: true });

    // Chỉ xoá khi bàn do chính mình tạo, là quick match và chưa có khách
    const xoa = await env.DB.prepare(`
      DELETE FROM game_phong
      WHERE id = ?1 AND chu_phong_id = ?2
        AND pham_vi = 'truong' AND kieu_ghep = 'nhanh'
        AND trang_thai = 'cho_nguoi' AND khach_id IS NULL
    `).bind(phongId, phien.hocSinhId).run();

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

    if (!phongId || r < 0 || r >= 15 || c < 0 || c >= 15) {
      return loi('Nước đi không hợp lệ.');
    }

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');

    if (!canAccessGameRoom(phien, phong)) {
      return loi('Bạn không có quyền truy cập bàn chơi này.', 403);
    }

    if (phong.trang_thai !== 'dang_choi') {
      return loi('Ván cờ chưa bắt đầu hoặc đã kết thúc.');
    }

    // Kiểm tra có phải lượt của mình không
    if (phong.luot_di_id !== nguoiChoiId) {
      return loi('Chưa đến lượt của bạn.', 409);
    }

    let board;
    try {
      board = JSON.parse(phong.du_lieu_ban_co || '[]');
    } catch {
      board = Array(15).fill(null).map(() => Array(15).fill(null));
    }

    if (board[r] && board[r][c] !== null) {
      return loi('Ô này đã được đánh.');
    }

    // Xác định quân cờ: Chủ bàn = 'X', Khách = 'O'
    const laChuPhong = (nguoiChoiId === phong.chu_phong_id);
    const quanCo = laChuPhong ? 'X' : 'O';
    board[r][c] = quanCo;

    // Kiểm tra thắng
    const daThang = kiemTraThangCaro(board, r, c, quanCo);
    let trangThaiMoi = 'dang_choi';
    let nguoiThangId = null;
    const luotTiepTheo = laChuPhong ? phong.khach_id : phong.chu_phong_id;

    if (daThang) {
      trangThaiMoi = 'ket_thuc';
      nguoiThangId = nguoiChoiId;
    } else {
      // Kiểm tra bàn đầy (hoà)
      const conOTrong = board.some((hang) => hang.some((o) => o === null));
      if (!conOTrong) {
        trangThaiMoi = 'hoa';
      }
    }

    // GHI NƯỚC ĐI NGUYÊN TỬ (Optimistic Concurrency Control):
    // Phải đúng id, đang trong trạng thái 'dang_choi', VÀ luot_di_id đúng là người chơi này.
    // Nếu 2 request đồng thời từ cùng người chơi cùng gửi, request đầu đổi lượt -> request sau có changes === 0 và bị từ chối 409.
    const ghi = await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          trang_thai = ?3,
          nguoi_thang_id = ?4,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?5 AND trang_thai = 'dang_choi' AND luot_di_id = ?6
    `).bind(JSON.stringify(board), luotTiepTheo, trangThaiMoi, nguoiThangId, phongId, nguoiChoiId).run();

    if (!ghi.meta || ghi.meta.changes === 0) {
      return loi('Ván cờ đã thay đổi trạng thái hoặc chưa đến lượt. Hãy tải lại bàn đấu.', 409);
    }

    // Ghi nhận thành tích học sinh thắng ván
    if (daThang && phien.hocSinhId) {
      const ghiDiem = ghiNhanHoatDong(env, {
        hocSinhId: phien.hocSinhId,
        lopId: phong.lop_id,
        loaiHoatDong: 'game',
        moTa: phong.pham_vi === 'truong' ? 'Thắng ván Cờ Caro Đấu Trường Toàn Trường' : 'Thắng ván Cờ Caro lớp',
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
      luotDiId: luotTiepTheo,
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
    const laNguoiTrongBan = phong.chu_phong_id === nguoiChoiId || phong.khach_id === nguoiChoiId;
    if (!laNguoiTrongBan && !laGiaoVien) {
      return loi('Bạn không ở trong bàn cờ này.', 403);
    }

    // Bàn cờ rỗng 15x15
    const banCoRong = Array(15).fill(null).map(() => Array(15).fill(null));
    const luotMoi = phong.chu_phong_id;

    await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          trang_thai = 'dang_choi',
          nguoi_thang_id = NULL,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?3 AND (chu_phong_id = ?4 OR khach_id = ?4)
    `).bind(JSON.stringify(banCoRong), luotMoi, phongId, nguoiChoiId).run();

    return json({ ok: true });
  }

  // 7. RỜI BÀN (Scope-aware Leave)
  if (hanhDong === 'roi_ban') {
    const phongId = Number(than.phongId);
    if (!phongId) return json({ ok: true });

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1').bind(phongId).first();
    if (phong) {
      if (phong.chu_phong_id === nguoiChoiId) {
        // Chủ phòng rời
        if (phong.trang_thai === 'cho_nguoi') {
          await env.DB.prepare('DELETE FROM game_phong WHERE id = ?1 AND chu_phong_id = ?2')
            .bind(phongId, nguoiChoiId).run().catch(() => {});
        } else {
          await env.DB.prepare("UPDATE game_phong SET trang_thai = 'huy', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        }
      } else if (phong.khach_id === nguoiChoiId) {
        // Khách rời
        if (phong.kieu_ghep === 'nhanh') {
          // Bàn quick match khách rời khi đang chơi -> kết thúc ván, chủ thắng
          await env.DB.prepare("UPDATE game_phong SET trang_thai = 'ket_thuc', nguoi_thang_id = chu_phong_id, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        } else {
          // Bàn thủ công -> đưa về chờ người
          await env.DB.prepare("UPDATE game_phong SET khach_id = NULL, khach_ten = NULL, trang_thai = 'cho_nguoi', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1")
            .bind(phongId).run().catch(() => {});
        }
      }
    }
    return json({ ok: true });
  }

  return loi('Hành động không được hỗ trợ.');
}, { canGiaoVien: false });
