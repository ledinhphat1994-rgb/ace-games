// GET /api/kiem-tra-phien — kiểm tra phiên đăng nhập còn hiệu lực hay đã bị đá ra
import { COOKIE_NAME, readCookie, verifyToken } from '../_lib/auth.js';
import { kiemTraPhienHieuLuc } from '../_lib/api.js';

export async function onRequestGet({ request, env }) {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ ok: false, loi: 'Chưa cấu hình máy chủ.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const rawCookie = readCookie(request, COOKIE_NAME);
  const session = await verifyToken(secret, rawCookie);
  if (!session) {
    return new Response(JSON.stringify({
      ok: false,
      biDangXuat: true,
      lyDo: 'het_han',
      loi: 'Phiên đăng nhập đã hết hạn.',
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    });
  }

  const check = await kiemTraPhienHieuLuc(session, env);
  if (!check.hopLe) {
    return new Response(JSON.stringify({
      ok: false,
      biDangXuat: true,
      lyDo: check.lyDo,
      loi: check.thongBao || 'Tài khoản của em đã được đăng nhập trên một thiết bị khác. Em đã bị đăng xuất khỏi thiết bị này.',
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      },
    });
  }

  return new Response(JSON.stringify({ ok: true, hopLe: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
