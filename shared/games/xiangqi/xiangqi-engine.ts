/**
 * Luật Cờ tướng, dùng chung cho máy chủ (trọng tài ván online), giao diện và bot.
 *
 * - Ô: sq = rank * 9 + file. file 0..8 từ trái sang phải (nhìn từ phía Đỏ), rank 0 = hàng cuối của Đỏ.
 * - Quân: (bên << 3) | loại. Bên 0 = Đỏ (đi trước, nửa dưới), 1 = Đen.
 * - Luật: cửu cung, tượng không qua sông & bị cản mắt, mã bị cản chân, pháo cần đúng một ngòi để ăn,
 *   tốt qua sông mới được đi ngang, hai tướng không được đối mặt.
 * - Hết nước đi (bị chiếu bí hoặc bí nước) là thua. Hoà khi lặp lại thế cờ 3 lần hoặc 120 nửa nước
 *   liên tiếp không ăn quân. (Chưa áp dụng luật cấm chiếu dai / đuổi dai.)
 * - Kiểm chứng bằng perft (test/xiangqi-engine.test.ts): 44, 1920, 79666.
 */

export type Side = 0 | 1
export const RED: Side = 0
export const BLACK: Side = 1

export const GENERAL = 1
export const ADVISOR = 2
export const ELEPHANT = 3
export const HORSE = 4
export const CHARIOT = 5
export const CANNON = 6
export const SOLDIER = 7

export const makePiece = (side: Side, type: number): number => (side << 3) | type
export const typeOf = (piece: number): number => piece & 7
export const sideOf = (piece: number): Side => (piece >> 3) as Side

export const FILES = 9
export const RANKS = 10
export const START_FEN = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1'

/** Số nửa nước liên tiếp không ăn quân thì hoà (60 nước mỗi bên). */
export const NO_CAPTURE_DRAW_PLIES = 120

export interface XiangqiMove {
  from: number
  to: number
}

export type XiangqiEndReason = 'checkmate' | 'stalemate' | 'repetition' | 'no_capture'

export interface XiangqiOutcome {
  over: boolean
  winner: Side | null
  reason: XiangqiEndReason | null
}

export const fileOf = (sq: number) => sq % FILES
export const rankOf = (sq: number) => Math.floor(sq / FILES)
const onBoard = (f: number, r: number) => f >= 0 && f < FILES && r >= 0 && r < RANKS
const at = (f: number, r: number) => r * FILES + f

const inPalace = (side: Side, f: number, r: number) =>
  f >= 3 && f <= 5 && (side === RED ? r >= 0 && r <= 2 : r >= 7 && r <= 9)
const onOwnSide = (side: Side, r: number) => (side === RED ? r <= 4 : r >= 5)
const forwardOf = (side: Side) => (side === RED ? 1 : -1)

const FEN_LETTERS: Record<string, number> = { k: GENERAL, a: ADVISOR, b: ELEPHANT, e: ELEPHANT, n: HORSE, h: HORSE, r: CHARIOT, c: CANNON, p: SOLDIER }
const FEN_OUT = ' kabnrcp'

interface Undo {
  move: XiangqiMove
  moved: number
  captured: number
  quiet: number
}

export class XiangqiPosition {
  board = new Array<number>(FILES * RANKS).fill(0)
  turn: Side = RED
  /** Số nửa nước liên tiếp không ăn quân. */
  quiet = 0
  generalSq: [number, number] = [-1, -1]
  keys: string[] = []
  private undos: Undo[] = []

  static fromFen(fen: string = START_FEN): XiangqiPosition {
    const pos = new XiangqiPosition()
    const parts = fen.trim().split(/\s+/)
    const rows = parts[0].split('/')
    if (rows.length !== RANKS) throw new Error('FEN cờ tướng không hợp lệ')
    for (let i = 0; i < RANKS; i++) {
      const rank = RANKS - 1 - i
      let file = 0
      for (const ch of rows[i]) {
        if (/[1-9]/.test(ch)) {
          file += Number(ch)
          continue
        }
        const lower = ch.toLowerCase()
        const type = FEN_LETTERS[lower]
        if (!type || file >= FILES) throw new Error('FEN cờ tướng không hợp lệ')
        const side: Side = ch === lower ? BLACK : RED
        pos.board[at(file, rank)] = makePiece(side, type)
        if (type === GENERAL) pos.generalSq[side] = at(file, rank)
        file++
      }
      if (file !== FILES) throw new Error('FEN cờ tướng không hợp lệ')
    }
    pos.turn = parts[1] === 'b' ? BLACK : RED
    pos.quiet = Number(parts[4] ?? 0) || 0
    if (pos.generalSq[0] < 0 || pos.generalSq[1] < 0) throw new Error('FEN thiếu tướng')
    pos.keys = [pos.positionKey()]
    return pos
  }

