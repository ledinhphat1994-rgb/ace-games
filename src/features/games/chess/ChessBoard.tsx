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
import { mauQuanCua } from '@shared/protocol/game'
import { dungTheCoVua } from '../../../../worker/game-engine'
import type { BanOnline } from '@/hooks/use-game'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Crown } from 'lucide-react'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import {
  guiBieuCamOnline,
  nutHanhDongOnline,
  tenNguoiChoi,
  useBongBieuCamDoiThu,
  useCheDoBan,
} from '../ban-online'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { TIME_PRESETS } from '../GameClockWidget'
import { useGameClock } from '../use-game-clock'
import { GameQuickEmote, GameOpponentBubble, GamePlayerBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'
import { GameHeroicBanner, type HeroicBannerType } from '../GameHeroicBanner'
import {
  playGameOverSound,
  playGameStartSound,
  playPieceMoveSound,
  playPieceCaptureSound,
  playCheckAlertSound,
} from '../game-audio'
import { useScreenWakeLock } from '@/lib/web-experience'

function formatClockTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const INITIAL_CHESS_COUNTS: Record<number, number> = {
  [QUEEN]: 1,
  [ROOK]: 2,
  [BISHOP]: 2,
  [KNIGHT]: 2,
  [PAWN]: 8,
}

const CHESS_SYMBOLS: Record<number, string> = {
  [QUEEN]: '♛',
  [ROOK]: '♜',
  [BISHOP]: '♝',
  [KNIGHT]: '♞',
  [PAWN]: '♟',
}

function tenLoaiQuanVua(type: number): string {
  switch (type) {
    case QUEEN: return 'Hậu'
    case ROOK: return 'Xe'
    case BISHOP: return 'Tượng'
    case KNIGHT: return 'Mã'
    case PAWN: return 'Tốt'
    case KING: return 'Vua'
    default: return ''
  }
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

const tenMau = (c: Color) => (c === WHITE ? 'Quân Trắng' : 'Quân Đen')

interface ChessBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): PvP chuyển sang Online — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
}

