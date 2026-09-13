// /api/gv/nguoi-dung — domain "Người dùng" (Admin IA v1, Phase 2): gộp hoc_sinh + tai_khoan_campus
// thành 1 danh sách duy nhất, phân biệt rõ:
//   - 'giao-vien'              : tai_khoan_campus.vai_tro = 'teacher'
//   - 'hoc-sinh'               : tai_khoan_campus khác, có hoc_sinh_id (đã liên kết sổ lớp)
//   - 'tai-khoan-campus'       : tai_khoan_campus không có hoc_sinh_id VÀ không có lop_id (tự do)
//   - 'hoc-sinh-chua-lien-ket' : có trong hoc_sinh nhưng CHƯA từng tạo tài khoản Campus
// GET  ?loai=&q=&lopId=&id=   — id có mặt thì trả chi tiết 1 người (tk:<id> hoặc hs:<id>)
// POST { id, hanhDong: 'khoa' | 'mo_khoa' } — chỉ áp dụng cho tài khoản (tk:), ghi Audit Log.
import { bocXuLy, docThan, json, loi } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';
import { ghiNhatKyQuanTri } from '../../_lib/audit.js';

function dieuKienPhamVi(pham, cotLopId, lopIdLoc) {
  if (pham.isSchoolAdmin) {
    return lopIdLoc ? { sql: `${cotLopId} = ?`, params: [lopIdLoc] } : { sql: '1=1', params: [] };
  }
  const cho = lopIdLoc ? pham.lopIds.filter((id) => id === lopIdLoc) : pham.lopIds;
  if (!cho || cho.length === 0) return { sql: '0=1', params: [] };
  return { sql: `${cotLopId} IN (${cho.map(() => '?').join(',')})`, params: cho };
}

function trangThaiTaiKhoan(tk) {
  if (tk.dangHoatDong === 0) return 'bi-khoa';
  // Tài khoản đang XIN quyền giáo viên vẫn có vai_tro='student' (chỉ đổi thành 'teacher' SAU khi
  // được duyệt — xem functions/api/gv/duyet-giao-vien.js nhánh approve) — không được điều kiện
  // theo vai_tro==='teacher' ở đây, nếu không 'cho-xac-minh' không bao giờ xảy ra được.
  if (tk.teacherPending === 1) return 'cho-xac-minh';
  return 'binh-thuong';
}

// Đang xin quyền giáo viên (chưa duyệt) thì coi là loại 'giao-vien' luôn (đang trong hàng chờ trở
// thành giáo viên), không để lẫn vào 'tai-khoan-campus' tự do — nếu không Người dùng sẽ không có
// cách nào phân biệt "tài khoản tự do thật" với "hồ sơ đang chờ duyệt giáo viên".
function loaiNguoiTuTaiKhoan(tk) {
  if (tk.vaiTro === 'teacher' || tk.teacherPending === 1) return 'giao-vien';
  return tk.hocSinhId ? 'hoc-sinh' : 'tai-khoan-campus';
}

