// Phạm vi quản trị của tài khoản đang đăng nhập: School Admin thấy TẤT CẢ lớp; GVCN/cán sự chỉ
// thấy các lớp có trong giao_vien_lop của mình (1 GVCN có thể kiêm nhiệm nhiều lớp — Admin IA v1).
// isSchoolAdmin đọc TƯƠI từ D1 (không tin cookie) vì tai_khoan_campus.la_admin_truong có thể đổi
// sau khi phiên đăng nhập đã phát hành, giống cách _lib/social.js làm với quyền Giáo viên.
export async function layPhamViQuanTri(env, phien) {
  const rec = await env.DB.prepare(
    'SELECT la_admin_truong, vai_tro, lop_id FROM tai_khoan_campus WHERE id = ?1'
  ).bind(Number(phien.accountId) || -1).first();

  const isSchoolAdmin = Boolean(
    rec?.la_admin_truong === 1 || rec?.la_admin_truong === true ||
    rec?.vai_tro === 'admin' || rec?.vai_tro === 'school_admin'
  );

  if (isSchoolAdmin) return { isSchoolAdmin: true, lopIds: null };

  const { results } = await env.DB.prepare(
    'SELECT lop_id FROM giao_vien_lop WHERE giao_vien_id = ?1'
  ).bind(Number(phien.accountId) || -1).all();
  let lopIds = (results || []).map((r) => r.lop_id);

  // Tương thích ngược: tài khoản chưa có dòng nào trong giao_vien_lop (vd tạo trước migration
  // 76, hoặc chưa từng được gán qua bảng mới) vẫn dùng đúng lop_id sẵn có trên tai_khoan_campus.
  if (lopIds.length === 0 && rec?.lop_id) lopIds = [rec.lop_id];

  return { isSchoolAdmin: false, lopIds };
}
