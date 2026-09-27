/**
 * Luật Cờ vua đầy đủ, dùng chung cho máy chủ (trọng tài ván online), giao diện (gợi ý nước đi) và bot.
 *
 * - Ô: sq = rank * 8 + file, rank 0 = hàng "1" (phía Trắng), file 0 = cột "a".
 * - Quân: (màu << 3) | loại. Màu 0 = Trắng, 1 = Đen. Loại 1..6 = Tốt, Mã, Tượng, Xe, Hậu, Vua.
 * - Đủ luật: nhập thành, bắt tốt qua đường, phong cấp, chiếu hết, hết nước (hoà),
 *   luật 50 nước, lặp lại 3 lần, không đủ quân chiếu hết.
 * - Kiểm chứng bằng perft (test/chess-engine.test.ts) với các thế cờ chuẩn.
 */

export type Color = 0 | 1
export const WHITE: Color = 0
export const BLACK: Color = 1

export const PAWN = 1
export const KNIGHT = 2
export const BISHOP = 3
export const ROOK = 4
export const QUEEN = 5
export const KING = 6

export const makePiece = (color: Color, type: number): number => (color << 3) | type
export const typeOf = (piece: number): number => piece & 7
export const colorOf = (piece: number): Color => (piece >> 3) as Color

const CASTLE_WK = 1
const CASTLE_WQ = 2
const CASTLE_BK = 4
const CASTLE_BQ = 8

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export interface ChessMove {
  from: number
  to: number
  /** Loại quân khi phong cấp (KNIGHT..QUEEN). */
  promo?: number
}

export type ChessEndReason = 'checkmate' | 'stalemate' | 'fifty_move' | 'repetition' | 'insufficient'

export interface ChessOutcome {
  over: boolean
  /** Màu thắng; null = hoà hoặc chưa kết thúc. */
  winner: Color | null
  reason: ChessEndReason | null
}

interface Undo {
  move: ChessMove
  moved: number
  captured: number
  capturedSq: number
  castling: number
  ep: number
  halfmove: number
  fullmove: number
  rookFrom: number
  rookTo: number
}

// ─── Bảng dịch chuyển tính sẵn ────────────────────────────────────────────────

const fileOf = (sq: number) => sq & 7
const rankOf = (sq: number) => sq >> 3
const onBoard = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8

const KNIGHT_TARGETS: number[][] = []
const KING_TARGETS: number[][] = []
/** RAYS[sq][d] = các ô liên tiếp theo hướng d (0..3 thẳng, 4..7 chéo). */
const RAYS: number[][][] = []
const DIRS: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
]

for (let sq = 0; sq < 64; sq++) {
  const f = fileOf(sq)
  const r = rankOf(sq)
  const kn: number[] = []
  for (const [df, dr] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) {
    if (onBoard(f + df, r + dr)) kn.push((r + dr) * 8 + f + df)
  }
  KNIGHT_TARGETS.push(kn)
  const kg: number[] = []
  for (const [df, dr] of DIRS) {
    if (onBoard(f + df, r + dr)) kg.push((r + dr) * 8 + f + df)
  }
  KING_TARGETS.push(kg)
  const rays: number[][] = []
  for (const [df, dr] of DIRS) {
    const ray: number[] = []
    let nf = f + df
    let nr = r + dr
    while (onBoard(nf, nr)) {
      ray.push(nr * 8 + nf)
      nf += df
      nr += dr
    }
    rays.push(ray)
  }
  RAYS.push(rays)
}

/** Quyền nhập thành bị mất khi có quân đi khỏi / bị ăn tại các ô này. */
const CASTLE_MASK = new Array<number>(64).fill(15)
CASTLE_MASK[0] = 15 & ~CASTLE_WQ
CASTLE_MASK[7] = 15 & ~CASTLE_WK
CASTLE_MASK[4] = 15 & ~(CASTLE_WK | CASTLE_WQ)
CASTLE_MASK[56] = 15 & ~CASTLE_BQ
CASTLE_MASK[63] = 15 & ~CASTLE_BK
CASTLE_MASK[60] = 15 & ~(CASTLE_BK | CASTLE_BQ)

