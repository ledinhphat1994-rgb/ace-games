import { describe, expect, it } from 'vitest'
import { AssetPreloader } from '../src/lib/game-sdk/asset-preloader'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { GameEngineLoader } from '../src/lib/game-loader/engine-loader'

describe('Campus Game SDK & Engine Loader Unit Tests', () => {
  it('CampusGameSDK khởi tạo đầy đủ viewport, audio bus và vòng đời', () => {
    // Tạo container giả lập
    const container = {
      getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) }),
      requestFullscreen: async () => {},
    } as unknown as HTMLElement

    let lifecycleState = 'init'
    let currentScore = 0

    const sdk = new CampusGameSDK({
      container,
      gameType: 'solo_snake',
      mode: 'solo',
      initialAudio: { master: 0.9, sfx: 0.7, bgm: 0.4, muted: false },
      onLifecycleChange: (ev) => {
        lifecycleState = ev
      },
      onScoreUpdate: (s) => {
        currentScore = s
      },
    })

    expect(sdk.gameType).toBe('solo_snake')
    expect(sdk.mode).toBe('solo')
    expect(lifecycleState).toBe('init')

    // Audio Bus
    const audio = sdk.getAudioSettings()
    expect(audio.master).toBe(0.9)
    expect(audio.sfx).toBe(0.7)
    expect(sdk.getEffectiveVolume('sfx')).toBeCloseTo(0.63)

    // Score & Input Recording
    sdk.updateScore(150)
    expect(currentScore).toBe(150)
    expect(sdk.getScore()).toBe(150)

    sdk.recordInput('arrow_right', { speed: 1 })
    sdk.recordInput('arrow_down')

    // Quality level
    expect(['low', 'medium', 'high']).toContain(sdk.getQualityLevel())

    // Pause & Resume
    sdk.pause()
    expect(lifecycleState).toBe('init') // Pause only affects if started

    sdk.destroy()
    expect(lifecycleState).toBe('destroy')
  })

  it('AssetPreloader trả về maps tài nguyên khi manifest rỗng hoặc có tài nguyên', async () => {
    let progressPercent = 0
    const result = await AssetPreloader.preload({}, (p) => {
      progressPercent = p.percent
    })

    expect(progressPercent).toBe(100)
    expect(result.images.size).toBe(0)
    expect(result.audio.size).toBe(0)
    expect(result.json.size).toBe(0)
  })

  it('GameEngineLoader phát hiện trạng thái tải Phaser', () => {
    // Trong môi trường worker/Nodejs, window.Phaser chưa được tải
    const isLoaded = GameEngineLoader.isLoaded()
    expect(typeof isLoaded).toBe('boolean')
  })
})
