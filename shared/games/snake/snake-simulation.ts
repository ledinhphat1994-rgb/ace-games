import type { GameInputEvent } from '../../protocol/game-sdk'
import { DEFAULT_SNAKE_CONFIG } from './snake-config'
import { SnakeRng } from './snake-rng'
import type {
  Direction,
  Position,
  SnakeConfig,
  SnakeReplayResult,
  SnakeState,
} from './snake-types'

/**
 * Spawns a food item on a deterministic unoccupied cell.
 * Returns null if no free cells remain (board full / victory).
 */
export function spawnFood(
  snake: readonly Position[],
  rng: SnakeRng,
  config: SnakeConfig = DEFAULT_SNAKE_CONFIG,
): Position | null {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const freeCells: Position[] = []

  for (let y = 0; y < config.height; y++) {
    for (let x = 0; x < config.width; x++) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y })
      }
    }
  }

  if (freeCells.length === 0) return null
  const idx = rng.nextInt(0, freeCells.length - 1)
  return freeCells[idx]
}

/**
 * Creates an initial deterministic Snake state from a seed and optional config.
 */
export function createSnakeState(
  seed: number,
  config: SnakeConfig = DEFAULT_SNAKE_CONFIG,
): { state: SnakeState; rng: SnakeRng } {
  const rng = new SnakeRng(seed)
  const initialSnake = config.initialSnake.map((p) => ({ ...p }))
  const food = spawnFood(initialSnake, rng, config) ?? { x: 0, y: 0 }

  const state: SnakeState = {
    snake: initialSnake,
    food,
    dir: config.initialDir,
    score: 0,
    foodsEaten: 0,
    isDead: false,
    isVictory: false,
    terminalReason: null,
    stepDurationMs: config.initialStepMs,
    tick: 0,
    elapsedMs: 0,
  }

  return { state, rng }
}

/**
 * Checks if a proposed direction change is legal (not a 180° reversal).
 */
export function isOppositeDirection(d1: Direction, d2: Direction): boolean {
  return (
    (d1 === 'up' && d2 === 'down') ||
    (d1 === 'down' && d2 === 'up') ||
    (d1 === 'left' && d2 === 'right') ||
    (d1 === 'right' && d2 === 'left')
  )
}

/**
 * Applies a direction to the current state if it is not a direct 180° reverse.
 * Returns true if accepted, false if rejected.
 */
export function applySnakeDirection(state: SnakeState, dir: Direction): boolean {
  if (isOppositeDirection(state.dir, dir)) {
    return false
  }
  state.dir = dir
  return true
}

/**
 * Advances the simulation by exactly one deterministic tick.
 */
export function stepSnake(
  state: SnakeState,
  rng: SnakeRng,
  config: SnakeConfig = DEFAULT_SNAKE_CONFIG,
): void {
  if (state.isDead || state.isVictory || state.terminalReason !== null) {
    return
  }

  // Capture the duration that executes THIS step before any speed progression update
  const stepDurationUsed = state.stepDurationMs

  const head = state.snake[0]
  let nx = head.x
  let ny = head.y

  switch (state.dir) {
    case 'up':
      ny -= 1
      break
    case 'down':
      ny += 1
      break
    case 'left':
      nx -= 1
      break
    case 'right':
      nx += 1
      break
  }

  // 1. Wall collision check
  if (nx < 0 || nx >= config.width || ny < 0 || ny >= config.height) {
    state.isDead = true
    state.terminalReason = 'wall_collision'
    return
  }

  // 2. Food check
  const willEat = nx === state.food.x && ny === state.food.y

  // 3. Self collision check:
  // If not eating, the tail will vacate this step, so head moving into current tail is safe.
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1)
  if (bodyToCheck.some((p) => p.x === nx && p.y === ny)) {
    state.isDead = true
    state.terminalReason = 'self_collision'
    return
  }

  // 4. Advance snake
  const newHead = { x: nx, y: ny }
  state.snake.unshift(newHead)

  if (willEat) {
    state.score += config.foodScore
    state.foodsEaten += 1

    // Speed progression: decrease step duration every speedUpInterval foods
    const speedSteps = Math.floor(state.foodsEaten / config.speedUpInterval)
    state.stepDurationMs = Math.max(
      config.minStepMs,
      config.initialStepMs - speedSteps * config.speedStepMs,
    )

    const nextFood = spawnFood(state.snake, rng, config)
    if (nextFood === null) {
      state.isVictory = true
      state.terminalReason = 'victory'
    } else {
      state.food = nextFood
    }
  } else {
    state.snake.pop()
  }

  state.tick += 1
  state.elapsedMs += stepDurationUsed
}

