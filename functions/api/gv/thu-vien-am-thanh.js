// Thư viện Âm thanh — nhiều bài, chọn ĐÚNG MỘT bài làm "nhạc nền trang chủ" tại một thời điểm.
//   GET    /api/gv/thu-vien-am-thanh              -> danh sách bài ĐANG HIỂN THỊ + tổng dung lượng
//   GET    /api/gv/thu-vien-am-thanh?rac=1        -> danh sách bài trong THÙNG RÁC (CHỈ giáo viên)
//   POST   /api/gv/thu-vien-am-thanh?tenBai=...    -> tải bài MP3 mới vào thư viện (thân nhị phân thô)
//   PATCH  /api/gv/thu-vien-am-thanh { id, datNhacNen: true }  -> đặt bài này làm nhạc nền trang chủ
//   PATCH  /api/gv/thu-vien-am-thanh { id, ten }               -> đổi tên hiển thị
//   PATCH  /api/gv/thu-vien-am-thanh { id, khoiPhuc: true }    -> khôi phục khỏi thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-am-thanh?id=              -> chuyển MỘT bài vào thùng rác (tài khoản có
//                                                          quyền "am-thanh" cũng xoá được — an toàn
//                                                          vì có thùng rác, giáo viên khôi phục lại được)
//   DELETE /api/gv/thu-vien-am-thanh?ids=1,2,3         -> chuyển nhiều bài vào thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-am-thanh?tatCa=1           -> chuyển sạch cả thư viện vào thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-am-thanh?id=&vinhVien=1    -> xoá VĨNH VIỄN một bài ĐÃ trong thùng rác (CHỈ giáo viên)
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import {
  themTepVaoThuVien, xoaKhoiThuVien, xoaNhieuKhoiThuVien,
  khoiPhucKhoiThuVien, xoaVinhVienKhoiThuVien, donDepThungRacHetHan,
} from '../../_lib/thu-vien.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const xemRac = new URL(request.url).searchParams.get('rac') === '1';
  if (xemRac && phien.role !== 'teacher') return loi('Chỉ giáo viên chủ nhiệm xem được thùng rác.', 403);
  if (xemRac) await donDepThungRacHetHan(env, phien.lopId, phien);

  const { results } = await env.DB.prepare(
    `SELECT id, ten, kieu, co_byte AS coByte, dang_phat AS dangPhat, tao_luc AS taoLuc, da_xoa_luc AS daXoaLuc,
            xoa_boi AS xoaBoi, ly_do_xoa AS lyDoXoa
       FROM am_thanh WHERE lop_id = ?1 AND da_xoa_luc IS ${xemRac ? 'NOT NULL' : 'NULL'}
      ORDER BY ${xemRac ? 'da_xoa_luc DESC' : 'tao_luc DESC'}`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results.map((r) => ({ ...r, dangPhat: Boolean(r.dangPhat) })) });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['am-thanh', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();
  const tenBai = chuoi(new URL(request.url).searchParams.get('tenBai'), 200) || 'Bài hát chưa đặt tên';

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, 'am-thanh', duLieu, kieu, tenBai, phien.lopId, phien);
  if (thongBaoLoi) return loi(thongBaoLoi);

  // Thư viện trống trước đó (chưa có bài nào CỦA LỚP NÀY) — tự đặt luôn bài đầu tiên làm nhạc
  // nền, khỏi phải vào lại đặt tay khi mới dùng tính năng.
  const { count } = (await env.DB.prepare('SELECT COUNT(*) AS count FROM am_thanh WHERE lop_id = ?1').bind(phien.lopId).first()) || { count: 0 };
  if (count === 1) await env.DB.prepare('UPDATE am_thanh SET dang_phat = 1 WHERE id = ?1').bind(dong.id).run();

  return json({ ok: true, ...dong });
}, { canGiaoVien: true, quyenCan: 'am-thanh' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);

  if (than.tatNhacNen) {
    await env.DB.prepare('UPDATE am_thanh SET dang_phat = 0 WHERE dang_phat = 1 AND lop_id = ?1').bind(phien.lopId).run();
    return json({ ok: true, daTat: true, nhac: null });
  }

  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bài hát.');

  if (than.khoiPhuc) {
    if (phien.role !== 'teacher') return loi('Chỉ giáo viên chủ nhiệm khôi phục được.', 403);
    const loiKp = await khoiPhucKhoiThuVien(env, 'am-thanh', id, phien.lopId, phien);
    if (loiKp) return loiKp;
    return json({ ok: true });
  }

  const bai = await env.DB.prepare('SELECT id, ten FROM am_thanh WHERE id = ?1 AND lop_id = ?2 AND da_xoa_luc IS NULL').bind(id, phien.lopId).first();
  if (!bai) return loi('Không tìm thấy bài hát này.', 404);

  if (than.datNhacNen) {
    // "Đang phát" tính riêng theo TỪNG LỚP — đặt nhạc nền của lớp này không đụng tới lớp khác.
    await env.DB.batch([
      env.DB.prepare('UPDATE am_thanh SET dang_phat = 0 WHERE dang_phat = 1 AND lop_id = ?1').bind(phien.lopId),
      env.DB.prepare('UPDATE am_thanh SET dang_phat = 1 WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId),
    ]);
  }
  if (than.ten !== undefined) {
    await env.DB.prepare('UPDATE am_thanh SET ten = ?1 WHERE id = ?2').bind(chuoi(than.ten, 200), id).run();
  }

  return json({ ok: true, nhac: than.datNhacNen ? { id: bai.id, tenBai: bai.ten } : undefined });
}, { canGiaoVien: true, quyenCan: 'am-thanh' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const laGiaoVien = phien.role === 'teacher';
  const { lyDo } = await docThan(request);

  if (q.get('vinhVien') === '1') {
    if (!laGiaoVien) return loi('Chỉ giáo viên chủ nhiệm xoá vĩnh viễn được.', 403);
    const id = Number(q.get('id'));
    if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bài hát.');
    const loiXoa = await xoaVinhVienKhoiThuVien(env, 'am-thanh', id, phien.lopId, phien);
    if (loiXoa) return loiXoa;
    return json({ ok: true });
  }

  if (q.get('tatCa') === '1' || q.get('ids')) {
    if (!laGiaoVien) return loi('Tài khoản được cấp quyền chỉ xoá được từng bài một. Nhờ giáo viên chủ nhiệm nếu cần xoá nhiều bài cùng lúc.', 403);
    let ids;
    if (q.get('tatCa') === '1') {
      const { results } = await env.DB.prepare('SELECT id FROM am_thanh WHERE lop_id = ?1 AND da_xoa_luc IS NULL').bind(phien.lopId).all();
      ids = results.map((r) => r.id);
    } else {
      ids = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    }
    const { daXoa } = await xoaNhieuKhoiThuVien(env, 'am-thanh', ids, phien.lopId, phien, chuoi(lyDo, 300));
    return json({ ok: true, daXoa });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã bài hát.');

  const loiXoa = await xoaKhoiThuVien(env, 'am-thanh', id, phien.lopId, phien, chuoi(lyDo, 300));
  if (loiXoa) return loiXoa;
  return json({ ok: true });
// choPhepXoaPhu: tài khoản được cấp quyền "am-thanh" xoá được (chuyển vào thùng rác) — an toàn vì
// giáo viên luôn khôi phục lại được nếu xoá nhầm hoặc tài khoản bị chiếm quyền lạm dụng.
}, { canGiaoVien: true, quyenCan: 'am-thanh', choPhepXoaPhu: true });
