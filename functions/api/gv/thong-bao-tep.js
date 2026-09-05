// Đính kèm ảnh, nhạc hoặc file video cho MỘT thông báo cụ thể (đã tồn tại, có id rồi).
//   POST   /api/gv/thong-bao-tep?id=<id>&loai=hinh|nhac|video   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
//   DELETE /api/gv/thong-bao-tep?id=<id>&loai=hinh|nhac|video
import { bocXuLy, json, loi } from '../../_lib/api.js';

const KIEU_HINH = new Set(['image/jpeg', 'image/png', 'image/webp']);
const KIEU_NHAC = new Set(['audio/mpeg', 'audio/mp3']);
const KIEU_VIDEO = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg']);
const TOI_DA_HINH = 1_500_000;   // ~1,5 MB sau khi nén trên máy giáo viên
const TOI_DA_NHAC = 12_000_000;  // ~12 MB, đủ cho một đoạn âm thanh ngắn
const TOI_DA_VIDEO = 50_000_000; // ~50 MB cho tệp video từ máy tính/điện thoại

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
  if (!['hinh', 'nhac', 'video'].includes(loaiTep)) return loi('Loại tệp không hợp lệ.');

  const tb = await env.DB.prepare(
    'SELECT hinh_khoa AS hinhKhoa, nhac_khoa AS nhacKhoa, video_khoa AS videoKhoa FROM thong_bao WHERE id = ?1'
  ).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const boKieu = loaiTep === 'hinh' ? KIEU_HINH : (loaiTep === 'nhac' ? KIEU_NHAC : KIEU_VIDEO);
  if (!boKieu.has(kieu)) {
    if (loaiTep === 'hinh') return loi('Chỉ nhận ảnh JPG, PNG hoặc WebP.');
    if (loaiTep === 'nhac') return loi('Chỉ nhận file MP3.');
    return loi('Chỉ nhận file video định dạng MP4, WebM, MOV hoặc OGG.');
  }

  const duLieu = await request.arrayBuffer();
  if (!duLieu.byteLength) return loi('File rỗng hoặc không đọc được.');
  const toiDa = loaiTep === 'hinh' ? TOI_DA_HINH : (loaiTep === 'nhac' ? TOI_DA_NHAC : TOI_DA_VIDEO);
  if (duLieu.byteLength > toiDa) {
    return loi(`File nặng ${Math.round(duLieu.byteLength / 1024)} KB, vượt mức cho phép (${Math.round(toiDa / 1024)} KB).`);
  }

  const cotKhoa = loaiTep === 'hinh' ? 'hinh_khoa' : (loaiTep === 'nhac' ? 'nhac_khoa' : 'video_khoa');
  const cotKieu = loaiTep === 'hinh' ? 'hinh_kieu' : (loaiTep === 'nhac' ? 'nhac_kieu' : 'video_kieu');
  const khoaCu = loaiTep === 'hinh' ? tb.hinhKhoa : (loaiTep === 'nhac' ? tb.nhacKhoa : tb.videoKhoa);
  if (khoaCu) await env.ANH.delete(khoaCu).catch(() => {});

  // Chốt chặn an toàn: không vượt quá 9,5 GB cho toàn bộ kho lưu trữ
  const GIOI_HAN_TOI_DA_TONG_BYTE = 9_500_000_000;
  const tongAnh = await env.DB.prepare('SELECT COALESCE(SUM(co_byte), 0) AS tong FROM hinh_anh').first('tong');
  if ((Number(tongAnh) || 0) + duLieu.byteLength > GIOI_HAN_TOI_DA_TONG_BYTE) {
    return loi('Kho lưu trữ đã đạt ngưỡng an toàn 9,5 GB (trong mức 10 GB miễn phí). Đã tự động khoá tải lên để bảo đảm 100% không phát sinh chi phí.');
  }

  const tienTo = loaiTep === 'hinh' ? 'anh' : (loaiTep === 'nhac' ? 'tbnhac' : 'tbvideo');
  const khoa = `${tienTo}-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await env.ANH.put(khoa, duLieu, {
    httpMetadata: { contentType: kieu },
    customMetadata: { kieu },
    metadata: { kieu },
  });

  await env.DB.prepare(`UPDATE thong_bao SET ${cotKhoa} = ?1, ${cotKieu} = ?2 WHERE id = ?3`)
    .bind(khoa, kieu, id).run();

  return json({ ok: true, khoa, kieu, coByte: duLieu.byteLength });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const { id, loaiTep } = docThamSo(request);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');
  if (!['hinh', 'nhac', 'video'].includes(loaiTep)) return loi('Loại tệp không hợp lệ.');

  const cotKhoa = loaiTep === 'hinh' ? 'hinh_khoa' : (loaiTep === 'nhac' ? 'nhac_khoa' : 'video_khoa');
  const cotKieu = loaiTep === 'hinh' ? 'hinh_kieu' : (loaiTep === 'nhac' ? 'nhac_kieu' : 'video_kieu');
  const tb = await env.DB.prepare(`SELECT ${cotKhoa} AS khoa FROM thong_bao WHERE id = ?1`).bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  if (tb.khoa && env.ANH) await env.ANH.delete(tb.khoa).catch(() => {});
  await env.DB.prepare(`UPDATE thong_bao SET ${cotKhoa} = NULL, ${cotKieu} = NULL WHERE id = ?1`).bind(id).run();

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });
