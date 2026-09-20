import { performance } from 'node:perf_hooks'

async function setupConnectionPool() {
  try {
    const { Agent, setGlobalDispatcher } = await import('undici')
    setGlobalDispatcher(
      new Agent({
        connections: 500,
        pipelining: 1,
        keepAliveTimeout: 60000,
        keepAliveMaxTimeout: 60000,
      }),
    )
  } catch {
    // If undici is not available or in non-node environment, continue with default fetch
  }
}

const TARGET = process.env.TARGET_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'


function computePercentiles(arr) {
  if (arr.length === 0) return { p50: 0, p95: 0, p99: 0 }
  const sorted = [...arr].sort((a, b) => a - b)
  return {
    p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
    p99: Math.round(sorted[Math.floor(sorted.length * 0.99)]),
  }
}

export async function runTier(tierCount, cookie, options = {}) {
  const isBurst = Boolean(options.isBurst)
  const title = isBurst
    ? `BURST TIER: ${tierCount} SIMULTANEOUS FINISHES`
    : `STAGGERED TIER: ${tierCount} CONCURRENT SESSIONS`

  console.log(`\n======================================================`)
  console.log(`RUNNING G1 OVERLOAD: ${title}`)
  console.log(`======================================================`)

  const startLatencies = []
  const finishLatencies = []
  const authServerLatencies = []
  const replayServerLatencies = []
  const dbBatchServerLatencies = []
  const totalServerLatencies = []
  let startSuccess = 0
  let finishSuccess = 0
  let verifiedSuccess = 0
  let error5xx = 0
  let d1Errors = 0

  const validTrace = [
    { t: 100, k: 'snake.turn', p: 'left' },
    { t: 1500, k: 'match.end', p: { reason: 'game_over' } },
  ]

  function parseServerTiming(res) {
    const st = res.headers.get('Server-Timing')
    if (st) {
      const authMatch = st.match(/auth;dur=(\d+)/)
      const replayMatch = st.match(/replay;dur=(\d+)/)
      const dbMatch = st.match(/db_batch;dur=(\d+)/)
      const totalMatch = st.match(/total;dur=(\d+)/)
      if (authMatch) authServerLatencies.push(parseInt(authMatch[1], 10))
      if (replayMatch) replayServerLatencies.push(parseInt(replayMatch[1], 10))
      if (dbMatch) dbBatchServerLatencies.push(parseInt(dbMatch[1], 10))
      if (totalMatch) totalServerLatencies.push(parseInt(totalMatch[1], 10))
    }
  }

  // Concurrently probe Campus core health during the overload run
  let coldStartProbe = null
  let steadyProbeSuccess = 0
  let steadyProbeTotal = 0
  let probeCount = 0

  const campusProbeInterval = setInterval(async () => {
    probeCount++
    try {
      const res = await fetch(`${TARGET}/`, { signal: AbortSignal.timeout(5000) })
      const ok = res.status === 200
      if (probeCount === 1) {
        coldStartProbe = ok
      } else {
        steadyProbeTotal++
        if (ok) steadyProbeSuccess++
      }
    } catch {
      if (probeCount === 1) {
        coldStartProbe = false
      } else {
        steadyProbeTotal++
      }
    }
  }, 250)

  // For burst tiers: pre-warm the client connection pool with tierCount sockets
  // to prevent client-side TCP/TLS connection queueing during the simultaneous finish phase
  if (isBurst) {
    console.log(`[Burst Pool] Pre-warming ${tierCount} keep-alive HTTP connections...`)
    await Promise.all(
      Array.from({ length: tierCount }, () =>
        fetch(`${TARGET}/`, { signal: AbortSignal.timeout(5000) }).catch(() => {}),
      ),
    )
  }

  // 1. Session Starts (in batches of 50 to avoid D1 write serialization bottlenecks)
  const sessions = []
  const batchSize = 50

  for (let i = 0; i < tierCount; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, tierCount - i) }, async () => {
      const t0 = performance.now()
      try {
        const res = await fetch(`${TARGET}/api/game/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: JSON.stringify({ gameType: 'solo_snake' }),
          signal: AbortSignal.timeout(10000),
        })
        const elapsed = performance.now() - t0
        startLatencies.push(elapsed)

        if (res.status >= 500) error5xx++
        if (res.status === 200) {
          const data = await res.json()
          if (data.ok && data.sessionId) {
            startSuccess++
            return { sessionId: data.sessionId, seed: data.seed }
          }
        }
      } catch (err) {
        if (String(err).includes('500') || String(err).includes('503')) error5xx++
      }
      return null
    })

    const results = await Promise.all(batch)
    for (const r of results) {
      if (r) sessions.push(r)
    }
  }

  // 2. Session Finishes
  if (isBurst) {
    // BURST SCENARIO: All finish requests fired simultaneously
    console.log(`[Burst] Firing ${sessions.length} simultaneous finish requests...`)
    const burstPromises = sessions.map(async (sess) => {
      const t0 = performance.now()
      try {
        const res = await fetch(`${TARGET}/api/game/session/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: JSON.stringify({
            sessionId: sess.sessionId,
            score: 0,
            durationMs: 2000,
            inputTrace: validTrace,
          }),
          signal: AbortSignal.timeout(15000),
        })
        const elapsed = performance.now() - t0
        finishLatencies.push(elapsed)
        parseServerTiming(res)

        if (res.status >= 500) error5xx++
        if (res.status === 200) {
          const data = await res.json()
          if (data.ok) {
            finishSuccess++
            if (data.verified) verifiedSuccess++
          }
        }
      } catch (err) {
        if (String(err).includes('500') || String(err).includes('503')) error5xx++
        d1Errors++
      }
    })

    await Promise.all(burstPromises)
  } else {
    // STAGGERED SCENARIO: Realistic batches of 50
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize).map(async (sess) => {
        const t0 = performance.now()
        try {
          const res = await fetch(`${TARGET}/api/game/session/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie },
            body: JSON.stringify({
              sessionId: sess.sessionId,
              score: 0,
              durationMs: 2000,
              inputTrace: validTrace,
            }),
            signal: AbortSignal.timeout(10000),
          })
          const elapsed = performance.now() - t0
          finishLatencies.push(elapsed)
          parseServerTiming(res)

          if (res.status >= 500) error5xx++
          if (res.status === 200) {
            const data = await res.json()
            if (data.ok) {
              finishSuccess++
              if (data.verified) verifiedSuccess++
            }
          }
        } catch (err) {
          if (String(err).includes('500') || String(err).includes('503')) error5xx++
          d1Errors++
        }
      })

      await Promise.all(batch)
    }
  }

  clearInterval(campusProbeInterval)

  // 3. Exact D1 Reconciliation Gate via Staging Diagnostic
  console.log(`[D1 Reconcile] Verifying ${sessions.length} sessions against staging D1...`)
  let reconcileData = null
  try {
    const rReconcile = await fetch(`${TARGET}/api/staging/game-session/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ sessionIds: sessions.map((s) => s.sessionId) }),
    })
    if (rReconcile.ok) {
      reconcileData = await rReconcile.json()
    } else {
      console.error(`Reconcile failed with HTTP ${rReconcile.status}`)
    }
  } catch (err) {
    console.error('Reconciliation error:', err)
  }

  const startP = computePercentiles(startLatencies)
  const finishP = computePercentiles(finishLatencies)
  const steadyHealthRate = steadyProbeTotal > 0
    ? (steadyProbeSuccess / steadyProbeTotal) * 100
    : 100

  const report = {
    tier: tierCount,
    mode: isBurst ? 'burst' : 'staggered',
    startAttempts: tierCount,
    startSuccess,
    startSuccessRate: ((startSuccess / tierCount) * 100).toFixed(1) + '%',
    finishAttempts: sessions.length,
    finishSuccess,
    finishSuccessRate: ((finishSuccess / Math.max(1, sessions.length)) * 100).toFixed(1) + '%',
    verifiedSuccess,
    verifiedRate: ((verifiedSuccess / Math.max(1, sessions.length)) * 100).toFixed(1) + '%',
    startLatencies: startP,
    finishLatencies: finishP,
    serverTimingBreakdown: {
      authLookup: computePercentiles(authServerLatencies),
      deterministicReplay: computePercentiles(replayServerLatencies),
      d1BatchWrite: computePercentiles(dbBatchServerLatencies),
      totalServerProcessing: computePercentiles(totalServerLatencies),
    },
    error5xx,
    d1Errors,
    coldStartProbe: coldStartProbe ? 'OK (200)' : 'FAILED',
    steadyCampusProbe: `${steadyProbeSuccess}/${steadyProbeTotal} (${steadyHealthRate.toFixed(1)}%)`,
    steadyCampusHealthRate: steadyHealthRate,
    // D1 reconciliation data-integrity metrics
    expectedSessions: reconcileData?.expectedSessions ?? sessions.length,
    completedSessions: reconcileData?.completedSessions ?? 0,
    verifiedHighscoreRows: reconcileData?.verifiedHighscoreRows ?? 0,
    missingSessions: reconcileData?.missingSessions ?? (sessions.length - finishSuccess),
    missingHighscores: reconcileData?.missingHighscores ?? (finishSuccess - verifiedSuccess),
    duplicateSessionHighscores: reconcileData?.duplicateSessionHighscores ?? 0,
  }

  console.log(`Report:`, JSON.stringify(report, null, 2))
  return report
}

export function evaluateG1ReleaseGates(reports) {
  const failures = []
  const reportList = Array.isArray(reports) ? reports : [reports]

  for (const rep of reportList) {
    const name = `${rep.mode.toUpperCase()} ${rep.tier}`
    const startRate = parseFloat(rep.startSuccessRate ?? '0')
    const finishRate = parseFloat(rep.finishSuccessRate ?? '0')
    const verifiedRate = parseFloat(rep.verifiedRate ?? '0')

    if (startRate < 99.0) {
      failures.push(`[${name}] Start success rate ${startRate}% < 99%`)
    }
    if (finishRate < 99.0) {
      failures.push(`[${name}] Finish success rate ${finishRate}% < 99%`)
    }
    if (verifiedRate < 100.0) {
      failures.push(`[${name}] Verification success rate ${verifiedRate}% < 100%`)
    }
    if (rep.error5xx > 0) {
      failures.push(`[${name}] HTTP 5xx errors: ${rep.error5xx} > 0`)
    }
    if (rep.d1Errors > 0) {
      failures.push(`[${name}] D1 errors: ${rep.d1Errors} > 0`)
    }
    if (rep.steadyCampusHealthRate < 95.0) {
      failures.push(`[${name}] Campus steady-state health ${rep.steadyCampusHealthRate}% < 95%`)
    }
    if (rep.startLatencies && rep.startLatencies.p95 > 1000) {
      failures.push(`[${name}] Start P95 latency ${rep.startLatencies.p95}ms > 1000ms`)
    }
    // Strict release gate: finish P95 <= 1500 ms for ALL required tiers (burst & staggered)
    if (rep.finishLatencies && rep.finishLatencies.p95 > 1500) {
      failures.push(`[${name}] Finish P95 latency ${rep.finishLatencies.p95}ms > 1500ms`)
    }
    // D1 Data Integrity Invariants
    if (rep.missingSessions > 0) {
      failures.push(`[${name}] Missing sessions in D1: ${rep.missingSessions} > 0`)
    }
    if (rep.missingHighscores > 0) {
      failures.push(`[${name}] Missing verified highscores in D1: ${rep.missingHighscores} > 0`)
    }
    if (rep.duplicateSessionHighscores > 0) {
      failures.push(`[${name}] Duplicate session highscores in D1: ${rep.duplicateSessionHighscores} > 0`)
    }
  }

  return {
    pass: failures.length === 0,
    failures,
  }
}

