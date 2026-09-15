import { TEN_CAMPUS } from '../campus/danh-tinh'
import { actorKey, cookiePhien, cookieXoa, createToken, SESSION_TTL, type Phien } from '../lib/auth'
import { json, loi } from '../lib/http'
import { bamMatKhau, DEFAULT_ITERATIONS, taoSalt, xacMinhMatKhau } from '../lib/passwords'
import { laGiaoVienDaDuyet, laQuanTriTruong, layPhamViQuanTri } from '../lib/scope'
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

  const salt = taoSalt()
  const matKhauHash = await bamMatKhau(password, salt, DEFAULT_ITERATIONS)

  // Identity invariant: Campus account != verified class member.
  // lop_id mặc định luôn là NULL. Không gán tự động hoặc fallback lớp đầu tiên.
  const lopId: number | null = null

  await env.DB.prepare(`
    INSERT INTO tai_khoan_campus (
      ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
      vai_tro, teacher_pending, lop_id, dang_hoat_dong
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)
  `)
    .bind(username, tenHienThi, matKhauHash, salt, DEFAULT_ITERATIONS, vaiTro, teacherPending, lopId)
    .run()

  return json({
    ok: true,
    message: teacherPending
      ? 'Đăng ký tài khoản giáo viên thành công! Vui lòng chờ duyệt hoặc liên hệ ban quản trị.'
      : 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ.',
  })
}

async function bamMaOtp(secret: string, username: string, code: string): Promise<string> {
  // Fail closed: không có SESSION_SECRET thì không thể ký OTP.
  if (!secret) throw new Error('SESSION_SECRET chưa được cấu hình — không thể tạo/xác minh OTP.')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(`${username.toLowerCase().trim()}:${code.trim()}`),
  )
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

interface RecordResetKV {
  accountId: number
  codeDigest: string
  attempts: number
  expiresAt: number
}

/** Yêu cầu mã khôi phục mật khẩu (OWASP: generic response, không để lộ mã ra public khi chưa xác thực) */
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

  return json({
    ok: true,
    message:
      'Nếu tài khoản tồn tại, yêu cầu khôi phục đã được ghi nhận. Vui lòng liên hệ trực tiếp Giáo viên chủ nhiệm hoặc Ban Giám Hiệu tại trường để nhận mã xác nhận 6 số.',
  })
}