  clone(): XiangqiPosition {
    const p = new XiangqiPosition()
    p.board = this.board.slice()
    p.turn = this.turn
    p.quiet = this.quiet
    p.generalSq = [this.generalSq[0], this.generalSq[1]]
    p.keys = this.keys.slice()
    return p
  }

  toFen(): string {
    const rows: string[] = []
    for (let rank = RANKS - 1; rank >= 0; rank--) {
      let row = ''
      let empty = 0
      for (let file = 0; file < FILES; file++) {
        const p = this.board[at(file, rank)]
        if (!p) {
          empty++
          continue
        }
        if (empty) {
          row += empty
          empty = 0
        }
        const ch = FEN_OUT[typeOf(p)]
        row += sideOf(p) === RED ? ch.toUpperCase() : ch
      }
      if (empty) row += empty
      rows.push(row)
    }
    return `${rows.join('/')} ${this.turn === RED ? 'w' : 'b'} - - ${this.quiet} 1`
  }

  positionKey(): string {
    let key = ''
    for (let i = 0; i < this.board.length; i++) key += String.fromCharCode(48 + this.board[i])
    return `${key}|${this.turn}`
  }

  // ─── Tấn công ───────────────────────────────────────────────────────────────

  /** Ô sq (thường là ô tướng) có bị bên `by` tấn công không — gồm cả luật hai tướng đối mặt. */
  isAttacked(sq: number, by: Side): boolean {
    const b = this.board
    const f = fileOf(sq)
    const r = rankOf(sq)
    const chariot = makePiece(by, CHARIOT)
    const cannon = makePiece(by, CANNON)
    const general = makePiece(by, GENERAL)

    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let nf = f + df
      let nr = r + dr
      let screened = false
      while (onBoard(nf, nr)) {
        const p = b[at(nf, nr)]
        if (p) {
          if (!screened) {
            if (p === chariot) return true
            if (p === general && df === 0) return true // hai tướng đối mặt trên cùng cột
            screened = true
          } else {
            if (p === cannon) return true
            break
          }
        }
        nf += df
        nr += dr
      }
    }

    // Mã: mã ở h đi tới sq theo (dx, dy); chân mã nằm cạnh h theo trục dài.
    const horse = makePiece(by, HORSE)
    for (const [dx, dy] of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) {
      const hf = f - dx
      const hr = r - dy
      if (!onBoard(hf, hr) || b[at(hf, hr)] !== horse) continue
      const legF = Math.abs(dx) === 2 ? hf + Math.sign(dx) : hf
      const legR = Math.abs(dy) === 2 ? hr + Math.sign(dy) : hr
      if (!b[at(legF, legR)]) return true
    }

