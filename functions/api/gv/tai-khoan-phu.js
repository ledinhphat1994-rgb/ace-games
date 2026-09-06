// Tài khoản đặc biệt (lớp trưởng, thủ quỹ...) — CHỈ giáo viên chủ nhiệm quản lý được.
//   GET    /api/gv/tai-khoan-phu
//   POST   /api/gv/tai-khoan-phu   { ten, vaiTro, quyen:[...], hocSinhId, ma? }
//        Không truyền "ma" -> tự sinh ngẫu nhiên. Có truyền -> dùng đúng mã đó (tuỳ ý, dễ nhớ).
//   PATCH  /api/gv/tai-khoan-phu   { id, ten, vaiTro, quyen, dangHoatDong, capLaiMa } — capLaiMa: true = mã ngẫu nhiên mới
//   PATCH  /api/gv/tai-khoan-phu   { id, maTuyChinh } — đặt ĐÚNG mã này (tuỳ ý)
//   DELETE /api/gv/tai-khoan-phu?id=
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { sinhMa, chuanHoaMaTuyChinh, maHopLe, maDaTonTai } from '../../_lib/ma.js';

// Những mục có thể trao quyền. Mỗi mục ứng với đúng một "quyenCan" đang dùng ở các API khác.
export const CAC_QUYEN = [
  ['quy', 'Thủ quỹ — ghi thu, ghi chi, tạo khoản thu'],
  ['thong-bao', 'Thông báo — soạn và đăng thông báo lên trang lớp'],
  ['nhat-ky', 'Nhật ký lớp — ghi khen thưởng, nhắc nhở, vi phạm'],
  ['diem-danh', 'Điểm danh — điểm danh hằng ngày'],
  ['hinh-anh', 'Thư viện Ảnh — đăng ảnh hoạt động của lớp'],
  ['am-thanh', 'Thư viện Âm thanh — tải bài hát, đặt nhạc nền trang chủ'],
  ['video', 'Thư viện Video — tải video lên'],
];
const MA_QUYEN = new Set(CAC_QUYEN.map((q) => q[0]));

function locQuyen(mang) {
  if (!Array.isArray(mang)) return '';
  return [...new Set(mang.filter((q) => MA_QUYEN.has(q)))].join(',');
}

export const onRequestGet = bocXuLy(async ({ env, phien }) => {
  const { results } = await env.DB.prepare(
    `SELECT id, ten, vai_tro AS vaiTro, ma, quyen, hoc_sinh_id AS hocSinhId, dang_hoat_dong AS dangHoatDong, tao_luc AS taoLuc
       FROM tai_khoan_phu WHERE lop_id = ?1 ORDER BY tao_luc DESC`
  ).bind(phien.lopId).all();
  return json({
    ok: true, cacQuyen: CAC_QUYEN,
    danhSach: results.map((r) => ({ ...r, quyen: (r.quyen || '').split(',').filter(Boolean), dangHoatDong: Boolean(r.dangHoatDong) })),
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const ten = chuoi(than.ten, 100);
  if (!ten) return loi('Chưa nhập tên người được cấp quyền.');

  const quyen = locQuyen(than.quyen);
  if (!quyen) return loi('Chưa chọn quyền nào cho tài khoản này.');

  const hocSinhId = than.hocSinhId ? Number(than.hocSinhId) : null;
  if (hocSinhId !== null && !Number.isInteger(hocSinhId)) return loi('Mã học sinh không hợp lệ.');
  if (hocSinhId !== null) {
    const hs = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE id = ?1 AND lop_id = ?2').bind(hocSinhId, phien.lopId).first();
    if (!hs) return loi('Mã học sinh không hợp lệ.');
  }

  let ma;
  if (than.ma) {
    ma = chuanHoaMaTuyChinh(than.ma);
    if (!maHopLe(ma)) {
      return loi('Mã dài 3–32 ký tự, không chứa khoảng trắng (chấp nhận chữ hoa, chữ thường, số, ký tự đặc biệt).');
    }
    if (await maDaTonTai(env.DB, ma, {})) return loi('Mã này đã có người khác dùng rồi, chọn mã khác.');
  } else {
    do { ma = sinhMa(); } while (await maDaTonTai(env.DB, ma, {}));
  }

  const kq = await env.DB.prepare(
    'INSERT INTO tai_khoan_phu (ten, vai_tro, ma, quyen, hoc_sinh_id, lop_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
  ).bind(ten, chuoi(than.vaiTro, 60), ma, quyen, hocSinhId, phien.lopId).run();

  return json({ ok: true, id: kq.meta.last_row_id, ma });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env, phien }) => {
  const than = await docThan(request);
  const id = Number(than.id);
  if (!Number.isInteger(id)) return loi('Thiếu mã tài khoản.');

  const tk = await env.DB.prepare('SELECT id FROM tai_khoan_phu WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).first();
  if (!tk) return loi('Không tìm thấy tài khoản này.', 404);

  if (than.capLaiMa) {
    let ma;
    do { ma = sinhMa(); } while (await maDaTonTai(env.DB, ma, { taiKhoanPhuId: id }));
    await env.DB.prepare('UPDATE tai_khoan_phu SET ma = ?1 WHERE id = ?2').bind(ma, id).run();
    return json({ ok: true, ma });
  }

  if (than.maTuyChinh) {
    const ma = chuanHoaMaTuyChinh(than.maTuyChinh);
    if (!maHopLe(ma)) {
      return loi('Mã dài 3–32 ký tự, không chứa khoảng trắng (chấp nhận chữ hoa, chữ thường, số, ký tự đặc biệt).');
    }
    if (await maDaTonTai(env.DB, ma, { taiKhoanPhuId: id })) return loi('Mã này đã có người khác dùng rồi, chọn mã khác.');
    await env.DB.prepare('UPDATE tai_khoan_phu SET ma = ?1 WHERE id = ?2').bind(ma, id).run();
    return json({ ok: true, ma });
  }

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };

  if (than.ten !== undefined) {
    const t = chuoi(than.ten, 100);
    if (!t) return loi('Tên không được để trống.');
    them('ten', t);
  }
  if (than.vaiTro !== undefined) them('vai_tro', chuoi(than.vaiTro, 60));
  if (than.quyen !== undefined) {
    const q = locQuyen(than.quyen);
    if (!q) return loi('Phải chọn ít nhất một quyền.');
    them('quyen', q);
  }
  if (than.dangHoatDong !== undefined) them('dang_hoat_dong', than.dangHoatDong ? 1 : 0);

  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE tai_khoan_phu SET ${dat.join(', ')} WHERE id = ?${thamSo.length}`).bind(...thamSo).run();
  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestDelete = bocXuLy(async ({ request, env, phien }) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return loi('Thiếu mã tài khoản.');
  const kq = await env.DB.prepare('DELETE FROM tai_khoan_phu WHERE id = ?1 AND lop_id = ?2').bind(id, phien.lopId).run();
  if (!kq.meta.changes) return loi('Không tìm thấy tài khoản này.', 404);
  return json({ ok: true });
}, { canGiaoVien: true });
