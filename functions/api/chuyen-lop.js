// POST /api/chuyen-lop — chuyển đổi lớp học đang xem hoặc quản lý
import { bocXuLy, docThan, json, loi } from '../_lib/api.js';
import { COOKIE_NAME, createToken } from '../_lib/auth.js';
import { layPhamViQuanTri } from '../_lib/quan-tri.js';
import { coQuyenThanhVien } from '../_lib/community.js';

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

  if (!laAdmin) {
    if (laGiaoVien) {
      if (!pham.lopIds || !pham.lopIds.includes(lop.id)) {
        return loi('Bạn không có quyền quản lý nhóm lớp này.', 403);
      }
    } else {
      // Học sinh / Phụ huynh: BẮT BUỘC phải có quyền thành viên vào bảng tin lớp này
      const coQuyen = await coQuyenThanhVien(env, phien, lop.id);
      if (!coQuyen) {
        return loi(`Bạn chưa được cấp quyền truy cập bảng tin nhóm “${lop.ten}”. Vui lòng liên hệ giáo viên để được cấp quyền.`, 403);
      }
    }
  }

  // Nếu là tài khoản Campus (có accountId) và tài khoản chưa có lop_id thì lưu lớp đầu tiên
  if (phien.accountId) {
    const acc = await env.DB.prepare('SELECT lop_id FROM tai_khoan_campus WHERE id = ?1').bind(phien.accountId).first().catch(() => null);
    if (!acc?.lop_id) {
      await env.DB.prepare(
        'UPDATE tai_khoan_campus SET lop_id = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2'
      ).bind(lop.id, phien.accountId).run().catch(() => {});
    }
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
