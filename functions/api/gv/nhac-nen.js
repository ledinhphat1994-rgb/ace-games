// Nhạc nền phát trên trang lớp công khai — chỉ MỘT bài tại một thời điểm.
//   GET    /api/gv/nhac-nen                      -> thông tin bài đang bật (hoặc null)
//   POST   /api/gv/nhac-nen?tenBai=...            -> tải bài MP3 MỚI lên (thay bài cũ nếu có)
//          Thân yêu cầu là DỮ LIỆU NHỊ PHÂN THÔ (không bọc JSON/base64) — file mp3 vài MB
//          sẽ vượt giới hạn thân JSON thường dùng ở các API khác trong app.
//   DELETE /api/gv/nhac-nen                       -> tắt hẳn nhạc nền, xoá file khỏi kho
import { bocXuLy, json, loi, chuoi } from '../../_lib/api.js';

const KIEU_CHO_PHEP = new Set(['audio/mpeg', 'audio/mp3']);
const TOI_DA_BYTE = 12_000_000;   // ~12 MB — đủ cho một bài nhạc nền vài phút, không quá nặng cho học sinh tải

export const onRequestGet = bocXuLy(async ({ env }) => {
  const nhac = await env.DB.prepare(
    'SELECT ten_bai AS tenBai, kieu, co_byte AS coByte, tao_luc AS taoLuc FROM nhac_nen WHERE id = 1'
  ).first();
  return json({ ok: true, nhac: nhac || null });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ vào project.', 500);

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  if (!KIEU_CHO_PHEP.has(kieu)) return loi('Chỉ nhận file MP3 (audio/mpeg).');

  const duLieu = await request.arrayBuffer();
  if (!duLieu.byteLength) return loi('File rỗng hoặc không đọc được.');
  if (duLieu.byteLength > TOI_DA_BYTE) {
    return loi(`File nặng ${Math.round(duLieu.byteLength / 1_000_000)} MB, vượt mức cho phép (${TOI_DA_BYTE / 1_000_000} MB). Hãy nén hoặc cắt ngắn bài nhạc.`);
  }

  const tenBai = chuoi(new URL(request.url).searchParams.get('tenBai'), 200) || 'Nhạc nền lớp 10A7';

  // Xoá file cũ trong kho trước khi ghi bài mới, tránh rác lại trong KV.
  const cu = await env.DB.prepare('SELECT khoa FROM nhac_nen WHERE id = 1').first();
  if (cu) await env.ANH.delete(cu.khoa);

  const khoa = 'nhac-' + Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);
  await env.ANH.put(khoa, duLieu, { metadata: { kieu } });

  await env.DB.prepare(
    `INSERT INTO nhac_nen (id, ten_bai, khoa, kieu, co_byte, tao_luc) VALUES (1, ?1, ?2, ?3, ?4, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET ten_bai = excluded.ten_bai, khoa = excluded.khoa,
                                    kieu = excluded.kieu, co_byte = excluded.co_byte, tao_luc = excluded.tao_luc`
  ).bind(tenBai, khoa, kieu, duLieu.byteLength).run();

  return json({ ok: true, tenBai, coByte: duLieu.byteLength });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });

export const onRequestDelete = bocXuLy(async ({ env }) => {
  const cu = await env.DB.prepare('SELECT khoa FROM nhac_nen WHERE id = 1').first();
  if (cu) {
    if (env.ANH) await env.ANH.delete(cu.khoa);
    await env.DB.prepare('DELETE FROM nhac_nen WHERE id = 1').run();
  }
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'hinh-anh' });
