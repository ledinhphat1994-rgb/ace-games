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

  it('5. Avatar upload binds visibility=campus: readable by any campus member, denied for unauth (401)', async () => {
    const cookieUser1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')

    const form = new FormData()
    form.append('file', createPngFile('avatar.png', 'avatar-bytes'))
    form.append('purpose', 'avatar')

    const uploadRes = await app.fetch(`${GOC}/api/upload`, {
      method: 'POST',
      headers: { Cookie: cookieUser1 },
      body: form,
    })
    expect(uploadRes.status).toBe(200)
    const uploadData = (await uploadRes.json()) as any
    expect(uploadData.purpose).toBe('avatar')
    expect(uploadData.visibility).toBe('campus')

    // 5.1. Unauthenticated -> 401
    const unauthRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`)
    expect(unauthRead.status).toBe(401)

    // 5.2. Owner -> 200
    const ownerRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`, {
      headers: { Cookie: cookieUser1 },
    })
    expect(ownerRead.status).toBe(200)

    // 5.3. Another campus member -> 200
    const otherMemberRead = await app.fetch(`${GOC}/api/files/${uploadData.key}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(otherMemberRead.status).toBe(200)
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

  it('10. Metadata write failure triggers R2 compensation deletion (Zero orphan objects)', async () => {
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

  it('15. Idempotent Backfill: Existing avatar in tai_khoan_campus is backfilled into file_metadata', async () => {
    const legacyKey = 'images/1690000000000_legacy-avatar-uuid_photo.jpg'
    const legacyUrl = `https://gdtxdinhquan.ledinhphat1994.workers.dev/api/files/${legacyKey}`

    // Insert or update an account with an avatar referencing /api/files/
    await env.DB.prepare(
      'UPDATE tai_khoan_campus SET avatar = ?1 WHERE id = 1'
    ).bind(legacyUrl).run()

    // Run the idempotent backfill query from 0018_file_metadata_registry.sql
    await env.DB.prepare(`
      INSERT OR IGNORE INTO file_metadata (
        object_key, original_name, mime_type, size_bytes, purpose, visibility, uploaded_by_account_id, created_at
      )
      SELECT
        substr(avatar, instr(avatar, '/api/files/') + 11) AS object_key,
        'legacy_avatar' AS original_name,
        'image/jpeg' AS mime_type,
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
    await env.ANH.put(legacyKey, createPngBytes('legacy-avatar-bytes'))

    // Verify backfilled record in file_metadata
    const meta = await env.DB.prepare('SELECT * FROM file_metadata WHERE object_key = ?1')
      .bind(legacyKey)
      .first<any>()
    expect(meta).toBeDefined()
    expect(meta.purpose).toBe('avatar')
    expect(meta.visibility).toBe('campus')
    expect(meta.uploaded_by_account_id).toBe(1)

    // Verify campus member can access backfilled avatar
    const cookieUser2 = await dangNhapLayCookie('qa.v2.thu2')
    const readRes = await app.fetch(`${GOC}/api/files/${legacyKey}`, {
      headers: { Cookie: cookieUser2 },
    })
    expect(readRes.status).toBe(200)

    // Verify unauthenticated caller is denied
    const unauthRes = await app.fetch(`${GOC}/api/files/${legacyKey}`)
    expect(unauthRes.status).toBe(401)
  })
})
