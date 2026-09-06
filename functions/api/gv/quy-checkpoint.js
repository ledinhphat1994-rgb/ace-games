// Lịch sử và khôi phục Thủ quỹ.
//   GET    /api/gv/quy-checkpoint            -> danh sách điểm khôi phục (ai có quyền Thủ quỹ đều xem được)
//   POST   /api/gv/quy-checkpoint { id }     -> khôi phục về điểm đó (CHỈ giáo viên chủ nhiệm — kể cả
//                                                tài khoản Thủ quỹ cũng không tự khôi phục được, để tránh
//                                                một tài khoản bị chiếm quyền tự xoá dấu vết bằng cách "khôi phục").
//   DELETE /api/gv/quy-checkpoint?id=        -> xoá một điểm khôi phục
//   DELETE /api/gv/quy-checkpoint?tatCa=1    -> xoá SẠCH toàn bộ lịch sử khôi phục
//                                                (CHỈ giáo viên — bocXuLy() đã tự chặn mọi DELETE từ
//                                                tài khoản cán sự dù có quyền 'quy' hay không, xem api.js).
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';
import { khoiPhucCheckpoint, chupCheckpoint } from '../../_lib/quy-checkpoint.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, hanh_dong AS hanhDong, nguoi_thuc_hien AS nguoiThucHien, tao_luc AS taoLuc
       FROM quy_checkpoint WHERE lop_id = ?1 ORDER BY id DESC LIMIT 200`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'quy' });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { id } = await docThan(request);
  const cpId = Number(id);
  if (!Number.isInteger(cpId) || cpId <= 0) return loi('Thiếu mã điểm khôi phục.');

  const cp = await env.DB.prepare('SELECT id FROM quy_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(cpId, phien.lopId).first();
  if (!cp) return loi('Không tìm thấy điểm khôi phục này.', 404);

  // Trước khi khôi phục, cũng chụp lại trạng thái NGAY LÚC NÀY —
  // để nếu khôi phục nhầm điểm, vẫn có đường quay lại đúng lúc trước khi bấm khôi phục.
  await chupCheckpoint(env.DB, `Trước khi: khôi phục về điểm #${cpId}`, phien);
  await khoiPhucCheckpoint(env.DB, cpId, phien.lopId);

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;

  if (q.get('tatCa') === '1') {
    await env.DB.prepare('DELETE FROM quy_checkpoint WHERE lop_id = ?1').bind(phien.lopId).run();
    return json({ ok: true });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã điểm khôi phục.');
  await env.DB.prepare('DELETE FROM quy_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  return json({ ok: true });
}, { canGiaoVien: true });