    // Tốt: tốt của `by` đứng ngay phía sau sq theo hướng tiến của nó, hoặc bên cạnh nếu đã qua sông.
    const soldier = makePiece(by, SOLDIER)
    const fwd = forwardOf(by)
    if (onBoard(f, r - fwd) && b[at(f, r - fwd)] === soldier) return true
    for (const df of [-1, 1]) {
      if (onBoard(f + df, r) && b[at(f + df, r)] === soldier && !onOwnSide(by, r)) return true
    }
    return false
  }

  inCheck(side: Side = this.turn): boolean {
    return this.isAttacked(this.generalSq[side], (side ^ 1) as Side)
  }

  // ─── Sinh nước đi ───────────────────────────────────────────────────────────

  pseudoMoves(capturesOnly = false): XiangqiMove[] {
    const moves: XiangqiMove[] = []
    const b = this.board
    const us = this.turn
    const add = (from: number, tf: number, tr: number) => {
      const t = at(tf, tr)
      const q = b[t]
      if (q ? sideOf(q) !== us : !capturesOnly) moves.push({ from, to: t })
    }
    for (let sq = 0; sq < b.length; sq++) {
      const p = b[sq]
      if (!p || sideOf(p) !== us) continue
      const f = fileOf(sq)
      const r = rankOf(sq)
      switch (typeOf(p)) {
        case GENERAL:
          for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (inPalace(us, f + df, r + dr)) add(sq, f + df, r + dr)
          }
          break
        case ADVISOR:
          for (const [df, dr] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            if (inPalace(us, f + df, r + dr)) add(sq, f + df, r + dr)
          }
          break
        case ELEPHANT:
          for (const [df, dr] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
            const tf = f + df
            const tr = r + dr
            if (!onBoard(tf, tr) || !onOwnSide(us, tr)) continue
            if (b[at(f + df / 2, r + dr / 2)]) continue // cản mắt tượng
            add(sq, tf, tr)
          }
          break
        case HORSE:
          for (const [lf, lr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (!onBoard(f + lf, r + lr) || b[at(f + lf, r + lr)]) continue // cản chân mã
            const targets = lf !== 0 ? [[2 * lf, 1], [2 * lf, -1]] : [[1, 2 * lr], [-1, 2 * lr]]
            for (const [df, dr] of targets) {
              if (onBoard(f + df, r + dr)) add(sq, f + df, r + dr)
            }
          }
          break
        case CHARIOT:
        case CANNON: {
          const isCannon = typeOf(p) === CANNON
          for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            let nf = f + df
            let nr = r + dr
            let screened = false
            while (onBoard(nf, nr)) {
              const q = b[at(nf, nr)]
              if (!screened) {
                if (!q) {
                  if (!capturesOnly) moves.push({ from: sq, to: at(nf, nr) })
                } else if (isCannon) {
                  screened = true
                } else {
                  if (sideOf(q) !== us) moves.push({ from: sq, to: at(nf, nr) })
                  break
                }
              } else if (q) {
                if (sideOf(q) !== us) moves.push({ from: sq, to: at(nf, nr) })
                break
              }
              nf += df
              nr += dr
            }
          }
          break
        }
        case SOLDIER: {
          const fwd = forwardOf(us)
          if (onBoard(f, r + fwd)) add(sq, f, r + fwd)
          if (!onOwnSide(us, r)) {
            if (onBoard(f - 1, r)) add(sq, f - 1, r)
            if (onBoard(f + 1, r)) add(sq, f + 1, r)
          }
          break
        }
      }
    }
    return moves
  }

  legalMoves(capturesOnly = false): XiangqiMove[] {
    const legal: XiangqiMove[] = []
    const us = this.turn
    for (const m of this.pseudoMoves(capturesOnly)) {
      this.makeMove(m, false)
      if (!this.isAttacked(this.generalSq[us], (us ^ 1) as Side)) legal.push(m)
      this.unmakeMove()
    }
    return legal
  }

  makeMove(m: XiangqiMove, trackKey = true): void {
    const b = this.board
    const moved = b[m.from]
    const captured = b[m.to]
    this.undos.push({ move: m, moved, captured, quiet: this.quiet })
    b[m.to] = moved
    b[m.from] = 0
    if (typeOf(moved) === GENERAL) this.generalSq[sideOf(moved)] = m.to
    this.quiet = captured ? 0 : this.quiet + 1
    this.turn = (this.turn ^ 1) as Side
    if (trackKey) this.keys.push(this.positionKey())
  }

  unmakeMove(trackKey = false): void {
    const u = this.undos.pop()
    if (!u) return
    this.board[u.move.from] = u.moved
    this.board[u.move.to] = u.captured
    if (typeOf(u.moved) === GENERAL) this.generalSq[sideOf(u.moved)] = u.move.from
    this.quiet = u.quiet
    this.turn = (this.turn ^ 1) as Side
    if (trackKey) this.keys.pop()
  }

  outcome(): XiangqiOutcome {
    if (this.legalMoves().length === 0) {
      return { over: true, winner: (this.turn ^ 1) as Side, reason: this.inCheck() ? 'checkmate' : 'stalemate' }
    }
    if (this.quiet >= NO_CAPTURE_DRAW_PLIES) return { over: true, winner: null, reason: 'no_capture' }
    const current = this.keys[this.keys.length - 1]
    let seen = 0
    for (const k of this.keys) if (k === current) seen++
    if (seen >= 3) return { over: true, winner: null, reason: 'repetition' }
    return { over: false, winner: null, reason: null }
  }

  // ─── Ký hiệu kiểu Việt Nam: "P2-5", "M8.7", "Xt/1" ─────────────────────────

  notation(m: XiangqiMove): string {
    const p = this.board[m.from]
    const side = sideOf(p)
    const type = typeOf(p)
    const letter = ['', 'Tg', 'S', 'T', 'M', 'X', 'P', 'B'][type]
    const fileNo = (f: number) => (side === RED ? FILES - f : f + 1)
    const ff = fileOf(m.from)
    const fr = rankOf(m.from)
    const tf = fileOf(m.to)
    const tr = rankOf(m.to)
    const fwd = forwardOf(side)

    // Hai quân cùng loại trên cùng cột: dùng "t" (trước) / "s" (sau) thay số cột
    let where = String(fileNo(ff))
    const sameFile: number[] = []
    for (let r = 0; r < RANKS; r++) if (this.board[at(ff, r)] === p) sameFile.push(r)
    if (sameFile.length === 2) {
      const front = fwd > 0 ? Math.max(...sameFile) : Math.min(...sameFile)
      where = fr === front ? 't' : 's'
    }

    let op: string
    let dest: number
    if (tr === fr) {
      op = '-'
      dest = fileNo(tf)
    } else {
      op = (tr - fr) * fwd > 0 ? '.' : '/'
      const diagonalMover = type === HORSE || type === ELEPHANT || type === ADVISOR
      dest = diagonalMover ? fileNo(tf) : Math.abs(tr - fr)
    }
    return `${letter}${where}${op}${dest}`
  }
}

export function perft(pos: XiangqiPosition, depth: number): number {
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
