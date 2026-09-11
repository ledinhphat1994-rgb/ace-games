// API Trò chơi trực tuyến nhiều người (Game Hub Online)
// Dùng chung cho học sinh trong lớp (Cờ Caro trực tuyến thời gian thực)
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';

async function damBaoBangGame(db) {
  if (!db) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS game_phong (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      lop_id          INTEGER NOT NULL,
      loai_game       TEXT NOT NULL,
      ten_ban         TEXT NOT NULL,
      chu_phong_id    INTEGER NOT NULL,
      chu_phong_ten   TEXT NOT NULL,
      khach_id        INTEGER,
      khach_ten       TEXT,
      trang_thai      TEXT NOT NULL DEFAULT 'cho_nguoi',
      luot_di_id      INTEGER,
      du_lieu_ban_co  TEXT,
      nguoi_thang_id  INTEGER,
      tao_luc         TEXT DEFAULT CURRENT_TIMESTAMP,
      cap_nhat_luc    TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {});
}

// Xác định lop_id được phép thao tác: học sinh/cán sự bị khoá vào lớp của chính mình
// (chống IDOR xuyên lớp). Chỉ giáo viên chủ nhiệm mới được xem lớp khác qua tham số.
function lopIdCuaPhien(phien, reqLopIdRaw) {
  const lopId = phien.lopId || 1;
  if (phien.role === 'teacher') {
    const req = parseInt(reqLopIdRaw || '', 10);
    if (req > 0) return req;
  }
  return lopId;
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
  await damBaoBangGame(env.DB);
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '0', 10);
  const loaiGame = url.searchParams.get('loai') || 'co_caro';
  const lopId = lopIdCuaPhien(phien, url.searchParams.get('lopId'));

  // Lấy chi tiết 1 phòng cụ thể — bắt buộc thuộc lớp của phiên đăng nhập
  if (phongId > 0) {
    const phong = await env.DB.prepare(
      'SELECT * FROM game_phong WHERE id = ?1 AND lop_id = ?2'
    ).bind(phongId, lopId).first();

    if (!phong) return loi('Bàn chơi không tồn tại hoặc đã kết thúc.', 404);

    let banCo = null;
    try {
      banCo = phong.du_lieu_ban_co ? JSON.parse(phong.du_lieu_ban_co) : null;
    } catch {
      banCo = null;
    }

    return json({
      ok: true,
      phong: {
        id: phong.id,
        lopId: phong.lop_id,
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
        capNhatLuc: phong.cap_nhat_luc,
      },
    });
  }

  // Dọn dẹp phòng rác quá 2 tiếng không hoạt động
  await env.DB.prepare(`
    DELETE FROM game_phong
    WHERE lop_id = ?1 AND datetime(cap_nhat_luc) < datetime('now', '-2 hours')
  `).bind(lopId).run().catch(() => {});

  // Lấy danh sách các bàn đang mở / đang chơi của lớp
  const rs = await env.DB.prepare(`
    SELECT id, lop_id AS lopId, loai_game AS loaiGame, ten_ban AS tenBan,
           chu_phong_id AS chuPhongId, chu_phong_ten AS chuPhongTen,
           khach_id AS khachId, khach_ten AS khachTen,
           trang_thai AS trangThai, luot_di_id AS luotDiId,
           tao_luc AS taoLuc, cap_nhat_luc AS capNhatLuc
    FROM game_phong
    WHERE lop_id = ?1 AND loai_game = ?2 AND trang_thai IN ('cho_nguoi', 'dang_choi')
    ORDER BY id DESC
    LIMIT 20
  `).bind(lopId, loaiGame).all();

  return json({
    ok: true,
    danhSachBan: rs.results || [],
  });
}, { canGiaoVien: false });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  await damBaoBangGame(env.DB);
  const than = await docThan(request);
  const hanhDong = String(than.hanhDong || '').trim();
  const laGiaoVien = phien.role === 'teacher';
  const lopId = lopIdCuaPhien(phien, than.lopId);

  // Xác định người chơi hiện tại
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

  // 1. TẠO BÀN MỚI
  if (hanhDong === 'tao_ban') {
    const loaiGame = String(than.loaiGame || 'co_caro').trim();
    let tenBan = String(than.tenBan || '').trim();
    if (!tenBan) tenBan = `Bàn của ${tenNguoiChoi}`;
    if (tenBan.length > 40) tenBan = tenBan.slice(0, 40);

    // Tạo bàn cờ rỗng 15x15
    const banCoRong = Array(15).fill(null).map(() => Array(15).fill(null));

    const tao = await env.DB.prepare(`
      INSERT INTO game_phong (
        lop_id, loai_game, ten_ban, chu_phong_id, chu_phong_ten,
        trang_thai, luot_di_id, du_lieu_ban_co, cap_nhat_luc
      ) VALUES (?1, ?2, ?3, ?4, ?5, 'cho_nguoi', ?4, ?6, CURRENT_TIMESTAMP)
      RETURNING id, lop_id AS lopId, loai_game AS loaiGame, ten_ban AS tenBan,
                chu_phong_id AS chuPhongId, chu_phong_ten AS chuPhongTen,
                khach_id AS khachId, khach_ten AS khachTen,
                trang_thai AS trangThai, luot_di_id AS luotDiId
    `).bind(lopId, loaiGame, tenBan, nguoiChoiId, tenNguoiChoi, JSON.stringify(banCoRong)).first();

    return json({ ok: true, phong: { ...tao, banCo: banCoRong } });
  }

  // 2. VÀO BÀN CHƠI (Học sinh 2 tham gia)
  if (hanhDong === 'vao_ban') {
    const phongId = Number(than.phongId);
    if (!phongId) return loi('Thiếu mã bàn chơi.');

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1 AND lop_id = ?2').bind(phongId, lopId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');
    if (phong.trang_thai !== 'cho_nguoi') {
      if (phong.chu_phong_id === nguoiChoiId || phong.khach_id === nguoiChoiId) {
        // Đã ở trong bàn, cho phép quay lại
        return json({ ok: true, phongId });
      }
      return loi('Bàn này đã đủ 2 người chơi hoặc đã kết thúc.');
    }

    if (phong.chu_phong_id === nguoiChoiId) {
      // Chủ bàn vào lại bàn của mình
      return json({ ok: true, phongId });
    }

    // Cập nhật có điều kiện — chỉ nhận khách khi bàn vẫn đang chờ (chống 2 người vào cùng lúc)
    const vao = await env.DB.prepare(`
      UPDATE game_phong
      SET khach_id = ?1, khach_ten = ?2, trang_thai = 'dang_choi', cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?3 AND lop_id = ?4 AND trang_thai = 'cho_nguoi'
    `).bind(nguoiChoiId, tenNguoiChoi, phongId, lopId).run();

    if (!vao.meta || vao.meta.changes === 0) {
      return loi('Bàn này vừa có người khác vào. Hãy tải lại danh sách bàn.', 409);
    }

    return json({ ok: true, phongId });
  }

  // 3. ĐÁNH MỘT NƯỚC CỜ (Real-time move)
  if (hanhDong === 'danh_co') {
    const phongId = Number(than.phongId);
    const r = parseInt(than.r, 10);
    const c = parseInt(than.c, 10);

    if (!phongId || r < 0 || r >= 15 || c < 0 || c >= 15) {
      return loi('Nước đi không hợp lệ.');
    }

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1 AND lop_id = ?2').bind(phongId, lopId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');
    if (phong.trang_thai !== 'dang_choi') {
      return loi('Ván cờ chưa bắt đầu hoặc đã kết thúc.');
    }

    // Kiểm tra có phải lượt của mình không
    if (phong.luot_di_id !== nguoiChoiId) {
      return loi('Chưa đến lượt của bạn.');
    }

    let board = [];
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
    let luotTiepTheo = laChuPhong ? phong.khach_id : phong.chu_phong_id;

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

    // Ghi nước đi NGUYÊN TỬ: chỉ thành công nếu vẫn đang là lượt của người này
    // (chống race khi 2 request hợp lệ đến cùng lúc) và đúng lớp sở hữu bàn.
    const ghi = await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          trang_thai = ?3,
          nguoi_thang_id = ?4,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?5 AND lop_id = ?6 AND luot_di_id = ?7 AND trang_thai = 'dang_choi'
    `).bind(JSON.stringify(board), luotTiepTheo, trangThaiMoi, nguoiThangId, phongId, lopId, nguoiChoiId).run();

    if (!ghi.meta || ghi.meta.changes === 0) {
      return loi('Ván cờ đã thay đổi trạng thái. Hãy tải lại bàn đấu.', 409);
    }

    // Ghi điểm THẬT cho học sinh vừa thắng ván — chạy nền, không chặn phản hồi.
    if (daThang && phien.hocSinhId) {
      const ghiDiem = ghiNhanHoatDong(env, {
        hocSinhId: phien.hocSinhId, lopId,
        loaiHoatDong: 'game',
        moTa: 'Thắng ván Cờ Caro đấu trường',
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

  // 4. CHƠI VÁN MỚI (Cùng bạn trong phòng)
  if (hanhDong === 'van_moi') {
    const phongId = Number(than.phongId);
    if (!phongId) return loi('Thiếu mã bàn chơi.');

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1 AND lop_id = ?2').bind(phongId, lopId).first();
    if (!phong) return loi('Bàn chơi không tồn tại.');

    // Chỉ 2 người trong bàn (hoặc giáo viên) mới được mở ván mới
    const laNguoiTrongBan = phong.chu_phong_id === nguoiChoiId || phong.khach_id === nguoiChoiId;
    if (!laNguoiTrongBan && !laGiaoVien) {
      return loi('Bạn không ở trong bàn cờ này.', 403);
    }

    // Bàn cờ rỗng 15x15
    const banCoRong = Array(15).fill(null).map(() => Array(15).fill(null));

    // Đảo lượt đi ván mới hoặc chủ bàn đi trước
    const luotMoi = phong.chu_phong_id;

    await env.DB.prepare(`
      UPDATE game_phong
      SET du_lieu_ban_co = ?1,
          luot_di_id = ?2,
          trang_thai = 'dang_choi',
          nguoi_thang_id = NULL,
          cap_nhat_luc = CURRENT_TIMESTAMP
      WHERE id = ?3 AND lop_id = ?4
    `).bind(JSON.stringify(banCoRong), luotMoi, phongId, lopId).run();

    return json({ ok: true });
  }

  // 5. RỜI BÀN
  if (hanhDong === 'roi_ban') {
    const phongId = Number(than.phongId);
    if (!phongId) return json({ ok: true });

    const phong = await env.DB.prepare('SELECT * FROM game_phong WHERE id = ?1 AND lop_id = ?2').bind(phongId, lopId).first();
    if (phong) {
      if (phong.chu_phong_id === nguoiChoiId) {
        // Chủ phòng rời -> huỷ bàn
        await env.DB.prepare("UPDATE game_phong SET trang_thai = 'huy', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1 AND lop_id = ?2")
          .bind(phongId, lopId).run();
      } else if (phong.khach_id === nguoiChoiId) {
        // Khách rời -> đưa về chờ người
        await env.DB.prepare("UPDATE game_phong SET khach_id = NULL, khach_ten = NULL, trang_thai = 'cho_nguoi', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1 AND lop_id = ?2")
          .bind(phongId, lopId).run();
      }
    }
    return json({ ok: true });
  }

  return loi('Hành động không được hỗ trợ.');
}, { canGiaoVien: false });
