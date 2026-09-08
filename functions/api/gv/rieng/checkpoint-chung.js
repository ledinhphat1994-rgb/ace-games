// Lịch sử & khôi phục DÙNG CHUNG cho Thông báo / Thời khoá biểu / Hoạt động lớp — phần CHỈ
// GIÁO VIÊN CHỦ NHIỆM (khôi phục/xoá điểm khôi phục). Phần GET (xem danh sách, ai có quyền
// tương ứng cũng xem được) vẫn ở functions/api/gv/checkpoint-chung.js — tách riêng để đặt
// Cloudflare Access lên đúng tiền tố "/api/gv/rieng/*" mà không chặn nhầm tài khoản có quyền.
//   POST   /api/gv/rieng/checkpoint-chung { muc, id }  -> khôi phục về điểm đó
//   DELETE /api/gv/rieng/checkpoint-chung?muc=&id=     -> xoá một điểm khôi phục
//   DELETE /api/gv/rieng/checkpoint-chung?muc=&tatCa=1 -> xoá SẠCH lịch sử của đúng "muc" đó
import { bocXuLy, json, loi, docThan } from '../../../_lib/api.js';
import { tinhNangHopLe, chupCheckpointChung, khoiPhucCheckpointChung } from '../../../_lib/checkpoint-chung.js';

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { muc, id } = await docThan(request);
  if (!tinhNangHopLe(muc)) return loi('Chức năng không hợp lệ.');
  const cpId = Number(id);
  if (!Number.isInteger(cpId) || cpId <= 0) return loi('Thiếu mã điểm khôi phục.');

  const cp = await env.DB.prepare(
    'SELECT id FROM checkpoint_chung WHERE id = ?1 AND lop_id = ?2 AND tinh_nang = ?3'
  ).bind(cpId, phien.lopId, muc).first();
  if (!cp) return loi('Không tìm thấy điểm khôi phục này.', 404);

  // Trước khi khôi phục, cũng chụp lại trạng thái NGAY LÚC NÀY — để nếu khôi phục nhầm điểm,
  // vẫn có đường quay lại đúng lúc trước khi bấm khôi phục (giống hệt Thủ quỹ).
  await chupCheckpointChung(env.DB, muc, `Trước khi: khôi phục về điểm #${cpId}`, phien);
  await khoiPhucCheckpointChung(env.DB, muc, cpId, phien.lopId);

  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const muc = q.get('muc');
  if (!tinhNangHopLe(muc)) return loi('Chức năng không hợp lệ.');

  if (q.get('tatCa') === '1') {
    await env.DB.prepare('DELETE FROM checkpoint_chung WHERE lop_id = ?1 AND tinh_nang = ?2').bind(phien.lopId, muc).run();
    return json({ ok: true });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã điểm khôi phục.');
  await env.DB.prepare('DELETE FROM checkpoint_chung WHERE id = ?1 AND lop_id = ?2 AND tinh_nang = ?3').bind(id, phien.lopId, muc).run();
  return json({ ok: true });
}, { canGiaoVien: true });
