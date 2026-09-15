import { b64urlDecode, b64urlEncode } from './auth'

export const HEADER_DANH_TINH = 'X-Danh-Tinh'

export function laYeuCauWebSocket(request: Request): boolean {
  return request.headers.get('Upgrade')?.toLowerCase() === 'websocket'
}

// Trình duyệt tự gửi cookie kèm WebSocket, nên phải chặn trang web lạ mở kết nối thay người dùng.
export function cungNguon(request: Request): boolean {
  const origin = request.headers.get('Origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

// Danh tính do Worker xác thực rồi mới chuyển vào Durable Object (object không nhận request trực tiếp từ Internet).
// Mã hoá base64url để tên tiếng Việt đi qua header an toàn.
export function maHoaDanhTinh(duLieu: unknown): string {
  return b64urlEncode(new TextEncoder().encode(JSON.stringify(duLieu)))
}

export function giaiMaDanhTinh<T>(giaTri: string | null): T | null {
  if (!giaTri) return null
  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecode(giaTri))) as T
  } catch {
    return null
  }
}
