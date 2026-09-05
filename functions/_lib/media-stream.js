// Phát một tệp nhị phân (ảnh/nhạc/video) từ Cloudflare R2 (env.ANH), hỗ trợ HTTP Range/206 để
// phát/tua mượt trên mobile & web (iOS Safari, Android Chrome đòi hỏi Range khi tua). Dùng
// chung cho mọi endpoint phát media công khai, thay vì mỗi endpoint tự chép lại y hệt logic
// này (trước đây lặp ở nhac-nen.js, thong-bao-nhac.js, thong-bao-video.js).
import { loi } from './api.js';

export async function phucVuTepR2(env, khoa, kieuMacDinh, request) {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ.', 500);
  if (!khoa) return loi('Không tìm thấy file.', 404);

  const rangeHeader = request.headers.get('range');
  let obj;
  if (rangeHeader) {
    try {
      obj = await env.ANH.get(khoa, { range: request.headers });
    } catch {
      obj = await env.ANH.get(khoa);
    }
  } else {
    obj = await env.ANH.get(khoa);
  }
  if (!obj) return loi('Không tìm thấy file.', 404);

  const kieuTraVe = (obj.httpMetadata && obj.httpMetadata.contentType)
    || (obj.customMetadata && obj.customMetadata.kieu)
    || kieuMacDinh;

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
}
