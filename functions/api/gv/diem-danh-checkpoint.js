// Lịch sử và khôi phục Điểm danh — y hệt cơ chế Thủ quỹ (xem quy-checkpoint.js).
//   GET    /api/gv/diem-danh-checkpoint            -> danh sách điểm khôi phục (ai có quyền Điểm danh đều xem được)
//   GET    /api/gv/diem-danh-checkpoint?loai=chinh|phu -> chỉ điểm khôi phục của đúng loại đó
//                                                      (điểm chụp trước khi khôi phục, loai=NULL, không hiện ở
//                                                      2 bộ lọc này — chỉ hiện khi xem "Tất cả").
// Khôi phục/xoá (CHỈ giáo viên chủ nhiệm — kể cả tài khoản đặc biệt có quyền điểm danh cũng
// không tự khôi phục được) đã tách sang functions/api/gv/rieng/diem-danh-checkpoint.js — đặt
// Cloudflare Access lên đúng "/api/gv/rieng/*" mà không chặn nhầm tài khoản chỉ cần XEM lịch sử.
import { bocXuLy, json } from '../../_lib/api.js';

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
