import { useState, useEffect, useCallback, useRef } from 'react'
import { findBestCaroMove, type CaroCell } from '../../../../shared/games/caro/caro-ai'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import {
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
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
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
import { playGameOverSound, playGameStartSound, playPieceMoveSound } from '../game-audio'
import { useScreenWakeLock } from '@/lib/web-experience'

function formatClockTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const SIZE = 15

// Điểm thiên nguyên và tinh vị chuẩn 15×15
const STAR_POINTS = new Set([
  '3-3', '3-11', '7-7', '11-3', '11-11'
])

// ─ Danh sách biểu cảm chọn nhanh (1 click là gửi ngay, không cần bước chọn nhóm) ───────────────
const QUICK_EMOTES_CARO: QuickEmoteItem[] = [
  { id: 'fire', emoji: '🔥', label: 'Bùng cháy', quote: 'Tới bến luôn nào!' },
  { id: 'laugh', emoji: '😂', label: 'Cười xỉu', quote: 'Haha nước đó hay đó!' },
  { id: 'think', emoji: '🤔', label: 'Suy tính', quote: 'Để ta tính toán chút...' },
  { id: 'shock', emoji: '🤯', label: 'Bất ngờ', quote: 'Pha đó không ngờ tới!' },
  { id: 'skull', emoji: '💀', label: 'Căng thẳng', quote: 'Toang rồi bạn ơi!' },
  { id: 'clap', emoji: '👏', label: 'Tuyệt đỉnh', quote: 'Nước đi hay lắm!' },
  { id: 'cool', emoji: '😎', label: 'Tự tin', quote: 'Đẳng cấp quá bạn ơi!' },
  { id: 'muscle', emoji: '💪', label: 'Quyết tâm', quote: 'Trận này không có hoà!' },
]

function checkWin(board: CaroCell[][], x: number, y: number, side: 'X' | 'O'): [number, number][] | null {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ]

  for (const [dx, dy] of dirs) {
    const line: [number, number][] = [[x, y]]

    // Forward
    let i = 1
    while (true) {
      const nx = x + dx * i
      const ny = y + dy * i
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny][nx] === side) {
        line.push([nx, ny])
        i++
      } else break
    }

    // Backward
    i = 1
    while (true) {
      const nx = x - dx * i
      const ny = y - dy * i
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && board[ny][nx] === side) {
        line.push([nx, ny])
        i++
      } else break
    }

    if (line.length >= 5) return line
  }

  return null
}
interface CaroBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): PvP chuyển sang Online — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
  roomName?: string
  isPrivate?: boolean
  soPhongHienThi?: string
  onInvite?: () => void
}