export function squareName(sq: number): string {
  return 'abcdefgh'[fileOf(sq)] + String(rankOf(sq) + 1)
}

export function parseSquare(name: string): number {
  if (!/^[a-h][1-8]$/.test(name)) return -1
  return (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97)
}

const PROMO_CHARS = ['', '', 'n', 'b', 'r', 'q']

export function moveToUci(m: ChessMove): string {
  return squareName(m.from) + squareName(m.to) + (m.promo ? PROMO_CHARS[m.promo] : '')
}

export function uciToMove(uci: string): ChessMove | null {
  if (!/^[a-h][1-8][a-h][1-8][nbrq]?$/.test(uci)) return null
  const move: ChessMove = { from: parseSquare(uci.slice(0, 2)), to: parseSquare(uci.slice(2, 4)) }
  if (uci.length === 5) move.promo = PROMO_CHARS.indexOf(uci[4])
  return move
}

const FEN_PIECES = ' pnbrqk'

// ─── Thế cờ ───────────────────────────────────────────────────────────────────

export class ChessPosition {
  board = new Array<number>(64).fill(0)
  turn: Color = WHITE
  castling = 0
  /** Ô có thể bắt tốt qua đường (-1 nếu không có). */
  ep = -1
  halfmove = 0
  fullmove = 1
  kingSq: [number, number] = [-1, -1]
  /** Khoá thế cờ sau mỗi nước (để phát hiện lặp lại 3 lần). */
  keys: string[] = []
  private undos: Undo[] = []

  static fromFen(fen: string = START_FEN): ChessPosition {
    const pos = new ChessPosition()
    const parts = fen.trim().split(/\s+/)
    if (parts.length < 4) throw new Error('FEN không hợp lệ')
    const rows = parts[0].split('/')
    if (rows.length !== 8) throw new Error('FEN không hợp lệ')
    for (let i = 0; i < 8; i++) {
      const rank = 7 - i
      let file = 0
      for (const ch of rows[i]) {
        if (/[1-8]/.test(ch)) {
          file += Number(ch)
          continue
        }
        const lower = ch.toLowerCase()
        const type = FEN_PIECES.indexOf(lower)
        if (type <= 0 || file > 7) throw new Error('FEN không hợp lệ')
        const color: Color = ch === lower ? BLACK : WHITE
        const sq = rank * 8 + file
        pos.board[sq] = makePiece(color, type)
        if (type === KING) pos.kingSq[color] = sq
        file++
      }
      if (file !== 8) throw new Error('FEN không hợp lệ')
    }
    pos.turn = parts[1] === 'b' ? BLACK : WHITE
    pos.castling =
      (parts[2].includes('K') ? CASTLE_WK : 0) |
      (parts[2].includes('Q') ? CASTLE_WQ : 0) |
      (parts[2].includes('k') ? CASTLE_BK : 0) |
      (parts[2].includes('q') ? CASTLE_BQ : 0)
    pos.ep = parts[3] === '-' ? -1 : parseSquare(parts[3])
    pos.halfmove = Number(parts[4] ?? 0) || 0
    pos.fullmove = Number(parts[5] ?? 1) || 1
    if (pos.kingSq[0] < 0 || pos.kingSq[1] < 0) throw new Error('FEN thiếu vua')
    pos.keys = [pos.positionKey()]
    return pos
  }

  clone(): ChessPosition {
    const p = new ChessPosition()
    p.board = this.board.slice()
    p.turn = this.turn
    p.castling = this.castling
    p.ep = this.ep
    p.halfmove = this.halfmove
    p.fullmove = this.fullmove
    p.kingSq = [this.kingSq[0], this.kingSq[1]]
    p.keys = this.keys.slice()
    return p
  }

