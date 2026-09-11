// API Phòng hoạt động động của Digital Campus — mọi học sinh/giáo viên đăng nhập
// đều tạo và vào phòng được. Phòng pham_vi='truong' mở cho học sinh TẤT CẢ các lớp
// (liên lớp); pham_vi='lop' chỉ học sinh cùng lớp chủ phòng (và giáo viên) vào được.
// Hỗ trợ chế độ phòng công khai / có mật khẩu và giới hạn sức chứa nguyên tử (Atomic Capacity).
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { bamMatKhau, taoSalt, xacMinhMatKhau } from '../_lib/passwords.js';

const LOAI_PHONG = ['chat', 'video', 'nhac', 'game'];
const SO_PHONG_TOI_DA = 3;            // mỗi người mở tối đa 3 phòng cùng lúc — chống spam
const NHIP_HIEU_LUC = '-90 seconds';  // thành viên còn "tươi" trong 90 giây = đang trong phòng

// Khoá định danh phiên — dùng cho chủ phòng, thành viên, tin nhắn.
function khoaPhien(phien) {
  if (phien.role === 'teacher') return `gv:${phien.lopId || 1}`;
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`;
  if (phien.accountId) return `acc:${phien.accountId}`;
  return `phu:${phien.phuId || 0}`;
}
const vaiTroCua = (phien) => (phien.role === 'teacher' ? 'giao_vien' : 'hoc_sinh');
const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

// Tạo bảng & cột nếu môi trường chưa chạy migration (an toàn, IF NOT EXISTS / ALTER TABLE).
async function damBaoBang(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS phong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loai TEXT NOT NULL DEFAULT 'chat',
    ten TEXT NOT NULL,
    mo_ta TEXT,
    pham_vi TEXT NOT NULL DEFAULT 'truong',
    lop_id INTEGER REFERENCES lop(id),
    chu_phong_khoa TEXT NOT NULL,
    chu_phong_ten TEXT NOT NULL,
    cau_hinh TEXT,
    access_mode TEXT NOT NULL DEFAULT 'public',
    mat_khau_hash TEXT,
    mat_khau_salt TEXT,
    suc_chua INTEGER NOT NULL DEFAULT 20,
    trang_thai TEXT NOT NULL DEFAULT 'mo',
    tao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => {});

  // Cột mở rộng phòng bảo vệ & sức chứa
  await db.prepare(`ALTER TABLE phong ADD COLUMN access_mode TEXT NOT NULL DEFAULT 'public'`).run().catch(() => {});
  await db.prepare(`ALTER TABLE phong ADD COLUMN mat_khau_hash TEXT`).run().catch(() => {});
  await db.prepare(`ALTER TABLE phong ADD COLUMN mat_khau_salt TEXT`).run().catch(() => {});
  await db.prepare(`ALTER TABLE phong ADD COLUMN suc_chua INTEGER NOT NULL DEFAULT 20`).run().catch(() => {});

  await db.prepare(`CREATE TABLE IF NOT EXISTS phong_thanh_vien (
    phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
    khoa TEXT NOT NULL,
    hoc_sinh_id INTEGER,
    ten TEXT NOT NULL,
    vai_tro TEXT NOT NULL DEFAULT 'hoc_sinh',
    lop_id INTEGER,
    hoat_dong_luc TEXT NOT NULL,
    vao_luc TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phong_id, khoa)
  )`).run().catch(() => {});
}

async function layPhong(db, id) {
  return db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
            p.cau_hinh AS cauHinh, p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            p.access_mode AS accessMode, p.mat_khau_hash AS matKhauHash, p.mat_khau_salt AS matKhauSalt,
            p.suc_chua AS sucChua,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?2)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.id = ?1`
  ).bind(id, NHIP_HIEU_LUC).first();
}

