import { snakeKeyAngle } from './keyboard-steering'
import { useEffect, useRef, useState, useCallback } from 'react'
import { MousePointer2, Play, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SnakeTouchControls } from './SnakeTouchControls'

const ARENA_SIZE = 2400
const INITIAL_SEGMENT_COUNT = 18
const BASE_SPEED = 3.6
const BOOST_SPEED = 7.0
const SEGMENT_SPACING = 9
const MIN_RADIUS = 15
const MAX_RADIUS = 32
const TOTAL_FOOD_COUNT = 180

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
  aiCount?: number
  isRunning: boolean
  isGameOver: boolean
  isFullscreen?: boolean
  restartKey?: number
  mode?: 'ai' | 'pass_and_play'
  playerEmote?: { emoji: string; quote: string } | null
  onScoreUpdate: (score: number, length: number) => void
  onGameOver: (winner: boolean, reason: string, finalScore?: number) => void
  onOpponentUpdate?: (name: string, score: number, length: number, isAlive: boolean) => void
  onOpponentEmote?: (emote: string, label: string) => void
  onStartGame: () => void
}

export function Wormate3DArena({
  difficulty = 'medium',
  aiCount = 6,
  isRunning,
  isGameOver,
  isFullscreen = false,
  restartKey = 0,
  mode = 'ai',
  playerEmote,
  onScoreUpdate,
  onGameOver,
  onOpponentUpdate,
  onOpponentEmote,
  onStartGame,
}: Wormate3DArenaProps) {
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
  const [player2Score, setPlayer2Score] = useState(0)
  const [playerStats, setPlayerStats] = useState({ score: 0, length: INITIAL_SEGMENT_COUNT })
  const [roundResult, setRoundResult] = useState<{ restartKey: number; winner: boolean; reason: string } | null>(null)
  const finalResult = roundResult?.restartKey === restartKey ? roundResult : null

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
    animFrame: number | null
    nextFoodId: number
  }>({
    player: null!,
    player2: null,
    aiWorms: [],
    foods: [],
    crumbs: [],
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
    let r = 13
    if (type === 'donut' || type === 'cupcake') {
      points = 15
      r = 15
    } else if (type === 'cake') {
      points = 25
      r = 17
    } else if (type === 'burger') {
      points = 30
      r = 18
    } else if (type === 'croissant') {
      points = 20
      r = 16
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
      }
    }

    // Tạo các AI Worms theo aiCount (nếu aiCount === 0 thì không spawn bot)
    const countToSpawn = aiCount !== undefined ? aiCount : (difficulty === 'hard' ? 7 : difficulty === 'medium' ? 5 : 4)
    const aiWorms: Worm[] = []

    for (let idx = 0; idx < countToSpawn; idx++) {
      const palette = COLOR_PALETTES[(idx + 2) % COLOR_PALETTES.length]
      const angle = (idx * Math.PI * 2) / Math.max(1, countToSpawn)
      const dist = 380 + Math.random() * 550
      const ax = startX + Math.cos(angle) * dist
      const ay = startY + Math.sin(angle) * dist

      const aHistory: { x: number; y: number }[] = []
      const segCount = INITIAL_SEGMENT_COUNT + Math.floor(Math.random() * 8)
      for (let s = 0; s < segCount * SEGMENT_SPACING; s++) {
        aHistory.push({ x: ax - Math.cos(angle) * s, y: ay - Math.sin(angle) * s })
      }

      aiWorms.push({
        id: `ai_${idx}`,
        name: AI_NAMES[idx % AI_NAMES.length],
        isPlayer: false,
        x: ax,
        y: ay,
        angle: angle + Math.PI,
        targetAngle: angle + Math.PI,
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

        // Bán kính nở to dần theo số điểm
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

          // Kiểm tra va chạm đầu người chơi với thân AI -> Người chơi chết!
          if (player.isAlive && ai.isAlive) {
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

        // Cập nhật Bảng Xếp Hạng thời gian thực cho Vùng 3
        const allWorms = [player, ...(eng.player2 ? [eng.player2] : []), ...eng.aiWorms]
        const sorted = [...allWorms].sort((a, b) => b.score - a.score)
        const pRank = sorted.findIndex((w) => w.id === player.id) + 1
        if (currentTime - lastHudUpdate >= 120) {
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
      // Tỷ lệ phóng to/thu nhỏ camera mượt mà theo độ dài sâu như Wormate.io
      const zoom = Math.max(0.72, 1 - (player.length - INITIAL_SEGMENT_COUNT) * 0.0022)
      ctx.translate(w / 2, h / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-eng.camX, -eng.camY)

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

      // Hàng rào neon bảo vệ đấu trường
      ctx.lineWidth = 12
      ctx.strokeStyle = '#ef4444'
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 18
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE)
      ctx.shadowColor = 'transparent'

      // Vẽ các món bánh kẹo & đồ ngọt (Pastries)
      for (const f of eng.foods) {
        f.rotation += f.rotSpeed
        f.pulse += 0.05
        drawPastryItem(ctx, f)
      }

      // Vẽ các hạt bụi bánh ngọt
      for (const cr of eng.crumbs) {
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

      // Vẽ AI Worms
      eng.aiWorms.forEach((ai) => {
        if (ai.isAlive) draw3DWorm(ctx, ai, ai.id === topWormId)
      })

      // Vẽ Người chơi 1 (Sâu 3D)
      if (player.isAlive) {
        draw3DWorm(ctx, player, player.id === topWormId)

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
        draw3DWorm(ctx, eng.player2, eng.player2.id === topWormId)
      }

      ctx.restore()

      // ── 3. VẼ RADAR / MINIMAP GÓC PHẢI DƯỚI ──
      drawMinimap(ctx, w, eng)

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
  }

  const handlePointerUp = () => {
    engineRef.current.keys.boost = false
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'snake-arena relative flex flex-col items-center justify-center w-full rounded-xl border border-border-default bg-canvas overflow-hidden select-none',
        isFullscreen
          ? 'h-full flex-1 min-h-0 border-none rounded-none'
          : 'h-[clamp(280px,calc(100dvh-16rem),640px)]'
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

      {/* VÙNG 3: BẢNG XẾP HẠNG NGƯỜI CHƠI HIỆN TẠI (Làm mờ, không cản trở góc nhìn game) */}
      <div className="absolute top-3.5 left-3.5 z-10 select-none pointer-events-none w-[min(65%,15rem)] p-1.5 sm:p-2.5 rounded-2xl bg-slate-950/45 backdrop-blur-md border border-white/10 shadow-xl text-xs transition-opacity duration-300">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 font-black text-[11px] text-amber-300 uppercase tracking-wider">
            <Trophy className="size-3.5 text-amber-400" />
            <span className="hidden sm:inline">Bảng Xếp Hạng</span><span className="sm:hidden">Top</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded-full">
            {leaderboard.length} sâu
          </span>
        </div>

        <div className="flex flex-col gap-1 max-h-48 overflow-hidden">
          {leaderboard.slice(0, 6).map((entry, index) => {
            const isTop1 = index === 0
            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center justify-between px-2 py-1 rounded-lg text-[11px] transition-colors',
                  entry.isPlayer
                    ? 'bg-brand/20 border border-brand/35 text-brand font-bold shadow-sm'
                    : 'text-slate-300 font-medium',
                  !entry.isAlive && 'opacity-40 line-through',
                )}
              >
                <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                  <span className={cn('font-mono font-black text-[10px] w-4', isTop1 ? 'text-amber-400' : 'text-slate-400')}>
                    {isTop1 ? '👑' : `#${index + 1}`}
                  </span>
                  <span className="truncate">{entry.name}</span>
                </div>
                <span className={cn('font-mono font-bold text-[10px] tabular-nums', entry.isPlayer ? 'text-brand' : 'text-slate-300')}>
                  {entry.score}đ
                </span>
              </div>
            )
          })}
        </div>

        {/* Vị trí của bạn nếu không nằm trong top 6 */}
        {playerRank > 6 && (
          <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between px-2 py-0.5 rounded-lg bg-brand/15 text-brand text-[10px] font-bold">
            <span>#{playerRank} Bạn (Sâu 3D)</span>
            <span className="font-mono">{playerStats.score}đ</span>
          </div>
        )}
      </div>

      {/* HUD thông số người chơi ở góc dưới bên trái */}
      {isRunning && !isGameOver && (
        <div className="snake-hud absolute bottom-3.5 left-3.5 z-10 flex items-center pointer-coarse:bottom-40 gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-950/65 backdrop-blur-md border border-white/10 text-xs shadow-md select-none pointer-events-none">
          <div className="flex items-center gap-1.5 text-brand font-bold">
            <span className="size-2 rounded-full bg-brand" />
            <span className="font-mono text-xs">{mode === 'pass_and_play' ? 'P1' : 'Bạn'}: {playerStats.score}đ</span>
          </div>
          {mode === 'pass_and_play' && (
            <>
              <div className="h-3 w-px bg-white/15" />
              <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                <span className="size-2 rounded-full bg-rose-400" />
                <span className="font-mono text-xs">P2: {player2Score}đ</span>
              </div>
            </>
          )}
          <div className="h-3 w-px bg-white/15 hidden sm:block" />
          <div className="text-[10px] text-slate-400 hidden sm:block">
            {mode === 'pass_and_play'
              ? 'P1: Chuột + Space | P2: Phím WASD + Shift'
              : 'Giữ Chuột hoặc phím Space để Tăng Tốc'}
          </div>
        </div>
      )}

      {isRunning && !isGameOver && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 hidden justify-between gap-2 pointer-coarse:flex">
          <div className="pointer-events-auto"><SnakeTouchControls player={1} onSteer={angle => { engineRef.current.player.targetAngle = angle }} onBoost={boost => { engineRef.current.keys.boost = boost }} /></div>
          {mode === 'pass_and_play' && <div className="pointer-events-auto"><SnakeTouchControls player={2} onSteer={angle => { if (engineRef.current.player2) engineRef.current.player2.targetAngle = angle }} onBoost={boost => { engineRef.current.keys.p2Boost = boost }} /></div>}
        </div>
      )}

      {/* Màn sẵn sàng */}
      {!isRunning && !isGameOver && (
        <button
          type="button"
          onClick={onStartGame}
          aria-label="Bắt đầu chơi Rắn Săn Mồi"
          data-testid="ran-man-san-sang"
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-3 sm:gap-6 rounded-2xl bg-slate-950/80 p-3 sm:p-6 text-center backdrop-blur-sm animate-in fade-in duration-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
        >
          <span className="relative flex items-center justify-center py-2">
            <span aria-hidden className="absolute size-36 rounded-full bg-emerald-400/30 blur-2xl motion-safe:animate-hao-quang-tho" />
            <span className="relative motion-safe:animate-troi-lo-lung drop-shadow-[0_10px_24px_rgb(0_0_0/0.55)]">
              <CuteSnakeLogo className="size-16 sm:size-24" />
            </span>
          </span>
          <span className="pt-1 text-2xl leading-[1.35] font-black tracking-[0.18em] text-emerald-300 uppercase [text-shadow:0_0_20px_rgb(52_211_153/0.55)] sm:text-3xl">
            {mode === 'pass_and_play' ? 'Rắn Săn Mồi (PvP)' : 'Rắn Săn Mồi'}
          </span>
          <span className="hidden sm:flex items-center gap-2 text-xs font-medium text-text-secondary flex-wrap justify-center">
            {mode === 'pass_and_play' ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-brand">
                  <MousePointer2 className="size-3 text-brand" />
                  P1: Chuột + Space
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-300">
                  <kbd className="font-mono text-[10px] font-bold text-rose-300">WASD</kbd>
                  P2: Phím + Shift
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  <MousePointer2 className="size-3 text-brand" />
                  Lái
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  <kbd className="font-mono text-[10px] font-bold text-amber-300">Space</kbd>
                  Tăng tốc
                </span>
              </>
            )}
          </span>

          <span className="text-sm text-text-secondary sm:hidden">Kéo cần điều khiển để lái · Giữ ⚡ để tăng tốc</span>

          {/* Nút BẮT ĐẦU to rõ, chữ đẹp, thẩm mỹ, chuyên nghiệp */}
          <div className="pt-2">
            <span
              className="inline-flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-brand hover:bg-brand-hover text-white font-black text-sm sm:text-base tracking-[0.1em] uppercase shadow-2xl shadow-emerald-500/40 ring-2 ring-white/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Play className="size-5 fill-white text-white drop-shadow animate-pulse" />
              <span>BẮT ĐẦU NGAY</span>
            </span>
          </div>
        </button>
      )}

      {/* Overlay Kết thúc ván (Game Over) */}
      {isGameOver && (
        <button
          type="button"
          onClick={onStartGame}
          aria-label="Chơi lại"
          data-testid="ran-man-ket-thuc"
          className="absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center rounded-2xl bg-slate-950/85 p-3 sm:p-6 text-center backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shadow-xl shadow-rose-500/30 mb-3">
            <div className="size-full bg-slate-950 rounded-2xl flex items-center justify-center text-3xl">
              {finalResult?.winner ? '👑' : '💥'}
            </div>
          </div>
          <h3 className="text-xl font-black uppercase text-white tracking-wider">
            {finalResult?.winner ? 'BẠN ĐẠT TOP 1' : 'BẠN THUA'}
          </h3>
          <p className="mt-1 text-xs text-rose-300 max-w-xs leading-relaxed">
            {finalResult?.reason || 'Đâm trúng đối thủ trong đấu trường!'}
          </p>

          {/* Thống kê ván */}
          <div className="grid grid-cols-2 gap-3 my-4 w-full max-w-64 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-brand">
                {playerStats.score}đ
              </span>
              <span className="text-[10px] text-text-tertiary">Điểm ngọt ngào</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-amber-300">
                {playerStats.length} đốt
              </span>
              <span className="text-[10px] text-text-tertiary">Độ dài sâu</span>
            </div>
          </div>

          {/* Nút CHƠI LẠI to rõ, chữ đẹp, thẩm mỹ, chuyên nghiệp */}
          <div className="pt-1">
            <span
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-brand hover:bg-brand-hover text-white font-black text-sm sm:text-base tracking-[0.1em] uppercase shadow-2xl shadow-emerald-500/40 ring-2 ring-white/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="size-5 text-white drop-shadow" />
              <span>CHƠI LẠI NGAY</span>
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

// ── HÀM VẼ ĐỒ HOẠ SÂU 3D WORMATE.IO ──
function draw3DWorm(ctx: CanvasRenderingContext2D, worm: Worm, isLeader: boolean = false) {
  const history = worm.history
  if (history.length < 2) return

  // Vẽ các đốt thân từ đuôi lên đầu (đầu sẽ đè lên thân)
  const totalSegments = worm.length
  for (let i = totalSegments - 1; i >= 0; i--) {
    const histIdx = Math.min(history.length - 1, i * SEGMENT_SPACING)
    const seg = history[histIdx]
    if (!seg) continue

    const isHead = i === 0
    const segRadius = isHead ? worm.radius * 1.08 : worm.radius * (0.8 + 0.2 * (1 - i / totalSegments))

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

  // Tên hiển thị trên đầu sâu
  ctx.save()
  ctx.font = 'bold 11px sans-serif'
  ctx.fillStyle = worm.isPlayer ? '#38bdf8' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(worm.name, worm.x, worm.y - worm.radius - 8)
  ctx.restore()
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
  eng: { player: Worm; aiWorms: Worm[] }
) {
  const mapSize = 68
  const mapX = viewW - mapSize - 10
  const mapY = 10

  ctx.save()
  // Khung radar
  ctx.beginPath()
  ctx.arc(mapX + mapSize / 2, mapY + mapSize / 2, mapSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(8, 13, 26, 0.75)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 1.5
  ctx.fill()
  ctx.stroke()

  const scale = mapSize / ARENA_SIZE

  // Vị trí AI
  eng.aiWorms.forEach((ai) => {
    if (ai.isAlive) {
      ctx.beginPath()
      ctx.arc(mapX + ai.x * scale, mapY + ai.y * scale, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#f97316'
      ctx.fill()
    }
  })

  // Vị trí người chơi
  if (eng.player.isAlive) {
    ctx.beginPath()
    ctx.arc(mapX + eng.player.x * scale, mapY + eng.player.y * scale, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#38bdf8'
    ctx.shadowColor = '#38bdf8'
    ctx.shadowBlur = 4
    ctx.fill()
  }

  ctx.restore()
}
