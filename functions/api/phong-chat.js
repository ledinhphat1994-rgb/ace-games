// API chat riêng của từng phòng hoạt động (Digital Campus).
// Phòng 'truong' cho học sinh mọi lớp cùng trò chuyện — đây là kênh liên lớp.
// Tôn trọng danh sách cấm chat của lớp (chat_cam_hoc_sinh) — học sinh bị GVCN
// cấm chat thì cũng không gửi được tin trong phòng.
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';
import { ghiNhanHoatDong } from './gamification.js';
import { actorKey } from '../_lib/auth.js';
import { kiemTraTruyCapPhong, kiemTraQuyenPhong, taiChinhSach, CAPABILITY } from '../_lib/rooms.js';

const GIAN_CACH_TIN_GIAY = 3; // chống spam: tối thiểu 3 giây giữa 2 tin của 1 người

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);

  // Chat bị tắt (policy enabled=0) → member không đọc được; staff vẫn đọc để kiểm duyệt.
  const polChat = await taiChinhSach(db, phongId, CAPABILITY.CHAT);
  if (!polChat.enabled && !check.isStaff) {
    return json({ ok: false, loi: 'Chat phòng đang bị tắt.', code: 'capability_off' }, 403);
  }

  const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
  const rs = await db.prepare(
    `SELECT t.id, t.ten_nguoi_gui AS tenNguoiGui, t.vai_tro AS vaiTro, t.noi_dung AS noiDung,
            t.tao_luc AS taoLuc, t.lop_id AS lopId, l.ten AS lopTen, t.video_time_sec AS videoTimeSec
       FROM phong_tin_nhan t LEFT JOIN lop l ON l.id = t.lop_id
      WHERE t.phong_id = ?1 AND t.id > ?2 AND t.da_xoa = 0
      ORDER BY t.id ASC LIMIT 100`
  ).bind(phongId, sauId).all();

  return json({ ok: true, tinNhan: rs.results || [] });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  const noiDung = chuoi(than.noiDung, 500);
  if (!(phongId > 0)) return loi('Thiếu phòng.', 400);
  if (!noiDung) return loi('Tin nhắn trống.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);

  // Capability 'chat' server-authoritative (tắt / staff_only / selected / everyone).
  const quyenChat = await kiemTraQuyenPhong(db, check, CAPABILITY.CHAT);
  if (!quyenChat.ok) return json({ ok: false, loi: quyenChat.loi, code: quyenChat.code }, quyenChat.status);

  const khoa = actorKey(phien);
  const vaiTro = (phien.role === 'teacher' || phien.role === 'admin') ? 'giao_vien' : 'hoc_sinh';
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

  // Tin nhắn có thể gắn mốc thời gian video ("12:34 — đoạn này chưa hiểu").
  let videoTimeSec = null;
  if (than.videoTimeSec !== undefined && than.videoTimeSec !== null) {
    const v = Number(than.videoTimeSec);
    if (!isNaN(v) && isFinite(v) && v >= 0 && v <= 86400) videoTimeSec = Math.floor(v);
  }

  const kq = await db.prepare(
    `INSERT INTO phong_tin_nhan (phong_id, khoa, hoc_sinh_id, ten_nguoi_gui, vai_tro, lop_id, noi_dung, video_time_sec)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  ).bind(phongId, khoa, phien.hocSinhId || null, ten, vaiTro, phien.lopId || null, noiDung, videoTimeSec).run();

  // Gửi tin cũng tính là đang ở trong phòng — cập nhật heartbeat luôn.
  await db.prepare(
    `UPDATE phong_thanh_vien SET hoat_dong_luc = datetime('now') WHERE phong_id = ?1 AND khoa = ?2`
  ).bind(phongId, khoa).run().catch(() => {});

  if (phien.hocSinhId) {
    await ghiNhanHoatDong(env, { hocSinhId: phien.hocSinhId, lopId: phien.lopId, loaiHoatDong: 'chat', moTa: 'Chat phòng campus', quaHuyHieu: false }).catch(() => {});
  }

  const tinMoi = await db.prepare(
    `SELECT t.id, t.ten_nguoi_gui AS tenNguoiGui, t.vai_tro AS vaiTro, t.noi_dung AS noiDung,
            t.tao_luc AS taoLuc, t.lop_id AS lopId, l.ten AS lopTen, t.video_time_sec AS videoTimeSec
       FROM phong_tin_nhan t LEFT JOIN lop l ON l.id = t.lop_id
      WHERE t.id = ?1`
  ).bind(kq.meta?.last_row_id).first();

  return json({ ok: true, tinNhan: tinMoi });
});

// ── MODERATION: xóa mềm tin nhắn — chỉ staff phòng (host/GV/co-host) ──
export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  const tinId = parseInt(url.searchParams.get('id') || '', 10);
  if (!(phongId > 0) || !(tinId > 0)) return loi('Thiếu phòng hoặc tin nhắn.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);
  if (!check.isStaff) return loi('Chỉ quản trị phòng mới xóa được tin nhắn.', 403);

  await db.prepare(
    `UPDATE phong_tin_nhan SET da_xoa = 1 WHERE id = ?1 AND phong_id = ?2`
  ).bind(tinId, phongId).run();
  return json({ ok: true });
});
