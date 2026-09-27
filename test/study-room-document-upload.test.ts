// Digital Campus v2: Milestone R1 — Study Room Document Upload Tests
// test/study-room-document-upload.test.ts

import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

const app = exports.default

/** Insert a study room directly into D1 and return its id */
async function insertRoom(
  name: string,
  options: { trangThai?: string; chuPhongKhoa?: string; accessMode?: string; lopId?: number | null } = {},
): Promise<number> {
  const row = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', ?2, ?3, 'Chủ phòng', ?4, 20, ?5)
     RETURNING id`,
  )
    .bind(
      name,
      options.lopId ?? null,
      options.chuPhongKhoa ?? 'acc:1',
      options.accessMode ?? 'public',
      options.trangThai ?? 'mo',
    )
    .first<{ id: number }>()
  if (!row) throw new Error('insertRoom failed')
  return row.id
}

/** Helper to create a valid uncompressed ZIP for testing PPTX */
function createZip(files: { name: string; content: string | Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder()
  const localHeaders: Uint8Array[] = []
  const cdEntries: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const fnBytes = enc.encode(f.name)
    const dataBytes = typeof f.content === 'string' ? enc.encode(f.content) : f.content
    const fnLen = fnBytes.length
    const dataLen = dataBytes.length

    const lh = new Uint8Array(30 + fnLen + dataLen)
    const lhdv = new DataView(lh.buffer)
    lhdv.setUint32(0, 0x04034b50, true) // PK\x03\x04
    lhdv.setUint16(4, 20, true)
    lhdv.setUint16(6, 0, true)
    lhdv.setUint16(8, 0, true)
    lhdv.setUint16(10, 0, true)
    lhdv.setUint16(12, 0, true)
    lhdv.setUint32(14, 0, true)
    lhdv.setUint32(18, dataLen, true)
    lhdv.setUint32(22, dataLen, true)
    lhdv.setUint16(26, fnLen, true)
    lhdv.setUint16(28, 0, true)
    lh.set(fnBytes, 30)
    lh.set(dataBytes, 30 + fnLen)
    localHeaders.push(lh)

    const cd = new Uint8Array(46 + fnLen)
    const cddv = new DataView(cd.buffer)
    cddv.setUint32(0, 0x02014b50, true) // PK\x01\x02
    cddv.setUint16(4, 20, true)
    cddv.setUint16(6, 20, true)
    cddv.setUint16(8, 0, true)
    cddv.setUint16(10, 0, true)
    cddv.setUint16(12, 0, true)
    cddv.setUint16(14, 0, true)
    cddv.setUint32(16, 0, true)
    cddv.setUint32(20, dataLen, true)
    cddv.setUint32(24, dataLen, true)
    cddv.setUint16(28, fnLen, true)
    cddv.setUint16(30, 0, true)
    cddv.setUint16(32, 0, true)
    cddv.setUint16(34, 0, true)
    cddv.setUint16(36, 0, true)
    cddv.setUint32(38, 0, true)
    cddv.setUint32(42, offset, true)
    cd.set(fnBytes, 46)
    cdEntries.push(cd)

    offset += lh.length
  }

  const cdOffset = offset
  const cdSize = cdEntries.reduce((acc, c) => acc + c.length, 0)

  const eocd = new Uint8Array(22)
  const eodv = new DataView(eocd.buffer)
  eodv.setUint32(0, 0x06054b50, true)
  eodv.setUint16(4, 0, true)
  eodv.setUint16(6, 0, true)
  eodv.setUint16(8, files.length, true)
  eodv.setUint16(10, files.length, true)
  eodv.setUint32(12, cdSize, true)
  eodv.setUint32(16, cdOffset, true)
  eodv.setUint16(20, 0, true)

  const totalLen = offset + cdSize + 22
  const out = new Uint8Array(totalLen)
  let pos = 0
  for (const lh of localHeaders) {
    out.set(lh, pos)
    pos += lh.length
  }
  for (const cd of cdEntries) {
    out.set(cd, pos)
    pos += cd.length
  }
  out.set(eocd, pos)
  return out
}

/** Helper to upload document to room */
async function uploadRoomDoc(
  roomId: number,
  filename: string,
  fileBytes: Uint8Array,
  mimeType: string,
  cookie: string,
): Promise<Response> {
  const form = new FormData()
  const blob = new Blob([fileBytes as unknown as BlobPart], { type: mimeType })
  form.append('file', blob, filename)

  return app.fetch(`${GOC}/api/rooms/${roomId}/documents`, {
    method: 'POST',
    headers: { Cookie: cookie, Origin: GOC },
    body: form,
  })
}

describe('R1 — Study Room Document Upload Pipeline', () => {
  it('1. Upload valid PDF succeeds: creates R2 object and D1 record', async () => {
    const roomId = await insertRoom('Phòng Upload PDF Thử')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const pdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')
    const res = await uploadRoomDoc(roomId, 'bai_giang.pdf', pdfBytes, 'application/pdf', cookie)

    expect(res.status).toBe(201)
    const body = await res.json() as { ok: boolean; document: Record<string, unknown> }
    expect(body.ok).toBe(true)
    expect(body.document.originalName).toBe('bai_giang.pdf')
    expect(body.document.mimeType).toBe('application/pdf')
    expect(body.document.fileType).toBe('pdf')
    expect(typeof body.document.id).toBe('number')
    expect(typeof body.document.url).toBe('string')
    expect(body.document.url).toBe(`/api/rooms/${roomId}/documents/${body.document.id}/file`)

    // Verify D1 persistence
    const d1Row = await env.DB.prepare('SELECT * FROM phong_tai_lieu WHERE id = ?').bind(body.document.id).first<any>()
    expect(d1Row).not.toBeNull()
    expect(d1Row.room_id).toBe(roomId)
    expect(d1Row.deleted_at).toBeNull()

    // Verify R2 persistence
    const r2Obj = await env.ANH.get(d1Row.object_key)
    expect(r2Obj).not.toBeNull()
    const r2Content = await r2Obj?.arrayBuffer()
    expect(new Uint8Array(r2Content!)).toEqual(pdfBytes)
  })

  it('2. Upload valid PPTX succeeds: creates R2 object and D1 record', async () => {
    const roomId = await insertRoom('Phòng Upload PPTX Thử')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const validTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`
    const validPptx = createZip([
      { name: '[Content_Types].xml', content: validTypes },
      { name: 'ppt/presentation.xml', content: '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>' },
    ])

    const res = await uploadRoomDoc(roomId, 'slide_hop_le.pptx', validPptx, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', cookie)
    expect(res.status).toBe(201)
    const body = await res.json() as { ok: boolean; document: Record<string, unknown> }
    expect(body.ok).toBe(true)
    expect(body.document.fileType).toBe('pptx')
  })

  it('3. Legacy .ppt format is rejected with explicit 400 and clear guidance', async () => {
    const roomId = await insertRoom('Phòng Thử PPT Cũ')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const legacyPptBytes = new Uint8Array([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1, 0x00, 0x00])
    const res = await uploadRoomDoc(roomId, 'slide_cu.ppt', legacyPptBytes, 'application/vnd.ms-powerpoint', cookie)

    expect(res.status).toBe(400)
    const body = await res.json() as { ok: boolean; code: string; loi: string }
    expect(body.ok).toBe(false)
    expect(body.code).toBe('UPLOAD_UNSUPPORTED_TYPE')
    expect(body.loi).toContain('.ppt cũ')
    expect(body.loi).toContain('.pdf')
  })

  it('4. Fake PDF (text file renamed to .pdf) is rejected via magic byte inspection', async () => {
    const roomId = await insertRoom('Phòng Thử PDF Giả')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const fakePdfBytes = new TextEncoder().encode('This is just plain text, not a PDF')
    const res = await uploadRoomDoc(roomId, 'fake.pdf', fakePdfBytes, 'application/pdf', cookie)

    expect(res.status).toBe(400)
    const body = await res.json() as { ok: boolean; code: string; loi: string }
    expect(body.ok).toBe(false)
    expect(body.code).toBe('UPLOAD_UNSUPPORTED_TYPE')
    expect(body.loi).toContain('chữ ký định dạng')
  })

  it('5. Arbitrary ZIP renamed to .pptx is rejected', async () => {
    const roomId = await insertRoom('Phòng Thử PPTX Giả')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const fakeZip = createZip([{ name: 'text.txt', content: 'Not a PowerPoint file' }])
    const res = await uploadRoomDoc(roomId, 'fake.pptx', fakeZip, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', cookie)

    expect(res.status).toBe(400)
    const body = await res.json() as { ok: boolean; code: string; loi: string }
    expect(body.ok).toBe(false)
    expect(body.code).toBe('UPLOAD_UNSUPPORTED_TYPE')
  })

  it('6. Oversized file (> 30MB) is rejected with 413 UPLOAD_FILE_TOO_LARGE', async () => {
    const roomId = await insertRoom('Phòng Thử File Quá Lớn')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Create a 31MB buffer
    const largeBytes = new Uint8Array(31 * 1024 * 1024)
    // Set PDF magic bytes
    largeBytes.set([0x25, 0x50, 0x44, 0x46, 0x2D])

    const res = await uploadRoomDoc(roomId, 'large.pdf', largeBytes, 'application/pdf', cookie)
    expect(res.status).toBe(413)
    const body = await res.json() as { ok: boolean; code: string }
    expect(body.ok).toBe(false)
    expect(body.code).toBe('UPLOAD_FILE_TOO_LARGE')
  })

  it('7. Unauthenticated upload is rejected with 401 UPLOAD_AUTH_REQUIRED', async () => {
    const roomId = await insertRoom('Phòng Thử No Auth')
    const pdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')
    const res = await uploadRoomDoc(roomId, 'bai_giang.pdf', pdfBytes, 'application/pdf', '')

    expect(res.status).toBe(401)
    const body = await res.json() as { ok: boolean; code: string }
    expect(body.code).toBe('UPLOAD_AUTH_REQUIRED')
  })

  it('8. Banned user is rejected with 403 UPLOAD_ROOM_FORBIDDEN', async () => {
    const roomId = await insertRoom('Phòng Thử Banned User')
    const cookie = await dangNhapLayCookie('qa.v2.thu2')

    // Ban user 2 in this room
    await env.DB.prepare(
      `INSERT INTO phong_ban (phong_id, tai_khoan_id, ly_do, ban_boi, tao_luc)
       VALUES (?1, 2, 'Vi phạm thử nghiệm', 1, datetime('now'))`,
    ).bind(roomId).run()

    const pdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')
    const res = await uploadRoomDoc(roomId, 'bai_giang.pdf', pdfBytes, 'application/pdf', cookie)

    expect(res.status).toBe(403)
    const body = await res.json() as { ok: boolean; code: string }
    expect(body.code).toBe('UPLOAD_ROOM_FORBIDDEN')
  })

  it('9. Upload to closed or closing room is rejected with 409 UPLOAD_ROOM_CLOSED', async () => {
    const closedRoomId = await insertRoom('Phòng Đã Đóng', { trangThai: 'dong' })
    const closingRoomId = await insertRoom('Phòng Đang Đóng', { trangThai: 'closing' })
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const pdfBytes = new TextEncoder().encode('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF')

    const res1 = await uploadRoomDoc(closedRoomId, 'bai_giang.pdf', pdfBytes, 'application/pdf', cookie)
    expect(res1.status).toBe(409)
    const body1 = await res1.json() as { ok: boolean; code: string }
    expect(body1.code).toBe('UPLOAD_ROOM_CLOSED')

    const res2 = await uploadRoomDoc(closingRoomId, 'bai_giang.pdf', pdfBytes, 'application/pdf', cookie)
    expect(res2.status).toBe(409)
    const body2 = await res2.json() as { ok: boolean; code: string }
    expect(body2.code).toBe('UPLOAD_ROOM_CLOSED')
  })

  const goiOoxml = (part: string, contentType: string) =>
    createZip([
      {
        name: '[Content_Types].xml',
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Override PartName="/${part}" ContentType="${contentType}"/>
</Types>`,
      },
      { name: part, content: '<root/>' },
    ])
  const WORD_MAIN = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
  const EXCEL_MAIN = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'

  it('10. Word (.docx) and Excel (.xlsx) with a genuine OOXML structure are accepted (Office viewer group)', async () => {
    const roomId = await insertRoom('Phòng Upload Word Excel')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const resDocx = await uploadRoomDoc(roomId, 'giao_an.docx', goiOoxml('word/document.xml', WORD_MAIN), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', cookie)
    expect(resDocx.status).toBe(201)
    expect(((await resDocx.json()) as { document: { fileType: string } }).document.fileType).toBe('pptx')

    const resXlsx = await uploadRoomDoc(roomId, 'bang_diem.xlsx', goiOoxml('xl/workbook.xml', EXCEL_MAIN), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', cookie)
    expect(resXlsx.status).toBe(201)
  })

  it('11. A ZIP renamed to .docx / .xlsx without the matching main part is rejected', async () => {
    const roomId = await insertRoom('Phòng Upload Đổi Đuôi')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Gói PowerPoint đổi đuôi thành .docx: thiếu word/document.xml
    const pptDoiDuoi = goiOoxml('ppt/presentation.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml')
    const resDocx = await uploadRoomDoc(roomId, 'gia_mao.docx', pptDoiDuoi, 'application/octet-stream', cookie)
    expect(resDocx.status).toBe(400)
    const bodyDocx = await resDocx.json() as { code: string; loi: string }
    expect(bodyDocx.code).toBe('UPLOAD_UNSUPPORTED_TYPE')
    expect(bodyDocx.loi).toContain('word/document.xml')

    // Có xl/workbook.xml nhưng [Content_Types].xml khai sai kiểu nội dung chính
    const saiKieu = goiOoxml('xl/workbook.xml', 'application/xml')
    const resXlsx = await uploadRoomDoc(roomId, 'gia_mao.xlsx', saiKieu, 'application/octet-stream', cookie)
    expect(resXlsx.status).toBe(400)
    expect(((await resXlsx.json()) as { loi: string }).loi).toContain('spreadsheetml.sheet.main+xml')
  })

  it('12. The misspelled ".xlxs" extension is not accepted', async () => {
    const roomId = await insertRoom('Phòng Upload Sai Đuôi')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await uploadRoomDoc(roomId, 'bang_diem.xlxs', goiOoxml('xl/workbook.xml', EXCEL_MAIN), 'application/octet-stream', cookie)
    expect(res.status).toBe(400)
    expect(((await res.json()) as { code: string }).code).toBe('UPLOAD_UNSUPPORTED_TYPE')
  })
})
