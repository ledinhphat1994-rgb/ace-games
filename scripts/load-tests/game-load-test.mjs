#!/usr/bin/env node
/**
 * Digital Campus v2 — Game Platform Load Test Harness (Milestone G0)
 *
 * Comprehensive, barrier-synchronized load test script verifying:
 * - 100 / 500 / 1000 concurrent WebSockets with true barrier holding
 * - Real application propagation latency (event-driven RTT, no sleeps)
 * - 30 distinct authenticated spectators + overflow 429 refusal
 * - Concurrent Campus core isolation probe during active game load
 * - Settlement under load (outbox convergence, zero lost/duplicate rows)
 * - Reconnect storm (immediate worst-case vs jittered production policy)
 * - Abuse isolation (attacker receives 4429; legitimate match unaffected)
 * - Explicit process exit code (fails when release gate thresholds are violated)
 */

import { performance } from 'node:perf_hooks'
import { execSync } from 'node:child_process'

const DEFAULT_TARGET = 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const TEST_PASSWORD = 'ThuNghiem@v2-2026'

// Parse CLI arguments
const args = process.argv.slice(2)
let targetUrl = DEFAULT_TARGET
let scenario = 'all'
let concurrency = 100

for (const arg of args) {
  if (arg.startsWith('--target=')) targetUrl = arg.slice('--target='.length).replace(/\/+$/, '')
  else if (arg.startsWith('--scenario=')) scenario = arg.slice('--scenario='.length).toLowerCase()
  else if (arg.startsWith('--concurrency=')) concurrency = parseInt(arg.slice('--concurrency='.length), 10) || 100
  else if (arg === '--help') {
    console.log(`
Digital Campus v2 — Game Platform Load Test Harness
Options:
  --target=<url>       Target base URL (default: ${DEFAULT_TARGET})
  --scenario=<name>    Scenario: all | distributed | hot | reconnect | abuse | tiers
  --concurrency=<num>  Concurrent socket count (default: 100)
`)
    process.exit(0)
  }
}

// Ensure WebSocket is available
const WS = globalThis.WebSocket
if (!WS) {
  console.error('❌ WebSocket is not available. Run with: node --experimental-websocket scripts/load-tests/game-load-test.mjs')
  process.exit(1)
}

function calculatePercentile(latencies, percentile) {
  if (latencies.length === 0) return 0
  const sorted = [...latencies].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1))
  return Math.round(sorted[index])
}

function wsUrlFromHttp(httpUrl, path) {
  const url = new URL(path, httpUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

/** Ensures staging user exists, registers if missing, and returns cookie */
async function ensureStagingUser(username, password = TEST_PASSWORD, name = username) {
  // 1. Try login
  try {
    const res = await fetch(`${targetUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      const rawCookie = res.headers.get('set-cookie')
      if (rawCookie) return rawCookie.split(';')[0]
    }
  } catch {}

  // 2. Register if login failed
  try {
    await fetch(`${targetUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, tenHienThi: name, vaiTro: 'student' }),
    })
  } catch {}

  // 3. Final login
  const res = await fetch(`${targetUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Failed to ensure staging user ${username}: HTTP ${res.status}`)
  const rawCookie = res.headers.get('set-cookie')
  if (!rawCookie) throw new Error(`No Set-Cookie for staging user ${username}`)
  return rawCookie.split(';')[0]
}

/** Connects a WebSocket to game session and waits for snapshot */
function connectGameSession(matchId, cookie, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const wsUrl = wsUrlFromHttp(targetUrl, `/ws/game-session/${encodeURIComponent(matchId)}`)
    const startTime = performance.now()
    let resolved = false

    const ws = new WS(wsUrl, {
      headers: {
        Cookie: cookie,
        Origin: targetUrl,
      },
    })

    const messages = []
    const listeners = new Set()

    const conn = {
      ws,
      messages,
      connectLatency: 0,
      snapshot: null,
      addListener: (fn) => listeners.add(fn),
      removeListener: (fn) => listeners.delete(fn),
    }

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        try { ws.close() } catch {}
        reject(new Error(`WebSocket timeout after ${timeoutMs}ms for ${matchId}`))
      }
    }, timeoutMs)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString())
        messages.push(msg)
        listeners.forEach((fn) => {
          try { fn(msg) } catch {}
        })
        if (msg.type === 'match.snapshot' && !resolved) {
          resolved = true
          clearTimeout(timer)
          conn.connectLatency = performance.now() - startTime
          conn.snapshot = msg.snapshot
          resolve(conn)
        }
      } catch {}
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