// Tuyệt đối không gửi mật khẩu hoặc hash/salt về phía client
function lamSachPhong(p) {
  if (!p) return null;
  const clone = { ...p };
  delete clone.matKhauHash;
  delete clone.matKhauSalt;
  clone.access_mode = clone.accessMode || clone.access_mode || 'public';
  clone.accessMode = clone.access_mode;

  // Tính toán trạng thái hiển thị chi tiết cho sảnh (waiting / active / full)
  const soNguoi = clone.soNguoi || 0;
  const sucChua = clone.sucChua || 20;
  if (clone.loai === 'game') {
    clone.trangThaiChiTiet = clone.trangThai === 'mo' ? (soNguoi >= sucChua ? 'dang_choi' : 'cho_nguoi') : clone.trangThai;
  } else {
    clone.trangThaiChiTiet = soNguoi >= sucChua ? 'full' : (soNguoi > 1 ? 'active' : 'waiting');
  }

  return clone;
}

// Học sinh chỉ vào được phòng 'truong' hoặc phòng 'lop' của đúng lớp mình.
// Giáo viên vào được mọi phòng (giám sát).
function duocVao(phong, phien) {
  if (!phong || phong.trangThai !== 'mo') return false;
  if (phong.phamVi === 'truong') return true;
  if (phien.role === 'teacher') return true;
  return phong.lopId === phien.lopId;
}

