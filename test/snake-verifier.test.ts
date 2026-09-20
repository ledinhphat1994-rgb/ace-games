import { describe, expect, it } from 'vitest'
import { snakeSoloVerifier } from '../worker/games/verifiers/snake-solo-verifier'
import type { GameInputEvent } from '../shared/protocol/game-sdk'

describe('G1 Snake Solo Verifier & Anti-Cheat Authority', () => {
  it('xác thực thành công một phiên chơi hợp lệ đạt trạng thái kết thúc', async () => {
    const validTrace: GameInputEvent[] = [
      { t: 100, k: 'snake.turn', p: 'left' },
      { t: 1500, k: 'match.end', p: { reason: 'game_over' } },
    ]

    const result = await snakeSoloVerifier.verify({
      seed: 1234,
      serverStartedAt: 1000,
      serverEndedAt: 3000,
      inputTrace: validTrace,
    })

    expect(result.valid).toBe(true)
    expect(typeof result.computedScore).toBe('number')
  })

  it('từ chối xác thực phiên chơi bị hủy (aborted)', async () => {
    const abortedTrace: GameInputEvent[] = [
      { t: 100, k: 'snake.turn', p: 'right' },
      { t: 500, k: 'match.end', p: { reason: 'aborted' } },
    ]

    const result = await snakeSoloVerifier.verify({
      seed: 1234,
      serverStartedAt: 1000,
      serverEndedAt: 2000,
      inputTrace: abortedTrace,
    })

    expect(result.valid).toBe(false)
    expect(result.computedScore).toBe(0)
    expect(result.reason).toContain('hủy (aborted)')
  })

  it('từ chối xác thực thao tác đổi hướng không hợp lệ (malformed direction payload)', async () => {
    const badTrace: GameInputEvent[] = [
      { t: 100, k: 'snake.turn', p: 'fly_away' as unknown as 'up' },
    ]

    const result = await snakeSoloVerifier.verify({
      seed: 1234,
      serverStartedAt: 1000,
      serverEndedAt: 2000,
      inputTrace: badTrace,
    })

    expect(result.valid).toBe(false)
    expect(result.computedScore).toBe(0)
    expect(result.reason).toContain('không hợp lệ')
  })

  it('từ chối xác thực mã hành động không thuộc Snake (unknown action code)', async () => {
    const unknownActionTrace: GameInputEvent[] = [
      { t: 100, k: 'jump' },
    ]

    const result = await snakeSoloVerifier.verify({
      seed: 1234,
      serverStartedAt: 1000,
      serverEndedAt: 2000,
      inputTrace: unknownActionTrace,
    })

    expect(result.valid).toBe(false)
    expect(result.computedScore).toBe(0)
    expect(result.reason).toContain('Mã thao tác không hợp lệ')
  })

  it('từ chối xếp hạng xác thực nếu ván đấu chưa kết thúc (chưa chạm tường/thân)', async () => {
    const incompleteTrace: GameInputEvent[] = [
      { t: 100, k: 'snake.turn', p: 'left' },
      // No match.end, and snake didn't have enough time to crash
    ]

    const result = await snakeSoloVerifier.verify({
      seed: 1234,
      serverStartedAt: 1000,
      serverEndedAt: 1200, // only 200ms elapsed
      inputTrace: incompleteTrace,
    })

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('chưa đạt trạng thái kết thúc')
  })
})
