// Sảnh Campus phải thấy phòng học "sống": phòng mới tạo hiện ngay, số người đổi khi có người vào/ra (để biết
// phòng đầy) và phòng đóng biến mất — với người đang mở sảnh, không cần tải lại. Trước đây RoomDO không báo gì
// cho CampusDO nên danh bạ chỉ đổi khi có ai đó mở kết nối Campus mới sau ≥10 giây, và số người luôn là 0.
import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiCampus } from '../shared/protocol/campus'
import type { GoiPhong } from '../shared/protocol/room'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const guiJson = (path: string, cookie: string, body: unknown) =>
  exports.default.fetch(`${GOC}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: GOC },
    body: JSON.stringify(body),
  })

describe('Danh bạ phòng trên sảnh cập nhật trực tiếp', () => {
  it('tạo phòng → hiện ngay; vào/ra → đúng số người; đóng → gỡ khỏi sảnh', async () => {
    const sanh = await moKetNoi<GoiCampus>('/ws/campus', await dangNhapLayCookie('qa.v2.thu3'))
    await sanh.cho('snapshot')

    const chuPhong = await dangNhapLayCookie('qa.v2.gv')
    const tao = await guiJson('/api/rooms', chuPhong, { ten: 'Ôn tập trực tiếp', phamVi: 'truong', accessMode: 'public', sucChua: 2 })
    expect(tao.status).toBe(201)
    const { room } = (await tao.json()) as { room: { id: number } }

    const moi = await sanh.cho('room.upsert', (g) => g.room.id === room.id)
    expect(moi.room).toMatchObject({ ten: 'Ôn tập trực tiếp', soNguoi: 0, sucChua: 2 })

    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${room.id}`, chuPhong)
    await host.cho('room.snapshot')
    await sanh.cho('room.upsert', (g) => g.room.id === room.id && g.room.soNguoi === 1)

    const hocSinh = await moKetNoi<GoiPhong>(`/ws/room/phong-${room.id}`, await dangNhapLayCookie('qa.v2.thu1'))
    await hocSinh.cho('room.snapshot')
    await sanh.cho('room.upsert', (g) => g.room.id === room.id && g.room.soNguoi === 2)

    hocSinh.dong()
    await sanh.cho('room.upsert', (g) => g.room.id === room.id && g.room.soNguoi === 1)

    const dong = await guiJson(`/api/rooms/${room.id}/close`, chuPhong, { reason: 'owner_closed' })
    expect(dong.status).toBe(200)
    await dong.body?.cancel()
    await sanh.cho('room.remove', (g) => g.id === room.id)

    // Báo số người muộn (socket đóng sau khi phòng đã đóng) không được làm phòng hiện lại trên sảnh.
    await sanh.khongNhan('room.upsert', (g) => g.room.id === room.id, 800)

    host.dong()
    sanh.dong()
  })
})
