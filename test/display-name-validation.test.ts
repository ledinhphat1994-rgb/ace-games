// Tên hiển thị nằm trong cookie phiên (trình duyệt bỏ cookie > 4 KB) và attachment WebSocket (tối đa 2 KB).
// Đăng ký từng nhận tên dài tuỳ ý: tài khoản "đăng ký thành công" nhưng không bao giờ đăng nhập được.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { GOC, MAT_KHAU } from './fixtures'
import { moKetNoi } from './ws'

const goi = (path: string, init?: RequestInit) => exports.default.fetch(`${GOC}${path}`, init)
const guiJson = (path: string, body: unknown, cookie?: string) =>
  goi(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(body),
  })
const tenMoi = (goc: string) => `${goc}.${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
const tenTrongD1 = async (username: string) =>
  (
    await env.DB.prepare('SELECT ten_hien_thi AS ten FROM tai_khoan_campus WHERE ten_dang_nhap = ?1')
      .bind(username)
      .first<{ ten: string }>()
  )?.ten

describe('Đăng ký: tên hiển thị được làm sạch và giới hạn 2–50 ký tự', () => {
  it('tên quá 50 ký tự bị từ chối, không tạo tài khoản', async () => {
    const username = tenMoi('qa.dai')
    const res = await guiJson('/api/register', { username, password: MAT_KHAU, tenHienThi: 'Tên dài '.repeat(700) })
    expect(res.status).toBe(400)
    expect(((await res.json()) as { loi: string }).loi).toContain('Tên hiển thị')
    expect(await tenTrongD1(username)).toBeUndefined()
  })

  it('tên toàn khoảng trắng rơi về tên đăng nhập thay vì lưu chuỗi rỗng', async () => {
    const username = tenMoi('qa.trang')
    const res = await guiJson('/api/register', { username, password: MAT_KHAU, tenHienThi: '   \n  ' })
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await tenTrongD1(username)).toBe(username)
  })

  it('ký tự điều khiển, đảo chiều và xuống dòng bị bỏ khỏi tên', async () => {
    const username = tenMoi('qa.ctl')
    const res = await guiJson('/api/register', { username, password: MAT_KHAU, tenHienThi: ' An\u0000‮ Bình\n\nChi ' })
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await tenTrongD1(username)).toBe('An Bình Chi')
  })

  it('tên một ký tự bị từ chối', async () => {
    const res = await guiJson('/api/register', { username: tenMoi('qa.ngan'), password: MAT_KHAU, tenHienThi: 'A' })
    expect(res.status).toBe(400)
    await res.body?.cancel()
  })
})

describe('Sửa hồ sơ không được xoá trắng hoặc làm hỏng tên hiển thị', () => {
  it('tên toàn khoảng trắng bị từ chối và tên cũ giữ nguyên', async () => {
    const username = tenMoi('qa.hoso')
    const dk = await guiJson('/api/register', { username, password: MAT_KHAU, tenHienThi: 'Tên Ban Đầu' })
    expect(dk.status).toBe(200)
    await dk.body?.cancel()
    const dn = await guiJson('/api/login', { username, password: MAT_KHAU })
    const cookie = (dn.headers.get('Set-Cookie') ?? '').split(';')[0]
    await dn.body?.cancel()

    const res = await guiJson('/api/profile/update', { tenHienThi: '    ' }, cookie)
    expect(res.status).toBe(400)
    await res.body?.cancel()
    expect(await tenTrongD1(username)).toBe('Tên Ban Đầu')

    const res2 = await guiJson('/api/profile/update', { tenHienThi: 'Tên‮ Mới\nHai Dòng' }, cookie)
    expect(res2.status).toBe(200)
    await res2.body?.cancel()
    expect(await tenTrongD1(username)).toBe('Tên Mới Hai Dòng')
  })
})

describe('Tài khoản cũ có tên quá dài vẫn đăng nhập và kết nối Campus được', () => {
  it('cookie phiên dưới 4 KB, whoami trả tên đã cắt, WebSocket Campus mở được', async () => {
    const username = tenMoi('qa.cu')
    const salt = taoSalt()
    const tenRatDai = 'Tên dài '.repeat(700)
    await env.DB.prepare(
      `INSERT INTO tai_khoan_campus (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, dang_hoat_dong)
       VALUES (?1, ?2, ?3, ?4, 100000, 'student', 1)`,
    )
      .bind(username, tenRatDai, await bamMatKhau(MAT_KHAU, salt, 100000), salt)
      .run()

    const dn = await guiJson('/api/login', { username, password: MAT_KHAU })
    expect(dn.status).toBe(200)
    await dn.body?.cancel()
    const setCookie = dn.headers.get('Set-Cookie') ?? ''
    expect(setCookie.length).toBeLessThan(4096)
    const cookie = setCookie.split(';')[0]

    const who = (await (await goi('/api/whoami', { headers: { Cookie: cookie } })).json()) as { ten: string }
    expect([...who.ten].length).toBeLessThanOrEqual(50)
    expect(who.ten.startsWith('Tên dài Tên dài')).toBe(true)

    const ws = await moKetNoi<{ type: string }>('/ws/campus', cookie)
    expect(ws.status).toBe(101)
    await ws.cho('snapshot')
    ws.dong()
  })
})
