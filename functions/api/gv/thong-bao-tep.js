// Đính kèm ảnh hoặc file nhạc cho MỘT thông báo cụ thể (đã tồn tại, có id rồi).
//   POST   /api/gv/thong-bao-tep?id=<id>&loai=hinh|nhac   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
//   DELETE /api/gv/thong-bao-tep?id=<id>&loai=hinh|nhac
//
// Thân KHÔNG bọc JSON/base64 — giống /api/gv/nhac-nen — vì ảnh/nhạc vượt xa giới hạn 200KB
// của docThan (dùng cho các trường văn bản khác của thông báo). Ảnh dùng chung tiền tố khoá
// "anh-" với /api/gv/anh nên phát lại được qua route công khai /api/anh?khoa= có sẵn; nhạc
// phát qua /api/thong-bao-nhac?id= (khác nhạc nền toàn trang, đây là nhạc riêng của một tin).
import { bocXuLy, json, loi } from '../../_lib/api.js';

const KIEU_HINH = new Set(['image/jpeg', 'image/png', 'image/webp']);
const KIEU_NHAC = new Set(['audio/mpeg', 'audio/mp3']);
const TOI_DA_HINH = 1_500_000;   // ~1,5 MB sau khi nén trên máy giáo viên
const TOI_DA_NHAC = 12_000_000;  // ~12 MB, đủ cho một đoạn âm thanh ngắn

function docThamSo(request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const loaiTep = url.searchParams.get('loai');
  return { id, loaiTep };
}

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  if (!env.ANH) return loi('Chưa gắn kho lưu trữ vào project.', 500);
  const { id, loaiTep } = docThamSo(request);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');
  if (!['hinh', 'nhac'].includes(loaiTep)) return loi('Loại tệp không hợp lệ.');

  const tb = await env.DB.prepare(
    'SELECT hinh_khoa AS hinhKhoa, nhac_khoa AS nhacKhoa FROM thong_bao WHERE id = ?1'
  ).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const boKieu = loaiTep === 'hinh' ? KIEU_HINH : KIEU_NHAC;
  if (!boKieu.has(kieu)) {
    return loi(loaiTep === 'hinh' ? 'Chỉ nhận ảnh JPG, PNG hoặc WebP.' : 'Chỉ nhận file MP3.');
  }

  const duLieu = await request.arrayBuffer();
  if (!duLieu.byteLength) return loi('File rỗng hoặc không đọc được.');
  const toiDa = loaiTep === 'hinh' ? TOI_DA_HINH : TOI_DA_NHAC;
  if (duLieu.byteLength > toiDa) {
    return loi(`File nặng ${Math.round(duLieu.byteLength / 1024)} KB, vượt mức cho phép (${Math.round(toiDa / 1024)} KB).`);
  }

  const cotKhoa = loaiTep === 'hinh' ? 'hinh_khoa' : 'nhac_khoa';
  const cotKieu = loaiTep === 'hinh' ? 'hinh_kieu' : 'nhac_kieu';
  const khoaCu = loaiTep === 'hinh' ? tb.hinhKhoa : tb.nhacKhoa;
  if (khoaCu) await env.ANH.delete(khoaCu).catch(() => {});

  const tienTo = loaiTep === 'hinh' ? 'anh' : 'tbnhac';
  const khoa = `${tienTo}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await env.ANH.put(khoa, duLieu, { metadata: { kieu } });

  await env.DB.prepare(`UPDATE thong_bao SET ${cotKhoa} = ?1, ${cotKieu} = ?2 WHERE id = ?3`)
    .bind(khoa, kieu, id).run();

  return json({ ok: true, khoa, kieu, coByte: duLieu.byteLength });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const { id, loaiTep } = docThamSo(request);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');
  if (!['hinh', 'nhac'].includes(loaiTep)) return loi('Loại tệp không hợp lệ.');

  const cotKhoa = loaiTep === 'hinh' ? 'hinh_khoa' : 'nhac_khoa';
  const cotKieu = loaiTep === 'hinh' ? 'hinh_kieu' : 'nhac_kieu';
  const tb = await env.DB.prepare(`SELECT ${cotKhoa} AS khoa FROM thong_bao WHERE id = ?1`).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  if (tb.khoa && env.ANH) await env.ANH.delete(tb.khoa).catch(() => {});
  await env.DB.prepare(`UPDATE thong_bao SET ${cotKhoa} = NULL, ${cotKieu} = NULL WHERE id = ?1`).bind(id).run();

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });
