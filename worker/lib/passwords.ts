import { safeEqual } from './auth'

const enc = new TextEncoder()

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0) return new Uint8Array(0)
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

export function taoSalt(bytesLength = 16): string {
  const buf = new Uint8Array(bytesLength)
  crypto.getRandomValues(buf)
  return bytesToHex(buf)
}

export async function bamMatKhau(matKhau: string, saltHex: string, iterations = 100000): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(matKhau), { name: 'PBKDF2' }, false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: hexToBytes(saltHex), iterations, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

// Như bản cũ: iterations = null trong CSDL phải bị từ chối, không được rơi về mặc định 100.000.
export async function xacMinhMatKhau(
  matKhau: string,
  storedHashHex: string | null,
  saltHex: string | null,
  iterations?: number | string | null,
): Promise<boolean> {
  if (!matKhau || !storedHashHex || !saltHex) return false
  const vong = iterations === undefined ? 100000 : iterations === null ? 0 : Number(iterations)
  if (!Number.isInteger(vong) || vong <= 0) return false
  try {
    return safeEqual(await bamMatKhau(matKhau, saltHex, vong), storedHashHex)
  } catch {
    return false
  }
}
