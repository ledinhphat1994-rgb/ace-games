export interface DistributedTierResult {
  tier: string
  targetSockets: number
  everConnected?: number
  barrierPeakConcurrent?: number
  peakOpenSockets: number
  successSockets: number
  setupFailures: number
  connectionSuccessPercent: number
  unexpectedRuntimeDisconnects: number
  connectP50: number
  connectP95: number
  connectP99: number
  actionAttempts: number
  actionSuccesses: number
  actionFailures: number
  actionFailureReasons: string[]
  actionSuccessPercent: number
  actionP50: number
  actionP95: number
  actionP99: number
  actionDetails?: unknown[]
  settlementAttempts: number
  gameplayEnded: number
  durablySettled: number
  missingSettlements: number
  duplicateSettlements: number
  finalOutboxDepth: number
  pendingOutboxRounds?: string[]
  settlementFailures: number
  campusRequestCount: number
  campusSuccessPercent: number
  campusP50: number
  campusP95: number
  campusP99: number
  campus5xx: number
  campusTimeouts: number
  campusWsFailures: number
  durationMs: number
}

export interface GateEvaluationResult {
  pass: boolean
  failures: string[]
}

export function evaluateDistributedTier(result: Partial<DistributedTierResult>, tierSockets: number): GateEvaluationResult
export function evaluateHotObjectResult(result: any): GateEvaluationResult
export function evaluateReconnectResult(result: any): GateEvaluationResult
export function evaluateAbuseResult(result: any): GateEvaluationResult
