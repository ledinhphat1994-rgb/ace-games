// Lịch sử và khôi phục Thủ quỹ — phần CHỈ GIÁO VIÊN CHỦ NHIỆM. Phần GET (xem danh sách, ai có
// quyền Thủ quỹ cũng xem được) vẫn ở functions/api/gv/quy-checkpoint.js — tách riêng để đặt
// Cloudflare Access lên đúng tiền tố "/api/gv/rieng/*" mà không chặn nhầm tài khoản Thủ quỹ.
//   POST   /api/gv/rieng/quy-checkpoint { id }     -> khôi phục về điểm đó (kể cả tài khoản Thủ
//                                                      quỹ cũng không tự khôi phục được, để tránh
//                                                      một tài khoản bị chiếm quyền tự xoá dấu
//                                                      vết bằng cách "khôi phục").
//   DELETE /api/gv/rieng/quy-checkpoint?id=        -> xoá một điểm khôi phục
//   DELETE /api/gv/rieng/quy-checkpoint?tatCa=1    -> xoá SẠCH toàn bộ lịch sử khôi phục
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { khoiPhucCheckpoint, chupCheckpoint } from '../../../_lib/quy-checkpoint.js';

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
