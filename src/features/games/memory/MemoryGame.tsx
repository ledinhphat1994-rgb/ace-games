import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Brain, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { GameSurrenderModal } from '../GameSurrenderModal'
import {
  GameQuickEmote,
  GameOpponentBubble,
  GamePlayerBubble,
  type QuickEmoteItem,
  type ActiveEmoteBubble,
} from '../GameQuickEmote'

const DANH_SACH_THAI_DO_MEMORY: QuickEmoteItem[] = [
  { id: 'smart', emoji: '🧠', label: 'Siêu trí nhớ', quote: 'Nhớ hết vị trí rồi!' },
  { id: 'sparkle', emoji: '✨', label: 'Tập trung', quote: 'Chuẩn bị lật trúng cặp!' },
  { id: 'think', emoji: '🤔', label: 'Suy ngẫm', quote: 'Thẻ đó nằm ở đâu ta...' },
  { id: 'applause', emoji: '👏', label: 'Tuyệt đỉnh', quote: 'Khớp cặp chuẩn xác!' },
  { id: 'lucky', emoji: '🍀', label: 'May mắn', quote: 'Đoán bừa cũng trúng!' },
  { id: 'laugh', emoji: '😆', label: 'Vui vẻ', quote: 'Trí nhớ đỉnh của chóp!' },
  { id: 'crown', emoji: '👑', label: 'Chiến thắng', quote: 'Bậc thầy lật thẻ!' },
  { id: 'fire', emoji: '🔥', label: 'Cháy hết mình', quote: 'Thêm một lượt nữa!' },
]

export type MemoryMode = 'pve' | 'pvp'
export type MemoryDifficulty = 'easy' | 'medium' | 'hard'

interface CardItem {
  id: number
  symbol: string
  label: string
  color: string
}

const THEME_CARDS: { symbol: string; label: string; color: string }[] = [
  { symbol: '💎', label: 'Kim cương', color: 'from-brand to-brand' },
  { symbol: '🚀', label: 'Tên lửa', color: 'from-violet-500 to-indigo-600' },
  { symbol: '⚡', label: 'Sấm sét', color: 'from-amber-400 to-orange-500' },
  { symbol: '🔮', label: 'Pha lê', color: 'from-fuchsia-500 to-pink-600' },
  { symbol: '🪐', label: 'Hành tinh', color: 'from-emerald-400 to-teal-600' },
  { symbol: '👑', label: 'Vương miện', color: 'from-yellow-400 to-amber-600' },
  { symbol: '🎯', label: 'Mục tiêu', color: 'from-rose-500 to-red-600' },
  { symbol: '🏆', label: 'Cúp vàng', color: 'from-amber-300 to-yellow-500' },
]

function xaoBai(): CardItem[] {
  const cap = THEME_CARDS.map((item, idx) => [
    { id: idx * 2, symbol: item.symbol, label: item.label, color: item.color },
    { id: idx * 2 + 1, symbol: item.symbol, label: item.label, color: item.color },
  ]).flat()
  return cap.sort(() => Math.random() - 0.5)
}

function playSound(type: 'flip' | 'match' | 'miss' | 'win' | 'lose', muted: boolean) {
  if (muted || typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime
    if (type === 'flip') {
      osc.frequency.setValueAtTime(420, now)
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.08)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === 'match') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.09)
      osc.frequency.setValueAtTime(783.99, now + 0.18)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35)
      osc.start(now)
      osc.stop(now + 0.35)
    } else if (type === 'miss') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.linearRampToValueAtTime(220, now + 0.15)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'win') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(523.25, now)
      osc.frequency.setValueAtTime(659.25, now + 0.12)
      osc.frequency.setValueAtTime(783.99, now + 0.24)
      osc.frequency.setValueAtTime(1046.5, now + 0.36)
      gain.gain.setValueAtTime(0.15, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45)
      osc.start(now)
      osc.stop(now + 0.45)
    } else if (type === 'lose') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(349.23, now)
      osc.frequency.setValueAtTime(311.13, now + 0.12)
      osc.frequency.setValueAtTime(261.63, now + 0.24)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.45)
      osc.start(now)
      osc.stop(now + 0.45)
    }
  } catch {}
}

interface MemoryGameProps {
  onSaveScore?: (score: number) => void
  onBack?: () => void
}