export function isSnakeTerminal(state: SnakeState): boolean {
  return state.isDead || state.isVictory || state.terminalReason !== null
}

export function getSnakeStepDuration(state: SnakeState): number {
  return state.stepDurationMs
}

/**
 * Deterministically replays a complete Snake session from a seed and input trace.
 *
 * Consumed identically by client and server verifier.
 */
export function replaySnakeSession(params: {
  seed: number
  inputTrace: readonly GameInputEvent[]
  maxElapsedMs?: number
  config?: SnakeConfig
}): SnakeReplayResult {
  const config = params.config ?? DEFAULT_SNAKE_CONFIG
  const { state, rng } = createSnakeState(params.seed, config)
  const inputTrace = params.inputTrace

  let eventIdx = 0
  const pendingQueue: Direction[] = []
  const MAX_PENDING = 2
  const maxElapsed = params.maxElapsedMs ?? 3_600_000 // 1 hour max simulation limit
  const MAX_TICKS = 50_000 // Maximum simulation steps safeguard

  let simTime = 0

  let hasMatchEnd = false
  let matchEndReason: string | null = null

  while (!isSnakeTerminal(state) && state.tick < MAX_TICKS && simTime < maxElapsed) {
    const nextTickTime = simTime + state.stepDurationMs

    // Process all events up to nextTickTime (strictly < nextTickTime so t = elapsed takes effect on next step)
    while (eventIdx < inputTrace.length && inputTrace[eventIdx].t < nextTickTime) {
      const event = inputTrace[eventIdx]
      eventIdx++

      if (event.k === 'match.end') {
        hasMatchEnd = true
        const payload = event.p as { reason?: string } | undefined
        matchEndReason = payload?.reason ?? 'unknown'
        if (matchEndReason === 'aborted') {
          state.terminalReason = 'aborted'
          return {
            valid: false,
            finalState: state,
            computedScore: 0,
            foodsEaten: state.foodsEaten,
            totalTicks: state.tick,
            terminalReason: 'aborted',
            reason: 'Session was marked as aborted.',
          }
        }
      } else if (event.k === 'snake.turn') {
        const dir = event.p as Direction
        if (dir === 'up' || dir === 'down' || dir === 'left' || dir === 'right') {
          if (pendingQueue.length < MAX_PENDING) {
            pendingQueue.push(dir)
          }
        }
      }
    }

    // Apply next pending direction if available
    while (pendingQueue.length > 0) {
      const nextDir = pendingQueue.shift()!
      if (applySnakeDirection(state, nextDir)) {
        break
      }
    }

    // Execute the deterministic step
    stepSnake(state, rng, config)
    simTime = nextTickTime
  }

  // Process any remaining events (e.g. match.end emitted immediately upon crash)
  while (eventIdx < inputTrace.length && inputTrace[eventIdx].t <= maxElapsed + 5000) {
    const event = inputTrace[eventIdx]
    eventIdx++
    if (event.k === 'match.end') {
      hasMatchEnd = true
      const payload = event.p as { reason?: string } | undefined
      if (payload?.reason === 'aborted') {
        state.terminalReason = 'aborted'
        return {
          valid: false,
          finalState: state,
          computedScore: 0,
          foodsEaten: state.foodsEaten,
          totalTicks: state.tick,
          terminalReason: 'aborted',
          reason: 'Phiên chơi bị hủy (aborted), không được xếp hạng xác thực.',
        }
      }
    }
  }

  // A verified run MUST have a terminal state (wall collision, self collision, or victory)
  // and must be terminated by a clean SDK match.end event.
  const isTerminal = isSnakeTerminal(state)
  const isValid = isTerminal && state.terminalReason !== 'aborted' && hasMatchEnd

  return {
    valid: isValid,
    finalState: state,
    computedScore: state.score,
    foodsEaten: state.foodsEaten,
    totalTicks: state.tick,
    terminalReason: state.terminalReason,
    reason: isValid ? undefined : 'Ván đấu chưa đạt trạng thái kết thúc hợp lệ với match.end.',
  }
}
