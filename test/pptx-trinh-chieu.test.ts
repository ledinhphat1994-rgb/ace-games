// Trình chiếu .pptx ngay trên trình duyệt: máy chủ đếm số slide lúc tải lên, người trình chiếu sửa được số trang
// (slide ẩn / tệp cũ) mà không xoá chú thích, và chỉ .pptx thật mới được dựng + đồng bộ trang.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong, SlideState } from '../shared/protocol/room'
import { deriveDocumentStatus, laTepPptx } from '../src/features/study/workspace/types'
import { validateDocumentUpload } from '../worker/lib/document-validation'

/** ZIP "stored" tối giản đủ để qua kiểm tra OOXML (giống test tải tài liệu phòng). */
function taoZip(tep: { ten: string; noiDung: string }[]): Uint8Array {
  const enc = new TextEncoder()
  const cacDauFile: Uint8Array[] = []
  const cacMucCd: Uint8Array[] = []
  let viTri = 0
  for (const t of tep) {
    const ten = enc.encode(t.ten)
    const du = enc.encode(t.noiDung)
    const dau = new Uint8Array(30 + ten.length + du.length)
    const dv = new DataView(dau.buffer)
    dv.setUint32(0, 0x04034b50, true)
    dv.setUint16(8, 0, true)
    dv.setUint32(18, du.length, true)
    dv.setUint32(22, du.length, true)
    dv.setUint16(26, ten.length, true)
    dau.set(ten, 30)
    dau.set(du, 30 + ten.length)
    cacDauFile.push(dau)
    const cd = new Uint8Array(46 + ten.length)
    const cdv = new DataView(cd.buffer)
    cdv.setUint32(0, 0x02014b50, true)
    cdv.setUint32(20, du.length, true)
    cdv.setUint32(24, du.length, true)
    cdv.setUint16(28, ten.length, true)
    cdv.setUint32(42, viTri, true)
    cd.set(ten, 46)
    cacMucCd.push(cd)
    viTri += dau.length
  }
  const coCd = cacMucCd.reduce((a, c) => a + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, tep.length, true)
  ev.setUint16(10, tep.length, true)
  ev.setUint32(12, coCd, true)
  ev.setUint32(16, viTri, true)
  const ra = new Uint8Array(viTri + coCd + 22)
  let p = 0
  for (const d of [...cacDauFile, ...cacMucCd, eocd]) {
    ra.set(d, p)
    p += d.length
  }
  return ra
}

const KIEU_TRINH_CHIEU = `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>`

const banTrinhChieu = (soSlide: number) =>
  taoZip([
    { ten: '[Content_Types].xml', noiDung: KIEU_TRINH_CHIEU },
    { ten: 'ppt/presentation.xml', noiDung: '<p:presentation/>' },
    ...Array.from({ length: soSlide }, (_, i) => ({ ten: `ppt/slides/slide${i + 1}.xml`, noiDung: '<p:sld/>' })),
    { ten: 'ppt/slides/_rels/slide1.xml.rels', noiDung: '<Relationships/>' },
  ])

describe('Tải .pptx: máy chủ đếm số slide làm số trang', () => {
  it('đếm đúng ppt/slides/slideN.xml (không tính tệp _rels)', async () => {
    const kq = await validateDocumentUpload('bai-giang.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', banTrinhChieu(7))
    expect(kq.ok).toBe(true)
    expect(kq.fileType).toBe('pptx')
    expect(kq.pageCount).toBe(7)
  })
})

describe('Chỉ .pptx thật được dựng trên trình duyệt và đồng bộ trang', () => {
  const pptx: SlideState = { docUrl: '/api/rooms/1/documents/9/file', docName: 'Bài 3.pptx', fileType: 'pptx', currentPage: 1, totalPages: 5 }
  it('nhận .pptx theo tên tệp; Word / Excel / Google Slides cùng nhóm Office thì không', () => {
    expect(laTepPptx(pptx)).toBe(true)
    expect(deriveDocumentStatus(pptx)).toBe('ready')
    expect(laTepPptx({ ...pptx, docName: 'giao-an.docx' })).toBe(false)
    expect(laTepPptx({ ...pptx, docName: 'diem.xlsx' })).toBe(false)
    expect(laTepPptx({ ...pptx, docUrl: 'https://docs.google.com/presentation/d/abc/edit', docName: 'x.pptx' })).toBe(false)
  })
})

async function chenPhong(ten: string): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Host', 'public', 20, 'mo') RETURNING id`,
  )
    .bind(ten)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng')
  return res.id
}