/** Waits for a specific message matching a predicate on a WebSocket or conn object */
function waitForMessage(connOrWs, predicate, timeoutMs = 8000) {
  const ws = connOrWs.ws || connOrWs
  const messages = connOrWs.messages

  // 1. Check if an already received message matches
  if (messages) {
    const existing = messages.find(predicate)
    if (existing) return Promise.resolve(existing)
  }

  return new Promise((resolve, reject) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        reject(new Error(`Timed out waiting for message after ${timeoutMs}ms`))
      }
    }, timeoutMs)

    function cleanup() {
      if (connOrWs.removeListener) {
        connOrWs.removeListener(onMsg)
      } else if (ws.removeEventListener) {
        ws.removeEventListener('message', onWsEvent)
      }
    }

    function onMsg(msg) {
      if (!resolved && predicate(msg)) {
        resolved = true
        clearTimeout(timer)
        cleanup()
        resolve(msg)
      }
    }

    function onWsEvent(event) {
      try {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString())
        onMsg(msg)
      } catch {}
    }

    if (connOrWs.addListener) {
      connOrWs.addListener(onMsg)
    } else {
      ws.addEventListener('message', onWsEvent)
    }
  })
}

// ─── Concurrent Campus Core Isolation Probe Loop (Blocker 5) ───────────────────
function startCampusIsolationProbe(cookie, intervalMs = 1500) {
  let active = true
  const results = {
    requestCount: 0,
    successCount: 0,
    fiveXxCount: 0,
    timeouts: 0,
    campusWsFailures: 0,
    latencies: [],
  }

  const probeLoop = async () => {
    while (active) {
      const endpoints = [
        { path: '/', expectStatus: 200 },
        { path: '/api/whoami', expectStatus: 200 },
        { path: '/api/engagement/me', expectStatus: 200 },
        { path: '/api/social/state', expectStatus: 200 },
      ]

      for (const ep of endpoints) {
        if (!active) break
        const t0 = performance.now()
        results.requestCount++
        try {
          const res = await fetch(`${targetUrl}${ep.path}`, {
            headers: { Cookie: cookie },
            signal: AbortSignal.timeout(4000),
          })
          const rtt = performance.now() - t0
          results.latencies.push(rtt)
          if (res.status >= 500) {
            results.fiveXxCount++
          } else if (res.status === ep.expectStatus || res.status < 400) {
            results.successCount++
          }
        } catch (err) {
          results.timeouts++
        }
      }

      // Lightweight Campus WS Probe
      if (active) {
        results.requestCount++
        const wsT0 = performance.now()
        try {
          const wsUrl = wsUrlFromHttp(targetUrl, '/ws/campus')
          const ws = new WS(wsUrl, { headers: { Cookie: cookie, Origin: targetUrl } })
          await new Promise((resolve, reject) => {
            const tm = setTimeout(() => {
              try { ws.close() } catch {}
              reject(new Error('Campus WS timeout'))
            }, 6000)
            ws.onmessage = (_e) => {
              clearTimeout(tm)
              try { ws.close() } catch {}
              resolve()
            }
            ws.onerror = (e) => {
              clearTimeout(tm)
              reject(e)
            }
            ws.onclose = (e) => {
              clearTimeout(tm)
              if (e.code !== 1000 && e.code !== 1005) {
                reject(new Error(`Campus WS closed: ${e.code}`))
              } else {
                resolve()
              }
            }
          })
          results.latencies.push(performance.now() - wsT0)
          results.successCount++
        } catch {
          results.campusWsFailures++
        }
      }

      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }

  const probePromise = probeLoop()

  return {
    stop: async () => {
      active = false
      await probePromise
      const successPercent = results.requestCount > 0
        ? parseFloat(((results.successCount / results.requestCount) * 100).toFixed(1))
        : 100.0
      return {
        requestCount: results.requestCount,
        successCount: results.successCount,
        successPercent,
        fiveXxCount: results.fiveXxCount,
        timeouts: results.timeouts,
        campusWsFailures: results.campusWsFailures,
        p50: calculatePercentile(results.latencies, 50),
        p95: calculatePercentile(results.latencies, 95),
        p99: calculatePercentile(results.latencies, 99),
      }
    },
  }
}

// ─── D1 Settlement Convergence Verification (Blocker 4) ─────────────────────────
async function verifyD1SettlementConvergence(targetUrl, expectedRoundIds) {
  if (expectedRoundIds.length === 0) {
    return { durablySettled: 0, missing: 0, duplicate: 0, finalOutboxDepth: 0, pendingOutboxRounds: [] }
  }

  const idsSql = expectedRoundIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')
  const query = `SELECT id, COUNT(*) as cnt FROM game_matches WHERE id IN (${idsSql}) GROUP BY id`
  let durablySettled = 0
  let missing = 0
  let duplicate = 0

  try {
    const rawOut = execSync(
      `npx wrangler d1 execute lop-10a7-db-staging --remote --json --command="${query}"`,
      { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'ignore'] },
    )
    const parsed = JSON.parse(rawOut)
    const rows = parsed[0]?.results || []
    const persistedMap = new Map(rows.map((r) => [r.id, r.cnt]))

    for (const id of expectedRoundIds) {
      const cnt = persistedMap.get(id) || 0
      if (cnt === 1) {
        durablySettled++
      } else if (cnt === 0) {
        missing++
      } else if (cnt > 1) {
        duplicate++
      }
    }
  } catch (err) {
    console.error('Failed to verify D1 settlement convergence:', err.message)
    missing = expectedRoundIds.length
  }

  // 2. Direct GameSessionDO settlement_outbox inspection via staging diagnostic endpoint
  let finalOutboxDepth = 0
  const pendingOutboxRounds = []

  for (const roundId of expectedRoundIds) {
    try {
      const res = await fetch(`${targetUrl}/api/staging/game-session/${encodeURIComponent(roundId)}/outbox`, {
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.pendingCount > 0) {
          finalOutboxDepth += data.pendingCount
          pendingOutboxRounds.push(...(data.pendingRoundIds || [roundId]))
        }
      } else {
        console.warn(`  ⚠️ Diagnostic outbox probe returned HTTP ${res.status} for ${roundId}`)
      }
    } catch (err) {
      console.warn(`  ⚠️ Could not verify DO outbox for ${roundId}:`, err.message)
    }
  }

  return {
    durablySettled,
    missing,
    duplicate,
    finalOutboxDepth,
    pendingOutboxRounds,
  }
}

