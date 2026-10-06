import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiGame } from '../shared/protocol/game'
import { TEN_GAME_LOBBY } from '../worker/games/game-lobby-do'
import { dangNhapLayCookie, moKetNoi } from './ws'

const layLobby = () => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))

describe('Cơ chế duy trì phòng của chủ phòng trên sảnh (Persistence)', () => {
  it('chủ phòng tạo phòng từ API, vào phòng rồi thoát ra sảnh -> phòng VẪN CÒN trên sảnh', async () => {
    const { exports } = await import('cloudflare:workers')
    const cookieChu = await dangNhapLayCookie('qa.v2.thu1')

    // 1. Chủ phòng tạo bàn đấu từ sảnh qua POST /api/game/create
    const resCreate = await exports.default.fetch('https://campus.test/api/game/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieChu,
      },
      body: JSON.stringify({
        gameType: 'xiangqi',
        tieuDe: 'Bàn Cờ Tướng Thử Nghiệm',
        turnTimerSeconds: 45,
        soPhong: 77,
      }),
    })
    expect(resCreate.status).toBe(200)
    const jsonCreate = (await resCreate.json()) as { ok: boolean; roomId: string; soPhong: number }
    expect(jsonCreate.ok).toBe(true)
    const maBan = jsonCreate.roomId
    expect(maBan).toContain('phong-77')

    // 2. Bàn đấu lập tức hiển thị trên GameLobbyDO ở trạng thái "waiting"
    let ds = await layLobby().danhSach()
    let ban = ds.find((b) => b.id === maBan)
    expect(ban).toBeDefined()
    expect(ban).toMatchObject({
      trangThai: 'waiting',
      gameType: 'xiangqi',
      tenChu: 'QA Thử nghiệm 1',
    })

    // 3. Chủ phòng kết nối WebSocket vào bàn đấu
    const wsChu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, cookieChu)
    const snap = await wsChu.cho('game.snapshot')
    expect(snap.meta.status).toBe('waiting')
    expect(snap.meta.playerXName).toBe('QA Thử nghiệm 1')

    // 4. Chủ phòng thoát ra sảnh (đóng kết nối WebSocket)
    wsChu.dong()

    // Chờ WebSocket close được xử lý trong RoomDO
    await new Promise((r) => setTimeout(r, 200))

    // 5. Bàn đấu của chủ phòng VẪN PHẢI TỒN TẠI trên sảnh để chủ phòng vào lại hoặc đối thủ vào tham gia!
    ds = await layLobby().danhSach()
    ban = ds.find((b) => b.id === maBan)
    expect(ban).toBeDefined()
    expect(ban?.trangThai).toBe('waiting')
    expect(ban?.tenChu).toBe('QA Thử nghiệm 1')

    // 6. Khi chủ phòng hủy bàn (/api/game/:maPhong/cancel) thì bàn mới bị gỡ khỏi sảnh
    const resCancel = await exports.default.fetch(`https://campus.test/api/game/${maBan}/cancel`, {
      method: 'POST',
      headers: { Cookie: cookieChu },
    })
    expect(resCancel.status).toBe(200)

    ds = await layLobby().danhSach()
    expect(ds.some((b) => b.id === maBan)).toBe(false)
  })
})
