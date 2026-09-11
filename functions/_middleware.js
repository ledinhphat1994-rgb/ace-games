// Cổng bảo vệ toàn trang: chạy TRƯỚC mọi yêu cầu tới Cloudflare Pages.
// Chưa có phiên hợp lệ => máy chủ không trả nội dung, chỉ trả trang đăng nhập.
import { COOKIE_NAME, readCookie, verifyToken } from './_lib/auth.js';
import { kiemTraPhienHieuLuc } from './_lib/api.js';

// Những đường dẫn ai cũng vào được (nếu không thì không thể hiện trang đăng nhập).
const PUBLIC_PATHS = new Set([
  '/', '/index.html',
  '/digital-campus', '/digital-campus.html',
  '/community-feed', '/community-feed.html',
  '/login', '/login.html', '/api/login', '/api/logout',
  '/favicon.ico', '/robots.txt',
  // Hai tệp này chỉ mô tả cách cài ứng dụng, không chứa dữ liệu của lớp.
  '/manifest.webmanifest', '/sw.js',
  // Chỉ trả tên/trường/năm học của MỘT lớp theo slug trên đường link — không có dữ liệu học
  // sinh/điểm/quỹ nào — cần công khai để màn hình đăng nhập hiện đúng tên lớp trước khi đăng nhập.
  '/api/lop-cong-khai',
]);

function isPublic(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  // Giao diện (CSS, JS) phải tải được ở trang đăng nhập, nếu không trang sẽ mất định dạng.
  // Thư mục này chỉ chứa mã hiển thị, không chứa dữ liệu của lớp.
  // Dữ liệu và mã của khu giáo viên nằm trong /giao-vien nên vẫn được bảo vệ.
  return pathname.startsWith('/assets/');
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Chặn lập chỉ mục của công cụ tìm kiếm.
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  if (isPublic(url.pathname)) return addSecurityHeaders(await next());

  const secret = env.SESSION_SECRET;
  if (!secret) {
    return new Response(
      'Chưa cấu hình biến môi trường SESSION_SECRET trên Cloudflare Pages.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  const laApi = url.pathname.startsWith('/api/');
  const session = await verifyToken(secret, readCookie(request, COOKIE_NAME));

  if (!session) {
    // Với API thì trả lỗi JSON, vì chuyển hướng sẽ làm hỏng lệnh gọi từ trang.
    if (laApi) {
      return new Response(JSON.stringify({ ok: false, loi: 'Phiên đăng nhập đã hết hạn.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      });
    }
    const to = new URL('/login.html', url);
    to.searchParams.set('next', url.pathname + url.search);
    return Response.redirect(to.toString(), 302);
  }

  // Kiểm tra phiên còn hiệu lực không (đá phiên cũ khi có thiết bị khác đăng nhập sau)
  const checkPhien = await kiemTraPhienHieuLuc(session, env);
  if (!checkPhien.hopLe) {
    const xoaCookie = `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
    if (laApi) {
      return new Response(JSON.stringify({
        ok: false,
        biDangXuat: true,
        lyDo: checkPhien.lyDo,
        loi: checkPhien.thongBao || 'Phiên đăng nhập không còn hiệu lực.',
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
          'Set-Cookie': xoaCookie,
        },
      });
    }
    const to = new URL('/login.html', url);
    if (checkPhien.lyDo === 'da_dang_nhap_noi_khac') {
      to.searchParams.set('lyDo', 'da_dang_nhap_noi_khac');
    } else {
      to.searchParams.set('next', url.pathname + url.search);
    }
    return new Response(null, {
      status: 302,
      headers: {
        Location: to.toString(),
        'Set-Cookie': xoaCookie,
        'Cache-Control': 'no-store',
      },
    });
  }

  // Khu vực giáo viên: trang /giao-vien và các API /api/gv/.
  // Vai trò "phu" (tài khoản đặc biệt: lớp trưởng, thủ quỹ...) cũng được mở khu vực này ở đây;
  // từng API bên trong tự kiểm tra tiếp xem mã đó có ĐÚNG quyền cho việc cụ thể hay không.
  const laKhuGiaoVien = url.pathname.startsWith('/giao-vien') || url.pathname.startsWith('/api/gv/');
  if (laKhuGiaoVien && session.role !== 'teacher' && session.role !== 'phu') {
    const thongDiep = 'Khu vực này chỉ dành cho giáo viên chủ nhiệm.';
    return laApi
      ? new Response(JSON.stringify({ ok: false, loi: thongDiep }), {
          status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      : new Response(thongDiep, { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Class-Role', session.role || 'student');
  return addSecurityHeaders(out);
}

// Content-Security-Policy: trang dùng script/style inline + React/Babel/Tailwind qua CDN
// nên script-src vẫn phải cho 'unsafe-inline' + 'unsafe-eval' (giới hạn kiến trúc hiện tại —
// gỡ được 2 cờ này khi nào chuyển sang build cục bộ). Dù vậy CSP vẫn chặn được: script từ
// domain lạ, object/embed, base-uri đổi hướng, và bị nhúng iframe trộm click.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com https://www.facebook.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

function addSecurityHeaders(res) {
  const out = new Response(res.body, res);
  out.headers.set('Content-Security-Policy', CSP);
  out.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  out.headers.set('X-Frame-Options', 'DENY');
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  out.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  out.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  out.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return out;
}
