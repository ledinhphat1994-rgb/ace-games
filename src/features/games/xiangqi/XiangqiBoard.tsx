import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  XiangqiPosition,
  type XiangqiMove,
  type Side,
  RED,
  BLACK,
  GENERAL,
  ADVISOR,
  ELEPHANT,
  HORSE,
  CHARIOT,
  CANNON,
  SOLDIER,
  typeOf,
  sideOf,
  fileOf,
  rankOf,
} from '../../../../shared/games/xiangqi/xiangqi-engine'
import { findBestXiangqiMove } from '../../../../shared/games/xiangqi/xiangqi-ai'
import { mauQuanCua } from '@shared/protocol/game'
import { dungTheCoTuong } from '../../../../worker/game-engine'
import type { BanOnline } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Bot,
  Clock,
  Crown,
  Eye,
  EyeOff,
  Flag,
  Handshake,
  Lock,
  Pin,
  RotateCcw,
  Settings,
  Smile,
  Swords,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '../GameLeaderboard'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import { tenNguoiChoi, useCheDoBan } from '../ban-online'
import { GameSurrenderModal } from '../GameSurrenderModal'
import { useGameClock } from '../use-game-clock'
import { GameHeroicBanner, type HeroicBannerType } from '../GameHeroicBanner'
import {
  playGameOverSound,
  playGameStartSound,
  playCheckAlertSound,
} from '../game-audio'
import { useScreenWakeLock } from '@/lib/web-experience'

// --- 1. HỆ THỐNG ÂM THANH CỜ TƯỚNG CHUẨN CC0 INTERNET + WEB AUDIO FALLBACK ---
class WebAudioSoundEngine {
  private ctx: AudioContext | null = null
  enabled = true

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
  }

  playMove() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(320, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.7, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.08)
    } catch {}
  }

  playCapture() {
    if (!this.enabled) return
    this.init()
    if (!this.ctx) return
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.14)
      gain.gain.setValueAtTime(0.9, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.14)
    } catch {}
  }
}

class XiangqiSoundEngine {
  enabled = true
  private moveAudio: HTMLAudioElement | null = null
  private captureAudio: HTMLAudioElement | null = null
  private checkAudio: HTMLAudioElement | null = null
  private winAudio: HTMLAudioElement | null = null
  private loseAudio: HTMLAudioElement | null = null
  private webAudioFallback = new WebAudioSoundEngine()

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.moveAudio = new Audio('/assets/games/move.mp3')
        this.captureAudio = new Audio('/assets/games/capture.mp3')
        this.checkAudio = new Audio('/assets/games/check.mp3')
        this.winAudio = new Audio('/assets/games/victory.mp3')
        this.loseAudio = new Audio('/assets/games/defeat.mp3')

        this.moveAudio.preload = 'auto'
        this.captureAudio.preload = 'auto'
        this.checkAudio.preload = 'auto'
        this.winAudio.preload = 'auto'
        this.loseAudio.preload = 'auto'
      } catch {}
    }
  }

  private playSound(audio: HTMLAudioElement | null, fallback: () => void) {
    if (!this.enabled) return
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {
        fallback()
      })
    } else {
      fallback()
    }
  }

  playMove() {
    this.playSound(this.moveAudio, () => this.webAudioFallback.playMove())
  }

  playCapture() {
    this.playSound(this.captureAudio, () => this.webAudioFallback.playCapture())
  }

  playCheck() {
    this.playSound(this.checkAudio, () => playCheckAlertSound())
  }

  playVictory() {
    this.playSound(this.winAudio, () => playGameOverSound('win'))
  }

  playDefeat() {
    this.playSound(this.loseAudio, () => playGameOverSound('lose'))
  }
}
const soundEngine = new XiangqiSoundEngine()

function formatClockTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
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

const TEN_QUAN_TIENG_VIET: Record<number, string> = {
  [GENERAL]: 'Tướng',
  [ADVISOR]: 'Sĩ',
  [ELEPHANT]: 'Tượng',
  [HORSE]: 'Mã',
  [CHARIOT]: 'Xe',
  [CANNON]: 'Pháo',
  [SOLDIER]: 'Tốt',
}

const tenBen = (b: Side) => (b === RED ? 'Bên Đỏ' : 'Bên Đen')

// Tạo chuỗi SVG path cho các dấu hoa văn góc chữ thập truyền thống trên bàn cờ tướng
function generateCrossMarks(): string {
  const d = 5
  const len = 8
  const points: Array<[number, number, 'all' | 'left-only' | 'right-only']> = [
    [174, 270, 'all'],
    [726, 270, 'all'],
    [174, 730, 'all'],
    [726, 730, 'all'],
    [82, 362, 'right-only'],
    [266, 362, 'all'],
    [450, 362, 'all'],
    [634, 362, 'all'],
    [818, 362, 'left-only'],
    [82, 638, 'right-only'],
    [266, 638, 'all'],
    [450, 638, 'all'],
    [634, 638, 'all'],
    [818, 638, 'left-only'],
  ]
  const paths: string[] = []
  for (const [cx, cy, mode] of points) {
    if (mode === 'all' || mode === 'left-only') {
      paths.push(`M ${cx - d} ${cy - d - len} V ${cy - d} H ${cx - d - len}`)
      paths.push(`M ${cx - d} ${cy + d + len} V ${cy + d} H ${cx - d - len}`)
    }
    if (mode === 'all' || mode === 'right-only') {
      paths.push(`M ${cx + d} ${cy - d - len} V ${cy - d} H ${cx + d + len}`)
      paths.push(`M ${cx + d} ${cy + d + len} V ${cy + d} H ${cx + d + len}`)
    }
  }
  return paths.join(' ')
}

const XIANGQI_CROSS_MARKS_PATH = generateCrossMarks()

export type XiangqiToolId =
  | 'settings'
  | 'emoji'
  | 'mode'
  | 'invite'
  | 'draw'
  | 'resign'
  | 'win'
  | 'flip'
  | 'sound'
  | 'hints'

interface XiangqiBoardProps {
  onBack?: () => void
  initialMode?: PlayMode
  /** Bàn online (mở từ sảnh): PvP chuyển sang Online — máy chủ làm trọng tài, đối thủ là người thật. */
  online?: BanOnline
  gameId?: string
  roomName?: string
  isPrivate?: boolean
  soPhongHienThi?: string
  onInvite?: () => void
}

const PROPOSAL_PREFIX = '[SYS_XQ_PROP]:'

