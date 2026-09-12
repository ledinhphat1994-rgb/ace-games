// Tiện ích ký / kiểm tra phiên đăng nhập bằng HMAC-SHA256.
// Cookie có dạng: <payload-base64url>.<chữ-ký-base64url>
// Người dùng KHÔNG thể tự tạo cookie hợp lệ nếu không biết SESSION_SECRET.

const enc = new TextEncoder();

function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

// So sánh chuỗi theo kiểu chống dò thời gian (timing attack).
export function safeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function createToken(secret, payload, ttlSeconds) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const p = b64urlEncode(enc.encode(JSON.stringify(body)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(p)));
  return `${p}.${b64urlEncode(sig)}`;
}

export async function verifyToken(secret, token) {
  if (!token || typeof token !== 'string') return null;
  const [p, s] = token.split('.');
  if (!p || !s) return null;
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(s), enc.encode(p));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function readCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export const COOKIE_NAME = 'c10a7_session';

// Khóa định danh phiên chuẩn tắc cho toàn hệ thống (Canonical Actor Key)
// - Tài khoản Campus độc lập (bất kể vai trò student/teacher): acc:<accountId>
// - Giáo viên phiên truyền thống (không có accountId): gv:<id> hoặc 'gv:legacy' (TUYỆT ĐỐI KHÔNG dùng lopId)
// - Học sinh danh sách truyền thống: hs:<hocSinhId>
// - Tài khoản phụ: phu:<phuId>
// Tuyệt đối không dùng lopId làm định danh cá nhân; không trả về phu:0 cho tài khoản hợp lệ.
export function actorKey(phien) {
  if (!phien) return 'anon';
  // 1. Ưu tiên cao nhất: accountId định danh duy nhất cá nhân tài khoản Campus
  if (phien.accountId) {
    return `acc:${phien.accountId}`;
  }
  // 2. Phiên giáo viên truyền thống (chưa có tài khoản Campus độc lập)
  if (phien.role === 'teacher') {
    return phien.id ? `gv:${phien.id}` : 'gv:legacy';
  }
  // 3. Phiên học sinh danh sách truyền thống
  if (phien.hocSinhId) {
    return `hs:${phien.hocSinhId}`;
  }
  // 4. Phiên tài khoản phụ
  if (phien.phuId || phien.taiKhoanPhuId) {
    return `phu:${phien.phuId || phien.taiKhoanPhuId}`;
  }
  return 'anon';
}

export const khoaPhien = actorKey;