// Ghi nhận vào phòng với kiểm soát sức chứa nguyên tử (Atomic Capacity Enforcement)
async function ghiNhanVao(db, phongId, phien, sucChua = 20) {
  const khoa = khoaPhien(phien);
  const res = await db.prepare(
    `INSERT INTO phong_thanh_vien (phong_id, khoa, hoc_sinh_id, ten, vai_tro, lop_id, hoat_dong_luc)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, datetime('now')
      WHERE (
        EXISTS (SELECT 1 FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2)
        OR
        (SELECT COUNT(*) FROM phong_thanh_vien WHERE phong_id = ?1 AND datetime(hoat_dong_luc) > datetime('now', ?7)) < ?8
      )
      ON CONFLICT(phong_id, khoa) DO UPDATE SET hoat_dong_luc = datetime('now'), ten = ?4`
  ).bind(phongId, khoa, phien.hocSinhId || null, tenCua(phien), vaiTroCua(phien), phien.lopId || null, NHIP_HIEU_LUC, sucChua).run();

  return (res.meta?.changes ?? 0) > 0;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  // Dọn thành viên đã "chết" heartbeat (rời phòng không bấm nút / đóng tab).
  await db.prepare(
    `DELETE FROM phong_thanh_vien WHERE datetime(hoat_dong_luc) < datetime('now', '-15 minutes')`
  ).run().catch(() => {});

  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('id') || '', 10);

  // Chi tiết 1 phòng + danh sách thành viên đang trong phòng.
  if (phongId > 0) {
    const p = await layPhong(db, phongId);
    if (!p || p.trangThai !== 'mo') return loi('Phòng không tồn tại hoặc đã đóng.', 404);
    if (!duocVao(p, phien)) return loi('Phòng này chỉ dành cho lớp ' + (p.lopTen || 'khác') + '.', 403);
    const tv = await db.prepare(
      `SELECT v.khoa, v.ten, v.vai_tro AS vaiTro, v.lop_id AS lopId, l.ten AS lopTen,
              (v.khoa = ?2) AS laChuPhong
         FROM phong_thanh_vien v LEFT JOIN lop l ON l.id = v.lop_id
        WHERE v.phong_id = ?1 AND datetime(v.hoat_dong_luc) > datetime('now', ?3)
        ORDER BY v.vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HIEU_LUC).all();
    return json({ ok: true, phong: lamSachPhong(p), thanhVien: tv.results || [], minhKhoa: khoaPhien(phien) });
  }

  // Danh sách phòng đang mở: toàn bộ phòng 'truong' + phòng 'lop' của lớp mình.
  const rs = await db.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId,
            p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen,
            p.trang_thai AS trangThai, p.tao_luc AS taoLuc,
            p.access_mode AS accessMode, p.suc_chua AS sucChua,
            l.ten AS lopTen,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?3)) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE p.trang_thai = 'mo'
        AND (p.pham_vi = 'truong' OR p.lop_id = ?1 OR ?2 = 1)
      ORDER BY (p.chu_phong_khoa = 'he-thong') DESC, soNguoi DESC, p.tao_luc DESC
      LIMIT 50`
  ).bind(phien.lopId || 0, phien.role === 'teacher' ? 1 : 0, NHIP_HIEU_LUC).all();

  // Số người đang hoạt động toàn campus (chỉ tính phòng toàn trường đang mở) — DISTINCT khoá phiên.
  const dd = await db.prepare(
    `SELECT COUNT(DISTINCT v.khoa) AS n
       FROM phong_thanh_vien v
       JOIN phong p ON p.id = v.phong_id
      WHERE p.trang_thai = 'mo'
        AND p.pham_vi = 'truong'
        AND datetime(v.hoat_dong_luc) > datetime('now', ?1)`
  ).bind(NHIP_HIEU_LUC).first();

  const phongSach = (rs.results || []).map((p) => lamSachPhong(p));

  return json({ ok: true, phongs: phongSach, dangHoatDong: dd?.n || 0 });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const than = await docThan(request);
  const hanhDong = chuoi(than.hanhDong, 20);
  const khoa = khoaPhien(phien);

  // ── TẠO PHÒNG — mọi học sinh/GV đăng nhập đều được ──
  if (hanhDong === 'tao') {
    const ten = chuoi(than.ten, 80);
    const moTa = chuoi(than.moTa, 300);
    const loai = LOAI_PHONG.includes(than.loai) ? than.loai : 'chat';
    const phamVi = than.phamVi === 'lop' ? 'lop' : 'truong';
    if (ten.length < 2) return loi('Đặt tên phòng ít nhất 2 ký tự.');

    // Chế độ truy cập: public hoặc password
    const accessMode = (than.accessMode === 'password' || than.access_mode === 'password') ? 'password' : 'public';
    let matKhauHash = null;
    let matKhauSalt = null;

    if (accessMode === 'password') {
      const pass = String(than.password || than.matKhau || '').trim();
      if (pass.length < 1) {
        return loi('Phòng có mật khẩu yêu cầu nhập mật khẩu bảo vệ.', 400);
      }
      matKhauSalt = taoSalt(16);
      matKhauHash = await bamMatKhau(pass, matKhauSalt);
    }

    // Sức chứa tối đa (Capacity)
    let sucChua;
    if (loai === 'game') {
      sucChua = 2; // Caro strictly 2 players
    } else {
      const rawSucChua = parseInt(than.sucChua || than.capacity, 10);
      sucChua = !isNaN(rawSucChua) ? Math.min(50, Math.max(2, rawSucChua)) : 20;
    }

    const cauHinh = {};
    if (loai === 'nhac' && than.nhacUrl) {
      const u = chuanUrlMedia(than.nhacUrl);
      if (u === false) return loi('Link nhạc không hợp lệ — chỉ nhận link https:// (mp3/stream).');
      if (u) cauHinh.nhacUrl = u;
    }

    if (loai === 'video') {
      const u = chuanUrlMedia(than.videoUrl);
      if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https:// (YouTube, Drive, mp4...).');
      if (!u) return loi('Phòng xem video cần dán link video (YouTube / Google Drive / mp4).');
      cauHinh.videoUrl = u;
    }

    const dangMo = await db.prepare(
      `SELECT COUNT(*) AS n FROM phong WHERE chu_phong_khoa = ?1 AND trang_thai = 'mo'`
    ).bind(khoa).first();
    if ((dangMo?.n || 0) >= SO_PHONG_TOI_DA) {
      return loi(`Mỗi người chỉ mở tối đa ${SO_PHONG_TOI_DA} phòng cùng lúc — đóng bớt phòng cũ rồi tạo lại.`, 429);
    }

    const kq = await db.prepare(
      `INSERT INTO phong (
         loai, ten, mo_ta, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
         cau_hinh, access_mode, mat_khau_hash, mat_khau_salt, suc_chua
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
    ).bind(
      loai, ten, moTa || null, phamVi, phien.lopId || null, khoa, tenCua(phien),
      Object.keys(cauHinh).length ? JSON.stringify(cauHinh) : null,
      accessMode, matKhauHash, matKhauSalt, sucChua
    ).run();

    const phongId = kq.meta?.last_row_id;
    if (loai === 'video' && phongId > 0) {
      await db.prepare(
        `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
         VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)`
      ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});
    }
    if (loai === 'nhac' && phongId > 0) {
      await db.prepare(
        `INSERT INTO phong_focus_state (phong_id, giai_doan, trang_thai, thoi_luong_giay, thoi_gian_con_lai_giay, preset, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
         VALUES (?1, 'focus', 'paused', 1500, 1500, '25_5', 1, CURRENT_TIMESTAMP, ?2, ?3)`
      ).bind(phongId, khoa, tenCua(phien)).run().catch(() => {});
    }

    await ghiNhanVao(db, phongId, phien, sucChua);
    if (phien.hocSinhId) {
      await ghiNhanHoatDong(env, { hocSinhId: phien.hocSinhId, lopId: phien.lopId, loaiHoatDong: 'chat', moTa: `Tạo phòng "${ten}"` }).catch(() => {});
    }
    return json({ ok: true, phong: lamSachPhong(await layPhong(db, phongId)) });
  }

  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  const p = await layPhong(db, phongId);

  // ── VÀO PHÒNG / NHỊP heartbeat (giữ chỗ trong phòng) ──
  if (hanhDong === 'vao' || hanhDong === 'nhip') {
    if (!duocVao(p, phien)) {
      return loi(!p || p.trangThai !== 'mo' ? 'Phòng đã đóng.' : `Phòng này chỉ dành cho ${p.lopTen || 'lớp khác'}.`, 403);
    }

    // Kiểm tra mật khẩu nếu phòng ở chế độ password và chưa phải là chủ phòng hay giáo viên
    if (p.accessMode === 'password' && p.chuPhongKhoa !== khoa && phien.role !== 'teacher') {
      const daTrongPhong = await db.prepare(
        'SELECT 1 FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2'
      ).bind(phongId, khoa).first();

      if (!daTrongPhong) {
        const pass = String(than.password || than.matKhau || '').trim();
        const dungMatKhau = await xacMinhMatKhau(pass, p.matKhauHash, p.matKhauSalt);
        if (!dungMatKhau) {
          return loi('Mật khẩu phòng không chính xác.', 403);
        }
      }
    }

    const sucChua = p.sucChua || 20;
    const ghiNhanOk = await ghiNhanVao(db, phongId, phien, sucChua);
    if (!ghiNhanOk) {
      return loi('Phòng đã đầy (đạt giới hạn người tham gia).', 409);
    }

    return json({ ok: true, phong: lamSachPhong(await layPhong(db, phongId)) });
  }

  // ── RỜI PHÒNG ──
  if (hanhDong === 'roi') {
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1 AND khoa = ?2').bind(phongId, khoa).run();
    return json({ ok: true });
  }

  // ── ĐÓNG PHÒNG — chỉ chủ phòng hoặc giáo viên ──
  if (hanhDong === 'dong') {
    if (!p) return loi('Phòng không tồn tại.', 404);
    if (p.chuPhongKhoa !== khoa && phien.role !== 'teacher') {
      return loi('Chỉ chủ phòng hoặc giáo viên mới đóng được phòng.', 403);
    }
    await db.prepare(`UPDATE phong SET trang_thai = 'dong', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`).bind(phongId).run();
    await db.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1').bind(phongId).run();
    await db.prepare('DELETE FROM phong_dong_bo_video WHERE phong_id = ?1').bind(phongId).run().catch(() => {});
    await db.prepare('DELETE FROM phong_focus_state WHERE phong_id = ?1').bind(phongId).run().catch(() => {});
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.', 400);
});
