// Bàn đối kháng 1v1 (RoomDO chế độ game): máy chủ là trọng tài duy nhất — trạng thái sống sót qua ngủ đông,
// đồng hồ lượt do máy chủ thực thi, và chỉ người có quyền mới thay đổi được bàn.
import { env } from 'cloudflare:workers'
import { evictDurableObject, runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { CAC_BIEU_CAM, type GameMetaState, type GameType1v1, type GoiGame } from '../shared/protocol/game'
import {
  GIA_HAN_HET_GIO_MS,
  batDauVan,
  daHetGioLuot,
  ketThucVan,
} from '../worker/game-engine'
import { TEN_GAME_LOBBY } from '../worker/games/game-lobby-do'
import { taoMaBan } from '../src/features/games/game-ids'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moBan = (ma: string, cookie: string) => moKetNoi<GoiGame>(`/ws/game/${ma}`, cookie)
const stubBan = (ma: string) => env.ROOMS.get(env.ROOMS.idFromName('game_' + ma))
const layLobby = () => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))

/** Bàn đang chơi: thu1 cầm X (người mở bàn), thu2 cầm O, thu3 (lớp khác) đứng xem. */
async function banDangChoi(gameType: GameType1v1 = 'caro_15', turnSeconds = 30) {
  const ma = taoMaBan(gameType)
  const x = await moBan(ma, await dangNhapLayCookie('qa.v2.thu1'))
  await x.cho('game.snapshot')
  x.gui({ type: 'game.init', gameType, turnSeconds })
  await x.cho('game.sync', (g) => g.meta.playerX === 'acc:1')
  const o = await moBan(ma, await dangNhapLayCookie('qa.v2.thu2'))
  await o.cho('game.snapshot')
  o.gui({ type: 'game.join' })
  const batDau = await x.cho('game.sync', (g) => g.meta.status === 'playing')
  await o.cho('game.sync', (g) => g.meta.status === 'playing')
  const khach = await moBan(ma, await dangNhapLayCookie('qa.v2.thu3'))
  await khach.cho('game.snapshot')
  const dong = () => [x, o, khach].forEach((k) => k.dong())
  return { ma, x, o, khach, batDau, dong }
}

/** Đẩy hạn chót lượt hiện tại về quá khứ (như thể người chơi đã ngồi im quá lâu). */
async function tuaQuaHanLuot(ma: string): Promise<void> {
  await runInDurableObject(stubBan(ma), (instance: unknown) => {
    const room = instance as { gameMeta: GameMetaState; luuGameState(): void }
    room.gameMeta.turnTimerEndsAt = Date.now() - GIA_HAN_HET_GIO_MS - 5_000
    room.luuGameState()
  })
}

describe('Luật bàn 1v1 (game-engine, hàm thuần)', () => {
  const meta = (over: Partial<GameMetaState> = {}): GameMetaState => ({
    gameType: 'caro_15',
    playerX: 'acc:1',
    playerXName: 'A',
    playerO: 'acc:2',
    playerOName: 'B',
    currentTurn: 'X',
    status: 'playing',
    winner: null,
    winLine: null,
    turnTimerSeconds: 30,
    turnTimerEndsAt: 1_000_000,
    scoreX: 0,
    scoreO: 0,
    endReason: null,
    rematchBy: null,
    firstTurn: 'X',
    ...over,
  })

  it('daHetGioLuot chỉ đúng khi đang chơi và đã qua hạn chót cộng ân hạn', () => {
    expect(daHetGioLuot(meta(), 1_000_000 + GIA_HAN_HET_GIO_MS - 1)).toBe(false)
    expect(daHetGioLuot(meta(), 1_000_000 + GIA_HAN_HET_GIO_MS)).toBe(true)
    expect(daHetGioLuot(meta({ status: 'ended' }), 9_999_999)).toBe(false)
    expect(daHetGioLuot(meta({ turnTimerEndsAt: 0 }), 9_999_999)).toBe(false)
  })

  it('ketThucVan: cộng một ván thắng cho bên thắng; hết lượt chờ đấu lại', () => {
    const caro = ketThucVan(meta({ rematchBy: 'X' }), 'O', 'timeout')
    expect(caro).toMatchObject({ status: 'ended', winner: 'O', endReason: 'timeout', scoreO: 1, scoreX: 0, rematchBy: null, turnTimerEndsAt: 0 })

    const hoa = ketThucVan(meta(), 'draw', 'normal')
    expect(hoa).toMatchObject({ winner: 'draw', scoreX: 0, scoreO: 0 })
  })

  it('batDauVan: bàn trống, bên firstTurn đi trước, đặt hạn chót lượt', () => {
    const { meta: m, board } = batDauVan(meta({ status: 'ended', winner: 'X', firstTurn: 'O', rematchBy: 'X' }), 5_000)
    expect(m).toMatchObject({ status: 'playing', currentTurn: 'O', winner: null, endReason: null, rematchBy: null, turnTimerEndsAt: 35_000 })
    expect(board.flat().every((c: unknown) => c === null)).toBe(true)

    // Vô thời hạn (turnTimerSeconds = 0): turnTimerEndsAt phải bằng 0 và không bao giờ tính hết giờ
    const { meta: mVoHan } = batDauVan(meta({ turnTimerSeconds: 0 }), 5_000)
    expect(mVoHan.turnTimerEndsAt).toBe(0)
    expect(daHetGioLuot(mVoHan, 9_999_999)).toBe(false)
  })
})

