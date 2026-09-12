// POST /api/kiem-tra-ma-cong-dong
// Kích hoạt quyền thành viên Bảng tin cộng đồng lớp & liên kết tài khoản Campus (Phase 4B.1)
import { bocXuLy, json, loi, docThan, chuoi } from '../_lib/api.js';
import { COOKIE_NAME, createToken } from '../_lib/auth.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 ngày

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  if (!phien || (!phien.accountId && !phien.hocSinhId && phien.role !== 'teacher')) {
    return loi('Vui lòng đăng nhập trước khi nhập mã truy cập lớp.', 401);
  }

  if (phien.role === 'teacher') {
    return json({ ok: true, hopLe: true, daThanhVien: true });
  }

  const body = await docThan(request);
  const maCode = chuoi(body.maCode, 100).trim().toUpperCase();
  if (!maCode) return loi('Vui lòng nhập mã truy cập.');

  // Rate limiting chống dò mã
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const rateKey = phien.accountId ? `comm:acc:${phien.accountId}` : (phien.hocSinhId ? `comm:hs:${phien.hocSinhId}` : `comm:ip:${ip}`);
  if (env.RATE_LIMIT) {
    const attempts = Number(await env.RATE_LIMIT.get(rateKey)) || 0;
    if (attempts >= 10) return loi('Bạn đã thử quá nhiều lần. Vui lòng đợi 10 phút.', 429);
    await env.RATE_LIMIT.put(rateKey, String(attempts + 1), { expirationTtl: 600 });
  }

  // Băm SHA-256 mã nhập vào
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(maCode));
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');

  // Tra cứu mã mời hợp lệ
  const invite = await env.DB.prepare(`
    SELECT m.id, m.lop_id, m.hoc_sinh_id, m.so_lan_dung_toi_da, m.so_lan_da_dung,
           m.het_han_luc, m.dang_hoat_dong, m.tao_boi_khoa,
           hs.ho_ten AS hocSinhTen, l.ten AS lopTen
      FROM ma_truy_cap_cong_dong m
      JOIN hoc_sinh hs ON hs.id = m.hoc_sinh_id AND hs.lop_id = m.lop_id
      JOIN lop l ON l.id = m.lop_id
     WHERE m.ma_hash = ?1
       AND m.dang_hoat_dong = 1
       AND m.so_lan_da_dung = 0
       AND (m.het_han_luc IS NULL OR datetime(m.het_han_luc) > datetime('now'))
  `).bind(hash).first();

  if (!invite) {
    return loi('Mã không hợp lệ, đã sử dụng hoặc đã hết hạn.', 403);
  }

  // RÀNG BUỘC LIÊN KẾT TÀI KHOẢN (ACCOUNT ↔ STUDENT LINKAGE INVARIANTS)
  // A. Tài khoản không được liên kết với học sinh khác
  if (phien.hocSinhId && phien.hocSinhId !== invite.hoc_sinh_id) {
    return loi('Tài khoản này đã liên kết với một học sinh khác.', 403);
  }

  if (phien.accountId) {
    const currentAcc = await env.DB.prepare(
      'SELECT hoc_sinh_id, lop_id FROM tai_khoan_campus WHERE id = ?1'
    ).bind(phien.accountId).first();

    if (currentAcc?.hoc_sinh_id && currentAcc.hoc_sinh_id !== invite.hoc_sinh_id) {
      return loi('Tài khoản này đã được liên kết với một học sinh khác.', 403);
    }

    // B. Một học sinh danh sách KHÔNG THỂ bị liên kết vào 2 tài khoản Campus khác nhau
    const otherAcc = await env.DB.prepare(
      'SELECT id, ten_dang_nhap FROM tai_khoan_campus WHERE hoc_sinh_id = ?1 AND id != ?2'
    ).bind(invite.hoc_sinh_id, phien.accountId).first();

    if (otherAcc) {
      return loi('Học sinh này đã được liên kết với tài khoản Campus khác.', 409);
    }
  } else if (phien.hocSinhId) {
    // Phiên học sinh truyền thống: phải đúng mã cấp cho chính mình
    if (phien.hocSinhId !== invite.hoc_sinh_id || (phien.lopId && phien.lopId !== invite.lop_id)) {
      return loi('Mã này được cấp riêng cho học sinh khác.', 403);
    }
  }

  // THỰC THI NGUYÊN TỬ (ATOMIC REDEMPTION VIA D1 BATCH TRANSACTION)
  const statements = [
    // 1. Claim mã mời duy nhất (optimistic check so_lan_da_dung = 0)
    env.DB.prepare(`
      UPDATE ma_truy_cap_cong_dong
      SET so_lan_da_dung = 1,
          da_dung_boi_hoc_sinh_id = ?1,
          da_dung_luc = CURRENT_TIMESTAMP
      WHERE id = ?2 AND so_lan_da_dung = 0 AND dang_hoat_dong = 1
    `).bind(invite.hoc_sinh_id, invite.id),

    // 2. Trao quyền thành viên Bảng tin cộng đồng
    env.DB.prepare(`
      INSERT INTO community_membership (hoc_sinh_id, lop_id, ma_truy_cap_id, granted_by, granted_at, revoked_at)
      VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP, NULL)
      ON CONFLICT(hoc_sinh_id, lop_id) DO UPDATE SET
        revoked_at = NULL,
        granted_at = CURRENT_TIMESTAMP,
        granted_by = excluded.granted_by,
        ma_truy_cap_id = excluded.ma_truy_cap_id
    `).bind(invite.hoc_sinh_id, invite.lop_id, invite.id, invite.tao_boi_khoa || 'teacher')
  ];

  // 3. Nếu là tài khoản Campus, cập nhật liên kết học sinh và lớp
  if (phien.accountId) {
    statements.push(
      env.DB.prepare(`
        UPDATE tai_khoan_campus
        SET hoc_sinh_id = ?1, lop_id = ?2, cap_nhat_luc = CURRENT_TIMESTAMP
        WHERE id = ?3 AND (hoc_sinh_id IS NULL OR hoc_sinh_id = ?1)
      `).bind(invite.hoc_sinh_id, invite.lop_id, phien.accountId)
    );
  }

  const batchResults = await env.DB.batch(statements);
  if (batchResults[0].meta.changes !== 1) {
    return loi('Mã vừa được dùng hoặc đã thu hồi.', 409);
  }

  if (env.RATE_LIMIT) {
    await env.RATE_LIMIT.delete(rateKey).catch(() => {});
  }

  // TÁI CẤP PHIÊN ĐĂNG NHẬP NGAY LẬP TỨC VỚI DANH TÍNH CHUẨN TẮC (REISSUE SESSION)
  const sessionPayload = {
    accountId: phien.accountId || null,
    role: 'student',
    ten: invite.hocSinhTen || phien.ten,
    username: phien.username || '',
    teacherPending: false,
    hocSinhId: invite.hoc_sinh_id,
    lopId: invite.lop_id,
    phienId: phien.phienId || crypto.randomUUID(),
  };

  const token = await createToken(env.SESSION_SECRET, sessionPayload, SESSION_TTL);
  const isHttps = request.url && request.url.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${SESSION_TTL}`;

  return json({
    ok: true,
    hopLe: true,
    daThanhVien: true,
    daKetNoiTaiKhoan: Boolean(phien.accountId),
    lopId: invite.lop_id,
    hocSinhId: invite.hoc_sinh_id,
    hocSinhTen: invite.hocSinhTen,
    lopTen: invite.lopTen,
    thongBao: `Xác nhận thành công! Em đã gia nhập Bảng tin lớp ${invite.lopTen || ''}.`
  }, 200, { 'Set-Cookie': cookie });
});