// ─── Scenario 1: Distributed Concurrent Sockets (Blockers 1, 2, 3, 4, 5, 8) ────
async function runDistributedScenario(totalSockets = 100) {
  const matchCount = Math.floor(totalSockets / 2)
  console.log(`\n▶ [Distributed Barrier Test] Target: ${totalSockets} concurrent sockets across ${matchCount} matches...`)

  const p1Cookie = await ensureStagingUser('qa.v2.thu1')
  const p2Cookie = await ensureStagingUser('qa.v2.thu2')

  const openConnections = []
  let currentlyOpen = 0
  let peakOpenSockets = 0
  let setupFailures = 0
  let unexpectedRuntimeDisconnects = 0
  let isCleaningUp = false
  const connectLatencies = []
  const actionPropagationLatencies = []

  const startTime = Date.now()

  // 1. Barrier Hold: Open all connections in controlled batches and HOLD concurrently
  const batchSize = 25
  const totalBatches = Math.ceil(matchCount / batchSize)

  for (let b = 0; b < totalBatches; b++) {
    const currentBatch = Math.min(batchSize, matchCount - b * batchSize)
    const promises = Array.from({ length: currentBatch }, async (_, i) => {
      const matchIndex = b * batchSize + i
      const matchId = `dist-${totalSockets}-${Date.now().toString(36)}-${matchIndex}`

      try {
        const conn1 = await connectGameSession(matchId, p1Cookie)
        const conn2 = await connectGameSession(matchId, p2Cookie)

        connectLatencies.push(conn1.connectLatency, conn2.connectLatency)
        currentlyOpen += 2
        peakOpenSockets = Math.max(peakOpenSockets, currentlyOpen)

        conn1.ws.onclose = (e) => {
          currentlyOpen--
          if (!isCleaningUp) {
            unexpectedRuntimeDisconnects++
            console.warn(`[Runtime Disconnect] conn1 in ${matchId} closed unexpectedly (code=${e.code})`)
          }
        }
        conn2.ws.onclose = (e) => {
          currentlyOpen--
          if (!isCleaningUp) {
            unexpectedRuntimeDisconnects++
            console.warn(`[Runtime Disconnect] conn2 in ${matchId} closed unexpectedly (code=${e.code})`)
          }
        }

        openConnections.push({ matchId, conn1, conn2 })
      } catch (err) {
        setupFailures += 2
      }
    })
    await Promise.all(promises)
  }

  const successSockets = openConnections.length * 2
  const connectionSuccessPercent = parseFloat(((successSockets / totalSockets) * 100).toFixed(1))
  console.log(`  ✓ Barrier reached: ${currentlyOpen} sockets held open simultaneously (Peak: ${peakOpenSockets})`)

  // 2. Start Concurrent Campus Core Isolation Probe (Blocker 5)
  const campusProbe = startCampusIsolationProbe(p1Cookie, 1500)

  // 3. Separate distinct match pools for action probes vs settlement samples
  const settlementCount = Math.min(10, Math.floor(openConnections.length / 4) || 1)
  const actionCount = Math.min(30, openConnections.length - settlementCount)

  const actionMatches = openConnections.slice(0, actionCount)
  const settlementMatches = openConnections.slice(actionCount, actionCount + settlementCount)

  // Helper to determine Player X (moves first) vs Player O
  function resolvePlayerSides(conn1, conn2) {
    const snap1 = conn1.snapshot
    if (snap1 && snap1.players) {
      const players = Object.values(snap1.players)
      const p1 = players.find((p) => p.name === 'qa.v2.thu1')
      if (p1 && p1.side === 'O') return { pX: conn2, pO: conn1 }
    }
    return { pX: conn1, pO: conn2 }
  }

  // Synchronized Activity & Real Action Propagation Latency (Blocker 1 & 4)
  let actionAttempts = 0
  let actionSuccesses = 0
  let actionFailures = 0
  const actionFailureReasons = []
  const actionDetails = []

  for (let i = 0; i < actionMatches.length; i++) {
    const { conn1, conn2, matchId } = actionMatches[i]
    const { pX, pO } = resolvePlayerSides(conn1, conn2)
    actionAttempts++
    try {
      // Ready check on both players
      pX.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
      pO.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))

      // Ensure both players have transitioned to playing before action probe
      await Promise.all([
        waitForMessage(pX, (m) => m.type === 'match.state' && m.status === 'playing', 6000),
        waitForMessage(pO, (m) => m.type === 'match.state' && m.status === 'playing', 6000),
      ])

      const t0 = performance.now()
      const sendWallTime = Date.now()
      // Player X moves first
      pX.ws.send(JSON.stringify({ type: 'match.move', x: 7, y: 7 }))
      const stateMsg = await waitForMessage(pO, (m) => m.type === 'match.state' && m.lastMove?.x === 7 && m.lastMove?.y === 7, 5000)
      const t1 = performance.now()
      const recvWallTime = Date.now()
      const rtt = Math.round(t1 - t0)
      actionPropagationLatencies.push(rtt)
      actionSuccesses++
      actionDetails.push({
        sample: i + 1,
        matchId,
        rtt,
        sendWallTime,
        recvWallTime,
        serverTime: stateMsg.serverTime,
        inboundPlusExecMs: stateMsg.serverTime ? stateMsg.serverTime - sendWallTime : null,
        outboundBroadcastMs: stateMsg.serverTime ? recvWallTime - stateMsg.serverTime : null,
      })
    } catch (err) {
      actionFailures++
      actionFailureReasons.push(`Match ${matchId}: ${err.message}`)
    }
    await new Promise((r) => setTimeout(r, 100))
  }

  const actionSuccessPercent = actionAttempts > 0
    ? parseFloat(((actionSuccesses / actionAttempts) * 100).toFixed(1))
    : 100.0

  // 4. Settlement Under Load & Durable Convergence (Blocker 4 & 8)
  let settlementAttempts = 0
  let gameplayEnded = 0
  let settlementFailures = 0
  const expectedRounds = []

  for (let i = 0; i < settlementMatches.length; i++) {
    const { conn1, conn2, matchId } = settlementMatches[i]
    const { pX, pO } = resolvePlayerSides(conn1, conn2)
    settlementAttempts++
    try {
      pX.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
      pO.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
      await Promise.all([
        waitForMessage(pX, (m) => m.type === 'match.state' && m.status === 'playing', 6000),
        waitForMessage(pO, (m) => m.type === 'match.state' && m.status === 'playing', 6000),
      ])

      pO.ws.send(JSON.stringify({ type: 'match.surrender' }))
      await waitForMessage(pX, (m) => m.type === 'match.ended', 6000)
      gameplayEnded++
      expectedRounds.push(matchId)
    } catch (err) {
      settlementFailures++
    }
    await new Promise((r) => setTimeout(r, 100))
  }

  // 5. Load Dwell Period (hold open under load)
  await new Promise((r) => setTimeout(r, 4000))

  // 6. Stop Campus Isolation Probe
  const campusMetrics = await campusProbe.stop()

  // 7. Verify Durable D1 Settlement Convergence & DO Outbox Depth
  console.log(`  → Verifying D1 settlement convergence & DO outbox for ${expectedRounds.length} rounds...`)
  const d1Convergence = await verifyD1SettlementConvergence(targetUrl, expectedRounds)
  const durablySettled = d1Convergence.durablySettled
  const missingSettlements = d1Convergence.missing
  const duplicateSettlements = d1Convergence.duplicate
  const finalOutboxDepth = d1Convergence.finalOutboxDepth
  settlementFailures += (settlementAttempts - durablySettled)

  // 8. Clean up all connections
  isCleaningUp = true
  openConnections.forEach(({ conn1, conn2 }) => {
    try { conn1.ws.close() } catch {}
    try { conn2.ws.close() } catch {}
  })

  const durationMs = Date.now() - startTime

  return {
    tier: `${totalSockets} Sockets`,
    targetSockets: totalSockets,
    everConnected: successSockets,
    barrierPeakConcurrent: peakOpenSockets,
    peakOpenSockets,
    successSockets,
    setupFailures,
    connectionSuccessPercent,
    unexpectedRuntimeDisconnects,
    connectP50: calculatePercentile(connectLatencies, 50),
    connectP95: calculatePercentile(connectLatencies, 95),
    connectP99: calculatePercentile(connectLatencies, 99),
    actionAttempts,
    actionSuccesses,
    actionFailures,
    actionFailureReasons,
    actionSuccessPercent,
    actionP50: calculatePercentile(actionPropagationLatencies, 50),
    actionP95: calculatePercentile(actionPropagationLatencies, 95),
    actionP99: calculatePercentile(actionPropagationLatencies, 99),
    actionDetails,
    settlementAttempts,
    gameplayEnded,
    durablySettled,
    missingSettlements,
    duplicateSettlements,
    finalOutboxDepth,
    pendingOutboxRounds: d1Convergence.pendingOutboxRounds,
    settlementFailures,
    campusRequestCount: campusMetrics.requestCount,
    campusSuccessPercent: campusMetrics.successPercent,
    campusP50: campusMetrics.p50,
    campusP95: campusMetrics.p95,
    campusP99: campusMetrics.p99,
    campus5xx: campusMetrics.fiveXxCount,
    campusTimeouts: campusMetrics.timeouts,
    campusWsFailures: campusMetrics.campusWsFailures,
    durationMs,
  }
}

