// Tài liệu phòng học chỉ mở cho người qua cổng phòng, hoặc trình xem ngoài cầm liên kết có chữ ký còn hạn.
// Hồi quy: `?view=1` hay User-Agent chứa "bot" / "google" / "office" từng mở tệp cho bất kỳ ai, không cần đăng nhập.
import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { THOI_HAN_LIEN_KET_XEM_GIAY, kiemTraLienKetXem, kyLienKetXem } from '../worker/lib/lien-ket-tai-lieu'

const app = exports.default
const NOI_DUNG = '%PDF-1.4 tai lieu rieng cua phong'

async function taoPhongCoTaiLieu(ten: string): Promise<{ roomId: number; docId: number }> {
  const phong = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Chủ phòng', 'public', 20, 'mo') RETURNING id`,
  )
    .bind(ten)
    .first<{ id: number }>()
  const roomId = phong!.id
  const objectKey = `study-rooms/${roomId}/${Date.now()}-bai-giang.pdf`
  await env.ANH.put(objectKey, new TextEncoder().encode(NOI_DUNG), { httpMetadata: { contentType: 'application/pdf' } })
  const tl = await env.DB.prepare(
    `INSERT INTO phong_tai_lieu
       (room_id, object_key, original_name, mime_type, size_bytes, file_type, uploaded_by_account_id, uploaded_by_name, created_at)
     VALUES (?1, ?2, 'bai-giang.pdf', 'application/pdf', ?3, 'pdf', 1, 'Chủ phòng', ?4) RETURNING id`,
  )
    .bind(roomId, objectKey, NOI_DUNG.length, Date.now())
    .first<{ id: number }>()
  return { roomId, docId: tl!.id }
}

const tai = (duongDan: string, headers: Record<string, string> = {}) => app.fetch(`${GOC}${duongDan}`, { headers })
const docThan = async (res: Response) => new TextDecoder().decode(await res.arrayBuffer())

describe('Tệp tài liệu phòng học: không mở theo tham số hay User-Agent tự khai', () => {
  it('khách chưa đăng nhập bị chặn dù thêm ?view=1 hay giả User-Agent của bot / Google / Office', async () => {
    const { roomId, docId } = await taoPhongCoTaiLieu('Phòng tài liệu riêng')
    const tep = `/api/rooms/${roomId}/documents/${docId}/file`
    for (const [duongDan, headers] of [
      [`${tep}?view=1`, {}],
      [tep, { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' }],
      [tep, { 'User-Agent': 'Microsoft Office Web Viewer' }],
    ] as const) {
      const res = await tai(duongDan, headers)
      expect(res.status).toBe(401)
      expect(await docThan(res)).not.toContain(NOI_DUNG)
    }
  })

  it('thành viên xem được tệp; phản hồi không cho bộ nhớ đệm dùng chung và không mở CORS kèm cookie', async () => {
    const { roomId, docId } = await taoPhongCoTaiLieu('Phòng tài liệu thành viên')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await tai(`/api/rooms/${roomId}/documents/${docId}/file`, { Cookie: cookie, Origin: 'https://ke-xau.example' })
    expect(res.status).toBe(200)
    expect(await docThan(res)).toBe(NOI_DUNG)
    expect(res.headers.get('Cache-Control')).toContain('private')
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBeNull()
  })
})

describe('Liên kết xem có chữ ký cho Office Online / Google Docs', () => {
  it('chỉ người qua cổng phòng mới xin được liên kết; liên kết mở đúng tệp đó mà không cần cookie', async () => {
    const { roomId, docId } = await taoPhongCoTaiLieu('Phòng trình chiếu Office')
    expect((await tai(`/api/rooms/${roomId}/documents/${docId}/view-link`)).status).toBe(401)

    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await tai(`/api/rooms/${roomId}/documents/${docId}/view-link`, { Cookie: cookie })
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const { url } = (await res.json()) as { url: string }
    expect(url).toMatch(new RegExp(`^/api/rooms/${roomId}/documents/${docId}/file\\?het=\\d+&ky=[\\w-]+$`))

    const xem = await tai(url, { 'User-Agent': 'Microsoft Office Web Viewer' })
    expect(xem.status).toBe(200)
    expect(await docThan(xem)).toBe(NOI_DUNG)
  })

  it('chữ ký bị sửa, dùng cho tài liệu / phòng khác, hoặc hết hạn đều bị từ chối', async () => {
    const a = await taoPhongCoTaiLieu('Phòng A')
    const b = await taoPhongCoTaiLieu('Phòng B')
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const { url } = (await (
      await tai(`/api/rooms/${a.roomId}/documents/${a.docId}/view-link`, { Cookie: cookie })
    ).json()) as { url: string }
    const thamSo = url.split('?')[1]

    const suaChuKy = url.replace(/ky=([\w-])/, (_m, c: string) => `ky=${c === 'A' ? 'B' : 'A'}`)
    expect((await tai(suaChuKy)).status).toBe(401)
    expect((await tai(`/api/rooms/${b.roomId}/documents/${b.docId}/file?${thamSo}`)).status).toBe(401)
    expect((await tai(`/api/rooms/${a.roomId}/documents/${b.docId}/file?${thamSo}`)).status).not.toBe(200)

    const secret = env.SESSION_SECRET
    const cu = await kyLienKetXem(secret, a.roomId, a.docId, Date.now() - (THOI_HAN_LIEN_KET_XEM_GIAY + 5) * 1000)
    expect(await kiemTraLienKetXem(secret, a.roomId, a.docId, String(cu.het), cu.ky)).toBe(false)
    expect((await tai(`/api/rooms/${a.roomId}/documents/${a.docId}/file?het=${cu.het}&ky=${cu.ky}`)).status).toBe(401)
  })

  it('không nhận hạn xa hơn mức máy chủ cấp và không dùng được khoá ký của phiên đăng nhập', async () => {
    const secret = env.SESSION_SECRET
    const moi = await kyLienKetXem(secret, 7, 9)
    expect(await kiemTraLienKetXem(secret, 7, 9, String(moi.het), moi.ky)).toBe(true)
    expect(await kiemTraLienKetXem(secret, 7, 9, String(moi.het + 3600), moi.ky)).toBe(false)
    expect(await kiemTraLienKetXem(secret, 7, 9, 'abc', moi.ky)).toBe(false)
    expect(await kiemTraLienKetXem(undefined, 7, 9, String(moi.het), moi.ky)).toBe(false)
    expect(await kiemTraLienKetXem(`${secret}-khac`, 7, 9, String(moi.het), moi.ky)).toBe(false)
  })
})
