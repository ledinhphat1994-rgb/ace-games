export interface G1TierReport {
  tier: number
  mode: 'burst' | 'staggered'
  startAttempts: number
  startSuccess: number
  startSuccessRate: string
  finishAttempts: number
  finishSuccess: number
  finishSuccessRate: string
  verifiedSuccess: number
  verifiedRate: string
  startLatencies: { p50: number; p95: number; p99: number }
  finishLatencies: { p50: number; p95: number; p99: number }
  serverTimingBreakdown?: {
    authLookup: { p50: number; p95: number; p99: number }
    deterministicReplay: { p50: number; p95: number; p99: number }
    d1BatchWrite: { p50: number; p95: number; p99: number }
    totalServerProcessing: { p50: number; p95: number; p99: number }
  }
  error5xx: number
  d1Errors: number
  coldStartProbe: string
  steadyCampusProbe: string
  steadyCampusHealthRate: number
  expectedSessions: number
  completedSessions: number
  verifiedHighscoreRows: number
  missingSessions: number
  missingHighscores: number
  duplicateSessionHighscores: number
}

export interface G1GateEvaluationResult {
  pass: boolean
  failures: string[]
}

export function runTier(
  tierCount: number,
  cookie: string,
  options?: { isBurst?: boolean },
): Promise<G1TierReport>

export function evaluateG1ReleaseGates(
  reports: Partial<G1TierReport> | Partial<G1TierReport>[],
): G1GateEvaluationResult

export function evaluateReleaseGates(
  reports: Partial<G1TierReport>[],
): void
