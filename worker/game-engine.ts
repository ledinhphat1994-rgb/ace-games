import type { BoardCell, GameMetaState, GameType, LyDoKetThucVan, PlayerSide } from '../shared/protocol/game'

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
    turnTimerEndsAt: now + meta.turnTimerSeconds * 1000,
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
