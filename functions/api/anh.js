// GET /api/anh?khoa=... — trả về nội dung một tấm ảnh.
// Học sinh đã vào bằng mã lớp đều xem được. Người ngoài thì không (middleware chặn từ trước).
import { layPhien } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  const khoa = new URL(request.url).searchParams.get('khoa') || '';

  // Chỉ nhận khoá do hệ thống sinh ra, tránh bị dò sang khoá khác trong KV.
  if (!/^anh-[a-z0-9]+-[a-z0-9]+$/i.test(khoa)) {
    return new Response('Khoá ảnh không hợp lệ.', { status: 400 });
  }

  if (!(await layPhien(request, env))) return new Response('Chưa đăng nhập.', { status: 401 });
  if (!env.ANH) return new Response('Chưa gắn kho ảnh.', { status: 500 });

  const { value, metadata } = await env.ANH.getWithMetadata(khoa, { type: 'arrayBuffer' });
  if (!value) return new Response('Không tìm thấy ảnh.', { status: 404 });

  return new Response(value, {
    headers: {
      'Content-Type': (metadata && metadata.kieu) || 'image/jpeg',
      // Ảnh không đổi nội dung nên cho trình duyệt giữ lại, đỡ tốn dữ liệu di động của học sinh.
      'Cache-Control': 'private, max-age=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
