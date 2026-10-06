// Cờ vua / cờ tướng online (RoomDO chế độ game): máy chủ làm trọng tài bằng engine dùng chung — chỉ nhận nước hợp
// lệ đúng lượt, lưu chuỗi nước đi qua ngủ đông, tự chốt chiếu hết, và đổi màu quân khi đấu lại.
import { env } from 'cloudflare:workers'
import { evictDurableObject } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { ChessPosition, perft as perftVua, QUEEN } from '../shared/games/chess/chess-engine'
import { XiangqiPosition, perft as perftTuong } from '../shared/games/xiangqi/xiangqi-engine'
import { mauQuanCua, type GameType1v1, type GoiGame } from '../shared/protocol/game'
import { dungTheCoTuong, dungTheCoVua, trongTaiNuocCo } from '../worker/game-engine'
import { taoMaBan } from '../src/features/games/game-ids'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moBan = (ma: string, cookie: string) => moKetNoi<GoiGame>(`/ws/game/${ma}`, cookie)
const stubBan = (ma: string) => env.ROOMS.get(env.ROOMS.idFromName('game_' + ma))

/** Ô cờ vua theo tên ("e2" → 12). */
const o = (ten: string) => (Number(ten[1]) - 1) * 8 + (ten.charCodeAt(0) - 97)
/** Ô cờ tướng theo cột (0..8, trái → phải nhìn từ Đỏ) và hàng (0 = hàng cuối của Đỏ). */
const oTuong = (cot: number, hang: number) => hang * 9 + cot

async function banDangChoi(gameType: GameType1v1) {
  const ma = taoMaBan(gameType)
  const x = await moBan(ma, await dangNhapLayCookie('qa.v2.thu1'))
  await x.cho('game.snapshot')
  x.gui({ type: 'game.init', gameType, turnSeconds: 30 })
  await x.cho('game.sync', (g) => g.meta.playerX === 'acc:1')
  const oo = await moBan(ma, await dangNhapLayCookie('qa.v2.thu2'))
  await oo.cho('game.snapshot')
  oo.gui({ type: 'game.join' })
  await x.cho('game.sync', (g) => g.meta.status === 'playing')
  await oo.cho('game.sync', (g) => g.meta.status === 'playing')
  const dong = () => [x, oo].forEach((k) => k.dong())
  return { ma, x, o: oo, dong }
}

describe('Engine dùng làm trọng tài (perft chuẩn)', () => {
  it('cờ vua: thế khởi đầu và Kiwipete khớp số nút chuẩn', () => {
    const dau = ChessPosition.fromFen()
    expect([1, 2, 3].map((d) => perftVua(dau, d))).toEqual([20, 400, 8902])
    const kiwipete = ChessPosition.fromFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1')
    expect([1, 2].map((d) => perftVua(kiwipete, d))).toEqual([48, 2039])
    // Thế có bắt tốt qua đường, phong cấp và chiếu (vị trí 4 của bộ perft chuẩn).
    const viTri4 = ChessPosition.fromFen('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1')
    expect([1, 2].map((d) => perftVua(viTri4, d))).toEqual([6, 264])
  })

  it('cờ tướng: thế khởi đầu khớp số nút chuẩn', () => {
    const dau = XiangqiPosition.fromFen()
    expect([1, 2].map((d) => perftTuong(dau, d))).toEqual([44, 1920])
  })
})

