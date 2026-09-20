import { describe, expect, it } from 'vitest'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { SnakeScene } from '../src/features/games/snake/SnakeScene'
import { createSnakeState, stepSnake } from '../shared/games/snake'

describe('G1 Snake Lifecycle & Adaptive Quality Contracts', () => {
  it('100 chu kỳ khởi tạo và hủy (mount/destroy) đo lường chính xác không rò rỉ listeners, timers và observers', () => {
    const dummyContainer = {
      getBoundingClientRect: () => ({
        width: 800,
        height: 600,
        top: 0,
        left: 0,
        bottom: 600,
        right: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
      requestFullscreen: async () => {},
    } as unknown as HTMLElement

    const activeListeners = new Map<string, Set<Function>>()
    let activeRafs = 0
    let activeObservers = 0
    let audioContextsCreated = 0
    let audioContextsClosed = 0

    const mockDocument = {
      addEventListener: (type: string, listener: any) => {
        if (!activeListeners.has(type)) activeListeners.set(type, new Set())
        activeListeners.get(type)!.add(listener)
      },
      removeEventListener: (type: string, listener: any) => {
        if (activeListeners.has(type)) activeListeners.get(type)!.delete(listener)
      },
    }

    const mockWindow = {
      requestAnimationFrame: (_cb: any) => {
        activeRafs++
        return activeRafs
      },
      cancelAnimationFrame: (_id: number) => {
        activeRafs = Math.max(0, activeRafs - 1)
      },
      AudioContext: class MockAudioContext {
        state = 'running'
        currentTime = 0
        destination = {}
        constructor() {
          audioContextsCreated++
        }
        createOscillator() {
          return {
            type: 'sine',
            frequency: { setValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {},
          }
        }
        createGain() {
          return {
            gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
          }
        }
        resume() {}
        async close() {
          audioContextsClosed++
        }
      },
    }

    class MockResizeObserver {
      observe() {
        activeObservers++
      }
      disconnect() {
        activeObservers = Math.max(0, activeObservers - 1)
      }
      unobserve() {}
    }

    const prevDoc = (globalThis as any).document
    const prevWin = (globalThis as any).window
    const prevRO = (globalThis as any).ResizeObserver

    ;(globalThis as any).document = mockDocument
    ;(globalThis as any).window = mockWindow
    ;(globalThis as any).ResizeObserver = MockResizeObserver

    try {
      // Run 100 mount/destroy cycles
      for (let i = 0; i < 100; i++) {
        const sdk = new CampusGameSDK({
          container: dummyContainer,
          gameType: 'solo_snake',
          mode: 'solo',
        })

        const scene = new SnakeScene({
          seed: 1000 + i,
          sdk,
          onScoreUpdate: () => {},
          onGameOver: () => {},
        })

        // Simulate partial interaction
        scene.queueTurn('left')

        // Assert listeners are active during session
        expect(activeListeners.get('visibilitychange')?.size).toBe(1)
        expect(activeListeners.get('fullscreenchange')?.size).toBe(1)

        // Destroy
        scene.destroy()
        sdk.destroy()

        // Assert listeners return to zero baseline immediately after destroy
        expect(activeListeners.get('visibilitychange')?.size).toBe(0)
        expect(activeListeners.get('fullscreenchange')?.size).toBe(0)

        // Assert internal references are cleared
        expect((scene as any).isDestroyed).toBe(true)
        expect((scene as any).timerEvent).toBeNull()
        expect((scene as any).graphics).toBeNull()
        expect((scene as any).audioCtx).toBeNull()
      }

      // After 100 cycles:
      // 1. All document event listeners returned to baseline 0
      expect(activeListeners.get('visibilitychange')?.size).toBe(0)
      expect(activeListeners.get('fullscreenchange')?.size).toBe(0)
      expect(activeObservers).toBe(0)
      expect(activeRafs).toBe(0)

      // 2. All AudioContext instances were closed
      expect(audioContextsCreated).toBe(100)
      expect(audioContextsClosed).toBe(100)
    } finally {
      ;(globalThis as any).document = prevDoc
      ;(globalThis as any).window = prevWin
      ;(globalThis as any).ResizeObserver = prevRO
    }
  })

  it('chuyển đổi chất lượng đồ họa (adaptive quality) không làm thay đổi trạng thái simulation', () => {
    const { state: stateHigh, rng: rngHigh } = createSnakeState(42)
    const { state: stateLow, rng: rngLow } = createSnakeState(42)

    // Simulate 20 identical steps
    for (let i = 0; i < 20; i++) {
      stepSnake(stateHigh, rngHigh)
      stepSnake(stateLow, rngLow)

      expect(stateHigh.snake).toEqual(stateLow.snake)
      expect(stateHigh.food).toEqual(stateLow.food)
      expect(stateHigh.score).toBe(stateLow.score)
      expect(stateHigh.isDead).toBe(stateLow.isDead)
      expect(stateHigh.stepDurationMs).toBe(stateLow.stepDurationMs)
    }
  })
})