describe('Bàn 1v1 sống sót qua ngủ đông của RoomDO', () => {
  it('sau khi DO bị evict (WebSocket ngủ đông), nước đi tiếp theo chạy trên đúng ván đang chơi', async () => {
    const { ma, x, o, dong } = await banDangChoi('caro_15')
    x.gui({ type: 'game.move', x: 4, y: 4 })
    await o.cho('game.sync', (g) => g.lastMove?.x === 4 && g.lastMove.y === 4)

    await evictDurableObject(stubBan(ma))

    o.gui({ type: 'game.move', x: 5, y: 5 })
    const sau = await x.cho('game.sync', (g) => g.lastMove?.x === 5 && g.lastMove.y === 5)
    expect(sau.meta).toMatchObject({ status: 'playing', currentTurn: 'X', playerX: 'acc:1', playerO: 'acc:2', gameType: 'caro_15' })
    expect(sau.board[4][4]).toBe('X')
    expect(sau.board[5][5]).toBe('O')
    await x.khongNhan('error')
    dong()
  })

  it('khán giả bấm "Vào chơi" sau khi DO bị evict không ghi đè ván đang chơi', async () => {
    const { ma, x, o, khach, dong } = await banDangChoi('caro_15')
    x.gui({ type: 'game.move', x: 2, y: 2 })
    await o.cho('game.sync', (g) => g.lastMove?.x === 2)

    await evictDurableObject(stubBan(ma))

    khach.gui({ type: 'game.join' })
    const loi = await khach.cho('error')
    expect(loi.message).toBe('Bàn đang có trận đấu — bạn đang xem.')
    await x.khongNhan('game.sync', (g) => g.meta.status !== 'playing' || g.board[2][2] !== 'X')

    o.gui({ type: 'game.move', x: 3, y: 3 })
    const sau = await x.cho('game.sync', (g) => g.lastMove?.x === 3)
    expect(sau.board[2][2]).toBe('X')
    expect(sau.meta.playerO).toBe('acc:2')
    dong()
  })

  it('sau khi DO bị evict, ván kết thúc vẫn được gỡ khỏi sảnh (mã bàn lưu bền)', async () => {
    const { ma, x, o, dong } = await banDangChoi('chess')
    expect((await layLobby().danhSach()).find((b) => b.id === ma)).toMatchObject({ trangThai: 'playing' })

    await evictDurableObject(stubBan(ma))

    o.gui({ type: 'game.surrender' })
    await x.cho('game.sync', (g) => g.meta.status === 'ended')
    let conTrenSanh = true
    for (let i = 0; i < 50 && conTrenSanh; i++) {
      conTrenSanh = (await layLobby().danhSach()).some((b) => b.id === ma)
      if (conTrenSanh) await new Promise((r) => setTimeout(r, 20))
    }
    expect(conTrenSanh).toBe(false)
    dong()
  })
})

