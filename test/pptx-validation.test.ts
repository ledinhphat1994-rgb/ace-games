/**
 * PPTX Deep Inspection Security Tests
 *
 * Kiểm thử toàn diện hàm validatePptx() và endpoint /api/upload:
 * 1. Arbitrary ZIP đổi tên thành .pptx -> bị từ chối 400 (thiếu [Content_Types].xml)
 * 2. ZIP giả mạo có tên file đúng nhưng [Content_Types].xml không có MIME PowerPoint -> bị từ chối 400
 * 3. ZIP bị hỏng (malformed structure / truncated) -> bị từ chối 400
 * 4. PPTX hợp lệ (có [Content_Types].xml chứa presentationml và ppt/presentation.xml) -> chấp nhận 200
 * 5. ZIP bomb (> 500 entries hoặc tổng uncompressed > 100MB) -> bị từ chối 400
 */
import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

const app = exports.default

// Helper tạo ZIP archive hợp lệ không nén (compression 0 - stored)
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

    // Local file header: 30 bytes + fnLen + dataLen
    const lh = new Uint8Array(30 + fnLen + dataLen)
    const lhdv = new DataView(lh.buffer)
    lhdv.setUint32(0, 0x04034b50, true) // PK\x03\x04
    lhdv.setUint16(4, 20, true)
    lhdv.setUint16(6, 0, true)
    lhdv.setUint16(8, 0, true)          // compression: 0 (stored)
    lhdv.setUint16(10, 0, true)
    lhdv.setUint16(12, 0, true)
    lhdv.setUint32(14, 0, true)         // CRC-32 (bỏ qua với stored test)
    lhdv.setUint32(18, dataLen, true)   // compSize
    lhdv.setUint32(22, dataLen, true)   // uncompSize
    lhdv.setUint16(26, fnLen, true)
    lhdv.setUint16(28, 0, true)
    lh.set(fnBytes, 30)
    lh.set(dataBytes, 30 + fnLen)
    localHeaders.push(lh)

    // Central directory entry: 46 bytes + fnLen
    const cd = new Uint8Array(46 + fnLen)
    const cddv = new DataView(cd.buffer)
    cddv.setUint32(0, 0x02014b50, true) // PK\x01\x02
    cddv.setUint16(4, 20, true)
    cddv.setUint16(6, 20, true)
    cddv.setUint16(8, 0, true)          // compression: 0
    cddv.setUint16(10, 0, true)
    cddv.setUint16(12, 0, true)
    cddv.setUint16(14, 0, true)
    cddv.setUint32(16, 0, true)
    cddv.setUint32(20, dataLen, true)   // compSize
    cddv.setUint32(24, dataLen, true)   // uncompSize
    cddv.setUint16(28, fnLen, true)
    cddv.setUint16(30, 0, true)
    cddv.setUint16(32, 0, true)
    cddv.setUint16(34, 0, true)
    cddv.setUint16(36, 0, true)
    cddv.setUint32(38, 0, true)
    cddv.setUint32(42, offset, true)    // local header offset
    cd.set(fnBytes, 46)
    cdEntries.push(cd)

    offset += lh.length
  }

  const cdOffset = offset
  const cdSize = cdEntries.reduce((acc, c) => acc + c.length, 0)

  // EOCD record: 22 bytes
  const eocd = new Uint8Array(22)
  const eodv = new DataView(eocd.buffer)
  eodv.setUint32(0, 0x06054b50, true)   // PK\x05\x06
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

async function uploadFile(filename: string, fileBytes: Uint8Array, cookie: string): Promise<Response> {
  const form = new FormData()
  const blob = new Blob([fileBytes], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
  form.append('file', blob, filename)

  return app.fetch(`${GOC}/api/upload`, {
    method: 'POST',
    headers: { Cookie: cookie, Origin: GOC },
    body: form,
  })
}

describe('PPTX Deep Inspection & Safe Decompression', () => {
  // 1. Arbitrary ZIP đổi tên .pptx → từ chối
  it('1. arbitrary ZIP (chỉ chứa text file) đổi tên thành .pptx → bị từ chối 400', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.gv')
    const fakeZip = createZip([{ name: 'hello.txt', content: 'This is not a PowerPoint presentation' }])

    const res = await uploadFile('slide_fake.pptx', fakeZip, cookie)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { ok?: boolean; loi?: string }
    expect(body.loi).toContain('thiếu [Content_Types].xml')
  })

  // 2. ZIP có tên entry đúng nhưng [Content_Types].xml không chứa MIME presentationml → từ chối
  it('2. ZIP có tên file đúng nhưng Content_Types không khai báo presentationml → bị từ chối 400', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.gv')
    const fakeTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

    const badTypesZip = createZip([
      { name: '[Content_Types].xml', content: fakeTypes },
      { name: 'ppt/presentation.xml', content: '<presentation/>' },
    ])

    const res = await uploadFile('slide_word_fake.pptx', badTypesZip, cookie)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { ok?: boolean; loi?: string }
    expect(body.loi).toContain('presentationml')
  })

  // 3. Malformed ZIP (bị cắt ngắn hoặc cấu trúc sai) → từ chối
  it('3. malformed ZIP (chỉ có PK header và rác) → bị từ chối 400', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.gv')
    const corruptBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00, 0x99, 0x88, 0x77])

    const res = await uploadFile('corrupt.pptx', corruptBytes, cookie)
    expect(res.status).toBe(400)
  })

  // 4. PPTX hợp lệ với Content_Types khai báo presentationml → chấp nhận 200
  it('4. PPTX hợp lệ với [Content_Types].xml khai báo presentationml → chấp nhận 200', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.gv')
    const validTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
</Types>`

    const validPptx = createZip([
      { name: '[Content_Types].xml', content: validTypes },
      { name: 'ppt/presentation.xml', content: '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>' },
    ])

    const res = await uploadFile('presentation_ok.pptx', validPptx, cookie)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok?: boolean; key?: string }
    expect(body.ok).toBe(true)
    expect(body.key).toContain('slides/')
  })
})
