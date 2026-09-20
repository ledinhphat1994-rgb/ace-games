import { performance } from 'node:perf_hooks'

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

async function runTier(tierCount, cookie, options = {}) {
  const isBurst = Boolean(options.isBurst)
  const title = isBurst
    ? `BURST TIER: ${tierCount} SIMULTANEOUS FINISHES`
    : `STAGGERED TIER: ${tierCount} CONCURRENT SESSIONS`

  console.log(`\n======================================================`)
  console.log(`RUNNING G1 OVERLOAD: ${title}`)
  console.log(`======================================================`)

  const startLatencies = []
  const finishLatencies = []
  let startSuccess = 0
  let finishSuccess = 0
  let verifiedSuccess = 0
  let error5xx = 0
  let d1Errors = 0

  const validTrace = [
    { t: 100, k: 'snake.turn', p: 'left' },
    { t: 1500, k: 'match.end', p: { reason: 'game_over' } },
  ]

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

  // 1. Session Starts (in batches of 50 to avoid local socket exhaustion)
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
    error5xx,
    d1Errors,
    coldStartProbe: coldStartProbe ? 'OK (200)' : 'FAILED',
    steadyCampusProbe: `${steadyProbeSuccess}/${steadyProbeTotal} (${steadyHealthRate.toFixed(1)}%)`,
    steadyCampusHealthRate: steadyHealthRate,
  }

  console.log(`Report:`, JSON.stringify(report, null, 2))
  return report
}

function evaluateReleaseGates(reports) {
  console.log('\n======================================================')
  console.log('EVALUATING G1 MACHINE RELEASE GATES (Section 14)')
  console.log('======================================================')

  let hasFailure = false

  for (const rep of reports) {
    const name = `${rep.mode.toUpperCase()} ${rep.tier}`
    const startRate = parseFloat(rep.startSuccessRate)
    const finishRate = parseFloat(rep.finishSuccessRate)
    const verifiedRate = parseFloat(rep.verifiedRate)

    if (startRate < 99.0) {
      console.error(`❌ [${name}] Start success rate ${startRate}% < 99%`)
      hasFailure = true
    }
    if (finishRate < 99.0) {
      console.error(`❌ [${name}] Finish success rate ${finishRate}% < 99%`)
      hasFailure = true
    }
    if (verifiedRate < 100.0) {
      console.error(`❌ [${name}] Verification success rate ${verifiedRate}% < 100%`)
      hasFailure = true
    }
    if (rep.error5xx > 0) {
      console.error(`❌ [${name}] HTTP 5xx errors: ${rep.error5xx} > 0`)
      hasFailure = true
    }
    if (rep.d1Errors > 0) {
      console.error(`❌ [${name}] D1 errors: ${rep.d1Errors} > 0`)
      hasFailure = true
    }
    if (rep.steadyCampusHealthRate < 95.0) {
      console.error(`❌ [${name}] Campus steady-state health ${rep.steadyCampusHealthRate}% < 95%`)
      hasFailure = true
    }
    if (rep.startLatencies.p95 > 1000) {
      console.error(`❌ [${name}] Start P95 latency ${rep.startLatencies.p95}ms > 1000ms`)
      hasFailure = true
    }
    if (rep.finishLatencies.p95 > 1500) {
      console.error(`❌ [${name}] Finish P95 latency ${rep.finishLatencies.p95}ms > 1500ms`)
      hasFailure = true
    }
  }

  if (hasFailure) {
    console.error('\n❌ MACHINE RELEASE GATE FAILED!')
    process.exit(1)
  }

  console.log('\n✅ ALL G1 OVERLOAD & BURST RELEASE GATES PASSED!')
}

async function main() {
  console.log(`Target URL: ${TARGET}`)

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

main().catch((err) => {
  console.error('Benchmark Error:', err)
  process.exit(1)
})
