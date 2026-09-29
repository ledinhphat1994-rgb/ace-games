// Quản lý tài khoản cho School Admin: duyệt/từ chối giáo viên đang chờ, khoá/mở khoá tài khoản.
// Trước đây bản v2 không có đường nào để duyệt giáo viên đăng ký không có mã — họ kẹt "chờ duyệt" mãi mãi.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { AdminAccountItem } from '../shared/protocol/admin-accounts'
import type { GoiCampus } from '../shared/protocol/campus'
import { GOC, MAT_KHAU } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import adminPageRaw from '../src/features/admin/AdminControlPlanePage.tsx?raw'

const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, init)
const thaoTac = (cookie: string, id: number, action: string) =>
  goi(`/api/admin/accounts/${id}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action }),
  })
const danhSach = async (cookie: string, query = '') => {
  const res = await goi(`/api/admin/accounts${query}`, { headers: { Cookie: cookie } })
  return { status: res.status, body: (await res.json()) as { accounts: AdminAccountItem[]; counts: { pendingTeacher: number } } }
}

async function dangKy(goc: string, vaiTro: 'student' | 'teacher'): Promise<{ username: string; id: number }> {
  const username = `${goc}.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
  const res = await goi('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: MAT_KHAU, tenHienThi: `Tài khoản ${goc}`, vaiTro }),
  })
  expect(res.status).toBe(200)
  await res.body?.cancel()
  const row = await env.DB.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?1').bind(username).first<{ id: number }>()
  return { username, id: row!.id }
}

const trangThai = (id: number) =>
  env.DB.prepare('SELECT vai_tro, teacher_pending, dang_hoat_dong, duyet_boi_khoa FROM tai_khoan_campus WHERE id = ?1')
    .bind(id)
    .first<{ vai_tro: string; teacher_pending: number; dang_hoat_dong: number; duyet_boi_khoa: string | null }>()

describe('Quản lý tài khoản — phân quyền', () => {
  it('học sinh và giáo viên thường không xem hay thao tác được (403)', async () => {
    for (const u of ['qa.v2.thu1', 'qa.v2.gv']) {
      const cookie = await dangNhapLayCookie(u)
      expect((await danhSach(cookie)).status).toBe(403)
      const res = await thaoTac(cookie, 1, 'lock')
      expect(res.status).toBe(403)
      await res.body?.cancel()
    }
    const res = await goi('/api/admin/accounts')
    expect(res.status).toBe(401)
    await res.body?.cancel()
  })

  it('danh sách không lộ hash/salt/thiết bị và không có tài khoản system', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const res = await goi('/api/admin/accounts?limit=100', { headers: { Cookie: admin } })
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(text).not.toMatch(/mat_khau|salt|thiet_bi|hash/i)
    const body = JSON.parse(text) as { accounts: AdminAccountItem[] }
    expect(body.accounts.some((a) => a.username === 'system')).toBe(false)
    expect(body.accounts.some((a) => a.username === 'qa.v2.thu1')).toBe(true)
  })
})

describe('Quản lý tài khoản — duyệt giáo viên', () => {
  it('duyệt: giáo viên đang chờ thành giáo viên đã xác minh; duyệt lần hai trả 409', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const gv = await dangKy('qa.gvmoi', 'teacher')

    const cho = await danhSach(admin, '?filter=pending_teacher')
    expect(cho.body.accounts.some((a) => a.id === gv.id && a.teacherPending)).toBe(true)
    expect(cho.body.counts.pendingTeacher).toBeGreaterThan(0)

    const res = await thaoTac(admin, gv.id, 'approve_teacher')
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await trangThai(gv.id)).toMatchObject({ vai_tro: 'teacher', teacher_pending: 0, duyet_boi_khoa: 'acc:8' })

    const cookieGv = await dangNhapLayCookie(gv.username)
    const who = (await (await goi('/api/whoami', { headers: { Cookie: cookieGv } })).json()) as { isVerifiedTeacher: boolean }
    expect(who.isVerifiedTeacher).toBe(true)

    const lai = await thaoTac(admin, gv.id, 'approve_teacher')
    expect(lai.status).toBe(409)
    await lai.body?.cancel()
  })

  it('từ chối: tài khoản về học sinh, vẫn đăng nhập được', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const gv = await dangKy('qa.gvtuchoi', 'teacher')
    const res = await thaoTac(admin, gv.id, 'reject_teacher')
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await trangThai(gv.id)).toMatchObject({ vai_tro: 'student', teacher_pending: 0, dang_hoat_dong: 1 })
    await dangNhapLayCookie(gv.username)
  })

  it('không dùng được endpoint duyệt để nâng quyền học sinh thường', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const hs = await dangKy('qa.hsduyet', 'student')
    const res = await thaoTac(admin, hs.id, 'approve_teacher')
    expect(res.status).toBe(409)
    await res.body?.cancel()
    expect(await trangThai(hs.id)).toMatchObject({ vai_tro: 'student', teacher_pending: 0 })
  })
})

