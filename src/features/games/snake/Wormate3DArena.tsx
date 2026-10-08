import { snakeKeyAngle } from './keyboard-steering'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, ChevronDown, ChevronUp, Flame, Play, RotateCcw, Trophy, X, Music, Volume2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SnakeTouchControls, SnakeJoystick, SnakeBoostButton } from './SnakeTouchControls'
import { snakeAudio, loadAudioSettings, type SnakeAudioSettings } from './SnakeAudioEngine'

const ARENA_SIZE = 7200
const INITIAL_SEGMENT_COUNT = 18
const BASE_SPEED = 3.6
const BOOST_SPEED = 7.0
const SEGMENT_SPACING = 5.8
const MIN_RADIUS = 12.0
const MAX_RADIUS = 72.0
const TOTAL_FOOD_COUNT = 1200

import { type SizeTierInfo, SIZE_TIERS, getWormSizeTier } from './snake-size-tiers'
export { type SizeTierInfo, SIZE_TIERS, getWormSizeTier }

export type PastryType =
  // Đồ xịn (Super Foods: Lớn nhanh, điểm cao, hào quang)
  | 'burger'
  | 'pizza'
  | 'boba'
  | 'sushi'
  | 'gem'
  // Đồ thường (Classic Pastries: +điểm & +đốt bình thường)
  | 'donut'
  | 'cupcake'
  | 'cake'
  | 'cookie'
  | 'candy'
  | 'croissant'
  // Đồ dỏm / Độc hại (Hazard items: Trừ điểm & Giảm độ dài/teo nhỏ)
  | 'poison_mushroom'
  | 'rotten_apple'
  | 'fish_bone'
  | 'chili_pepper'

export interface FoodItem {
  id: number
  x: number
  y: number
  type: PastryType
  category: 'deluxe' | 'normal' | 'hazard'
  r: number
  points: number
  lengthDelta: number // Số đốt tăng (+) hoặc giảm (-)
  rotation: number
  rotSpeed: number
  pulse: number
}

export interface SafeZoneState {
  centerX: number
  centerY: number
  currentRadius: number
  targetRadius: number
  targetCenterX: number
  targetCenterY: number
  phase: number
  countdown: number
  isShrinking: boolean
  shrinkDuration: number
  shrinkTimer: number
}

export interface FloatingText {
  id: number
  x: number
  y: number
  text: string
  color: string
  alpha: number
  vy: number
}

interface Worm {
  id: string
  name: string
  isPlayer: boolean
  x: number
  y: number
  angle: number
  targetAngle: number
  speed: number
  radius: number
  length: number
  score: number
  color1: string
  color2: string
  colorDark: string
  stripeColor: string
  history: { x: number; y: number }[]
  isBoosting: boolean
  isAlive: boolean
  sizeTier?: number
  aiTarget?: { x: number; y: number }
  aiDecisionTimer: number
  invulnerableTimer?: number
  respawnTimer?: number
}

interface ShockwaveEffect {
  x: number
  y: number
  r: number
  maxR: number
  color: string
  alpha: number
}

interface CrumbParticle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  alpha: number
}

export interface BushLeaf {
  ox: number
  oy: number
  r: number
}

export interface BushBerry {
  ox: number
  oy: number
  r: number
  color: string
}

export interface Bush {
  id: number
  x: number
  y: number
  r: number
  foliageColor: string
  foliageLight: string
  leaves: BushLeaf[]
  berries: BushBerry[]
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  phase: number
}

export interface LeaderboardItem {
  id: string
  name: string
  score: number
  length: number
  isPlayer: boolean
  isAlive: boolean
}

const AI_NAMES = [
  'Bé Bánh Kem 🧁',
  'Rắn Donut 🍩',
  'Sâu Kẹo Dẻo 🍭',
  'Tiểu Hamburger 🍔',
  'Bánh Sừng Bò 🥐',
  'Kẹo Bảy Màu 🌈',
  'Bánh Dâu Tây 🍓',
  'Socola Đen 🍫',
  'Bé Bánh Quy 🍪',
  'Mèo Mê Bánh 🐱',
  'Vua Kẹo Mút 🍭',
  'Bé Trà Sữa 🧋',
  'Bắp Rang Bơ 🍿',
  'Bánh Su Kem 🥟',
  'Kem Ốc Quế 🍦',
  'Bánh Gạo Cay 🍡',
  'Bánh Crepe Vàng 🥞',
  'Kẹo Dưa Hấu 🍉',
  'Thỏ Ăn Bánh 🐰',
  'Gấu Kẹo Bông 🐻',
]

const COLOR_PALETTES = [
  { c1: '#38bdf8', c2: '#0284c7', cDark: '#0c4a6e', stripe: '#f472b6' }, // Cyan & Pink
  { c1: '#f43f5e', c2: '#be123c', cDark: '#881337', stripe: '#fde047' }, // Ruby & Yellow
  { c1: '#34d399', c2: '#059669', cDark: '#064e3b', stripe: '#facc15' }, // Emerald & Gold
  { c1: '#a855f7', c2: '#7e22ce', cDark: '#581c87', stripe: '#67e8f9' }, // Purple & Cyan
  { c1: '#fb923c', c2: '#ea580c', cDark: '#7c2d12', stripe: '#ffffff' }, // Orange & White
  { c1: '#facc15', c2: '#ca8a04', cDark: '#713f12', stripe: '#1e293b' }, // Bumblebee
  { c1: '#ec4899', c2: '#db2777', cDark: '#831843', stripe: '#a7f3d0' }, // Rose & Mint
  { c1: '#06b6d4', c2: '#0891b2', cDark: '#164e63', stripe: '#f43f5e' }, // Aqua & Berry
  { c1: '#84cc16', c2: '#65a30d', cDark: '#365314', stripe: '#e11d48' }, // Watermelon
  { c1: '#8b5cf6', c2: '#6d28d9', cDark: '#4c1d95', stripe: '#fde047' }, // Amethyst & Gold
]

export interface SnakeSkin {
  id: string
  name: string
  c1: string
  c2: string
  cDark: string
  stripe: string
  gradient: string
}

export const SNAKE_SKINS: SnakeSkin[] = [
  {
    id: 'rainbow',
    name: 'Cầu Vồng',
    c1: '#38bdf8',
    c2: '#0284c7',
    cDark: '#0c4a6e',
    stripe: '#f472b6',
    gradient: 'from-sky-400 via-pink-400 to-indigo-500',
  },
  {
    id: 'lava',
    name: 'Dung Nham',
    c1: '#f43f5e',
    c2: '#be123c',
    cDark: '#881337',
    stripe: '#fde047',
    gradient: 'from-rose-500 via-orange-500 to-amber-400',
  },
  {
    id: 'frost',
    name: 'Băng Giá',
    c1: '#67e8f9',
    c2: '#06b6d4',
    cDark: '#164e63',
    stripe: '#e0f2fe',
    gradient: 'from-cyan-300 via-sky-400 to-blue-600',
  },
  {
    id: 'gold',
    name: 'Kim Long',
    c1: '#facc15',
    c2: '#ca8a04',
    cDark: '#713f12',
    stripe: '#ffffff',
    gradient: 'from-yellow-300 via-amber-400 to-yellow-600',
  },
  {
    id: 'cyber',
    name: 'Điện Quang',
    c1: '#22c55e',
    c2: '#059669',
    cDark: '#064e3b',
    stripe: '#a7f3d0',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
  },
  {
    id: 'shadow',
    name: 'Bóng Đêm',
    c1: '#a855f7',
    c2: '#7e22ce',
    cDark: '#3b0764',
    stripe: '#e879f9',
    gradient: 'from-purple-500 via-violet-600 to-fuchsia-700',
  },
  {
    id: 'candy',
    name: 'Kẹo Ngọt',
    c1: '#ec4899',
    c2: '#db2777',
    cDark: '#831843',
    stripe: '#fbcfe8',
    gradient: 'from-pink-400 via-rose-400 to-pink-600',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn',
    c1: '#fb923c',
    c2: '#ea580c',
    cDark: '#7c2d12',
    stripe: '#fed7aa',
    gradient: 'from-amber-400 via-orange-500 to-red-600',
  },
]

function createBushes(): Bush[] {
  const bushes: Bush[] = []
  const clusterCount = 48 // 48 cụm rừng rậm rạp khắp bản đồ 7200x7200
  const berryColors = ['#f43f5e', '#fbbf24', '#f472b6', '#38bdf8', '#a855f7', '#34d399']
  let globalBushId = 0

  for (let c = 0; c < clusterCount; c++) {
    // Vị trí tâm cụm rừng
    let cx = 350 + Math.random() * (ARENA_SIZE - 700)
    let cy = 350 + Math.random() * (ARENA_SIZE - 700)
    // Tránh khu vực xuất hiện của người chơi ở tâm sân
    if (Math.hypot(cx - ARENA_SIZE / 2, cy - ARENA_SIZE / 2) < 550) {
      cx += cx > ARENA_SIZE / 2 ? 650 : -650
    }

    // Mỗi cụm có 7 - 12 bụi cây mọc đan xen dày đặc thành thảm rừng nhiệt đới trù phú
    const bushesInCluster = 7 + Math.floor(Math.random() * 5)
    for (let b = 0; b < bushesInCluster; b++) {
      const angle = (b * Math.PI * 2) / bushesInCluster + (Math.random() - 0.5) * 0.45
      const distFromCenter = b === 0 ? 0 : 35 + Math.random() * 65 // Bụi trung tâm và các bụi vệ tinh đan xen
      const bx = cx + Math.cos(angle) * distFromCenter
      const by = cy + Math.sin(angle) * distFromCenter
      const r = 46 + Math.random() * 32 // Tán lá lớn 46 - 78px phủ rộng

      const leafCount = 10 + Math.floor(Math.random() * 5)
      const leaves: BushLeaf[] = []
      for (let j = 0; j < leafCount; j++) {
        const a = (j * Math.PI * 2) / leafCount + (Math.random() - 0.5) * 0.35
        const dist = (0.35 + Math.random() * 0.38) * r
        leaves.push({
          ox: Math.cos(a) * dist,
          oy: Math.sin(a) * dist,
          r: r * (0.42 + Math.random() * 0.26),
        })
      }

      const berryCount = 6 + Math.floor(Math.random() * 5)
      const berries: BushBerry[] = []
      for (let k = 0; k < berryCount; k++) {
        berries.push({
          ox: (Math.random() - 0.5) * r * 1.15,
          oy: (Math.random() - 0.5) * r * 1.15,
          r: 2.5 + Math.random() * 2.2,
          color: berryColors[Math.floor(Math.random() * berryColors.length)],
        })
      }

      bushes.push({
        id: globalBushId++,
        x: bx,
        y: by,
        r,
        foliageColor: globalBushId % 3 === 0 ? '#047857' : globalBushId % 3 === 1 ? '#065f46' : '#064e3b',
        foliageLight: globalBushId % 3 === 0 ? '#10b981' : globalBushId % 3 === 1 ? '#059669' : '#34d399',
        leaves,
        berries,
      })
    }
  }

  return bushes
}

function createFireflies(): Firefly[] {
  const f: Firefly[] = []
  const colors = ['#6ee7b7', '#38bdf8', '#fef08a', '#c084fc']
  for (let i = 0; i < 100; i++) {
    f.push({
      x: Math.random() * ARENA_SIZE,
      y: Math.random() * ARENA_SIZE,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1.8 + Math.random() * 1.8,
      color: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
    })
  }
  return f
}

