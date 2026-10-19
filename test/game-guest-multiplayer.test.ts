// Test đấu cờ online giữa 2 khách vãng lai (Guest Multiplayer) không cần đăng nhập / tài khoản
import { describe, expect, it } from 'vitest'
import type { GoiGame } from '../shared/protocol/game'
import { taoMaBan } from '../src/features/games/game-ids'
import { moKetNoi, dongMoiKetNoi } from './ws'

const moBanKhach = (ma: string, guestKey: string, guestName: string) => {
  const params = new URLSearchParams({
    guestKey,
    guestName,
  })
  return moKetNoi<GoiGame>(`/ws/game/${ma}?${params.toString()}`, '')
}

describe('Đấu cờ online nhiều người chơi không cần tài khoản (Guest Multiplayer)', () => {
  it('Caro: 2 khách vãng lai kết nối, tự động bắt đầu ván và đi nước luân phiên', async () => {
    const maBan = taoMaBan('caro_15')
    const k1Key = 'guest_caro_p1_' + Math.random().toString(36).slice(2, 7)
    const k2Key = 'guest_caro_p2_' + Math.random().toString(36).slice(2, 7)

    // Khách 1 mở bàn và khởi tạo
    const k1 = await moBanKhach(maBan, k1Key, 'Kỳ Thủ X')
    await k1.cho('game.snapshot')
    k1.gui({ type: 'game.init', gameType: 'caro_15', turnSeconds: 30, isPersistent: true })
    const syncInit = await k1.cho('game.sync', (g) => g.meta.playerX === k1Key)
    expect(syncInit.meta.status).toBe('waiting')

    // Khách 2 vào bàn và join với autoStart: true
    const k2 = await moBanKhach(maBan, k2Key, 'Kỳ Thủ O')
    await k2.cho('game.snapshot')
    k2.gui({ type: 'game.join', autoStart: true })

    // Cả 2 nhận được game.sync trạng thái 'playing'
    const sync1 = await k1.cho('game.sync', (g) => g.meta.status === 'playing')
    const sync2 = await k2.cho('game.sync', (g) => g.meta.status === 'playing')

    expect(sync1.meta.playerX).toBe(k1Key)
    expect(sync1.meta.playerO).toBe(k2Key)
    expect(sync2.meta.status).toBe('playing')
    expect(sync1.meta.currentTurn).toBe('X')

    // Khách 1 (X) đi nước cờ (7, 7)
    k1.gui({ type: 'game.move', x: 7, y: 7 })

    const syncSauNuoc1 = await k1.cho('game.sync', (g) => g.lastMove?.x === 7 && g.lastMove?.y === 7)
    const syncSauNuoc2 = await k2.cho('game.sync', (g) => g.lastMove?.x === 7 && g.lastMove?.y === 7)

    expect(syncSauNuoc1.meta.currentTurn).toBe('O')
    expect(syncSauNuoc2.meta.currentTurn).toBe('O')
    expect(syncSauNuoc1.board[7][7]).toBe('X')

    // Khách 2 (O) đi nước cờ (7, 8)
    k2.gui({ type: 'game.move', x: 7, y: 8 })

    const syncSauNuoc3 = await k1.cho('game.sync', (g) => g.lastMove?.x === 7 && g.lastMove?.y === 8)
    const syncSauNuoc4 = await k2.cho('game.sync', (g) => g.lastMove?.x === 7 && g.lastMove?.y === 8)

    expect(syncSauNuoc3.meta.currentTurn).toBe('X')
    expect(syncSauNuoc4.meta.currentTurn).toBe('X')
    expect(syncSauNuoc3.board[8][7]).toBe('O')

    await dongMoiKetNoi()
  })

  it('Cờ vua: 2 khách vãng lai kết nối, đi nước chuẩn e2-e4 và e7-e5', async () => {
    const maBan = taoMaBan('chess')
    const k1Key = 'guest_chess_w_' + Math.random().toString(36).slice(2, 7)
    const k2Key = 'guest_chess_b_' + Math.random().toString(36).slice(2, 7)

    const k1 = await moBanKhach(maBan, k1Key, 'Kiện Tướng Trắng')
    await k1.cho('game.snapshot')
    k1.gui({ type: 'game.init', gameType: 'chess', turnSeconds: 30, isPersistent: true })
    await k1.cho('game.sync', (g) => g.meta.playerX === k1Key)

    const k2 = await moBanKhach(maBan, k2Key, 'Kiện Tướng Đen')
    await k2.cho('game.snapshot')
    k2.gui({ type: 'game.join', autoStart: true })

    await k1.cho('game.sync', (g) => g.meta.status === 'playing')
    await k2.cho('game.sync', (g) => g.meta.status === 'playing')

    // Trắng (X) đi e2 -> e4: e2 = 12, e4 = 28
    const e2 = (2 - 1) * 8 + ('e'.charCodeAt(0) - 97) // 12
    const e4 = (4 - 1) * 8 + ('e'.charCodeAt(0) - 97) // 28
    k1.gui({ type: 'game.move', from: e2, to: e4 })

    const syncSauE4 = await k2.cho('game.sync', (g) => g.moves?.length === 1)
    expect(syncSauE4.moves[0]).toEqual({ from: e2, to: e4 })
    expect(syncSauE4.meta.currentTurn).toBe('O')

    // Đen (O) đi e7 -> e5: e7 = 52, e5 = 36
    const e7 = (7 - 1) * 8 + ('e'.charCodeAt(0) - 97) // 52
    const e5 = (5 - 1) * 8 + ('e'.charCodeAt(0) - 97) // 36
    k2.gui({ type: 'game.move', from: e7, to: e5 })

    const syncSauE5 = await k1.cho('game.sync', (g) => g.moves?.length === 2)
    expect(syncSauE5.moves[1]).toEqual({ from: e7, to: e5 })
    expect(syncSauE5.meta.currentTurn).toBe('X')

    await dongMoiKetNoi()
  })

  it('Cờ tướng: 2 khách vãng lai kết nối, đi nước pháo đầu chuẩn luật', async () => {
    const maBan = taoMaBan('xiangqi')
    const k1Key = 'guest_xq_red_' + Math.random().toString(36).slice(2, 7)
    const k2Key = 'guest_xq_blk_' + Math.random().toString(36).slice(2, 7)

    const k1 = await moBanKhach(maBan, k1Key, 'Kỳ Vương Đỏ')
    await k1.cho('game.snapshot')
    k1.gui({ type: 'game.init', gameType: 'xiangqi', turnSeconds: 30, isPersistent: true })
    await k1.cho('game.sync', (g) => g.meta.playerX === k1Key)

    const k2 = await moBanKhach(maBan, k2Key, 'Kỳ Vương Đen')
    await k2.cho('game.snapshot')
    k2.gui({ type: 'game.join', autoStart: true })

    await k1.cho('game.sync', (g) => g.meta.status === 'playing')
    await k2.cho('game.sync', (g) => g.meta.status === 'playing')

    // Đỏ đi pháo cột 7 (b) sang cột 4 (hàng 2): from = 2 * 9 + 7 = 25, to = 2 * 9 + 4 = 22
    k1.gui({ type: 'game.move', from: 25, to: 22 })

    const syncPhaoDau = await k2.cho('game.sync', (g) => g.moves?.length === 1)
    expect(syncPhaoDau.moves[0]).toEqual({ from: 25, to: 22 })
    expect(syncPhaoDau.meta.currentTurn).toBe('O')

    await dongMoiKetNoi()
  })
})
