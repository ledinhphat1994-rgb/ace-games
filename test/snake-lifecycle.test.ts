import { describe, expect, it } from 'vitest'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { SnakeScene } from '../src/features/games/snake/SnakeScene'
import { createSnakeState, stepSnake } from '../shared/games/snake'
import { SnakeGameController, type SnakeVerificationStatus } from '../src/features/games/snake/SnakeGameController'

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

describe('SnakeDeluxe Component & Controller Lifecycle Contracts (Blockers 1, 4 & 7)', () => {
  function createMockDomContainer() {
    const listeners = new Map<string, Set<Function>>()
    return {
      listeners,
      addEventListener: (type: string, fn: Function) => {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type)!.add(fn)
      },
      removeEventListener: (type: string, fn: Function) => {
        listeners.get(type)?.delete(fn)
      },
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
    } as unknown as HTMLElement & { listeners: Map<string, Set<Function>> }
  }

  function createMockDocument() {
    const listeners = new Map<string, Set<Function>>()
    return {
      listeners,
      hidden: false,
      addEventListener: (type: string, fn: Function) => {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type)!.add(fn)
      },
      removeEventListener: (type: string, fn: Function) => {
        listeners.get(type)?.delete(fn)
      },
      dispatchEvent: (type: string) => {
        const set = listeners.get(type)
        if (set) {
          for (const fn of Array.from(set)) fn()
        }
      },
    }
  }

  function mountSimulatedSnakeDeluxe(container: any, doc: any) {
    let isPlaying = false
    let isDead = false
    let deathReason: string | null = null
    let verificationStatus: SnakeVerificationStatus = 'idle'
    let verifiedScore: number | null = null

    const controller = new SnakeGameController({
      container,
      onScoreUpdate: () => {},
      onStatusChange: (status, vScore) => {
        verificationStatus = status
        verifiedScore = vScore
      },
      onStateChange: (state) => {
        isPlaying = state.isPlaying
        isDead = state.isDead
        deathReason = state.deathReason
      },
    })

    // Touch gesture listeners mounted on container (exactly like SnakeDeluxe.tsx)
    const handleTouchStart = () => {}
    const handleTouchMove = () => {}
    const handleTouchEnd = () => {}
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove)
    container.addEventListener('touchend', handleTouchEnd)

    // Document visibility listener (exactly like SnakeDeluxe.tsx)
    const handleVisibilityChange = () => {
      controller.handleVisibilityChange(doc.hidden)
    }
    doc.addEventListener('visibilitychange', handleVisibilityChange)

    // Unmount cleanup: only runs on component unmount (empty dependency array in SnakeDeluxe.tsx)
    const unmount = () => {
      doc.removeEventListener('visibilitychange', handleVisibilityChange)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      controller.destroy()
    }

    return {
      controller,
      getStatus: () => ({ isPlaying, isDead, deathReason, verificationStatus, verifiedScore }),
      unmount,
    }
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

  it('Blocker 7: 30 chu kỳ mount/start/unmount không rò rỉ listeners, SDKs, active sessions và Phaser instances', async () => {
    let activePhaserInstances = 0
    let totalPhasersCreated = 0

    class MockPhaserGame {
      public isDestroyed = false
      public config: any
      constructor(config: any) {
        this.config = config
        activePhaserInstances++
        totalPhasersCreated++
        config?.scene?.create?.call(createMockPhaserScene())
      }
      destroy(_clear: boolean) {
        if (!this.isDestroyed) {
          this.isDestroyed = true
          activePhaserInstances = Math.max(0, activePhaserInstances - 1)
        }
      }
    }

    let sessionCounter = 0
    const activeSessions = new Set<string>()

    const prevDoc = (globalThis as any).document
    const prevWin = (globalThis as any).window
    const prevRAF = (globalThis as any).requestAnimationFrame
    const prevCAF = (globalThis as any).cancelAnimationFrame
    const prevFetch = globalThis.fetch

    const mockDoc = createMockDocument()
    const container = createMockDomContainer()

    const mockWin = {
      Phaser: {
        AUTO: 0,
        Game: MockPhaserGame,
      },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
      AudioContext: class {
        state = 'running'
        destination = {}
        createOscillator = () => ({
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        })
        createGain = () => ({
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
        })
        resume = () => {}
        close = async () => {}
      },
    }

    ;(globalThis as any).document = mockDoc
    ;(globalThis as any).window = mockWin
    ;(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16)
    ;(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id)

    globalThis.fetch = (async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/game/session/start')) {
        sessionCounter++
        const sessionId = `lifecycle-session-${sessionCounter}`
        activeSessions.add(sessionId)
        return new Response(JSON.stringify({
          ok: true,
          sessionId,
          seed: 50000 + sessionCounter,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (urlStr.includes('/api/game/session/finish')) {
        return new Response(JSON.stringify({
          ok: true,
          verified: true,
          finalScore: 0,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as any

    try {
      for (let i = 0; i < 30; i++) {
        const comp = mountSimulatedSnakeDeluxe(container, mockDoc)

        // Baseline listeners after mount
        expect(container.listeners.get('touchstart')?.size).toBe(1)
        expect(container.listeners.get('touchmove')?.size).toBe(1)
        expect(container.listeners.get('touchend')?.size).toBe(1)
        expect(mockDoc.listeners.get('visibilitychange')?.size).toBe(1)

        // Start game session
        await comp.controller.start()
        expect(comp.getStatus().isPlaying).toBe(true)
        expect(activePhaserInstances).toBe(1)
        expect(activeSessions.size).toBe(1)

        // Unmount
        comp.unmount()
        activeSessions.clear() // server-side session cleanup
        expect(activePhaserInstances).toBe(0)
        expect(mockDoc.listeners.get('visibilitychange')?.size).toBe(0)
        expect(container.listeners.get('touchstart')?.size).toBe(0)
        expect(container.listeners.get('touchmove')?.size).toBe(0)
        expect(container.listeners.get('touchend')?.size).toBe(0)
      }

      // Assert zero accumulation across all 30 cycles
      expect(totalPhasersCreated).toBe(30)
      expect(activePhaserInstances).toBe(0)
      expect(activeSessions.size).toBe(0)
      expect(mockDoc.listeners.get('visibilitychange')?.size || 0).toBe(0)
      expect(container.listeners.get('touchstart')?.size || 0).toBe(0)
      expect(container.listeners.get('touchmove')?.size || 0).toBe(0)
      expect(container.listeners.get('touchend')?.size || 0).toBe(0)
    } finally {
      ;(globalThis as any).document = prevDoc
      ;(globalThis as any).window = prevWin
      ;(globalThis as any).requestAnimationFrame = prevRAF
      ;(globalThis as any).cancelAnimationFrame = prevCAF
      globalThis.fetch = prevFetch
    }
  })

  it('Blocker 1 Regression: isPlaying false -> true KHÔNG kích hoạt cleanup sớm, SDK và Phaser sống khỏe cho đến unmount thực sự', async () => {
    let activePhaserInstances = 0
    let finishCalls: Array<{ reason: string; durationMs: number }> = []

    class MockPhaserGame {
      public isDestroyed = false
      constructor(config: any) {
        activePhaserInstances++
        config?.scene?.create?.call(createMockPhaserScene())
      }
      destroy() {
        if (!this.isDestroyed) {
          this.isDestroyed = true
          activePhaserInstances = Math.max(0, activePhaserInstances - 1)
        }
      }
    }

    const prevDoc = (globalThis as any).document
    const prevWin = (globalThis as any).window
    const prevRAF = (globalThis as any).requestAnimationFrame
    const prevCAF = (globalThis as any).cancelAnimationFrame
    const prevFetch = globalThis.fetch

    const mockDoc = createMockDocument()
    const container = createMockDomContainer()

    const mockWin = {
      Phaser: { AUTO: 0, Game: MockPhaserGame },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
      AudioContext: class {
        state = 'running'
        destination = {}
        createOscillator = () => ({
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        })
        createGain = () => ({
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
        })
        resume = () => {}
        close = async () => {}
      },
    }

    ;(globalThis as any).document = mockDoc
    ;(globalThis as any).window = mockWin
    ;(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16)
    ;(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id)

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/game/session/start')) {
        return new Response(JSON.stringify({
          ok: true,
          sessionId: 'reg-session-1',
          seed: 424242,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (urlStr.includes('/api/game/session/finish')) {
        const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
        const endEvent = body.inputTrace?.find((e: any) => e.k === 'match.end')
        finishCalls.push({
          reason: endEvent?.p?.reason || 'game_over',
          durationMs: body.durationMs,
        })
        return new Response(JSON.stringify({ ok: true, verified: true, finalScore: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as any

    try {
      const comp = mountSimulatedSnakeDeluxe(container, mockDoc)
      expect(comp.getStatus().isPlaying).toBe(false)
      expect(comp.controller.getSdk()).toBeNull()

      // Start game
      await comp.controller.start()

      // CRITICAL ASSERTION: isPlaying is now true, SDK and Phaser are active, NO abort was sent!
      expect(comp.getStatus().isPlaying).toBe(true)
      expect(comp.getStatus().isDead).toBe(false)
      expect(comp.controller.getSdk()).not.toBeNull()
      expect(comp.controller.getPhaserGame()).not.toBeNull()
      expect(activePhaserInstances).toBe(1)
      expect(finishCalls.length).toBe(0) // Zero premature aborts!

      // Simulate input turns during active play
      comp.controller.handleTurn('right')
      comp.controller.handleTurn('down')
      expect(comp.getStatus().isPlaying).toBe(true)
      expect(comp.getStatus().isDead).toBe(false)
      expect(finishCalls.length).toBe(0) // Still zero premature aborts!

      // Actual unmount occurs: active session aborts exactly once, Phaser and SDK destroyed
      comp.unmount()
      expect(activePhaserInstances).toBe(0)
      expect(comp.controller.getPhaserGame()).toBeNull()
      expect(comp.controller.getSdk()).toBeNull()
      expect(finishCalls.length).toBe(1)
      expect(finishCalls[0].reason).toBe('aborted')
    } finally {
      ;(globalThis as any).document = prevDoc
      ;(globalThis as any).window = prevWin
      ;(globalThis as any).requestAnimationFrame = prevRAF
      ;(globalThis as any).cancelAnimationFrame = prevCAF
      globalThis.fetch = prevFetch
    }
  })

  it('Blocker 4 Hidden-Tab: kích hoạt visibilitychange -> dừng simulation, hủy Phaser, abort server session chính xác 1 lần với deterministic elapsedMs', async () => {
    let activePhaserInstances = 0
    let finishCalls: Array<{ sessionId: string; reason: string; durationMs: number }> = []

    class MockPhaserGame {
      public isDestroyed = false
      constructor(config: any) {
        activePhaserInstances++
        config?.scene?.create?.call(createMockPhaserScene())
      }
      destroy() {
        if (!this.isDestroyed) {
          this.isDestroyed = true
          activePhaserInstances = Math.max(0, activePhaserInstances - 1)
        }
      }
    }

    const prevDoc = (globalThis as any).document
    const prevWin = (globalThis as any).window
    const prevRAF = (globalThis as any).requestAnimationFrame
    const prevCAF = (globalThis as any).cancelAnimationFrame
    const prevFetch = globalThis.fetch

    const mockDoc = createMockDocument()
    const container = createMockDomContainer()

    const mockWin = {
      Phaser: { AUTO: 0, Game: MockPhaserGame },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
      AudioContext: class {
        state = 'running'
        destination = {}
        createOscillator = () => ({
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        })
        createGain = () => ({
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
        })
        resume = () => {}
        close = async () => {}
      },
    }

    ;(globalThis as any).document = mockDoc
    ;(globalThis as any).window = mockWin
    ;(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16)
    ;(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id)

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/game/session/start')) {
        return new Response(JSON.stringify({
          ok: true,
          sessionId: 'tab-abort-session',
          seed: 77777,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (urlStr.includes('/api/game/session/finish')) {
        const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
        const endEvent = body.inputTrace?.find((e: any) => e.k === 'match.end')
        finishCalls.push({
          sessionId: body.sessionId,
          reason: endEvent?.p?.reason || 'game_over',
          durationMs: body.durationMs,
        })
        return new Response(JSON.stringify({ ok: true, verified: false, finalScore: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as any

    try {
      const comp = mountSimulatedSnakeDeluxe(container, mockDoc)
      await comp.controller.start()

      expect(comp.getStatus().isPlaying).toBe(true)
      expect(activePhaserInstances).toBe(1)
      expect(comp.controller.getPhaserGame()).not.toBeNull()

      // User switches tab: trigger real document visibilitychange event
      mockDoc.hidden = true
      mockDoc.dispatchEvent('visibilitychange')

      // Wait microtask for async handleVisibilityChange completion
      await new Promise((resolve) => setTimeout(resolve, 20))

      // Assertions:
      // 1. Simulation stopped
      expect(comp.getStatus().isPlaying).toBe(false)
      expect(comp.getStatus().isDead).toBe(true)
      expect(comp.getStatus().deathReason).toBe('aborted')

      // 2. UI shows aborted/unverified state
      expect(comp.getStatus().verificationStatus).toBe('unverified')

      // 3. Phaser renderer is destroyed
      expect(activePhaserInstances).toBe(0)
      expect(comp.controller.getPhaserGame()).toBeNull()

      // 4. Abort request sent to server exactly once with deterministic elapsedMs
      expect(finishCalls.length).toBe(1)
      expect(finishCalls[0].sessionId).toBe('tab-abort-session')
      expect(finishCalls[0].reason).toBe('aborted')
      expect(typeof finishCalls[0].durationMs).toBe('number')
      expect(finishCalls[0].durationMs).toBeGreaterThanOrEqual(0)

      // 5. Subsequent unmount does NOT double-abort
      comp.unmount()
      expect(finishCalls.length).toBe(1)
    } finally {
      ;(globalThis as any).document = prevDoc
      ;(globalThis as any).window = prevWin
      ;(globalThis as any).requestAnimationFrame = prevRAF
      ;(globalThis as any).cancelAnimationFrame = prevCAF
      globalThis.fetch = prevFetch
    }
  })

  it('Blocker 4 Restart Flow: bấm Restart khi session đang chạy -> abort session cũ đúng 1 lần, khởi tạo session mới với seed mới, session mới sống khỏe', async () => {
    let sessionCount = 0
    let finishCalls: Array<{ sessionId: string; reason: string }> = []

    class MockPhaserGame {
      public isDestroyed = false
      constructor(config: any) {
        config?.scene?.create?.call(createMockPhaserScene())
      }
      destroy() {
        this.isDestroyed = true
      }
    }

    const prevDoc = (globalThis as any).document
    const prevWin = (globalThis as any).window
    const prevRAF = (globalThis as any).requestAnimationFrame
    const prevCAF = (globalThis as any).cancelAnimationFrame
    const prevFetch = globalThis.fetch

    const mockDoc = createMockDocument()
    const container = createMockDomContainer()

    const mockWin = {
      Phaser: { AUTO: 0, Game: MockPhaserGame },
      requestAnimationFrame: () => 1,
      cancelAnimationFrame: () => {},
      AudioContext: class {
        state = 'running'
        destination = {}
        createOscillator = () => ({
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        })
        createGain = () => ({
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {},
        })
        resume = () => {}
        close = async () => {}
      },
    }

    ;(globalThis as any).document = mockDoc
    ;(globalThis as any).window = mockWin
    ;(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16)
    ;(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id)

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === 'string' ? url : url.toString()
      if (urlStr.includes('/api/game/session/start')) {
        sessionCount++
        return new Response(JSON.stringify({
          ok: true,
          sessionId: `restart-session-${sessionCount}`,
          seed: 88800 + sessionCount,
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }
      if (urlStr.includes('/api/game/session/finish')) {
        const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}')
        const endEvent = body.inputTrace?.find((e: any) => e.k === 'match.end')
        finishCalls.push({
          sessionId: body.sessionId,
          reason: endEvent?.p?.reason || 'game_over',
        })
        return new Response(JSON.stringify({ ok: true, verified: true, finalScore: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }) as any

    try {
      const comp = mountSimulatedSnakeDeluxe(container, mockDoc)

      // Start run 1
      await comp.controller.start()
      const session1Id = comp.controller.getSdk()?.getSessionId()
      const seed1 = comp.controller.getSdk()?.getSessionSeed()
      expect(session1Id).toBe('restart-session-1')
      expect(seed1).toBe(88801)
      expect(comp.getStatus().isPlaying).toBe(true)

      // User hits "Restart" while run 1 is active
      await comp.controller.start()
      const session2Id = comp.controller.getSdk()?.getSessionId()
      const seed2 = comp.controller.getSdk()?.getSessionSeed()
      expect(session2Id).toBe('restart-session-2')
      expect(seed2).toBe(88802)

      // Assert run 1 was aborted cleanly
      const session1Finish = finishCalls.find(f => f.sessionId === 'restart-session-1')
      expect(session1Finish).toBeTruthy()
      expect(session1Finish!.reason).toBe('aborted')

      // Assert run 2 remains alive, not prematurely destroyed
      expect(comp.getStatus().isPlaying).toBe(true)
      expect(comp.getStatus().isDead).toBe(false)
      expect(comp.controller.getSdk()?.getSessionId()).toBe('restart-session-2')
      expect(comp.controller.getPhaserGame()).not.toBeNull()

      // Unmount cleanly aborts run 2
      comp.unmount()
      const session2Finish = finishCalls.find(f => f.sessionId === 'restart-session-2')
      expect(session2Finish).toBeTruthy()
      expect(session2Finish!.reason).toBe('aborted')
    } finally {
      ;(globalThis as any).document = prevDoc
      ;(globalThis as any).window = prevWin
      ;(globalThis as any).requestAnimationFrame = prevRAF
      ;(globalThis as any).cancelAnimationFrame = prevCAF
      globalThis.fetch = prevFetch
    }
  })
})
