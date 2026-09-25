// RoomDO dùng WebSocket Hibernation: sau vài giây im lặng, runtime huỷ instance nhưng giữ kết nối. Tin nhắn kế
// tiếp đánh thức một instance MỚI — instance đó phải nạp lại trạng thái từ SQLite trước khi xử lý, nếu không
// chủ phòng mất quyền, ghi chú "xung đột" với bản rỗng và video bị coi như chưa có.
import { env } from 'cloudflare:workers'
import { evictDurableObject } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import type { GoiPhong } from '../shared/protocol/room'
import { dangNhapLayCookie, moKetNoi } from './ws'

async function chenPhong(ten: string): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, 'truong', NULL, 'acc:1', 'Host', 'public', 20, 'mo')
     RETURNING id`,
  )
    .bind(ten)
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng vào D1')
  return res.id
}

describe('RoomDO nạp lại trạng thái khi WebSocket ngủ đông đánh thức instance mới', () => {
  it('chủ phòng vẫn điều khiển được video đang mở sau khi DO bị evict', async () => {
    const roomId = await chenPhong('Phòng ngủ đông — video')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, await dangNhapLayCookie('qa.v2.thu1'))
    await host.cho('room.snapshot')
    host.gui({ type: 'media.action', data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Bài giảng' } })
    await host.cho('media.sync', (g) => g.state.videoId === 'dQw4w9WgXcQ')

    await evictDurableObject(env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`)))

    host.gui({ type: 'media.action', data: { action: 'play' } })
    const sau = await host.cho('media.sync', (g) => g.state.status === 'playing')
    expect(sau.state).toMatchObject({ videoId: 'dQw4w9WgXcQ', title: 'Bài giảng' })
    await host.khongNhan('error')
    host.dong()
  })

  it('ghi chú chung tiếp tục đúng revision sau khi DO bị evict (không "xung đột" với bản rỗng)', async () => {
    const roomId = await chenPhong('Phòng ngủ đông — ghi chú')
    const host = await moKetNoi<GoiPhong>(`/ws/room/phong-${roomId}`, await dangNhapLayCookie('qa.v2.thu1'))
    const snap = await host.cho('room.snapshot')
    host.gui({ type: 'notes.action', data: { action: 'update', content: 'Dòng 1', baseRevision: snap.notes.revision } })
    const lan1 = await host.cho('notes.sync')

    await evictDurableObject(env.ROOMS.get(env.ROOMS.idFromName(`phong-${roomId}`)))

    host.gui({ type: 'notes.action', data: { action: 'update', content: 'Dòng 1\nDòng 2', baseRevision: lan1.notes.revision } })
    const lan2 = await host.cho('notes.sync', (g) => g.notes.revision === lan1.notes.revision + 1)
    expect(lan2.notes.content).toBe('Dòng 1\nDòng 2')
    await host.khongNhan('notes.conflict')
    host.dong()
  })
})
