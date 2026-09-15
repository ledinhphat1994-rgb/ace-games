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

export async function dangKy(request: Request, env: Env): Promise<Response> {
  let body: {
    username?: string
    password?: string
    tenHienThi?: string
    vaiTro?: string
    teacherCode?: string
    classCode?: string
  }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const username = String(body.username || '').trim().toLowerCase()
  const password = String(body.password || '').trim()
  const tenHienThi = String(body.tenHienThi || username).trim()
  const vaiTro = body.vaiTro === 'teacher' ? 'teacher' : 'student'

  if (!username || username.length < 3 || username.length > 32) {
    return loi('Tên đăng nhập phải từ 3 đến 32 ký tự.', 400)
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return loi('Tên đăng nhập chỉ chứa chữ cái, số, dấu chấm, gạch ngang hoặc gạch dưới.', 400)
  }
  if (!password || password.length < 6) {
    return loi('Mật khẩu phải có ít nhất 6 ký tự.', 400)
  }

  // Kiểm tra tên đăng nhập đã tồn tại
  const tonTai = await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
    .bind(username)
    .first<{ id: number }>()
    .catch(() => null)
  if (tonTai) {
    return loi('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.', 400)
  }

  let teacherPending = 0
  if (vaiTro === 'teacher') {
    if (env.TEACHER_CODE && body.teacherCode?.trim() === env.TEACHER_CODE.trim()) {
      teacherPending = 0
    } else {
      teacherPending = 1
    }
  }

  const { taoSalt, bamMatKhau } = await import('../lib/passwords')
  const salt = taoSalt()
  const matKhauHash = await bamMatKhau(password, salt, 100000)

  // Identity invariant: Campus account != verified class member.
  // lop_id mặc định là NULL. Chỉ gán khi cung cấp mã mời lớp hợp lệ.
  let lopId: number | null = null
  if (body.classCode && env.CLASS_CODE && body.classCode.trim() === env.CLASS_CODE.trim()) {
    const lopDefault = await env.DB.prepare('SELECT id FROM lop LIMIT 1')
      .first<{ id: number }>()
      .catch(() => null)
    lopId = lopDefault?.id ?? null
  }

  await env.DB.prepare(`
    INSERT INTO tai_khoan_campus (
      ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
      vai_tro, teacher_pending, lop_id, dang_hoat_dong
    ) VALUES (?1, ?2, ?3, ?4, 100000, ?5, ?6, ?7, 1)
  `)
    .bind(username, tenHienThi, matKhauHash, salt, vaiTro, teacherPending, lopId)
    .run()

  return json({
    ok: true,
    message: teacherPending
      ? 'Đăng ký tài khoản giáo viên thành công! Vui lòng chờ duyệt hoặc liên hệ ban quản trị.'
      : 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
  })
}

