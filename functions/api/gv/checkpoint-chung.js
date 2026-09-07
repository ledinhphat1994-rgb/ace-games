// Lịch sử & khôi phục DÙNG CHUNG cho Thông báo / Thời khoá biểu / Hoạt động lớp — xem
// functions/_lib/checkpoint-chung.js để biết cơ chế chụp/khôi phục.
//   GET    /api/gv/checkpoint-chung?muc=thong-bao          -> danh sách điểm khôi phục
//   POST   /api/gv/checkpoint-chung { muc, id }             -> khôi phục về điểm đó (CHỈ giáo
//                                                               viên chủ nhiệm — giống hệt lý do
//                                                               ở quy-checkpoint.js).
//   DELETE /api/gv/checkpoint-chung?muc=&id=                -> xoá một điểm khôi phục
//   DELETE /api/gv/checkpoint-chung?muc=&tatCa=1            -> xoá SẠCH lịch sử của đúng "muc" đó
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';
import { tinhNangHopLe, danhSachCheckpointChung, chupCheckpointChung, khoiPhucCheckpointChung } from '../../_lib/checkpoint-chung.js';

// Ai xem được lịch sử của "muc" nào: giáo viên xem được hết; tài khoản cán sự (phu/mã cá nhân
// được cấp quyền) chỉ xem được đúng lịch sử của mục mình có quyền — bocXuLy() ở dưới chỉ chặn
// thô theo "có ít nhất 1 trong 3 quyền", nên phải tự kiểm tra chính xác lại ở đây.
function xemDuoc(phien, muc) {
  return phien.role === 'teacher' || (phien.quyen || []).includes(muc);
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const muc = new URL(request.url).searchParams.get('muc');
  if (!tinhNangHopLe(muc)) return loi('Chức năng không hợp lệ.');
  if (!xemDuoc(phien, muc)) return loi('Bạn không có quyền xem lịch sử mục này.', 403);

  const danhSach = await danhSachCheckpointChung(env.DB, muc, phien.lopId);
  return json({ ok: true, danhSach });
}, { canGiaoVien: true, quyenCan: ['thong-bao', 'thoi-khoa-bieu', 'hoat-dong-lop'] });

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
