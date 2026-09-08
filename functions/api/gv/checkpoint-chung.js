// Lịch sử & khôi phục DÙNG CHUNG cho Thông báo / Thời khoá biểu / Hoạt động lớp — xem
// functions/_lib/checkpoint-chung.js để biết cơ chế chụp/khôi phục.
//   GET    /api/gv/checkpoint-chung?muc=thong-bao          -> danh sách điểm khôi phục (ai có
//                                                              quyền tương ứng cũng xem được)
// Khôi phục/xoá (CHỈ giáo viên chủ nhiệm) đã tách sang functions/api/gv/rieng/checkpoint-chung.js
// — đặt Cloudflare Access lên đúng "/api/gv/rieng/*" mà không chặn nhầm tài khoản có quyền chỉ
// cần XEM lịch sử này.
import { bocXuLy, json, loi } from '../../_lib/api.js';
import { tinhNangHopLe, danhSachCheckpointChung } from '../../_lib/checkpoint-chung.js';

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
