// GET /api/anh?khoa=... — trả về nội dung một tấm ảnh.
// Học sinh đã vào bằng mã lớp đều xem được — NHƯNG chỉ ảnh của ĐÚNG LỚP mình, không phải chỉ
// cần đăng nhập là xem được ảnh của bất kỳ lớp nào nếu đoán ra đúng khoá.
import { layPhien } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  const khoa = new URL(request.url).searchParams.get('khoa') || '';

  // Chỉ nhận khoá do hệ thống sinh ra, tránh bị dò sang khoá khác trong KV.
  if (!/^anh-[a-z0-9]+-[a-z0-9]+$/i.test(khoa)) {
    return new Response('Khoá ảnh không hợp lệ.', { status: 400 });
  }

  const phien = await layPhien(request, env);
  if (!phien) return new Response('Chưa đăng nhập.', { status: 401 });
  if (!env.ANH) return new Response('Chưa gắn kho ảnh.', { status: 500 });

  if (env.DB) {
    const anh = await env.DB.prepare('SELECT id FROM hinh_anh WHERE khoa = ?1 AND lop_id = ?2').bind(khoa, phien.lopId).first();
    if (!anh) return new Response('Không tìm thấy ảnh.', { status: 404 });
  }

  let value, kieuTraVe;
  if (typeof env.ANH.getWithMetadata === 'function') {
    const res = await env.ANH.getWithMetadata(khoa, { type: 'arrayBuffer' });
    if (!res || !res.value) return new Response('Không tìm thấy ảnh.', { status: 404 });
    value = res.value;
    kieuTraVe = (res.metadata && res.metadata.kieu) || 'image/jpeg';
  } else {
    const obj = await env.ANH.get(khoa);
    if (!obj) return new Response('Không tìm thấy ảnh.', { status: 404 });
    value = obj.body;
    kieuTraVe = (obj.httpMetadata && obj.httpMetadata.contentType)
      || (obj.customMetadata && obj.customMetadata.kieu)
      || 'image/jpeg';
  }

  return new Response(value, {
    headers: {
      'Content-Type': kieuTraVe,
      // Ảnh không đổi nội dung nên cho trình duyệt giữ lại, đỡ tốn dữ liệu di động của học sinh.
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
