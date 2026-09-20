import { createSnakeState, stepSnake, applySnakeDirection, replaySnakeSession, isOppositeDirection } from '../shared/games/snake/index.js'

const TARGET = process.env.TARGET_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'

/**
 * Generate a deterministic trace that navigates to the first food,
 * eats it (score = 10), and then collides with a wall.
 */
function solveFirstFoodAndDie(seed) {
  const { state, rng } = createSnakeState(seed)
  const inputTrace = []

  // BFS from (startX, startY) to target (tx, ty) on 15x15 grid avoiding snake body
  function getNextDirection(target) {
    const head = state.snake[0]
    const queue = [[head.x, head.y, []]]
    const visited = new Set([`${head.x},${head.y}`])

    // Body segments except tail (which moves)
    const obstacles = new Set(state.snake.slice(0, -1).map(p => `${p.x},${p.y}`))

    const moves = [
      { dir: 'up', dx: 0, dy: -1 },
      { dir: 'down', dx: 0, dy: 1 },
      { dir: 'left', dx: -1, dy: 0 },
      { dir: 'right', dx: 1, dy: 0 },
    ]

    while (queue.length > 0) {
      const [cx, cy, path] = queue.shift()
      if (cx === target.x && cy === target.y) {
        return path[0] || state.dir
      }

      for (const m of moves) {
        const nx = cx + m.dx
        const ny = cy + m.dy
        const key = `${nx},${ny}`

        // In bounds
        if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15) {
          if (!visited.has(key) && !obstacles.has(key)) {
            // Can't reverse immediately from current state direction at step 0
            if (path.length === 0 && isOppositeDirection(state.dir, m.dir)) {
              continue
            }
            visited.add(key)
            queue.push([nx, ny, [...path, m.dir]])
          }
        }
      }
    }
    return state.dir
  }

  // 1. Move to food and eat 2 foods (score = 20)
  let steps = 0
  while (!state.isDead && state.score < 20 && steps < 200) {
    steps++
    const desiredDir = getNextDirection(state.food)
    if (desiredDir !== state.dir) {
      inputTrace.push({ t: state.elapsedMs + 10, k: 'snake.turn', p: desiredDir })
      applySnakeDirection(state, desiredDir)
    }
    stepSnake(state, rng)
  }

  if (state.score < 20) {
    throw new Error(`Failed to eat 2 foods within 200 steps for seed ${seed}`)
  }

  // 2. Now drive into wall to terminate cleanly
  while (!state.isDead && steps < 300) {
    steps++
    // Keep current direction until wall collision
    stepSnake(state, rng)
  }

  inputTrace.push({ t: state.elapsedMs + 10, k: 'match.end', p: { reason: 'game_over' } })

  // Verify trace locally
  const replay = replaySnakeSession({
    seed,
    inputTrace,
    maxElapsedMs: state.elapsedMs + 5000,
  })

  if (!replay.valid || replay.computedScore !== 20 || replay.terminalReason !== 'wall_collision') {
    throw new Error(`Local replay mismatch: valid=${replay.valid}, score=${replay.computedScore}, terminalReason=${replay.terminalReason}`)
  }

  return { inputTrace, durationMs: state.elapsedMs, expectedScore: 20 }
}

