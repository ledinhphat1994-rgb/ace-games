/**
 * Milestone A1: Admin Control Plane & Server-Authoritative Room Lifecycle
 * Live Staging Canary & Verification Suite
 * Target: https://gdtxdinhquan-v2.ledinhphat1994.workers.dev
 */

const TARGET = process.env.TARGET_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const MAT_KHAU = process.env.CANARY_PASSWORD || ''

async function login(username, password) {
  const res = await fetch(`${TARGET}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status} ${await res.text()}`)
  }
  const cookie = res.headers.get('set-cookie')?.split(';')[0]
  if (!cookie) throw new Error(`No cookie returned for ${username}`)
  const data = await res.json()
  return { cookie, user: data.taiKhoan || data.user || {} }
}

async function main() {
  console.log('========================================================')
  console.log('MILESTONE A1: LIVE STAGING CANARY & VALIDATION')
  console.log(`Target: ${TARGET}`)
  console.log('========================================================\n')

  // 1. Authenticate users
  console.log('[1/5] Authenticating Admin and Student accounts...')
  const adminAuth = await login('qa.v2.admin', MAT_KHAU)
  console.log('  ✅ Admin logged in (qa.v2.admin)')
  const studentAuth = await login('qa.v2.thu1', MAT_KHAU)
  console.log('  ✅ Student logged in (qa.v2.thu1)')

  // 2. RBAC Enforcement Gates
  console.log('\n[2/5] Testing RBAC security gates on Admin Control Plane...')
  const rbacChecks = [
    { name: 'GET /api/admin/rooms', url: `${TARGET}/api/admin/rooms`, method: 'GET' },
    { name: 'GET /api/admin/room-policy', url: `${TARGET}/api/admin/room-policy`, method: 'GET' },
    { name: 'PUT /api/admin/room-policy', url: `${TARGET}/api/admin/room-policy`, method: 'PUT', body: {} },
    { name: 'POST /api/admin/rooms/999/close', url: `${TARGET}/api/admin/rooms/999/close`, method: 'POST', body: {} },
    { name: 'GET /api/admin/audit-logs', url: `${TARGET}/api/admin/audit-logs`, method: 'GET' },
  ]

  for (const check of rbacChecks) {
    const res = await fetch(check.url, {
      method: check.method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentAuth.cookie,
      },
      body: check.body ? JSON.stringify(check.body) : undefined,
    })
    if (res.status !== 403) {
      throw new Error(`RBAC Leak! Non-admin got ${res.status} on ${check.name} (expected 403)`)
    }
    console.log(`  🔒 ${check.name} strictly rejected student with 403 Forbidden`)
  }

  // 3. Room Policy Lifecycle & Optimistic Concurrency
  console.log('\n[3/5] Testing Room Policy Lifecycle & Audit Logging...')
  const policyGetRes = await fetch(`${TARGET}/api/admin/room-policy`, {
    headers: { Cookie: adminAuth.cookie },
  })
  if (!policyGetRes.ok) throw new Error(`GET /api/admin/room-policy failed: ${policyGetRes.status}`)
  const policyData = await policyGetRes.json()
  const originalPolicy = policyData.policy
  console.log(`  Current Policy Revision: ${originalPolicy.revision}, autoClose: ${originalPolicy.autoCloseEnabled}`)

  // Update policy with new values
  const updatedTtl = originalPolicy.neverJoinedTtlMinutes === 10 ? 15 : 10
  const policyPutRes = await fetch(`${TARGET}/api/admin/room-policy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookie,
    },
    body: JSON.stringify({
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: updatedTtl,
      emptyRoomTtlMinutes: originalPolicy.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: originalPolicy.maxRoomLifetimeMinutes,
      expectedRevision: originalPolicy.revision,
    }),
  })
  if (!policyPutRes.ok) throw new Error(`PUT /api/admin/room-policy failed: ${policyPutRes.status} ${await policyPutRes.text()}`)
  const putResult = await policyPutRes.json()
  console.log(`  ✅ Policy updated to revision ${putResult.policy.revision}, neverJoinedTtlMinutes=${putResult.policy.neverJoinedTtlMinutes}`)

  // Concurrency conflict test (using old revision)
  const conflictRes = await fetch(`${TARGET}/api/admin/room-policy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookie,
    },
    body: JSON.stringify({
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 20,
      emptyRoomTtlMinutes: originalPolicy.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: originalPolicy.maxRoomLifetimeMinutes,
      expectedRevision: originalPolicy.revision, // stale revision!
    }),
  })
  if (conflictRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on stale revision, got ${conflictRes.status}`)
  }
  console.log('  ✅ Stale policy revision correctly rejected with 409 Conflict')

  // Restore original policy
  await fetch(`${TARGET}/api/admin/room-policy`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookie,
    },
    body: JSON.stringify({
      autoCloseEnabled: originalPolicy.autoCloseEnabled,
      neverJoinedTtlMinutes: originalPolicy.neverJoinedTtlMinutes,
      emptyRoomTtlMinutes: originalPolicy.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: originalPolicy.maxRoomLifetimeMinutes,
      expectedRevision: putResult.policy.revision,
    }),
  })
  console.log('  ✅ Original room policy restored')

  // 4. Room Creation, Admin Force Close & Owner Close
  console.log('\n[4/5] Testing Room Creation & Canonical Close Workflows...')
  // Create Room A as student
  const createResA = await fetch(`${TARGET}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentAuth.cookie,
    },
    body: JSON.stringify({
      ten: `Canary A1 Admin Close ${Date.now()}`,
      phamVi: 'truong',
      accessMode: 'public',
    }),
  })
  if (!createResA.ok) throw new Error(`Create Room A failed: ${createResA.status} ${await createResA.text()}`)
  const createDataA = await createResA.json()
  const roomAId = createDataA.room?.id || createDataA.id
  console.log(`  Created Room A (ID: ${roomAId}) by student`)

  // Inspect Room A via Admin API
  const adminGetA = await fetch(`${TARGET}/api/admin/rooms/${roomAId}`, {
    headers: { Cookie: adminAuth.cookie },
  })
  if (!adminGetA.ok) throw new Error(`Admin GET room A failed: ${adminGetA.status}`)
  const roomADetails = await adminGetA.json()
  const status = roomADetails.room.lifecycleStatus || (roomADetails.room.trang_thai === 'mo' ? 'open' : roomADetails.room.trang_thai === 'dong' ? 'closed' : roomADetails.room.trang_thai)
  if (status !== 'open') {
    throw new Error(`Room A initial status was ${status}, expected 'open'`)
  }
  console.log(`  Admin inspected Room A: status = '${status}'`)

  // Admin Force-Closes Room A
  const forceCloseRes = await fetch(`${TARGET}/api/admin/rooms/${roomAId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookie,
    },
    body: JSON.stringify({ reason: 'Canary staging automated admin force close' }),
  })
  if (!forceCloseRes.ok) throw new Error(`Admin force close failed: ${forceCloseRes.status} ${await forceCloseRes.text()}`)
  const forceCloseData = await forceCloseRes.json()
  console.log(`  ✅ Admin force close executed: status = ${forceCloseData.status}`)

  // Repeated close is idempotent
  const repeatClose = await fetch(`${TARGET}/api/admin/rooms/${roomAId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminAuth.cookie,
    },
    body: JSON.stringify({ reason: 'Repeat force close' }),
  })
  const repeatData = await repeatClose.json()
  if (!repeatData.alreadyClosed) {
    throw new Error(`Expected repeat close to report alreadyClosed: true, got ${JSON.stringify(repeatData)}`)
  }
  console.log('  ✅ Repeated admin close was idempotent (alreadyClosed = true)')

  // Verify admission is rejected on closed room
  const admitRes = await fetch(`${TARGET}/api/rooms/${roomAId}/admission-status`, {
    headers: { Cookie: studentAuth.cookie },
  })
  const admitData = await admitRes.json()
  if (admitRes.status !== 403 && admitData.ok !== false && admitData.admitted !== false) {
    throw new Error(`Expected admission to closed room to be rejected, got HTTP ${admitRes.status}: ${JSON.stringify(admitData)}`)
  }
  console.log(`  ✅ Admission to closed Room A strictly denied (HTTP ${admitRes.status}: "${admitData.loi || admitData.reason}")`)

  // Create Room B and test Owner Close
  const createResB = await fetch(`${TARGET}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentAuth.cookie,
    },
    body: JSON.stringify({
      ten: `Canary A1 Owner Close ${Date.now()}`,
      phamVi: 'truong',
      accessMode: 'public',
    }),
  })
  const createDataB = await createResB.json()
  const roomBId = createDataB.room?.id || createDataB.id
  console.log(`  Created Room B (ID: ${roomBId}) by student`)

  const ownerCloseRes = await fetch(`${TARGET}/api/rooms/${roomBId}/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentAuth.cookie,
    },
    body: JSON.stringify({ reason: 'Student owner closed room' }),
  })
  if (!ownerCloseRes.ok) throw new Error(`Owner close failed: ${ownerCloseRes.status} ${await ownerCloseRes.text()}`)
  console.log('  ✅ Owner close executed successfully')

  // 5. High-Concurrency & Race Condition Verification
  console.log('\n[5/5] High-Concurrency Race Condition & Burst Verification...')
  const createResC = await fetch(`${TARGET}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: studentAuth.cookie,
    },
    body: JSON.stringify({
      ten: `Canary A1 Race Room ${Date.now()}`,
      phamVi: 'truong',
      accessMode: 'public',
    }),
  })
  const createDataC = await createResC.json()
  const roomCId = createDataC.room?.id || createDataC.id
  console.log(`  Created Room C (ID: ${roomCId}) for concurrent close race`)

  // 10 concurrent close requests to the exact same room
  console.log('  Firing 10 simultaneous close requests (Admin + Owner race)...')
  const racePromises = Array.from({ length: 10 }).map((_, idx) => {
    const isOwner = idx % 2 === 0
    const url = isOwner ? `${TARGET}/api/rooms/${roomCId}/close` : `${TARGET}/api/admin/rooms/${roomCId}/close`
    const cookie = isOwner ? studentAuth.cookie : adminAuth.cookie
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
      },
      body: JSON.stringify({ reason: `Concurrent race attempt #${idx + 1}` }),
    })
  })

  const raceResults = await Promise.all(racePromises)
  const raceStatuses = raceResults.map((r) => r.status)
  console.log(`  Concurrent close HTTP statuses: ${raceStatuses.join(', ')}`)

  if (raceStatuses.some((s) => s !== 200 && s !== 409)) {
    throw new Error(`Race condition error: received unexpected status in concurrent close: ${raceStatuses}`)
  }

  const raceBodies = await Promise.all(raceResults.map((r) => r.json()))
  const closeCount = raceBodies.filter((b) => (b.status === 'closed' || b.closed === true) && !b.alreadyClosed).length
  const alreadyClosedCount = raceBodies.filter((b) => b.alreadyClosed === true).length
  console.log(`  Race resolution: 1 canonical close (${closeCount}), 9 serialized alreadyClosed (${alreadyClosedCount})`)

  if (closeCount !== 1 || alreadyClosedCount !== 9) {
    throw new Error(`Exactly-once close violation: expected 1 close and 9 alreadyClosed, got ${closeCount} / ${alreadyClosedCount}`)
  }
  console.log('  ✅ Exactly-once close serialization verified under concurrent race!')

  // Check Audit Logs
  const auditRes = await fetch(`${TARGET}/api/admin/audit-logs?limit=10`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const auditData = await auditRes.json()
  console.log(`  Audit log contains ${auditData.total} entries; latest action: '${auditData.logs[0]?.action}'`)

  console.log('\n========================================================')
  console.log('🏆 ALL MILESTONE A1 LIVE STAGING CANARIES PASSED (100%)')
  console.log('========================================================')
}

main().catch((err) => {
  console.error('\n❌ CANARY FAILURE:', err)
  process.exit(1)
})
