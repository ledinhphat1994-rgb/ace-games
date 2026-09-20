// Digital Campus v2: Milestone R1 — Study Room Document Auth & Lifecycle Tests
// test/study-room-document-auth.test.ts

import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'

const app = exports.default

/** Insert a study room directly into D1 and return its id */
async function insertRoom(
  name: string,
  options: {
    trangThai?: string
    chuPhongKhoa?: string
    accessMode?: string
    matKhauHash?: string | null
    matKhauSalt?: string | null
    matKhauIterations?: number | null
    lopId?: number | null
    phamVi?: string
  } = {},
): Promise<number> {
  const row = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, mat_khau_hash, mat_khau_salt, mat_khau_iterations, suc_chua, trang_thai)
     VALUES ('video', ?1, ?2, ?3, ?4, 'Chủ phòng', ?5, ?6, ?7, ?8, 20, ?9)
     RETURNING id`,
  )
    .bind(
      name,
      options.phamVi ?? 'truong',
      options.lopId ?? null,
      options.chuPhongKhoa ?? 'acc:1',
      options.accessMode ?? 'public',
      options.matKhauHash ?? null,
      options.matKhauSalt ?? null,
      options.matKhauIterations ?? null,
      options.trangThai ?? 'mo',
    )
    .first<{ id: number }>()
  if (!row) throw new Error('insertRoom failed')
  return row.id
}

/** Insert document directly or via upload helper */
async function insertDocument(
  roomId: number,
  originalName: string,
  content: Uint8Array,
  uploadedByAccountId = 1,
  uploadedByName = 'Host',
): Promise<{ id: number; objectKey: string }> {
  const objectKey = `study-rooms/${roomId}/${Date.now()}-${originalName}`
  await env.ANH.put(objectKey, content, {
    httpMetadata: { contentType: 'application/pdf' },
  })

  const row = await env.DB.prepare(
    `INSERT INTO phong_tai_lieu
       (room_id, object_key, original_name, mime_type, size_bytes, file_type, uploaded_by_account_id, uploaded_by_name, created_at)
     VALUES (?1, ?2, ?3, 'application/pdf', ?4, 'pdf', ?5, ?6, ?7)
     RETURNING id`,
  )
    .bind(roomId, objectKey, originalName, content.length, uploadedByAccountId, uploadedByName, Date.now())
    .first<{ id: number }>()

  if (!row) throw new Error('Failed to insert test document')
  return { id: row.id, objectKey }
}

describe('R1 — Study Room Document Authorization & Retrieval', () => {
  it('1. GET /api/rooms/:id/documents lists active documents for room member', async () => {
    const roomId = await insertRoom('Phòng Danh Sách Tài Liệu')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const pdfData = new TextEncoder().encode('%PDF-1.4 test')
    await insertDocument(roomId, 'doc1.pdf', pdfData, 1, 'Chủ phòng')
    await insertDocument(roomId, 'doc2.pdf', pdfData, 1, 'Chủ phòng')

    const res = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      headers: { Cookie: cookie, Origin: GOC },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean; documents: Array<{ id: number; originalName: string }> }
    expect(body.ok).toBe(true)
    expect(body.documents.length).toBe(2)
    expect(body.documents.some((d) => d.originalName === 'doc1.pdf')).toBe(true)
    expect(body.documents.some((d) => d.originalName === 'doc2.pdf')).toBe(true)
  })

  it('2. GET /api/rooms/:id/documents/:docId/file streams file to authorized room member', async () => {
    const roomId = await insertRoom('Phòng Tải File Hợp Lệ')
    const cookie = await dangNhapLayCookie('qa.v2.thu2') // member

    const pdfData = new TextEncoder().encode('%PDF-1.4 Authorized Stream Content')
    const doc = await insertDocument(roomId, 'giao_trinh.pdf', pdfData, 1, 'Chủ phòng')

    const res = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Cookie: cookie, Origin: GOC },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    expect(res.headers.get('Content-Disposition')).toContain('giao_trinh.pdf')

    const streamBytes = new Uint8Array(await res.arrayBuffer())
    expect(streamBytes).toEqual(pdfData)
  })

  it('3. Cross-room access denial: member of Room A cannot download Room B document', async () => {
    const roomA = await insertRoom('Phòng Lớp A', { phamVi: 'lop', lopId: 1 })
    const roomB = await insertRoom('Phòng Lớp B', { phamVi: 'lop', lopId: 2 })

    // User 1 belongs to lopId 1 (can access roomA)
    // User 3 belongs to lopId 2 (can access roomB)
    const cookieUser3 = await dangNhapLayCookie('qa.v2.thu3')

    const pdfData = new TextEncoder().encode('%PDF-1.4 Secret Room A Document')
    const docA = await insertDocument(roomA, 'secret_a.pdf', pdfData, 1, 'Chủ phòng A')

    // User 3 attempts to download Room A's document through Room A's route
    const res1 = await app.fetch(`${GOC}/api/rooms/${roomA}/documents/${docA.id}/file`, {
      headers: { Cookie: cookieUser3, Origin: GOC },
    })
    expect(res1.status).toBe(403)

    // User 3 attempts cross-room ID spoofing (asking Room B to serve Room A's doc)
    const res2 = await app.fetch(`${GOC}/api/rooms/${roomB}/documents/${docA.id}/file`, {
      headers: { Cookie: cookieUser3, Origin: GOC },
    })
    expect(res2.status).toBe(404) // Does not belong to Room B
  })

  it('4. Unauthenticated download is rejected with 401', async () => {
    const roomId = await insertRoom('Phòng Public Không Đăng Nhập')
    const pdfData = new TextEncoder().encode('%PDF-1.4 Test')
    const doc = await insertDocument(roomId, 'test.pdf', pdfData)

    const res = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Origin: GOC },
    })
    expect(res.status).toBe(401)
  })

  it('5. DELETE /api/rooms/:id/documents/:docId soft deletes document', async () => {
    const roomId = await insertRoom('Phòng Xóa Tài Liệu', { chuPhongKhoa: 'acc:1' })
    const cookieUploader = await dangNhapLayCookie('qa.v2.thu2') // acc:2
    const cookieOtherStudent = await dangNhapLayCookie('qa.v2.thu3') // acc:3
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // acc:1 (host)

    const pdfData = new TextEncoder().encode('%PDF-1.4 Deletable')
    const doc = await insertDocument(roomId, 'deletable.pdf', pdfData, 2, 'User 2')

    // Other student (acc:3) cannot delete user 2's document
    const resOther = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieOtherStudent, Origin: GOC },
    })
    expect(resOther.status).toBe(403)

    // Uploader (acc:2) CAN delete their own document
    const resUploader = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieUploader, Origin: GOC },
    })
    expect(resUploader.status).toBe(200)

    // Document is now soft-deleted in D1
    const row = await env.DB.prepare('SELECT deleted_at FROM phong_tai_lieu WHERE id = ?').bind(doc.id).first<any>()
    expect(row?.deleted_at).not.toBeNull()

    // Subsequent list excludes it
    const listRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      headers: { Cookie: cookieHost, Origin: GOC },
    })
    const listBody = await listRes.json() as { ok: boolean; documents: Array<{ id: number }> }
    expect(listBody.documents.some((d) => d.id === doc.id)).toBe(false)

    // Subsequent download returns 404
    const dlRes = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Cookie: cookieHost, Origin: GOC },
    })
    expect(dlRes.status).toBe(404)
  })

  it('6. Password-protected room: Document access requires canonical room admission', async () => {
    const salt = taoSalt()
    const hash = await bamMatKhau('matkhau123', salt, 1000)
    const roomId = await insertRoom('Phòng Bảo Mật Mật Khẩu', {
      accessMode: 'password',
      matKhauHash: hash,
      matKhauSalt: salt,
      matKhauIterations: 1000,
    })

    const cookieUserB = await dangNhapLayCookie('qa.v2.thu2') // member with valid scope
    const pdfData = new TextEncoder().encode('%PDF-1.4 Secret Room File')
    const doc = await insertDocument(roomId, 'secret_pass.pdf', pdfData, 1, 'Host')

    // 6.1. Before entering password:
    // GET /documents -> 403
    const resListBefore = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      headers: { Cookie: cookieUserB, Origin: GOC },
    })
    expect(resListBefore.status).toBe(403)

    // GET /documents/:docId/file -> 403
    const resFileBefore = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Cookie: cookieUserB, Origin: GOC },
    })
    expect(resFileBefore.status).toBe(403)

    // POST /documents -> 403
    const formBefore = new FormData()
    formBefore.append('file', new Blob([pdfData], { type: 'application/pdf' }), 'upload_pass.pdf')
    const resUploadBefore = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      method: 'POST',
      headers: { Cookie: cookieUserB, Origin: GOC },
      body: formBefore,
    })
    expect(resUploadBefore.status).toBe(403)

    // 6.2. User B admits with password -> receives admission cookie
    const admitRes = await app.fetch(`${GOC}/api/rooms/${roomId}/admit`, {
      method: 'POST',
      headers: { Cookie: cookieUserB, Origin: GOC, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'matkhau123' }),
    })
    expect(admitRes.status).toBe(200)

    const setCookieHeader = admitRes.headers.get('Set-Cookie') || ''
    const match = setCookieHeader.match(/(room_admit_\d+=[^;]+)/)
    expect(match).not.toBeNull()
    const admitCookie = match![1]

    const cookieWithAdmission = `${cookieUserB}; ${admitCookie}`

    // 6.3. After admission:
    // GET /documents -> 200
    const resListAfter = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      headers: { Cookie: cookieWithAdmission, Origin: GOC },
    })
    expect(resListAfter.status).toBe(200)

    // GET /documents/:docId/file -> 200
    const resFileAfter = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Cookie: cookieWithAdmission, Origin: GOC },
    })
    expect(resFileAfter.status).toBe(200)

    // 6.4. Tampered / invalid admission token -> 403
    const tamperedCookie = `${cookieUserB}; room_admit_${roomId}=tampered.token.here`
    const resListTampered = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
      headers: { Cookie: tamperedCookie, Origin: GOC },
    })
    expect(resListTampered.status).toBe(403)

    const resFileTampered = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
      headers: { Cookie: tamperedCookie, Origin: GOC },
    })
    expect(resFileTampered.status).toBe(403)
  })

  it('7. R2 / D1 consistency: D1 metadata exists but R2 object missing returns truthful 404', async () => {
    const roomId = await insertRoom('Phòng Kiểm Tra File R2 Mất')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Insert D1 metadata pointing to non-existent R2 key
    const phantomKey = `study-rooms/${roomId}/phantom_${Date.now()}.pdf`
    const row = await env.DB.prepare(
      `INSERT INTO phong_tai_lieu
         (room_id, object_key, original_name, mime_type, size_bytes, file_type, uploaded_by_account_id, uploaded_by_name, created_at)
       VALUES (?1, ?2, 'phantom.pdf', 'application/pdf', 100, 'pdf', 1, 'Host', ?3)
       RETURNING id`,
    )
      .bind(roomId, phantomKey, Date.now())
      .first<{ id: number }>()

    const res = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${row!.id}/file`, {
      headers: { Cookie: cookie, Origin: GOC },
    })
    expect(res.status).toBe(404)
    const body = await res.json() as { ok: boolean; loi: string }
    expect(body.ok).toBe(false)
    expect(body.loi).toContain('Tệp không tồn tại')
  })

  it('8. Banned member is denied document access with 403', async () => {
    const roomId = await insertRoom('Phòng Cấm Thành Viên')
    const cookie = await dangNhapLayCookie('qa.v2.thu2') // acc:2

    const pdfData = new TextEncoder().encode('%PDF-1.4 File for Banned Test')
    const doc = await insertDocument(roomId, 'ban_test.pdf', pdfData, 1, 'Host')

    // Ban acc:2 from this room
    await env.DB.prepare(
      'INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do) VALUES (?1, 2, "Spam")',
    )
      .bind(roomId)
      .run()

    try {
      const resList = await app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
        headers: { Cookie: cookie, Origin: GOC },
      })
      expect(resList.status).toBe(403)

      const resFile = await app.fetch(`${GOC}/api/rooms/${roomId}/documents/${doc.id}/file`, {
        headers: { Cookie: cookie, Origin: GOC },
      })
      expect(resFile.status).toBe(403)
    } finally {
      await env.DB.prepare('DELETE FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = 2').bind(roomId).run()
    }
  })

  it('9. Closed or closing room rejects document uploads with 409', async () => {
    const closedRoomId = await insertRoom('Phòng Đã Đóng', { trangThai: 'dong' })
    const closingRoomId = await insertRoom('Phòng Đang Đóng', { trangThai: 'closing' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const pdfData = new TextEncoder().encode('%PDF-1.4 Closed Upload')
    const form1 = new FormData()
    form1.append('file', new Blob([pdfData], { type: 'application/pdf' }), 'test.pdf')

    const res1 = await app.fetch(`${GOC}/api/rooms/${closedRoomId}/documents`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: GOC },
      body: form1,
    })
    expect(res1.status).toBe(409)

    const form2 = new FormData()
    form2.append('file', new Blob([pdfData], { type: 'application/pdf' }), 'test.pdf')
    const res2 = await app.fetch(`${GOC}/api/rooms/${closingRoomId}/documents`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: GOC },
      body: form2,
    })
    expect(res2.status).toBe(409)
  })
})
