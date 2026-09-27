import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  type ChessMove,
  type Color,
  WHITE,
  BLACK,
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  ChessPosition,
  typeOf,
  colorOf,
} from '../../../../shared/games/chess/chess-engine'
import { findBestChessMove } from '../../../../shared/games/chess/chess-ai'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Crown } from 'lucide-react'
import { toast } from 'sonner'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { GameCapturedTray } from '../GameCapturedTray'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameStatusWidget } from '../GameStatusWidget'
import { GameQuickEmote, GameOpponentBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'

const INITIAL_CHESS_COUNTS: Record<number, number> = {
  [QUEEN]: 1,
  [ROOK]: 2,
  [BISHOP]: 2,
  [KNIGHT]: 2,
  [PAWN]: 8,
}

// SVG Quân cờ chuẩn quốc tế, nét cao, đổ bóng nhẹ
function ChessPieceSvg({ type, color }: { type: number; color: Color }) {
  const isWhite = color === WHITE
  const fill = isWhite ? '#ffffff' : '#1e293b'
  const stroke = isWhite ? '#334155' : '#94a3b8'

  switch (type) {
    case PAWN:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case KNIGHT:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-4.04 2-6 2-1 5-8 11-7z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="17.5" cy="15.5" r="1.5" fill={stroke} />
        </svg>
      )
    case BISHOP:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M17.5 26h10M22.5 21v10" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    case ROOK:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5l1.5-16h14l1.5 16H14zM11 14h23v-3h-4v2h-5v-2h-5v2h-5v-2h-4v3z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      )
    case QUEEN:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7-14-7 14-7-11 2 12zm0 9h27v-3H9v3zm2.5-5h22l-1.5-3.5h-19l-1.5 3.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="6" cy="12" r="2" fill={fill} stroke={stroke} />
          <circle cx="14" cy="9" r="2" fill={fill} stroke={stroke} />
          <circle cx="22.5" cy="8" r="2" fill={fill} stroke={stroke} />
          <circle cx="31" cy="9" r="2" fill={fill} stroke={stroke} />
          <circle cx="39" cy="12" r="2" fill={fill} stroke={stroke} />
        </svg>
      )
    case KING:
      return (
        <svg viewBox="0 0 45 45" className="size-full drop-shadow-md select-none">
          <path
            d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-6 2-6 2s-3-7.5-10-7.5-10 7.5-10 7.5-2-3-6-2c-3 6 6 10.5 6 10.5v7z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    default:
      return null
  }
}

const DANH_SACH_THAI_DO_CHESS: QuickEmoteItem[] = [
  { id: 'fire', emoji: '🔥', label: 'Quyết chiến', quote: 'Tấn công dồn dập!' },
  { id: 'cool', emoji: '😎', label: 'Tự tin', quote: 'Nước cờ chiếu tướng!' },
  { id: 'tea', emoji: '☕', label: 'Thong thả', quote: 'Bình tĩnh kiểm soát trung tâm.' },
  { id: 'clap', emoji: '👏', label: 'Hay quá', quote: 'Một nước cờ Grandmaster!' },
  { id: 'shocked', emoji: '🤯', label: 'Bất ngờ', quote: 'Bẫy khai cuộc bất ngờ!' },
  { id: 'skull', emoji: '💀', label: 'Toang rồi', quote: 'Mất Hậu rồi sao?!' },
  { id: 'think', emoji: '🤔', label: 'Tính toán', quote: 'Đang tính toán biến thể...' },
  { id: 'shh', emoji: '🤫', label: 'Bình tĩnh', quote: 'Kỳ phùng địch thủ!' },
]

interface ChessBoardProps {
  onBack?: () => void
  initialMode?: 'ai' | 'pass_and_play'
}

