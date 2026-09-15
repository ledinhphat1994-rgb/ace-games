import type { BoardCell, GameType, PlayerSide } from '../shared/protocol/game'

export function taoBanMoi(gameType: GameType): BoardCell[][] {
  let r = 15
  let c = 15

  if (gameType === 'caro_9') {
    r = 9
    c = 9
  } else if (gameType === 'connect4') {
    r = 6
    c = 7
  } else if (gameType === 'reversi') {
    r = 8
    c = 8
  }

  const ban: BoardCell[][] = Array.from({ length: r }, () => Array.from({ length: c }, () => null))

  if (gameType === 'reversi') {
    // 4 quân ban đầu ở tâm Reversi (chuẩn Othello)
    ban[3][3] = 'O'
    ban[3][4] = 'X'
    ban[4][3] = 'X'
    ban[4][4] = 'O'
  }

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
