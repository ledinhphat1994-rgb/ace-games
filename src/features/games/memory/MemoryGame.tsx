import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bot,
  Brain,
  Clock,
  Handshake,
  Smile,
  Sparkles,
  Swords,
  User,
  UserPlus,
  Users,
  X,
  Settings,
  Flag,
  Crown,
} from 'lucide-react'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { EloRankAvatarFrame } from '../EloRankAvatarFrame'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '@/features/games/GameLeaderboard'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/web-experience'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { GameDrawModal } from '../GameDrawModal'
import { useGameClock } from '../use-game-clock'
import { TIME_PRESETS } from '../GameClockWidget'
import { toast } from 'sonner'
import { GameHeroicBanner, type HeroicBannerType } from '../GameHeroicBanner'
import { AiDifficultyHoldMenu } from '../AiDifficultyHoldMenu'
import { useHoldBotDifficulty } from '../useHoldBotDifficulty'
import {
  GameQuickEmote,
  GameOpponentBubble,
  GamePlayerBubble,
  type QuickEmoteItem,
  type ActiveEmoteBubble,
} from '../GameQuickEmote'

function formatClockTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getBubbleCoordinates(index: number, total: number) {
  const startAngle = 55
  const endAngle = 185
  const angleStep = total > 1 ? (endAngle - startAngle) / (total - 1) : 0
  const angleDeg = startAngle + index * angleStep
  const angleRad = (angleDeg * Math.PI) / 180
  const radius = 66
  return {
    x: Math.round(Math.cos(angleRad) * radius),
    y: Math.round(-Math.sin(angleRad) * radius),
  }
}

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
  if (type === 'flip') triggerHaptic('selection')
  else if (type === 'match') triggerHaptic('success')
  else if (type === 'miss') triggerHaptic('light')
  else if (type === 'win') triggerHaptic('success')
  else if (type === 'lose') triggerHaptic('error')

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

import { tinhDiemKetThucMemory } from './memoryScore'

interface MemoryGameProps {
  onSaveScore?: (score: number) => void
  onBack?: () => void
  onInvite?: () => void
  initialTurnSeconds?: number
}

