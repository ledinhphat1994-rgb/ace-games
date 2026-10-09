import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native'
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  vec,
  Rect,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'

// ── HẰNG SỐ GAME ──
const ARENA_SIZE = 4000
const BASE_RADIUS = 15
const BASE_SPEED = 4.2
const BOOST_SPEED = 7.8
const SEGMENT_SPACING = 6.0
const INITIAL_SEGMENTS = 22
const TOTAL_FOOD_COUNT = 240

interface Food {
  id: number
  x: number
  y: number
  r: number
  color: string
  points: number
  isDeluxe?: boolean
  isHazard?: boolean
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
  history: { x: number; y: number }[]
  isAlive: boolean
}

interface Crumb {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  life: number
}

export function SnakeSkiaArena({ onBack }: { onBack?: () => void }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState('')
  const [leaderboard, setLeaderboard] = useState<{ name: string; score: number; isPlayer: boolean }[]>([])

  // Engine state lưu trong Ref để chạy 60 FPS mượt mà
  const engineRef = useRef<{
    player: Worm
    aiWorms: Worm[]
    foods: Food[]
    crumbs: Crumb[]
    camX: number
    camY: number
    isBoosting: boolean
    safeRadius: number
    animFrame: number | null
    nextFoodId: number
    lastTime: number
  }>({
    player: null!,
    aiWorms: [],
    foods: [],
    crumbs: [],
    camX: ARENA_SIZE / 2,
    camY: ARENA_SIZE / 2,
    isBoosting: false,
    safeRadius: ARENA_SIZE * 0.46,
    animFrame: null,
    nextFoodId: 1,
    lastTime: Date.now(),
  })

  // State trigger re-render Skia canvas ở 60 FPS
  const [, setFrameTick] = useState(0)

  // Khởi tạo bàn đấu
  const initGame = useCallback(() => {
    const startX = ARENA_SIZE / 2
    const startY = ARENA_SIZE / 2

    // 1. Khởi tạo mảng đốt thân người chơi
    const pHistory: { x: number; y: number }[] = []
    for (let i = 0; i < INITIAL_SEGMENTS * SEGMENT_SPACING; i++) {
      pHistory.push({ x: startX - i, y: startY })
    }

    const player: Worm = {
      id: 'player',
      name: 'Bạn (Skia GPU)',
      isPlayer: true,
      x: startX,
      y: startY,
      angle: 0,
      targetAngle: 0,
      speed: BASE_SPEED,
      radius: BASE_RADIUS,
      length: INITIAL_SEGMENTS,
      score: 0,
      color1: '#06b6d4',
      color2: '#38bdf8',
      history: pHistory,
      isAlive: true,
    }

    // 2. Khởi tạo thức ăn
    const foods: Food[] = []
    let fId = 1
    for (let i = 0; i < TOTAL_FOOD_COUNT; i++) {
      const rand = Math.random()
      const isDeluxe = rand < 0.15
      const isHazard = rand > 0.88
      foods.push({
        id: fId++,
        x: 120 + Math.random() * (ARENA_SIZE - 240),
        y: 120 + Math.random() * (ARENA_SIZE - 240),
        r: isDeluxe ? 12 : isHazard ? 8 : 7,
        color: isDeluxe
          ? '#facc15'
          : isHazard
            ? '#ec4899'
            : ['#38bdf8', '#10b981', '#fb923c', '#a855f7', '#f43f5e'][i % 5],
        points: isDeluxe ? 50 : isHazard ? -25 : 15,
        isDeluxe,
        isHazard,
      })
    }

    // 3. Khởi tạo 4 Bot AI
    const aiPalettes = [
      { c1: '#10b981', c2: '#34d399', name: 'Bot Sát Thủ' },
      { c1: '#f43f5e', c2: '#fb7185', name: 'Rắn Hỏa Long' },
      { c1: '#8b5cf6', c2: '#a78bfa', name: 'Tia Chớp Tím' },
      { c1: '#f59e0b', c2: '#fbbf24', name: 'Bé Na Chiến Thần' },
    ]
    const aiWorms: Worm[] = aiPalettes.map((p, idx) => {
      const angle = (idx * Math.PI * 2) / 4
      const dist = 600 + Math.random() * 300
      const ax = startX + Math.cos(angle) * dist
      const ay = startY + Math.sin(angle) * dist
      const aHistory: { x: number; y: number }[] = []
      for (let s = 0; s < INITIAL_SEGMENTS * SEGMENT_SPACING; s++) {
        aHistory.push({ x: ax - Math.cos(angle) * s, y: ay - Math.sin(angle) * s })
      }
      return {
        id: `ai_${idx}`,
        name: p.name,
        isPlayer: false,
        x: ax,
        y: ay,
        angle,
        targetAngle: angle,
        speed: BASE_SPEED * 0.95,
        radius: BASE_RADIUS,
        length: INITIAL_SEGMENTS + Math.floor(Math.random() * 6),
        score: 100 + idx * 80,
        color1: p.c1,
        color2: p.c2,
        history: aHistory,
        isAlive: true,
      }
    })

    engineRef.current = {
      player,
      aiWorms,
      foods,
      crumbs: [],
      camX: startX,
      camY: startY,
      isBoosting: false,
      safeRadius: ARENA_SIZE * 0.46,
      animFrame: null,
      nextFoodId: fId,
      lastTime: Date.now(),
    }

    setScore(0)
    setIsGameOver(false)
    setGameOverReason('')
  }, [])

  useEffect(() => {
    initGame()
  }, [initGame])

  // Cử chỉ cảm ứng Pan Gesture (0ms Touch Latency)
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      const eng = engineRef.current
      if (!eng.player || !eng.player.isAlive) return
      const centerX = screenWidth / 2
      const centerY = screenHeight / 2
      const dx = e.x - centerX
      const dy = e.y - centerY
      if (Math.hypot(dx, dy) > 8) {
        eng.player.targetAngle = Math.atan2(dy, dx)
      }
    })
    .onUpdate((e) => {
      const eng = engineRef.current
      if (!eng.player || !eng.player.isAlive) return
      const centerX = screenWidth / 2
      const centerY = screenHeight / 2
      const dx = e.x - centerX
      const dy = e.y - centerY
      if (Math.hypot(dx, dy) > 8) {
        eng.player.targetAngle = Math.atan2(dy, dx)
      }
    })

  // Game Loop Native (60 FPS)
  useEffect(() => {
    let active = true
    let lastHudTime = Date.now()

    const loop = () => {
      if (!active) return

      const now = Date.now()
      const dt = Math.min(0.04, (now - engineRef.current.lastTime) / 1000)
      engineRef.current.lastTime = now

      const eng = engineRef.current
      const player = eng.player

      if (player && player.isAlive) {
        // 1. Người chơi di chuyển
        player.speed = eng.isBoosting && player.score > 5 ? BOOST_SPEED : BASE_SPEED

        let diff = player.targetAngle - player.angle
        while (diff < -Math.PI) diff += Math.PI * 2
        while (diff > Math.PI) diff -= Math.PI * 2
        player.angle += diff * Math.min(1, (eng.isBoosting ? 6.2 : 4.8) * dt)

        player.x += Math.cos(player.angle) * player.speed * (dt * 60)
        player.y += Math.sin(player.angle) * player.speed * (dt * 60)

        // Khóa biên
        const margin = player.radius + 15
        if (player.x < margin) player.x = margin
        if (player.x > ARENA_SIZE - margin) player.x = ARENA_SIZE - margin
        if (player.y < margin) player.y = margin
        if (player.y > ARENA_SIZE - margin) player.y = ARENA_SIZE - margin

        // Cập nhật mảng đốt thân
        player.history.unshift({ x: player.x, y: player.y })
        const targetLen = Math.floor(player.length * SEGMENT_SPACING)
        while (player.history.length > targetLen) player.history.pop()

        // Bán kính nở to theo điểm
        player.radius = Math.min(48, BASE_RADIUS + Math.pow(Math.max(0, player.score), 0.42) * 0.8)

        // Rải bụi bánh khi tăng tốc
        if (eng.isBoosting) {
          player.score = Math.max(0, player.score - 0.1)
          if (Math.random() < 0.4 && player.history.length > 5) {
            const tail = player.history[player.history.length - 1]
            eng.crumbs.push({
              x: tail.x,
              y: tail.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              r: 3 + Math.random() * 2,
              color: player.color2,
              life: 1.0,
            })
          }
        }

        // 2. Người chơi ăn thức ăn (Fast Bounding Box)
        const pR = player.radius
        const pX = player.x
        const pY = player.y
        for (let i = eng.foods.length - 1; i >= 0; i--) {
          const f = eng.foods[i]
          const maxD = pR + f.r
          if (Math.abs(pX - f.x) > maxD || Math.abs(pY - f.y) > maxD) continue
          const dx = pX - f.x
          const dy = pY - f.y
          if (dx * dx + dy * dy < maxD * maxD) {
            player.score = Math.max(0, player.score + f.points)
            if (f.isHazard) {
              player.length = Math.max(12, player.length - 2)
            } else if (f.isDeluxe) {
              player.length += 4
            } else {
              player.length += 1
            }

            // Hạt bụi bánh ngọt bung tỏa
            for (let c = 0; c < (f.isDeluxe ? 12 : 6); c++) {
              eng.crumbs.push({
                x: f.x,
                y: f.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                r: 2.5 + Math.random() * 3,
                color: f.color,
                life: 1.0,
              })
            }

            // Sinh thức ăn mới
            eng.foods.splice(i, 1)
            eng.foods.push({
              id: eng.nextFoodId++,
              x: 120 + Math.random() * (ARENA_SIZE - 240),
              y: 120 + Math.random() * (ARENA_SIZE - 240),
              r: Math.random() < 0.15 ? 12 : 7,
              color: ['#38bdf8', '#10b981', '#fb923c', '#a855f7', '#f43f5e'][Math.floor(Math.random() * 5)],
              points: 15,
            })
          }
        }

        // 3. Bot AI di chuyển và ăn bánh
        eng.aiWorms.forEach((ai) => {
          if (!ai.isAlive) return

          // Đổi hướng ngẫu nhiên hoặc bơi về thức ăn gần
          if (Math.random() < 0.03) {
            ai.targetAngle += (Math.random() - 0.5) * 1.6
          }

          let aiDiff = ai.targetAngle - ai.angle
          while (aiDiff < -Math.PI) aiDiff += Math.PI * 2
          while (aiDiff > Math.PI) aiDiff -= Math.PI * 2
          ai.angle += aiDiff * Math.min(1, 4.0 * dt)

          ai.x += Math.cos(ai.angle) * ai.speed * (dt * 60)
          ai.y += Math.sin(ai.angle) * ai.speed * (dt * 60)

          if (ai.x < 50 || ai.x > ARENA_SIZE - 50 || ai.y < 50 || ai.y > ARENA_SIZE - 50) {
            ai.targetAngle = Math.atan2(ARENA_SIZE / 2 - ai.y, ARENA_SIZE / 2 - ai.x)
          }

          ai.history.unshift({ x: ai.x, y: ai.y })
          const aiLen = Math.floor(ai.length * SEGMENT_SPACING)
          while (ai.history.length > aiLen) ai.history.pop()

          // Kiểm tra đầu AI đâm vào thân người chơi -> AI chết, nổ bánh
          for (let sIdx = 4; sIdx < player.history.length; sIdx += 3) {
            const seg = player.history[sIdx]
            if (Math.hypot(ai.x - seg.x, ai.y - seg.y) < ai.radius + player.radius * 0.75) {
              ai.isAlive = false
              // Thả 16 bánh ngọt
              for (let b = 0; b < 16; b++) {
                const p = ai.history[Math.floor((b / 16) * ai.history.length)] || ai
                eng.foods.push({
                  id: eng.nextFoodId++,
                  x: p.x + (Math.random() - 0.5) * 30,
                  y: p.y + (Math.random() - 0.5) * 30,
                  r: 10,
                  color: '#facc15',
                  points: 35,
                  isDeluxe: true,
                })
              }
              break
            }
          }

          // Kiểm tra đầu người chơi đâm vào thân AI -> Người chơi thua
          if (ai.isAlive) {
            for (let sIdx = 4; sIdx < ai.history.length; sIdx += 3) {
              const seg = ai.history[sIdx]
              if (Math.hypot(player.x - seg.x, player.y - seg.y) < player.radius + ai.radius * 0.75) {
                player.isAlive = false
                setIsGameOver(true)
                setGameOverReason(`Bạn đã va chạm với ${ai.name}!`)
                break
              }
            }
          }
        })

        // 4. Camera lerp theo đầu người chơi
        eng.camX += (player.x - eng.camX) * 0.14
        eng.camY += (player.y - eng.camY) * 0.14

        // 5. Cập nhật hạt bụi bánh
        for (let pIdx = eng.crumbs.length - 1; pIdx >= 0; pIdx--) {
          const c = eng.crumbs[pIdx]
          c.x += c.vx
          c.y += c.vy
          c.life -= 0.03
          if (c.life <= 0) eng.crumbs.splice(pIdx, 1)
        }

        // Cập nhật điểm và bảng xếp hạng ra React mỗi 350ms
        if (now - lastHudTime > 350) {
          lastHudTime = now
          setScore(Math.floor(player.score))

          const allWorms = [player, ...eng.aiWorms]
            .map((w) => ({ name: w.name, score: Math.floor(w.score), isPlayer: w.isPlayer }))
            .sort((a, b) => b.score - a.score)
          setLeaderboard(allWorms.slice(0, 5))
        }
      }

      // Kích hoạt render Skia frame kế tiếp
      setFrameTick((t) => t + 1)
      requestAnimationFrame(loop)
    }

    const af = requestAnimationFrame(loop)
    return () => {
      active = false
      cancelAnimationFrame(af)
    }
  }, [])

  const eng = engineRef.current
  const player = eng.player

  // Viewport bounds để culling
  const halfW = screenWidth / 2
  const halfH = screenHeight / 2
  const cX = eng.camX
  const cY = eng.camY

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Skia GPU Canvas 60-120 FPS */}
          <Canvas style={styles.canvas}>
            {/* 1. Nền không gian Cyber Grid */}
            <Rect x={0} y={0} width={screenWidth} height={screenHeight} color="#030816" />

            {/* 2. Thức ăn bánh kẹo (Viewport Culling) */}
            {eng.foods.map((f) => {
              const scrX = f.x - cX + halfW
              const scrY = f.y - cY + halfH
              if (scrX < -30 || scrX > screenWidth + 30 || scrY < -30 || scrY > screenHeight + 30) {
                return null
              }
              return (
                <Group key={f.id}>
                  {f.isDeluxe && (
                    <Circle cx={scrX} cy={scrY} r={f.r * 1.5} color="rgba(250, 204, 21, 0.25)" />
                  )}
                  <Circle cx={scrX} cy={scrY} r={f.r} color={f.color} />
                  <Circle cx={scrX - 2} cy={scrY - 2} r={f.r * 0.35} color="rgba(255, 255, 255, 0.7)" />
                </Group>
              )
            })}

            {/* 3. Bụi vụn bánh ngọt */}
            {eng.crumbs.map((c, idx) => {
              const scrX = c.x - cX + halfW
              const scrY = c.y - cY + halfH
              if (scrX < -10 || scrX > screenWidth + 10 || scrY < -10 || scrY > screenHeight + 10) {
                return null
              }
              return (
                <Circle
                  key={idx}
                  cx={scrX}
                  cy={scrY}
                  r={c.r * c.life}
                  color={c.color}
                  opacity={c.life}
                />
              )
            })}

            {/* 4. Thân và đầu của các Bot AI */}
            {eng.aiWorms.map((ai) => {
              if (!ai.isAlive) return null
              const step = Math.max(3, Math.floor(SEGMENT_SPACING))
              const segs: { x: number; y: number; r: number }[] = []
              for (let i = ai.history.length - 1; i >= 0; i -= step) {
                const seg = ai.history[i]
                const factor = 1 - (i / ai.history.length) * 0.4
                segs.push({
                  x: seg.x - cX + halfW,
                  y: seg.y - cY + halfH,
                  r: ai.radius * factor,
                })
              }
              const headScrX = ai.x - cX + halfW
              const headScrY = ai.y - cY + halfH
              return (
                <Group key={ai.id}>
                  {segs.map((s, sIdx) => (
                    <Circle key={sIdx} cx={s.x} cy={s.y} r={s.r} color={ai.color2} />
                  ))}
                  <Circle cx={headScrX} cy={headScrY} r={ai.radius} color={ai.color1} />
                </Group>
              )
            })}

            {/* 5. Thân và đầu của Người chơi (Skia Multi-segment GPU) */}
            {player && player.isAlive && (
              <Group>
                {/* Các đốt thân uốn lượn */}
                {(() => {
                  const step = Math.max(3, Math.floor(SEGMENT_SPACING))
                  const segs = []
                  for (let i = player.history.length - 1; i >= 0; i -= step) {
                    const p = player.history[i]
                    const scrX = p.x - cX + halfW
                    const scrY = p.y - cY + halfH
                    const factor = 1 - (i / player.history.length) * 0.35
                    const r = player.radius * factor
                    const isEven = (i / step) % 2 === 0
                    segs.push(
                      <Circle
                        key={i}
                        cx={scrX}
                        cy={scrY}
                        r={r}
                        color={isEven ? player.color1 : player.color2}
                      />
                    )
                  }
                  return segs
                })()}

                {/* Đầu rắn người chơi */}
                <Circle cx={halfW} cy={halfH} r={player.radius} color={player.color1} />
                <Circle cx={halfW} cy={halfH} r={player.radius * 0.72} color={player.color2}>
                  <LinearGradient
                    start={vec(halfW - 15, halfH - 15)}
                    end={vec(halfW + 15, halfH + 15)}
                    colors={['#38bdf8', '#0284c7']}
                  />
                </Circle>

                {/* Mắt to phong cách hoạt hình (Cute Eyes) */}
                {(() => {
                  const eyeOffset = player.radius * 0.45
                  const eyeForward = player.radius * 0.4
                  const e1x = halfW + Math.cos(player.angle) * eyeForward + Math.cos(player.angle - Math.PI / 2) * eyeOffset
                  const e1y = halfH + Math.sin(player.angle) * eyeForward + Math.sin(player.angle - Math.PI / 2) * eyeOffset
                  const e2x = halfW + Math.cos(player.angle) * eyeForward + Math.cos(player.angle + Math.PI / 2) * eyeOffset
                  const e2y = halfH + Math.sin(player.angle) * eyeForward + Math.sin(player.angle + Math.PI / 2) * eyeOffset
                  const eyeR = player.radius * 0.28
                  const pupilR = eyeR * 0.55
                  return (
                    <Group>
                      {/* Tròng trắng */}
                      <Circle cx={e1x} cy={e1y} r={eyeR} color="#ffffff" />
                      <Circle cx={e2x} cy={e2y} r={eyeR} color="#ffffff" />
                      {/* Con ngươi đen */}
                      <Circle
                        cx={e1x + Math.cos(player.angle) * (eyeR * 0.3)}
                        cy={e1y + Math.sin(player.angle) * (eyeR * 0.3)}
                        r={pupilR}
                        color="#0f172a"
                      />
                      <Circle
                        cx={e2x + Math.cos(player.angle) * (eyeR * 0.3)}
                        cy={e2y + Math.sin(player.angle) * (eyeR * 0.3)}
                        r={pupilR}
                        color="#0f172a"
                      />
                    </Group>
                  )
                })()}
              </Group>
            )}
          </Canvas>

          {/* ── HUD TRÊN ĐỈNH ── */}
          <View style={styles.topHud}>
            {/* Điểm số */}
            <View style={styles.scorePill}>
              <Text style={styles.scoreLabel}>ĐIỂM</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>

            {/* Bảng Xếp Hạng TOP 5 Mini */}
            <View style={styles.leaderboardBox}>
              <Text style={styles.lbTitle}>👑 TOP BẢNG ĐẤU</Text>
              {leaderboard.map((item, idx) => (
                <View key={idx} style={styles.lbRow}>
                  <Text
                    style={[styles.lbName, item.isPlayer && styles.lbNamePlayer]}
                    numberOfLines={1}
                  >
                    #{idx + 1} {item.name}
                  </Text>
                  <Text style={[styles.lbScore, item.isPlayer && styles.lbScorePlayer]}>
                    {item.score}đ
                  </Text>
                </View>
              ))}
            </View>

            {/* Nút thoát */}
            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── NÚT TĂNG TỐC TIA SÉT GÓC PHẢI DƯỚI ── */}
          {!isGameOver && (
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.boostBtn}
                activeOpacity={0.8}
                onPressIn={() => {
                  engineRef.current.isBoosting = true
                }}
                onPressOut={() => {
                  engineRef.current.isBoosting = false
                }}
              >
                <Text style={styles.boostIcon}>⚡</Text>
                <Text style={styles.boostText}>TĂNG TỐC</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── MODAL GAME OVER ── */}
          {isGameOver && (
            <View style={styles.gameOverOverlay}>
              <View style={styles.gameOverCard}>
                <Text style={styles.gameOverTitle}>KẾT THÚC VÁN ĐẤU</Text>
                <Text style={styles.gameOverReason}>{gameOverReason || 'Rắn đã dừng bước!'}</Text>
                <View style={styles.finalScoreBox}>
                  <Text style={styles.finalScoreLabel}>ĐIỂM SỐ ĐẠT ĐƯỢC</Text>
                  <Text style={styles.finalScoreValue}>{score} ĐIỂM</Text>
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.restartBtn} onPress={initGame}>
                    <Text style={styles.restartBtnText}>🔄 CHƠI LẠI NGAY</Text>
                  </TouchableOpacity>

                  {onBack && (
                    <TouchableOpacity style={styles.leaveBtn} onPress={onBack}>
                      <Text style={styles.leaveBtnText}>QUAY LẠI SẢNH</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c24',
  },
  canvas: {
    flex: 1,
  },
  topHud: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 34,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    pointerEvents: 'box-none',
  },
  scorePill: {
    backgroundColor: 'rgba(2, 12, 36, 0.88)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 22,
    color: '#38bdf8',
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  leaderboardBox: {
    backgroundColor: 'rgba(2, 12, 36, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 8,
    minWidth: 125,
  },
  lbTitle: {
    color: '#facc15',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  lbRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 1,
  },
  lbName: {
    color: '#94a3b8',
    fontSize: 10,
    maxWidth: 80,
  },
  lbNamePlayer: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  lbScore: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  lbScorePlayer: {
    color: '#38bdf8',
  },
  backBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 14,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 34,
    right: 24,
    pointerEvents: 'box-none',
  },
  boostBtn: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  boostIcon: {
    fontSize: 26,
  },
  boostText: {
    color: '#fef3c7',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  gameOverCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#071330',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gameOverReason: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  finalScoreBox: {
    backgroundColor: 'rgba(2, 12, 36, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  finalScoreLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  finalScoreValue: {
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  modalActionRow: {
    width: '100%',
    gap: 10,
  },
  restartBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  restartBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  leaveBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
})
