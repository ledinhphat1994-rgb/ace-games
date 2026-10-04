import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiGame } from '../shared/protocol/game'
import { TEN_GAME_LOBBY } from '../worker/games/game-lobby-do'
import { dangNhapLayCookie, moKetNoi } from './ws'

const layLobby = () => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))

describe('Bàn riêng tư có mật khẩu & Chế độ người xem (Spectator)', () => {
  it('POST /api/game/create tạo bàn riêng tư có ngay ở sảnh, người xem nhập pass đúng được vào, và có thể hủy bàn', async () => {
    const { exports } = await import('cloudflare:workers')
    const cookieChu = await dangNhapLayCookie('qa.v2.thu1')
    const cookieKhach1 = await dangNhapLayCookie('qa.v2.thu2')
    const cookieKhach2 = await dangNhapLayCookie('qa.v2.thu3')

    // 1. Chủ phòng tạo bàn riêng tư qua API /api/game/create
    const resTao = await exports.default.fetch('https://campus.test/api/game/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieChu,
      },
      body: JSON.stringify({
        gameType: 'chess',
        tieuDe: 'Bàn Riêng Tư Thử Nghiệm',
        turnTimerSeconds: 30,
        isPrivate: true,
        password: 'my-private-pass',
        soPhong: 45,
      }),
    })
    expect(resTao.status).toBe(200)
    const jsonTao = (await resTao.json()) as { ok: boolean; roomId: string }
    expect(jsonTao.ok).toBe(true)
    const maBan = jsonTao.roomId

    // Bàn xuất hiện ngay trên sảnh toàn trường cho mọi người thấy (kể cả khi chưa có socket nào kết nối)
    const dsSanh = await layLobby().danhSach()
    const banSanh = dsSanh.find((b) => b.id === maBan)
    expect(banSanh).toBeDefined()
    expect(banSanh?.isPrivate).toBe(true)
    expect(banSanh?.coMatKhau).toBe(true)
    expect(banSanh?.trangThai).toBe('waiting')

    // 2. Người xem / người chơi khác không có pass -> Bị chặn 403
    const khachKhongPass = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, cookieKhach1)
    expect(khachKhongPass.status).toBe(403)

    // 3. Người chơi 1 có pass đúng -> Vào bàn thành công và nhận ghế O
    const chuSocket = await moKetNoi<GoiGame>(`/ws/game/${maBan}?pass=my-private-pass`, cookieChu)
    expect(chuSocket.status).toBe(101)
    await chuSocket.cho('game.snapshot')

    const nguoiChoi1 = await moKetNoi<GoiGame>(`/ws/game/${maBan}?pass=my-private-pass`, cookieKhach1)
    expect(nguoiChoi1.status).toBe(101)
    const snap1 = await nguoiChoi1.cho('game.snapshot')
    expect(snap1.meta.playerX).toBe('acc:1')

    nguoiChoi1.gui({ type: 'game.join', password: 'my-private-pass' })
    const syncChoi1 = await nguoiChoi1.cho('game.sync', (g) => g.meta.playerO !== null)
    expect(syncChoi1.meta.playerO).toBe('acc:2')

    // 4. Người xem (người thứ 3) nhập pass đúng -> Vào bàn xem trận đấu
    const nguoiXem = await moKetNoi<GoiGame>(`/ws/game/${maBan}?pass=my-private-pass`, cookieKhach2)
    expect(nguoiXem.status).toBe(101)
    const snapXem = await nguoiXem.cho('game.snapshot')
    expect(snapXem.meta.playerX).toBe('acc:1')
    expect(snapXem.meta.playerO).toBe('acc:2')

    // Đóng các kết nối
    nguoiXem.dong()
    nguoiChoi1.dong()
    chuSocket.dong()

    // 5. Hủy bàn qua /api/game/:id/cancel
    const resHuy = await exports.default.fetch(`https://campus.test/api/game/${encodeURIComponent(maBan)}/cancel`, {
      method: 'POST',
      headers: { Cookie: cookieChu },
    })
    expect(resHuy.status).toBe(200)

    const dsSauHuy = await layLobby().danhSach()
    expect(dsSauHuy.some((b) => b.id === maBan)).toBe(false)
  })
})
