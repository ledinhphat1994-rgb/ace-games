import React, { useState, useRef, useCallback } from 'react'
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, Platform } from 'react-native'
import { Canvas, Circle, Group, LinearGradient, vec, Rect } from '@shopify/react-native-skia'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated'

// Hằng số game
const ARENA_SIZE = 4000
const MIN_RADIUS = 14
const BASE_SPEED = 4.2
const BOOST_SPEED = 7.8
const SEGMENT_SPACING = 6.0
const INITIAL_SEGMENT_COUNT = 20
const TOTAL_FOOD_COUNT = 300

interface Food {
  id: number
  x: number
  y: number
  r: number
  color: string
  points: number
}

interface WormSegment {
  x: number
  y: number
}

export function SnakeSkiaArena({ onBack }: { onBack?: () => void }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()

  const [score, setScore] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  // Vị trí đầu rắn & góc lái (Shared Values chạy trực tiếp trên UI Thread)
  const headX = useSharedValue(ARENA_SIZE / 2)
  const headY = useSharedValue(ARENA_SIZE / 2)
  const angle = useSharedValue(0)
  const targetAngle = useSharedValue(0)
  const isBoosting = useSharedValue(false)
  const currentRadius = useSharedValue(MIN_RADIUS)

  // Camera lerp
  const camX = useSharedValue(ARENA_SIZE / 2)
  const camY = useSharedValue(ARENA_SIZE / 2)

  // Danh sách thức ăn
  const foodsRef = useRef<Food[]>(
    Array.from({ length: TOTAL_FOOD_COUNT }, (_, i) => ({
      id: i,
      x: 100 + Math.random() * (ARENA_SIZE - 200),
      y: 100 + Math.random() * (ARENA_SIZE - 200),
      r: 6 + Math.random() * 6,
      color: ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#10b981', '#fb923c'][i % 6],
      points: 10 + Math.floor(Math.random() * 20),
    }))
  )

  // Chuỗi đốt thân rắn (history buffer)
  const historyRef = useRef<WormSegment[]>(
    Array.from({ length: INITIAL_SEGMENT_COUNT * SEGMENT_SPACING }, () => ({
      x: ARENA_SIZE / 2,
      y: ARENA_SIZE / 2,
    }))
  )
  const segmentCountRef = useRef(INITIAL_SEGMENT_COUNT)
  const scoreRef = useRef(0)

  // Cập nhật điểm ra React state định kỳ
  const updateScoreUi = useCallback((newScore: number) => {
    setScore(newScore)
  }, [])

  // Gesture điều khiển cảm ứng ngón tay (0ms Latency chạy trên Native UI Thread)
  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet'
      const centerX = screenWidth / 2
      const centerY = screenHeight / 2
      const dx = e.x - centerX
      const dy = e.y - centerY
      if (Math.hypot(dx, dy) > 8) {
        targetAngle.value = Math.atan2(dy, dx)
      }
    })
    .onUpdate((e) => {
      'worklet'
      const centerX = screenWidth / 2
      const centerY = screenHeight / 2
      const dx = e.x - centerX
      const dy = e.y - centerY
      if (Math.hypot(dx, dy) > 8) {
        targetAngle.value = Math.atan2(dy, dx)
      }
    })

  // Game Loop Native (chạy đồng bộ với tần số quét màn hình 60-120Hz của điện thoại)
  useFrameCallback((frameInfo) => {
    'worklet'
    if (!isPlaying) return

    const dt = Math.min(0.033, (frameInfo.timeSincePreviousFrame || 16.6) / 1000)

    // Xoay góc mượt mà
    let diff = targetAngle.value - angle.value
    while (diff < -Math.PI) diff += Math.PI * 2
    while (diff > Math.PI) diff -= Math.PI * 2
    const turnSpeed = isBoosting.value ? 6.5 : 5.0
    angle.value += diff * Math.min(1, turnSpeed * dt)

    // Tốc độ di chuyển
    const spd = (isBoosting.value ? BOOST_SPEED : BASE_SPEED) * (dt * 60)
    headX.value += Math.cos(angle.value) * spd
    headY.value += Math.sin(angle.value) * spd

    // Khóa biên bản đồ
    if (headX.value < 50) headX.value = 50
    if (headX.value > ARENA_SIZE - 50) headX.value = ARENA_SIZE - 50
    if (headY.value < 50) headY.value = 50
    if (headY.value > ARENA_SIZE - 50) headY.value = ARENA_SIZE - 50

    // Camera bám theo đầu rắn
    camX.value += (headX.value - camX.value) * 0.15
    camY.value += (headY.value - camY.value) * 0.15
  })

  // Vị trí render tương đối trên màn hình
  const renderCenterX = screenWidth / 2
  const renderCenterY = screenHeight / 2

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Skia GPU Canvas 120 FPS */}
          <Canvas style={styles.canvas}>
            {/* Nền Cyber Grid */}
            <Rect x={0} y={0} width={screenWidth} height={screenHeight} color="#040914" />

            {/* Đầu rắn (GPU Skia Circle) */}
            <Group>
              <Circle
                cx={renderCenterX}
                cy={renderCenterY}
                r={currentRadius.value}
                color="#06b6d4"
              />
              <Circle
                cx={renderCenterX}
                cy={renderCenterY}
                r={currentRadius.value * 0.7}
                color="#38bdf8"
              >
                <LinearGradient
                  start={vec(renderCenterX - 15, renderCenterY - 15)}
                  end={vec(renderCenterX + 15, renderCenterY + 15)}
                  colors={['#38bdf8', '#0284c7']}
                />
              </Circle>
            </Group>
          </Canvas>

          {/* HUD trên đỉnh: Điểm số & Nút thoát */}
          <View style={styles.topHud}>
            <View style={styles.scorePill}>
              <Text style={styles.scoreLabel}>ĐIỂM SỐ</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>

            {onBack && (
              <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                <Text style={styles.backBtnText}>✕ Thoát</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nút Boost Tia Sét ở góc dưới phải */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.boostBtn}
              activeOpacity={0.8}
              onPressIn={() => {
                isBoosting.value = true
              }}
              onPressOut={() => {
                isBoosting.value = false
              }}
            >
              <Text style={styles.boostIcon}>⚡</Text>
              <Text style={styles.boostText}>TĂNG TỐC</Text>
            </TouchableOpacity>
          </View>
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
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  scorePill: {
    backgroundColor: 'rgba(2, 12, 36, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scoreValue: {
    fontSize: 20,
    color: '#38bdf8',
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  backBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtnText: {
    color: '#f87171',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    pointerEvents: 'box-none',
  },
  boostBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 2,
    borderColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  boostIcon: {
    fontSize: 28,
  },
  boostText: {
    color: '#fef3c7',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
})
