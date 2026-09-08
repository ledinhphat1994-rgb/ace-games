// Thư viện Video — nhiều video tải lên từ máy/điện thoại (khác video dán link YouTube/Drive,
// vốn không tốn kho lưu trữ nên không thuộc thư viện này).
//   GET    /api/gv/thu-vien-video               -> danh sách video ĐANG HIỂN THỊ + tổng dung lượng
//   GET    /api/gv/thu-vien-video?rac=1         -> danh sách video trong THÙNG RÁC (CHỈ giáo viên)
//   POST   /api/gv/thu-vien-video?ten=...        -> tải video mới vào thư viện (thân nhị phân thô)
//   PATCH  /api/gv/thu-vien-video { id, ten }    -> đổi tên hiển thị
//   PATCH  /api/gv/thu-vien-video { id, khoiPhuc: true }  -> khôi phục khỏi thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-video?id=              -> chuyển MỘT video vào thùng rác (tài khoản có
//                                                        quyền "video" cũng xoá được — an toàn vì có
//                                                        thùng rác, giáo viên khôi phục lại được)
//   DELETE /api/gv/thu-vien-video?ids=1,2,3         -> chuyển nhiều video vào thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-video?tatCa=1           -> chuyển sạch cả thư viện vào thùng rác (CHỈ giáo viên)
//   DELETE /api/gv/thu-vien-video?id=&vinhVien=1    -> xoá VĨNH VIỄN một video ĐÃ trong thùng rác (CHỈ giáo viên)
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
    `SELECT id, ten, kieu, co_byte AS coByte, tao_luc AS taoLuc, da_xoa_luc AS daXoaLuc,
            xoa_boi AS xoaBoi, ly_do_xoa AS lyDoXoa
       FROM video WHERE lop_id = ?1 AND da_xoa_luc IS ${xemRac ? 'NOT NULL' : 'NULL'}
      ORDER BY ${xemRac ? 'da_xoa_luc DESC' : 'tao_luc DESC'}`
  ).bind(phien.lopId).all();
  return json({ ok: true, danhSach: results });
// Cho phép cả tài khoản chỉ có quyền "thong-bao" xem danh sách này — cần để dùng bộ chọn
// "đính kèm từ thư viện" trong hộp thoại soạn Thông báo (chỉ ĐỌC, không thêm/xoá được).
}, { canGiaoVien: true, quyenCan: ['video', 'thong-bao'] });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const kieu = (request.headers.get('Content-Type') || '').split(';')[0].trim();
  const duLieu = await request.arrayBuffer();
  const ten = chuoi(new URL(request.url).searchParams.get('ten'), 200) || 'Video chưa đặt tên';

  const { loi: thongBaoLoi, dong } = await themTepVaoThuVien(env, 'video', duLieu, kieu, ten, phien.lopId, phien);
  if (thongBaoLoi) return loi(thongBaoLoi);
  return json({ ok: true, ...dong });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');

  if (than.khoiPhuc) {
    if (phien.role !== 'teacher') return loi('Chỉ giáo viên chủ nhiệm khôi phục được.', 403);
    const loiKp = await khoiPhucKhoiThuVien(env, 'video', id, phien.lopId, phien);
    if (loiKp) return loiKp;
    return json({ ok: true });
  }
  if (than.ten === undefined) return loi('Không có gì để sửa.');

  const dong = await env.DB.prepare('SELECT id FROM video WHERE id = ?1 AND lop_id = ?2 AND da_xoa_luc IS NULL').bind(id, phien.lopId).first();
  if (!dong) return loi('Không tìm thấy video này.', 404);

  await env.DB.prepare('UPDATE video SET ten = ?1 WHERE id = ?2').bind(chuoi(than.ten, 200), id).run();
  return json({ ok: true });
}, { canGiaoVien: true, quyenCan: 'video' });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const q = new URL(request.url).searchParams;
  const laGiaoVien = phien.role === 'teacher';
  const { lyDo } = await docThan(request);

  if (q.get('vinhVien') === '1') {
    if (!laGiaoVien) return loi('Chỉ giáo viên chủ nhiệm xoá vĩnh viễn được.', 403);
    const id = Number(q.get('id'));
    if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');
    const loiXoa = await xoaVinhVienKhoiThuVien(env, 'video', id, phien.lopId, phien);
    if (loiXoa) return loiXoa;
    return json({ ok: true });
  }

  if (q.get('tatCa') === '1' || q.get('ids')) {
    if (!laGiaoVien) return loi('Tài khoản được cấp quyền chỉ xoá được từng video một. Nhờ giáo viên chủ nhiệm nếu cần xoá nhiều video cùng lúc.', 403);
    let ids;
    if (q.get('tatCa') === '1') {
      const { results } = await env.DB.prepare('SELECT id FROM video WHERE lop_id = ?1 AND da_xoa_luc IS NULL').bind(phien.lopId).all();
      ids = results.map((r) => r.id);
    } else {
      ids = [...new Set(q.get('ids').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    }
    const { daXoa } = await xoaNhieuKhoiThuVien(env, 'video', ids, phien.lopId, phien, chuoi(lyDo, 300));
    return json({ ok: true, daXoa });
  }

  const id = Number(q.get('id'));
  if (!Number.isInteger(id) || id <= 0) return loi('Thiếu mã video.');

  const loiXoa = await xoaKhoiThuVien(env, 'video', id, phien.lopId, phien, chuoi(lyDo, 300));
  if (loiXoa) return loiXoa;
  return json({ ok: true });
// choPhepXoaPhu: tài khoản được cấp quyền "video" xoá được (chuyển vào thùng rác) — an toàn vì
// giáo viên luôn khôi phục lại được nếu xoá nhầm hoặc tài khoản bị chiếm quyền lạm dụng.
}, { canGiaoVien: true, quyenCan: 'video', choPhepXoaPhu: true });
