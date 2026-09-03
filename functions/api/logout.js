import { COOKIE_NAME } from '../_lib/auth.js';

export function onRequest({ request }) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL('/login.html', url).toString(),
      'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      'Cache-Control': 'no-store',
    },
  });
}