async function main() {
  console.log('========================================================')
  console.log(`G1 SNAKE DELUXE — LIVE STAGING CANARY VERIFICATION`)
  console.log(`Target: ${TARGET}`)
  console.log('========================================================')

  const ts = Date.now()
  const username = `canary_g1_${ts}`
  const password = 'CanaryPassword123!'

  console.log(`\n[Canary Setup] Registering & logging in user: ${username}...`)
  const rReg = await fetch(`${TARGET}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, tenHienThi: 'G1 Canary Tester', vaiTro: 'student' }),
  })
  if (!rReg.ok) throw new Error(`Registration failed: ${rReg.status}`)

  const rLogin = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!rLogin.ok) throw new Error(`Login failed: ${rLogin.status}`)
  const cookie = rLogin.headers.get('set-cookie')?.split(';')[0]
  if (!cookie) throw new Error('Missing auth cookie')
  console.log('✅ Auth cookie acquired successfully.')

  // CANARY 1: Positive-Score Verified Run
  console.log('\n--- CANARY 1: Positive-Score Authoritative Deterministic Run ---')
  const rStart1 = await fetch(`${TARGET}/api/game/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ gameType: 'solo_snake' }),
  })
  if (!rStart1.ok) throw new Error(`Session start failed: ${rStart1.status}`)
  const dataStart1 = await rStart1.json()
  console.log(`Started session: ${dataStart1.sessionId}, seed: ${dataStart1.seed}`)

  const { inputTrace, durationMs, expectedScore } = solveFirstFoodAndDie(dataStart1.seed)
  console.log(`Generated deterministic trace: ${inputTrace.length} events, duration: ${durationMs}ms, expectedScore: ${expectedScore}`)

  // Wait a moment so server duration is at least 1s
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const rFinish1 = await fetch(`${TARGET}/api/game/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      sessionId: dataStart1.sessionId,
      score: expectedScore,
      durationMs,
      inputTrace,
    }),
  })
  if (!rFinish1.ok) throw new Error(`Finish failed: ${rFinish1.status} ${await rFinish1.text()}`)
  const dataFinish1 = await rFinish1.json()
  console.log(`Finish response:`, JSON.stringify(dataFinish1))

  if (!dataFinish1.ok || !dataFinish1.verified || dataFinish1.finalScore !== 20) {
    throw new Error(`Canary 1 FAILED: expected verified=true, finalScore=20, got ${JSON.stringify(dataFinish1)}`)
  }
  console.log('✅ Canary 1 Passed: Authoritative score 20 verified deterministically.')

  // Check verified highscores
  console.log('\n--- CANARY 1b: Verified Highscores Check ---')
  const rLb = await fetch(`${TARGET}/api/game/highscores?gameType=solo_snake&verifiedOnly=1`, {
    headers: { Cookie: cookie },
  })
  if (!rLb.ok) throw new Error(`Highscores fetch failed: ${rLb.status}`)
  const dataLb = await rLb.json()
  console.log(`Highscores entries: ${dataLb.highscores?.length || 0}`)
  const userEntry = dataLb.highscores?.find((e) => e.playerName === 'G1 Canary Tester' || e.playerName === username)
  if (!userEntry || userEntry.score < 20) {
    throw new Error(`Canary 1b FAILED: user entry not found on verified highscores with score >= 20: ${JSON.stringify(dataLb.highscores)}`)
  }
  console.log(`✅ Canary 1b Passed: Verified highscore shows playerName=${userEntry.playerName}, score=${userEntry.score}, verified=${userEntry.verified}`)

  // CANARY 2: Anti-Cheat Forged Score Tamper Resistance
  console.log('\n--- CANARY 2: Forged Score (999,999) Override ---')
  const rStart2 = await fetch(`${TARGET}/api/game/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ gameType: 'solo_snake' }),
  })
  const dataStart2 = await rStart2.json()

  // Wait 1.2s for server elapsed
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Snake starts dir='up' at y=7, hits wall at y=-1 in 8 steps (1200ms)
  const dyingTrace = [
    { t: 1300, k: 'match.end', p: { reason: 'game_over' } }
  ]
  const rFinish2 = await fetch(`${TARGET}/api/game/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      sessionId: dataStart2.sessionId,
      score: 999999,
      durationMs: 1500,
      inputTrace: dyingTrace,
    }),
  })
  console.log(`Forged score finish status: ${rFinish2.status}`)
  const dataFinish2 = await rFinish2.json()
  console.log(`Forged score response:`, JSON.stringify(dataFinish2))
  if (dataFinish2.finalScore === 999999) {
    throw new Error(`Canary 2 FAILED: Server accepted forged score 999999!`)
  }
  console.log(`✅ Canary 2 Passed: Forged score 999999 overridden to ${dataFinish2.finalScore}`)

  // CANARY 3: Duplicate Finish Rejection (409 Conflict)
  console.log('\n--- CANARY 3: Duplicate Finish 409 Conflict ---')
  const rDup = await fetch(`${TARGET}/api/game/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      sessionId: dataStart1.sessionId,
      score: 20,
      durationMs,
      inputTrace,
    }),
  })
  console.log(`Duplicate finish status: ${rDup.status}`)
  if (rDup.status !== 409) {
    throw new Error(`Canary 3 FAILED: expected 409 Conflict, got ${rDup.status}`)
  }
  console.log('✅ Canary 3 Passed: Duplicate finish strictly rejected with 409 Conflict.')

  // CANARY 4: Abort on Hidden Tab
  console.log('\n--- CANARY 4: Hidden Tab Abort Convergence ---')
  const rStart4 = await fetch(`${TARGET}/api/game/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ gameType: 'solo_snake' }),
  })
  const dataStart4 = await rStart4.json()

  const rFinish4 = await fetch(`${TARGET}/api/game/session/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      sessionId: dataStart4.sessionId,
      score: 0,
      durationMs: 600,
      inputTrace: [{ t: 200, k: 'match.end', p: { reason: 'aborted' } }],
    }),
  })
  const dataFinish4 = await rFinish4.json()
  console.log(`Abort response:`, JSON.stringify(dataFinish4))
  if (dataFinish4.verified !== false || dataFinish4.finalScore !== 0) {
    throw new Error(`Canary 4 FAILED: expected verified=false and finalScore=0 for aborted session`)
  }
  console.log('✅ Canary 4 Passed: Aborted session cleanly rejected from verification with score 0.')

  console.log('\n========================================================')
  console.log('🎉 ALL G1 STAGING CANARY VERIFICATION CHECKS PASSED!')
  console.log('========================================================')
}

main().catch((err) => {
  console.error('❌ Canary Script Failed:', err)
  process.exit(1)
})
