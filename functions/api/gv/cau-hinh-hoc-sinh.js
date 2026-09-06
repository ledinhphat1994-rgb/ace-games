// Cấu hình những thông tin học sinh nào được hiển thị cho ai — CHỈ giáo viên chủ nhiệm chỉnh
// được (đây là quyết định về quyền riêng tư của học sinh trong lớp).
//   GET   /api/gv/cau-hinh-hoc-sinh  -> cấu hình hiện tại
//   PATCH /api/gv/cau-hinh-hoc-sinh  { congKhaiAn: [...], canSuHien: [...] }
//
// "congKhaiAn": các cột ẨN khỏi "Danh sách lớp" công khai ở trang chủ (mọi học sinh xem được).
// "canSuHien": các trường THÊM cho cán sự được cấp quyền "Học sinh" xem trong khu quản lý,
// ngoài các cột công khai — mặc định KHÔNG có gì (an toàn nhất).
import { bocXuLy, json, loi } from '../../_lib/api.js';

const CONG_KHAI = ['gioi-tinh', 'ngay-sinh', 'lop-nghe', 'to-hop', 'chuc-vu', 'to-so'];
const CAN_SU = ['dien-thoai-ph', 'hoan-canh', 'ghi-chu', 'thong-ke-vang'];

function locMa(mang, choPhep) {
  if (!Array.isArray(mang)) return '';
  return [...new Set(mang.filter((m) => choPhep.includes(m)))].join(',');
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const row = await env.DB.prepare('SELECT hs_cong_khai_an AS congKhaiAn, hs_can_su_hien AS canSuHien FROM lop WHERE id = ?1')
    .bind(phien.lopId).first();
  return json({
    ok: true,
    congKhaiAn: (row?.congKhaiAn || '').split(',').filter(Boolean),
    canSuHien: (row?.canSuHien || '').split(',').filter(Boolean),
    cacMucCongKhai: CONG_KHAI,
    cacMucCanSu: CAN_SU,
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  let than;
  try { than = await request.json(); } catch { return loi('Dữ liệu gửi lên không hợp lệ.'); }

  await env.DB.prepare('UPDATE lop SET hs_cong_khai_an = ?1, hs_can_su_hien = ?2 WHERE id = ?3')
    .bind(locMa(than.congKhaiAn, CONG_KHAI), locMa(than.canSuHien, CAN_SU), phien.lopId).run();

  return json({ ok: true });
}, { canGiaoVien: true });
