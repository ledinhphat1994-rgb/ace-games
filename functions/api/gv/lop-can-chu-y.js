// GET /api/gv/lop-can-chu-y — danh sách lớp trong phạm vi quản trị của tài khoản đang đăng nhập,
// kèm cờ "chưa điểm danh hôm nay" (tín hiệu thật, dùng cho khối "Lớp cần chú ý" ở Tổng quan).
import { bocXuLy, json, ngayVNHomNay } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const pham = await layPhamViQuanTri(env, phien);
  const homNay = ngayVNHomNay();
  const lopIdLoc = parseInt(new URL(request.url).searchParams.get('lopId'), 10) || null;

  let dsLop;
  if (pham.isSchoolAdmin) {
    if (lopIdLoc) {
      const { results } = await env.DB.prepare(
        'SELECT id, ten FROM lop WHERE dang_hoat_dong = 1 AND id = ?1 ORDER BY id'
      ).bind(lopIdLoc).all();
      dsLop = results || [];
    } else {
      const { results } = await env.DB.prepare(
        'SELECT id, ten FROM lop WHERE dang_hoat_dong = 1 ORDER BY id'
      ).all();
      dsLop = results || [];
    }
  } else {
    // Nếu có lọc ?lopId=, chỉ chấp nhận khi nằm trong đúng tập lớp tài khoản được phép —
    // không tin lopId từ client, luôn giao với pham.lopIds thật.
    const lopIdsChoDung = lopIdLoc ? pham.lopIds.filter((id) => id === lopIdLoc) : pham.lopIds;
    if (!lopIdsChoDung || lopIdsChoDung.length === 0) return json({ ok: true, danhSach: [] });
    const { results } = await env.DB.prepare(
      `SELECT id, ten FROM lop WHERE dang_hoat_dong = 1 AND id IN (${lopIdsChoDung.map(() => '?').join(',')}) ORDER BY id`
    ).bind(...lopIdsChoDung).all();
    dsLop = results || [];
  }

  if (dsLop.length === 0) return json({ ok: true, danhSach: [] });

  const { results: dsDaDiemDanh } = await env.DB.prepare(
    `SELECT DISTINCT lop_id FROM diem_danh WHERE ngay = ?1 AND lop_id IN (${dsLop.map(() => '?').join(',')})`
  ).bind(homNay, ...dsLop.map((l) => l.id)).all();
  const daDiemDanhSet = new Set((dsDaDiemDanh || []).map((r) => r.lop_id));

  return json({
    ok: true,
    danhSach: dsLop.map((l) => ({
      lopId: l.id,
      ten: l.ten,
      chuaDiemDanhHomNay: !daDiemDanhSet.has(l.id),
    })),
  });
}, { canGiaoVien: true });
