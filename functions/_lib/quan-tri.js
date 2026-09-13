// Phạm vi quản trị của tài khoản đang đăng nhập: School Admin thấy TẤT CẢ lớp; GVCN/cán sự chỉ
// thấy các lớp có trong giao_vien_lop của mình (1 GVCN có thể kiêm nhiệm nhiều lớp — Admin IA v1).
// isSchoolAdmin đọc TƯƠI từ D1 (không tin cookie) vì tai_khoan_campus.la_admin_truong có thể đổi
// sau khi phiên đăng nhập đã phát hành, giống cách _lib/social.js làm với quyền Giáo viên.
export async function layPhamViQuanTri(env, phien) {
  // Phiên đăng nhập TRUYỀN THỐNG (mã giáo viên riêng từng lớp qua ma_dang_nhap/TEACHER_CODE — vẫn
  // là cách đăng nhập chính hiện nay) KHÔNG có accountId, vì la_admin_truong chỉ tồn tại trên
  // tai_khoan_campus (tài khoản Campus username/mật khẩu). Không tra cứu được thì phải coi là GVCN
  // đúng 1 lớp của phiên đó — TUYỆT ĐỐI không trả về rỗng (sẽ làm Người dùng/Nhật ký/Tổng quan
  // trống trơn với chính giáo viên chủ nhiệm thật), và cũng không mặc định cấp quyền School Admin.
  if (!phien.accountId) {
    return { isSchoolAdmin: false, lopIds: phien.lopId ? [phien.lopId] : [] };
  }

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
  // 76, hoặc chưa từng được gán qua bảng mới) vẫn dùng đúng lop_id sẵn có trên tai_khoan_campus,
  // rồi mới cùng lắm rơi về lop_id của phiên (không để rỗng nếu còn cách nào xác định được lớp).
  if (lopIds.length === 0 && rec?.lop_id) lopIds = [rec.lop_id];
  if (lopIds.length === 0 && phien.lopId) lopIds = [phien.lopId];

  return { isSchoolAdmin: false, lopIds };
}

// Xác định lop_id THỰC SỰ áp dụng cho 1 yêu cầu, dùng chung cho mọi API cần "xem theo lớp đang
// chọn" (Học sinh, Điểm danh, Quỹ...): nếu client truyền lopId và nó nằm trong phạm vi được phép
// (pham) thì dùng đúng lopId đó; không truyền gì thì dùng lopId mặc định của phiên. TUYỆT ĐỐI
// không tự ý dùng lopId client truyền khi nó ngoài phạm vi — trả về null để API tự chặn (403/404),
// chống IDOR (GVCN đoán lopId lớp khác rồi xem trộm).
export function xacDinhLopIdApDung(pham, lopIdYeuCau, lopIdMacDinh) {
  if (!lopIdYeuCau) return lopIdMacDinh || null;
  if (pham.isSchoolAdmin) return lopIdYeuCau;
  if (pham.lopIds && pham.lopIds.includes(lopIdYeuCau)) return lopIdYeuCau;
  return null;
}
