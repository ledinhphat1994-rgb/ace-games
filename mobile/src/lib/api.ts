export const API_BASE_URL = 'https://gdtxdinhquan.com'

export interface NguoiDungNative {
  accountId: number
  username: string
  ten: string | null
  role: string | null
  avatar: string | null
  tieuDeHoSo: string | null
  actorKey: string
  lop?: { id: number; ten: string } | null
}

export interface ApiResponse<T> {
  ok: boolean
  loi?: string
  data?: T
}

let sessionCookieHeader: string | null = null

export function setSessionCookie(cookie: string | null) {
  sessionCookieHeader = cookie
}

export async function goiApiNative<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (sessionCookieHeader) {
    headers.set('Cookie', sessionCookieHeader)
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Lưu cookie session trả về nếu có
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) {
    sessionCookieHeader = setCookie
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.loi || `Lỗi máy chủ (${res.status})`)
  }
  return data as T
}

export async function layNguoiDungNative(): Promise<NguoiDungNative | null> {
  try {
    const res = await goiApiNative<{ ok: boolean; nguoiDung?: NguoiDungNative }>('/api/whoami')
    return res.nguoiDung || null
  } catch {
    return null
  }
}