  toFen(): string {
    const rows: string[] = []
    for (let rank = 7; rank >= 0; rank--) {
      let row = ''
      let empty = 0
      for (let file = 0; file < 8; file++) {
        const p = this.board[rank * 8 + file]
        if (!p) {
          empty++
          continue
        }
        if (empty) {
          row += empty
          empty = 0
        }
        const ch = FEN_PIECES[typeOf(p)]
        row += colorOf(p) === WHITE ? ch.toUpperCase() : ch
      }
      if (empty) row += empty
      rows.push(row)
    }
    const castle =
      (this.castling & CASTLE_WK ? 'K' : '') +
      (this.castling & CASTLE_WQ ? 'Q' : '') +
      (this.castling & CASTLE_BK ? 'k' : '') +
      (this.castling & CASTLE_BQ ? 'q' : '')
    return [
      rows.join('/'),
      this.turn === WHITE ? 'w' : 'b',
      castle || '-',
      this.ep >= 0 ? squareName(this.ep) : '-',
      String(this.halfmove),
      String(this.fullmove),
    ].join(' ')
  }

  /** Khoá thế cờ cho luật lặp lại: bàn cờ, lượt, quyền nhập thành, ô bắt tốt qua đường có thể thực hiện. */
  positionKey(): string {
    let key = ''
    for (let i = 0; i < 64; i++) key += String.fromCharCode(48 + this.board[i])
    let epKey = '-'
    if (this.ep >= 0) {
      // Chỉ tính ô bắt tốt qua đường nếu thật sự có tốt đối phương đứng cạnh để bắt
      const pawn = makePiece(this.turn, PAWN)
      const dir = this.turn === WHITE ? -8 : 8
      const behind = this.ep + dir
      const f = fileOf(this.ep)
      if ((f > 0 && this.board[behind - 1] === pawn) || (f < 7 && this.board[behind + 1] === pawn)) {
        epKey = String(this.ep)
      }
    }
    return `${key}|${this.turn}|${this.castling}|${epKey}`
  }

  // ─── Tấn công ───────────────────────────────────────────────────────────────

  /** Ô sq có đang bị màu `by` tấn công không. */
  isAttacked(sq: number, by: Color): boolean {
    const b = this.board
    // Tốt: tốt Trắng tấn công lên trên (+7, +9); nên ô sq bị tốt Trắng ở (sq-7, sq-9) tấn công.
    const f = fileOf(sq)
    if (by === WHITE) {
      if (f > 0 && sq - 9 >= 0 && b[sq - 9] === makePiece(WHITE, PAWN)) return true
      if (f < 7 && sq - 7 >= 0 && b[sq - 7] === makePiece(WHITE, PAWN)) return true
    } else {
      if (f > 0 && sq + 7 < 64 && b[sq + 7] === makePiece(BLACK, PAWN)) return true
      if (f < 7 && sq + 9 < 64 && b[sq + 9] === makePiece(BLACK, PAWN)) return true
    }
    const knight = makePiece(by, KNIGHT)
    for (const t of KNIGHT_TARGETS[sq]) if (b[t] === knight) return true
    const king = makePiece(by, KING)
    for (const t of KING_TARGETS[sq]) if (b[t] === king) return true
    const rook = makePiece(by, ROOK)
    const bishop = makePiece(by, BISHOP)
    const queen = makePiece(by, QUEEN)
    const rays = RAYS[sq]
    for (let d = 0; d < 8; d++) {
      const ray = rays[d]
      for (let i = 0; i < ray.length; i++) {
        const p = b[ray[i]]
        if (!p) continue
        if (p === queen || (d < 4 ? p === rook : p === bishop)) return true
        break
      }
    }
    return false
  }

  inCheck(color: Color = this.turn): boolean {
    return this.isAttacked(this.kingSq[color], (color ^ 1) as Color)
  }

