// Quản lý tài khoản Campus; không trộn học sinh trong sổ lớp.
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';
import { ghiNhatKyQuanTri } from '../../_lib/audit.js';

const COT = `tc.id, tc.ten_dang_nhap AS tenDangNhap, tc.ten_hien_thi AS ten,
  tc.vai_tro AS vaiTro, tc.teacher_pending AS teacherPending,
  tc.dang_hoat_dong AS dangHoatDong, tc.la_admin_truong AS laAdminTruong,
  tc.lop_id AS lopId, l.ten AS lopTen, tc.tao_luc AS taoLuc, tc.cap_nhat_luc AS capNhatLuc`;

function docId(value) {
  const m = /^tk:([1-9]\d*)$/.exec(String(value || ''));
  return m && Number.isSafeInteger(Number(m[1])) ? Number(m[1]) : null;
}
function phamViTaiKhoan(pham, lopIdLoc = null) {
  // giao_vien_lop là bảng phân quyền lớp. Chỉ School Admin đọc toàn trường.
  if (pham.isSchoolAdmin) return lopIdLoc
    ? { sql: 'tc.lop_id = ?', params: [lopIdLoc] } : { sql: '1 = 1', params: [] };
  const ids = lopIdLoc ? pham.lopIds.filter(id => id === lopIdLoc) : pham.lopIds;
  const sql = ids.length ? `tc.lop_id IN (${ids.map(() => '?').join(',')})` : '0 = 1';
  return { sql: lopIdLoc ? sql : `(${sql} OR (tc.teacher_pending = 1 AND tc.vai_tro != 'teacher'))`, params: ids };
}
function hienThi(tk, pham, phien) {
  const admin = Boolean(tk.laAdminTruong || ['admin', 'school_admin'].includes(tk.vaiTro));
  const trongLop = tk.lopId && pham.lopIds?.includes(tk.lopId);
  const chinhMinh = Number(phien.accountId) === tk.id;
  return {
    id: `tk:${tk.id}`, ten: tk.ten, tenDangNhap: tk.tenDangNhap,
    loai: admin ? 'quan-tri-vien' : (tk.vaiTro === 'teacher' ? 'giao-vien' : (tk.vaiTro === 'external' ? 'khach' : 'hoc-sinh')),
    vaiTro: tk.vaiTro, laAdminTruong: admin, teacherPending: tk.teacherPending === 1,
    trangThai: tk.dangHoatDong === 0 ? 'bi-khoa' : (tk.teacherPending === 1 ? 'cho-xac-minh' : 'binh-thuong'),
    lopId: tk.lopId, lopTen: tk.lopTen, taoLuc: tk.taoLuc, capNhatLuc: tk.capNhatLuc,
    coTheKhoa: !admin && !chinhMinh && Boolean(pham.isSchoolAdmin || (trongLop && tk.vaiTro !== 'teacher')),
    coTheDuyet: !admin && !chinhMinh && tk.teacherPending === 1 && tk.dangHoatDong === 1 && tk.vaiTro !== 'teacher',
  };
}
export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  if (phien.teacherPending) return loi('Bạn chưa có quyền quản trị.', 403);
  const url = new URL(request.url);
  const pham = await layPhamViQuanTri(env, phien);
  const lopRaw = url.searchParams.get('lopId');
  if (lopRaw && !/^[1-9]\d*$/.test(lopRaw)) return loi('Lớp không hợp lệ.', 400);
  const dk = phamViTaiKhoan(pham, lopRaw ? Number(lopRaw) : null);
  const idRaw = url.searchParams.get('id');
  if (idRaw !== null) {
    const id = docId(idRaw);
    if (!id) return loi('Mã tài khoản không hợp lệ.', 400);
    const tk = await env.DB.prepare(`SELECT ${COT} FROM tai_khoan_campus tc
      LEFT JOIN lop l ON l.id = tc.lop_id WHERE (${dk.sql}) AND tc.id = ?`)
      .bind(...dk.params, id).first();
    return tk ? json({ ok: true, chiTiet: hienThi(tk, pham, phien) }) : loi('Không tìm thấy tài khoản.', 404);
  }
  const loai = url.searchParams.get('loai') || 'tat-ca';
  const q = (url.searchParams.get('q') || '').trim().toLocaleLowerCase('vi');
  const { results } = await env.DB.prepare(`SELECT ${COT} FROM tai_khoan_campus tc
    LEFT JOIN lop l ON l.id = tc.lop_id WHERE (${dk.sql})`).bind(...dk.params).all();
  const tatCa = (results || []).map(tk => hienThi(tk, pham, phien));
  const danhSach = tatCa.filter(tk => (loai === 'tat-ca' || tk.loai === loai || tk.trangThai === loai)
    && (!q || `${tk.ten} ${tk.tenDangNhap}`.toLocaleLowerCase('vi').includes(q)))
    .sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
  return json({ ok: true, danhSach, tong: danhSach.length, tongTaiKhoan: tatCa.length, isSchoolAdmin: pham.isSchoolAdmin });
}, { canGiaoVien: true });

