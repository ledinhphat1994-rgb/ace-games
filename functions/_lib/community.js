export async function coQuyenThanhVien(env, phien) {
  if (!phien?.lopId) return false;
  if (phien.role === 'teacher') return true;
  if (!['student', 'phu'].includes(phien.role) || !phien.hocSinhId) return false;
  const row = await env.DB.prepare(
    `SELECT cm.id FROM community_membership cm
     JOIN hoc_sinh hs ON hs.id = cm.hoc_sinh_id AND hs.lop_id = cm.lop_id
     WHERE cm.hoc_sinh_id = ?1 AND cm.lop_id = ?2 AND cm.revoked_at IS NULL`
  ).bind(phien.hocSinhId, phien.lopId).first();
  return Boolean(row);
}