  // ─── Sinh nước đi ───────────────────────────────────────────────────────────

  /** Nước đi giả hợp lệ (chưa kiểm tra vua bị chiếu). */
  pseudoMoves(capturesOnly = false): ChessMove[] {
    const moves: ChessMove[] = []
    const b = this.board
    const us = this.turn
    const them = (us ^ 1) as Color
    for (let sq = 0; sq < 64; sq++) {
      const p = b[sq]
      if (!p || colorOf(p) !== us) continue
      const type = typeOf(p)
      if (type === PAWN) {
        this.pawnMoves(sq, moves, capturesOnly)
      } else if (type === KNIGHT || type === KING) {
        const targets = type === KNIGHT ? KNIGHT_TARGETS[sq] : KING_TARGETS[sq]
        for (const t of targets) {
          const q = b[t]
          if (q ? colorOf(q) === them : !capturesOnly) moves.push({ from: sq, to: t })
        }
        if (type === KING && !capturesOnly) this.castleMoves(sq, moves)
      } else {
        const d0 = type === BISHOP ? 4 : 0
        const d1 = type === ROOK ? 4 : 8
        const rays = RAYS[sq]
        for (let d = d0; d < d1; d++) {
          const ray = rays[d]
          for (let i = 0; i < ray.length; i++) {
            const t = ray[i]
            const q = b[t]
            if (!q) {
              if (!capturesOnly) moves.push({ from: sq, to: t })
              continue
            }
            if (colorOf(q) === them) moves.push({ from: sq, to: t })
            break
          }
        }
      }
    }
    return moves
  }

  private pawnMoves(sq: number, moves: ChessMove[], capturesOnly: boolean): void {
    const b = this.board
    const us = this.turn
    const fwd = us === WHITE ? 8 : -8
    const startRank = us === WHITE ? 1 : 6
    const promoRank = us === WHITE ? 7 : 0
    const f = fileOf(sq)
    const push = (to: number) => {
      if (rankOf(to) === promoRank) {
        for (const promo of [QUEEN, ROOK, BISHOP, KNIGHT]) moves.push({ from: sq, to, promo })
      } else {
        moves.push({ from: sq, to })
      }
    }
    const one = sq + fwd
    if (!capturesOnly && one >= 0 && one < 64 && !b[one]) {
      push(one)
      const two = one + fwd
      if (rankOf(sq) === startRank && !b[two]) moves.push({ from: sq, to: two })
    }
    for (const df of [-1, 1]) {
      if (f + df < 0 || f + df > 7) continue
      const t = one + df
      if (t < 0 || t >= 64) continue
      const q = b[t]
      if (q && colorOf(q) !== us) push(t)
      else if (t === this.ep) moves.push({ from: sq, to: t })
    }
    // Khi chỉ sinh nước ăn quân: vẫn tính phong cấp không ăn (thay đổi vật chất lớn)
    if (capturesOnly && one >= 0 && one < 64 && !b[one] && rankOf(one) === promoRank) {
      moves.push({ from: sq, to: one, promo: QUEEN })
    }
  }

  private castleMoves(sq: number, moves: ChessMove[]): void {
    const b = this.board
    const us = this.turn
    const them = (us ^ 1) as Color
    if (us === WHITE && sq === 4) {
      if (this.castling & CASTLE_WK && !b[5] && !b[6] && b[7] === makePiece(WHITE, ROOK) &&
        !this.isAttacked(4, them) && !this.isAttacked(5, them) && !this.isAttacked(6, them)) {
        moves.push({ from: 4, to: 6 })
      }
      if (this.castling & CASTLE_WQ && !b[3] && !b[2] && !b[1] && b[0] === makePiece(WHITE, ROOK) &&
        !this.isAttacked(4, them) && !this.isAttacked(3, them) && !this.isAttacked(2, them)) {
        moves.push({ from: 4, to: 2 })
      }
    } else if (us === BLACK && sq === 60) {
      if (this.castling & CASTLE_BK && !b[61] && !b[62] && b[63] === makePiece(BLACK, ROOK) &&
        !this.isAttacked(60, them) && !this.isAttacked(61, them) && !this.isAttacked(62, them)) {
        moves.push({ from: 60, to: 62 })
      }
      if (this.castling & CASTLE_BQ && !b[59] && !b[58] && !b[57] && b[56] === makePiece(BLACK, ROOK) &&
        !this.isAttacked(60, them) && !this.isAttacked(59, them) && !this.isAttacked(58, them)) {
        moves.push({ from: 60, to: 58 })
      }
    }
  }