describe('trongTaiNuocCo (hàm thuần)', () => {
  it('cờ vua: nhận nước hợp lệ đúng màu, từ chối nước sai luật hoặc sai lượt', () => {
    expect(trongTaiNuocCo('chess', [], { from: o('e2'), to: o('e4') }, 0)).toEqual({
      hopLe: true,
      nuoc: { from: o('e2'), to: o('e4') },
      ketThuc: null,
    })
    // Tốt không đi ba ô, mã không đi thẳng.
    expect(trongTaiNuocCo('chess', [], { from: o('e2'), to: o('e5') }, 0)).toEqual({ hopLe: false })
    expect(trongTaiNuocCo('chess', [], { from: o('g1'), to: o('g3') }, 0)).toEqual({ hopLe: false })
    // Đúng nước nhưng sai màu tới lượt.
    expect(trongTaiNuocCo('chess', [], { from: o('e2'), to: o('e4') }, 1)).toEqual({ hopLe: false })
    // Đen không được đi quân Trắng ở lượt của mình.
    const sauE4 = [{ from: o('e2'), to: o('e4') }]
    expect(trongTaiNuocCo('chess', sauE4, { from: o('d2'), to: o('d4') }, 1)).toEqual({ hopLe: false })
    expect(trongTaiNuocCo('chess', sauE4, { from: o('e7'), to: o('e5') }, 1)).toMatchObject({ hopLe: true })
  })

  it('cờ vua: chiếu hết kết thúc ván với đúng màu thắng (thế Fool’s mate)', () => {
    const nuoc = [
      { from: o('f2'), to: o('f3') },
      { from: o('e7'), to: o('e5') },
      { from: o('g2'), to: o('g4') },
    ]
    const kq = trongTaiNuocCo('chess', nuoc, { from: o('d8'), to: o('h4') }, 1)
    expect(kq).toEqual({ hopLe: true, nuoc: { from: o('d8'), to: o('h4') }, ketThuc: { mauThang: 1 } })
  })

  it('cờ vua: tốt lên hàng cuối bắt buộc chọn quân phong cấp', () => {
    // Trắng: vua e1, tốt a7; Đen: vua h8. Dựng bằng chuỗi nước không tiện, nên kiểm tra qua engine trực tiếp.
    const pos = ChessPosition.fromFen('7k/P7/8/8/8/8/8/4K3 w - - 0 1')
    const coPhong = pos.legalMoves().filter((m) => m.from === o('a7'))
    expect(coPhong.map((m) => m.promo).sort()).toEqual([2, 3, 4, 5])
    expect(coPhong.some((m) => m.promo === undefined)).toBe(false)
    expect(QUEEN).toBe(5)
  })

  it('cờ tướng: nhận nước hợp lệ, từ chối nước sai luật và cờ phong cấp', () => {
    // Pháo đầu: pháo Đỏ cột 7 (b) sang cột 4.
    expect(trongTaiNuocCo('xiangqi', [], { from: oTuong(7, 2), to: oTuong(4, 2) }, 0)).toEqual({
      hopLe: true,
      nuoc: { from: oTuong(7, 2), to: oTuong(4, 2) },
      ketThuc: null,
    })
    // Xe không nhảy qua mã; tượng không qua sông; nước đúng nhưng kèm cờ phong cấp.
    expect(trongTaiNuocCo('xiangqi', [], { from: oTuong(0, 0), to: oTuong(2, 0) }, 0)).toEqual({ hopLe: false })
    expect(trongTaiNuocCo('xiangqi', [], { from: oTuong(2, 0), to: oTuong(0, 2) }, 1)).toEqual({ hopLe: false })
    expect(trongTaiNuocCo('xiangqi', [], { from: oTuong(7, 2), to: oTuong(4, 2), promo: 5 }, 0)).toEqual({ hopLe: false })
  })

  it('dựng lại thế cờ từ chuỗi nước giữ đúng lượt đi', () => {
    expect(dungTheCoVua([{ from: o('e2'), to: o('e4') }]).turn).toBe(1)
    expect(dungTheCoTuong([{ from: oTuong(7, 2), to: oTuong(4, 2) }]).turn).toBe(1)
  })

  it('màu quân theo bên đi trước của ván', () => {
    expect(mauQuanCua('X', 'X')).toBe(0)
    expect(mauQuanCua('X', 'O')).toBe(1)
    expect(mauQuanCua('O', 'O')).toBe(0)
    expect(mauQuanCua('O', 'X')).toBe(1)
  })
})

