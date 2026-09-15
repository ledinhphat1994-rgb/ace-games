export interface NguoiDung {
  accountId: number
  username: string
  ten: string | null
  role: string | null
  avatar: string | null
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