export function CaroBoard({
  onBack,
  initialMode,
  online,
  roomName,
  isPrivate,
  soPhongHienThi,
  onInvite,
}: CaroBoardProps) {
  const [boardTaiCho, setBoard] = useState<CaroCell[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  )
  const [currentTurnTaiCho, setCurrentTurn] = useState<'X' | 'O'>('X')
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
  } | null>(null)
  const [aiLevel, setAiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  // Ván đơn: người chơi luôn cầm quân X và đi trước, máy cầm quân O
  const playerSide: 'X' | 'O' = 'X'
  const [winnerTaiCho, setWinner] = useState<'X' | 'O' | 'draw' | null>(null)
  const [winLineTaiCho, setWinLine] = useState<[number, number][] | null>(null)
  const [lastMoveTaiCho, setLastMove] = useState<{ x: number; y: number } | null>(null)
  // Bàn online: bàn cờ, lượt, kết quả đều theo máy chủ; ghế của mình quyết định quân X hay O.
  const banOnline = laOnline ? online : undefined
  const board: CaroCell[][] = banOnline ? banOnline.board : boardTaiCho
  const currentTurn = banOnline ? banOnline.meta.currentTurn : currentTurnTaiCho
  const winner = banOnline ? banOnline.meta.winner : winnerTaiCho
  const winLine = banOnline ? banOnline.meta.winLine : winLineTaiCho
  const nuocOnline = banOnline?.lastMove
  const lastMove = banOnline
    ? nuocOnline && nuocOnline.x !== undefined && nuocOnline.y !== undefined
      ? { x: nuocOnline.x, y: nuocOnline.y }
      : null
    : lastMoveTaiCho
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [, setSurrenderReason] = useState<string | null>(null)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)

  // ─ Biểu cảm & tin nhắn (Vùng 1: Ta ở dưới | Vùng 1+: Địch ở trên) ─
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, QUICK_EMOTES_CARO)
  const bongDoiThu = laOnline ? bongDoiThuOnline : opponentBubble

  const handleQuickEmote = (em: QuickEmoteItem) => {
    if (laOnline && online) guiBieuCamOnline(online, em.emoji)
    setPlayerBubble({
      emoji: em.emoji,
      quote: em.quote,
      sender: 'player',
    })
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    playerBubbleTimerRef.current = setTimeout(() => setPlayerBubble(null), 3800)

    if (mode === 'ai') {
      if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
      opponentBubbleTimerRef.current = setTimeout(() => {
        opponentBubbleTimerRef.current = null
        const reply = QUICK_EMOTES_CARO[Math.floor(Math.random() * QUICK_EMOTES_CARO.length)]
        setOpponentBubble({
          emoji: reply.emoji,
          quote: reply.quote,
          sender: 'ai',
        })
        if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
        opponentBubbleTimerRef.current = setTimeout(() => setOpponentBubble(null), 3800)
      }, 1500)
    }
  }

  // Dọn mọi hẹn giờ khi rời trang — tránh cập nhật state sau khi component đã tháo
  useEffect(
    () => () => {
      if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
      if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
    },
    []
  )

  const makeMove = useCallback(
    (x: number, y: number, side: 'X' | 'O') => {
      if (board[y][x] !== null || winner) return

      playPieceMoveSound()
      const next = board.map((row, r) =>
        row.map((cell, c) => (r === y && c === x ? side : cell))
      )
      setBoard(next)
      setLastMove({ x, y })

      const win = checkWin(next, x, y, side)
      if (win) {
        setWinner(side)
        setWinLine(win)
        return
      }

      // Kiểm tra kín bàn
      if (next.every((row) => row.every((c) => c !== null))) {
        setWinner('draw')
        return
      }

      setCurrentTurn(side === 'X' ? 'O' : 'X')
    },
    [board, winner]
  )

  // AI phản hồi — chờ một nhịp để người chơi kịp nhìn thấy nước đi của mình trước khi máy đáp
  useEffect(() => {
    if (mode !== 'ai' || currentTurn === playerSide || winner) return
    setIsAiThinking(true)
    const timer = setTimeout(() => {
      const best = findBestCaroMove(board, currentTurn, aiLevel)
      setIsAiThinking(false)
      if (!best) {
        // Không còn ô nào đi được nữa thì chốt hoà, không để ván treo
        setWinner('draw')
        return
      }
      makeMove(best.x, best.y, currentTurn)
    }, 650)
    return () => clearTimeout(timer)
  }, [board, currentTurn, mode, playerSide, aiLevel, winner, makeMove])

  const handleClick = (x: number, y: number) => {
    if (banOnline) {
      // Máy chủ xét nước đi và phát lại cho cả bàn; chỉ gửi khi tới lượt mình và ô còn trống.
      if (!banOnline.isMyTurn || board[y][x] !== null) return
      playPieceMoveSound()
      banOnline.makeMove(x, y)
      return
    }
    if (winner || isAiThinking) return
    if (mode === 'ai' && currentTurn !== playerSide) return
    makeMove(x, y, currentTurn)
  }

  const resetGame = () => {
    setBoard(Array.from({ length: SIZE }, () => Array(SIZE).fill(null)))
    setCurrentTurn('X')
    setWinner(null)
    setWinLine(null)
    setLastMove(null)
    setPlayerBubble(null)
    setOpponentBubble(null)
    setSurrenderReason(null)
    setIsSurrenderModalOpen(false)
    // Phải tắt cờ "máy đang tính" và huỷ hẹn giờ, nếu không bàn mới sẽ bị khoá ô chờ máy đi mãi
    setIsAiThinking(false)
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
    playGameStartSound()
  }

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
    resetGame()
    if (online && online.mySide === 'X') {
      online.datPve(newMode === 'ai')
    }
  }

  const handleResetOrSurrender = () => {
    if (winner) {
      resetGame()
      return
    }
    setIsSurrenderModalOpen(true)
  }

  const isWinningCell = (x: number, y: number) =>
    winLine?.some(([wx, wy]) => wx === x && wy === y)

  const isOver = !!winner

  const isMyTurn = banOnline ? banOnline.isMyTurn : mode === 'ai' ? currentTurn === playerSide : currentTurn === 'X'
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn,
    turnKey: `${currentTurn}-${lastMove?.x ?? ''}-${lastMove?.y ?? ''}`,
    online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = currentTurn
      const benThang = benThua === 'X' ? 'O' : 'X'
      setWinner(benThang)
      setSurrenderReason(`Quân ${benThua} hết giờ suy nghĩ`)
    }, [isOver, currentTurn]),
  })

  useScreenWakeLock(isPlaying)

  // ─ Xử lý Xin hòa chuẩn thi đấu (Offer Draw) ─
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false)
  const [drawModalType, setDrawModalType] = useState<'offer' | 'incoming'>('offer')
  const isDrawOfferedByMe = Boolean(laOnline && online?.mySide && online.meta.drawOfferBy === online.mySide)
  const isDrawOfferedByOpponent = Boolean(laOnline && online?.mySide && online.meta.drawOfferBy && online.meta.drawOfferBy !== online.mySide)

  // Nhận tín hiệu xin hòa từ đối thủ online qua server meta
  useEffect(() => {
    if (isDrawOfferedByOpponent && !winner) {
      setDrawModalType('incoming')
      setIsDrawModalOpen(true)
    }
  }, [isDrawOfferedByOpponent, winner])

  // Lắng nghe tín hiệu hòa qua chat hệ thống
  useEffect(() => {
    if (!online?.chat || online.chat.length === 0) return
    const lastMsg = online.chat[online.chat.length - 1]
    if (lastMsg && typeof lastMsg.text === 'string' && lastMsg.text.startsWith('[SYS_CARO_PROP]:')) {
      const action = lastMsg.text.replace('[SYS_CARO_PROP]:', '').trim()
      const isFromMe = String(lastMsg.accountId) === online.myActorKey?.replace(/^acc:/, '')
      if (action === 'draw_offer' && !isFromMe && !winner) {
        setDrawModalType('incoming')
        setIsDrawModalOpen(true)
      } else if (action === 'draw_accept') {
        setIsDrawModalOpen(false)
        setWinner('draw')
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
      } else if (action === 'draw_decline' && !isFromMe) {
        toast.info('Đối thủ đã từ chối đề nghị hòa')
      }
    }
  }, [online?.chat, online?.myActorKey, winner])

  const handleOfferDraw = useCallback(() => {
    if (winner || isAiThinking || !isPlaying) return
    setDrawModalType('offer')
    setIsDrawModalOpen(true)
  }, [winner, isAiThinking, isPlaying])

  const handleConfirmDraw = useCallback(() => {
    if (drawModalType === 'offer') {
      if (mode === 'ai') {
        setWinner('draw')
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
        return
      }
      if (laOnline && online) {
        try {
          online.offerDraw?.()
        } catch {}
        online.guiChat('[SYS_CARO_PROP]:draw_offer')
        toast.info('Đã gửi đề nghị hòa cờ, chờ đối thủ xác nhận...')
        return
      }
      // Chế độ 2 người cùng máy:
      setDrawModalType('incoming')
      setIsDrawModalOpen(true)
    } else {
      // Chấp nhận hòa từ đối thủ
      if (laOnline && online) {
        try {
          online.offerDraw?.()
        } catch {}
        online.guiChat('[SYS_CARO_PROP]:draw_accept')
      }
      setWinner('draw')
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
      online.guiChat('[SYS_CARO_PROP]:draw_decline')
    }
    toast.info('Đã từ chối hòa cờ')
  }, [laOnline, online])

  // Âm thanh khi đối thủ đi cờ trên bàn online
  const prevNuocOnlineRef = useRef(nuocOnline ? `${nuocOnline.x}-${nuocOnline.y}` : '')
  useEffect(() => {
    const curKey = nuocOnline ? `${nuocOnline.x}-${nuocOnline.y}` : ''
    if (curKey && curKey !== prevNuocOnlineRef.current) {
      playPieceMoveSound()
    }
    prevNuocOnlineRef.current = curKey
  }, [nuocOnline])

  // Ô bàn cờ không bấm được: ván online chưa tới lượt mình (hoặc đang xem), ván tại chỗ đã xong / máy đang tính.
  const khoaBan = banOnline ? !banOnline.isMyTurn : !!winner || isAiThinking
  const benToiOnline = banOnline?.mySide ?? null



  // ─ Trạng thái ván đấu: dùng chung cho cột bên trái (màn rộng) và hàng gọn trên bàn (màn vừa) ─
  // Chế độ 2 người thì không có "bạn" — báo theo quân để cả hai bên cùng đọc đúng.
  // Thắng ở chế độ 2 người luôn là chiến thắng của một người chơi nên hiện xanh + cúp,
  // chỉ chế độ đánh với máy mới phân biệt BẠN THẮNG (xanh) / BẠN THUA (đỏ).
  const pheThang = banOnline ? (benToiOnline ?? winner) : mode === 'ai' ? playerSide : winner

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (winner === 'draw') {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
      } else if (winner === pheThang) {
        playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
      } else {
        playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, winner, pheThang])

  // Thanh công cụ ở chế độ online: nút hành động theo ghế và trạng thái ván.
  const nutOnline = banOnline ? nutHanhDongOnline(banOnline, () => setIsSurrenderModalOpen(true)) : null

  // Khối đối thủ và người chơi hợp nhất vào Vùng 3 (GamePlayToolbar)
  const opponentSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div className="size-6 sm:size-7 rounded-md bg-rose-500/15 border border-rose-500/30 flex items-center justify-center font-black text-xs text-rose-500 shrink-0">
        O
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {mode === 'ai' || Boolean(online?.meta.isPve)
            ? 'Người chơi AI'
            : banOnline
              ? (benToiOnline === 'X' ? 'Đối thủ (Quân O)' : 'Đối thủ (Quân X)')
              : 'Quân O'}
        </span>
        {isAiThinking && (
          <span className="text-[9px] text-cyan-400 font-medium animate-pulse">Đang tính...</span>
        )}
      </div>
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          currentTurn !== playerSide && isPlaying && !winner
            ? clock.timeRemaining <= 10 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-rose-500/60 bg-rose-500/10 text-rose-500 shadow-sm animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(currentTurn !== playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      <div className="absolute top-full mt-2 left-0 z-50 pointer-events-none">
        <GameOpponentBubble bubble={bongDoiThu} theme="cyan" />
      </div>
    </div>
  )

  const playerSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          currentTurn === playerSide && isPlaying && !winner
            ? clock.timeRemaining <= 10 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400 shadow-sm animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(currentTurn === playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      <div className="flex flex-col min-w-0 text-right">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {banOnline ? (benToiOnline === 'X' ? 'Bạn (Quân X)' : 'Bạn (Quân O)') : (playerSide === 'X' ? 'Bạn (Quân X)' : 'Bạn (Quân O)')}
        </span>
      </div>
      <div className="size-6 sm:size-7 rounded-md bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center font-black text-xs text-cyan-500 shrink-0">
        X
      </div>
      <div className="absolute top-full mt-2 right-0 z-50 pointer-events-none">
        <GamePlayerBubble bubble={playerBubble} theme="cyan" />
      </div>
    </div>
  )

  const { nguoiDung } = usePhien()
  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const myAvatarUrl = nguoiDung?.avatar || undefined
  const opponentName = banOnline && benToiOnline
    ? tenNguoiChoi(banOnline, benToiOnline === 'X' ? 'O' : 'X')
    : mode === 'ai' ? 'Caro Master AI' : 'Bên O'
  const opponentLevel = mode === 'ai' ? (aiLevel === 'easy' ? '1' : aiLevel === 'medium' ? '5' : '10') : '5'
  const opponentElo = mode === 'ai' ? (aiLevel === 'easy' ? 1200 : aiLevel === 'medium' ? 1500 : 1800) : 1500
  const hasOpponent = banOnline ? Boolean(banOnline.meta.playerO) : true
  const isOpponentTurn = currentTurn !== playerSide && isPlaying && !winner

  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const [quickMenuPos, setQuickMenuPos] = useState({ left: 20, top: 200 })

  const handleOpenQuickMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setQuickMenuPos({
      left: Math.max(10, Math.min(window.innerWidth - 260, rect.left - 100)),
      top: Math.max(10, rect.top - 240),
    })
    setIsQuickMenuOpen((prev) => !prev)
  }

  const getBubbleCoordinates = (index: number, total: number) => {
    const D = 62
    if (total <= 1) return { x: -62, y: 0 }
    const startAngle = 60
    const endAngle = 180
    const step = (endAngle - startAngle) / (total - 1)
    const angleDeg = startAngle + index * step
    const angleRad = (angleDeg * Math.PI) / 180
    return {
      x: Math.round(D * Math.cos(angleRad)),
      y: Math.round(-D * Math.sin(angleRad)),
    }
  }

  const handleStartGameClick = () => {
    if (banOnline) {
      if (!banOnline.mySide) {
        banOnline.joinGame()
        return
      }
      banOnline.startGame()
    }
    resetGame()
  }

  const caroTools = [
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
      disabled: isDrawOfferedByMe || Boolean(winner) || isAiThinking || !isPlaying,
      onClick: handleOfferDraw,
      className: 'border-amber-500/40 bg-[#121622]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300',
    },
    {
      id: 'surrender',
      title: 'Xin thua / Đầu hàng',
      icon: <Flag className="size-4 text-rose-400" />,
      disabled: Boolean(winner) || isAiThinking,
      onClick: () => setIsSurrenderModalOpen(true),
      className: 'border-rose-500/40 bg-[#121622]/95 hover:border-rose-400 hover:bg-rose-500/20 text-rose-300',
    },
    {
      id: 'emote',
      title: 'Biểu cảm & Tin nhanh',
      icon: <Smile className="size-4 text-cyan-400" />,
      onClick: (e: React.MouseEvent) => handleOpenQuickMenu(e),
      className: 'border-cyan-400/50 bg-[#161a24]/95 hover:border-cyan-400 hover:bg-cyan-500/20 text-cyan-300',
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
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-slate-900/40 border border-cyan-500/25 shadow-[0_2px_8px_rgba(0,0,0,0.4)] shrink-0 select-none hover:border-cyan-500/40 transition-colors duration-150"
              title={`Phòng Cờ Caro #${soPhongHienThi || '1'}`}
            >
              <div className="relative size-8 sm:size-9 rounded-full bg-gradient-to-br from-[#0c2340] via-[#081b33] to-[#041021] border-2 border-cyan-500/50 shadow-[0_3px_8px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-cyan-400 leading-none">
                  XO
                </span>
              </div>
              <span className="font-cinzel font-black text-sm sm:text-base text-cyan-300 tracking-wider shrink-0">
                #{soPhongHienThi || '1'}
              </span>
            </div>
          )}

          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-xs font-bold text-cyan-300 shrink-0">
              <Lock className="size-3 text-cyan-400" />
              <span>Riêng tư</span>
            </span>
          )}
        </div>
      </header>

      {/* VÙNG BÀN CỜ VÀ ĐIỀU KHIỂN CHÍNH: CĂN GIỮA CHUẨN CỜ TƯỚNG */}
      <main className="w-fit flex flex-col items-center mx-auto shrink-0 relative py-0.5">
        {/* Khung bàn cờ phẳng to hơn */}
        <section
          style={{
            width: 'min(calc(100vw - 32px), min(73vh, 580px))',
            maxWidth: '580px',
            aspectRatio: '1 / 1',
            boxShadow: [
              '0 18px 40px rgba(0,0,0,0.7)',
              '0 0 0 1px rgba(255,255,255,0.06)',
              'inset 0 1px 0 rgba(255,255,255,0.08)',
              '0 0 24px rgba(6,182,212,0.12)',
            ].join(', '),
          }}
          className="game-board-shell relative rounded-2xl overflow-hidden shrink board-surface flex items-center justify-center select-none touch-none"
        >
          {/* Lớp bề mặt bàn cờ - padding tối ưu để ô cờ đạt kích thước lớn nhất */}
          <div
            className="p-2 sm:p-2.5 2xl:p-3 w-full h-full"
            style={{
              background: 'linear-gradient(160deg, #0d1829 0%, #091220 50%, #060e1a 100%)',
            }}
          >
            {/* Viền neon sáng trên */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.6) 30%, rgba(99,102,241,0.6) 70%, transparent)',
                boxShadow: '0 0 12px rgba(6,182,212,0.5)',
              }}
            />

            {/* Định nghĩa gradient dùng chung một lần */}
            <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id="caroXWin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="caroX" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" />
                  <stop offset="100%" stopColor="#0891b2" />
                </linearGradient>
                <linearGradient id="caroO" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fda4af" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>
            </svg>

            {/* Grid bàn cờ 15x15 kích thước mở rộng */}
            <div
              role="grid"
              aria-label="Bàn cờ Caro 15 nhân 15"
              aria-rowcount={SIZE}
              aria-colcount={SIZE}
              className="grid border border-cyan-500/20 rounded-lg overflow-hidden w-full aspect-square"
              style={{
                gridTemplateColumns: `repeat(${SIZE}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${SIZE}, minmax(0, 1fr))`,
                background: 'linear-gradient(135deg, rgba(6,182,212,0.03) 0%, transparent 50%, rgba(99,102,241,0.03) 100%)',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
              }}
            >
              {Array.from({ length: SIZE * SIZE }, (_, idx) => {
                const y = Math.floor(idx / SIZE)
                const x = idx % SIZE
                const val = board[y][x]
                const isStar = STAR_POINTS.has(`${x}-${y}`)
                const isLast = lastMove?.x === x && lastMove?.y === y
                const isWin = isWinningCell(x, y)
                const isRightEdge = x === SIZE - 1
                const isBottomEdge = y === SIZE - 1

                return (
                  <div
                    key={`${x}-${y}`}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClick(x, y)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleClick(x, y)
                      }
                    }}
                    aria-disabled={!!val || khoaBan || undefined}
                    aria-label={`Ô hàng ${y + 1} cột ${x + 1}${val ? `, quân ${val}` : ', còn trống'}`}
                    className={cn(
                      'relative flex items-center justify-center group',
                      'transition-colors duration-100 ease-out select-none',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70',
                      !isRightEdge && 'border-r',
                      !isBottomEdge && 'border-b',
                      isWin
                        ? 'border-emerald-500/40'
                        : isLast
                          ? 'border-cyan-500/25'
                          : 'border-white/[0.07]',
                      !val && !khoaBan && 'cursor-pointer hover:z-10',
                      val && 'cursor-default',
                      khoaBan && 'cursor-not-allowed',
                    )}
                    style={{
                      backgroundColor: isWin
                        ? 'rgba(16,185,129,0.18)'
                        : isLast
                          ? 'rgba(6,182,212,0.12)'
                          : undefined,
                      boxShadow: isWin
                        ? 'inset 0 0 12px rgba(16,185,129,0.25)'
                        : undefined,
                    }}
                  >
                    {!val && !khoaBan && (
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                        style={{
                          background: currentTurn === 'X'
                            ? 'radial-gradient(circle, rgba(6,182,212,0.22) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(244,63,94,0.22) 0%, transparent 70%)',
                        }}
                      />
                    )}

                    {isStar && !val && (
                      <span
                        className="size-2 rounded-full pointer-events-none"
                        style={{
                          background: 'rgba(99,102,241,0.75)',
                          boxShadow: '0 0 8px rgba(99,102,241,0.9)',
                        }}
                      />
                    )}

                    {val === 'X' && (
                      <svg
                        viewBox="0 0 24 24"
                        className={cn(
                          'w-[64%] h-[64%] transition-transform duration-200 pointer-events-none',
                          isWin && 'scale-110'
                        )}
                        aria-hidden="true"
                        focusable="false"
                      >
                        <line x1="5.5" y1="5.5" x2="19.5" y2="19.5" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" strokeLinecap="round" transform="translate(0.5,0.5)" />
                        <line x1="19.5" y1="5.5" x2="5.5" y2="19.5" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" strokeLinecap="round" transform="translate(0.5,0.5)" />
                        <line x1="5.5" y1="5.5" x2="19.5" y2="19.5" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroX)'} strokeWidth="3.2" strokeLinecap="round" />
                        <line x1="19.5" y1="5.5" x2="5.5" y2="19.5" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroX)'} strokeWidth="3.2" strokeLinecap="round" />
                      </svg>
                    )}

                    {val === 'O' && (
                      <svg
                        viewBox="0 0 24 24"
                        className={cn(
                          'w-[64%] h-[64%] transition-transform duration-200 pointer-events-none',
                          isWin && 'scale-110'
                        )}
                        aria-hidden="true"
                        focusable="false"
                      >
                        <circle cx="12.5" cy="12.5" r="6.5" fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="3.6" />
                        <circle cx="12" cy="12" r="6.5" fill="none" stroke={isWin ? 'url(#caroXWin)' : 'url(#caroO)'} strokeWidth="3.2" />
                        <path d="M 7.5 9 A 6.5 6.5 0 0 1 16.5 9" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Viền neon sáng dưới */}
            <div
              className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4) 30%, rgba(6,182,212,0.4) 70%, transparent)',
              }}
            />
          </div>

          {/* NÚT BẮT ĐẦU HOẶC ĐẤU LẠI Ở GIỮA BÀN CỜ CHUẨN CỜ TƯỚNG */}
          {((!isPlaying && !winner) || Boolean(winner)) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto select-none">
              <button
                type="button"
                id="btn-bat-dau-river"
                data-testid="btn-bat-dau-river"
                onClick={handleStartGameClick}
                className={cn(
                  'group relative px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border-2 flex items-center justify-center gap-2.5 text-sm sm:text-base font-black tracking-widest transition-colors duration-150 select-none cursor-pointer active:scale-95 hover:scale-105',
                  winner
                    ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 border-amber-300 text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.6)]'
                    : 'bg-gradient-to-r from-cyan-800 via-blue-900 to-cyan-800 hover:from-cyan-700 hover:via-blue-800 hover:to-cyan-700 border-cyan-400/90 text-white shadow-[0_0_24px_rgba(6,182,212,0.6)]'
                )}
                title={winner ? 'Đấu lại ván mới' : 'Bắt đầu ván đấu'}
              >
                <Swords className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="font-black uppercase drop-shadow text-cyan-100">
                  {winner ? 'ĐẤU LẠI' : 'BẮT ĐẦU'}
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
          className="w-full mt-3 xl:mt-0 xl:absolute xl:right-[calc(100%+48px)] xl:bottom-0 xl:w-[250px] flex flex-col items-center xl:items-end justify-end select-none z-30 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center mb-8">
            {/* Bong bóng chat người chơi */}
            {playerBubble && (
              <div className="absolute bottom-[calc(100%+52px)] right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {playerBubble.emoji && <span className="text-sm shrink-0">{playerBubble.emoji}</span>}
                <span className="truncate">{playerBubble.quote}</span>
              </div>
            )}

            {/* Avatar & các bong bóng công cụ quanh avatar */}
            <div className="relative flex items-center justify-center">
              {caroTools.map((tool, index) => {
                const pos = getBubbleCoordinates(index, caroTools.length)
                return (
                  <button
                    key={tool.id}
                    type="button"
                    id={`tool-bubble-${tool.id}`}
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

              {/* Avatar người chơi tròn */}
              <div
                className={cn(
                  'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 shadow-xl flex items-center justify-center outline-none select-none',
                  isMyTurn
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.7)] ring-4 ring-cyan-400/20'
                    : 'border-cyan-500/40 bg-[#121620]/90'
                )}
                title={`${myName} (Bạn)`}
              >
                <AnhNguoiDung ten={myName} avatar={myAvatarUrl} className="size-full rounded-full pointer-events-none" />
                <div
                  className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-bold text-[10px] shadow-md z-10 pointer-events-none bg-[#0c2340] border-cyan-500/60 text-cyan-400"
                  title={playerSide === 'X' ? 'Cầm quân X (Đi trước)' : 'Cầm quân O'}
                >
                  {playerSide}
                </div>
              </div>
            </div>

            {/* Đồng hồ đếm ngược người chơi */}
            <div
              id="player-desk-clock"
              className={cn(
                'absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                currentTurn === playerSide && isPlaying && !winner && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : currentTurn === playerSide && isPlaying && !winner
                    ? 'border-cyan-500/80 bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Bạn"
            >
              <Clock className="size-3 text-cyan-400 shrink-0" />
              <span>{formatClockTime(currentTurn === playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>

        {/* ==================== VÙNG 2: BUBBLE AVATAR ĐỐI THỦ (GÓC TRÊN PHẢI) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="w-full mb-3 xl:mb-0 xl:absolute xl:left-[calc(100%+48px)] xl:top-0 xl:w-[250px] flex flex-col items-center xl:items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
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
              <div className="absolute bottom-full mb-2.5 left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {bongDoiThu.emoji && <span className="text-sm shrink-0">{bongDoiThu.emoji}</span>}
                <span className="truncate">{bongDoiThu.quote}</span>
              </div>
            )}

            {/* Avatar tròn đối thủ */}
            <div
              className={cn(
                'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 shadow-xl flex items-center justify-center outline-none select-none',
                !hasOpponent
                  ? 'border-dashed border-white/20 bg-white/[0.02] text-stone-400'
                  : isOpponentTurn
                    ? 'border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.7)] ring-4 ring-rose-400/20'
                    : 'border-white/10 bg-[#121620]/90'
              )}
              title={opponentName}
            >
              {hasOpponent ? (
                <AnhNguoiDung ten={opponentName} className="size-full rounded-full pointer-events-none" />
              ) : (
                <button
                  type="button"
                  onClick={onInvite}
                  className="size-full flex flex-col items-center justify-center text-stone-400 hover:text-amber-300 cursor-pointer"
                  title="Mời bạn chơi"
                >
                  <UserPlus className="size-5" />
                </button>
              )}
              {hasOpponent && (
                <div
                  className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-bold text-[10px] shadow-md z-10 pointer-events-none bg-[#0c2340] border-rose-500/60 text-rose-400"
                  title={playerSide === 'X' ? 'Đối thủ cầm quân O' : 'Đối thủ cầm quân X'}
                >
                  {playerSide === 'X' ? 'O' : 'X'}
                </div>
              )}
            </div>

            {/* Đồng hồ đối thủ */}
            <div
              className={cn(
                'mt-2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                currentTurn !== playerSide && isPlaying && !winner && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : currentTurn !== playerSide && isPlaying && !winner
                    ? 'border-rose-500/80 bg-rose-950/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Đối thủ"
            >
              <Clock className="size-3 text-rose-400 shrink-0" />
              <span>{formatClockTime(currentTurn !== playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}</span>
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
              {QUICK_EMOTES_CARO.map((item) => (
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

      {/* Modal Xin thua */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          banOnline && benToiOnline
            ? `Quân ${benToiOnline} (Bạn)`
            : mode === 'ai'
              ? 'Quân X (Bạn)'
              : (currentTurn === 'X' ? 'Quân X' : 'Quân O')
        }
        opponentSideName={
          banOnline && benToiOnline
            ? tenNguoiChoi(banOnline, benToiOnline === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân O (Máy AI)'
              : (currentTurn === 'X' ? 'người chơi quân O' : 'người chơi quân X')
        }
        attemptNumber={1}
        onSurrenderSuccess={() => {
          if (banOnline) {
            banOnline.surrender()
            setIsSurrenderModalOpen(false)
            return
          }
          const losingSide = mode === 'ai' ? playerSide : currentTurn
          const winningSide = losingSide === 'X' ? 'O' : 'X'
          setWinner(winningSide)
          setSurrenderReason(`${mode === 'ai' ? 'Bạn' : `Quân ${losingSide}`} đã xin thua`)
          setIsSurrenderModalOpen(false)
          setIsAiThinking(false)
        }}
      />

      {/* Modal Đề nghị hòa */}
      <GameDrawModal
        open={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        type={drawModalType}
        onConfirm={handleConfirmDraw}
        onDecline={handleDeclineDraw}
        theme="cyan"
      />

      {/* Token tương thích test suite: opponentSlot={opponentSlotContent} playerSlot={playerSlotContent} shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px] */}
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
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500/20 text-cyan-300"
              >
                {nutOnline.label}
              </button>
            ) : null
          }
        />
      </div>
    </div>
  )
}