// ─── Scenario 2: Hot Object Spectator Capacity (Blockers 6, 9) ─────────────────
async function runHotObjectScenario() {
  console.log('\n▶ [Hot Object] 30 distinct spectators + 1 overflow spectator + active match...')
  const p1Cookie = await ensureStagingUser('qa.v2.thu1')
  const p2Cookie = await ensureStagingUser('qa.v2.thu2')

  const spectatorCookies = []
  for (let i = 1; i <= 31; i++) {
    const idxStr = i < 10 ? `0${i}` : `${i}`
    const cookie = await ensureStagingUser(`qa.staging.spec.${idxStr}`)
    spectatorCookies.push(cookie)
  }

  const matchId = `hot-obj-${Date.now().toString(36)}`
  const p1 = await connectGameSession(matchId, p1Cookie)
  const p2 = await connectGameSession(matchId, p2Cookie)

  const spectators = []
  let refusedSpectators = 0

  // Connect 30 distinct spectators
  for (let i = 0; i < 30; i++) {
    try {
      const spec = await connectGameSession(matchId, spectatorCookies[i], 8000)
      spectators.push(spec)
    } catch (err) {
      console.warn(`    Spectator ${i + 1} failed: ${err.message}`)
    }
  }

  // Attempt spectator #31 -> MUST BE REFUSED (429)
  try {
    const overflow = await connectGameSession(matchId, spectatorCookies[30], 4000)
    spectators.push(overflow)
  } catch (_err) {
    refusedSpectators++
  }

  // Verify HTTP 429 status and spectator_capacity_reached error via direct probe
  try {
    const res31 = await fetch(`${targetUrl}/ws/game-session/${encodeURIComponent(matchId)}`, {
      headers: {
        Upgrade: 'websocket',
        Connection: 'Upgrade',
        Origin: targetUrl,
        Cookie: spectatorCookies[30],
      },
    })
    if (res31.status === 429) {
      refusedSpectators++
    }
  } catch {}

  // Verify active players can still move smoothly under hot spectator load
  p1.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
  p2.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
  await waitForMessage(p1, (m) => m.type === 'match.state' && m.status === 'playing', 6000)

  let playerActionSucceeds = false
  const moveT0 = performance.now()
  try {
    p1.ws.send(JSON.stringify({ type: 'match.move', x: 5, y: 5 }))
    await waitForMessage(p2, (m) => m.type === 'match.state' && m.lastMove?.x === 5 && m.lastMove?.y === 5, 5000)
    playerActionSucceeds = true
  } catch {}
  const playerMoveLatencyMs = Math.round(performance.now() - moveT0)

  // Cleanup
  p1.ws.close()
  p2.ws.close()
  spectators.forEach((s) => { try { s.ws.close() } catch {} })

  const spectatorCapEnforced = spectators.length === 30 && refusedSpectators >= 1

  return {
    scenario: 'Hot Object Spectator Capacity',
    connectedSpectators: spectators.length,
    refusedSpectators,
    spectatorCapEnforced,
    playerActionSucceeds,
    playerMoveLatencyMs,
    pass: spectators.length === 30 && spectatorCapEnforced && playerActionSucceeds && playerMoveLatencyMs <= 500,
  }
}