export async function doiTrangThaiTaiKhoan({ env, phien, waitUntil }, id, hanhDong) {
  if (phien.teacherPending) return loi('Bạn chưa có quyền quản trị.', 403);
  if (!id || !['khoa', 'mo_khoa', 'duyet', 'tu_choi'].includes(hanhDong)) return loi('Thao tác không hợp lệ.', 400);
  const pham = await layPhamViQuanTri(env, phien);
  const dk = phamViTaiKhoan(pham);
  const tk = await env.DB.prepare(`SELECT ${COT} FROM tai_khoan_campus tc
    LEFT JOIN lop l ON l.id = tc.lop_id WHERE (${dk.sql}) AND tc.id = ?`).bind(...dk.params, id).first();
  if (!tk) return loi('Không tìm thấy tài khoản.', 404);
  const nd = hienThi(tk, pham, phien);
  const duyet = hanhDong === 'duyet' || hanhDong === 'tu_choi';
  if (duyet ? !nd.coTheDuyet : !nd.coTheKhoa) return loi('Bạn không thể thực hiện thao tác này với tài khoản đã chọn.', 403);
  const setSql = duyet ? 'vai_tro = ?, teacher_pending = 0, duyet_boi_khoa = ?, duyet_luc = CURRENT_TIMESTAMP' : 'dang_hoat_dong = ?';
  const values = duyet
    ? [hanhDong === 'duyet' ? 'teacher' : 'student', phien.accountId ? `tk:${phien.accountId}` : `gv:${phien.lopId}`]
    : [hanhDong === 'khoa' ? 0 : 1];
  // Kiểm tra lại phạm vi và trạng thái trong UPDATE, tránh ghi đè một lượt duyệt/khóa khác.
  const res = await env.DB.prepare(`UPDATE tai_khoan_campus AS tc SET ${setSql}, cap_nhat_luc = CURRENT_TIMESTAMP
    WHERE (${dk.sql}) AND tc.id = ? AND tc.lop_id IS ? AND tc.la_admin_truong = 0
      AND tc.vai_tro = ? AND tc.teacher_pending = ? AND tc.dang_hoat_dong = ?`)
    .bind(...values, ...dk.params, id, tk.lopId, tk.vaiTro, tk.teacherPending, tk.dangHoatDong).run();
  if (!res.meta?.changes) return loi('Tài khoản vừa thay đổi. Hãy tải lại danh sách.', 409);
  ghiNhatKyQuanTri(env, waitUntil, { tacNhanId: phien.accountId, tacNhanTen: phien.ten, hanhDong,
    doiTuongLoai: 'tai_khoan', doiTuongId: String(id), chiTiet: `${hanhDong}: ${tk.tenDangNhap}`, lopId: tk.lopId || phien.lopId || null });
  return json({ ok: true });
}
export const onRequestPost = bocXuLy(async context => {
  const than = await docThan(context.request);
  return doiTrangThaiTaiKhoan(context, docId(than.id), than.hanhDong);
}, { canGiaoVien: true });