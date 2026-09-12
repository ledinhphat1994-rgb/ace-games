// functions/_lib/community.js
// Kiểm tra quyền truy cập Bảng tin Cộng đồng lớp học
export async function coQuyenThanhVien(env, phien) {
  if (!phien) return false;
  if (phien.role === 'teacher') return true;

  let hocSinhId = phien.hocSinhId;
  let lopId = phien.lopId;

  // Nếu session chưa kịp sync hocSinhId/lopId nhưng có accountId, tra cứu D1 authoritative
  if ((!hocSinhId || !lopId) && phien.accountId && env.DB) {
    const acc = await env.DB.prepare(
      'SELECT hoc_sinh_id, lop_id FROM tai_khoan_campus WHERE id = ?1 AND dang_hoat_dong = 1'
    ).bind(phien.accountId).first().catch(() => null);
    if (acc?.hoc_sinh_id && acc?.lop_id) {
      hocSinhId = acc.hoc_sinh_id;
      lopId = acc.lop_id;
    }
  }

  if (!lopId || !hocSinhId) return false;

  const row = await env.DB.prepare(
    `SELECT cm.id FROM community_membership cm
     JOIN hoc_sinh hs ON hs.id = cm.hoc_sinh_id AND hs.lop_id = cm.lop_id
     WHERE cm.hoc_sinh_id = ?1 AND cm.lop_id = ?2 AND cm.revoked_at IS NULL`
  ).bind(hocSinhId, lopId).first().catch(() => null);

  return Boolean(row);
}
