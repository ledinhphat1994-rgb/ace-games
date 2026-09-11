// API chat riêng của từng phòng hoạt động (Digital Campus).
// Phòng 'truong' cho học sinh mọi lớp cùng trò chuyện — đây là kênh liên lớp.
// Tôn trọng danh sách cấm chat của lớp (chat_cam_hoc_sinh) — học sinh bị GVCN
// cấm chat thì cũng không gửi được tin trong phòng.
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';

const GIAN_CACH_TIN_GIAY = 3;   // chống spam: tối thiểu 3 giây giữa 2 tin của 1 người

function khoaPhien(phien) {
  if (phien.role === 'teacher') return `gv:${phien.lopId || 1}`;
  if (phien.hocSinhId) return `hs:${phien.hocSinhId}`;
  return `phu:${phien.phuId || 0}`;
}

async function damBaoBang(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS phong_tin_nhan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phong_id INTEGER NOT NULL REFERENCES phong(id) ON DELETE CASCADE,
    khoa TEXT NOT NULL,
    hoc_sinh_id INTEGER,
    ten_nguoi_gui TEXT NOT NULL,
    vai_tro TEXT NOT NULL DEFAULT 'hoc_sinh',
    lop_id INTEGER,
    noi_dung TEXT NOT NULL,
    tao_luc TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run().catch(() => {});
}

// Lấy phòng + kiểm tra quyền vào (giống api/phong.js).
async function layPhongVaKiem(db, phongId, phien) {
  const p = await db.prepare(
    `SELECT id, ten, pham_vi AS phamVi, lop_id AS lopId, trang_thai AS trangThai
       FROM phong WHERE id = ?1`
  ).bind(phongId).first();
  if (!p || p.trangThai !== 'mo') return { loi: 'Phòng không tồn tại hoặc đã đóng.', status: 404 };
  if (p.phamVi !== 'truong' && phien.role !== 'teacher' && p.lopId !== phien.lopId) {
    return { loi: 'Phòng này chỉ dành cho lớp khác.', status: 403 };
  }
  return { phong: p };
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);

  const k = await layPhongVaKiem(db, phongId, phien);
  if (k.loi) return loi(k.loi, k.status);

  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const rs = await db.prepare(
    `SELECT t.id, t.ten_nguoi_gui AS tenNguoiGui, t.vai_tro AS vaiTro, t.noi_dung AS noiDung,
            t.tao_luc AS taoLuc, t.lop_id AS lopId, l.ten AS lopTen
       FROM phong_tin_nhan t LEFT JOIN lop l ON l.id = t.lop_id
      WHERE t.phong_id = ?1 AND t.id > ?2
      ORDER BY t.id ASC LIMIT 100`
  ).bind(phongId, sauId).all();

  return json({ ok: true, tinNhan: rs.results || [], minhKhoa: khoaPhien(phien) });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  await damBaoBang(db);
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  const noiDung = chuoi(than.noiDung, 500);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  if (!noiDung) return loi('Tin nhắn trống.', 400);

  const k = await layPhongVaKiem(db, phongId, phien);
  if (k.loi) return loi(k.loi, k.status);

  const khoa = khoaPhien(phien);
  const vaiTro = phien.role === 'teacher' ? 'giao_vien' : 'hoc_sinh';
  const ten = phien.ten || phien.vaiTro || 'Thành viên';

  // Học sinh đang bị GVCN cấm chat (trong lớp mình) thì không chat được trong phòng.
  if (vaiTro === 'hoc_sinh' && phien.hocSinhId) {
    const cam = await db.prepare(
      `SELECT den_luc AS denLuc FROM chat_cam_hoc_sinh
        WHERE hoc_sinh_id = ?1 AND lop_id = ?2`
    ).bind(phien.hocSinhId, phien.lopId || 0).first().catch(() => null);
    if (cam && (!cam.denLuc || new Date(cam.denLuc).getTime() > Date.now())) {
      return loi('Em đang bị cấm chat — liên hệ GVCN để được mở lại.', 403);
    }
  }

  // Chống spam: cách tối thiểu GIAN_CACH_TIN_GIAY giây giữa 2 tin của 1 người.
  const gan = await db.prepare(
    `SELECT tao_luc AS luc FROM phong_tin_nhan
      WHERE phong_id = ?1 AND khoa = ?2
      ORDER BY id DESC LIMIT 1`
  ).bind(phongId, khoa).first();
  if (gan && Date.now() - new Date(String(gan.luc).replace(' ', 'T') + 'Z').getTime() < GIAN_CACH_TIN_GIAY * 1000) {
    return loi('Gửi chậm lại một chút nhé!', 429);
  }

  const kq = await db.prepare(
    `INSERT INTO phong_tin_nhan (phong_id, khoa, hoc_sinh_id, ten_nguoi_gui, vai_tro, lop_id, noi_dung)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
  ).bind(phongId, khoa, phien.hocSinhId || null, ten, vaiTro, phien.lopId || null, noiDung).run();

  // Gửi tin cũng tính là đang ở trong phòng — cập nhật heartbeat luôn.
  await db.prepare(
    `UPDATE phong_thanh_vien SET hoat_dong_luc = datetime('now') WHERE phong_id = ?1 AND khoa = ?2`
  ).bind(phongId, khoa).run().catch(() => {});

  if (phien.hocSinhId) {
    await ghiNhanHoatDong(env, { hocSinhId: phien.hocSinhId, lopId: phien.lopId, loaiHoatDong: 'chat', moTa: 'Chat phòng campus', quaHuyHieu: false }).catch(() => {});
  }

  const tinMoi = await db.prepare(
    `SELECT t.id, t.ten_nguoi_gui AS tenNguoiGui, t.vai_tro AS vaiTro, t.noi_dung AS noiDung,
            t.tao_luc AS taoLuc, t.lop_id AS lopId, l.ten AS lopTen
       FROM phong_tin_nhan t LEFT JOIN lop l ON l.id = t.lop_id
      WHERE t.id = ?1`
  ).bind(kq.meta?.last_row_id).first();

  return json({ ok: true, tinNhan: tinMoi });
});
