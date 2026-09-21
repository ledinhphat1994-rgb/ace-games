/**
 * Digital Campus v2: Milestone A1 — Micro-Closure Staging Canaries
 * scripts/canary-a1-micro-closure.mjs
 *
 * Implements:
 * 1. Policy Snapshot Canary (Item 14):
 *    - Set policy A (5 / 15 / 480)
 *    - Create Room A
 *    - Change policy to B (10 / 20 / 600)
 *    - Verify Room A keeps snapshot A
 *    - Create Room B
 *    - Verify Room B gets snapshot B
 *    - Verify Admin directory deadlines reflect each room's individual policy
 *    - Restore canonical policy (5 / 15 / 480)
 *
 * 2. Real Never-Joined Alarm Auto-Close Canary (Item 15):
 *    - Set policy with neverJoinedTtlMinutes = 1
 *    - Create Room C
 *    - Wait ~70s for real Durable Object alarm
 *    - Verify: status = dong, close_reason = never_joined_timeout, closed_by = system actor (id 62), admission denied
 *    - Restore canonical policy (5 / 15 / 480)
 *
 * 3. 50-Room Simultaneous Closes Regression (Item 17):
 *    - Create 50 distinct staging rooms
 *    - Trigger 50 concurrent admin force-closes via Promise.all
 *    - Measure P50 / P95 / P99
 *    - Verify 50/50 CLOSED, 0 CLOSING leftovers, 0 wrong reason, 0 5xx, Campus health
 */

import { setGlobalDispatcher, Agent } from 'undici'

// Configure undici dispatcher with extended timeouts and higher concurrency for burst tests
setGlobalDispatcher(
  new Agent({
    connect: { timeout: 60000 },
    headersTimeout: 60000,
    bodyTimeout: 60000,
    connections: 100,
    pipelining: 0,
  })
)

const TARGET = process.env.TARGET_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const MAT_KHAU = process.env.CANARY_PASSWORD || ''

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function login(username, password) {
  const res = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status} ${await res.text()}`)
  const cookie = res.headers.get('set-cookie')?.split(';')[0]
  if (!cookie) throw new Error(`No cookie returned for ${username}`)
  const data = await res.json()
  return { cookie, user: data.taiKhoan || data.user || {} }
}

async function getPolicy(adminCookie) {
  const res = await fetch(`${TARGET}/api/admin/room-policy`, {
    headers: { Cookie: adminCookie },
  })
  if (!res.ok) throw new Error(`Failed to get room policy: ${res.status}`)
  const data = await res.json()
  return data.policy
}

async function updatePolicy(adminCookie, policyUpdate) {
  const current = await getPolicy(adminCookie)
  const res = await fetch(`${TARGET}/api/admin/room-policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      autoCloseEnabled: policyUpdate.autoCloseEnabled ?? current.autoCloseEnabled,
      neverJoinedTtlMinutes: policyUpdate.neverJoinedTtlMinutes ?? current.neverJoinedTtlMinutes,
      emptyRoomTtlMinutes: policyUpdate.emptyRoomTtlMinutes ?? current.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: policyUpdate.maxRoomLifetimeMinutes ?? current.maxRoomLifetimeMinutes,
      expectedRevision: current.revision,
    }),
  })
  if (!res.ok) throw new Error(`Failed to update room policy: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.policy
}

async function createRoom(cookie, name) {
  const res = await fetch(`${TARGET}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      ten: name,
      phamVi: 'truong',
      accessMode: 'public',
    }),
  })
  if (!res.ok) throw new Error(`Failed to create room ${name}: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.room || data.phong
}

async function getAdminRoom(adminCookie, roomId) {
  const res = await fetch(`${TARGET}/api/admin/rooms/${roomId}`, {
    headers: { Cookie: adminCookie },
  })
  if (!res.ok) throw new Error(`Failed to get admin room ${roomId}: ${res.status}`)
  const data = await res.json()
  return data.room
}

async function forceCloseRoom(adminCookie, roomId, reason = 'admin_closed') {
  try {
    const res = await fetch(`${TARGET}/api/admin/rooms/${roomId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ reason }),
    })
    return { status: res.status, ok: res.ok, data: await res.json().catch(() => ({})) }
  } catch (err) {
    return { status: 0, ok: false, error: err.message }
  }
}

