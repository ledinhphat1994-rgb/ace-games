import type { TrangThaiGoogle } from '@shared/protocol/google'

export interface NguoiDung {
  accountId: number
  username: string
  ten: string | null
  role: string | null
  avatar: string | null
  tieuDeHoSo: string | null
  teacherPending: boolean
  isSchoolAdmin: boolean
  isVerifiedTeacher: boolean
  isLinkedStudent: boolean
  hocSinhId: number | null
  lopId: number | null
  lop: { id: number; ten: string; slug: string | null; namHoc: string | null; truong: string | null } | null
  actorKey: string
  ngaySinh?: string | null
  noiSinhSong?: string | null
  sdtLienHe?: string | null
  soThich?: string | null
  /** Vừa đăng nhập bằng Google (≤ 15 phút): đặt mật khẩu mới không cần mật khẩu cũ. */
  datMatKhauKhongCanCu?: boolean
}

export function layNguoiDungMacDinh(): NguoiDung {
  let avatar: string | null = null
  let ten = 'Kỳ Thủ'
  let tieuDeHoSo = 'Kỳ thủ Ace Games'
  let actorKey = 'guest_kythu'

  if (typeof window !== 'undefined') {
    try {
      const savedAvatar = localStorage.getItem('dc_guest_avatar')
      if (savedAvatar) avatar = savedAvatar
      const savedTen = localStorage.getItem('dc_guest_name')
      if (savedTen) ten = savedTen
      const savedTieuDe = localStorage.getItem('dc_guest_status')
      if (savedTieuDe) tieuDeHoSo = savedTieuDe
      let savedKey = sessionStorage.getItem('dc_guest_key')
      if (!savedKey) {
        savedKey = localStorage.getItem('dc_guest_key')
      }
      if (!savedKey) {
        savedKey = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
        try { sessionStorage.setItem('dc_guest_key', savedKey) } catch {}
        try { localStorage.setItem('dc_guest_key', savedKey) } catch {}
      } else {
        try { sessionStorage.setItem('dc_guest_key', savedKey) } catch {}
      }
      actorKey = savedKey
    } catch {}
  }

  return {
    accountId: 0,
    username: 'kythu',
    ten,
    role: 'khach',
    avatar,
    tieuDeHoSo,
    teacherPending: false,
    isSchoolAdmin: false,
    isVerifiedTeacher: false,
    isLinkedStudent: false,
    hocSinhId: null,
    lopId: null,
    lop: null,
    actorKey,
  }
}

export function doiTenKhach(tenMoi: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('dc_guest_name', tenMoi.trim())
    } catch {}
  }
}

export const NGUOI_DUNG_MAC_DINH: NguoiDung = layNguoiDungMacDinh()


export class LoiApi extends Error {
  readonly status: number
  readonly lyDo?: string

  constructor(message: string, status: number, lyDo?: string) {
    super(message)
    this.status = status
    this.lyDo = lyDo
  }
}

interface PhanHoiChung {
  ok?: boolean
  loi?: string
  lyDo?: string
}

async function goiApi<T>(duongDan: string, init?: RequestInit): Promise<T> {
  const res = await fetch(duongDan, { credentials: 'same-origin', ...init })
  const duLieu = (await res.json().catch(() => null)) as (PhanHoiChung & T) | null
  if (!res.ok || !duLieu?.ok) {
    throw new LoiApi(duLieu?.loi || `Máy chủ lỗi (${res.status}).`, res.status, duLieu?.lyDo)
  }
  return duLieu
}

export function layNguoiDung(): Promise<NguoiDung> {
  return goiApi<NguoiDung>('/api/whoami')
}

export type KetQuaPhien = { nguoiDung: NguoiDung; thongBao?: undefined } | { nguoiDung: null; thongBao?: string }

// 401 là trạng thái bình thường (chưa đăng nhập / vừa bị đăng xuất), không phải lỗi; chỉ lỗi mạng hoặc máy chủ mới ném ra.
export async function layPhienHienTai(): Promise<KetQuaPhien> {
  try {
    return { nguoiDung: await layNguoiDung() }
  } catch (err) {
    if (err instanceof LoiApi && err.status === 401) {
      return { nguoiDung: null, thongBao: err.lyDo && err.lyDo !== 'chua_dang_nhap' ? err.message : undefined }
    }
    throw err
  }
}