export function MemoryGame({ onSaveScore, onBack }: MemoryGameProps) {
  const [mode, setMode] = useState<MemoryMode>('pve')
  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('medium')
  const [cards, setCards] = useState<CardItem[]>(() => xaoBai())
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [turn, setTurn] = useState<1 | 2>(1) // 1: Bạn (Quân 1), 2: Đối thủ (Máy AI hoặc Người chơi 2)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [muted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [surrenderWinner, setSurrenderWinner] = useState<boolean | null>(null)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)

  // Biểu cảm thoại người chơi và đối thủ
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQuickEmote = (att: QuickEmoteItem) => {
    setPlayerBubble({ emoji: att.emoji, quote: att.quote, sender: 'player' })
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    playerBubbleTimerRef.current = setTimeout(() => {
      setPlayerBubble(null)
    }, 3800)

    if (mode === 'pve') {
      setTimeout(() => {
        const aiQuotes = [
          { id: 'ai1', emoji: '🤖', label: 'Máy tính', quote: 'Ta đã ghi nhớ vị trí các thẻ rồi!' },
          { id: 'ai2', emoji: '⚡', label: 'Tập trung', quote: 'Lượt tới ta sẽ ghép cặp!' },
          { id: 'ai3', emoji: '🧠', label: 'Phân tích', quote: 'Trí nhớ thuật toán tuyệt đối!' },
          { id: 'ai4', emoji: '😎', label: 'Tự tin', quote: 'Còn vài cặp nữa thôi!' },
        ]
        const aiReaction = aiQuotes[Math.floor(Math.random() * aiQuotes.length)]
        setOpponentBubble({ emoji: aiReaction.emoji, quote: aiReaction.quote, sender: 'ai' })
        if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
        opponentBubbleTimerRef.current = setTimeout(() => {
          setOpponentBubble(null)
        }, 3800)
      }, 1500)
    }
  }

  const aiMemoryRef = useRef<Map<number, string>>(new Map())
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tEvalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAllTimers = () => {
    if (t1Ref.current) clearTimeout(t1Ref.current)
    if (t2Ref.current) clearTimeout(t2Ref.current)
    if (tEvalRef.current) clearTimeout(tEvalRef.current)
    t1Ref.current = null
    t2Ref.current = null
    tEvalRef.current = null
  }

  useEffect(() => () => clearAllTimers(), [])

  // Khởi động lại ván đấu
  const resetGame = useCallback(() => {
    clearAllTimers()
    setCards(xaoBai())
    setFlipped([])
    setMatched([])
    setTurn(1)
    setScore1(0)
    setScore2(0)
    setTotalMoves(0)
    setIsLocked(false)
    setIsAiThinking(false)
    setSurrenderWinner(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setPlayerBubble(null)
    setOpponentBubble(null)
    aiMemoryRef.current.clear()
  }, [])

  const score1Ref = useRef(score1)
  const score2Ref = useRef(score2)
  useEffect(() => { score1Ref.current = score1 }, [score1])
  useEffect(() => { score2Ref.current = score2 }, [score2])

  const scheduleAiTurnRef = useRef<(matched: number[]) => void>(() => {})
  const evaluateTurnRef = useRef<(c1: number, c2: number, activeTurn: 1 | 2, currentMatched: number[]) => void>(() => {})

  // Đánh giá nước đi (Trúng -> Cộng điểm & tiếp tục; Trật -> Chuyển lượt sang phe kia)
  const evaluateTurn = useCallback(
    (c1: number, c2: number, activeTurn: 1 | 2, currentMatched: number[]) => {
      setTotalMoves((m) => m + 1)
      const isMatch = cards[c1].symbol === cards[c2].symbol

      if (isMatch) {
        // GHÉP TRÚNG CẶP
        playSound('match', muted)
        aiMemoryRef.current.delete(c1)
        aiMemoryRef.current.delete(c2)

        const newMatched = [...currentMatched, c1, c2]
        setMatched(newMatched)

        if (activeTurn === 1) {
          setScore1((s) => s + 1)
        } else {
          setScore2((s) => s + 1)
        }

        tEvalRef.current = setTimeout(() => {
          setFlipped([])
          if (newMatched.length === cards.length) {
            const finalScore1 = score1Ref.current + (activeTurn === 1 ? 1 : 0)
            const finalScore2 = score2Ref.current + (activeTurn === 2 ? 1 : 0)
            if (mode === 'pve') {
              if (finalScore1 > finalScore2) {
                playSound('win', muted)
              } else if (finalScore1 < finalScore2) {
                playSound('lose', muted)
              } else {
                playSound('match', muted)
              }
            } else {
              playSound('win', muted)
            }
            if (onSaveScore) {
              const finalScore = Math.max(10, 1000 - (totalMoves + 1) * 25)
              onSaveScore(finalScore)
            }
          } else {
            // Khi ghép trúng: Được quyền đi tiếp một lượt nữa
            if (activeTurn === 1) {
              setIsLocked(false)
            } else if (mode === 'pve') {
              // Máy trúng -> máy lật tiếp
              scheduleAiTurnRef.current(newMatched)
            } else {
              setIsLocked(false)
            }
          }
        }, 800)
      } else {
        // LẬT TRẬT (KHÔNG TRÙNG)
        playSound('miss', muted)
        tEvalRef.current = setTimeout(() => {
          setFlipped([])
          // CHUYỂN LƯỢT CHO PHE ĐỐI PHƯƠNG
          if (activeTurn === 1) {
            setTurn(2)
            if (mode === 'pve') {
              scheduleAiTurnRef.current(currentMatched)
            } else {
              setIsLocked(false)
            }
          } else {
            // Máy lật trật -> Chuyển lượt về cho người chơi
            setTurn(1)
            setIsAiThinking(false)
            setIsLocked(false)
          }
        }, 1000)
      }
    },
    [cards, mode, muted, onSaveScore, totalMoves],
  )
  useEffect(() => {
    evaluateTurnRef.current = evaluateTurn
  }, [evaluateTurn])

  // AI Lên lịch lật thẻ
  const scheduleAiTurn = useCallback(
    (currentMatched: number[]) => {
      setIsAiThinking(true)
      setIsLocked(true)

      t1Ref.current = setTimeout(() => {
        const available = cards
          .map((_, i) => i)
          .filter((i) => !currentMatched.includes(i))

        if (available.length === 0) {
          setIsAiThinking(false)
          setIsLocked(false)
          return
        }

        const memory = aiMemoryRef.current
        let choice1: number | null = null
        let choice2: number | null = null

        // 1. Kiểm tra xem trong trí nhớ AI đã có cặp nào khớp chưa
        for (const [idx1, sym1] of memory.entries()) {
          if (!available.includes(idx1)) continue
          for (const [idx2, sym2] of memory.entries()) {
            if (idx1 !== idx2 && sym1 === sym2 && available.includes(idx2)) {
              choice1 = idx1
              choice2 = idx2
              break
            }
          }
          if (choice1 !== null) break
        }

        // 2. Nếu chưa nhớ cặp nào, chọn ngẫu nhiên thẻ 1
        if (choice1 === null) {
          choice1 = available[Math.floor(Math.random() * available.length)]
        }

        // Lật thẻ 1 của AI
        playSound('flip', muted)
        aiMemoryRef.current.set(choice1, cards[choice1].symbol)
        setFlipped([choice1])

        // Chờ để lật tiếp thẻ 2
        t2Ref.current = setTimeout(() => {
          const availForC2 = cards
            .map((_, i) => i)
            .filter((i) => !currentMatched.includes(i) && i !== choice1)

          let c2 = choice2
          if (c2 === null || !availForC2.includes(c2)) {
            const sym1 = cards[choice1!].symbol
            for (const [idx, sym] of memory.entries()) {
              if (idx !== choice1 && sym === sym1 && availForC2.includes(idx)) {
                c2 = idx
                break
              }
            }
          }

          if (c2 === null || !availForC2.includes(c2)) {
            c2 = availForC2[Math.floor(Math.random() * availForC2.length)]
          }

          // Lật thẻ 2 của AI
          playSound('flip', muted)
          aiMemoryRef.current.set(c2, cards[c2].symbol)
          setFlipped([choice1!, c2])

          // Đánh giá nước đi của AI
          evaluateTurnRef.current(choice1!, c2, 2, currentMatched)
        }, 850)
      }, 700)
    },
    [cards, muted],
  )
  useEffect(() => {
    scheduleAiTurnRef.current = scheduleAiTurn
  }, [scheduleAiTurn])

  // Xử lý khi người chơi bấm lật thẻ
  const handleCardClick = useCallback(
    (idx: number) => {
      if (isLocked || isAiThinking) return
      if (mode === 'pve' && turn === 2) return
      if (flipped.length >= 2 || flipped.includes(idx) || matched.includes(idx)) return

      playSound('flip', muted)

      // Khả năng AI ghi nhớ thẻ người chơi lật theo độ khó
      const retentionChance = difficulty === 'hard' ? 0.95 : difficulty === 'medium' ? 0.7 : 0.4
      if (Math.random() <= retentionChance || mode !== 'pve') {
        aiMemoryRef.current.set(idx, cards[idx].symbol)
      }

      if (flipped.length === 0) {
        setFlipped([idx])
      } else if (flipped.length === 1) {
        const firstIdx = flipped[0]
        setFlipped([firstIdx, idx])
        setIsLocked(true)
        evaluateTurn(firstIdx, idx, turn, matched)
      }
    },
    [cards, difficulty, evaluateTurn, flipped, isAiThinking, isLocked, matched, mode, muted, turn],
  )

  const isGameOver = matched.length === cards.length || surrenderWinner !== null

  const isWinner =
    surrenderWinner !== null
      ? surrenderWinner
      : score1 > score2
        ? true
        : score2 > score1
          ? false
          : null

  const winnerTitle =
    isWinner === true
      ? 'BẠN THẮNG'
      : isWinner === false
        ? 'BẠN THUA'
        : 'HOÀ NHAU'

  const handleResetOrSurrender = () => {
    if (isGameOver) {
      resetGame()
      return
    }
    if (surrenderAttempts >= 3) {
      return
    }
    setIsSurrenderModalOpen(true)
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full min-h-0 select-none">
      {/* ── 1. THANH ĐIỀU KHIỂN CHUẨN HOÁ (Không chat/rankings nhúng) ── */}
      <GamePlayToolbar
        onBack={onBack}
        title="Lật Thẻ Trí Nhớ"
        icon={<Brain className="size-4 text-violet-400" />}
        badge="4×4"
        mode={mode === 'pve' ? 'ai' : 'pass_and_play'}
        onModeChange={(m) => {
          setMode(m === 'ai' ? 'pve' : 'pvp')
          resetGame()
        }}
        aiLevel={difficulty}
        onAiLevelChange={(lvl) => {
          setDifficulty(lvl)
          resetGame()
        }}
        onReset={handleResetOrSurrender}
        resetLabel={isGameOver ? 'Ván mới' : 'Xin thua'}
        resetDisabled={!isGameOver && surrenderAttempts >= 3}
        surrenderAttempts={surrenderAttempts}
        activeSide={turn === 1 ? 'red' : 'black'}
        turnLabel=""
        hideCenterTurn={true}
        showRoomChat={false}
        showRankings={false}
        rightSlot={
          <GameQuickEmote
            emotes={DANH_SACH_THAI_DO_MEMORY}
            onSend={handleQuickEmote}
            theme="violet"
            compact={true}
          />
        }
      />

      {/* ── 2. KHÔNG GIAN BÀN CHƠI TRUNG TÂM (4×4 CHIẾM ƯU THẾ TUYỆT ĐỐI) ── */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-[520px] flex-1 my-auto px-2 py-2 gap-2">
        {/* DẢI ĐỐI THỦ (TRÊN BÀN CHƠI) */}
        <div className="relative flex items-center justify-between w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-default shadow-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'size-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors shrink-0',
              turn === 2 && !isGameOver
                ? 'bg-violet-500/20 border-violet-400 text-violet-300 ring-2 ring-violet-400/40'
                : 'bg-surface border-border-default text-text-secondary'
            )}>
              {mode === 'pve' ? <Bot className="size-4" /> : <User className="size-4" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary truncate">
                {mode === 'pve' ? 'Máy (AI)' : 'Người chơi 2'}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {isGameOver
                  ? (isWinner === false ? 'Chiến thắng' : isWinner === true ? 'Thất bại' : 'Hoà')
                  : turn === 2
                    ? (isAiThinking ? 'Đang suy nghĩ…' : 'Đang chọn thẻ…')
                    : 'Chờ lượt'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-text-tertiary">Điểm:</span>
            <span className="text-sm font-bold font-mono text-violet-400 tabular-nums">
              {score2} cặp
            </span>
          </div>

          {/* Bong bóng biểu cảm đối thủ (ngay trên dải đối thủ, không che thẻ) */}
          <div className="absolute -top-12 right-2 z-30 pointer-events-none">
            <GameOpponentBubble bubble={opponentBubble} theme="violet" />
          </div>
        </div>

        {/* THÔNG BÁO KẾT THÚC VÁN (NẾU ĐÃ KẾT THÚC) */}
        {isGameOver && (
          <div
            role="status"
            className={cn(
              'flex items-center justify-between w-full px-4 py-2 rounded-xl border font-bold text-xs shadow-sm animate-in fade-in duration-200 shrink-0',
              isWinner === true
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isWinner === false
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            )}
          >
            <span>{winnerTitle}</span>
            <span className="font-mono">{score1} - {score2}</span>
          </div>
        )}

        {/* LƯỚI THẺ 4×4 THỐNG TRỊ KHÔNG GIAN */}
        <div className="relative w-full aspect-square p-2 sm:p-3 rounded-2xl bg-surface-raised border border-border-default shadow-xl">
          <div className="grid w-full h-full grid-cols-4 gap-2 sm:gap-2.5">
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(idx)
              const isMatched = matched.includes(idx)
              const isAiTurn = mode === 'pve' && turn === 2
              const isDisabled =
                isLocked ||
                isAiThinking ||
                isAiTurn ||
                isFlipped ||
                isMatched ||
                flipped.length >= 2

              // aria-label an toàn: không để lộ biểu tượng thẻ khi chưa lật!
              const ariaLabel = isMatched
                ? `Thẻ đã ghép: ${card.label}`
                : isFlipped
                  ? `Thẻ đã lật: ${card.label}`
                  : `Thẻ chưa lật, vị trí ${idx + 1}`

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleCardClick(idx)}
                  aria-label={ariaLabel}
                  className={cn(
                    'relative size-full rounded-xl sm:rounded-2xl transition-all duration-200 [perspective:1000px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    !isDisabled && 'hover:scale-[1.03] active:scale-95 cursor-pointer',
                    isDisabled && !isMatched && 'cursor-default',
                    isMatched && 'cursor-default opacity-85',
                  )}
                >
                  <div
                    className={cn(
                      'relative size-full rounded-xl sm:rounded-2xl transition-transform duration-500 [transform-style:preserve-3d]',
                      isFlipped && '[transform:rotateY(180deg)]',
                      isMatched && 'scale-95',
                    )}
                  >
                    {/* MẶT SAU THẺ (KHI CHƯA LẬT) */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl sm:rounded-2xl border border-border-default bg-surface hover:border-violet-400/50 hover:bg-surface-overlay transition-colors shadow-xs [backface-visibility:hidden]">
                      <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                        <Sparkles className="size-3.5 sm:size-4 opacity-80" />
                      </div>
                    </div>

                    {/* MẶT TRƯỚC THẺ (KHI LẬT / KHỚP) */}
                    <div
                      className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border p-1 sm:p-2 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]',
                        isMatched
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                          : 'border-violet-500/50 bg-surface-overlay text-text-primary',
                      )}
                    >
                      <span className="text-2xl sm:text-3xl md:text-4xl select-none leading-none transform transition-transform duration-300">
                        {card.symbol}
                      </span>
                      <span className="mt-1 text-[9px] sm:text-[10px] font-medium text-text-secondary select-none truncate max-w-full px-1">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* DẢI NGƯỜI CHƠI (DƯỚI BÀN CHƠI) */}
        <div className="relative flex items-center justify-between w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-default shadow-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              'size-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors shrink-0',
              turn === 1 && !isGameOver
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40'
                : 'bg-surface border-border-default text-text-secondary'
            )}>
              <Brain className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary truncate">
                {mode === 'pve' ? 'Bạn' : 'Người chơi 1'}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {isGameOver
                  ? (isWinner === true ? 'Chiến thắng' : isWinner === false ? 'Thất bại' : 'Hoà')
                  : turn === 1
                    ? 'Lượt của bạn'
                    : 'Chờ đối thủ…'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-text-tertiary">Điểm:</span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
              {score1} cặp
            </span>
          </div>

          {/* Bong bóng biểu cảm người chơi (ngay dưới dải người chơi, không che thẻ) */}
          <div className="absolute -bottom-12 right-2 z-30 pointer-events-none">
            <GamePlayerBubble bubble={playerBubble} theme="violet" />
          </div>
        </div>
      </div>

      {/* Modal Xin thua 3 lần */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode === 'pve' ? 'ai' : 'pass_and_play'}
        surrenderSideName="Bạn (Quân 1)"
        opponentSideName={mode === 'pve' ? 'người chơi Máy AI' : 'người chơi 2'}
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          setSurrenderWinner(false)
          playSound('lose', muted)
          setIsSurrenderModalOpen(false)
        }}
        onSurrenderRejected={() => {
          setSurrenderAttempts((prev) => Math.min(prev + 1, 3))
          setIsSurrenderModalOpen(false)
        }}
      />
    </div>
  )
}
