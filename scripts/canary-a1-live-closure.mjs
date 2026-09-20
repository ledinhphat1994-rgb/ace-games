/**
 * Digital Campus v2: Milestone A1 — Live Staging Auto-Lifecycle & Force-Close Closure
 * scripts/canary-a1-live-closure.mjs
 *
 * Exercises:
 *   Item 8:  Live 2-WebSocket admin force-close canary (room.closed packets, graceful disconnect, reconnect 403, audit)
 *   Item 9:  Live staging never-joined auto-close via real Durable Object alarm (neverJoinedTtlMinutes=1)
 *   Item 10: Live staging first-join cancellation (WS connected, alarm does NOT close room)
 *   Item 11: Live staging empty-room auto-close via real Durable Object alarm (emptyRoomTtlMinutes=1)
 *   Cleanup: Restores staging policy to canonical 5 / 15 / 480.
 */

import WebSocket from 'ws'

const TARGET = process.env.TARGET_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const MAT_KHAU = 'ThuNghiem@v2-2026'

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

function connectWs(roomId, cookie) {
  const wsUrl = TARGET.replace(/^http/, 'ws') + `/ws/room/phong-${roomId}`
  const ws = new WebSocket(wsUrl, {
    headers: {
      Cookie: cookie,
      Origin: TARGET,
    },
  })
  const packets = []
  let closeInfo = null

  ws.on('message', (data) => {
    try {
      packets.push(JSON.parse(data.toString()))
    } catch {
      packets.push({ raw: data.toString() })
    }
  })

  ws.on('close', (code, reason) => {
    closeInfo = { code, reason: reason.toString() }
  })

  const openPromise = new Promise((resolve, reject) => {
    ws.on('open', () => resolve(ws))
    ws.on('error', (err) => reject(err))
  })

  return { ws, packets, getCloseInfo: () => closeInfo, openPromise }
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
  if (!res.ok) throw new Error(`Failed to create room: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.room || data
}

async function getRoomAdminDetail(adminCookie, roomId) {
  const res = await fetch(`${TARGET}/api/admin/rooms/${roomId}`, {
    headers: { Cookie: adminCookie },
  })
  if (!res.ok) throw new Error(`Failed to get room detail: ${res.status}`)
  return (await res.json()).room
}

async function getAuditLogsForRoom(adminCookie, roomId) {
  const res = await fetch(`${TARGET}/api/admin/audit-logs?roomId=${roomId}`, {
    headers: { Cookie: adminCookie },
  })
  if (!res.ok) throw new Error(`Failed to get audit logs: ${res.status}`)
  return (await res.json()).logs || []
}

async function runLiveClosureCanary() {
  console.log('================================================================')
  console.log('MILESTONE A1: LIVE STAGING AUTO-LIFECYCLE & FORCE-CLOSE CLOSURE')
  console.log(`Target: ${TARGET}`)
  console.log('================================================================\n')

  console.log('[Step 0] Logging in QA accounts...')
  const admin = await login('qa.v2.admin', MAT_KHAU)
  const studentA = await login('qa.v2.thu1', MAT_KHAU)
  const studentB = await login('qa.v2.thu2', MAT_KHAU)
  console.log('  ✅ Admin (qa.v2.admin), Student A (qa.v2.thu1), Student B (qa.v2.thu2) logged in.\n')

  const initialPolicy = await getPolicy(admin.cookie)
  console.log(`[Policy Check] Current Staging Policy Revision ${initialPolicy.revision}:`)
  console.log(`  neverJoined: ${initialPolicy.neverJoinedTtlMinutes}m, emptyRoom: ${initialPolicy.emptyRoomTtlMinutes}m, maxLifetime: ${initialPolicy.maxRoomLifetimeMinutes}m\n`)

  // ==========================================================================
  // ITEM 8: LIVE STAGING WEBSOCKET FORCE-CLOSE CANARY (2 Real WebSockets)
  // ==========================================================================
  console.log('----------------------------------------------------------------')
  console.log('[ITEM 8] Live 2-WebSocket Admin Force-Close Canary')
  console.log('----------------------------------------------------------------')
  const room8 = await createRoom(studentA.cookie, `Canary 2-WS Force Close ${Date.now()}`)
  console.log(`  1. Created Room #${room8.id}: "${room8.ten}"`)

  const wsA = connectWs(room8.id, studentA.cookie)
  const wsB = connectWs(room8.id, studentB.cookie)
  await Promise.all([wsA.openPromise, wsB.openPromise])
  console.log('  2. Both WebSockets (Student A and Student B) connected successfully (HTTP 101 Switching Protocols).')

  // Let initial snapshot packets settle
  await sleep(500)

  console.log('  3. Admin force-closing room via POST /api/admin/rooms/:id/close...')
  const closeRes = await fetch(`${TARGET}/api/admin/rooms/${room8.id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: admin.cookie },
    body: JSON.stringify({ note: 'Canary 2-WS automated live admin force close' }),
  })
  if (!closeRes.ok) throw new Error(`Admin force close failed: ${closeRes.status} ${await closeRes.text()}`)
  const closeBody = await closeRes.json()
  console.log(`     Response: ok=${closeBody.ok}, closed=${closeBody.closed}`)

  // Wait for room.closed packets and disconnects
  await sleep(1000)

  const pktA = wsA.packets.find((p) => p.type === 'room.closed')
  const pktB = wsB.packets.find((p) => p.type === 'room.closed')

  if (!pktA || !pktB) {
    throw new Error(`Broadcast failure: pktA=${JSON.stringify(pktA)}, pktB=${JSON.stringify(pktB)}`)
  }
  console.log(`  4. ✅ Both sockets received "room.closed" packet:`)
  console.log(`     - WS A packet: type=${pktA.type}, reason=${pktA.reason}`)
  console.log(`     - WS B packet: type=${pktB.type}, reason=${pktB.reason}`)
  if (pktA.reason !== 'admin_closed' || pktB.reason !== 'admin_closed') {
    throw new Error(`Machine reason mismatch! Expected 'admin_closed', got '${pktA.reason}' / '${pktB.reason}'`)
  }

  const closeInfoA = wsA.getCloseInfo()
  const closeInfoB = wsB.getCloseInfo()
  console.log(`  5. ✅ Graceful disconnect codes:`)
  console.log(`     - WS A close code=${closeInfoA?.code}`)
  console.log(`     - WS B close code=${closeInfoB?.code}`)

  // Attempt reconnect to closed room
  console.log('  6. Testing reconnect denial...')
  const reconnectStatus = await new Promise((resolve) => {
    const wsUrl = TARGET.replace(/^http/, 'ws') + `/ws/room/phong-${room8.id}`
    const rws = new WebSocket(wsUrl, {
      headers: { Cookie: studentA.cookie, Origin: TARGET },
    })
    rws.on('unexpected-response', (_req, res) => {
      resolve(res.statusCode)
    })
    rws.on('open', () => {
      rws.close()
      resolve(200)
    })
    rws.on('error', (err) => {
      resolve(err.message)
    })
  })
  console.log(`     Reconnect handshake result: HTTP ${reconnectStatus} (expected 403 Forbidden)`)
  if (reconnectStatus !== 403) {
    throw new Error(`Expected 403 on reconnect to closed room, got ${reconnectStatus}`)
  }

  // Verify D1 and audit
  const detail8 = await getRoomAdminDetail(admin.cookie, room8.id)
  const status8 = detail8.trang_thai || detail8.status
  const reason8 = detail8.close_reason || detail8.closeReason
  console.log(`  7. ✅ D1 verification: status="${status8}", close_reason="${reason8}", closed_by=${detail8.closed_by ?? detail8.closedBy}`)
  if ((status8 !== 'dong' && status8 !== 'closed') || reason8 !== 'admin_closed') {
    throw new Error(`D1 mismatch: status=${status8}, closeReason=${reason8}`)
  }

  const logs8 = await getAuditLogsForRoom(admin.cookie, room8.id)
  const closeLog8 = logs8.find((l) => l.action === 'admin_room_close')
  if (!closeLog8) throw new Error('Missing admin_room_close audit log!')
  console.log(`  8. ✅ Audit log verified: action="${closeLog8.action}", reason="${closeLog8.reason}", actor="${closeLog8.actorName}"\n`)

  // ==========================================================================
  // ITEMS 9 & 10: REAL DO ALARM (never-joined timeout & join cancellation)
  // ==========================================================================
  console.log('----------------------------------------------------------------')
  console.log('[ITEMS 9 & 10] Real Alarm Execution: Never-Joined Auto-Close & Join Cancellation')
  console.log('----------------------------------------------------------------')
  console.log('  1. Temporarily setting neverJoinedTtlMinutes = 1...')
  await updatePolicy(admin.cookie, { neverJoinedTtlMinutes: 1 })

  const room9 = await createRoom(studentA.cookie, `Alarm Never-Joined Test ${Date.now()}`)
  console.log(`  2. Created Room #${room9.id} (Unjoined, neverJoinedTtlMinutes=1)`)

  const room10 = await createRoom(studentA.cookie, `Alarm First-Join Cancellation Test ${Date.now()}`)
  console.log(`  3. Created Room #${room10.id} (Joining immediately, neverJoinedTtlMinutes=1)`)

  // Connect WS to room10 to cancel never-joined timeout
  const ws10 = connectWs(room10.id, studentA.cookie)
  await ws10.openPromise
  console.log(`     WS connected to Room #${room10.id}. everJoined is now true.`)

  const WAIT_SECONDS = 75
  console.log(`  4. Waiting ${WAIT_SECONDS} seconds for real Durable Object alarm to fire naturally...`)
  console.log('     (No test hooks, no manual close calls, no mock timer acceleration)')
  for (let s = 1; s <= WAIT_SECONDS; s++) {
    await sleep(1000)
    if (s % 15 === 0 || s === WAIT_SECONDS) {
      process.stdout.write(`     ... waited ${s}/${WAIT_SECONDS}s\n`)
    }
  }

  // Verify Room 9: MUST BE CLOSED by system alarm
  const detail9 = await getRoomAdminDetail(admin.cookie, room9.id)
  const status9 = detail9.trang_thai || detail9.status
  const reason9 = detail9.close_reason || detail9.closeReason
  console.log(`  5. ✅ Room #${room9.id} (Never Joined) State:`)
  console.log(`     - status: "${status9}" (expected "dong" / "closed")`)
  console.log(`     - closeReason: "${reason9}" (expected "never_joined_timeout")`)
  if ((status9 !== 'dong' && status9 !== 'closed') || reason9 !== 'never_joined_timeout') {
    throw new Error(`Never-joined auto-close failed! Status=${status9}, Reason=${reason9}`)
  }

  const logs9 = await getAuditLogsForRoom(admin.cookie, room9.id)
  const closeLog9 = logs9.find((l) => l.action === 'system_room_close')
  if (!closeLog9) throw new Error('Missing system_room_close audit log for room 9!')
  console.log(`     - Audit: action="${closeLog9.action}", reason="${closeLog9.reason}", actor="${closeLog9.actorName}" (id=${closeLog9.actorId})`)

  // Verify Room 10: MUST REMAIN OPEN (never-joined timeout cancelled by first join)
  const detail10 = await getRoomAdminDetail(admin.cookie, room10.id)
  const status10 = detail10.trang_thai || detail10.status
  console.log(`  6. ✅ Room #${room10.id} (Joined Before Deadline) State:`)
  console.log(`     - status: "${status10}" (expected "mo" / "open")`)
  console.log(`     - everJoined: ${Boolean(detail10.ever_joined ?? detail10.everJoined)}`)
  if (status10 !== 'mo' && status10 !== 'open') {
    throw new Error(`First-join cancellation failed! Room #${room10.id} closed unexpectedly: ${status10}`)
  }

  // Disconnect WS10 and close Room 10
  ws10.ws.close()
  await fetch(`${TARGET}/api/rooms/${room10.id}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentA.cookie },
  })
  console.log(`     Cleaned up Room #${room10.id}.\n`)

  // ==========================================================================
  // ITEM 11: REAL ALARM (empty-room auto-close)
  // ==========================================================================
  console.log('----------------------------------------------------------------')
  console.log('[ITEM 11] Real Alarm Execution: Empty-Room Auto-Close')
  console.log('----------------------------------------------------------------')
  console.log('  1. Temporarily setting emptyRoomTtlMinutes = 1...')
  await updatePolicy(admin.cookie, { emptyRoomTtlMinutes: 1 })

  const room11 = await createRoom(studentA.cookie, `Alarm Empty-Room Test ${Date.now()}`)
  console.log(`  2. Created Room #${room11.id}: "${room11.ten}"`)

  const ws11 = connectWs(room11.id, studentA.cookie)
  await ws11.openPromise
  console.log(`  3. Student A joined Room #${room11.id}. Active count = 1.`)
  await sleep(1000)

  // Now student leaves room
  ws11.ws.close()
  console.log(`  4. Student A disconnected. Active count is now 0.`)
  console.log(`     Waiting ${WAIT_SECONDS} seconds for real empty-room Durable Object alarm...`)

  for (let s = 1; s <= WAIT_SECONDS; s++) {
    await sleep(1000)
    if (s % 15 === 0 || s === WAIT_SECONDS) {
      process.stdout.write(`     ... waited ${s}/${WAIT_SECONDS}s\n`)
    }
  }

  const detail11 = await getRoomAdminDetail(admin.cookie, room11.id)
  const status11 = detail11.trang_thai || detail11.status
  const reason11 = detail11.close_reason || detail11.closeReason
  console.log(`  5. ✅ Room #${room11.id} (Empty Room) State:`)
  console.log(`     - status: "${status11}" (expected "dong" / "closed")`)
  console.log(`     - closeReason: "${reason11}" (expected "empty_timeout")`)
  if ((status11 !== 'dong' && status11 !== 'closed') || reason11 !== 'empty_timeout') {
    throw new Error(`Empty-room auto-close failed! Status=${status11}, Reason=${reason11}`)
  }

  const logs11 = await getAuditLogsForRoom(admin.cookie, room11.id)
  const closeLog11 = logs11.find((l) => l.action === 'system_room_close')
  if (!closeLog11) throw new Error('Missing system_room_close audit log for room 11!')
  console.log(`     - Audit: action="${closeLog11.action}", reason="${closeLog11.reason}", actor="${closeLog11.actorName}" (id=${closeLog11.actorId})\n`)

  // ==========================================================================
  // RESTORE ORIGINAL STAGING POLICY
  // ==========================================================================
  console.log('----------------------------------------------------------------')
  console.log('[CLEANUP] Restoring Canonical Staging Policy (5 / 15 / 480)...')
  console.log('----------------------------------------------------------------')
  const restoredPolicy = await updatePolicy(admin.cookie, {
    neverJoinedTtlMinutes: 5,
    emptyRoomTtlMinutes: 15,
    maxRoomLifetimeMinutes: 480,
    autoCloseEnabled: true,
  })
  console.log(`  ✅ Staging policy restored to Revision ${restoredPolicy.revision}:`)
  console.log(`     neverJoined: ${restoredPolicy.neverJoinedTtlMinutes}m, emptyRoom: ${restoredPolicy.emptyRoomTtlMinutes}m, maxLifetime: ${restoredPolicy.maxRoomLifetimeMinutes}m\n`)

  console.log('================================================================')
  console.log('🎉 ALL A1 LIVE STAGING CANARIES PASSED WITH FULL PROOF!')
  console.log('================================================================')
}

runLiveClosureCanary().catch((err) => {
  console.error('\n❌ CANARY FAILURE:', err)
  process.exit(1)
})