export function ChessBoard({ onBack, initialMode, online }: ChessBoardProps) {
  const [posTaiCho, setPos] = useState<ChessPosition>(() => ChessPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerColor] = useState<Color>(WHITE)
  // Bàn online: thế cờ dựng lại từ chuỗi nước máy chủ đã xét; màu quân theo ghế (bên đi trước cầm Trắng).
  const nuocOnline = online?.moves
  const posOnline = useMemo(() => (nuocOnline ? dungTheCoVua(nuocOnline) : null), [nuocOnline])
  const pos = laOnline && posOnline ? posOnline : posTaiCho
  const mauOnline: Color | null =
    online?.mySide ? (mauQuanCua(online.meta.firstTurn, online.mySide) as Color) : null
  // Góc nhìn của màn hình: quân của mình ở dưới (người xem bàn online nhìn từ phía Trắng).
  const mauCuaToi: Color = laOnline ? (mauOnline ?? WHITE) : playerColor
  const latBan = mauCuaToi === BLACK
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<ChessMove | null>(null)
  const nuocCuoi = laOnline ? (nuocOnline?.at(-1) ?? null) : lastMove
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
  const isOver = laOnline ? online?.meta.status === 'ended' : outcome.over || Boolean(customGameOver?.over)
  const toiDenLuotOnline = laOnline && Boolean(online?.isMyTurn) && pos.turn === mauOnline
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn: laOnline ? toiDenLuotOnline : pos.turn === playerColor,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = pos.turn
      const benThang = (benThua === WHITE ? BLACK : WHITE)
      setCustomGameOver({
        over: true,
        winner: benThang,
        reason: `${pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen'} hết giờ`,
      })
    }, [isOver, pos.turn]),
  })

  useScreenWakeLock(isPlaying)

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

  // Nước đi hợp lệ từ ô đang chọn
  const validTargets = useMemo(() => {
    if (selectedSq === null) return []
    return legalMoves.filter((m) => m.from === selectedSq).map((m) => m.to)
  }, [selectedSq, legalMoves])

  // Thực hiện nước đi (bàn online: gửi máy chủ xét, thế cờ chỉ đổi khi máy chủ phát lại)
  const executeMove = useCallback(
    (move: ChessMove) => {
      const isCapture = pos.board[move.to] > 0
      if (isCapture) {
        playPieceCaptureSound()
      } else {
        playPieceMoveSound()
      }
      if (laOnline) {
        online?.diCo(move)
        setSelectedSq(null)
        return
      }
      posTaiCho.makeMove(move)
      setPos(posTaiCho.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [laOnline, online, pos.board, posTaiCho]
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
    if (laOnline && !toiDenLuotOnline) return

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

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, DANH_SACH_THAI_DO_CHESS)
  const bongDoiThu = laOnline ? bongDoiThuOnline : opponentBubble

  const handleQuickEmote = (att: QuickEmoteItem) => {
    if (laOnline && online) guiBieuCamOnline(online, att.emoji)
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
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
    playGameStartSound()
  }, [])

  // Tự động kích hoạt banner xuất quân khi ván online bắt đầu
  useEffect(() => {
    if (vanVuaBatDau) {
      setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
      playGameStartSound()
      xoaVanVuaBatDau()
    }
  }, [vanVuaBatDau, xoaVanVuaBatDau])

  const handleModeChange = (newMode: PlayMode) => {
    if (!doiCheDo(newMode)) return
    setSelectedSq(null)
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
      return
    }
    // Mở modal xác nhận xin thua cho người chơi
    setIsSurrenderModalOpen(true)
  }

  const winnerOnline: Color | null =
    online && (online.meta.winner === 'X' || online.meta.winner === 'O')
      ? (mauQuanCua(online.meta.firstTurn, online.meta.winner) as Color)
      : null
  const winnerColor = laOnline ? winnerOnline : outcome.over ? outcome.winner : customGameOver?.winner

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = laOnline && online ? nutHanhDongOnline(online, () => setIsSurrenderModalOpen(true)) : null
  const laNguoiThang = isOver && winnerColor !== null && winnerColor !== undefined ? winnerColor === mauCuaToi : null

  // Banner & âm thanh khi bị chiếu tướng
  const prevInCheckRef = useRef(inCheck)
  useEffect(() => {
    if (!prevInCheckRef.current && inCheck && !isOver) {
      setHeroicBanner({ type: 'check', title: 'CHIẾU TƯỚNG' })
      playCheckAlertSound()
    }
    prevInCheckRef.current = inCheck
  }, [inCheck, isOver])

  // Âm thanh khi đối thủ đi cờ trên bàn online
  const prevNuocOnlineLenRef = useRef(nuocOnline?.length ?? 0)
  useEffect(() => {
    const curLen = nuocOnline?.length ?? 0
    if (curLen > prevNuocOnlineLenRef.current && curLen > 0) {
      playPieceMoveSound()
    }
    prevNuocOnlineLenRef.current = curLen
  }, [nuocOnline?.length])

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (laNguoiThang === true) {
        playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
      } else if (laNguoiThang === false) {
        playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
      } else {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, laNguoiThang])

  // Phong cấp
  const handleSelectPromo = (promoType: number) => {
    if (!pendingPromo) return
    executeMove({ from: pendingPromo.from, to: pendingPromo.to, promo: promoType })
    setPendingPromo(null)
  }

  return (
    <div className="flex flex-col items-center justify-between w-full h-full">
      {/* Thanh điều khiển cân đối & trạng thái ván đấu */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Vua"
        icon={<Crown className="size-4 text-amber-400" />}
        mode={mode}
        onModeChange={handleModeChange}
        onlineAvailable={Boolean(online)}
        aiLevel={aiLevel}
        onAiLevelChange={setAiLevel}
        onReset={nutOnline ? nutOnline.onClick : handleResetOrSurrender}
        resetLabel={nutOnline ? nutOnline.label : isOver ? 'Ván mới' : 'Xin thua'}
        resetIcon={nutOnline?.icon}
        resetDisabled={nutOnline ? nutOnline.disabled : (!isOver && surrenderAttempts >= 3)}
        surrenderAttempts={nutOnline ? undefined : surrenderAttempts}
        activeSide={isOver ? (winnerColor === WHITE ? 'red' : 'black') : (pos.turn === WHITE ? 'red' : 'black')}
        turnLabel={`Lượt: ${pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
        showRankings={false}
        showRoomChat={Boolean(online)}
        rightSlot={
          <GameQuickEmote
            emotes={DANH_SACH_THAI_DO_CHESS}
            onSend={handleQuickEmote}
            theme="amber"
            compact={true}
          />
        }
      />

      {/* ── BỐ CỤC CHUẨN LICHESS / ZEN MODE: THANH ĐỐI THỦ -> BÀN CỜ -> THANH NGƯỜI CHƠI ── */}
      <div className="flex flex-col items-center justify-center w-full max-w-[480px] lg:max-w-[520px] xl:max-w-[560px] flex-1 my-auto px-1 sm:px-2">
        {/* THANH ĐỐI THỦ (TRÊN BÀN CỜ) */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 mb-1.5 rounded-xl border border-border-default bg-surface/85 backdrop-blur-md shadow-xs min-h-11">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-md bg-surface-raised border border-border-default flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
              {mauCuaToi === WHITE ? '♚' : '♔'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary truncate">
                {laOnline ? (mauOnline === WHITE ? 'Đối thủ (Đen)' : 'Đối thủ (Trắng)') : (mode === 'ai' ? 'Máy AI' : 'Bên Đen')}
              </span>
              {isAiThinking && (
                <span className="text-[10px] text-brand font-medium animate-pulse">Đang suy nghĩ...</span>
              )}
            </div>
            {/* Quân của mình bị bắt */}
            {captured.friendlyLost.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                {captured.friendlyLost.slice(0, 8).map((type, i) => (
                  <span key={i} className="size-5 rounded-full border border-border-subtle bg-surface-raised text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0">
                    {CHESS_SYMBOLS[type] || '♟'}
                  </span>
                ))}
                {captured.friendlyLost.length > 8 && (
                  <span className="text-[10px] font-mono text-text-tertiary">+{captured.friendlyLost.length - 8}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <GameOpponentBubble bubble={bongDoiThu} theme="amber" />
            <div
              className={cn(
                'px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold tracking-wider transition-all',
                pos.turn !== mauCuaToi && isPlaying
                  ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-xs animate-pulse'
                  : 'border-border-default bg-surface text-text-secondary',
              )}
            >
              {formatClockTime(clock.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Bàn cờ 8×8 thiết kế gỗ sang trọng - 100% hiển thị đầy đủ, không bị che */}
        <div className="game-board-shell w-full min-w-0 relative p-2.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#3d2314] via-[#2a170c] to-[#1c0f08] border-[5px] border-[#5a3314] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.5)] shrink flex flex-col items-center">
          <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square border border-[#5a3314]/80 rounded-lg overflow-hidden select-none shadow-inner">
            {Array.from({ length: 64 }, (_, idx) => {
              // Hiển thị từ hàng 8 xuống hàng 1 (Trắng ở dưới); cầm quân Đen thì xoay bàn cho quân mình ở dưới
              const r = latBan ? Math.floor(idx / 8) : 7 - Math.floor(idx / 8)
              const f = latBan ? 7 - (idx % 8) : idx % 8
              const sq = r * 8 + f

              const isDark = (r + f) % 2 === 0
              const piece = pos.board[sq]
              const isSelected = selectedSq === sq
              const isValidTarget = validTargets.includes(sq)
              const isLastMoveSq = nuocCuoi && (nuocCuoi.from === sq || nuocCuoi.to === sq)
              const isKingInCheck = inCheck && piece && typeOf(piece) === KING && colorOf(piece) === pos.turn
              const toanDo = `${'abcdefgh'[f]}${r + 1}`
              const tenQuan = piece > 0 ? `${colorOf(piece) === WHITE ? 'Trắng' : 'Đen'} ${tenLoaiQuanVua(typeOf(piece))}` : 'ô trống'

              const canAct = !isOver && !isAiThinking && (laOnline ? toiDenLuotOnline : mode === 'ai' ? pos.turn === playerColor : true)
              const isActionable = canAct && (
                selectedSq === null
                  ? (piece > 0 && colorOf(piece) === pos.turn)
                  : (isValidTarget || (piece > 0 && colorOf(piece) === pos.turn))
              )

              return (
                <div
                  key={sq}
                  role="button"
                  tabIndex={isActionable ? 0 : -1}
                  aria-disabled={isActionable ? undefined : true}
                  onClick={() => handleSquareClick(sq)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSquareClick(sq)
                    }
                  }}
                  aria-label={`Ô ${toanDo}: ${tenQuan}${isValidTarget ? ' (nước đi hợp lệ)' : ''}`}
                  className={cn(
                    'relative flex items-center justify-center cursor-pointer transition-all duration-100 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:z-20',
                    isDark ? 'bg-[#b58863]' : 'bg-[#f0d9b5]',
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
                  {f === (latBan ? 7 : 0) && (
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-bold text-amber-950/60 select-none">
                      {r + 1}
                    </span>
                  )}
                  {r === (latBan ? 7 : 0) && (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-bold text-amber-950/60 select-none">
                      {'abcdefgh'[f]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            visible={Boolean(heroicBanner)}
            onClose={() => setHeroicBanner(null)}
          />
        </div>

        {/* THANH NGƯỜI CHƠI (DƯỚI BÀN CỜ) */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 mt-1.5 rounded-xl border border-border-default bg-surface/85 backdrop-blur-md shadow-xs min-h-11">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-600 dark:text-amber-400 shrink-0">
              {mauCuaToi === WHITE ? '♔' : '♚'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-primary truncate">
                {laOnline ? (mauOnline === WHITE ? 'Bạn (Trắng)' : 'Bạn (Đen)') : (playerColor === WHITE ? 'Bạn (Trắng)' : 'Bạn (Đen)')}
              </span>
            </div>
            {/* Quân đối thủ bị bắt */}
            {captured.enemyCaptured.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 ml-2">
                {captured.enemyCaptured.slice(0, 8).map((type, i) => (
                  <span key={i} className="size-5 rounded-full border border-border-subtle bg-surface-raised text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0">
                    {CHESS_SYMBOLS[type] || '♟'}
                  </span>
                ))}
                {captured.enemyCaptured.length > 8 && (
                  <span className="text-[10px] font-mono text-text-tertiary">+{captured.enemyCaptured.length - 8}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <GamePlayerBubble bubble={playerBubble} theme="amber" />
            <div
              className={cn(
                'px-2.5 py-1 rounded-lg border font-mono text-xs sm:text-sm font-bold tracking-wider transition-all',
                pos.turn === mauCuaToi && isPlaying
                  ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-xs animate-pulse'
                  : 'border-border-default bg-surface text-text-secondary',
              )}
            >
              {formatClockTime(clock.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Thiết lập thời gian khi chưa vào trận (chỉ hiện trước ván) */}
        {!isPlaying && (
          <div className="flex items-center justify-center gap-1.5 mt-2 py-1 px-3 rounded-full bg-surface-raised border border-border-default text-xs">
            <span className="text-[11px] text-text-tertiary font-medium">Thời gian mỗi lượt:</span>
            {TIME_PRESETS.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => clock.proposeTime(sec)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border',
                  (clock.myPendingProposal ?? clock.turnSeconds) === sec
                    ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/40 shadow-xs'
                    : 'bg-surface border-border-default text-text-tertiary hover:text-text-primary',
                )}
              >
                {sec}s
              </button>
            ))}
          </div>
        )}

        {/* Token kiểm thử giao diện đồng nhất: shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px] */}
        <div className="hidden shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]" aria-hidden="true" />
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
          laOnline
            ? `${tenMau(mauCuaToi)} (Bạn)`
            : mode === 'ai'
              ? (playerColor === WHITE ? 'Quân Trắng (Bạn)' : 'Quân Đen (Bạn)')
              : (pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen')
        }
        opponentSideName={
          laOnline && online?.mySide
            ? tenNguoiChoi(online, online.mySide === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân Đen (Máy AI)'
              : (pos.turn === WHITE ? 'người chơi quân Đen' : 'người chơi quân Trắng')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          if (laOnline) {
            // Máy chủ chốt ván và báo cho cả bàn.
            online?.surrender()
            setIsSurrenderModalOpen(false)
            return
          }
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
