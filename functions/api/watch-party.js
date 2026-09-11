// Watch Party Sync System - Xem phim/music cùng nhau với sync playback
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';

// Lấy trạng thái hiện tại của watch party
export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) return loi('Thiếu mã phòng.');

  // Lấy trạng thái phòng từ database
  const roomState = await env.DB.prepare(
    'SELECT id, ten_phong AS tenPhong, video_url AS videoUrl, dang_phat AS dangPhat, thoi_gian_hien_tai AS thoiGianHienTai, nguoi_tao AS nguoiTao, so_nguoi AS soNguoi FROM watch_party WHERE id = ?1'
  ).bind(roomId).first();

  if (!roomState) return loi('Phòng không tồn tại.');

  return json({
    ok: true,
    room: roomState
  });
}, { canGiaoVien: false });

// Tạo phòng watch party mới
export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const tenPhong = String(than.tenPhong || '').trim();
  const videoUrl = String(than.videoUrl || '').trim();
  const loaiPhong = String(than.loaiPhong || 'video'); // 'video' hoặc 'music'

  if (!tenPhong) return loi('Tên phòng không được để trống.');
  if (!videoUrl) return loi('URL video không được để trống.');

  // Tạo phòng mới
  const result = await env.DB.prepare(
    'INSERT INTO watch_party (ten_phong, video_url, loai_phong, nguoi_tao, dang_phat, thoi_gian_hien_tai, so_nguoi) VALUES (?1, ?2, ?3, ?4, 0, 0, 1) RETURNING id'
  ).bind(tenPhong, videoUrl, loaiPhong, phien.ten || 'Người dùng', 0, 0, 1).first();

  return json({
    ok: true,
    roomId: result.id,
    room: result
  });
}, { canGiaoVien: false });

// Sync playback (play/pause/seek)
export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  
  if (!roomId) return loi('Thiếu mã phòng.');

  const than = await docThan(request);
  const action = String(than.action || '').trim(); // 'play', 'pause', 'seek'
  const timestamp = Number(than.timestamp || 0);

  if (!action) return loi('Thiếu hành động sync.');

  let updateQuery = '';
  let params = [];

  switch (action) {
    case 'play':
      updateQuery = 'UPDATE watch_party SET dang_phat = 1, thoi_gian_hien_tai = ?1 WHERE id = ?2';
      params = [timestamp, roomId];
      break;
    case 'pause':
      updateQuery = 'UPDATE watch_party SET dang_phat = 0, thoi_gian_hien_tai = ?1 WHERE id = ?2';
      params = [timestamp, roomId];
      break;
    case 'seek':
      updateQuery = 'UPDATE watch_party SET thoi_gian_hien_tai = ?1 WHERE id = ?2';
      params = [timestamp, roomId];
      break;
    default:
      return loi('Hành động không hợp lệ.');
  }

  await env.DB.prepare(updateQuery).bind(...params).run();

  return json({
    ok: true,
    action,
    timestamp
  });
}, { canGiaoVien: false });

// Tham gia/ra khỏi phòng
export const onRequestPut = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const roomId = url.searchParams.get('roomId');
  const action = String(url.searchParams.get('action') || 'join').trim(); // 'join' hoặc 'leave'
  
  if (!roomId) return loi('Thiếu mã phòng.');

  if (action === 'join') {
    await env.DB.prepare(
      'UPDATE watch_party SET so_nguoi = so_nguoi + 1 WHERE id = ?1'
    ).bind(roomId).run();
  } else if (action === 'leave') {
    await env.DB.prepare(
      'UPDATE watch_party SET so_nguoi = CASE WHEN so_nguoi > 0 THEN so_nguoi - 1 ELSE 0 END WHERE id = ?1'
    ).bind(roomId).run();
  }

  return json({ ok: true });
}, { canGiaoVien: false });