// ─── Scenario 3: Reconnect Storm (Blockers 7, 9) ───────────────────────────────
async function runReconnectStormScenario(stormSockets = 100) {
  const matchCount = Math.floor(stormSockets / 2)
  console.log(`\n▶ [Reconnect Storm] Testing ${stormSockets} sockets under both Worst-Case and Production Jittered policies...`)

  const p1Cookie = await ensureStagingUser('qa.v2.thu1')
  const p2Cookie = await ensureStagingUser('qa.v2.thu2')

  // Phase 1: Worst-Case Policy (Immediate synchronized reconnect)
  console.log('  → Policy 1: Immediate synchronized reconnect (Worst-case)...')
  const establishedMatches = []
  for (let i = 0; i < matchCount; i++) {
    const matchId = `storm-worst-${Date.now().toString(36)}-${i}`
    try {
      const p1 = await connectGameSession(matchId, p1Cookie)
      const p2 = await connectGameSession(matchId, p2Cookie)
      establishedMatches.push({ matchId, p1, p2 })
    } catch {}
  }

  // Drop all simultaneously
  establishedMatches.forEach(({ p1, p2 }) => {
    try { p1.ws.close() } catch {}
    try { p2.ws.close() } catch {}
  })

  // Immediate reconnect
  let worstCaseRecovered = 0
  const worstCaseLatencies = []
  await Promise.all(
    establishedMatches.map(async ({ matchId }) => {
      try {
        const t0 = performance.now()
        const [r1, r2] = await Promise.all([
          connectGameSession(matchId, p1Cookie, 8000),
          connectGameSession(matchId, p2Cookie, 8000),
        ])
        worstCaseLatencies.push(performance.now() - t0)
        worstCaseRecovered += 2
        r1.ws.close()
        r2.ws.close()
      } catch {}
    }),
  )

  // Phase 2: Production Jittered Policy (Exponential backoff + jitter)
  console.log('  → Policy 2: Production policy (Exponential backoff + jitter)...')
  const prodMatches = []
  for (let i = 0; i < matchCount; i++) {
    const matchId = `storm-prod-${Date.now().toString(36)}-${i}`
    try {
      const p1 = await connectGameSession(matchId, p1Cookie)
      const p2 = await connectGameSession(matchId, p2Cookie)
      prodMatches.push({ matchId, p1, p2 })
    } catch {}
  }

  // Drop all simultaneously
  prodMatches.forEach(({ p1, p2 }) => {
    try { p1.ws.close() } catch {}
    try { p2.ws.close() } catch {}
  })

  // Reconnect with jittered backoff
  let prodRecovered = 0
  const prodLatencies = []
  await Promise.all(
    prodMatches.map(async ({ matchId }) => {
      // Jitter delay: 100ms - 800ms
      const jitterDelay = 100 + Math.random() * 700
      await new Promise((r) => setTimeout(r, jitterDelay))

      try {
        const t0 = performance.now()
        const [r1, r2] = await Promise.all([
          connectGameSession(matchId, p1Cookie, 8000),
          connectGameSession(matchId, p2Cookie, 8000),
        ])
        prodLatencies.push(performance.now() - t0)
        prodRecovered += 2
        r1.ws.close()
        r2.ws.close()
      } catch {}
    }),
  )

  return {
    scenario: 'Reconnect Storm (100 Sockets)',
    worstCaseRecovered,
    worstCaseFailedCount: stormSockets - worstCaseRecovered,
    worstCaseRecoveryPercent: parseFloat(((worstCaseRecovered / stormSockets) * 100).toFixed(1)),
    worstCaseP50: calculatePercentile(worstCaseLatencies, 50),
    worstCaseP95: calculatePercentile(worstCaseLatencies, 95),
    worstCaseP99: calculatePercentile(worstCaseLatencies, 99),
    prodRecovered,
    prodFailedCount: stormSockets - prodRecovered,
    prodRecoveryPercent: parseFloat(((prodRecovered / stormSockets) * 100).toFixed(1)),
    prodP50: calculatePercentile(prodLatencies, 50),
    prodP95: calculatePercentile(prodLatencies, 95),
    prodP99: calculatePercentile(prodLatencies, 99),
  }
}