describe('Bàn cờ vua online qua RoomDO', () => {
  it('nước hợp lệ tới được đối thủ kèm chuỗi nước; nước sai luật hoặc sai lượt bị từ chối', async () => {
    const { x, o: den, dong } = await banDangChoi('chess')

    den.gui({ type: 'game.move', from: o('e7'), to: o('e5') })
    expect((await den.cho('error')).message).toBe('Chưa tới lượt của bạn.')

    x.gui({ type: 'game.move', from: o('e2'), to: o('e5') })
    expect((await x.cho('error')).message).toBe('Nước đi không hợp lệ.')

    x.gui({ type: 'game.move', from: o('e2'), to: o('e4') })
    const sync = await den.cho('game.sync', (g) => g.moves.length === 1)
    expect(sync.moves).toEqual([{ from: o('e2'), to: o('e4') }])
    expect(sync.lastMove).toMatchObject({ player: 'X', from: o('e2'), to: o('e4') })
    expect(sync.meta).toMatchObject({ status: 'playing', currentTurn: 'O' })

    // Đen không được đi quân Trắng.
    den.gui({ type: 'game.move', from: o('d2'), to: o('d4') })
    expect((await den.cho('error')).message).toBe('Nước đi không hợp lệ.')
    // Lệnh thiếu ô đi/ô đến.
    den.gui({ type: 'game.move', x: 1, y: 1 })
    expect((await den.cho('error')).message).toBe('Nước đi không hợp lệ.')
    dong()
  })

  it('chiếu hết chốt ván; đấu lại đổi màu quân và xoá chuỗi nước', async () => {
    const { x, o: den, dong } = await banDangChoi('chess')
    const nuoc: [typeof x, string, string][] = [
      [x, 'f2', 'f3'],
      [den, 'e7', 'e5'],
      [x, 'g2', 'g4'],
      [den, 'd8', 'h4'],
    ]
    for (const [ai, tu, den2] of nuoc) {
      ai.gui({ type: 'game.move', from: o(tu), to: o(den2) })
      await x.cho('game.sync', (g) => g.lastMove?.to === o(den2))
    }
    const ketThuc = x.goi.filter((g): g is Extract<GoiGame, { type: 'game.sync' }> => g.type === 'game.sync').at(-1)!
    expect(ketThuc.meta).toMatchObject({ status: 'ended', winner: 'O', endReason: 'normal', scoreO: 1, scoreX: 0 })
    expect(ketThuc.moves).toHaveLength(4)

    x.gui({ type: 'game.rematch' })
    await den.cho('game.sync', (g) => g.meta.rematchBy === 'X')
    den.gui({ type: 'game.rematch' })
    const vanMoi = await x.cho('game.sync', (g) => g.meta.status === 'playing')
    expect(vanMoi.moves).toEqual([])
    expect(vanMoi.meta).toMatchObject({ firstTurn: 'O', currentTurn: 'O' })

    // O giờ cầm Trắng: đi tốt Trắng được, X (Đen) phải chờ.
    x.gui({ type: 'game.move', from: o('e7'), to: o('e5') })
    expect((await x.cho('error')).message).toBe('Chưa tới lượt của bạn.')
    den.gui({ type: 'game.move', from: o('d2'), to: o('d4') })
    const sau = await x.cho('game.sync', (g) => g.moves.length === 1)
    expect(sau.lastMove).toMatchObject({ player: 'O', from: o('d2'), to: o('d4') })
    dong()
  })

  it('chuỗi nước sống sót khi DO bị evict; người vào sau nhận đủ nước trong snapshot', async () => {
    const { ma, x, o: den, dong } = await banDangChoi('chess')
    x.gui({ type: 'game.move', from: o('e2'), to: o('e4') })
    await den.cho('game.sync', (g) => g.moves.length === 1)

    await evictDurableObject(stubBan(ma))

    den.gui({ type: 'game.move', from: o('c7'), to: o('c5') })
    const sau = await x.cho('game.sync', (g) => g.moves.length === 2)
    expect(sau.moves).toEqual([
      { from: o('e2'), to: o('e4') },
      { from: o('c7'), to: o('c5') },
    ])

    const khach = await moBan(ma, await dangNhapLayCookie('qa.v2.thu3'))
    const snap = await khach.cho('game.snapshot')
    expect(snap.moves).toHaveLength(2)
    expect(snap.meta).toMatchObject({ gameType: 'chess', status: 'playing', currentTurn: 'X' })
    khach.dong()
    dong()
  })
})

