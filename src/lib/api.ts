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
}

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

export function doiAvatar(avatarUrl: string): Promise<{ ok: boolean; avatar: string }> {
  return goiApi('/api/profile/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarUrl }),
  })
}

export function capNhatHoSo(duLieu: {
  tenHienThi?: string
  tieuDeHoSo?: string
}): Promise<{ ok: boolean }> {
  return goiApi('/api/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
}

export function layTrangThaiGoogle(): Promise<TrangThaiGoogle> {
  return goiApi<TrangThaiGoogle>('/api/auth/google/status')
}

export function goLienKetGoogle(): Promise<{ ok: boolean }> {
  return goiApi('/api/auth/google/unlink', { method: 'POST' })
}

export function doiMatKhau(duLieu: {
  matKhauCu: string
  matKhauMoi: string
}): Promise<{ ok: boolean; message: string }> {
  return goiApi('/api/profile/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duLieu),
  })
}

export async function timKiemNguoiDung(tuKhoa: string): Promise<import('@shared/protocol/social').SearchResultItem[]> {
  const params = new URLSearchParams({ q: tuKhoa })
  const res = await goiApi<{ ok: boolean; results: import('@shared/protocol/social').SearchResultItem[] }>(`/api/social/search?${params}`)
  return res.results || []
}