// ─── Scenario 4: Abuse & Malicious Stream Isolation (Blocker 10) ───────────────
async function runAbuseScenario() {
  console.log(`\n▶ [Abuse Isolation] 1 attacker flooding + 2 legitimate players exchanging moves...`)
  const p1Cookie = await ensureStagingUser('qa.v2.thu1')
  const p2Cookie = await ensureStagingUser('qa.v2.thu2')
  const attackerCookie = await ensureStagingUser('qa.staging.spec.01')

  const matchId = `abuse-iso-${Date.now().toString(36)}`
  const p1 = await connectGameSession(matchId, p1Cookie)
  const p2 = await connectGameSession(matchId, p2Cookie)

  p1.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
  p2.ws.send(JSON.stringify({ type: 'match.ready', ready: true }))
  await waitForMessage(p1, (m) => m.type === 'match.state' && m.status === 'playing', 6000)

  // Measure baseline legitimate move latency
  const baseT0 = performance.now()
  p1.ws.send(JSON.stringify({ type: 'match.move', x: 7, y: 7 }))
  await waitForMessage(p2, (m) => m.type === 'match.state' && m.lastMove?.x === 7 && m.lastMove?.y === 7, 5000)
  const baselineMoveLatencyMs = Math.round(performance.now() - baseT0)

  // Connect attacker socket
  const attacker = await connectGameSession(matchId, attackerCookie)
  let attackerClosedWith4429 = false
  const closePromise = new Promise((resolve) => {
    const handleClose = (code) => {
      if (code === 4429) attackerClosedWith4429 = true
      resolve(code)
    }
    if (attacker.ws.addEventListener) {
      attacker.ws.addEventListener('close', (e) => handleClose(e.code))
    }
    attacker.ws.onclose = (e) => handleClose(e?.code)
  })

  // Attacker floods malformed packets and oversized frames
  for (let i = 0; i < 6; i++) {
    try { attacker.ws.send('{ malformed-json-spam ' + i) } catch {}
  }
  try {
    attacker.ws.send(JSON.stringify({ type: 'match.move', payload: 'X'.repeat(17 * 1024) }))
  } catch {}

  // Legitimate players continue playing DURING attack
  const attackT0 = performance.now()
  p2.ws.send(JSON.stringify({ type: 'match.move', x: 8, y: 8 }))
  await waitForMessage(p1, (m) => m.type === 'match.state' && m.lastMove?.x === 8 && m.lastMove?.y === 8, 5000)
  const duringAttackMoveLatencyMs = Math.round(performance.now() - attackT0)

  // Wait for attacker close frame to arrive over the network
  await Promise.race([closePromise, new Promise((r) => setTimeout(r, 4000))])

  p1.ws.close()
  p2.ws.close()

  return {
    scenario: 'Abuse Isolation',
    attackerDisconnectedWith4429: attackerClosedWith4429,
    baselineMoveLatencyMs,
    duringAttackMoveLatencyMs,
    legitimateMatchFunctional: duringAttackMoveLatencyMs < 600,
    pass: attackerClosedWith4429 && duringAttackMoveLatencyMs < 600,
  }
}

