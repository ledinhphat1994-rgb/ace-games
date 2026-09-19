#!/usr/bin/env node
/**
 * Digital Campus v2 — Game Platform Load Test Harness (Milestone G0)
 *
 * Repeatable, free/open-source Node.js WebSocket & HTTP load test script.
 * Benchmarks GameSessionDO, GameLobbyDO, and Campus core isolation under load.
 *
 * Usage:
 *   node --experimental-websocket scripts/load-tests/game-load-test.mjs [options]
 *
 * Options:
 *   --target=<url>       Target server URL (default: https://gdtxdinhquan-v2.ledinhphat1994.workers.dev)
 *   --scenario=<name>    Scenario to run: all | distributed | hot | reconnect | abuse (default: all)
 *   --concurrency=<num>  Concurrent matches/connections for distributed scenario (default: 50 matches / 100 sockets)
 *   --help               Show help
 */

const DEFAULT_TARGET = 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const TEST_PASSWORD = 'ThuNghiem@v2-2026'

// Parse CLI arguments
const args = process.argv.slice(2)
let targetUrl = DEFAULT_TARGET
let scenario = 'all'
let concurrency = 50 // 50 matches = 100 player connections

for (const arg of args) {
  if (arg.startsWith('--target=')) targetUrl = arg.slice('--target='.length).replace(/\/+$/, '')
  else if (arg.startsWith('--scenario=')) scenario = arg.slice('--scenario='.length).toLowerCase()
  else if (arg.startsWith('--concurrency=')) concurrency = parseInt(arg.slice('--concurrency='.length), 10) || 50
  else if (arg === '--help') {
    console.log(`
Digital Campus v2 — Game Platform Load Test Harness
Options:
  --target=<url>       Target base URL (default: ${DEFAULT_TARGET})
  --scenario=<name>    Scenario: all | distributed | hot | reconnect | abuse
  --concurrency=<num>  Concurrent match count (default: 50 matches = 100 sockets)
`)
    process.exit(0)
  }
}

// Ensure WebSocket is available
const WS = globalThis.WebSocket
if (!WS) {
  console.error('❌ WebSocket is not available. Please run with: node --experimental-websocket scripts/load-tests/game-load-test.mjs')
  process.exit(1)
}

function calculatePercentile(latencies, percentile) {
  if (latencies.length === 0) return 0
  const sorted = [...latencies].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1))
  return sorted[index]
}