  /** Nước đi hợp lệ hoàn toàn. */
  legalMoves(capturesOnly = false): ChessMove[] {
    const legal: ChessMove[] = []
    const us = this.turn
    for (const m of this.pseudoMoves(capturesOnly)) {
      this.makeMove(m, false)
      if (!this.isAttacked(this.kingSq[us], (us ^ 1) as Color)) legal.push(m)
      this.unmakeMove()
    }
    return legal
  }

  // ─── Đi / hoàn nước ─────────────────────────────────────────────────────────

  /**
   * Thực hiện nước đi (không kiểm tra hợp lệ — gọi sau khi đã chọn từ legalMoves()).
   * `trackKey = false` dùng cho tìm kiếm của bot để nhanh hơn.
   */
  makeMove(m: ChessMove, trackKey = true): void {
    const b = this.board
    const moved = b[m.from]
    const type = typeOf(moved)
    const us = this.turn
    let captured = b[m.to]
    let capturedSq = m.to
    let rookFrom = -1
    let rookTo = -1

    if (type === PAWN && m.to === this.ep && !captured) {
      capturedSq = us === WHITE ? m.to - 8 : m.to + 8
      captured = b[capturedSq]
      b[capturedSq] = 0
    }

    this.undos.push({
      move: m,
      moved,
      captured,
      capturedSq,
      castling: this.castling,
      ep: this.ep,
      halfmove: this.halfmove,
      fullmove: this.fullmove,
      rookFrom,
      rookTo,
    })

    b[m.to] = m.promo ? makePiece(us, m.promo) : moved
    b[m.from] = 0

    if (type === KING) {
      this.kingSq[us] = m.to
      if (m.to - m.from === 2) {
        rookFrom = m.from + 3
        rookTo = m.from + 1
      } else if (m.from - m.to === 2) {
        rookFrom = m.from - 4
        rookTo = m.from - 1
      }
      if (rookFrom >= 0) {
        b[rookTo] = b[rookFrom]
        b[rookFrom] = 0
        const u = this.undos[this.undos.length - 1]
        u.rookFrom = rookFrom
        u.rookTo = rookTo
      }
    }

    this.castling &= CASTLE_MASK[m.from] & CASTLE_MASK[m.to]
    this.ep = type === PAWN && Math.abs(m.to - m.from) === 16 ? (m.from + m.to) >> 1 : -1
    this.halfmove = type === PAWN || captured ? 0 : this.halfmove + 1
    if (us === BLACK) this.fullmove++
    this.turn = (us ^ 1) as Color
    if (trackKey) this.keys.push(this.positionKey())
  }

  unmakeMove(trackKey = false): void {
    const u = this.undos.pop()
    if (!u) return
    const b = this.board
    this.turn = (this.turn ^ 1) as Color
    const us = this.turn
    b[u.move.from] = u.moved
    b[u.move.to] = 0
    if (u.captured) b[u.capturedSq] = u.captured
    if (u.rookFrom >= 0) {
      b[u.rookFrom] = b[u.rookTo]
      b[u.rookTo] = 0
    }
    if (typeOf(u.moved) === KING) this.kingSq[us] = u.move.from
    this.castling = u.castling
    this.ep = u.ep
    this.halfmove = u.halfmove
    this.fullmove = u.fullmove
    if (trackKey) this.keys.pop()
  }