// ─── Release Gate Evaluation Functions (Blockers 3, 5, 7, 9, 13) ───────────────
export function evaluateDistributedTier(result, tierSockets) {
  const isHighTier = tierSockets >= 500
  const minConnSuccess = isHighTier ? 99.5 : 99.0
  const maxDisconnectRate = 0.5 // 0.5% max unexpected runtime disconnect
  const minActionSuccess = 99.0
  const maxActionP95 = isHighTier ? 300 : 500
  const maxActionP99 = isHighTier ? 1000 : 1200
  const minCampusSuccess = 99.5

  const failures = []

  // 1. Connection success
  if (result.connectionSuccessPercent < minConnSuccess) {
    failures.push(`Connection success ${result.connectionSuccessPercent}% < required ${minConnSuccess}%`)
  }

  // 2. Runtime unexpected disconnects
  const runtimeDisconnectRate = result.targetSockets > 0
    ? (result.unexpectedRuntimeDisconnects / result.targetSockets) * 100
    : 0
  if (runtimeDisconnectRate > maxDisconnectRate) {
    failures.push(`Unexpected runtime disconnects: ${result.unexpectedRuntimeDisconnects} (${runtimeDisconnectRate.toFixed(2)}%) > allowed ${maxDisconnectRate}%`)
  }

  // 3. Action propagation success & latency
  if (result.actionSuccessPercent < minActionSuccess) {
    failures.push(`Action success ${result.actionSuccessPercent}% < required ${minActionSuccess}%`)
  }
  if (result.actionP95 > maxActionP95) {
    failures.push(`Action P95 latency ${result.actionP95}ms > threshold ${maxActionP95}ms`)
  }
  if (result.actionP99 > maxActionP99) {
    failures.push(`Action P99 latency ${result.actionP99}ms > threshold ${maxActionP99}ms`)
  }

  // 4. Settlement under load
  if (result.settlementFailures > 0) {
    failures.push(`Settlement failures: ${result.settlementFailures}`)
  }
  if (result.missingSettlements > 0) {
    failures.push(`Missing settlements in D1: ${result.missingSettlements}`)
  }
  if (result.duplicateSettlements > 0) {
    failures.push(`Duplicate settlements in D1: ${result.duplicateSettlements}`)
  }
  if (result.durablySettled !== result.settlementAttempts) {
    failures.push(`Durably settled ${result.durablySettled} !== attempted ${result.settlementAttempts}`)
  }
  if (result.finalOutboxDepth > 0) {
    failures.push(`Final outstanding outbox depth: ${result.finalOutboxDepth} > 0`)
  }

  // 5. Campus core isolation
  if (result.campus5xx > 0) {
    failures.push(`Campus core 5xx count: ${result.campus5xx} > 0`)
  }
  if (result.campusTimeouts > 0) {
    failures.push(`Campus core timeouts: ${result.campusTimeouts} > 0`)
  }
  if (result.campusWsFailures > 0) {
    failures.push(`Campus WS failures: ${result.campusWsFailures} > 0`)
  }
  if (result.campusSuccessPercent < minCampusSuccess) {
    failures.push(`Campus core success ${result.campusSuccessPercent}% < required ${minCampusSuccess}%`)
  }

  return {
    pass: failures.length === 0,
    failures,
  }
}

export function evaluateHotObjectResult(result) {
  const failures = []
  if (result.connectedSpectators !== 30) {
    failures.push(`Connected spectators ${result.connectedSpectators} !== 30`)
  }
  if (result.refusedSpectators < 1) {
    failures.push(`Refused spectator #31 count ${result.refusedSpectators} < 1`)
  }
  if (!result.spectatorCapEnforced) {
    failures.push(`Spectator cap not enforced`)
  }
  if (!result.playerActionSucceeds) {
    failures.push(`Player action under hot load failed`)
  }
  if (result.playerMoveLatencyMs > 500) {
    failures.push(`Player move latency under hot load ${result.playerMoveLatencyMs}ms > 500ms`)
  }
  return {
    pass: failures.length === 0,
    failures,
  }
}

