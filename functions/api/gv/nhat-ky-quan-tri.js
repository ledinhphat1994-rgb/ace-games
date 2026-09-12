// GET /api/gv/nhat-ky-quan-tri?limit=&lopId= — đọc Audit Log của Khu quản trị (nhat_ky_quan_tri).
// School Admin xem được toàn trường (lọc thêm theo lopId nếu truyền); GVCN chỉ xem được đúng
// (các) lớp mình phụ trách, không thấy hành động ở lớp khác.
import { bocXuLy, json } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit'), 10) || 10, 1), 100);
  const lopIdLoc = parseInt(url.searchParams.get('lopId'), 10) || null;

  const pham = await layPhamViQuanTri(env, phien);

  let sql = `SELECT id, tac_nhan_ten AS tacNhanTen, hanh_dong AS hanhDong,
                    doi_tuong_loai AS doiTuongLoai, doi_tuong_id AS doiTuongId,
                    chi_tiet AS chiTiet, lop_id AS lopId, tao_luc AS taoLuc
               FROM nhat_ky_quan_tri`;
  const dieuKien = [];
  const params = [];

  if (!pham.isSchoolAdmin) {
    if (!pham.lopIds || pham.lopIds.length === 0) return json({ ok: true, danhSach: [] });
    dieuKien.push(`lop_id IN (${pham.lopIds.map(() => '?').join(',')})`);
    params.push(...pham.lopIds);
  } else if (lopIdLoc) {
    dieuKien.push('lop_id = ?');
    params.push(lopIdLoc);
  }

  if (dieuKien.length) sql += ' WHERE ' + dieuKien.join(' AND ');
  sql += ' ORDER BY tao_luc DESC LIMIT ?';
  params.push(limit);

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ ok: true, danhSach: results || [] });
}, { canGiaoVien: true });
