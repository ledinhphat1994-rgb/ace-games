import { snakeKeyAngle } from './keyboard-steering'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Bot, Check, ChevronDown, ChevronUp, Crown, Lock, Play, RotateCcw, Swords, Trophy, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SnakeTouchControls, SnakeJoystick, SnakeBoostButton } from './SnakeTouchControls'

const ARENA_SIZE = 2400
const INITIAL_SEGMENT_COUNT = 18
const BASE_SPEED = 3.6
const BOOST_SPEED = 7.0
const SEGMENT_SPACING = 5.8
const MIN_RADIUS = 11.5
const MAX_RADIUS = 24.0
const TOTAL_FOOD_COUNT = 200

export type PastryType = 'donut' | 'cupcake' | 'cake' | 'cookie' | 'candy' | 'burger' | 'croissant'

interface FoodItem {
  id: number
  x: number
  y: number
  type: PastryType
  r: number
  points: number
  rotation: number
  rotSpeed: number
  pulse: number
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
  aiTarget?: { x: number; y: number }
  aiDecisionTimer: number
  invulnerableTimer?: number
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

function createBushes(): Bush[] {
  const bushes: Bush[] = []
  const count = 32
  const berryColors = ['#f43f5e', '#fbbf24', '#f472b6', '#38bdf8', '#a855f7']
  for (let i = 0; i < count; i++) {
    let bx = 160 + Math.random() * (ARENA_SIZE - 320)
    let by = 160 + Math.random() * (ARENA_SIZE - 320)
    // Tránh khu vực xuất hiện của người chơi ở tâm sân
    if (Math.hypot(bx - ARENA_SIZE / 2, by - ARENA_SIZE / 2) < 280) {
      bx += bx > ARENA_SIZE / 2 ? 340 : -340
    }
    const r = 32 + Math.random() * 24
    const leafCount = 6 + Math.floor(Math.random() * 3)
    const leaves: BushLeaf[] = []
    for (let j = 0; j < leafCount; j++) {
      const a = (j * Math.PI * 2) / leafCount + (Math.random() - 0.5) * 0.35
      const dist = (0.35 + Math.random() * 0.35) * r
      leaves.push({
        ox: Math.cos(a) * dist,
        oy: Math.sin(a) * dist,
        r: r * (0.44 + Math.random() * 0.2),
      })
    }
    const berryCount = 3 + Math.floor(Math.random() * 4)
    const berries: BushBerry[] = []
    for (let k = 0; k < berryCount; k++) {
      berries.push({
        ox: (Math.random() - 0.5) * r * 1.05,
        oy: (Math.random() - 0.5) * r * 1.05,
        r: 2.2 + Math.random() * 1.8,
        color: berryColors[Math.floor(Math.random() * berryColors.length)],
      })
    }
    bushes.push({
      id: i,
      x: bx,
      y: by,
      r,
      foliageColor: i % 2 === 0 ? '#047857' : '#065f46',
      foliageLight: i % 2 === 0 ? '#10b981' : '#059669',
      leaves,
      berries,
    })
  }
  return bushes
}

function createFireflies(): Firefly[] {
  const f: Firefly[] = []
  const colors = ['#6ee7b7', '#38bdf8', '#fef08a', '#c084fc']
  for (let i = 0; i < 26; i++) {
    f.push({
      x: Math.random() * ARENA_SIZE,
      y: Math.random() * ARENA_SIZE,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1.8 + Math.random() * 1.6,
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

  // 1. Bóng đổ bụi rậm
  ctx.beginPath()
  ctx.arc(0, bush.r * 0.12, bush.r * 0.95, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(2, 24, 15, 0.45)'
  ctx.fill()

  // 2. Tán lá vòm cây bồng bềnh (Bán trong suốt để thấy rắn trườn xuyên qua)
  ctx.globalAlpha = 0.84

  // Tán nền lá đậm
  ctx.beginPath()
  ctx.arc(0, 0, bush.r * 0.75, 0, Math.PI * 2)
  bush.leaves.forEach((lf) => {
    ctx.moveTo(lf.ox + lf.r, lf.oy)
    ctx.arc(lf.ox, lf.oy, lf.r, 0, Math.PI * 2)
  })
  ctx.fillStyle = bush.foliageColor
  ctx.fill()

  // Tán lá lớp trên sáng hơn tạo khối 3D mềm mại
  ctx.beginPath()
  ctx.arc(0, -bush.r * 0.1, bush.r * 0.6, 0, Math.PI * 2)
  bush.leaves.forEach((lf) => {
    ctx.moveTo(lf.ox * 0.85 + lf.r * 0.8, lf.oy * 0.85 - bush.r * 0.06)
    ctx.arc(lf.ox * 0.85, lf.oy * 0.85 - bush.r * 0.06, lf.r * 0.8, 0, Math.PI * 2)
  })
  ctx.fillStyle = bush.foliageLight
  ctx.fill()

  // 3. Quả dại / hoa rừng phát sáng tô điểm
  ctx.globalAlpha = 0.95
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

// Web Audio sound synthesizer for crunchy nom-nom and boost sounds
function playWormSound(type: 'nom' | 'bonus' | 'boost' | 'crash', muted: boolean) {
  if (muted || typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.onended = () => { void ctx.close() }
    const now = ctx.currentTime

    if (type === 'nom') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450, now)
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.07)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.07)
      osc.start(now)
      osc.stop(now + 0.07)
    } else if (type === 'bonus') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      osc.frequency.setValueAtTime(900, now + 0.08)
      gain.gain.setValueAtTime(0.14, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22)
      osc.start(now)
      osc.stop(now + 0.22)
    } else if (type === 'crash') {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(35, now + 0.35)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35)
      osc.start(now)
      osc.stop(now + 0.35)
    }
  } catch {}
}

