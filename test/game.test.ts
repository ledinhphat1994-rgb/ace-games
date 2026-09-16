import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiGame } from '../shared/protocol/game'
import {
  coNuocDiHopLeReversi,
  demQuanReversi,
  kiemTraThangCaro,
  kiemTraThangConnect4,
  kiemTraVaLatReversi,
  taoBanMoi,
} from '../worker/game-engine'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moGameRoom = (maPhong: string, cookie: string) =>
  moKetNoi<GoiGame>(`/ws/game/${encodeURIComponent(maPhong)}`, cookie)

describe('Game Engine Unit Tests (Lõi logic bàn cờ)', () => {
  it('taoBanMoi khởi tạo đúng kích thước và quân cờ ban đầu', () => {
    const b15 = taoBanMoi('caro_15')
    expect(b15.length).toBe(15)
    expect(b15[0].length).toBe(15)

    const b9 = taoBanMoi('caro_9')
    expect(b9.length).toBe(9)
    expect(b9[0].length).toBe(9)

    const c4 = taoBanMoi('connect4')
    expect(c4.length).toBe(6)
    expect(c4[0].length).toBe(7)

    const rev = taoBanMoi('reversi')
    expect(rev.length).toBe(8)
    expect(rev[0].length).toBe(8)
    // 4 quân cờ chuẩn tâm Othello
    expect(rev[3][3]).toBe('O')
    expect(rev[3][4]).toBe('X')
    expect(rev[4][3]).toBe('X')
    expect(rev[4][4]).toBe('O')
  })

  it('kiemTraThangCaro phát hiện thắng 5 quân liên tiếp (Ngang, Dọc, Chéo)', () => {
    const board = taoBanMoi('caro_15')

    // Chưa đủ 5 quân
    for (let x = 0; x < 4; x++) board[5][x] = 'X'
    expect(kiemTraThangCaro(board, 3, 5, 'X')).toBeNull()

    // Đủ 5 quân hàng ngang
    board[5][4] = 'X'
    const winH = kiemTraThangCaro(board, 4, 5, 'X')
    expect(winH).not.toBeNull()
    expect(winH?.length).toBe(5)

    // Đủ 5 quân đường chéo
    const boardDiag = taoBanMoi('caro_15')
    for (let i = 0; i < 5; i++) boardDiag[i][i] = 'O'
    const winDiag = kiemTraThangCaro(boardDiag, 4, 4, 'O')
    expect(winDiag).not.toBeNull()
    expect(winDiag?.length).toBe(5)
  })

  it('kiemTraThangConnect4 phát hiện thắng 4 quân liên tiếp', () => {
    const board = taoBanMoi('connect4')
    // Cột 2 có 4 quân X theo chiều dọc
    board[5][2] = 'X'
    board[4][2] = 'X'
    board[3][2] = 'X'
    expect(kiemTraThangConnect4(board, 2, 3, 'X')).toBeNull()

    board[2][2] = 'X'
    const win = kiemTraThangConnect4(board, 2, 2, 'X')
    expect(win).not.toBeNull()
    expect(win?.length).toBe(4)
  })

  it('kiemTraVaLatReversi lật quân đối phương theo quy chuẩn quốc tế', () => {
    const board = taoBanMoi('reversi')
    // Ở đầu ván, ô [2][3] là nước đi hợp lệ của X (kẹp quân O tại [3][3] với [4][3] là X)
    const res = kiemTraVaLatReversi(board, 3, 2, 'X')
    expect(res.hopLe).toBe(true)
    expect(res.flipped).toEqual([[3, 3]])

    // Nước đi không kẹp được quân nào
    const resSai = kiemTraVaLatReversi(board, 0, 0, 'X')
    expect(resSai.hopLe).toBe(false)
    expect(resSai.flipped.length).toBe(0)

    expect(coNuocDiHopLeReversi(board, 'X')).toBe(true)
    const counts = demQuanReversi(board)
    expect(counts.scoreX).toBe(2)
    expect(counts.scoreO).toBe(2)
  })
})