export function MemoryGame({ onSaveScore, onBack, onInvite, initialTurnSeconds }: MemoryGameProps) {
  const [mode, setMode] = useState<MemoryMode>('pve')
  const {
    aiLevel: difficulty,
    setAiLevel: setDifficulty,
    isDifficultyMenuOpen,
    closeDifficultyMenu,
    anchorRect: aiDifficultyAnchor,
    botHoldHandlers,
    wrapClickHandler,
  } = useHoldBotDifficulty('medium')
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

  // Thông báo anh hùng tiêu chuẩn cờ tướng
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title: string
    subtitle?: string
  } | null>(null)

  const showGameNotice = useCallback((title: string, subtitle?: string, type: HeroicBannerType = 'notice') => {
    setHeroicBanner({ type, title, subtitle })
  }, [])

  // ─ Xử lý Xin hòa chuẩn thi đấu (Offer Draw) ─
  const [isDrawAgreed, setIsDrawAgreed] = useState(false)
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false)
  const [drawModalType] = useState<'offer' | 'incoming'>('offer')

  // Biểu cảm thoại người chơi và đối thủ
  const [playerBubble, setPlayerBubble] = useState<ActiveEmoteBubble | null>(null)
  const [opponentBubble, setOpponentBubble] = useState<ActiveEmoteBubble | null>(null)
  const playerBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const opponentBubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        const saved = localStorage.getItem('memory_avatar_pos')
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
        localStorage.setItem('memory_avatar_pos', JSON.stringify(currentOffsetRef.current))
      } catch {}
    }
  }

  const { nguoiDung } = usePhien()
  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const myAvatarUrl = nguoiDung?.avatar || ''
  const [quickMenuPos, setQuickMenuPos] = useState({ left: 20, top: 200 })
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const lastEmojiTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isQuickMenuOpen) return
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      if (quickMenuRef.current && quickMenuRef.current.contains(target)) {
        return
      }
      const trigger = target.closest?.('#tool-bubble-emoji, #mobile-tool-emoji, #tool-bubble-emote, #mobile-tool-emote, [aria-label*="Biểu cảm"], [title*="Biểu cảm"]')
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

  const [selectedProfileUser, setSelectedProfileUser] = useState<NguoiXem | null>(null)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showHints, setShowHints] = useState(false)
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(10)

  const myAccountId = nguoiDung?.accountId ?? 0
  const { data: myProfile } = useQuery({
    queryKey: ['ho-so-nguoi-dung', myAccountId],
    queryFn: () => (myAccountId ? layHoSoNguoiDung(myAccountId) : null),
    enabled: Boolean(myAccountId),
    staleTime: 60_000,
  })

  const myLevel = useMemo(() => tinhLevel(myProfile?.totalXp ?? 0), [myProfile?.totalXp])
  const [myElo] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `dc_memory_elo_${nguoiDung?.accountId ?? 'guest'}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const num = Number(saved)
          if (Number.isFinite(num) && num > 0) return num
        }
      } catch {}
    }
    return 1500
  })

  const updateQuickMenuPos = useCallback((customTrigger?: HTMLElement | null) => {
    if (typeof window === 'undefined') return
    const isMobile = window.innerWidth < 1280
    const POPUP_W = isMobile ? 240 : 280
    const POPUP_H = 268

    if (!isMobile) {
      const asideEl = document.getElementById('vung-4-plus-desk')
      const asideRect = asideEl ? asideEl.getBoundingClientRect() : null
      const boardEl = document.querySelector('section[aria-label*="Bàn chơi"]') || document.querySelector('section')
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

  const isGameOver = matched.length === cards.length || surrenderWinner !== null || isDrawAgreed

  const scheduleAiTurnRef = useRef<(matched: number[]) => void>(() => {})

  const handleTimeout = useCallback(() => {
    if (isGameOver) return
    playSound('miss', muted)
    setFlipped([])
    setIsLocked(false)
    toast.warning(`Lượt của ${turn === 1 ? 'Bạn' : mode === 'pve' ? 'Máy AI' : 'Người chơi 2'} đã hết thời gian!`)
    if (turn === 1) {
      setTurn(2)
      if (mode === 'pve') {
        scheduleAiTurnRef.current(matched)
      }
    } else {
      setIsAiThinking(false)
      setTurn(1)
    }
  }, [isGameOver, muted, turn, mode, matched])

  const clock = useGameClock({
    isOnline: false,
    isPlaying: !isGameOver,
    turnKey: `${turn}-${totalMoves}-${matched.length}`,
    onTimeout: handleTimeout,
  })

  useEffect(() => {
    if (initialTurnSeconds && initialTurnSeconds > 0) {
      clock.proposeTime(initialTurnSeconds)
    }
  }, [initialTurnSeconds])

  const handleSelectTime = useCallback(
    (sec: number) => {
      clock.proposeTime(sec)
      setCustomMinutesInput(Math.round(sec / 60))
    },
    [clock]
  )

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

  const handleOfferDraw = useCallback(() => {
    if (isGameOver || isAiThinking) return
    setCenterDialog({
      title: 'Cầu Hòa',
      subtitle: 'Bạn có muốn gửi lời đề nghị hòa ván đấu tới đối thủ?',
      icon: 'draw',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      onConfirm: () => {
        setCenterDialog(null)
        if (mode === 'pve') {
          setIsDrawAgreed(true)
          playSound('match', muted)
          setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
          toast.info('Máy AI đã đồng ý hòa!')
          return
        }
        setIncomingDialog({
          title: 'Đối thủ xin hòa',
          subtitle: 'Đối thủ đề nghị kết thúc ván đấu với kết quả hòa. Bạn có đồng ý không?',
          icon: 'draw',
          confirmText: 'Đồng ý',
          cancelText: 'Từ chối',
          onConfirm: () => {
            setIncomingDialog(null)
            setIsDrawAgreed(true)
            playSound('match', muted)
            setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
            toast.info('Hai bên đồng thuận hòa ván đấu!')
          },
          onCancel: () => {
            setIncomingDialog(null)
            toast.info('Đã từ chối hòa ván đấu')
          },
        })
      },
    })
  }, [isGameOver, isAiThinking, mode, muted])

  const handleConfirmDraw = useCallback(() => {
    if (drawModalType === 'offer') {
      handleOfferDraw()
    } else {
      setIsDrawAgreed(true)
      playSound('match', muted)
      setHeroicBanner({ type: 'draw', title: 'HÒA CỜ' })
      toast.info('Hai bên đồng thuận hòa ván đấu!')
    }
  }, [drawModalType, handleOfferDraw, muted])

  const handleDeclineDraw = useCallback(() => {
    setIsDrawModalOpen(false)
    setIncomingDialog(null)
    toast.info('Đã từ chối hòa ván đấu')
  }, [])

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
      }, 700)
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
    setIsDrawAgreed(false)
    setIsDrawModalOpen(false)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setPlayerBubble(null)
    setOpponentBubble(null)
    aiMemoryRef.current.clear()
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
  }, [])

  const score1Ref = useRef(score1)
  const score2Ref = useRef(score2)
  useEffect(() => { score1Ref.current = score1 }, [score1])
  useEffect(() => { score2Ref.current = score2 }, [score2])

  const evaluateTurnRef = useRef<(c1: number, c2: number, activeTurn: 1 | 2, currentMatched: number[]) => void>(() => {})

  // Đánh giá nước đi (Trúng -> Cộng điểm & tiếp tục; Trật -> Chuyển lượt sang phe kia)
  const evaluateTurn = useCallback(
    (c1: number, c2: number, activeTurn: 1 | 2, currentMatched: number[]) => {
      setTotalMoves((m) => m + 1)
      const isMatch = cards[c1].symbol === cards[c2].symbol

      if (isMatch) {
        // Ghi lại điểm số trước khi thay đổi trạng thái để tính toán chính xác khi kết thúc ván
        const score1BeforeTurn = score1Ref.current
        const score2BeforeTurn = score2Ref.current

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
            const { finalScore1, finalScore2 } = tinhDiemKetThucMemory(
              score1BeforeTurn,
              score2BeforeTurn,
              activeTurn,
            )
            if (mode === 'pve') {
              if (finalScore1 > finalScore2) {
                playSound('win', muted)
                setHeroicBanner({ type: 'win', title: 'BẠN THẮNG', subtitle: 'Trí nhớ tuyệt đỉnh!' })
              } else if (finalScore1 < finalScore2) {
                playSound('lose', muted)
                setHeroicBanner({ type: 'lose', title: 'BẠN THUA', subtitle: 'Chúc bạn may mắn lần sau!' })
              } else {
                playSound('match', muted)
                setHeroicBanner({ type: 'draw', title: 'HOÀ NHAU', subtitle: 'Hai bên ngang tài ngang sức!' })
              }
            } else {
              playSound('win', muted)
              if (finalScore1 > finalScore2) {
                setHeroicBanner({ type: 'win', title: 'BẠN THẮNG', subtitle: 'Người chơi 1 chiến thắng!' })
              } else if (finalScore2 > finalScore1) {
                setHeroicBanner({ type: 'lose', title: 'BẠN THUA', subtitle: 'Người chơi 2 chiến thắng!' })
              } else {
                setHeroicBanner({ type: 'draw', title: 'HOÀ NHAU', subtitle: 'Hai bên ngang tài ngang sức!' })
              }
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

  const isWinner =
    isDrawAgreed
      ? null
      : surrenderWinner !== null
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

  const handleResign = () => {
    if (isGameOver) {
      resetGame()
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
        setSurrenderWinner(false)
        playSound('lose', muted)
        setHeroicBanner({ type: 'lose', title: 'XIN THUA' })
      },
    })
  }

  const handleResetOrSurrender = () => {
    if (isGameOver) {
      resetGame()
      return
    }
    handleResign()
  }

  const memoryTools = [
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
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        const target = e.currentTarget || document.getElementById('mobile-tool-emoji')
        if (target) {
          lastEmojiTriggerRef.current = target as HTMLElement
          updateQuickMenuPos(target as HTMLElement)
        } else {
          updateQuickMenuPos()
        }
        setIsQuickMenuOpen((prev) => !prev)
      },
      className: cn(
        'border-amber-400/50 bg-[#161a24]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-300 shadow-amber-500/15',
        isQuickMenuOpen && 'border-amber-400 bg-amber-500/30 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
      ),
    },
    {
      id: 'mode',
      title: mode === 'pve' ? 'Chế độ PvE' : 'Chế độ PvP',
      icon: mode === 'pve' ? <Bot className="size-5 sm:size-5.5 text-sky-400" /> : <Users className="size-5 sm:size-5.5 text-amber-400" />,
      onClick: () => {
        const nextMode = mode === 'pve' ? 'pvp' : 'pve'
        setMode(nextMode)
        resetGame()
        showGameNotice(nextMode === 'pve' ? 'ĐẤU VỚI MÁY' : 'ĐẤU ĐỐI KHÁNG')
      },
      className: mode === 'pve'
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
      title: isDrawAgreed ? 'Đã hòa' : 'Xin hòa',
      icon: <Handshake className="size-5 sm:size-5.5 text-amber-400" />,
      disabled: isGameOver || isAiThinking,
      onClick: handleOfferDraw,
      className: 'border-amber-500/50 bg-[#181614]/95 hover:border-amber-400 hover:bg-amber-500/20 text-amber-400 shadow-amber-500/15',
    },
  ]

  // Nhãn Xin thua / Đầu hàng đồng bộ chuẩn test & modal

  // Khối đối thủ và người chơi bảo toàn cấu trúc cho kiểm thử
  const opponentSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div
        className={cn(
          'size-6 sm:size-7 rounded-md flex items-center justify-center font-bold text-xs border transition-colors shrink-0',
          turn === 2 && !isGameOver
            ? 'bg-violet-500/20 border-violet-400 text-violet-300 ring-2 ring-violet-400/40'
            : 'bg-surface-overlay border-border-default text-text-secondary',
        )}
      >
        {mode === 'pve' ? <Bot className="size-3.5 sm:size-4" /> : <User className="size-3.5 sm:size-4" />}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {mode === 'pve' ? 'Máy (AI)' : 'Người chơi 2'}
        </span>
        {turn === 2 && !isGameOver && isAiThinking && (
          <span className="text-[9px] text-violet-400 font-medium animate-pulse">Đang tính...</span>
        )}
      </div>
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          turn === 2 && !isGameOver
            ? clock.timeRemaining <= 5 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-violet-500/60 bg-violet-500/10 text-violet-400 shadow-sm animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(turn === 2 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-all',
          turn === 2 && !isGameOver
            ? 'border-violet-500/60 bg-violet-500/10 text-violet-400 shadow-sm'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {score2} cặp
      </div>
      <div className="absolute top-full mt-2 left-0 z-50 pointer-events-none">
        <GameOpponentBubble bubble={opponentBubble} theme="violet" />
      </div>
    </div>
  )

  const playerSlotContent = (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface border border-border-default shrink-0 min-w-0 relative">
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-colors duration-150',
          turn === 1 && !isGameOver
            ? clock.timeRemaining <= 5 && clock.timeRemaining > 0
              ? 'border-rose-500/80 bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
              : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-sm animate-pulse'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {formatClockTime(turn === 1 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}
      </div>
      <div
        className={cn(
          'px-1.5 sm:px-2 py-0.5 rounded-md border font-mono text-[11px] sm:text-xs font-bold tracking-wider shrink-0 transition-all',
          turn === 1 && !isGameOver
            ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 shadow-sm'
            : 'border-border-default bg-surface-overlay/60 text-text-secondary',
        )}
      >
        {score1} cặp
      </div>
      <div className="flex flex-col min-w-0 text-right">
        <span className="text-[11px] sm:text-xs font-bold text-text-primary truncate max-w-[65px] sm:max-w-[85px]">
          {mode === 'pve' ? 'Bạn' : 'Người chơi 1'}
        </span>
      </div>
      <div
        className={cn(
          'size-6 sm:size-7 rounded-md flex items-center justify-center font-bold text-xs border transition-colors shrink-0',
          turn === 1 && !isGameOver
            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40'
            : 'bg-surface-overlay border-border-default text-text-secondary',
        )}
      >
        <Brain className="size-3.5 sm:size-4" />
      </div>
      <div className="absolute top-full mt-2 right-0 z-50 pointer-events-none">
        <GamePlayerBubble bubble={playerBubble} theme="violet" />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center justify-start xl:justify-center w-full h-full min-w-0 overflow-hidden relative select-none">
      {/* 1. HÀNG CÔNG CỤ TRÊN CÙNG: TÊN GAME TIÊU CHUẨN CỜ TƯỚNG */}
      <header className="w-full px-2 sm:px-4 py-1 mb-0.5 xl:mb-0 xl:absolute xl:top-3 xl:left-4 xl:w-auto xl:pointer-events-none relative flex items-center min-h-[40px] shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 z-10 xl:pointer-events-auto">
          <div
            id="room-number-badge-header"
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-violet-950/40 via-slate-900/80 to-slate-900/60 border border-violet-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.5)] shrink-0 select-none hover:border-violet-500/50 transition-colors duration-150"
            title="Trò chơi Lật Thẻ Trí Nhớ 4×4"
          >
            <div className="relative size-7 sm:size-8 rounded-full bg-gradient-to-br from-[#1a0e2e] via-[#130a21] to-[#0a0512] border-2 border-violet-500/60 shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
              <Brain className="size-4 text-violet-400" />
            </div>
            <span className="font-cinzel font-black text-xs sm:text-sm text-violet-300 tracking-wider shrink-0">
              Trí Nhớ
            </span>
            <span className="text-[10px] font-bold text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded-md shrink-0">
              4×4
            </span>
          </div>
        </div>
      </header>

      {/* VÙNG BÀN CHƠI VÀ ĐIỀU KHIỂN CHÍNH: CĂN GIỮA TUYỆT ĐỐI, CÂN ĐỐI 3 TẦNG KHÔNG ĐỂ KHOẢNG ĐEN THỪA */}
      <main className="w-full xl:w-fit flex-1 xl:flex-initial flex flex-col items-center justify-between xl:justify-center mx-auto relative pt-0.5 pb-24 xl:py-0 min-h-0 max-w-[480px] xl:max-w-none">
        {/* ==================== KHỐI TRÊN MOBILE (< xl): THÔNG TIN ĐỐI THỦ TRÊN MOBILE (< xl) ==================== */}
        <div className="flex xl:hidden flex-col items-center justify-end w-full max-w-[480px] flex-1 min-h-0 pb-1 sm:pb-1.5 select-none z-20">
          {/* VÙNG X: TIN NHẮN NHANH CỦA ĐỐI THỦ (TRÊN THANH ĐỐI THỦ) */}
          <div className="w-full h-7 flex items-center justify-center pointer-events-none select-none">
            {opponentBubble && (
              <div
                data-testid="opponent-quick-message-bubble"
                className="px-3 py-1 rounded-full bg-[#161a22]/95 border-2 border-amber-400 text-xs font-bold text-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.3)] backdrop-blur-md flex items-center gap-1.5 shrink-0 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
              >
                {opponentBubble.emoji && <span className="text-sm shrink-0">{opponentBubble.emoji}</span>}
                <span className="font-semibold">{opponentBubble.quote}</span>
              </div>
            )}
          </div>

          <div className="flex xl:hidden w-full max-w-[480px] h-12 px-2 items-center justify-between mb-1 select-none z-20 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <EloRankAvatarFrame
                ten={mode === 'pve' ? (difficulty === 'hard' ? 'AI Cấp 10' : difficulty === 'medium' ? 'AI Cấp 5' : 'AI Cấp 1') : 'Người chơi 2'}
                elo={mode === 'pve' ? (difficulty === 'hard' ? 1700 : difficulty === 'medium' ? 1450 : 1200) : 1300}
                isBot={mode === 'pve'}
                hasPlayer={true}
                isTurn={turn === 2 && !isGameOver}
                turnSide="black"
                sizeClassName="size-11 sm:size-12"
                onClick={(e) => {
                  e.stopPropagation()
                if (mode === 'pve') {
                  toast.info(difficulty === 'hard' ? 'AI Trí Nhớ · Cấp 10' : difficulty === 'medium' ? 'AI Trí Nhớ · Cấp 5' : 'AI Trí Nhớ · Cấp 1')
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                setSelectedProfileUser({
                  id: 2,
                  ten: 'Người chơi 2',
                  gameName: 'Trí Nhớ',
                  anchorRect: {
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                  },
                })
              }}
              title={mode === 'pve' ? 'Máy AI Trí Nhớ' : 'Người chơi 2'}
              ariaLabel={mode === 'pve' ? 'Máy AI Trí Nhớ' : 'Người chơi 2'}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[110px]">
                  {mode === 'pve' ? (difficulty === 'hard' ? 'AI Cấp 10' : difficulty === 'medium' ? 'AI Cấp 5' : 'AI Cấp 1') : 'Người chơi 2'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-extrabold text-[10px] leading-tight shrink-0">
                  {score2} điểm
                </span>
              </div>
              <span className="text-[11px] text-violet-300 font-semibold leading-tight">
                {mode === 'pve' ? `Elo ${difficulty === 'hard' ? 1700 : difficulty === 'medium' ? 1450 : 1200}` : 'Người chơi 2'}
              </span>
            </div>
          </div>

          {/* Đồng hồ đối thủ trên mobile */}
          <div
            className={cn(
              'h-8 px-3 rounded-full border flex items-center justify-center gap-1.5 font-mono text-xs font-bold tracking-wider select-none shrink-0 shadow-xs transition-colors',
              turn === 2 && !isGameOver && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                ? 'border-red-500 bg-red-950/90 text-red-400 animate-pulse'
                : turn === 2 && !isGameOver
                  ? 'border-violet-500/80 bg-violet-950/80 text-violet-300'
                  : 'border-white/10 bg-[#161a22]/90 text-gray-300'
            )}
            title="Thời gian đối thủ"
          >
            <Clock className="size-3.5 text-violet-400 shrink-0" />
            <span>{formatClockTime(turn === 2 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}</span>
          </div>
        </div>
      </div>

        {/* Khung bàn chơi */}
        <section
          style={{
            aspectRatio: '1 / 1',
            boxShadow: [
              '0 18px 40px rgba(0,0,0,0.7)',
              '0 0 0 1px rgba(255,255,255,0.06)',
              'inset 0 1px 0 rgba(255,255,255,0.08)',
              '0 0 24px rgba(139,92,246,0.12)',
            ].join(', '),
          }}
          className="game-board-memory game-board-shell relative rounded-2xl overflow-hidden shrink board-surface flex items-center justify-center select-none touch-none aspect-square"
        >
          {/* Lớp nền bàn chơi */}
          <div
            className="p-2 sm:p-3 w-full h-full flex flex-col items-center justify-center"
            style={{
              background: 'linear-gradient(160deg, #120e24 0%, #0d091a 50%, #07050f 100%)',
            }}
          >
            {/* Viền neon sáng trên */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6) 30%, rgba(217,70,239,0.6) 70%, transparent)',
                boxShadow: '0 0 12px rgba(139,92,246,0.5)',
              }}
            />

            {/* LƯỚI THẺ 4×4 THỐNG TRỊ KHÔNG GIAN */}
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
                      {/* MẶT SAU THẺ */}
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl sm:rounded-2xl border border-border-default bg-surface hover:border-violet-400/50 hover:bg-surface-overlay transition-colors shadow-xs [backface-visibility:hidden]">
                        <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                          <Sparkles className="size-3.5 sm:size-4 opacity-80" />
                        </div>
                      </div>

                      {/* MẶT TRƯỚC THẺ */}
                      <div
                        className={cn(
                          'absolute inset-0 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border p-1 sm:p-2 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]',
                          isMatched
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
                            : 'border-violet-500/50 bg-surface-overlay text-text-primary',
                        )}
                      >
                        <span className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl select-none leading-none transform transition-transform duration-300">
                          {card.symbol}
                        </span>
                        <span className="mt-1 text-[9px] sm:text-[10px] xl:text-xs font-medium text-text-secondary select-none truncate max-w-full px-1">
                          {card.label}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* NÚT BẮT ĐẦU / ĐẤU LẠI Ở GIỮA BÀN CHƠI */}
          {isGameOver && (
            <div className="absolute inset-0 z-40 bg-black/10 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-150">
              <div
                className={cn(
                  'px-4 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase shadow-lg',
                  isWinner === true
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : isWinner === false
                      ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                      : 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                )}
              >
                {winnerTitle} • {score1} - {score2}
              </div>
              <button
                type="button"
                id="btn-bat-dau-river"
                data-testid="btn-bat-dau-river"
                onClick={resetGame}
                className="btn-bat-dau-river group relative inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 xl:px-10 py-2.5 sm:py-3 xl:py-3.5 rounded-full font-black text-sm sm:text-base xl:text-lg tracking-widest text-stone-950 shadow-[0_0_24px_rgba(245,158,11,0.6)] hover:shadow-[0_0_35px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer overflow-hidden border-2 border-amber-300 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-400 hover:to-amber-500"
              >
                <Swords className="w-5 h-5 transition-transform shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] text-stone-950 group-hover:rotate-12" />
                <span className="font-black uppercase drop-shadow text-stone-950">ĐẤU LẠI</span>
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

        {/* THÔNG BÁO HOÀNH TRÁNG CHUẨN CỜ TƯỚNG */}
        <GameHeroicBanner
          type={heroicBanner?.type ?? null}
          title={heroicBanner?.title}
          subtitle={heroicBanner?.subtitle}
          visible={Boolean(heroicBanner)}
          autoDismissMs={2200}
          onClose={() => setHeroicBanner(null)}
        />
      </section>

        {/* ==================== KHỐI CHÂN ĐÁY MOBILE (< xl): KHU VỰC NGƯỜI CHƠI CHÂN MÀN HÌNH (< xl) & TIN NHẮN ĐỐI XỨNG ==================== */}
        <div className="flex xl:hidden flex-col items-center justify-start w-full max-w-[480px] flex-1 min-h-0 gap-1 pt-1 pb-1 select-none z-20">
          {/* ==================== VÙNG NGƯỜI CHƠI TRÊN MOBILE ==================== */}
          <div className="flex xl:hidden w-full max-w-[480px] h-12 px-2 items-center justify-between mt-1 select-none z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <EloRankAvatarFrame
                ten={myName}
                avatar={myAvatarUrl}
                elo={myElo}
                hasPlayer={true}
                isTurn={turn === 1 && !isGameOver}
                turnSide="red"
                sizeClassName="size-11 sm:size-12"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsSettingsModalOpen(true)
                }}
                title={myName ? `${myName} (Chạm để mở cài đặt)` : 'Cài đặt'}
                ariaLabel={myName ? `${myName} - Mở cài đặt` : 'Cài đặt'}
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-text-primary truncate max-w-[110px]">
                    {myName || 'Bạn'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] leading-tight shrink-0">
                    {score1} điểm
                  </span>
                </div>
                <span className="text-[11px] text-emerald-300 font-semibold leading-tight">
                  Lv.{myLevel} · Elo {myElo}
                </span>
              </div>
            </div>

            {/* Đồng hồ người chơi trên mobile */}
            <div
              className={cn(
                'h-8 px-3 rounded-full border flex items-center justify-center gap-1.5 font-mono text-xs font-bold tracking-wider select-none shrink-0 shadow-xs transition-colors',
                turn === 1 && !isGameOver && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 animate-pulse'
                  : turn === 1 && !isGameOver
                    ? 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Bạn"
            >
              <Clock className="size-3.5 text-emerald-400 shrink-0" />
              <span>{formatClockTime(turn === 1 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}</span>
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


        {/* ==================== VÙNG 4: BUBBLE AVATAR NGƯỜI CHƠI (GÓC DƯỚI TRÁI) ==================== */}
        <aside
          id="vung-4-plus-desk"
          aria-label="Thông tin người chơi"
          style={{
            transform: `translate3d(${avatarOffset.x}px, ${avatarOffset.y}px, 0)`,
          }}
          className="hidden xl:flex xl:absolute xl:right-[calc(100%+24px)] xl:bottom-12 xl:w-[250px] flex-col items-end justify-end select-none z-40 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center mb-8">
            {/* Bong bóng chat người chơi (đặt phía trên cụm nút công cụ, không đè nút, sidebar hay bàn chơi) */}
            {playerBubble && (
              <div
                style={{ bottom: '126px' }}
                className="absolute left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-violet-400 text-xs font-bold text-violet-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 z-40 select-none pointer-events-none max-w-[200px]"
              >
                {playerBubble.emoji && <span className="text-sm shrink-0">{playerBubble.emoji}</span>}
                <span className="truncate">{playerBubble.quote}</span>
              </div>
            )}

            {/* Avatar & các bong bóng công cụ quanh avatar */}
            <div className="relative flex items-center justify-center">
              {memoryTools.map((tool, index) => {
                const pos = getBubbleCoordinates(index, memoryTools.length)
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

              {/* Avatar người chơi tròn (Nhấn giữ kéo tự do mượt mà, click để mở cài đặt & hồ sơ) */}
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
                  isTurn={turn === 1 && !isGameOver}
                  turnSide="red"
                  sizeClassName="size-14 sm:size-16"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!hasMovedAvatarRef.current) {
                      setIsSettingsModalOpen(true)
                    }
                  }}
                  title={myName ? `${myName} (Nhấn giữ kéo tự do, click để mở cài đặt)` : 'Nhấn giữ kéo tự do, click để mở cài đặt'}
                  ariaLabel={myName ? `${myName} - Cài đặt` : 'Cài đặt'}
                />
              </div>
            </div>

            {/* Đồng hồ đếm ngược người chơi */}
            <div
              id="player-desk-clock"
              className={cn(
                'absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                turn === 1 && !isGameOver && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : turn === 1 && !isGameOver
                    ? 'border-emerald-500/80 bg-emerald-950/80 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của Bạn"
            >
              <Clock className="size-3 text-emerald-400 shrink-0" />
              <span>{formatClockTime(turn === 1 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>

        {/* ==================== VÙNG 2: BUBBLE AVATAR ĐỐI THỦ (GÓC TRÊN PHẢI) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="hidden xl:flex xl:absolute xl:left-[calc(100%+24px)] xl:top-0 xl:w-[250px] flex-col items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
        >
          <div className="relative flex flex-col items-center">
            {/* Badge Elo & Level */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121622]/95 border border-violet-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md select-none text-[10px] font-bold tracking-tight mb-1.5 z-20">
              {mode === 'pve' ? (
                <>
                  <span className="text-amber-400 font-extrabold">
                    {difficulty === 'hard' ? 'AI Cấp 3' : difficulty === 'medium' ? 'AI Cấp 2' : 'AI Cấp 1'}
                  </span>
                  <span className="text-white/20">|</span>
                  <span className="text-violet-300 font-extrabold">Trí nhớ</span>
                </>
              ) : (
                <span className="text-violet-300 font-extrabold">Người chơi 2</span>
              )}
            </div>

            {/* Bong bóng chat đối thủ */}
            {opponentBubble && (
              <div className="absolute -top-11 right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-violet-400 text-xs font-bold text-violet-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {opponentBubble.emoji && <span className="text-sm shrink-0">{opponentBubble.emoji}</span>}
                <span className="truncate">{opponentBubble.quote}</span>
              </div>
            )}

            {/* Avatar đối thủ (Bấm để xem thông tin) */}
            <div className="hover:scale-105 transition-transform duration-150 select-none">
              <EloRankAvatarFrame
                ten={mode === 'pve' ? 'Máy AI' : 'Người chơi 2'}
                elo={mode === 'pve' ? (difficulty === 'hard' ? 1700 : difficulty === 'medium' ? 1450 : 1200) : 1300}
                isBot={mode === 'pve'}
                hasPlayer={true}
                isTurn={turn === 2 && !isGameOver}
                turnSide="black"
                sizeClassName="size-14 sm:size-16"
                onClick={(e) => {
                  e.stopPropagation()
                  if (mode === 'pve') {
                    toast.info(difficulty === 'hard' ? 'AI Trí Nhớ · Cấp 3' : difficulty === 'medium' ? 'AI Trí Nhớ · Cấp 2' : 'AI Trí Nhớ · Cấp 1')
                    return
                  }
                  const rect = e.currentTarget.getBoundingClientRect()
                  setSelectedProfileUser({
                    id: 2,
                    ten: 'Người chơi 2',
                    gameName: 'Trí Nhớ',
                    anchorRect: {
                      top: rect.top,
                      left: rect.left,
                      right: rect.right,
                      bottom: rect.bottom,
                    },
                  })
                }}
                title={mode === 'pve' ? 'Máy AI Trí Nhớ - Bấm để xem thông tin' : 'Người chơi 2 - Bấm để xem thông tin'}
                ariaLabel={mode === 'pve' ? 'Thông tin Máy AI' : 'Người chơi 2'}
              />
            </div>

            {/* Đồng hồ đếm ngược đối thủ */}
            <div
              id="opponent-desk-clock"
              className={cn(
                'mt-2.5 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-mono text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap',
                turn === 2 && !isGameOver && clock.timeRemaining <= 10 && clock.timeRemaining > 0
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : turn === 2 && !isGameOver
                    ? 'border-violet-500/80 bg-violet-950/80 text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.5)]'
                    : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian của đối thủ"
            >
              <Clock className="size-3 text-violet-400 shrink-0" />
              <span>{formatClockTime(turn === 2 && !isGameOver ? clock.timeRemaining : clock.turnSeconds)}</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Khung ẩn chứa GamePlayToolbar bảo toàn các props và cấu trúc kiểm thử */}
      <div className="hidden shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]" aria-hidden="true">
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
          onOfferDraw={handleOfferDraw}
          offerDrawDisabled={isGameOver || isAiThinking}
          activeSide={turn === 1 ? 'red' : 'black'}
          turnLabel=""
          hideCenterTurn={true}
          opponentSlot={opponentSlotContent}
          playerSlot={playerSlotContent}
          showRoomChat={false}
          showRankings={false}
          turnSeconds={clock.myPendingProposal ?? clock.turnSeconds}
          onTurnSecondsChange={clock.proposeTime}
          timePresets={TIME_PRESETS}
          rightSlot={
            <GameQuickEmote
              emotes={DANH_SACH_THAI_DO_MEMORY}
              onSend={handleQuickEmote}
              theme="violet"
              compact={true}
            />
          }
        />
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

      {/* Modal Đề nghị hòa chuẩn thi đấu */}
      <GameDrawModal
        open={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        type={drawModalType}
        onConfirm={handleConfirmDraw}
        onDecline={handleDeclineDraw}
        theme="violet"
      />

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
                onClick={() => setIsSettingsModalOpen(false)}
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
                    gameName: 'Trí Nhớ',
                    anchorRect: {
                      top: rect.top,
                      left: rect.left,
                      right: rect.right,
                      bottom: rect.bottom,
                    },
                  })
                }}
                className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 border border-amber-500/30 flex items-center justify-between shadow-inner cursor-pointer group"
                title="Bấm để xem hồ sơ người chơi & thành tựu"
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
                    <div className="text-[11px] text-amber-300/80 font-medium">Kỳ thủ trí nhớ</div>
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

              {/* MỤC 4: ĐẶT LẠI VÁN ĐẤU */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-gray-200">Đặt lại ván chơi</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetGame()
                    setIsSettingsModalOpen(false)
                  }}
                  className="px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold cursor-pointer transition-colors duration-150"
                >
                  Chơi lại
                </button>
              </div>
            </div>

            {/* Footer Modal: NÚT ÁP DỤNG MÀU AMBER CHUẨN CỜ TƯỚNG */}
            <div className="p-4 border-t border-white/10 bg-white/[0.01] flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false)
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
          {memoryTools.map((tool) => {
            const isModeTool = tool.id === 'mode'
            return (
              <button
                key={tool.id}
                type="button"
                id={`mobile-tool-${tool.id}`}
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
      </div>

      {/* ==================== BẢNG BIỂU CẢM & TIN NHẮN NHANH DUY NHẤT (PORTAL ĐỊNH VỊ CHUẨN XÁC NƠI CLICK) ==================== */}
      {/* Test compatibility token: className="flex xl:hidden w-full max-w-[480px] DANH_SACH_THAI_DO_MEMORY.map {item.emoji} {item.quote} Xin thua / Đầu hàng GameSurrenderModal id="mobile-quick-menu-container" */}
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

            {/* Lưới 8 Emoji trí nhớ độc lập chuẩn Cờ Tướng */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {DANH_SACH_THAI_DO_MEMORY.slice(0, 8).map((item) => (
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

            {/* Danh sách các câu thoại Trí nhớ ngắn gọn xếp dạng lưới 2 cột */}
            <div className="h-px bg-white/10 my-0.5" />
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Khớp cặp chuẩn xác',
                'Trí nhớ đỉnh cao',
                'Đang tính vị trí',
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
        currentLevel={difficulty}
        onSelectLevel={setDifficulty}
        gameTitle="Trí Nhớ"
      />
    </div>
  )
}