// ── Icon Rắn Dễ Thương (Cute Kawaii Snake) ──
function CuteSnakeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Thân rắn uốn lượn dễ thương */}
      <path
        d="M16 48C11 48 8 44 8 39C8 33 13 29 20 29C26 29 30 33 30 39C30 45 36 49 42 49C48 49 53 45 53 39C53 35 50 31 46 29"
        stroke="#10B981"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Điểm nhấn bụng sáng */}
      <path
        d="M16 48C11 48 8 44 8 39C8 33 13 29 20 29C26 29 30 33 30 39"
        stroke="#6EE7B7"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Đầu rắn tròn trịa */}
      <circle cx="24" cy="21" r="13" fill="#10B981" />
      <circle cx="24" cy="21" r="11" fill="#34D399" />
      {/* Má hồng kawaii */}
      <ellipse cx="14" cy="24" rx="2.5" ry="1.5" fill="#F472B6" opacity="0.85" />
      <ellipse cx="34" cy="24" rx="2.5" ry="1.5" fill="#F472B6" opacity="0.85" />
      {/* Mắt to tròn long lanh */}
      <circle cx="19" cy="18" r="3.2" fill="#0F172A" />
      <circle cx="18" cy="17" r="1.2" fill="white" />
      <circle cx="29" cy="18" r="3.2" fill="#0F172A" />
      <circle cx="28" cy="17" r="1.2" fill="white" />
      {/* Nụ cười vui tươi */}
      <path d="M21 23C22.5 25 25.5 25 27 23" stroke="#065F46" strokeWidth="1.5" strokeLinecap="round" />
      {/* Chiếc lưỡi đỏ nhỏ xinh */}
      <path d="M24 25V28M24 28L22 30M24 28L26 30" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
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
  onModeChange,
  playerEmote,
  onScoreUpdate,
  onGameOver,
  onOpponentUpdate,
  onOpponentEmote,
  onStartGame,
  realPlayerCount: _realPlayerCount = 1,
  pvpTargetCount = 2,
  onPvpTargetCountChange,
  isHost = true,
  canStartPvp = true,
  isReady = true,
  onToggleReady,
  pvpMembersList = [],
  pveCapacity = 6,
  onPveCapacityChange,
  isSessionLocked = false,
  onHuyPhong,
  isConfigOpen = false,
  onCloseConfig,
}: Wormate3DArenaProps) {
  const [isCustomPve, setIsCustomPve] = useState(false)
  const [isCustomPvp, setIsCustomPvp] = useState(false)
  const isPveCustomActive = isCustomPve || (pveCapacity !== 6 && pveCapacity !== 12 && pveCapacity !== 24)
  const isPvpCustomActive = isCustomPvp || (pvpTargetCount !== 2 && pvpTargetCount !== 4 && pvpTargetCount !== 8)

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
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return true
  })
  const [player2Score, setPlayer2Score] = useState(0)
  const [playerStats, setPlayerStats] = useState({ score: 0, length: INITIAL_SEGMENT_COUNT })
  const [roundResult, setRoundResult] = useState<{ restartKey: number; winner: boolean; reason: string } | null>(null)
  const finalResult = roundResult?.restartKey === restartKey ? roundResult : null

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
    animFrame: number | null
    nextFoodId: number
  }>({
    player: null!,
    player2: null,
    aiWorms: [],
    foods: [],
    crumbs: [],
    bushes: [],
    fireflies: [],
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
  })

  // Spawn random food
  const createFood = useCallback((id: number, forcedX?: number, forcedY?: number): FoodItem => {
    const types: PastryType[] = ['donut', 'cupcake', 'cake', 'cookie', 'candy', 'burger', 'croissant']
    const type = types[Math.floor(Math.random() * types.length)]
    let points = 10
    let r = 7.8
    if (type === 'donut' || type === 'cupcake') {
      points = 15
      r = 9.0
    } else if (type === 'croissant') {
      points = 20
      r = 9.6
    } else if (type === 'cake') {
      points = 25
      r = 10.2
    } else if (type === 'burger') {
      points = 30
      r = 11.0
    }

    const margin = 80
    const x = forcedX ?? margin + Math.random() * (ARENA_SIZE - margin * 2)
    const y = forcedY ?? margin + Math.random() * (ARENA_SIZE - margin * 2)

    return {
      id,
      x,
      y,
      type,
      r,
      points,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      pulse: Math.random() * Math.PI * 2,
    }
  }, [])

  // Khởi tạo trạng thái ban đầu của bàn đấu
  const initEngine = useCallback(() => {
    const foods: FoodItem[] = []
    let fId = 1
    for (let i = 0; i < TOTAL_FOOD_COUNT; i++) {
      foods.push(createFood(fId++))
    }

    const startX = ARENA_SIZE / 2
    const startY = ARENA_SIZE / 2
    const isPvp = mode === 'pass_and_play'

    const pHistory: { x: number; y: number }[] = []
    const p1StartX = isPvp ? startX - 160 : startX
    for (let i = 0; i < INITIAL_SEGMENT_COUNT * SEGMENT_SPACING; i++) {
      pHistory.push({ x: p1StartX - i, y: startY })
    }

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
      color1: COLOR_PALETTES[0].c1,
      color2: COLOR_PALETTES[0].c2,
      colorDark: COLOR_PALETTES[0].cDark,
      stripeColor: COLOR_PALETTES[0].stripe,
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
      bushes: createBushes(),
      fireflies: createFireflies(),
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
    }
  }, [createFood, difficulty, aiCount, mode])

  // Lắng nghe restartKey để reset ngay lập tức khi bấm "Chơi lại"
  useEffect(() => {
    initEngine()
  }, [restartKey, initEngine])

  // Spawn pastries khi sâu chết
  const explodeWormIntoPastries = useCallback((worm: Worm) => {
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

        // Tốc độ tăng tốc khi giữ chuột / phím Space
        const isBoosting = eng.keys.boost
        player.isBoosting = isBoosting && player.score > 5
        player.speed = player.isBoosting ? BOOST_SPEED : BASE_SPEED

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

        // Bán kính nở to dần theo số điểm (Cân đối, cuốn hút chuẩn Wormate)
        player.radius = Math.min(MAX_RADIUS, MIN_RADIUS + Math.floor(player.score / 120))

        // Va chạm viền đấu trường
        if (
          player.x < player.radius ||
          player.x > ARENA_SIZE - player.radius ||
          player.y < player.radius ||
          player.y > ARENA_SIZE - player.radius
        ) {
          player.isAlive = false
          playWormSound('crash', muted)
          explodeWormIntoPastries(player)
          setRoundResult({ restartKey, winner: false, reason: 'Đâm vào hàng rào bảo vệ đấu trường!' })
          finishGame(false, 'Đâm vào hàng rào đấu trường!')
        }

        // Ăn bánh ngọt
        for (let i = eng.foods.length - 1; i >= 0; i--) {
          const f = eng.foods[i]
          const dist = Math.hypot(player.x - f.x, player.y - f.y)
          if (dist < player.radius + f.r) {
            // Ăn trúng!
            player.score += f.points
            player.length += Math.max(1, Math.floor(f.points / 10))
            playWormSound(f.points >= 25 ? 'bonus' : 'nom', muted)

            // Vụn bay lên
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

            eng.foods.splice(i, 1)
            eng.foods.push(createFood(eng.nextFoodId++))
            callbacks.current.onScoreUpdate(Math.floor(player.score), player.length)
          }
        }

        // ── CẬP NHẬT CÁC AI WORMS ──
        eng.aiWorms.forEach((ai) => {
          if (!ai.isAlive) return

          ai.aiDecisionTimer -= dt
          if (ai.aiDecisionTimer <= 0) {
            ai.aiDecisionTimer = 0.4 + Math.random() * 0.6

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
            const pad = 120
            if (ai.x < pad) ai.targetAngle = 0
            else if (ai.x > ARENA_SIZE - pad) ai.targetAngle = Math.PI
            else if (ai.y < pad) ai.targetAngle = Math.PI / 2
            else if (ai.y > ARENA_SIZE - pad) ai.targetAngle = -Math.PI / 2
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
            explodeWormIntoPastries(ai)
          }

          // AI ăn bánh
          for (let fIdx = eng.foods.length - 1; fIdx >= 0; fIdx--) {
            const f = eng.foods[fIdx]
            const d = Math.hypot(ai.x - f.x, ai.y - f.y)
            if (d < ai.radius + f.r) {
              ai.score += f.points
              ai.length += 1
              ai.radius = Math.min(MAX_RADIUS, MIN_RADIUS + Math.floor(ai.score / 120))
              eng.foods.splice(fIdx, 1)
              eng.foods.push(createFood(eng.nextFoodId++))
            }
          }

          // Kiểm tra va chạm đầu AI với thân người chơi -> AI chết
          if (player.isAlive) {
            for (let sIdx = 4; sIdx < player.history.length; sIdx += 3) {
              const seg = player.history[sIdx]
              if (Math.hypot(ai.x - seg.x, ai.y - seg.y) < ai.radius + player.radius * 0.75) {
                ai.isAlive = false
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
              eng.foods.push(createFood(eng.nextFoodId++))
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

        // Cập nhật Bảng Xếp Hạng thời gian thực cho Vùng 3 (Throttle 400ms để giữ 60fps mượt mà trên mobile)
        const allWorms = [player, ...(eng.player2 ? [eng.player2] : []), ...eng.aiWorms]
        const sorted = [...allWorms].sort((a, b) => b.score - a.score)
        const pRank = sorted.findIndex((w) => w.id === player.id) + 1
        if (currentTime - lastHudUpdate >= 400) {
          lastHudUpdate = currentTime
          setPlayerStats({ score: Math.floor(player.score), length: player.length })
          setPlayerRank(pRank)
          setLeaderboard(
            sorted.map((w) => ({
              id: w.id,
              name: w.name,
              score: Math.floor(w.score),
              length: w.length,
              isPlayer: w.isPlayer,
              isAlive: w.isAlive,
            }))
          )
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
      // Tỷ lệ phóng to/thu nhỏ camera mượt mà theo độ dài sâu như Wormate.io (Góc nhìn rõ nét, hấp dẫn, cuốn hút)
      const isMobileScreen = w < 640 || h < 640
      const startZoom = isMobileScreen ? 0.54 : 0.72
      const minZoom = isMobileScreen ? 0.38 : 0.50
      const zoom = Math.max(minZoom, startZoom - (player.length - INITIAL_SEGMENT_COUNT) * 0.001)
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

      // Nền đấu trường Cyber Grid ngọt ngào
      ctx.fillStyle = '#080d1a'
      ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE)

      // Lưới ô vuông không gian
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      const gridSize = 60
      const startGridX = Math.floor(Math.max(0, eng.camX - (w / 2) / zoom) / gridSize) * gridSize
      const endGridX = Math.min(ARENA_SIZE, eng.camX + (w / 2) / zoom + gridSize)
      const startGridY = Math.floor(Math.max(0, eng.camY - (h / 2) / zoom) / gridSize) * gridSize
      const endGridY = Math.min(ARENA_SIZE, eng.camY + (h / 2) / zoom + gridSize)

      ctx.beginPath()
      for (let gx = startGridX; gx <= endGridX; gx += gridSize) {
        ctx.moveTo(gx, 0)
        ctx.lineTo(gx, ARENA_SIZE)
      }
      for (let gy = startGridY; gy <= endGridY; gy += gridSize) {
        ctx.moveTo(0, gy)
        ctx.lineTo(ARENA_SIZE, gy)
      }
      ctx.stroke()

      // Hàng rào neon bảo vệ đấu trường (Vẽ 2 lớp stroke thay cho shadowBlur để đạt 60fps trên mobile)
      ctx.lineWidth = 16
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE)
      ctx.lineWidth = 6
      ctx.strokeStyle = '#ef4444'
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE)

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
    if (!isLeaderboardCollapsed && dimensions.width < 640) {
      setIsLeaderboardCollapsed(true)
    }
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

      {/* VÙNG 3: BẢNG XẾP HẠNG NGƯỜI CHƠI (Pill siêu gọn khi chơi, đặt dưới nút Sảnh nổi) */}
      <div
        className={cn(
          'absolute top-14 left-3 z-10 select-none text-xs transition-opacity duration-200',
          isRunning && !isGameOver
            ? 'opacity-40 hover:opacity-100 active:opacity-100 focus-within:opacity-100'
            : 'opacity-90',
        )}
      >
        {isLeaderboardCollapsed ? (
          <button
            type="button"
            onClick={() => setIsLeaderboardCollapsed(false)}
            title="Mở bảng xếp hạng"
            className="flex items-center gap-1.5 h-6 px-2 rounded-full bg-slate-950/60 backdrop-blur-xs border border-white/10 text-amber-300 font-bold text-[10px] shadow-xs cursor-pointer hover:bg-slate-900/80 active:scale-95 transition-all pointer-events-auto"
          >
            <Trophy className="size-2.5 text-amber-400 shrink-0" />
            <span>#{playerRank}</span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-slate-200">{playerStats.score}đ</span>
            <ChevronDown className="size-2.5 text-slate-400 shrink-0" />
          </button>
        ) : (
          <div className="w-28 sm:w-34 p-1 sm:p-1.5 rounded-xl bg-slate-950/80 backdrop-blur-sm border border-white/10 shadow-lg pointer-events-auto">
            <div className="flex items-center justify-between pb-0.5 mb-0.5 border-b border-white/10">
              <div className="flex items-center gap-1 font-black text-[9px] text-amber-300 uppercase tracking-wider">
                <Trophy className="size-2.5 text-amber-400" />
                <span>Top 3</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-mono text-slate-400 bg-white/10 px-1 py-0.2 rounded-full">
                  {leaderboard.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLeaderboardCollapsed(true)}
                  title="Thu gọn"
                  className="p-0.5 text-slate-400 hover:text-white cursor-pointer rounded transition-colors"
                >
                  <ChevronUp className="size-2.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const isTop1 = index === 0
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between px-1 py-0.5 rounded text-[8px] transition-colors',
                      entry.isPlayer
                        ? 'text-brand font-bold bg-brand/10'
                        : 'text-slate-300/80 font-medium',
                      !entry.isAlive && 'opacity-30 line-through',
                    )}
                  >
                    <div className="flex items-center gap-1 truncate max-w-[68px]">
                      <span className={cn('font-mono font-black text-[8px] w-3 shrink-0', isTop1 ? 'text-amber-400' : 'text-slate-400/50')}>
                        {isTop1 ? '👑' : `#${index + 1}`}
                      </span>
                      <span className="truncate">{entry.name}</span>
                    </div>
                    <span className={cn('font-mono font-bold text-[8px] tabular-nums shrink-0', entry.isPlayer ? 'text-brand' : 'text-slate-300/80')}>
                      {entry.score}đ
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Vị trí của bạn nếu không nằm trong top 3 */}
            {playerRank > 3 && (
              <div className="mt-0.5 pt-0.5 border-t border-white/10 flex items-center justify-between px-1 py-0.5 rounded text-brand text-[8px] font-bold bg-brand/10">
                <span className="truncate max-w-[62px]">#{playerRank} Bạn</span>
                <span className="font-mono tabular-nums">{playerStats.score}đ</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HUD thông số người chơi ở đỉnh trung tâm (Thoáng đãng, không che khuất tầm nhìn) */}
      {isRunning && !isGameOver && (
        <div className="snake-hud absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-950/40 border border-white/10 text-xs shadow-none select-none pointer-events-none transition-opacity">
          {mode === 'pass_and_play' ? (
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-brand font-bold">P1: {playerStats.score}đ</span>
              <span className="text-white/20">|</span>
              <span className="text-rose-400 font-bold">P2: {player2Score}đ</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-brand">{playerStats.score}đ</span>
              <span className="text-white/30 text-[10px]">·</span>
              <span className="text-[10px] text-slate-300 font-mono">{playerStats.length} đốt</span>
            </div>
          )}
        </div>
      )}

      {/* Nút điều khiển cảm ứng Mobile: Tối ưu 2 tay cho cả màn hình Dọc và Ngang */}
      {isRunning && !isGameOver && (
        <div className="pointer-events-none absolute inset-x-4 sm:inset-x-6 bottom-7 sm:bottom-9 z-10 hidden justify-between items-end gap-3 pointer-coarse:flex pb-[env(safe-area-inset-bottom,0px)]">
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
          <div className="w-[min(460px,calc(100vw-2rem))] h-[440px] rounded-2xl border border-border-default/80 bg-slate-900 shadow-2xl p-5 flex flex-col justify-between overflow-hidden">
            {/* Header: Cố định h-10 - Chỉ tiêu đề và bộ chuyển chế độ PvE/PvP */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 h-10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {mode === 'ai' ? (
                  <CuteSnakeLogo className="size-5 shrink-0" />
                ) : (
                  <Swords className="size-5 text-sky-400 shrink-0" />
                )}
                <h2 className="text-base font-bold text-white tracking-wide truncate">
                  {mode === 'ai' ? 'Rắn Săn Mồi' : 'Đấu Trường Rắn'}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onModeChange && (
                  <div className="flex items-center p-0.5 rounded-lg border-2 border-slate-700 bg-slate-800 text-xs font-bold shrink-0">
                    <button
                      type="button"
                      disabled={isSessionLocked}
                      onClick={() => !isSessionLocked && onModeChange('ai')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer text-xs font-bold border-2',
                        mode === 'ai'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                          : 'border-transparent text-slate-300 hover:text-white',
                        isSessionLocked && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      PvE
                    </button>
                    <button
                      type="button"
                      disabled={isSessionLocked}
                      onClick={() => !isSessionLocked && onModeChange('pass_and_play')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-colors duration-150 cursor-pointer text-xs font-bold border-2',
                        mode === 'pass_and_play'
                          ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                          : 'border-transparent text-slate-300 hover:text-white',
                        isSessionLocked && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      PvP
                    </button>
                    {isSessionLocked && (
                      <span className="px-1 flex items-center" title="Đã khóa chế độ cho tới khi hủy phòng">
                        <Lock className="size-3 text-amber-400" />
                      </span>
                    )}
                  </div>
                )}

                {isSessionLocked && onHuyPhong && (
                  <button
                    type="button"
                    onClick={onHuyPhong}
                    className="h-8 px-2 rounded-lg border-2 border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-xs font-bold transition-colors duration-150 cursor-pointer"
                    title="Hủy phòng"
                  >
                    Hủy phòng
                  </button>
                )}

                {isRunning && onCloseConfig && (
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

            {/* Nội dung trung tâm: Cố định chính xác h-[270px] cho cả PvE lẫn PvP */}
            <div className="flex flex-col justify-between h-[270px] py-2 shrink-0">
              {mode === 'ai' ? (
                /* CHẾ ĐỘ PVE: 1 hàng chọn số lượng rắn (presets + stepper tối đa 50) + danh sách slot tự động thay thế */
                <>
                  <div className="grid grid-cols-4 gap-2 h-9 shrink-0">
                    {[6, 12, 24].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={isSessionLocked}
                        onClick={() => {
                          setIsCustomPve(false)
                          onPveCapacityChange?.(num)
                        }}
                        className={cn(
                          'h-9 rounded-xl border-2 text-xs font-bold transition-colors duration-150 flex items-center justify-center cursor-pointer',
                          !isPveCustomActive && pveCapacity === num
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-black'
                            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600',
                          isSessionLocked && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        <span>{num} Rắn</span>
                      </button>
                    ))}

                    {/* Card Tùy chỉnh: Khi chọn thì hiển thị stepper inline trên cùng 1 hàng h-9 (Rule 9) */}
                    {isPveCustomActive ? (
                      <div className="h-9 rounded-xl border-2 border-emerald-500 bg-emerald-500/20 text-emerald-300 flex items-center justify-between px-1">
                        <button
                          type="button"
                          disabled={isSessionLocked || pveCapacity <= 2}
                          onClick={() => onPveCapacityChange?.(Math.max(2, pveCapacity - 1))}
                          className="size-6 rounded flex items-center justify-center font-black hover:bg-emerald-500/30 text-white cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs font-mono">{pveCapacity}</span>
                        <button
                          type="button"
                          disabled={isSessionLocked || pveCapacity >= 50}
                          onClick={() => onPveCapacityChange?.(Math.min(50, pveCapacity + 1))}
                          className="size-6 rounded flex items-center justify-center font-black hover:bg-emerald-500/30 text-white cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSessionLocked}
                        onClick={() => {
                          setIsCustomPve(true)
                          if (pveCapacity === 6 || pveCapacity === 12 || pveCapacity === 24) {
                            onPveCapacityChange?.(10)
                          }
                        }}
                        className={cn(
                          'h-9 rounded-xl border-2 text-xs font-bold transition-colors duration-150 flex items-center justify-center cursor-pointer',
                          'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600',
                          isSessionLocked && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        <span>Tùy chỉnh</span>
                      </button>
                    )}
                  </div>

                  {/* Danh sách slot: Người chơi thật tự động thay thế máy khi vào */}
                  <div
                    className="grid grid-cols-2 gap-2 max-h-[190px] h-[190px] overflow-y-auto pr-0.5 content-start shrink-0"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {Array.from({ length: pveCapacity }).map((_, idx) => {
                      if (idx === 0) {
                        return (
                          <div
                            key="pve-player"
                            className="h-11 flex items-center justify-between px-3 rounded-xl border-2 border-emerald-500/40 bg-slate-800/90 text-xs shrink-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Crown className="size-3.5 text-amber-400 shrink-0" />
                              <span className="font-bold text-white truncate">Bạn</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shrink-0">
                              Sẵn sàng
                            </span>
                          </div>
                        )
                      }

                      const realMember = pvpMembersList[idx]
                      if (realMember) {
                        // Người chơi thật vào sẽ thay thế bot máy
                        return (
                          <div
                            key={realMember.id || `pve-real-${idx}`}
                            className="h-11 flex items-center justify-between px-3 rounded-xl border-2 border-emerald-500/40 bg-slate-800/90 text-xs shrink-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Users className="size-3.5 text-emerald-400 shrink-0" />
                              <span className="font-bold text-white truncate">{realMember.name}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shrink-0">
                              Sẵn sàng
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={`pve-bot-${idx}`}
                          className="h-11 flex items-center justify-between px-3 rounded-xl border-2 border-slate-700/80 bg-slate-800/60 text-xs shrink-0"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Bot className="size-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-200 truncate">Máy #{idx}</span>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-700 bg-slate-900/60 text-slate-400 shrink-0">
                            Tự động
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                /* CHẾ ĐỘ PVP: 1 hàng chọn số lượng người (presets + stepper tối đa 50) + slot thuần người chơi thật */
                <>
                  <div className="grid grid-cols-4 gap-2 h-9 shrink-0">
                    {[2, 4, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={isSessionLocked || !isHost}
                        onClick={() => {
                          setIsCustomPvp(false)
                          onPvpTargetCountChange?.(num)
                        }}
                        className={cn(
                          'h-9 rounded-xl border-2 text-xs font-bold transition-colors duration-150 flex items-center justify-center cursor-pointer',
                          !isPvpCustomActive && pvpTargetCount === num
                            ? 'border-sky-500 bg-sky-500/20 text-sky-400 font-black'
                            : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600',
                          (!isHost || isSessionLocked) && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        <span>{num} Người</span>
                      </button>
                    ))}

                    {/* Card Tùy chỉnh: Khi chọn thì hiển thị stepper inline trên cùng 1 hàng h-9 (Rule 9) */}
                    {isPvpCustomActive ? (
                      <div className="h-9 rounded-xl border-2 border-sky-500 bg-sky-500/20 text-sky-300 flex items-center justify-between px-1">
                        <button
                          type="button"
                          disabled={isSessionLocked || !isHost || pvpTargetCount <= 2}
                          onClick={() => onPvpTargetCountChange?.(Math.max(2, pvpTargetCount - 1))}
                          className="size-6 rounded flex items-center justify-center font-black hover:bg-sky-500/30 text-white cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs font-mono">{pvpTargetCount}</span>
                        <button
                          type="button"
                          disabled={isSessionLocked || !isHost || pvpTargetCount >= 50}
                          onClick={() => onPvpTargetCountChange?.(Math.min(50, pvpTargetCount + 1))}
                          className="size-6 rounded flex items-center justify-center font-black hover:bg-sky-500/30 text-white cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSessionLocked || !isHost}
                        onClick={() => {
                          setIsCustomPvp(true)
                          if (pvpTargetCount === 2 || pvpTargetCount === 4 || pvpTargetCount === 8) {
                            onPvpTargetCountChange?.(6)
                          }
                        }}
                        className={cn(
                          'h-9 rounded-xl border-2 text-xs font-bold transition-colors duration-150 flex items-center justify-center cursor-pointer',
                          'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600',
                          (!isHost || isSessionLocked) && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        <span>Tùy chỉnh</span>
                      </button>
                    )}
                  </div>

                  {/* Danh sách slot PvP: 100% người chơi thật (0 bot) */}
                  <div
                    className="grid grid-cols-2 gap-2 max-h-[190px] h-[190px] overflow-y-auto pr-0.5 content-start shrink-0"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {Array.from({ length: pvpTargetCount }).map((_, idx) => {
                      const member = pvpMembersList[idx]

                      if (member) {
                        return (
                          <div
                            key={member.id || `pvp-member-${idx}`}
                            className="h-11 flex items-center justify-between px-3 rounded-xl border-2 border-slate-700 bg-slate-800/90 text-xs shrink-0"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {member.isHost ? (
                                <Crown className="size-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <Users className="size-3.5 text-slate-400 shrink-0" />
                              )}
                              <span className="font-bold text-white truncate">{member.name}</span>
                            </div>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0',
                                member.ready
                                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                                    : 'border-amber-500/40 bg-amber-500/20 text-amber-300',
                              )}
                            >
                              {member.ready ? 'Sẵn sàng' : 'Chờ'}
                            </span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={`pvp-empty-${idx}`}
                          className="h-11 flex items-center justify-center px-3 rounded-xl border-2 border-dashed border-slate-700/70 bg-slate-800/40 text-xs font-semibold text-slate-400 shrink-0"
                        >
                          <span>Trống</span>
                        </div>
                      )
                    })}
                  </div>
                </>
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

      // Vương miện hoàng gia vàng nếu đang dẫn đầu bảng xếp hạng
      if (isLeader) {
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
function drawPastryItem(ctx: CanvasRenderingContext2D, f: FoodItem) {
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(f.rotation)

  const bobScale = 1 + Math.sin(f.pulse) * 0.05
  ctx.scale(bobScale, bobScale)

  if (f.type === 'donut') {
    // Bánh Donut rực rỡ
    ctx.beginPath()
    ctx.arc(0, 0, f.r, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.shadowColor = 'rgba(245, 158, 11, 0.4)'
    ctx.shadowBlur = 6
    ctx.fill()
    ctx.shadowColor = 'transparent'

    // Lớp kem dâu
    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.85, 0, Math.PI * 2)
    ctx.fillStyle = '#f43f5e'
    ctx.fill()

    // Lỗ bánh
    ctx.beginPath()
    ctx.arc(0, 0, f.r * 0.32, 0, Math.PI * 2)
    ctx.fillStyle = '#080d1a'
    ctx.fill()

    // Cốm bảy màu
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
    // Cupcake kem bồng bềnh
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.25, f.r * 0.75, 0, Math.PI * 2)
    ctx.fillStyle = '#fbcfe8'
    ctx.fill()

    // Quả cherry đỏ trên đỉnh
    ctx.beginPath()
    ctx.arc(0, -f.r * 0.85, f.r * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = '#e11d48'
    ctx.fill()
  } else if (f.type === 'cake') {
    // Miếng bánh kem dâu tây
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
    // Bánh quy sô-cô-la
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
  } else if (f.type === 'burger') {
    // Hamburger ngon mắt
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
  } else if (f.type === 'croissant') {
    // Bánh sừng bò Pháp vàng ươm
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
    // Kẹo xoắn ngọt ngào
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

// ── VẼ MINIMAP ──
function drawMinimap(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  eng: { player: Worm; aiWorms: Worm[]; bushes?: Bush[] }
) {
  const isMobile = viewW < 640 || viewH < 500
  const mapSize = isMobile ? 52 : 72
  const mapX = viewW - mapSize - 10
  const mapY = isMobile ? 48 : 54

  ctx.save()
  // Khung radar
  ctx.beginPath()
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 13, 26, 0.45)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 1
  ctx.fill()
  ctx.stroke()

  const scale = mapSize / ARENA_SIZE

  // Vị trí các bụi rậm trên Minimap
  if (eng.bushes) {
    eng.bushes.forEach((b) => {
      ctx.beginPath()
      ctx.arc(mapX + b.x * scale, mapY + b.y * scale, isMobile ? 1.0 : 1.5, 0, Math.PI * 2)
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

  // Vị trí người chơi (Vẽ 2 vòng để tạo hiệu ứng phát sáng nhẹ mà không dùng shadowBlur)
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
