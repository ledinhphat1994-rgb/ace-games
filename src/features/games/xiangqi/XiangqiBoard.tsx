import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  XiangqiPosition,
  type XiangqiMove,
  type Side,
  RED,
  GENERAL,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  SOLDIER,
  typeOf,
  sideOf,
} from '../../../../shared/games/xiangqi/xiangqi-engine'
import { findBestXiangqiMove } from '../../../../shared/games/xiangqi/xiangqi-ai'
import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { GameCapturedTray } from '../GameCapturedTray'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameStatusWidget } from '../GameStatusWidget'
import { GameQuickEmote, GameOpponentBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'
import { toast } from 'sonner'

const INITIAL_XIANGQI_COUNTS: Record<number, number> = {
  [CHARIOT]: 2,
  [HORSE]: 2,
  [ELEPHANT]: 2,
  [ADVISOR]: 2,
  [GENERAL]: 1,
  [CANNON]: 2,
  [SOLDIER]: 5,
}

// Chữ Hán thư pháp trên quân cờ
const TEN_QUAN_RED: Record<number, string> = {
  [GENERAL]: '帥',
  [ADVISOR]: '仕',
  [ELEPHANT]: '相',
  [HORSE]: '傌',
  [CHARIOT]: '俥',
  [CANNON]: '炮',
  [SOLDIER]: '兵',
}

const TEN_QUAN_BLACK: Record<number, string> = {
  [GENERAL]: '將',
  [ADVISOR]: '士',
  [ELEPHANT]: '象',
  [HORSE]: '馬',
  [CHARIOT]: '車',
  [CANNON]: '砲',
  [SOLDIER]: '卒',
}

const DANH_SACH_THAI_DO_XIANGQI: QuickEmoteItem[] = [
  { id: 'fire', emoji: '⚔️', label: 'Quyết chiến', quote: 'Tới bến luôn nào!' },
  { id: 'tea', emoji: '☕', label: 'Thong thả', quote: 'Cứ bình tĩnh uống trà suy tính.' },
  { id: 'cool', emoji: '😎', label: 'Tự tin', quote: 'Nước cờ quá đẳng cấp!' },
  { id: 'clap', emoji: '👏', label: 'Hay quá', quote: 'Nước đi rất tuyệt vời!' },
  { id: 'shocked', emoji: '🤯', label: 'Bất ngờ', quote: 'Nước cờ ngoài dự tính!' },
  { id: 'skull', emoji: '💀', label: 'Căng thẳng', quote: 'Pha này căng thẳng rồi!' },
  { id: 'think', emoji: '🤔', label: 'Tính toán', quote: 'Để ta mưu lược thêm vài nước.' },
  { id: 'shh', emoji: '🤫', label: 'Bình tĩnh', quote: 'Đừng vội mừng, ván cờ còn dài!' },
]

function XiangqiPieceToken({ piece }: { piece: number }) {
  const side = sideOf(piece)
  const type = typeOf(piece)
  const isRed = side === RED
  const text = isRed ? TEN_QUAN_RED[type] : TEN_QUAN_BLACK[type]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full size-[96%] select-none transition-transform duration-150 hover:scale-92 active:scale-85 shadow-xl cursor-pointer',
        isRed
          ? 'bg-gradient-to-b from-[#fdf6e2] to-[#e4ceaa] border-[2.5px] border-red-700 shadow-red-950/50 text-red-600 font-bold'
          : 'bg-gradient-to-b from-[#f0eae1] to-[#cfc4b2] border-[2.5px] border-slate-900 shadow-black/60 text-slate-900 font-bold'
      )}
    >
      {/* Vòng tròn hoa văn bên trong */}
      <div
        className={cn(
          'size-[85%] rounded-full border border-dashed flex items-center justify-center text-xl sm:text-2xl md:text-3xl 2xl:text-4xl font-serif font-black',
          isRed ? 'border-red-400' : 'border-slate-500'
        )}
      >
        {text}
      </div>
    </div>
  )
}

interface XiangqiBoardProps {
  onBack?: () => void
  initialMode?: 'ai' | 'pass_and_play'
}

