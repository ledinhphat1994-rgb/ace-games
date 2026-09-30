import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SnakeGameController } from '../src/features/games/snake/SnakeGameController'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { GameEngineLoader } from '../src/lib/game-loader/engine-loader'

const games: Array<{ destroy: ReturnType<typeof vi.fn>; config: { width: number; height: number } }> = []
const container = { getBoundingClientRect: () => ({ width: 276, height: 276 }) } as unknown as HTMLElement

beforeEach(() => {
  games.length = 0
  vi.stubGlobal('window', { devicePixelRatio: 1 })
  vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn(), fullscreenElement: null })
  vi.stubGlobal('ResizeObserver', undefined)
  vi.spyOn(CampusGameSDK.prototype, 'start').mockResolvedValue(undefined)
  vi.spyOn(GameEngineLoader, 'loadPhaser').mockResolvedValue({
    AUTO: 0,
    Game: class {
      destroy = vi.fn()
      config: { width: number; height: number }
      constructor(config: { width: number; height: number }) { this.config = config; games.push(this) }
    },
  })
})

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('Snake mobile startup and resizing', () => {
  it('a late response from an earlier start cannot mount a second game or overwrite loading state', async () => {
    let resolveEarlier!: () => void
    vi.mocked(CampusGameSDK.prototype.start).mockImplementationOnce(() => new Promise<void>(resolve => { resolveEarlier = resolve }))
    const loading = vi.fn()
    const controller = new SnakeGameController({ container, onEngineLoadingChange: loading })
    const earlier = controller.start()
    await controller.start()
    const current = controller.getPhaserGame()
    resolveEarlier()
    await earlier
    expect(games).toHaveLength(1)
    expect(controller.getPhaserGame()).toBe(current)
    expect(loading.mock.calls.map(call => call[0])).toEqual([true, true, false])
    controller.destroy()
  })

  it('unmount during session startup disposes the late SDK and never mounts Phaser', async () => {
    let resolveStart!: () => void
    vi.mocked(CampusGameSDK.prototype.start).mockImplementationOnce(() => new Promise<void>(resolve => { resolveStart = resolve }))
    const dispose = vi.spyOn(CampusGameSDK.prototype, 'destroy')
    const controller = new SnakeGameController({ container })
    const pending = controller.start()
    controller.destroy()
    resolveStart()
    await pending
    expect(games).toHaveLength(0)
    expect(dispose).toHaveBeenCalledTimes(2)
    expect(controller.getPhaserGame()).toBeNull()
  })

  it('the canvas fits a narrow phone and resizing preserves the authoritative simulation', async () => {
    const controller = new SnakeGameController({ container })
    await controller.start()
    expect(games[0].config.width).toBe(274)
    const scene = controller.getScene()!
    const state = structuredClone(scene.getState())
    scene.resize(240, 240)
    scene.resize(460, 460)
    expect(scene.getState()).toEqual(state)
    controller.destroy()
  })

  it('engine failure releases resources and reports a recoverable error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(GameEngineLoader.loadPhaser).mockRejectedValueOnce(new Error('engine unavailable'))
    const error = vi.fn()
    const controller = new SnakeGameController({ container, onError: error })
    await controller.start()
    expect(controller.getIsPlaying()).toBe(false)
    expect(controller.getSdk()).toBeNull()
    expect(error).toHaveBeenLastCalledWith('Không tải được trò chơi. Vui lòng thử lại.')
    await controller.start()
    expect(controller.getPhaserGame()).not.toBeNull()
    controller.destroy()
  })
})
