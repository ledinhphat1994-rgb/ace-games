// Lịch sử và khôi phục Điểm danh — y hệt cơ chế Thủ quỹ (xem quy-checkpoint.js).
//   GET    /api/gv/diem-danh-checkpoint            -> danh sách điểm khôi phục (ai có quyền Điểm danh đều xem được)
//   GET    /api/gv/diem-danh-checkpoint?loai=chinh|phu -> chỉ điểm khôi phục của đúng loại đó
//                                                      (điểm chụp trước khi khôi phục, loai=NULL, không hiện ở
//                                                      2 bộ lọc này — chỉ hiện khi xem "Tất cả").
//   POST   /api/gv/diem-danh-checkpoint { id }     -> khôi phục về điểm đó (CHỈ giáo viên chủ nhiệm — kể cả
//                                                      tài khoản đặc biệt có quyền điểm danh cũng không tự khôi
//                                                      phục được, để tránh một tài khoản bị chiếm quyền tự xoá
//                                                      dấu vết bằng cách "khôi phục").
//   DELETE /api/gv/diem-danh-checkpoint?id=        -> xoá một điểm khôi phục
//   DELETE /api/gv/diem-danh-checkpoint?tatCa=1[&loai=chinh|phu] -> xoá SẠCH lịch sử khôi phục (đúng loại
//                                                      đang lọc nếu có &loai=, không thì xoá tất cả)
//                                                      (CHỈ giáo viên — bocXuLy() đã tự chặn mọi DELETE từ
//                                                      tài khoản cán sự dù có quyền 'diem-danh' hay không).
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';
import { khoiPhucCheckpointDiemDanh, chupCheckpointDiemDanh } from '../../_lib/diem-danh-checkpoint.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const loai = new URL(request.url).searchParams.get('loai') || '';
  let sql = `SELECT id, hanh_dong AS hanhDong, nguoi_thuc_hien AS nguoiThucHien, loai, chi_tiet AS chiTiet, tao_luc AS taoLuc
               FROM diem_danh_checkpoint WHERE lop_id = ?1`;
  const params = [phien.lopId];
  if (loai === 'chinh' || loai === 'phu') {
    sql += ' AND loai = ?2';
    params.push(loai);
  }
  sql += ' ORDER BY id DESC LIMIT 200';
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  const danhSach = results.map((r) => ({ ...r, chiTiet: r.chiTiet ? JSON.parse(r.chiTiet) : null }));
  return json({ ok: true, danhSach });
}, { canGiaoVien: true, quyenCan: 'diem-danh' });

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
