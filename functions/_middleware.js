// Cổng bảo vệ toàn trang: chạy TRƯỚC mọi yêu cầu tới Cloudflare Pages.
// Chưa có phiên hợp lệ => máy chủ không trả nội dung, chỉ trả trang đăng nhập.
import { COOKIE_NAME, readCookie, verifyToken } from './_lib/auth.js';

// Những đường dẫn ai cũng vào được (nếu không thì không thể hiện trang đăng nhập).
const PUBLIC_PATHS = new Set(['/login', '/login.html', '/api/login', '/api/logout', '/favicon.ico', '/robots.txt']);

function isPublic(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return pathname.startsWith('/assets/login');
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

  const session = await verifyToken(secret, readCookie(request, COOKIE_NAME));
  if (!session) {
    const to = new URL('/login.html', url);
    to.searchParams.set('next', url.pathname + url.search);
    return Response.redirect(to.toString(), 302);
  }

  // Khu vực /giao-vien chỉ dành cho mã của giáo viên.
  if (url.pathname.startsWith('/giao-vien') && session.role !== 'teacher') {
    return new Response('Khu vực này chỉ dành cho giáo viên chủ nhiệm.', {
      status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Class-Role', session.role || 'student');
  return addSecurityHeaders(out);
}

function addSecurityHeaders(res) {
  const out = new Response(res.body, res);
  out.headers.set('X-Frame-Options', 'DENY');
  out.headers.set('X-Content-Type-Options', 'nosniff');
  out.headers.set('Referrer-Policy', 'no-referrer');
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  out.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  return out;
}
