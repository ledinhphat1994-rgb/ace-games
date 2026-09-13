// Quản trị Phòng Campus (Admin IA v1 — Phase 3): danh sách phòng đang mở trong phạm vi quản trị
// + đóng phòng có ghi nhật ký. Tách RIÊNG khỏi functions/api/phong.js (endpoint phòng tự thân,
// học sinh/giáo viên dùng khi vào phòng) — cùng đọc bảng phong nhưng khác mục đích, tách file để
// không đụng vào phần đang phát triển song song ở đó.
//   GET  /api/gv/phong-quan-tri            -> phòng đang mở trong phạm vi quản trị (mới nhất trước)
//   GET  /api/gv/phong-quan-tri?loai=video -> lọc thêm theo loại phòng (chat|video|nhac)
//   GET  /api/gv/phong-quan-tri?id=5       -> chi tiết 1 phòng kèm danh sách thành viên đang trong phòng
//   POST /api/gv/phong-quan-tri { phongId } -> đóng phòng (ghi nhật ký quản trị)
import { bocXuLy, json, loi, docThan } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';
import { ghiNhatKyQuanTri } from '../../_lib/audit.js';
import { NHIP_HIEU_LUC } from '../../_lib/rooms.js';

const CAC_LOAI_PHONG = ['chat', 'video', 'nhac'];
// Đếm/danh sách thành viên trong view quản trị phải dùng ĐÚNG lease thành viên
// (NHIP_HIEU_LUC — cùng cửa sổ với capacity/admission), không phải cửa sổ presence 90s.

// Phòng toàn trường thì ai có quyền vào Khu quản trị cũng xem/đóng được (giống mức mở hiện có ở
// functions/api/phong.js — bất kỳ giáo viên nào cũng đóng được mọi phòng); phòng riêng 1 lớp thì
// chỉ School Admin hoặc GVCN phụ trách đúng lớp đó.
function coQuyenPhong(pham, p) {
  return pham.isSchoolAdmin || p.phamVi === 'truong' || (pham.lopIds && pham.lopIds.includes(p.lopId));
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const pham = await layPhamViQuanTri(env, phien);
  const url = new URL(request.url);
  const phongId = Number(url.searchParams.get('id'));

  if (Number.isInteger(phongId) && phongId > 0) {
    const p = await env.DB.prepare(
      `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId, l.ten AS lopTen,
              p.chu_phong_khoa AS chuPhongKhoa, p.chu_phong_ten AS chuPhongTen, p.access_mode AS accessMode,
              p.suc_chua AS sucChua, p.trang_thai AS trangThai, p.tao_luc AS taoLuc
         FROM phong p LEFT JOIN lop l ON l.id = p.lop_id WHERE p.id = ?1`
    ).bind(phongId).first();
    if (!p) return loi('Không tìm thấy phòng.', 404);
    if (!coQuyenPhong(pham, p)) return loi('Không có quyền xem phòng này.', 403);

    const { results: thanhVien } = await env.DB.prepare(
      `SELECT ten, vai_tro AS vaiTro, lop_id AS lopId, (khoa = ?2) AS laChuPhong
         FROM phong_thanh_vien WHERE phong_id = ?1 AND datetime(hoat_dong_luc) > datetime('now', ?3)
         ORDER BY vao_luc ASC LIMIT 60`
    ).bind(phongId, p.chuPhongKhoa, NHIP_HIEU_LUC).all();

    return json({ ok: true, phong: p, thanhVien: thanhVien || [] });
  }

  const loaiYeuCau = url.searchParams.get('loai');
  const loai = CAC_LOAI_PHONG.includes(loaiYeuCau) ? loaiYeuCau : null;

  const dieuKien = [`p.trang_thai = 'mo'`];
  const thamSo = [];
  if (loai) {
    dieuKien.push(`p.loai = ?${thamSo.length + 1}`);
    thamSo.push(loai);
  }
  if (!pham.isSchoolAdmin) {
    const lopIds = pham.lopIds && pham.lopIds.length ? pham.lopIds : [-1];
    const cho = lopIds.map((_, i) => `?${thamSo.length + i + 1}`).join(',');
    dieuKien.push(`(p.pham_vi = 'truong' OR p.lop_id IN (${cho}))`);
    thamSo.push(...lopIds);
  }
  thamSo.push(NHIP_HIEU_LUC);

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.loai, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId, l.ten AS lopTen,
            p.chu_phong_ten AS chuPhongTen, p.access_mode AS accessMode, p.suc_chua AS sucChua, p.tao_luc AS taoLuc,
            (SELECT COUNT(*) FROM phong_thanh_vien v
              WHERE v.phong_id = p.id AND datetime(v.hoat_dong_luc) > datetime('now', ?${thamSo.length})) AS soNguoi
       FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
      WHERE ${dieuKien.join(' AND ')}
      ORDER BY p.tao_luc DESC
      LIMIT 100`
  ).bind(...thamSo).all();

  return json({ ok: true, danhSach: results || [] });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const than = await docThan(request);
  const phongId = Number(than.phongId);
  if (!Number.isInteger(phongId) || phongId <= 0) return loi('Thiếu mã phòng.', 400);

  const pham = await layPhamViQuanTri(env, phien);
  const pRaw = await env.DB.prepare(
    'SELECT id, ten, pham_vi AS phamVi, lop_id AS lopId, trang_thai AS trangThai FROM phong WHERE id = ?1'
  ).bind(phongId).first();
  if (!pRaw) return loi('Không tìm thấy phòng.', 404);
  if (pRaw.trangThai === 'dong') return loi('Phòng này đã đóng.', 400);
  if (!coQuyenPhong(pham, pRaw)) return loi('Không có quyền quản lý phòng này.', 403);

  await env.DB.batch([
    env.DB.prepare(`UPDATE phong SET trang_thai = 'dong', cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?1`).bind(phongId),
    env.DB.prepare('DELETE FROM phong_thanh_vien WHERE phong_id = ?1').bind(phongId),
  ]);

  ghiNhatKyQuanTri(env, waitUntil, {
    tacNhanId: phien.accountId, tacNhanTen: phien.ten,
    hanhDong: 'dong_phong', doiTuongLoai: 'phong', doiTuongId: String(phongId),
    chiTiet: `Đóng phòng "${pRaw.ten}"`, lopId: phien.lopId,
  });

  return json({ ok: true });
}, { canGiaoVien: true });