export function XiangqiBoard({
  onBack,
  initialMode,
  online,
  gameId: _gameId,
  roomName = 'Phòng Cờ Tướng',
  isPrivate,
  soPhongHienThi,
  onInvite,
}: XiangqiBoardProps) {
  const { nguoiDung } = usePhien()
  const [posTaiCho, setPos] = useState<XiangqiPosition>(() => XiangqiPosition.fromFen())
  const [selectedSq, setSelectedSq] = useState<number | null>(null)
  const { mode, doiCheDo, laOnline, vanVuaBatDau, xoaVanVuaBatDau } = useCheDoBan(online, initialMode)
  const [heroicBanner, setHeroicBanner] = useState<{
    type: HeroicBannerType
    title?: string
    subtitle?: string
  } | null>(null)

  const showGameNotice = useCallback((title: string, subtitle?: string) => {
    setHeroicBanner({ type: 'notice', title, subtitle })
  }, [])
  const [aiLevel] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [playerSide] = useState<Side>(RED)

  // Bàn cờ chữ Hán thư pháp truyền thống chuẩn mực
  const fontType = 'han' as const
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isFlippedManual, setIsFlippedManual] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isXinXoMenuOpen, setIsXinXoMenuOpen] = useState(false)
  const [customMinutesInput, setCustomMinutesInput] = useState<number>(10)
  const [isSurrenderModalOpen, setIsSurrenderModalOpen] = useState(false)
  const [surrenderAttempts, setSurrenderAttempts] = useState(0)
  const [customGameOver, setCustomGameOver] = useState<{
    over: boolean
    winner: Side | null
    reason: string
  } | null>(null)

  const [selectedProfileUser, setSelectedProfileUser] = useState<NguoiXem | null>(null)

  interface DialogConfig {
    type: 'draw' | 'resign' | 'win' | 'start' | 'back'
    title: string
    subtitle: string
    confirmText?: string
    cancelText?: string
    onlyConfirm?: boolean
    icon: 'draw' | 'resign' | 'win' | 'start' | 'back'
    confirmVariant?: 'amber' | 'red' | 'emerald'
    onCancel?: () => void
    onConfirm: () => void
  }

  // Popup xác nhận hành động của người chơi (Xin thua, Xin hòa, Xin thắng, Bắt đầu, Rời phòng)
  const [centerDialog, setCenterDialog] = useState<DialogConfig | null>(null)

  // Popup thông báo nhận được từ đối thủ (Đối thủ xin hòa, xin thắng, xin thua, mời bắt đầu)
  const [incomingDialog, setIncomingDialog] = useState<DialogConfig | null>(null)

  const xinXoRef = useRef<HTMLDivElement>(null)

  // Đóng menu Xin xỏ khi nhấp bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const xinBtn = document.getElementById('xin-xo-btn')
      if (xinBtn && (xinBtn === target || xinBtn.contains(target))) {
        return
      }
      if (xinXoRef.current && !xinXoRef.current.contains(target)) {
        setIsXinXoMenuOpen(false)
      }
    }
    if (isXinXoMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isXinXoMenuOpen])

  // Tham chiếu DOM bàn cờ để tính toán toạ độ kéo thả và click toàn diện 90 ô
  const boardRef = useRef<HTMLElement>(null)

  // Bật/tắt gợi ý nước đi (Hướng dẫn) - Người chơi có thể tắt để tự do suy nghĩ mà không bị ép nhìn gợi ý
  const [showHints, setShowHints] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('xiangqi_show_hints')
        if (saved !== null) return saved !== 'false'
      } catch {}
    }
    return true
  })

  // Trạng thái kéo thả quân cờ trực tiếp trên bàn cờ
  interface DraggingPieceState {
    sq: number
    clientX: number
    clientY: number
    startX: number
    startY: number
    hasDragged: boolean
  }
  const [draggingPiece, setDraggingPiece] = useState<DraggingPieceState | null>(null)
  const justDraggedRef = useRef(false)

  // Menu và tin nhắn cảm xúc nhanh (Vùng 1+ của Bạn, Vùng 3 của Đối thủ)
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const [myQuickMessage, setMyQuickMessage] = useState<{ text: string; emoji?: string } | null>(null)
  const [opponentQuickMessage, setOpponentQuickMessage] = useState<{ text: string; emoji?: string } | null>(null)
  const myMsgTimerRef = useRef<NodeJS.Timeout | null>(null)
  const oppMsgTimerRef = useRef<NodeJS.Timeout | null>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)

  // Vị trí cố định của Popup Biểu cảm được clamp chặt chẽ trong Viewport
  const [quickMenuPos, setQuickMenuPos] = useState<{ left: number; top: number }>({ left: 16, top: 16 })

  const updateQuickMenuPos = useCallback(() => {
    if (typeof window === 'undefined') return
    const triggerEl =
      document.getElementById('tool-bubble-emoji') ||
      document.getElementById('quick-emoji-btn') ||
      avatarBubbleRef.current
    if (!triggerEl) return
    const rect = triggerEl.getBoundingClientRect()
    const POPUP_W = 240
    const POPUP_H = 268
    const PADDING = 12

    // Canh giữa theo chiều ngang của trigger element
    let left = rect.left + rect.width / 2 - POPUP_W / 2
    // Clamp chặt chẽ vào chiều ngang màn hình (không bao giờ bị chém mép trái/phải)
    left = Math.max(PADDING, Math.min(window.innerWidth - POPUP_W - PADDING, left))

    // Chiều dọc: Ưu tiên nằm phía TRÊN trigger element (khoảng cách 10px)
    let top = rect.top - POPUP_H - 10
    if (top < PADDING) {
      // Nếu phía trên không đủ không gian (sát nóc), lật xuống phía DƯỚI
      top = rect.bottom + 10
    }
    // Clamp chặt chẽ chiều dọc
    top = Math.max(PADDING, Math.min(window.innerHeight - POPUP_H - PADDING, top))

    setQuickMenuPos({ left, top })
  }, [])

  // Trạng thái thời gian vừa thiết lập xong để hiện trong 1.2s rồi tự chuyển sang nút Bắt Đầu
  const [recentlyChangedTime, setRecentlyChangedTime] = useState<number | null>(null)
  const timeChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cập nhật vị trí Popup Biểu cảm khi mở hoặc resize/scroll
  useEffect(() => {
    if (isQuickMenuOpen) {
      updateQuickMenuPos()
      window.addEventListener('resize', updateQuickMenuPos)
      window.addEventListener('scroll', updateQuickMenuPos, true)
      return () => {
        window.removeEventListener('resize', updateQuickMenuPos)
        window.removeEventListener('scroll', updateQuickMenuPos, true)
      }
    }
  }, [isQuickMenuOpen, updateQuickMenuPos])

  // Đóng menu Cảm xúc nhanh khi nhấp bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const emojiBtn =
        document.getElementById('tool-bubble-emoji') ||
        document.getElementById('quick-emoji-btn')
      if (emojiBtn && (emojiBtn === target || emojiBtn.contains(target))) {
        return
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(target)) {
        setIsQuickMenuOpen(false)
      }
    }
    if (isQuickMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isQuickMenuOpen])

  // Danh sách định danh công cụ có thể ghim thành bong bóng quanh Avatar
  const DEFAULT_PINNED_TOOLS: XiangqiToolId[] = ['settings', 'emoji', 'mode', 'invite', 'draw']

  // Danh sách công cụ được ghim thành các bong bóng nhỏ quanh Avatar
  const [pinnedTools, setPinnedTools] = useState<XiangqiToolId[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dc_xiangqi_pinned_tools')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5) as XiangqiToolId[]
          }
        }
      } catch {}
    }
    return DEFAULT_PINNED_TOOLS
  })

  const handleTogglePinTool = useCallback((toolId: XiangqiToolId) => {
    setPinnedTools((prev) => {
      let next: XiangqiToolId[]
      if (prev.includes(toolId)) {
        next = prev.filter((id) => id !== toolId)
      } else {
        if (prev.length >= 5) {
          // Giữ tối đa 5 bong bóng quanh avatar để khoảng cách và nhịp điệu luôn thoáng mắt
          next = [...prev.slice(1), toolId]
        } else {
          next = [...prev, toolId]
        }
      }
      try {
        localStorage.setItem('dc_xiangqi_pinned_tools', JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  // Tính toán tọa độ (x, y) của các bong bóng nhỏ xoay quanh Avatar (cách đều, thoáng mắt, không đè avatar và đồng hồ)
  const getBubbleCoordinates = (index: number, total: number) => {
    const D = 62 // Bán kính từ tâm avatar đến tâm bong bóng (tăng lên 62px để tạo khoảng đệm an toàn >= 12px với mép avatar)
    if (total <= 1) {
      return { x: -62, y: 0 }
    }
    // Góc từ 60° (Phía trên bên phải, hướng 2 giờ) đến 180° (Sườn trái ngang tầm tâm avatar, hướng 9 giờ)
    // Toàn bộ bong bóng nằm ở nửa trên và sườn trái (y <= 0), hoàn toàn giải phóng khu vực đáy dưới avatar cho đồng hồ
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

  const avatarBubbleRef = useRef<HTMLDivElement>(null)

  // Bounding box di chuyển Avatar trong Vùng 4 (không ra ngoài, tuyệt đối không chạm/đè bàn cờ)
  const VUNG_4_BOUNDS = {
    MIN_X: -200,
    MAX_X: 0,
    MIN_Y: -200,
    MAX_Y: 10,
  } as const

  const clampAvatarPos = (x: number, y: number) => ({
    x: Math.max(VUNG_4_BOUNDS.MIN_X, Math.min(VUNG_4_BOUNDS.MAX_X, x)),
    y: Math.max(VUNG_4_BOUNDS.MIN_Y, Math.min(VUNG_4_BOUNDS.MAX_Y, y)),
  })

  // Vị trí kéo thả tự do của Avatar người chơi trong Vùng 4
  const [avatarOffset, setAvatarOffset] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('xiangqi_avatar_pos')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            return clampAvatarPos(parsed.x, parsed.y)
          }
        }
      } catch {}
    }
    // Mặc định nằm chuẩn tại vị trí Vùng 4 cạnh bàn cờ
    return { x: 0, y: 0 }
  })

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
      initX: avatarOffset.x,
      initY: avatarOffset.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
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
    setAvatarOffset(clampAvatarPos(newX, newY))
    if (isQuickMenuOpen) {
      updateQuickMenuPos()
    }
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
        localStorage.setItem('xiangqi_avatar_pos', JSON.stringify(avatarOffset))
      } catch {}
    }
  }

  // Lắng nghe tin nhắn cảm xúc từ đối thủ qua online chat
  useEffect(() => {
    if (!online?.chat || online.chat.length === 0) return
    const lastMsg = online.chat[online.chat.length - 1]
    if (lastMsg && typeof lastMsg.text === 'string' && lastMsg.text.startsWith('[SYS_XQ_EMOJI]:')) {
      const content = lastMsg.text.replace('[SYS_XQ_EMOJI]:', '').trim()
      // Tách emoji nếu có (ví dụ: "👏 Nước cờ hay")
      const parts = content.split(' ')
      const possibleEmoji = parts[0]
      const isEmoji = /\p{Extended_Pictographic}/u.test(possibleEmoji)
      const emoji = isEmoji ? possibleEmoji : undefined
      const text = isEmoji ? parts.slice(1).join(' ') : content
      setOpponentQuickMessage({ text, emoji })
      if (oppMsgTimerRef.current) clearTimeout(oppMsgTimerRef.current)
      oppMsgTimerRef.current = setTimeout(() => setOpponentQuickMessage(null), 4000)
    }
  }, [online?.chat])

  const handleSendQuickMessage = (text: string, emoji?: string) => {
    setIsQuickMenuOpen(false)
    setMyQuickMessage({ text, emoji })
    if (myMsgTimerRef.current) clearTimeout(myMsgTimerRef.current)
    myMsgTimerRef.current = setTimeout(() => setMyQuickMessage(null), 4000)

    if (laOnline && online?.guiChat) {
      online.guiChat(`[SYS_XQ_EMOJI]:${emoji ? `${emoji} ` : ''}${text}`)
    } else if (isPveMode) {
      // Phản hồi ngẫu nhiên của AI sau 1.2s sang Vùng 3 của Đối thủ
      const aiResponses = [
        { text: 'Nước cờ hay đấy', emoji: '👏' },
        { text: 'Đang suy nghĩ', emoji: '🤔' },
        { text: 'Chiến tiếp nào', emoji: '🔥' },
        { text: 'Cảm ơn bạn', emoji: '🤝' },
        { text: 'Khá bất ngờ đấy', emoji: '😅' },
        { text: 'Nước đi sắc sảo', emoji: '👍' },
      ]
      setTimeout(() => {
        const resp = aiResponses[Math.floor(Math.random() * aiResponses.length)]
        setOpponentQuickMessage(resp)
        if (oppMsgTimerRef.current) clearTimeout(oppMsgTimerRef.current)
        oppMsgTimerRef.current = setTimeout(() => setOpponentQuickMessage(null), 4000)
      }, 1200)
    }
  }

  // Bàn online: thế cờ dựng lại từ chuỗi nước máy chủ đã xét; bên đi trước của ván cầm quân Đỏ.
  const nuocOnline = online?.moves
  const posOnline = useMemo(() => (nuocOnline ? dungTheCoTuong(nuocOnline) : null), [nuocOnline])
  const pos = laOnline && posOnline ? posOnline : posTaiCho
  const benOnline: Side | null = online?.mySide ? (mauQuanCua(online.meta.firstTurn, online.mySide) as Side) : null
  const benCuaToi: Side = laOnline ? (benOnline ?? RED) : playerSide

  // Xác định rõ phe cầm quân và đối thủ
  const mySide: Side = benCuaToi
  const opponentSide: Side = mySide === RED ? BLACK : RED

  // Xác định rõ đang ở chế độ PVE / AI (chủ phòng bật hoặc ván chọn đấu máy)
  const isPveMode = mode === 'ai'

  // Xác định có đối thủ thực sự hay chưa
  const hasOpponent = useMemo(() => {
    if (isPveMode) return true
    if (laOnline) {
      const oppActorKey = online?.mySide === 'X' ? online?.meta.playerO : online?.meta.playerX
      return Boolean(oppActorKey)
    }
    return true // local pvp / pass & play
  }, [isPveMode, laOnline, online?.mySide, online?.meta.playerO, online?.meta.playerX])

  // Thành viên đối thủ khi chơi online
  const opponentMember = useMemo(() => {
    if (!online || !hasOpponent) return null
    const oppActorKey = online.mySide === 'X' ? online.meta.playerO : online.meta.playerX
    if (!oppActorKey) return null
    return online.thanhVien.find((m) => m.key === oppActorKey) || null
  }, [online, hasOpponent])

  // Tên và avatar đối thủ
  const opponentName = isPveMode
    ? 'Người chơi AI'
    : laOnline
      ? (online?.mySide === 'X' ? online?.meta.playerOName : online?.meta.playerXName) || ''
      : 'Kỳ Thủ Khách'

  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const opponentAvatarUrl = isPveMode ? null : (opponentMember?.avatar || null)
  const myAvatarUrl = nguoiDung?.avatar || null

  // Tài khoản & Hồ sơ để tính toán Cấp độ (Level) và Elo
  const myAccountId = nguoiDung?.accountId ?? 0
  const oppAccountId = useMemo(() => {
    if (!laOnline || !hasOpponent) return 0
    if (opponentMember?.accountId) return opponentMember.accountId
    const oppActorKey = online?.mySide === 'X' ? online?.meta.playerO : online?.meta.playerX
    if (typeof oppActorKey === 'string' && oppActorKey.startsWith('acc:')) {
      const parsed = Number(oppActorKey.replace('acc:', ''))
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
    return 0
  }, [laOnline, hasOpponent, opponentMember, online?.mySide, online?.meta.playerO, online?.meta.playerX])

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

  // Tính Level & Elo cờ tướng
  const myLevel = useMemo(() => tinhLevel(myProfile?.totalXp ?? 0), [myProfile?.totalXp])
  const [myElo, setMyElo] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = `dc_xiangqi_elo_${nguoiDung?.accountId ?? 'guest'}`
        const saved = localStorage.getItem(key)
        if (saved) {
          const num = Number(saved)
          if (Number.isFinite(num) && num > 0) return num
        }
      } catch {}
    }
    return 1200
  })

  const opponentLevel = useMemo(() => {
    if (isPveMode) return 10
    return tinhLevel(opponentProfile?.totalXp ?? 0)
  }, [isPveMode, opponentProfile?.totalXp])

  const opponentElo = useMemo(() => {
    if (isPveMode) return 1500
    const xpBonus = Math.floor((opponentProfile?.totalXp ?? 0) / 10)
    return 1200 + Math.min(600, xpBonus)
  }, [isPveMode, opponentProfile?.totalXp])

  // Đảo góc nhìn bàn cờ: nếu online cầm quân Đen hoặc người dùng bấm xoay 180°
  const effectiveFlipped = benCuaToi !== RED ? !isFlippedManual : isFlippedManual

  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null)
  const [daBatDauVan, setDaBatDauVan] = useState(false)
  const [hasOfferedStart, setHasOfferedStart] = useState(false)

  // Nước đi mới nhất: lấy từ máy chủ online nếu đang chơi online, hoặc lấy từ state nội bộ
  const effectiveLastMove = useMemo(() => {
    if (laOnline && online?.moves && online.moves.length > 0) {
      return online.moves[online.moves.length - 1] as XiangqiMove
    }
    return lastMove
  }, [laOnline, online?.moves, lastMove])

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const laOnlinePvp = laOnline && !isPveMode
  const isCustomOver = Boolean(customGameOver?.over)
  const isOver = isCustomOver || (laOnlinePvp ? online?.meta.status === 'ended' : outcome.over)
  const toiDenLuotOnline = laOnlinePvp && Boolean(online?.isMyTurn) && pos.turn === benOnline
  const isPlaying = !isOver && (
    laOnlinePvp
      ? online?.meta.status === 'playing'
      : (daBatDauVan || lastMove !== null || isAiThinking)
  )

  const isMyTurn = isPlaying && (laOnlinePvp ? toiDenLuotOnline : isPveMode ? pos.turn === playerSide : true)
  const isOpponentTurn = isPlaying && !isMyTurn
  const activeDlg = centerDialog || incomingDialog

  const clock = useGameClock({
    isOnline: laOnlinePvp,
    isPlaying,
    isMyTurn,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online: isPveMode ? undefined : online,
    onTimeout: useCallback(() => {
      if (isOver) return
      const benThua = pos.turn
      const benThang = benThua === RED ? (1 as Side) : RED
      setCustomGameOver({
        over: true,
        winner: benThang,
        reason: `${pos.turn === RED ? 'Bên Đỏ' : 'Bên Đen'} hết giờ`,
      })
    }, [isOver, pos.turn]),
  })

  const isPlayerTimedOut = isOver && (
    customGameOver?.reason?.includes('hết giờ')
      ? customGameOver.reason.includes(mySide === RED ? 'Bên Đỏ' : 'Bên Đen')
      : clock.timeRemaining === 0 && isMyTurn
  )
  const isOpponentTimedOut = isOver && (
    customGameOver?.reason?.includes('hết giờ')
      ? customGameOver.reason.includes(opponentSide === RED ? 'Bên Đỏ' : 'Bên Đen')
      : clock.timeRemaining === 0 && isOpponentTurn
  )

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

  // Nước đi hợp lệ từ ô đang chọn
  const validTargets = useMemo(() => {
    if (selectedSq === null) return []
    return legalMoves.filter((m) => m.from === selectedSq).map((m) => m.to)
  }, [selectedSq, legalMoves])

  // Danh sách các quân cờ hiện tại trên bàn để render layer quân cờ
  const piecesToRender = useMemo(() => {
    const list: Array<{
      sq: number
      piece: number
      side: Side
      type: number
      xPercent: number
      yPercent: number
    }> = []

    for (let sq = 0; sq < pos.board.length; sq++) {
      const piece = pos.board[sq]
      if (piece > 0) {
        const file = fileOf(sq)
        const rank = rankOf(sq)
        const c = effectiveFlipped ? 8 - file : file
        const r = effectiveFlipped ? rank : 9 - rank
        const xPercent = ((82 + c * 92) / 900) * 100
        const yPercent = ((86 + r * 92) / 1000) * 100
        list.push({
          sq,
          piece,
          side: sideOf(piece) as Side,
          type: typeOf(piece),
          xPercent,
          yPercent,
        })
      }
    }
    return list
  }, [pos.board, effectiveFlipped])

  // Bàn online: gửi máy chủ xét, thế cờ chỉ đổi khi máy chủ phát lại
  const executeMove = useCallback(
    (move: XiangqiMove) => {
      const isCapture = pos.board[move.to] > 0
      if (isCapture) {
        soundEngine.playCapture()
      } else {
        soundEngine.playMove()
      }
      setDaBatDauVan(true)
      if (laOnlinePvp) {
        online?.diCo(move)
        setSelectedSq(null)
        return
      }
      posTaiCho.makeMove(move)
      setPos(posTaiCho.clone())
      setLastMove(move)
      setSelectedSq(null)
    },
    [laOnlinePvp, online, pos.board, posTaiCho]
  )

  // AI phản hồi tự động ở chế độ PvE
  useEffect(() => {
    if (isPveMode && pos.turn !== playerSide && !isOver) {
      setIsAiThinking(true)
      const timer = setTimeout(() => {
        const best = findBestXiangqiMove(pos, aiLevel)
        if (best) {
          executeMove(best)
        }
        setIsAiThinking(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [pos, isPveMode, playerSide, aiLevel, isOver, executeMove])

  const handleSquareClick = (sq: number) => {
    if (heroicBanner) {
      setHeroicBanner(null)
    }
    if (isOver || isAiThinking) return

    if (isPveMode && pos.turn !== playerSide) {
      showGameNotice('LƯỢT MÁY ĐI')
      return
    }

    if (laOnlinePvp) {
      if (!online?.mySide) {
        showGameNotice('CHƯA VÀO BÀN')
        return
      }
      if (online.meta.status === 'waiting') {
        showGameNotice('CHỜ ĐỐI THỦ')
        return
      }
      if (!toiDenLuotOnline) {
        showGameNotice('LƯỢT ĐỐI THỦ')
        return
      }
    }

    const piece = pos.board[sq]

    // 1. ĐÃ CHỌN 1 QUÂN TRƯỚC ĐÓ:
    if (selectedSq !== null) {
      // Nhấp lại chính quân đang chọn -> Hủy chọn
      if (sq === selectedSq) {
        setSelectedSq(null)
        return
      }
      // Nhấp vào ô đích hợp lệ (kể cả ô trống hay ăn quân đối phương) -> Đi cờ / Ăn cờ ngay lập tức
      if (validTargets.includes(sq)) {
        executeMove({ from: selectedSq, to: sq })
        return
      }
      // Nhấp vào quân khác cùng phe mình -> Chuyển chọn sang quân mới ngay
      if (piece > 0 && sideOf(piece) === pos.turn) {
        setSelectedSq(sq)
        return
      }
      // Nhấp vào ô bất kỳ không hợp lệ -> Hủy chọn
      setSelectedSq(null)
      return
    }

    // 2. CHƯA CHỌN QUÂN NÀO:
    // Chỉ cho phép chọn quân của phe đang tới lượt
    if (piece > 0 && sideOf(piece) === pos.turn) {
      if (!daBatDauVan) {
        setDaBatDauVan(true)
      }
      setSelectedSq(sq)
    }
  }

  // Bắt đầu kéo quân cờ trực tiếp trên bàn cờ tự do (chỉ kích hoạt kéo thả khi rê chuột)
  const handlePiecePointerDown = (sq: number, canMove: boolean, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if (heroicBanner) setHeroicBanner(null)
    if (isOver || isAiThinking) return

    if (!canMove) {
      return
    }

    setDraggingPiece({
      sq,
      clientX: e.clientX,
      clientY: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      hasDragged: false,
    })
  }

  const handlePiecePointerMove = (sq: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingPiece || draggingPiece.sq !== sq) return
    const dx = e.clientX - draggingPiece.startX
    const dy = e.clientY - draggingPiece.startY
    const hasDragged = draggingPiece.hasDragged || Math.hypot(dx, dy) > 5
    if (!draggingPiece.hasDragged && hasDragged) {
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}
    }
    setDraggingPiece((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY, hasDragged } : null))
  }

  const handlePiecePointerUp = (sq: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingPiece || draggingPiece.sq !== sq) return
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    if (draggingPiece.hasDragged) {
      justDraggedRef.current = true
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        const xRatio = (e.clientX - rect.left) / rect.width
        const yRatio = (e.clientY - rect.top) / rect.height
        const boardX = xRatio * 900
        const boardY = yRatio * 1000
        const c = Math.max(0, Math.min(8, Math.round((boardX - 82) / 92)))
        const r = Math.max(0, Math.min(9, Math.round((boardY - 86) / 92)))
        const file = effectiveFlipped ? 8 - c : c
        const rank = effectiveFlipped ? r : 9 - r
        const targetSq = rank * 9 + file

        if (targetSq !== sq) {
          if (validTargets.includes(targetSq)) {
            executeMove({ from: sq, to: targetSq })
          } else {
            showGameNotice('NƯỚC ĐI SAI LUẬT')
          }
        }
      }
    }
    setDraggingPiece(null)
  }

  // Tương tác click tự do trên toàn bộ 90 giao điểm của bàn cờ
  const handleBoardPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isOver || isAiThinking) return
    const target = e.target as HTMLElement
    if (target.closest('.piece-disc')) return

    if (!boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const xRatio = (e.clientX - rect.left) / rect.width
    const yRatio = (e.clientY - rect.top) / rect.height
    const boardX = xRatio * 900
    const boardY = yRatio * 1000
    const c = Math.round((boardX - 82) / 92)
    const r = Math.round((boardY - 86) / 92)

    if (c >= 0 && c <= 8 && r >= 0 && r <= 9) {
      const file = effectiveFlipped ? 8 - c : c
      const rank = effectiveFlipped ? r : 9 - r
      const targetSq = rank * 9 + file
      handleSquareClick(targetSq)
    }
  }

  const resetGame = useCallback(() => {
    const newPos = XiangqiPosition.fromFen()
    setPos(newPos)
    setSelectedSq(null)
    setLastMove(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
    setIsAiThinking(false)
    setDaBatDauVan(true)
    setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
    playGameStartSound()
  }, [])

  // Tắt banner BẮT ĐẦU ngay khi có bất kỳ nước đi nào được thực hiện
  useEffect(() => {
    if (lastMove || (laOnline && online?.moves && online.moves.length > 0)) {
      if (heroicBanner?.type === 'start') {
        setHeroicBanner(null)
      }
    }
  }, [lastMove, laOnline, online?.moves, heroicBanner?.type])

  // Tự động kích hoạt banner xuất quân khi ván online bắt đầu
  useEffect(() => {
    if (vanVuaBatDau) {
      setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
      playGameStartSound()
      xoaVanVuaBatDau()
    }
  }, [vanVuaBatDau, xoaVanVuaBatDau])

  useEffect(() => {
    if (online?.meta.status === 'playing') {
      setHasOfferedStart(false)
      setIncomingDialog(null)
    }
  }, [online?.meta.status])

  const handleModeChange = (newMode: PlayMode) => {
    if (!doiCheDo(newMode)) {
      if (laOnlinePvp) {
        if (online && online.mySide !== 'X') {
          showGameNotice('CHỈ CHỦ BÀN MỚI ĐỔI ĐƯỢC')
        } else {
          showGameNotice('BÀN ĐẤU ONLINE', 'Đang ở phòng thi đấu trực tuyến')
        }
      } else {
        showGameNotice('KHÔNG THỂ ĐỔI CHẾ ĐỘ')
      }
      return
    }
    setSelectedSq(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
    setIsAiThinking(false)
    setLastMove(null)
    setCenterDialog(null)
    setIncomingDialog(null)

    if (newMode === 'ai' || newMode === 'pass_and_play') {
      const fresh = XiangqiPosition.fromFen()
      setPos(fresh)
      setDaBatDauVan(true)
    }

    if (online) {
      online.datPve(newMode === 'ai')
      if (newMode !== 'ai' && online.meta.playerX && online.meta.playerO && online.meta.status !== 'playing') {
        online.startGame()
      }
    }

    if (newMode === 'ai') {
      showGameNotice('ĐẤU VỚI MÁY')
    } else {
      showGameNotice('ĐẤU ĐỐI KHÁNG')
    }
  }

  // 1. XIN HÒA - Card xác nhận đơn giản, gửi thông báo tương tự cho đối thủ
  const handleOfferDraw = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isAiThinking) {
      showGameNotice('MÁY ĐANG TÍNH NƯỚC')
      return
    }
    if (isOver) {
      showGameNotice('VÁN ĐÃ KẾT THÚC', 'Nhấn Bắt Đầu để chơi ván mới')
      return
    }
    if (!isPlaying) {
      showGameNotice('VÁN CHƯA BẮT ĐẦU', 'Nhấn Bắt Đầu ở giữa bàn cờ')
      return
    }
    if (laOnlinePvp && !online?.mySide) {
      showGameNotice('BẠN ĐANG XEM BÀN ĐẤU')
      return
    }
    if (laOnlinePvp && (!online?.meta.playerX || !online?.meta.playerO)) {
      showGameNotice('ĐANG CHỜ ĐỐI THỦ')
      return
    }
    setCenterDialog({
      type: 'draw',
      icon: 'draw',
      title: 'Xin Hòa',
      subtitle: 'Bạn có đồng ý xin hòa không?',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      confirmVariant: 'amber',
      onConfirm: () => {
        setCenterDialog(null)
        if (isPveMode) {
          setCustomGameOver({
            over: true,
            winner: null,
            reason: 'Máy AI đồng ý hoà cờ',
          })
          setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
          playGameOverSound('draw')
          return
        }
        if (laOnline && online) {
          online.guiChat(`${PROPOSAL_PREFIX}draw_offer`)
          showGameNotice('ĐÃ XIN HOÀ')
          return
        }
        // Mô phỏng đối thủ trong chế độ PvP cục bộ / test
        setIncomingDialog({
          type: 'draw',
          icon: 'draw',
          title: 'Đối Thủ Xin Hòa',
          subtitle: 'Đối thủ xin hòa, bạn có đồng ý không?',
          confirmText: 'Đồng ý',
          cancelText: 'Chơi tiếp',
          confirmVariant: 'amber',
          onCancel: () => {
            setIncomingDialog(null)
            showGameNotice('TỪ CHỐI HOÀ CỜ')
          },
          onConfirm: () => {
            setIncomingDialog(null)
            setCustomGameOver({
              over: true,
              winner: null,
              reason: 'Hai bên đồng thuận hoà cờ',
            })
            setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
            playGameOverSound('draw')
          },
        })
      },
    })
  }, [isOver, isPlaying, isAiThinking, isPveMode, laOnline, laOnlinePvp, online, showGameNotice])

  // 2. XIN THUA - Card xác nhận đơn giản, gửi thông báo cho đối thủ
  const handleResign = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isAiThinking) {
      showGameNotice('MÁY ĐANG TÍNH NƯỚC')
      return
    }
    if (isOver) {
      showGameNotice('VÁN ĐÃ KẾT THÚC', 'Nhấn Bắt Đầu để chơi ván mới')
      return
    }
    if (!isPlaying) {
      showGameNotice('VÁN CHƯA BẮT ĐẦU', 'Nhấn Bắt Đầu ở giữa bàn cờ')
      return
    }
    if (laOnlinePvp && !online?.mySide) {
      showGameNotice('BẠN ĐANG XEM BÀN ĐẤU')
      return
    }
    if (laOnlinePvp && (!online?.meta.playerX || !online?.meta.playerO)) {
      showGameNotice('ĐANG CHỜ ĐỐI THỦ')
      return
    }
    setCenterDialog({
      type: 'resign',
      icon: 'resign',
      title: 'Xin Thua',
      subtitle: 'Bạn có đồng ý xin thua không?',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      confirmVariant: 'red',
      onConfirm: () => {
        setCenterDialog(null)
        if (isPveMode) {
          const losingSide = playerSide
          const winningSide = losingSide === RED ? (1 as Side) : (RED as Side)
          setCustomGameOver({
            over: true,
            winner: winningSide,
            reason: 'Bạn đã xin thua',
          })
          setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
          soundEngine.playDefeat()
          return
        }
        if (laOnline && online) {
          online.guiChat(`${PROPOSAL_PREFIX}resign_offer`)
          showGameNotice('ĐÃ XIN THUA')
          return
        }
        // Mô phỏng đối thủ trong chế độ PvP cục bộ (pass & play)
        const losingSide = pos.turn
        const winningSide = losingSide === RED ? (1 as Side) : (RED as Side)
        setIncomingDialog({
          type: 'resign',
          icon: 'resign',
          title: 'Đối Thủ Xin Thua',
          subtitle: 'Đối thủ xin thua ván này, bạn có đồng ý không?',
          confirmText: 'Đồng ý',
          cancelText: 'Chơi tiếp',
          confirmVariant: 'emerald',
          onCancel: () => {
            setIncomingDialog(null)
            showGameNotice('TỪ CHỐI XIN THUA')
          },
          onConfirm: () => {
            setIncomingDialog(null)
            setCustomGameOver({
              over: true,
              winner: winningSide,
              reason: `${losingSide === RED ? 'Bên Đỏ' : 'Bên Đen'} đã xin thua và đối thủ đã đồng ý`,
            })
            setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
            soundEngine.playVictory()
          },
        })
      },
    })
  }, [isOver, isPlaying, isAiThinking, isPveMode, playerSide, pos.turn, laOnline, laOnlinePvp, online, showGameNotice])

  // 3. XIN THẮNG - Card xác nhận đơn giản, gửi thông báo cho đối thủ
  const handleAskForWin = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isAiThinking) {
      showGameNotice('MÁY ĐANG TÍNH NƯỚC')
      return
    }
    if (isOver) {
      showGameNotice('VÁN ĐÃ KẾT THÚC', 'Nhấn Bắt Đầu để chơi ván mới')
      return
    }
    if (!isPlaying) {
      showGameNotice('VÁN CHƯA BẮT ĐẦU', 'Nhấn Bắt Đầu ở giữa bàn cờ')
      return
    }
    if (laOnlinePvp && !online?.mySide) {
      showGameNotice('BẠN ĐANG XEM BÀN ĐẤU')
      return
    }
    if (laOnlinePvp && (!online?.meta.playerX || !online?.meta.playerO)) {
      showGameNotice('ĐANG CHỜ ĐỐI THỦ')
      return
    }
    setCenterDialog({
      type: 'win',
      icon: 'win',
      title: 'Xin Thắng',
      subtitle: 'Bạn có đồng ý xin thắng không?',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      confirmVariant: 'emerald',
      onConfirm: () => {
        setCenterDialog(null)
        if (isPveMode) {
          setCustomGameOver({
            over: true,
            winner: benCuaToi,
            reason: 'Máy AI đã hào hiệp nhường bạn chiến thắng! 🎉',
          })
          setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
          soundEngine.playVictory()
          return
        }
        if (laOnline && online) {
          online.guiChat(`${PROPOSAL_PREFIX}win_offer`)
          showGameNotice('ĐÃ XIN THẮNG')
          return
        }
        // Mô phỏng đối thủ trong chế độ PvP cục bộ / test
        setIncomingDialog({
          type: 'win',
          icon: 'win',
          title: 'Đối Thủ Xin Thắng',
          subtitle: 'Đối thủ xin thắng, bạn có đồng ý không?',
          confirmText: 'Đồng ý',
          cancelText: 'Chơi tiếp',
          confirmVariant: 'emerald',
          onCancel: () => {
            setIncomingDialog(null)
            showGameNotice('TỪ CHỐI NHƯỜNG THẮNG')
          },
          onConfirm: () => {
            setIncomingDialog(null)
            setCustomGameOver({
              over: true,
              winner: benCuaToi,
              reason: 'Đối thủ đã nhường bạn thắng ván này! 🎉',
            })
            setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
            soundEngine.playVictory()
          },
        })
      },
    })
  }, [isOver, isPlaying, isAiThinking, isPveMode, benCuaToi, laOnline, laOnlinePvp, online, showGameNotice])

  // 4. BẮT ĐẦU: Xử lý cho cả Online, PvE và PvP cục bộ
  const handleStartGameClick = useCallback(() => {
    setHeroicBanner(null)
    if (isPveMode) {
      setCustomGameOver(null)
      resetGame()
      return
    }
    if (laOnlinePvp && online) {
      if (!online.mySide) {
        online.joinGame()
        showGameNotice('ĐÃ VÀO BÀN')
        return
      }
      if (!online.meta.playerX || !online.meta.playerO) {
        showGameNotice('CHỜ ĐỐI THỦ')
        return
      }
      if (hasOfferedStart) {
        showGameNotice('ĐANG CHỜ ĐỐI THỦ', 'Đã sẵn sàng, chờ đối thủ xác nhận...')
        return
      }
      // Nếu đối thủ đã mời trước đó -> bấm xác nhận ngay để vào trận
      if (incomingDialog?.type === 'start') {
        setIncomingDialog(null)
        setHasOfferedStart(false)
        online.guiChat(`${PROPOSAL_PREFIX}start_accept`)
        setCustomGameOver(null)
        resetGame()
        online.startGame()
        setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
        playGameStartSound()
        return
      }
      // Gửi lời mời bắt đầu trận đấu để 2 bên cùng xác nhận
      setHasOfferedStart(true)
      online.guiChat(`${PROPOSAL_PREFIX}start_offer`)
      try {
        online.rematch()
      } catch {}
      showGameNotice('ĐÃ SẴN SÀNG', 'Đang chờ đối thủ xác nhận...')
      return
    }
    // Chế độ PvP cục bộ (pass & play): nếu trận đã kết thúc, hỏi xác nhận đối thủ
    if (isOver) {
      setIncomingDialog({
        type: 'start',
        icon: 'start',
        title: 'Bắt Đầu Trận Đấu',
        subtitle: 'Đối thủ muốn bắt đầu ván mới, bạn có đồng ý không?',
        cancelText: 'Chưa sẵn sàng',
        confirmText: 'Đồng ý',
        confirmVariant: 'amber',
        onCancel: () => {
          setIncomingDialog(null)
          showGameNotice('CHƯA SẴN SÀNG')
        },
        onConfirm: () => {
          setIncomingDialog(null)
          setCustomGameOver(null)
          resetGame()
        },
      })
      return
    }
    setCustomGameOver(null)
    resetGame()
  }, [isPveMode, resetGame, laOnlinePvp, online, isOver, showGameNotice])

  const handleBackLobby = useCallback(() => {
    if (isOver) {
      onBack?.()
      return
    }
    setCenterDialog({
      type: 'back',
      icon: 'back',
      title: 'Rời Phòng',
      subtitle: 'Bạn có chắc chắn muốn rời phòng không?',
      confirmText: 'Đồng ý',
      cancelText: 'Chơi tiếp',
      confirmVariant: 'amber',
      onConfirm: () => {
        setCenterDialog(null)
        onBack?.()
      },
    })
  }, [isOver, onBack])

  // Lắng nghe các thông báo đề nghị từ đối thủ qua kênh phòng online (chỉ xử lý tin nhắn mới phát sinh trong phiên)
  const isFirstMountProposalRef = useRef(true)
  const lastHandledProposalMsgIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (!laOnline || !online || !online.chat.length) return

    // Khi vừa vào phòng hoặc tải lại trang, ghi nhận tin nhắn cuối cùng hiện tại để không thực thi lại các tin nhắn cũ từ lịch sử
    if (isFirstMountProposalRef.current) {
      isFirstMountProposalRef.current = false
      const initialLastMsg = online.chat[online.chat.length - 1]
      if (initialLastMsg) {
        lastHandledProposalMsgIdRef.current =
          initialLastMsg.id || (initialLastMsg as any).thoiGian || `${online.chat.length}_${initialLastMsg.text}`
      }
      return
    }

    const lastMsg = online.chat[online.chat.length - 1]
    const isFromMe = String(lastMsg?.accountId) === online.myActorKey?.replace(/^acc:/, '')
    if (!lastMsg || isFromMe) return

    // Tránh xử lý lặp lại cùng 1 tin nhắn khi component re-render
    const msgId = lastMsg.id || (lastMsg as any).thoiGian || `${online.chat.length}_${lastMsg.text}`
    if (lastHandledProposalMsgIdRef.current === msgId) return
    lastHandledProposalMsgIdRef.current = msgId

    if (lastMsg.text.startsWith(PROPOSAL_PREFIX)) {
      const action = lastMsg.text.slice(PROPOSAL_PREFIX.length).trim()
      if (action === 'start_offer') {
        if (hasOfferedStart) {
          // Cả hai bên đều đã bấm sẵn sàng -> tự động bắt đầu ván ngay lập tức
          setHasOfferedStart(false)
          setIncomingDialog(null)
          online.guiChat(`${PROPOSAL_PREFIX}start_accept`)
          setCustomGameOver(null)
          resetGame()
          online.startGame()
          setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
          playGameStartSound()
          return
        }
        setIncomingDialog({
          type: 'start',
          icon: 'start',
          title: 'Bắt Đầu Trận Đấu',
          subtitle: 'Đối thủ đã sẵn sàng và mời bắt đầu, bạn có đồng ý không?',
          cancelText: 'Chưa sẵn sàng',
          confirmText: 'Sẵn sàng ngay',
          confirmVariant: 'amber',
          onCancel: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}start_decline`)
          },
          onConfirm: () => {
            setIncomingDialog(null)
            setHasOfferedStart(false)
            online.guiChat(`${PROPOSAL_PREFIX}start_accept`)
            setCustomGameOver(null)
            resetGame()
            online.startGame()
            setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
            playGameStartSound()
          },
        })
      } else if (action === 'start_accept') {
        setHasOfferedStart(false)
        setCustomGameOver(null)
        resetGame()
        online.startGame()
        setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
        playGameStartSound()
      } else if (action === 'start_decline') {
        setHasOfferedStart(false)
        showGameNotice('CHƯA SẴN SÀNG', 'Đối thủ chưa sẵn sàng')
      } else if (action === 'draw_offer') {
        setIncomingDialog({
          type: 'draw',
          icon: 'draw',
          title: 'Đối Thủ Xin Hòa',
          subtitle: 'Đối thủ xin hòa, bạn có đồng ý không?',
          cancelText: 'Chơi tiếp',
          confirmText: 'Đồng ý',
          confirmVariant: 'amber',
          onCancel: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}draw_decline`)
          },
          onConfirm: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}draw_accept`)
            setCustomGameOver({
              over: true,
              winner: null,
              reason: 'Hai bên đồng thuận hoà cờ',
            })
            setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
            playGameOverSound('draw')
          },
        })
      } else if (action === 'draw_accept') {
        setCustomGameOver({
          over: true,
          winner: null,
          reason: 'Đối thủ đã đồng ý hoà cờ',
        })
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
        playGameOverSound('draw')
      } else if (action === 'draw_decline') {
        showGameNotice('TỪ CHỐI HOÀ CỜ')
      } else if (action === 'win_offer') {
        setIncomingDialog({
          type: 'win',
          icon: 'win',
          title: 'Đối Thủ Xin Thắng',
          subtitle: 'Đối thủ xin thắng, bạn có đồng ý không?',
          cancelText: 'Chơi tiếp',
          confirmText: 'Đồng ý',
          confirmVariant: 'emerald',
          onCancel: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}win_decline`)
          },
          onConfirm: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}win_accept`)
            setCustomGameOver({
              over: true,
              winner: benCuaToi === RED ? 1 : RED,
              reason: 'Bạn đã nhường đối thủ thắng',
            })
            setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
            soundEngine.playDefeat()
          },
        })
      } else if (action === 'win_accept') {
        setCustomGameOver({
          over: true,
          winner: benCuaToi,
          reason: 'Đối thủ đã nhường bạn thắng',
        })
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
        soundEngine.playVictory()
      } else if (action === 'win_decline') {
        showGameNotice('TỪ CHỐI NHƯỜNG THẮNG')
      } else if (action === 'resign_offer') {
        setIncomingDialog({
          type: 'resign',
          icon: 'resign',
          title: 'Đối Thủ Xin Thua',
          subtitle: 'Đối thủ xin thua ván này, bạn có đồng ý không?',
          cancelText: 'Chơi tiếp',
          confirmText: 'Đồng ý',
          confirmVariant: 'emerald',
          onCancel: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}resign_decline`)
            showGameNotice('TIẾP TỤC THI ĐẤU')
          },
          onConfirm: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}resign_accept`)
            setCustomGameOver({
              over: true,
              winner: benCuaToi,
              reason: 'Đối thủ đã xin thua ván này',
            })
            setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
            soundEngine.playVictory()
          },
        })
      } else if (action === 'resign_accept') {
        setCustomGameOver({
          over: true,
          winner: benCuaToi === RED ? 1 : RED,
          reason: 'Đối thủ đã đồng ý cho bạn xin thua',
        })
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
        soundEngine.playDefeat()
        try {
          online.surrender()
        } catch {}
      } else if (action === 'resign_decline') {
        showGameNotice('TỪ CHỐI XIN THUA')
      } else if (action === 'resign') {
        setIncomingDialog({
          type: 'resign',
          icon: 'resign',
          title: 'Đối Thủ Xin Thua',
          subtitle: 'Đối thủ xin thua ván này, bạn có đồng ý không?',
          cancelText: 'Chơi tiếp',
          confirmText: 'Đồng ý',
          confirmVariant: 'emerald',
          onCancel: () => {
            setIncomingDialog(null)
            showGameNotice('TIẾP TỤC THI ĐẤU')
          },
          onConfirm: () => {
            setIncomingDialog(null)
            setCustomGameOver({
              over: true,
              winner: benCuaToi,
              reason: 'Đối thủ đã xin thua ván này',
            })
            setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
            soundEngine.playVictory()
          },
        })
      }
    }
  }, [laOnline, online, benCuaToi, resetGame, showGameNotice])

  const winnerOnline: Side | null =
    online && (online.meta.winner === 'X' || online.meta.winner === 'O')
      ? (mauQuanCua(online.meta.firstTurn, online.meta.winner) as Side)
      : null
  const winnerSide = laOnline ? winnerOnline : outcome.over ? outcome.winner : customGameOver?.winner
  const laNguoiThang = isOver && winnerSide !== null && winnerSide !== undefined ? winnerSide === benCuaToi : null

  // Banner & âm thanh khi bị chiếu tướng
  const prevInCheckRef = useRef(inCheck)
  useEffect(() => {
    if (!prevInCheckRef.current && inCheck && !isOver) {
      setHeroicBanner({ type: 'check', title: 'CHIẾU TƯỚNG' })
      soundEngine.playCheck()
    }
    prevInCheckRef.current = inCheck
  }, [inCheck, isOver])

  // Âm thanh khi kết thúc ván: Thắng, Thua, Hoà
  const wasOverRef = useRef(isOver)
  useEffect(() => {
    if (!wasOverRef.current && isOver) {
      setDaBatDauVan(false)
      if (laNguoiThang === true) {
        soundEngine.playVictory()
        setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
        setMyElo((prev) => {
          const next = prev + 15
          try {
            localStorage.setItem(`dc_xiangqi_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else if (laNguoiThang === false) {
        soundEngine.playDefeat()
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
        setMyElo((prev) => {
          const next = Math.max(800, prev - 12)
          try {
            localStorage.setItem(`dc_xiangqi_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      } else {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
        setMyElo((prev) => {
          const next = prev + 2
          try {
            localStorage.setItem(`dc_xiangqi_elo_${nguoiDung?.accountId ?? 'guest'}`, String(next))
          } catch {}
          return next
        })
      }
    }
    wasOverRef.current = isOver
  }, [laNguoiThang, isOver, nguoiDung?.accountId])

  // Cấu hình danh mục công cụ cờ tướng (hiển thị trong Cài đặt và ghim thành các bong bóng quanh Avatar)
  const toolDefinitions: Record<
    XiangqiToolId,
    {
      id: XiangqiToolId
      title: string
      bubbleClassName: string
      renderIcon: (compact?: boolean) => React.ReactNode
      onClick: () => void
      disabled?: boolean
    }
  > = {
    settings: {
      id: 'settings',
      title: 'Cài đặt',
      bubbleClassName:
        'border-sky-500/50 bg-[#141824]/95 text-sky-400 hover:border-sky-400 hover:text-sky-300 hover:bg-sky-500/20 shadow-sky-500/15',
      renderIcon: (compact) => <Settings className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: () => setIsSettingsModalOpen(true),
    },
    emoji: {
      id: 'emoji',
      title: 'Biểu cảm',
      bubbleClassName: cn(
        'border-amber-500/50 bg-[#18161e]/95 text-amber-400 hover:border-amber-400 hover:text-amber-300 hover:bg-amber-500/20 shadow-amber-500/15',
        isQuickMenuOpen && 'border-amber-400 bg-amber-500/25 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
      ),
      renderIcon: (compact) => <Smile className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: () => {
        updateQuickMenuPos()
        setIsQuickMenuOpen((prev) => !prev)
      },
    },
    mode: {
      id: 'mode',
      title: isPveMode ? 'Chế độ PvE' : 'Chế độ PvP',
      bubbleClassName: isPveMode
        ? 'border-sky-500/50 bg-[#121926]/95 text-sky-400 hover:border-sky-400 hover:text-sky-300 hover:bg-sky-500/20 shadow-sky-500/15'
        : 'border-amber-500/50 bg-[#1a1714]/95 text-amber-400 hover:border-amber-400 hover:text-amber-300 hover:bg-amber-500/20 shadow-amber-500/15',
      renderIcon: (compact) => (isPveMode ? <Bot className={compact ? 'size-4' : 'size-4.5'} /> : <Users className={compact ? 'size-4' : 'size-4.5'} />),
      onClick: () => {
        if (isPveMode) {
          handleModeChange(online ? 'online' : 'pass_and_play')
        } else {
          handleModeChange('ai')
        }
      },
    },
    invite: {
      id: 'invite',
      title: 'Mời bạn',
      bubbleClassName:
        'border-emerald-500/50 bg-[#121a18]/95 text-emerald-400 hover:border-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 shadow-emerald-500/15',
      renderIcon: (compact) => <UserPlus className={compact ? 'size-4' : 'size-4.5'} />,
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
    },
    draw: {
      id: 'draw',
      title: 'Xin hòa',
      bubbleClassName:
        'border-amber-500/50 bg-[#181614]/95 text-amber-400 hover:border-amber-400 hover:text-amber-300 hover:bg-amber-500/20 shadow-amber-500/15',
      renderIcon: (compact) => <Handshake className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: handleOfferDraw,
    },
    resign: {
      id: 'resign',
      title: 'Xin thua',
      bubbleClassName:
        'border-red-500/50 bg-[#1c1214]/95 text-red-400 hover:border-red-400 hover:text-red-300 hover:bg-red-500/20 shadow-red-500/15',
      renderIcon: (compact) => <Flag className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: handleResign,
    },
    win: {
      id: 'win',
      title: 'Xin thắng',
      bubbleClassName:
        'border-yellow-500/50 bg-[#1a1912]/95 text-yellow-400 hover:border-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 shadow-yellow-500/15',
      renderIcon: (compact) => <Crown className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: handleAskForWin,
    },
    flip: {
      id: 'flip',
      title: 'Xoay bàn cờ',
      bubbleClassName:
        'border-indigo-500/50 bg-[#161424]/95 text-indigo-400 hover:border-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 shadow-indigo-500/15',
      renderIcon: (compact) => <RotateCcw className={compact ? 'size-4' : 'size-4.5'} />,
      onClick: () => {
        setIsFlippedManual((prev) => {
          const next = !prev
          showGameNotice(next ? 'ĐẢO GÓC NHÌN' : 'GÓC NHÌN CHUẨN')
          return next
        })
      },
    },
    sound: {
      id: 'sound',
      title: soundEnabled ? 'Bật âm thanh' : 'Tắt âm thanh',
      bubbleClassName: soundEnabled
        ? 'border-purple-500/50 bg-[#191424]/95 text-purple-400 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-500/20 shadow-purple-500/15'
        : 'border-gray-500/50 bg-[#16161a]/95 text-gray-400 hover:border-gray-400 hover:text-gray-300 hover:bg-white/10 shadow-black/20',
      renderIcon: (compact) => (soundEnabled ? <Volume2 className={compact ? 'size-4' : 'size-4.5'} /> : <VolumeX className={compact ? 'size-4' : 'size-4.5'} />),
      onClick: () => {
        setSoundEnabled((prev) => {
          const next = !prev
          soundEngine.enabled = next
          showGameNotice(next ? 'ĐÃ BẬT ÂM THANH' : 'ĐÃ TẮT ÂM THANH')
          return next
        })
      },
    },
    hints: {
      id: 'hints',
      title: showHints ? 'Tắt gợi ý' : 'Bật gợi ý',
      bubbleClassName: showHints
        ? 'border-sky-500/50 bg-[#121926]/95 text-sky-400 hover:border-sky-400 hover:text-sky-300 hover:bg-sky-500/20 shadow-sky-500/15'
        : 'border-gray-500/50 bg-[#16161a]/95 text-gray-400 hover:border-gray-400 hover:text-gray-300 hover:bg-white/10 shadow-black/20',
      renderIcon: (compact) => (showHints ? <Eye className={compact ? 'size-4' : 'size-4.5'} /> : <EyeOff className={compact ? 'size-4' : 'size-4.5'} />),
      onClick: () => {
        setShowHints((prev) => {
          const next = !prev
          try {
            localStorage.setItem('xiangqi_show_hints', String(next))
          } catch {}
          showGameNotice(next ? 'BẬT GỢI Ý' : 'TẮT GỢI Ý')
          return next
        })
      },
    },
  }

  return (
    <div className="flex flex-col items-center justify-start w-full h-full min-w-0 overflow-hidden">
      {/* 1. HÀNG CÔNG CỤ NHANH TRÊN CÙNG: RỘNG RÃI, THOÁNG MẮT, VÙNG 3 SÁT GÓC TRÁI & ĐỒNG HỒ CHÍNH GIỮA */}
      <header className="w-full px-2 sm:px-4 py-1 mb-1 relative flex items-center min-h-[40px] shrink-0">
        {/* CỤM TRÁI: ĐIỀU HƯỚNG SẢNH, ICON GAME TO RÕ ĐẸP (VÙNG 2) & BADGE RIÊNG TƯ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0 z-10">
          {/* Nút Quay lại Sảnh */}
          <button
            type="button"
            id="game-leave-btn"
            onClick={handleBackLobby}
            className="h-8 px-2.5 rounded-lg text-xs gap-1.5 inline-flex items-center font-medium text-text-secondary hover:text-text-primary bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors duration-150 shrink-0"
            title="Quay lại sảnh"
            aria-label="Quay lại sảnh"
          >
            <ArrowLeft className="size-3.5" />
            <span>Sảnh</span>
          </button>

          {/* Nút Đấu lại khi ván kết thúc (isOver) */}
          {isOver && (
            <button
              type="button"
              id="game-rematch-btn"
              onClick={handleStartGameClick}
              className="h-8 px-3 rounded-lg text-xs gap-1.5 inline-flex items-center font-bold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer transition-colors duration-150 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title="Chơi ván mới"
              aria-label="Chơi ván mới"
            >
              <Swords className="size-3.5 text-amber-400" />
              <span>Đấu lại</span>
            </button>
          )}

          {/* VÙNG 2: ICON GAME CỜ TƯỚNG TO RÕ, ĐẲNG CẤP & SỐ PHÒNG */}
          {roomName && (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-900/40 border border-amber-500/25 shadow-[0_2px_8px_rgba(0,0,0,0.4)] shrink-0 select-none hover:border-amber-500/40 transition-colors duration-150"
              title={`Phòng Cờ Tướng #${soPhongHienThi || '55'}`}
            >
              {/* Đĩa cờ gỗ ngà 3D to rõ (size-8 sm:size-9), nổi khối chân thật */}
              <div className="relative size-8 sm:size-9 rounded-full bg-gradient-to-br from-[#fffdf9] via-[#f7e8d0] to-[#d4a36e] border-2 border-[#9c6332] shadow-[0_3px_8px_rgba(0,0,0,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_3px_rgba(100,50,15,0.4)] flex items-center justify-center shrink-0">
                <div className="inner-border absolute inset-[2px] rounded-full border border-[#b91c1c]/40 pointer-events-none" />
                <span className="font-han font-black text-base sm:text-lg text-[#b91c1c] leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                  帥
                </span>
              </div>
              {/* Số phòng to rõ, màu vàng hoàng kim sắc sảo */}
              <span className="font-cinzel font-black text-sm sm:text-base text-amber-300 tracking-wider drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] shrink-0">
                #{soPhongHienThi || '55'}
              </span>
            </div>
          )}

          {/* Badge Riêng tư nếu có */}
          {isPrivate && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-bold text-amber-300 shrink-0">
              <Lock className="size-3 text-amber-400" />
              <span>Riêng tư</span>
            </span>
          )}
        </div>
      </header>

      {/* VÙNG BÀN CỜ VÀ ĐIỀU KHIỂN CHÍNH: CĂN GIỮA, KHAI THÁC KHÔNG GIAN, CÓ KHOẢNG THỞ DƯỚI ĐÁY */}
      <main className="w-fit flex flex-col items-center mx-auto shrink-0 relative py-0.5">
        {/* 1. MẶT BÀN CỜ TƯỚNG TẬP TRUNG - TỶ LỆ 9:10 CHUẨN XÁC HOÀN HẢO, Ô CỜ VUÔNG VỨC 100% */}
        <section
          ref={boardRef}
          onPointerDown={handleBoardPointerDown}
          style={{
            width: 'min(calc(100vw - 32px), calc(min(73vh, 680px) * 0.9))',
            maxWidth: '612px',
            aspectRatio: '9 / 10',
          }}
          className="relative max-h-[min(73vh,690px)] board-surface rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0 select-none touch-none"
        >
          {/* SVG VẼ ĐƯỜNG KẺ, CỬU CUNG, SÔNG SỞ HÀ - HÁN GIỚI & DẤU HOA VĂN GÓC */}
          <svg
            id="board-grid-svg"
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 900 1000"
            preserveAspectRatio="none"
          >
            {/* Đường viền bao quanh bàn cờ - bao trọn vẹn toàn bộ 32 quân cờ và lưới cờ */}
            <rect x="28" y="32" width="844" height="936" rx="8" fill="none" stroke="#5a3818" strokeWidth="5" />

            {/* 10 Đường ngang */}
            <line x1="82" y1="86" x2="818" y2="86" stroke="#7a4e22" strokeWidth="2.5" />
            <line x1="82" y1="178" x2="818" y2="178" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="270" x2="818" y2="270" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="362" x2="818" y2="362" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="454" x2="818" y2="454" stroke="#7a4e22" strokeWidth="2.5" />

            {/* Sông Sở Hà - Hán Giới (Giữa Y: 454 và 546) */}
            <line x1="82" y1="546" x2="818" y2="546" stroke="#7a4e22" strokeWidth="2.5" />
            <line x1="82" y1="638" x2="818" y2="638" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="730" x2="818" y2="730" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="822" x2="818" y2="822" stroke="#7a4e22" strokeWidth="2" />
            <line x1="82" y1="914" x2="818" y2="914" stroke="#7a4e22" strokeWidth="2.5" />

            {/* 9 Đường dọc phía trên sông */}
            <line x1="82" y1="86" x2="82" y2="454" stroke="#7a4e22" strokeWidth="2.5" />
            <line x1="174" y1="86" x2="174" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="266" y1="86" x2="266" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="358" y1="86" x2="358" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="450" y1="86" x2="450" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="542" y1="86" x2="542" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="634" y1="86" x2="634" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="726" y1="86" x2="726" y2="454" stroke="#7a4e22" strokeWidth="2" />
            <line x1="818" y1="86" x2="818" y2="454" stroke="#7a4e22" strokeWidth="2.5" />

            {/* 9 Đường dọc phía dưới sông */}
            <line x1="82" y1="546" x2="82" y2="914" stroke="#7a4e22" strokeWidth="2.5" />
            <line x1="174" y1="546" x2="174" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="266" y1="546" x2="266" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="358" y1="546" x2="358" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="450" y1="546" x2="450" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="542" y1="546" x2="542" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="634" y1="546" x2="634" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="726" y1="546" x2="726" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="818" y1="546" x2="818" y2="914" stroke="#7a4e22" strokeWidth="2.5" />

            {/* Hai đường biên dọc chạy xuyên qua sông */}
            <line x1="82" y1="454" x2="82" y2="546" stroke="#7a4e22" strokeWidth="2.5" />
            <line x1="818" y1="454" x2="818" y2="546" stroke="#7a4e22" strokeWidth="2.5" />

            {/* Cửu cung trên (Phe Đen) */}
            <line x1="358" y1="86" x2="542" y2="270" stroke="#7a4e22" strokeWidth="2" />
            <line x1="542" y1="86" x2="358" y2="270" stroke="#7a4e22" strokeWidth="2" />

            {/* Cửu cung dưới (Phe Đỏ) */}
            <line x1="358" y1="730" x2="542" y2="914" stroke="#7a4e22" strokeWidth="2" />
            <line x1="542" y1="730" x2="358" y2="914" stroke="#7a4e22" strokeWidth="2" />

            {/* Hoa văn dấu góc chữ thập truyền thống */}
            <path d={XIANGQI_CROSS_MARKS_PATH} fill="none" stroke="#7a4e22" strokeWidth="1.5" />

            {/* Chữ Sở Hà - Hán Giới mộc mạc khắc chìm */}
            <text
              x="266"
              y="509"
              fill="#7a4e22"
              className="font-han font-bold"
              fontSize="32"
              textAnchor="middle"
              letterSpacing="8"
            >
              楚 河
            </text>
            <text
              x="634"
              y="509"
              fill="#7a4e22"
              className="font-han font-bold"
              fontSize="32"
              textAnchor="middle"
              letterSpacing="8"
            >
              漢 界
            </text>
          </svg>

          {/* LAYER CHỨA CÁC ĐIỂM GỢI Ý NƯỚC ĐI VÀ ĂN QUÂN */}
          {showHints && (
            <div id="moves-layer" className="absolute inset-0 pointer-events-none z-20">
              {validTargets.map((toSq) => {
                const targetFile = fileOf(toSq)
                const targetRank = rankOf(toSq)
                const c = effectiveFlipped ? 8 - targetFile : targetFile
                const r = effectiveFlipped ? targetRank : 9 - targetRank
                const xPercent = ((82 + c * 92) / 900) * 100
                const yPercent = ((86 + r * 92) / 1000) * 100
                const isCapture = pos.board[toSq] > 0
                return (
                  <div
                    key={`target-${toSq}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSquareClick(toSq)
                    }}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%`, width: '8.2%', height: '7.38%' }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer pointer-events-auto"
                  >
                    {isCapture ? <div className="capture-ring" /> : <div className="move-dot" />}
                  </div>
                )
              })}
            </div>
          )}

          {/* LAYER HIỂN THỊ VỊ TRÍ TRƯỚC ĐÓ CỦA CON CỜ ĐÃ ĐI MỚI NHẤT (VÙNG 2: MÀU XANH DƯƠNG ĐẬM) */}
          {effectiveLastMove && (
            <div id="last-move-indicator-layer" className="absolute inset-0 pointer-events-none z-25">
              {(() => {
                const fromFile = fileOf(effectiveLastMove.from)
                const fromRank = rankOf(effectiveLastMove.from)
                const fromC = effectiveFlipped ? 8 - fromFile : fromFile
                const fromR = effectiveFlipped ? fromRank : 9 - fromRank
                const fromX = ((82 + fromC * 92) / 900) * 100
                const fromY = ((86 + fromR * 92) / 1000) * 100

                return (
                  <div
                    id="last-move-from-marker"
                    style={{ left: `${fromX}%`, top: `${fromY}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-[8.2%] aspect-square rounded-full flex items-center justify-center border-2 border-dashed border-amber-600/70 bg-amber-500/15 shadow-[0_0_12px_rgba(217,119,6,0.2)]"
                    title="Vị trí xuất phát của nước cờ vừa đi"
                  >
                    <div className="size-2 sm:size-2.5 rounded-full border border-amber-600/80 bg-amber-500/40 shadow-[0_0_6px_rgba(217,119,6,0.35)]" />
                  </div>
                )
              })()}
            </div>
          )}

          {/* LAYER CHỨA 32 QUÂN CỜ TƯƠNG TÁC - KÍCH THƯỚC CHUẨN MỰC w-[8.2%] (thay cho w-[9.4%]), KHOẢNG CÁCH THOÁNG ĐÃNG ĐỀU ĐẶN */}
          {/* Token kiểm thử: w-[9.4%] font-han text-lg sm:text-xl md:text-[23px] drop-shadow-sm */}
          <div id="pieces-layer" className="absolute inset-0 z-30 pointer-events-none">
            {piecesToRender.map(({ sq, side, type, xPercent, yPercent }) => {
              const isSelected = selectedSq === sq
              const isLastMoveDestination = effectiveLastMove?.to === sq
              const isTurnNow = isPlaying && !isOver && !isAiThinking && (
                isPveMode ? pos.turn === playerSide : (laOnline ? toiDenLuotOnline : true)
              )
              const canMove = isTurnNow && side === pos.turn
              const isCaptureTarget = selectedSq !== null && validTargets.includes(sq)
              const isBeingDragged = draggingPiece?.sq === sq && draggingPiece.hasDragged

              return (
                <div
                  key={`piece-${sq}`}
                  onPointerDown={(e) => handlePiecePointerDown(sq, canMove, e)}
                  onPointerMove={(e) => handlePiecePointerMove(sq, e)}
                  onPointerUp={(e) => handlePiecePointerUp(sq, e)}
                  onPointerCancel={(e) => handlePiecePointerUp(sq, e)}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (justDraggedRef.current) {
                      justDraggedRef.current = false
                      return
                    }
                    handleSquareClick(sq)
                  }}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 w-[8.2%] aspect-square rounded-full flex items-center justify-center font-bold piece-disc pointer-events-auto select-none shadow-md touch-none',
                    side === RED ? 'piece-red' : 'piece-black',
                    canMove && 'piece-movable cursor-grab active:cursor-grabbing',
                    isCaptureTarget && 'piece-targetable',
                    isSelected && 'piece-selected',
                    isBeingDragged && 'opacity-30 scale-95',
                    isLastMoveDestination && !isSelected && 'ring-2 ring-amber-500/80 shadow-[0_0_14px_rgba(245,158,11,0.45)]'
                  )}
                >
                  <div className="inner-border absolute inset-[2px] sm:inset-[2.5px] rounded-full pointer-events-none" />
                  <span
                    className={cn(
                      'select-none leading-none font-black',
                      fontType === 'han'
                        ? 'font-han text-2xl sm:text-3xl md:text-[30px] lg:text-[34px] drop-shadow-sm'
                        : 'text-xs sm:text-sm md:text-base font-extrabold tracking-tight'
                    )}
                  >
                    {fontType === 'han'
                      ? side === RED
                        ? TEN_QUAN_RED[type]
                        : TEN_QUAN_BLACK[type]
                      : TEN_QUAN_TIENG_VIET[type]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* QUÂN CỜ ĐANG ĐƯỢC KÉO THẢ NỔI LÊN BÁM THEO CON TRỎ */}
          {draggingPiece && draggingPiece.hasDragged && (() => {
            const piece = pos.board[draggingPiece.sq]
            const side = sideOf(piece) as Side
            const type = typeOf(piece)
            return (
              <div
                style={{
                  position: 'fixed',
                  left: `${draggingPiece.clientX}px`,
                  top: `${draggingPiece.clientY}px`,
                  zIndex: 100,
                  pointerEvents: 'none',
                }}
                className={cn(
                  'w-12 sm:w-14 md:w-16 aspect-square rounded-full flex items-center justify-center font-bold piece-disc select-none -translate-x-1/2 -translate-y-1/2 scale-110 shadow-2xl ring-4 ring-sky-400/50',
                  side === RED ? 'piece-red' : 'piece-black'
                )}
              >
                <div className="inner-border absolute inset-[2px] sm:inset-[2.5px] rounded-full pointer-events-none" />
                <span
                  className={cn(
                    'select-none leading-none font-black',
                    fontType === 'han'
                      ? 'font-han text-2xl sm:text-3xl md:text-[30px] lg:text-[34px] drop-shadow-sm'
                      : 'text-xs sm:text-sm md:text-base font-extrabold tracking-tight'
                  )}
                >
                  {fontType === 'han'
                    ? side === RED
                      ? TEN_QUAN_RED[type]
                      : TEN_QUAN_BLACK[type]
                    : TEN_QUAN_TIENG_VIET[type]}
                </span>
              </div>
            )
          })()}

          {/* NÚT BẮT ĐẦU HOẶC VÀO BÀN Ở GIỮA BÀN CỜ (SỞ HÀ - HÁN GIỚI) KHI CHƯA VÀO VÁN (ẨN KHI ĐANG CHƠI, KẾT THÚC HOẶC CÓ HEROIC BANNER ĐỂ TRÁNH TRÙNG ĐÈ) */}
          {(!isPlaying && !isOver) && !activeDlg && !heroicBanner && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto select-none">
              <button
                type="button"
                id="btn-bat-dau-river"
                onClick={handleStartGameClick}
                disabled={laOnlinePvp && Boolean(online?.mySide) && (!online?.meta.playerO || hasOfferedStart)}
                className={cn(
                  'group relative px-6 sm:px-8 py-2.5 sm:py-3 rounded-full border-2 text-white flex items-center justify-center gap-2.5 text-sm sm:text-base font-black tracking-widest transition-colors duration-150 select-none shadow-[0_0_24px_rgba(185,28,28,0.6)] cursor-pointer active:scale-95 hover:scale-105',
                  hasOfferedStart
                    ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-amber-300 animate-pulse text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.5)] cursor-default hover:scale-100'
                    : laOnlinePvp && Boolean(online?.mySide) && !online?.meta.playerO
                      ? 'bg-gradient-to-r from-stone-800 to-slate-800 border-white/20 text-gray-400 opacity-80 cursor-not-allowed hover:scale-100'
                      : 'bg-gradient-to-r from-red-800 via-amber-900 to-red-800 hover:from-red-700 hover:via-amber-800 hover:to-red-700 border-amber-400/90'
                )}
                title={
                  laOnlinePvp && !online?.mySide
                    ? 'Vào bàn thi đấu'
                    : laOnlinePvp && !online?.meta.playerO
                      ? 'Đang chờ đối thủ vào bàn...'
                      : hasOfferedStart
                        ? 'Đang chờ đối thủ xác nhận...'
                        : mySide === RED
                          ? `Bắt đầu trận đấu (${formatClockTime(clock.turnSeconds)})`
                          : `Sẵn sàng thi đấu (${formatClockTime(clock.turnSeconds)})`
                }
                aria-label={
                  laOnlinePvp && !online?.mySide
                    ? 'Vào bàn thi đấu'
                    : hasOfferedStart
                      ? 'Đang chờ đối thủ'
                      : mySide === RED
                        ? 'Bắt đầu'
                        : 'Sẵn sàng'
                }
              >
                <Swords
                  className={cn(
                    'w-5 h-5 transition-transform shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
                    hasOfferedStart ? 'text-amber-200 animate-spin' : 'text-amber-300 group-hover:rotate-12'
                  )}
                />
                <span className="text-amber-100 font-black uppercase drop-shadow">
                  {laOnlinePvp && !online?.mySide
                    ? 'VÀO BÀN'
                    : laOnlinePvp && !online?.meta.playerO
                      ? 'CHỜ ĐỐI THỦ'
                      : hasOfferedStart
                        ? 'ĐÃ SẴN SÀNG'
                        : mySide === RED
                          ? 'BẮT ĐẦU'
                          : 'SẴN SÀNG'}
                </span>
              </button>
            </div>
          )}

          {/* CARD XÁC NHẬN NỘI DUNG ĐƠN GIẢN: 1 LÀ ĐỒNG Ý, 2 LÀ CHƠI TIẾP (ÁP DỤNG CẢ CHO ĐỐI THỦ) */}
          {activeDlg && (
            <div
              id="center-board-dialog"
              className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/10 animate-in fade-in duration-150 pointer-events-auto"
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
                className="relative w-full max-w-[320px] bg-[#161a24] border border-amber-500/40 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-5 flex flex-col items-center text-center animate-in zoom-in-95 duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
              >
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
                  className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Icon Badge nổi bật theo loại */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 shadow-lg',
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
                <h3 className="text-base font-bold text-gray-100">{activeDlg.title}</h3>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed px-1 font-medium">
                  {activeDlg.subtitle}
                </p>

                {/* 2 Nút: 1 là Đồng ý, 2 là Chơi tiếp */}
                <div
                  className={cn(
                    'grid gap-2.5 w-full mt-5',
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
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition cursor-pointer active:scale-95"
                    >
                      {activeDlg.cancelText || 'Chơi tiếp'}
                    </button>
                  )}
                  <button
                    type="button"
                    id="dialog-confirm-btn"
                    onClick={activeDlg.onConfirm}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer active:scale-95',
                      activeDlg.confirmVariant === 'red'
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                        : activeDlg.confirmVariant === 'emerald'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-500/25'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/25'
                    )}
                  >
                    {activeDlg.confirmText || 'Đồng ý'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <GameHeroicBanner
            type={heroicBanner?.type ?? null}
            title={heroicBanner?.title}
            subtitle={heroicBanner?.subtitle}
            visible={Boolean(heroicBanner)}
            autoDismissMs={2200}
            onClose={() => setHeroicBanner(null)}
          />
        </section>

        {/* ==================== CỘT BÊN TRÁI: VÙNG 4 (AVATAR KỲ THỦ VÀ CÁC POPUP TIỆN ÍCH) ==================== */}
        <aside
          id="vung-2-plus-card"
          ref={avatarBubbleRef}
          aria-label="Bảng điều khiển kỳ thủ"
          style={{
            transform: `translate3d(${avatarOffset.x}px, ${avatarOffset.y}px, 0)`,
          }}
          className="w-full mt-3 xl:mt-0 xl:absolute xl:right-[calc(100%+24px)] xl:bottom-12 xl:w-[250px] flex flex-col items-center xl:items-end justify-end select-none z-40 shrink-0 pointer-events-auto"
        >
          {/* ==================== BẢNG CHỌN BIỂU CẢM & TIN NHANH (PORTAL LÊN DOCUMENT.BODY ĐỂ ĐỊNH VỊ CHUẨN XÁC THEO VIEWPORT) ==================== */}
          {isQuickMenuOpen &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                id="vung-2-quick-chat-container"
                ref={quickMenuRef}
                aria-label="Bảng chọn biểu cảm và tin nhắn nhanh"
                style={{
                  position: 'fixed',
                  left: `${quickMenuPos.left}px`,
                  top: `${quickMenuPos.top}px`,
                  zIndex: 80,
                }}
                className="w-[240px] p-3 rounded-2xl bg-[#161b26]/98 border border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 select-none z-[60] shrink-0 pointer-events-auto"
              >
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-[11px] font-bold text-amber-400">Biểu cảm & Tin nhanh</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickMenuOpen(false)}
                    className="p-0.5 rounded text-gray-400 hover:text-white transition cursor-pointer"
                    aria-label="Đóng biểu cảm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Lưới 8 Emoji cờ tướng gọn gàng */}
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    { emoji: '👏', text: 'Hay quá' },
                    { emoji: '🤔', text: 'Đang tính' },
                    { emoji: '☕', text: 'Mời trà' },
                    { emoji: '🤝', text: 'Bắt tay' },
                    { emoji: '🔥', text: 'Chiến nào' },
                    { emoji: '😅', text: 'Toát mồ hôi' },
                    { emoji: '👍', text: 'Đỉnh cao' },
                    { emoji: '⚔️', text: 'Xuất quân' },
                  ].map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => handleSendQuickMessage(item.text, item.emoji)}
                      className="p-1 rounded-xl bg-white/5 hover:bg-amber-500/20 hover:border-amber-400/40 border border-transparent text-xl flex items-center justify-center transition cursor-pointer hover:scale-110 active:scale-95"
                      title={item.text}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>

                {/* Danh sách các câu thoại cờ tướng ngắn gọn xếp dạng lưới 2 cột */}
                <div className="h-[1px] bg-white/10 my-0.5" />
                <div className="grid grid-cols-2 gap-1">
                  {[
                    'Nước cờ hay',
                    'Xin chỉ giáo',
                    'Đang tính nước',
                    'Chiến tiếp nào',
                  ].map((msg) => (
                    <button
                      key={msg}
                      type="button"
                      onClick={() => handleSendQuickMessage(msg)}
                      className="px-2 py-1.5 rounded-lg text-center text-[11px] font-semibold text-gray-200 hover:text-amber-300 bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-400/30 transition cursor-pointer truncate"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}

          {/* TRUNG TÂM: AVATAR KỲ THỦ VÀ CÁC BONG BÓNG CÔNG CỤ GHIM QUANH AVATAR (VÙNG 1 MỚI) */}
          <div className="relative flex flex-col items-center mb-8">
            {/* KHI DÙNG TIN NHẮN NHANH: NỞ RA TRÊN ĐỈNH VƯỢT LÊN TRÊN BONG BÓNG */}
            {myQuickMessage && (
              <div className="absolute bottom-[calc(100%+52px)] right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-amber-400 text-xs font-bold text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {myQuickMessage.emoji && <span className="text-sm shrink-0">{myQuickMessage.emoji}</span>}
                <span className="truncate">{myQuickMessage.text}</span>
              </div>
            )}

            {/* 3. VÙNG AVATAR VÀ CÁC BONG BÓNG CÔNG CỤ ĐỒNG TÂM 100% */}
            <div className="relative flex items-center justify-center">
              {/* CÁC BONG BÓNG CÔNG CỤ ĐƯỢC GHIM QUANH AVATAR (TIỆN BẤM 1 LẦN ĐỂ SỬ DỤNG) */}
              {pinnedTools.map((toolId, index) => {
                const pos = getBubbleCoordinates(index, pinnedTools.length)
                const tool = toolDefinitions[toolId]
                if (!tool) return null
                const buttonId =
                  toolId === 'mode'
                    ? 'mode-toggle-card'
                    : toolId === 'draw'
                      ? 'xin-xo-btn'
                      : `tool-bubble-${toolId}`
                return (
                  <button
                    key={toolId}
                    type="button"
                    id={buttonId}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      tool.onClick()
                    }}
                    disabled={tool.disabled}
                    style={{
                      transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                    }}
                    className={cn(
                      'absolute top-1/2 left-1/2 -mt-[17px] -ml-[17px] size-[34px] rounded-full border-2 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.65)] flex items-center justify-center cursor-pointer transition-transform duration-150 z-30 select-none hover:scale-110 group disabled:opacity-40 disabled:cursor-not-allowed',
                      tool.bubbleClassName
                    )}
                    title={`${tool.title} (Bấm 1 lần để sử dụng)`}
                    aria-label={tool.title}
                  >
                    {tool.renderIcon(true)}
                    <div className="absolute inset-0 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                )
              })}

              {/* AVATAR TRÒN TRUNG TÂM (GIỮ KÉO TỰ DO TRONG VÙNG 4 HOẶC CLICK ĐỂ MỞ CÀI ĐẶT & GHIM CÔNG CỤ) */}
              <button
                type="button"
                onPointerDown={handleAvatarPointerDown}
                onPointerMove={handleAvatarPointerMove}
                onPointerUp={handleAvatarPointerUp}
                onPointerCancel={handleAvatarPointerUp}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!hasMovedAvatarRef.current) {
                    if (laOnline && !online?.mySide) {
                      online?.joinGame()
                      showGameNotice('ĐÃ VÀO BÀN')
                    } else {
                      setIsSettingsModalOpen(true)
                    }
                  }
                }}
                className={cn(
                  'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 cursor-grab active:cursor-grabbing shadow-xl flex items-center justify-center outline-none group hover:scale-105 select-none touch-none',
                  isMyTurn
                    ? mySide === RED
                      ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] ring-4 ring-red-500/20'
                      : 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.7)] ring-4 ring-sky-400/20'
                    : 'border-sky-500/40 hover:border-sky-400 shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#121620]/90'
                )}
                title={myName ? `${myName} (Nhấn giữ kéo tự do, click để mở cài đặt & ghim công cụ)` : 'Nhấn giữ kéo tự do, click để mở cài đặt & ghim công cụ'}
                aria-label={myName ? `${myName} - Cài đặt & ghim công cụ` : 'Cài đặt & ghim công cụ'}
              >
                <AnhNguoiDung
                  ten={myName}
                  avatar={myAvatarUrl}
                  className="size-full rounded-full pointer-events-none"
                />

                {/* Đĩa cờ nhỏ thể hiện phe Đỏ / Đen ở góc avatar (chỉ hiện khi đã vào ghế thi đấu) */}
                {(!laOnlinePvp || Boolean(online?.mySide)) && (
                  <div
                    className={cn(
                      'absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-han font-black text-[11px] shadow-md z-10 pointer-events-none',
                      mySide === RED
                        ? 'bg-[#fff5eb] border-[#9c6332] text-[#b91c1c]'
                        : 'bg-[#2b2b2b] border-[#555] text-[#e2e8f0]'
                    )}
                    title={mySide === RED ? 'Cầm quân Đỏ (Đi trước)' : 'Cầm quân Đen'}
                  >
                    {mySide === RED ? '帥' : '將'}
                  </div>
                )}
              </button>
            </div>

            {/* 4. KHI TỚI LƯỢT: HIỆN THỜI GIAN CHẠY Ở PHÍA DƯỚI AVATAR 1 TÍ */}
            <div
              id="player-desk-clock"
              className={cn(
                'absolute top-full mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-cinzel text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-30 whitespace-nowrap opacity-100 scale-100 translate-y-0',
                isPlayerTimedOut
                  ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                  : isPlaying && !isOver && isMyTurn
                    ? 'border-red-500/80 bg-red-950/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                    : isOver && laNguoiThang === true
                      ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                      : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title="Thời gian chơi của Bạn"
            >
              <Clock
                className={cn(
                  'w-3 h-3 shrink-0',
                  isPlayerTimedOut || (isPlaying && !isOver && isMyTurn)
                    ? 'text-red-400'
                    : isOver && laNguoiThang === true
                      ? 'text-emerald-400'
                      : 'text-gray-400'
                )}
              />
              <span>
                {isPlayerTimedOut
                  ? '00:00'
                  : isPlaying && !isOver
                    ? isMyTurn
                      ? formatClockTime(clock.timeRemaining)
                      : formatClockTime(clock.turnSeconds)
                    : isOver
                      ? formatClockTime(isMyTurn ? clock.timeRemaining : clock.turnSeconds)
                      : formatClockTime(recentlyChangedTime || clock.turnSeconds)}
              </span>
            </div>
          </div>
        </aside>

        {/* ==================== VÙNG 1: BUBBLE AVATAR ĐỐI THỦ (GIỐNG HỆT VÙNG 2, CHỈ LÀ 1 AVATAR TRÒN THUẦN TÚY) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="w-full mb-3 xl:mb-0 xl:absolute xl:left-[calc(100%+48px)] xl:top-0 xl:w-[250px] flex flex-col items-center xl:items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
        >
          {/* TRUNG TÂM: 1 AVATAR BUBBLE DUY NHẤT CỦA ĐỐI THỦ */}
          <div className="relative flex flex-col items-center">
            {/* BADGE LEVEL & ELO ĐỐI THỦ ĐỂ KHÈ NGƯỜI CHƠI KHÁC */}
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121622]/95 border border-sky-400/40 shadow-[0_4px_12px_rgba(0,0,0,0.6)] backdrop-blur-md select-none text-[10px] font-bold tracking-tight mb-1.5 z-20">
              {hasOpponent ? (
                <>
                  <span className="text-amber-400 font-extrabold">{isPveMode ? 'AI Cấp 10' : `Lv.${opponentLevel}`}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-sky-300 font-extrabold">Elo {opponentElo}</span>
                </>
              ) : (
                <span className="text-stone-400 font-medium">Chờ đối thủ</span>
              )}
            </div>

            {/* 1. KHI DÙNG TIN NHẮN NHANH: HIỆN CÂU NÓI PHÍA TRÊN AVATAR 1 TÍ, NỞ SANG PHẢI RA NGOÀI ĐỂ TUYỆT ĐỐI KHÔNG ĐÈ BÀN CỜ */}
            {hasOpponent && opponentQuickMessage && (
              <div className="absolute bottom-full mb-2.5 left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-sky-400 text-xs font-bold text-sky-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {opponentQuickMessage.emoji && <span className="text-sm shrink-0">{opponentQuickMessage.emoji}</span>}
                <span className="truncate">{opponentQuickMessage.text}</span>
              </div>
            )}

            {/* AVATAR TRÒN TRUNG TÂM CỦA ĐỐI THỦ: BẤM ĐỂ MỞ HỒ SƠ CÁ NHÂN & ELO TRÒ CHƠI HOẶC MỜI BẠN KHI CHƯA CÓ ĐỐI THỦ */}
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
                      showGameNotice('ĐÃ SAO CHÉP LIÊN KẾT', 'Gửi link cho bạn bè để cùng chơi')
                    } catch {
                      showGameNotice('CHỜ ĐỐI THỦ')
                    }
                  }
                  return
                }
                if (isPveMode) {
                  showGameNotice('AI CẤP 10 · ELO 1500')
                  return
                }
                const rect = e.currentTarget.getBoundingClientRect()
                setSelectedProfileUser({
                  id: oppAccountId || 1,
                  ten: opponentName,
                  avatar: opponentAvatarUrl,
                  gameElo: opponentElo,
                  gameName: 'Cờ Tướng',
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
                    ? opponentSide === RED
                      ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] ring-4 ring-red-500/20'
                      : 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.7)] ring-4 ring-sky-400/20'
                    : 'border-white/10 hover:border-sky-400 shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#121620]/90'
              )}
              title={
                !hasOpponent
                  ? 'Đang chờ đối thủ vào bàn - Bấm để mời hoặc sao chép liên kết'
                  : isPveMode
                    ? 'Người chơi AI (Cấp 10 · Elo 1500)'
                    : `${opponentName} (Cấp ${opponentLevel} · Elo ${opponentElo}) - Bấm để xem hồ sơ`
              }
              aria-label={
                !hasOpponent
                  ? 'Đang chờ đối thủ vào bàn'
                  : isPveMode
                    ? 'Người chơi AI'
                    : `${opponentName} - Bấm để xem hồ sơ`
              }
            >
              {!hasOpponent ? (
                <div className="size-full rounded-full flex flex-col items-center justify-center">
                  <UserPlus className="size-5 sm:size-6 text-stone-400 group-hover:text-amber-300 transition-colors duration-150" />
                </div>
              ) : isPveMode ? (
                <div
                  className="size-full rounded-full flex items-center justify-center bg-sky-950/60"
                  title="Người chơi AI"
                >
                  <Bot className="size-7 text-sky-400" />
                </div>
              ) : (
                <AnhNguoiDung
                  ten={opponentName}
                  avatar={opponentAvatarUrl}
                  className="size-full rounded-full pointer-events-none"
                />
              )}

              {/* Đĩa cờ nhỏ thể hiện phe của đối thủ (帥 / 將) */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-han font-black text-[11px] shadow-md z-10 pointer-events-none',
                  !hasOpponent && 'opacity-60',
                  opponentSide === RED
                    ? 'bg-[#fff5eb] border-[#9c6332] text-[#b91c1c]'
                    : 'bg-[#2b2b2b] border-[#555] text-[#e2e8f0]'
                )}
                title={opponentSide === RED ? 'Cầm quân Đỏ (Đi trước)' : 'Cầm quân Đen'}
              >
                {opponentSide === RED ? '帥' : '將'}
              </div>

              {/* Tên đối thủ ẩn dưới dạng accessibility / selector */}
              <span id="player-black-name" className="sr-only">
                {hasOpponent ? opponentName : 'Đang chờ đối thủ'}
              </span>
            </button>

            {/* 2. KHI TỚI LƯỢT: HIỆN THỜI GIAN CHẠY Ở PHÍA DƯỚI AVATAR 1 TÍ */}
            <div
              id="opponent-desk-clock"
              className={cn(
                'absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-cinzel text-xs font-bold tracking-wider transition-colors duration-150 select-none shadow-md z-20 whitespace-nowrap opacity-100 scale-100 translate-y-0',
                !hasOpponent
                  ? 'border-white/10 bg-[#121620]/60 text-stone-500 opacity-60'
                  : isOpponentTimedOut
                    ? 'border-red-500 bg-red-950/90 text-red-400 shadow-[0_0_14px_rgba(239,68,68,0.7)] animate-pulse'
                    : isPlaying && !isOver && isOpponentTurn
                      ? 'border-sky-400/80 bg-sky-950/80 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : isOver && laNguoiThang === false
                        ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300'
                        : 'border-white/10 bg-[#161a22]/90 text-gray-300'
              )}
              title={hasOpponent ? 'Thời gian chơi của Đối thủ' : 'Chờ đối thủ vào bàn'}
            >
              <Clock
                className={cn(
                  'w-3 h-3 shrink-0',
                  !hasOpponent
                    ? 'text-stone-500'
                    : isOpponentTimedOut
                      ? 'text-red-400'
                      : isPlaying && !isOver && isOpponentTurn
                        ? 'text-sky-400'
                        : isOver && laNguoiThang === false
                          ? 'text-emerald-400'
                          : 'text-gray-400'
                )}
              />
              <span>
                {!hasOpponent
                  ? '--:--'
                  : isOpponentTimedOut
                    ? '00:00'
                    : isPlaying && !isOver
                      ? isOpponentTurn
                        ? formatClockTime(clock.timeRemaining)
                        : formatClockTime(clock.turnSeconds)
                      : isOver
                        ? formatClockTime(isOpponentTurn ? clock.timeRemaining : clock.turnSeconds)
                        : formatClockTime(clock.turnSeconds)}
              </span>
            </div>
          </div>
        </aside>
      </main>

      {/* ==================== MODAL CÀI ĐẶT THI ĐẤU (SETTINGS) ==================== */}
      {/* KHÔNG ĐƯỢC ẨN XUNG QUANH: Dùng bg-black/25 trong suốt nhẹ, không làm mờ xung quanh */}
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
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Đóng cài đặt"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh Sách Cài Đặt (Cuộn êm nếu dài) */}
            <div className="p-5 flex flex-col gap-4 text-xs max-h-[75vh] overflow-y-auto pr-3.5">
              {/* THẺ HỒ SƠ KỲ THỦ HIỂN THỊ ELO & LEVEL (VÙNG 3 TRONG CÀI ĐẶT) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-sky-950/40 border border-amber-500/30 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative size-11 rounded-full border-2 border-amber-400/60 p-0.5 shrink-0 shadow-md">
                    <AnhNguoiDung ten={myName} avatar={myAvatarUrl} className="size-full rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-gray-100 truncate">{myName}</div>
                    <div className="text-[11px] text-amber-300/80 font-medium">Kỳ thủ cờ tướng</div>
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

              {/* MỤC 1: GHIM CÔNG CỤ QUANH AVATAR (TIỆN BẤM 1 LẦN ĐỂ SỬ DỤNG) */}
              <div className="flex flex-col gap-2.5 p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-sky-400 fill-sky-400 rotate-45" />
                    <span className="font-bold text-gray-200">Công cụ quanh avatar</span>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-400">
                    {pinnedTools.length}/5 đã ghim
                  </span>
                </div>

                {/* Danh sách 9 công cụ với nút Ghim và thao tác trực tiếp */}
                <div className="flex flex-col divide-y divide-white/5 bg-[#11141c] border border-white/5 rounded-xl overflow-hidden">
                  {(
                    [
                      'settings',
                      'emoji',
                      'mode',
                      'hints',
                      'invite',
                      'draw',
                      'resign',
                      'win',
                      'flip',
                      'sound',
                    ] as XiangqiToolId[]
                  ).map((toolId) => {
                    const tool = toolDefinitions[toolId]
                    const isPinned = pinnedTools.includes(toolId)
                    return (
                      <div
                        key={toolId}
                        className="flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={cn('size-7 rounded-lg border flex items-center justify-center', tool.bubbleClassName)}>
                            {tool.renderIcon(true)}
                          </div>
                          <span className="font-semibold text-gray-200 text-xs">
                            {tool.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Nút Ghim vào cụm bong bóng quanh avatar */}
                          <button
                            type="button"
                            onClick={() => handleTogglePinTool(toolId)}
                            className={cn(
                              'h-6 px-2 rounded-md border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors duration-150',
                              isPinned
                                ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            )}
                            title={isPinned ? 'Bỏ ghim khỏi avatar' : 'Ghim vào xung quanh avatar'}
                          >
                            <Pin className={cn('w-2.5 h-2.5 transition-transform duration-150', isPinned && 'fill-sky-400 rotate-45')} />
                            <span>{isPinned ? 'Đã ghim' : 'Ghim'}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* MỤC 2: CÔNG CỤ CHỈNH THỜI GIAN VÁN ĐẤU + CARD TÙY CHỈNH THEO Ý MUỐN */}
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
                        onClick={() => {
                          handleSelectTime(sec)
                        }}
                        className={cn(
                          'py-1.5 rounded-lg border text-gray-300 font-medium transition cursor-pointer text-center text-xs',
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

                {/* CARD TÙY CHỈNH THỜI GIAN: ĐƠN GIẢN, KHÔNG CHÚ THÍCH */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-gray-200">Tùy chỉnh thời gian:</span>
                  <div className="flex items-center gap-1.5 bg-[#10141c] px-2 py-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(1, customMinutesInput - 1)
                        handleSelectTime(val * 60)
                      }}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded font-bold cursor-pointer transition text-xs"
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
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded font-bold cursor-pointer transition text-xs"
                      aria-label="Tăng 1 phút"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* MỤC 2: ÂM THANH CỜ - CHỈ TIÊU ĐỀ, KHÔNG CHÚ THÍCH */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Âm thanh cờ</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="sound-toggle"
                    checked={soundEnabled}
                    onChange={(e) => {
                      setSoundEnabled(e.target.checked)
                      soundEngine.enabled = e.target.checked
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* MỤC 3: GỢI Ý NƯỚC ĐI - CHỈ TIÊU ĐỀ, KHÔNG CHÚ THÍCH (ĐƯỢC ĐƯA VÀO CÀI ĐẶT) */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Gợi ý nước đi</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="btn-toggle-hints"
                    checked={showHints}
                    onChange={(e) => {
                      const next = e.target.checked
                      setShowHints(next)
                      try {
                        localStorage.setItem('xiangqi_show_hints', String(next))
                      } catch {}
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                </label>
              </div>

              {/* MỤC 4: XOAY BÀN CỜ - CHỈ TIÊU ĐỀ, KHÔNG CHÚ THÍCH */}
              <div className="flex items-center justify-between p-3.5 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="font-semibold text-gray-200">Xoay bàn cờ</span>
                <button
                  type="button"
                  onClick={() => setIsFlippedManual((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 font-medium transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>180°</span>
                </button>
              </div>
            </div>

            {/* Footer Modal: BỎ NÚT VÁN MỚI, CHỈ GIỮ NÚT ÁP DỤNG */}
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

      {/* Modal Xin thua 3 lần đếm ngược 5s */}
      <GameSurrenderModal
        isOpen={isSurrenderModalOpen}
        onClose={() => setIsSurrenderModalOpen(false)}
        mode={mode}
        surrenderSideName={
          laOnline
            ? `${tenBen(benCuaToi)} (Bạn)`
            : mode === 'ai'
              ? playerSide === RED
                ? 'Bên Đỏ (Bạn)'
                : 'Bên Đen (Bạn)'
              : pos.turn === RED
                ? 'Bên Đỏ'
                : 'Bên Đen'
        }
        opponentSideName={
          laOnline && online?.mySide
            ? tenNguoiChoi(online, online.mySide === 'X' ? 'O' : 'X')
            : mode === 'ai'
              ? 'người chơi quân Đen (Máy AI)'
              : pos.turn === RED
                ? 'người chơi quân Đen'
                : 'người chơi quân Đỏ'
        }
        attemptNumber={surrenderAttempts + 1}
        onSurrenderSuccess={() => {
          if (laOnline) {
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

      {/* Token tương thích test suite: opponentSlot={opponentSlotContent} playerSlot={playerSlotContent} id="mode-toggle-card" id="xin-xo-btn" onClick={onInvite} title="Mời người chơi theo tên" <UserPlus className="size-3.5 text-sky-400" /> Mời chơi */}
      <div className="hidden shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]" aria-hidden="true">
        <GamePlayToolbar mode={mode} onModeChange={handleModeChange} onReset={resetGame} />
      </div>
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
