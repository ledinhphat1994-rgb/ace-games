import { z } from 'zod'
import type { MonHoc } from '../rooms/constants'
import { MaYeuCau, type GoiAck, type GoiLoi, type GoiPong } from './common'

import { LenhSocial, type GoiSocial } from './social'

export const LenhCampus = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({ type: z.literal('chat.send'), reqId: MaYeuCau.optional(), text: z.string().max(4000) }),
  z.object({ type: z.literal('chat.delete'), reqId: MaYeuCau.optional(), id: z.number().int().positive() }),
  ...LenhSocial.options,
])
export type LenhCampus = z.infer<typeof LenhCampus>

export type VaiTroCampus = 'giao_vien' | 'hoc_sinh'

export interface TinCampus {
  id: number
  accountId: number
  ten: string
  vaiTro: VaiTroCampus
  lopTen: string | null
  noiDung: string
  /** ms theo giờ máy chủ */
  taoLuc: number
}

/** Thông tin một phòng học trên sảnh — không bao giờ chứa mật khẩu hay khoá nội bộ của chủ phòng. */
export interface PhongSanh {
  id: number
  ten: string
  moTa: string | null
  monHoc: MonHoc | null
  phamVi: 'truong' | 'lop'
  lopId: number | null
  lopTen: string | null
  chuPhongTen: string
  coMatKhau: boolean
  sucChua: number
  soNguoi: number
  /** Tên video đang phát — chỉ có với phòng công khai. */
  dangPhat: string | null
  taoLuc: number
}

export type GoiCampus =
  | {
      type: 'snapshot'
      online: number
      rooms: PhongSanh[]
      chat: TinCampus[]
      me: { accountId: number; xoaMoiTin: boolean }
      serverNow: number
    }
  | { type: 'online'; count: number }
  | { type: 'room.upsert'; room: PhongSanh }
  | { type: 'room.remove'; id: number }
  | { type: 'chat.msg'; message: TinCampus }
  | { type: 'chat.deleted'; id: number }
  | { type: 'session.replaced' }
  | GoiAck
  | GoiLoi
  | GoiPong
  | GoiSocial