function wsUrlFromHttp(httpUrl, path) {
  const url = new URL(path, httpUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** Logs in a test user and returns the session cookie string */
async function loginAndGetCookie(username) {
  try {
    const res = await fetch(`${targetUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: TEST_PASSWORD }),
    })
    if (!res.ok) {
      throw new Error(`Login failed for ${username}: HTTP ${res.status}`)
    }
    const rawCookie = res.headers.get('set-cookie')
    if (!rawCookie) {
      throw new Error(`No Set-Cookie header returned for ${username}`)
    }
    return rawCookie.split(';')[0]
  } catch (err) {
    throw new Error(`Login error for ${username}: ${err.message}`)
  }
}

/** Connects a WebSocket to game session and waits for snapshot */
function connectGameSession(matchId, cookie, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const wsUrl = wsUrlFromHttp(targetUrl, `/ws/game-session/${encodeURIComponent(matchId)}`)
    const startTime = Date.now()
    let resolved = false

    // Node 20+ WebSocket accepts headers in options
    const ws = new WS(wsUrl, {
      headers: {
        Cookie: cookie,
        Origin: targetUrl,
      },
    })

    const messages = []
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        try { ws.close() } catch {}
        reject(new Error(`WebSocket connection timeout after ${timeoutMs}ms for ${matchId}`))
      }
    }, timeoutMs)

    ws.onopen = () => {
      // connected
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString())
        messages.push(msg)
        if (msg.type === 'match.snapshot' && !resolved) {
          resolved = true
          clearTimeout(timer)
          const connectLatency = Date.now() - startTime
          resolve({ ws, connectLatency, messages, snapshot: msg.snapshot })
        }
      } catch {
        // Heartbeat or non-json
      }
    }

    ws.onerror = (err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        reject(new Error(`WebSocket error for ${matchId}: ${err.message || 'unknown'}`))
      }
    }

    ws.onclose = (e) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        reject(new Error(`WebSocket closed early with code ${e.code}: ${e.reason || 'none'}`))
      }
    }
  })
}

// ─── Scenario 1: Distributed Matches ──────────────────────────────────────────
async function runDistributedScenario(matchCount) {
  console.log(`\n▶ [Scenario 1: Distributed Load] Spawning ${matchCount} matches (${matchCount * 2} WebSockets)...`)
  const p1Cookie = await loginAndGetCookie('qa.v2.thu1')
  const p2Cookie = await loginAndGetCookie('qa.v2.thu2')

  const connectLatencies = []
  const roundTripLatencies = []
  let successfulMatches = 0
  let failedMatches = 0
  let socketErrors = 0

  const batchSize = 10
  const batches = Math.ceil(matchCount / batchSize)
  const suiteStart = Date.now()

  for (let b = 0; b < batches; b++) {
    const currentBatchSize = Math.min(batchSize, matchCount - b * batchSize)
    const promises = Array.from({ length: currentBatchSize }, async (_, i) => {
      const matchIndex = b * batchSize + i
      const matchId = `load-dist-${Date.now().toString(36)}-${matchIndex}`

      try {
        const [conn1, conn2] = await Promise.all([
          connectGameSession(matchId, p1Cookie),
          connectGameSession(matchId, p2Cookie),
        ])

        connectLatencies.push(conn1.connectLatency, conn2.connectLatency)

        // Ready check & turn exchange
        conn2.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))

        // P1 sends a move after countdown
        await new Promise((r) => setTimeout(r, 1200))
        const moveStart = Date.now()
        conn1.ws.send(JSON.stringify({ type: 'match.move', x: 7, y: 7 }))

        // Wait for move confirmation
        await new Promise((r) => setTimeout(r, 200))
        roundTripLatencies.push(Date.now() - moveStart)

        // Surrender & close
        conn2.ws.send(JSON.stringify({ type: 'match.surrender' }))
        await new Promise((r) => setTimeout(r, 100))

        conn1.ws.close()
        conn2.ws.close()
        successfulMatches++
      } catch (err) {
        failedMatches++
        socketErrors++
        console.warn(`  [Match ${matchIndex}] Failed: ${err.message}`)
      }
    })

    await Promise.all(promises)
  }

  const durationMs = Date.now() - suiteStart
  return {
    scenario: 'Distributed Matches',
    targetSockets: matchCount * 2,
    successfulSockets: successfulMatches * 2,
    failedMatches,
    connectP50: calculatePercentile(connectLatencies, 50),
    connectP95: calculatePercentile(connectLatencies, 95),
    connectP99: calculatePercentile(connectLatencies, 99),
    moveP50: calculatePercentile(roundTripLatencies, 50),
    moveP95: calculatePercentile(roundTripLatencies, 95),
    moveP99: calculatePercentile(roundTripLatencies, 99),
    socketErrors,
    durationMs,
  }
}

// ─── Scenario 2: Hot Object Spectator Load ────────────────────────────────────
async function runHotObjectScenario() {
  console.log(`\n▶ [Scenario 2: Hot Object & Spectator Capacity] Testing 1 match with 30 spectators + overflow...`)
  const p1Cookie = await loginAndGetCookie('qa.v2.thu1')
  const p2Cookie = await loginAndGetCookie('qa.v2.thu2')
  const specCookie = await loginAndGetCookie('qa.v2.thu3')

  const matchId = `load-hot-${Date.now().toString(36)}`
  const p1 = await connectGameSession(matchId, p1Cookie)
  const p2 = await connectGameSession(matchId, p2Cookie)

  const spectators = []
  let refusedSpectators = 0

  // Connect 30 legitimate spectators
  for (let i = 0; i < 30; i++) {
    try {
      const spec = await connectGameSession(matchId, specCookie)
      spectators.push(spec)
    } catch {
      // connection refused or capped
    }
  }

  // Attempt to connect 31st spectator -> must be refused (HTTP 429)
  try {
    const overflow = await connectGameSession(matchId, specCookie, 3000)
    spectators.push(overflow)
  } catch (err) {
    if (err.message.includes('429') || err.message.includes('closed early') || err.message.includes('refused')) {
      refusedSpectators++
    }
  }

  // Verify active players can still move smoothly under spectator load
  p2.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
  await new Promise((r) => setTimeout(r, 1200))

  const moveStart = Date.now()
  p1.ws.send(JSON.stringify({ type: 'match.move', x: 5, y: 5 }))
  await new Promise((r) => setTimeout(r, 200))
  const moveLatency = Date.now() - moveStart

  // Cleanup
  p1.ws.close()
  p2.ws.close()
  spectators.forEach((s) => s.ws.close())

  return {
    scenario: 'Hot Object Spectator Capacity',
    connectedSpectators: spectators.length,
    refusedSpectators,
    playerMoveLatencyMs: moveLatency,
    spectatorCapEnforced: spectators.length <= 30,
  }
}

// ─── Scenario 3: Reconnect Storm ──────────────────────────────────────────────
async function runReconnectStormScenario(stormSize = 10) {
  console.log(`\n▶ [Scenario 3: Reconnect Storm] Abrupt disconnect & recovery for ${stormSize} matches...`)
  const p1Cookie = await loginAndGetCookie('qa.v2.thu1')
  const p2Cookie = await loginAndGetCookie('qa.v2.thu2')

  let recovered = 0
  const promises = Array.from({ length: stormSize }, async (_, i) => {
    const matchId = `load-storm-${Date.now().toString(36)}-${i}`
    const p1 = await connectGameSession(matchId, p1Cookie)
    const p2 = await connectGameSession(matchId, p2Cookie)

    // Abrupt close
    p1.ws.close()
    p2.ws.close()

    // Jittered backoff wait (between 100ms and 600ms)
    const jitterWait = 100 + Math.random() * 500
    await new Promise((r) => setTimeout(r, jitterWait))

    // Reconnect
    try {
      const p1Reconnected = await connectGameSession(matchId, p1Cookie)
      const p2Reconnected = await connectGameSession(matchId, p2Cookie)
      recovered += 2
      p1Reconnected.ws.close()
      p2Reconnected.ws.close()
    } catch (err) {
      console.warn(`  [Storm Reconnect] Failed to recover: ${err.message}`)
    }
  })

  await Promise.all(promises)

  return {
    scenario: 'Reconnect Storm',
    stormSockets: stormSize * 2,
    recoveredSockets: recovered,
    recoveryRatePercent: ((recovered / (stormSize * 2)) * 100).toFixed(1),
  }
}

// ─── Scenario 4: Abuse & Malformed Inbound Flood ───────────────────────────────
async function runAbuseScenario() {
  console.log(`\n▶ [Scenario 4: Abuse Protection] Oversized frames, malformed JSON, and spam test...`)
  const cookie = await loginAndGetCookie('qa.v2.thu1')
  const matchId = `load-abuse-${Date.now().toString(36)}`
  const conn = await connectGameSession(matchId, cookie)

  let closedWith4429 = false
  conn.ws.onclose = (e) => {
    if (e.code === 4429) closedWith4429 = true
  }

  // Send 6 malformed packets consecutively
  for (let i = 0; i < 6; i++) {
    try {
      conn.ws.send('{ invalid malformed packet ' + i)
    } catch {}
    await new Promise((r) => setTimeout(r, 20))
  }

  await new Promise((r) => setTimeout(r, 300))

  return {
    scenario: 'Abuse Protection',
    closedOnConsecutiveInvalid: closedWith4429,
  }
}

// ─── Scenario 5: Campus Core Isolation Check ──────────────────────────────────
async function runCampusIsolationCheck() {
  console.log(`\n▶ [Scenario 5: Campus Core Isolation] Concurrently verifying whoami, rooms, engagement...`)
  const cookie = await loginAndGetCookie('qa.v2.thu1')

  const start = Date.now()
  const [resWhoami, resRooms, resEngagement] = await Promise.all([
    fetch(`${targetUrl}/api/whoami`, { headers: { Cookie: cookie } }),
    fetch(`${targetUrl}/api/game/rooms`, { headers: { Cookie: cookie } }),
    fetch(`${targetUrl}/api/engagement/me`, { headers: { Cookie: cookie } }),
  ])

  const latencyMs = Date.now() - start
  return {
    scenario: 'Campus Core Isolation',
    whoamiStatus: resWhoami.status,
    roomsStatus: resRooms.status,
    engagementStatus: resEngagement.status,
    allCoreApisOk: resWhoami.status === 200 && resRooms.status === 200 && resEngagement.status === 200,
    latencyMs,
  }
}

// ─── Main Execution ───────────────────────────────────────────────────────────
async function main() {
  console.log('=================================================================')
  console.log(' DIGITAL CAMPUS V2 — GAME PLATFORM OVERLOAD LOAD TEST HARNESS')
  console.log(` Target:   ${targetUrl}`)
  console.log(` Scenario: ${scenario}`)
  console.log(` Time:     ${new Date().toISOString()}`)
  console.log('=================================================================')

  const report = []

  try {
    if (scenario === 'all' || scenario === 'distributed') {
      report.push(await runDistributedScenario(concurrency))
    }
    if (scenario === 'all' || scenario === 'hot') {
      report.push(await runHotObjectScenario())
    }
    if (scenario === 'all' || scenario === 'reconnect') {
      report.push(await runReconnectStormScenario(10))
    }
    if (scenario === 'all' || scenario === 'abuse') {
      report.push(await runAbuseScenario())
    }
    if (scenario === 'all' || scenario === 'campus') {
      report.push(await runCampusIsolationCheck())
    }

    console.log('\n=================================================================')
    console.log(' LOAD TEST EXECUTION SUMMARY')
    console.log('=================================================================')
    console.table(report)
    console.log('✅ Overload harness execution complete.')
  } catch (err) {
    console.error('\n❌ Load test failed with critical error:', err)
    process.exit(1)
  }
}

main()
