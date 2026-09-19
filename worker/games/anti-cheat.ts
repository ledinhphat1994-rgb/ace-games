import type { GameInputEvent, SoloGameVerifier, SoloGameVerifierResult } from '../../shared/protocol/game-sdk'
export type { SoloGameVerifierResult }

/**
 * Server-side Solo Game Verifier Registry
 *
 * Strict anti-cheat invariant: A score must NEVER be called verified: true
 * solely because it falls below a heuristic ceiling. Only a registered
 * deterministic verifier may produce verified: true and an authoritative ranked score.
 */
class VerifierRegistry {
  private verifiers = new Map<string, SoloGameVerifier>()

  register(verifier: SoloGameVerifier): void {
    this.verifiers.set(verifier.gameType, verifier)
  }

  get(gameType: string): SoloGameVerifier | undefined {
    return this.verifiers.get(gameType)
  }

  has(gameType: string): boolean {
    return this.verifiers.has(gameType)
  }

  unregister(gameType: string): void {
    this.verifiers.delete(gameType)
  }

  clear(): void {
    this.verifiers.clear()
  }
}

export const soloVerifierRegistry = new VerifierRegistry()

/**
 * Generates an authoritative server verification hash from canonical match material.
 * The client hash is never accepted as verification proof.
 */
export async function generateAuthoritativeVerificationHash(params: {
  gameType: string
  sessionId: string
  seed: number
  inputTrace: readonly GameInputEvent[]
  computedScore: number
  serverStartedAt: number
  serverEndedAt: number
}): Promise<string> {
  const canonical = JSON.stringify({
    gameType: params.gameType,
    sessionId: params.sessionId,
    seed: params.seed,
    traceLength: params.inputTrace.length,
    inputs: params.inputTrace.map((e) => ({ t: e.t, k: e.k, p: e.p ?? null })),
    score: params.computedScore,
    startedAt: params.serverStartedAt,
    endedAt: params.serverEndedAt,
  })

  const encoded = new TextEncoder().encode(canonical)
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
  const hashArr = Array.from(new Uint8Array(hashBuf))
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validates that input trace timestamps are non-negative, strictly monotonic,
 * and within the authoritative server duration plus network tolerance.
 */
export function validateInputTraceTimestamps(
  inputTrace: readonly GameInputEvent[],
  serverElapsedMs: number,
  toleranceMs: number = 3000,
): { valid: boolean; reason?: string } {
  let lastT = -1

  for (let i = 0; i < inputTrace.length; i++) {
    const item = inputTrace[i]
    if (item.t < 0) {
      return { valid: false, reason: `Timestamp âm tại index ${i}: ${item.t}ms.` }
    }
    if (item.t < lastT) {
      return {
        valid: false,
        reason: `Timestamp không tăng đơn điệu tại index ${i}: ${item.t}ms < ${lastT}ms.`,
      }
    }
    if (item.t > serverElapsedMs + toleranceMs) {
      return {
        valid: false,
        reason: `Timestamp vượt quá thời lượng phiên máy chủ tại index ${i}: ${item.t}ms > ${serverElapsedMs + toleranceMs}ms.`,
      }
    }
    lastT = item.t
  }

  return { valid: true }
}

/**
 * Validates human finger input frequency limit (max inputs per second).
 */
export function validateHumanInputRate(
  inputCount: number,
  serverElapsedMs: number,
  maxInputsPerSec: number = 35,
): { valid: boolean; reason?: string } {
  const durationSec = Math.max(0.5, serverElapsedMs / 1000)
  const inputsPerSec = inputCount / durationSec

  if (inputsPerSec > maxInputsPerSec) {
    return {
      valid: false,
      reason: `Tần suất thao tác vượt quá giới hạn thể chất con người: ${inputsPerSec.toFixed(1)} inputs/s (tối đa ${maxInputsPerSec} inputs/s).`,
    }
  }

  return { valid: true }
}