describe('Bàn cờ tướng online qua RoomDO', () => {
  it('Đỏ đi trước, nước hợp lệ tới đối thủ; nước sai luật bị từ chối', async () => {
    const { x, o: den, dong } = await banDangChoi('xiangqi')
    x.gui({ type: 'game.move', from: oTuong(7, 2), to: oTuong(4, 2) })
    const sync = await den.cho('game.sync', (g) => g.moves.length === 1)
    expect(sync.lastMove).toMatchObject({ player: 'X', from: oTuong(7, 2), to: oTuong(4, 2) })

    // Mã Đen nhảy đúng luật thì được; xe Đỏ không đi xuyên qua tốt của chính mình.
    den.gui({ type: 'game.move', from: oTuong(1, 9), to: oTuong(0, 7) })
    await den.cho('game.sync', (g) => g.moves.length === 2)
    x.gui({ type: 'game.move', from: oTuong(0, 0), to: oTuong(0, 5) })
    expect((await x.cho('error')).message).toBe('Nước đi không hợp lệ.')
    dong()
  })

  it('xác nhận 2 bên trước khi bắt đầu và xử lý từ chối game.decline_rematch', async () => {
    const ma = taoMaBan('xiangqi')
    const x = await moBan(ma, await dangNhapLayCookie('qa.v2.thu1'))
    await x.cho('game.snapshot')
    x.gui({ type: 'game.init', gameType: 'xiangqi', turnSeconds: 30 })
    await x.cho('game.sync', (g) => g.meta.playerX === 'acc:1')

    const oo = await moBan(ma, await dangNhapLayCookie('qa.v2.thu2'))
    await oo.cho('game.snapshot')
    oo.gui({ type: 'game.join', autoStart: false })

    // Cả hai người đã ngồi vào ghế nhưng ván vẫn ở trạng thái chờ (waiting)
    const choBan = await x.cho('game.sync', (g) => Boolean(g.meta.playerO))
    expect(choBan.meta.status).toBe('waiting')
    expect(choBan.meta.rematchBy).toBeNull()

    // Người chơi X bấm sẵn sàng
    x.gui({ type: 'game.rematch' })
    const syncSanSang = await oo.cho('game.sync', (g) => g.meta.rematchBy === 'X')
    expect(syncSanSang.meta.status).toBe('waiting')
    expect(syncSanSang.meta.rematchBy).toBe('X')

    // Người chơi O từ chối (chưa sẵn sàng)
    oo.gui({ type: 'game.decline_rematch' })
    const syncTuChoi = await x.cho('game.sync', (g) => g.meta.rematchBy === null)
    expect(syncTuChoi.meta.status).toBe('waiting')
    expect(syncTuChoi.meta.rematchBy).toBeNull()

    // Người chơi X mời lại, người chơi O chấp nhận (sẵn sàng ngay)
    x.gui({ type: 'game.rematch' })
    await oo.cho('game.sync', (g) => g.meta.rematchBy === 'X')
    oo.gui({ type: 'game.rematch' })
    const syncBatDau = await x.cho('game.sync', (g) => g.meta.status === 'playing')
    expect(syncBatDau.meta.status).toBe('playing')
    expect(syncBatDau.meta.rematchBy).toBeNull()

    ;[x, oo].forEach((k) => k.dong())
  })
})

describe('Biểu cảm và chat phòng game', () => {
  it('biểu cảm mang khoá người gửi; chat phòng tới mọi người ở bàn và có trong snapshot người vào sau', async () => {
    const { ma, x, o: den, dong } = await banDangChoi('caro_15')
    den.gui({ type: 'game.emote', emote: '🤯' })
    const bieuCam = await x.cho('game.emote')
    expect(bieuCam).toMatchObject({ senderKey: 'acc:2', emote: '🤯' })

    x.gui({ type: 'chat.send', reqId: 'r-1', text: '  Chào bạn nhé  ' })
    const tin = await den.cho('room.chat')
    expect(tin.message).toMatchObject({ accountId: 1, text: 'Chào bạn nhé' })
    await x.cho('ack', (a) => a.reqId === 'r-1')

    const khach = await moBan(ma, await dangNhapLayCookie('qa.v2.thu3'))
    const snap = await khach.cho('game.snapshot')
    expect(snap.chat.map((m) => m.text)).toEqual(['Chào bạn nhé'])
    khach.dong()
    dong()
  })
})
