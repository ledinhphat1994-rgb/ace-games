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
  type XiangqiEndReason,
} from '../../../../shared/games/xiangqi/xiangqi-engine'
import { findBestXiangqiMove } from '../../../../shared/games/xiangqi/xiangqi-ai'
import { mauQuanCua } from '@shared/protocol/game'
import { dungTheCoTuong } from '../../../../worker/game-engine'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import { Shield } from 'lucide-react'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import {
  guiBieuCamOnline,
  moTaPhuOnline,
  nutHanhDongOnline,
  tenNguoiChoi,
  useBongBieuCamDoiThu,
  useCheDoBan,
} from '../ban-online'
import { GameCapturedTray } from '../GameCapturedTray'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameClockWidget } from '../GameClockWidget'
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

function CornerTicks({ cx, cy, left = true, right = true }: { cx: number; cy: number; left?: boolean; right?: boolean }) {
  const d = 6
  const len = 11
  return (
    <g stroke="#6d441f" strokeWidth="1.5" strokeLinecap="square" fill="none" opacity="0.8">
      {left && (
        <>
          <path d={`M ${cx - d - len} ${cy - d} H ${cx - d} V ${cy - d - len}`} />
          <path d={`M ${cx - d - len} ${cy + d} H ${cx - d} V ${cy + d + len}`} />
        </>
      )}
      {right && (
        <>
          <path d={`M ${cx + d + len} ${cy - d} H ${cx + d} V ${cy - d - len}`} />
          <path d={`M ${cx + d + len} ${cy + d} H ${cx + d} V ${cy + d + len}`} />
        </>
      )}
    </g>
  )
}

function XiangqiSvgBoard() {
  return (
    <svg
      viewBox="0 0 900 1000"
      className="absolute inset-0 size-full pointer-events-none select-none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="xqRiverGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e5ca9c" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#faebd0" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#e5ca9c" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Dải sông Sở Hà Hán Giới (Giữa hàng 4 y=450 và hàng 5 y=550) */}
      <rect x="50" y="450" width="800" height="100" fill="url(#xqRiverGrad)" />
      <line x1="50" y1="450" x2="850" y2="450" stroke="#6d441f" strokeWidth="1.8" opacity="0.9" />
      <line x1="50" y1="550" x2="850" y2="550" stroke="#6d441f" strokeWidth="1.8" opacity="0.9" />

      {/* Chữ thư pháp trên sông - hoàn toàn không bị đường dọc nào cắt qua */}
      <g className="font-serif">
        <text
          x="250"
          y="492"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#5a3314"
          fontSize="36"
          fontWeight="900"
          letterSpacing="8"
        >
          楚河
        </text>
        <text
          x="250"
          y="524"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#7c4d24"
          fontSize="14"
          fontWeight="700"
        >
          (Sở Hà)
        </text>

        {/* Nút chỉ phân cách giữa sông */}
        <line x1="410" y1="500" x2="490" y2="500" stroke="#7c4d24" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />

        <text
          x="650"
          y="492"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#5a3314"
          fontSize="36"
          fontWeight="900"
          letterSpacing="8"
        >
          漢界
        </text>
        <text
          x="650"
          y="524"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#7c4d24"
          fontSize="14"
          fontWeight="700"
        >
          (Hán Giới)
        </text>
      </g>

      {/* 10 đường ngang chuẩn (50, 150, 250, 350, 450, 550, 650, 750, 850, 950) */}
      {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map((y) => (
        <line key={y} x1="50" y1={y} x2="850" y2={y} stroke="#6d441f" strokeWidth="1.5" opacity="0.8" />
      ))}

      {/* 2 đường biên dọc chạy suốt từ hàng 0 đến hàng 9 */}
      <line x1="50" y1="50" x2="50" y2="950" stroke="#6d441f" strokeWidth="1.8" opacity="0.9" />
      <line x1="850" y1="50" x2="850" y2="950" stroke="#6d441f" strokeWidth="1.8" opacity="0.9" />

      {/* 7 đường dọc phía trong dừng ở bờ sông (không cắt qua sông) */}
      {[150, 250, 350, 450, 550, 650, 750].map((x) => (
        <g key={x} stroke="#6d441f" strokeWidth="1.5" opacity="0.8">
          <line x1={x} y1="50" x2={x} y2="450" />
          <line x1={x} y1="550" x2={x} y2="950" />
        </g>
      ))}

      {/* Đường chéo Cửu Cung kinh điển kết nối chuẩn các góc */}
      <g stroke="#6d441f" strokeWidth="1.5" opacity="0.85">
        {/* Cung trên (Cung Đen) */}
        <line x1="350" y1="50" x2="550" y2="250" />
        <line x1="550" y1="50" x2="350" y2="250" />
        {/* Cung dưới (Cung Đỏ) */}
        <line x1="350" y1="750" x2="550" y2="950" />
        <line x1="550" y1="750" x2="350" y2="950" />
      </g>

      {/* Dấu hoa thị (Corner Ticks) tại các vị trí Pháo và Tốt truyền thống */}
      {/* Pháo trên hàng 2 (y=250) */}
      <CornerTicks cx={150} cy={250} />
      <CornerTicks cx={750} cy={250} />
      {/* Pháo dưới hàng 7 (y=750) */}
      <CornerTicks cx={150} cy={750} />
      <CornerTicks cx={750} cy={750} />

      {/* Tốt trên hàng 3 (y=350) */}
      <CornerTicks cx={50} cy={350} left={false} />
      <CornerTicks cx={250} cy={350} />
      <CornerTicks cx={450} cy={350} />
      <CornerTicks cx={650} cy={350} />
      <CornerTicks cx={850} cy={350} right={false} />

      {/* Tốt dưới hàng 6 (y=650) */}
      <CornerTicks cx={50} cy={650} left={false} />
      <CornerTicks cx={250} cy={650} />
      <CornerTicks cx={450} cy={650} />
      <CornerTicks cx={650} cy={650} />
      <CornerTicks cx={850} cy={650} right={false} />

      {/* Khung viền chỉ đôi ngoài cùng của bàn cờ */}
      <rect x="36" y="36" width="828" height="928" rx="6" fill="none" stroke="#6d441f" strokeWidth="2.2" opacity="0.85" />
    </svg>
  )
}

