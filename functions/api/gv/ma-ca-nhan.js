// Mã tra cứu cá nhân — mỗi học sinh một mã riêng để xem kết quả của chính mình, và (nếu
// được cấp quyền) đăng nhập vào khu quản lý với đúng quyền đó.
//   GET    /api/gv/ma-ca-nhan          -> danh sách mã (để in phát cho từng em)
//   POST   /api/gv/ma-ca-nhan { hocSinhId }                 -> cấp lại mã NGẪU NHIÊN cho một em
//   POST   /api/gv/ma-ca-nhan { hocSinhId, maTuyChinh }     -> đặt ĐÚNG mã này cho một em (tuỳ ý, dễ nhớ)
//   POST   /api/gv/ma-ca-nhan { tatCa: true }               -> cấp mã ngẫu nhiên cho mọi em chưa có
//   PATCH  /api/gv/ma-ca-nhan { hocSinhId, anMuc: [...] }        -> đặt các mục ẨN riêng cho mã của em đó
//   PATCH  /api/gv/ma-ca-nhan { hocSinhId, quyen: [...] }        -> đặt quyền QUẢN LÝ (soạn thông báo, thủ quỹ...)
//   PATCH  /api/gv/ma-ca-nhan { hocSinhId, datLaiThietBi: true } -> gỡ ràng buộc thiết bị, cho đăng nhập máy mới
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';
import { sinhMa, chuanHoaMaTuyChinh, maHopLe, maDaTonTai, chuanHoaAnMuc } from '../../_lib/ma.js';
import { CAC_QUYEN } from './tai-khoan-phu.js';

const MA_QUYEN = new Set(CAC_QUYEN.map((q) => q[0]));
function locQuyen(mang) {
  if (!Array.isArray(mang)) return '';
  return [...new Set(mang.filter((q) => MA_QUYEN.has(q)))].join(',');
}

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, m.ma, m.an_muc AS anMuc, m.quyen, m.thiet_bi AS thietBi
       FROM hoc_sinh h LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
      WHERE h.dang_hoc = 1 ORDER BY h.id`
  ).all();
  return json({
    ok: true,
    danhSach: results.map((h) => ({
      ...h,
      anMuc: h.anMuc ? h.anMuc.split(',') : [],
      quyen: h.quyen ? h.quyen.split(',') : [],
      coThietBi: Boolean(h.thietBi),
    })),
  });
}, { canGiaoVien: true });

export const onRequestPatch = bocXuLy(async ({ request, env }) => {
  const than = await docThan(request);
  const id = Number(than.hocSinhId);
  if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');

  const co = await env.DB.prepare('SELECT hoc_sinh_id FROM ma_ca_nhan WHERE hoc_sinh_id = ?1').bind(id).first();
  if (!co) return loi('Em này chưa có mã cá nhân — cấp mã trước rồi mới đặt quyền.');

  if (than.datLaiThietBi) {
    await env.DB.prepare('UPDATE ma_ca_nhan SET thiet_bi = NULL WHERE hoc_sinh_id = ?1').bind(id).run();
    return json({ ok: true });
  }

  const dat = [];
  const thamSo = [];
  const them = (cot, giaTri) => { thamSo.push(giaTri); dat.push(`${cot} = ?${thamSo.length}`); };
  if (than.anMuc !== undefined) them('an_muc', chuanHoaAnMuc(than.anMuc));
  if (than.quyen !== undefined) them('quyen', locQuyen(than.quyen));
  if (!dat.length) return loi('Không có gì để cập nhật.');

  thamSo.push(id);
  await env.DB.prepare(`UPDATE ma_ca_nhan SET ${dat.join(', ')} WHERE hoc_sinh_id = ?${thamSo.length}`)
    .bind(...thamSo).run();
  return json({ ok: true });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { hocSinhId, tatCa, maTuyChinh } = await docThan(request);
  const db = env.DB;

  // Đặt một mã CỤ THỂ (tự chọn) cho đúng một em — không phải sinh ngẫu nhiên.
  if (maTuyChinh) {
    const id = Number(hocSinhId);
    if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');

    const ma = chuanHoaMaTuyChinh(maTuyChinh);
    if (!maHopLe(ma)) return loi('Mã dài 3–32 ký tự, không chứa khoảng trắng (chấp nhận chữ hoa, chữ thường, số, ký tự đặc biệt).');
    if (await maDaTonTai(db, ma, { hocSinhId: id })) return loi('Mã này đã có người khác dùng rồi, chọn mã khác.');

    await db.prepare(
      `INSERT INTO ma_ca_nhan (hoc_sinh_id, ma) VALUES (?1, ?2)
       ON CONFLICT(hoc_sinh_id) DO UPDATE SET ma = excluded.ma, tao_luc = datetime('now')`
    ).bind(id, ma).run();

    return json({ ok: true, daCap: 1, ketQua: [{ hocSinhId: id, ma }] });
  }

  let canCap = [];
  if (tatCa) {
    const { results } = await db.prepare(
      `SELECT h.id FROM hoc_sinh h LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
        WHERE h.dang_hoc = 1 AND m.ma IS NULL`
    ).all();
    canCap = results.map((r) => r.id);
  } else {
    const id = Number(hocSinhId);
    if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');
    canCap = [id];
  }

  if (!canCap.length) return json({ ok: true, daCap: 0, ghiChu: 'Mọi học sinh đều đã có mã.' });

  // Lấy trước các mã đang dùng để tránh trùng.
  const { results: dangDung } = await db.prepare('SELECT ma FROM ma_ca_nhan').all();
  const daCo = new Set(dangDung.map((r) => r.ma));

  const cauLenh = [];
  const ketQua = [];
  for (const id of canCap) {
    let ma;
    do { ma = sinhMa(); } while (daCo.has(ma));
    daCo.add(ma);
    ketQua.push({ hocSinhId: id, ma });
    cauLenh.push(db.prepare(
      `INSERT INTO ma_ca_nhan (hoc_sinh_id, ma) VALUES (?1, ?2)
       ON CONFLICT(hoc_sinh_id) DO UPDATE SET ma = excluded.ma, tao_luc = datetime('now')`
    ).bind(id, ma));
  }

  await db.batch(cauLenh);
  return json({ ok: true, daCap: ketQua.length, ketQua });
}, { canGiaoVien: true });
