import {
  ChessPosition,
  type ChessMove,
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  typeOf,
  colorOf,
} from './chess-engine'

const PIECE_VALUES: Record<number, number> = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 330,
  [ROOK]: 500,
  [QUEEN]: 900,
  [KING]: 20000,
}

// Bảng điểm vị trí (Piece-Square Tables) cho cờ vua
const PST_PAWN_WHITE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
]

const PST_KNIGHT = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

const PST_BISHOP = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

function evaluate(pos: ChessPosition): number {
  let score = 0
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]
    if (!p) continue
    const t = typeOf(p)
    const c = colorOf(p)
    const baseVal = PIECE_VALUES[t] || 0
    let posBonus = 0

    if (t === PAWN) {
      posBonus = c === WHITE ? PST_PAWN_WHITE[sq] : PST_PAWN_WHITE[63 - sq]
    } else if (t === KNIGHT) {
      posBonus = PST_KNIGHT[sq]
    } else if (t === BISHOP) {
      posBonus = PST_BISHOP[sq]
    }

    const total = baseVal + posBonus
    score += c === WHITE ? total : -total
  }
  return score
}

function minimax(
  pos: ChessPosition,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  const outcome = pos.outcome()
  if (outcome.over) {
    if (outcome.winner === WHITE) return 100000 + depth
    if (outcome.winner === BLACK) return -100000 - depth
    return 0
  }
  if (depth === 0) {
    return evaluate(pos)
  }

  const moves = pos.legalMoves()
  // Move ordering: ưu tiên nước ăn quân
  moves.sort((a, b) => (pos.board[b.to] ? 10 : 0) - (pos.board[a.to] ? 10 : 0))

  if (maximizing) {
    let maxEval = -Infinity
    for (const m of moves) {
      pos.makeMove(m, false)
      const ev = minimax(pos, depth - 1, alpha, beta, false)
      pos.unmakeMove()
      maxEval = Math.max(maxEval, ev)
      alpha = Math.max(alpha, ev)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const m of moves) {
      pos.makeMove(m, false)
      const ev = minimax(pos, depth - 1, alpha, beta, true)
      pos.unmakeMove()
      minEval = Math.min(minEval, ev)
      beta = Math.min(beta, ev)
      if (beta <= alpha) break
    }
    return minEval
  }
}

export function findBestChessMove(
  pos: ChessPosition,
  level: 'easy' | 'medium' | 'hard' = 'medium'
): ChessMove | null {
  const moves = pos.legalMoves()
  if (moves.length === 0) return null

  // Chế độ Dễ: 60% ngẫu nhiên, 40% chọn nước ăn quân hoặc nước tốt
  if (level === 'easy') {
    if (Math.random() < 0.6) {
      return moves[Math.floor(Math.random() * moves.length)]
    }
  }

  const depth = level === 'hard' ? 3 : level === 'medium' ? 2 : 1
  const isWhite = pos.turn === WHITE

  let bestMove = moves[0]
  let bestScore = isWhite ? -Infinity : Infinity

  for (const m of moves) {
    pos.makeMove(m, false)
    const score = minimax(pos, depth - 1, -Infinity, Infinity, !isWhite)
    pos.unmakeMove()

    // Thêm chút ngẫu nhiên nhỏ ở mức Dễ/Vừa để nước đi phong phú
    const jitter = level === 'hard' ? 0 : (Math.random() - 0.5) * 15
    const adjustedScore = score + jitter

    if (isWhite) {
      if (adjustedScore > bestScore) {
        bestScore = adjustedScore
        bestMove = m
      }
    } else {
      if (adjustedScore < bestScore) {
        bestScore = adjustedScore
        bestMove = m
      }
    }
  }

  return bestMove
}
