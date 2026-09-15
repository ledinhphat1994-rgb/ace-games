import { TEN_CAMPUS } from '../campus/danh-tinh'
import { actorKey, cookiePhien, cookieXoa, createToken, SESSION_TTL, type Phien } from '../lib/auth'
import { json, loi } from '../lib/http'
import { xacMinhMatKhau } from '../lib/passwords'
import { laGiaoVienDaDuyet, laQuanTriTruong } from '../lib/scope'
import { kiemTraPhien, layPhien } from '../lib/session'

// Cùng ngưỡng và cùng dạng khoá KV với functions/api/login.js của bản cũ.
const MAX_TRIES_IP = 30
const MAX_TRIES_TEN = 8
const WINDOW = 600

const laHttps = (request: Request) => new URL(request.url).protocol === 'https:'

async function bamNgan(chuoi: string): Promise<string> {
  const du = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chuoi))
  return [...new Uint8Array(du)]
    .slice(0, 10)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function thuQuaNhieu(env: Env, ip: string, ten: string): Promise<boolean> {
  const keyIp = `login:ip:${ip}`
  const nIp = parseInt((await env.RATE_LIMIT.get(keyIp)) || '0', 10)
  if (nIp >= MAX_TRIES_IP) return true

  const keyTen = `login:ma:${await bamNgan(ten)}`
  const nTen = parseInt((await env.RATE_LIMIT.get(keyTen)) || '0', 10)
  if (nTen >= MAX_TRIES_TEN) return true

  await env.RATE_LIMIT.put(keyIp, String(nIp + 1), { expirationTtl: WINDOW })
  await env.RATE_LIMIT.put(keyTen, String(nTen + 1), { expirationTtl: WINDOW })
  return false
}

async function xoaDemThu(env: Env, ip: string, ten: string): Promise<void> {
  await env.RATE_LIMIT.delete(`login:ip:${ip}`)
  await env.RATE_LIMIT.delete(`login:ma:${await bamNgan(ten)}`)
}

interface DongDangNhap {
  id: number
  ten_dang_nhap: string
  ten_hien_thi: string | null
  mat_khau_hash: string | null
  salt: string | null
  iterations: number | null
  vai_tro: string | null
  teacher_pending: number | null
  hoc_sinh_id: number | null
  lop_id: number | null
  dang_hoat_dong: number | null
}

export async function dangNhap(
  request: Request,
  env: Env,
  ctx?: { waitUntil(promise: Promise<unknown>): void },
): Promise<Response> {
  if (!env.SESSION_SECRET) return loi('Máy chủ chưa được cấu hình.', 500)

  let username = ''
  let password = ''
  try {
    const body = (await request.json()) as Record<string, unknown>
    username = String(body.username || body.tenDangNhap || '').trim().toLowerCase()
    password = String(body.password || body.matKhau || '').trim()
  } catch {
    return loi('Dữ liệu gửi lên không hợp lệ.')
  }
  if (!username || !password) return loi('Vui lòng nhập tên đăng nhập và mật khẩu.')

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  if (await thuQuaNhieu(env, ip, username)) {
    return loi('Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 10 phút.', 429)
  }

  const user = await env.DB.prepare(
    `SELECT id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
            vai_tro, teacher_pending, hoc_sinh_id, lop_id, dang_hoat_dong
       FROM tai_khoan_campus WHERE ten_dang_nhap = ?1`,
  )
    .bind(username)
    .first<DongDangNhap>()
    .catch(() => null)

  const hopLe = user?.dang_hoat_dong
    ? await xacMinhMatKhau(password, user.mat_khau_hash, user.salt, user.iterations)
    : false
  if (!user || !hopLe) return loi('Tên đăng nhập hoặc mật khẩu không chính xác.', 401)

  await xoaDemThu(env, ip, username)
  const phienId = crypto.randomUUID()
  await env.DB.prepare('UPDATE tai_khoan_campus SET thiet_bi = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2')
    .bind(phienId, user.id)
    .run()
    .catch(() => {})

  // Đóng ngay kết nối Campus của phiên cũ; bản cũ chỉ phát hiện ở lần gọi API kế tiếp.
  const baoCampus = env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    .dangNhapMoi(user.id, phienId)
    .catch((e: unknown) => console.error('Không báo được CampusDO về lần đăng nhập mới:', e))
  if (ctx) ctx.waitUntil(baoCampus)
  else await baoCampus

  const payload: Phien = {
    accountId: user.id,
    role: user.vai_tro,
    ten: user.ten_hien_thi,
    username: user.ten_dang_nhap,
    teacherPending: Boolean(user.teacher_pending),
    hocSinhId: user.hoc_sinh_id || null,
    lopId: user.lop_id || null,
    phienId,
  }
  const token = await createToken(env.SESSION_SECRET, payload, SESSION_TTL)

  return json(
    {
      ok: true,
      user: {
        id: user.id,
        username: user.ten_dang_nhap,
        ten: user.ten_hien_thi,
        role: user.vai_tro,
        teacherPending: payload.teacherPending,
      },
    },
    200,
    { 'Set-Cookie': cookiePhien(token, laHttps(request)) },
  )
}

export async function whoami(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) {
    const headers = kq.biDaRa ? { 'Set-Cookie': cookieXoa(laHttps(request)) } : undefined
    return json({ ok: false, loi: kq.thongBao, lyDo: kq.lyDo, biDangXuat: kq.biDaRa }, 401, headers)
  }

  const { taiKhoan: tk, phien } = kq
  const isSchoolAdmin = laQuanTriTruong(tk)
  const isVerifiedTeacher = laGiaoVienDaDuyet(tk)
  const isLinkedStudent = Boolean(tk.hocSinhId && tk.lopId)
  const lop =
    tk.lopId && (isVerifiedTeacher || isLinkedStudent)
      ? await env.DB.prepare('SELECT id, ten, slug, nam_hoc AS namHoc, truong FROM lop WHERE id = ?1')
          .bind(tk.lopId)
          .first<{ id: number; ten: string; slug: string | null; namHoc: string | null; truong: string | null }>()
          .catch(() => null)
      : null

  return json({
    ok: true,
    accountId: tk.id,
    username: tk.username,
    ten: tk.ten,
    role: tk.role,
    avatar: tk.avatar,
    tieuDeHoSo: tk.tieuDeHoSo,
    teacherPending: tk.teacherPending,
    isSchoolAdmin,
    isVerifiedTeacher,
    isLinkedStudent,
    hocSinhId: tk.hocSinhId,
    lopId: tk.lopId,
    lop,
    actorKey: actorKey(phien),
  })
}

// Không gỡ thiet_bi: gỡ đi sẽ làm token cũ ở thiết bị đã bị đá ra hợp lệ trở lại.
export function dangXuat(request: Request): Response {
  return json({ ok: true }, 200, { 'Set-Cookie': cookieXoa(laHttps(request)) })
}