describe('Quản lý tài khoản — khoá / mở khoá', () => {
  it('khoá ngắt WebSocket đang mở và chặn đăng nhập; mở khoá cho đăng nhập lại; có nhật ký', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const hs = await dangKy('qa.hskhoa', 'student')
    const cookieHs = await dangNhapLayCookie(hs.username)
    const ws = await moKetNoi<GoiCampus>('/ws/campus', cookieHs)
    await ws.cho('snapshot')

    const res = await thaoTac(admin, hs.id, 'lock')
    expect(res.status).toBe(200)
    expect(((await res.json()) as { disconnected: boolean }).disconnected).toBe(true)
    // Giao diện phân biệt "bị khoá" với "đăng nhập nơi khác" nhờ lý do đi kèm.
    expect((await ws.cho('session.replaced')).reason).toBe('tai_khoan_khoa')
    expect(await ws.choDong()).toMatchObject({ code: 4001, reason: 'tai_khoan_khoa' })

    const who = await goi('/api/whoami', { headers: { Cookie: cookieHs } })
    expect(who.status).toBe(401)
    expect(((await who.json()) as { lyDo: string }).lyDo).toBe('tai_khoan_khoa')
    const dn = await goi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: hs.username, password: MAT_KHAU }),
    })
    expect(dn.status).toBe(401)
    await dn.body?.cancel()

    const lai = await thaoTac(admin, hs.id, 'lock')
    expect(lai.status).toBe(409)
    await lai.body?.cancel()

    const mo = await thaoTac(admin, hs.id, 'unlock')
    expect(mo.status).toBe(200)
    await mo.body?.cancel()
    await dangNhapLayCookie(hs.username)

    const nk = await env.DB.prepare(
      "SELECT action FROM moderation_audit_logs WHERE target_id = ?1 AND action IN ('account_lock', 'account_unlock') ORDER BY id",
    )
      .bind(hs.id)
      .all<{ action: string }>()
    expect(nk.results.map((r) => r.action)).toEqual(['account_lock', 'account_unlock'])
  })

  it('không tự khoá, không khoá quản trị viên, không mở khoá tài khoản system', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const tuKhoa = await thaoTac(admin, 8, 'lock')
    expect(tuKhoa.status).toBe(403)
    await tuKhoa.body?.cancel()

    const system = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'system'").first<{ id: number }>()
    const moSystem = await thaoTac(admin, system!.id, 'unlock')
    expect(moSystem.status).toBe(404)
    await moSystem.body?.cancel()
    expect((await trangThai(system!.id))?.dang_hoat_dong).toBe(0)
  })

  it('thao tác không hợp lệ hoặc id sai bị từ chối', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const sai = await thaoTac(admin, 1, 'delete')
    expect(sai.status).toBe(400)
    await sai.body?.cancel()
    const khongCo = await thaoTac(admin, 999999, 'lock')
    expect(khongCo.status).toBe(404)
    await khongCo.body?.cancel()
  })
})

