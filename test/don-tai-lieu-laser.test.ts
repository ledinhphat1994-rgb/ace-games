// Dọn tệp tài liệu khỏi R2 (thay / đóng / xoá tài liệu, phòng đã đóng) và tia laser trên video / bảng / tài liệu nhúng.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong } from '../shared/protocol/room'
import { donTaiLieuBoDo } from '../worker/lib/don-tai-lieu'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import uploadRaw from '../src/features/study/SlideUploadModal.tsx?raw'

async function chenPhong(ten: string, trangThai = 'mo'): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Host', 'public', 20, ?2) RETURNING id`,
  )
    .bind(ten, trangThai)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng')
  return res.id
}

async function chenTaiLieu(roomId: number, daXoa = false): Promise<{ id: number; key: string }> {
  const key = `rooms/${roomId}/documents/thu_${crypto.randomUUID()}.pdf`
  await env.ANH.put(key, new Uint8Array([37, 80, 68, 70]))
  const dong = await env.DB.prepare(
    `INSERT INTO phong_tai_lieu (room_id, object_key, original_name, mime_type, size_bytes, page_count, file_type,
       uploaded_by_account_id, uploaded_by_name, created_at, deleted_at)
     VALUES (?1, ?2, 'thu.pdf', 'application/pdf', 4, 1, 'pdf', 1, 'Host', ?3, ?4) RETURNING id`,
  )
    .bind(roomId, key, Date.now(), daXoa ? Date.now() : null)
    .first<{ id: number }>()
  if (!dong) throw new Error('Không chèn được tài liệu')
  return { id: dong.id, key }
}

const conTep = async (key: string) => (await env.ANH.head(key)) !== null
const dongTaiLieu = (id: number) =>
  env.DB.prepare('SELECT object_key, deleted_at FROM phong_tai_lieu WHERE id = ?1').bind(id).first<{ object_key: string; deleted_at: number | null }>()

async function cho(dieuKien: () => Promise<boolean>, ms = 3000) {
  const han = Date.now() + ms
  while (Date.now() < han) {
    if (await dieuKien()) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('Hết giờ chờ')
}

describe('Dọn tệp tài liệu khỏi R2', () => {
  it('dọn hằng đêm: tài liệu đã xoá và tài liệu của phòng đã đóng; tài liệu đang dùng giữ nguyên', async () => {
    const phongMo = await chenPhong('Phòng đang học')
    const phongDong = await chenPhong('Phòng đã đóng', 'dong')
    const dangDung = await chenTaiLieu(phongMo)
    const daXoa = await chenTaiLieu(phongMo, true)
    const cuaPhongDong = await chenTaiLieu(phongDong)

    expect(await donTaiLieuBoDo(env)).toBeGreaterThanOrEqual(2)
    expect(await conTep(dangDung.key)).toBe(true)
    expect(await conTep(daXoa.key)).toBe(false)
    expect(await conTep(cuaPhongDong.key)).toBe(false)
    expect(await dongTaiLieu(cuaPhongDong.id)).toMatchObject({ object_key: '' })
    expect((await dongTaiLieu(cuaPhongDong.id))?.deleted_at).toBeTypeOf('number')
    // Chạy lại không dọn lại (đã đánh dấu).
    const lanHai = await donTaiLieuBoDo(env)
    expect(await conTep(dangDung.key)).toBe(true)
    expect(lanHai).toBe(0)
  })

  it('thay tài liệu khác / đóng tài liệu trên sân khấu → tệp cũ bị xoá khỏi R2', async () => {
    const phong = await chenPhong('Phòng thay tài liệu')
    const mot = await chenTaiLieu(phong)
    const hai = await chenTaiLieu(phong)
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${phong}`, await dangNhapLayCookie('qa.v2.thu1'))
    await host.cho('room.snapshot')
    const nap = (d: { id: number }) =>
      host.gui({
        type: 'slide.action',
        data: { action: 'load_doc', docId: d.id, docUrl: `/api/rooms/${phong}/documents/${d.id}/file`, docName: 'thu.pdf', fileType: 'pdf', totalPages: 1 },
      })
    nap(mot)
    await host.cho('slide.sync', (g) => g.slide?.docId === mot.id)
    // Nạp lại chính tài liệu đang chiếu: không xoá.
    nap(mot)
    await host.cho('slide.sync', (g) => g.slide?.docId === mot.id)
    expect(await conTep(mot.key)).toBe(true)
    nap(hai)
    await host.cho('slide.sync', (g) => g.slide?.docId === hai.id)
    await cho(async () => !(await conTep(mot.key)))
    expect(await conTep(hai.key)).toBe(true)
    host.gui({ type: 'slide.action', data: { action: 'close_doc' } })
    await host.cho('slide.sync', (g) => g.slide === null)
    await cho(async () => !(await conTep(hai.key)))
    host.dong()
  })

  it('xoá tài liệu qua API → xoá luôn tệp', async () => {
    const phong = await chenPhong('Phòng xoá tài liệu')
    const tl = await chenTaiLieu(phong)
    const res = await exports.default.fetch(`${GOC}/api/rooms/${phong}/documents/${tl.id}`, {
      method: 'DELETE',
      headers: { Cookie: await dangNhapLayCookie('qa.v2.thu1'), Origin: GOC },
    })
    expect(res.status).toBe(200)
    await res.body?.cancel()
    expect(await conTep(tl.key)).toBe(false)
  })
})

describe('Tia laser trên video / bảng / tài liệu nhúng', () => {
  it('người trình chiếu chiếu laser → người khác thấy (kèm tên); học sinh chiếu bị bỏ qua; toạ độ ngoài 0..1 bị từ chối', async () => {
    const phong = await chenPhong('Phòng laser')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${phong}`, await dangNhapLayCookie('qa.v2.thu1'))
    const an = await moKetNoi<GoiPhong>(`/ws/room/phong-${phong}`, await dangNhapLayCookie('qa.v2.thu2'))
    await host.cho('room.snapshot')
    await an.cho('room.snapshot')

    host.gui({ type: 'stage.laser', lop: 'video', point: [0.25, 0.75] })
    const tia = await an.cho('stage.laser')
    expect(tia).toMatchObject({ lop: 'video', point: [0.25, 0.75] })
    expect(tia.senderName).toBeTruthy()
    await host.khongNhan('stage.laser', () => true, 150)
    host.gui({ type: 'stage.laser', lop: 'board', point: null })
    await an.cho('stage.laser', (g) => g.lop === 'board' && g.point === null)

    an.gui({ type: 'stage.laser', lop: 'video', point: [0.5, 0.5] })
    await host.khongNhan('stage.laser', () => true, 200)
    host.gui({ type: 'stage.laser', lop: 'video', point: [1.5, 0.5] } as never)
    await an.khongNhan('stage.laser', (g) => g.point?.[0] === 1.5, 200)
    host.dong()
    an.dong()
  })

  it('giao diện gắn laser vào video, bảng và tài liệu nhúng; hộp tải lên có chú thích loại tệp + tiến độ', () => {
    expect(stageRaw).toContain("{laser('video', 16 / 9)}")
    expect(stageRaw).toContain("{laser('board', 16 / 9)}")
    expect(stageRaw).toContain("{laser('tailieu')}")
    expect(uploadRaw).toContain('data-testid="slide-upload-types"')
    expect(uploadRaw).toContain('xhr.upload.onprogress')
    expect(uploadRaw).not.toContain("'ppt', ")
  })
})