async function layChiTiet(env, phien, id) {
  const [loaiId, raw] = String(id).split(':');
  const soId = parseInt(raw, 10);
  if (!soId) return loi('id không hợp lệ.', 400);

  if (loaiId === 'hs') {
    const hs = await env.DB.prepare(
      `SELECT hs.id, hs.ho_ten AS hoTen, hs.gioi_tinh AS gioiTinh, hs.so_thu_tu AS soThuTu,
              hs.to_so AS toSo, hs.chuc_vu AS chucVu, hs.dang_hoc AS dangHoc,
              hs.lop_id AS lopId, l.ten AS lopTen
         FROM hoc_sinh hs LEFT JOIN lop l ON l.id = hs.lop_id
        WHERE hs.id = ?1`
    ).bind(soId).first();
    if (!hs) return loi('Không tìm thấy học sinh.', 404);
    return json({
      ok: true,
      chiTiet: {
        id: `hs:${hs.id}`, loai: 'hoc-sinh-chua-lien-ket', ten: hs.hoTen,
        trangThai: hs.dangHoc === 0 ? 'da-nghi-hoc' : 'chua-dang-nhap',
        lopId: hs.lopId, lopTen: hs.lopTen,
        taiKhoan: null,
        thongTin: { 'Số thứ tự': hs.soThuTu ?? '—', 'Tổ': hs.toSo ?? '—', 'Chức vụ': hs.chucVu || 'Học sinh', 'Giới tính': hs.gioiTinh || '—' },
        hoatDongGanDay: [],
      },
    });
  }

  if (loaiId === 'tk') {
    const tk = await env.DB.prepare(
      `SELECT tc.id, tc.ten_dang_nhap AS tenDangNhap, tc.ten_hien_thi AS tenHienThi, tc.vai_tro AS vaiTro,
              tc.teacher_pending AS teacherPending, tc.dang_hoat_dong AS dangHoatDong, tc.hoc_sinh_id AS hocSinhId,
              tc.lop_id AS lopId, tc.la_admin_truong AS laAdminTruong, tc.tao_luc AS taoLuc, tc.cap_nhat_luc AS capNhatLuc,
              tc.tieu_de_ho_so AS tieuDeHoSo, l.ten AS lopTen
         FROM tai_khoan_campus tc LEFT JOIN lop l ON l.id = tc.lop_id
        WHERE tc.id = ?1`
    ).bind(soId).first();
    if (!tk) return loi('Không tìm thấy tài khoản.', 404);

    // Phạm vi: GVCN không phải School Admin chỉ xem được chi tiết trong đúng lớp mình phụ trách.
    // Hồ sơ đang xin quyền giáo viên (teacher_pending=1) thì MỌI giáo viên đã xác thực đều xem/
    // duyệt được (giống hệt functions/api/gv/duyet-giao-vien.js — không giới hạn School Admin),
    // vì tài khoản đó thường chưa có lop_id nên không match được phạm vi lớp thông thường.
    const pham = await layPhamViQuanTri(env, phien);
    if (!pham.isSchoolAdmin && tk.teacherPending !== 1) {
      if (!tk.lopId || !pham.lopIds.includes(tk.lopId)) return loi('Không tìm thấy tài khoản.', 404);
    }

    const { results: hoatDong } = await env.DB.prepare(
      `SELECT hanh_dong AS hanhDong, chi_tiet AS chiTiet, tac_nhan_ten AS tacNhanTen, tao_luc AS taoLuc
         FROM nhat_ky_quan_tri WHERE doi_tuong_loai = 'tai_khoan' AND doi_tuong_id = ?1
        ORDER BY tao_luc DESC LIMIT 10`
    ).bind(String(tk.id)).all();

    const loaiNguoi = loaiNguoiTuTaiKhoan(tk);
    return json({
      ok: true,
      chiTiet: {
        id: `tk:${tk.id}`, loai: loaiNguoi, ten: tk.tenHienThi,
        trangThai: trangThaiTaiKhoan(tk),
        lopId: tk.lopId, lopTen: tk.lopTen,
        taiKhoan: {
          tenDangNhap: tk.tenDangNhap, vaiTro: tk.vaiTro, laAdminTruong: Boolean(tk.laAdminTruong),
          tieuDeHoSo: tk.tieuDeHoSo || '', taoLuc: tk.taoLuc, capNhatLuc: tk.capNhatLuc,
        },
        thongTin: {
          'Tên đăng nhập': tk.tenDangNhap,
          'Vai trò': tk.vaiTro === 'teacher' ? 'Giáo viên' : 'Học sinh/Thành viên',
          'Tạo lúc': tk.taoLuc,
          'Cập nhật gần nhất': tk.capNhatLuc,
        },
        hoatDongGanDay: hoatDong || [],
      },
    });
  }

  return loi('id không hợp lệ.', 400);
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  const url = new URL(request.url);
  const idLoc = url.searchParams.get('id');
  if (idLoc) return layChiTiet(env, phien, idLoc);

  const loaiLoc = (url.searchParams.get('loai') || 'tat-ca').trim();
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const lopIdLoc = parseInt(url.searchParams.get('lopId'), 10) || null;

  const pham = await layPhamViQuanTri(env, phien);
  const dkTaiKhoan = dieuKienPhamVi(pham, 'tc.lop_id', lopIdLoc);
  const dkHocSinh = dieuKienPhamVi(pham, 'hs.lop_id', lopIdLoc);

  // Hồ sơ đang xin quyền giáo viên thường CHƯA có lop_id nên không lọt được qua điều kiện phạm vi
  // lớp thông thường — nhưng functions/api/gv/duyet-giao-vien.js cho phép MỌI giáo viên đã xác
  // thực duyệt (không riêng School Admin), nên ở đây cũng phải thấy được, không chỉ School Admin.
  const dkTaiKhoanSql = pham.isSchoolAdmin
    ? dkTaiKhoan.sql
    : `(${dkTaiKhoan.sql}) OR (tc.teacher_pending = 1 AND tc.vai_tro != 'teacher')`;

  const { results: dsTaiKhoan } = await env.DB.prepare(
    `SELECT tc.id, tc.ten_dang_nhap AS tenDangNhap, tc.ten_hien_thi AS tenHienThi, tc.vai_tro AS vaiTro,
            tc.teacher_pending AS teacherPending, tc.dang_hoat_dong AS dangHoatDong, tc.hoc_sinh_id AS hocSinhId,
            tc.lop_id AS lopId, tc.cap_nhat_luc AS capNhatLuc, l.ten AS lopTen
       FROM tai_khoan_campus tc LEFT JOIN lop l ON l.id = tc.lop_id
      WHERE ${dkTaiKhoanSql}`
  ).bind(...dkTaiKhoan.params).all();

  const { results: dsHocSinh } = await env.DB.prepare(
    `SELECT hs.id, hs.ho_ten AS hoTen, hs.dang_hoc AS dangHoc, hs.lop_id AS lopId, l.ten AS lopTen
       FROM hoc_sinh hs LEFT JOIN lop l ON l.id = hs.lop_id
      WHERE ${dkHocSinh.sql} AND hs.id NOT IN (SELECT hoc_sinh_id FROM tai_khoan_campus WHERE hoc_sinh_id IS NOT NULL)`
  ).bind(...dkHocSinh.params).all();

  let danhSach = [
    ...(dsTaiKhoan || []).map((tk) => ({
      id: `tk:${tk.id}`,
      loai: loaiNguoiTuTaiKhoan(tk),
      ten: tk.tenHienThi, tenDangNhap: tk.tenDangNhap,
      trangThai: trangThaiTaiKhoan(tk),
      lopId: tk.lopId, lopTen: tk.lopTen, hoatDongCuoi: tk.capNhatLuc,
    })),
    ...(dsHocSinh || []).map((hs) => ({
      id: `hs:${hs.id}`, loai: 'hoc-sinh-chua-lien-ket',
      ten: hs.hoTen, tenDangNhap: null,
      trangThai: hs.dangHoc === 0 ? 'da-nghi-hoc' : 'chua-dang-nhap',
      lopId: hs.lopId, lopTen: hs.lopTen, hoatDongCuoi: null,
    })),
  ];

  if (loaiLoc !== 'tat-ca') {
    if (loaiLoc === 'cho-xac-minh' || loaiLoc === 'bi-khoa') danhSach = danhSach.filter((n) => n.trangThai === loaiLoc);
    else danhSach = danhSach.filter((n) => n.loai === loaiLoc);
  }
  if (q) danhSach = danhSach.filter((n) => n.ten.toLowerCase().includes(q) || (n.tenDangNhap || '').toLowerCase().includes(q));

  danhSach.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));

  return json({ ok: true, danhSach, tong: danhSach.length });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  const than = await docThan(request);
  const [loaiId, raw] = String(than.id || '').split(':');
  const soId = parseInt(raw, 10);
  const hanhDong = String(than.hanhDong || '').trim();

  if (loaiId !== 'tk' || !soId || (hanhDong !== 'khoa' && hanhDong !== 'mo_khoa')) {
    return loi('Dữ liệu không hợp lệ. Cần id dạng tk:<số> và hanhDong (khoa | mo_khoa).', 400);
  }

  const target = await env.DB.prepare(
    'SELECT id, ten_dang_nhap, ten_hien_thi, lop_id, la_admin_truong FROM tai_khoan_campus WHERE id = ?1'
  ).bind(soId).first();
  if (!target) return loi('Không tìm thấy tài khoản.', 404);
  if (target.la_admin_truong === 1) return loi('Không thể khoá tài khoản Quản trị viên trường.', 403);

  const pham = await layPhamViQuanTri(env, phien);
  if (!pham.isSchoolAdmin && (!target.lop_id || !pham.lopIds.includes(target.lop_id))) {
    return loi('Không tìm thấy tài khoản.', 404);
  }

  const dangHoatDongMoi = hanhDong === 'khoa' ? 0 : 1;
  await env.DB.prepare(
    'UPDATE tai_khoan_campus SET dang_hoat_dong = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2'
  ).bind(dangHoatDongMoi, soId).run();

  ghiNhatKyQuanTri(env, waitUntil, {
    tacNhanId: phien.accountId, tacNhanTen: phien.ten,
    hanhDong: hanhDong === 'khoa' ? 'khoa_tai_khoan' : 'mo_khoa_tai_khoan',
    doiTuongLoai: 'tai_khoan', doiTuongId: String(soId),
    chiTiet: `${hanhDong === 'khoa' ? 'Khoá' : 'Mở khoá'} tài khoản ${target.ten_dang_nhap} (${target.ten_hien_thi})`,
    lopId: target.lop_id || phien.lopId,
  });

  return json({ ok: true, message: hanhDong === 'khoa' ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.' });
}, { canGiaoVien: true });
