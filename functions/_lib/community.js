// functions/_lib/community.js
// Kiểm tra quyền truy cập Bảng tin Cộng đồng lớp học (Có chọn lọc theo từng nhóm/lớp)
export async function coQuyenThanhVien(env, phien, targetLopId = null) {
  if (!phien) return false;

  const lopId = targetLopId ? Number(targetLopId) : (phien.lopId ? Number(phien.lopId) : null);
  if (!lopId || !Number.isSafeInteger(lopId) || lopId <= 0) return false;

  // Quyền giáo viên và admin
  const laAdmin = phien.role === 'admin' || phien.vaiTro === 'school_admin' || phien.laAdminTruong === 1;
  if (laAdmin) return true;

  if (phien.role === 'teacher') {
    if (phien.teacherPending) return false;
    // Kiểm tra phạm vi giáo viên nếu có phân công
    if (env.DB) {
      const gvLop = await env.DB.prepare(
        'SELECT 1 FROM giao_vien_lop WHERE (giao_vien_id = ?1 OR giao_vien_id = ?2) AND lop_id = ?3'
      ).bind(Number(phien.accountId || -1), Number(phien.giaoVienId || -1), lopId).first().catch(() => null);
      if (gvLop) return true;
    }
    if (phien.lopId && Number(phien.lopId) === lopId) return true;
    return true; // Giáo viên chính thức có thể xem
  }

  let hocSinhId = phien.hocSinhId ? Number(phien.hocSinhId) : null;
  let accLopId = null;

  // Nếu có accountId, tra cứu D1 authoritative
  if (phien.accountId && env.DB) {
    const acc = await env.DB.prepare(
      'SELECT hoc_sinh_id, lop_id FROM tai_khoan_campus WHERE id = ?1 AND dang_hoat_dong = 1'
    ).bind(Number(phien.accountId)).first().catch(() => null);
    if (acc) {
      if (acc.hoc_sinh_id) hocSinhId = Number(acc.hoc_sinh_id);
      if (acc.lop_id) accLopId = Number(acc.lop_id);
      // Học sinh có lop_id chính khớp ĐÚNG với lớp mục tiêu: có quyền thành viên
      if (accLopId && accLopId === lopId) {
        return true;
      }
    }
  }

  // Nếu không có hocSinhId và không khớp accLopId, không thể vào
  if (!hocSinhId) return false;

  // Kiểm tra community_membership cho ĐÚNG nhóm lớp này (chưa bị thu hồi)
  if (env.DB) {
    const row = await env.DB.prepare(
      `SELECT cm.id FROM community_membership cm
       WHERE cm.hoc_sinh_id = ?1 AND cm.lop_id = ?2 AND cm.revoked_at IS NULL`
    ).bind(hocSinhId, lopId).first().catch(() => null);

    return Boolean(row);
  }

  return false;
}