describe('Game Room Real-time WebSocket Flow', () => {
  it('chặn kết nối không có phiên đăng nhập (401)', async () => {
    const res = await exports.default.fetch(`${GOC}/ws/game/phong-test-1`, {
      headers: { Upgrade: 'websocket', Origin: GOC },
    })
    expect(res.status).toBe(401)
  })

  it('hai người chơi vào bàn, ghép cặp, đánh cờ và phân định thắng bại', async () => {
    const maPhong = `game-test-${Date.now().toString(36)}`
    const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

    // Người 1 kết nối và khởi tạo bàn Caro
    const p1 = await moGameRoom(maPhong, cookie1)
    const snap1 = await p1.cho('game.snapshot')
    expect(snap1.meta).toBeDefined()

    p1.gui({ type: 'game.init', gameType: 'caro_9', turnSeconds: 20 })
    const syncInit = await p1.cho('game.sync')
    expect(syncInit.meta.gameType).toBe('caro_9')
    expect(syncInit.meta.status).toBe('waiting')

    // Người 2 kết nối và tham gia
    const p2 = await moGameRoom(maPhong, cookie2)
    await p2.cho('game.snapshot')

    p2.gui({ type: 'game.join', side: 'O' })
    const syncPlaying = await p1.cho('game.sync', (g) => g.meta.status === 'playing')
    expect(syncPlaying.meta.playerX).toBeDefined()
    expect(syncPlaying.meta.playerO).toBeDefined()
    expect(syncPlaying.meta.currentTurn).toBe('X')

    // Người 1 (X) đi nước đầu tiên tại (4, 4)
    p1.gui({ type: 'game.move', x: 4, y: 4 })
    const syncMove1 = await p2.cho('game.sync', (g) => g.lastMove?.x === 4 && g.lastMove?.y === 4)
    expect(syncMove1.meta.currentTurn).toBe('O')
    expect(syncMove1.board[4][4]).toBe('X')

    // Người 2 (O) đi nước thứ hai tại (4, 5)
    p2.gui({ type: 'game.move', x: 4, y: 5 })
    const syncMove2 = await p1.cho('game.sync', (g) => g.lastMove?.x === 4 && g.lastMove?.y === 5)
    expect(syncMove2.meta.currentTurn).toBe('X')
    expect(syncMove2.board[5][4]).toBe('O')

    // Gửi emote
    p1.gui({ type: 'game.emote', emote: '🔥' })
    const emoteMsg = await p2.cho('game.emote')
    expect(emoteMsg.emote).toBe('🔥')

    // Người 2 xin hàng -> Người 1 thắng
    p2.gui({ type: 'game.surrender' })
    const syncEnded = await p1.cho('game.sync', (g) => g.meta.status === 'ended')
    expect(syncEnded.meta.winner).toBe('X')
    expect(syncEnded.meta.scoreX).toBe(1)

    // Đấu lại (rematch)
    p1.gui({ type: 'game.rematch' })
    const syncRematch = await p2.cho('game.sync', (g) => g.meta.status === 'playing')
    expect(syncRematch.meta.winner).toBeNull()
    expect(syncRematch.board[4][4]).toBeNull()

    p1.dong()
    p2.dong()
    await new Promise((r) => setTimeout(r, 100))
  })

  it('lưu và truy vấn bảng điểm cao Solo mini-games (D1 Staging)', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Lưu điểm 2048
    const resSave = await exports.default.fetch(`${GOC}/api/game/highscore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ gameType: 'solo_2048', score: 1024 }),
    })
    expect(resSave.status).toBe(200)

    // Truy vấn bảng điểm
    const resGet = await exports.default.fetch(`${GOC}/api/game/highscores?gameType=solo_2048`, {
      headers: { Cookie: cookie },
    })
    expect(resGet.status).toBe(200)
    const data = (await resGet.json()) as { ok: boolean; highscores: { score: number; gameType: string }[] }
    expect(data.ok).toBe(true)
    expect(data.highscores.some((h) => h.score === 1024 && h.gameType === 'solo_2048')).toBe(true)
  })
})
