// API Cộng tác Study Dock & Tín hiệu Voice 1-1 phòng YouTube (Phase 4F)
// Quản lý Ghi chú (Notes), Bảng vẽ (Whiteboard), Bảng tính (Sheet) với optimistic concurrency
// và WebRTC peer-to-peer audio signaling.
import { bocXuLy, docThan, json, loi, chuoi } from '../_lib/api.js';
import { kiemTraTruyCapPhong } from '../_lib/rooms.js';

const VALID_RESOURCES = ['notes', 'sheet', 'whiteboard'];

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const url = new URL(request.url);
  const phongId = parseInt(url.searchParams.get('phongId') || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);
  const myKey = check.actorKey;

  const action = url.searchParams.get('action') || 'get_collab';

  // --- SUB-ACTION: VOICE SIGNALING POLL ---
  if (action === 'voice_poll') {
    const sauId = Math.max(0, parseInt(url.searchParams.get('sauId') || '0', 10));
    const signals = await db.prepare(`
      SELECT id, room_id AS roomId, sender_key AS senderKey, sender_name AS senderName,
             signal_type AS signalType, payload_json AS payloadJson, created_at AS createdAt
      FROM watch_room_voice_signal
      WHERE room_id = ?1 AND id > ?2 AND sender_key != ?3
      ORDER BY id ASC LIMIT 50
    `).bind(phongId, sauId, myKey).all();

    const formatted = (signals.results || []).map((s) => {
      let payload = {};
      try { payload = JSON.parse(s.payloadJson); } catch {}
      return {
        id: s.id,
        senderKey: s.senderKey,
        senderName: s.senderName,
        signalType: s.signalType,
        payload,
        createdAt: s.createdAt
      };
    });

    return json({ ok: true, signals: formatted });
  }

  // --- SUB-ACTION: GET COLLAB RESOURCE (notes, sheet, whiteboard) ---
  const resource = chuoi(url.searchParams.get('resource') || '', 20);
  if (!VALID_RESOURCES.includes(resource)) {
    return loi('Tài nguyên cộng tác không hợp lệ.', 400);
  }

  const row = await db.prepare(`
    SELECT room_id AS roomId, resource_type AS resourceType, payload_json AS payloadJson,
           version, updated_by AS updatedBy, updated_at AS updatedAt
    FROM watch_room_collab
    WHERE room_id = ?1 AND resource_type = ?2
  `).bind(phongId, resource).first();

  if (!row) {
    // Giá trị khởi tạo mặc định
    let defaultPayload = {};
    if (resource === 'notes') defaultPayload = { text: '' };
    else if (resource === 'whiteboard') defaultPayload = { strokes: [] };
    else if (resource === 'sheet') defaultPayload = { cells: {}, rows: 10, cols: 8 };

    return json({
      ok: true,
      resource,
      payload: defaultPayload,
      version: 0,
      updatedBy: null,
      updatedAt: null
    });
  }

  let payload = {};
  try { payload = JSON.parse(row.payloadJson); } catch {}

  return json({
    ok: true,
    resource,
    payload,
    version: row.version,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt
  });
});

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const db = env.DB;
  const than = await docThan(request);
  const phongId = parseInt(than.phongId || '', 10);
  if (!(phongId > 0)) return loi('Thiếu mã phòng.', 400);

  const check = await kiemTraTruyCapPhong(db, phongId, phien, { requireAdmitted: true });
  if (check.loi) return loi(check.loi, check.status || 403);
  const myKey = check.actorKey;
  const myName = phien.ten || phien.vaiTro || 'Thành viên';

  const action = than.action || 'save_collab';

  // --- SUB-ACTION: VOICE SIGNALING SEND ---
  if (action === 'voice_signal') {
    const signalType = chuoi(than.signalType || '', 20);
    if (!['join', 'offer', 'answer', 'candidate', 'leave'].includes(signalType)) {
      return loi('Loại tín hiệu voice không hợp lệ.', 400);
    }

    const payloadJson = JSON.stringify(than.payload || {});

    // Dọn dẹp tín hiệu cũ quá 5 phút
    await db.prepare(`
      DELETE FROM watch_room_voice_signal
      WHERE datetime(created_at) < datetime('now', '-5 minutes')
    `).run().catch(() => {});

    // Kiểm tra giới hạn tối đa 2 người tham gia voice nếu là signal 'join'
    if (signalType === 'join') {
      const activeVoicePeers = await db.prepare(`
        SELECT DISTINCT sender_key
        FROM watch_room_voice_signal
        WHERE room_id = ?1 AND signal_type = 'join'
          AND datetime(created_at) > datetime('now', '-1 minute')
      `).bind(phongId).all();

      const peers = (activeVoicePeers.results || []).map((r) => r.sender_key);
      if (peers.length >= 2 && !peers.includes(myKey)) {
        return json({
          ok: false,
          loi: 'Phòng đã đủ 2 người tham gia đàm thoại voice 1-1.',
          code: 'voice_room_full'
        }, 409);
      }
    }

    const res = await db.prepare(`
      INSERT INTO watch_room_voice_signal (room_id, sender_key, sender_name, signal_type, payload_json)
      VALUES (?1, ?2, ?3, ?4, ?5)
    `).bind(phongId, myKey, myName, signalType, payloadJson).run();

    return json({ ok: true, signalId: res.meta?.last_row_id });
  }

  // --- SUB-ACTION: SAVE COLLAB RESOURCE (Optimistic Concurrency) ---
  const resource = chuoi(than.resource || '', 20);
  if (!VALID_RESOURCES.includes(resource)) {
    return loi('Tài nguyên cộng tác không hợp lệ.', 400);
  }

  const payload = than.payload;
  if (payload === undefined || payload === null) {
    return loi('Thiếu nội dung tài nguyên.', 400);
  }

  const payloadJson = JSON.stringify(payload);
  const expectedVersion = parseInt(than.expectedVersion ?? '0', 10);

  // 1. Kiểm tra bản ghi hiện tại
  const current = await db.prepare(`
    SELECT version, payload_json AS payloadJson, updated_by AS updatedBy
    FROM watch_room_collab
    WHERE room_id = ?1 AND resource_type = ?2
  `).bind(phongId, resource).first();

  if (!current) {
    // Bản ghi đầu tiên
    await db.prepare(`
      INSERT INTO watch_room_collab (room_id, resource_type, payload_json, version, updated_by)
      VALUES (?1, ?2, ?3, 1, ?4)
    `).bind(phongId, resource, payloadJson, myName).run();

    return json({ ok: true, version: 1, updatedBy: myName });
  }

  // 2. Kiểm tra xung đột phiên bản (Optimistic Concurrency Control)
  if (than.expectedVersion !== undefined && than.expectedVersion !== null && current.version !== expectedVersion) {
    let currentPayload = {};
    try { currentPayload = JSON.parse(current.payloadJson); } catch {}
    return json({
      ok: false,
      conflict: true,
      currentVersion: current.version,
      currentPayload,
      updatedBy: current.updatedBy,
      loi: 'Dữ liệu đã được người khác cập nhật mới hơn. Vui lòng đồng bộ lại.'
    }, 409);
  }

  // 3. Cập nhật atomic có điều kiện phiên bản
  const updateRes = await db.prepare(`
    UPDATE watch_room_collab
    SET payload_json = ?1,
        version = version + 1,
        updated_by = ?2,
        updated_at = CURRENT_TIMESTAMP
    WHERE room_id = ?3 AND resource_type = ?4 AND version = ?5
  `).bind(payloadJson, myName, phongId, resource, current.version).run();

  if (!updateRes.meta || updateRes.meta.changes === 0) {
    // Xung đột xảy ra đồng thời
    const refreshed = await db.prepare(`
      SELECT version, payload_json AS payloadJson, updated_by AS updatedBy
      FROM watch_room_collab
      WHERE room_id = ?1 AND resource_type = ?2
    `).bind(phongId, resource).first();

    let currentPayload = {};
    try { currentPayload = JSON.parse(refreshed?.payloadJson || '{}'); } catch {}

    return json({
      ok: false,
      conflict: true,
      currentVersion: refreshed?.version || current.version + 1,
      currentPayload,
      updatedBy: refreshed?.updatedBy || 'Thành viên khác',
      loi: 'Xung đột cập nhật đồng thời. Đang tải dữ liệu mới nhất.'
    }, 409);
  }

  return json({
    ok: true,
    version: current.version + 1,
    updatedBy: myName
  });
});
