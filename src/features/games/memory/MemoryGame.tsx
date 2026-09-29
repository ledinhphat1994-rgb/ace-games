import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameStatusWidget } from '../GameStatusWidget'
import { GameQuickEmote, GameOpponentBubble, GamePlayerBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'

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
  { symbol: '💎', label: 'Kim cương', color: 'from-cyan-400 to-blue-500' },
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
  const [turn, setTurn] = useState<1 | 2>(1) // 1: Bạn (Quân 1), 2: Đối thủ (Máy AI hoặc Người 2)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [muted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [surrenderWinner, setSurrenderWinner] = useState<boolean | null>(null)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)

  // ─ Biểu cảm & tin nhắn (Vùng 1: Ta ở dưới | Vùng 1+: Địch ở trên) ─
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

  // Đánh giá nước đi (Trúng -> Cộng điểm & tiếp tục; Trật -> Chuyển lượt sang phe kia)
  const evaluateTurn = useCallback(
    (c1: number, c2: number, activeTurn: 1 | 2, currentMatched: number[]) => {
      setTotalMoves((m) => m + 1)
      const isMatch = cards[c1].symbol === cards[c2].symbol

      if (isMatch) {
        // ── GHÉP TRÚNG CẶP! ──
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
            const finalScore1 = score1 + (activeTurn === 1 ? 1 : 0)
            const finalScore2 = score2 + (activeTurn === 2 ? 1 : 0)
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
              scheduleAiTurn(newMatched)
            } else {
              setIsLocked(false)
            }
          }
        }, 800)
      } else {
        // ── LẬT TRẬT (KHÔNG TRÙNG)! ──
        playSound('miss', muted)
        // Dừng 1 giây để người chơi nhìn rõ 2 thẻ vừa lật
        tEvalRef.current = setTimeout(() => {
          setFlipped([])
          // CHUYỂN LƯỢT CHO PHE ĐỐI PHƯƠNG
          if (activeTurn === 1) {
            setTurn(2)
            if (mode === 'pve') {
              scheduleAiTurn(currentMatched)
            } else {
              setIsLocked(false)
            }
          } else {
            // Máy lật trật -> Chuyển lượt ngay về cho người chơi (BẠN), MÁY DỪNG HẲN!
            setTurn(1)
            setIsAiThinking(false)
            setIsLocked(false)
          }
        }, 1000)
      }
    },
    [cards, mode, muted, onSaveScore, totalMoves],
  )

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

        // Chờ 800ms để lật tiếp thẻ 2
        t2Ref.current = setTimeout(() => {
          const availForC2 = cards
            .map((_, i) => i)
            .filter((i) => !currentMatched.includes(i) && i !== choice1)

          let c2 = choice2
          if (c2 === null || !availForC2.includes(c2)) {
            // Kiểm tra xem thẻ 1 vừa lật có khớp với thẻ nào trong trí nhớ không
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
          evaluateTurn(choice1!, c2, 2, currentMatched)
        }, 850)
      }, 700)
    },
    [cards, evaluateTurn, muted],
  )

  // Xử lý khi người chơi bấm lật thẻ
  const handleCardClick = (idx: number) => {
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
  }

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
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl mx-auto">
      {/* ── 1. Thanh điều khiển GamePlayToolbar chuẩn hoá (Đã xoá badge Vùng 3) ── */}
      <GamePlayToolbar
        onBack={onBack}
        title="Lật Thẻ Trí Nhớ"
        icon={<Brain className="size-4 text-violet-400" />}
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
        turnLabel={turn === 1 ? 'Lượt: Bạn' : (mode === 'pve' ? 'Lượt: Máy AI' : 'Lượt: Người chơi 2')}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
        rightSlot={
          <GameQuickEmote
            emotes={DANH_SACH_THAI_DO_MEMORY}
            onSend={handleQuickEmote}
            theme="violet"
            compact={true}
          />
        }
      />

      {/* Trạng thái ván gọn khi màn nhỏ (< lg) */}
      <div className="flex lg:hidden items-center justify-center gap-2 h-8 px-3.5 mb-2 rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold shrink-0">
        <span className="text-base leading-none">
          {isGameOver ? (isWinner === true ? '🏆' : isWinner === false ? '💀' : '🤝') : (turn === 1 ? '🧠' : '🤖')}
        </span>
        <span
          style={{
            color: isGameOver
              ? isWinner === true
                ? '#10b981'
                : isWinner === false
                  ? '#f43f5e'
                  : '#eab308'
              : '#a855f7',
          }}
          className="font-black uppercase tracking-wider whitespace-nowrap"
        >
          {isGameOver ? (winnerTitle || (isWinner ? 'BẠN THẮNG' : 'BẠN THUA')) : (turn === 1 ? 'LƯỢT BẠN' : (mode === 'pve' ? 'MÁY AI' : 'NGƯỜI CHƠI 2'))}
        </span>
        {isGameOver && (
          <span className="text-slate-400 font-medium truncate">
            {score1} - {score2}
          </span>
        )}
      </div>

      {/* ── 2. Bố cục 3 khối cân xứng tối giản như Caro: Cột trái (Vùng 1) | Bàn chơi | Cột phải (Vùng 1+/Vùng 1) ── */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI (VÙNG 1): Trạng thái ván đấu phát quang ── */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[480px] xl:h-[540px] 2xl:h-[580px] select-none text-center">
          <GameStatusWidget
            icon={isGameOver ? (isWinner ? '🏆' : '💀') : (turn === 1 ? '🧠' : '🤖')}
            label={
              isGameOver
                ? (winnerTitle || (isWinner ? 'BẠN THẮNG!' : 'BẠN THUA!'))
                : (turn === 1 ? 'LƯỢT BẠN' : (mode === 'pve' ? 'MÁY AI' : 'NGƯỜI CHƠI 2'))
            }
            subLabel={
              isGameOver
                ? `Tỉ số: ${score1} - ${score2}`
                : isAiThinking
                  ? undefined
                  : `Bạn: ${score1} cặp | Máy: ${score2} cặp (${matched.length / 2}/8)`
            }
            isPlayerTurn={turn === 1}
            isAiThinking={isAiThinking}
            isGameOver={isGameOver}
            isWinner={isWinner}
            theme="violet"
          />
        </div>

        {/* ── BÀN CHƠI TRUNG TÂM: LƯỚI THẺ 4x4 (VÙNG 4 ĐÃ FIX LOGIC) ── */}
        <div className="relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl shrink-0">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 p-1">
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(idx)
              const isMatched = matched.includes(idx)

              return (
                <div
                  key={card.id}
                  className="relative aspect-square w-[74px] h-[74px] sm:w-[90px] sm:h-[90px] xl:w-[98px] xl:h-[98px] cursor-pointer [perspective:1000px]"
                  onClick={() => handleCardClick(idx)}
                >
                  <div
                    className={cn(
                      'relative size-full rounded-2xl transition-all duration-500 [transform-style:preserve-3d]',
                      isFlipped && '[transform:rotateY(180deg)]',
                      isMatched && 'scale-95 opacity-90',
                    )}
                  >
                    {/* Mặt sau thẻ */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 p-2 shadow-lg transition-transform duration-200 hover:scale-[1.03] hover:border-violet-400/40 [backface-visibility:hidden]">
                      <div className="flex size-full items-center justify-center rounded-xl border border-white/5 bg-slate-950/40">
                        <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 text-violet-400">
                          <Sparkles className="size-4 opacity-75" />
                        </div>
                      </div>
                    </div>

                    {/* Mặt trước thẻ (khi lật) */}
                    <div
                      className={cn(
                        'absolute inset-0 flex flex-col items-center justify-center rounded-2xl border p-2 shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]',
                        isMatched
                          ? 'border-emerald-400/60 bg-gradient-to-br from-emerald-950/80 to-teal-900/80 shadow-emerald-500/20'
                          : 'border-white/20 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-md',
                      )}
                    >
                      <span className="text-3xl sm:text-4xl drop-shadow-md select-none transform transition-transform duration-300 scale-100 hover:scale-110">
                        {card.symbol}
                      </span>
                      <span className="mt-1 text-[10px] font-medium text-slate-300/80 select-none truncate max-w-full px-1">
                        {card.label}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bong bóng biểu cảm khi màn hình nhỏ (< lg) không có hai cột hai bên */}
          <div className="lg:hidden absolute top-2 right-2 z-30 pointer-events-none">
            <GameOpponentBubble bubble={opponentBubble} theme="violet" />
          </div>
          <div className="lg:hidden absolute bottom-2 right-2 z-30 pointer-events-none">
            <GamePlayerBubble bubble={playerBubble} theme="violet" />
          </div>
        </div>

        {/* ── CỘT PHẢI: VÙNG 2 (Địch ở trên) | VÙNG 1+ (Ta ở dưới) ── */}
        <div className="hidden lg:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[480px] xl:h-[540px] 2xl:h-[580px] select-none py-2">
          {/* VÙNG 2: Tin nhắn đối thủ (Địch / AI) ở góc trên */}
          <div className="w-full flex justify-center">
            <GameOpponentBubble bubble={opponentBubble} theme="violet" />
          </div>

          {/* VÙNG 1+: Tin nhắn của ta ở góc dưới */}
          <div className="w-full flex justify-center">
            <GamePlayerBubble bubble={playerBubble} theme="violet" />
          </div>
        </div>
      </div>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode === 'pve' ? 'ai' : 'pass_and_play'}
        surrenderSideName="Bạn (Quân 1)"
        opponentSideName={mode === 'pve' ? 'người chơi Máy AI' : 'người chơi 2'}
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          setSurrenderWinner(false) // Bạn thua
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
