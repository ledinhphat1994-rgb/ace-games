import { bocXuLy, json, loi, docThan, chuoi } from '../_lib/api.js';

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (!phien.lopId) return loi('Phiên không có lớp hợp lệ.', 403);
  if (phien.role === 'teacher') return json({ ok: true, hopLe: true, daThanhVien: true });
  if (!['student', 'phu'].includes(phien.role) || !phien.hocSinhId) {
    return loi('Cần đăng nhập bằng tài khoản học sinh được cấp mã.', 403);
  }
  const body = await docThan(request);
  const maCode = chuoi(body.maCode, 100).trim().toUpperCase();
  const key = `community:${phien.lopId}:${phien.hocSinhId}`;
  const attempts = Number(await env.RATE_LIMIT.get(key)) || 0;
  if (attempts >= 10) return loi('Bạn đã thử quá nhiều lần. Vui lòng đợi 10 phút.', 429);
  await env.RATE_LIMIT.put(key, String(attempts + 1), { expirationTtl: 600 });
  if (!maCode) return loi('Vui lòng nhập mã truy cập.');

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(maCode));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const row = await env.DB.prepare(`
    SELECT id FROM ma_truy_cap_cong_dong
    WHERE ma_hash = ?1 AND lop_id = ?2 AND hoc_sinh_id = ?3
      AND dang_hoat_dong = 1 AND so_lan_da_dung = 0
      AND (het_han_luc IS NULL OR datetime(het_han_luc) > datetime('now'))
  `).bind(hash, phien.lopId, phien.hocSinhId).first();
  if (!row) return loi('Mã không hợp lệ, đã dùng, hết hạn hoặc không thuộc tài khoản của bạn.', 403);

  // D1 batch is transactional. changes() ties the grant to this batch's successful claim.
  const [claim] = await env.DB.batch([
    env.DB.prepare(`
      UPDATE ma_truy_cap_cong_dong
      SET so_lan_da_dung = 1, da_dung_boi_hoc_sinh_id = ?1, da_dung_luc = CURRENT_TIMESTAMP
      WHERE id = ?2 AND lop_id = ?3 AND hoc_sinh_id = ?1 AND ma_hash = ?4
        AND dang_hoat_dong = 1 AND so_lan_da_dung = 0
        AND (het_han_luc IS NULL OR datetime(het_han_luc) > datetime('now'))
        AND EXISTS (SELECT 1 FROM hoc_sinh WHERE id = ?1 AND lop_id = ?3)
    `).bind(phien.hocSinhId, row.id, phien.lopId, hash),
    env.DB.prepare(`
      INSERT INTO community_membership (hoc_sinh_id, lop_id, ma_truy_cap_id, granted_by, granted_at, revoked_at)
      SELECT hoc_sinh_id, lop_id, id, tao_boi_khoa, CURRENT_TIMESTAMP, NULL
      FROM ma_truy_cap_cong_dong
      WHERE id = ?1 AND lop_id = ?2 AND hoc_sinh_id = ?3 AND changes() = 1
      ON CONFLICT(hoc_sinh_id, lop_id) DO UPDATE SET
        revoked_at = NULL, granted_at = CURRENT_TIMESTAMP,
        granted_by = excluded.granted_by, ma_truy_cap_id = excluded.ma_truy_cap_id
    `).bind(row.id, phien.lopId, phien.hocSinhId)
  ]);
  if (claim.meta.changes !== 1) return loi('Mã vừa được dùng hoặc thu hồi.', 409);
  await env.RATE_LIMIT.delete(key);
  return json({ ok: true, hopLe: true, daThanhVien: true, lopId: phien.lopId });
});
