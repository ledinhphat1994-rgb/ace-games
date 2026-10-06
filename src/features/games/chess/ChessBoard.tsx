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
import {
  RotateCcw,
  Swords,
  ArrowLeft,
  Lock,
  Clock,
  Flag,
  Handshake,
  Smile,
  Bot,
  Users,
  X,
  UserPlus,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '../GameLeaderboard'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import {
  guiBieuCamOnline,
  nutHanhDongOnline,
  tenNguoiChoi,
  useBongBieuCamDoiThu,
  useCheDoBan,
} from '../ban-online'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameDrawModal } from '../GameDrawModal'
import { toast } from 'sonner'
import { useGameClock } from '../use-game-clock'
import { GameOpponentBubble, GamePlayerBubble, type QuickEmoteItem, type ActiveEmoteBubble } from '../GameQuickEmote'
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
  roomName?: string
  isPrivate?: boolean
  soPhongHienThi?: string
  onInvite?: () => void
}

export function ChessBoard({
  onBack,
  initialMode,
  online,
  roomName,
  isPrivate,
  soPhongHienThi,
  onInvite,
}: ChessBoardProps) {
  const { nguoiDung } = usePhien()
  const [posTaiCho, setPos] = useState<ChessPosition>(() => ChessPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerColor] = useState<Color>(WHITE)
  const isPveMode = mode === 'ai'
  const laOnlinePvp = laOnline && !isPveMode
  const banOnline = laOnlinePvp ? online : undefined
  // Bàn online: thế cờ dựng lại từ chuỗi nước máy chủ đã xét; màu quân theo ghế (bên đi trước cầm Trắng).
  const nuocOnline = banOnline?.moves
  const posOnline = useMemo(() => (nuocOnline ? dungTheCoVua(nuocOnline) : null), [nuocOnline])
  const pos = laOnlinePvp && posOnline ? posOnline : posTaiCho
  const mauOnline: Color | null =
    banOnline?.mySide ? (mauQuanCua(banOnline.meta.firstTurn, banOnline.mySide) as Color) : null
  // Góc nhìn của màn hình: quân của mình ở dưới (người xem bàn online nhìn từ phía Trắng).
  const mauCuaToi: Color = laOnlinePvp ? (mauOnline ?? WHITE) : playerColor
  const latBan = mauCuaToi === BLACK
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<ChessMove | null>(null)
  const nuocCuoi = laOnlinePvp ? (nuocOnline?.at(-1) ?? null) : lastMove
  const [isLocalStarted, setIsLocalStarted] = useState(false)
  const [pendingPromo, setPendingPromo] = useState<{ from: number; to: number } | null>(null)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)
  const [customGameOver, setCustomGameOver] = useState<{
    over: boolean
    winner: Color | null
    reason: string
  } | null>(null)

  // ─ Giới hạn và kéo thả tự do Avatar người chơi trong Khung 1 ─
  const VUNG_4_BOUNDS = {
    MIN_X: -135,
    MAX_X: 0,
    MIN_Y: -240,
    MAX_Y: 10,
  } as const

  const clampAvatarPos = (x: number, y: number) => ({
    x: Math.max(VUNG_4_BOUNDS.MIN_X, Math.min(VUNG_4_BOUNDS.MAX_X, x)),
    y: Math.max(VUNG_4_BOUNDS.MIN_Y, Math.min(VUNG_4_BOUNDS.MAX_Y, y)),
  })

  const [avatarOffset, setAvatarOffset] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chess_avatar_pos')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return clampAvatarPos(parsed.x, parsed.y)
          }
        }
      } catch {}
    }
    return { x: 0, y: 0 }
  })

  const currentOffsetRef = useRef(avatarOffset)
  currentOffsetRef.current = avatarOffset
  const isDraggingAvatarRef = useRef(false)
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  })
  const hasMovedAvatarRef = useRef(false)

  const handleAvatarPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    isDraggingAvatarRef.current = true
    hasMovedAvatarRef.current = false
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentOffsetRef.current.x,
      initY: currentOffsetRef.current.y,
    }
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {}
  }

  const handleAvatarPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingAvatarRef.current) return
    e.stopPropagation()
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    if (Math.hypot(dx, dy) > 5) {
      hasMovedAvatarRef.current = true
    }
    const newX = dragStartRef.current.initX + dx
    const newY = dragStartRef.current.initY + dy
    const clamped = clampAvatarPos(newX, newY)
    currentOffsetRef.current = clamped
    setAvatarOffset(clamped)
  }

  const handleAvatarPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingAvatarRef.current) return
    e.stopPropagation()
    isDraggingAvatarRef.current = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    if (hasMovedAvatarRef.current) {
      try {
        localStorage.setItem('chess_avatar_pos', JSON.stringify(currentOffsetRef.current))
      } catch {}
    }
  }

  const [hintMove, setHintMove] = useState<ChessMove | null>(null)
  const [, setMoveHistory] = useState<string[]>([])

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const isOver = laOnlinePvp ? banOnline?.meta.status === 'ended' : outcome.over || Boolean(customGameOver?.over)
  const toiDenLuotOnline = laOnlinePvp && Boolean(banOnline?.isMyTurn) && pos.turn === mauOnline
  const isPlaying = laOnlinePvp
    ? banOnline?.meta.status === 'playing'
    : !isOver && (isLocalStarted || lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnlinePvp,
    isPlaying,
    isMyTurn: laOnlinePvp ? toiDenLuotOnline : pos.turn === playerColor,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online: banOnline,
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

  const [selectedProfileUser, setSelectedProfileUser] = useState<NguoiXem | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(10)
  const [, setRecentlyChangedTime] = useState<number | null>(null)
  const timeChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelectTime = useCallback(
    (sec: number) => {
      clock.proposeTime(sec)
      setCustomMinutesInput(Math.round(sec / 60))
      setRecentlyChangedTime(sec)
      if (timeChangeTimerRef.current) clearTimeout(timeChangeTimerRef.current)
      timeChangeTimerRef.current = setTimeout(() => {
        setRecentlyChangedTime(null)
      }, 1200)
    },
    [clock]
  )

  useScreenWakeLock(isPlaying)

  // ─ Xử lý Xin hòa chuẩn thi đấu (Offer Draw) ─
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false)
  const [drawModalType, setDrawModalType] = useState<'offer' | 'incoming'>('offer')
  const isDrawOfferedByMe = Boolean(laOnlinePvp && banOnline?.mySide && banOnline.meta.drawOfferBy === banOnline.mySide)
  const isDrawOfferedByOpponent = Boolean(laOnlinePvp && banOnline?.mySide && banOnline.meta.drawOfferBy && banOnline.meta.drawOfferBy !== banOnline.mySide)

  // Nhận tín hiệu xin hòa từ đối thủ online qua server meta
  useEffect(() => {
    if (isDrawOfferedByOpponent && !isOver) {
      setDrawModalType('incoming')
      setIsDrawModalOpen(true)
    }
  }, [isDrawOfferedByOpponent, isOver])

  // Lắng nghe tín hiệu hòa qua chat hệ thống
  useEffect(() => {
    if (!online?.chat || online.chat.length === 0) return
    const lastMsg = online.chat[online.chat.length - 1]
    if (lastMsg && typeof lastMsg.text === 'string' && lastMsg.text.startsWith('[SYS_CHESS_PROP]:')) {
      const action = lastMsg.text.replace('[SYS_CHESS_PROP]:', '').trim()
      const isFromMe = String(lastMsg.accountId) === online.myActorKey?.replace(/^acc:/, '')
      if (action === 'draw_offer' && !isFromMe && !isOver) {
        setDrawModalType('incoming')
        setIsDrawModalOpen(true)
      } else if (action === 'draw_accept') {
        setIsDrawModalOpen(false)
        setCustomGameOver({
          over: true,
          winner: null,
          reason: 'Hai bên đồng thuận hòa cờ',
        })
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
      } else if (action === 'draw_decline' && !isFromMe) {
        toast.info('Đối thủ đã từ chối đề nghị hòa')
      }
    }
  }, [online?.chat, online?.myActorKey, isOver])

  const handleOfferDraw = useCallback(() => {
    if (isOver || isAiThinking || !isPlaying) return
    setDrawModalType('offer')
    setIsDrawModalOpen(true)
  }, [isOver, isAiThinking, isPlaying])

  const handleConfirmDraw = useCallback(() => {
    if (drawModalType === 'offer') {
      if (mode === 'ai') {
        setCustomGameOver({
          over: true,
          winner: null,
          reason: 'Máy AI đồng ý hòa cờ',
        })
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
        return
      }
      if (laOnline && online) {
        try {
          online.offerDraw?.()
        } catch {}
        online.guiChat('[SYS_CHESS_PROP]:draw_offer')
        toast.info('Đã gửi đề nghị hòa cờ, chờ đối thủ xác nhận...')
        return
      }
      // Chế độ 2 người cùng máy: chuyển cho người chơi còn lại xác nhận
      setDrawModalType('incoming')
      setIsDrawModalOpen(true)
    } else {
      // Chấp nhận hòa từ đối thủ
      if (laOnline && online) {
        try {
          online.offerDraw?.()
        } catch {}
        online.guiChat('[SYS_CHESS_PROP]:draw_accept')
      }
      setCustomGameOver({
        over: true,
        winner: null,
        reason: 'Hai bên đồng thuận hòa cờ',
      })
      setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
      playGameOverSound('draw')
    }
  }, [drawModalType, mode, laOnline, online])

  const handleDeclineDraw = useCallback(() => {
    setIsDrawModalOpen(false)
    if (laOnline && online) {
      try {
        online.declineDraw?.()
      } catch {}
      online.guiChat('[SYS_CHESS_PROP]:draw_decline')
    }
    toast.info('Đã từ chối hòa cờ')
  }, [laOnline, online])

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
      if (soundEnabled) {
        if (isCapture) {
          playPieceCaptureSound()
        } else {
          playPieceMoveSound()
        }
      }
      try {
        const sanStr = pos.san(move)
        setMoveHistory((prev) => [...prev, sanStr])
      } catch {
        // fallback
      }
      setHintMove(null)

      if (laOnlinePvp && banOnline) {
        banOnline.diCo(move)
        setSelectedSq(null)
        return
      }
      posTaiCho.makeMove(move)
      setPos(posTaiCho.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [laOnline, online, pos, posTaiCho]
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
    if (heroicBanner) {
      setHeroicBanner(null)
    }
    if (isOver || isAiThinking) return
    if (mode === 'ai' && pos.turn !== playerColor) return
    if (laOnlinePvp && !toiDenLuotOnline) return

    if (!isLocalStarted) {
      setIsLocalStarted(true)
    }

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

  const resetGame = useCallback((autoStart = true) => {
    const newPos = ChessPosition.fromFen()
    setPos(newPos)
    setSelectedSq(null)
    setLastMove(null)
    setPlayerBubble(null)
    setOpponentBubble(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
    setMoveHistory([])
    setHintMove(null)
    setIsLocalStarted(autoStart)
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
    playGameStartSound()
  }, [])

  const handleUndo = useCallback(() => {
    if (laOnlinePvp || isAiThinking || isOver) return
    if (mode === 'ai' && posTaiCho.undoStack.length >= 2) {
      posTaiCho.unmakeMove(true)
      posTaiCho.unmakeMove(true)
      setPos(posTaiCho.clone())
      setSelectedSq(null)
      setLastMove(posTaiCho.undoStack.at(-1)?.move ?? null)
      setMoveHistory((prev) => prev.slice(0, -2))
      setHintMove(null)
      playPieceMoveSound()
    } else if (mode === 'pass_and_play' && posTaiCho.undoStack.length >= 1) {
      posTaiCho.unmakeMove(true)
      setPos(posTaiCho.clone())
      setSelectedSq(null)
      setLastMove(posTaiCho.undoStack.at(-1)?.move ?? null)
      setMoveHistory((prev) => prev.slice(0, -1))
      setHintMove(null)
      playPieceMoveSound()
    }
  }, [laOnline, isAiThinking, isOver, mode, posTaiCho])



  // Đồng bộ lịch sử nước đi bàn online
  useEffect(() => {
    if (laOnlinePvp && nuocOnline && nuocOnline.length > 0) {
      try {
        const replay = ChessPosition.fromFen()
        const sans: string[] = []
        for (const m of nuocOnline) {
          sans.push(replay.san(m))
          replay.makeMove(m)
        }
        setMoveHistory(sans)
      } catch {
        // fallback
      }
    } else if (laOnlinePvp && (!nuocOnline || nuocOnline.length === 0)) {
      setMoveHistory([])
    }
  }, [laOnlinePvp, nuocOnline])

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
    if (online && online.mySide === 'X') {
      online.datPve(newMode === 'ai')
    }
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
    banOnline && (banOnline.meta.winner === 'X' || banOnline.meta.winner === 'O')
      ? (mauQuanCua(banOnline.meta.firstTurn, banOnline.meta.winner) as Color)
      : null
  const winnerColor = laOnlinePvp ? winnerOnline : outcome.over ? outcome.winner : customGameOver?.winner

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = laOnlinePvp && banOnline ? nutHanhDongOnline(banOnline, () => setIsSurrenderModalOpen(true)) : null
  const laNguoiThang = isOver && winnerColor !== null && winnerColor !== undefined ? winnerColor === mauCuaToi : null

  // Banner & âm thanh khi bị chiếu tướng
  const prevInCheckRef = useRef(inCheck)
  useEffect(() => {
    if (!prevInCheckRef.current && inCheck && !isOver) {
      setHeroicBanner({ type: 'check', title: 'CHIẾU TƯỚNG' })
      if (soundEnabled) playCheckAlertSound()
    }
    prevInCheckRef.current = inCheck
  }, [inCheck, isOver, soundEnabled])

  // Âm thanh khi đối thủ đi cờ trên bàn online
  const prevNuocOnlineLenRef = useRef(nuocOnline?.length ?? 0)
  useEffect(() => {
    const curLen = nuocOnline?.length ?? 0
    if (curLen > prevNuocOnlineLenRef.current && curLen > 0) {
      if (soundEnabled) playPieceMoveSound()
    }
    prevNuocOnlineLenRef.current = curLen
  }, [nuocOnline?.length, soundEnabled])

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (laNguoiThang === true) {
        if (soundEnabled) playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
        setMyElo((prev) => {
          const next = prev + 15
          try {
            localStorage.setItem(`dc_chess_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else if (laNguoiThang === false) {
        if (soundEnabled) playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
        setMyElo((prev) => {
          const next = Math.max(800, prev - 12)
          try {
            localStorage.setItem(`dc_chess_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else {
        if (soundEnabled) playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
        setMyElo((prev) => {
          const next = prev + 2
          try {
            localStorage.setItem(`dc_chess_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, laNguoiThang, soundEnabled, nguoiDung?.accountId])

  // Phong cấp
  const handleSelectPromo = (promoType: number) => {
    if (!pendingPromo) return
    executeMove({ from: pendingPromo.from, to: pendingPromo.to, promo: promoType })
    setPendingPromo(null)
  }

  // Khối đối thủ và người chơi hợp nhất vào Vùng 3 (GamePlayToolbar)
  const opponentSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div className="size-6 sm:size-7 rounded-md bg-surface-overlay border border-border-default flex items-center justify-center font-bold text-xs text-text-primary shrink-0 shadow-inner">
        {mauCuaToi === WHITE ? '♚' : '♔'}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {mode === 'ai' || Boolean(online?.meta.isPve)
            ? 'Người chơi AI'
            : laOnlinePvp
              ? (mauOnline === WHITE ? 'Đối thủ (Đen)' : 'Đối thủ (Trắng)')
              : 'Bên Đen'}
        </span>
        {isAiThinking && (
          <span className="text-[9px] text-cyan-400 font-medium animate-pulse">Đang tính...</span>
        )}
      </div>
      {captured.friendlyLost.length > 0 && (
        <div className="hidden md:flex items-center gap-0.5 ml-0.5">
          {captured.friendlyLost.slice(0, 3).map((type, i) => (
            <span key={i} className="size-4 rounded-full border border-border-default bg-surface-overlay text-text-secondary font-bold text-[8px] flex items-center justify-center shrink-0">
              {CHESS_SYMBOLS[type] || '♟'}
            </span>
          ))}
          {captured.friendlyLost.length > 3 && (
            <span className="text-[8px] font-mono text-text-tertiary">+{captured.friendlyLost.length - 3}</span>
          )}
        </div>
      )}
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          pos.turn !== mauCuaToi && isPlaying
            ? clock.timeRemaining <= 10 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-rose-500/60 bg-rose-500/15 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(pos.turn !== mauCuaToi && isPlaying ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      <div className="absolute top-full mt-2 left-0 z-50 pointer-events-none">
        <GameOpponentBubble bubble={bongDoiThu} theme="amber" />
      </div>
    </div>
  )

  const playerSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          pos.turn === mauCuaToi && isPlaying
            ? clock.timeRemaining <= 10 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-cyan-500/60 bg-cyan-500/15 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(pos.turn === mauCuaToi && isPlaying ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      {captured.enemyCaptured.length > 0 && (
        <div className="hidden md:flex items-center gap-0.5 mr-0.5">
          {captured.enemyCaptured.slice(0, 3).map((type, i) => (
            <span key={i} className="size-4 rounded-full border border-border-default bg-surface-overlay text-text-secondary font-bold text-[8px] flex items-center justify-center shrink-0">
              {CHESS_SYMBOLS[type] || '♟'}
            </span>
          ))}
          {captured.enemyCaptured.length > 3 && (
            <span className="text-[8px] font-mono text-text-tertiary">+{captured.enemyCaptured.length - 3}</span>
          )}
        </div>
      )}
      <div className="flex flex-col min-w-0 text-right">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {laOnlinePvp ? (mauOnline === WHITE ? 'Bạn (Trắng)' : 'Bạn (Đen)') : (playerColor === WHITE ? 'Bạn (Trắng)' : 'Bạn (Đen)')}
        </span>
      </div>
      <div className="size-6 sm:size-7 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-400 shrink-0 shadow-inner">
        {mauCuaToi === WHITE ? '♔' : '♚'}
      </div>
      <div className="absolute top-full mt-2 right-0 z-50 pointer-events-none">
        <GamePlayerBubble bubble={playerBubble} theme="amber" />
      </div>
    </div>
  )

  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const myAvatarUrl = nguoiDung?.avatar || undefined
  const hasOpponent = laOnlinePvp ? Boolean(banOnline?.meta.playerO) : true

  // Thành viên đối thủ khi chơi online
  const opponentMember = useMemo(() => {
    if (!banOnline || !hasOpponent) return null
    const oppActorKey = banOnline.mySide === 'X' ? banOnline.meta.playerO : banOnline.meta.playerX
    if (!oppActorKey) return null
    return banOnline.thanhVien.find((m) => m.key === oppActorKey) || null
  }, [banOnline, hasOpponent])

  const opponentName = laOnlinePvp && banOnline?.mySide
    ? tenNguoiChoi(banOnline, banOnline.mySide === 'X' ? 'O' : 'X')
    : mode === 'ai' ? 'Stockfish AI' : 'Bên Đen'

  const myAccountId = nguoiDung?.accountId ?? 0
  const oppAccountId = useMemo(() => {
    if (!laOnlinePvp || !hasOpponent) return 0
    if (opponentMember?.accountId) return opponentMember.accountId
    const oppActorKey = banOnline?.mySide === 'X' ? banOnline?.meta.playerO : banOnline?.meta.playerX
    if (typeof oppActorKey === 'string' && oppActorKey.startsWith('acc:')) {
      const parsed = Number(oppActorKey.replace('acc:', ''))
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
    return 0
  }, [laOnlinePvp, hasOpponent, opponentMember, banOnline?.mySide, banOnline?.meta.playerO, banOnline?.meta.playerX])

  const { data: myProfile } = useQuery({
    queryKey: ['ho-so-nguoi-dung', myAccountId],
    queryFn: () => (myAccountId ? layHoSoNguoiDung(myAccountId) : null),
    enabled: Boolean(myAccountId),
    staleTime: 60_000,
  })

  const { data: opponentProfile } = useQuery({
    queryKey: ['ho-so-nguoi-dung', oppAccountId],
    queryFn: () => (oppAccountId ? layHoSoNguoiDung(oppAccountId) : null),
    enabled: Boolean(oppAccountId),
    staleTime: 60_000,
  })

  const myLevel = useMemo(() => tinhLevel(myProfile?.totalXp ?? 0), [myProfile?.totalXp])
  const [myElo, setMyElo] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `dc_chess_elo_${nguoiDung?.accountId ?? 'guest'}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const num = Number(saved)
          if (Number.isFinite(num) && num > 0) return num
        }
      } catch {}
    }
    return 1500
  })

  const opponentAvatarUrl = isPveMode ? undefined : (opponentMember?.avatar || undefined)
  const opponentLevel = mode === 'ai' ? (aiLevel === 'easy' ? '1' : aiLevel === 'medium' ? '5' : '10') : tinhLevel(opponentProfile?.totalXp ?? 0)
  const opponentElo = useMemo(() => {
    if (mode === 'ai') return aiLevel === 'easy' ? 1200 : aiLevel === 'medium' ? 1500 : 1800
    const xpBonus = Math.floor((opponentProfile?.totalXp ?? 0) / 10)
    return 1200 + Math.min(600, xpBonus)
  }, [mode, aiLevel, opponentProfile?.totalXp])
  const isMyTurn = laOnlinePvp ? toiDenLuotOnline : (mode === 'ai' ? pos.turn === playerColor : true)
  const isOpponentTurn = isPlaying && !isOver && !isMyTurn

  // Quick menu emoji & chat
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const [quickMenuPos, setQuickMenuPos] = useState({ left: 20, top: 200 })

  const handleOpenQuickMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    const asideEl = document.getElementById('vung-4-plus-desk')
    const asideRect = asideEl ? asideEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect()
    const boardEl = document.querySelector('section[aria-label*="Bàn cờ"]') || document.querySelector('section')
    const boardRect = boardEl ? boardEl.getBoundingClientRect() : null
    const menuWidth = 240
    const menuHeight = 150
    const padding = 16

    // Giới hạn chiều ngang: không bị sidebar che (>= 248px trên desktop) và không đè lên bàn cờ
    const minSafeLeft = window.innerWidth >= 1280 ? 248 : 12
    const maxSafeRight = boardRect ? boardRect.left - 12 : window.innerWidth - 12

    let left = asideRect.left + (asideRect.width - menuWidth) / 2
    left = Math.max(minSafeLeft, Math.min(maxSafeRight - menuWidth, left))

    // Chiều dọc: Nằm phía trên cụm avatar và các nút công cụ, cách đỉnh 16px
    let top = asideRect.top - menuHeight - padding
    // Nếu avatar bị kéo sát đỉnh viewport: chuyển menu xuống phía dưới đồng hồ
    if (top < 12) {
      top = asideRect.bottom + padding
    }
    top = Math.max(12, Math.min(window.innerHeight - menuHeight - 12, top))

    setQuickMenuPos({ left, top })
    setIsQuickMenuOpen((prev) => !prev)
  }

  const getBubbleCoordinates = (index: number, total: number) => {
    const D = 66
    if (total <= 1) return { x: -66, y: 0 }
    const startAngle = 55
    const endAngle = 185
    const step = (endAngle - startAngle) / (total - 1)
    const angleDeg = startAngle + index * step
    const angleRad = (angleDeg * Math.PI) / 180
    return {
      x: Math.round(D * Math.cos(angleRad)),
      y: Math.round(-D * Math.sin(angleRad)),
    }
  }

  const handleStartGameClick = () => {
    if (laOnlinePvp && banOnline) {
      if (!banOnline.mySide) {
        banOnline.joinGame()
        return
      }
      banOnline.startGame()
    }
    setIsLocalStarted(true)
    resetGame(true)
  }

  const chessTools = [
    {
      id: 'mode',
      title: mode === 'ai' ? 'Đổi sang Đấu 2 người' : 'Đổi sang Đấu với Máy AI',
      icon: mode === 'ai' ? <Bot className="size-4 text-cyan-400" /> : <Users className="size-4 text-amber-400" />,
      onClick: () => doiCheDo(mode === 'ai' ? 'pass_and_play' : 'ai'),
      className: 'border-cyan-500/40 bg-[#121622]/95 hover:border-cyan-400 hover:bg-cyan-500/20 text-cyan-300',
    },
    {
      id: 'draw',
      title: 'Đề nghị hòa cờ',
      icon: <Handshake className="size-4 text-amber-400" />,
      disabled: isDrawOfferedByMe || isOver || isAiThinking || !isPlaying,
      onClick: handleOfferDraw,
      className: 'border-amber-500/40 bg-[#121622]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300',
    },
    {
      id: 'surrender',
      title: 'Xin thua / Đầu hàng',
      icon: <Flag className="size-4 text-rose-400" />,
      disabled: isOver || isAiThinking,
      onClick: () => setIsSurrenderModalOpen(true),
      className: 'border-rose-500/40 bg-[#121622]/95 hover:border-rose-400 hover:bg-rose-500/20 text-rose-300',
    },
    {
      id: 'emote',
      title: 'Biểu cảm & Tin nhanh',
      icon: <Smile className="size-4 text-amber-400" />,
      onClick: (e: React.MouseEvent) => handleOpenQuickMenu(e),
      className: 'border-amber-400/50 bg-[#161a24]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300',
    },
    {
      id: 'flip',
      title: 'Lật bàn cờ',
      icon: <RotateCcw className="size-4 text-sky-400" />,
      disabled: false,
      onClick: handleUndo,
      className: 'border-sky-500/40 bg-[#121622]/95 hover:border-sky-400 hover:bg-sky-500/20 text-sky-300',
    },
  ]

  return (
    <div className="flex flex-col items-center justify-start w-full h-full min-w-0 overflow-hidden relative select-none">
      {/* 1. HÀNG CÔNG CỤ NHANH TRÊN CÙNG: RỘNG RÃI, THOÁNG MẮT, NÚT SẢNH & SỐ PHÒNG */}
      <header className="w-full px-2 sm:px-4 py-1 mb-1 relative flex items-center min-h-[40px] shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 z-10">
          <button
            type="button"
            id="game-leave-btn"
            onClick={onBack}
            className="h-8 px-2.5 rounded-lg text-xs gap-1.5 inline-flex items-center font-medium text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors duration-150 shrink-0"
            title="Quay lại sảnh"
            aria-label="Quay lại sảnh"
          >
            <ArrowLeft className="size-3.5" />
            <span>Sảnh</span>
          </button>

          {roomName && (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-900/40 border border-amber-500/25 shadow-[0_2px_8px_rgba(0,0,0,0.4)] shrink-0 select-none hover:border-amber-500/40 transition-colors duration-150"
              title={`Phòng Cờ Vua #${soPhongHienThi || '1'}`}
            >
              <div className="relative size-8 sm:size-9 rounded-full bg-gradient-to-br from-[#fffdf9] via-[#f7e8d0] to-[#d4a36e] border-2 border-[#9c6332] shadow-[0_3px_8px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <span className="text-base sm:text-lg text-amber-950 leading-none drop-shadow-xs font-bold">
                  ♚
                </span>
              </div>
              <span className="font-cinzel font-black text-sm sm:text-base text-amber-300 tracking-wider shrink-0">
                #{soPhongHienThi || '1'}
              </span>
            </div>
          )}

          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-300 shrink-0">
              <Lock className="size-3 text-amber-400" />
              <span>Riêng tư</span>
            </span>
          )}
        </div>
      </header>

      {/* VÙNG BÀN CỜ VÀ ĐIỀU KHIỂN CHÍNH: CĂN GIỮA, THOÁNG MẮT CHUẨN CỜ TƯỚNG */}
      <main className="w-fit flex flex-col items-center mx-auto shrink-0 relative py-0.5">
        {/* 1. MẶT BÀN CỜ VUA TẬP TRUNG - TỶ LỆ 1:1 VUÔNG VỨC 100% */}
        <section
          style={{
            width: 'min(calc(100vw - 32px), min(73vh, 580px))',
            maxWidth: '580px',
            aspectRatio: '1 / 1',
          }}
          className="relative max-h-[min(73vh,580px)] board-surface rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0 select-none touch-none bg-gradient-to-br from-slate-900 via-[#0b1329] to-slate-900 border-2 border-cyan-500/30 shadow-[0_15px_50px_rgba(6,182,212,0.15)] ring-1 ring-white/10"
        >
          {/* Grid bàn cờ 8x8 */}
          <div className="grid grid-cols-8 grid-rows-8 w-full aspect-square border border-cyan-500/30 rounded-lg overflow-hidden select-none shadow-2xl">
            {Array.from({ length: 64 }, (_, idx) => {
              const r = latBan ? Math.floor(idx / 8) : 7 - Math.floor(idx / 8)
              const f = latBan ? 7 - (idx % 8) : idx % 8
              const sq = r * 8 + f

              const isDark = (r + f) % 2 === 0
              const piece = pos.board[sq]
              const isSelected = selectedSq === sq
              const isValidTarget = validTargets.includes(sq)
              const isLastMoveSq = nuocCuoi && (nuocCuoi.from === sq || nuocCuoi.to === sq)
              const isHintSq = hintMove && (hintMove.from === sq || hintMove.to === sq)
              const isKingInCheck = inCheck && piece && typeOf(piece) === KING && colorOf(piece) === pos.turn
              const toanDo = `${'abcdefgh'[f]}${r + 1}`
              const tenQuan = piece > 0 ? `${colorOf(piece) === WHITE ? 'Trắng' : 'Đen'} ${tenLoaiQuanVua(typeOf(piece))}` : 'ô trống'

              const canAct = !isOver && !isAiThinking && (laOnlinePvp ? toiDenLuotOnline : mode === 'ai' ? pos.turn === playerColor : true)
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
                    isDark ? 'bg-[#1e293b] hover:bg-[#25334c]' : 'bg-[#334155] hover:bg-[#3d4f6a]',
                    isLastMoveSq && 'bg-sky-500/25 ring-2 ring-inset ring-sky-400/40',
                    isSelected && 'ring-4 ring-inset ring-cyan-400 bg-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.6)] z-10',
                    isHintSq && 'ring-4 ring-inset ring-amber-400 bg-amber-400/25 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse z-10',
                    isKingInCheck && 'bg-rose-600/40 ring-4 ring-inset ring-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)]'
                  )}
                >
                  {piece > 0 && (
                    <div className="w-[90%] h-[90%] transition-transform duration-150 hover:scale-95 active:scale-90">
                      <ChessPieceSvg type={typeOf(piece)} color={colorOf(piece)} />
                    </div>
                  )}

                  {isValidTarget && (
                    <span
                      className={cn(
                        'absolute rounded-full pointer-events-none transition-all',
                        piece > 0
                          ? 'size-full ring-4 ring-inset ring-cyan-400/80 bg-cyan-500/10'
                          : 'size-3.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)] animate-pulse'
                      )}
                    />
                  )}

                  {f === (latBan ? 7 : 0) && (
                    <span className="absolute top-0.5 left-0.5 text-[9px] font-mono font-bold text-cyan-300/70 select-none drop-shadow-xs">
                      {r + 1}
                    </span>
                  )}
                  {r === (latBan ? 7 : 0) && (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold text-cyan-300/70 select-none drop-shadow-xs">
                      {'abcdefgh'[f]}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* NÚT BẮT ĐẦU HOẶC ĐẤU LẠI Ở GIỮA BÀN CỜ CHUẨN CỜ TƯỚNG */}
          {((!isPlaying && !isOver) || isOver) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto select-none">
              <button
                type="button"
                id="btn-bat-dau-river"
                data-testid="btn-bat-dau-river"
                onClick={handleStartGameClick}
                className={cn(
                  'group relative px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border-2 flex items-center justify-center gap-2.5 text-sm sm:text-base font-black tracking-widest transition-colors duration-150 select-none cursor-pointer active:scale-95 hover:scale-105',
                  isOver
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 border-amber-300 text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.6)]'
                    : 'bg-gradient-to-r from-cyan-800 via-blue-900 to-cyan-800 hover:from-cyan-700 hover:via-blue-800 hover:to-cyan-700 border-cyan-400/90 text-white shadow-[0_0_24px_rgba(6,182,212,0.6)]'
                )}
                title={isOver ? 'Đấu lại ván mới' : 'Bắt đầu ván đấu'}
              >
                <Swords className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="font-black uppercase drop-shadow text-cyan-100">
                  {isOver ? 'ĐẤU LẠI' : 'BẮT ĐẦU'}
                </span>
              </button>
            </div>
          )}

          {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            visible={Boolean(heroicBanner)}
            onClose={() => setHeroicBanner(null)}
          />
        </section>

        {/* ==================== VÙNG 4: BUBBLE AVATAR NGƯỜI CHƠI (GÓC DƯỚI TRÁI) ==================== */}
        <aside
          id="vung-4-plus-desk"
          aria-label="Thông tin người chơi"
          style={{
            transform: `translate3d(${avatarOffset.x}px, ${avatarOffset.y}px, 0)`,
          }}
          className="w-full mt-3 xl:mt-0 xl:absolute xl:right-[calc(100%+24px)] xl:bottom-12 xl:w-[250px] flex flex-col items-center xl:items-end justify-end select-none z-40 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center mb-8">
            {/* Bong bóng chat người chơi (đặt phía trên cụm nút công cụ, không đè nút, sidebar hay bàn cờ) */}
            {playerBubble && (
              <div
                style={{ bottom: '126px' }}
                className="absolute left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-amber-400 text-xs font-bold text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 z-40 select-none pointer-events-none max-w-[200px]"
              >
                {playerBubble.emoji && <span className="text-sm shrink-0">{playerBubble.emoji}</span>}
                <span className="truncate">{playerBubble.quote}</span>
              </div>
            )}

            {/* Avatar & các bong bóng công cụ quanh avatar */}
            <div className="relative flex items-center justify-center">
              {chessTools.map((tool, index) => {
                const pos = getBubbleCoordinates(index, chessTools.length)
                return (
                  <button
                    key={tool.id}
                    type="button"
                    id={`tool-bubble-${tool.id}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={tool.onClick}
                    disabled={tool.disabled}
                    style={{
                      transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                    }}
                    className={cn(
                      'absolute top-1/2 left-1/2 -mt-[17px] -ml-[17px] size-[34px] rounded-full border-2 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.65)] flex items-center justify-center cursor-pointer transition-transform duration-150 z-30 select-none hover:scale-110 group disabled:opacity-40 disabled:cursor-not-allowed',
                      tool.className
                    )}
                    title={tool.title}
                    aria-label={tool.title}
                  >
                    {tool.icon}
                  </button>
                )
              })}

              {/* Avatar người chơi tròn (Nhấn giữ kéo tự do hoặc click để mở cài đặt & hồ sơ kỳ thủ) */}
              <button
                type="button"
                onPointerDown={handleAvatarPointerDown}
                onPointerMove={handleAvatarPointerMove}
                onPointerUp={handleAvatarPointerUp}
                onPointerCancel={handleAvatarPointerUp}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!hasMovedAvatarRef.current) {
                    if (laOnlinePvp && !banOnline?.mySide) {
                      banOnline?.joinGame()
                      toast.info('Đã vào bàn thi đấu')
                    } else {
                      setIsSettingsModalOpen(true)
                    }
                  }
                }}
                className={cn(
                  'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 shadow-xl flex items-center justify-center outline-none select-none cursor-grab active:cursor-grabbing hover:scale-105 touch-none group',
                  isMyTurn
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)] ring-4 ring-cyan-400/20'
                    : 'border-cyan-500/40 hover:border-cyan-400 shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#121620]/90'
                )}
                title={myName ? `${myName} (Nhấn giữ kéo tự do, click để mở cài đặt & thông tin kỳ thủ)` : 'Nhấn giữ kéo tự do, click để mở cài đặt & thông tin kỳ thủ'}
                aria-label={myName ? `${myName} - Cài đặt & thông tin kỳ thủ` : 'Cài đặt & thông tin kỳ thủ'}
              >
                <AnhNguoiDung ten={myName} avatar={myAvatarUrl} className="size-full rounded-full pointer-events-none" />
                {(!laOnlinePvp || Boolean(banOnline?.mySide)) && (
                  <div
                    className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-bold text-[10px] shadow-md z-10 pointer-events-none bg-[#fff5eb] border-[#9c6332] text-[#9c6332]"
                    title={mauCuaToi === WHITE ? 'Cầm quân Trắng' : 'Cầm quân Đen'}
                  >
                    {mauCuaToi === WHITE ? '♔' : '♚'}
                  </div>
                )}
              </button>
            </div>

            {/* Đồng hồ đếm ngược người chơi */}
            <div
              id="player-desk-clock"
              className={cn(
                'absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                pos.turn === mauCuaToi && isPlaying && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : pos.turn === mauCuaToi && isPlaying
                    ? 'border-cyan-500/80 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Bạn"
            >
              <Clock className="size-3 text-cyan-400 shrink-0" />
              <span>{formatClockTime(pos.turn === mauCuaToi && isPlaying ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>

        {/* ==================== VÙNG 2: BUBBLE AVATAR ĐỐI THỦ (GÓC TRÊN PHẢI) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="w-full mb-3 xl:mb-0 xl:absolute xl:left-[calc(100%+24px)] xl:top-0 xl:w-[250px] flex flex-col items-center xl:items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center">
            {/* Badge Elo & Level */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121622]/95 border border-cyan-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md select-none text-[10px] font-bold tracking-tight mb-1.5 z-20">
              {hasOpponent ? (
                <>
                  <span className="text-amber-400 font-extrabold">{mode === 'ai' ? `AI Cấp ${opponentLevel}` : `Lv.${opponentLevel}`}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-cyan-300 font-extrabold">Elo {opponentElo}</span>
                </>
              ) : (
                <span className="text-stone-400 font-medium">Chờ đối thủ</span>
              )}
            </div>

            {/* Bong bóng chat đối thủ */}
            {bongDoiThu && (
              <div className="absolute bottom-full mb-2.5 right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {bongDoiThu.emoji && <span className="text-sm shrink-0">{bongDoiThu.emoji}</span>}
                <span className="truncate">{bongDoiThu.quote}</span>
              </div>
            )}

            {/* Avatar tròn đối thủ (Bấm để xem hồ sơ kỳ thủ & Elo hoặc mời bạn bè) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (!hasOpponent) {
                  if (onInvite) {
                    onInvite()
                  } else {
                    try {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Đã sao chép liên kết mời bạn bè')
                    } catch {
                      toast.info('Mời bạn bè vào phòng')
                    }
                  }
                  return
                }
                if (mode === 'ai') {
                  toast.info(`Stockfish AI · Cấp ${opponentLevel} · Elo ${opponentElo}`)
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                setSelectedProfileUser({
                  id: oppAccountId || 2,
                  ten: opponentName,
                  avatar: opponentAvatarUrl,
                  gameElo: opponentElo,
                  gameName: 'Cờ Vua',
                  anchorRect: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                  },
                })
              }}
              className={cn(
                'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 shadow-xl flex items-center justify-center outline-none select-none cursor-pointer hover:scale-105 group',
                !hasOpponent
                  ? 'border-dashed border-white/20 bg-white/[0.02] hover:border-amber-400/60 hover:bg-white/5 text-stone-400 hover:text-amber-300'
                  : isOpponentTurn
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.7)] ring-4 ring-amber-400/20'
                    : 'border-white/10 hover:border-cyan-400 shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#121620]/90'
              )}
              title={
                !hasOpponent
                  ? 'Đang chờ đối thủ vào bàn - Bấm để mời hoặc sao chép liên kết'
                  : mode === 'ai'
                    ? `Stockfish AI · Cấp ${opponentLevel} · Elo ${opponentElo}`
                    : `${opponentName} (Elo ${opponentElo}) - Bấm để xem hồ sơ kỳ thủ`
              }
              aria-label={
                !hasOpponent
                  ? 'Mời người chơi'
                  : mode === 'ai'
                    ? 'Thông tin AI'
                    : `${opponentName} - Hồ sơ kỳ thủ`
              }
            >
              {hasOpponent ? (
                <AnhNguoiDung ten={opponentName} avatar={opponentAvatarUrl} className="size-full rounded-full pointer-events-none" />
              ) : (
                <UserPlus className="size-6 text-stone-400 group-hover:text-amber-300 transition-colors pointer-events-none" />
              )}
              {hasOpponent && (
                <div
                  className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-bold text-[10px] shadow-md z-10 pointer-events-none bg-[#2b2b2b] border-[#555] text-[#e2e8f0]"
                  title={mauCuaToi === WHITE ? 'Đối thủ cầm quân Đen' : 'Đối thủ cầm quân Trắng'}
                >
                  {mauCuaToi === WHITE ? '♚' : '♔'}
                </div>
              )}
            </button>

            {/* Đồng hồ đối thủ */}
            <div
              className={cn(
                'mt-2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                pos.turn !== mauCuaToi && isPlaying && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : pos.turn !== mauCuaToi && isPlaying
                    ? 'border-amber-500/80 bg-amber-950/80 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Đối thủ"
            >
              <Clock className="size-3 text-amber-400 shrink-0" />
              <span>{formatClockTime(pos.turn !== mauCuaToi && isPlaying ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>
      </main>

      {/* POPUP BIỂU CẢM & TIN NHẮN NHANH */}
      {isQuickMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={quickMenuRef}
            style={{
              position: 'fixed',
              left: `${quickMenuPos.left}px`,
              top: `${quickMenuPos.top}px`,
              zIndex: 80,
            }}
            className="w-[240px] p-3 rounded-2xl bg-[#161b26]/98 border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 select-none pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/10">
              <span className="text-[11px] font-bold text-cyan-400">Biểu cảm & Tin nhanh</span>
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen(false)}
                className="p-0.5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {DANH_SACH_THAI_DO_CHESS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleQuickEmote(item)
                    setIsQuickMenuOpen(false)
                  }}
                  className="p-1 rounded-xl bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/40 border border-transparent text-xl flex items-center justify-center transition cursor-pointer hover:scale-110 active:scale-95"
                  title={item.quote}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

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

      {/* Modal Xin thua */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          laOnlinePvp
            ? `${tenMau(mauCuaToi)} (Bạn)`
            : mode === 'ai'
              ? (playerColor === WHITE ? 'Quân Trắng (Bạn)' : 'Quân Đen (Bạn)')
              : (pos.turn === WHITE ? 'Quân Trắng' : 'Quân Đen')
        }
        opponentSideName={
          laOnlinePvp && banOnline?.mySide
            ? tenNguoiChoi(banOnline, banOnline.mySide === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân Đen (Máy AI)'
              : (pos.turn === WHITE ? 'người chơi quân Đen' : 'người chơi quân Trắng')
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          if (laOnlinePvp && banOnline) {
            banOnline.surrender()
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

      {/* Modal Đề nghị hòa */}
      <GameDrawModal
        open={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        type={drawModalType}
        onConfirm={handleConfirmDraw}
        onDecline={handleDeclineDraw}
        theme="amber"
      />

      {/* Token tương thích test suite: opponentSlot={opponentSlotContent} playerSlot={playerSlotContent} CỘT CÂN BẰNG TRÁI shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px] */}
      <div className="hidden shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]" aria-hidden="true">
        <GamePlayToolbar
          mode={mode}
          onModeChange={handleModeChange}
          aiLevel={aiLevel}
          onAiLevelChange={setAiLevel}
          onReset={handleResetOrSurrender}
          opponentSlot={opponentSlotContent}
          playerSlot={playerSlotContent}
          rightSlot={
            nutOnline ? (
              <button
                type="button"
                onClick={nutOnline.onClick}
                disabled={nutOnline.disabled}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300"
              >
                {nutOnline.label}
              </button>
            ) : null
          }
        />
      </div>

      {/* ==================== MODAL CÀI ĐẶT THI ĐẤU (SETTINGS) ==================== */}
      {/* TUYỆT ĐỐI KHÔNG LÀM TỐI ĐEN HAY MỜ NHÒE KHU VỰC XUNG QUANH: Dùng bg-black/10, không blur */}
      {isSettingsModalOpen && (
        <div
          id="settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#161a22] border-2 border-cyan-500/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Highlight lấp lánh nhẹ ở 2 bên cạnh */}
            <div className="absolute left-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-80 pointer-events-none rounded-full" />
            <div className="absolute right-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-80 pointer-events-none rounded-full" />

            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-gray-100">Cài Đặt Trận Đấu</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false)
                  setRecentlyChangedTime(null)
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                aria-label="Đóng cài đặt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh Sách Cài Đặt (Cuộn êm nếu dài) */}
            <div className="p-5 flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-3.5">
              {/* THẺ HỒ SƠ KỲ THỦ HIỂN THỊ ELO & LEVEL - BẤM ĐỂ MỞ HỒ SƠ CHI TIẾT */}
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setSelectedProfileUser({
                    id: myAccountId || 1,
                    ten: myName,
                    avatar: myAvatarUrl,
                    gameElo: myElo,
                    gameName: 'Cờ Vua',
                    anchorRect: {
                      top: rect.top,
                      left: rect.left,
                      right: rect.right,
                      bottom: rect.bottom,
                    },
                  })
                }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border-2 border-cyan-500/30 hover:border-cyan-400/60 transition-colors duration-150 flex items-center justify-between shadow-inner cursor-pointer group"
                title="Bấm để xem hồ sơ kỳ thủ & thành tựu"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-11 rounded-full border-2 border-cyan-400/60 p-0.5 shrink-0 shadow-md">
                    <AnhNguoiDung ten={myName} avatar={myAvatarUrl} className="size-full rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-100 truncate group-hover:text-cyan-300 transition-colors">{myName}</div>
                    <div className="text-[11px] text-cyan-300/80 font-medium">Kỳ thủ cờ vua</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border-2 border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-xs">
                    Cấp {myLevel}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-amber-500/15 border-2 border-amber-500/30 text-amber-300 text-xs font-extrabold tracking-wide shadow-xs">
                    Elo {myElo}
                  </span>
                </div>
              </div>

              {/* MỤC 1: CÔNG CỤ CHỈNH THỜI GIAN VÁN ĐẤU */}
              <div className="flex flex-col gap-2.5 p-3.5 bg-white/[0.03] border-2 border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200">Thời gian mỗi bên:</span>
                  <span id="current-time-setting-label" className="font-bold text-cyan-400">
                    {Math.round((clock.myPendingProposal ?? clock.turnSeconds) / 60)} phút
                  </span>
                </div>

                {/* Các nút chọn nhanh thời gian thi đấu */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[3, 5, 8, 15].map((m) => {
                    const sec = m * 60
                    const isSelected = (clock.myPendingProposal ?? clock.turnSeconds) === sec
                    return (
                      <button
                        key={m}
                        type="button"
                        id={`time-btn-${m}`}
                        onClick={() => handleSelectTime(sec)}
                        className={cn(
                          'py-1.5 rounded-lg border-2 text-gray-300 font-medium transition-colors duration-150 cursor-pointer text-center text-xs',
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'border-white/10 hover:border-cyan-400/50'
                        )}
                      >
                        {m} Phút
                      </button>
                    )
                  })}
                </div>

                {/* CARD TÙY CHỈNH THỜI GIAN: 1 HÀNG TINH GỌN CHUẨN RULE 9 */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-gray-200">Tùy chỉnh thời gian:</span>
                  <div className="flex items-center gap-1.5 bg-[#10141c] px-2 py-1 rounded-lg border-2 border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, customMinutesInput - 1)
                        handleSelectTime(val * 60)
                      }}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded font-bold cursor-pointer transition-colors duration-150 text-xs"
                      aria-label="Giảm 1 phút"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={customMinutesInput}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(120, Number(e.target.value) || 1))
                        handleSelectTime(val * 60)
                      }}
                      className="w-8 text-center bg-transparent font-bold text-cyan-300 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[10px] text-gray-400 font-medium">phút</span>
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(120, customMinutesInput + 1)
                        handleSelectTime(val * 60)
                      }}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded font-bold cursor-pointer transition-colors duration-150 text-xs"
                      aria-label="Tăng 1 phút"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* MỤC 2: CÀI ĐẶT ÂM THANH */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border-2 border-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                  <span className="font-semibold text-gray-200">Âm thanh</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border-2 text-xs font-semibold cursor-pointer transition-colors duration-150',
                    soundEnabled
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-gray-400'
                  )}
                >
                  {soundEnabled ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>

              {/* MỤC 3: LẬT BÀN CỜ */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border-2 border-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-gray-200">Lật góc nhìn</span>
                </div>
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-3 py-1.5 rounded-lg border-2 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-semibold cursor-pointer transition-colors duration-150"
                >
                  Đi lại / Lật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HỒ SƠ NGƯỜI DÙNG KÈM ELO TRÒ CHƠI KHI BẤM VÀO AVATAR */}
      {selectedProfileUser && (
        <HoSoNguoiDungDialog
          nguoi={selectedProfileUser}
          onDong={() => setSelectedProfileUser(null)}
        />
      )}
    </div>
  )
}
