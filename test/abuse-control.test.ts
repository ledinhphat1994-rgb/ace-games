import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exports, env } from 'cloudflare:workers'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

describe('PRV5 Global Abuse-Control & Rate Limiting Suite', () => {
  let student1Id: number
  let student2Id: number
  let student3Id: number

  beforeEach(async () => {
    const s1 = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu1'").first<{ id: number }>()
    const s2 = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu2'").first<{ id: number }>()
    const s3 = await env.DB.prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'qa.v2.thu3'").first<{ id: number }>()
    student1Id = s1!.id
    student2Id = s2!.id
    student3Id = s3!.id

    // Reset KV counters
    await env.RATE_LIMIT.delete(`rate:upload:${student1Id}`)
    await env.RATE_LIMIT.delete(`rate:upload:${student2Id}`)
    // Clean up test reports
    await env.DB.prepare('DELETE FROM reports WHERE reporter_id IN (?1, ?2)').bind(student1Id, student2Id).run()
  })

  // ── 1. D1 Atomic Report Rate Limiting (5 reports / 10 minutes) ───────────

  it('1.1. Sequential: 5 reports succeed, 6th receives HTTP 429', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const res = await exports.default.fetch(new Request(`${GOC}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
        body: JSON.stringify({
          reportedAccountId: student2Id,
          category: 'harassment',
          reason: `Sequential report #${i + 1}`,
        }),
      }))
      statuses.push(res.status)
    }

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(statuses[5]).toBe(429)

    const d1Count = await env.DB.prepare(
      'SELECT COUNT(*) as n FROM reports WHERE reporter_id = ?1'
    ).bind(student1Id).first<{ n: number }>()
    expect(d1Count?.n).toBe(5)
  })

  it('1.2. Concurrency: 10 concurrent reports strictly caps at 5 records in D1 with zero lost increments', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')

    const promises = Array.from({ length: 10 }, (_, i) =>
      exports.default.fetch(new Request(`${GOC}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
        body: JSON.stringify({
          reportedAccountId: student2Id,
          category: 'spam',
          reason: `Concurrent report burst #${i + 1}`,
        }),
      }))
    )

    const responses = await Promise.all(promises)
    const statuses = responses.map((r) => r.status)
    const allowed = statuses.filter((s) => s === 200).length
    const limited = statuses.filter((s) => s === 429).length

    expect(allowed).toBe(5)
    expect(limited).toBe(5)

    const d1Count = await env.DB.prepare(
      'SELECT COUNT(*) as n FROM reports WHERE reporter_id = ?1'
    ).bind(student1Id).first<{ n: number }>()
    expect(d1Count?.n).toBe(5)
  })

  it('1.3. Actor Isolation: Reporter A reaching 5 reports does not affect Reporter B', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    // Student 1 exhausts 5 reports
    for (let i = 0; i < 5; i++) {
      const res = await exports.default.fetch(new Request(`${GOC}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
        body: JSON.stringify({
          reportedAccountId: student3Id,
          category: 'spam',
          reason: `Student 1 report #${i + 1}`,
        }),
      }))
      expect(res.status).toBe(200)
    }

    // Student 1's 6th report is rate limited
    const resS1 = await exports.default.fetch(new Request(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({
        reportedAccountId: student3Id,
        category: 'spam',
        reason: 'Student 1 report #6',
      }),
    }))
    expect(resS1.status).toBe(429)

    // Student 2 can still report normally
    const resS2 = await exports.default.fetch(new Request(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent2 },
      body: JSON.stringify({
        reportedAccountId: student3Id,
        category: 'spam',
        reason: 'Student 2 fresh report',
      }),
    }))
    expect(resS2.status).toBe(200)
  })

  it('1.4. Window sliding: Reports older than 10 minutes do not count toward active quota', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')

    // Insert 5 reports timestamped 11 minutes ago
    const oldTime = Date.now() - 660_000
    for (let i = 0; i < 5; i++) {
      await env.DB.prepare(
        `INSERT INTO reports (reporter_id, reported_id, category, reason, status, created_at)
         VALUES (?1, ?2, 'spam', 'Old report', 'pending', ?3)`
      ).bind(student1Id, student2Id, oldTime).run()
    }

    // Student 1 should be allowed to submit new reports because old reports are outside the 10m window
    const res = await exports.default.fetch(new Request(`${GOC}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({
        reportedAccountId: student2Id,
        category: 'spam',
        reason: 'New report after window elapsed',
      }),
    }))
    expect(res.status).toBe(200)
  })

  // ── 2. Upload Rate Limiting (Native Binding + Fail-Open KV) ────────────────

  it('2.1. Native UPLOAD_LIMITER triggers 429 at threshold 10 requests / minute', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')

    const createPngForm = (name: string) => {
      const form = new FormData()
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
      form.append('file', new File([pngBytes], name, { type: 'image/png' }))
      return form
    }

    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const res = await exports.default.fetch(new Request(`${GOC}/api/upload`, {
        method: 'POST',
        headers: { Cookie: cookieStudent1 },
        body: createPngForm(`img_${i}.png`),
      }))
      statuses.push(res.status)
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(200))
    expect(statuses[10]).toBe(429)
  })

  it('2.2. Upload fail-open: If KV throws write rate limit error, upload proceeds without HTTP 500', async () => {
    const cookieStudent2 = await dangNhapLayCookie('qa.v2.thu2')

    // Spy on env.RATE_LIMIT.put and make it reject with KV 429 write limit error
    const putSpy = vi.spyOn(env.RATE_LIMIT, 'put').mockRejectedValueOnce(
      new Error('KV 429: Too many writes to the same key per second')
    )

    const form = new FormData()
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
    form.append('file', new File([pngBytes], 'failopen.png', { type: 'image/png' }))

    const res = await exports.default.fetch(new Request(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieStudent2 },
      body: form,
    }))

    // Must succeed with 200, NOT 500!
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.ok).toBe(true)

    putSpy.mockRestore()
  })

  // ── 3. Admit & Auth Rate Limiting Fail-Open Verification ───────────────────

  it('3.1. Admit password check fails open on KV error without breaking 403 on wrong password', async () => {
    const cookieStudent1 = await dangNhapLayCookie('qa.v2.thu1')

    // Create password-protected room
    const taoRes = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
       VALUES ('video', 'Protected Room', 'truong', 'acc:1', 'Chủ phòng', 'password', 'badhash', 'badsalt', 100000, 20, 'mo')
       RETURNING id`
    ).first<{ id: number }>()
    const roomId = taoRes!.id

    // Mock KV put failure
    const putSpy = vi.spyOn(env.RATE_LIMIT, 'put').mockRejectedValueOnce(new Error('KV error'))

    const res = await exports.default.fetch(new Request(`${GOC}/api/rooms/${roomId}/admit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieStudent1 },
      body: JSON.stringify({ password: 'wrongpassword' }),
    }))

    // Rate limit fails open, but password check remains strictly authoritative (403, NOT 500!)
    expect(res.status).toBe(403)
    putSpy.mockRestore()
  })

  it('3.2. Login rate limiter fails open on KV error without allowing wrong password', async () => {
    // Mock KV get failure
    const getSpy = vi.spyOn(env.RATE_LIMIT, 'get').mockRejectedValueOnce(new Error('KV unavailable'))

    const res = await exports.default.fetch(new Request(`${GOC}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ten_dang_nhap: 'qa.v2.thu1', mat_khau: 'wrongpass' }),
    }))

    // Fails open on rate-limit error, but password validation strictly rejects with 400
    expect(res.status).toBe(400)
    getSpy.mockRestore()
  })
})