/** Giáo viên / Admin tạo mã khôi phục cho học sinh trực tiếp (Scope & Privilege Enforced) */
export async function taoMaResetChoHocSinh(request: Request, env: Env): Promise<Response> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return loi(kq.thongBao, 401)

  // 1. Kiểm tra actor: Không cho pending teacher hoặc học sinh
  if (!laGiaoVienDaDuyet(kq.taiKhoan)) {
    return loi('Chỉ giáo viên đã được duyệt hoặc ban quản trị mới có quyền tạo mã khôi phục.', 403)
  }

  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return loi('Dữ liệu không hợp lệ.', 400)
  }
  const username = String(body.username || '').trim().toLowerCase()
  if (!username) return loi('Thiếu tên đăng nhập.', 400)

  // 2. Tìm tài khoản mục tiêu
  const target = await env.DB.prepare(
    'SELECT id, ten_dang_nhap, ten_hien_thi, vai_tro, lop_id, la_admin_truong FROM tai_khoan_campus WHERE ten_dang_nhap = ?1',
  )
    .bind(username)
    .first<{
      id: number
      ten_dang_nhap: string
      ten_hien_thi: string
      vai_tro: string
      lop_id: number | null
      la_admin_truong: number | null
    }>()
    .catch(() => null)
  if (!target) return loi('Không tìm thấy học sinh này.', 404)

  // 3. Không cho phép reset tài khoản Giáo viên hoặc Admin từ endpoint học sinh này
  if (target.vai_tro === 'teacher' || target.la_admin_truong === 1) {
    return loi('Không được phép cấp mã khôi phục cho tài khoản giáo viên hoặc quản trị viên từ cổng này.', 403)
  }

  // 4. Kiểm tra phạm vi lớp của giáo viên (GVCN chỉ được reset học sinh thuộc lớp mình)
  if (!laQuanTriTruong(kq.taiKhoan)) {
    const phamVi = await layPhamViQuanTri(env.DB, kq.taiKhoan)
    if (!target.lop_id || !phamVi.lopIds || !phamVi.lopIds.includes(target.lop_id)) {
      return loi('Giáo viên chỉ được cấp mã khôi phục cho học sinh thuộc lớp mình phụ trách.', 403)
    }
  }

  // 5. Sinh mã OTP 6 số ngẫu nhiên cryptographically
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (100000 + (array[0] % 900000)).toString()

  // 6. Lưu HMAC digest vào KV, tuyệt đối không lưu plaintext
  const codeDigest = await bamMaOtp(env.SESSION_SECRET, target.ten_dang_nhap, code)
  const now = Date.now()
  const record: RecordResetKV = {
    accountId: target.id,
    codeDigest,
    attempts: 0,
    expiresAt: now + 900 * 1000,
  }

  await env.RATE_LIMIT.put(`pwd_reset:${target.ten_dang_nhap}`, JSON.stringify(record), { expirationTtl: 900 })

  return json({
    ok: true,
    code,
    username: target.ten_dang_nhap,
    studentName: target.ten_hien_thi,
    expiresIn: '15 phút',
    message: `Mã khôi phục cho học sinh ${target.ten_hien_thi} là: ${code} (hiệu lực 15 phút, dùng 1 lần).`,
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

  // Rate limit theo IP và theo target account
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  const ipRateKey = `rate:qmk_try_ip:${ip}`
  const ipTries = parseInt((await env.RATE_LIMIT.get(ipRateKey)) || '0', 10)
  if (ipTries >= 15) {
    return loi('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429)
  }
  await env.RATE_LIMIT.put(ipRateKey, String(ipTries + 1), { expirationTtl: 900 })

  const kvKey = `pwd_reset:${username}`
  const rawData = await env.RATE_LIMIT.get(kvKey)
  if (!rawData) {
    return loi('Mã xác nhận không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã.', 400)
  }

  let record: RecordResetKV
  try {
    record = JSON.parse(rawData)
  } catch {
    await env.RATE_LIMIT.delete(kvKey)
    return loi('Dữ liệu xác nhận không hợp lệ. Vui lòng liên hệ giáo viên.', 400)
  }

  const now = Date.now()
  if (record.expiresAt <= now) {
    await env.RATE_LIMIT.delete(kvKey)
    return loi('Mã xác nhận đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã mới.', 400)
  }

  // Chống brute-force: tối đa 5 lần thử sai
  if (record.attempts >= 5) {
    await env.RATE_LIMIT.delete(kvKey)
    return loi('Mã xác nhận đã bị khóa do nhập sai quá 5 lần. Vui lòng liên hệ giáo viên.', 429)
  }

  // Đối chiếu HMAC digest của mã nhập vào
  const testDigest = await bamMaOtp(env.SESSION_SECRET, username, maXacNhan)
  if (testDigest !== record.codeDigest) {
    record.attempts += 1
    const ttlRemaining = Math.max(1, Math.round((record.expiresAt - now) / 1000))
    if (record.attempts >= 5) {
      await env.RATE_LIMIT.delete(kvKey)
      return loi('Mã xác nhận đã bị hủy do nhập sai 5 lần. Vui lòng liên hệ giáo viên để xin cấp mã mới.', 429)
    }
    // Cập nhật số lần thử sai nhưng KHÔNG được gia hạn thêm TTL gốc
    await env.RATE_LIMIT.put(kvKey, JSON.stringify(record), { expirationTtl: ttlRemaining })
    return loi(`Mã xác nhận không chính xác (còn ${5 - record.attempts} lần thử).`, 400)
  }

  // Mã đúng: Xóa ngay lập tức (Single-use)
  await env.RATE_LIMIT.delete(kvKey)

  const salt = taoSalt()
  const matKhauHash = await bamMatKhau(matKhauMoi, salt, DEFAULT_ITERATIONS)

  // Gán session marker ngẫu nhiên mới mà không token cũ nào có để vô hiệu hóa 100% phiên cũ
  const markerHuyPhien = `revoked_${crypto.randomUUID()}`
  await env.DB.prepare(`
    UPDATE tai_khoan_campus
       SET mat_khau_hash = ?1, salt = ?2, iterations = ?3, thiet_bi = ?4, cap_nhat_luc = CURRENT_TIMESTAMP
     WHERE id = ?5
  `)
    .bind(matKhauHash, salt, DEFAULT_ITERATIONS, markerHuyPhien, record.accountId)
    .run()

  // Báo CampusDO đá kết nối WebSocket của phiên cũ
  env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
    .dangNhapMoi(record.accountId, markerHuyPhien)
    .catch(() => {})

  return json({ ok: true, message: 'Đặt lại mật khẩu thành công! Toàn bộ phiên cũ đã được đăng xuất. Vui lòng đăng nhập lại.' })
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
  const newHash = await bamMatKhau(matKhauMoi, newSalt, DEFAULT_ITERATIONS)
  const markerHuyPhien = `revoked_${crypto.randomUUID()}`

  await env.DB.prepare(
    'UPDATE tai_khoan_campus SET mat_khau_hash = ?1, salt = ?2, iterations = ?3, thiet_bi = ?4, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?5'
  )
    .bind(newHash, newSalt, DEFAULT_ITERATIONS, markerHuyPhien, kq.taiKhoan.id)
    .run()

  return json({ ok: true, message: 'Đổi mật khẩu thành công! Toàn bộ phiên khác đã được đăng xuất an toàn.' })
}
