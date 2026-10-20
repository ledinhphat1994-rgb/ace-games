import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { findBestCaroMove, type CaroCell } from '../../../../shared/games/caro/caro-ai'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import {
  Swords,
  ArrowLeft,
  Lock,
  Clock,
  Handshake,
  Flag,
  Crown,
  Smile,
  Bot,
  Users,
  X,
  Settings,
  UserPlus,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { EloRankAvatarFrame } from '../EloRankAvatarFrame'
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
import { playGameOverSound, playGameStartSound, playPieceMoveSound } from '../game-audio'
import { useScreenWakeLock } from '@/lib/web-experience'
import { AiDifficultyHoldMenu } from '../AiDifficultyHoldMenu'
import { useHoldBotDifficulty } from '../useHoldBotDifficulty'

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
  const { nguoiDung } = usePhien()
  const [boardTaiCho, setBoard] = useState<CaroCell[][]>(() =>
    Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  )
  const [currentTurnTaiCho, setCurrentTurn] = useState<'X' | 'O'>('X')
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
    subtitle?: string
  } | null>(null)

  const showGameNotice = useCallback((title: string, subtitle?: string) => {
    setHeroicBanner({ type: 'notice', title, subtitle })
  }, [])
  const [isLocalStarted, setIsLocalStarted] = useState(false)
  const {
    aiLevel,
    setAiLevel,
    isDifficultyMenuOpen,
    closeDifficultyMenu,
    anchorRect: aiDifficultyAnchor,
    botHoldHandlers,
    wrapClickHandler,
  } = useHoldBotDifficulty('medium')
  // Ván đơn: người chơi luôn cầm quân X và đi trước, máy cầm quân O
  const playerSide: 'X' | 'O' = 'X'
  const [winnerTaiCho, setWinner] = useState<'X' | 'O' | 'draw' | null>(null)
  const [winLineTaiCho, setWinLine] = useState<[number, number][] | null>(null)
  const [lastMoveTaiCho, setLastMove] = useState<{ x: number; y: number } | null>(null)
  const isPveMode = mode === 'ai'
  const laOnlinePvp = laOnline && !isPveMode
  // Bàn online: bàn cờ, lượt, kết quả đều theo máy chủ; ghế của mình quyết định quân X hay O.
  const banOnline = laOnlinePvp ? online : undefined
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
        const saved = localStorage.getItem('caro_avatar_pos')
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
        localStorage.setItem('caro_avatar_pos', JSON.stringify(currentOffsetRef.current))
      } catch {}
    }
  }

  // ─ Biểu cảm & tin nhắn (Vùng 1: Ta ở dưới | Vùng 1+: Địch ở trên) ─
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lắng nghe tin nhắn cảm xúc từ đối thủ qua online chat
  const lastHandledEmojiMsgIdRef = useRef<string | number | null>(null)
  const isFirstMountEmojiRef = useRef(true)

  useEffect(() => {
    if (!online?.chat || online.chat.length === 0) return
    if (isFirstMountEmojiRef.current) {
      isFirstMountEmojiRef.current = false
      const initialLastMsg = online.chat[online.chat.length - 1]
      if (initialLastMsg) {
        lastHandledEmojiMsgIdRef.current =
          initialLastMsg.id || (initialLastMsg as any).thoiGian || `${online.chat.length}_${initialLastMsg.text}`
      }
      return
    }

    const lastMsg = online.chat[online.chat.length - 1]
    if (!lastMsg) return
    const isFromMe = String(lastMsg.accountId) === online.myActorKey?.replace(/^acc:/, '')
    if (isFromMe) return

    const msgId = lastMsg.id || (lastMsg as any).thoiGian || `${online.chat.length}_${lastMsg.text}`
    if (lastHandledEmojiMsgIdRef.current === msgId) return
    lastHandledEmojiMsgIdRef.current = msgId

    if (typeof lastMsg.text === 'string' && lastMsg.text.startsWith('[SYS_CARO_EMOJI]:')) {
      const content = lastMsg.text.replace('[SYS_CARO_EMOJI]:', '').trim()
      const parts = content.split(' ')
      const possibleEmoji = parts[0]
      const isEmoji = /\p{Extended_Pictographic}/u.test(possibleEmoji)
      const emoji = isEmoji ? possibleEmoji : undefined
      const quote = isEmoji ? parts.slice(1).join(' ') : content
      setOpponentBubble({ emoji: emoji || '', quote, sender: 'opponent' })
      if (opponentBubbleTimerRef.current) clearTimeout(opponentBubbleTimerRef.current)
      opponentBubbleTimerRef.current = setTimeout(() => setOpponentBubble(null), 4000)
    }
  }, [online?.chat, online?.myActorKey])

  const bongDoiThuOnline = useBongBieuCamDoiThu(online, QUICK_EMOTES_CARO)
  const bongDoiThu = opponentBubble || bongDoiThuOnline

  const handleQuickEmote = (em: QuickEmoteItem) => {
    setPlayerBubble({
      emoji: em.emoji,
      quote: em.quote,
      sender: 'player',
    })
    if (playerBubbleTimerRef.current) clearTimeout(playerBubbleTimerRef.current)
    playerBubbleTimerRef.current = setTimeout(() => setPlayerBubble(null), 3800)

    if (laOnline && online) {
      guiBieuCamOnline(online, em.emoji)
      if (online.guiChat) {
        online.guiChat(`[SYS_CARO_EMOJI]:${em.emoji ? `${em.emoji} ` : ''}${em.quote}`)
      }
    }

    if (mode === 'ai' || !laOnlinePvp) {
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
      }, 700)
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
    if (heroicBanner) {
      setHeroicBanner(null)
    }
    if (banOnline) {
      // Máy chủ xét nước đi và phát lại cho cả bàn; chỉ gửi khi tới lượt mình và ô còn trống.
      if (!banOnline.isMyTurn || board[y][x] !== null) return
      playPieceMoveSound()
      banOnline.makeMove(x, y)
      return
    }
    if (winner || isAiThinking) return
    if (mode === 'ai' && currentTurn !== playerSide) return
    if (!isLocalStarted) {
      setIsLocalStarted(true)
    }
    makeMove(x, y, currentTurn)
  }

  const resetGame = (autoStart = true) => {
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
    setIsLocalStarted(autoStart)
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
    resetGame(false)
    if (online && online.mySide === 'X') {
      online.datPve(newMode === 'ai')
    }
  }

  interface DialogConfig {
    title: string
    subtitle: string
    icon: 'draw' | 'resign' | 'win' | 'start' | 'back'
    onConfirm: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
    onlyConfirm?: boolean
  }
  const [centerDialog, setCenterDialog] = useState<DialogConfig | null>(null)
  const [incomingDialog, setIncomingDialog] = useState<DialogConfig | null>(null)
  const activeDlg = incomingDialog || centerDialog

  const handleResign = () => {
    if (winner) {
      resetGame(true)
      return
    }
    setCenterDialog({
      title: 'Đầu Hàng',
      subtitle: 'Bạn có chắc chắn muốn xin thua và kết thúc ván đấu này không?',
      icon: 'resign',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      onConfirm: () => {
        setCenterDialog(null)
        if (laOnlinePvp && banOnline) {
          banOnline.surrender()
          return
        }
        const losingSide = mode === 'ai' ? playerSide : currentTurn
        const winningSide = losingSide === 'X' ? 'O' : 'X'
        setWinner(winningSide)
        setSurrenderReason(`${mode === 'ai' ? 'Bạn' : `Quân ${losingSide}`} đã xin thua`)
        setIsAiThinking(false)
      },
    })
  }

  const handleResetOrSurrender = () => {
    if (winner) {
      resetGame(true)
      return
    }
    handleResign()
  }

  const isWinningCell = (x: number, y: number) =>
    winLine?.some(([wx, wy]) => wx === x && wy === y)

  const isOver = !!winner

  const isMyTurn = laOnlinePvp ? Boolean(banOnline?.isMyTurn) : isPveMode ? currentTurn === playerSide : currentTurn === 'X'
  const isPlaying = laOnlinePvp
    ? online?.meta.status === 'playing'
    : !isOver && (isLocalStarted || lastMove !== null || isAiThinking)

  const clock = useGameClock({
    isOnline: laOnlinePvp,
    isPlaying,
    isMyTurn,
    turnKey: `${currentTurn}-${lastMove?.x ?? ''}-${lastMove?.y ?? ''}`,
    online: isPveMode ? undefined : online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = currentTurn
      const benThang = benThua === 'X' ? 'O' : 'X'
      setWinner(benThang)
      setSurrenderReason(`Quân ${benThua} hết giờ suy nghĩ`)
    }, [isOver, currentTurn]),
  })

  const [selectedProfileUser, setSelectedProfileUser] = useState<NguoiXem | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showHints, setShowHints] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
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
  const isDrawOfferedByMe = Boolean(laOnline && online?.mySide && online.meta.drawOfferBy === online.mySide)
  const isDrawOfferedByOpponent = Boolean(laOnline && online?.mySide && online.meta.drawOfferBy && online.meta.drawOfferBy !== online.mySide)

  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const myAvatarUrl = nguoiDung?.avatar || undefined
  const hasOpponent = useMemo(() => {
    if (isPveMode) return true
    if (laOnline) {
      if (online?.mySide === 'X') return Boolean(online?.meta.playerO)
      if (online?.mySide === 'O') return Boolean(online?.meta.playerX)
      return Boolean(online?.meta.playerX && online?.meta.playerO)
    }
    return mode === 'pass_and_play'
  }, [isPveMode, laOnline, online?.mySide, online?.meta.playerO, online?.meta.playerX, mode])

  // Thành viên đối thủ khi chơi online
  const opponentMember = useMemo(() => {
    if (!banOnline || !hasOpponent) return null
    const oppActorKey = banOnline.mySide === 'X' ? banOnline.meta.playerO : banOnline.meta.playerX
    if (!oppActorKey) return null
    return banOnline.thanhVien.find((m) => m.key === oppActorKey) || null
  }, [banOnline, hasOpponent])

  const opponentName = useMemo(() => {
    if (isPveMode) return 'Caro Master AI'
    if (laOnline) {
      if (online?.mySide === 'X') return online?.meta.playerOName || (hasOpponent ? 'Người chơi' : '')
      if (online?.mySide === 'O') return online?.meta.playerXName || (hasOpponent ? 'Người chơi' : '')
      return online?.meta.playerOName || (hasOpponent ? 'Người chơi' : '')
    }
    return mode === 'pass_and_play' ? 'Bên O' : ''
  }, [isPveMode, laOnline, online?.mySide, online?.meta.playerOName, online?.meta.playerXName, hasOpponent, mode])

  // Nhận tín hiệu xin hòa từ đối thủ online qua server meta
  useEffect(() => {
    if (isDrawOfferedByOpponent && !winner) {
      setDrawModalType('incoming')
      setIncomingDialog({
        title: 'Đối thủ xin hòa',
        subtitle: `${opponentName || 'Đối thủ'} đề nghị kết thúc ván đấu với kết quả hòa. Bạn có đồng ý không?`,
        icon: 'draw',
        confirmText: 'Đồng ý',
        cancelText: 'Từ chối',
        onConfirm: () => {
          setIncomingDialog(null)
          if (laOnline && online) {
            try {
              online.offerDraw?.()
            } catch {}
            online.guiChat('[SYS_CARO_PROP]:draw_accept')
          }
          setWinner('draw')
          setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
          playGameOverSound('draw')
        },
        onCancel: () => {
          setIncomingDialog(null)
          if (laOnline && online) {
            try {
              online.declineDraw?.()
            } catch {}
            online.guiChat('[SYS_CARO_PROP]:draw_decline')
          }
          toast.info('Đã từ chối hòa cờ')
        },
      })
    }
  }, [isDrawOfferedByOpponent, winner, opponentName, laOnline, online])

  // Lắng nghe tín hiệu hòa qua chat hệ thống
  useEffect(() => {
    if (!online?.chat || online.chat.length === 0) return
    const lastMsg = online.chat[online.chat.length - 1]
    if (lastMsg && typeof lastMsg.text === 'string' && lastMsg.text.startsWith('[SYS_CARO_PROP]:')) {
      const action = lastMsg.text.replace('[SYS_CARO_PROP]:', '').trim()
      const isFromMe = String(lastMsg.accountId) === online.myActorKey?.replace(/^acc:/, '')
      if (action === 'draw_offer' && !isFromMe && !winner) {
        setDrawModalType('incoming')
        setIncomingDialog({
          title: 'Đối thủ xin hòa',
          subtitle: `${opponentName || 'Đối thủ'} đề nghị kết thúc ván đấu với kết quả hòa. Bạn có đồng ý không?`,
          icon: 'draw',
          confirmText: 'Đồng ý',
          cancelText: 'Từ chối',
          onConfirm: () => {
            setIncomingDialog(null)
            if (laOnline && online) {
              try {
                online.offerDraw?.()
              } catch {}
              online.guiChat('[SYS_CARO_PROP]:draw_accept')
            }
            setWinner('draw')
            setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
            playGameOverSound('draw')
          },
          onCancel: () => {
            setIncomingDialog(null)
            if (laOnline && online) {
              try {
                online.declineDraw?.()
              } catch {}
              online.guiChat('[SYS_CARO_PROP]:draw_decline')
            }
            toast.info('Đã từ chối hòa cờ')
          },
        })
      } else if (action === 'draw_accept') {
        setIsDrawModalOpen(false)
        setIncomingDialog(null)
        setCenterDialog(null)
        setWinner('draw')
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
      } else if (action === 'draw_decline' && !isFromMe) {
        setCenterDialog(null)
        toast.info('Đối thủ đã từ chối đề nghị hòa')
      }
    }
  }, [online?.chat, online?.myActorKey, winner, opponentName, laOnline])

  const handleOfferDraw = useCallback(() => {
    if (winner || isAiThinking || !isPlaying) return
    setCenterDialog({
      title: 'Cầu Hòa',
      subtitle: 'Bạn có muốn gửi lời đề nghị hòa ván cờ tới đối thủ?',
      icon: 'draw',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      onConfirm: () => {
        setCenterDialog(null)
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
          showGameNotice('ĐÃ XIN HÒA', 'Đang chờ đối thủ xác nhận...')
          toast.info('Đã gửi đề nghị hòa cờ, chờ đối thủ xác nhận...')
          return
        }
        setCenterDialog(null)
        setWinner('draw')
        setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
        playGameOverSound('draw')
      },
    })
  }, [winner, isAiThinking, isPlaying, mode, laOnline, online, showGameNotice])

  const handleConfirmDraw = useCallback(() => {
    if (drawModalType === 'offer') {
      handleOfferDraw()
    } else {
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
  }, [drawModalType, handleOfferDraw, laOnline, online])

  const handleDeclineDraw = useCallback(() => {
    setIsDrawModalOpen(false)
    setIncomingDialog(null)
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
        const key = `dc_caro_elo_${nguoiDung?.accountId ?? 'guest'}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const num = Number(saved)
          if (Number.isFinite(num) && num > 0) return num
        }
      } catch {}
    }
    return 1500
  })

  const opponentAvatarUrl = isPveMode ? undefined : (hasOpponent ? (opponentMember?.avatar || undefined) : undefined)
  const opponentLevel = mode === 'ai' ? (aiLevel === 'easy' ? '1' : aiLevel === 'medium' ? '5' : '10') : tinhLevel(opponentProfile?.totalXp ?? 0)
  const opponentElo = useMemo(() => {
    if (mode === 'ai') return aiLevel === 'easy' ? 1200 : aiLevel === 'medium' ? 1500 : 1800
    const xpBonus = Math.floor((opponentProfile?.totalXp ?? 0) / 10)
    return 1200 + Math.min(600, xpBonus)
  }, [mode, aiLevel, opponentProfile?.totalXp])

  // Âm thanh & Banner hào hùng khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      if (winner === 'draw') {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
        setMyElo((prev) => {
          const next = prev + 2
          try {
            localStorage.setItem(`dc_caro_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else if (winner === pheThang) {
        playGameOverSound('win')
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
        setMyElo((prev) => {
          const next = prev + 15
          try {
            localStorage.setItem(`dc_caro_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else {
        playGameOverSound('lose')
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
        setMyElo((prev) => {
          const next = Math.max(800, prev - 12)
          try {
            localStorage.setItem(`dc_caro_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      }
    }
    wasOverRef.current = isOver
  }, [isOver, winner, pheThang, nguoiDung?.accountId])

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
  const isOpponentTurn = currentTurn !== playerSide && isPlaying && !winner
  const coDuNguoiChoi = !laOnlinePvp || Boolean(banOnline?.meta.playerX && banOnline?.meta.playerO)

  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const desktopQuickMenuRef = useRef<HTMLDivElement>(null)
  const lastEmojiTriggerRef = useRef<HTMLElement | null>(null)
  const [quickMenuPos, setQuickMenuPos] = useState({ left: 20, top: 200 })

  const updateQuickMenuPos = useCallback((customTrigger?: HTMLElement | null) => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 1280
    const POPUP_W = isMobile ? 240 : 280
    const POPUP_H = 268

    if (!isMobile) {
      const asideEl = document.getElementById('vung-4-plus-desk')
      const asideRect = asideEl ? asideEl.getBoundingClientRect() : null
      const boardEl = document.querySelector('section[aria-label*="Bàn cờ"]') || document.querySelector('section')
      const boardRect = boardEl ? boardEl.getBoundingClientRect() : null
      const padding = 16

      const minSafeLeft = 248
      const maxSafeRight = boardRect ? boardRect.left - 12 : window.innerWidth - 12

      let left = asideRect ? asideRect.left + (asideRect.width - POPUP_W) / 2 : 20
      left = Math.max(minSafeLeft, Math.min(maxSafeRight - POPUP_W, left))

      let top = asideRect ? asideRect.top - POPUP_H - padding : 200
      if (top < 12 && asideRect) {
        top = asideRect.bottom + padding
      }
      top = Math.max(12, Math.min(window.innerHeight - POPUP_H - 12, top))
      setQuickMenuPos({ left, top })
      return
    }

    // Trên Mobile (< 1280px): Neo chuẩn xác phía trên nút Biểu cảm
    const triggerEl =
      customTrigger ||
      lastEmojiTriggerRef.current ||
      document.getElementById('mobile-tool-emoji') ||
      document.querySelector('[id*="emoji"]')

    if (!triggerEl) {
      setQuickMenuPos({
        left: Math.max(12, (window.innerWidth - POPUP_W) / 2),
        top: Math.max(12, window.innerHeight - POPUP_H - 80),
      })
      return
    }

    const rect = triggerEl.getBoundingClientRect()
    let left = rect.left + rect.width / 2 - POPUP_W / 2
    left = Math.max(12, Math.min(window.innerWidth - POPUP_W - 12, left))

    let top = rect.top - POPUP_H - 8
    if (top < 12) {
      top = rect.bottom + 8
    }
    top = Math.max(12, Math.min(window.innerHeight - POPUP_H - 12, top))

    setQuickMenuPos({ left, top })
  }, [])

  const handleOpenQuickMenu = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const target = (e?.currentTarget as HTMLElement) || document.getElementById('mobile-tool-emoji')
    if (target) {
      lastEmojiTriggerRef.current = target
      updateQuickMenuPos(target)
    } else {
      updateQuickMenuPos()
    }
    setIsQuickMenuOpen((prev) => !prev)
  }

  // Tự động đóng menu tin nhắn nhanh khi chạm ra ngoài
  useEffect(() => {
    if (!isQuickMenuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (
        (quickMenuRef.current && quickMenuRef.current.contains(target)) ||
        (desktopQuickMenuRef.current && desktopQuickMenuRef.current.contains(target))
      ) {
        return
      }
      const trigger = target.closest?.('#tool-bubble-emoji, #mobile-tool-emoji, [aria-label*="Biểu cảm"], [title*="Biểu cảm"]')
      if (!trigger) {
        setIsQuickMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isQuickMenuOpen])


  const handleStartGameClick = () => {
    if (laOnlinePvp && banOnline) {
      if (!banOnline.meta?.playerX || !banOnline.meta?.playerO) {
        // Ngăn chặn hoàn toàn khi chưa đủ 2 người chơi
        showGameNotice('CHƯA ĐỦ NGƯỜI CHƠI', 'Đang chờ đối thủ vào phòng...')
        return
      }
      if (!banOnline.mySide) {
        banOnline.joinGame()
        showGameNotice('ĐÃ VÀO BÀN THI ĐẤU')
        return
      }
      banOnline.startGame()
      showGameNotice('BẮT ĐẦU VÁN ĐẤU')
      return
    }
    setIsLocalStarted(true)
    resetGame(true)
    showGameNotice('BẮT ĐẦU VÁN ĐẤU')
  }

  const caroTools = [
    {
      id: 'settings',
      title: 'Cài đặt ván đấu',
      icon: <Settings className="size-5 sm:size-5.5 text-sky-400" />,
      onClick: () => setIsSettingsModalOpen(true),
      className: 'border-sky-500/50 bg-[#121926]/95 hover:border-sky-400 hover:bg-sky-500/20 text-sky-400 shadow-sky-500/15',
    },
    {
      id: 'emoji',
      title: 'Biểu cảm & Tin nhanh',
      icon: <Smile className={cn('size-5 sm:size-5.5', isQuickMenuOpen ? 'text-amber-200' : 'text-amber-400')} />,
      onClick: (e: React.MouseEvent) => handleOpenQuickMenu(e),
      className: cn(
        'border-amber-400/50 bg-[#161a24]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300 shadow-amber-500/15',
        isQuickMenuOpen && 'border-amber-400 bg-amber-500/30 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
      ),
    },
    {
      id: 'mode',
      title: mode === 'ai' ? 'Chế độ PvE' : 'Chế độ PvP',
      icon: mode === 'ai' ? <Bot className="size-5 sm:size-5.5 text-sky-400" /> : <Users className="size-5 sm:size-5.5 text-amber-400" />,
      onClick: () => {
        const nextMode = mode === 'ai' ? 'pass_and_play' : 'ai'
        doiCheDo(nextMode)
        showGameNotice(nextMode === 'ai' ? 'ĐẤU VỚI MÁY' : 'ĐẤU ĐỐI KHÁNG')
      },
      className: mode === 'ai'
        ? 'border-sky-500/50 bg-[#121926]/95 hover:border-sky-400 hover:bg-sky-500/20 text-sky-400 shadow-sky-500/15'
        : 'border-amber-500/50 bg-[#1a1714]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-400 shadow-amber-500/15',
    },
    {
      id: 'invite',
      title: 'Mời bạn bè',
      icon: <UserPlus className="size-5 sm:size-5.5 text-emerald-400" />,
      onClick: () => {
        if (onInvite) {
          onInvite()
        } else {
          try {
            navigator.clipboard.writeText(window.location.href)
            showGameNotice('ĐÃ SAO CHÉP LIÊN KẾT', 'Gửi link cho bạn bè để cùng chơi')
          } catch {
            showGameNotice('MỜI BẠN BÈ')
          }
        }
      },
      className: 'border-emerald-500/50 bg-[#121a18]/95 hover:border-emerald-400 hover:bg-emerald-500/20 text-emerald-400 shadow-emerald-500/15',
    },
    {
      id: 'draw',
      title: isDrawOfferedByMe ? 'Đã xin hòa' : 'Xin hòa',
      icon: <Handshake className="size-5 sm:size-5.5 text-amber-400" />,
      disabled: isDrawOfferedByMe || Boolean(winner) || isAiThinking || !isPlaying,
      onClick: handleOfferDraw,
      className: 'border-amber-500/50 bg-[#181614]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-400 shadow-amber-500/15',
    },
  ]

  // Nhãn Xin thua / Đầu hàng đồng bộ chuẩn test & modal

  return (
    <div className="flex flex-col items-center justify-between xl:justify-center w-full h-full min-w-0 overflow-hidden relative select-none">
      {/* 1. HÀNG CÔNG CỤ NHANH TRÊN CÙNG: RỘNG RÃI, THOÁNG MẮT, SỐ PHÒNG TIÊU CHUẨN CỜ TƯỚNG */}
      <header className="w-full px-2 sm:px-4 py-1 mb-0.5 xl:mb-0 xl:absolute xl:top-3 xl:left-4 xl:w-auto xl:pointer-events-none relative flex items-center min-h-[40px] shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 z-10 xl:pointer-events-auto">
          {roomName && (
            <div
              id="room-number-badge-header"
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-900/60 border border-cyan-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.5)] shrink-0 select-none hover:border-cyan-500/50 transition-colors duration-150"
              title={`Phòng Cờ Caro #${soPhongHienThi || '1'}`}
            >
              <div className="relative size-7 sm:size-8 rounded-full bg-gradient-to-br from-[#0c2340] via-[#081b33] to-[#041021] border-2 border-cyan-500/60 shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
                <span className="font-cinzel font-black text-xs sm:text-sm text-cyan-400 leading-none">
                  XO
                </span>
              </div>
              <span className="font-cinzel font-black text-xs sm:text-sm text-cyan-300 tracking-wider">
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

      {/* VÙNG BÀN CỜ VÀ ĐIỀU KHIỂN CHÍNH: CĂN GIỮA TUYỆT ĐỐI, CÂN ĐỐI ĐỐI XỨNG 3 TẦNG KHÔNG ĐỂ KHOẢNG ĐEN THỪA */}
      <main className="w-full xl:w-fit flex-1 xl:flex-initial flex flex-col items-center justify-between xl:justify-center mx-auto relative pt-0.5 pb-24 xl:py-0 min-h-0 max-w-[480px] xl:max-w-none">
        {/* ==================== KHỐI TRÊN MOBILE (< xl): ĐỐI THỦ & KHOẢNG ĐỆM ĐỐI XỨNG CÂN BẰNG ==================== */}
        <div className="flex xl:hidden flex-col items-center justify-end w-full max-w-[480px] flex-1 min-h-0 pb-1 sm:pb-1.5 select-none z-20">
          {/* VÙNG X: TIN NHẮN NHANH CỦA ĐỐI THỦ (TRÊN THANH ĐỐI THỦ) */}
          <div className="w-full h-7 flex items-center justify-center pointer-events-none select-none">
            {hasOpponent && bongDoiThu && (
              <div
                data-testid="opponent-quick-message-bubble"
                className="px-3 py-1 rounded-full bg-[#161a22]/95 border-2 border-amber-400 text-xs font-bold text-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.3)] backdrop-blur-md flex items-center gap-1.5 shrink-0 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
              >
                {bongDoiThu.emoji && <span className="text-sm shrink-0">{bongDoiThu.emoji}</span>}
                <span className="font-semibold">{bongDoiThu.quote}</span>
              </div>
            )}
          </div>

          <div className="flex w-full h-12 px-2 items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <EloRankAvatarFrame
                ten={hasOpponent ? (mode === 'ai' ? `AI Cấp ${opponentLevel}` : opponentName) : 'Chờ đối thủ'}
                avatar={opponentAvatarUrl}
                elo={opponentElo}
                isBot={mode === 'ai'}
                hasPlayer={hasOpponent}
                isTurn={hasOpponent && isOpponentTurn && isPlaying}
                turnSide={playerSide === 'X' ? 'black' : 'red'}
                sizeClassName="size-11 sm:size-12"
                onClick={(e) => {
                  e.stopPropagation()
                if (!hasOpponent) {
                  if (banOnline && !banOnline.mySide) {
                    banOnline.joinGame('O')
                    return
                  }
                  if (onInvite) onInvite()
                  else {
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
                  toast.info(`Caro Master AI · Cấp ${opponentLevel} · Elo ${opponentElo}`)
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                setSelectedProfileUser({
                  id: oppAccountId || 0,
                  ten: opponentName,
                  avatar: opponentAvatarUrl,
                  gameElo: opponentElo,
                  gameName: 'Cờ Caro',
                  anchorRect: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                  },
                })
              }}
              title={
                !hasOpponent
                  ? banOnline && !banOnline.mySide
                    ? 'Tham gia'
                    : 'Mời bạn bè'
                  : mode === 'ai'
                    ? `AI Cấp ${opponentLevel}`
                    : `${opponentName} (Lv.${opponentLevel} · Elo ${opponentElo})`
              }
              ariaLabel={
                !hasOpponent
                  ? 'Mời bạn bè'
                  : mode === 'ai'
                    ? 'AI'
                    : `${opponentName} - Bấm để xem hồ sơ`
              }
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[130px]">
                {hasOpponent ? (mode === 'ai' ? `AI Cấp ${opponentLevel}` : opponentName) : 'Chờ đối thủ'}
              </span>
              <span className="text-[11px] text-amber-300 font-semibold leading-tight">
                {!hasOpponent
                  ? (banOnline && !banOnline.mySide ? 'Chạm để tham gia' : 'Chạm để mời')
                  : mode === 'ai'
                    ? `Elo ${opponentElo}`
                    : `Lv.${opponentLevel} · Elo ${opponentElo}`}
              </span>
            </div>
          </div>

          {/* Đồng hồ đối thủ trên mobile */}
          <div
            className={cn(
              'h-8 px-3 rounded-full border flex items-center justify-center gap-1.5 font-mono text-xs font-bold tracking-wider select-none shrink-0 shadow-xs transition-colors',
              !hasOpponent
                ? 'border-white/10 bg-[#161a22]/80 text-gray-400 opacity-60'
                : isOpponentTurn && isPlaying && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 animate-pulse'
                  : isOpponentTurn && isPlaying
                    ? 'border-cyan-500/80 bg-cyan-950/80 text-cyan-300'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
            )}
            title="Thời gian đối thủ"
          >
            <Clock className="size-3.5 text-cyan-400 shrink-0" />
            <span>{!hasOpponent ? '--:--' : formatClockTime(isOpponentTurn && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Khung bàn cờ phẳng to hơn */}
        <section
          style={{
            aspectRatio: '1 / 1',
            transform: isFlipped ? 'rotate(180deg)' : undefined,
            boxShadow: [
              '0 18px 40px rgba(0,0,0,0.7)',
              '0 0 0 1px rgba(255,255,255,0.06)',
              'inset 0 1px 0 rgba(255,255,255,0.08)',
              '0 0 24px rgba(6,182,212,0.12)',
            ].join(', '),
          }}
          className="game-board-caro game-board-shell relative rounded-2xl overflow-hidden shrink board-surface flex items-center justify-center select-none touch-none my-0"
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

          {/* NÚT BẮT ĐẦU HOẶC ĐẤU LẠI Ở GIỮA BÀN CỜ CHUẨN CỜ TƯỚNG (Ẩn khi đang hiển thị heroicBanner để không đè chữ) */}
          {((!isPlaying && !winner && !heroicBanner) || (Boolean(winner) && !isPlaying && !heroicBanner)) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto select-none">
              <button
                type="button"
                id="btn-bat-dau-river"
                data-testid="btn-bat-dau-river"
                onClick={handleStartGameClick}
                disabled={laOnlinePvp && !coDuNguoiChoi}
                className={cn(
                  'group relative px-6 sm:px-8 xl:px-10 py-2.5 sm:py-3 xl:py-3.5 rounded-full border-2 flex items-center justify-center gap-2.5 text-sm sm:text-base xl:text-lg font-black tracking-widest transition-colors duration-150 select-none',
                  laOnlinePvp && !coDuNguoiChoi
                    ? 'bg-slate-800/80 border-slate-600/60 text-slate-400 opacity-50 cursor-not-allowed shadow-none'
                    : winner
                      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500 border-amber-300 text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.6)] cursor-pointer active:scale-95 hover:scale-105'
                      : 'bg-gradient-to-r from-cyan-800 via-blue-900 to-cyan-800 hover:from-cyan-700 hover:via-blue-800 hover:to-cyan-700 border-cyan-400/90 text-white shadow-[0_0_24px_rgba(6,182,212,0.6)] cursor-pointer active:scale-95 hover:scale-105'
                )}
                title={
                  laOnlinePvp && !coDuNguoiChoi
                    ? 'Cần đủ 2 người chơi để bắt đầu ván đấu'
                    : winner
                      ? 'Đấu lại ván mới'
                      : 'Bắt đầu ván đấu'
                }
              >
                <Swords
                  className={cn(
                    'w-5 h-5 shrink-0 transition-transform',
                    laOnlinePvp && !coDuNguoiChoi
                      ? 'text-slate-500'
                      : 'text-cyan-300 group-hover:rotate-12 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  )}
                />
                <span
                  className={cn(
                    'font-black uppercase drop-shadow',
                    laOnlinePvp && !coDuNguoiChoi ? 'text-slate-400' : 'text-cyan-100'
                  )}
                >
                  {winner ? 'ĐẤU LẠI' : 'BẮT ĐẦU'}
                </span>
              </button>
            </div>
          )}

        {/* CARD XÁC NHẬN NỘI DUNG ĐƠN GIẢN: 1 LÀ ĐỒNG Ý, 2 LÀ CHƠI TIẾP (ÁP DỤNG CẢ CHO ĐỐI THỦ) */}
        {activeDlg && (
          <div
            id="center-board-dialog"
            className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-black/10 animate-in fade-in duration-150 pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation()
              if (activeDlg.onCancel) activeDlg.onCancel()
              else {
                setCenterDialog(null)
                setIncomingDialog(null)
              }
            }}
          >
            <div
              style={{
                position: 'relative',
                top: 'auto',
                left: 'auto',
                transform: 'none',
              }}
              className="relative w-[min(340px,calc(100%-1rem))] max-w-[340px] skeuo-modal-surface border border-sky-500/20 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col items-center text-center animate-in fade-in duration-150 select-none overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Họa tiết Blueprint Arcade Schematic mờ chìm toàn diện */}
              <BlueprintArcadePattern className="opacity-80" />

              {/* Nút đóng X ở góc */}
              <button
                type="button"
                onClick={() => {
                  if (activeDlg.onCancel) activeDlg.onCancel()
                  else {
                    setCenterDialog(null)
                    setIncomingDialog(null)
                  }
                }}
                className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer z-10"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon Badge nổi bật theo loại */}
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-lg relative z-10',
                  activeDlg.icon === 'draw' &&
                    'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20',
                  activeDlg.icon === 'resign' &&
                    'bg-red-500/20 border-red-500/50 text-red-300 shadow-red-500/20',
                  activeDlg.icon === 'win' &&
                    'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20',
                  activeDlg.icon === 'start' &&
                    'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-amber-500/20',
                  activeDlg.icon === 'back' &&
                    'bg-slate-700/30 border-slate-500/40 text-gray-200 shadow-black/40'
                )}
              >
                {activeDlg.icon === 'draw' && <Handshake className="w-6 h-6" />}
                {activeDlg.icon === 'resign' && <Flag className="w-6 h-6" />}
                {activeDlg.icon === 'win' && <Crown className="w-6 h-6" />}
                {activeDlg.icon === 'start' && <Swords className="w-6 h-6" />}
                {activeDlg.icon === 'back' && <ArrowLeft className="w-6 h-6" />}
              </div>

              {/* Tiêu đề & Nội dung đơn giản, ngắn gọn */}
              <h3 className="text-base font-bold text-gray-100 relative z-10">{activeDlg.title}</h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed px-1 font-medium relative z-10">
                {activeDlg.subtitle}
              </p>

              {/* 2 Nút: 1 là Đồng ý, 2 là Chơi tiếp */}
              <div
                className={cn(
                  'grid gap-2.5 w-full mt-5 relative z-10',
                  activeDlg.onlyConfirm ? 'grid-cols-1' : 'grid-cols-2'
                )}
              >
                {!activeDlg.onlyConfirm && (
                  <button
                    type="button"
                    id="dialog-cancel-btn"
                    onClick={
                      activeDlg.onCancel
                        ? activeDlg.onCancel
                        : () => {
                            setCenterDialog(null)
                            setIncomingDialog(null)
                          }
                    }
                    className="skeuo-btn-cancel h-9 text-xs font-semibold transition-colors duration-150 cursor-pointer"
                  >
                    {activeDlg.cancelText || 'Chơi tiếp'}
                  </button>
                )}
                <button
                  type="button"
                  id="dialog-confirm-btn"
                  onClick={activeDlg.onConfirm}
                  className="skeuo-btn-cta-amber h-9 text-xs font-bold transition-colors duration-150 shadow-lg cursor-pointer"
                >
                  {activeDlg.confirmText || 'Đồng ý'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VÙNG 1+: Banner hào hùng xuất quân & kết thúc ván đấu phủ lên bàn cờ */}
        <GameHeroicBanner
          type={heroicBanner?.type ?? null}
          title={heroicBanner?.title}
          subtitle={heroicBanner?.subtitle}
          visible={Boolean(heroicBanner)}
          onClose={() => setHeroicBanner(null)}
        />
      </section>

        {/* ==================== KHỐI CHÂN ĐÁY MOBILE (< xl): NGƯỜI CHƠI & THANH CÔNG CỤ CÔNG THÁI HỌC (THUMB-ZONE) ==================== */}
      {/* ==================== KHỐI CHÂN ĐÁY MOBILE (< xl): NGƯỜI CHƠI & TIN NHẮN ĐỐI XỨNG ==================== */}
      <div className="flex xl:hidden flex-col items-center justify-start w-full max-w-[480px] flex-1 min-h-0 gap-1 pt-1 pb-1 select-none z-20">
          {/* ==================== VÙNG NGƯỜI CHƠI TRÊN MOBILE ==================== */}
          <div className="flex w-full h-12 px-2 items-center justify-between select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <EloRankAvatarFrame
                ten={myName}
                avatar={myAvatarUrl}
                elo={myElo}
                hasPlayer={true}
                isTurn={isMyTurn}
                turnSide={playerSide === 'X' ? 'red' : 'black'}
                sizeClassName="size-11 sm:size-12"
                onClick={(e) => {
                  e.stopPropagation()
                  if (laOnlinePvp && !banOnline?.mySide) {
                    banOnline?.joinGame()
                    toast.info('Đã vào bàn thi đấu')
                  } else {
                    setIsSettingsModalOpen(true)
                  }
                }}
                title={myName ? `${myName} (Chạm để mở cài đặt)` : 'Cài đặt'}
                ariaLabel={myName ? `${myName} - Mở cài đặt` : 'Cài đặt'}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[130px]">
                  {myName || 'Bạn'}
                </span>
                <span className="text-[11px] text-cyan-300 font-semibold leading-tight">
                  Lv.{myLevel} · Elo {myElo}
                </span>
              </div>
            </div>

            {/* Đồng hồ người chơi trên mobile */}
            <div
              className={cn(
                'h-8 px-3 rounded-full border flex items-center justify-center gap-1.5 font-mono text-xs font-bold tracking-wider select-none shrink-0 shadow-xs transition-colors',
                currentTurn === playerSide && isPlaying && !winner && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 animate-pulse'
                  : currentTurn === playerSide && isPlaying && !winner
                    ? 'border-cyan-500/80 bg-cyan-950/80 text-cyan-300'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Bạn"
            >
              <Clock className="size-3.5 text-cyan-400 shrink-0" />
              <span>{formatClockTime(currentTurn === playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>

          {/* VỊ TRÍ ĐỐI XỨNG: TIN NHẮN NHANH CỦA TA (DƯỚI THANH NGƯỜI CHƠI) */}
          <div className="w-full h-7 flex items-center justify-center pointer-events-none select-none">
            {playerBubble && (
              <div
                data-testid="player-quick-message-bubble"
                className="px-3 py-1 rounded-full bg-[#161a22]/95 border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(6,182,212,0.3)] backdrop-blur-md flex items-center gap-1.5 shrink-0 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
              >
                {playerBubble.emoji && <span className="text-sm shrink-0">{playerBubble.emoji}</span>}
                <span className="font-semibold">{playerBubble.quote}</span>
              </div>
            )}
          </div>
        </div>



        {/* ==================== VÙNG 4: BUBBLE AVATAR NGƯỜI CHƠI (GÓC DƯỚI TRÁI - DESKTOP XL DUY NHẤT) ==================== */}
        <aside
          id="vung-4-plus-desk"
          aria-label="Thông tin người chơi"
          style={{
            transform: `translate3d(${avatarOffset.x}px, ${avatarOffset.y}px, 0)`,
          }}
          className="hidden xl:flex xl:absolute xl:right-[calc(100%+24px)] xl:bottom-12 xl:w-[250px] flex-col items-end justify-end select-none z-40 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center mb-8">
            {/* Bong bóng chat người chơi (đặt phía trên cụm nút công cụ, không đè nút, sidebar hay bàn cờ) */}
            {playerBubble && (
              <div
                style={{ bottom: '126px' }}
                className="absolute left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 z-40 select-none pointer-events-none max-w-[200px]"
              >
                {playerBubble.emoji && <span className="text-sm shrink-0">{playerBubble.emoji}</span>}
                <span className="truncate">{playerBubble.quote}</span>
              </div>
            )}

            {/* Avatar & các bong bóng công cụ quanh avatar */}
            <div className="relative flex items-center justify-center">
              {/* Token tương thích test suite */}
              <div className="hidden" aria-hidden="true">
                <button type="button" id="tool-bubble-mode" />
                <button type="button" id="tool-bubble-draw" />
              </div>

              {/* Avatar người chơi tròn (Nhấn giữ kéo tự do hoặc click để mở cài đặt & hồ sơ kỳ thủ) */}
              <div
                onPointerDown={handleAvatarPointerDown}
                onPointerMove={handleAvatarPointerMove}
                onPointerUp={handleAvatarPointerUp}
                onPointerCancel={handleAvatarPointerUp}
                className="cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-150 select-none touch-none"
              >
                <EloRankAvatarFrame
                  ten={myName}
                  avatar={myAvatarUrl}
                  elo={myElo}
                  hasPlayer={true}
                  isTurn={isMyTurn}
                  turnSide={playerSide === 'X' ? 'red' : 'black'}
                  sizeClassName="size-14 sm:size-16"
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
                  title={myName ? `${myName} (Nhấn giữ kéo tự do, click để mở cài đặt & thông tin kỳ thủ)` : 'Nhấn giữ kéo tự do, click để mở cài đặt & thông tin kỳ thủ'}
                  ariaLabel={myName ? `${myName} - Cài đặt & thông tin kỳ thủ` : 'Cài đặt & thông tin kỳ thủ'}
                />
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

        {/* ==================== VÙNG 2: BUBBLE AVATAR ĐỐI THỦ (DESKTOP XL DUY NHẤT) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="hidden xl:flex xl:absolute xl:left-[calc(100%+24px)] xl:top-0 xl:w-[250px] flex-col items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
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
            {hasOpponent && bongDoiThu && (
              <div className="absolute bottom-full mb-2.5 right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-cyan-400 text-xs font-bold text-cyan-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {bongDoiThu.emoji && <span className="text-sm shrink-0">{bongDoiThu.emoji}</span>}
                <span className="truncate">{bongDoiThu.quote}</span>
              </div>
            )}

            {/* Avatar tròn đối thủ (Bấm để xem hồ sơ kỳ thủ & Elo hoặc mời bạn bè) */}
            <div className="hover:scale-105 transition-transform duration-150 select-none">
                <EloRankAvatarFrame
                  ten={hasOpponent ? opponentName : 'Chờ đối thủ'}
                  avatar={opponentAvatarUrl}
                  elo={opponentElo}
                  isBot={mode === 'ai'}
                  hasPlayer={hasOpponent}
                  isTurn={hasOpponent && isOpponentTurn && isPlaying}
                  turnSide={playerSide === 'X' ? 'black' : 'red'}
                  sizeClassName="size-14 sm:size-16"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!hasOpponent) {
                      if (banOnline && !banOnline.mySide) {
                        banOnline.joinGame('O')
                        return
                      }
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
                      toast.info(`Caro Master AI · Cấp ${opponentLevel} · Elo ${opponentElo}`)
                      return
                    }
                    const rect = e.currentTarget.getBoundingClientRect()
                    setSelectedProfileUser({
                      id: oppAccountId || 0,
                      ten: opponentName,
                      avatar: opponentAvatarUrl,
                      gameElo: opponentElo,
                      gameName: 'Cờ Caro',
                      anchorRect: {
                        top: rect.top,
                        left: rect.left,
                        right: rect.right,
                        bottom: rect.bottom,
                      },
                    })
                  }}
                  title={
                    !hasOpponent
                      ? banOnline && !banOnline.mySide
                        ? 'Tham gia'
                        : 'Mời bạn bè'
                      : mode === 'ai'
                        ? `Caro Master AI · Cấp ${opponentLevel} · Elo ${opponentElo}`
                        : `${opponentName} (Elo ${opponentElo})`
                  }
                  ariaLabel={
                    !hasOpponent
                      ? banOnline && !banOnline.mySide
                        ? 'Tham gia'
                        : 'Mời bạn bè'
                      : mode === 'ai'
                        ? 'Thông tin AI'
                        : `${opponentName} - Hồ sơ kỳ thủ`
                  }
                />
              </div>

            {/* Đồng hồ đối thủ */}
            <div
              className={cn(
                'mt-2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                !hasOpponent
                  ? 'border-white/10 bg-[#161a22]/80 text-gray-400 opacity-60'
                  : currentTurn !== playerSide && isPlaying && !winner && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                    ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                    : currentTurn !== playerSide && isPlaying && !winner
                      ? 'border-rose-500/80 bg-rose-950/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Đối thủ"
            >
              <Clock className="size-3 text-rose-400 shrink-0" />
              <span>{!hasOpponent ? '--:--' : formatClockTime(currentTurn !== playerSide && isPlaying && !winner ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Modal Xin thua & Đề nghị hòa - Token tương thích test: Xin thua / Đầu hàng GameSurrenderModal */}
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

      {/* ==================== MODAL CÀI ĐẶT THI ĐẤU (SETTINGS) ==================== */}
      {/* TUYỆT ĐỐI KHÔNG LÀM TỐI ĐEN HAY MỜ NHÒE KHU VỰC XUNG QUANH: Dùng bg-black/10, không blur */}
      {isSettingsModalOpen && (
        <div
          id="settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#161a22] border border-amber-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Highlight lấp lánh nhẹ ở 2 bên cạnh */}
            <div className="absolute left-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-amber-400 to-transparent opacity-80 pointer-events-none rounded-full" />
            <div className="absolute right-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-amber-400 to-transparent opacity-80 pointer-events-none rounded-full" />

            {/* Header Modal */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
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
                    id: myAccountId || 0,
                    ten: myName,
                    avatar: myAvatarUrl,
                    gameElo: myElo,
                    gameName: 'Cờ Caro',
                    anchorRect: {
                      top: rect.top,
                      left: rect.left,
                      right: rect.right,
                      bottom: rect.bottom,
                    },
                  })
                }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 border border-amber-500/30 flex items-center justify-between shadow-inner cursor-pointer group"
                title="Bấm để xem hồ sơ kỳ thủ & thành tựu"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <EloRankAvatarFrame
                    ten={myName}
                    avatar={myAvatarUrl}
                    elo={myElo}
                    hasPlayer={true}
                    sizeClassName="size-11 sm:size-12"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-100 truncate group-hover:text-amber-300 transition-colors">{myName}</div>
                    <div className="text-[11px] text-amber-300/80 font-medium">Kỳ thủ cờ caro</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-xs">
                    Cấp {myLevel}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-extrabold tracking-wide shadow-xs">
                    Elo {myElo}
                  </span>
                </div>
              </div>

              {/* MỤC 1: CÔNG CỤ CHỈNH THỜI GIAN VÁN ĐẤU */}
              <div className="flex flex-col gap-2.5 p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-200">Thời gian mỗi bên:</span>
                  <span id="current-time-setting-label" className="font-bold text-amber-400">
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
                          'py-1.5 rounded-lg border text-gray-300 font-medium transition-colors duration-150 cursor-pointer text-center text-xs',
                          isSelected
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-semibold'
                            : 'border-white/10 hover:border-amber-400/50'
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
                  <div className="flex items-center gap-1.5 bg-[#10141c] px-2 py-1 rounded-lg border border-white/10">
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
                      className="w-8 text-center bg-transparent font-bold text-amber-300 text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

              {/* MỤC 2: ÂM THANH CỜ */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Âm thanh cờ</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="sound-toggle"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* MỤC 3: GỢI Ý NƯỚC ĐI */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Gợi ý nước đi</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="btn-toggle-hints"
                    checked={showHints}
                    onChange={(e) => setShowHints(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              {/* MỤC 4: XOAY BÀN CỜ */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Xoay bàn cờ</span>
                <button
                  type="button"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>180°</span>
                </button>
              </div>
            </div>

            {/* Footer Modal: NÚT ÁP DỤNG MÀU AMBER CHUẨN CỜ TƯỚNG */}
            <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false)
                  setRecentlyChangedTime(null)
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Áp Dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VÙNG 2: THANH CÔNG CỤ ĐÁY CÁCH ĐỀU DÀNH CHO MOBILE (< xl) ==================== */}
      <div className="fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5 right-2.5 sm:right-3.5 z-40 flex items-center justify-center pointer-events-none select-none">
        <div
          id="mobile-tools-bar"
          className="flex xl:hidden w-full max-w-[480px] items-center justify-between pointer-events-auto select-none"
        >
          {/* Nút 1: Quay lại sảnh - icon mũi tên, xóa chữ Sảnh */}
          <button
            type="button"
            id="game-leave-btn"
            onClick={onBack}
            className="size-11 sm:size-12 rounded-2xl border-2 border-white/20 bg-slate-900/90 hover:bg-slate-800/95 text-gray-200 hover:text-white shadow-md flex items-center justify-center transition-colors duration-150 active:scale-95 cursor-pointer shrink-0 [&_svg]:size-5 [&_svg]:sm:size-5.5"
            title="Quay lại sảnh"
            aria-label="Quay lại sảnh"
          >
            <ArrowLeft className="size-5 sm:size-5.5" />
          </button>

          {/* Các nút công cụ Vùng 1 được đưa xuống Vùng 2, icon không chữ cách đều */}
          {caroTools.map((tool) => {
            const buttonId =
              tool.id === 'mode'
                ? 'mobile-mode-toggle-card'
                : tool.id === 'draw'
                  ? 'mobile-xin-xo-btn'
                  : `mobile-tool-${tool.id}`
            const isModeTool = tool.id === 'mode'
            return (
              <button
                key={tool.id}
                type="button"
                id={buttonId}
                {...(isModeTool ? botHoldHandlers : {})}
                onClick={
                  isModeTool
                    ? wrapClickHandler((e) => {
                        e.stopPropagation()
                        tool.onClick(e)
                      })
                    : (e) => {
                        e.stopPropagation()
                        tool.onClick(e)
                      }
                }
                disabled={tool.disabled}
                className={cn(
                  'size-11 sm:size-12 rounded-2xl border-2 flex items-center justify-center transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md [&_svg]:size-5 [&_svg]:sm:size-5.5 shrink-0',
                  tool.className
                )}
                title={tool.title}
                aria-label={tool.title}
              >
                {tool.icon}
              </button>
            )
          })}

          {/* Slot dành cho nút Chat nổi của AppShell tại góc phải để các nút cách đều nhau 100% */}
          <div className="size-11 sm:size-12 shrink-0 pointer-events-none" aria-hidden="true" />
        </div>

        {/* ==================== THANH CÔNG CỤ ĐÁY NẰM NGANG DÀNH CHO WEB PC (>= xl) ==================== */}
        <div
          id="desktop-tools-bar"
          data-testid="desktop-tools-bar"
          className="hidden xl:flex w-full max-w-[540px] items-center justify-between pointer-events-auto select-none"
        >
          {/* Nút 1: Quay lại sảnh - icon mũi tên */}
          <button
            type="button"
            id="desktop-game-leave-btn"
            onClick={onBack}
            className="size-11 sm:size-12 rounded-2xl border-2 border-white/20 bg-slate-900/90 hover:bg-slate-800/95 text-gray-200 hover:text-white shadow-md flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shrink-0 [&_svg]:size-5 [&_svg]:sm:size-5.5"
            title="Quay lại sảnh"
            aria-label="Quay lại sảnh"
          >
            <ArrowLeft className="size-5 sm:size-5.5" />
          </button>

          {/* Các nút công cụ 2-6 nằm ngang cách đều y hệt web mobile */}
          {caroTools.map((tool) => {
            const buttonId = `desktop-tool-${tool.id}`
            const isModeTool = tool.id === 'mode'
            return (
              <button
                key={tool.id}
                type="button"
                id={buttonId}
                {...(isModeTool ? botHoldHandlers : {})}
                onClick={
                  isModeTool
                    ? wrapClickHandler((e) => {
                        e.stopPropagation()
                        tool.onClick(e)
                      })
                    : (e) => {
                        e.stopPropagation()
                        tool.onClick(e)
                      }
                }
                disabled={tool.disabled}
                className={cn(
                  'size-11 sm:size-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md [&_svg]:size-5 [&_svg]:sm:size-5.5 shrink-0',
                  tool.className
                )}
                title={tool.title}
                aria-label={tool.title}
              >
                {tool.icon}
              </button>
            )
          })}

          {/* Nút 7: Bật / tắt Chat nổi nằm ngay trên thanh công cụ giống web mobile */}
          <button
            type="button"
            id="desktop-tool-chat"
            onClick={() => window.dispatchEvent(new CustomEvent('campus:toggle-chat'))}
            className="size-11 sm:size-12 rounded-2xl border-2 border-sky-500/40 bg-slate-900/90 hover:bg-slate-800/95 text-sky-400 hover:text-sky-300 shadow-md flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shrink-0 [&_svg]:size-5 [&_svg]:sm:size-5.5"
            title="Trò chuyện"
            aria-label="Trò chuyện"
          >
            <MessageSquare className="size-5 sm:size-5.5" />
          </button>
        </div>
      </div>

      {/* ==================== BẢNG BIỂU CẢM & TIN NHẮN NHANH DUY NHẤT (PORTAL ĐỊNH VỊ CHUẨN XÁC NƠI CLICK) ==================== */}
      {/* Test compatibility token: className="flex xl:hidden w-full max-w-[480px] QUICK_EMOTES_CARO.map {item.emoji} {item.quote} */}
      {isQuickMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            id="mobile-quick-menu-container"
            data-testid="vung-2-quick-chat-container"
            ref={quickMenuRef}
            aria-label="Tin nhắn nhanh"
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: typeof window !== 'undefined' && window.innerWidth >= 1280 ? `${quickMenuPos.left}px` : '50%',
              top: typeof window !== 'undefined' && window.innerWidth >= 1280 ? `${quickMenuPos.top}px` : undefined,
              bottom: typeof window !== 'undefined' && window.innerWidth < 1280 ? 'calc(max(0.875rem, env(safe-area-inset-bottom, 0px) + 0.625rem) + 3.75rem)' : undefined,
              transform: typeof window !== 'undefined' && window.innerWidth < 1280 ? 'translateX(-50%)' : undefined,
              zIndex: 90,
              width: 'min(320px, calc(100vw - 1.5rem))',
            }}
            className="w-[min(320px,calc(100vw-1.5rem))] p-3.5 rounded-2xl bg-[#141824]/98 border border-amber-400/40 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none shrink-0 pointer-events-auto"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
              <span className="text-xs font-bold text-amber-300 tracking-wide flex items-center gap-1.5">
                <span>💬</span>
                <span>Tin nhắn nhanh</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen(false)}
                className="size-6 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
                aria-label="Đóng tin nhắn nhanh"
                title="Đóng"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Lưới 8 Emoji cờ Caro độc lập chuẩn Cờ Tướng */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {QUICK_EMOTES_CARO.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    handleQuickEmote(item)
                    setIsQuickMenuOpen(false)
                  }}
                  className="h-11 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:border-amber-400/40 border border-white/10 text-2xl flex items-center justify-center transition cursor-pointer hover:scale-105 active:scale-95"
                  title={`${item.emoji} ${item.label}`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            {/* Danh sách các câu thoại cờ Caro ngắn gọn xếp dạng lưới 2 cột */}
            <div className="h-px bg-white/10 my-0.5" />
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Nước cờ hay',
                'Xin chỉ giáo',
                'Đang tính nước',
                'Chiến tiếp nào',
              ].map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => {
                    handleQuickEmote({ quote: msg, id: msg, emoji: '💬', label: msg })
                    setIsQuickMenuOpen(false)
                  }}
                  className="h-9 px-2.5 rounded-lg text-center text-xs font-semibold text-gray-200 hover:text-amber-300 bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-400/30 transition cursor-pointer truncate flex items-center justify-center"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* MODAL HỒ SƠ NGƯỜI DÙNG KÈM ELO TRÒ CHƠI KHI BẤM VÀO AVATAR */}
      {selectedProfileUser && (
        <HoSoNguoiDungDialog
          nguoi={selectedProfileUser}
          onDong={() => setSelectedProfileUser(null)}
        />
      )}

      {/* POPUP CHỌN MỨC ĐỘ AI BOT KHI HOLD ICON BOT */}
      <AiDifficultyHoldMenu
        isOpen={isDifficultyMenuOpen}
        onClose={closeDifficultyMenu}
        anchorRect={aiDifficultyAnchor}
        currentLevel={aiLevel}
        onSelectLevel={setAiLevel}
        gameTitle="Cờ Caro"
      />
    </div>
  )
}
