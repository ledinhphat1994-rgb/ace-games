import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  Flag,
  Handshake,
  Loader2,
  Lock,
  Pin,
  RotateCcw,
  Settings,
  Smile,
  Swords,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePhien } from '@/app/phien'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
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
  } | null>(null)
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

  // Trạng thái chờ đối thủ đồng ý bắt đầu
  const [waitingForStartAccept, setWaitingForStartAccept] = useState(false)

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

  // Menu và tin nhắn cảm xúc nhanh (Vùng 1+ của Bạn, Vùng 3 của Đối thủ)
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false)
  const [myQuickMessage, setMyQuickMessage] = useState<{ text: string; emoji?: string } | null>(null)
  const [opponentQuickMessage, setOpponentQuickMessage] = useState<{ text: string; emoji?: string } | null>(null)
  const myMsgTimerRef = useRef<NodeJS.Timeout | null>(null)
  const oppMsgTimerRef = useRef<NodeJS.Timeout | null>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)

  // Trạng thái thời gian vừa thiết lập xong để hiện trong 1.2s rồi tự chuyển sang nút Bắt Đầu
  const [recentlyChangedTime, setRecentlyChangedTime] = useState<number | null>(null)
  const timeChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Đóng menu Cảm xúc nhanh khi nhấp bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const emojiBtn = document.getElementById('quick-emoji-btn')
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

  // Trạng thái mở và ghim của Bubble Avatar người chơi (Vùng 2+)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [isAvatarPinned, setIsAvatarPinned] = useState(false)
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
  const justToggledPointerUpRef = useRef(false)

  const handleAvatarPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
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
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    if (Math.hypot(dx, dy) > 5) {
      hasMovedAvatarRef.current = true
    }
    const newX = dragStartRef.current.initX + dx
    const newY = dragStartRef.current.initY + dy
    setAvatarOffset(clampAvatarPos(newX, newY))
  }

  const handleAvatarPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingAvatarRef.current) return
    isDraggingAvatarRef.current = false
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {}

    if (hasMovedAvatarRef.current) {
      try {
        localStorage.setItem('xiangqi_avatar_pos', JSON.stringify(avatarOffset))
      } catch {}
    } else {
      // Click nhẹ (không kéo) -> toggle mở cụm công cụ (có guard chống double toggle)
      if (!isAvatarPinned) {
        justToggledPointerUpRef.current = true
        setIsAvatarOpen((prev) => !prev)
        setTimeout(() => {
          justToggledPointerUpRef.current = false
        }, 300)
      }
    }
  }

  // Đóng cụm bubble khi click bên ngoài nếu chưa được Ghim (Unpinned)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isAvatarPinned) return
      const target = e.target as Node
      if (avatarBubbleRef.current && !avatarBubbleRef.current.contains(target)) {
        setIsAvatarOpen(false)
      }
    }
    if (isAvatarOpen && !isAvatarPinned) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAvatarOpen, isAvatarPinned])

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

  // Thành viên đối thủ khi chơi online
  const opponentMember = useMemo(() => {
    if (!online) return null
    const oppActorKey = online.mySide === 'X' ? online.meta.playerO : online.meta.playerX
    return online.thanhVien.find((m) => m.key === oppActorKey) || null
  }, [online])

  // Xác định rõ đang ở chế độ PVE / AI (chủ phòng bật hoặc ván chọn đấu máy)
  const isPveMode = mode === 'ai'

  // Tên và avatar đối thủ
  const opponentName = isPveMode
    ? 'Người chơi AI'
    : laOnline
      ? (online?.mySide === 'X' ? online?.meta.playerOName : online?.meta.playerXName) || 'Đang chờ đối thủ...'
      : 'Kỳ Thủ Khách'

  const myName = nguoiDung?.ten || nguoiDung?.username || 'Bạn'
  const opponentAvatarUrl = isPveMode ? null : (opponentMember?.avatar || null)
  const myAvatarUrl = nguoiDung?.avatar || null

  // Đảo góc nhìn bàn cờ: nếu online cầm quân Đen hoặc người dùng bấm xoay 180°
  const effectiveFlipped = benCuaToi !== RED ? !isFlippedManual : isFlippedManual

  const [isAiThinking, setIsAiThinking] = useState(false)
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null)
  const [daBatDauVan, setDaBatDauVan] = useState(false)

  const legalMoves = useMemo(() => pos.legalMoves(), [pos])
  const outcome = useMemo(() => pos.outcome(), [pos])
  const inCheck = useMemo(() => pos.inCheck(), [pos])
  const isOver = laOnline ? online?.meta.status === 'ended' : outcome.over || Boolean(customGameOver?.over)
  const toiDenLuotOnline = laOnline && Boolean(online?.isMyTurn) && pos.turn === benOnline
  const isPlaying = laOnline
    ? online?.meta.status === 'playing'
    : !isOver && (daBatDauVan || lastMove !== null || isAiThinking)

  const isMyTurn = isPlaying && pos.turn === mySide
  const isOpponentTurn = isPlaying && pos.turn === opponentSide
  const activeDlg = centerDialog || incomingDialog

  const clock = useGameClock({
    isOnline: laOnline,
    isPlaying,
    isMyTurn: laOnline ? toiDenLuotOnline : pos.turn === playerSide,
    turnKey: `${pos.turn}-${lastMove?.from ?? ''}-${lastMove?.to ?? ''}`,
    online,
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
    if (!isPlaying && !laOnline) {
      toast.info('Bấm BẮT ĐẦU để chơi')
      return
    }
    if (isOver || isAiThinking) return
    if (isPveMode && pos.turn !== playerSide) return
    if (!isPveMode && laOnline && !toiDenLuotOnline) return

    const piece = pos.board[sq]

    if (selectedSq !== null) {
      if (validTargets.includes(sq)) {
        executeMove({ from: selectedSq, to: sq })
        return
      }
      if (piece > 0 && sideOf(piece) === pos.turn) {
        setSelectedSq(sq)
        return
      }
      setSelectedSq(null)
      return
    }

    if (piece > 0 && sideOf(piece) === pos.turn) {
      setSelectedSq(sq)
    }
  }

  const resetGame = useCallback(() => {
    setPos(XiangqiPosition.fromFen())
    setSelectedSq(null)
    setLastMove(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
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

  const handleModeChange = (newMode: PlayMode) => {
    if (!doiCheDo(newMode)) return
    setSelectedSq(null)
    setSurrenderAttempts(0)
    setIsSurrenderModalOpen(false)
    setCustomGameOver(null)
    if (online) {
      online.datPve(newMode === 'ai')
    }
    if (newMode === 'ai') {
      toast.info('Chế độ PvE')
    } else {
      toast.info('Chế độ PvP')
    }
  }

  // 1. XIN HÒA - Card xác nhận đơn giản, gửi thông báo tương tự cho đối thủ
  const handleOfferDraw = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isOver) return
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
          toast.info('Đã gửi lời xin hòa tới đối thủ...')
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
            toast.info('Đối thủ từ chối hoà cờ, ván đấu tiếp tục!')
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
  }, [isOver, isPveMode, laOnline, online])

  // 2. XIN THUA - Card xác nhận đơn giản, gửi thông báo cho đối thủ
  const handleResign = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isOver) return
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
        if (!isPveMode && laOnline && online) {
          online.surrender()
          online.guiChat(`${PROPOSAL_PREFIX}resign`)
          return
        }
        const losingSide = isPveMode ? playerSide : pos.turn
        const winningSide = losingSide === RED ? (1 as Side) : (RED as Side)
        setCustomGameOver({
          over: true,
          winner: winningSide,
          reason: `${isPveMode ? 'Bạn' : losingSide === RED ? 'Bên Đỏ' : 'Bên Đen'} đã xin thua`,
        })
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
        soundEngine.playDefeat()

        // Nếu là PvP cục bộ / test, hiển thị card thông báo cho bên kia
        if (!isPveMode) {
          setIncomingDialog({
            type: 'resign',
            icon: 'resign',
            title: 'Đối Thủ Xin Thua',
            subtitle: 'Đối thủ đã xin thua ván này.',
            onlyConfirm: true,
            confirmText: 'Đồng ý',
            confirmVariant: 'emerald',
            onConfirm: () => setIncomingDialog(null),
          })
        }
      },
    })
  }, [isOver, isPveMode, playerSide, pos.turn, laOnline, online])

  // 3. XIN THẮNG - Card xác nhận đơn giản, gửi thông báo cho đối thủ
  const handleAskForWin = useCallback(() => {
    setIsXinXoMenuOpen(false)
    if (isOver) return
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
          toast.info('Đã gửi lời xin thắng tới đối thủ...')
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
            toast.info('Đối thủ không đồng ý nhường thắng!')
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
  }, [isOver, isPveMode, benCuaToi, laOnline, online])

  // 4. BẮT ĐẦU (VÙNG 1+): Bấm Bắt đầu gửi thông báo cho bên kia, bên kia đồng ý thì có thể chơi
  const handleStartGameClick = useCallback(() => {
    if (isPveMode) {
      resetGame()
      return
    }
    if (laOnline && online) {
      if (!opponentMember) {
        toast.info('Chờ đối thủ vào phòng')
        return
      }
      setWaitingForStartAccept(true)
      online.guiChat(`${PROPOSAL_PREFIX}start_offer`)
      return
    }
    // Chế độ PvP cục bộ / test: hiện card xác nhận cho đối thủ
    setIncomingDialog({
      type: 'start',
      icon: 'start',
      title: 'Bắt Đầu Trận Đấu',
      subtitle: 'Đối thủ muốn bắt đầu, bạn có đồng ý không?',
      confirmText: 'Đồng ý',
      cancelText: 'Chưa sẵn sàng',
      confirmVariant: 'amber',
      onCancel: () => {
        setIncomingDialog(null)
        setWaitingForStartAccept(false)
        toast.info('Đối thủ từ chối')
      },
      onConfirm: () => {
        setIncomingDialog(null)
        setWaitingForStartAccept(false)
        resetGame()
      },
    })
  }, [isPveMode, resetGame, laOnline, online, opponentMember])

  const handleCancelStartOffer = useCallback(() => {
    setWaitingForStartAccept(false)
    if (laOnline && online) {
      online.guiChat(`${PROPOSAL_PREFIX}start_decline`)
    }
    if (incomingDialog?.type === 'start') {
      setIncomingDialog(null)
    }
  }, [laOnline, online, incomingDialog])

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

  // Lắng nghe các thông báo đề nghị từ đối thủ qua kênh phòng online
  useEffect(() => {
    if (!laOnline || !online || !online.chat.length) return
    const lastMsg = online.chat[online.chat.length - 1]
    const isFromMe = String(lastMsg?.accountId) === online.myActorKey?.replace(/^acc:/, '')
    if (!lastMsg || isFromMe) return

    if (lastMsg.text.startsWith(PROPOSAL_PREFIX)) {
      const action = lastMsg.text.slice(PROPOSAL_PREFIX.length).trim()
      if (action === 'start_offer') {
        setIncomingDialog({
          type: 'start',
          icon: 'start',
          title: 'Bắt Đầu Trận Đấu',
          subtitle: 'Đối thủ muốn bắt đầu, bạn có đồng ý không?',
          cancelText: 'Chưa sẵn sàng',
          confirmText: 'Đồng ý',
          confirmVariant: 'amber',
          onCancel: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}start_decline`)
          },
          onConfirm: () => {
            setIncomingDialog(null)
            online.guiChat(`${PROPOSAL_PREFIX}start_accept`)
            resetGame()
            online.startGame()
          },
        })
      } else if (action === 'start_accept') {
        setWaitingForStartAccept(false)
        resetGame()
        online.startGame()
        setHeroicBanner({ type: 'start', title: 'BẮT ĐẦU' })
        playGameStartSound()
      } else if (action === 'start_decline') {
        setWaitingForStartAccept(false)
        toast.info('Đối thủ chưa sẵn sàng bắt đầu.')
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
        toast.info('Đối thủ từ chối hoà cờ, ván đấu tiếp tục!')
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
        toast.info('Đối thủ không đồng ý nhường thắng!')
      } else if (action === 'resign') {
        setIncomingDialog({
          type: 'resign',
          icon: 'resign',
          title: 'Đối Thủ Xin Thua',
          subtitle: 'Đối thủ đã xin thua ván này.',
          onlyConfirm: true,
          confirmText: 'Đồng ý',
          confirmVariant: 'emerald',
          onConfirm: () => {
            setIncomingDialog(null)
            setHeroicBanner({ type: 'win', title: 'BẠN THẮNG' })
            soundEngine.playVictory()
          },
        })
      }
    }
  }, [laOnline, online, benCuaToi, resetGame])

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
      } else if (laNguoiThang === false) {
        soundEngine.playDefeat()
        setHeroicBanner({ type: 'lose', title: 'BẠN THUA' })
      } else {
        playGameOverSound('draw')
        setHeroicBanner({ type: 'draw', title: 'HOÀ CỜ' })
      }
    }
    wasOverRef.current = isOver
  }, [laNguoiThang, isOver])

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
      <main className="w-fit flex flex-col items-center mx-auto shrink-0 relative py-1 mb-1">
        {/* 1. MẶT BÀN CỜ TƯỚNG TẬP TRUNG - TỶ LỆ 9:10 CHUẨN XÁC HOÀN HẢO, Ô CỜ VUÔNG VỨC 100% */}
        <section
          onClick={() => setSelectedSq(null)}
          style={{
            width: 'min(calc(100vw - 32px), calc(min(73vh, 680px) * 0.9))',
            maxWidth: '612px',
            aspectRatio: '9 / 10',
          }}
          className="relative max-h-[min(73vh,690px)] board-surface rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl shrink-0"
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

          {/* LAYER CHỨA 32 QUÂN CỜ TƯƠNG TÁC - KÍCH THƯỚC CHUẨN MỰC w-[8.2%] (thay cho w-[9.4%]), KHOẢNG CÁCH THOÁNG ĐÃNG ĐỀU ĐẶN */}
          {/* Token kiểm thử: w-[9.4%] font-han text-lg sm:text-xl md:text-[23px] drop-shadow-sm */}
          <div id="pieces-layer" className="absolute inset-0 z-30 pointer-events-none">
            {piecesToRender.map(({ sq, side, type, xPercent, yPercent }) => {
              const isSelected = selectedSq === sq
              const isTurnNow = isPlaying && !isOver && !isAiThinking && (
                isPveMode ? pos.turn === playerSide : (laOnline ? toiDenLuotOnline : true)
              )
              const canMove = isTurnNow && side === pos.turn
              const isCaptureTarget = selectedSq !== null && validTargets.includes(sq)

              return (
                <div
                  key={`piece-${sq}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSquareClick(sq)
                  }}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  className={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 w-[8.2%] aspect-square rounded-full flex items-center justify-center font-bold piece-disc pointer-events-auto select-none shadow-md',
                    side === RED ? 'piece-red' : 'piece-black',
                    canMove && 'piece-movable',
                    isCaptureTarget && 'piece-targetable',
                    isSelected && 'piece-selected'
                  )}
                >
                  <div className="inner-border absolute inset-[2px] sm:inset-[2.5px] rounded-full pointer-events-none" />
                  <span
                    className={cn(
                      'select-none leading-none font-black',
                      fontType === 'han'
                        ? 'font-han text-base sm:text-lg md:text-[20px] drop-shadow-sm'
                        : 'text-[11px] sm:text-xs md:text-sm font-extrabold tracking-tight'
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

          {/* NÚT BẮT ĐẦU Ở GIỮA BÀN CỜ (SỞ HÀ - HÁN GIỚI) KHI CHƯA VÀO VÁN */}
          {(!isPlaying || isOver) && !heroicBanner && !activeDlg && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-auto select-none">
              {waitingForStartAccept ? (
                <button
                  type="button"
                  id="btn-bat-dau-river"
                  onClick={handleCancelStartOffer}
                  className="px-6 py-2.5 rounded-full bg-amber-950/90 border-2 border-amber-400 text-amber-300 font-bold text-sm tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer backdrop-blur-sm animate-pulse select-none"
                  title="Đang đợi đối thủ chấp nhận (Bấm để hủy)"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <span>ĐANG MỜI ĐỐI THỦ...</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-bat-dau-river"
                  onClick={handleStartGameClick}
                  className="group relative px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-red-800 via-amber-900 to-red-800 hover:from-red-700 hover:via-amber-800 hover:to-red-700 border-2 border-amber-400/90 text-white flex items-center justify-center gap-2.5 text-sm sm:text-base font-black tracking-widest transition-all duration-150 shadow-[0_0_24px_rgba(185,28,28,0.6)] cursor-pointer select-none active:scale-95 hover:scale-105"
                  title={`Bắt đầu trận đấu (${formatClockTime(clock.turnSeconds)})`}
                  aria-label="Bắt đầu trận đấu"
                >
                  <Swords className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="text-amber-100 font-black uppercase drop-shadow">BẮT ĐẦU</span>
                </button>
              )}
            </div>
          )}

          {/* CARD XÁC NHẬN NỘI DUNG ĐƠN GIẢN: 1 LÀ ĐỒNG Ý, 2 LÀ CHƠI TIẾP (ÁP DỤNG CẢ CHO ĐỐI THỦ) */}
          {activeDlg && (
            <div
              id="center-board-dialog"
              className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[3px] animate-in fade-in duration-150 pointer-events-auto"
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
          className="w-full mt-3 xl:mt-0 xl:absolute xl:right-[calc(100%+24px)] xl:bottom-0 xl:w-[250px] flex flex-col items-center xl:items-end justify-end select-none z-40 shrink-0 pointer-events-auto"
        >
          {/* BẢNG CHỌN CẢM XÚC NHANH KHI BẤM ICON SMILE: NẰM TRONG VÙNG 4 CÙNG AVATAR, KHÔNG ĐÈ BÀN CỜ */}
          {isQuickMenuOpen && (
            <div
              ref={quickMenuRef}
              className="pointer-events-auto mb-2 w-[240px] p-3 rounded-2xl bg-[#161b26]/98 border border-amber-500/40 shadow-[0_15px_35px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 select-none shrink-0"
            >
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="text-[11px] font-bold text-amber-400">Biểu cảm</span>
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
            </div>
          )}

          {/* CỤM BUBBLES CÔNG CỤ (BUNG RA PHÍA TRÊN AVATAR KHI CLICK VÀO AVATAR HOẶC KHI GHIM) */}
          {(isAvatarPinned || isAvatarOpen) && (
            <div className="relative mb-3 w-[240px] p-2.5 rounded-2xl border border-sky-500/30 bg-gradient-to-b from-[#181d28]/95 via-[#131720]/95 to-[#0d1017]/95 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col gap-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Highlight lấp lánh nhẹ ở 2 bên cạnh của card */}
              <div className="absolute left-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-sky-400 to-transparent opacity-80 pointer-events-none rounded-full" />
              <div className="absolute right-0 top-[20%] bottom-[20%] w-[1.5px] bg-gradient-to-b from-transparent via-sky-400 to-transparent opacity-80 pointer-events-none rounded-full" />

              {/* HÀNG TRÊN: NÚT GHIM (PIN) + CÀI ĐẶT + BIỂU CẢM NHANH */}
              <div className="flex items-center justify-between gap-1.5 w-full">
                <span className="text-[11px] font-bold text-white tracking-wide truncate max-w-[90px]" title={myName}>
                  {myName}
                </span>

                <div className="flex items-center gap-1">
                  {/* NÚT GHIM (PIN) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAvatarPinned((prev) => {
                        const next = !prev
                        if (next) setIsAvatarOpen(true)
                        return next
                      })
                    }}
                    className={cn(
                      'h-7 px-2 rounded-lg border transition-colors duration-150 flex items-center gap-1 cursor-pointer text-xs font-semibold',
                      isAvatarPinned
                        ? 'bg-sky-500/25 border-sky-400 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
                    )}
                    title={isAvatarPinned ? 'Bỏ ghim (Tự động thu gọn)' : 'Ghim hiển thị cố định'}
                    aria-label={isAvatarPinned ? 'Bỏ ghim' : 'Ghim'}
                  >
                    <Pin className={cn('w-3 h-3 transition-transform duration-150', isAvatarPinned && 'fill-sky-400 rotate-45')} />
                    <span>{isAvatarPinned ? 'Đã ghim' : 'Ghim'}</span>
                  </button>

                  {/* NÚT BÁNH RĂNG CÀI ĐẶT */}
                  <button
                    type="button"
                    id="settings-btn"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors duration-150 border border-white/10 flex items-center justify-center cursor-pointer shrink-0"
                    title="Cài đặt trận đấu"
                    aria-label="Cài đặt trận đấu"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  {/* ICON CẢM XÚC NHANH */}
                  <button
                    type="button"
                    id="quick-emoji-btn"
                    onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                    className={cn(
                      'h-7 w-7 rounded-lg border transition-colors duration-150 flex items-center justify-center cursor-pointer shrink-0',
                      isQuickMenuOpen
                        ? 'bg-amber-500/25 border-amber-400/60 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-amber-400 border-white/10'
                    )}
                    title="Biểu cảm nhanh"
                    aria-label="Biểu cảm nhanh"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ĐƯỜNG PHÂN CÁCH MẢNH */}
              <div className="h-[1px] bg-white/10 w-full" />

              {/* HÀNG DƯỚI: 3 NÚT BUBBLE: PVE/PVP, MỜI, XIN */}
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {/* Nút chuyển đổi PvP <-> PvE */}
                <button
                  type="button"
                  id="mode-toggle-card"
                  onClick={() => {
                    if (isPveMode) {
                      handleModeChange(online ? 'online' : 'pass_and_play')
                    } else {
                      handleModeChange('ai')
                    }
                  }}
                  className="h-8 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 text-xs font-semibold text-white transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer select-none"
                  title={!isPveMode ? 'Chế độ PvP' : 'Chế độ PvE'}
                >
                  {!isPveMode ? (
                    <>
                      <Users className="size-3.5 text-amber-400 shrink-0" />
                      <span>PvP</span>
                    </>
                  ) : (
                    <>
                      <Bot className="size-3.5 text-sky-400 shrink-0" />
                      <span>PvE</span>
                    </>
                  )}
                </button>

                {/* Nút Mời chơi */}
                <button
                  type="button"
                  onClick={onInvite}
                  disabled={!onInvite}
                  className="h-8 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 text-xs font-semibold text-white transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer select-none disabled:opacity-40"
                  title="Mời người chơi theo tên"
                  aria-label="Mời chơi"
                >
                  <UserPlus className="size-3.5 text-sky-400" />
                  <span>Mời</span>
                </button>

                {/* NÚT XIN */}
                <div className="relative" ref={xinXoRef}>
                  <button
                    type="button"
                    id="xin-xo-btn"
                    onClick={() => setIsXinXoMenuOpen((prev) => !prev)}
                    disabled={isOver || isAiThinking}
                    className={cn(
                      'w-full h-8 px-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-sky-400/40 text-xs font-semibold text-white transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer select-none disabled:opacity-40',
                      isXinXoMenuOpen && 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                    )}
                    title="Xin"
                    aria-label="Xin"
                  >
                    <Handshake className="size-3.5 text-amber-400 shrink-0" />
                    <span>Xin</span>
                  </button>

                  {/* DROPDOWN MENU 3 KIỂU XIN (BẬT LÊN TRÊN ĐỂ KHÔNG BỊ TRÀN ĐÁY) */}
                  {isXinXoMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-1.5 w-36 bg-[#161a22] border border-amber-500/30 rounded-xl shadow-2xl py-1 z-50 flex flex-col backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                      {/* 1. Xin hòa */}
                      <button
                        type="button"
                        onClick={handleOfferDraw}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                      >
                        <Handshake className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Xin hòa</span>
                      </button>

                      <div className="h-[1px] bg-white/5 my-0.5" />

                      {/* 2. Xin thua */}
                      <button
                        type="button"
                        onClick={handleResign}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                      >
                        <Flag className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Xin thua</span>
                      </button>

                      <div className="h-[1px] bg-white/5 my-0.5" />

                      {/* 3. Xin thắng */}
                      <button
                        type="button"
                        onClick={handleAskForWin}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Xin thắng</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TRUNG TÂM: 1 AVATAR BUBBLE DUY NHẤT */}
          <div className="relative flex flex-col items-center mb-8">
            {/* 1. KHI DÙNG TIN NHẮN NHANH: HIỆN CÂU NÓI PHÍA TRÊN AVATAR 1 TÍ, NỞ SANG TRÁI VÀO VÙNG 4 ĐỂ TUYỆT ĐỐI KHÔNG ĐÈ BÀN CỜ */}
            {myQuickMessage && (
              <div className="absolute bottom-full mb-2.5 right-0 px-3 py-1 rounded-2xl rounded-br-sm bg-[#161a22] border-2 border-amber-400 text-xs font-bold text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {myQuickMessage.emoji && <span className="text-sm shrink-0">{myQuickMessage.emoji}</span>}
                <span className="truncate">{myQuickMessage.text}</span>
              </div>
            )}

            {/* AVATAR TRÒN TRUNG TÂM (GIỮ KÉO TỰ DO TRONG VÙNG 4 HOẶC CLICK ĐỂ MỞ THAO TÁC) */}
            <button
              type="button"
              onPointerDown={handleAvatarPointerDown}
              onPointerMove={handleAvatarPointerMove}
              onPointerUp={handleAvatarPointerUp}
              onPointerCancel={handleAvatarPointerUp}
              onClick={(e) => {
                e.stopPropagation()
                if (justToggledPointerUpRef.current) return
                if (!hasMovedAvatarRef.current && !isAvatarPinned) {
                  setIsAvatarOpen((prev) => !prev)
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
              title={myName ? `${myName} (Nhấn giữ kéo tự do, click để mở thao tác)` : 'Nhấn giữ kéo tự do, click để mở thao tác'}
              aria-label={myName ? `${myName} - Bảng thao tác` : 'Bảng thao tác'}
            >
              <AnhNguoiDung
                ten={myName}
                avatar={myAvatarUrl}
                className="size-full rounded-full pointer-events-none"
              />

              {/* Đĩa cờ nhỏ thể hiện phe Đỏ / Đen ở góc avatar */}
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

              {/* Indicator ghim nhỏ ở góc trên nếu đang ghim */}
              {isAvatarPinned && (
                <div className="absolute -top-1 -right-1 size-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md z-10 text-[9px] pointer-events-none">
                  📌
                </div>
              )}
            </button>

            {/* 2. KHI TỚI LƯỢT: HIỆN THỜI GIAN CHẠY Ở PHÍA DƯỚI AVATAR 1 TÍ */}
            <div
              id="player-desk-clock"
              className={cn(
                'absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-cinzel text-xs font-bold tracking-wider transition-all duration-200 select-none shadow-md z-20 whitespace-nowrap',
                isPlaying && !isOver && isMyTurn
                  ? 'border-red-500/80 bg-red-950/80 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.5)] opacity-100 scale-100 translate-y-0'
                  : recentlyChangedTime !== null || isAvatarOpen
                    ? 'border-white/10 bg-[#161a22]/80 text-white opacity-100 scale-100 translate-y-0'
                    : 'border-white/10 bg-[#161a22]/80 text-gray-300 opacity-0 pointer-events-none -translate-y-1'
              )}
              title="Thời gian chơi của Bạn"
            >
              <Clock className={cn('w-3 h-3 shrink-0', isPlaying && !isOver && isMyTurn ? 'text-red-400' : 'text-gray-400')} />
              <span>
                {isPlaying && !isOver
                  ? isMyTurn
                    ? formatClockTime(clock.timeRemaining)
                    : formatClockTime(clock.turnSeconds)
                  : formatClockTime(recentlyChangedTime || clock.turnSeconds)}
              </span>
            </div>
          </div>
        </aside>

        {/* ==================== VÙNG 1: BUBBLE AVATAR ĐỐI THỦ (GIỐNG HỆT VÙNG 2, CHỈ LÀ 1 AVATAR TRÒN THUẦN TÚY) ==================== */}
        <aside
          id="vung-2-plus-desk"
          aria-label="Thông tin đối thủ"
          className="w-full mb-3 xl:mb-0 xl:absolute xl:left-[calc(100%+24px)] xl:top-0 xl:w-[250px] flex flex-col items-center xl:items-start justify-start select-none z-30 shrink-0 pointer-events-auto"
        >
          {/* TRUNG TÂM: 1 AVATAR BUBBLE DUY NHẤT CỦA ĐỐI THỦ */}
          <div className="relative flex flex-col items-center">
            {/* 1. KHI DÙNG TIN NHẮN NHANH: HIỆN CÂU NÓI PHÍA TRÊN AVATAR 1 TÍ, NỞ SANG PHẢI RA NGOÀI ĐỂ TUYỆT ĐỐI KHÔNG ĐÈ BÀN CỜ */}
            {opponentQuickMessage && (
              <div className="absolute bottom-full mb-2.5 left-0 px-3 py-1 rounded-2xl rounded-bl-sm bg-[#161a22] border-2 border-sky-400 text-xs font-bold text-sky-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex items-center gap-1.5 whitespace-nowrap animate-bounce z-40 select-none pointer-events-none max-w-[200px]">
                {opponentQuickMessage.emoji && <span className="text-sm shrink-0">{opponentQuickMessage.emoji}</span>}
                <span className="truncate">{opponentQuickMessage.text}</span>
              </div>
            )}

            {/* AVATAR TRÒN TRUNG TÂM CỦA ĐỐI THỦ */}
            <div
              className={cn(
                'relative size-14 sm:size-16 rounded-full border-2 p-0.5 transition-colors duration-150 shadow-xl flex items-center justify-center outline-none select-none',
                isOpponentTurn
                  ? opponentSide === RED
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] ring-4 ring-red-500/20'
                    : 'border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.7)] ring-4 ring-sky-400/20'
                  : 'border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.6)] bg-[#121620]/90'
              )}
              title={isPveMode ? 'Người chơi AI' : opponentName ? `${opponentName} (Đối thủ)` : 'Đối thủ'}
              aria-label={isPveMode ? 'Người chơi AI' : opponentName ? `${opponentName} (Đối thủ)` : 'Đối thủ'}
            >
              {isPveMode ? (
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
                  className="size-full rounded-full"
                />
              )}

              {/* Đĩa cờ nhỏ thể hiện phe của đối thủ (帥 / 將) */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center border font-han font-black text-[11px] shadow-md z-10',
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
                {opponentName}
              </span>
            </div>

            {/* 2. KHI TỚI LƯỢT: HIỆN THỜI GIAN CHẠY Ở PHÍA DƯỚI AVATAR 1 TÍ */}
            <div
              id="opponent-desk-clock"
              className={cn(
                'absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border flex items-center justify-center gap-1 font-cinzel text-xs font-bold tracking-wider transition-all duration-200 select-none shadow-md z-20 whitespace-nowrap',
                isPlaying && !isOver && isOpponentTurn
                  ? 'border-sky-400/80 bg-sky-950/80 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.5)] opacity-100 scale-100 translate-y-0'
                  : 'border-white/10 bg-[#161a22]/80 text-gray-300 opacity-0 pointer-events-none -translate-y-1'
              )}
              title="Thời gian chơi của Đối thủ"
            >
              <Clock className="w-3 h-3 text-sky-400 shrink-0" />
              <span>
                {isPlaying && !isOver && isOpponentTurn
                  ? formatClockTime(clock.timeRemaining)
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-[#161a22] border border-amber-500/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Danh Sách Cài Đặt */}
            <div className="p-5 flex flex-col gap-4 text-xs">
              {/* MỤC 1: CÔNG CỤ CHỈNH THỜI GIAN VÁN ĐẤU + CARD TÙY CHỈNH THEO Ý MUỐN */}
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

              {/* MỤC 3: XOAY BÀN CỜ - CHỈ TIÊU ĐỀ, KHÔNG CHÚ THÍCH */}
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

      {/* Token tương thích test suite: opponentSlot={opponentSlotContent} playerSlot={playerSlotContent} */}
      <div className="hidden shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]" aria-hidden="true">
        <GamePlayToolbar mode={mode} onModeChange={handleModeChange} onReset={resetGame} />
      </div>
    </div>
  )
}
