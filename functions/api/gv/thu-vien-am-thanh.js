// Thư viện Âm thanh — nhiều bài, chọn ĐÚNG MỘT bài làm "nhạc nền trang chủ" tại một thời điểm.
//   GET    /api/gv/thu-vien-am-thanh              -> danh sách + tổng dung lượng
//   POST   /api/gv/thu-vien-am-thanh?tenBai=...    -> tải bài MP3 mới vào thư viện (thân nhị phân thô)
//   PATCH  /api/gv/thu-vien-am-thanh { id, datNhacNen: true }  -> đặt bài này làm nhạc nền trang chủ
//   PATCH  /api/gv/thu-vien-am-thanh { id, ten }               -> đổi tên hiển thị
//   DELETE /api/gv/thu-vien-am-thanh?id=
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { themTepVaoThuVien, xoaKhoiThuVien } from '../../_lib/thu-vien.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, ten, kieu, co_byte AS coByte, dang_phat AS dangPhat, tao_luc AS taoLuc FROM am_thanh ORDER BY tao_luc DESC'
  ).all();
  return json({ ok: true, danhSach: results.map((r) => ({ ...r, dangPhat: Boolean(r.dangPhat) })) });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['am-thanh', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();
  const tenBai = chuoi(new URL(request.url).searchParams.get('tenBai'), 200) || 'Bài hát chưa đặt tên';

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, 'am-thanh', duLieu, kieu, tenBai);
  if (thongBaoLoi) return loi(thongBaoLoi);

  // Thư viện trống trước đó (chưa có bài nào) — tự đặt luôn bài đầu tiên làm nhạc nền, khỏi
  // phải vào lại đặt tay khi mới dùng tính năng.
  const { count } = (await env.DB.prepare('SELECT COUNT(*) AS count FROM am_thanh').first()) || { count: 0 };
  if (count === 1) await env.DB.prepare('UPDATE am_thanh SET dang_phat = 1 WHERE id = ?1').bind(dong.id).run();

  return json({ ok: true, ...dong });
}, { canGiaoVien: true, quyenCan: 'am-thanh' });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bài hát.');

  const bai = await env.DB.prepare('SELECT id FROM am_thanh WHERE id = ?1').bind(id).first();
  if (!bai) return loi('Không tìm thấy bài hát này.', 404);

  if (than.datNhacNen) {
    await env.DB.batch([
      env.DB.prepare('UPDATE am_thanh SET dang_phat = 0 WHERE dang_phat = 1'),
      env.DB.prepare('UPDATE am_thanh SET dang_phat = 1 WHERE id = ?1').bind(id),
    ]);
  }
  if (than.ten !== undefined) {
    await env.DB.prepare('UPDATE am_thanh SET ten = ?1 WHERE id = ?2').bind(chuoi(than.ten, 200), id).run();
  }

  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'am-thanh' });

export const onRequestDelete = bocXuLy(async ({ request, env }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bài hát.');

  const loiXoa = await xoaKhoiThuVien(env, 'am-thanh', id);
  if (loiXoa) return loiXoa;
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'am-thanh' });
