// Thống kê nhanh của sảnh cho Quản trị trường (Platform Core — Discovery & Lobby).
// Máy chủ chỉ trả phần lịch sử 7 ngày (D1, theo ngày giờ trường UTC+7); số liệu đang diễn ra
// (phòng/bàn đang mở, người đang học/chơi/xem) client lấy thẳng từ sảnh thời gian thực.

import type { GameType } from './game'

export const LOAI_THONG_KE_SANH = ['hoc_tap', 'game'] as const
export type LoaiThongKeSanh = (typeof LOAI_THONG_KE_SANH)[number]

/** Số ngày lịch sử (kể cả hôm nay). */
export const SO_NGAY_THONG_KE = 7

// Record buộc liệt kê đủ mọi GameType: thêm trò mới mà quên ở đây thì typecheck báo lỗi.
const CO_THONG_KE: Record<GameType, true> = { chess: true, xiangqi: true, caro_15: true, solo_memory: true, solo_snake: true }
export const TRO_CHOI_THONG_KE = Object.keys(CO_THONG_KE) as GameType[]
export const laTroChoiThongKe = (v: unknown): v is GameType => typeof v === 'string' && Object.hasOwn(CO_THONG_KE, v)

export interface SoLieuHocTap {
  phongTao: number
  /** Số học sinh khác nhau có hoạt động học. */
  nguoiHoc: number
  buoiHoc: number
  phutHoc: number
}

export interface NgayHocTap extends SoLieuHocTap {
  /** YYYY-MM-DD theo giờ trường. */
  ngay: string
}

export interface LopHocTap {
  lopId: number
  ten: string
  siSo: number
  hocHomNay: number
  hoc7Ngay: number
}

export interface ThongKeHocTap {
  loai: 'hoc_tap'
  homNay: string
  /** Đủ 7 ngày, cũ → mới (ngày không có số liệu là 0). */
  theoNgay: NgayHocTap[]
  tongHomNay: SoLieuHocTap
  tong7Ngay: SoLieuHocTap
  theoLop: LopHocTap[]
}

export interface SoLieuGame {
  /** Ván đấu 1v1 đã kết thúc + lượt chơi đơn đã mở. */
  van: number
  /** Số người chơi khác nhau. */
  nguoiChoi: number
}

export interface NgayGame extends SoLieuGame {
  ngay: string
}

export interface TroChoiThongKe {
  gameType: GameType
  homNay: SoLieuGame
  bayNgay: SoLieuGame
}

export interface ThongKeGame {
  loai: 'game'
  /** null: mọi trò chơi. */
  gameType: GameType | null
  homNay: string
  theoNgay: NgayGame[]
  tongHomNay: SoLieuGame
  tong7Ngay: SoLieuGame
  theoTroChoi: TroChoiThongKe[]
}

export type ThongKeSanh = ThongKeHocTap | ThongKeGame
