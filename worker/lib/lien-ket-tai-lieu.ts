import { b64urlDecode, b64urlEncode } from './auth'

// Liên kết xem tài liệu có chữ ký cho trình xem ngoài (Office Online / Google Docs Viewer). Các trình xem này tự tải tệp
// từ máy chủ của họ nên không mang cookie phiên: chỉ cho qua khi có chữ ký HMAC còn hạn, gắn đúng phòng và đúng tài
// liệu. Khoá tách miền (`doc-view:`) để chữ ký này không bao giờ dùng được như một phiên đăng nhập.

/** Hạn của một liên kết xem (giây) — đủ cho trình xem tải tệp, ngắn để link lộ ra ngoài nhanh chóng vô hiệu. */
export const THOI_HAN_LIEN_KET_XEM_GIAY = 30 * 60

const enc = new TextEncoder()

function khoaKy(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(`doc-view:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

const noiDungKy = (roomId: number, docId: number, het: number) => enc.encode(`${roomId}:${docId}:${het}`)

/** Ký liên kết xem cho đúng một tài liệu của một phòng; `het` là thời điểm hết hạn (giây Unix). */
export async function kyLienKetXem(
  secret: string,
  roomId: number,
  docId: number,
  nowMs = Date.now(),
): Promise<{ het: number; ky: string }> {
  const het = Math.floor(nowMs / 1000) + THOI_HAN_LIEN_KET_XEM_GIAY
  const chuKy = await crypto.subtle.sign('HMAC', await khoaKy(secret), noiDungKy(roomId, docId, het))
  return { het, ky: b64urlEncode(new Uint8Array(chuKy)) }
}

/** Chữ ký đúng phòng + tài liệu, chưa hết hạn và không đặt hạn xa hơn mức máy chủ cấp. */
export async function kiemTraLienKetXem(
  secret: string | undefined,
  roomId: number,
  docId: number,
  het: string | undefined,
  ky: string | undefined,
  nowMs = Date.now(),
): Promise<boolean> {
  if (!secret || !het || !ky || !/^\d{1,12}$/.test(het)) return false
  const hetGiay = Number(het)
  const bayGio = Math.floor(nowMs / 1000)
  if (hetGiay < bayGio || hetGiay > bayGio + THOI_HAN_LIEN_KET_XEM_GIAY) return false
  try {
    return await crypto.subtle.verify('HMAC', await khoaKy(secret), b64urlDecode(ky), noiDungKy(roomId, docId, hetGiay))
  } catch {
    return false
  }
}
