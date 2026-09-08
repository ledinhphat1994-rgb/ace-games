// Lịch sử và khôi phục Thủ quỹ.
//   GET    /api/gv/quy-checkpoint            -> danh sách điểm khôi phục (ai có quyền Thủ quỹ đều xem được)
// Khôi phục/xoá (CHỈ giáo viên chủ nhiệm — kể cả tài khoản Thủ quỹ cũng không tự khôi phục được,
// để tránh một tài khoản bị chiếm quyền tự xoá dấu vết bằng cách "khôi phục") đã tách sang
// functions/api/gv/rieng/quy-checkpoint.js — đặt Cloudflare Access lên đúng "/api/gv/rieng/*"
// mà không chặn nhầm tài khoản Thủ quỹ chỉ cần XEM lịch sử này.
import { bocXuLy, json } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, hanh_dong AS hanhDong, nguoi_thuc_hien AS nguoiThucHien, tao_luc AS taoLuc
       FROM quy_checkpoint WHERE lop_id = ?1 ORDER BY id DESC LIMIT 200`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true, quyenCan: 'quy' });
