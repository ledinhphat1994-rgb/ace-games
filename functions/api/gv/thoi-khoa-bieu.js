// Thời khoá biểu — chỉ giáo viên chủ nhiệm sửa (ảnh hưởng cả lớp).
//   GET  /api/gv/thoi-khoa-bieu
//   POST /api/gv/thoi-khoa-bieu   { o: [{thu, tiet, mon}] }   -- thay toàn bộ bảng
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';

export const onRequestGet = bocXuLy(async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT thu, tiet, mon, phong AS phong FROM thoi_khoa_bieu ORDER BY tiet, thu'
  ).all();
  return json({ ok: true, danhSach: results });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env }) => {
  const { o } = await docThan(request);
  if (!Array.isArray(o)) return loi('Dữ liệu không hợp lệ.');
  if (o.length > 60) return loi('Quá nhiều ô trong một lần gửi.');

  const hopLe = [];
  for (const x of o) {
    const thu = Number(x.thu);
    const tiet = Number(x.tiet);
    if (!Number.isInteger(thu) || thu < 2 || thu > 7) return loi('Thứ không hợp lệ.');
    if (!Number.isInteger(tiet) || tiet < 1 || tiet > 10) return loi('Tiết không hợp lệ.');
    const mon = String(x.mon || '').trim().slice(0, 60);
    if (mon) hopLe.push({ thu, tiet, mon });
  }

  await env.DB.batch([
    env.DB.prepare('DELETE FROM thoi_khoa_bieu'),
    ...hopLe.map((x) =>
      env.DB.prepare('INSERT INTO thoi_khoa_bieu (thu, tiet, mon) VALUES (?1, ?2, ?3)').bind(x.thu, x.tiet, x.mon)
    ),
  ]);

  return json({ ok: true, daLuu: hopLe.length });
}, { canGiaoVien: true });
