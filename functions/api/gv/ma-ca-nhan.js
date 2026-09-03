// Mã tra cứu cá nhân — mỗi học sinh một mã riêng để xem kết quả của chính mình.
//   GET  /api/gv/ma-ca-nhan          -> danh sách mã (để in phát cho từng em)
//   POST /api/gv/ma-ca-nhan { hocSinhId }        -> cấp lại mã cho một em
//   POST /api/gv/ma-ca-nhan { tatCa: true }      -> cấp mã cho mọi em chưa có
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';

// Bỏ các ký tự dễ đọc nhầm: 0/O, 1/I/L, 5/S, 2/Z.
const CHU_CAI = 'ABCDEFGHJKMNPQRTUVWXY346789';

function sinhMa(doDai = 6) {
  const byte = new Uint8Array(doDai);
  crypto.getRandomValues(byte);
  return [...byte].map((b) => CHU_CAI[b % CHU_CAI.length]).join('');
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
  const { hocSinhId, tatCa } = await docThan(request);
  const db = env.DB;

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
