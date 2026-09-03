// POST /api/login  { code: "..." }  -> đặt cookie phiên nếu mã đúng.
import { COOKIE_NAME, createToken, safeEqual } from '../_lib/auth.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 ngày
const MAX_TRIES = 8;                  // số lần nhập sai tối đa
const WINDOW = 600;                   // trong 10 phút, tính theo IP

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

// Giới hạn số lần thử nếu đã gắn KV namespace tên RATE_LIMIT (không bắt buộc).
async function tooManyTries(env, ip) {
  if (!env.RATE_LIMIT) return false;
  const key = `login:${ip}`;
  const n = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (n >= MAX_TRIES) return true;
  await env.RATE_LIMIT.put(key, String(n + 1), { expirationTtl: WINDOW });
  return false;
}

async function clearTries(env, ip) {
  if (env.RATE_LIMIT) await env.RATE_LIMIT.delete(`login:${ip}`);
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (!env.SESSION_SECRET || !env.CLASS_CODE) {
    return json({ ok: false, message: 'Máy chủ chưa được cấu hình mã lớp.' }, 500);
  }

  if (await tooManyTries(env, ip)) {
    return json({ ok: false, message: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.' }, 429);
  }

  let code = '';
  try {
    const body = await request.json();
    code = String(body.code || '').trim();
  } catch {
    return json({ ok: false, message: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  if (!code) return json({ ok: false, message: 'Vui lòng nhập mã bảo mật.' }, 400);

  // Làm chậm nhẹ để hạn chế dò mã tự động.
  await new Promise((r) => setTimeout(r, 400));

  // Mã học sinh / giáo viên: ưu tiên đọc từ D1 nếu giáo viên đã tự đặt qua web
  // (mục "Mã đăng nhập"); nếu chưa từng đặt thì dùng biến môi trường cũ trên Cloudflare.
  let maGiaoVien = env.TEACHER_CODE || '';
  let maHocSinh = env.CLASS_CODE || '';
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare('SELECT vai_tro, ma FROM ma_dang_nhap').all();
      results.forEach((r) => {
        if (r.vai_tro === 'teacher') maGiaoVien = r.ma;
        if (r.vai_tro === 'student') maHocSinh = r.ma;
      });
    } catch {
      // Bảng chưa tồn tại (chưa chạy migration) — dùng biến môi trường như trước.
    }
  }

  let role = null;
  let phanBoSung = {};
  let tenHienThi = '';

  if (maGiaoVien && safeEqual(code, maGiaoVien)) {
    role = 'teacher';
  } else if (maHocSinh && safeEqual(code, maHocSinh)) {
    role = 'student';
  } else if (env.DB) {
    // Không khớp 2 mã cố định — thử tìm trong bảng tài khoản đặc biệt
    // (lớp trưởng, thủ quỹ... do giáo viên tự cấp trên web).
    try {
      const phu = await env.DB.prepare(
        'SELECT id, ten, vai_tro, quyen FROM tai_khoan_phu WHERE ma = ?1 AND dang_hoat_dong = 1'
      ).bind(code).first();

      if (phu) {
        role = 'phu';
        tenHienThi = phu.ten;
        phanBoSung = {
          phuId: phu.id,
          ten: phu.ten,
          vaiTro: phu.vai_tro,
          quyen: (phu.quyen || '').split(',').map((s) => s.trim()).filter(Boolean),
        };
      }
    } catch {
      // Bảng chưa tồn tại (chưa chạy migration) — coi như không khớp, không chặn đăng nhập thường.
    }
  }

  if (!role) return json({ ok: false, message: 'Mã bảo mật không đúng. Vui lòng hỏi lại giáo viên chủ nhiệm.' }, 401);

  await clearTries(env, ip);
  const token = await createToken(env.SESSION_SECRET, { role, ...phanBoSung }, SESSION_TTL);
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL}`,
  ].join('; ');

  return json({ ok: true, role, ten: tenHienThi }, 200, { 'Set-Cookie': cookie });
}

export function onRequestGet() {
  return json({ ok: false, message: 'Phương thức không được hỗ trợ.' }, 405);
}