describe('Đồng hồ lượt do máy chủ thực thi', () => {
  it('ván bắt đầu thì alarm được hẹn đúng hạn chót lượt (cộng ân hạn); mỗi nước đi dời hạn cho bên kia', async () => {
    const { ma, x, o, batDau, dong } = await banDangChoi('caro_15', 20)
    const henLuot1 = await runInDurableObject(stubBan(ma), (_i, state) => state.storage.getAlarm())
    expect(henLuot1).toBe(batDau.meta.turnTimerEndsAt + GIA_HAN_HET_GIO_MS)

    x.gui({ type: 'game.move', x: 0, y: 0 })
    const sau = await o.cho('game.sync', (g) => g.lastMove?.x === 0 && g.lastMove.y === 0)
    expect(sau.meta.currentTurn).toBe('O')
    expect(sau.meta.turnTimerEndsAt).toBeGreaterThanOrEqual(batDau.meta.turnTimerEndsAt)
    const henLuot2 = await runInDurableObject(stubBan(ma), (_i, state) => state.storage.getAlarm())
    expect(henLuot2).toBe(sau.meta.turnTimerEndsAt + GIA_HAN_HET_GIO_MS)
    dong()
  })

  it('quá hạn: alarm xử thua bên tới lượt (endReason timeout) và không nhận nước đi nữa', async () => {
    const { ma, x, o, khach, dong } = await banDangChoi('caro_15')
    x.gui({ type: 'game.move', x: 4, y: 4 })
    await o.cho('game.sync', (g) => g.lastMove?.x === 4)

    // Tới lượt O mà O ngồi im.
    await tuaQuaHanLuot(ma)
    expect(await runDurableObjectAlarm(stubBan(ma))).toBe(true)

    for (const k of [x, o, khach]) {
      const ketThuc = await k.cho('game.sync', (g) => g.meta.status === 'ended')
      expect(ketThuc.meta).toMatchObject({ winner: 'X', endReason: 'timeout', scoreX: 1, scoreO: 0, turnTimerEndsAt: 0 })
    }
    o.gui({ type: 'game.move', x: 0, y: 0 })
    expect((await o.cho('error')).message).toBe('Ván đấu chưa bắt đầu hoặc đã kết thúc.')
    // Ván đã xong: không còn hẹn alarm cho lượt đi.
    expect(await runInDurableObject(stubBan(ma), (_i, state) => state.storage.getAlarm())).toBeNull()
    dong()
  })

  it('nước đi tới sau hạn chót (alarm chưa kịp chạy) bị từ chối và chốt thua vì hết giờ ngay', async () => {
    const { ma, x, o, dong } = await banDangChoi('caro_15')
    await tuaQuaHanLuot(ma)

    x.gui({ type: 'game.move', x: 3, y: 0 })
    expect((await x.cho('error')).message).toBe('Bạn đã hết giờ cho lượt này.')
    const ketThuc = await o.cho('game.sync', (g) => g.meta.status === 'ended')
    expect(ketThuc.meta).toMatchObject({ winner: 'O', endReason: 'timeout' })
    expect(ketThuc.board.flat().every((c: unknown) => c === null)).toBe(true)
    dong()
  })

  it('người mới vào bàn đã quá hạn thấy ngay kết quả hết giờ, không thấy ván "đang chơi" ảo', async () => {
    const { ma, dong } = await banDangChoi('caro_15')
    await tuaQuaHanLuot(ma)
    const nguoiMoi = await moBan(ma, await dangNhapLayCookie('qa.v2.gv'))
    const snap = await nguoiMoi.cho('game.snapshot')
    expect(snap.meta).toMatchObject({ status: 'ended', winner: 'O', endReason: 'timeout' })
    nguoiMoi.dong()
    dong()
  })
})