async function taiLenPptx(phongId: number, cookie: string, soSlide: number): Promise<{ id: number; url: string; pageCount: number }> {
  const form = new FormData()
  form.append('file', new Blob([banTrinhChieu(soSlide) as unknown as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), 'Bài giảng.pptx')
  const res = await exports.default.fetch(`${GOC}/api/rooms/${phongId}/documents`, { method: 'POST', headers: { Cookie: cookie, Origin: GOC }, body: form })
  expect(res.status).toBe(201)
  const body = (await res.json()) as { document: { id: number; url?: string; fileUrl?: string; pageCount: number } }
  return { id: body.document.id, url: body.document.url ?? body.document.fileUrl ?? `/api/rooms/${phongId}/documents/${body.document.id}/file`, pageCount: body.document.pageCount }
}

describe('RoomDO: người trình chiếu sửa số trang .pptx', () => {
  it('chủ phòng sửa được (kẹp trang hiện tại, giữ chú thích); học sinh thì không; PDF không bị đổi', async () => {
    const phongId = await chenPhong('Phòng pptx')
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, cookieHost)
    const hs = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, await dangNhapLayCookie('qa.v2.thu2'))
    await host.cho('room.snapshot')
    await hs.cho('room.snapshot')

    const tai = await taiLenPptx(phongId, cookieHost, 6)
    expect(tai.pageCount).toBe(6)

    host.gui({ type: 'slide.action', data: { action: 'load_doc', docId: tai.id, docUrl: tai.url, docName: 'Bài giảng.pptx', fileType: 'pptx', totalPages: tai.pageCount } })
    await hs.cho('slide.sync', (g) => g.slide?.totalPages === 6)
    await hs.cho('slide.annotation', (g) => g.action === 'clear') // load_doc luôn xoá chú thích cũ
    host.gui({ type: 'slide.action', data: { action: 'change_page', page: 6 } })
    await hs.cho('slide.sync', (g) => g.slide?.currentPage === 6)
    host.gui({ type: 'slide.action', data: { action: 'annotation_add', stroke: { id: 'giu-lai', page: 2, tool: 'pen', points: [[0.1, 0.1], [0.2, 0.2]], color: '#f00', size: 6 } } })
    await hs.cho('slide.annotation', (g) => g.action === 'add')

    // Học sinh không sửa được.
    hs.gui({ type: 'slide.action', data: { action: 'set_total_pages', totalPages: 2 } })
    await hs.cho('error')

    // Chủ phòng báo có 5 slide (1 slide ẩn): trang hiện tại 6 bị kẹp về 5, chú thích không bị xoá.
    host.gui({ type: 'slide.action', data: { action: 'set_total_pages', totalPages: 5 } })
    const dongBo = await hs.cho('slide.sync', (g) => g.slide?.totalPages === 5)
    expect(dongBo.slide?.currentPage).toBe(5)
    await hs.khongNhan('slide.annotation', (g) => g.action === 'clear', 200)

    // Hiệu ứng theo cú bấm: bước đồng bộ cùng trang; đổi trang không kèm bước thì về 0; học sinh không điều khiển được.
    host.gui({ type: 'slide.action', data: { action: 'change_page', page: 2, step: 3 } })
    const buoc3 = await hs.cho('slide.sync', (g) => g.slide?.currentPage === 2)
    expect(buoc3.slide?.step).toBe(3)
    host.gui({ type: 'slide.action', data: { action: 'change_page', page: 3 } })
    const trang3 = await hs.cho('slide.sync', (g) => g.slide?.currentPage === 3)
    expect(trang3.slide?.step).toBe(0)
    hs.gui({ type: 'slide.action', data: { action: 'change_page', page: 3, step: 1 } })
    await hs.cho('error')
    await host.khongNhan('slide.sync', (g) => g.slide?.step === 1, 200)

    // Không áp dụng cho tài liệu không phải .pptx.
    host.gui({ type: 'slide.action', data: { action: 'load_doc', docUrl: tai.url, docName: 'x.pdf', fileType: 'pdf', totalPages: 3 } })
    await hs.cho('slide.sync', (g) => g.slide?.fileType === 'pdf')
    host.gui({ type: 'slide.action', data: { action: 'change_page', page: 2, step: 4 } })
    const pdf = await hs.cho('slide.sync', (g) => g.slide?.currentPage === 2)
    expect(pdf.slide?.step).toBeUndefined()
    host.gui({ type: 'slide.action', data: { action: 'set_total_pages', totalPages: 9 } })
    await hs.khongNhan('slide.sync', (g) => g.slide?.totalPages === 9, 300)
    host.dong()
    hs.dong()
  })
})
