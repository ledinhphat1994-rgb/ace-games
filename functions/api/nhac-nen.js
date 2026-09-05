// GET /api/nhac-nen — phát nội dung file nhạc nền đang bật cho trang lớp.
// Tệp âm thanh được lưu trong Cloudflare R2 (env.ANH).
// Hỗ trợ Range Requests (HTTP 206) để phát/tua mượt mà trên Mobile & Web (iOS Safari, Android Chrome).
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);

  const nhac = await env.DB.prepare('SELECT khoa, kieu FROM nhac_nen WHERE id = 1').first();
  if (!nhac) return loi('Chưa có nhạc nền.', 404);

  const rangeHeader = request.headers.get('range');
  let obj;
  if (rangeHeader) {
    try {
      obj = await env.ANH.get(nhac.khoa, { range: request.headers });
    } catch {
      obj = await env.ANH.get(nhac.khoa);
    }
  } else {
    obj = await env.ANH.get(nhac.khoa);
  }
  if (!obj) return loi('Không tìm thấy file nhạc.', 404);

  const kieuTraVe = (obj.httpMetadata && obj.httpMetadata.contentType)
    || (obj.customMetadata && obj.customMetadata.kieu)
    || nhac.kieu
    || 'audio/mpeg';

  const headers = new Headers();
  headers.set('Content-Type', kieuTraVe);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=604800');
  headers.set('X-Content-Type-Options', 'nosniff');
  if (obj.httpEtag) headers.set('ETag', obj.httpEtag);

  if (obj.range) {
    const offset = obj.range.offset ?? 0;
    const length = obj.range.length ?? (obj.size - offset);
    const end = offset + length - 1;
    headers.set('Content-Range', `bytes ${offset}-${end}/${obj.size}`);
    headers.set('Content-Length', String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set('Content-Length', String(obj.size));
  return new Response(obj.body, { status: 200, headers });
}, { canGiaoVien: false });
