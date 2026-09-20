import { describe, expect, it } from 'vitest'
import { SnakeScene } from '../src/features/games/snake/SnakeScene'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { replaySnakeSession, type SnakeConfig, DEFAULT_SNAKE_CONFIG } from '../shared/games/snake'

function createMockContainer(): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    requestFullscreen: async () => {},
  } as unknown as HTMLElement
}

function createMockPhaserScene() {
  return {
    cameras: { main: { width: 400, height: 400 } },
    add: {
      graphics: () => ({
        clear: () => {},
        fillStyle: () => {},
        fillRect: () => {},
        fillCircle: () => {},
        fillRoundedRect: () => {},
        lineStyle: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        strokePath: () => {},
        strokeRect: () => {},
        destroy: () => {},
      }),
    },
    input: {
      keyboard: {
        on: () => {},
      },
    },
    time: {
      addEvent: (config: { delay: number; callback: () => void; loop: boolean }) => ({
        destroy: () => {},
        callback: config.callback,
      }),
    },
  }
}

describe('G1 Snake Client / Server Parity & Determinism Suite', () => {
  it('1. Normal Turn: Client và Server replay hội tụ 100%', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    const scene = new SnakeScene({
      seed: 1234,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: () => {},
    })
    scene.init(createMockPhaserScene())

    // Queue turn left
    scene.queueTurn('left')
    // Advance tick
    ;(scene as unknown as { tick: () => void }).tick()

    const clientState = scene.getState()
    expect(clientState.dir).toBe('left')

    // End run
    sdk.end('game_over', clientState.score, clientState.elapsedMs)

    // Server replay matching exact simulation duration
    const replay = replaySnakeSession({
      seed: 1234,
      inputTrace: sdk.getRecordedInputs(),
      maxElapsedMs: clientState.elapsedMs,
    })

    expect(replay.finalState.dir).toBe(clientState.dir)
    expect(replay.finalState.snake[0]).toEqual(clientState.snake[0])
    expect(replay.finalState.elapsedMs).toBe(clientState.elapsedMs)
    expect(replay.computedScore).toBe(clientState.score)
  })

  it('2. Immediate Reverse: UP -> DOWN bị từ chối đồng thời ở Client và Server', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    const scene = new SnakeScene({
      seed: 5555,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: () => {},
    })
    scene.init(createMockPhaserScene())

    // Moving UP initially; try immediate 180° reverse to DOWN
    scene.queueTurn('down')
    ;(scene as unknown as { tick: () => void }).tick()

    const clientState = scene.getState()
    // Must remain UP (not down!)
    expect(clientState.dir).toBe('up')

    sdk.end('game_over', clientState.score, clientState.elapsedMs)

    // Replay on server matching exact simulation duration
    const replay = replaySnakeSession({
      seed: 5555,
      inputTrace: sdk.getRecordedInputs(),
      maxElapsedMs: clientState.elapsedMs,
    })

    expect(replay.finalState.dir).toBe('up')
    expect(replay.finalState.snake[0]).toEqual(clientState.snake[0])
  })

  it('3. Two Quick Queued Turns: UP -> RIGHT -> DOWN đệm hợp lệ và replay chính xác', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    const scene = new SnakeScene({
      seed: 7777,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: () => {},
    })
    scene.init(createMockPhaserScene())

    // Moving UP initially; queue RIGHT then DOWN rapidly before next tick
    scene.queueTurn('right')
    scene.queueTurn('down')

    // Tick 1: applies RIGHT
    ;(scene as unknown as { tick: () => void }).tick()
    expect(scene.getState().dir).toBe('right')

    // Tick 2: applies DOWN
    ;(scene as unknown as { tick: () => void }).tick()
    expect(scene.getState().dir).toBe('down')

    const clientState = scene.getState()
    sdk.end('game_over', clientState.score, clientState.elapsedMs)

    const replay = replaySnakeSession({
      seed: 7777,
      inputTrace: sdk.getRecordedInputs(),
      maxElapsedMs: clientState.elapsedMs,
    })

    expect(replay.finalState.dir).toBe('down')
    expect(replay.finalState.snake[0]).toEqual(clientState.snake[0])
    expect(replay.finalState.elapsedMs).toBe(clientState.elapsedMs)
  })

  it('4. Food Eaten & Growth: Điểm số, độ dài rắn và mồi tiếp theo đồng nhất', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    const scene = new SnakeScene({
      seed: 8888,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: () => {},
    })
    scene.init(createMockPhaserScene())

    // Place food directly in path of snake head
    const mutableState = (scene as unknown as { state: { food: { x: number; y: number } } }).state
    mutableState.food = { x: 7, y: 6 } // 1 step up from {7, 7}

    ;(scene as unknown as { tick: () => void }).tick()

    const clientState = scene.getState()
    expect(clientState.score).toBe(10)
    expect(clientState.foodsEaten).toBe(1)
    expect(clientState.snake.length).toBe(4) // Grew from 3 to 4
  })

  it('5. Speed Threshold Transition: Qua 5 mồi, tốc độ đổi 150ms -> 140ms đồng nhất', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    const scene = new SnakeScene({
      seed: 9999,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: () => {},
    })
    scene.init(createMockPhaserScene())

    // Set foods eaten to 4
    const mutableState = (scene as unknown as {
      state: {
        foodsEaten: number
        stepDurationMs: number
        food: { x: number; y: number }
      }
    }).state
    mutableState.foodsEaten = 4
    mutableState.stepDurationMs = 150
    mutableState.food = { x: 7, y: 6 }

    ;(scene as unknown as { tick: () => void }).tick()

    const clientState = scene.getState()
    expect(clientState.foodsEaten).toBe(5)
    expect(clientState.stepDurationMs).toBe(140)
    expect(clientState.elapsedMs).toBe(150) // Step duration used was 150ms
  })

  it('6. Wall Collision: Va chạm tường kết thúc ván đấu và replay xác thực hợp lệ', () => {
    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    let gameOverCalled = false
    let finalReason = ''

    const scene = new SnakeScene({
      seed: 3333,
      sdk,
      onScoreUpdate: () => {},
      onGameOver: (_score, reason) => {
        gameOverCalled = true
        finalReason = reason
      },
    })
    scene.init(createMockPhaserScene())

    // Drive UP 8 steps to hit top wall y = -1
    for (let i = 0; i < 8; i++) {
      ;(scene as unknown as { tick: () => void }).tick()
    }

    expect(gameOverCalled).toBe(true)
    expect(finalReason).toBe('wall_collision')
    expect(scene.getState().isDead).toBe(true)

    // Simulate SDK end
    sdk.end('game_over', scene.getState().score, scene.getState().elapsedMs)

    const replay = replaySnakeSession({
      seed: 3333,
      inputTrace: sdk.getRecordedInputs(),
    })

    expect(replay.valid).toBe(true)
    expect(replay.terminalReason).toBe('wall_collision')
    expect(replay.totalTicks).toBe(scene.getState().tick)
    expect(replay.computedScore).toBe(scene.getState().score)
  })

  it('7. Self Collision: Tự cắn đuôi được phát hiện chính xác và replay trùng khớp', () => {
    const customConfig: SnakeConfig = {
      ...DEFAULT_SNAKE_CONFIG,
      // Create a snake that can bite itself in 4 turns:
      // Head at (5, 5), body at (5, 6), (6, 6), (6, 5), (6, 4)
      initialSnake: [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
        { x: 6, y: 4 },
      ],
      initialDir: 'up',
    }

    const container = createMockContainer()
    const sdk = new CampusGameSDK({ container, gameType: 'solo_snake', mode: 'solo' })
    let gameOverReason = ''

    const scene = new SnakeScene({
      seed: 4444,
      sdk,
      config: customConfig,
      onScoreUpdate: () => {},
      onGameOver: (_score, reason) => {
        gameOverReason = reason
      },
    })
    scene.init(createMockPhaserScene())

    // Head is at (5, 5), moving up. Turn RIGHT to (6, 5), which contains body segment!
    scene.queueTurn('right')
    ;(scene as unknown as { tick: () => void }).tick()

    expect(gameOverReason).toBe('self_collision')
    expect(scene.getState().isDead).toBe(true)

    sdk.end('game_over', scene.getState().score, scene.getState().elapsedMs)

    const replay = replaySnakeSession({
      seed: 4444,
      inputTrace: sdk.getRecordedInputs(),
      config: customConfig,
    })

    expect(replay.valid).toBe(true)
    expect(replay.terminalReason).toBe('self_collision')
  })
})
