import { replaySnakeSession } from '../../../shared/games/snake'
import type { Direction } from '../../../shared/games/snake'
import type {
  GameInputEvent,
  SoloGameVerifier,
  SoloGameVerifierResult,
} from '../../../shared/protocol/game-sdk'
import { soloVerifierRegistry } from '../anti-cheat'

export class SnakeSoloVerifier implements SoloGameVerifier {
  readonly gameType = 'solo_snake'

  async verify(input: {
    seed: number
    serverStartedAt: number
    serverEndedAt: number
    inputTrace: readonly GameInputEvent[]
  }): Promise<SoloGameVerifierResult> {
    const { seed, serverStartedAt, serverEndedAt, inputTrace } = input

    // 1. Normalize and validate input actions
    const normalizedTrace: GameInputEvent[] = []

    for (let i = 0; i < inputTrace.length; i++) {
      const event = inputTrace[i]

      if (event.k === 'match.end') {
        const payload = event.p as { reason?: string } | undefined
        if (payload?.reason === 'aborted') {
          return {
            valid: false,
            computedScore: 0,
            verificationHash: '',
            reason: 'Phiên chơi bị hủy (aborted), không được xếp hạng xác thực.',
          }
        }
        normalizedTrace.push(event)
      } else if (event.k === 'snake.turn') {
        const dir = event.p as Direction
        if (dir !== 'up' && dir !== 'down' && dir !== 'left' && dir !== 'right') {
          return {
            valid: false,
            computedScore: 0,
            verificationHash: '',
            reason: `Hướng di chuyển không hợp lệ tại index ${i}: ${String(event.p)}`,
          }
        }
        normalizedTrace.push(event)
      } else if (
        event.k === 'up' ||
        event.k === 'down' ||
        event.k === 'left' ||
        event.k === 'right'
      ) {
        // Backward-compatibility normalization for legacy/foundation test harnesses
        normalizedTrace.push({
          t: event.t,
          k: 'snake.turn',
          p: event.k,
        })
      } else {
        // Unknown action code for snake
        return {
          valid: false,
          computedScore: 0,
          verificationHash: '',
          reason: `Mã thao tác không hợp lệ cho Snake tại index ${i}: ${event.k}`,
        }
      }
    }

    // 2. Authoritative deterministic replay
    const serverDurationMs = Math.max(1000, serverEndedAt - serverStartedAt)
    const replay = replaySnakeSession({
      seed,
      inputTrace: normalizedTrace,
      maxElapsedMs: serverDurationMs + 5000,
    })

    if (!replay.valid || !replay.terminalReason) {
      return {
        valid: false,
        computedScore: replay.computedScore,
        verificationHash: '',
        reason:
          replay.reason ??
          'Ván đấu chưa đạt trạng thái kết thúc hợp lệ (chưa va chạm tường hoặc thân).',
        terminalReason: replay.terminalReason ?? undefined,
      }
    }

    return {
      valid: true,
      computedScore: replay.computedScore,
      verificationHash: '', // worker/index.ts generates canonical SHA-256 with sessionId
      terminalReason: replay.terminalReason ?? undefined,
    }
  }
}

export const snakeSoloVerifier = new SnakeSoloVerifier()
soloVerifierRegistry.register(snakeSoloVerifier)