describe('Quản lý tài khoản — cấp quyền giáo viên', () => {
  it('nâng học sinh lên giáo viên đã duyệt ngay (không cần đăng nhập lại), có nhật ký; cấp lần hai trả 409', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const hs = await dangKy('qa.v2.capgv', 'student')
    const phienHs = await dangNhapLayCookie(hs.username)

    const res = await thaoTac(admin, hs.id, 'grant_teacher')
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await trangThai(hs.id)).toMatchObject({ vai_tro: 'teacher', teacher_pending: 0, duyet_boi_khoa: expect.stringMatching(/^acc:/) })

    const who = await goi('/api/whoami', { headers: { Cookie: phienHs } })
    expect(await who.json()).toMatchObject({ role: 'teacher', isVerifiedTeacher: true })

    const nhatKy = await env.DB.prepare("SELECT 1 FROM moderation_audit_logs WHERE target_id = ?1 AND action = 'teacher_grant'")
      .bind(hs.id)
      .first()
    expect(nhatKy).not.toBeNull()

    const lan2 = await thaoTac(admin, hs.id, 'grant_teacher')
    expect(lan2.status).toBe(409)
    await lan2.body?.cancel()
  })

  it('không cấp cho tài khoản bị khoá hoặc quản trị viên; giáo viên thường không cấp được', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const khoa = await thaoTac(admin, 3, 'grant_teacher') // qa.v2.khoa
    expect(khoa.status).toBe(409)
    await khoa.body?.cancel()
    const quanTri = await thaoTac(admin, 8, 'grant_teacher') // qa.v2.admin
    expect(quanTri.status).toBe(403)
    await quanTri.body?.cancel()

    const gv = await dangNhapLayCookie('qa.v2.gv')
    const res = await thaoTac(gv, 4, 'grant_teacher')
    expect(res.status).toBe(403)
    await res.body?.cancel()
    expect((await trangThai(4))?.vai_tro).toBe('student')
  })

  it('danh sách hiện Gmail đã liên kết đăng nhập Google', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    await env.DB.prepare('INSERT INTO lien_ket_google (account_id, google_sub, email, created_at) VALUES (5, ?1, ?2, ?3)')
      .bind('sub-admin-list', 'hs.tudo@gmail.com', Date.now())
      .run()
    const { body } = await danhSach(admin, '?limit=100')
    expect(body.accounts.find((a) => a.username === 'qa.v2.tudo')?.googleEmail).toBe('hs.tudo@gmail.com')
    expect(body.accounts.find((a) => a.username === 'qa.v2.thu1')?.googleEmail).toBeNull()
  })
})

describe('Quản lý tài khoản — cấp mã khôi phục mật khẩu', () => {
  it('quản trị cấp mã → học sinh đặt lại mật khẩu bằng mã; nhật ký ghi người cấp nhưng không chứa mã; mã dùng 1 lần', async () => {
    const admin = await dangNhapLayCookie('qa.v2.admin')
    const hs = await dangKy('qa.v2.quenmk', 'student')

    const cap = await goi('/api/admin/reset-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: admin },
      body: JSON.stringify({ username: hs.username }),
    })
    expect(cap.status).toBe(200)
    const { code } = (await cap.json()) as { code: string }
    expect(code).toMatch(/^\d{6}$/)

    const nhatKy = await env.DB.prepare(
      "SELECT metadata FROM moderation_audit_logs WHERE target_id = ?1 AND action = 'password_reset_code'",
    )
      .bind(hs.id)
      .first<{ metadata: string }>()
    expect(nhatKy?.metadata).toContain(hs.username)
    expect(nhatKy?.metadata).not.toContain(code)

    const datLai = (ma: string) =>
      goi('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: hs.username, maXacNhan: ma, matKhauMoi: 'MatKhauMoi@123' }),
      })
    const res = await datLai(code)
    expect(res.status).toBe(200)
    await res.body?.cancel()

    const dn = await goi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: hs.username, password: 'MatKhauMoi@123' }),
    })
    expect(dn.status).toBe(200)
    await dn.body?.cancel()

    const lan2 = await datLai(code)
    expect(lan2.status).toBe(400)
    await lan2.body?.cancel()
  })

  it('giao diện /admin có nút cấp mã khôi phục cho học sinh và hộp hiện mã', () => {
    expect(adminPageRaw).toContain("fetch('/api/admin/reset-code'")
    expect(adminPageRaw).toContain('data-testid="cap-ma-khoi-phuc"')
    expect(adminPageRaw).toContain('data-testid="ma-khoi-phuc"')
  })
})
