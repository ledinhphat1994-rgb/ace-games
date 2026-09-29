import {
  chuanHoaTenHienThi,
  TEN_HIEN_THI_TOI_DA,
  TEN_HIEN_THI_TOI_THIEU,
  tenHienThiAnToan,
} from '../../shared/protocol/common'
import { TEN_CAMPUS } from '../campus/danh-tinh'
import { actorKey, cookiePhien, cookieXoa, createToken, SESSION_TTL, type Phien } from '../lib/auth'
import { json, loi } from '../lib/http'
import { bamMatKhau, DEFAULT_ITERATIONS, taoSalt, xacMinhMatKhau } from '../lib/passwords'
import { laGiaoVienDaDuyet, laQuanTriTruong, layPhamViQuanTri } from '../lib/scope'
import { kiemTraPhien, layPhien } from '../lib/session'
import { recordAnalyticsEvent } from '../lib/analytics'

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
  if (!env.RATE_LIMIT) return false
  const keyIp = `login:ip:${ip}`
  const keyTen = `login:ma:${await bamNgan(ten)}`
  try {
    const nIp = parseInt((await env.RATE_LIMIT.get(keyIp)) || '0', 10)
    if (Number.isFinite(nIp) && nIp >= MAX_TRIES_IP) return true

    const nTen = parseInt((await env.RATE_LIMIT.get(keyTen)) || '0', 10)
    if (Number.isFinite(nTen) && nTen >= MAX_TRIES_TEN) return true

    try {
      await env.RATE_LIMIT.put(keyIp, String(nIp + 1), { expirationTtl: WINDOW })
      await env.RATE_LIMIT.put(keyTen, String(nTen + 1), { expirationTtl: WINDOW })
    } catch (putErr) {
      console.warn(`[login] Lỗi kv.put rate limit cho login:`, putErr)
    }
    return false
  } catch (getErr) {
    console.warn(`[login] Lỗi kv.get rate limit cho login:`, getErr)
    return false // Fail-open: không chặn đăng nhập nếu KV gặp sự cố
  }
}

async function xoaDemThu(env: Env, ip: string, ten: string): Promise<void> {
  if (!env.RATE_LIMIT) return
  try {
    await env.RATE_LIMIT.delete(`login:ip:${ip}`)
    await env.RATE_LIMIT.delete(`login:ma:${await bamNgan(ten)}`)
  } catch {
    // Bỏ qua lỗi xóa cache rate limit
  }
}

/** Các cột tài khoản cần để cấp phiên (dùng chung cho đăng nhập mật khẩu và đăng nhập Google). */
export interface DongCapPhien {
  id: number
  ten_dang_nhap: string
  ten_hien_thi: string | null
  vai_tro: string | null
  teacher_pending: number | null
  hoc_sinh_id: number | null
  lop_id: number | null
}

interface DongDangNhap extends DongCapPhien {
  mat_khau_hash: string | null
  salt: string | null
  iterations: number | null
  dang_hoat_dong: number | null
}

/**
 * Cấp phiên cho tài khoản đã xác minh danh tính: ghi mã phiên mới vào thiet_bi (1 tài khoản 1 thiết bị),
 * báo CampusDO đá kết nối của thiết bị cũ (mã 4001), trả token ký HMAC cho cookie c10a7_session.
 */