export function dangNhap(username: string, password: string): Promise<unknown> {
  return goiApi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export function dangXuat(): Promise<unknown> {
  return goiApi('/api/logout', { method: 'POST' })
}

export function dangKy(duLieu: {
  username: string
  password: string
  tenHienThi?: string
  vaiTro?: string
  teacherCode?: string
  classCode?: string
}): Promise<{ ok: boolean; message: string }> {
  return goiApi('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
}

export function yeuCauQuenMatKhau(username: string): Promise<{ ok: boolean; message: string }> {
  return goiApi('/api/forgot-password/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
}

export function quenMatKhau(duLieu: {
  username: string
  maXacNhan: string
  matKhauMoi: string
}): Promise<{ ok: boolean; message: string }> {
  return goiApi('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
}

export async function doiAvatar(avatarUrl: string): Promise<{ ok: boolean; avatar: string }> {
  try {
    const res = await goiApi<{ ok: boolean; avatar: string }>('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl }),
    })
    try {
      localStorage.setItem('dc_guest_avatar', avatarUrl)
    } catch {}
    return res
  } catch (err) {
    if (err instanceof LoiApi && (err.status === 401 || err.status === 403)) {
      try {
        localStorage.setItem('dc_guest_avatar', avatarUrl)
      } catch {}
      return { ok: true, avatar: avatarUrl }
    }
    throw err
  }
}

export async function capNhatHoSo(duLieu: {
  tenHienThi?: string
  tieuDeHoSo?: string
  ngaySinh?: string | null
  noiSinhSong?: string | null
  sdtLienHe?: string | null
  soThich?: string | null
}): Promise<{ ok: boolean }> {
  try {
    const res = await goiApi<{ ok: boolean }>('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duLieu),
    })
    if (duLieu.tenHienThi) {
      try {
        localStorage.setItem('dc_guest_name', duLieu.tenHienThi)
      } catch {}
    }
    if (duLieu.tieuDeHoSo !== undefined && duLieu.tieuDeHoSo !== null) {
      try {
        localStorage.setItem('dc_guest_status', duLieu.tieuDeHoSo)
      } catch {}
    }
    return res
  } catch (err) {
    if (err instanceof LoiApi && (err.status === 401 || err.status === 403)) {
      if (duLieu.tenHienThi) {
        try {
          localStorage.setItem('dc_guest_name', duLieu.tenHienThi)
        } catch {}
      }
      if (duLieu.tieuDeHoSo !== undefined && duLieu.tieuDeHoSo !== null) {
        try {
          localStorage.setItem('dc_guest_status', duLieu.tieuDeHoSo)
        } catch {}
      }
      return { ok: true }
    }
    throw err
  }
}

export function layTrangThaiGoogle(): Promise<TrangThaiGoogle> {
  return goiApi<TrangThaiGoogle>('/api/auth/google/status')
}

export function goLienKetGoogle(): Promise<{ ok: boolean }> {
  return goiApi('/api/auth/google/unlink', { method: 'POST' })
}

export function doiMatKhau(duLieu: {
  matKhauCu?: string
  matKhauMoi: string
}): Promise<{ ok: boolean; message: string }> {
  return goiApi('/api/profile/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
}

export async function layHoSoNguoiDung(accountId: number): Promise<import('@shared/protocol/social').HoSoNguoiDung> {
  const res = await goiApi<{ ok: boolean; profile: import('@shared/protocol/social').HoSoNguoiDung }>(`/api/social/profile/${accountId}`)
  return res.profile
}

export async function timKiemNguoiDung(tuKhoa: string): Promise<import('@shared/protocol/social').SearchResultItem[]> {
  const params = new URLSearchParams({ q: tuKhoa })
  const res = await goiApi<{ ok: boolean; results: import('@shared/protocol/social').SearchResultItem[] }>(`/api/social/search?${params}`)
  return res.results || []
}

export interface LayTinNhanRiengResult {
  messages: import('@shared/protocol/social').DirectMessage[]
  reactions?: Record<number, string[]>
  reactionDetails?: Record<number, import('@shared/protocol/campus').ReactionDetail[]>
}

export async function layTinNhanRieng(friendId: number): Promise<LayTinNhanRiengResult> {
  const res = await goiApi<{
    ok: boolean
    messages: import('@shared/protocol/social').DirectMessage[]
    reactions?: Record<number, string[]>
    reactionDetails?: Record<number, import('@shared/protocol/campus').ReactionDetail[]>
  }>(`/api/social/messages/${friendId}`)
  return {
    messages: res.messages || [],
    reactions: res.reactions || {},
    reactionDetails: res.reactionDetails || {},
  }
}

export async function guiTinNhanRieng(friendId: number, noiDung: string): Promise<import('@shared/protocol/social').DirectMessage> {
  const res = await goiApi<{ ok: boolean; message: import('@shared/protocol/social').DirectMessage }>(`/api/social/messages/${friendId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noiDung }),
  })
  return res.message
}

export interface ThaoTacReactionInput {
  action?: 'add' | 'remove' | 'replace' | 'increment'
  emoji?: string
  oldEmoji?: string
  emojis?: string[]
}

export async function guiReactionTinNhanRieng(
  friendId: number,
  messageId: number,
  data: string[] | ThaoTacReactionInput,
): Promise<{ ok: boolean; messageId: number; reactions: string[]; reactionDetails?: import('@shared/protocol/campus').ReactionDetail[] }> {
  const payload = Array.isArray(data) ? { messageId, emojis: data } : { messageId, ...data }
  return await goiApi<{ ok: boolean; messageId: number; reactions: string[]; reactionDetails?: import('@shared/protocol/campus').ReactionDetail[] }>(
    `/api/social/messages/${friendId}/reaction`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}
export async function xoaTinNhanRieng(
  friendId: number,
  messageId: number,
): Promise<{ ok: boolean; messageId: number }> {
  return await goiApi<{ ok: boolean; messageId: number }>(
    `/api/social/messages/${friendId}/${messageId}`,
    { method: 'DELETE' },
  )
}
export async function guiReactionCampusChat(
  messageId: number,
  data: string[] | ThaoTacReactionInput,
): Promise<{ ok: boolean; messageId: number; reactions: string[]; reactionDetails?: import('@shared/protocol/campus').ReactionDetail[] }> {
  const payload = Array.isArray(data) ? { messageId, emojis: data } : { messageId, ...data }
  return await goiApi<{ ok: boolean; messageId: number; reactions: string[]; reactionDetails?: import('@shared/protocol/campus').ReactionDetail[] }>(
    '/api/campus/chat/reaction',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}
