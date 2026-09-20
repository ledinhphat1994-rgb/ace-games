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

async function runTier(tierCount, cookie) {
  console.log(`\n======================================================`)
  console.log(`RUNNING G1 OVERLOAD TIER: ${tierCount} CONCURRENT SESSIONS`)
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
  let campusProbeSuccess = 0
  let campusProbeTotal = 0
  const campusProbeInterval = setInterval(async () => {
    campusProbeTotal++
    try {
      const res = await fetch(`${TARGET}/`, { signal: AbortSignal.timeout(5000) })
      if (res.status === 200) campusProbeSuccess++
    } catch {
      // Failed probe
    }
  }, 250)

  // 1. Concurrent Session Starts (batched in chunks of 50 to avoid local socket exhaustion)
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

  // 2. Concurrent Session Finishes (Staggered realistic load & burst)
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

  clearInterval(campusProbeInterval)

  const startP = computePercentiles(startLatencies)
  const finishP = computePercentiles(finishLatencies)

  const report = {
    tier: tierCount,
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
    campusProbeSuccess: `${campusProbeSuccess}/${campusProbeTotal} (${((campusProbeSuccess / Math.max(1, campusProbeTotal)) * 100).toFixed(1)}%)`,
  }

  console.log(`Tier ${tierCount} Report:`, JSON.stringify(report, null, 2))
  return report
}

async function main() {
  console.log(`Connecting to ${TARGET}...`)

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

  const report100 = await runTier(100, cookie)
  const report250 = await runTier(250, cookie)
  const report500 = await runTier(500, cookie)

  console.log('\n======================================================')
  console.log('OVERALL G1 LOAD BENCHMARK SUMMARY')
  console.log('======================================================')
  console.log(JSON.stringify({ report100, report250, report500 }, null, 2))
}

main().catch((err) => {
  console.error('Benchmark Error:', err)
  process.exit(1)
})