export function XiangqiBoard({ onBack, initialMode = 'ai' }: XiangqiBoardProps) {
  const [pos, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const [mode, setMode] = useState<'ai' | 'pass_and_play'>(initialMode)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerSide] = useState<Side>(RED)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)
  const [customGameOver, setCustomGameOver] = useState<{
    over: boolean
    winner: Side | null
    reason: string
  } | null>(null)

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const isOver = outcome.over || Boolean(customGameOver?.over)

  // Tính toán số quân ăn được của 2 bên
  const captured = useMemo(() => {
    const redCounts: Record<number, number> = {
      [CHARIOT]: 0, [HORSE]: 0, [ELEPHANT]: 0, [ADVISOR]: 0, [GENERAL]: 0, [CANNON]: 0, [SOLDIER]: 0,
    }
    const blackCounts: Record<number, number> = {
      [CHARIOT]: 0, [HORSE]: 0, [ELEPHANT]: 0, [ADVISOR]: 0, [GENERAL]: 0, [CANNON]: 0, [SOLDIER]: 0,
    }

    for (let sq = 0; sq < 90; sq++) {
      const p = pos.board[sq]
      if (p > 0) {
        const s = sideOf(p)
        const t = typeOf(p)
        if (s === RED) redCounts[t] = (redCounts[t] || 0) + 1
        else blackCounts[t] = (blackCounts[t] || 0) + 1
      }
    }

    const order = [CHARIOT, CANNON, HORSE, ELEPHANT, ADVISOR, SOLDIER]
    const enemyCaptured: number[] = []
    for (const t of order) {
      const diff = (INITIAL_XIANGQI_COUNTS[t] || 0) - (blackCounts[t] || 0)
      for (let i = 0; i < diff; i++) enemyCaptured.push(t)
    }

    const friendlyLost: number[] = []
    for (const t of order) {
      const diff = (INITIAL_XIANGQI_COUNTS[t] || 0) - (redCounts[t] || 0)
      for (let i = 0; i < diff; i++) friendlyLost.push(t)
    }

    return { enemyCaptured, friendlyLost }
  }, [pos])

  const renderCapturedXiangqiPiece = (type: number, isEnemy: boolean, rotation: number) => {
    const isRed = !isEnemy
    const text = isRed ? TEN_QUAN_RED[type] : TEN_QUAN_BLACK[type]
    return (
      <div
        style={{ transform: `rotate(${rotation}deg)` }}
        className={cn(
          'relative flex items-center justify-center rounded-full size-9 sm:size-10 xl:size-11 select-none shadow-lg shadow-black/70 transition-transform duration-150 hover:scale-90 active:scale-85 shrink-0 cursor-pointer',
          isRed
            ? 'bg-gradient-to-b from-[#fdf6e2] to-[#e4ceaa] border-[2px] border-red-700 text-red-600'
            : 'bg-gradient-to-b from-[#f0eae1] to-[#cfc4b2] border-[2px] border-slate-900 text-slate-900'
        )}
        title={isRed ? `Quân Đỏ: ${text}` : `Quân Đen: ${text}`}
      >
        <div
          className={cn(
            'size-[82%] rounded-full border border-dashed flex items-center justify-center text-sm sm:text-base xl:text-lg font-serif font-black',
            isRed ? 'border-red-400' : 'border-slate-500'
          )}
        >
          {text}
        </div>
      </div>
    )
  }

  // Nước đi hợp lệ từ ô đang chọn
  const validTargets = useMemo(() => {
    if (selectedSq === null) return []
    return legalMoves.filter((m) => m.from === selectedSq).map((m) => m.to)
  }, [selectedSq, legalMoves])

  const executeMove = useCallback(
    (move: XiangqiMove) => {
      pos.makeMove(move)
      setPos(pos.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [pos]
  )

  // AI phản hồi
  useEffect(() => {
    if (mode === 'ai' && pos.turn !== playerSide && !isOver) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        const best = findBestXiangqiMove(pos, aiLevel)
        if (best) {
          executeMove(best)
        }
        setIsAiThinking(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [pos, mode, playerSide, aiLevel, isOver, executeMove])

  const handleSquareClick = (sq: number) => {
    if (isOver || isAiThinking) return
    if (mode === 'ai' && pos.turn !== playerSide) return

    const piece = pos.board[sq]

    if (selectedSq !== null) {
      if (validTargets.includes(sq)) {
        executeMove({ from: selectedSq, to: sq })
        return
      }
      if (piece && sideOf(piece) === pos.turn) {
        setSelectedSq(sq)
        return
      }
      setSelectedSq(null)
      return
    }

    if (piece && sideOf(piece) === pos.turn) {
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
          { id: 'ai1', emoji: '🤖', label: 'Máy tính', quote: 'Ta đã tính trước 10 nước đi tiếp theo!' },
          { id: 'ai2', emoji: '☕', label: 'Máy thong thả', quote: 'Hãy xem nước cờ tiếp theo của ta nhé.' },
          { id: 'ai3', emoji: '⚡', label: 'Phản đòn', quote: 'Một nước đi rất thú vị đấy!' },
          { id: 'ai4', emoji: '🧠', label: 'Mưu lược', quote: 'Cẩn thận với đòn mai phục trung lộ!' },
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
    setPos(XiangqiPosition.fromFen())
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

  const winnerSide = outcome.over ? outcome.winner : customGameOver?.winner
  const winnerTitle = isOver
    ? (winnerSide === (mode === 'ai' ? playerSide : RED) ? 'BẠN THẮNG' : winnerSide !== null ? 'BẠN THUA' : 'HOÀ CỜ')
    : undefined

  return (
    <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl mx-auto">
      {/* Thanh điều khiển cân đối & trạng thái ván đấu */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Tướng"
        icon={<Shield className="size-4 text-red-400" />}
        mode={mode}
        onModeChange={handleModeChange}
        aiLevel={aiLevel}
        onAiLevelChange={setAiLevel}
        onReset={handleResetOrSurrender}
        resetLabel={isOver ? 'Ván mới' : 'Xin thua'}
        surrenderAttempts={surrenderAttempts}
        activeSide={isOver ? (winnerSide === RED ? 'red' : 'black') : (pos.turn === RED ? 'red' : 'black')}
        turnLabel={`Lượt: ${pos.turn === RED ? 'Bên Đỏ (Đi trước)' : 'Bên Đen'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
      />

      {/* Khung chơi trung tâm: Cụm bên trái (Vùng 1) + Bàn cờ trung tâm + Cụm bên phải (Vùng 2 & Khay quân) */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI (VÙNG 1): Trạng thái ván đấu Cờ Tướng chuẩn như Caro ── */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[570px] 2xl:h-[600px] select-none text-center">
          <GameStatusWidget
            icon={isOver ? (winnerSide === playerSide ? '🏆' : '帥') : <Shield className="size-6 text-red-500" />}
            label={
              isOver
                ? (winnerTitle || 'VÁN ĐẤU KẾT THÚC')
                : inCheck
                  ? 'CHIẾU TƯỚNG!'
                  : (mode === 'ai' ? (pos.turn === playerSide ? 'LƯỢT BẠN' : 'MÁY (AI)') : (pos.turn === RED ? 'BÊN ĐỎ' : 'BÊN ĐEN'))
            }
            subLabel={
              isOver
                ? (outcome.reason || customGameOver?.reason || 'Ván đấu kết thúc')
                : inCheck
                  ? 'Tướng đang bị đe dọa!'
                  : isAiThinking
                    ? undefined
                    : (pos.turn === RED ? 'Lượt đi: Bên Đỏ xuất quân' : 'Lượt đi: Bên Đen xuất quân')
            }
            isPlayerTurn={pos.turn === playerSide}
            isAiThinking={isAiThinking}
            isGameOver={isOver}
            isWinner={outcome.over ? outcome.winner === playerSide : customGameOver ? customGameOver.winner === playerSide : null}
            isCheck={inCheck && !isOver}
            theme="red"
          />
        </div>

        {/* Bàn cờ Cờ Tướng truyền thống Á Đông (9 cột × 10 hàng) - 100% hiển thị đầy đủ, không bị che */}
        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-[#caa472] border-4 border-[#82542a] shadow-2xl shadow-black/60 select-none shrink-0 flex flex-col items-center">
          {/* Lưới và Sông */}
          <div className="relative grid grid-cols-9 grid-rows-10 w-[324px] h-[360px] sm:w-[396px] sm:h-[440px] md:w-[450px] md:h-[500px] lg:w-[486px] lg:h-[540px] xl:w-[513px] xl:h-[570px] 2xl:w-[540px] 2xl:h-[600px]">
            {/* Đường vẽ sông Sở Hà Hán Giới ở giữa hàng 4 và 5 */}
            <div className="absolute inset-x-2 top-[45%] h-[10%] flex items-center justify-around pointer-events-none text-xs sm:text-sm md:text-base font-serif font-black text-[#6d441f]/75 tracking-widest border-y border-[#6d441f]/60 bg-[#d8b586]/40">
              <span>楚 河 (Sở Hà)</span>
              <span>漢 界 (Hán Giới)</span>
            </div>

            {Array.from({ length: 90 }, (_, idx) => {
              // Hàng 9 xuống 0 (Đỏ ở dưới: hàng 0..4, Đen ở trên: hàng 5..9)
              const r = 9 - Math.floor(idx / 9)
              const f = idx % 9
              const sq = r * 9 + f

              const piece = pos.board[sq]
              const isSelected = selectedSq === sq
              const isValidTarget = validTargets.includes(sq)
              const isLastMoveSq = lastMove && (lastMove.from === sq || lastMove.to === sq)

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className={cn(
                    'relative flex items-center justify-center cursor-pointer',
                    // Đường kẻ bàn cờ cờ tướng
                    'border-r border-b border-[#6d441f]/50',
                    f === 0 && 'border-l',
                    r === 9 && 'border-t'
                  )}
                >
                  {/* Quân cờ */}
                  {piece > 0 && <XiangqiPieceToken piece={piece} />}

                  {/* Điểm gợi ý nước đi */}
                  {isValidTarget && (
                    <span
                      className={cn(
                        'absolute rounded-full pointer-events-none z-20',
                        piece > 0
                          ? 'size-full ring-4 ring-inset ring-emerald-500/80'
                          : 'size-3.5 bg-emerald-500/80 shadow-md ring-2 ring-emerald-300'
                      )}
                    />
                  )}

                  {/* Ô được chọn */}
                  {isSelected && (
                    <span className="absolute inset-0 ring-4 ring-inset ring-cyan-400 rounded-lg pointer-events-none z-10" />
                  )}

                  {/* Nước đi vừa thực hiện */}
                  {isLastMoveSq && !isSelected && (
                    <span className="absolute inset-0 bg-amber-400/25 pointer-events-none" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Nút cảm xúc phụ cho màn hình nhỏ (< lg) */}
          <div className="flex lg:hidden items-center justify-center mt-3">
            <GameQuickEmote
              emotes={DANH_SACH_THAI_DO_XIANGQI}
              onSend={handleQuickEmote}
              activeBubble={playerBubble || opponentBubble}
              theme="red"
              align="center"
            />
          </div>
        </div>

        {/* ── CỘT PHẢI: VÙNG 1+ (Địch ở trên) | VÙNG 2 (Ngăn cách cố định ở giữa 50%) | VÙNG 1 (Ta ở dưới) ── */}
        <div className="hidden lg:flex flex-col items-center justify-between shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[570px] 2xl:h-[600px] select-none py-1">
          <GameCapturedTray
            enemyCaptured={captured.friendlyLost}
            friendlyCaptured={captured.enemyCaptured}
            pawnType={SOLDIER}
            renderPiece={renderCapturedXiangqiPiece}
            topSlot={<GameOpponentBubble bubble={opponentBubble} theme="red" />}
            bottomSlot={
              <GameQuickEmote
                emotes={DANH_SACH_THAI_DO_XIANGQI}
                onSend={handleQuickEmote}
                activeBubble={playerBubble}
                theme="red"
                align="end"
              />
            }
          />
        </div>
      </div>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          mode === 'ai'
            ? (playerSide === RED ? 'Bên Đỏ (Bạn)' : 'Bên Đen (Bạn)')
            : (pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen')
        }
        opponentSideName={
          mode === 'ai'
            ? 'người chơi quân Đen (Máy AI)'
            : (pos.turn === RED ? 'người chơi quân Đen' : 'người chơi quân Đỏ')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          const losingSide = mode === 'ai' ? playerSide : pos.turn
          const winningSide = losingSide === RED ? (1 as Side) : (RED as Side)
          setCustomGameOver({
            over: true,
            winner: winningSide,
            reason: `${mode === 'ai' ? 'Bạn' : losingSide === RED ? 'Bên Đỏ' : 'Bên Đen'} đã xin thua`,
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