  // ─── Kết quả ────────────────────────────────────────────────────────────────

  private insufficientMaterial(): boolean {
    const minors: { type: number; sqColor: number }[] = []
    for (let sq = 0; sq < 64; sq++) {
      const p = this.board[sq]
      if (!p) continue
      const t = typeOf(p)
      if (t === KING) continue
      if (t === PAWN || t === ROOK || t === QUEEN) return false
      minors.push({ type: t, sqColor: (fileOf(sq) + rankOf(sq)) & 1 })
    }
    if (minors.length <= 1) return true
    // Chỉ còn tượng cùng màu ô ở cả hai bên
    return minors.every((m) => m.type === BISHOP && m.sqColor === minors[0].sqColor)
  }

  outcome(): ChessOutcome {
    if (this.legalMoves().length === 0) {
      if (this.inCheck()) return { over: true, winner: (this.turn ^ 1) as Color, reason: 'checkmate' }
      return { over: true, winner: null, reason: 'stalemate' }
    }
    if (this.insufficientMaterial()) return { over: true, winner: null, reason: 'insufficient' }
    if (this.halfmove >= 100) return { over: true, winner: null, reason: 'fifty_move' }
    const current = this.keys[this.keys.length - 1]
    let seen = 0
    for (const k of this.keys) if (k === current) seen++
    if (seen >= 3) return { over: true, winner: null, reason: 'repetition' }
    return { over: false, winner: null, reason: null }
  }

  // ─── Ký hiệu SAN (hiển thị danh sách nước đi) ───────────────────────────────

  /** SAN của nước đi trong thế hiện tại (nước phải hợp lệ). */
  san(m: ChessMove): string {
    const p = this.board[m.from]
    const type = typeOf(p)
    let s = ''
    if (type === KING && Math.abs(m.to - m.from) === 2) {
      s = m.to > m.from ? 'O-O' : 'O-O-O'
    } else {
      const capture = !!this.board[m.to] || (type === PAWN && m.to === this.ep)
      if (type === PAWN) {
        if (capture) s = 'abcdefgh'[fileOf(m.from)] + 'x'
        s += squareName(m.to)
        if (m.promo) s += '=' + 'NBRQ'[m.promo - 2]
      } else {
        s = ' NBRQK'[type]
        const others = this.legalMoves().filter(
          (o) => o.to === m.to && o.from !== m.from && this.board[o.from] === p,
        )
        if (others.length) {
          const sameFile = others.some((o) => fileOf(o.from) === fileOf(m.from))
          const sameRank = others.some((o) => rankOf(o.from) === rankOf(m.from))
          if (!sameFile) s += 'abcdefgh'[fileOf(m.from)]
          else if (!sameRank) s += String(rankOf(m.from) + 1)
          else s += squareName(m.from)
        }
        if (capture) s += 'x'
        s += squareName(m.to)
      }
    }
    this.makeMove(m)
    if (this.inCheck()) s += this.legalMoves().length === 0 ? '#' : '+'
    this.unmakeMove(true)
    return s
  }
}

/** Đếm số nút ở độ sâu cho trước — dùng để kiểm chứng bộ sinh nước đi. */
export function perft(pos: ChessPosition, depth: number): number {
  if (depth === 0) return 1
  const moves = pos.legalMoves()
  if (depth === 1) return moves.length
  let nodes = 0
  for (const m of moves) {
    pos.makeMove(m, false)
    nodes += perft(pos, depth - 1)
    pos.unmakeMove()
  }
  return nodes
}

export function sameMove(a: ChessMove, b: ChessMove): boolean {
  return a.from === b.from && a.to === b.to && (a.promo ?? 0) === (b.promo ?? 0)
}