/** Yêu cầu mã khôi phục mật khẩu (OWASP compliant: single-use, 15-phút TTL, generic response) */
export async function yeuCauQuenMatKhau(request: Request, env: Env): Promise<Response> {
  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const username = String(body.username || '').trim().toLowerCase()
  if (!username) return loi('Vui lòng nhập tên đăng nhập.', 400)

  // Rate limit: tối đa 5 yêu cầu / 15 phút từ 1 IP
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  const ipRateKey = `rate:qmk_req:${ip}`
  const ipCount = parseInt((await env.RATE_LIMIT.get(ipRateKey)) || '0', 10)
  if (ipCount >= 5) {
    return loi('Bạn đã yêu cầu tạo mã quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429)
  }
  await env.RATE_LIMIT.put(ipRateKey, String(ipCount + 1), { expirationTtl: 900 })

  const user = await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
    .bind(username)
    .first<{ id: number }>()
    .catch(() => null)

  const genericMsg = 'Nếu tài khoản tồn tại, mã xác nhận 6 số đã được kích hoạt (hạn 15 phút). Hãy liên hệ Giáo viên/Quản trị viên để nhận mã.'

  if (!user) {
    return json({ ok: true, message: genericMsg })
  }

  // Tạo mã ngẫu nhiên 6 chữ số
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (100000 + (array[0] % 900000)).toString()

  // Lưu vào KV RATE_LIMIT với TTL 15 phút (900 giây)
  await env.RATE_LIMIT.put(
    `pwd_reset:${username}`,
    JSON.stringify({ code, accountId: user.id, attempts: 0 }),
    { expirationTtl: 900 }
  )

  return json({ ok: true, message: genericMsg })
}

/** Giáo viên / Admin tạo mã khôi phục cho học sinh trực tiếp */
export async function taoMaResetChoHocSinh(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)
  if (kq.taiKhoan.role !== 'teacher' && !kq.taiKhoan.laAdminTruong) {
    return loi('Chỉ giáo viên hoặc quản trị viên mới có quyền tạo mã khôi phục cho học sinh.', 403)
  }

  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }
  const username = String(body.username || '').trim().toLowerCase()
  if (!username) return loi('Thiếu tên đăng nhập.', 400)

  const user = await env.DB.prepare('SELECT id, ten_hien_thi FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
    .bind(username)
    .first<{ id: number; ten_hien_thi: string }>()
    .catch(() => null)
  if (!user) return loi('Không tìm thấy học sinh này.', 404)

  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (100000 + (array[0] % 900000)).toString()

  await env.RATE_LIMIT.put(
    `pwd_reset:${username}`,
    JSON.stringify({ code, accountId: user.id, attempts: 0 }),
    { expirationTtl: 900 }
  )

  return json({
    ok: true,
    code,
    username,
    studentName: user.ten_hien_thi,
    expiresIn: '15 phút',
    message: `Mã khôi phục cho ${user.ten_hien_thi} là: ${code} (hiệu lực 15 phút).`,
  })
}

export async function quenMatKhau(request: Request, env: Env): Promise<Response> {
  let body: { username?: string; maXacNhan?: string; matKhauMoi?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu gửi lên không hợp lệ.', 400)
  }

  const username = String(body.username || '').trim().toLowerCase()
  const maXacNhan = String(body.maXacNhan || '').trim()
  const matKhauMoi = String(body.matKhauMoi || '').trim()

  if (!username) return loi('Vui lòng nhập tên đăng nhập.', 400)
  if (!maXacNhan) return loi('Vui lòng nhập mã xác nhận 6 chữ số.', 400)
  if (!matKhauMoi || matKhauMoi.length < 6) return loi('Mật khẩu mới phải từ 6 ký tự trở lên.', 400)

  // Lấy dữ liệu token đặt lại từ KV
  const kvKey = `pwd_reset:${username}`
  const rawData = await env.RATE_LIMIT.get(kvKey)
  if (!rawData) {
    return loi('Mã xác nhận không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng bấm Lấy mã mới.', 400)
  }

  let record: { code: string; accountId: number; attempts: number }
  try {
    record = JSON.parse(rawData)
  } catch {
    await env.RATE_LIMIT.delete(kvKey)
    return loi('Dữ liệu xác nhận lỗi. Vui lòng yêu cầu lại mã.', 400)
  }

  // Chống brute-force: tối đa 5 lần thử sai cho 1 mã
  if (record.attempts >= 5) {
    await env.RATE_LIMIT.delete(kvKey)
    return loi('Mã xác nhận đã bị nhập sai quá 5 lần. Vui lòng tạo yêu cầu mã mới.', 429)
  }

  if (record.code !== maXacNhan) {
    record.attempts += 1
    await env.RATE_LIMIT.put(kvKey, JSON.stringify(record), { expirationTtl: 900 })
    return loi(`Mã xác nhận không chính xác (còn ${5 - record.attempts} lần thử).`, 400)
  }

  // Mã đúng: Xóa ngay lập tức (Single-use)
  await env.RATE_LIMIT.delete(kvKey)

  const { taoSalt, bamMatKhau } = await import('../lib/passwords')
  const salt = taoSalt()
  const matKhauHash = await bamMatKhau(matKhauMoi, salt, 100000)

  // Cập nhật mật khẩu và hủy phiên đăng nhập cũ (thiet_bi = NULL) để đá mọi phiên nghi vấn ra ngoài
  await env.DB.prepare(`
    UPDATE tai_khoan_campus
       SET mat_khau_hash = ?1, salt = ?2, iterations = 100000, thiet_bi = NULL, cap_nhat_luc = CURRENT_TIMESTAMP
     WHERE id = ?3
  `)
    .bind(matKhauHash, salt, record.accountId)
    .run()

  return json({
    ok: true,
    message: 'Đặt lại mật khẩu thành công! Tất cả phiên cũ đã được đăng xuất an toàn. Hãy đăng nhập bằng mật khẩu mới.',
  })
}

