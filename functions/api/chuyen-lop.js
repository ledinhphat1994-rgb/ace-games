// POST /api/chuyen-lop — chuyển đổi lớp học đang xem hoặc quản lý
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { COOKIE_NAME, createToken } from '../_lib/auth.js';
import { layPhamViQuanTri } from '../_lib/quan-tri.js';

const SESSION_TTL = 30 * 24 * 60 * 60; // 30 ngày

export const onRequestPost = bocXuLy(async ({ request, env, phien }) => {
  const body = await docThan(request);
  const lopIdYeuCau = Number(body.lopId || body.id);
  const slugYeuCau = (body.slug || '').trim().toLowerCase();

  if (!lopIdYeuCau && !slugYeuCau) {
    return loi('Vui lòng chọn lớp học hợp lệ.', 400);
  }

  // Tra cứu lớp mục tiêu trong CSDL
  let lop = null;
  if (lopIdYeuCau) {
    lop = await env.DB.prepare(
      'SELECT id, ten, slug, nam_hoc AS namHoc, truong FROM lop WHERE id = ?1 AND dang_hoat_dong = 1'
    ).bind(lopIdYeuCau).first();
  } else if (slugYeuCau) {
    lop = await env.DB.prepare(
      'SELECT id, ten, slug, nam_hoc AS namHoc, truong FROM lop WHERE slug = ?1 AND dang_hoat_dong = 1'
    ).bind(slugYeuCau).first();
  }

  if (!lop) {
    return loi('Lớp học không tồn tại hoặc đã ngừng hoạt động.', 404);
  }

  // Kiểm tra quyền hạn chuyển lớp
  const pham = await layPhamViQuanTri(env, phien);
  const laAdmin = pham.isSchoolAdmin || phien.role === 'admin' || phien.vaiTro === 'school_admin';
  const laGiaoVien = phien.role === 'teacher';

  // Học sinh cố định không được tự ý đổi lớp của người khác nếu đã gán hocSinhId
  if (!laAdmin && !laGiaoVien && phien.hocSinhId && phien.lopId && phien.lopId !== lop.id) {
    return loi('Tài khoản học sinh được liên kết cố định với lớp của mình.', 403);
  }

  // Nếu là tài khoản Campus (có accountId), cập nhật lớp mặc định trong CSDL
  if (phien.accountId) {
    await env.DB.prepare(
      'UPDATE tai_khoan_campus SET lop_id = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2'
    ).bind(lop.id, phien.accountId).run().catch(() => {});
  }

  // Cấp lại cookie phiên c10a7_session chứa lopId mới
  const sessionPayload = {
    ...phien,
    lopId: lop.id,
    tenLop: lop.ten,
    namHoc: lop.namHoc,
  };

  const token = await createToken(env.SESSION_SECRET, sessionPayload, SESSION_TTL);
  const isHttps = request.url && request.url.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${SESSION_TTL}`;

  return json({
    ok: true,
    lop: {
      id: lop.id,
      ten: lop.ten,
      slug: lop.slug,
      namHoc: lop.namHoc,
      truong: lop.truong,
    },
    message: `Đã chuyển sang ${lop.ten}`,
  }, 200, { 'Set-Cookie': cookie });
});
