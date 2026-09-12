// API Hàng đợi video của Study Room (Phase 4G).
// Các thao tác queue: enqueue / add_next / remove / reorder / send_to_chat → capability 'queue'.
// play_now / skip (đổi video đang phát) → capability 'video_change'.
// Mọi thao tác đều server-authoritative qua kiemTraQuyenPhong.
import { bocXuLy, docThan, json, loi, chuoi, chuanUrlMedia } from '../_lib/api.js';
import { kiemTraTruyCapPhong, kiemTraQuyenPhong, CAPABILITY } from '../_lib/rooms.js';

const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

function layIdYoutube(u) {
  const m = String(u || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,20})/i);
  return m ? m[1] : null;
}

async function doiVideoDangPhat(db, phongId, videoUrl, khoa, ten) {
  const p = await db.prepare(`SELECT cau_hinh AS cauHinh FROM phong WHERE id = ?1`).bind(phongId).first();
  let cauHinh = {};
  try { cauHinh = p?.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch { /* bỏ qua */ }
  cauHinh.videoUrl = videoUrl;
  await db.prepare(
    `UPDATE phong SET cau_hinh = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2`
  ).bind(JSON.stringify(cauHinh), phongId).run();
  await db.prepare(
    `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
     VALUES (?1, 'paused', 0, 1.0, 1, CURRENT_TIMESTAMP, ?2, ?3)
     ON CONFLICT(phong_id) DO UPDATE SET
       trang_thai = 'paused', vi_tri_giay = 0, toc_do = 1.0,
       revision = revision + 1, cap_nhat_luc = CURRENT_TIMESTAMP,
       nguoi_cap_nhat_khoa = ?2, nguoi_cap_nhat_ten = ?3`
  ).bind(phongId, khoa, ten).run().catch(() => {});
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);

  const rs = await db.prepare(
    `SELECT id, video_url AS videoUrl, video_id AS videoId, title, thumb,
            added_by_ten AS addedBy, ord, trang_thai AS trangThai, tao_luc AS taoLuc
       FROM phong_video_queue
      WHERE phong_id = ?1 AND trang_thai IN ('queued', 'playing')
      ORDER BY CASE trang_thai WHEN 'playing' THEN 0 ELSE 1 END, ord ASC, id ASC
      LIMIT 50`
  ).bind(phongId).all().catch(() => ({ results: [] }));

  const quyenQueue = await kiemTraQuyenPhong(db, check, CAPABILITY.QUEUE);
  const quyenDoi = await kiemTraQuyenPhong(db, check, CAPABILITY.VIDEO_CHANGE);
  return json({
    ok: true,
    queue: rs.results || [],
    caps: { queue: quyenQueue.ok, video_change: quyenDoi.ok },
  });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);
  const khoa = check.actorKey;
  const ten = tenCua(phien);

  const action = chuoi(than.action, 20);
  const ACTIONS = ['enqueue', 'add_next', 'remove', 'reorder', 'play_now', 'skip', 'send_to_chat'];
  if (!ACTIONS.includes(action)) return loi('Hành động queue không hợp lệ.', 400);

  // play_now / skip đổi video đang phát → cần video_change; còn lại cần queue.
  const capCan = (action === 'play_now' || action === 'skip') ? CAPABILITY.VIDEO_CHANGE : CAPABILITY.QUEUE;
  const quyen = await kiemTraQuyenPhong(db, check, capCan);
  if (!quyen.ok) return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);

  // ── THÊM VIDEO VÀO HÀNG ĐỢI ──
  if (action === 'enqueue' || action === 'add_next') {
    const u = chuanUrlMedia(than.videoUrl || than.url);
    if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https://.');
    if (!u) return loi('Thiếu link video.', 400);
    const title = chuoi(than.title, 150) || null;
    const thumb = chuoi(than.thumb, 500) || null;
    const videoId = layIdYoutube(u);

    const dem = await db.prepare(
      `SELECT COUNT(*) AS n FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'`
    ).bind(phongId).first();
    if ((dem?.n || 0) >= 30) return loi('Hàng đợi đã đầy (tối đa 30 video).', 429);

    let ord;
    if (action === 'add_next') {
      const dau = await db.prepare(
        `SELECT MIN(ord) AS o FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'`
      ).bind(phongId).first();
      ord = dau?.o != null ? dau.o - 1 : 10;
    } else {
      const cuoi = await db.prepare(
        `SELECT MAX(ord) AS o FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'`
      ).bind(phongId).first();
      ord = cuoi?.o != null ? cuoi.o + 10 : 10;
    }

    const kq = await db.prepare(
      `INSERT INTO phong_video_queue (phong_id, video_url, video_id, title, thumb, added_by_khoa, added_by_ten, ord)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
    ).bind(phongId, u, videoId, title, thumb, khoa, ten, ord).run();
    return json({ ok: true, id: kq.meta?.last_row_id, ord });
  }

  // ── XÓA KHỎI HÀNG ĐỢI (người thêm được xóa của mình; staff xóa được tất cả) ──
  if (action === 'remove') {
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục hàng đợi.', 400);
    const item = await db.prepare(
      `SELECT added_by_khoa AS addedBy FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2 AND trang_thai = 'queued'`
    ).bind(id, phongId).first();
    if (!item) return loi('Mục không tồn tại trong hàng đợi.', 404);
    if (item.addedBy !== khoa && !check.isStaff) {
      return loi('Chỉ người thêm hoặc quản trị phòng mới xóa được mục này.', 403);
    }
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'skipped' WHERE id = ?1 AND phong_id = ?2`
    ).bind(id, phongId).run();
    return json({ ok: true });
  }

  // ── SẮP XẾP LẠI — nhận toàn bộ thứ tự id mới ──
  if (action === 'reorder') {
    const ids = Array.isArray(than.ids) ? than.ids.map((x) => parseInt(x, 10)).filter((x) => x > 0) : [];
    if (!ids.length) return loi('Thiếu thứ tự mới.', 400);
    const stmts = ids.map((id, i) =>
      db.prepare(
        `UPDATE phong_video_queue SET ord = ?1 WHERE id = ?2 AND phong_id = ?3 AND trang_thai = 'queued'`
      ).bind((i + 1) * 10, id, phongId)
    );
    await db.batch(stmts);
    return json({ ok: true });
  }

  // ── PHÁT NGAY ──
  if (action === 'play_now') {
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục hàng đợi.', 400);
    const item = await db.prepare(
      `SELECT video_url AS videoUrl FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2 AND trang_thai = 'queued'`
    ).bind(id, phongId).first();
    if (!item) return loi('Mục không tồn tại trong hàng đợi.', 404);
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'played' WHERE phong_id = ?1 AND trang_thai = 'playing'`
    ).bind(phongId).run();
    await doiVideoDangPhat(db, phongId, item.videoUrl, khoa, ten);
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'playing' WHERE id = ?1 AND phong_id = ?2`
    ).bind(id, phongId).run();
    return json({ ok: true, videoUrl: item.videoUrl });
  }

  // ── PHÁT VIDEO TIẾP THEO TRONG HÀNG ĐỢI ──
  if (action === 'skip') {
    const tiep = await db.prepare(
      `SELECT id, video_url AS videoUrl FROM phong_video_queue
        WHERE phong_id = ?1 AND trang_thai = 'queued' ORDER BY ord ASC, id ASC LIMIT 1`
    ).bind(phongId).first();
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'played' WHERE phong_id = ?1 AND trang_thai = 'playing'`
    ).bind(phongId).run();
    if (!tiep) {
      return json({ ok: true, empty: true, loi: 'Hàng đợi đã hết video.' });
    }
    await doiVideoDangPhat(db, phongId, tiep.videoUrl, khoa, ten);
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'playing' WHERE id = ?1 AND phong_id = ?2`
    ).bind(tiep.id, phongId).run();
    return json({ ok: true, videoUrl: tiep.videoUrl });
  }

  // ── GỬI LINK VIDEO VÀO CHAT PHÒNG ──
  if (action === 'send_to_chat') {
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục hàng đợi.', 400);
    const item = await db.prepare(
      `SELECT video_url AS videoUrl, title FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2`
    ).bind(id, phongId).first();
    if (!item) return loi('Mục không tồn tại.', 404);
    const quyenChat = await kiemTraQuyenPhong(db, check, CAPABILITY.CHAT);
    if (!quyenChat.ok) return json({ ok: false, loi: quyenChat.loi, code: quyenChat.code }, quyenChat.status);
    const noiDung = `📺 Đề xuất video: ${item.title || item.videoUrl}\n${item.videoUrl}`.slice(0, 500);
    await db.prepare(
      `INSERT INTO phong_tin_nhan (phong_id, khoa, hoc_sinh_id, ten_nguoi_gui, vai_tro, lop_id, noi_dung)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(phongId, khoa, phien.hocSinhId || null, ten,
      phien.role === 'teacher' ? 'giao_vien' : 'hoc_sinh', phien.lopId || null, noiDung).run();
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.', 400);
});