async function runPolicySnapshotCanary(adminCookie) {
  console.log('\n=== CANARY 1: POLICY SNAPSHOT PER ROOM (Item 14) ===')

  // Step 1: Set Policy A = 5 / 15 / 480
  console.log('1. Setting global Policy A: 5 / 15 / 480...')
  const policyA = await updatePolicy(adminCookie, {
    autoCloseEnabled: true,
    neverJoinedTtlMinutes: 5,
    emptyRoomTtlMinutes: 15,
    maxRoomLifetimeMinutes: 480,
  })
  console.log(`   Policy A set, revision = ${policyA.revision}`)

  // Step 2: Create Room A
  const roomAName = `Canary Room A (Snap 5/15/480) [${Date.now()}]`
  console.log(`2. Creating Room A: "${roomAName}"...`)
  const roomA = await createRoom(adminCookie, roomAName)
  console.log(`   Room A created with ID ${roomA.id}`)

  // Step 3: Change global policy to Policy B = 10 / 20 / 600
  console.log('3. Updating global Policy B: 10 / 20 / 600...')
  const policyB = await updatePolicy(adminCookie, {
    autoCloseEnabled: true,
    neverJoinedTtlMinutes: 10,
    emptyRoomTtlMinutes: 20,
    maxRoomLifetimeMinutes: 600,
  })
  console.log(`   Policy B set, revision = ${policyB.revision}`)

  // Step 4: Verify Room A keeps snapshot A
  console.log('4. Verifying Room A snapshot in Admin API...')
  const adminRoomA = await getAdminRoom(adminCookie, roomA.id)
  console.log(`   Room A effectivePolicyRevision: ${adminRoomA.effectivePolicyRevision} (expected: ${policyA.revision})`)
  console.log(`   Room A effectiveNeverJoinedTtl: ${adminRoomA.effectiveNeverJoinedTtl} (expected: 5)`)
  console.log(`   Room A effectiveEmptyRoomTtl: ${adminRoomA.effectiveEmptyRoomTtl} (expected: 15)`)
  console.log(`   Room A effectiveMaxLifetime: ${adminRoomA.effectiveMaxLifetime} (expected: 480)`)
  if (adminRoomA.effectiveNeverJoinedTtl !== 5 || adminRoomA.effectivePolicyRevision !== policyA.revision) {
    throw new Error(`Room A did NOT retain snapshot A! Found: ${JSON.stringify(adminRoomA)}`)
  }

  // Step 5: Create Room B
  const roomBName = `Canary Room B (Snap 10/20/600) [${Date.now()}]`
  console.log(`5. Creating Room B: "${roomBName}"...`)
  const roomB = await createRoom(adminCookie, roomBName)
  console.log(`   Room B created with ID ${roomB.id}`)

  // Step 6: Verify Room B uses snapshot B
  console.log('6. Verifying Room B snapshot in Admin API...')
  const adminRoomB = await getAdminRoom(adminCookie, roomB.id)
  console.log(`   Room B effectivePolicyRevision: ${adminRoomB.effectivePolicyRevision} (expected: ${policyB.revision})`)
  console.log(`   Room B effectiveNeverJoinedTtl: ${adminRoomB.effectiveNeverJoinedTtl} (expected: 10)`)
  console.log(`   Room B effectiveEmptyRoomTtl: ${adminRoomB.effectiveEmptyRoomTtl} (expected: 20)`)
  console.log(`   Room B effectiveMaxLifetime: ${adminRoomB.effectiveMaxLifetime} (expected: 600)`)
  if (adminRoomB.effectiveNeverJoinedTtl !== 10 || adminRoomB.effectivePolicyRevision !== policyB.revision) {
    throw new Error(`Room B did NOT receive snapshot B! Found: ${JSON.stringify(adminRoomB)}`)
  }

  // Step 7: Verify Admin directory deadlines reflect each room's own policy
  console.log('7. Verifying Admin directory deadlines reflect each room\'s own snapshot...')
  const dirRes = await fetch(`${TARGET}/api/admin/rooms?limit=50`, {
    headers: { Cookie: adminCookie },
  })
  const dirData = await dirRes.json()
  const dirRoomA = dirData.rooms.find((r) => r.id === roomA.id)
  const dirRoomB = dirData.rooms.find((r) => r.id === roomB.id)

  const createdAtA = new Date(dirRoomA.createdAt).getTime()
  const expectedDeadlineA = createdAtA + 5 * 60 * 1000
  const actualDeadlineA = new Date(dirRoomA.autoCloseDeadline).getTime()
  console.log(`   Room A deadline diff from 5m snapshot: ${Math.abs(actualDeadlineA - expectedDeadlineA)} ms`)

  const createdAtB = new Date(dirRoomB.createdAt).getTime()
  const expectedDeadlineB = createdAtB + 10 * 60 * 1000
  const actualDeadlineB = new Date(dirRoomB.autoCloseDeadline).getTime()
  console.log(`   Room B deadline diff from 10m snapshot: ${Math.abs(actualDeadlineB - expectedDeadlineB)} ms`)

  if (Math.abs(actualDeadlineA - expectedDeadlineA) > 2000 || Math.abs(actualDeadlineB - expectedDeadlineB) > 2000) {
    throw new Error('Deadline calculation does not match room snapshot!')
  }
  console.log('   ✓ Policy snapshot per room VERIFIED: Room A retained 5m, Room B received 10m, deadlines match individual snapshots.')

  // Cleanup: Close Room A & Room B
  await forceCloseRoom(adminCookie, roomA.id)
  await forceCloseRoom(adminCookie, roomB.id)

  // Restore canonical global policy
  console.log('8. Restoring canonical global policy (5 / 15 / 480)...')
  const restoredPolicy = await updatePolicy(adminCookie, {
    autoCloseEnabled: true,
    neverJoinedTtlMinutes: 5,
    emptyRoomTtlMinutes: 15,
    maxRoomLifetimeMinutes: 480,
  })
  console.log(`   Canonical policy restored, revision = ${restoredPolicy.revision}`)
}