function XiangqiPieceToken({ piece }: { piece: number }) {
  const side = sideOf(piece)
  const type = typeOf(piece)
  const isRed = side === RED
  const text = isRed ? TEN_QUAN_RED[type] : TEN_QUAN_BLACK[type]

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full size-[92%] select-none transition-transform duration-150 hover:scale-95 active:scale-90 cursor-pointer z-10',
        isRed
          ? 'bg-gradient-to-br from-[#fffefb] via-[#f7e8ce] to-[#dfbf92] border-[2.5px] border-[#9c5928] ring-1 ring-[#6e350c]/80 shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(130,60,15,0.35)]'
          : 'bg-gradient-to-br from-[#fcfbf7] via-[#eee5d4] to-[#cebea9] border-[2.5px] border-[#483e34] ring-1 ring-[#1f1812]/80 shadow-[0_6px_14px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(40,30,20,0.35)]'
      )}
    >
      {/* Vòng tròn hoa văn khắc chìm đôi tinh xảo (Dual concentric engraved grooves) */}
      <div
        className={cn(
          'size-[82%] rounded-full border-[1.5px] flex items-center justify-center text-[clamp(13px,6.5cqi,38px)] leading-none font-serif font-black',
          isRed
            ? 'border-[#dc2626]/40 text-[#dc2626] drop-shadow-[0_1px_0_rgba(255,255,255,0.85)]'
            : 'border-[#09090b]/35 text-[#09090b] drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]'
        )}
      >
        {text}
      </div>
    </div>
  )
}

const LY_DO_KET_THUC: Record<XiangqiEndReason, string> = {
  checkmate: 'Chiếu bí',
  stalemate: 'Hết nước đi',
  repetition: 'Lặp lại thế cờ 3 lần — hoà',
  no_capture: '60 nước không ăn quân — hoà',
}

interface XiangqiBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): PvP chuyển sang Online — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
}

