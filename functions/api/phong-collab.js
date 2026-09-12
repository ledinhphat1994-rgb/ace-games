// API Cộng tác Study Dock & Voice 1-1 của Study Room (Phase 4G — governance).
// Chỉ áp dụng cho phòng loai='video'. Mọi thao tác qua capability policy server-side:
//   notes → 'notes' | whiteboard → 'whiteboard' | sheet → 'sheet' | voice → 'voice'
// Đọc được khi capability enabled; ghi cần access_mode cho phép (staff/selected/everyone).
// Collab v2: notes = entry append; whiteboard = append-only ops; sheet = upsert từng ô.
// Voice: pair-bound 1-1 qua bảng phong_voice_pair (tối đa 1 cặp/phòng, signaling riêng tư).
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';
import { kiemTraTruyCapPhong, kiemTraQuyenPhong, taiChinhSach, CAPABILITY } from '../_lib/rooms.js';

const VALID_RESOURCES = ['notes', 'sheet', 'whiteboard'];
const CAP_CUA_RESOURCE = {
  notes: CAPABILITY.NOTES,
  sheet: CAPABILITY.SHEET,
  whiteboard: CAPABILITY.WHITEBOARD,
};
const VOICE_STALE = '-2 minutes'; // cặp voice không hoạt động quá 2 phút → coi như đã ngắt

const tenCua = (phien) => phien.ten || phien.vaiTro || 'Thành viên';

// Lấy cặp voice còn hoạt động của phòng; dọn cặp cũ quá hạn.
async function layCapVoice(db, phongId) {
  await db.prepare(
    `DELETE FROM phong_voice_pair WHERE datetime(cap_nhat_luc) < datetime('now', ?1)`
  ).bind(VOICE_STALE).run().catch(() => {});
  return db.prepare(
    `SELECT phong_id AS phongId, a_khoa AS aKhoa, a_ten AS aTen, b_khoa AS bKhoa, b_ten AS bTen,
            trang_thai AS trangThai, cap_nhat_luc AS capNhatLuc
       FROM phong_voice_pair WHERE phong_id = ?1`
  ).bind(phongId).first().catch(() => null);
}

const trongCap = (pair, khoa) => Boolean(pair && (pair.aKhoa === khoa || pair.bKhoa === khoa));