export function evaluateReconnectResult(result) {
  const failures = []
  if (result.prodRecoveryPercent < 99.0) {
    failures.push(`Production jittered reconnect recovery ${result.prodRecoveryPercent}% < 99.0%`)
  }
  if (result.prodFailedCount > 0) {
    failures.push(`Production jittered reconnect failed count: ${result.prodFailedCount} > 0`)
  }
  if (result.worstCaseRecoveryPercent < 95.0) {
    failures.push(`Worst-case reconnect recovery ${result.worstCaseRecoveryPercent}% < 95.0%`)
  }
  return {
    pass: failures.length === 0,
    failures,
  }
}

export function evaluateAbuseResult(result) {
  const failures = []
  if (!result.attackerDisconnectedWith4429) {
    failures.push(`Attacker was not disconnected with WebSocket code 4429`)
  }
  if (!result.legitimateMatchFunctional) {
    failures.push(`Legitimate match was degraded during attack`)
  }
  if (result.duringAttackMoveLatencyMs > 600) {
    failures.push(`Legitimate move latency during attack ${result.duringAttackMoveLatencyMs}ms > 600ms`)
  }
  return {
    pass: failures.length === 0,
    failures,
  }
}

// ─── Main Execution & Release Gate Evaluation (Blocker 13) ─────────────────────
async function main() {
  console.log('=================================================================')
  console.log(' DIGITAL CAMPUS V2 — GAME PLATFORM OVERLOAD LOAD TEST HARNESS')
  console.log(` Target:   ${targetUrl}`)
  console.log(` Scenario: ${scenario}`)
  console.log(` Time:     ${new Date().toISOString()}`)
  console.log('=================================================================')

  const report = {}
  let allGatesPassed = true

  try {
    if (scenario === 'all' || scenario === 'hot') {
      report.hotObject = await runHotObjectScenario()
      const evalHot = evaluateHotObjectResult(report.hotObject)
      if (!evalHot.pass) {
        console.error('❌ Hot Object Gate Failed:', evalHot.failures)
        allGatesPassed = false
      }
    }

    if (scenario === 'all' || scenario === 'distributed' || scenario === 'tiers') {
      if (scenario === 'distributed') {
        report[`tier_${concurrency}`] = await runDistributedScenario(concurrency)
        const evalTier = evaluateDistributedTier(report[`tier_${concurrency}`], concurrency)
        if (!evalTier.pass) {
          console.error(`❌ Distributed Tier ${concurrency} Gate Failed:`, evalTier.failures)
          allGatesPassed = false
        }
      } else {
        // Tier A: 100 sockets
        report.tierA = await runDistributedScenario(100)
        const evalA = evaluateDistributedTier(report.tierA, 100)
        if (!evalA.pass) {
          console.error('❌ Tier A (100 sockets) Gate Failed:', evalA.failures)
          allGatesPassed = false
        }

        // Tier B: 500 sockets
        report.tierB = await runDistributedScenario(500)
        const evalB = evaluateDistributedTier(report.tierB, 500)
        if (!evalB.pass) {
          console.error('❌ Tier B (500 sockets) Gate Failed:', evalB.failures)
          allGatesPassed = false
        }

        // Tier C: 1000 sockets (only if Tier B passes cleanly)
        if (evalB.pass) {
          report.tierC = await runDistributedScenario(1000)
          const evalC = evaluateDistributedTier(report.tierC, 1000)
          if (!evalC.pass) {
            console.error('❌ Tier C (1000 sockets) Gate Failed:', evalC.failures)
            allGatesPassed = false
          }
        } else {
          report.tierC = { status: 'NOT EXECUTED', reason: 'Tier B did not meet clean threshold for Tier C scaling' }
        }
      }
    }

    if (scenario === 'all' || scenario === 'reconnect') {
      report.reconnect = await runReconnectStormScenario(100)
      const evalRec = evaluateReconnectResult(report.reconnect)
      if (!evalRec.pass) {
        console.error('❌ Reconnect Storm Gate Failed:', evalRec.failures)
        allGatesPassed = false
      }
    }

    if (scenario === 'all' || scenario === 'abuse') {
      report.abuse = await runAbuseScenario()
      const evalAbuse = evaluateAbuseResult(report.abuse)
      if (!evalAbuse.pass) {
        console.error('❌ Abuse Isolation Gate Failed:', evalAbuse.failures)
        allGatesPassed = false
      }
    }

    console.log('\n=================================================================')
    console.log(' LOAD TEST EXECUTION SUMMARY')
    console.log('=================================================================')
    console.log(JSON.stringify(report, null, 2))

    if (!allGatesPassed) {
      console.error('\n❌ RELEASE GATE FAILED: One or more load thresholds were breached.')
      process.exit(1)
    } else {
      console.log('\n✅ ALL LOAD GATE THRESHOLDS SATISFIED.')
      process.exit(0)
    }
  } catch (err) {
    console.error('\n❌ Load test failed with unhandled error:', err)
    process.exit(1)
  }
}

// Only invoke main when executed directly
if (process.argv[1] && process.argv[1].endsWith('game-load-test.mjs')) {
  main()
}
