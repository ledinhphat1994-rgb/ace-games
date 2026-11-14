import {
  XiangqiPosition,
  type XiangqiMove,
  RED,
  BLACK,
  GENERAL,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  SOLDIER,
  typeOf,
  sideOf,
  rankOf,
} from './xiangqi-engine'

const PIECE_VALUES: Record<number, number> = {
  [GENERAL]: 10000,
  [CHARIOT]: 900,
  [CANNON]: 450,
  [HORSE]: 400,
  [ELEPHANT]: 200,
  [ADVISOR]: 200,
  [SOLDIER]: 100,
}

function evaluateXiangqi(pos: XiangqiPosition): number {
  let score = 0
  for (let sq = 0; sq < 90; sq++) {
    const p = pos.board[sq]
    if (!p) continue
    const t = typeOf(p)
    const side = sideOf(p)
    let val = PIECE_VALUES[t] || 0

    // Tốt qua sông giá trị tăng gấp đôi
    if (t === SOLDIER) {
      const r = rankOf(sq)
      const quaSong = side === RED ? r >= 5 : r <= 4
      if (quaSong) val += 100
    }

    score += side === RED ? val : -val
  }
  return score
}

function minimaxXiangqi(
  pos: XiangqiPosition,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  const outcome = pos.outcome()
  if (outcome.over) {
    if (outcome.winner === RED) return 100000 + depth
    if (outcome.winner === BLACK) return -100000 - depth
    return 0
  }
  if (depth === 0) {
    return evaluateXiangqi(pos)
  }

  const moves = pos.legalMoves()
  // Sắp xếp nước đi: ưu tiên ăn quân
  moves.sort((a, b) => (pos.board[b.to] ? 10 : 0) - (pos.board[a.to] ? 10 : 0))

  if (maximizing) {
    let maxEval = -Infinity
    for (const m of moves) {
      pos.makeMove(m)
      const ev = minimaxXiangqi(pos, depth - 1, alpha, beta, false)
      pos.unmakeMove()
      maxEval = Math.max(maxEval, ev)
      alpha = Math.max(alpha, ev)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const m of moves) {
      pos.makeMove(m)
      const ev = minimaxXiangqi(pos, depth - 1, alpha, beta, true)
      pos.unmakeMove()
      minEval = Math.min(minEval, ev)
      beta = Math.min(beta, ev)
      if (beta <= alpha) break
    }
    return minEval
  }
}

export function findBestXiangqiMove(
  pos: XiangqiPosition,
  level: 'easy' | 'medium' | 'hard' = 'medium'
): XiangqiMove | null {
  const moves = pos.legalMoves()
  if (moves.length === 0) return null

  if (level === 'easy') {
    if (Math.random() < 0.6) {
      return moves[Math.floor(Math.random() * moves.length)]
    }
  }

  const depth = level === 'hard' ? 3 : level === 'medium' ? 2 : 1
  const isRed = pos.turn === RED

  let bestMove = moves[0]
  let bestScore = isRed ? -Infinity : Infinity

  for (const m of moves) {
    pos.makeMove(m)
    const score = minimaxXiangqi(pos, depth - 1, -Infinity, Infinity, !isRed)
    pos.unmakeMove()

    const jitter = level === 'hard' ? 0 : (Math.random() - 0.5) * 20
    const adjustedScore = score + jitter

    if (isRed) {
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
