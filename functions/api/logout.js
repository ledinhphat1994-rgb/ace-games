import { COOKIE_NAME, readCookie, verifyToken } from '../_lib/auth.js';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (env?.SESSION_SECRET && env?.DB) {
    try {
      const raw = readCookie(request, COOKIE_NAME);
      const session = await verifyToken(env.SESSION_SECRET, raw);
      if (session?.phienId) {
        if (session.hocSinhId) {
          await env.DB.prepare(
            'UPDATE ma_ca_nhan SET thiet_bi = NULL WHERE hoc_sinh_id = ?1 AND thiet_bi = ?2'
          ).bind(session.hocSinhId, session.phienId).run().catch(() => {});
        } else if (session.phuId) {
          await env.DB.prepare(
            'UPDATE tai_khoan_phu SET thiet_bi = NULL WHERE id = ?1 AND thiet_bi = ?2'
          ).bind(session.phuId, session.phienId).run().catch(() => {});
        }
      }
    } catch {}
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/login.html', url).toString(),
      'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      'Cache-Control': 'no-store',
    },
  });
}