// ───────────────────────────── GET ─────────────────────────────
export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);
  const myKey = check.actorKey;

  const action = url.searchParams.get('action') || 'get_collab';

  // --- VOICE POLL: trạng thái cặp + tín hiệu CHỈ của người trong cặp ---
  if (action === 'voice_poll') {
    const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
    const pair = await layCapVoice(db, phongId);
    const toiTrongCap = trongCap(pair, myKey);
    const partnerKey = toiTrongCap ? (pair.aKhoa === myKey ? pair.bKhoa : pair.aKhoa) : null;

    let signals = [];
    if (toiTrongCap && partnerKey) {
      const rs = await db.prepare(
        `SELECT id, signal_type AS signalType, payload_json AS payloadJson, created_at AS createdAt
           FROM watch_room_voice_signal
          WHERE room_id = ?1 AND id > ?2 AND sender_key = ?3
          ORDER BY id ASC LIMIT 50`
      ).bind(phongId, sauId, partnerKey).all();
      signals = (rs.results || []).map((s) => {
        let payload = {};
        try { payload = JSON.parse(s.payloadJson); } catch { /* bỏ qua */ }
        return { id: s.id, signalType: s.signalType, payload, createdAt: s.createdAt };
      });
    }

    // Tên hiển thị của cặp (không lộ khoá nội bộ cho người ngoài cặp)
    const capInfo = pair ? {
      active: Boolean(pair.bKhoa),
      aTen: pair.aTen, bTen: pair.bTen,
      youIn: toiTrongCap,
      slot: toiTrongCap ? (pair.aKhoa === myKey ? 'a' : 'b') : null,
    } : { active: false, youIn: false };

    // Danh sách xin quyền voice (chỉ staff thấy)
    let yeuCau = [];
    if (check.isStaff) {
      const rq = await db.prepare(
        `SELECT g.khoa, g.tao_luc AS taoLuc, v.ten
           FROM phong_grant g LEFT JOIN phong_thanh_vien v
             ON v.phong_id = g.phong_id AND v.khoa = g.khoa
          WHERE g.phong_id = ?1 AND g.capability = 'voice' AND g.trang_thai = 'requested'`
      ).bind(phongId).all().catch(() => ({ results: [] }));
      yeuCau = rq.results || [];
    }

    return json({ ok: true, pair: capInfo, signals, yeuCauVoice: yeuCau });
  }

  // --- COLLAB RESOURCE (đọc được khi capability còn bật; staff luôn đọc được) ---
  const resource = chuoi(url.searchParams.get('resource') || '', 20);
  if (!VALID_RESOURCES.includes(resource)) {
    return loi('Tài nguyên cộng tác không hợp lệ.', 400);
  }
  const cap = CAP_CUA_RESOURCE[resource];
  const pol = await taiChinhSach(db, phongId, cap);
  if (!pol.enabled && !check.isStaff) {
    return json({ ok: false, loi: 'Tính năng này đang bị quản trị phòng tắt.', code: 'capability_off' }, 403);
  }

  if (resource === 'notes') {
    const rs = await db.prepare(
      `SELECT n.id, n.ten, n.noi_dung AS noiDung, n.video_time_sec AS videoTimeSec,
              n.tao_luc AS taoLuc, (n.khoa = ?2) AS cuaToi
         FROM phong_note n
        WHERE n.phong_id = ?1 AND n.da_xoa = 0
        ORDER BY n.id ASC LIMIT 200`
    ).bind(phongId, myKey).all();
    const notes = rs.results || [];
    return json({
      ok: true, resource,
      payload: { notes },
      version: notes.length ? notes[notes.length - 1].id : 0,
      canWrite: (await kiemTraQuyenPhong(db, check, cap)).ok,
    });
  }

  if (resource === 'whiteboard') {
    const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
    const rs = await db.prepare(
      `SELECT id, op_json AS opJson FROM phong_wb_op WHERE phong_id = ?1 AND id > ?2 ORDER BY id ASC LIMIT 500`
    ).bind(phongId, sauId).all();
    const ops = (rs.results || []).map((r) => {
      let op = {};
      try { op = JSON.parse(r.opJson); } catch { /* bỏ qua */ }
      return { id: r.id, ...op };
    });
    const max = await db.prepare(
      `SELECT MAX(id) AS m FROM phong_wb_op WHERE phong_id = ?1`
    ).bind(phongId).first().catch(() => null);
    return json({
      ok: true, resource,
      payload: { ops },
      version: max?.m || 0,
      canWrite: (await kiemTraQuyenPhong(db, check, cap)).ok,
    });
  }

  // sheet
  const rs = await db.prepare(
    `SELECT cell, gia_tri AS giaTri, updated_by AS updatedBy, updated_at AS updatedAt
       FROM phong_sheet_cell WHERE phong_id = ?1 ORDER BY cell ASC`
  ).bind(phongId).all();
  const cells = {};
  for (const r of rs.results || []) cells[r.cell] = r.giaTri;
  return json({
    ok: true, resource,
    payload: { cells, rows: 10, cols: 8 },
    version: (rs.results || []).length,
    canWrite: (await kiemTraQuyenPhong(db, check, cap)).ok,
  });
});

