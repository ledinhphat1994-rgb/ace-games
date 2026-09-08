// Lịch sử và khôi phục Điểm danh — phần CHỈ GIÁO VIÊN CHỦ NHIỆM. Phần GET (xem danh sách, ai có
// quyền Điểm danh cũng xem được) vẫn ở functions/api/gv/diem-danh-checkpoint.js — tách riêng để
// đặt Cloudflare Access lên đúng tiền tố "/api/gv/rieng/*" mà không chặn nhầm tài khoản có quyền.
//   POST   /api/gv/rieng/diem-danh-checkpoint { id }     -> khôi phục về điểm đó (kể cả tài
//                                                            khoản đặc biệt có quyền điểm danh
//                                                            cũng không tự khôi phục được, để
//                                                            tránh một tài khoản bị chiếm quyền
//                                                            tự xoá dấu vết bằng cách "khôi phục").
//   DELETE /api/gv/rieng/diem-danh-checkpoint?id=        -> xoá một điểm khôi phục
//   DELETE /api/gv/rieng/diem-danh-checkpoint?tatCa=1[&loai=chinh|phu] -> xoá SẠCH lịch sử khôi
//                                                            phục (đúng loại đang lọc nếu có &loai=,
//                                                            không thì xoá tất cả)
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { khoiPhucCheckpointDiemDanh, chupCheckpointDiemDanh } from '../../../_lib/diem-danh-checkpoint.js';

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { id } = await docThan(request);
  const cpId = Number(id);
  if (!Number.isInteger(cpId) || cpId <= 0) return loi('Thiếu mã điểm khôi phục.');

  const cp = await env.DB.prepare('SELECT id FROM diem_danh_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(cpId, phien.lopId).first();
  if (!cp) return loi('Không tìm thấy điểm khôi phục này.', 404);

  // Trước khi khôi phục, cũng chụp lại trạng thái NGAY LÚC NÀY —
  // để nếu khôi phục nhầm điểm, vẫn có đường quay lại đúng lúc trước khi bấm khôi phục.
  await chupCheckpointDiemDanh(env.DB, `Trước khi: khôi phục về điểm #${cpId}`, phien);
  await khoiPhucCheckpointDiemDanh(env.DB, cpId, phien.lopId);

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;

  if (q.get('tatCa') === '1') {
    const loai = q.get('loai') || '';
    if (loai === 'chinh' || loai === 'phu') {
      await env.DB.prepare('DELETE FROM diem_danh_checkpoint WHERE lop_id = ?1 AND loai = ?2').bind(phien.lopId, loai).run();
    } else {
      await env.DB.prepare('DELETE FROM diem_danh_checkpoint WHERE lop_id = ?1').bind(phien.lopId).run();
    }
    return json({ ok: true });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã điểm khôi phục.');
  await env.DB.prepare('DELETE FROM diem_danh_checkpoint WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  return json({ ok: true });
}, { canGiaoVien: true });