export function ChessBoard({ onBack, initialMode = 'ai' }: ChessBoardProps) {
  const [pos, setPos] = useState<ChessPosition>(() => ChessPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const [mode, setMode] = useState<'ai' | 'pass_and_play'>(initialMode)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerColor] = useState<Color>(WHITE)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<ChessMove | null>(null)
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)
  const [customGameOver, setCustomGameOver] = useState<{
    over: boolean
    winner: Color | null
    reason: string
  } | null>(null)

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const isOver = outcome.over || Boolean(customGameOver?.over)

  // Tính toán số quân ăn được của 2 bên
  const captured = useMemo(() => {
    const whiteCounts: Record<number, number> = {
      [QUEEN]: 0, [ROOK]: 0, [BISHOP]: 0, [KNIGHT]: 0, [PAWN]: 0,
    }
    const blackCounts: Record<number, number> = {
      [QUEEN]: 0, [ROOK]: 0, [BISHOP]: 0, [KNIGHT]: 0, [PAWN]: 0,
    }

    for (let sq = 0; sq < 64; sq++) {
      const p = pos.board[sq]
      if (p > 0) {
        const c = colorOf(p)
        const t = typeOf(p)
        if (c === WHITE) {
          if (whiteCounts[t] !== undefined) whiteCounts[t]++
        } else {
          if (blackCounts[t] !== undefined) blackCounts[t]++
        }
      }
    }

    const order = [QUEEN, ROOK, BISHOP, KNIGHT, PAWN]
    const enemyCaptured: number[] = []
    for (const t of order) {
      const diff = (INITIAL_CHESS_COUNTS[t] || 0) - (blackCounts[t] || 0)
      for (let i = 0; i < diff; i++) enemyCaptured.push(t)
    }

    const friendlyLost: number[] = []
    for (const t of order) {
      const diff = (INITIAL_CHESS_COUNTS[t] || 0) - (whiteCounts[t] || 0)
      for (let i = 0; i < diff; i++) friendlyLost.push(t)
    }

    return { enemyCaptured, friendlyLost }
  }, [pos])

  const renderCapturedChessPiece = (type: number, isEnemy: boolean, rotation: number) => {
    const isWhite = !isEnemy
    return (
      <div
        style={{ transform: `rotate(${rotation}deg)` }}
        className={cn(
          'relative flex items-center justify-center rounded-full size-9 sm:size-10 xl:size-11 select-none transition-transform duration-150 hover:scale-90 active:scale-85 shadow-lg shadow-black/70 shrink-0 cursor-pointer p-1.5 border-[2px]',
          isWhite
            ? 'bg-gradient-to-b from-[#fdf6e2] to-[#e4ceaa] border-amber-700/80 shadow-amber-950/40'
            : 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-slate-900 shadow-black/50'
        )}
        title={isWhite ? `Quân Trắng` : `Quân Đen`}
      >
        <ChessPieceSvg type={type} color={isWhite ? WHITE : BLACK} />
      </div>
    )
  }

  // Nước đi hợp lệ từ ô đang chọn
  const validTargets = useMemo(() => {
    if (selectedSq === null) return []
    return legalMoves.filter((m) => m.from === selectedSq).map((m) => m.to)
  }, [selectedSq, legalMoves])

  // Thực hiện nước đi
  const executeMove = useCallback(
    (move: ChessMove) => {
      pos.makeMove(move)
      setPos(pos.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [pos]
  )

  // AI phản hồi lượt đi
  useEffect(() => {
    if (mode === 'ai' && pos.turn !== playerColor && !isOver) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        const best = findBestChessMove(pos, aiLevel)
        if (best) {
          executeMove(best)
        }
        setIsAiThinking(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [pos, mode, playerColor, aiLevel, isOver, executeMove])

  const handleSquareClick = (sq: number) => {
    if (isOver || isAiThinking) return
    if (mode === 'ai' && pos.turn !== playerColor) return

    const piece = pos.board[sq]

    // 1. Nếu đã chọn 1 ô trước đó
    if (selectedSq !== null) {
      if (validTargets.includes(sq)) {
        // Kiểm tra phong cấp tốt
        const movingPiece = pos.board[selectedSq]
        const isPawn = typeOf(movingPiece) === PAWN
        const toRank = sq >> 3
        if (isPawn && (toRank === 7 || toRank === 0)) {
          setPendingPromo({ from: selectedSq, to: sq })
          return
        }

        executeMove({ from: selectedSq, to: sq })
        return
      }

      // Đổi chọn quân khác cùng màu
      if (piece && colorOf(piece) === pos.turn) {
        setSelectedSq(sq)
        return
      }

      setSelectedSq(null)
      return
    }

    // 2. Chưa chọn ô nào: chọn quân của bên tới lượt
    if (piece && colorOf(piece) === pos.turn) {
      setSelectedSq(sq)
    }
  }

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

    if (mode === 'ai') {
      setTimeout(() => {
        const aiQuotes = [
          { id: 'ai1', emoji: '🤖', label: 'Stockfish Bot', quote: 'Độ sâu tính toán đã vượt 15 plies!' },
          { id: 'ai2', emoji: '☕', label: 'Máy thong thả', quote: 'Thế cờ này rất thú vị đấy.' },
          { id: 'ai3', emoji: '⚡', label: 'Phản công', quote: 'Hãy cẩn thận với đòn ghim quân!' },
          { id: 'ai4', emoji: '👑', label: 'Grandmaster Bot', quote: 'Đang mở đường cho Tốt thông!' },
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

  const resetGame = useCallback(() => {
    const newPos = ChessPosition.fromFen()
    setPos(newPos)
    setSelectedSq(null)
    setLastMove(null)
    setPlayerBubble(null)
    setOpponentBubble(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
  }, [])

  const handleModeChange = (newMode: 'ai' | 'pass_and_play') => {
    setMode(newMode)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
  }

  const handleResetOrSurrender = () => {
    if (isOver) {
      resetGame()
      return
    }
    if (surrenderAttempts >= 3) {
      toast.warning('Bạn đã hết số lần xin thua cho ván này (tối đa 3 lần)!')
      return
    }
    // Mở modal xác nhận xin thua cho người chơi
    setIsSurrenderModalOpen(true)
  }

  const winnerColor = outcome.over ? outcome.winner : customGameOver?.winner
  const winnerTitle = isOver
    ? (winnerColor === (mode === 'ai' ? playerColor : WHITE) ? 'BẠN THẮNG' : winnerColor !== null ? 'BẠN THUA' : 'HOÀ CỜ')
    : undefined

  // Phong cấp
  const handleSelectPromo = (promoType: number) => {
    if (!pendingPromo) return
    executeMove({ from: pendingPromo.from, to: pendingPromo.to, promo: promoType })
    setPendingPromo(null)
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl mx-auto">
      {/* Thanh điều khiển cân đối & trạng thái ván đấu */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Vua"
        icon={<Crown className="size-4 text-amber-400" />}
        mode={mode}
        onModeChange={handleModeChange}
        aiLevel={aiLevel}
        onAiLevelChange={setAiLevel}
        onReset={handleResetOrSurrender}
        resetLabel={isOver ? 'Ván mới' : 'Xin thua'}
        surrenderAttempts={surrenderAttempts}
        activeSide={isOver ? (winnerColor === WHITE ? 'red' : 'black') : (pos.turn === WHITE ? 'red' : 'black')}
        turnLabel={`Lượt: ${pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
      />

      {/* Khung chơi trung tâm: Cụm bên trái (Vùng 1) + Bàn cờ trung tâm + Cụm bên phải (Vùng 2 & Khay quân) */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI (VÙNG 1): Trạng thái ván đấu Cờ Vua chuẩn như Caro ── */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[500px] xl:h-[540px] 2xl:h-[570px] select-none text-center">
          <GameStatusWidget
            icon={isOver ? (outcome.over && outcome.winner === playerColor ? '🏆' : '👑') : <Crown className="size-6 text-amber-400" />}
            label={
              isOver
                ? (winnerTitle || 'VÁN ĐẤU KẾT THÚC')
                : inCheck
                  ? 'CHIẾU TƯỚNG!'
                  : (mode === 'ai' ? (pos.turn === playerColor ? 'LƯỢT BẠN' : 'MÁY (AI)') : (pos.turn === WHITE ? 'QUÂN TRẮNG' : 'QUÂN ĐEN'))
            }
            subLabel={
              isOver
                ? (outcome.reason || customGameOver?.reason || 'Ván đấu kết thúc')
                : inCheck
                  ? 'Vua đang bị đe dọa!'
                  : isAiThinking
                    ? undefined
                    : (pos.turn === WHITE ? 'Lượt đi: Quân Trắng' : 'Lượt đi: Quân Đen')
            }
            isPlayerTurn={pos.turn === playerColor}
            isAiThinking={isAiThinking}
            isGameOver={isOver}
            isWinner={outcome.over ? outcome.winner === playerColor : customGameOver ? customGameOver.winner === playerColor : null}
            isCheck={inCheck && !isOver}
            theme="amber"
          />
        </div>

        {/* Bàn cờ 8×8 thiết kế gỗ sang trọng - 100% hiển thị đầy đủ, không bị che */}
        <div className="relative p-2 sm:p-3 rounded-2xl bg-amber-950/80 border-4 border-amber-900 shadow-2xl shadow-black/60 shrink-0 flex flex-col items-center">
          <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[460px] md:h-[460px] lg:w-[500px] lg:h-[500px] xl:w-[540px] xl:h-[540px] 2xl:w-[570px] 2xl:h-[570px] border border-amber-900/60 rounded-lg overflow-hidden select-none">
            {Array.from({ length: 64 }, (_, idx) => {
              // Hiển thị từ hàng 8 xuống hàng 1 (Trắng ở dưới)
              const r = 7 - Math.floor(idx / 8)
              const f = idx % 8
              const sq = r * 8 + f

              const isDark = (r + f) % 2 === 0
              const piece = pos.board[sq]
              const isSelected = selectedSq === sq
              const isValidTarget = validTargets.includes(sq)
              const isLastMoveSq = lastMove && (lastMove.from === sq || lastMove.to === sq)
              const isKingInCheck = inCheck && piece && typeOf(piece) === KING && colorOf(piece) === pos.turn

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={cn(
                    'relative flex items-center justify-center cursor-pointer transition-all duration-100',
                    isDark ? 'bg-[#b88b4a]' : 'bg-[#e3c28c]',
                    isLastMoveSq && 'bg-amber-400/40',
                    isSelected && 'ring-4 ring-inset ring-cyan-400 bg-cyan-400/20 z-10',
                    isKingInCheck && 'bg-destructive/40 ring-4 ring-inset ring-destructive'
                  )}
                >
                  {/* Quân cờ to rõ hơn và hover zoom out 1 tí */}
                  {piece > 0 && (
                    <div className="w-[90%] h-[90%] transition-transform duration-150 hover:scale-92 active:scale-85">
                      <ChessPieceSvg type={typeOf(piece)} color={colorOf(piece)} />
                    </div>
                  )}

                  {/* Chấm gợi ý nước đi */}
                  {isValidTarget && (
                    <span
                      className={cn(
                        'absolute rounded-full pointer-events-none',
                        piece > 0
                          ? 'size-full ring-4 ring-inset ring-emerald-500/70'
                          : 'size-3.5 bg-emerald-500/70 shadow-sm'
                      )}
                    />
                  )}

                  {/* Toạ độ mép bàn */}
                  {f === 0 && (
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-amber-950/60 select-none">
                      {r + 1}
                    </span>
                  )}
                  {r === 0 && (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-amber-950/60 select-none">
                      {'abcdefgh'[f]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Nút cảm xúc phụ cho màn hình nhỏ (< lg) */}
          <div className="flex lg:hidden items-center justify-center mt-3">
            <GameQuickEmote
              emotes={DANH_SACH_THAI_DO_CHESS}
              onSend={handleQuickEmote}
              activeBubble={playerBubble || opponentBubble}
              theme="amber"
              align="center"
            />
          </div>
        </div>

        {/* ── CỘT PHẢI: VÙNG 1+ (Địch ở trên) | VÙNG 2 (Ngăn cách cố định ở giữa 50%) | VÙNG 1 (Ta ở dưới) ── */}
        <div className="hidden lg:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[500px] xl:h-[540px] 2xl:h-[570px] select-none py-1">
          <GameCapturedTray
            enemyCaptured={captured.friendlyLost}
            friendlyCaptured={captured.enemyCaptured}
            pawnType={PAWN}
            renderPiece={renderCapturedChessPiece}
            topSlot={<GameOpponentBubble bubble={opponentBubble} theme="amber" />}
            bottomSlot={
              <GameQuickEmote
                emotes={DANH_SACH_THAI_DO_CHESS}
                onSend={handleQuickEmote}
                activeBubble={playerBubble}
                theme="amber"
                align="end"
              />
            }
          />
        </div>
      </div>

      {/* Modal phong cấp tốt */}
      <Dialog open={pendingPromo !== null} onOpenChange={(open) => !open && setPendingPromo(null)}>
        <DialogContent className="max-w-xs p-5 bg-surface text-center">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Chọn quân phong cấp</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 pt-3">
            {[QUEEN, ROOK, BISHOP, KNIGHT].map((t) => (
              <button
                key={t}
                onClick={() => handleSelectPromo(t)}
                className="p-2.5 rounded-xl border border-border-default hover:bg-surface-overlay transition-colors flex flex-col items-center"
              >
                <div className="size-10">
                  <ChessPieceSvg type={t} color={pos.turn} />
                </div>
                <span className="text-[10px] mt-1 font-semibold text-text-secondary">
                  {t === QUEEN ? 'Hậu' : t === ROOK ? 'Xe' : t === BISHOP ? 'Tượng' : 'Mã'}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          mode === 'ai'
            ? (playerColor === WHITE ? 'Quân Trắng (Bạn)' : 'Quân Đen (Bạn)')
            : (pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen')
        }
        opponentSideName={
          mode === 'ai'
            ? 'người chơi quân Đen (Máy AI)'
            : (pos.turn === WHITE ? 'người chơi quân Đen' : 'người chơi quân Trắng')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          const losingSide = mode === 'ai' ? playerColor : pos.turn
          const winningSide = losingSide === WHITE ? (1 as Color) : (WHITE as Color)
          setCustomGameOver({
            over: true,
            winner: winningSide,
            reason: `${mode === 'ai' ? 'Bạn' : losingSide === WHITE ? 'Quân Trắng' : 'Quân Đen'} đã xin thua`,
          })
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
