// API Quản lý Bảng tin / Nhóm lớp và cấp quyền học sinh trực tiếp (không cần nhập mã)
import { bocXuLy, docThan, json, loi, chuoi } from '../../_lib/api.js';
import { layPhamViQuanTri } from '../../_lib/quan-tri.js';
import { ghiNhatKyQuanTri } from '../../_lib/audit.js';

function parseId(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return value;
  const m = /^tk:([1-9]\d*)$/.exec(String(value || ''));
  if (m) return Number(m[1]);
  if (/^[1-9]\d*$/.test(String(value || ''))) return Number(value);
  return null;
}

export const onRequestGet = bocXuLy(async ({ request, env, phien }) => {
  if (phien.teacherPending) return loi('Bạn chưa có quyền quản trị.', 403);
  const pham = await layPhamViQuanTri(env, phien);
  const url = new URL(request.url);
  const lopIdParam = url.searchParams.get('lopId');

  if (lopIdParam) {
    const lopId = parseId(lopIdParam);
    if (!lopId) return loi('Mã lớp không hợp lệ.', 400);
    if (!pham.isSchoolAdmin && (!pham.lopIds || !pham.lopIds.includes(lopId))) {
      return loi('Bạn không có quyền quản lý nhóm lớp này.', 403);
    }

    const lop = await env.DB.prepare(
      `SELECT id, ten, nam_hoc AS namHoc, truong, gioi_thieu AS gioiThieu,
              dang_hoat_dong AS dangHoatDong, tao_luc AS taoLuc
       FROM lop WHERE id = ?1`
    ).bind(lopId).first();

    if (!lop) return loi('Không tìm thấy nhóm lớp.', 404);

    // Thành viên học sinh hiện có trong nhóm (lop_id trực tiếp hoặc qua community_membership chưa bị thu hồi)
    const { results: thanhVien } = await env.DB.prepare(
      `SELECT DISTINCT tc.id, tc.ten_dang_nhap AS tenDangNhap, tc.ten_hien_thi AS ten,
              tc.vai_tro AS vaiTro, tc.dang_hoat_dong AS dangHoatDong,
              tc.tao_luc AS taoLuc, tc.cap_nhat_luc AS capNhatLuc,
              tc.hoc_sinh_id AS hocSinhId
       FROM tai_khoan_campus tc
       LEFT JOIN community_membership cm ON cm.hoc_sinh_id = tc.hoc_sinh_id AND cm.lop_id = ?1 AND cm.revoked_at IS NULL
       WHERE tc.vai_tro = 'student' AND (tc.lop_id = ?1 OR cm.id IS NOT NULL)
       ORDER BY tc.ten_hien_thi ASC`
    ).bind(lopId).all();

    // Tài khoản học sinh chưa thuộc nhóm này có thể thêm vào
    const { results: hocSinhKhaDung } = await env.DB.prepare(
      `SELECT tc.id, tc.ten_dang_nhap AS tenDangNhap, tc.ten_hien_thi AS ten,
              tc.lop_id AS lopId, l.ten AS lopTen
       FROM tai_khoan_campus tc
       LEFT JOIN lop l ON l.id = tc.lop_id
       WHERE tc.vai_tro = 'student' AND tc.dang_hoat_dong = 1
         AND (tc.lop_id IS NULL OR tc.lop_id != ?1)
         AND NOT EXISTS (
           SELECT 1 FROM community_membership cm
           WHERE cm.hoc_sinh_id = tc.hoc_sinh_id AND cm.lop_id = ?1 AND cm.revoked_at IS NULL
         )
       ORDER BY tc.ten_hien_thi ASC LIMIT 100`
    ).bind(lopId).all();

    return json({
      ok: true,
      lop,
      thanhVien: thanhVien || [],
      hocSinhKhaDung: hocSinhKhaDung || []
    });
  }

  // Danh sách các nhóm lớp trong phạm vi
  let dsLop = [];
  if (pham.isSchoolAdmin) {
    const { results } = await env.DB.prepare(
      `SELECT l.id, l.ten, l.nam_hoc AS namHoc, l.truong, l.gioi_thieu AS gioiThieu,
              l.dang_hoat_dong AS dangHoatDong, l.tao_luc AS taoLuc,
              (SELECT COUNT(DISTINCT tc.id) FROM tai_khoan_campus tc
               LEFT JOIN community_membership cm ON cm.hoc_sinh_id = tc.hoc_sinh_id AND cm.lop_id = l.id AND cm.revoked_at IS NULL
               WHERE tc.dang_hoat_dong = 1 AND tc.vai_tro = 'student' AND (tc.lop_id = l.id OR cm.id IS NOT NULL)) AS soThanhVien
       FROM lop l
       WHERE l.dang_hoat_dong = 1
       ORDER BY l.id ASC`
    ).all();
    dsLop = results || [];
  } else {
    const ids = pham.lopIds || [];
    if (ids.length > 0) {
      const { results } = await env.DB.prepare(
        `SELECT l.id, l.ten, l.nam_hoc AS namHoc, l.truong, l.gioi_thieu AS gioiThieu,
                l.dang_hoat_dong AS dangHoatDong, l.tao_luc AS taoLuc,
                (SELECT COUNT(DISTINCT tc.id) FROM tai_khoan_campus tc
                 LEFT JOIN community_membership cm ON cm.hoc_sinh_id = tc.hoc_sinh_id AND cm.lop_id = l.id AND cm.revoked_at IS NULL
                 WHERE tc.dang_hoat_dong = 1 AND tc.vai_tro = 'student' AND (tc.lop_id = l.id OR cm.id IS NOT NULL)) AS soThanhVien
         FROM lop l
         WHERE l.id IN (${ids.map(() => '?').join(',')}) AND l.dang_hoat_dong = 1
         ORDER BY l.id ASC`
      ).bind(...ids).all();
      dsLop = results || [];
    }
  }

  return json({
    ok: true,
    dsLop,
    isSchoolAdmin: pham.isSchoolAdmin
  });
}, { canGiaoVien: true });