export async function capPhienDangNhap(
  env: Env,
  user: DongCapPhien,
  ctx?: { waitUntil(promise: Promise<unknown>): void },
): Promise<{ token: string; payload: Phien; phienId: string }> {
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

  // Tên nằm trong cookie: cắt về giới hạn để tài khoản cũ có tên quá dài không bị trình duyệt bỏ cookie (> 4 KB).
  const payload: Phien = {
    accountId: user.id,
    role: user.vai_tro,
    ten: tenHienThiAnToan(user.ten_hien_thi),
    username: user.ten_dang_nhap,
    teacherPending: Boolean(user.teacher_pending),
    hocSinhId: user.hoc_sinh_id || null,
    lopId: user.lop_id || null,
    phienId,
  }
  const token = await createToken(env.SESSION_SECRET, payload, SESSION_TTL)
  return { token, payload, phienId }
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
  // Layer 1: Native Workers Rate Limiting edge burst protection (10 attempts / 60s per IP + username hash)
  if (env.LOGIN_LIMITER) {
    try {
      const outcome = await env.LOGIN_LIMITER.limit({ key: `${ip}:${await bamNgan(username)}` })
      if (!outcome.success) {
        return loi('Bạn đã thử đăng nhập quá nhanh. Vui lòng thử lại sau giây lát.', 429)
      }
    } catch (limiterErr) {
      console.warn('[login] Lỗi native LOGIN_LIMITER:', limiterErr)
    }
  }

  // Layer 2: Secondary approximate KV quota (8 attempts / 10m per username, 30 attempts / 10m per IP)
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
  if (!user || !hopLe) {
    recordAnalyticsEvent(env.ANALYTICS_DB, ctx, {
      event: 'auth.login_failed',
      properties: {
        reason: !user ? 'USER_NOT_FOUND' : !user.dang_hoat_dong ? 'ACCOUNT_INACTIVE' : 'INVALID_CREDENTIALS',
      },
    })
    return loi('Tên đăng nhập hoặc mật khẩu không chính xác.', 401)
  }

  await xoaDemThu(env, ip, username)
  const { token, payload, phienId } = await capPhienDangNhap(env, user, ctx)

  // Opportunistic password hash upgrade:
  // Nếu tài khoản có iterations < DEFAULT_ITERATIONS, nâng cấp lên DEFAULT_ITERATIONS bằng CAS
  // Tuyệt đối không hạ cấp tài khoản có work factor cao hơn.
  const currentIters = Number(user.iterations)
  if (Number.isInteger(currentIters) && currentIters > 0 && currentIters < DEFAULT_ITERATIONS) {
    try {
      const newSalt = taoSalt()
      const newHash = await bamMatKhau(password, newSalt, DEFAULT_ITERATIONS)
      await env.DB.prepare(
        `UPDATE tai_khoan_campus
            SET mat_khau_hash = ?1, salt = ?2, iterations = ?3, cap_nhat_luc = CURRENT_TIMESTAMP
          WHERE id = ?4 AND iterations = ?5`,
      )
        .bind(newHash, newSalt, DEFAULT_ITERATIONS, user.id, user.iterations)
        .run()
    } catch (e) {
      console.error('Opportunistic upgrade: lỗi cập nhật hash mật khẩu:', e)
    }
  }

  recordAnalyticsEvent(env.ANALYTICS_DB, ctx, {
    event: 'auth.login_succeeded',
    actorId: user.id,
    sessionId: phienId,
    properties: {
      role: user.vai_tro,
      isLinked: Boolean(user.hoc_sinh_id && user.lop_id),
    },
  })

  return json(
    {
      ok: true,
      user: {
        id: user.id,
        username: user.ten_dang_nhap,
        ten: payload.ten,
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
  const tenHienThi = chuanHoaTenHienThi(String(body.tenHienThi ?? '')) || username
  const vaiTro = body.vaiTro === 'teacher' ? 'teacher' : 'student'

  if (!username || username.length < 3 || username.length > 32) {
    return loi('Tên đăng nhập phải từ 3 đến 32 ký tự.', 400)
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return loi('Tên đăng nhập chỉ chứa chữ cái, số, dấu chấm, gạch ngang hoặc gạch dưới.', 400)
  }
  if (tenHienThi.length < TEN_HIEN_THI_TOI_THIEU || tenHienThi.length > TEN_HIEN_THI_TOI_DA) {
    return loi(`Tên hiển thị phải từ ${TEN_HIEN_THI_TOI_THIEU} đến ${TEN_HIEN_THI_TOI_DA} ký tự.`, 400)
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

  try {
    await env.DB.prepare(`
      INSERT INTO tai_khoan_campus (
        ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations,
        vai_tro, teacher_pending, lop_id, dang_hoat_dong
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)
    `)
      .bind(username, tenHienThi, matKhauHash, salt, DEFAULT_ITERATIONS, vaiTro, teacherPending, lopId)
      .run()
  } catch (e) {
    // Hai lượt đăng ký cùng tên chạy song song: lượt thua chạm UNIQUE(ten_dang_nhap) sau bước kiểm tra ở trên.
    if (String(e).includes('UNIQUE')) {
      return loi('Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.', 400)
    }
    throw e
  }

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
  if (env.RATE_LIMIT) {
    try {
      const ipCount = parseInt((await env.RATE_LIMIT.get(ipRateKey)) || '0', 10)
      if (Number.isFinite(ipCount) && ipCount >= 5) {
        return loi('Bạn đã yêu cầu tạo mã quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429)
      }
      try {
        await env.RATE_LIMIT.put(ipRateKey, String(ipCount + 1), { expirationTtl: 900 })
      } catch (putErr) {
        console.warn(`[qmk_req] Lỗi kv.put rate limit cho key ${ipRateKey}:`, putErr)
      }
    } catch (getErr) {
      console.warn(`[qmk_req] Lỗi kv.get rate limit cho key ${ipRateKey}:`, getErr)
    }
  }

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

  // 6. Lưu HMAC digest vào CSDL D1 (password_reset_tokens), tuyệt đối không lưu plaintext code
  const codeDigest = await bamMaOtp(env.SESSION_SECRET, target.ten_dang_nhap, code)
  const now = Date.now()
  const expiresAt = now + 900 * 1000 // 15 phút
  const tokenId = crypto.randomUUID()

  // Invalidate previous active tokens for this student (ABA Protection)
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE password_reset_tokens SET status = 'revoked' WHERE account_id = ?1 AND status = 'active'",
    ).bind(target.id),
    env.DB.prepare(
      `INSERT INTO password_reset_tokens (
         token_id, account_id, username, code_digest, attempts, max_attempts, expires_at, status, created_at, created_by
       ) VALUES (?1, ?2, ?3, ?4, 0, 5, ?5, 'active', ?6, ?7)`,
    ).bind(tokenId, target.id, target.ten_dang_nhap, codeDigest, expiresAt, now, kq.taiKhoan.id),
  ])

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

  // Rate limit theo IP
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  const ipRateKey = `rate:qmk_try_ip:${ip}`
  if (env.RATE_LIMIT) {
    try {
      const ipTries = parseInt((await env.RATE_LIMIT.get(ipRateKey)) || '0', 10)
      if (Number.isFinite(ipTries) && ipTries >= 15) {
        return loi('Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429)
      }
      try {
        await env.RATE_LIMIT.put(ipRateKey, String(ipTries + 1), { expirationTtl: 900 })
      } catch (putErr) {
        console.warn(`[qmk_try_ip] Lỗi kv.put rate limit cho key ${ipRateKey}:`, putErr)
      }
    } catch (getErr) {
      console.warn(`[qmk_try_ip] Lỗi kv.get rate limit cho key ${ipRateKey}:`, getErr)
    }
  }

  // 1. Tính toán HMAC digest của mã người dùng nhập
  const testDigest = await bamMaOtp(env.SESSION_SECRET, username, maXacNhan)
  const now = Date.now()

  // 2. Tra cứu token khớp với mã nhập (Token Identity / ABA Protection)
  const matchedToken = await env.DB.prepare(`
    SELECT id, token_id, account_id, username, code_digest, attempts, max_attempts, expires_at, status
      FROM password_reset_tokens
     WHERE username = ?1 AND code_digest = ?2
     ORDER BY id DESC LIMIT 1
  `)
    .bind(username, testDigest)
    .first<{
      id: number
      token_id: string
      account_id: number
      username: string
      code_digest: string
      attempts: number
      max_attempts: number
      expires_at: number
      status: string
    }>()
    .catch(() => null)

  if (matchedToken) {
    // 2a. Nếu mã thuộc về token đã bị thu hồi (ABA Protection: mã cũ A sau khi đã cấp mã B)
    if (matchedToken.status === 'revoked') {
      return loi('Mã xác nhận đã bị hủy do giáo viên đã cấp mã mới. Vui lòng sử dụng mã mới nhất.', 400)
    }
    // 2b. Nếu mã đã từng được sử dụng
    if (matchedToken.status === 'consumed') {
      return loi('Mã xác nhận đã được sử dụng. Vui lòng liên hệ giáo viên để xin mã mới.', 400)
    }
    // 2c. Nếu mã đã bị khóa do nhập sai quá số lần
    if (matchedToken.status === 'locked' || matchedToken.attempts >= matchedToken.max_attempts) {
      return loi('Mã xác nhận đã bị khóa do nhập sai quá 5 lần. Vui lòng liên hệ giáo viên.', 429)
    }
    // 2d. Nếu mã đã hết hạn 15 phút
    if (matchedToken.expires_at <= now) {
      return loi('Mã xác nhận đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã mới.', 400)
    }

    // 2e. Mã ĐÚNG và HỢP LỆ: Tính toán hash mật khẩu mới trước
    const salt = taoSalt()
    const matKhauHash = await bamMatKhau(matKhauMoi, salt, DEFAULT_ITERATIONS)
    const markerHuyPhien = `revoked_${crypto.randomUUID()}`

    // Thực thi giao dịch nguyên tử (D1 batch) cập nhật mật khẩu VÀ tiêu thụ token trong cùng 1 transaction
    let batchResults: D1Result[]
    try {
      batchResults = await env.DB.batch([
        env.DB.prepare(`
          UPDATE tai_khoan_campus
             SET mat_khau_hash = ?1, salt = ?2, iterations = ?3, thiet_bi = ?4, cap_nhat_luc = CURRENT_TIMESTAMP
           WHERE id = ?5
             AND EXISTS (
               SELECT 1 FROM password_reset_tokens
                WHERE id = ?6
                  AND status = 'active'
                  AND attempts < max_attempts
                  AND expires_at > ?7
             )
        `).bind(matKhauHash, salt, DEFAULT_ITERATIONS, markerHuyPhien, matchedToken.account_id, matchedToken.id, now),
        env.DB.prepare(`
          UPDATE password_reset_tokens
             SET status = 'consumed',
                 consumed_at = ?1
           WHERE id = ?2
             AND status = 'active'
             AND attempts < max_attempts
             AND expires_at > ?1
        `).bind(now, matchedToken.id),
      ])
    } catch (batchErr) {
      console.error('[quenMatKhau] Lỗi giao dịch D1 batch cập nhật mật khẩu / tiêu thụ token:', batchErr)
      return loi('Lỗi hệ thống khi cập nhật mật khẩu. Vui lòng thử lại sau.', 500)
    }

    const updateAccRes = batchResults[0]
    const consumeRes = batchResults[1]

    if (!updateAccRes || updateAccRes.meta.changes !== 1 || !consumeRes || consumeRes.meta.changes !== 1) {
      return loi('Mã xác nhận không hợp lệ hoặc đã được sử dụng. Vui lòng liên hệ giáo viên.', 400)
    }

    // Báo CampusDO ngắt kết nối WebSocket của mọi phiên cũ (Campus + RoomDO)
    await env.CAMPUS.get(env.CAMPUS.idFromName(TEN_CAMPUS))
      .dangNhapMoi(matchedToken.account_id, markerHuyPhien)
      .catch((err) => {
        console.warn('[quenMatKhau] Lỗi thông báo dangNhapMoi tới CampusDO:', err)
      })

    return json({ ok: true, message: 'Đặt lại mật khẩu thành công! Toàn bộ phiên cũ đã được đăng xuất. Vui lòng đăng nhập lại.' })
  }

  // 3. Nếu mã KHÔNG khớp bất kỳ token nào (Mã SAI hoàn toàn):
  // Tìm token mới nhất của tài khoản để tính số lần thử sai
  const activeToken = await env.DB.prepare(`
    SELECT id, token_id, account_id, username, code_digest, attempts, max_attempts, expires_at, status
      FROM password_reset_tokens
     WHERE username = ?1
     ORDER BY id DESC LIMIT 1
  `)
    .bind(username)
    .first<{
      id: number
      token_id: string
      account_id: number
      username: string
      code_digest: string
      attempts: number
      max_attempts: number
      expires_at: number
      status: string
    }>()
    .catch(() => null)

  if (!activeToken) {
    return loi('Mã xác nhận không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã.', 400)
  }

  if (activeToken.status === 'locked' || activeToken.attempts >= activeToken.max_attempts) {
    return loi('Mã xác nhận đã bị khóa do nhập sai quá 5 lần. Vui lòng liên hệ giáo viên.', 429)
  }
  if (activeToken.status !== 'active') {
    return loi('Mã xác nhận không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã.', 400)
  }
  if (activeToken.expires_at <= now) {
    return loi('Mã xác nhận đã hết hạn (15 phút). Vui lòng liên hệ giáo viên để nhận mã mới.', 400)
  }

  // Tăng attempts nguyên tử trong D1 (SQLite single-threaded serialization)
  const updateRes = await env.DB.prepare(`
    UPDATE password_reset_tokens
       SET attempts = attempts + 1,
           status = CASE WHEN attempts + 1 >= max_attempts THEN 'locked' ELSE status END
     WHERE id = ?1 AND status = 'active' AND expires_at > ?2
  `)
    .bind(activeToken.id, now)
    .run()
    .catch(() => null)

  if (!updateRes || updateRes.meta.changes === 0) {
    return loi('Mã xác nhận đã bị khóa do nhập sai quá 5 lần. Vui lòng liên hệ giáo viên.', 429)
  }

  const current = await env.DB.prepare('SELECT attempts, max_attempts, status FROM password_reset_tokens WHERE id = ?1')
    .bind(activeToken.id)
    .first<{ attempts: number; max_attempts: number; status: string }>()
    .catch(() => null)

  if (current && (current.attempts >= current.max_attempts || current.status === 'locked')) {
    return loi('Mã xác nhận đã bị hủy do nhập sai 5 lần. Vui lòng liên hệ giáo viên để xin cấp mã mới.', 429)
  }

  const conLai = current ? Math.max(0, current.max_attempts - current.attempts) : 0
  return loi(`Mã xác nhận không chính xác (còn ${conLai} lần thử).`, 400)
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

  // URL-aware canonicalization:
  // Treat as INTERNAL only when:
  // A. Canonical relative application path beginning exactly with /api/files/
  // OR
  // B. Absolute URL whose origin EXACTLY matches the request's origin and whose pathname begins exactly with /api/files/
  let isInternal = false
  let extractedPathname = ''

  if (avatarUrl.startsWith('/api/files/')) {
    isInternal = true
    extractedPathname = avatarUrl.split(/[?#]/)[0]
  } else if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    try {
      const parsedUrl = new URL(avatarUrl)
      const reqUrl = new URL(request.url)
      if (parsedUrl.origin.toLowerCase() === reqUrl.origin.toLowerCase() && parsedUrl.pathname.startsWith('/api/files/')) {
        isInternal = true
        extractedPathname = parsedUrl.pathname
      }
    } catch {
      return loi('Định dạng URL avatar không hợp lệ.', 400)
    }
  }

  if (isInternal) {
    const rawKeySegment = extractedPathname.slice('/api/files/'.length)
    let key: string
    try {
      key = decodeURIComponent(rawKeySegment)
    } catch {
      return loi('Đường dẫn tệp chứa mã hóa không hợp lệ.', 400)
    }

    // Kiểm tra tính hợp lệ và an toàn của key
    if (
      !key ||
      key.includes('..') ||
      key.includes('//') ||
      key.startsWith('/') ||
      key.includes('\\') ||
      key.startsWith('rooms/') ||
      key.includes('/documents/') ||
      !/^[a-zA-Z0-9._\-\/]+$/.test(key)
    ) {
      return loi('Đường dẫn tệp nội bộ không hợp lệ hoặc bị cấm sử dụng làm ảnh đại diện.', 400)
    }

    // Tra cứu authoritative metadata trong file_metadata
    const meta = await env.DB.prepare(
      'SELECT id, object_key, mime_type, uploaded_by_account_id, deleted_at FROM file_metadata WHERE object_key = ?1'
    ).bind(key).first<{
      id: number
      object_key: string
      mime_type: string
      uploaded_by_account_id: number
      deleted_at: number | null
    }>()

    if (!meta) {
      return loi('Tệp không tồn tại trong danh mục hệ thống.', 404)
    }

    if (meta.deleted_at !== null) {
      return loi('Tệp đã bị xóa.', 400)
    }

    // Chống leo thang / chiếm quyền tệp của người khác: Chỉ người tải lên mới được gán làm avatar
    if (meta.uploaded_by_account_id !== kq.taiKhoan.id) {
      return loi('Bạn không có quyền sử dụng tệp của tài khoản khác làm ảnh đại diện.', 403)
    }

    const ALLOWED_AVATAR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    if (!meta.mime_type || !ALLOWED_AVATAR_MIMES.has(meta.mime_type.toLowerCase())) {
      return loi('Tệp được chọn không phải là định dạng hình ảnh hợp lệ (chỉ hỗ trợ PNG, JPG, WEBP, GIF).', 400)
    }

    // Luôn lưu dạng tương đối chuẩn tắc (/api/files/<canonical-key>) để đồng nhất dữ liệu
    const canonicalAvatar = `/api/files/${key}`

    // Thực hiện thăng cấp quyền lên campus đồng thời cập nhật profile qua D1 batch transaction
    await env.DB.batch([
      env.DB.prepare("UPDATE file_metadata SET purpose = 'avatar', visibility = 'campus' WHERE id = ?1").bind(meta.id),
      env.DB.prepare('UPDATE tai_khoan_campus SET avatar = ?1, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?2').bind(canonicalAvatar, kq.taiKhoan.id),
    ])

    return json({ ok: true, avatar: canonicalAvatar })
  }

  // Đối với URL tĩnh (preset /assets/avatars/...), URL ngoài hoặc data URL
  if (
    !avatarUrl.startsWith('/assets/avatars/') &&
    !avatarUrl.startsWith('data:image/') &&
    !avatarUrl.startsWith('https://') &&
    !avatarUrl.startsWith('http://')
  ) {
    return loi('Định dạng URL avatar không được hỗ trợ.', 400)
  }

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

  // Có gửi tenHienThi thì phải hợp lệ sau khi làm sạch — chuỗi toàn khoảng trắng không được xoá trắng tên.
  const tenHienThi = typeof body.tenHienThi === 'string' ? chuanHoaTenHienThi(body.tenHienThi) : null
  const hasTieuDeHoSo = typeof body.tieuDeHoSo === 'string' || body.tieuDeHoSo === null
  const tieuDeHoSo = hasTieuDeHoSo ? (body.tieuDeHoSo ? chuanHoaTenHienThi(String(body.tieuDeHoSo)) : '') : null

  if (
    tenHienThi !== null &&
    (tenHienThi.length < TEN_HIEN_THI_TOI_THIEU || tenHienThi.length > TEN_HIEN_THI_TOI_DA)
  ) {
    return loi(`Tên hiển thị phải từ ${TEN_HIEN_THI_TOI_THIEU} đến ${TEN_HIEN_THI_TOI_DA} ký tự.`, 400)
  }
  if (tieuDeHoSo && tieuDeHoSo.length > 150) {
    return loi('Châm ngôn học tập không được vượt quá 150 ký tự.', 400)
  }

  await env.DB.prepare(`
    UPDATE tai_khoan_campus
       SET ten_hien_thi = COALESCE(?1, ten_hien_thi),
           tieu_de_ho_so = CASE
             WHEN ?2 IS NOT NULL THEN (CASE WHEN ?2 = '' THEN NULL ELSE ?2 END)
             ELSE tieu_de_ho_so
           END,
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

  const hopLe = await xacMinhMatKhau(matKhauCu, user?.mat_khau_hash || null, user?.salt || null, user?.iterations)
  if (!hopLe) {
    return loi('Mật khẩu cũ không chính xác.', 400)
  }

  const newSalt = taoSalt()
  const newHash = await bamMatKhau(matKhauMoi, newSalt, DEFAULT_ITERATIONS)
  // Xoay phiên: thiết bị đang đổi mật khẩu nhận cookie mới và vẫn đăng nhập; mọi bản sao của phiên cũ
  // (kể cả cookie bị lộ) mất hiệu lực. Trước đây gán mã huỷ nên chính người vừa đổi cũng bị đăng xuất.
  const phienMoi = crypto.randomUUID()

  await env.DB.prepare(
    'UPDATE tai_khoan_campus SET mat_khau_hash = ?1, salt = ?2, iterations = ?3, thiet_bi = ?4, cap_nhat_luc = CURRENT_TIMESTAMP WHERE id = ?5'
  )
    .bind(newHash, newSalt, DEFAULT_ITERATIONS, phienMoi, kq.taiKhoan.id)
    .run()

  const token = await createToken(env.SESSION_SECRET, { ...kq.phien, phienId: phienMoi }, SESSION_TTL)
  return json(
    { ok: true, message: 'Đổi mật khẩu thành công! Toàn bộ phiên khác đã được đăng xuất an toàn.' },
    200,
    { 'Set-Cookie': cookiePhien(token, laHttps(request)) },
  )
}
