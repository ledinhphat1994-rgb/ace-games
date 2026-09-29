// Thiết lập ván Rắn Săn Mồi (PvE): độ khó + số rắn máy. Chọn được ở sảnh lẫn trong ván; nhớ trên thiết bị này
// nên vào lại vẫn giữ lựa chọn. Giá trị lạ/cũ trong bộ nhớ trình duyệt luôn quay về mặc định (không tin dữ liệu đọc ra).

import type { CapDoMay } from '../cap-do-may'

export const SO_MAY_CHON = [4, 6, 8, 12, 16, 20] as const

export interface ThietLapRan {
  capDo: CapDoMay
  soMay: number
}

export const THIET_LAP_MAC_DINH: ThietLapRan = { capDo: 'medium', soMay: 6 }

const KHOA = 'c10a7:ran-san-moi:thiet-lap'

const laCapDo = (v: unknown): v is CapDoMay => v === 'easy' || v === 'medium' || v === 'hard'

/** Chuẩn hoá một giá trị bất kỳ về thiết lập hợp lệ. */
export function chuanHoaThietLap(gia: unknown): ThietLapRan {
  const o = (gia && typeof gia === 'object' ? gia : {}) as Partial<Record<keyof ThietLapRan, unknown>>
  return {
    capDo: laCapDo(o.capDo) ? o.capDo : THIET_LAP_MAC_DINH.capDo,
    soMay: (SO_MAY_CHON as readonly unknown[]).includes(o.soMay) ? (o.soMay as number) : THIET_LAP_MAC_DINH.soMay,
  }
}

export function docThietLap(): ThietLapRan {
  try {
    return chuanHoaThietLap(JSON.parse(localStorage.getItem(KHOA) ?? 'null'))
  } catch {
    return THIET_LAP_MAC_DINH
  }
}

export function ghiThietLap(t: ThietLapRan): void {
  try {
    localStorage.setItem(KHOA, JSON.stringify(t))
  } catch {
    // Trình duyệt chặn bộ nhớ: lựa chọn chỉ có hiệu lực trong phiên này.
  }
}
