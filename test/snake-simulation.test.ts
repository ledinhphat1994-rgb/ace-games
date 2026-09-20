import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SNAKE_CONFIG,
  SnakeRng,
  applySnakeDirection,
  createSnakeState,
  isOppositeDirection,
  isSnakeTerminal,
  replaySnakeSession,
  spawnFood,
  stepSnake,
} from '../shared/games/snake'
import type { GameInputEvent } from '../shared/protocol/game-sdk'

describe('G1 Snake Simulation & Deterministic Core', () => {
  describe('Seeded RNG (XorShift32)', () => {
    it('sinh cùng chuỗi số với cùng seed', () => {
      const rng1 = new SnakeRng(12345)
      const rng2 = new SnakeRng(12345)

      const seq1 = Array.from({ length: 20 }, () => rng1.next())
      const seq2 = Array.from({ length: 20 }, () => rng2.next())

      expect(seq1).toEqual(seq2)
    })

    it('nextInt nằm trong khoảng [min, max] và hoàn toàn xác định', () => {
      const rng = new SnakeRng(99999)
      for (let i = 0; i < 100; i++) {
        const val = rng.nextInt(0, 14)
        expect(val).toBeGreaterThanOrEqual(0)
        expect(val).toBeLessThanOrEqual(14)
      }
    })

    it('xử lý seed = 0 an toàn (không bị treo vòng lặp xorshift)', () => {
      const rng = new SnakeRng(0)
      const val = rng.next()
      expect(val).toBeGreaterThan(0)
    })
  })

  describe('Deterministic Food Placement', () => {
    it('thức ăn không bao giờ xuất hiện trùng ô với thân rắn', () => {
      const rng = new SnakeRng(42)
      const snake = [
        { x: 7, y: 7 },
        { x: 7, y: 8 },
        { x: 7, y: 9 },
      ]

      for (let i = 0; i < 50; i++) {
        const food = spawnFood(snake, rng, DEFAULT_SNAKE_CONFIG)
        expect(food).not.toBeNull()
        expect(snake.some((p) => p.x === food!.x && p.y === food!.y)).toBe(false)
        expect(food!.x).toBeGreaterThanOrEqual(0)
        expect(food!.x).toBeLessThan(15)
        expect(food!.y).toBeGreaterThanOrEqual(0)
        expect(food!.y).toBeLessThan(15)
      }
    })
  })

  describe('Movement & Direction Reversal Prevention', () => {
    it('từ chối quay đầu 180 độ (UP <-> DOWN, LEFT <-> RIGHT)', () => {
      expect(isOppositeDirection('up', 'down')).toBe(true)
      expect(isOppositeDirection('down', 'up')).toBe(true)
      expect(isOppositeDirection('left', 'right')).toBe(true)
      expect(isOppositeDirection('right', 'left')).toBe(true)

      expect(isOppositeDirection('up', 'left')).toBe(false)
      expect(isOppositeDirection('up', 'right')).toBe(false)
      expect(isOppositeDirection('down', 'left')).toBe(false)
      expect(isOppositeDirection('down', 'right')).toBe(false)
    })

    it('applySnakeDirection từ chối đổi hướng đối nghịch', () => {
      const { state } = createSnakeState(100)
      expect(state.dir).toBe('up')

      expect(applySnakeDirection(state, 'down')).toBe(false)
      expect(state.dir).toBe('up')

      expect(applySnakeDirection(state, 'left')).toBe(true)
      expect(state.dir).toBe('left')

      expect(applySnakeDirection(state, 'right')).toBe(false)
      expect(state.dir).toBe('left')
    })
  })

  describe('Collision & Termination', () => {
    it('va chạm tường trên (y < 0)', () => {
      const { state, rng } = createSnakeState(1)
      // Initial snake head at { x: 7, y: 7 }, dir = 'up'
      // Needs 8 steps to hit y = -1 (7 -> 6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0 -> -1)
      for (let i = 0; i < 7; i++) {
        stepSnake(state, rng)
        expect(state.isDead).toBe(false)
      }
      expect(state.snake[0].y).toBe(0)

      stepSnake(state, rng) // 8th step hits wall
      expect(state.isDead).toBe(true)
      expect(state.terminalReason).toBe('wall_collision')
      expect(isSnakeTerminal(state)).toBe(true)
    })

    it('va chạm tường trái (x < 0)', () => {
      const { state, rng } = createSnakeState(1)
      applySnakeDirection(state, 'left')
      // Head at x: 7. 8 steps to hit x = -1
      for (let i = 0; i < 7; i++) {
        stepSnake(state, rng)
        expect(state.isDead).toBe(false)
      }
      expect(state.snake[0].x).toBe(0)

      stepSnake(state, rng)
      expect(state.isDead).toBe(true)
      expect(state.terminalReason).toBe('wall_collision')
    })

    it('tự va chạm vào thân (self collision)', () => {
      const { state, rng } = createSnakeState(1)
      // Manually give the snake enough length to bite itself:
      // (5,5) -> (5,4) -> (4,4) -> (4,5) -> (5,5)
      state.snake = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
      ]
      state.food = { x: 0, y: 0 } // far away
      state.dir = 'right' // head moving to (6,5) which is occupied!

      stepSnake(state, rng)
      expect(state.isDead).toBe(true)
      expect(state.terminalReason).toBe('self_collision')
    })
  })

  describe('Speed Progression & Scoring', () => {
    it('ăn mồi cộng 10 điểm và tăng độ dài thêm 1', () => {
      const { state, rng } = createSnakeState(1)
      const initialLen = state.snake.length
      state.food = { x: 7, y: 6 } // right in front of head at (7,7)

      stepSnake(state, rng)
      expect(state.score).toBe(10)
      expect(state.foodsEaten).toBe(1)
      expect(state.snake.length).toBe(initialLen + 1)
      expect(state.snake[0]).toEqual({ x: 7, y: 6 })
    })

    it('tăng tốc độ sau mỗi 5 quả mồi, giảm tối đa về 80ms', () => {
      const { state, rng } = createSnakeState(1)
      expect(state.stepDurationMs).toBe(150)

      // Simulate eating 4 foods
      state.foodsEaten = 4
      state.food = { x: 7, y: 6 }
      stepSnake(state, rng)
      expect(state.foodsEaten).toBe(5)
      expect(state.stepDurationMs).toBe(140) // 150 - 10

      // Simulate eating 10 foods
      state.foodsEaten = 9
      state.food = { x: 7, y: 5 }
      stepSnake(state, rng)
      expect(state.foodsEaten).toBe(10)
      expect(state.stepDurationMs).toBe(130)

      // Test floor at 80ms
      state.foodsEaten = 40
      state.food = { x: 7, y: 4 }
      stepSnake(state, rng)
      expect(state.stepDurationMs).toBe(80)
    })
  })

  describe('Golden Vectors & 100 Repeated Replays', () => {
    const trace1: GameInputEvent[] = [
      { t: 100, k: 'snake.turn', p: 'left' },
      { t: 400, k: 'snake.turn', p: 'up' },
      { t: 900, k: 'snake.turn', p: 'right' },
      { t: 2500, k: 'match.end', p: { reason: 'game_over' } },
    ]

    it('Golden Vector 1: Seed 1001 với trace1 tạo kết quả bất biến', () => {
      const result = replaySnakeSession({
        seed: 1001,
        inputTrace: trace1,
      })

      expect(result.valid).toBe(true)
      expect(result.terminalReason).toBe('wall_collision')
      expect(typeof result.computedScore).toBe('number')
      expect(result.totalTicks).toBeGreaterThan(0)
    })

    it('100 repeated replays với cùng seed và trace cho kết quả giống nhau 100%', () => {
      const initial = replaySnakeSession({ seed: 7777, inputTrace: trace1 })

      for (let i = 0; i < 100; i++) {
        const replay = replaySnakeSession({ seed: 7777, inputTrace: trace1 })
        expect(replay.valid).toBe(initial.valid)
        expect(replay.computedScore).toBe(initial.computedScore)
        expect(replay.foodsEaten).toBe(initial.foodsEaten)
        expect(replay.totalTicks).toBe(initial.totalTicks)
        expect(replay.terminalReason).toBe(initial.terminalReason)
        expect(replay.finalState.snake).toEqual(initial.finalState.snake)
      }
    })

    it('từ chối phiên bị hủy (match.end với reason: aborted)', () => {
      const abortTrace: GameInputEvent[] = [
        { t: 100, k: 'snake.turn', p: 'left' },
        { t: 200, k: 'match.end', p: { reason: 'aborted' } },
      ]
      const result = replaySnakeSession({ seed: 555, inputTrace: abortTrace })
      expect(result.valid).toBe(false)
      expect(result.computedScore).toBe(0)
      expect(result.terminalReason).toBe('aborted')
    })
  })
})
