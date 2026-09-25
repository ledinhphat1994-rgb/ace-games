import { useCallback, useEffect, useRef, useState } from 'react'
import { PartyPopper, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { KICH_THUOC_BAN_DON } from './board-size'
import { DPad } from './SoloGameControls'
import { SnakeDeluxe } from './snake/SnakeDeluxe'

export type SoloGameType = 'solo_2048' | 'solo_memory' | 'solo_snake'

interface SoloGameStageProps {
  gameType: SoloGameType
  /** Lưu kỷ lục cho 2048 / Trí nhớ (đường cũ, chưa xác thực). Rắn săn mồi tự xác thực qua máy chủ. */
  onSaveScore: (score: number) => void
  /** Gọi khi máy chủ đã chấm xong một ván Rắn săn mồi (để làm mới bảng xếp hạng). */
  onSnakeSettled?: () => void
}

export function SoloGameStage({ gameType, onSaveScore, onSnakeSettled }: SoloGameStageProps) {
  if (gameType === 'solo_2048') return <Game2048View onSaveScore={onSaveScore} />
  if (gameType === 'solo_memory') return <GameMemoryView onSaveScore={onSaveScore} />
  return <SnakeDeluxe onSettled={onSnakeSettled} />
}

function Hud({ nhan, giaTri, mauGiaTri, onRestart }: { nhan: string; giaTri: number; mauGiaTri: string; onRestart: () => void }) {
  return (
    <div className="flex w-full items-end justify-between gap-4">
      <div>
        <p className="text-xs font-medium text-text-tertiary">{nhan}</p>
        <p className={cn('text-3xl leading-none font-semibold tracking-tight tabular-nums', mauGiaTri)}>{giaTri}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRestart}>
        <RotateCcw />
        Chơi lại
      </Button>
    </div>
  )
}

function ThongBaoVan({ tone, children }: { tone: 'thang' | 'thua'; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-sm font-medium',
        tone === 'thang' ? 'border-success/30 bg-success-muted text-success' : 'border-border-default bg-surface text-text-secondary',
      )}
    >
      {tone === 'thang' && <PartyPopper className="size-4 shrink-0" />}
      {children}
    </p>
  )
}

// ── 2048 ──────────────────────────────────────────────────────────────────────

type Huong = 'left' | 'right' | 'up' | 'down'

function taoBan2048(): number[][] {
  const b = Array.from({ length: 4 }, () => [0, 0, 0, 0])
  themOMoi(b)
  themOMoi(b)
  return b
}

function themOMoi(b: number[][]) {
  const trong: [number, number][] = []
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c] === 0) trong.push([r, c])
  if (trong.length === 0) return
  const [r, c] = trong[Math.floor(Math.random() * trong.length)]
  b[r][c] = Math.random() < 0.9 ? 2 : 4
}

function xoay(b: number[][]): number[][] {
  const res = Array.from({ length: 4 }, () => [0, 0, 0, 0])
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) res[c][3 - r] = b[r][c]
  return res
}

function truotTrai(b: number[][]): { ban: number[][]; diem: number; doi: boolean } {
  let diem = 0
  let doi = false
  const ban = b.map((hang) => {
    const so = hang.filter((v) => v !== 0)
    const moi: number[] = []
    for (let i = 0; i < so.length; i++) {
      if (i < so.length - 1 && so[i] === so[i + 1]) {
        moi.push(so[i] * 2)
        diem += so[i] * 2
        i++
      } else {
        moi.push(so[i])
      }
    }
    while (moi.length < 4) moi.push(0)
    if (moi.some((v, idx) => v !== hang[idx])) doi = true
    return moi
  })
  return { ban, diem, doi }
}

function conNuocDi(b: number[][]): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (b[r][c] === 0) return true
      if (c < 3 && b[r][c] === b[r][c + 1]) return true
      if (r < 3 && b[r][c] === b[r + 1][c]) return true
    }
  }
  return false
}

// Đúng bảng màu ô cũ của trò 2048.
const MAU_O: Record<number, string> = {
  2: 'bg-amber-100 text-slate-800',
  4: 'bg-amber-200 text-slate-800',
  8: 'bg-orange-400 text-white',
  16: 'bg-orange-500 text-white',
  32: 'bg-rose-500 text-white',
  64: 'bg-red-600 text-white',
  128: 'bg-yellow-400 text-slate-900',
  256: 'bg-yellow-500 text-slate-900',
  512: 'bg-cyan-500 text-white',
  1024: 'bg-cyan-400 text-slate-900',
  2048: 'bg-gradient-to-br from-amber-300 to-yellow-400 text-slate-950',
}

