// functions/_lib/turnstile.js
// Xác minh Cloudflare Turnstile tập trung, bảo vệ chống bot tự động
// - Không cho phép client-controlled test token trong môi trường sản xuất
// - Fail-closed: Nếu cấu hình TURNSTILE_SECRET_KEY mà kiểm tra lỗi mạng -> từ chối (không fail-open)

export async function turnstileHopLe(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;

  const isLocalOrTest = (
    env.APP_ENV === 'test' ||
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip === '::1' ||
    env.TURNSTILE_SECRET_KEY.startsWith('1x000000')
  );

  if (!token) {
    if (isLocalOrTest) return true;
    return false;
  }

  // Bypass test token CHỈ ĐƯỢC PHÉP khi môi trường máy chủ đã cấu hình rõ là test/local
  if (isLocalOrTest && (token === 'test-bypass' || token === 'dummy')) {
    return true;
  }

  try {
    const form = new FormData();
    form.append('secret', env.TURNSTILE_SECRET_KEY);
    form.append('response', token);
    form.append('remoteip', ip);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const kq = await res.json();
    return Boolean(kq.success);
  } catch (err) {
    console.error('Turnstile verification network error:', err);
    // Fail closed: Không tự động cho qua khi đã cấu hình bot protection nhưng gặp lỗi mạng
    return false;
  }
}
