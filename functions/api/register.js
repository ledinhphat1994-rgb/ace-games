// POST /api/register — Đăng ký tài khoản Digital Campus độc lập
// Thu thập tối thiểu thông tin cá nhân: Tên hiển thị, Tên đăng nhập, Mật khẩu, Loại tài khoản.
// KHÔNG BAO GIỜ tự cấp quyền Teacher khi đăng ký: tài khoản chọn Giáo viên sẽ ở trạng thái PENDING TEACHER.
import { COOKIE_NAME, createToken } from '../_lib/auth.js';
import { taoSalt, bamMatKhau } from '../_lib/passwords.js';
import { turnstileHopLe } from '../_lib/turnstile.js';

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 ngày
const MAX_REG_IP = 15;                // Tối đa 15 tài khoản / 10 phút từ cùng 1 IP
const WINDOW = 600;

function json(data, status = 200, cookie = null) {
  const h = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  if (cookie) h.append('Set-Cookie', cookie);
  const out = { ...data };
  if (!out.loi && out.message) out.loi = out.message;
  if (!out.message && out.loi) out.message = out.loi;
  return new Response(JSON.stringify(out), { status, headers: h });
}

async function rateLimitIp(env, ip) {
  if (!env.RATE_LIMIT) return false;
  if (ip === '127.0.0.1' || ip === '0.0.0.0' || ip === '::1') return false;
  const key = `reg:ip:${ip}`;
  const n = parseInt((await env.RATE_LIMIT.get(key)) || '0', 10);
  if (n >= MAX_REG_IP) return true;
  await env.RATE_LIMIT.put(key, String(n + 1), { expirationTtl: WINDOW });
  return false;
}

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  if (!env.SESSION_SECRET) {
    return json({ ok: false, message: 'Máy chủ chưa được cấu hình SESSION_SECRET.' }, 500);
  }
  if (!env.DB) {
    return json({ ok: false, message: 'Cơ sở dữ liệu chưa sẵn sàng.' }, 500);
  }

  if (await rateLimitIp(env, ip)) {
    return json({ ok: false, message: 'Bạn đăng ký quá nhiều lần. Vui lòng thử lại sau.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'Dữ liệu không đúng định dạng JSON.' }, 400);
  }

  const rawUsername = String(body.username || body.tenDangNhap || '').trim();
  const rawDisplayName = String(body.displayName || body.tenHienThi || body.hoTen || body.hoten || '').trim();
  const rawPassword = String(body.password || body.matKhau || '').trim();
  const rawAccountType = String(body.accountType || body.vaiTro || body.loaiTaiKhoan || body.loai_tai_khoan || 'student').trim().toLowerCase();
  const turnstileToken = String(body.turnstileToken || '').trim();

  if (turnstileToken && !(await turnstileHopLe(env, turnstileToken, ip))) {
    return json({ ok: false, message: 'Xác minh "không phải robot" chưa xong hoặc đã hết hạn.' }, 400);
  }

  // Validate username
  const username = rawUsername.toLowerCase();
  if (username.length < 3 || username.length > 50) {
    return json({ ok: false, message: 'Tên đăng nhập phải từ 3 đến 50 ký tự.' }, 400);
  }
  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return json({ ok: false, message: 'Tên đăng nhập chỉ gồm chữ thường, số, dấu chấm, gạch dưới hoặc gạch nối.' }, 400);
  }

  // Validate display name
  const displayName = rawDisplayName.slice(0, 60);
  if (displayName.length < 2) {
    return json({ ok: false, message: 'Tên hiển thị phải từ 2 ký tự trở lên.' }, 400);
  }

  // Validate password (Tối thiểu 8 ký tự cho tài khoản mới)
  if (rawPassword.length < 8) {
    return json({ ok: false, message: 'Mật khẩu phải từ 8 ký tự trở lên để đảm bảo an toàn.' }, 400);
  }

  // Role validation & TEACHER SECURITY ENFORCEMENT
  let vaiTro = 'student';
  let teacherPending = 0;

  if (rawAccountType === 'teacher' || rawAccountType === 'giao_vien') {
    // KHÔNG BAO GIỜ cấp thẳng vaiTro = 'teacher'
    vaiTro = 'student';
    teacherPending = 1;
  } else if (rawAccountType === 'external' || rawAccountType === 'khach' || rawAccountType === 'nguoi_dung_khac') {
    vaiTro = 'external';
  }

  // Kiểm tra tên đăng nhập trùng lặp
  const daCo = await env.DB.prepare(
    'SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1'
  ).bind(username).first().catch(() => null);

  if (daCo) {
    return json({ ok: false, message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }, 409);
  }

  // Băm mật khẩu PBKDF2
  const salt = taoSalt(16);
  const iterations = 100000;
  const matKhauHash = await bamMatKhau(rawPassword, salt, iterations);
  const phienId = crypto.randomUUID();

  const insertKq = await env.DB.prepare(
    `INSERT INTO tai_khoan_campus (
       ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
       vai_tro, teacher_pending, dang_hoat_dong, thiet_bi
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8)`
  ).bind(
    username,
    displayName,
    matKhauHash,
    salt,
    iterations,
    vaiTro,
    teacherPending,
    phienId
  ).run();

  let accountId = insertKq?.meta?.last_row_id;
  if (!accountId) {
    const row = await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(username).first().catch(() => null);
    accountId = row?.id;
  }
  if (!accountId) {
    return json({ ok: false, message: 'Không thể tạo tài khoản, vui lòng thử lại.' }, 500);
  }

  // Tạo phiên đăng nhập tự động
  const sessionPayload = {
    accountId,
    role: vaiTro,
    ten: displayName,
    username,
    teacherPending: Boolean(teacherPending),
    hocSinhId: null,
    lopId: null,
    phienId,
  };

  const token = await createToken(env.SESSION_SECRET, sessionPayload, SESSION_TTL);
  const isHttps = request.url && request.url.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly${secureFlag}; SameSite=Lax; Max-Age=${SESSION_TTL}`;

  return json({
    ok: true,
    message: teacherPending
      ? 'Đăng ký tài khoản thành công! Yêu cầu quyền Giáo viên của bạn đang chờ phê duyệt từ quản trị viên.'
      : 'Đăng ký tài khoản thành công!',
    role: vaiTro,
    teacherPending: Boolean(teacherPending),
    user: {
      id: accountId,
      username,
      ten: displayName,
      role: vaiTro,
      teacherPending: Boolean(teacherPending),
    },
  }, 200, cookie);
}