function Game2048View({ onSaveScore }: { onSaveScore: (score: number) => void }) {
  const [board, setBoard] = useState<number[][]>(taoBan2048)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const daLuuRef = useRef(false)

  const move = useCallback(
    (huong: Huong) => {
      if (gameOver) return
      const soLanXoay = huong === 'up' ? 3 : huong === 'right' ? 2 : huong === 'down' ? 1 : 0
      let tam = board.map((r) => [...r])
      for (let i = 0; i < soLanXoay; i++) tam = xoay(tam)
      const { ban, diem, doi } = truotTrai(tam)
      if (!doi) return
      let ketQua = ban
      for (let i = 0; i < (4 - soLanXoay) % 4; i++) ketQua = xoay(ketQua)
      themOMoi(ketQua)
      const diemMoi = score + diem
      setBoard(ketQua)
      setScore(diemMoi)
      if (!conNuocDi(ketQua)) {
        setGameOver(true)
        // Hết nước đi: lưu kỷ lục ngay, không đợi người chơi bấm "Chơi lại".
        if (diemMoi > 0 && !daLuuRef.current) {
          daLuuRef.current = true
          onSaveScore(diemMoi)
        }
      }
    },
    [board, gameOver, score, onSaveScore],
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Huong> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }
      const huong = map[e.key]
      if (!huong) return
      e.preventDefault()
      move(huong)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [move])

  const choiLai = () => {
    if (score > 0 && !daLuuRef.current) onSaveScore(score)
    daLuuRef.current = false
    setBoard(taoBan2048())
    setScore(0)
    setGameOver(false)
  }

  return (
    <div className="flex w-full flex-col items-center gap-4" style={KICH_THUOC_BAN_DON}>
      <Hud nhan="Điểm" giaTri={score} mauGiaTri="text-amber-300" onRestart={choiLai} />
      {gameOver && <ThongBaoVan tone="thua">Hết nước đi — bạn đạt {score} điểm.</ThongBaoVan>}
      <div className="grid w-full grid-cols-4 gap-2 rounded-2xl border border-border-default bg-surface p-2 shadow-2xl shadow-black/30 sm:gap-2.5 sm:p-2.5">
        {board.map((hang, r) =>
          hang.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className={cn(
                'flex aspect-square items-center justify-center rounded-xl font-bold tabular-nums transition-colors duration-100',
                v === 0 ? 'bg-surface-overlay/60' : MAU_O[v] ?? 'bg-slate-700 text-white',
                v >= 1000 ? 'text-lg sm:text-xl' : v >= 100 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl',
              )}
            >
              {v > 0 ? v : ''}
            </div>
          )),
        )}
      </div>
      <DPad onDir={move} />
    </div>
  )
}

// ── Lật thẻ trí nhớ 4×4 ───────────────────────────────────────────────────────

const CARD_EMOJIS = ['🚀', '🪐', '⚡', '💎', '🔥', '🎨', '🧩', '🎯']

function taoBoThe(): string[] {
  return [...CARD_EMOJIS, ...CARD_EMOJIS].sort(() => Math.random() - 0.5)
}

function GameMemoryView({ onSaveScore }: { onSaveScore: (score: number) => void }) {
  const [cards, setCards] = useState<string[]>(taoBoThe)
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [won, setWon] = useState(false)
  const henGioUpRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (henGioUpRef.current) clearTimeout(henGioUpRef.current)
  }, [])

  const choiLai = useCallback(() => {
    if (henGioUpRef.current) clearTimeout(henGioUpRef.current)
    setCards(taoBoThe())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setWon(false)
  }, [])

  const latThe = (idx: number) => {
    if (won || flipped.length === 2 || flipped.includes(idx) || matched.includes(idx)) return
    const moi = [...flipped, idx]
    setFlipped(moi)
    if (moi.length < 2) return

    setMoves(moves + 1)
    const [a, b] = moi
    if (cards[a] === cards[b]) {
      const daKhop = [...matched, a, b]
      setMatched(daKhop)
      setFlipped([])
      if (daKhop.length === cards.length) {
        setWon(true)
        // Giữ nguyên công thức điểm cũ (tính theo số lượt trước lượt cuối).
        onSaveScore(Math.max(10, 1000 - moves * 20))
      }
    } else {
      henGioUpRef.current = setTimeout(() => setFlipped([]), 800)
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-4" style={KICH_THUOC_BAN_DON}>
      <Hud nhan="Lượt lật" giaTri={moves} mauGiaTri="text-brand" onRestart={choiLai} />
      {won && <ThongBaoVan tone="thang">Hoàn thành trong {moves} lượt lật!</ThongBaoVan>}
      <div className="grid w-full grid-cols-4 gap-2 rounded-2xl border border-border-default bg-surface p-2 shadow-2xl shadow-black/30 sm:gap-2.5 sm:p-2.5">
        {cards.map((emoji, idx) => {
          const lat = flipped.includes(idx) || matched.includes(idx)
          const khop = matched.includes(idx)
          return (
            <button
              key={idx}
              type="button"
              onClick={() => latThe(idx)}
              aria-label={lat ? `Thẻ ${emoji}` : `Lật thẻ số ${idx + 1}`}
              className={cn(
                'flex aspect-square items-center justify-center rounded-xl border text-3xl transition-colors duration-150 sm:text-4xl',
                lat
                  ? khop
                    ? 'border-success/50 bg-success-muted'
                    : 'border-brand/50 bg-brand/10'
                  : 'cursor-pointer border-border-default bg-surface-overlay/70 hover:border-border-strong hover:bg-surface-overlay',
              )}
            >
              {lat ? emoji : <span className="size-2 rounded-full bg-text-tertiary/60" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-text-tertiary">Lật hai thẻ giống nhau để ghép cặp — càng ít lượt, điểm càng cao.</p>
    </div>
  )
}
