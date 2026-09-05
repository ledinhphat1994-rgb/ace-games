// Tải MỘT FILE MỚI ngay trong lúc soạn Thông báo — file này TỰ ĐỘNG trở thành một mục trong
// đúng thư viện tương ứng (Ảnh/Âm thanh/Video, xem functions/_lib/thu-vien.js) rồi đính kèm
// luôn vào thông báo, thay vì thuộc riêng thông báo này như trước đây. Đây là 1 trong 3 cách
// đính kèm (còn lại: chọn mục có sẵn trong thư viện, hoặc dán link ngoài — xử lý trực tiếp ở
// functions/api/gv/thong-bao.js, không qua endpoint này).
//   POST   /api/gv/thong-bao-tep?id=<id>&loai=hinh|nhac|video   (thân là DỮ LIỆU NHỊ PHÂN THÔ)
// Gỡ đính kèm (không tải file mới) đi thẳng qua PATCH /api/gv/thong-bao — đặt anhId/amThanhId/
// videoId = null, xem assets/js/thong-bao-dialog.js.
import { bocXuLy, json, loi } from '../../_lib/api.js';
import { themTepVaoThuVien } from '../../_lib/thu-vien.js';

const LOAI_THU_VIEN = { hinh: 'anh', nhac: 'am-thanh', video: 'video' };
const COT_ID = { hinh: 'anh_id', nhac: 'am_thanh_id', video: 'video_id' };
const COT_URL = { hinh: 'hinh_url', nhac: 'nhac_url', video: null };

function docThamSo(request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  const loaiTep = url.searchParams.get('loai');
  return { id, loaiTep };
}

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { id, loaiTep } = docThamSo(request);
  if (!Number.isInteger(id)) return loi('Thiếu mã thông báo.');
  if (!LOAI_THU_VIEN[loaiTep]) return loi('Loại tệp không hợp lệ.');

  const tb = await env.DB.prepare('SELECT id FROM thong_bao WHERE id = ?1').bind(id).first();
  if (!tb) return loi('Không tìm thấy thông báo.', 404);

  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, LOAI_THU_VIEN[loaiTep], duLieu, kieu, `Đính kèm — thông báo #${id}`);
  if (thongBaoLoi) return loi(thongBaoLoi);

  const cotId = COT_ID[loaiTep];
  const cotUrl = COT_URL[loaiTep];
  const cauLenh = cotUrl
    ? `UPDATE thong_bao SET ${cotId} = ?1, ${cotUrl} = NULL WHERE id = ?2`
    : `UPDATE thong_bao SET ${cotId} = ?1 WHERE id = ?2`;
  await env.DB.prepare(cauLenh).bind(dong.id, id).run();

  return json({ ok: true, id: dong.id, khoa: dong.khoa, kieu: dong.kieu, coByte: dong.coByte });
}, { canGiaoVien: true, quyenCan: 'thong-bao' });
