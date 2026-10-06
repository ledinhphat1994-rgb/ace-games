import { ChessPosition } from '../shared/games/chess/chess-engine'
import { XiangqiPosition } from '../shared/games/xiangqi/xiangqi-engine'
import type {
  BoardCell,
  GameMetaState,
  GameType,
  GameTypeCoNuoc,
  LyDoKetThucVan,
  NuocCo,
  PlayerSide,
} from '../shared/protocol/game'

/** Ân hạn sau hạn chót của lượt, bù độ trễ mạng trước khi máy chủ xử thua vì hết giờ. */
export const GIA_HAN_HET_GIO_MS = 1000

export const benKia = (side: PlayerSide): PlayerSide => (side === 'X' ? 'O' : 'X')

/** Bên tới lượt đã quá hạn chót (tính cả ân hạn) theo đồng hồ máy chủ. */
export function daHetGioLuot(meta: Pick<GameMetaState, 'status' | 'turnTimerEndsAt'>, now: number): boolean {
  return meta.status === 'playing' && meta.turnTimerEndsAt > 0 && now >= meta.turnTimerEndsAt + GIA_HAN_HET_GIO_MS
}

/**
 * Chốt kết quả ván. Caro/Connect 4 cộng một ván thắng cho bên thắng; Reversi giữ nguyên điểm vì điểm Reversi
 * là số quân trên bàn (đầu hàng hay hết giờ không làm mọc thêm quân).
 */
export function ketThucVan(meta: GameMetaState, winner: PlayerSide | 'draw', lyDo: LyDoKetThucVan): GameMetaState {
  const ketQua: GameMetaState = {
    ...meta,
    status: 'ended',
    winner,
    winLine: lyDo === 'normal' ? meta.winLine : null,
    endReason: lyDo,
    rematchBy: null,
    drawOfferBy: null,
    turnTimerEndsAt: 0,
  }
  if (winner !== 'draw') {
    if (winner === 'X') ketQua.scoreX += 1
    else ketQua.scoreO += 1
  }
  return ketQua
}

/** Ván mới khi bàn đã đủ hai người: bàn cờ trống, bên `firstTurn` đi trước và bắt đầu đếm giờ lượt. */
export function batDauVan(meta: GameMetaState, now: number): { meta: GameMetaState; board: BoardCell[][] } {
  const board = taoBanMoi(meta.gameType)
  const moi: GameMetaState = {
    ...meta,
    status: 'playing',
    currentTurn: meta.firstTurn,
    winner: null,
    winLine: null,
    endReason: null,
    rematchBy: null,
    drawOfferBy: null,
    turnTimerEndsAt: meta.turnTimerSeconds > 0 ? now + meta.turnTimerSeconds * 1000 : 0,
  }
  return { meta: moi, board }
}

export function taoBanMoi(gameType: GameType): BoardCell[][] {
  let r = 15
  let c = 15

  if (gameType === 'chess') {
    r = 8
    c = 8
  } else if (gameType === 'xiangqi') {
    r = 10
    c = 9
  }

  const ban: BoardCell[][] = Array.from({ length: r }, () => Array.from({ length: c }, () => null))
  return ban
}

export function kiemTraThangCaro(
  board: BoardCell[][],
  lastX: number,
  lastY: number,
  player: PlayerSide,
): [number, number][] | null {
  const H = board.length
  const W = board[0].length

  const huong = [
    [0, 1],   // Ngang
    [1, 0],   // Dọc
    [1, 1],   // Chéo chính
    [1, -1],  // Chéo phụ
  ]

  for (const [dy, dx] of huong) {
    const coords: [number, number][] = [[lastX, lastY]]

    // Hướng dương
    let step = 1
    while (true) {
      const ny = lastY + dy * step
      const nx = lastX + dx * step
      if (ny < 0 || ny >= H || nx < 0 || nx >= W || board[ny][nx] !== player) break
      coords.push([nx, ny])
      step++
    }

    // Hướng âm
    step = 1
    while (true) {
      const ny = lastY - dy * step
      const nx = lastX - dx * step
      if (ny < 0 || ny >= H || nx < 0 || nx >= W || board[ny][nx] !== player) break
      coords.push([nx, ny])
      step++
    }

    if (coords.length >= 5) {
      return coords
    }
  }

  return null
}

export function kiemTraThangConnect4(
  board: BoardCell[][],
  lastX: number,
  lastY: number,
  player: PlayerSide,
): [number, number][] | null {
  const H = board.length
  const W = board[0].length

  const huong = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ]

  for (const [dy, dx] of huong) {
    const coords: [number, number][] = [[lastX, lastY]]

    let step = 1
    while (true) {
      const ny = lastY + dy * step
      const nx = lastX + dx * step
      if (ny < 0 || ny >= H || nx < 0 || nx >= W || board[ny][nx] !== player) break
      coords.push([nx, ny])
      step++
    }

    step = 1
    while (true) {
      const ny = lastY - dy * step
      const nx = lastX - dx * step
      if (ny < 0 || ny >= H || nx < 0 || nx >= W || board[ny][nx] !== player) break
      coords.push([nx, ny])
      step++
    }

    if (coords.length >= 4) {
      return coords
    }
  }

  return null
}

