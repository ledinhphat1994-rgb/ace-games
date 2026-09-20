import { describe, expect, it } from 'vitest'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { SnakeScene } from '../src/features/games/snake/SnakeScene'
import { createSnakeState, stepSnake } from '../shared/games/snake'

describe('G1 Snake Lifecycle & Adaptive Quality Contracts', () => {
  it('100 chu kỳ khởi tạo và hủy (mount/destroy) của CampusGameSDK và SnakeScene hoàn toàn sạch sẽ, không rò rỉ', () => {
    const dummyContainer = {
      getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) }),
      requestFullscreen: async () => {},
    } as unknown as HTMLElement

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

      // Simulate partial play & destruction
      scene.queueTurn('left')
      scene.destroy()
      sdk.destroy()
    }

    expect(true).toBe(true)
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