export function evaluateReleaseGates(reports) {
  console.log('\n======================================================')
  console.log('EVALUATING G1 MACHINE RELEASE GATES (Section 14 & D1 Integrity)')
  console.log('======================================================')

  const res = evaluateG1ReleaseGates(reports)

  if (!res.pass) {
    for (const failure of res.failures) {
      console.error(`❌ ${failure}`)
    }
    console.error('\n❌ MACHINE RELEASE GATE FAILED!')
    process.exit(1)
  }

  console.log('\n✅ ALL G1 OVERLOAD, BURST & D1 INTEGRITY RELEASE GATES PASSED!')
}

async function main() {
  await setupConnectionPool()
  console.log(`Target URL: ${TARGET}`)


  const args = process.argv.slice(2)
  let targetTier = 'all'
  for (const arg of args) {
    if (arg.startsWith('--tier=')) {
      targetTier = arg.slice('--tier='.length).toLowerCase()
    }
  }

  // Register benchmark user
  const ts = Date.now()
  const username = `bench_g1_${ts}`
  const password = 'BenchPassword123!'

  await fetch(`${TARGET}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenHienThi: 'Bench Player', vaiTro: 'student' }),
  })

  const rLogin = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const cookie = rLogin.headers.get('set-cookie')?.split(';')[0]
  if (!cookie) throw new Error('Failed to get benchmark auth cookie')

  if (targetTier === 'burst250') {
    console.log('\nRunning ONLY Burst 250 tier as requested...')
    const burst250 = await runTier(250, cookie, { isBurst: true })
    console.log('\n======================================================')
    console.log('G1 BURST 250 BENCHMARK SUMMARY')
    console.log('======================================================')
    console.log(JSON.stringify({ burst250 }, null, 2))
    evaluateReleaseGates([burst250])
    return
  }

  // 1. Staggered Tiers
  const report100 = await runTier(100, cookie, { isBurst: false })
  const report250 = await runTier(250, cookie, { isBurst: false })
  const report500 = await runTier(500, cookie, { isBurst: false })

  // 2. Burst Tiers (Section 15: 100 simultaneous, then 250 simultaneous)
  const burst100 = await runTier(100, cookie, { isBurst: true })
  const burst250 = await runTier(250, cookie, { isBurst: true })

  console.log('\n======================================================')
  console.log('OVERALL G1 LOAD BENCHMARK SUMMARY')
  console.log('======================================================')
  console.log(JSON.stringify({ report100, report250, report500, burst100, burst250 }, null, 2))

  // 3. Machine-gated evaluation
  evaluateReleaseGates([report100, report250, report500, burst100, burst250])
}

if (process.argv[1] && process.argv[1].endsWith('g1-snake-overload-test.mjs')) {
  main().catch((err) => {
    console.error('Benchmark Error:', err)
    process.exit(1)
  })
}