export function XiangqiBoard({ onBack, initialMode, online }: XiangqiBoardProps) {
  const [posTaiCho, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerSide] = useState<Side>(RED)
  // Bàn online: thế cờ dựng lại từ chuỗi nước máy chủ đã xét; bên đi trước của ván cầm quân Đỏ.
  const nuocOnline = online?.moves
  const posOnline = useMemo(() => (nuocOnline ? dungTheCoTuong(nuocOnline) : null), [nuocOnline])
  const pos = laOnline && posOnline ? posOnline : posTaiCho
  const benOnline: Side | null = online?.mySide ? (mauQuanCua(online.meta.firstTurn, online.mySide) as Side) : null
  // Góc nhìn của màn hình: quân của mình ở dưới (người xem bàn online nhìn từ phía Đỏ).
  const benCuaToi: Side = laOnline ? (benOnline ?? RED) : playerSide
  const latBan = benCuaToi !== RED
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null)
  const nuocCuoi = laOnline ? (nuocOnline?.at(-1) ?? null) : lastMove
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
  const isOver = laOnline ? online?.meta.status === 'ended' : outcome.over || Boolean(customGameOver?.over)
  const toiDenLuotOnline = laOnline && Boolean(online?.isMyTurn) && pos.turn === benOnline
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn: laOnline ? toiDenLuotOnline : pos.turn === playerSide,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = pos.turn
      const benThang = (benThua === RED ? (1 as Side) : RED)
      setCustomGameOver({
        over: true,
        winner: benThang,
        reason: `${pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen'} hết giờ`,
      })
    }, [isOver, pos.turn]),
  })

  useScreenWakeLock(isPlaying)

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
    // Khay quân: nửa trên là quân của mình bị ăn, nửa dưới là quân đối phương mình ăn được.
    const isRed = benCuaToi === RED ? !isEnemy : isEnemy
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

  // Bàn online: gửi máy chủ xét, thế cờ chỉ đổi khi máy chủ phát lại
  const executeMove = useCallback(
    (move: XiangqiMove) => {
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
    if (laOnline && !toiDenLuotOnline) return

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

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, DANH_SACH_THAI_DO_XIANGQI)
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

  const winnerOnline: Side | null =
    online && (online.meta.winner === 'X' || online.meta.winner === 'O')
      ? (mauQuanCua(online.meta.firstTurn, online.meta.winner) as Side)
      : null
  const winnerSide = laOnline ? winnerOnline : outcome.over ? outcome.winner : customGameOver?.winner
  const winnerTitle = !isOver
    ? undefined
    : laOnline && benOnline === null
      ? winnerSide === RED
        ? 'BÊN ĐỎ THẮNG'
        : winnerSide !== null && winnerSide !== undefined
          ? 'BÊN ĐEN THẮNG'
          : 'HOÀ CỜ'
      : winnerSide === (mode === 'pass_and_play' ? RED : benCuaToi)
        ? 'BẠN THẮNG'
        : winnerSide !== null && winnerSide !== undefined
          ? 'BẠN THUA'
          : 'HOÀ CỜ'

  // Lý do kết thúc bằng tiếng Việt (ván online: đầu hàng / hết giờ do máy chủ chốt, còn lại theo luật trên bàn).
  const tenBen = (b: Side) => (b === RED ? 'Bên Đỏ' : 'Bên Đen')
  const lyDoKetThuc = (() => {
    if (!isOver) return undefined
    if (laOnline && online) {
      const benThua = winnerOnline === null ? null : ((winnerOnline ^ 1) as Side)
      if (online.meta.endReason === 'surrender' && benThua !== null) return `${tenBen(benThua)} đã xin thua`
      if (online.meta.endReason === 'timeout' && benThua !== null) return `${tenBen(benThua)} hết giờ`
    }
    return outcome.reason ? LY_DO_KET_THUC[outcome.reason] : customGameOver?.reason || 'Ván đấu kết thúc'
  })()

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = laOnline && online ? nutHanhDongOnline(online, () => setIsSurrenderModalOpen(true)) : null
  const tenBenLuot = online ? tenNguoiChoi(online, online.meta.currentTurn) : ''
  const nhanTrangThai = isOver
    ? (winnerTitle || 'VÁN ĐẤU KẾT THÚC')
    : laOnline && online?.meta.status !== 'playing'
      ? 'CHỜ ĐỐI THỦ'
      : inCheck
        ? 'CHIẾU TƯỚNG!'
        : laOnline
          ? (benOnline === null ? (pos.turn === RED ? 'BÊN ĐỎ' : 'BÊN ĐEN') : toiDenLuotOnline ? 'LƯỢT BẠN' : 'LƯỢT ĐỐI THỦ')
          : (mode === 'ai' ? (pos.turn === playerSide ? 'LƯỢT BẠN' : 'MÁY (AI)') : (pos.turn === RED ? 'BÊN ĐỎ' : 'BÊN ĐEN'))
  const phuTrangThai = isOver
    ? lyDoKetThuc
    : laOnline && online
      ? moTaPhuOnline(online, tenBenLuot)
      : inCheck
        ? 'Tướng đang bị đe dọa!'
        : isAiThinking
          ? undefined
          : (pos.turn === RED ? 'Lượt đi: Bên Đỏ xuất quân' : 'Lượt đi: Bên Đen xuất quân')
  const laNguoiThang = isOver && winnerSide !== null && winnerSide !== undefined ? winnerSide === benCuaToi : null

  const mauTrangThai = isOver
    ? laNguoiThang === true
      ? '#10b981'
      : laNguoiThang === false
        ? '#f43f5e'
        : '#eab308'
    : inCheck
      ? '#ef4444'
      : isAiThinking
        ? '#06b6d4'
        : '#ef4444'

  const emojiTrangThai = isOver
    ? laNguoiThang === true
      ? '🏆'
      : laNguoiThang === false
        ? '💀'
        : '🤝'
    : isAiThinking
      ? '🤖'
      : inCheck
        ? '⚡'
        : '⚔️'

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

  return (
    <div className="flex flex-col items-center justify-between w-full h-full">
      {/* Thanh điều khiển cân đối & trạng thái ván đấu */}
      <GamePlayToolbar
        onBack={onBack}
        title="Cờ Tướng"
        icon={<Shield className="size-4 text-red-400" />}
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
        activeSide={isOver ? (winnerSide === RED ? 'red' : 'black') : (pos.turn === RED ? 'red' : 'black')}
        turnLabel={`Lượt: ${pos.turn === RED ? 'Bên Đỏ (Đi trước)' : 'Bên Đen'}`}
        isAiThinking={isAiThinking}
        hideCenterTurn={true}
        rightSlot={
          <GameQuickEmote
            emotes={DANH_SACH_THAI_DO_XIANGQI}
            onSend={handleQuickEmote}
            theme="red"
            compact={true}
          />
        }
      />

      {/* Trạng thái ván gọn khi màn chưa đủ rộng cho hai cột bên bàn cờ (< 1920px): cột trạng thái bên trái chỉ vừa từ đó */}
      <div className="game-compact-status flex min-[1920px]:hidden flex-wrap items-center justify-center gap-x-2 gap-y-1 min-h-10 w-full px-3 py-2 mt-1 border-t border-white/10 text-xs font-bold shrink-0 text-center">
        <span className="text-base leading-none">{emojiTrangThai}</span>
        <span style={{ color: mauTrangThai }} className="font-black uppercase tracking-wider whitespace-nowrap">{nhanTrangThai}</span>
        {phuTrangThai && <span className="text-slate-400 font-medium break-words">{phuTrangThai}</span>}
      </div>

      {/* Khung chơi trung tâm: Cụm bên trái (Vùng 1) + Bàn cờ trung tâm + Cụm bên phải (Vùng 2 & Khay quân) */}
      <div className="relative flex items-center justify-center gap-3.5 xl:gap-5 2xl:gap-6 w-full flex-1 my-auto">
        {/* ── CỘT TRÁI: ĐỒNG HỒ SUY NGHĨ (VÙNG 3, KHÔNG CỐ ĐỊNH CHIỀU CAO) ── */}
        <div className="hidden min-[1920px]:flex flex-col items-center justify-center shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px] select-none text-center my-auto">
          <GameClockWidget
            timeRemaining={clock.timeRemaining}
            turnSeconds={clock.turnSeconds}
            isPlaying={isPlaying}
            isMyTurn={laOnline ? toiDenLuotOnline : pos.turn === playerSide}
            playerLabel={laOnline ? (benOnline === RED ? 'Bạn (Đỏ)' : 'Bạn (Đen)') : (playerSide === RED ? 'Bạn (Đỏ)' : 'Bạn (Đen)')}
            opponentLabel={laOnline ? (benOnline === RED ? 'Đối thủ (Đen)' : 'Đối thủ (Đỏ)') : (mode === 'ai' ? 'Máy AI' : 'Bên Đen')}
            isOnline={laOnline}
            opponentProposal={clock.opponentProposal}
            myPendingProposal={clock.myPendingProposal}
            onProposeTime={clock.proposeTime}
            onAcceptProposal={clock.acceptProposal}
            onRejectProposal={clock.rejectProposal}
          />
        </div>

        {/* Bàn cờ Cờ Tướng truyền thống Á Đông (9 cột × 10 hàng) - 100% hiển thị đầy đủ, không bị che */}
        <div className="game-board-shell [container-type:inline-size] w-full max-w-[572px] min-w-0 relative p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-[#e8cf9f] via-[#dcb581] to-[#c79b63] border-[5px] border-[#5a3314] shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.4)] select-none shrink flex flex-col items-center">
          {/* Khung chứa tỉ lệ chuẩn 9:10 của bàn cờ */}
          <div className="relative w-full min-h-0 shrink-0 aspect-[9/10]">
            {/* Lớp vẽ vector bàn cờ thuần tuý (10 đường ngang, 9 đường dọc, Cửu Cung, hoa thị & thư pháp sông) */}
            <XiangqiSvgBoard />

            {/* Lớp tương tác 90 điểm giao cắt và đặt quân cờ chuẩn xác */}
            <div className="absolute inset-0 grid grid-cols-9 grid-rows-10 size-full z-10">
              {Array.from({ length: 90 }, (_, idx) => {
                // Hàng 9 xuống 0 (Đỏ ở dưới: hàng 0..4, Đen ở trên: hàng 5..9); cầm quân Đen thì xoay bàn cho quân mình ở dưới
                const r = latBan ? Math.floor(idx / 9) : 9 - Math.floor(idx / 9)
                const f = latBan ? 8 - (idx % 9) : idx % 9
                const sq = r * 9 + f

                const piece = pos.board[sq]
                const isSelected = selectedSq === sq
                const isValidTarget = validTargets.includes(sq)
                const isLastMoveSq = nuocCuoi && (nuocCuoi.from === sq || nuocCuoi.to === sq)

                return (
                  <div
                    key={sq}
                    onClick={() => handleSquareClick(sq)}
                    className="relative flex items-center justify-center cursor-pointer select-none"
                  >
                    {/* Nước đi vừa thực hiện - quầng sáng vàng dịu mắt */}
                    {isLastMoveSq && !isSelected && (
                      <span className="absolute size-[86%] rounded-full bg-amber-400/25 ring-2 ring-amber-400/50 pointer-events-none z-0" />
                    )}

                    {/* Ô đang được chọn - viền hào quang cyan nổi bật */}
                    {isSelected && (
                      <span className="absolute size-[92%] rounded-full ring-4 ring-cyan-400 shadow-[0_0_12px_#22d3ee] bg-cyan-400/20 pointer-events-none z-20 animate-pulse" />
                    )}

                    {/* Quân cờ to rõ, chạm khắc tinh xảo */}
                    {piece > 0 && <XiangqiPieceToken piece={piece} />}

                    {/* Điểm gợi ý nước đi hợp lệ */}
                    {isValidTarget && (
                      <span
                        className={cn(
                          'absolute rounded-full pointer-events-none z-20 transition-all',
                          piece > 0
                            ? 'size-[90%] ring-4 ring-inset ring-emerald-500/90 shadow-[0_0_10px_#10b981]'
                            : 'size-3.5 sm:size-4 bg-emerald-500 shadow-[0_0_10px_#10b981] ring-2 ring-emerald-300'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            visible={Boolean(heroicBanner)}
            onClose={() => setHeroicBanner(null)}
          />

          {/* Bong bóng biểu cảm khi màn hình nhỏ (< 1920px) không có hai cột hai bên */}
          <div className="min-[1920px]:hidden absolute top-2 right-2 z-30 pointer-events-none">
            <GameOpponentBubble bubble={bongDoiThu} theme="red" />
          </div>
          <div className="min-[1920px]:hidden absolute bottom-2 right-2 z-30 pointer-events-none">
            <GamePlayerBubble bubble={playerBubble} theme="red" />
          </div>
        </div>

        {/* ── CỘT PHẢI: VÙNG 2 (Địch ở trên) | VÙNG 1+ (Ta ở dưới) ── */}
        <div className="hidden min-[1920px]:flex flex-col items-center justify-between shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px] h-[540px] xl:h-[570px] 2xl:h-[600px] select-none py-1">
          <GameCapturedTray
            enemyCaptured={benCuaToi === RED ? captured.friendlyLost : captured.enemyCaptured}
            friendlyCaptured={benCuaToi === RED ? captured.enemyCaptured : captured.friendlyLost}
            pawnType={SOLDIER}
            renderPiece={renderCapturedXiangqiPiece}
            topSlot={<GameOpponentBubble bubble={bongDoiThu} theme="red" />}
            bottomSlot={<GamePlayerBubble bubble={playerBubble} theme="red" />}
          />
        </div>
      </div>

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          laOnline
            ? `${tenBen(benCuaToi)} (Bạn)`
            : mode === 'ai'
              ? (playerSide === RED ? 'Bên Đỏ (Bạn)' : 'Bên Đen (Bạn)')
              : (pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen')
        }
        opponentSideName={
          laOnline && online?.mySide
            ? tenNguoiChoi(online, online.mySide === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân Đen (Máy AI)'
              : (pos.turn === RED ? 'người chơi quân Đen' : 'người chơi quân Đỏ')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          if (laOnline) {
            // Máy chủ chốt ván và báo cho cả bàn.
            online?.surrender()
            setIsSurrenderModalOpen(false)
            return
          }
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
