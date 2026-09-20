import { describe, it, expect } from 'vitest'
import {
  evaluateDistributedTier,
  evaluateHotObjectResult,
  evaluateReconnectResult,
  evaluateAbuseResult,
// @ts-expect-error [blessed] load test harness is an mjs script without compiled d.ts
} from '../scripts/load-tests/game-load-test.mjs'

describe('Game Load Gate Evaluation Unit Tests (Blocker 9)', () => {
  const baseCleanTierResult = {
    targetSockets: 500,
    peakOpenSockets: 500,
    connectionSuccessPercent: 100.0,
    unexpectedRuntimeDisconnects: 0,
    actionAttempts: 30,
    actionSuccesses: 30,
    actionFailures: 0,
    actionSuccessPercent: 100.0,
    actionP50: 65,
    actionP95: 120,
    actionP99: 180,
    settlementAttempts: 10,
    durablySettled: 10,
    settlementFailures: 0,
    missingSettlements: 0,
    duplicateSettlements: 0,
    finalOutboxDepth: 0,
    campus5xx: 0,
    campusTimeouts: 0,
    campusWsFailures: 0,
    campusSuccessPercent: 100.0,
  }

  it('passes on clean distributed tier result', () => {
    const evalRes = evaluateDistributedTier(baseCleanTierResult, 500)
    expect(evalRes.pass).toBe(true)
    expect(evalRes.failures).toHaveLength(0)
  })

  it('fails when actionFailures > 0 or actionSuccessPercent < 99%', () => {
    const dirty = {
      ...baseCleanTierResult,
      actionSuccesses: 28,
      actionFailures: 2,
      actionSuccessPercent: 93.3,
    }
    const evalRes = evaluateDistributedTier(dirty, 500)
    expect(evalRes.pass).toBe(false)
    expect(evalRes.failures.some((f: string) => f.includes('Action success'))).toBe(true)
  })

  it('fails when unexpectedRuntimeDisconnects > 0', () => {
    const dirty = {
      ...baseCleanTierResult,
      unexpectedRuntimeDisconnects: 3,
    }
    const evalRes = evaluateDistributedTier(dirty, 500)
    expect(evalRes.pass).toBe(false)
    expect(evalRes.failures.some((f: string) => f.includes('Unexpected runtime disconnects'))).toBe(true)
  })

  it('fails when action latency exceeds thresholds (P95 > 300ms or P99 > 1000ms)', () => {
    const dirty = {
      ...baseCleanTierResult,
      actionP95: 350,
      actionP99: 1200,
    }
    const evalRes = evaluateDistributedTier(dirty, 500)
    expect(evalRes.pass).toBe(false)
    expect(evalRes.failures.some((f: string) => f.includes('Action P95 latency'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Action P99 latency'))).toBe(true)
  })

  it('fails when settlementFailures > 0, missingSettlements > 0, or duplicateSettlements > 0', () => {
    const dirty = {
      ...baseCleanTierResult,
      durablySettled: 9,
      missingSettlements: 1,
      duplicateSettlements: 1,
      settlementFailures: 1,
      finalOutboxDepth: 1,
    }
    const evalRes = evaluateDistributedTier(dirty, 500)
    expect(evalRes.pass).toBe(false)
    expect(evalRes.failures.some((f: string) => f.includes('Settlement failures'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Missing settlements'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Duplicate settlements'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Durably settled'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Final outstanding outbox depth'))).toBe(true)
  })

  it('fails when Campus 5xx > 0, timeouts > 0, or WS failures > 0', () => {
    const dirty = {
      ...baseCleanTierResult,
      campus5xx: 1,
      campusTimeouts: 2,
      campusWsFailures: 1,
      campusSuccessPercent: 96.0,
    }
    const evalRes = evaluateDistributedTier(dirty, 500)
    expect(evalRes.pass).toBe(false)
    expect(evalRes.failures.some((f: string) => f.includes('Campus core 5xx count'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Campus core timeouts'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Campus WS failures'))).toBe(true)
    expect(evalRes.failures.some((f: string) => f.includes('Campus core success'))).toBe(true)
  })

  it('evaluates Hot Object result strictly', () => {
    const cleanHot = {
      connectedSpectators: 30,
      refusedSpectators: 1,
      spectatorCapEnforced: true,
      playerActionSucceeds: true,
      playerMoveLatencyMs: 72,
    }
    expect(evaluateHotObjectResult(cleanHot).pass).toBe(true)

    const dirtyHot1 = { ...cleanHot, connectedSpectators: 29 }
    expect(evaluateHotObjectResult(dirtyHot1).pass).toBe(false)

    const dirtyHot2 = { ...cleanHot, refusedSpectators: 0 }
    expect(evaluateHotObjectResult(dirtyHot2).pass).toBe(false)

    const dirtyHot3 = { ...cleanHot, playerActionSucceeds: false }
    expect(evaluateHotObjectResult(dirtyHot3).pass).toBe(false)
  })

  it('evaluates Reconnect Storm result strictly', () => {
    const cleanRec = {
      worstCaseRecoveryPercent: 100.0,
      prodRecovered: 100,
      prodFailedCount: 0,
      prodRecoveryPercent: 100.0,
      prodP50: 750,
      prodP95: 880,
    }
    expect(evaluateReconnectResult(cleanRec).pass).toBe(true)

    const dirtyRec = {
      ...cleanRec,
      prodRecoveryPercent: 97.0,
      prodFailedCount: 3,
    }
    expect(evaluateReconnectResult(dirtyRec).pass).toBe(false)
  })

  it('evaluates Abuse Isolation result strictly', () => {
    const cleanAbuse = {
      attackerDisconnectedWith4429: true,
      legitimateMatchFunctional: true,
      duringAttackMoveLatencyMs: 75,
    }
    expect(evaluateAbuseResult(cleanAbuse).pass).toBe(true)

    const dirtyAbuse = {
      ...cleanAbuse,
      attackerDisconnectedWith4429: false,
    }
    expect(evaluateAbuseResult(dirtyAbuse).pass).toBe(false)
  })
})
