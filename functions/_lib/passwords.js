// Tiện ích băm và xác minh mật khẩu an toàn theo chuẩn PBKDF2-SHA256 qua Web Crypto.
// Tuyệt đối không lưu mật khẩu dạng thô (plaintext) hay SHA256 đơn thuần.
import { safeEqual } from './auth.js';

const enc = new TextEncoder();

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0) return new Uint8Array(0);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function taoSalt(bytesLength = 16) {
  const buf = new Uint8Array(bytesLength);
  crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

export async function bamMatKhau(matKhau, saltHex, iterations = 100000) {
  if (!matKhau || typeof matKhau !== 'string') throw new Error('Mật khẩu không hợp lệ');
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(matKhau),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256 bits = 32 bytes
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export async function xacMinhMatKhau(matKhau, storedHashHex, saltHex, iterations = 100000) {
  if (!matKhau || !storedHashHex || !saltHex) return false;
  try {
    const computedHash = await bamMatKhau(matKhau, saltHex, iterations);
    return safeEqual(computedHash, storedHashHex);
  } catch {
    return false;
  }
}