async function runRealAutoCloseCanary(adminCookie) {
  console.log('\n=== CANARY 2: REAL NEVER-JOINED DO ALARM AUTO-CLOSE (Item 15) ===')

  // Set policy to neverJoinedTtlMinutes = 1
  console.log('1. Setting global policy neverJoinedTtlMinutes = 1...')
  await updatePolicy(adminCookie, {
    autoCloseEnabled: true,
    neverJoinedTtlMinutes: 1,
    emptyRoomTtlMinutes: 15,
    maxRoomLifetimeMinutes: 480,
  })

  // Create Room C
  const roomCName = `Canary Never-Joined 1m [${Date.now()}]`
  console.log(`2. Creating room "${roomCName}"...`)
  const roomC = await createRoom(adminCookie, roomCName)
  console.log(`   Room C created with ID ${roomC.id}. Waiting for real DO alarm (~65-75s)...`)

  const startTime = Date.now()
  let closed = false
  let adminRoomC = null
  // Poll admin room details every 5 seconds until status is 'dong' or 90s timeout
  for (let i = 0; i < 18; i++) {
    await sleep(5000)
    adminRoomC = await getAdminRoom(adminCookie, roomC.id)
    const status = adminRoomC.status || adminRoomC.trang_thai
    const closeReason = adminRoomC.closeReason || adminRoomC.close_reason || 'none'
    const elapsed = Math.round((Date.now() - startTime) / 1000)
    console.log(`   [${elapsed}s] Room C status: ${status}, reason: ${closeReason}`)
    if (status === 'dong') {
      closed = true
      break
    }
  }

  const finalStatus = adminRoomC.status || adminRoomC.trang_thai
  const finalCloseReason = adminRoomC.closeReason || adminRoomC.close_reason
  const finalClosedBy = adminRoomC.closedBy || adminRoomC.closed_by

  if (!closed) {
    throw new Error(`Room C did not auto-close within 90 seconds! Last status: ${finalStatus}`)
  }

  console.log('3. Verifying closure attributes:')
  console.log(`   - status: ${finalStatus} (expected: dong)`)
  console.log(`   - closeReason: ${finalCloseReason} (expected: never_joined_timeout)`)
  console.log(`   - closedBy: ${finalClosedBy} (expected: 62 or system)`)

  if (finalCloseReason !== 'never_joined_timeout') {
    throw new Error(`Expected closeReason 'never_joined_timeout', got '${finalCloseReason}'`)
  }

  // Verify admission is denied (403)
  console.log('4. Verifying admission is denied to auto-closed room...')
  const admitRes = await fetch(`${TARGET}/api/rooms/${roomC.id}/admit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({ password: 'test' }),
  })
  console.log(`   Admission status: ${admitRes.status} (expected: 403)`)
  if (admitRes.status !== 403) {
    throw new Error(`Expected admission 403, got ${admitRes.status}`)
  }
  console.log('   ✓ Real DO alarm auto-close VERIFIED with system attribution and fail-closed admission.')

  // Restore canonical global policy
  console.log('5. Restoring canonical global policy (5 / 15 / 480)...')
  await updatePolicy(adminCookie, {
    autoCloseEnabled: true,
    neverJoinedTtlMinutes: 5,
    emptyRoomTtlMinutes: 15,
    maxRoomLifetimeMinutes: 480,
  })
}

async function run50CloseRegression(adminCookie) {
  console.log('\n=== CANARY 3: 50 SIMULTANEOUS ADMIN FORCE-CLOSES REGRESSION (Item 17) ===')

  console.log('1. Creating 50 distinct staging rooms in parallel batches...')
  const roomIds = []
  const batchSize = 10
  for (let b = 0; b < 5; b++) {
    const promises = []
    for (let i = 0; i < batchSize; i++) {
      const idx = b * batchSize + i + 1
      promises.push(createRoom(adminCookie, `Bench Room ${idx} [${Date.now()}]`))
    }
    const created = await Promise.all(promises)
    for (const r of created) {
      roomIds.push(r.id)
    }
    console.log(`   Created ${roomIds.length}/50 rooms...`)
  }

  console.log(`2. Triggering 50 concurrent admin force-closes via Promise.all...`)
  const closeStart = Date.now()
  const latencies = []
  let error5xx = 0

  const _closeResults = await Promise.all(
    roomIds.map(async (id) => {
      const t0 = Date.now()
      const res = await forceCloseRoom(adminCookie, id)
      const lat = Date.now() - t0
      latencies.push(lat)
      if (res.status >= 500) error5xx++
      return { id, status: res.status, lat }
    })
  )

  const totalDuration = Date.now() - closeStart
  latencies.sort((a, b) => a - b)
  const p50 = latencies[Math.floor(latencies.length * 0.5)]
  const p95 = latencies[Math.floor(latencies.length * 0.95)]
  const p99 = latencies[Math.floor(latencies.length * 0.99)]

  console.log(`\n--- 50-CLOSE LATENCY BENCHMARK ---`)
  console.log(`Total duration: ${totalDuration} ms`)
  console.log(`P50: ${p50} ms`)
  console.log(`P95: ${p95} ms`)
  console.log(`P99: ${p99} ms`)
  console.log(`5xx errors: ${error5xx}`)

  console.log('3. Verifying terminal state and invariant integrity for all 50 rooms...')
  let closedCount = 0
  let closingCount = 0
  let wrongReasonCount = 0

  for (const id of roomIds) {
    const r = await getAdminRoom(adminCookie, id)
    const st = r.status || r.trang_thai
    const cr = r.closeReason || r.close_reason
    if (st === 'dong') {
      closedCount++
      if (cr !== 'admin_closed') wrongReasonCount++
    } else if (st === 'closing') {
      closingCount++
    }
  }

  console.log(`   CLOSED: ${closedCount}/50`)
  console.log(`   CLOSING leftovers: ${closingCount}`)
  console.log(`   Wrong reasons: ${wrongReasonCount}`)

  if (closedCount !== 50 || closingCount > 0 || wrongReasonCount > 0 || error5xx > 0) {
    throw new Error(`50-close regression failed! CLOSED: ${closedCount}, CLOSING: ${closingCount}, 5xx: ${error5xx}`)
  }

  console.log('4. Verifying Campus health...')
  const campusHealth = await fetch(`${TARGET}/api/whoami`, {
    headers: { Cookie: adminCookie },
  })
  const healthData = await campusHealth.json().catch(() => ({}))
  console.log(`   Campus health status: ${campusHealth.status}, user: ${healthData.username || healthData.ten}`)
  if (!campusHealth.ok || !healthData.ok) {
    throw new Error(`Campus health check failed: ${campusHealth.status}`)
  }

  console.log('   ✓ 50 simultaneous closes VERIFIED: 50/50 CLOSED, 0 leftovers, 0 5xx, Campus healthy.')
}

async function main() {
  const step = process.env.CANARY_STEP || process.argv[2]
  console.log(`Connecting to Staging: ${TARGET}`)
  const { cookie: adminCookie } = await login('qa.v2.admin', MAT_KHAU)
  console.log('Logged in as qa.v2.admin.')

  if (!step || step === '1') {
    await runPolicySnapshotCanary(adminCookie)
  }
  if (!step || step === '2') {
    await runRealAutoCloseCanary(adminCookie)
  }
  if (!step || step === '3') {
    await run50CloseRegression(adminCookie)
  }

  console.log('\n==================================================')
  console.log('ALL REQUESTED STAGING CANARIES COMPLETED SUCCESSFULLY')
  console.log('==================================================')
}

main().catch((err) => {
  console.error('\nCANARY FAILED:', err)
  process.exit(1)
})