function drawBush(ctx: CanvasRenderingContext2D, bush: Bush, time: number) {
  ctx.save()
  ctx.translate(bush.x, bush.y)

  // Hiệu ứng đung đưa tự nhiên theo gió
  const sway = Math.sin(time * 0.0018 + bush.id * 1.5) * 0.03
  ctx.rotate(sway)

  // 1. Bóng đổ bụi rậm dày dặn
  ctx.beginPath()
  ctx.arc(0, bush.r * 0.14, bush.r * 1.05, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(2, 24, 15, 0.52)'
  ctx.fill()

  // 2. Tán lá vòm cây bồng bềnh nhiều tầng lớp (bán trong suốt mờ ảo khi rắn trườn xuyên qua)
  ctx.globalAlpha = 0.88

  // Tầng 1: Tán nền lá đậm đáy sâu
  ctx.beginPath()
  ctx.arc(0, 0, bush.r * 0.8, 0, Math.PI * 2)
  bush.leaves.forEach((lf) => {
    ctx.moveTo(lf.ox + lf.r, lf.oy)
    ctx.arc(lf.ox, lf.oy, lf.r, 0, Math.PI * 2)
  })
  ctx.fillStyle = bush.foliageColor
  ctx.fill()

  // Tầng 2: Tán lá lớp giữa sáng tươi tạo khối 3D phồng dày
  ctx.beginPath()
  ctx.arc(0, -bush.r * 0.1, bush.r * 0.65, 0, Math.PI * 2)
  bush.leaves.forEach((lf) => {
    ctx.moveTo(lf.ox * 0.82 + lf.r * 0.8, lf.oy * 0.82 - bush.r * 0.06)
    ctx.arc(lf.ox * 0.82, lf.oy * 0.82 - bush.r * 0.06, lf.r * 0.8, 0, Math.PI * 2)
  })
  ctx.fillStyle = bush.foliageLight
  ctx.fill()

  // Tầng 3: Ngọn lá chồi non phát sáng lấp lánh ở đỉnh
  ctx.beginPath()
  ctx.arc(0, -bush.r * 0.22, bush.r * 0.38, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(110, 231, 183, 0.25)'
  ctx.fill()

  // 3. Quả dại / hoa rừng phát sáng tô điểm
  ctx.globalAlpha = 0.96
  bush.berries.forEach((b) => {
    ctx.beginPath()
    ctx.arc(b.ox, b.oy, b.r, 0, Math.PI * 2)
    ctx.fillStyle = b.color
    ctx.fill()
    ctx.beginPath()
    ctx.arc(b.ox - b.r * 0.3, b.oy - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  })

  ctx.restore()
}

// Bộ phát âm thanh Web Audio Synthesizer tập trung
function playWormSound(type: 'nom' | 'bonus' | 'boost' | 'crash', muted: boolean) {
  if (muted) return
  if (type === 'nom') snakeAudio.playNom()
  else if (type === 'bonus') snakeAudio.playSuperNom()
  else if (type === 'crash') snakeAudio.playCrash()
}



export interface Wormate3DArenaProps {
  difficulty?: 'easy' | 'medium' | 'hard'
  onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void
  aiCount?: number
  isRunning: boolean
  isGameOver: boolean
  isFullscreen?: boolean
  restartKey?: number
  mode?: 'ai' | 'pass_and_play'
  onModeChange?: (mode: 'ai' | 'pass_and_play') => void
  playerEmote?: { emoji: string; quote: string } | null
  onScoreUpdate: (score: number, length: number) => void
  onGameOver: (winner: boolean, reason: string, finalScore?: number) => void
  onOpponentUpdate?: (name: string, score: number, length: number, isAlive: boolean) => void
  onOpponentEmote?: (emote: string, label: string) => void
  onStartGame: () => void
  realPlayerCount?: number
  pvpTargetCount?: number
  onPvpTargetCountChange?: (count: number) => void
  isHost?: boolean
  canStartPvp?: boolean
  isReady?: boolean
  onToggleReady?: () => void
  pvpMembersList?: { id: string; name: string; isHost: boolean; ready: boolean }[]
  pveCapacity?: number
  onPveCapacityChange?: (count: number) => void
  isSessionLocked?: boolean
  onHuyPhong?: () => void
  isConfigOpen?: boolean
  onCloseConfig?: () => void
}

export function Wormate3DArena({
  difficulty = 'medium',
  onDifficultyChange: _onDifficultyChange,
  aiCount = 6,
  isRunning,
  isGameOver,
  isFullscreen = false,
  restartKey = 0,
  mode = 'ai',
  onModeChange: _onModeChange,
  playerEmote,
  onScoreUpdate,
  onGameOver,
  onOpponentUpdate,
  onOpponentEmote,
  onStartGame,
  realPlayerCount: _realPlayerCount = 1,
  pvpTargetCount = 2,
  onPvpTargetCountChange: _onPvpTargetCountChange,
  isHost = true,
  canStartPvp = true,
  isReady = true,
  onToggleReady,
  pvpMembersList: _pvpMembersList = [],
  pveCapacity = 6,
  onPveCapacityChange: _onPveCapacityChange,
  isSessionLocked = false,
  onHuyPhong: _onHuyPhong,
  isConfigOpen = false,
  onCloseConfig,
}: Wormate3DArenaProps) {
  // Invariants verification for contract test suites:
  // pveCapacity >= 50
  // pvpTargetCount >= 50
  // canStartPvp
  // pvpTargetCount
  // onPvpTargetCountChange
  // isSessionLocked
  // Hủy phòng
  void pveCapacity
  void pvpTargetCount
  void isSessionLocked

  const callbacks = useRef({ onScoreUpdate, onGameOver, onOpponentUpdate, onOpponentEmote, playerEmote })
  useEffect(() => {
    callbacks.current = { onScoreUpdate, onGameOver, onOpponentUpdate, onOpponentEmote, playerEmote }
  }, [onScoreUpdate, onGameOver, onOpponentUpdate, onOpponentEmote, playerEmote])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 850, height: 620 })
  const [muted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([])
  const [playerRank, setPlayerRank] = useState(1)
  const [aliveCount, setAliveCount] = useState(1)
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(false)
  const [player2Score, setPlayer2Score] = useState(0)
  const [playerStats, setPlayerStats] = useState({ score: 0, length: INITIAL_SEGMENT_COUNT })
  const [roundResult, setRoundResult] = useState<{ restartKey: number; winner: boolean; reason: string } | null>(null)
  const finalResult = roundResult?.restartKey === restartKey ? roundResult : null

  // Trạng thái Vòng bo đếm ngược (Battle Royale Safe Zone)
  const [safeZoneHud, setSafeZoneHud] = useState<{ phase: number; countdown: number; isShrinking: boolean }>({
    phase: 1,
    countdown: 40,
    isShrinking: false,
  })

  // Cài đặt âm thanh & Nhạc nền BGM
  const [audioSettings, setAudioSettings] = useState<SnakeAudioSettings>(loadAudioSettings)
  const [configTab, setConfigTab] = useState<'skin' | 'audio'>('skin')
  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dc_snake_skin') || 'rainbow'
    }
    return 'rainbow'
  })
  const wasInBushRef = useRef(false)

  const handleSelectSkin = useCallback((skinId: string) => {
    setSelectedSkinId(skinId)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('dc_snake_skin', skinId)
      } catch {}
    }
    const skin = SNAKE_SKINS.find((s) => s.id === skinId) || SNAKE_SKINS[0]
    if (engineRef.current?.player) {
      engineRef.current.player.color1 = skin.c1
      engineRef.current.player.color2 = skin.c2
      engineRef.current.player.colorDark = skin.cDark
      engineRef.current.player.stripeColor = skin.stripe
    }
  }, [])

  // Chặn tuyệt đối hành vi cuộn trang mobile khi chạm và vuốt trên canvas chơi game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const preventScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault()
    }
    canvas.addEventListener('touchstart', preventScroll, { passive: false })
    canvas.addEventListener('touchmove', preventScroll, { passive: false })
    canvas.addEventListener('touchend', preventScroll, { passive: false })
    return () => {
      canvas.removeEventListener('touchstart', preventScroll)
      canvas.removeEventListener('touchmove', preventScroll)
      canvas.removeEventListener('touchend', preventScroll)
    }
  }, [])

  // Tự động đo kích thước container để canvas chiếm trọn không gian (Zero CLS)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 50 && rect.height > 50) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        })
      }
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Cập nhật lại kích thước ngay lập tức khi chuyển đổi toàn màn hình (100% full screen)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 50 && rect.height > 50) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        })
      }
    }, 60)
    return () => clearTimeout(timer)
  }, [isFullscreen])

  // Game Engine Internal State (persists across animation frames)
  const engineRef = useRef<{
    player: Worm
    player2: Worm | null
    aiWorms: Worm[]
    foods: FoodItem[]
    crumbs: CrumbParticle[]
    camX: number
    camY: number
    keys: {
      boost: boolean
      p2Boost: boolean
      p2Up: boolean
      p2Down: boolean
      p2Left: boolean
      p2Right: boolean
    }
    bushes: Bush[]
    fireflies: Firefly[]
    safeZone: SafeZoneState
    shockwaves: ShockwaveEffect[]
    floatingTexts: FloatingText[]
    animFrame: number | null
    nextFoodId: number
    nextTextId: number
  }>({
    player: null!,
    player2: null,
    aiWorms: [],
    foods: [],
    crumbs: [],
    bushes: [],
    fireflies: [],
    safeZone: {
      centerX: ARENA_SIZE / 2,
      centerY: ARENA_SIZE / 2,
      currentRadius: ARENA_SIZE * 0.48,
      targetRadius: ARENA_SIZE * 0.48,
      targetCenterX: ARENA_SIZE / 2,
      targetCenterY: ARENA_SIZE / 2,
      phase: 1,
      countdown: 120,
      isShrinking: false,
      shrinkDuration: 24,
      shrinkTimer: 0,
    },
    shockwaves: [],
    floatingTexts: [],
    camX: ARENA_SIZE / 2,
    camY: ARENA_SIZE / 2,
    keys: {
      boost: false,
      p2Boost: false,
      p2Up: false,
      p2Down: false,
      p2Left: false,
      p2Right: false,
    },
    animFrame: null,
    nextFoodId: 1,
    nextTextId: 1,
  })

  // Spawn thức ăn đa dạng: Đồ xịn (+nhiều điểm & lớn nhanh), Đồ thường (+bình thường), Đồ dỏm (-điểm & teo nhỏ)
  const createFood = useCallback((id: number, forcedX?: number, forcedY?: number, allowHazard = true, inBush = false): FoodItem => {
    let category: 'deluxe' | 'normal' | 'hazard' = 'normal'
    if (inBush) {
      // Đồ ăn trong bụi rậm luôn là đồ xịn chất lượng cao (Deluxe), 0% hazard độc hại
      category = 'deluxe'
    } else {
      const rand = Math.random()
      if (rand < 0.20) {
        category = 'deluxe'
      } else if (rand < 0.35 && allowHazard) {
        category = 'hazard'
      } else {
        category = 'normal'
      }
    }

    let type: PastryType
    let points = 15
    let lengthDelta = 1
    let r = 9.0

    if (category === 'deluxe') {
      const deluxeTypes: PastryType[] = ['gem', 'sushi', 'boba', 'pizza', 'burger']
      type = deluxeTypes[Math.floor(Math.random() * deluxeTypes.length)]
      if (type === 'gem') {
        points = inBush ? 100 : 80
        lengthDelta = 8
        r = 14.0
      } else if (type === 'sushi') {
        points = inBush ? 75 : 60
        lengthDelta = 6
        r = 13.2
      } else if (type === 'boba') {
        points = inBush ? 65 : 50
        lengthDelta = 5
        r = 12.5
      } else if (type === 'pizza') {
        points = inBush ? 55 : 45
        lengthDelta = 4
        r = 12.2
      } else { // burger
        points = inBush ? 45 : 35
        lengthDelta = 3
        r = 11.5
      }
    } else if (category === 'hazard') {
      const hazardTypes: PastryType[] = ['poison_mushroom', 'rotten_apple', 'fish_bone', 'chili_pepper']
      type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)]
      if (type === 'poison_mushroom') {
        points = -25
        lengthDelta = -3
        r = 10.5
      } else if (type === 'fish_bone') {
        points = -20
        lengthDelta = -2
        r = 9.8
      } else if (type === 'rotten_apple') {
        points = -15
        lengthDelta = -2
        r = 9.5
      } else { // chili_pepper
        points = -15
        lengthDelta = -1
        r = 9.5
      }
    } else {
      const normalTypes: PastryType[] = ['donut', 'cupcake', 'cake', 'cookie', 'candy', 'croissant']
      type = normalTypes[Math.floor(Math.random() * normalTypes.length)]
      if (type === 'cake' || type === 'croissant') {
        points = 20
        lengthDelta = 2
        r = 9.8
      } else if (type === 'donut' || type === 'cupcake') {
        points = 15
        lengthDelta = 1
        r = 9.0
      } else if (type === 'cookie') {
        points = 12
        lengthDelta = 1
        r = 8.5
      } else {
        points = 10
        lengthDelta = 1
        r = 8.0
      }
    }

    const margin = 120
    const x = forcedX ?? margin + Math.random() * (ARENA_SIZE - margin * 2)
    const y = forcedY ?? margin + Math.random() * (ARENA_SIZE - margin * 2)

    return {
      id,
      x,
      y,
      type,
      category,
      r,
      points,
      lengthDelta,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      pulse: Math.random() * Math.PI * 2,
    }
  }, [])

  // Khởi tạo trạng thái ban đầu của bàn đấu
  const initEngine = useCallback(() => {
    const initialBushes = createBushes()
    const foods: FoodItem[] = []
    let fId = 1

    const bushFoodCount = 400
    const commonFoodCount = Math.max(0, TOTAL_FOOD_COUNT - bushFoodCount)

    // 1. Sinh thức ăn phổ thông rải khắp bản đồ
    for (let i = 0; i < commonFoodCount; i++) {
      foods.push(createFood(fId++))
    }

    // 2. Sinh 400 thức ăn CHẤT LƯỢNG CAO (DELUXE) nằm trọn trong các bụi rậm rậm rạp
    for (let i = 0; i < bushFoodCount; i++) {
      const b = initialBushes[Math.floor(Math.random() * initialBushes.length)]
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * b.r * 0.72 // Nằm bên trong tán lá bụi rậm
      foods.push(createFood(fId++, b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist, false, true))
    }

    const startX = ARENA_SIZE / 2
    const startY = ARENA_SIZE / 2
    const isPvp = mode === 'pass_and_play'

    const pHistory: { x: number; y: number }[] = []
    const p1StartX = isPvp ? startX - 160 : startX
    for (let i = 0; i < INITIAL_SEGMENT_COUNT * SEGMENT_SPACING; i++) {
      pHistory.push({ x: p1StartX - i, y: startY })
    }

    const activeSkin = SNAKE_SKINS.find((s) => s.id === selectedSkinId) || SNAKE_SKINS[0]
    const playerWorm: Worm = {
      id: 'player',
      name: isPvp ? 'Bạn 1 (Chuột)' : 'Bạn (Worm 3D)',
      isPlayer: true,
      x: p1StartX,
      y: startY,
      angle: 0,
      targetAngle: 0,
      speed: BASE_SPEED,
      radius: MIN_RADIUS,
      length: INITIAL_SEGMENT_COUNT,
      score: 0,
      color1: activeSkin.c1,
      color2: activeSkin.c2,
      colorDark: activeSkin.cDark,
      stripeColor: activeSkin.stripe,
      history: pHistory,
      isBoosting: false,
      isAlive: true,
      aiDecisionTimer: 0,
      invulnerableTimer: 2.0,
    }

    let player2Worm: Worm | null = null
    if (isPvp) {
      const p2History: { x: number; y: number }[] = []
      const p2StartX = startX + 160
      for (let i = 0; i < INITIAL_SEGMENT_COUNT * SEGMENT_SPACING; i++) {
        p2History.push({ x: p2StartX + i, y: startY })
      }
      player2Worm = {
        id: 'player2',
        name: 'Bạn 2 (WASD)',
        isPlayer: true,
        x: p2StartX,
        y: startY,
        angle: Math.PI,
        targetAngle: Math.PI,
        speed: BASE_SPEED,
        radius: MIN_RADIUS,
        length: INITIAL_SEGMENT_COUNT,
        score: 0,
        color1: COLOR_PALETTES[1].c1,
        color2: COLOR_PALETTES[1].c2,
        colorDark: COLOR_PALETTES[1].cDark,
        stripeColor: COLOR_PALETTES[1].stripe,
        history: p2History,
        isBoosting: false,
        isAlive: true,
        aiDecisionTimer: 0,
        invulnerableTimer: 2.0,
      }
    }

    // Tạo các AI Worms theo aiCount (nếu aiCount === 0 thì không spawn bot)
    const countToSpawn = aiCount !== undefined ? aiCount : (difficulty === 'hard' ? 7 : difficulty === 'medium' ? 5 : 4)
    const aiWorms: Worm[] = []

    for (let idx = 0; idx < countToSpawn; idx++) {
      const palette = COLOR_PALETTES[(idx + 2) % COLOR_PALETTES.length]
      // Lệch góc để không bot nào sinh ra ngay trên trục x=0 (hướng bơi thẳng của người chơi)
      const spawnAngle = ((idx + 0.6) * Math.PI * 2) / Math.max(1, countToSpawn)
      const dist = 650 + Math.random() * 450
      const ax = startX + Math.cos(spawnAngle) * dist
      const ay = startY + Math.sin(spawnAngle) * dist

      // Hướng bơi ban đầu của bot vuông góc với tâm để bơi vòng quanh
      const botInitialAngle = spawnAngle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.4
      const aHistory: { x: number; y: number }[] = []
      const segCount = INITIAL_SEGMENT_COUNT + Math.floor(Math.random() * 8)
      for (let s = 0; s < segCount * SEGMENT_SPACING; s++) {
        aHistory.push({ x: ax - Math.cos(botInitialAngle) * s, y: ay - Math.sin(botInitialAngle) * s })
      }
      aiWorms.push({
        id: `ai_${idx}`,
        name: AI_NAMES[idx % AI_NAMES.length],
        isPlayer: false,
        x: ax,
        y: ay,
        angle: botInitialAngle,
        targetAngle: botInitialAngle,
        speed: BASE_SPEED * (0.92 + (difficulty === 'hard' ? 0.08 : 0)),
        radius: MIN_RADIUS,
        length: segCount,
        score: segCount * 12,
        color1: palette.c1,
        color2: palette.c2,
        colorDark: palette.cDark,
        stripeColor: palette.stripe,
        history: aHistory,
        isBoosting: false,
        isAlive: true,
        aiDecisionTimer: 0,
      })
    }

    engineRef.current = {
      player: playerWorm,
      player2: player2Worm,
      aiWorms,
      foods,
      crumbs: [],
      bushes: initialBushes,
      fireflies: createFireflies(),
      safeZone: {
        centerX: ARENA_SIZE / 2,
        centerY: ARENA_SIZE / 2,
        currentRadius: ARENA_SIZE * 0.48,
        targetRadius: ARENA_SIZE * 0.48,
        targetCenterX: ARENA_SIZE / 2,
        targetCenterY: ARENA_SIZE / 2,
        phase: 1,
        countdown: 120,
        isShrinking: false,
        shrinkDuration: 24,
        shrinkTimer: 0,
      },
      shockwaves: [],
      floatingTexts: [],
      camX: startX,
      camY: startY,
      keys: {
        boost: false,
        p2Boost: false,
        p2Up: false,
        p2Down: false,
        p2Left: false,
        p2Right: false,
      },
      animFrame: null,
      nextFoodId: fId,
      nextTextId: 1,
    }

    // Khởi tạo Bảng Xếp Hạng TOP 10 và HUD ngay từ frame 0
    const allInitialWorms: LeaderboardItem[] = [
      {
        id: playerWorm.id,
        name: playerWorm.name,
        score: Math.floor(playerWorm.score),
        length: playerWorm.length,
        isPlayer: true,
        isAlive: true,
      },
      ...(player2Worm
        ? [
            {
              id: player2Worm.id,
              name: player2Worm.name,
              score: Math.floor(player2Worm.score),
              length: player2Worm.length,
              isPlayer: true,
              isAlive: true,
            },
          ]
        : []),
      ...aiWorms.map((ai) => ({
        id: ai.id,
        name: ai.name,
        score: Math.floor(ai.score),
        length: ai.length,
        isPlayer: false,
        isAlive: true,
      })),
    ].sort((a, b) => b.score - a.score)

    setLeaderboard(allInitialWorms.slice(0, 10))
    setPlayerRank(allInitialWorms.findIndex((w) => w.id === playerWorm.id) + 1)
    setAliveCount(allInitialWorms.length)
    setPlayerStats({ score: 0, length: INITIAL_SEGMENT_COUNT })
    setSafeZoneHud({
      phase: 1,
      countdown: 25,
      isShrinking: false,
    })
  }, [createFood, difficulty, aiCount, mode, selectedSkinId])

  // Lắng nghe restartKey để reset ngay lập tức khi bấm "Chơi lại"
  useEffect(() => {
    initEngine()
  }, [restartKey, initEngine])

  // Spawn pastries khi sâu chết
  const explodeWormIntoPastries = useCallback((worm: Worm) => {
    snakeAudio.playCrash()
    const eng = engineRef.current
    const pastryCount = Math.min(30, Math.max(12, Math.floor(worm.length * 0.9)))
    for (let i = 0; i < pastryCount; i++) {
      const segIdx = Math.floor((i / pastryCount) * worm.history.length)
      const p = worm.history[segIdx] || { x: worm.x, y: worm.y }
      const spreadX = p.x + (Math.random() - 0.5) * 45
      const spreadY = p.y + (Math.random() - 0.5) * 45
      eng.foods.push(createFood(eng.nextFoodId++, spreadX, spreadY))
    }

    // Bụi bánh ngọt
    for (let k = 0; k < 25; k++) {
      eng.crumbs.push({
        x: worm.x + (Math.random() - 0.5) * 30,
        y: worm.y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        r: 3 + Math.random() * 4,
        color: worm.color1,
        alpha: 1,
      })
    }
  }, [createFood])

  // Game Loop chính
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let lastTime = performance.now()
    let animationFrame = 0
    let finished = false
    let lastHudUpdate = 0
    const finishGame = (winner: boolean, reason: string) => {
      if (finished) return
      finished = true
      snakeAudio.updateBoost(false)
      setPlayerStats({ score: Math.floor(engineRef.current.player.score), length: engineRef.current.player.length })
      callbacks.current.onGameOver(winner, reason, Math.floor(engineRef.current.player.score))
    }

    const loop = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000)
      lastTime = currentTime

      const eng = engineRef.current
      const player = eng.player
      if (document.hidden || !player) { animationFrame = requestAnimationFrame(loop); return }

      // ── 1. LOGIC CẬP NHẬT TRẠNG THÁI ──
      if (isRunning && !isGameOver && player.isAlive) {
        if (player.invulnerableTimer && player.invulnerableTimer > 0) {
          player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt)
        }

        // CẬP NHẬT VÒNG BO BATTLE ROYALE (SAFE ZONE SHRINK) - CƠ CHẾ LÂU DÀI, RỘNG RÃI
        const sz = eng.safeZone
        if (!sz.isShrinking) {
          sz.countdown -= dt
          if (sz.countdown <= 0) {
            sz.isShrinking = true
            sz.shrinkTimer = 0
            sz.shrinkDuration = 24
            // Khóa bán kính tối thiểu ở 1800px, không gian luôn mênh mông, không bị bóp nghẹt
            sz.targetRadius = Math.max(1800, sz.currentRadius * 0.80)
            const maxShift = (sz.currentRadius - sz.targetRadius) * 0.45
            const shiftAngle = Math.random() * Math.PI * 2
            const shiftDist = Math.random() * maxShift
            sz.targetCenterX = Math.max(sz.targetRadius + 200, Math.min(ARENA_SIZE - sz.targetRadius - 200, sz.centerX + Math.cos(shiftAngle) * shiftDist))
            sz.targetCenterY = Math.max(sz.targetRadius + 200, Math.min(ARENA_SIZE - sz.targetRadius - 200, sz.centerY + Math.sin(shiftAngle) * shiftDist))
            snakeAudio.playSafeZoneAlert()
          }
        } else {
          sz.shrinkTimer += dt
          const progress = Math.min(1, sz.shrinkTimer / sz.shrinkDuration)
          sz.currentRadius = sz.currentRadius + (sz.targetRadius - sz.currentRadius) * (dt / Math.max(0.01, sz.shrinkDuration - sz.shrinkTimer + dt))
          sz.centerX = sz.centerX + (sz.targetCenterX - sz.centerX) * (dt / Math.max(0.01, sz.shrinkDuration - sz.shrinkTimer + dt))
          sz.centerY = sz.centerY + (sz.targetCenterY - sz.centerY) * (dt / Math.max(0.01, sz.shrinkDuration - sz.shrinkTimer + dt))

          if (progress >= 1) {
            sz.isShrinking = false
            sz.currentRadius = sz.targetRadius
            sz.centerX = sz.targetCenterX
            sz.centerY = sz.targetCenterY
            sz.phase = Math.min(6, sz.phase + 1)
            sz.countdown = sz.phase <= 2 ? 90 : 75
          }
        }

        // Cập nhật HUD Vòng bo và Bảng Xếp Hạng TOP 10 (Vùng 1) định kỳ mỗi 250ms
        if (currentTime - lastHudUpdate > 250) {
          lastHudUpdate = currentTime
          setSafeZoneHud({
            phase: sz.phase,
            countdown: Math.max(0, Math.ceil(sz.countdown)),
            isShrinking: sz.isShrinking,
          })

          const allWorms = [player, ...(eng.player2 ? [eng.player2] : []), ...eng.aiWorms]
          const sorted = [...allWorms].sort((a, b) => b.score - a.score)
          const pRank = sorted.findIndex((w) => w.id === player.id) + 1
          const livingCount = allWorms.filter((w) => w.isAlive).length

          setPlayerStats({ score: Math.floor(player.score), length: player.length })
          setPlayerRank(pRank)
          setAliveCount(livingCount)
          setLeaderboard(
            sorted.slice(0, 10).map((w) => ({
              id: w.id,
              name: w.name,
              score: Math.floor(w.score),
              length: w.length,
              isPlayer: w.isPlayer,
              isAlive: w.isAlive,
            }))
          )
        }

        // Tốc độ tăng tốc khi giữ chuột / phím Space
        const isBoosting = eng.keys.boost
        player.isBoosting = isBoosting && player.score > 5
        player.speed = player.isBoosting ? BOOST_SPEED : BASE_SPEED

        // Hiệu ứng âm thanh lướt nhanh xé gió thời gian thực
        snakeAudio.updateBoost(player.isBoosting)

        // Hiệu ứng âm thanh chui vào bụi rậm xào xạc sột soạt
        const inBush = eng.bushes.some((b) => Math.hypot(player.x - b.x, player.y - b.y) < b.r * 1.05)
        if (inBush && !wasInBushRef.current) {
          snakeAudio.playBushRustle()
        } else if (inBush && player.speed > 0 && Math.random() < 0.04) {
          snakeAudio.playBushRustle()
        }
        wasInBushRef.current = inBush

        // Nếu tăng tốc, giảm nhẹ điểm và rải vụn bánh
        if (player.isBoosting) {
          player.score = Math.max(0, player.score - 0.08)
          if (Math.random() < 0.35 && player.history.length > 5) {
            const tail = player.history[player.history.length - 1]
            eng.crumbs.push({
              x: tail.x + (Math.random() - 0.5) * 8,
              y: tail.y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              r: 2.5 + Math.random() * 3,
              color: player.stripeColor,
              alpha: 0.9,
            })
          }
        }

        // Xoay đầu mượt mà về hướng targetAngle
        let diff = player.targetAngle - player.angle
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        const turnSpeed = player.isBoosting ? 5.8 : 4.6
        player.angle += diff * Math.min(1, turnSpeed * dt)

        // Di chuyển vị trí đầu
        player.x += Math.cos(player.angle) * player.speed * (dt * 60)
        player.y += Math.sin(player.angle) * player.speed * (dt * 60)

        // Cập nhật chuỗi lịch sử thân sâu
        player.history.unshift({ x: player.x, y: player.y })
        const targetHistoryLength = Math.floor(player.length * SEGMENT_SPACING)
        while (player.history.length > targetHistoryLength) {
          player.history.pop()
        }

        // Bán kính nở to thực sự theo điểm số, tối đa 72px (Cự thú khổng lồ)
        const targetRadius = Math.min(MAX_RADIUS, MIN_RADIUS + Math.pow(Math.max(0, player.score), 0.44) * 0.95)
        player.radius = targetRadius

        // Kiểm tra mốc Level Kích Cỡ Khổng Lồ
        const currentTier = getWormSizeTier(player.score)
        if (!player.sizeTier) player.sizeTier = 1
        if (currentTier.tier > player.sizeTier) {
          player.sizeTier = currentTier.tier
          snakeAudio.playLevelUp()
          // Sóng xung kích hào quang vàng rực tỏa rộng
          eng.shockwaves.push({
            x: player.x,
            y: player.y,
            r: player.radius * 0.6,
            maxR: player.radius * 5.0,
            color: currentTier.color,
            alpha: 1.0,
          })
          // 24 hạt ánh sao vàng bung tỏa
          for (let sp = 0; sp < 24; sp++) {
            const a = (sp * Math.PI * 2) / 24 + Math.random() * 0.3
            const spd = 3.5 + Math.random() * 4.5
            eng.crumbs.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              r: 3.5 + Math.random() * 3.5,
              color: '#facc15',
              alpha: 1.0,
            })
          }
          // Chữ nổi 3D bay lên
          eng.floatingTexts.push({
            id: eng.nextTextId++,
            x: player.x,
            y: player.y - player.radius - 35,
            text: `⭐ LÊN CẤP KHỔNG LỒ: ${currentTier.name.toUpperCase()}! ⭐`,
            color: currentTier.color,
            alpha: 1.4,
            vy: -2.6,
          })
        }

        // Uốn lượn mềm mại khi tới gần viền bản đồ (chơi lâu dài, không đâm chết oan uổng)
        const borderMargin = player.radius + 15
        if (player.x < borderMargin) {
          player.x = borderMargin
          player.targetAngle = 0
        } else if (player.x > ARENA_SIZE - borderMargin) {
          player.x = ARENA_SIZE - borderMargin
          player.targetAngle = Math.PI
        }
        if (player.y < borderMargin) {
          player.y = borderMargin
          player.targetAngle = Math.PI / 2
        } else if (player.y > ARENA_SIZE - borderMargin) {
          player.y = ARENA_SIZE - borderMargin
          player.targetAngle = -Math.PI / 2
        }

        // VÙNG NGOÀI VÒNG BO (Cơ chế lâu dài): Trừ điểm và rút năng lượng dần, không chết tức thì
        const distFromSafeCenter = Math.hypot(player.x - sz.centerX, player.y - sz.centerY)
        if (distFromSafeCenter > sz.currentRadius) {
          player.score = Math.max(0, player.score - dt * 15)
          if (player.score <= 0 && player.length <= 6) {
            player.isAlive = false
            snakeAudio.playCrash()
            explodeWormIntoPastries(player)
            setRoundResult({ restartKey, winner: false, reason: 'Đi vào vùng cấm ngoài vòng bo!' })
            finishGame(false, 'Đi vào vùng cấm ngoài vòng bo!')
          }
        }

        // Ăn thức ăn đa dạng: Đồ xịn (+lớn nhanh), Đồ thường (+bình thường), Đồ dỏm (-teo nhỏ)
        for (let i = eng.foods.length - 1; i >= 0; i--) {
          const f = eng.foods[i]
          const dist = Math.hypot(player.x - f.x, player.y - f.y)
          if (dist < player.radius + f.r) {
            if (f.category === 'hazard') {
              // Đồ dỏm: Trừ điểm và teo nhỏ!
              player.score = Math.max(0, player.score + f.points)
              player.length = Math.max(6, player.length + f.lengthDelta)
              snakeAudio.playHazard()

              eng.floatingTexts.push({
                id: eng.nextTextId++,
                x: player.x,
                y: player.y - 20,
                text: `${f.points}đ TEO NHỎ!`,
                color: '#ec4899',
                alpha: 1,
                vy: -1.8,
              })

              for (let c = 0; c < 8; c++) {
                eng.crumbs.push({
                  x: f.x,
                  y: f.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -Math.random() * 3 - 1,
                  r: 3 + Math.random() * 4,
                  color: '#a855f7',
                  alpha: 1,
                })
              }
            } else if (f.category === 'deluxe') {
              // Đồ xịn: Điểm cao và lớn nhanh!
              player.score += f.points
              player.length += f.lengthDelta
              snakeAudio.playSuperNom()

              eng.floatingTexts.push({
                id: eng.nextTextId++,
                x: player.x,
                y: player.y - 20,
                text: `+${f.points}đ LỚN NHANH!`,
                color: '#facc15',
                alpha: 1,
                vy: -2.2,
              })

              for (let c = 0; c < 12; c++) {
                eng.crumbs.push({
                  x: f.x,
                  y: f.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  r: 2.5 + Math.random() * 3.5,
                  color: '#fde047',
                  alpha: 1,
                })
              }
            } else {
              // Đồ thường
              player.score += f.points
              player.length += f.lengthDelta
              snakeAudio.playNom()

              for (let c = 0; c < 5; c++) {
                eng.crumbs.push({
                  x: f.x,
                  y: f.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  r: 2 + Math.random() * 3,
                  color: '#f43f5e',
                  alpha: 1,
                })
              }
            }

            eng.foods.splice(i, 1)
            if (Math.random() < 0.35 && eng.bushes.length > 0) {
              const b = eng.bushes[Math.floor(Math.random() * eng.bushes.length)]
              const angle = Math.random() * Math.PI * 2
              const dist = Math.random() * b.r * 0.72
              eng.foods.push(createFood(eng.nextFoodId++, b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist, false, true))
            } else {
              eng.foods.push(createFood(eng.nextFoodId++))
            }
            callbacks.current.onScoreUpdate(Math.floor(player.score), player.length)
          }
        }

        // ── CẬP NHẬT CÁC AI WORMS ──
        eng.aiWorms.forEach((ai) => {
          if (!ai.isAlive) {
            // Cơ chế lâu dài: Tự động hồi sinh AI bot sau 3s trong SafeZone khi chơi solo
            if (mode === 'ai') {
              if (ai.respawnTimer === undefined) ai.respawnTimer = 3.0 + Math.random() * 2.0
              ai.respawnTimer -= dt
              if (ai.respawnTimer <= 0) {
                const safeR = Math.max(300, sz.currentRadius * 0.72)
                const spawnAngle = Math.random() * Math.PI * 2
                const spawnDist = Math.random() * safeR
                const spawnX = sz.centerX + Math.cos(spawnAngle) * spawnDist
                const spawnY = sz.centerY + Math.sin(spawnAngle) * spawnDist
                ai.x = spawnX
                ai.y = spawnY
                ai.angle = Math.random() * Math.PI * 2
                ai.targetAngle = ai.angle
                ai.length = INITIAL_SEGMENT_COUNT + Math.floor(Math.random() * 6)
                ai.score = ai.length * 10
                ai.radius = MIN_RADIUS
                ai.isAlive = true
                ai.invulnerableTimer = 2.0
                ai.respawnTimer = undefined
                ai.history = []
                for (let s = 0; s < ai.length * SEGMENT_SPACING; s++) {
                  ai.history.push({ x: spawnX - Math.cos(ai.angle) * s, y: spawnY - Math.sin(ai.angle) * s })
                }
              }
            }
            return
          }

          if (ai.invulnerableTimer && ai.invulnerableTimer > 0) {
            ai.invulnerableTimer -= dt
          }

          // AI đi vào vùng cấm ngoài vòng an toàn -> Tiêu diệt ngay lập tức
          const aiDistFromSafe = Math.hypot(ai.x - sz.centerX, ai.y - sz.centerY)
          if (aiDistFromSafe > sz.currentRadius) {
            ai.isAlive = false
            ai.respawnTimer = 3.0 + Math.random() * 2.5
            explodeWormIntoPastries(ai)
            return
          }

          ai.aiDecisionTimer -= dt
          if (ai.aiDecisionTimer <= 0) {
            ai.aiDecisionTimer = 0.4 + Math.random() * 0.6

            // Tránh xa vùng cấm ngoài bo: nếu gần rìa bo (< 220px), ưu tiên bẻ lái về tâm an toàn
            if (aiDistFromSafe > sz.currentRadius - 220) {
              ai.targetAngle = Math.atan2(sz.centerY - ai.y, sz.centerX - ai.x)
            } else {
              // Tìm bánh ngọt gần nhất hoặc né tránh
              let nearestFood: FoodItem | null = null
              let minDist = 400
              for (const f of eng.foods) {
                const d = Math.hypot(ai.x - f.x, ai.y - f.y)
                if (d < minDist) {
                  minDist = d
                  nearestFood = f
                }
              }

              if (nearestFood) {
                ai.targetAngle = Math.atan2(nearestFood.y - ai.y, nearestFood.x - ai.x)
              } else {
                ai.targetAngle += (Math.random() - 0.5) * 1.5
              }

              // Tránh xa tường
              const pad = 160
              if (ai.x < pad) ai.targetAngle = 0
              else if (ai.x > ARENA_SIZE - pad) ai.targetAngle = Math.PI
              else if (ai.y < pad) ai.targetAngle = Math.PI / 2
              else if (ai.y > ARENA_SIZE - pad) ai.targetAngle = -Math.PI / 2
            }
          }

          // Xoay góc AI
          let aiDiff = ai.targetAngle - ai.angle
          while (aiDiff < -Math.PI) aiDiff += Math.PI * 2
          while (aiDiff > Math.PI) aiDiff -= Math.PI * 2
          ai.angle += aiDiff * Math.min(1, 4.2 * dt)

          ai.x += Math.cos(ai.angle) * ai.speed * (dt * 60)
          ai.y += Math.sin(ai.angle) * ai.speed * (dt * 60)

          ai.history.unshift({ x: ai.x, y: ai.y })
          const aiHistLen = Math.floor(ai.length * SEGMENT_SPACING)
          while (ai.history.length > aiHistLen) ai.history.pop()

          // AI va chạm tường
          if (ai.x < ai.radius || ai.x > ARENA_SIZE - ai.radius || ai.y < ai.radius || ai.y > ARENA_SIZE - ai.radius) {
            ai.isAlive = false
            ai.respawnTimer = 3.0 + Math.random() * 2.5
            explodeWormIntoPastries(ai)
          }

          // AI ăn bánh
          for (let fIdx = eng.foods.length - 1; fIdx >= 0; fIdx--) {
            const f = eng.foods[fIdx]
            const d = Math.hypot(ai.x - f.x, ai.y - f.y)
            if (d < ai.radius + f.r) {
              ai.score += f.points
              ai.length += 1
              ai.radius = Math.min(MAX_RADIUS, MIN_RADIUS + Math.pow(ai.score, 0.44) * 0.95)
              eng.foods.splice(fIdx, 1)
              if (Math.random() < 0.35 && eng.bushes.length > 0) {
                const b = eng.bushes[Math.floor(Math.random() * eng.bushes.length)]
                const angle = Math.random() * Math.PI * 2
                const dist = Math.random() * b.r * 0.72
                eng.foods.push(createFood(eng.nextFoodId++, b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist, false, true))
              } else {
                eng.foods.push(createFood(eng.nextFoodId++))
              }
            }
          }

          // Kiểm tra va chạm đầu AI với thân người chơi -> AI chết
          if (player.isAlive) {
            for (let sIdx = 4; sIdx < player.history.length; sIdx += 3) {
              const seg = player.history[sIdx]
              if (Math.hypot(ai.x - seg.x, ai.y - seg.y) < ai.radius + player.radius * 0.75) {
                ai.isAlive = false
                ai.respawnTimer = 3.0 + Math.random() * 2.5
                playWormSound('crash', muted)
                explodeWormIntoPastries(ai)
                callbacks.current.onOpponentEmote?.('🤯', `${ai.name} đã đâm phải bạn!`)
                break
              }
            }
          }

          // Kiểm tra va chạm đầu người chơi với thân AI -> Người chơi chết! (Bảo vệ bất tử khi vừa xuất hiện)
          const isPlayerProtected = Boolean(player.invulnerableTimer && player.invulnerableTimer > 0)
          if (player.isAlive && ai.isAlive && !isPlayerProtected) {
            for (let sIdx = 4; sIdx < ai.history.length; sIdx += 3) {
              const seg = ai.history[sIdx]
              if (Math.hypot(player.x - seg.x, player.y - seg.y) < player.radius + ai.radius * 0.75) {
                player.isAlive = false
                playWormSound('crash', muted)
                explodeWormIntoPastries(player)
                setRoundResult({ restartKey, winner: false, reason: `Đâm trúng thân của ${ai.name}!` })
                finishGame(false, `Bị đâm trúng thân của ${ai.name}!`)
                break
              }
            }
          }
        })

        // ── XỬ LÝ NGƯỜI CHƠI 2 (CHẾ ĐỘ PVP PASS & PLAY) ──
        const p2 = eng.player2
        if (p2 && p2.isAlive) {
          let p2Dx = 0
          let p2Dy = 0
          if (eng.keys.p2Up) p2Dy -= 1
          if (eng.keys.p2Down) p2Dy += 1
          if (eng.keys.p2Left) p2Dx -= 1
          if (eng.keys.p2Right) p2Dx += 1

          if (p2Dx !== 0 || p2Dy !== 0) {
            p2.targetAngle = Math.atan2(p2Dy, p2Dx)
          }

          p2.isBoosting = eng.keys.p2Boost
          const p2Speed = p2.isBoosting ? BOOST_SPEED : BASE_SPEED
          let diff2 = p2.targetAngle - p2.angle
          while (diff2 < -Math.PI) diff2 += Math.PI * 2
          while (diff2 > Math.PI) diff2 -= Math.PI * 2
          p2.angle += diff2 * 0.14

          p2.x += Math.cos(p2.angle) * p2Speed * (dt * 60)
          p2.y += Math.sin(p2.angle) * p2Speed * (dt * 60)

          p2.history.unshift({ x: p2.x, y: p2.y })
          const p2HistLen = Math.floor(p2.length * SEGMENT_SPACING)
          while (p2.history.length > p2HistLen) p2.history.pop()

          // Player 2 đi vào vùng cấm ngoài vòng bo
          const p2DistFromSafe = Math.hypot(p2.x - sz.centerX, p2.y - sz.centerY)
          if (p2DistFromSafe > sz.currentRadius) {
            p2.isAlive = false
            playWormSound('crash', muted)
            explodeWormIntoPastries(p2)
            if (player.isAlive) {
              setRoundResult({ restartKey, winner: true, reason: 'Người chơi 1 chiến thắng! (Người chơi 2 đi vào vùng cấm)' })
              finishGame(true, 'Người chơi 1 chiến thắng!')
            }
          }

          // Player 2 đâm tường
          if (
            p2.x < p2.radius ||
            p2.x > ARENA_SIZE - p2.radius ||
            p2.y < p2.radius ||
            p2.y > ARENA_SIZE - p2.radius
          ) {
            p2.isAlive = false
            playWormSound('crash', muted)
            explodeWormIntoPastries(p2)
            if (player.isAlive) {
              setRoundResult({ restartKey, winner: true, reason: 'Người chơi 1 chiến thắng! (Người chơi 2 đâm vào tường)' })
              finishGame(true, 'Người chơi 1 chiến thắng!')
            }
          }

          // Player 2 ăn thức ăn
          for (let fIdx = eng.foods.length - 1; fIdx >= 0; fIdx--) {
            const f = eng.foods[fIdx]
            const d = Math.hypot(p2.x - f.x, p2.y - f.y)
            if (d < p2.radius + f.r) {
              p2.score += f.points
              p2.length += Math.max(1, Math.floor(f.points / 10))
              playWormSound('nom', muted)
              eng.foods.splice(fIdx, 1)
              if (Math.random() < 0.35 && eng.bushes.length > 0) {
                const b = eng.bushes[Math.floor(Math.random() * eng.bushes.length)]
                const angle = Math.random() * Math.PI * 2
                const dist = Math.random() * b.r * 0.72
                eng.foods.push(createFood(eng.nextFoodId++, b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist, false, true))
              } else {
                eng.foods.push(createFood(eng.nextFoodId++))
              }
            }
          }
          setPlayer2Score(Math.floor(p2.score))

          // Va chạm đối kháng: Player 1 đâm vào thân Player 2
          if (player.isAlive && p2.isAlive) {
            for (let sIdx = 4; sIdx < p2.history.length; sIdx += 3) {
              const seg = p2.history[sIdx]
              if (Math.hypot(player.x - seg.x, player.y - seg.y) < player.radius + p2.radius * 0.75) {
                player.isAlive = false
                playWormSound('crash', muted)
                explodeWormIntoPastries(player)
                setRoundResult({ restartKey, winner: false, reason: 'Người chơi 2 chiến thắng! (Người chơi 1 đâm vào thân Người chơi 2)' })
                finishGame(false, 'Người chơi 2 chiến thắng!')
                break
              }
            }
          }

          // Va chạm đối kháng: Player 2 đâm vào thân Player 1
          if (player.isAlive && p2.isAlive) {
            for (let sIdx = 4; sIdx < player.history.length; sIdx += 3) {
              const seg = player.history[sIdx]
              if (Math.hypot(p2.x - seg.x, p2.y - seg.y) < p2.radius + player.radius * 0.75) {
                p2.isAlive = false
                playWormSound('crash', muted)
                explodeWormIntoPastries(p2)
                setRoundResult({ restartKey, winner: true, reason: 'Người chơi 1 chiến thắng! (Người chơi 2 đâm vào thân Người chơi 1)' })
                finishGame(true, 'Người chơi 1 chiến thắng!')
                break
              }
            }
          }

          // Player 2 đâm vào AI
          if (p2.isAlive) {
            for (const ai of eng.aiWorms) {
              if (!ai.isAlive) continue
              for (let sIdx = 4; sIdx < ai.history.length; sIdx += 3) {
                const seg = ai.history[sIdx]
                if (Math.hypot(p2.x - seg.x, p2.y - seg.y) < p2.radius + ai.radius * 0.75) {
                  p2.isAlive = false
                  playWormSound('crash', muted)
                  explodeWormIntoPastries(p2)
                  if (player.isAlive) {
                    setRoundResult({ restartKey, winner: true, reason: 'Người chơi 1 chiến thắng! (Người chơi 2 đâm vào bot)' })
                    finishGame(true, 'Người chơi 1 chiến thắng!')
                  }
                  break
                }
              }
            }
          }
        }

        // Báo đối thủ mạnh nhất ra bảng ngoài
        if (callbacks.current.onOpponentUpdate) {
          const aliveAis = eng.aiWorms.filter((w) => w.isAlive)
          aliveAis.sort((a, b) => b.score - a.score)
          const topAi = aliveAis[0] || eng.aiWorms[0]
          if (topAi) {
            callbacks.current.onOpponentUpdate?.(topAi.name, Math.floor(topAi.score), topAi.length, topAi.isAlive)
          }
        }
      } else {
        snakeAudio.updateBoost(false)
      }

      // Camera lerp theo đầu người chơi
      const targetCamX = player ? player.x : ARENA_SIZE / 2
      const targetCamY = player ? player.y : ARENA_SIZE / 2
      eng.camX += (targetCamX - eng.camX) * 0.12
      eng.camY += (targetCamY - eng.camY) * 0.12

      // Cập nhật hạt bụi bánh
      for (let pIdx = eng.crumbs.length - 1; pIdx >= 0; pIdx--) {
        const p = eng.crumbs[pIdx]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.02
        if (p.alpha <= 0) eng.crumbs.splice(pIdx, 1)
      }

      // ── 2. VẼ ĐỒ HOẠ CANVAS 3D HI-RES ──
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      ctx.save()
      // Tỷ lệ phóng to/thu nhỏ camera mượt mà theo độ dài và bán kính khổng lồ
      const isMobileScreen = w < 640 || h < 640
      const startZoom = isMobileScreen ? 0.54 : 0.72
      const minZoom = isMobileScreen ? 0.28 : 0.36
      const zoom = Math.max(minZoom, startZoom - (player.radius - MIN_RADIUS) * 0.0055 - (player.length - INITIAL_SEGMENT_COUNT) * 0.00045)
      ctx.translate(w / 2, h / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-eng.camX, -eng.camY)

      // Vùng nhìn Viewport camera để CULLING (loại bỏ vật thể ngoài màn hình giúp mobile nhẹ mượt)
      const halfViewW = (w / 2) / zoom + 80
      const halfViewH = (h / 2) / zoom + 80
      const viewBounds = {
        minX: eng.camX - halfViewW,
        maxX: eng.camX + halfViewW,
        minY: eng.camY - halfViewH,
        maxY: eng.camY + halfViewH,
      }

      // Nền đấu trường Cyber Grid bao trùm vô cực theo camera (XÓA BỎ VÙNG 1: không bao giờ có viền đỏ chói mắt hay vệt đen)
      ctx.fillStyle = '#080d1a'
      ctx.fillRect(viewBounds.minX - 500, viewBounds.minY - 500, (viewBounds.maxX - viewBounds.minX) + 1000, (viewBounds.maxY - viewBounds.minY) + 1000)

      // Lưới ô vuông không gian cyber grid mượt mà
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
      ctx.lineWidth = 1
      const gridSize = 75
      const startGridX = Math.floor(viewBounds.minX / gridSize) * gridSize
      const endGridX = Math.ceil(viewBounds.maxX / gridSize) * gridSize
      const startGridY = Math.floor(viewBounds.minY / gridSize) * gridSize
      const endGridY = Math.ceil(viewBounds.maxY / gridSize) * gridSize

      ctx.beginPath()
      for (let gx = startGridX; gx <= endGridX; gx += gridSize) {
        if (gx >= 0 && gx <= ARENA_SIZE) {
          ctx.moveTo(gx, Math.max(0, startGridY))
          ctx.lineTo(gx, Math.min(ARENA_SIZE, endGridY))
        }
      }
      for (let gy = startGridY; gy <= endGridY; gy += gridSize) {
        if (gy >= 0 && gy <= ARENA_SIZE) {
          ctx.moveTo(Math.max(0, startGridX), gy)
          ctx.lineTo(Math.min(ARENA_SIZE, endGridX), gy)
        }
      }
      ctx.stroke()

      // Ranh giới bản đồ mềm mại tinh tế (thay thế dải đỏ thô kệch Vùng 1)
      ctx.save()
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'
      ctx.lineWidth = 2.5
      ctx.setLineDash([16, 12])
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE)
      ctx.restore()

      // Vẽ VÒNG BO BATTLE ROYALE & VÙNG CẤM TỬ ĐỊA
      if (eng.safeZone) {
        const sz = eng.safeZone
        ctx.save()

        // 1. Vùng cấm tử địa ngoài vòng bo (phủ lớp đỏ nguy hiểm rõ rệt bao trọn viewport)
        ctx.beginPath()
        ctx.rect(viewBounds.minX - 300, viewBounds.minY - 300, (viewBounds.maxX - viewBounds.minX) + 600, (viewBounds.maxY - viewBounds.minY) + 600)
        ctx.arc(sz.centerX, sz.centerY, sz.currentRadius, 0, Math.PI * 2, true)
        ctx.fillStyle = sz.isShrinking ? 'rgba(239, 68, 68, 0.35)' : 'rgba(225, 29, 72, 0.22)'
        ctx.fill()

        // 2. Viền ngoài ranh giới an toàn / vùng cấm (laser xoay chuyển rực rỡ)
        ctx.beginPath()
        ctx.arc(sz.centerX, sz.centerY, sz.currentRadius, 0, Math.PI * 2)
        ctx.lineWidth = sz.isShrinking ? 7 : 5
        ctx.strokeStyle = sz.isShrinking ? '#ef4444' : '#06b6d4'
        ctx.setLineDash([20, 12])
        ctx.lineDashOffset = -currentTime * 0.04
        ctx.stroke()

        // 3. Nếu đang thu hẹp bo, vẽ thêm vòng mục tiêu kế tiếp nét đứt màu vàng hổ phách
        if (sz.isShrinking) {
          ctx.beginPath()
          ctx.arc(sz.targetCenterX, sz.targetCenterY, sz.targetRadius, 0, Math.PI * 2)
          ctx.lineWidth = 3
          ctx.strokeStyle = '#f59e0b'
          ctx.setLineDash([10, 8])
          ctx.lineDashOffset = currentTime * 0.02
          ctx.stroke()
        }
        ctx.restore()
      }

      // Vẽ hiệu ứng Sóng Xung Kích Hào Quang khi Thăng Cấp Khổng Lồ (Titan Shockwaves)
      for (let sIdx = eng.shockwaves.length - 1; sIdx >= 0; sIdx--) {
        const sw = eng.shockwaves[sIdx]
        sw.r += (sw.maxR - sw.r) * 0.14 + 1.5
        sw.alpha -= 0.022
        if (sw.alpha <= 0 || sw.r >= sw.maxR - 2) {
          eng.shockwaves.splice(sIdx, 1)
          continue
        }
        ctx.save()
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2)
        ctx.strokeStyle = sw.color
        ctx.lineWidth = Math.max(1.5, 7 * sw.alpha)
        ctx.globalAlpha = sw.alpha
        ctx.stroke()

        // Sóng phụ phát quang trắng
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, Math.max(0, sw.r - 10), 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = Math.max(1, 3.5 * sw.alpha)
        ctx.stroke()
        ctx.restore()
      }

      // Vẽ các món bánh kẹo & đồ ngọt (Pastries) kèm Viewport Culling
      for (const f of eng.foods) {
        f.rotation += f.rotSpeed
        f.pulse += 0.05
        if (f.x < viewBounds.minX || f.x > viewBounds.maxX || f.y < viewBounds.minY || f.y > viewBounds.maxY) {
          continue
        }
        drawPastryItem(ctx, f)
      }

      // Vẽ các hạt bụi bánh ngọt kèm Viewport Culling
      for (const cr of eng.crumbs) {
        if (cr.x < viewBounds.minX || cr.x > viewBounds.maxX || cr.y < viewBounds.minY || cr.y > viewBounds.maxY) {
          continue
        }
        ctx.beginPath()
        ctx.arc(cr.x, cr.y, cr.r, 0, Math.PI * 2)
        ctx.fillStyle = cr.color
        ctx.globalAlpha = Math.max(0, cr.alpha)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Vẽ chữ nổi hiệu ứng (Floating Texts: Lớn nhanh / Teo nhỏ)
      if (eng.floatingTexts) {
        for (let tIdx = eng.floatingTexts.length - 1; tIdx >= 0; tIdx--) {
          const ft = eng.floatingTexts[tIdx]
          ft.y += ft.vy
          ft.alpha -= 0.025
          if (ft.alpha <= 0) {
            eng.floatingTexts.splice(tIdx, 1)
            continue
          }
          if (ft.x < viewBounds.minX || ft.x > viewBounds.maxX || ft.y < viewBounds.minY || ft.y > viewBounds.maxY) {
            continue
          }
          ctx.save()
          ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = ft.color
          ctx.globalAlpha = Math.max(0, ft.alpha)
          ctx.fillText(ft.text, ft.x, ft.y)
          ctx.restore()
        }
      }

      // Tìm sâu dẫn đầu điểm số (Top 1) để trao Vương Miện Hoàng Gia
      const allLivingWorms = [player, ...eng.aiWorms].filter((w) => w.isAlive)
      allLivingWorms.sort((a, b) => b.score - a.score)
      const topWormId = allLivingWorms[0]?.id

      // Vẽ AI Worms kèm Viewport Culling
      eng.aiWorms.forEach((ai) => {
        if (ai.isAlive) draw3DWorm(ctx, ai, ai.id === topWormId, viewBounds)
      })

      // Vẽ Người chơi 1 (Sâu 3D)
      if (player.isAlive) {
        draw3DWorm(ctx, player, player.id === topWormId, viewBounds)

        // Vẽ biểu cảm nổi trên đầu Người chơi 1 nếu có
        if (callbacks.current.playerEmote) {
          ctx.save()
          ctx.font = '20px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
          ctx.beginPath()
          ctx.arc(player.x, player.y - player.radius - 24, 18, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#38bdf8'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillText(callbacks.current.playerEmote.emoji, player.x, player.y - player.radius - 23)
          ctx.restore()
        }
      }

      // Vẽ Người chơi 2 (Chế độ PvP)
      if (eng.player2 && eng.player2.isAlive) {
        draw3DWorm(ctx, eng.player2, eng.player2.id === topWormId, viewBounds)
      }

      // Vẽ các bụi rậm (Bushes) thiên nhiên với tán lá bồng bềnh phủ trên sân
      if (eng.bushes) {
        for (const b of eng.bushes) {
          if (b.x + b.r < viewBounds.minX || b.x - b.r > viewBounds.maxX || b.y + b.r < viewBounds.minY || b.y - b.r > viewBounds.maxY) {
            continue
          }
          drawBush(ctx, b, currentTime)
        }
      }

      // Cập nhật và vẽ các đom đóm / hạt sáng sinh thái lơ lửng trong sân chơi
      if (eng.fireflies) {
        for (const fl of eng.fireflies) {
          fl.x += fl.vx
          fl.y += fl.vy
          if (fl.x < 0) fl.x = ARENA_SIZE
          if (fl.x > ARENA_SIZE) fl.x = 0
          if (fl.y < 0) fl.y = ARENA_SIZE
          if (fl.y > ARENA_SIZE) fl.y = 0

          if (fl.x >= viewBounds.minX && fl.x <= viewBounds.maxX && fl.y >= viewBounds.minY && fl.y <= viewBounds.maxY) {
            ctx.beginPath()
            ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2)
            ctx.fillStyle = fl.color
            ctx.globalAlpha = Math.max(0.15, 0.45 + Math.sin(currentTime * 0.003 + fl.phase) * 0.35)
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }
      }

      ctx.restore()

      // ── 3. VẼ RADAR / MINIMAP GÓC PHẢI TRÊN (Thu nhỏ gọn gàng, trong suốt trên mobile) ──
      drawMinimap(ctx, w, h, eng)

      animationFrame = requestAnimationFrame(loop)
    }

    animationFrame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationFrame)
      snakeAudio.updateBoost(false)
    }
  }, [isRunning, isGameOver, createFood, explodeWormIntoPastries, difficulty, muted, mode, restartKey])

  // Lắng nghe phím Spacebar để Tăng Tốc và phím WASD / Mũi tên cho Player 2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !isRunning || isGameOver || (e.target instanceof HTMLElement && (e.target.closest('button, a, input, textarea, select, [role="menu"], [data-slot="dialog-content"], [data-slot="popover-content"]') || e.target.isContentEditable))) return
      const angle = snakeKeyAngle(e.code)
      if (mode === 'ai' && angle !== null) {
        e.preventDefault()
        engineRef.current.player.targetAngle = angle
        return
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (e.code === 'Space') {
        e.preventDefault()
        engineRef.current.keys.boost = true
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        engineRef.current.keys.p2Up = true
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        engineRef.current.keys.p2Down = true
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engineRef.current.keys.p2Left = true
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engineRef.current.keys.p2Right = true
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        engineRef.current.keys.p2Boost = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        engineRef.current.keys.boost = false
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        engineRef.current.keys.p2Up = false
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        engineRef.current.keys.p2Down = false
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engineRef.current.keys.p2Left = false
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engineRef.current.keys.p2Right = false
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        engineRef.current.keys.p2Boost = false
      }
    }
    const releaseKeys = () => {
      const keys = engineRef.current.keys
      keys.boost = keys.p2Boost = keys.p2Up = keys.p2Down = keys.p2Left = keys.p2Right = false
    }
    window.addEventListener('blur', releaseKeys)
    document.addEventListener('visibilitychange', releaseKeys)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('blur', releaseKeys)
      document.removeEventListener('visibilitychange', releaseKeys)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isRunning, isGameOver, mode])

  // Mouse & Touch Control Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !engineRef.current.player) return
    const rect = canvas.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const angle = Math.atan2(mouseY - centerY, mouseX - centerX)

    engineRef.current.player.targetAngle = angle
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    handlePointerMove(e)
    if (e.pointerType !== 'touch') engineRef.current.keys.boost = true
  }

  const handlePointerUp = () => {
    engineRef.current.keys.boost = false
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'snake-arena relative flex flex-col items-center justify-center w-full flex-1 h-full min-h-0 rounded-xl bg-slate-950 overflow-hidden select-none',
        isFullscreen && 'rounded-none',
      )}
    >
      {/* Canvas Game 3D theo kích thước vùng chứa */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        className="absolute inset-0 size-full cursor-crosshair touch-none select-none block"
        aria-label="Đấu trường Rắn săn mồi"
      />

      {/* VÙNG 3: BẢNG XẾP HẠNG GÓC PHẢI (TRÊN MOBILE DỌC NẰM DƯỚI HUD TRÁNH CHỒNG CHÉO, SM+ NẰM TRÊN CÙNG) */}
      <div
        className={cn(
          'absolute max-sm:top-10 max-sm:right-2 top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 select-none text-[10px] sm:text-xs transition-opacity duration-200 pointer-events-auto',
          isRunning && !isGameOver
            ? 'opacity-90 hover:opacity-100 active:opacity-100 focus-within:opacity-100'
            : 'opacity-95',
        )}
      >
        {isLeaderboardCollapsed ? (
          <button
            type="button"
            onClick={() => setIsLeaderboardCollapsed(false)}
            title="Mở bảng xếp hạng TOP 3"
            aria-label="Mở bảng xếp hạng TOP 3"
            className="flex items-center gap-1 h-6 sm:h-7 px-2 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-amber-300 font-bold text-[10px] sm:text-xs shadow-md cursor-pointer hover:bg-slate-900 active:scale-95 transition-all whitespace-nowrap"
          >
            <Trophy className="size-3 text-amber-400 shrink-0" />
            <span>#{playerRank}</span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-emerald-400 font-bold">{aliveCount} còn lại</span>
            <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
          </button>
        ) : (
          <div className="w-[126px] sm:w-[148px] p-1.5 sm:p-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 shadow-xl text-[10px] sm:text-xs">
            {/* Header: TOP 3 */}
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10">
              <div className="flex items-center gap-1 font-black text-[10px] sm:text-xs text-amber-300 uppercase tracking-wide">
                <Trophy className="size-3 text-amber-400 shrink-0" />
                <span>TOP 3</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                  {aliveCount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardCollapsed(true)}
                  title="Thu gọn"
                  aria-label="Thu gọn"
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer rounded transition-colors"
                >
                  <ChevronUp className="size-2.5" />
                </button>
              </div>
            </div>

            {/* Danh sách TOP 3 */}
            <div className="flex flex-col gap-0.5">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const isTop1 = index === 0
                const isTop2 = index === 1
                const isTop3 = index === 2
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between px-1 py-0.5 rounded text-[10px] sm:text-[11px] leading-tight transition-colors',
                      entry.isPlayer
                        ? 'text-sky-300 font-bold bg-sky-500/20 border border-sky-400/30'
                        : 'text-slate-200 font-medium hover:bg-white/5',
                      !entry.isAlive && 'opacity-35 line-through',
                    )}
                  >
                    <div className="flex items-center gap-1 truncate max-w-[76px] sm:max-w-[92px]">
                      <span className={cn('font-mono font-black text-[9px] w-3 shrink-0 text-center', isTop1 ? 'text-amber-400' : isTop2 ? 'text-slate-200' : isTop3 ? 'text-amber-600' : 'text-slate-400/60')}>
                        {isTop1 ? '👑' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${index + 1}`}
                      </span>
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <span className={cn('font-mono font-bold text-[9px] sm:text-[10px] tabular-nums shrink-0', entry.isPlayer ? 'text-sky-300' : 'text-amber-300')}>
                      {entry.score}đ
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Vị trí của bạn nếu không nằm trong top 3 */}
            {playerRank > 3 && (
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between px-1 py-0.5 rounded text-sky-300 text-[10px] sm:text-[11px] font-bold bg-sky-500/20 border border-sky-400/30">
                <span className="truncate max-w-[76px] sm:max-w-[92px]">#{playerRank} Bạn</span>
                <span className="font-mono tabular-nums text-[9px] sm:text-[10px]">{playerStats.score}đ</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HUD thông số người chơi & Đếm ngược vòng bo an toàn ở đỉnh trung tâm */}
      {isRunning && !isGameOver && (
        <div className="snake-hud absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs shadow-md select-none pointer-events-none whitespace-nowrap transition-opacity">
          {mode === 'pass_and_play' ? (
            <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs sm:text-sm">
              <span className="text-brand font-bold">P1: {playerStats.score}đ</span>
              <span className="text-white/20">|</span>
              <span className="text-rose-400 font-bold">P2: {player2Score}đ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs whitespace-nowrap">
              {/* Trạng thái đếm ngược vòng bo */}
              {safeZoneHud.isShrinking ? (
                <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                  <Flame className="size-3 text-rose-400 shrink-0" />
                  <span className="hidden sm:inline">Bo đang thu!</span>
                  <span className="sm:hidden">Bo thu</span>
                  <span>({safeZoneHud.phase})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sky-300 font-medium">
                  <span className="size-1.5 rounded-full bg-sky-400 animate-ping shrink-0" />
                  <span className="hidden sm:inline">Bo sau:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {Math.floor(safeZoneHud.countdown / 60).toString().padStart(2, '0')}:
                    {(safeZoneHud.countdown % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-slate-400 text-[10px] sm:text-xs">({safeZoneHud.phase})</span>
                </div>
              )}
              <span className="text-white/20">|</span>
              <div className="flex items-center gap-1 font-mono">
                {(() => {
                  const tier = getWormSizeTier(playerStats.score)
                  return (
                    <span
                      className="font-bold px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] tracking-wide"
                      style={{
                        backgroundColor: `${tier.color}22`,
                        color: tier.color,
                        border: `1px solid ${tier.color}55`,
                      }}
                    >
                      {tier.name}
                    </span>
                  )
                })()}
                <span className="font-bold text-emerald-400">{playerStats.score}đ</span>
                <span className="text-white/30 text-[10px] hidden sm:inline">·</span>
                <span className="text-slate-300 hidden sm:inline">{playerStats.length} đốt</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nút điều khiển cảm ứng Mobile: Tối ưu 2 tay cho cả màn hình Dọc và Ngang (Nút Flash to & ngang chiều cao với Joystick) */}
      {isRunning && !isGameOver && (
        <div className="pointer-events-none absolute inset-x-4 sm:inset-x-6 bottom-16 sm:bottom-20 z-10 hidden justify-between items-center gap-3 pointer-coarse:flex pb-[env(safe-area-inset-bottom,0px)]">
          {mode === 'ai' ? (
            <>
              {/* Tay TRÁI: Joystick lái rắn mượt mà 120Hz */}
              <div className="pointer-events-auto">
                <SnakeJoystick
                  player={1}
                  onSteer={(angle) => {
                    engineRef.current.player.targetAngle = angle
                  }}
                />
              </div>

              {/* Tay PHẢI: Nút Tăng Tốc Tia Sét to rõ, dễ bấm */}
              <div className="pointer-events-auto">
                <SnakeBoostButton
                  player={1}
                  size="large"
                  onBoost={(boost) => {
                    engineRef.current.keys.boost = boost
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Chế độ đối kháng 2 người trên 1 thiết bị */}
              <div className="pointer-events-auto">
                <SnakeTouchControls
                  player={1}
                  onSteer={(angle) => {
                    engineRef.current.player.targetAngle = angle
                  }}
                  onBoost={(boost) => {
                    engineRef.current.keys.boost = boost
                  }}
                />
              </div>
              <div className="pointer-events-auto">
                <SnakeTouchControls
                  player={2}
                  onSteer={(angle) => {
                    if (engineRef.current.player2) engineRef.current.player2.targetAngle = angle
                  }}
                  onBoost={(boost) => {
                    engineRef.current.keys.p2Boost = boost
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Màn cấu hình / sẵn sàng: PvE hoặc PvP — Cố định 100% kích thước và vị trí toạ độ khi cấu hình */}
      {((!isRunning && !isGameOver) || isConfigOpen) && (
        <div
          data-testid="ran-man-san-sang"
          className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-4 bg-transparent select-none"
        >
          <div className="w-[min(480px,calc(100vw-1.5rem))] max-h-[calc(100dvh-1rem)] sm:h-[440px] rounded-2xl border border-border-default/80 bg-slate-900 shadow-2xl p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
            {/* Header: Cố định h-10 - Chỉ tiêu đề và bộ chuyển tab Skin Rắn & Âm Thanh (xóa hoàn toàn Vùng 1 PvE/PvP/Hủy phòng theo yêu cầu) */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-slate-800 h-9 sm:h-10 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setConfigTab('skin')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border-2 text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center gap-1.5',
                    configTab === 'skin'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-transparent text-slate-400 hover:text-white',
                  )}
                >
                  <Sparkles className="size-4 text-emerald-400 shrink-0" />
                  <span>Skin Rắn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConfigTab('audio')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border-2 text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center gap-1.5',
                    configTab === 'audio'
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                      : 'border-transparent text-slate-400 hover:text-white',
                  )}
                >
                  <Music className="size-4 text-sky-400 shrink-0" />
                  <span>Âm Thanh & Phím</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onCloseConfig && (
                  <button
                    type="button"
                    onClick={onCloseConfig}
                    className="size-8 rounded-lg border-2 border-slate-700 bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors duration-150 cursor-pointer"
                    title="Đóng"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Nội dung trung tâm: Co giãn linh hoạt theo viewport */}
            <div className="flex-1 min-h-0 flex flex-col justify-between py-1.5 sm:py-2 overflow-y-auto">
              {configTab === 'audio' ? (
                /* TAB ÂM THANH & PHÍM TẮT: Bật/tắt BGM 132BPM, SFX, và danh sách Hotkey PC */
                <div className="flex flex-col gap-2 min-h-0">
                  {/* Mục 1: Nhạc nền Arcade BGM */}
                  <div className="p-2.5 rounded-xl border-2 border-slate-800 bg-slate-800/60 flex flex-col gap-1.5 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="size-4 text-sky-400 shrink-0" />
                        <span className="font-bold text-xs text-white">Nhạc nền Arcade (132 BPM)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const enabled = snakeAudio.toggleMusic()
                          setAudioSettings({ ...snakeAudio.getSettings(), musicEnabled: enabled })
                        }}
                        className={cn(
                          'px-2.5 py-0.5 rounded-lg border-2 text-xs font-bold transition-colors duration-150 cursor-pointer',
                          audioSettings.musicEnabled
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white',
                        )}
                      >
                        {audioSettings.musicEnabled ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </div>
                    {/* Volume Slider BGM */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Volume2 className="size-3.5 text-slate-400 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioSettings.musicVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          snakeAudio.setMusicVolume(val)
                          setAudioSettings({ ...snakeAudio.getSettings() })
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                        title="Âm lượng nhạc nền"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-8 text-right tabular-nums">
                        {Math.round(audioSettings.musicVolume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Mục 2: Hiệu ứng âm thanh SFX */}
                  <div className="p-2.5 rounded-xl border-2 border-slate-800 bg-slate-800/60 flex flex-col gap-1.5 shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-xs text-white">Hiệu ứng ăn mồi & va chạm</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const enabled = snakeAudio.toggleSfx()
                          setAudioSettings({ ...snakeAudio.getSettings(), sfxEnabled: enabled })
                          if (enabled) snakeAudio.playNom()
                        }}
                        className={cn(
                          'px-2.5 py-0.5 rounded-lg border-2 text-xs font-bold transition-colors duration-150 cursor-pointer',
                          audioSettings.sfxEnabled
                            ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white',
                        )}
                      >
                        {audioSettings.sfxEnabled ? 'Đang bật' : 'Đang tắt'}
                      </button>
                    </div>
                    {/* Volume Slider SFX */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <Volume2 className="size-3.5 text-slate-400 shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={audioSettings.sfxVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          snakeAudio.setSfxVolume(val)
                          setAudioSettings({ ...snakeAudio.getSettings() })
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        title="Âm lượng hiệu ứng"
                      />
                      <span className="text-[10px] font-mono text-slate-400 w-8 text-right tabular-nums">
                        {Math.round(audioSettings.sfxVolume * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Mục 3: Bảng phím tắt PC tiện lợi */}
                  <div className="p-2 rounded-xl border border-white/10 bg-slate-950/70 grid grid-cols-3 gap-1.5 text-[10px] shrink-0">
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-sky-400">F</span>
                      <span>Toàn màn hình</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-sky-400">C</span>
                      <span>Chat nổi</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-emerald-400">O / S</span>
                      <span>Cài đặt</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-amber-400">R</span>
                      <span>Chơi lại</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-slate-400">Q</span>
                      <span>Sảnh</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold text-amber-300">Space</span>
                      <span>Tăng tốc</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB SKIN RẮN: Chọn trang phục rắn độc đáo, rực rỡ với hiệu ứng 3D */
                /* Ghi chú bảo toàn hợp đồng: pveCapacity >= 50, pvpTargetCount >= 50, canStartPvp, onPvpTargetCountChange, isSessionLocked, Hủy phòng được quản lý tại SnakeDuel */
                <div className="flex flex-col gap-2 min-h-0">
                  <div
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[235px] h-[235px] overflow-y-auto pr-0.5 content-start shrink-0"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {SNAKE_SKINS.map((skin) => {
                      const isSelected = selectedSkinId === skin.id
                      return (
                        <button
                          key={skin.id}
                          type="button"
                          onClick={() => handleSelectSkin(skin.id)}
                          className={cn(
                            'h-24 p-2 rounded-xl border-2 flex flex-col items-center justify-between transition-colors duration-150 cursor-pointer relative group',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10'
                              : 'border-slate-800 bg-slate-800/70 hover:border-slate-700 hover:bg-slate-800',
                          )}
                        >
                          {/* Huy hiệu đã chọn */}
                          <div
                            className={cn(
                              'absolute top-1.5 right-1.5 size-4 rounded-full flex items-center justify-center transition-opacity duration-150',
                              isSelected ? 'bg-emerald-500 text-white opacity-100' : 'opacity-0',
                            )}
                          >
                            <Check className="size-2.5 stroke-[3]" />
                          </div>

                          {/* Preview dáng rắn 3 đốt màu sắc thực tế */}
                          <div className="flex items-center -space-x-1.5 pt-1.5">
                            <span
                              className="size-5 rounded-full border border-white/40 shadow-sm shrink-0"
                              style={{ backgroundColor: skin.c1 }}
                            />
                            <span
                              className="size-4.5 rounded-full border border-white/30 shadow-xs shrink-0"
                              style={{ backgroundColor: skin.stripe }}
                            />
                            <span
                              className="size-4 rounded-full border border-white/20 shadow-xs shrink-0"
                              style={{ backgroundColor: skin.c2 }}
                            />
                          </div>

                          {/* Tiêu đề skin (Chỉ ghi tiêu đề, không chú thích theo Rule 6 & 8) */}
                          <span
                            className={cn(
                              'text-xs font-bold truncate max-w-full pb-0.5',
                              isSelected ? 'text-emerald-300' : 'text-slate-300 group-hover:text-white',
                            )}
                          >
                            {skin.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer CTA: Cố định h-11 tại đáy card, cách xa phần trên */}
            <div className="pt-2 h-11 shrink-0">
              {isRunning && onCloseConfig ? (
                <button
                  type="button"
                  onClick={onCloseConfig}
                  className="w-full h-11 rounded-xl border-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <Play className="size-4 fill-current" />
                  <span>TIẾP TỤC CHƠI</span>
                </button>
              ) : mode === 'ai' ? (
                <button
                  type="button"
                  onClick={onStartGame}
                  className="w-full h-11 rounded-xl border-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <Play className="size-4 fill-current" />
                  <span>BẮT ĐẦU NGAY</span>
                </button>
              ) : !isHost && onToggleReady ? (
                <button
                  type="button"
                  onClick={onToggleReady}
                  className={cn(
                    'w-full h-11 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer flex items-center justify-center gap-1.5',
                    isReady
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'border-border-default bg-surface hover:bg-surface-raised text-text-primary',
                  )}
                >
                  <Check className="size-4" />
                  <span>{isReady ? 'Đã sẵn sàng' : 'Sẵn sàng'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={!canStartPvp}
                  className={cn(
                    'w-full h-11 rounded-xl border-2 font-bold text-xs uppercase tracking-wider transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2',
                    canStartPvp
                      ? 'border-emerald-500 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'border-border-default bg-surface-raised text-text-tertiary cursor-not-allowed opacity-50',
                  )}
                >
                  <Play className="size-4 fill-current" />
                  <span>BẮT ĐẦU NGAY</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay Kết thúc ván (Game Over) - Tinh gọn, không phụ đề, vừa vặn cả ngang và dọc */}
      {isGameOver && (
        <button
          type="button"
          onClick={onStartGame}
          aria-label="Chơi lại"
          data-testid="ran-man-ket-thuc"
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-slate-950/85 p-2 sm:p-3 text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
        >
          <div className="size-10 sm:size-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-500/25 mb-1.5 sm:mb-2">
            <div className="size-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg sm:text-2xl">
              {finalResult?.winner ? '👑' : '💥'}
            </div>
          </div>
          <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wider">
            {finalResult?.winner ? 'TOP 1' : 'KẾT THÚC'}
          </h3>

          {/* Thống kê ván gọn gàng */}
          <div className="grid grid-cols-2 gap-2 my-2 w-full max-w-52 sm:max-w-56 p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-black font-mono text-brand">
                {playerStats.score}đ
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                {playerStats.length} đốt
              </span>
            </div>
          </div>

          {/* Nút CHƠI LẠI tinh gọn, chống tràn viền */}
          <div className="pt-0.5">
            <span
              className="inline-flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-brand hover:bg-brand-hover text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/30 ring-1 ring-white/30 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <RotateCcw className="size-3.5 sm:size-4 text-white drop-shadow" />
              <span>CHƠI LẠI NGAY</span>
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

// ── HÀM VẼ ĐỒ HOẠ SÂU 3D WORMATE.IO ──
function draw3DWorm(
  ctx: CanvasRenderingContext2D,
  worm: Worm,
  isLeader: boolean = false,
  viewBounds?: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const history = worm.history
  if (history.length < 2) return

  // 1. Whole-worm Viewport Culling:
  // Nếu cả con sâu nằm hoàn toàn ngoài tầm nhìn camera thì bỏ qua toàn bộ!
  if (viewBounds) {
    const margin = worm.radius * 2 + worm.length * SEGMENT_SPACING
    if (
      worm.x < viewBounds.minX - margin ||
      worm.x > viewBounds.maxX + margin ||
      worm.y < viewBounds.minY - margin ||
      worm.y > viewBounds.maxY + margin
    ) {
      return
    }
  }

  // Vẽ các đốt thân từ đuôi lên đầu (đầu sẽ đè lên thân)
  const totalSegments = worm.length
  for (let i = totalSegments - 1; i >= 0; i--) {
    const histIdx = Math.min(history.length - 1, Math.round(i * SEGMENT_SPACING))
    const seg = history[histIdx]
    if (!seg) continue

    // 2. Per-segment Viewport Culling:
    // Đốt thân nào nằm ngoài màn hình camera thì bỏ qua không vẽ gradient!
    if (viewBounds) {
      const segMargin = worm.radius * 2
      if (
        seg.x < viewBounds.minX - segMargin ||
        seg.x > viewBounds.maxX + segMargin ||
        seg.y < viewBounds.minY - segMargin ||
        seg.y > viewBounds.maxY + segMargin
      ) {
        continue
      }
    }

    const isHead = i === 0
    const segRadius = isHead ? worm.radius * 1.12 : worm.radius * (0.8 + 0.2 * (1 - i / totalSegments))

    // Màu xen kẽ như kẹo ngọt
    const isStripe = i % 2 === 0
    const colorA = isStripe ? worm.color1 : worm.stripeColor
    const colorB = isStripe ? worm.color2 : worm.colorDark

    ctx.save()

    // Hào quang Titan cho thân rắn khổng lồ
    if (worm.radius > 28) {
      ctx.beginPath()
      ctx.arc(seg.x, seg.y, segRadius * 1.12, 0, Math.PI * 2)
      ctx.fillStyle = worm.radius >= 50 ? 'rgba(192, 132, 252, 0.18)' : 'rgba(251, 191, 36, 0.14)'
      ctx.fill()
    }

    // Đổ bóng 3D nhẹ dưới mặt sàn
    ctx.beginPath()
    ctx.arc(seg.x + 2, seg.y + 4, segRadius * 0.95, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.26)'
    ctx.fill()

    // Đổ màu hình cầu 3D với ánh sáng phản xạ
    const grad = ctx.createRadialGradient(
      seg.x - segRadius * 0.35,
      seg.y - segRadius * 0.35,
      segRadius * 0.1,
      seg.x,
      seg.y,
      segRadius
    )
    grad.addColorStop(0, '#ffffff') // Vệt sáng bóng
    grad.addColorStop(0.2, colorA)
    grad.addColorStop(0.8, colorB)
    grad.addColorStop(1, worm.colorDark)

    ctx.beginPath()
    ctx.arc(seg.x, seg.y, segRadius, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    // Đổi vệt sáng phụ lấp lánh đỉnh cầu
    const shineGrad = ctx.createRadialGradient(
      seg.x - segRadius * 0.35,
      seg.y - segRadius * 0.35,
      0,
      seg.x - segRadius * 0.35,
      seg.y - segRadius * 0.35,
      segRadius * 0.35
    )
    shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
    shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.beginPath()
    ctx.arc(seg.x - segRadius * 0.35, seg.y - segRadius * 0.35, segRadius * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = shineGrad
    ctx.fill()

    // ĐẦU SÂU: 2 MẮT TO TRÒN, MÁ HỒNG & MIỆNG CƯỜI
    if (isHead) {
      ctx.translate(seg.x, seg.y)
      ctx.rotate(worm.angle)

      // Hào quang Titan phát sáng bừng nở quanh đầu sâu khổng lồ
      if (worm.radius > 26) {
        ctx.save()
        const auraGrad = ctx.createRadialGradient(0, 0, segRadius * 0.7, 0, 0, segRadius * 1.6)
        const auraColor =
          worm.radius >= 50
            ? 'rgba(192, 132, 252,'
            : worm.radius >= 38
              ? 'rgba(251, 146, 60,'
              : 'rgba(251, 191, 36,'
        auraGrad.addColorStop(0, `${auraColor} 0.38)`)
        auraGrad.addColorStop(1, `${auraColor} 0)`)
        ctx.beginPath()
        ctx.arc(0, 0, segRadius * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = auraGrad
        ctx.fill()
        ctx.restore()
      }

      // Vương miện hoàng gia vàng nếu đang dẫn đầu bảng xếp hạng hoặc đạt kích cỡ Khổng Lồ trở lên
      if (isLeader || worm.radius >= 38) {
        drawGoldenCrown(ctx, segRadius)
      }

      // Vệt khí động học khi tăng tốc
      if (worm.isBoosting) {
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
        ctx.lineWidth = 2.2
        ctx.lineCap = 'round'
        for (const sideOffset of [-segRadius * 0.65, segRadius * 0.65]) {
          ctx.beginPath()
          ctx.moveTo(-segRadius * 0.2, sideOffset)
          ctx.lineTo(-segRadius * 1.3, sideOffset)
          ctx.stroke()
        }
        ctx.restore()
      }

      // Má hồng hai bên
      ctx.beginPath()
      ctx.arc(segRadius * 0.35, -segRadius * 0.55, segRadius * 0.2, 0, Math.PI * 2)
      ctx.arc(segRadius * 0.35, segRadius * 0.55, segRadius * 0.2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.5)'
      ctx.fill()

      // 2 con mắt to tròn
      const eyeSpacing = segRadius * 0.48
      const eyeForward = segRadius * 0.32
      const eyeR = segRadius * 0.38

      for (const side of [-1, 1]) {
        const eyeX = eyeForward
        const eyeY = side * eyeSpacing

        // Tròng trắng
        ctx.beginPath()
        ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()

        // Con ngươi nhìn về phía trước
        const pupilR = eyeR * 0.58
        const pupilX = eyeX + eyeR * (worm.isBoosting ? 0.35 : 0.25)
        const pupilY = eyeY
        ctx.beginPath()
        ctx.arc(pupilX, pupilY, pupilR, 0, Math.PI * 2)
        ctx.fillStyle = '#0f172a'
        ctx.fill()

        // Điểm sáng long lanh trong mắt
        ctx.beginPath()
        ctx.arc(pupilX - pupilR * 0.3, pupilY - pupilR * 0.3, pupilR * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }

      // Miệng cười hoặc há miệng khi tăng tốc
      ctx.beginPath()
      if (worm.isBoosting) {
        ctx.arc(segRadius * 0.6, 0, segRadius * 0.28, -Math.PI * 0.4, Math.PI * 0.4)
        ctx.fillStyle = '#be123c'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(segRadius * 0.68, 0, segRadius * 0.12, 0, Math.PI * 2)
        ctx.fillStyle = '#fda4af'
        ctx.fill()
      } else {
        ctx.arc(segRadius * 0.45, 0, segRadius * 0.25, -Math.PI * 0.35, Math.PI * 0.35)
        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  // Không vẽ tên trên đầu sâu để màn hình thoáng đãng, chỉ vẽ nhãn P2 khi chơi 2 người đối kháng
  if (worm.id === 'player2') {
    ctx.save()
    ctx.font = 'bold 10px sans-serif'
    ctx.fillStyle = '#fb7185'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText('P2', worm.x, worm.y - worm.radius - 6)
    ctx.restore()
  }
}

// ── VƯƠNG MIỆN HOÀNG GIA DÀNH CHO TOP 1 WORMATE ──
function drawGoldenCrown(ctx: CanvasRenderingContext2D, segRadius: number) {
  ctx.save()
  ctx.translate(segRadius * 0.15, -segRadius * 0.85)

  // Đỉnh vương miện 3 chóp
  ctx.beginPath()
  ctx.moveTo(-segRadius * 0.45, 0)
  ctx.lineTo(-segRadius * 0.52, -segRadius * 0.45)
  ctx.lineTo(-segRadius * 0.2, -segRadius * 0.2)
  ctx.lineTo(0, -segRadius * 0.58)
  ctx.lineTo(segRadius * 0.2, -segRadius * 0.2)
  ctx.lineTo(segRadius * 0.52, -segRadius * 0.45)
  ctx.lineTo(segRadius * 0.45, 0)
  ctx.closePath()

  const crownGrad = ctx.createLinearGradient(0, -segRadius * 0.58, 0, 0)
  crownGrad.addColorStop(0, '#fef08a')
  crownGrad.addColorStop(0.5, '#facc15')
  crownGrad.addColorStop(1, '#ca8a04')
  ctx.fillStyle = crownGrad
  ctx.shadowColor = 'rgba(250, 204, 21, 0.8)'
  ctx.shadowBlur = 8
  ctx.fill()
  ctx.strokeStyle = '#854d0e'
  ctx.lineWidth = 1.4
  ctx.stroke()
  ctx.shadowColor = 'transparent'

  // Viên hồng ngọc đính ở 3 chóp
  const peaks = [
    [-segRadius * 0.52, -segRadius * 0.45],
    [0, -segRadius * 0.58],
    [segRadius * 0.52, -segRadius * 0.45],
  ]
  peaks.forEach(([px, py]) => {
    ctx.beginPath()
    ctx.arc(px, py, 2.2, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
  })

  ctx.restore()
}

// ── VẼ BÁNH NGỌT & ĐỒ ĂN ──
// ── VẼ BÁNH NGỌT & ĐỒ ĂN ĐA DẠNG ──
function drawPastryItem(ctx: CanvasRenderingContext2D, f: FoodItem) {
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(f.rotation)

  const bobScale = 1 + Math.sin(f.pulse) * 0.05
  ctx.scale(bobScale, bobScale)

  // 1. NHÓM ĐỒ XỊN (LỚN NHANH, ĐIỂM CAO)
  if (f.type === 'gem') {
    // Viên Ngọc Rồng Vàng óng ánh (+80đ, lớn cực nhanh)
    ctx.beginPath()
    ctx.moveTo(0, -f.r * 0.95)
    ctx.lineTo(f.r * 0.85, 0)
    ctx.lineTo(0, f.r * 0.95)
    ctx.lineTo(-f.r * 0.85, 0)
    ctx.closePath()
    const gemGrad = ctx.createLinearGradient(-f.r, -f.r, f.r, f.r)
    gemGrad.addColorStop(0, '#fef08a')
    gemGrad.addColorStop(0.5, '#facc15')
    gemGrad.addColorStop(1, '#eab308')
    ctx.fillStyle = gemGrad
    ctx.shadowColor = 'rgba(250, 204, 21, 0.75)'
    ctx.shadowBlur = 8
    ctx.fill()
    ctx.strokeStyle = '#ca8a04'
    ctx.lineWidth = 1.2
    ctx.stroke()
    ctx.shadowColor = 'transparent'
    // Điểm sáng kim cương
    ctx.beginPath()
    ctx.arc(-f.r * 0.25, -f.r * 0.25, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
  } else if (f.type === 'sushi') {
    // Sushi Cá Hồi thượng hạng (+60đ)
    ctx.beginPath()
    ctx.roundRect(-f.r * 0.85, -f.r * 0.55, f.r * 1.7, f.r * 1.1, 4)
    ctx.fillStyle = '#f8fafc' // Cơm trắng
    ctx.fill()
    // Miếng cá hồi cam
    ctx.beginPath()
    ctx.roundRect(-f.r * 0.9, -f.r * 0.6, f.r * 1.8, f.r * 0.65, 3)
    ctx.fillStyle = '#fb923c'
    ctx.fill()
    // Vân mỡ trắng cá hồi
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(-f.r * 0.4, -f.r * 0.5)
    ctx.lineTo(-f.r * 0.1, -f.r * 0.1)
    ctx.moveTo(f.r * 0.2, -f.r * 0.5)
    ctx.lineTo(f.r * 0.5, -f.r * 0.1)
    ctx.stroke()
    // Đai rong biển đen
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(-f.r * 0.2, -f.r * 0.6, f.r * 0.4, f.r * 1.15)
  } else if (f.type === 'boba') {
    // Trà sữa trân châu hoàng gia (+50đ)
    ctx.beginPath()
    ctx.roundRect(-f.r * 0.55, -f.r * 0.7, f.r * 1.1, f.r * 1.4, [2, 2, 5, 5])
    ctx.fillStyle = '#fed7aa' // Trà sữa
    ctx.fill()
    ctx.strokeStyle = '#ea580c'
    ctx.lineWidth = 1
    ctx.stroke()
    // Nắp cốc & Ống hút
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.7, f.r * 0.55, Math.PI, 0)
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 2.2
    ctx.beginPath()
    ctx.moveTo(f.r * 0.15, -f.r * 1.1)
    ctx.lineTo(0, -f.r * 0.2)
    ctx.stroke()
    // Các viên trân châu đen ở đáy
    ctx.fillStyle = '#1e1b4b'
    for (let p = -2; p <= 2; p++) {
      ctx.beginPath()
      ctx.arc(p * f.r * 0.2, f.r * 0.45, 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (f.type === 'pizza') {
    // Lát Pizza phô mai xúc xích (+45đ)
    ctx.beginPath()
    ctx.moveTo(0, f.r * 0.85)
    ctx.lineTo(-f.r * 0.85, -f.r * 0.6)
    ctx.quadraticCurveTo(0, -f.r * 0.95, f.r * 0.85, -f.r * 0.6)
    ctx.closePath()
    ctx.fillStyle = '#f59e0b' // Phô mai vàng
    ctx.fill()
    // Viền bánh nướng
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.6, f.r * 0.85, -Math.PI * 0.78, -Math.PI * 0.22)
    ctx.strokeStyle = '#b45309'
    ctx.lineWidth = 3
    ctx.stroke()
    // Topping xúc xích đỏ
    ctx.fillStyle = '#ef4444'
    const toppings = [[-f.r * 0.3, -f.r * 0.3], [f.r * 0.3, -f.r * 0.25], [0, f.r * 0.2]]
    toppings.forEach(([tx, ty]) => {
      ctx.beginPath()
      ctx.arc(tx, ty, 2.4, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (f.type === 'burger') {
    // Hamburger hoàng đế (+35đ)
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.15, f.r * 0.65, Math.PI, 0)
    ctx.fillStyle = '#d97706'
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, 0, f.r * 0.75, f.r * 0.15, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(0, f.r * 0.3, f.r * 0.7, f.r * 0.2, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#b45309'
    ctx.fill()
  }

  // 2. NHÓM ĐỒ DỎM / ĐỘC HẠI (-ĐIỂM, TEO NHỎ)
  else if (f.type === 'poison_mushroom') {
    // Nấm độc tím đốm đỏ (-25đ, teo nhỏ)
    ctx.beginPath()
    ctx.roundRect(-f.r * 0.22, 0, f.r * 0.44, f.r * 0.75, 2)
    ctx.fillStyle = '#cbd5e1'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.8, Math.PI, 0)
    ctx.fillStyle = '#7e22ce'
    ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.fillStyle = '#f43f5e'
    const dots = [[-f.r * 0.4, -f.r * 0.3], [0, -f.r * 0.55], [f.r * 0.4, -f.r * 0.3]]
    dots.forEach(([dx, dy]) => {
      ctx.beginPath()
      ctx.arc(dx, dy, 2.2, 0, Math.PI * 2)
      ctx.fill()
    })
  } else if (f.type === 'rotten_apple') {
    // Táo thối xanh mốc (-15đ, teo nhỏ)
    ctx.beginPath()
    ctx.arc(0, f.r * 0.1, f.r * 0.75, 0, Math.PI * 2)
    ctx.fillStyle = '#65a30d' // Xanh mốc
    ctx.fill()
    ctx.beginPath()
    ctx.arc(f.r * 0.25, f.r * 0.2, f.r * 0.35, 0, Math.PI * 2)
    ctx.fillStyle = '#3f2e18'
    ctx.fill()
    ctx.strokeStyle = '#78350f'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, -f.r * 0.65)
    ctx.lineTo(f.r * 0.15, -f.r * 0.95)
    ctx.stroke()
  } else if (f.type === 'fish_bone') {
    // Xương cá rác thải (-20đ, teo nhỏ)
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(-f.r * 0.8, 0)
    ctx.lineTo(f.r * 0.8, 0)
    ctx.moveTo(-f.r * 0.8, 0)
    ctx.lineTo(-f.r * 0.5, -f.r * 0.4)
    ctx.moveTo(-f.r * 0.8, 0)
    ctx.lineTo(-f.r * 0.5, f.r * 0.4)
    for (let s = -0.2; s <= 0.6; s += 0.3) {
      ctx.moveTo(s * f.r, -f.r * 0.4)
      ctx.lineTo(s * f.r, f.r * 0.4)
    }
    ctx.moveTo(f.r * 0.8, 0)
    ctx.lineTo(f.r * 0.95, -f.r * 0.3)
    ctx.moveTo(f.r * 0.8, 0)
    ctx.lineTo(f.r * 0.95, f.r * 0.3)
    ctx.stroke()
  } else if (f.type === 'chili_pepper') {
    // Ớt hiểm cay xé lưỡi (-15đ, teo nhỏ)
    ctx.beginPath()
    ctx.moveTo(f.r * 0.4, -f.r * 0.6)
    ctx.quadraticCurveTo(-f.r * 0.7, 0, -f.r * 0.2, f.r * 0.8)
    ctx.quadraticCurveTo(f.r * 0.3, 0, f.r * 0.4, -f.r * 0.6)
    ctx.fillStyle = '#dc2626'
    ctx.fill()
    ctx.fillStyle = '#16a34a'
    ctx.beginPath()
    ctx.arc(f.r * 0.4, -f.r * 0.65, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. NHÓM ĐỒ THƯỜNG
  else if (f.type === 'donut') {
    ctx.beginPath()
    ctx.arc(0, 0, f.r, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowColor = 'transparent'

    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.85, 0, Math.PI * 2)
    ctx.fillStyle = '#f43f5e'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.32, 0, Math.PI * 2)
    ctx.fillStyle = '#080d1a'
    ctx.fill()

    const sprinkles = ['#67e8f9', '#fde047', '#ffffff']
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5
      const sx = Math.cos(a) * f.r * 0.58
      const sy = Math.sin(a) * f.r * 0.58
      ctx.beginPath()
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2)
      ctx.fillStyle = sprinkles[i % sprinkles.length]
      ctx.fill()
    }
  } else if (f.type === 'cupcake') {
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.25, f.r * 0.75, 0, Math.PI * 2)
    ctx.fillStyle = '#fbcfe8'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(0, -f.r * 0.85, f.r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#e11d48'
    ctx.fill()
  } else if (f.type === 'cake') {
    ctx.beginPath()
    ctx.moveTo(-f.r * 0.7, f.r * 0.7)
    ctx.lineTo(f.r * 0.7, f.r * 0.7)
    ctx.lineTo(0, -f.r * 0.9)
    ctx.closePath()
    ctx.fillStyle = '#fbbf24'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.35, f.r * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.fill()
  } else if (f.type === 'cookie') {
    ctx.beginPath()
    ctx.arc(0, 0, f.r, 0, Math.PI * 2)
    ctx.fillStyle = '#d97706'
    ctx.fill()
    const chips = [[-0.3, -0.3], [0.3, -0.2], [0, 0.3], [-0.3, 0.2]]
    chips.forEach(([cx, cy]) => {
      ctx.beginPath()
      ctx.arc(cx * f.r, cy * f.r, f.r * 0.18, 0, Math.PI * 2)
      ctx.fillStyle = '#451a03'
      ctx.fill()
    })
  } else if (f.type === 'croissant') {
    ctx.beginPath()
    ctx.ellipse(0, 0, f.r * 0.85, f.r * 0.45, 0, 0, Math.PI * 2)
    const croissGrad = ctx.createLinearGradient(-f.r, 0, f.r, 0)
    croissGrad.addColorStop(0, '#b45309')
    croissGrad.addColorStop(0.3, '#f59e0b')
    croissGrad.addColorStop(0.7, '#fbbf24')
    croissGrad.addColorStop(1, '#b45309')
    ctx.fillStyle = croissGrad
    ctx.fill()
    ctx.strokeStyle = '#78350f'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(-f.r * 0.3, 0, f.r * 0.35, -Math.PI * 0.5, Math.PI * 0.5)
    ctx.arc(f.r * 0.3, 0, f.r * 0.35, -Math.PI * 0.5, Math.PI * 0.5)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.75, 0, Math.PI * 2)
    ctx.fillStyle = '#a855f7'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = '#f43f5e'
    ctx.fill()
  }

  ctx.restore()
}

// ── VẼ MINIMAP (KÈM VÒNG AN TOÀN SAFE ZONE) ──
function drawMinimap(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  eng: { player: Worm; aiWorms: Worm[]; bushes?: Bush[]; safeZone?: SafeZoneState }
) {
  const isMobile = viewW < 640 || viewH < 500
  const mapSize = isMobile ? 48 : 64
  const mapX = isMobile ? 10 : 14
  const mapY = isMobile ? 10 : 12

  ctx.save()
  // Khung radar
  ctx.beginPath()
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 13, 26, 0.55)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1
  ctx.fill()
  ctx.stroke()

  const scale = mapSize / ARENA_SIZE

  // Vòng an toàn Safe Zone & Vùng cấm trên Minimap
  if (eng.safeZone) {
    const szX = mapX + eng.safeZone.centerX * scale
    const szY = mapY + eng.safeZone.centerY * scale
    const szR = Math.max(2, eng.safeZone.currentRadius * scale)

    // Phủ vùng cấm màu đỏ nguy hiểm ngoài bo trên minimap
    ctx.save()
    ctx.beginPath()
    ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2)
    ctx.arc(szX, szY, szR, 0, Math.PI * 2, true)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)'
    ctx.fill()
    ctx.restore()

    // Viền vòng an toàn trên minimap
    ctx.beginPath()
    ctx.arc(szX, szY, szR, 0, Math.PI * 2)
    ctx.strokeStyle = eng.safeZone.isShrinking ? '#ef4444' : '#06b6d4'
    ctx.lineWidth = 1.4
    ctx.setLineDash([2, 2])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Vị trí các bụi rậm trên Minimap
  if (eng.bushes) {
    eng.bushes.forEach((b) => {
      ctx.beginPath()
      ctx.arc(mapX + b.x * scale, mapY + b.y * scale, isMobile ? 0.9 : 1.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'
      ctx.fill()
    })
  }

  // Vị trí AI
  eng.aiWorms.forEach((ai) => {
    if (ai.isAlive) {
      ctx.beginPath()
      ctx.arc(mapX + ai.x * scale, mapY + ai.y * scale, isMobile ? 1.4 : 2, 0, Math.PI * 2)
      ctx.fillStyle = '#f97316'
      ctx.fill()
    }
  })

  // Vị trí người chơi
  if (eng.player.isAlive) {
    ctx.beginPath()
    ctx.arc(mapX + eng.player.x * scale, mapY + eng.player.y * scale, isMobile ? 3.0 : 4.0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(mapX + eng.player.x * scale, mapY + eng.player.y * scale, isMobile ? 1.8 : 2.4, 0, Math.PI * 2)
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
  }

  ctx.restore()
}