describe('Quyền điều khiển bàn 1v1', () => {
  it('khán giả hay đối thủ đều không thể game.init lại bàn đã có người', async () => {
    const { x, o, khach, dong } = await banDangChoi('caro_15')
    x.gui({ type: 'game.move', x: 4, y: 4 })
    await o.cho('game.sync', (g) => g.lastMove?.x === 4)

    for (const k of [khach, o]) {
      k.gui({ type: 'game.init', gameType: 'chess', turnSeconds: 10 })
      expect((await k.cho('error')).message).toBe('Bàn này đã có người chơi, không thể tạo lại.')
    }
    await x.khongNhan('game.sync', (g) => g.meta.gameType !== 'caro_15' || g.board[4][4] !== 'X')
    dong()
  })

  it('game.init chỉ nhận trò đối kháng (không mở bàn cho trò chơi đơn)', async () => {
    const ma = taoMaBan('solo_memory')
    const k = await moBan(ma, await dangNhapLayCookie('qa.v2.thu1'))
    await k.cho('game.snapshot')
    k.gui({ type: 'game.init', gameType: 'solo_memory' })
    expect((await k.cho('error')).message).toBe('Lệnh game không hợp lệ.')
    k.dong()
  })

  it('không đấu lại được giữa ván; khán giả không đấu lại được', async () => {
    const { x, o, khach, dong } = await banDangChoi('caro_15')
    x.gui({ type: 'game.move', x: 1, y: 1 })
    await o.cho('game.sync', (g) => g.lastMove?.x === 1)

    x.gui({ type: 'game.rematch' })
    expect((await x.cho('error')).message).toBe('Ván này chưa kết thúc.')
    khach.gui({ type: 'game.rematch' })
    expect((await khach.cho('error')).message).toBe('Chỉ hai người chơi của bàn mới đấu lại được.')
    await o.khongNhan('game.sync', (g) => g.board[1][1] !== 'X')
    dong()
  })

  it('đấu lại cần cả hai đồng ý; ván mới giữ tỉ số và đổi bên đi trước', async () => {
    const { x, o, dong } = await banDangChoi('caro_15')
    o.gui({ type: 'game.surrender' })
    await x.cho('game.sync', (g) => g.meta.status === 'ended' && g.meta.winner === 'X')

    x.gui({ type: 'game.rematch' })
    const moi = await o.cho('game.sync', (g) => g.meta.rematchBy === 'X')
    expect(moi.meta.status).toBe('ended')
    // Bấm lại lần nữa không tự bắt đầu ván.
    x.gui({ type: 'game.rematch' })
    await o.khongNhan('game.sync', (g) => g.meta.status === 'playing')

    o.gui({ type: 'game.rematch' })
    const vanMoi = await x.cho('game.sync', (g) => g.meta.status === 'playing')
    expect(vanMoi.meta).toMatchObject({ firstTurn: 'O', currentTurn: 'O', scoreX: 1, scoreO: 0, rematchBy: null, winner: null, endReason: null })
    expect(vanMoi.board.flat().every((c: unknown) => c === null)).toBe(true)

    // X không được đi trước ở ván này.
    x.gui({ type: 'game.move', x: 0, y: 0 })
    expect((await x.cho('error')).message).toBe('Chưa tới lượt của bạn.')
    dong()
  })

  it('game.join khi đang có trận bị từ chối', async () => {
    const { khach, dong } = await banDangChoi('chess')
    khach.gui({ type: 'game.join' })
    expect((await khach.cho('error')).message).toBe('Bàn đang có trận đấu — bạn đang xem.')
    dong()
  })

  it('người mở bàn đã rời đi: người vào sau được nhường ghế X thay vì bị ghép với ghế trống', async () => {
    const ma = taoMaBan('caro_15')
    const chu = await moBan(ma, await dangNhapLayCookie('qa.v2.thu1'))
    await chu.cho('game.snapshot')
    chu.gui({ type: 'game.init', gameType: 'caro_15', turnSeconds: 30 })
    await chu.cho('game.sync')
    const nguoiXem = await moBan(ma, await dangNhapLayCookie('qa.v2.thu3'))
    await nguoiXem.cho('game.snapshot')
    chu.dong()
    await nguoiXem.cho('presence', (p) => !p.members.some((m) => m.key === 'acc:1'))

    const khach = await moBan(ma, await dangNhapLayCookie('qa.v2.thu2'))
    await khach.cho('game.snapshot')
    khach.gui({ type: 'game.join' })
    const sau = await khach.cho('game.sync')
    expect(sau.meta).toMatchObject({ status: 'waiting', playerX: 'acc:2', playerO: null })
    khach.dong()
    nguoiXem.dong()
  })

  it('biểu cảm: chỉ nhận danh sách cho phép và giới hạn nhịp gửi', async () => {
    const { x, o, khach, dong } = await banDangChoi('caro_15')
    khach.gui({ type: 'game.emote', emote: 'chữ tự do không kiểm duyệt' })
    expect((await khach.cho('error')).message).toBe('Lệnh game không hợp lệ.')
    await x.khongNhan('game.emote')

    for (let i = 0; i < 3; i++) o.gui({ type: 'game.emote', emote: CAC_BIEU_CAM[0] })
    await x.cho('game.emote', (e) => e.sender === 'QA Thử nghiệm 2')
    await x.cho('game.emote', (e) => e.sender === 'QA Thử nghiệm 2')
    await x.khongNhan('game.emote', (e) => e.sender === 'QA Thử nghiệm 2')
    expect((await o.cho('error')).message).toBe('Bạn gửi biểu cảm hơi nhanh, chờ một chút nhé.')
    dong()
  })
})

describe('Điểm ván đối kháng', () => {
  it('đầu hàng kết thúc ván và cộng điểm cho bên thắng', async () => {
    const { x, o, batDau, dong } = await banDangChoi('caro_15')
    expect(batDau.meta).toMatchObject({ scoreX: 0, scoreO: 0 })
    o.gui({ type: 'game.surrender' })
    const ketThuc = await x.cho('game.sync', (g) => g.meta.status === 'ended')
    expect(ketThuc.meta).toMatchObject({ winner: 'X', endReason: 'surrender', scoreX: 1, scoreO: 0 })
    dong()
  })
})
