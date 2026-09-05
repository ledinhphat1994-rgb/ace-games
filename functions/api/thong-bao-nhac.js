// GET /api/thong-bao-nhac?id=<id> — phát file âm thanh đính kèm trong MỘT thông báo cụ thể.
// Tệp âm thanh được lưu trong Cloudflare R2 (env.ANH).
// Hỗ trợ Range Requests (HTTP 206) để phát/tua mượt mà trên Mobile & Web (iOS Safari, Android Chrome).
import { bocXuLy, loi } from '../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');

  const tb = await env.DB.prepare(
    'SELECT nhac_khoa AS khoa, nhac_kieu AS kieu FROM thong_bao WHERE id = ?1'
  ).bind(id).first();
  if (!tb || !tb.khoa) return loi('Thông báo này chưa có tệp âm thanh.', 404);

  const rangeHeader = request.headers.get('range');
  let obj;
  if (rangeHeader) {
    try {
      obj = await env.ANH.get(tb.khoa, { range: request.headers });
    } catch {
      obj = await env.ANH.get(tb.khoa);
    }
  } else {
    obj = await env.ANH.get(tb.khoa);
  }
  if (!obj) return loi('Không tìm thấy file âm thanh.', 404);

  const kieuTraVe = (obj.httpMetadata && obj.httpMetadata.contentType)
    || (obj.customMetadata && obj.customMetadata.kieu)
    || tb.kieu
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
