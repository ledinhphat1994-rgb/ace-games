export type CaroCell = 'X' | 'O' | null

interface MoveScore {
  x: number
  y: number
  score: number
}

const HUONG = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

function diemDuong(
  board: CaroCell[][],
  x: number,
  y: number,
  dx: number,
  dy: number,
  side: 'X' | 'O'
): number {
  const H = board.length
  const W = board[0].length
  let count = 1
  let block = 0

  // Chiều thuận
  let i = 1
  while (true) {
    const nx = x + dx * i
    const ny = y + dy * i
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) {
      block++
      break
    }
    if (board[ny][nx] === side) {
      count++
      i++
    } else if (board[ny][nx] === null) {
      break
    } else {
      block++
      break
    }
  }

  // Chiều nghịch
  i = 1
  while (true) {
    const nx = x - dx * i
    const ny = y - dy * i
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) {
      block++
      break
    }
    if (board[ny][nx] === side) {
      count++
      i++
    } else if (board[ny][nx] === null) {
      break
    } else {
      block++
      break
    }
  }

  if (block === 2 && count < 5) return 0
  if (count >= 5) return 100000
  if (count === 4) return block === 0 ? 10000 : 2500
  if (count === 3) return block === 0 ? 2000 : 500
  if (count === 2) return block === 0 ? 200 : 50
  return 10
}

function danhGiaOCo(board: CaroCell[][], x: number, y: number, mySide: 'X' | 'O'): number {
  const oppSide = mySide === 'X' ? 'O' : 'X'
  let tanCong = 0
  let phongThu = 0

  for (const [dx, dy] of HUONG) {
    tanCong += diemDuong(board, x, y, dx, dy, mySide)
    phongThu += diemDuong(board, x, y, dx, dy, oppSide)
  }

  // Phòng thủ được ưu tiên cao hơn một chút khi đối thủ sắp có 4 hoặc 5
  return tanCong + phongThu * 1.1
}

export function findBestCaroMove(
  board: CaroCell[][],
  aiSide: 'X' | 'O',
  level: 'easy' | 'medium' | 'hard' = 'medium'
): { x: number; y: number } | null {
  const H = board.length
  const W = board[0].length

  // Tìm các ô trống có ít nhất 1 ô lân cận có quân (bán kính 2)
  const ungVien: { x: number; y: number }[] = []
  let coQuan = false

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (board[y][x] !== null) {
        coQuan = true
      } else {
        // Kiểm tra xem có quân trong phạm vi 2 ô không
        let gan = false
        for (let dy = -2; dy <= 2 && !gan; dy++) {
          for (let dx = -2; dx <= 2 && !gan; dx++) {
            const ny = y + dy
            const nx = x + dx
            if (nx >= 0 && nx < W && ny >= 0 && ny < H && board[ny][nx] !== null) {
              gan = true
            }
          }
        }
        if (gan) ungVien.push({ x, y })
      }
    }
  }

  // Bàn cờ hoàn toàn trống -> đi ô tâm
  if (!coQuan) {
    return { x: Math.floor(W / 2), y: Math.floor(H / 2) }
  }

  if (ungVien.length === 0) return null

  // Chế độ Dễ: 50% đi ngẫu nhiên ô gần
  if (level === 'easy' && Math.random() < 0.5) {
    return ungVien[Math.floor(Math.random() * ungVien.length)]
  }

  const scores: MoveScore[] = ungVien.map((pos) => ({
    x: pos.x,
    y: pos.y,
    score: danhGiaOCo(board, pos.x, pos.y, aiSide),
  }))

  scores.sort((a, b) => b.score - a.score)

  if (level === 'hard') {
    return scores[0]
  }

  // Chế độ Vừa: chọn 1 trong 3 nước tốt nhất
  const topMoves = scores.slice(0, Math.min(3, scores.length))
  return topMoves[Math.floor(Math.random() * topMoves.length)]
}
