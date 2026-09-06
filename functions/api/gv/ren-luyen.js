// Kết quả rèn luyện từng học kì.
//   POST /api/gv/ren-luyen  { hocKi, ghiNhan:[{hocSinhId, muc, nhanXet}] }
import { bocXuLy, json, loi, docThan, chuoi } from '../../_lib/api.js';
import { CAC_MUC } from '../../_lib/tt22.js';

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const { hocKi, ghiNhan } = await docThan(request);
  const hk = Number(hocKi) === 2 ? 2 : 1;

  if (!Array.isArray(ghiNhan) || !ghiNhan.length) return loi('Không có dữ liệu để lưu.');
  if (ghiNhan.length > 200) return loi('Quá nhiều bản ghi trong một lần gửi.');

  const { results: hsLop } = await env.DB.prepare('SELECT id FROM hoc_sinh WHERE lop_id = ?1').bind(phien.lopId).all();
  const idHopLe = new Set(hsLop.map((h) => h.id));

  const cauLenh = [];
  for (const g of ghiNhan) {
    const id = Number(g.hocSinhId);
    if (!Number.isInteger(id) || id <= 0 || !idHopLe.has(id)) return loi('Mã học sinh không hợp lệ.');

    const muc = chuoi(g.muc, 20);
    if (muc && !CAC_MUC.includes(muc)) return loi(`Mức rèn luyện không hợp lệ: ${muc}`);

    cauLenh.push(env.DB.prepare(
      `INSERT INTO ren_luyen (hoc_sinh_id, hoc_ki, muc, nhan_xet, cap_nhat_luc, lop_id)
       VALUES (?1, ?2, ?3, ?4, datetime('now'), ?5)
       ON CONFLICT(hoc_sinh_id, hoc_ki)
       DO UPDATE SET muc = excluded.muc, nhan_xet = excluded.nhan_xet, cap_nhat_luc = datetime('now')`
    ).bind(id, hk, muc, chuoi(g.nhanXet, 1000), phien.lopId));
  }

  await env.DB.batch(cauLenh);
  return json({ ok: true, daLuu: cauLenh.length });
}, { canGiaoVien: true });