export function kiemTraVaLatReversi(
  board: BoardCell[][],
  x: number,
  y: number,
  player: PlayerSide,
): { hopLe: boolean; flipped: [number, number][] } {
  if (board[y][x] !== null) return { hopLe: false, flipped: [] }

  const opponent: PlayerSide = player === 'X' ? 'O' : 'X'
  const H = board.length
  const W = board[0].length
  const allFlipped: [number, number][] = []

  const huong = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ]

  for (const [dy, dx] of huong) {
    const tempFlipped: [number, number][] = []
    let ny = y + dy
    let nx = x + dx

    while (ny >= 0 && ny < H && nx >= 0 && nx < W && board[ny][nx] === opponent) {
      tempFlipped.push([nx, ny])
      ny += dy
      nx += dx
    }

    if (tempFlipped.length > 0 && ny >= 0 && ny < H && nx >= 0 && nx < W && board[ny][nx] === player) {
      allFlipped.push(...tempFlipped)
    }
  }

  return {
    hopLe: allFlipped.length > 0,
    flipped: allFlipped,
  }
}

/** Mọi ô `player` được đặt quân (lật được ít nhất một quân đối phương), dạng [x, y]. */
export function cacNuocDiHopLeReversi(board: BoardCell[][], player: PlayerSide): [number, number][] {
  const ketQua: [number, number][] = []
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === null && kiemTraVaLatReversi(board, x, y, player).hopLe) ketQua.push([x, y])
    }
  }
  return ketQua
}

export function coNuocDiHopLeReversi(board: BoardCell[][], player: PlayerSide): boolean {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === null) {
        const { hopLe } = kiemTraVaLatReversi(board, x, y, player)
        if (hopLe) return true
      }
    }
  }
  return false
}

export function demQuanReversi(board: BoardCell[][]): { scoreX: number; scoreO: number } {
  let x = 0
  let o = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'X') x++
      else if (cell === 'O') o++
    }
  }
  return { scoreX: x, scoreO: o }
}

// ── Cờ vua / cờ tướng: bàn chơi là chuỗi nước đi, trọng tài bằng engine dùng chung với giao diện ──

/** Dựng lại thế cờ vua từ các nước đã đi — giữ đủ lịch sử thế cờ để xét luật lặp lại ba lần. */
export function dungTheCoVua(moves: readonly NuocCo[]): ChessPosition {
  const pos = ChessPosition.fromFen()
  for (const m of moves) pos.makeMove(m)
  return pos
}

/** Dựng lại thế cờ tướng từ các nước đã đi. */
export function dungTheCoTuong(moves: readonly NuocCo[]): XiangqiPosition {
  const pos = XiangqiPosition.fromFen()
  for (const m of moves) pos.makeMove({ from: m.from, to: m.to })
  return pos
}

export type KetQuaNuocCo =
  | { hopLe: false }
  | {
      hopLe: true
      /** Nước đúng như engine sinh ra (máy khách không tự đặt được cờ phong cấp hay ô lạ). */
      nuoc: NuocCo
      /** Ván kết thúc ngay sau nước này: màu quân thắng (0 = Trắng/Đỏ, 1 = Đen) hoặc null nếu hoà. */
      ketThuc: { mauThang: 0 | 1 | null } | null
    }

/**
 * Trọng tài một nước cờ vua / cờ tướng: dựng lại thế cờ từ các nước đã đi, chỉ nhận nước nằm trong danh sách nước
 * hợp lệ của engine khi đúng lượt màu `mauDi`, rồi xét kết thúc ván (chiếu hết, hết nước, lặp lại, luật hoà).
 */
export function trongTaiNuocCo(
  gameType: GameTypeCoNuoc,
  moves: readonly NuocCo[],
  nuoc: NuocCo,
  mauDi: 0 | 1,
): KetQuaNuocCo {
  if (gameType === 'chess') {
    const pos = dungTheCoVua(moves)
    if (pos.turn !== mauDi) return { hopLe: false }
    const hopLe = pos
      .legalMoves()
      .find((m) => m.from === nuoc.from && m.to === nuoc.to && (m.promo ?? 0) === (nuoc.promo ?? 0))
    if (!hopLe) return { hopLe: false }
    pos.makeMove(hopLe)
    const kq = pos.outcome()
    return {
      hopLe: true,
      nuoc: hopLe.promo ? { from: hopLe.from, to: hopLe.to, promo: hopLe.promo } : { from: hopLe.from, to: hopLe.to },
      ketThuc: kq.over ? { mauThang: kq.winner } : null,
    }
  }

  if (nuoc.promo !== undefined) return { hopLe: false }
  const pos = dungTheCoTuong(moves)
  if (pos.turn !== mauDi) return { hopLe: false }
  const hopLe = pos.legalMoves().find((m) => m.from === nuoc.from && m.to === nuoc.to)
  if (!hopLe) return { hopLe: false }
  pos.makeMove(hopLe)
  const kq = pos.outcome()
  return { hopLe: true, nuoc: { from: hopLe.from, to: hopLe.to }, ketThuc: kq.over ? { mauThang: kq.winner } : null }
}
