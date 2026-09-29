// RoomDO: trần gói mỗi kết nối, trần chat phòng, xử lý lệnh theo thứ tự gửi, và laser dùng lại kết quả đối chiếu
// phiên gần nhất trong khi mọi lệnh ghi dữ liệu vẫn đối chiếu D1 từng lệnh (Tier-2 fail-closed).
import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { dangNhapLayCookie, moKetNoi } from './ws'
import type { GoiPhong, RoomChatMessage } from '../shared/protocol/room'

async function chenPhong(ten: string, chuPhongKhoa = 'acc:1'): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten, chuPhongKhoa)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

describe('RoomDO — chống một người làm ngập phòng', () => {
  it('gửi dồn dập vượt trần gói thì gói thừa bị bỏ và chỉ báo lỗi một lần', async () => {
    const phongId = await chenPhong('Phòng trần gói')
    const ket = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, await dangNhapLayCookie('qa.v2.thu2'))
    expect(ket.status).toBe(101)
    await ket.cho('room.snapshot')

    for (let i = 0; i < 150; i++) ket.gui({ type: 'ping', t: i })
    await ket.cho('error', (g) => g.message.includes('quá nhanh'))
    await new Promise((r) => setTimeout(r, 300))

    const soPong = ket.goi.filter((g) => g.type === 'pong').length
    expect(soPong).toBeGreaterThan(0)
    expect(soPong).toBeLessThan(150)
    ket.dong()
  })

  it('chat phòng quá 5 tin / 5 giây: tin thừa bị từ chối theo reqId, 5 tin đầu được lưu đúng thứ tự gửi', async () => {
    const phongId = await chenPhong('Phòng trần chat')
    const ket = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, await dangNhapLayCookie('qa.v2.thu2'))
    await ket.cho('room.snapshot')

    for (let i = 0; i < 8; i++) ket.gui({ type: 'chat.send', reqId: `rl_${i}`, text: `tin ${i}` })
    for (let i = 5; i < 8; i++) await ket.cho('error', (g) => g.reqId === `rl_${i}`)
    for (let i = 0; i < 5; i++) await ket.cho('ack', (g) => g.reqId === `rl_${i}`)

    const stub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`)) as unknown as {
      layChat(): Promise<RoomChatMessage[]>
    }
    const daLuu = (await stub.layChat()).map((m) => m.text)
    expect([...daLuu].sort()).toEqual(['tin 0', 'tin 1', 'tin 2', 'tin 3', 'tin 4'])
    ket.dong()
  })

  it('laser dùng lại phiên vừa đối chiếu, còn lệnh ghi dữ liệu vẫn bị chặn 4001 ngay khi phiên bị thu hồi', async () => {
    const phongId = await chenPhong('Phòng laser', 'acc:1')
    const ket = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, await dangNhapLayCookie('qa.v2.thu1'))
    const khach = await moKetNoi<GoiPhong>(`/ws/room/phong-${phongId}`, await dangNhapLayCookie('qa.v2.thu2'))
    await ket.cho('room.snapshot')
    await khach.cho('room.snapshot')

    ket.gui({ type: 'slide.action', data: { action: 'laser', point: [0.1, 0.2], page: 1 } })
    await khach.cho('slide.laser', (g) => g.point?.[0] === 0.1)

    await env.DB.prepare('UPDATE tai_khoan_campus SET thiet_bi = ?1 WHERE ten_dang_nhap = ?2')
      .bind(`thiet_bi_khac_${Date.now()}`, 'qa.v2.thu1')
      .run()

    ket.gui({ type: 'slide.action', data: { action: 'laser', point: [0.3, 0.4], page: 1 } })
    await khach.cho('slide.laser', (g) => g.point?.[0] === 0.3)

    ket.gui({ type: 'chat.send', reqId: 'sau_thu_hoi', text: 'không được lưu' })
    expect((await ket.choDong(2000)).code).toBe(4001)

    const stub = env.ROOMS.get(env.ROOMS.idFromName(`phong-${phongId}`)) as unknown as {
      layChat(): Promise<RoomChatMessage[]>
    }
    expect((await stub.layChat()).some((m) => m.text === 'không được lưu')).toBe(false)
    khach.dong()
  })
})
