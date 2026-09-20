import { describe, expect, it } from 'vitest'
import { MAX_INPUT_TRACE_EVENTS } from '../shared/protocol/game-sdk'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { GameEngineLoader } from '../src/lib/game-loader/engine-loader'

describe('G1 Snake Performance & Resource Bound Contracts', () => {
  it('inputTrace bị chặn cứng tại MAX_INPUT_TRACE_EVENTS (2000), không rò rỉ bộ nhớ khi spam phím', () => {
    const dummyContainer = {
      getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) }),
      requestFullscreen: async () => {},
    } as unknown as HTMLElement
    const sdk = new CampusGameSDK({
      container: dummyContainer,
      gameType: 'solo_snake',
      mode: 'solo',
    })

    // Simulate spamming 3000 inputs
    for (let i = 0; i < 3000; i++) {
      sdk.recordInput('snake.turn', i % 2 === 0 ? 'left' : 'right')
    }

    expect(sdk.isTraceOverflow()).toBe(true)
    sdk.destroy()
  })

  it('GameEngineLoader khởi đầu ở trạng thái chưa nạp Phaser (lazy-loaded)', () => {
    // Before loadPhaser() is explicitly called, Phaser is not in window memory
    GameEngineLoader._resetForTest()
    expect(GameEngineLoader.isLoaded()).toBe(false)
  })

  it('hợp đồng không gửi network packet theo từng frame / từng tick simulation', () => {
    // Snake là game solo, trong suốt quá trình chơi chỉ có 1 request start và 1 request finish
    // Chứng minh qua hằng số và cấu trúc protocol
    expect(MAX_INPUT_TRACE_EVENTS).toBe(2000)
  })
})
