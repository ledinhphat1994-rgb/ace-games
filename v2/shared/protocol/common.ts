import { z } from 'zod'

export const MaYeuCau = z.string().min(1).max(40)

// Mã lỗi ổn định để giao diện và test bắt theo code, không phụ thuộc câu thông báo (giống contract v1 của bản cũ).
export type MaLoi =
  | 'invalid_payload'
  | 'rate_limited'
  | 'forbidden'
  | 'not_found'
  | 'server_error'
  | 'staff_only'
  | 'capability_off'
  | 'grant_required'
  | 'admission_required'
  | 'wrong_password'
  | 'room_full'
  | 'room_banned'
  | 'room_closed'
  | 'conflict'
  | 'queue_full'
  | 'suggestions_full'

export interface GoiLoi {
  type: 'error'
  reqId?: string
  code: MaLoi
  message: string
}

export interface GoiAck {
  type: 'ack'
  reqId?: string
}

/** Trả lời ping JSON: t = mốc client gửi lên, s = giờ máy chủ (ms) để client tính lệch đồng hồ. */
export interface GoiPong {
  type: 'pong'
  t: number
  s: number
}

/** Mã đóng WebSocket do máy chủ chủ động đóng. */
export const MA_DONG_SOCKET = {
  PHIEN_BI_THAY: 4001,
  BI_CHAN: 4003,
  PHONG_DA_DONG: 4004,
  PHONG_DAY: 4009,
} as const

/** Chuỗi giữ kết nối: máy chủ trả lời tự động, không đánh thức Durable Object. */
export const PING_GIU_KET_NOI = 'ping'
export const PONG_GIU_KET_NOI = 'pong'

function laKyTuAn(ma: number): boolean {
  return (
    (ma < 32 && ma !== 10) ||
    ma === 127 ||
    (ma >= 0x200b && ma <= 0x200f) ||
    (ma >= 0x2028 && ma <= 0x202e) ||
    (ma >= 0x2066 && ma <= 0x2069)
  )
}

// Bỏ ký tự điều khiển và ký tự ẩn đảo chiều chữ (giữ xuống dòng), gộp dòng trống thừa, cắt khoảng trắng hai đầu.
export function lamSachVanBan(v: string): string {
  let kq = ''
  for (const kyTu of v.replace(/\r\n?/g, '\n')) {
    if (!laKyTuAn(kyTu.codePointAt(0) ?? 0)) kq += kyTu
  }
  return kq.replace(/\n{3,}/g, '\n\n').trim()
}