export const onRequestPost = bocXuLy(async ({ request, env, phien, waitUntil }) => {
  if (phien.teacherPending) return loi('Bạn chưa có quyền quản trị.', 403);
  const than = await docThan(request);
  const action = than.action || than.hanhDong;
  const pham = await layPhamViQuanTri(env, phien);

  if (action === 'tao_nhom') {
    const ten = chuoi(than.ten, 100).trim();
    const namHoc = chuoi(than.namHoc || '2026 – 2027', 50).trim();
    const truong = chuoi(than.truong || 'Trung tâm GDNN-GDTX Khu vực I Phân hiệu 2 - xã Định Quán', 200).trim();
    const gioiThieu = chuoi(than.gioiThieu || '', 500).trim();

    if (!ten) return loi('Vui lòng nhập tên nhóm / lớp.', 400);

    const res = await env.DB.prepare(
      `INSERT INTO lop (ten, nam_hoc, truong, gioi_thieu, dang_hoat_dong)
       VALUES (?1, ?2, ?3, ?4, 1)`
    ).bind(ten, namHoc, truong, gioiThieu).run();

    const newLopId = res.meta?.last_row_id;
    if (!newLopId) return loi('Không thể tạo nhóm lớp lúc này.', 500);

    // Gán quyền quản lý cho giáo viên tạo nhóm nếu không phải admin trường
    if (phien.accountId) {
      await env.DB.prepare(
        `INSERT INTO giao_vien_lop (giao_vien_id, lop_id, la_chinh)
         VALUES (?1, ?2, 0)
         ON CONFLICT(giao_vien_id, lop_id) DO NOTHING`
      ).bind(Number(phien.accountId), newLopId).run();
    }

    ghiNhatKyQuanTri(env, waitUntil, {
      tacNhanId: phien.accountId,
      tacNhanTen: phien.ten,
      hanhDong: 'tao_nhom_lop',
      doiTuongLoai: 'lop',
      doiTuongId: String(newLopId),
      chiTiet: `Tạo nhóm: ${ten}`,
      lopId: newLopId
    });

    return json({ ok: true, lopId: newLopId, message: `Đã tạo nhóm “${ten}” thành công.` });
  }

  if (action === 'cap_quyen') {
    const lopId = parseId(than.lopId);
    const accountId = parseId(than.accountId || than.id);

    if (!lopId || !accountId) return loi('Thông tin cấp quyền không hợp lệ.', 400);
    if (!pham.isSchoolAdmin && (!pham.lopIds || !pham.lopIds.includes(lopId))) {
      return loi('Bạn không có quyền cấp vào nhóm lớp này.', 403);
    }

    const tk = await env.DB.prepare(
      `SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS ten, hoc_sinh_id AS hocSinhId, vai_tro AS vaiTro
       FROM tai_khoan_campus WHERE id = ?1`
    ).bind(accountId).first();

    if (!tk) return loi('Không tìm thấy tài khoản học sinh.', 404);
    if (tk.vaiTro !== 'student') return loi('Chỉ có thể cấp quyền học sinh cho tài khoản học sinh.', 400);

    let hocSinhId = tk.hocSinhId;

    // Đảm bảo học sinh có bản ghi trong bảng hoc_sinh để liên kết và đồng bộ
    if (!hocSinhId) {
      const resHs = await env.DB.prepare(
        `INSERT INTO hoc_sinh (ho_ten, lop_id, dang_hoc) VALUES (?1, ?2, 1)`
      ).bind(tk.ten, lopId).run();
      hocSinhId = resHs.meta?.last_row_id;
    }

    // Cập nhật tài khoản campus: gán hoc_sinh_id; nếu chưa có lớp chính thì gán lớp này
    await env.DB.prepare(
      `UPDATE tai_khoan_campus
       SET lop_id = COALESCE(lop_id, ?1), hoc_sinh_id = COALESCE(hoc_sinh_id, ?2), cap_nhat_luc = CURRENT_TIMESTAMP
       WHERE id = ?3`
    ).bind(lopId, hocSinhId, accountId).run();

    // Cập nhật community_membership để xác nhận quyền truy cập bảng tin có chọn lọc cho đúng nhóm này
    if (hocSinhId) {
      await env.DB.prepare(
        `INSERT INTO community_membership (hoc_sinh_id, lop_id, granted_by, granted_at, revoked_at)
         VALUES (?1, ?2, ?3, CURRENT_TIMESTAMP, NULL)
         ON CONFLICT(hoc_sinh_id, lop_id) DO UPDATE SET
           revoked_at = NULL,
           granted_at = CURRENT_TIMESTAMP,
           granted_by = excluded.granted_by`
      ).bind(hocSinhId, lopId, phien.ten || phien.username || 'teacher').run();
    }

    ghiNhatKyQuanTri(env, waitUntil, {
      tacNhanId: phien.accountId,
      tacNhanTen: phien.ten,
      hanhDong: 'cap_quyen_hoc_sinh',
      doiTuongLoai: 'tai_khoan',
      doiTuongId: String(accountId),
      chiTiet: `Cấp quyền học sinh ${tk.tenDangNhap} vào bảng tin nhóm ${lopId}`,
      lopId
    });

    return json({ ok: true, message: `Đã cấp quyền cho ${tk.ten} (@${tk.tenDangNhap}) vào nhóm thành công.` });
  }

  if (action === 'go_quyen') {
    const lopId = parseId(than.lopId);
    const accountId = parseId(than.accountId || than.id);

    if (!lopId || !accountId) return loi('Thông tin gỡ quyền không hợp lệ.', 400);
    if (!pham.isSchoolAdmin && (!pham.lopIds || !pham.lopIds.includes(lopId))) {
      return loi('Bạn không có quyền quản lý nhóm lớp này.', 403);
    }

    const tk = await env.DB.prepare(
      `SELECT id, ten_dang_nhap AS tenDangNhap, hoc_sinh_id AS hocSinhId, lop_id AS lopId
       FROM tai_khoan_campus WHERE id = ?1`
    ).bind(accountId).first();

    if (!tk) return loi('Không tìm thấy tài khoản học sinh.', 404);

    if (tk.hocSinhId) {
      await env.DB.prepare(
        `UPDATE community_membership SET revoked_at = CURRENT_TIMESTAMP WHERE hoc_sinh_id = ?1 AND lop_id = ?2`
      ).bind(tk.hocSinhId, lopId).run();
    }

    // Nếu lop_id chính của tài khoản đang trỏ vào nhóm này, chuyển sang nhóm hợp lệ khác hoặc gán null
    if (tk.lopId === lopId) {
      let altLop = null;
      if (tk.hocSinhId) {
        altLop = await env.DB.prepare(
          `SELECT lop_id FROM community_membership WHERE hoc_sinh_id = ?1 AND lop_id != ?2 AND revoked_at IS NULL LIMIT 1`
        ).bind(tk.hocSinhId, lopId).first();
      }
      await env.DB.prepare(
        `UPDATE tai_khoan_campus SET lop_id = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2`
      ).bind(altLop?.lop_id || null, accountId).run();
    }

    ghiNhatKyQuanTri(env, waitUntil, {
      tacNhanId: phien.accountId,
      tacNhanTen: phien.ten,
      hanhDong: 'go_quyen_hoc_sinh',
      doiTuongLoai: 'tai_khoan',
      doiTuongId: String(accountId),
      chiTiet: `Gỡ quyền học sinh ${tk.tenDangNhap} khỏi nhóm ${lopId}`,
      lopId
    });

    return json({ ok: true, message: `Đã gỡ tài khoản khỏi nhóm.` });
  }

  return loi('Hành động không hợp lệ.', 400);
}, { canGiaoVien: true });
