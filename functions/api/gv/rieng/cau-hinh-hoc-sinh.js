// Cấu hình những thông tin học sinh nào công khai ở "Danh sách lớp" — CHỈ giáo viên chủ nhiệm
// chỉnh được (đây là quyết định về quyền riêng tư của học sinh trong lớp).
//   GET   /api/gv/rieng/cau-hinh-hoc-sinh  -> cấu hình hiện tại
//   PATCH /api/gv/rieng/cau-hinh-hoc-sinh  { congKhaiAn: [...] }
//
// "congKhaiAn": các cột ẨN khỏi "Danh sách lớp" công khai ở trang chủ (mọi học sinh xem được).
// (Trước đây còn có "canSuHien" — thêm trường riêng cho cán sự được cấp quyền "Học sinh" — đã
// bỏ vì quyền "Học sinh" không còn cấp được cho tài khoản đặc biệt nữa, xem hoc-sinh.js.)
import { bocXuLy, json, loi } from '../../../_lib/api.js';

const CONG_KHAI = ['gioi-tinh', 'ngay-sinh', 'lop-nghe', 'to-hop', 'chuc-vu', 'to-so'];

function locMa(mang, choPhep) {
  if (!Array.isArray(mang)) return '';
  return [...new Set(mang.filter((m) => choPhep.includes(m)))].join(',');
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const row = await env.DB.prepare('SELECT hs_cong_khai_an AS congKhaiAn FROM lop WHERE id = ?1')
    .bind(phien.lopId).first();
  return json({
    ok: true,
    congKhaiAn: (row?.congKhaiAn || '').split(',').filter(Boolean),
    cacMucCongKhai: CONG_KHAI,
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  let than;
  try { than = await request.json(); } catch { return loi('Dữ liệu gửi lên không hợp lệ.'); }

  await env.DB.prepare('UPDATE lop SET hs_cong_khai_an = ?1 WHERE id = ?2')
    .bind(locMa(than.congKhaiAn, CONG_KHAI), phien.lopId).run();

  return json({ ok: true });
}, { canGiaoVien: true });
