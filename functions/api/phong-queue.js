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

// Chuyển video đang phát theo 1 mục queue — NGUYÊN TỬ qua db.batch:
// mọi write đều gác bởi EXISTS(item còn 'queued') → hoặc toàn bộ áp dụng, hoặc không gì đổi.
// Trả 'ok' | 'gone' (item đã bị người khác dùng/xoá giữa chừng — caller trả 409).
async function chuyenVideoTheoQueueItem(db, phongId, itemId, khoa, ten) {
  const item = await db.prepare(
    `SELECT video_url AS videoUrl FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2 AND trang_thai IN ('queued', 'suggested')`
  ).bind(itemId, phongId).first();
  if (!item) return 'gone';

  const p = await db.prepare(`SELECT cau_hinh AS cauHinh FROM phong WHERE id = ?1`).bind(phongId).first();
  let cauHinh = {};
  try { cauHinh = p?.cauHinh ? JSON.parse(p.cauHinh) : {}; } catch { /* bỏ qua */ }
  cauHinh.videoUrl = item.videoUrl;

  // ?3 = itemId dùng trong guard EXISTS của các write đầu; ?4/?5 trong upsert sync.
  const guard = `EXISTS(SELECT 1 FROM phong_video_queue WHERE id = ?3 AND phong_id = ?1 AND trang_thai IN ('queued', 'suggested'))`;
  const rs = await db.batch([
    db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'played' WHERE phong_id = ?1 AND trang_thai = 'playing' AND ${guard}`
    ).bind(phongId, 0, itemId),
    db.prepare(
      `UPDATE phong SET cau_hinh = ?2, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1 AND ${guard}`
    ).bind(phongId, JSON.stringify(cauHinh), itemId),
    db.prepare(
      `INSERT INTO phong_dong_bo_video (phong_id, trang_thai, vi_tri_giay, toc_do, revision, cap_nhat_luc, nguoi_cap_nhat_khoa, nguoi_cap_nhat_ten)
       SELECT ?1, 'playing', 0, 1.0, 1, CURRENT_TIMESTAMP, ?4, ?5
       WHERE ${guard}
       ON CONFLICT(phong_id) DO UPDATE SET
         trang_thai = 'playing', vi_tri_giay = 0, toc_do = 1.0,
         revision = revision + 1, cap_nhat_luc = CURRENT_TIMESTAMP,
         nguoi_cap_nhat_khoa = ?4, nguoi_cap_nhat_ten = ?5`
    ).bind(phongId, 0, itemId, khoa, ten),
    db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'playing' WHERE id = ?3 AND phong_id = ?1 AND trang_thai IN ('queued', 'suggested')`
    ).bind(phongId, 0, itemId),
  ]);
  if (!((rs[3]?.meta?.changes ?? 0) > 0)) return { status: 'gone' };

  const rowMoi = await db.prepare(
    `SELECT trang_thai AS trangThai, vi_tri_giay AS viTriGiay, toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc, nguoi_cap_nhat_ten AS nguoiCapNhatTen
       FROM phong_dong_bo_video WHERE phong_id = ?1`
  ).bind(phongId).first();

  return {
    status: 'ok',
    videoUrl: item.videoUrl,
    state: {
      playing: rowMoi?.trangThai === 'playing',
      positionSeconds: 0,
      basePositionSeconds: 0,
      playbackRate: Number(rowMoi?.tocDo || 1.0),
      revision: Number(rowMoi?.revision || 1),
      updatedAt: rowMoi?.capNhatLuc || new Date().toISOString(),
      serverNow: new Date().toISOString(),
      updatedBy: rowMoi?.nguoiCapNhatTen || null
    }
  };
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);

  const rs = await db.prepare(
    `SELECT id, video_url AS videoUrl, video_id AS videoId, title, thumb,
            added_by_khoa AS addedByKhoa, added_by_ten AS addedBy, ord, trang_thai AS trangThai, tao_luc AS taoLuc
       FROM phong_video_queue
      WHERE phong_id = ?1 AND trang_thai IN ('queued', 'playing', 'suggested')
      ORDER BY CASE trang_thai WHEN 'playing' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END, ord ASC, id ASC
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
  if (check.loi) return loi(check.loi, check.status || 403, check.code ? { code: check.code } : null);
  const khoa = check.actorKey;
  const ten = tenCua(phien);

  const action = chuoi(than.action, 25);
  const ACTIONS = ['enqueue', 'add_next', 'remove', 'reorder', 'play_now', 'skip', 'send_to_chat', 'suggest', 'approve_suggestion', 'reject_suggestion'];
  if (!ACTIONS.includes(action)) return loi('Hành động queue không hợp lệ.', 400);

  // play_now / skip đổi video đang phát → cần video_change; còn lại cần queue.
  const capCan = (action === 'play_now' || action === 'skip') ? CAPABILITY.VIDEO_CHANGE : CAPABILITY.QUEUE;
  const quyen = await kiemTraQuyenPhong(db, check, capCan);
  if (action !== 'suggest' && action !== 'reject_suggestion' && !quyen.ok) {
    return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);
  }

  // ── ĐỀ XUẤT VIDEO (Thành viên gửi đề xuất cho chủ phòng duyệt) ──
  if (action === 'suggest') {
    const u = chuanUrlMedia(than.videoUrl || than.url);
    if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https://.');
    if (!u) return loi('Thiếu link video.', 400);
    const title = chuoi(than.title, 150) || null;
    const thumb = chuoi(than.thumb, 500) || null;
    const videoId = layIdYoutube(u);

    const dem = await db.prepare(
      `SELECT COUNT(*) AS c FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'suggested'`
    ).bind(phongId).first();
    if ((dem?.c || 0) >= 20) {
      return loi('Danh sách đề xuất đang đầy (tối đa 20 video chờ duyệt).', 429);
    }

    const kq = await db.prepare(
      `INSERT INTO phong_video_queue (phong_id, video_url, video_id, title, thumb, added_by_khoa, added_by_ten, ord, trang_thai)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 9999, 'suggested')`
    ).bind(phongId, u, videoId, title, thumb, khoa, ten).run();

    const noiDung = `💡 ${ten} đề xuất video: ${title || u}\n${u}`.slice(0, 500);
    await db.prepare(
      `INSERT INTO phong_tin_nhan (phong_id, khoa, hoc_sinh_id, ten_nguoi_gui, vai_tro, lop_id, noi_dung)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    ).bind(phongId, khoa, phien.hocSinhId || null, ten,
      (phien.role === 'teacher' || phien.role === 'admin') ? 'giao_vien' : 'hoc_sinh', phien.lopId || null, noiDung).run().catch(() => {});

    return json({ ok: true, id: kq.meta?.last_row_id });
  }

  // ── DUYỆT ĐỀ XUẤT (Chỉ chủ phòng / staff có quyền điều khiển) ──
  if (action === 'approve_suggestion') {
    const quyenControl = await kiemTraQuyenPhong(db, check, CAPABILITY.VIDEO_CONTROL);
    if (!quyenControl.ok) {
      return json({ ok: false, loi: 'Chỉ chủ phòng mới có quyền duyệt video đề xuất.', code: 'FORBIDDEN' }, 403);
    }
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục đề xuất.', 400);

    const playNow = Boolean(than.playNow);
    if (playNow) {
      const kq = await chuyenVideoTheoQueueItem(db, phongId, id, khoa, ten);
      if (kq.status === 'gone') return loi('Mục đề xuất không còn tồn tại.', 409);
      return json({ ok: true, videoUrl: kq.videoUrl, state: kq.state });
    } else {
      const maxOrdRow = await db.prepare(
        `SELECT COALESCE(MAX(ord), 0) + 10 AS nextOrd FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'`
      ).bind(phongId).first();
      const nextOrd = Number(maxOrdRow?.nextOrd || 10);
      await db.prepare(
        `UPDATE phong_video_queue SET trang_thai = 'queued', ord = ?1 WHERE id = ?2 AND phong_id = ?3 AND trang_thai = 'suggested'`
      ).bind(nextOrd, id, phongId).run();
      return json({ ok: true });
    }
  }

  // ── TỪ CHỐI HOẶC HỦY ĐỀ XUẤT ──
  if (action === 'reject_suggestion') {
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục đề xuất.', 400);
    const item = await db.prepare(
      `SELECT added_by_khoa AS addedBy FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2 AND trang_thai = 'suggested'`
    ).bind(id, phongId).first();
    if (!item) return loi('Mục không tồn tại trong danh sách đề xuất.', 404);

    const quyenControl = await kiemTraQuyenPhong(db, check, CAPABILITY.VIDEO_CONTROL);
    if (!quyenControl.ok && item.addedBy !== khoa) {
      return loi('Chỉ chủ phòng hoặc người đề xuất mới được hủy mục này.', 403);
    }
    await db.prepare(
      `UPDATE phong_video_queue SET trang_thai = 'skipped' WHERE id = ?1 AND phong_id = ?2`
    ).bind(id, phongId).run();
    return json({ ok: true });
  }

  // ── THÊM VIDEO VÀO HÀNG ĐỢI (Chỉ chủ phòng mới được trực tiếp thêm vào hàng chờ) ──
  if (action === 'enqueue' || action === 'add_next') {
    const quyenControl = await kiemTraQuyenPhong(db, check, CAPABILITY.VIDEO_CONTROL);
    if (!quyenControl.ok) {
      return json({ ok: false, loi: 'Người tham gia chỉ được đề xuất video cho chủ phòng duyệt.', code: 'FORBIDDEN' }, 403);
    }
    const u = chuanUrlMedia(than.videoUrl || than.url);
    if (u === false) return loi('Link video không hợp lệ — chỉ nhận link https://.');
    if (!u) return loi('Thiếu link video.', 400);
    const title = chuoi(than.title, 150) || null;
    const thumb = chuoi(than.thumb, 500) || null;
    const videoId = layIdYoutube(u);

    const kq = await db.prepare(
      `INSERT INTO phong_video_queue (phong_id, video_url, video_id, title, thumb, added_by_khoa, added_by_ten, ord)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7,
         CASE WHEN ?8 = 1
           THEN COALESCE((SELECT MIN(ord) FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'), 20) - 10
           ELSE COALESCE((SELECT MAX(ord) FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'), 0) + 10
         END
       WHERE (SELECT COUNT(*) FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued') < 30`
    ).bind(phongId, u, videoId, title, thumb, khoa, ten, action === 'add_next' ? 1 : 0).run();
    if (!((kq.meta?.changes ?? 0) > 0)) {
      return loi('Hàng đợi đã đầy (tối đa 30 video).', 429);
    }
    return json({ ok: true, id: kq.meta?.last_row_id });
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

  // ── SẮP XẾP LẠI — yêu cầu ĐÚNG một hoán vị đầy đủ của các item đang 'queued':
  //    từ chối id lạ/trùng/thiếu. Không cho partial reorder (dễ làm hỏng thứ tự). ──
  if (action === 'reorder') {
    const ids = Array.isArray(than.ids) ? than.ids.map((x) => parseInt(x, 10)).filter((x) => x > 0) : [];
    if (!ids.length) return loi('Thiếu thứ tự mới.', 400);
    if (new Set(ids).size !== ids.length) return loi('Danh sách thứ tự có id trùng.', 400);
    const hienCo = await db.prepare(
      `SELECT id FROM phong_video_queue WHERE phong_id = ?1 AND trang_thai = 'queued'`
    ).bind(phongId).all();
    const tapHop = new Set((hienCo.results || []).map((r) => r.id));
    if (ids.length !== tapHop.size || !ids.every((id) => tapHop.has(id))) {
      return loi('Thứ tự mới phải chứa đúng toàn bộ mục đang chờ của phòng.', 400);
    }
    const stmts = ids.map((id, i) =>
      db.prepare(
        `UPDATE phong_video_queue SET ord = ?1 WHERE id = ?2 AND phong_id = ?3 AND trang_thai = 'queued'`
      ).bind((i + 1) * 10, id, phongId)
    );
    await db.batch(stmts);
    return json({ ok: true });
  }

  // ── PHÁT NGAY — chuyển trạng thái nguyên tử qua batch có guard ──
  if (action === 'play_now') {
    const id = parseInt(than.id || '0', 10);
    if (!(id > 0)) return loi('Thiếu mục hàng đợi.', 400);
    const item = await db.prepare(
      `SELECT video_url AS videoUrl FROM phong_video_queue WHERE id = ?1 AND phong_id = ?2 AND trang_thai = 'queued'`
    ).bind(id, phongId).first();
    if (!item) return loi('Mục không tồn tại trong hàng đợi.', 404);
    const kq = await chuyenVideoTheoQueueItem(db, phongId, id, khoa, ten);
    if (kq.status === 'gone') return loi('Mục không còn trong hàng đợi — hàng đợi vừa thay đổi.', 409);
    return json({ ok: true, videoUrl: kq.videoUrl, state: kq.state });
  }

  // ── PHÁT VIDEO TIẾP THEO — đọc item đầu rồi chuyển nguyên tử; nếu item vừa bị
  //    người khác chiếm thì đọc lại 1 lần (2 lệnh skip cạnh tranh = bỏ qua 2 video). ──
  if (action === 'skip') {
    for (let lan = 0; lan < 2; lan++) {
      const tiep = await db.prepare(
        `SELECT id, video_url AS videoUrl FROM phong_video_queue
          WHERE phong_id = ?1 AND trang_thai = 'queued' ORDER BY ord ASC, id ASC LIMIT 1`
      ).bind(phongId).first();
      if (!tiep) {
        // Hàng đợi đã hết video -> Tự động chuyển phòng sang paused đồng bộ
        await db.prepare(
          `UPDATE phong_dong_bo_video
             SET trang_thai = 'paused',
                 revision = revision + 1,
                 cap_nhat_luc = CURRENT_TIMESTAMP,
                 nguoi_cap_nhat_khoa = ?2,
                 nguoi_cap_nhat_ten = ?3
           WHERE phong_id = ?1`
        ).bind(phongId, khoa, ten).run();

        const st = await db.prepare(
          `SELECT phong_id AS phongId, trang_thai AS trangThai, vi_tri_giay AS viTriGiay,
                  toc_do AS tocDo, revision, cap_nhat_luc AS capNhatLuc,
                  nguoi_cap_nhat_khoa AS nguoiCapNhatKhoa, nguoi_cap_nhat_ten AS nguoiCapNhatTen
             FROM phong_dong_bo_video WHERE phong_id = ?1`
        ).bind(phongId).first();

        return json({
          ok: true,
          empty: true,
          loi: 'Hàng đợi đã hết video.',
          state: {
            playing: false,
            positionSeconds: Number(st?.viTriGiay || 0),
            basePositionSeconds: Number(st?.viTriGiay || 0),
            playbackRate: Number(st?.tocDo || 1.0),
            revision: Number(st?.revision || 1),
            updatedAt: st?.capNhatLuc || new Date().toISOString(),
            updatedBy: ten
          }
        });
      }
      const kq = await chuyenVideoTheoQueueItem(db, phongId, tiep.id, khoa, ten);
      if (kq.status === 'ok') return json({ ok: true, videoUrl: kq.videoUrl, state: kq.state });
      // 'gone': item vừa bị claim — vòng lặp đọc lại item đầu mới.
    }
    return loi('Hàng đợi đang thay đổi — thử lại.', 409);
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
      (phien.role === 'teacher' || phien.role === 'admin') ? 'giao_vien' : 'hoc_sinh', phien.lopId || null, noiDung).run();
    return json({ ok: true });
  }

  return loi('Hành động không hợp lệ.', 400);
});