export async function doiAvatar(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let body: { avatarUrl?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const avatarUrl = String(body.avatarUrl || '').trim()
  if (!avatarUrl) return loi('Thiếu URL avatar.', 400)

  await env.DB.prepare('UPDATE tai_khoan_campus SET avatar = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2')
    .bind(avatarUrl, kq.taiKhoan.id)
    .run()

  return json({ ok: true, avatar: avatarUrl })
}

export async function capNhatHoSo(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let body: { tenHienThi?: string; tieuDeHoSo?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const tenHienThi = body.tenHienThi ? String(body.tenHienThi).trim() : null
  const tieuDeHoSo = body.tieuDeHoSo ? String(body.tieuDeHoSo).trim() : null

  if (tenHienThi && (tenHienThi.length < 2 || tenHienThi.length > 50)) {
    return loi('Tên hiển thị phải từ 2 đến 50 ký tự.', 400)
  }

  await env.DB.prepare(`
    UPDATE tai_khoan_campus
       SET ten_hien_thi = COALESCE(?1, ten_hien_thi),
           tieu_de_ho_so = COALESCE(?2, tieu_de_ho_so),
           cap_nhat_luc = CURRENT_TIMESTAMP
     WHERE id = ?3
  `)
    .bind(tenHienThi, tieuDeHoSo, kq.taiKhoan.id)
    .run()

  return json({ ok: true })
}

export async function doiMatKhau(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  let body: { matKhauCu?: string; matKhauMoi?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }

  const matKhauCu = String(body.matKhauCu || '').trim()
  const matKhauMoi = String(body.matKhauMoi || '').trim()

  if (!matKhauCu || !matKhauMoi || matKhauMoi.length < 6) {
    return loi('Mật khẩu mới phải từ 6 ký tự trở lên.', 400)
  }

  const user = await env.DB.prepare(
    'SELECT mat_khau_hash, salt, iterations FROM tai_khoan_campus WHERE id = ?1'
  )
    .bind(kq.taiKhoan.id)
    .first<{ mat_khau_hash: string | null; salt: string | null; iterations: number | null }>()

  const { xacMinhMatKhau, taoSalt, bamMatKhau } = await import('../lib/passwords')
  const hopLe = await xacMinhMatKhau(matKhauCu, user?.mat_khau_hash || null, user?.salt || null, user?.iterations)
  if (!hopLe) {
    return loi('Mật khẩu cũ không chính xác.', 400)
  }

  const newSalt = taoSalt()
  const newHash = await bamMatKhau(matKhauMoi, newSalt, 100000)

  await env.DB.prepare(
    'UPDATE tai_khoan_campus SET mat_khau_hash = ?1, salt = ?2, iterations = 100000, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?3'
  )
    .bind(newHash, newSalt, kq.taiKhoan.id)
    .run()

  return json({ ok: true, message: 'Đổi mật khẩu thành công!' })
}