// ───────────────────────────── POST ─────────────────────────────
export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { loai: 'video', requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);
  const myKey = check.actorKey;
  const myName = tenCua(phien);

  const action = than.action || 'save_collab';

  // ═══════════ VOICE 1-1 PAIR-BOUND ═══════════

  // Tham gia cặp voice — cần capability 'voice' được cấp.
  if (action === 'voice_join') {
    const quyen = await kiemTraQuyenPhong(db, check, CAPABILITY.VOICE);
    if (!quyen.ok) return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);

    const pair = await layCapVoice(db, phongId);
    if (pair && trongCap(pair, myKey)) {
      await db.prepare(
        `UPDATE phong_voice_pair SET cap_nhat_luc = CURRENT_TIMESTAMP WHERE phong_id = ?1`
      ).bind(phongId).run();
      return json({ ok: true, slot: pair.aKhoa === myKey ? 'a' : 'b' });
    }
    if (!pair) {
      await db.prepare(
        `INSERT INTO phong_voice_pair (phong_id, a_khoa, a_ten, trang_thai) VALUES (?1, ?2, ?3, 'ringing')`
      ).bind(phongId, myKey, myName).run();
      return json({ ok: true, slot: 'a' });
    }
    if (!pair.bKhoa) {
      await db.prepare(
        `UPDATE phong_voice_pair SET b_khoa = ?1, b_ten = ?2, trang_thai = 'active', cap_nhat_luc = CURRENT_TIMESTAMP
          WHERE phong_id = ?3`
      ).bind(myKey, myName, phongId).run();
      return json({ ok: true, slot: 'b' });
    }
    return json({ ok: false, loi: 'Phòng đã có một cặp voice 1-1 đang hoạt động.', code: 'voice_room_full' }, 409);
  }

  // Xin quyền voice (khi policy = selected_members) — staff duyệt qua action 'grant'.
  if (action === 'voice_request') {
    const pol = await taiChinhSach(db, phongId, CAPABILITY.VOICE);
    if (!pol.enabled) return json({ ok: false, loi: 'Voice đang bị tắt trong phòng này.', code: 'capability_off' }, 403);
    if (pol.access_mode === 'everyone') return json({ ok: true, granted: true });
    await db.prepare(
      `INSERT INTO phong_grant (phong_id, khoa, capability, trang_thai) VALUES (?1, ?2, 'voice', 'requested')
       ON CONFLICT(phong_id, khoa, capability) DO NOTHING`
    ).bind(phongId, myKey).run();
    return json({ ok: true, requested: true });
  }

  // Staff ngắt cặp voice của người khác.
  if (action === 'voice_end') {
    if (!check.isStaff) return loi('Chỉ quản trị phòng mới ngắt được voice.', 403);
    await db.prepare(`DELETE FROM phong_voice_pair WHERE phong_id = ?1`).bind(phongId).run();
    // Gửi tín hiệu 'end' để 2 client tự đóng kết nối
    await db.prepare(
      `INSERT INTO watch_room_voice_signal (room_id, sender_key, sender_name, signal_type, payload_json)
       VALUES (?1, ?2, ?3, 'leave', '{}')`
    ).bind(phongId, myKey, myName).run().catch(() => {});
    return json({ ok: true });
  }

  // Gửi tín hiệu WebRTC — CHỈ 2 người trong cặp mới gửi/nhận được.
  if (action === 'voice_signal') {
    const signalType = chuoi(than.signalType || '', 20);
    if (!['join', 'offer', 'answer', 'candidate', 'leave'].includes(signalType)) {
      return loi('Loại tín hiệu voice không hợp lệ.', 400);
    }
    const pair = await layCapVoice(db, phongId);
    if (!trongCap(pair, myKey)) {
      return json({ ok: false, loi: 'Bạn không nằm trong cặp voice hiện tại.', code: 'not_in_pair' }, 403);
    }
    const quyen = await kiemTraQuyenPhong(db, check, CAPABILITY.VOICE);
    if (!quyen.ok) return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);

    if (signalType === 'leave') {
      // Nhả slot của mình; a rời → xoá cặp (b không tự thành a để tránh lẫn trạng thái)
      if (pair.aKhoa === myKey) {
        await db.prepare(`DELETE FROM phong_voice_pair WHERE phong_id = ?1`).bind(phongId).run();
      } else {
        await db.prepare(
          `UPDATE phong_voice_pair SET b_khoa = NULL, b_ten = NULL, trang_thai = 'ringing', cap_nhat_luc = CURRENT_TIMESTAMP
            WHERE phong_id = ?1`
        ).bind(phongId).run();
      }
    } else {
      await db.prepare(
        `UPDATE phong_voice_pair SET cap_nhat_luc = CURRENT_TIMESTAMP WHERE phong_id = ?1`
      ).bind(phongId).run();
    }

    await db.prepare(
      `DELETE FROM watch_room_voice_signal WHERE datetime(created_at) < datetime('now', '-5 minutes')`
    ).run().catch(() => {});

    const res = await db.prepare(
      `INSERT INTO watch_room_voice_signal (room_id, sender_key, sender_name, signal_type, payload_json)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(phongId, myKey, myName, signalType, JSON.stringify(than.payload || {})).run();
    return json({ ok: true, signalId: res.meta?.last_row_id });
  }

  // ═══════════ COLLAB WRITE — cần capability của resource ═══════════
  const resource = chuoi(than.resource || '', 20);
  if (!VALID_RESOURCES.includes(resource)) {
    return loi('Tài nguyên cộng tác không hợp lệ.', 400);
  }
  const cap = CAP_CUA_RESOURCE[resource];
  const quyen = await kiemTraQuyenPhong(db, check, cap);
  if (!quyen.ok) return json({ ok: false, loi: quyen.loi, code: quyen.code }, quyen.status);

  // --- NOTES: append entry (không ghi đè — ai ghi nấy) ---
  if (resource === 'notes') {
    if (action === 'xoa_note') {
      const id = parseInt(than.id || '0', 10);
      if (!(id > 0)) return loi('Thiếu ghi chú.', 400);
      const note = await db.prepare(
        `SELECT khoa FROM phong_note WHERE id = ?1 AND phong_id = ?2 AND da_xoa = 0`
      ).bind(id, phongId).first();
      if (!note) return loi('Ghi chú không tồn tại.', 404);
      if (note.khoa !== myKey && !check.isStaff) {
        return loi('Chỉ xoá được ghi chú của mình hoặc nhờ quản trị phòng.', 403);
      }
      await db.prepare(`UPDATE phong_note SET da_xoa = 1 WHERE id = ?1 AND phong_id = ?2`).bind(id, phongId).run();
      return json({ ok: true });
    }

    const text = chuoi(than.payload?.text ?? than.text, 1000);
    if (!text) return loi('Ghi chú trống.', 400);
    let videoTimeSec = null;
    const vt = Number(than.payload?.videoTimeSec ?? than.videoTimeSec);
    if (!isNaN(vt) && isFinite(vt) && vt >= 0 && vt <= 86400) videoTimeSec = Math.floor(vt);

    const kq = await db.prepare(
      `INSERT INTO phong_note (phong_id, khoa, ten, noi_dung, video_time_sec) VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(phongId, myKey, myName, text, videoTimeSec).run();
    return json({ ok: true, id: kq.meta?.last_row_id });
  }

  // --- WHITEBOARD: append-only ops ---
  if (resource === 'whiteboard') {
    const op = than.payload || {};
    if (op.type === 'clear') {
      // Xoá bảng là hành động phá dữ liệu chung → chỉ staff.
      if (!check.isStaff) return loi('Chỉ quản trị phòng mới xoá sạch bảng được.', 403);
      await db.prepare(`DELETE FROM phong_wb_op WHERE phong_id = ?1`).bind(phongId).run();
      await db.prepare(
        `INSERT INTO phong_wb_op (phong_id, khoa, op_json) VALUES (?1, ?2, ?3)`
      ).bind(phongId, myKey, JSON.stringify({ type: 'clear' })).run();
      return json({ ok: true });
    }
    if (op.type !== 'stroke') return loi('Thao tác bảng vẽ không hợp lệ.', 400);
    const s = op.stroke;
    const hopLe = s && Array.isArray(s.points) && s.points.length >= 2 && s.points.length <= 2000
      && s.points.every((pt) => isFinite(Number(pt.x)) && isFinite(Number(pt.y))
        && Number(pt.x) >= -100 && Number(pt.x) <= 4000 && Number(pt.y) >= -100 && Number(pt.y) <= 4000)
      && ['pen', 'eraser'].includes(s.tool || 'pen');
    if (!hopLe) return loi('Nét vẽ không hợp lệ.', 400);

    const stroke = {
      tool: s.tool === 'eraser' ? 'eraser' : 'pen',
      color: chuoi(s.color, 20) || '#00F2FE',
      width: Math.min(40, Math.max(1, Number(s.width) || 3)),
      points: s.points.map((pt) => ({ x: Number(pt.x), y: Number(pt.y) })),
    };
    // Chặn phình bảng: giữ tối đa ~3000 op gần nhất.
    const dem = await db.prepare(`SELECT COUNT(*) AS n FROM phong_wb_op WHERE phong_id = ?1`).bind(phongId).first();
    if ((dem?.n || 0) >= 3000) {
      await db.prepare(
        `DELETE FROM phong_wb_op WHERE phong_id = ?1 AND id < (SELECT MIN(id) FROM (SELECT id FROM phong_wb_op WHERE phong_id = ?1 ORDER BY id DESC LIMIT 2500))`
      ).bind(phongId).run().catch(() => {});
    }
    const kq = await db.prepare(
      `INSERT INTO phong_wb_op (phong_id, khoa, op_json) VALUES (?1, ?2, ?3)`
    ).bind(phongId, myKey, JSON.stringify({ type: 'stroke', stroke })).run();
    return json({ ok: true, id: kq.meta?.last_row_id });
  }

  // --- SHEET: upsert từng ô ---
  if (resource === 'sheet') {
    const cell = chuoi(than.payload?.cell || than.cell, 5).toUpperCase();
    if (!/^[A-H]([1-9]|10)$/.test(cell)) return loi('Ô không hợp lệ (A1..H10).', 400);
    const giaTri = chuoi(than.payload?.value ?? than.value, 200);
    if (giaTri === '') {
      await db.prepare(`DELETE FROM phong_sheet_cell WHERE phong_id = ?1 AND cell = ?2`).bind(phongId, cell).run();
    } else {
      await db.prepare(
        `INSERT INTO phong_sheet_cell (phong_id, cell, gia_tri, updated_by, updated_at)
         VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
         ON CONFLICT(phong_id, cell) DO UPDATE SET
           gia_tri = excluded.gia_tri, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP`
      ).bind(phongId, cell, giaTri, myName).run();
    }
    return json({ ok: true, cell });
  }

  return loi('Hành động không hợp lệ.', 400);
});
