// Mã tra cứu cá nhân — mỗi học sinh một mã riêng để xem kết quả của chính mình.
//   GET  /api/gv/ma-ca-nhan          -> danh sách mã (để in phát cho từng em)
//   POST /api/gv/ma-ca-nhan { hocSinhId }                 -> cấp lại mã NGẪU NHIÊN cho một em
//   POST /api/gv/ma-ca-nhan { hocSinhId, maTuyChinh }     -> đặt ĐÚNG mã này cho một em (tuỳ ý, dễ nhớ)
//   POST /api/gv/ma-ca-nhan { tatCa: true }               -> cấp mã ngẫu nhiên cho mọi em chưa có
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';

// Bỏ các ký tự dễ đọc nhầm: 0/O, 1/I/L, 5/S, 2/Z.
const CHU_CAI = 'ABCDEFGHJKMNPQRTUVWXY346789';

function sinhMa(doDai = 6) {
  const byte = new Uint8Array(doDai);
  crypto.getRandomValues(byte);
  return [...byte].map((b) => CHU_CAI[b % CHU_CAI.length]).join('');
}

function chuanHoaMaTuyChinh(v) {
  return String(v || '').trim().toUpperCase().replace(/\s+/g, '');
}

function maHopLe(ma) {
  return /^[A-Z0-9\-]{3,32}$/.test(ma);
}

/** Kiểm tra một mã có đang trùng với BẤT KỲ mã nào khác trong toàn hệ thống không
 *  (mã lớp, mã giáo viên, mã tài khoản đặc biệt, mã cá nhân của em khác). */
async function bangTrungMaKhac(db, ma, boQuaHocSinhId) {
  const [dangNhap, phu, caNhan] = await Promise.all([
    db.prepare('SELECT 1 FROM ma_dang_nhap WHERE ma = ?1').bind(ma).first(),
    db.prepare('SELECT 1 FROM tai_khoan_phu WHERE ma = ?1').bind(ma).first(),
    db.prepare('SELECT hoc_sinh_id FROM ma_ca_nhan WHERE ma = ?1').bind(ma).first(),
  ]);
  if (dangNhap || phu) return true;
  if (caNhan && caNhan.hoc_sinh_id !== boQuaHocSinhId) return true;
  return false;
}

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT h.id, h.ho_ten AS hoTen, m.ma
       FROM hoc_sinh h LEFT JOIN ma_ca_nhan m ON m.hoc_sinh_id = h.id
      WHERE h.dang_hoc = 1 ORDER BY h.id`
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { hocSinhId, tatCa, maTuyChinh } = await docThan(request);
  const db = env.DB;

  // Đặt một mã CỤ THỂ (tự chọn) cho đúng một em — không phải sinh ngẫu nhiên.
  if (maTuyChinh) {
    const id = Number(hocSinhId);
    if (!Number.isInteger(id) || id <= 0) return loi('Mã học sinh không hợp lệ.');

    const ma = chuanHoaMaTuyChinh(maTuyChinh);
    if (!maHopLe(ma)) return loi('Mã chỉ gồm chữ in hoa, số, dấu gạch ngang, dài 3–32 ký tự.');
    if (await bangTrungMaKhac(db, ma, id)) return loi('Mã này đã có người khác dùng rồi, chọn mã khác.');

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
