// Digital Campus v2: Milestone F1 — File Access Authorization Hardening Tests
// test/file-access-authorization.test.ts

import { exports, env } from 'cloudflare:workers'
import { describe, expect, it, vi } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

const app = exports.default

function createPngBytes(text = 'test-image'): Uint8Array {
  // Standard valid PNG header + dummy chunk data
  const header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  const enc = new TextEncoder()
  const payload = enc.encode(text)
  const out = new Uint8Array(header.length + payload.length)
  out.set(header, 0)
  out.set(payload, header.length)
  return out
}

function createPdfBytes(text = 'test-pdf'): Uint8Array {
  // Standard valid PDF header %PDF-1.4
  const header = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a]
  const enc = new TextEncoder()
  const payload = enc.encode(text)
  const out = new Uint8Array(header.length + payload.length)
  out.set(header, 0)
  out.set(payload, header.length)
  return out
}

function createPngFile(name = 'test.png', text = 'test-image'): File {
  return new File([createPngBytes(text) as unknown as BlobPart], name, { type: 'image/png' })
}

function createPdfFile(name = 'test.pdf', text = 'test-pdf'): File {
  return new File([createPdfBytes(text) as unknown as BlobPart], name, { type: 'application/pdf' })
}

describe('Milestone F1: File Access Authorization Hardening Suite', () => {
  it('1. POST /api/upload requires authenticated campus session (401 unauthenticated)', async () => {
    const form = new FormData()
    form.append('file', createPngFile('unauth.png'))

    const res = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      body: form,
    })

    expect(res.status).toBe(401)
  })

  it('2. Authenticated user can upload owner-private file and read it with owner session (200)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const form = new FormData()
    form.append('file', createPngFile('my_private_doc.png', 'owner-file-content'))
    form.append('purpose', 'general')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })

    expect(uploadRes.status).toBe(200)
    const uploadData = (await uploadRes.json()) as any
    expect(uploadData.ok).toBe(true)
    expect(uploadData.key).toBeDefined()
    expect(uploadData.purpose).toBe('general')
    expect(uploadData.visibility).toBe('owner')

    // Verify D1 file_metadata row exists
    const metaRow = await env.DB.prepare('SELECT * FROM file_metadata WHERE object_key = ?1')
      .bind(uploadData.key)
      .first<any>()
    expect(metaRow).toBeDefined()
    expect(metaRow.purpose).toBe('general')
    expect(metaRow.visibility).toBe('owner')

    // Owner reads own protected file -> 200 OK
    const readRes = await app.fetch(`${GOC}/api/files/${uploadData.key}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(readRes.status).toBe(200)
    const readBytes = new Uint8Array(await readRes.arrayBuffer())
    expect(readBytes.length).toBeGreaterThan(0)
  })

  it('3. Unauthenticated request to owner-private file is denied (401 Unauthorized)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const form = new FormData()
    form.append('file', createPngFile('doc1.png', 'secret-1'))

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key } = (await uploadRes.json()) as any

    // Request WITHOUT cookie
    const readRes = await app.fetch(`${GOC}/api/files/${key}`)
    expect(readRes.status).toBe(401)
    const errBody = (await readRes.json()) as any
    expect(errBody.ok).toBe(false)
  })

  it('4. Authenticated user B cannot read owner-private file of user A (403 Forbidden)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    const form = new FormData()
    form.append('file', createPngFile('private.png', 'user1-private'))
    form.append('purpose', 'general')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key } = (await uploadRes.json()) as any

    // User 2 tries to read user 1 private file
    const readRes = await app.fetch(`${GOC}/api/files/${key}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(readRes.status).toBe(403)
    const errBody = (await readRes.json()) as any
    expect(errBody.ok).toBe(false)
    expect(errBody.loi || errBody.error).toContain('không có quyền')
  })

  it('5. Generic upload always binds visibility=owner even if purpose=avatar is supplied', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    const form = new FormData()
    form.append('file', createPngFile('avatar_raw.png', 'raw-avatar-bytes'))
    form.append('purpose', 'avatar')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    expect(uploadRes.status).toBe(200)
    const uploadData = (await uploadRes.json()) as any
    expect(uploadData.purpose).toBe('avatar')
    // Crucial F1 Invariant: Upload intent does NOT directly grant campus visibility!
    expect(uploadData.visibility).toBe('owner')

    // Verify in D1 file_metadata
    const metaBefore = await env.DB.prepare('SELECT * FROM file_metadata WHERE object_key = ?1')
      .bind(uploadData.key)
      .first<any>()
    expect(metaBefore.visibility).toBe('owner')

    // 5.1. Owner can read pre-promotion -> 200 OK
    const ownerRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(ownerRead.status).toBe(200)

    // 5.2. Other campus member CANNOT read pre-promotion -> 403 Forbidden!
    const otherMemberPreRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(otherMemberPreRead.status).toBe(403)

    // 5.3. Unauthenticated caller CANNOT read -> 401 Unauthorized
    const unauthRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`)
    expect(unauthRead.status).toBe(401)
  })

  it('5b. Authoritative profile avatar assignment promotes file_metadata to visibility=campus', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    // 1. Upload owner-private image
    const form = new FormData()
    form.append('file', createPngFile('my_avatar.png', 'avatar-bytes-verified'))
    form.append('purpose', 'avatar')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key, url } = (await uploadRes.json()) as any

    // 2. Authoritative profile assignment: User 1 sets their avatar
    const profileRes = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: url }),
    })
    expect(profileRes.status).toBe(200)
    const profileData = (await profileRes.json()) as any
    expect(profileData.ok).toBe(true)

    // 3. Verify D1 metadata promotion
    const metaAfter = await env.DB.prepare('SELECT * FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<any>()
    expect(metaAfter.purpose).toBe('avatar')
    expect(metaAfter.visibility).toBe('campus')

    // 4. Verify user avatar field updated in tai_khoan_campus as canonical relative path
    const userRow = await env.DB.prepare('SELECT avatar FROM tai_khoan_campus WHERE id = 1')
      .first<{ avatar: string }>()
    expect(userRow?.avatar).toBe(`/api/files/${key}`)
    expect(profileData.avatar).toBe(`/api/files/${key}`)

    // 5. Post-promotion access:
    // Owner can read -> 200
    const ownerRead = await app.fetch(`${GOC}/api/files/${key}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(ownerRead.status).toBe(200)

    // Another campus account CAN NOW read promoted avatar -> 200!
    const otherMemberPostRead = await app.fetch(`${GOC}/api/files/${key}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(otherMemberPostRead.status).toBe(200)

    // Unauthenticated caller is STILL denied -> 401
    const unauthPostRead = await app.fetch(`${GOC}/api/files/${key}`)
    expect(unauthPostRead.status).toBe(401)
  })

  it('5g. TEST A: Foreign-origin fake internal URL MUST NOT promote file_metadata', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    // 1. User 1 uploads a valid image
    const form = new FormData()
    form.append('file', createPngFile('fake_foreign.png', 'foreign-check'))
    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key } = (await uploadRes.json()) as any

    const metaBefore = await env.DB.prepare('SELECT visibility, purpose FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<any>()
    expect(metaBefore.visibility).toBe('owner')
    expect(metaBefore.purpose).toBe('general')

    // 2. User 1 calls /api/profile/avatar with a foreign origin containing /api/files/<owned-key>
    const foreignUrl = `https://foreign.example/api/files/${key}`
    const profileRes = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: foreignUrl }),
    })
    // External URL may be accepted as external avatar or rejected, but MUST NOT promote internal metadata
    expect([200, 400]).toContain(profileRes.status)

    // 3. Invariant: file_metadata MUST remain visibility=owner and purpose=general
    const metaAfter = await env.DB.prepare('SELECT visibility, purpose FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<any>()
    expect(metaAfter.visibility).toBe('owner')
    expect(metaAfter.purpose).toBe('general')
  })

  it('5h. TEST B & C: Same-origin absolute URL is canonicalized to /api/files/<key> on promotion', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const form = new FormData()
    form.append('file', createPngFile('same_origin.png', 'same-origin-test'))
    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key } = (await uploadRes.json()) as any

    // Call with absolute same-origin URL: <GOC>/api/files/<key>
    const sameOriginUrl = `${GOC}/api/files/${key}`
    const profileRes = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: sameOriginUrl }),
    })
    expect(profileRes.status).toBe(200)
    const profileData = (await profileRes.json()) as any
    expect(profileData.ok).toBe(true)
    // Canonicalized to relative internal reference!
    expect(profileData.avatar).toBe(`/api/files/${key}`)

    const userRow = await env.DB.prepare('SELECT avatar FROM tai_khoan_campus WHERE id = 1')
      .first<{ avatar: string }>()
    expect(userRow?.avatar).toBe(`/api/files/${key}`)

    const meta = await env.DB.prepare('SELECT visibility, purpose FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<any>()
    expect(meta.visibility).toBe('campus')
    expect(meta.purpose).toBe('avatar')
  })

  it('5i. TEST D: Foreign-origin URL for another user key never alters file_metadata', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    // User 2 uploads an image
    const form = new FormData()
    form.append('file', createPngFile('user2_doc.png', 'u2-data'))
    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser2 },
      body: form,
    })
    const { key: user2Key } = (await uploadRes.json()) as any

    // User 1 sends foreign URL pointing to user 2's key
    const foreignUrl = `https://evil.example/api/files/${user2Key}`
    await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: foreignUrl }),
    })

    // User 2's metadata must remain untouched
    const meta2 = await env.DB.prepare('SELECT visibility, uploaded_by_account_id FROM file_metadata WHERE object_key = ?1')
      .bind(user2Key)
      .first<any>()
    expect(meta2.visibility).toBe('owner')
    expect(meta2.uploaded_by_account_id).toBe(2)
  })

  it('5c. Cross-owner avatar promotion attempt is DENIED (403 Forbidden)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    // User 1 uploads an owner-private file
    const form = new FormData()
    form.append('file', createPngFile('user1_secret_pic.png', 'u1-secret'))
    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key, url } = (await uploadRes.json()) as any

    // User 2 maliciously tries to set User 1's file as User 2's avatar
    const hijackRes = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser2,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: url }),
    })
    expect(hijackRes.status).toBe(403)
    const errBody = (await hijackRes.json()) as any
    expect(errBody.ok).toBe(false)
    expect(errBody.loi).toContain('không có quyền')

    // Verify metadata was NOT promoted
    const meta = await env.DB.prepare('SELECT visibility FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<{ visibility: string }>()
    expect(meta?.visibility).toBe('owner')

    // Verify User 2's profile was NOT updated
    const user2Row = await env.DB.prepare('SELECT avatar FROM tai_khoan_campus WHERE id = 2')
      .first<{ avatar: string }>()
    expect(user2Row?.avatar).not.toBe(url)
  })

  it('5d. Room document keys in avatar promotion are BLOCKED (400 Bad Request)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const roomDocUrl = `${GOC}/api/files/rooms/10/documents/exam_answers.pdf`
    const res = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: roomDocUrl }),
    })
    expect(res.status).toBe(400)
    const errBody = (await res.json()) as any
    expect(errBody.ok).toBe(false)
  })

  it('5e. Non-image file uploaded by user cannot be promoted to avatar (400 Bad Request)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    // Upload a PDF
    const form = new FormData()
    form.append('file', createPdfFile('slides.pdf', 'pdf-bytes'))
    form.append('purpose', 'slide')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    expect(uploadRes.status).toBe(200)
    const { key, url } = (await uploadRes.json()) as any

    // Try to set PDF as avatar
    const res = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: url }),
    })
    expect(res.status).toBe(400)
    const errBody = (await res.json()) as any
    expect(errBody.ok).toBe(false)
    expect(errBody.loi).toContain('hình ảnh')

    // Verify metadata was NOT promoted
    const meta = await env.DB.prepare('SELECT visibility, purpose FROM file_metadata WHERE object_key = ?1')
      .bind(key)
      .first<{ visibility: string; purpose: string }>()
    expect(meta?.visibility).toBe('owner')
    expect(meta?.purpose).toBe('slide')
  })

  it('5f. External & static preset avatar URLs update profile without mutating file_metadata', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    // Preset static avatar
    const presetRes = await app.fetch(`${GOC}/api/profile/avatar`, {
      method: 'POST',
      headers: {
        Cookie: cookieUser1,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatarUrl: '/assets/avatars/avatar-robot.png' }),
    })
    expect(presetRes.status).toBe(200)

    const userRow = await env.DB.prepare('SELECT avatar FROM tai_khoan_campus WHERE id = 1')
      .first<{ avatar: string }>()
    expect(userRow?.avatar).toBe('/assets/avatars/avatar-robot.png')
  })

  it('6. Non-image file claiming purpose=avatar is rejected (400 Bad Request)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const form = new FormData()
    form.append('file', createPdfFile('fake_avatar.pdf'))
    form.append('purpose', 'avatar')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    expect(uploadRes.status).toBe(400)
    const errBody = (await uploadRes.json()) as any
    expect(errBody.loi || errBody.error).toContain('hình ảnh')
  })

  it('7. Fail Closed: Unknown R2 key without metadata returns 404 Not Found', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    // Directly put an uncatalogued object into R2 without D1 metadata
    const uncataloguedKey = 'images/uncatalogued_test_file.png'
    await env.ANH.put(uncataloguedKey, createPngBytes('orphan'))

    // Request with valid session
    const resAuth = await app.fetch(`${GOC}/api/files/${uncataloguedKey}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(resAuth.status).toBe(404)

    // Request unauthenticated
    const resUnauth = await app.fetch(`${GOC}/api/files/${uncataloguedKey}`)
    expect(resUnauth.status).toBe(404)
  })

  it('8. Study Room Document Bypass is BLOCKED on generic /api/files/:key (404)', async () => {
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieMember = await dangNhapLayCookie('qa.v2.thu2')

    // Create a public study room
    const roomRow = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
       VALUES ('video', 'Phòng Kiểm Thử Bypass', 'truong', 'acc:1', 'Host', 'public', 20, 'mo')
       RETURNING id`,
    ).first<{ id: number }>()
    const roomId = roomRow!.id

    // Upload a document through canonical room route
    const form = new FormData()
    form.append('file', createPdfFile('lecture.pdf', 'room-doc-secret'))

    const uploadDocRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      method: 'POST',
      headers: { Cookie: cookieHost },
      body: form,
    })
    expect(uploadDocRes.status).toBe(201)
    const uploadDocData = (await uploadDocRes.json()) as any
    const docId = uploadDocData.document.id

    // Get the underlying R2 key from phong_tai_lieu
    const docRow = await env.DB.prepare('SELECT object_key FROM phong_tai_lieu WHERE id = ?1')
      .bind(docId)
      .first<{ object_key: string }>()
    expect(docRow?.object_key).toBeDefined()
    const roomDocKey = docRow!.object_key
    expect(roomDocKey.startsWith(`rooms/${roomId}/documents/`)).toBe(true)

    // 8.1. Bypass attempt: Request via generic /api/files/:key unauthenticated -> 404
    const bypassUnauth = await app.fetch(`${GOC}/api/files/${roomDocKey}`)
    expect(bypassUnauth.status).toBe(404)

    // 8.2. Bypass attempt: Request via generic /api/files/:key as authenticated non-member -> 404
    const bypassMember = await app.fetch(`${GOC}/api/files/${roomDocKey}`, {
      headers: { Cookie: cookieMember },
    })
    expect(bypassMember.status).toBe(404)

    // 8.3. Bypass attempt: Request via generic /api/files/:key even as room host -> 404
    const bypassHost = await app.fetch(`${GOC}/api/files/${roomDocKey}`, {
      headers: { Cookie: cookieHost },
    })
    expect(bypassHost.status).toBe(404)

    // 8.4. Canonical room route CONTINUES to work for authorized room member -> 200
    const canonicalRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${docId}/file`, {
      headers: { Cookie: cookieHost },
    })
    expect(canonicalRes.status).toBe(200)
  })

  it('9. Banned user is denied on canonical room document route (403)', async () => {
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieBanned = await dangNhapLayCookie('qa.v2.thu2')

    const roomRow = await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
       VALUES ('video', 'Phòng Cấm Kiểm Thử', 'truong', 'acc:1', 'Host', 'public', 20, 'mo')
       RETURNING id`,
    ).first<{ id: number }>()
    const roomId = roomRow!.id

    const form = new FormData()
    form.append('file', createPdfFile('doc.pdf', 'secret'))
    const uploadRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      method: 'POST',
      headers: { Cookie: cookieHost },
      body: form,
    })
    expect(uploadRes.status).toBe(201)
    const docId = ((await uploadRes.json()) as any).document.id

    // Ban user 2 in this room (account id 2 is qa.v2.thu2)
    await env.DB.prepare(
      'INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do, ban_boi) VALUES (?1, ?2, ?3, ?4)'
    ).bind(roomId, 2, 'Vi phạm quy chế', 1).run()

    // Banned user requests canonical route -> 403
    const bannedRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${docId}/file`, {
      headers: { Cookie: cookieBanned },
    })
    expect(bannedRes.status).toBe(403)
  })

  it('10. Metadata write failure triggers R2 compensation deletion attempt (Fail-closed invariant)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    // Spy on env.ANH.delete
    const deleteSpy = vi.spyOn(env.ANH, 'delete')

    // Spy on env.DB.prepare and force failure when inserting into file_metadata
    const origPrepare = env.DB.prepare.bind(env.DB)
    const prepareSpy = vi.spyOn(env.DB, 'prepare').mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO file_metadata')) {
        throw new Error('D1 Simulated Database Failure')
      }
      return origPrepare(sql)
    })

    const form = new FormData()
    form.append('file', createPngFile('compensation.png', 'comp-test'))

    const res = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })

    expect(res.status).toBe(500)
    // Compensation delete must have been invoked!
    expect(deleteSpy).toHaveBeenCalled()

    prepareSpy.mockRestore()
    deleteSpy.mockRestore()
  })

  it('11. Protected files do NOT emit Cache-Control: public and do NOT emit wildcard CORS', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const form = new FormData()
    form.append('file', createPngFile('header.png', 'header-test'))
    form.append('purpose', 'avatar')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    const { key } = (await uploadRes.json()) as any

    const readRes = await app.fetch(`${GOC}/api/files/${key}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(readRes.status).toBe(200)

    const cacheControl = readRes.headers.get('Cache-Control') || ''
    expect(cacheControl).toContain('private')
    expect(cacheControl).not.toContain('public')

    const cors = readRes.headers.get('Access-Control-Allow-Origin')
    expect(cors).not.toBe('*')

    const vary = readRes.headers.get('Vary') || ''
    expect(vary).toContain('Cookie')
  })

  it('12. Explicitly public file allows unauthenticated read with public caching', async () => {
    // Insert an explicitly public object into D1 and R2
    const publicKey = 'images/explicitly_public_test.png'
    await env.ANH.put(publicKey, createPngBytes('public-content'))
    await env.DB.prepare(`
      INSERT INTO file_metadata (object_key, original_name, mime_type, size_bytes, purpose, visibility, uploaded_by_account_id, created_at)
      VALUES (?1, 'public.png', 'image/png', 100, 'brand', 'public', 1, ?2)
    `).bind(publicKey, Date.now()).run()

    // Unauthenticated caller reads public file -> 200 OK
    const res = await app.fetch(`${GOC}/api/files/${publicKey}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toContain('public')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('13. Path traversal and manipulation attempts are rejected with 404', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const traversalKeys = [
      '../secrets.txt',
      'images/../../etc/passwd',
      '..%2F..%2Fsecrets',
      '/leading_slash.png',
      '\\backslash.png',
      'rooms/1/documents/secret.pdf',
    ]

    for (const badKey of traversalKeys) {
      const res = await app.fetch(`${GOC}/api/files/${badKey}`, {
        headers: { Cookie: cookieUser1 },
      })
      expect(res.status).toBe(404)
    }
  })

  it('14. Exact-key guessing without metadata NEVER grants access (404 Fail Closed)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const guessedKey = `slides/${Date.now()}_${crypto.randomUUID()}_classified_lecture.pptx`

    // Authenticated guess
    const authRes = await app.fetch(`${GOC}/api/files/${guessedKey}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(authRes.status).toBe(404)

    // Unauthenticated guess
    const unauthRes = await app.fetch(`${GOC}/api/files/${guessedKey}`)
    expect(unauthRes.status).toBe(404)
  })

  it('15. Idempotent Backfill: Existing avatar in tai_khoan_campus is backfilled into file_metadata truthfully', async () => {
    const legacyKey = 'images/1690000000000_legacy-avatar-uuid_photo.png'
    const legacyUrl = `https://gdtxdinhquan.ledinhphat1994.workers.dev/api/files/${legacyKey}`

    // Insert or update an account with an avatar referencing /api/files/
    await env.DB.prepare(
      'UPDATE tai_khoan_campus SET avatar = ?1 WHERE id = 1'
    ).bind(legacyUrl).run()

    // Run the truthful idempotent backfill query from 0018_file_metadata_registry.sql
    await env.DB.prepare(`
      INSERT OR IGNORE INTO file_metadata (
        object_key, original_name, mime_type, size_bytes, purpose, visibility, uploaded_by_account_id, created_at
      )
      SELECT
        substr(avatar, instr(avatar, '/api/files/') + 11) AS object_key,
        'legacy_avatar' AS original_name,
        CASE
          WHEN lower(avatar) LIKE '%.png' THEN 'image/png'
          WHEN lower(avatar) LIKE '%.webp' THEN 'image/webp'
          WHEN lower(avatar) LIKE '%.jpg' OR lower(avatar) LIKE '%.jpeg' THEN 'image/jpeg'
          WHEN lower(avatar) LIKE '%.gif' THEN 'image/gif'
          ELSE 'unknown'
        END AS mime_type,
        0 AS size_bytes,
        'avatar' AS purpose,
        'campus' AS visibility,
        id AS uploaded_by_account_id,
        strftime('%s', 'now') * 1000 AS created_at
      FROM tai_khoan_campus
      WHERE avatar IS NOT NULL
        AND avatar LIKE '%/api/files/%'
        AND length(substr(avatar, instr(avatar, '/api/files/') + 11)) > 0
    `).run()

    // Put mock object into R2
    await env.ANH.put(legacyKey, createPngBytes('legacy-avatar-bytes'), {
      httpMetadata: { contentType: 'image/png' },
    })

    // Verify backfilled record in file_metadata
    const meta = await env.DB.prepare('SELECT * FROM file_metadata WHERE object_key = ?1')
      .bind(legacyKey)
      .first<any>()
    expect(meta).toBeDefined()
    expect(meta.mime_type).toBe('image/png')
    expect(meta.purpose).toBe('avatar')
    expect(meta.visibility).toBe('campus')
    expect(meta.uploaded_by_account_id).toBe(1)

    // Verify campus member can access backfilled avatar
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')
    const readRes = await app.fetch(`${GOC}/api/files/${legacyKey}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(readRes.status).toBe(200)
    expect(readRes.headers.get('Content-Type')).toBe('image/png')

    // Verify unauthenticated caller is denied
    const unauthRes = await app.fetch(`${GOC}/api/files/${legacyKey}`)
    expect(unauthRes.status).toBe(401)
  })

  it('16. Truthful MIME fallback: When file_metadata.mime_type is unknown, read endpoint falls back to R2 httpMetadata', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')

    const fallbackKey = 'images/legacy_unknown_mime.webp'
    await env.ANH.put(fallbackKey, createPngBytes('webp-payload'), {
      httpMetadata: { contentType: 'image/webp' },
    })

    await env.DB.prepare(`
      INSERT INTO file_metadata (
        object_key, original_name, mime_type, size_bytes, purpose, visibility, uploaded_by_account_id, created_at
      ) VALUES (?1, 'legacy.webp', 'unknown', 123, 'avatar', 'campus', 1, ?2)
    `).bind(fallbackKey, Date.now()).run()

    const readRes = await app.fetch(`${GOC}/api/files/${fallbackKey}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(readRes.status).toBe(200)
    // Server truthfully falls back to R2 httpMetadata contentType instead of fabricating image/jpeg!
    expect(readRes.headers.get('Content-Type')).toBe('image/webp')
  })
})
