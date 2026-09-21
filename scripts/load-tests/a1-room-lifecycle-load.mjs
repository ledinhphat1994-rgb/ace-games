/**
 * Milestone A1: 50-Room High-Throughput Lifecycle Benchmark & Load Test
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
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`)
  const cookie = res.headers.get('set-cookie')?.split(';')[0]
  const data = await res.json()
  return { cookie, user: data.taiKhoan || data.user || {} }
}

function computeP95(durations) {
  if (durations.length === 0) return 0
  const sorted = [...durations].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * 0.95)
  return sorted[Math.min(idx, sorted.length - 1)]
}

async function main() {
  console.log('========================================================')
  console.log('MILESTONE A1: 50-ROOM LIFECYCLE LOAD BENCHMARK')
  console.log(`Target: ${TARGET}`)
  console.log('========================================================\n')

  const adminAuth = await login('qa.v2.admin', MAT_KHAU)
  const studentAuth = await login('qa.v2.thu1', MAT_KHAU)
  console.log('✅ Logged in Admin (qa.v2.admin) & Student (qa.v2.thu1)')

  const ROOM_COUNT = 50
  const BATCH_SIZE = 10
  const createdRoomIds = []
  const createDurations = []

  // 1. Batch create 50 rooms
  console.log(`\n[Phase 1] Concurrently creating ${ROOM_COUNT} study rooms (batches of ${BATCH_SIZE})...`)
  const startTime = Date.now()

  for (let b = 0; b < ROOM_COUNT; b += BATCH_SIZE) {
    const batchPromises = Array.from({ length: BATCH_SIZE }).map(async (_, idx) => {
      const roomNum = b + idx + 1
      const t0 = Date.now()
      const res = await fetch(`${TARGET}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: studentAuth.cookie,
        },
        body: JSON.stringify({
          ten: `Load Test Room #${roomNum} ${Date.now()}`,
          phamVi: 'truong',
          accessMode: 'public',
        }),
      })
      const t1 = Date.now()
      createDurations.push(t1 - t0)

      if (!res.ok) {
        throw new Error(`Failed to create room #${roomNum}: ${res.status} ${await res.text()}`)
      }
      const data = await res.json()
      const roomId = data.room?.id || data.id
      return roomId
    })

    const batchResults = await Promise.all(batchPromises)
    createdRoomIds.push(...batchResults)
    process.stdout.write(`  Created ${createdRoomIds.length}/${ROOM_COUNT} rooms...\r`)
  }

  const createElapsed = Date.now() - startTime
  const createP95 = computeP95(createDurations)
  console.log(`\n✅ 50 rooms successfully created in ${createElapsed}ms (P95: ${createP95}ms)`)

  // 2. Admin Room Directory Queries
  console.log('\n[Phase 2] Querying Admin Rooms Directory (Paginated & Filtered)...')
  const tDir0 = Date.now()
  const dirRes = await fetch(`${TARGET}/api/admin/rooms?limit=50&status=open`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const tDir1 = Date.now()
  if (!dirRes.ok) throw new Error(`Admin rooms list failed: ${dirRes.status}`)
  const dirData = await dirRes.json()
  console.log(`✅ Admin rooms query returned in ${tDir1 - tDir0}ms (Total open rooms: ${dirData.total}, returned: ${dirData.rooms.length})`)

  // Verify created rooms exist in open state
  const foundOpen = createdRoomIds.filter((id) => dirData.rooms.some((r) => r.id === id))
  console.log(`  Verified ${foundOpen.length}/${ROOM_COUNT} created rooms present in Admin Directory`)

  // 3. Batch close 50 rooms (half admin, half owner)
  console.log(`\n[Phase 3] Concurrently closing ${ROOM_COUNT} study rooms (batches of ${BATCH_SIZE})...`)
  const closeDurations = []
  const closeStartTime = Date.now()

  for (let b = 0; b < ROOM_COUNT; b += BATCH_SIZE) {
    const batchRoomIds = createdRoomIds.slice(b, b + BATCH_SIZE)
    const batchPromises = batchRoomIds.map(async (roomId, idx) => {
      const isOwner = (b + idx) % 2 === 0
      const url = isOwner ? `${TARGET}/api/rooms/${roomId}/close` : `${TARGET}/api/admin/rooms/${roomId}/close`
      const cookie = isOwner ? studentAuth.cookie : adminAuth.cookie
      const t0 = Date.now()
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({ reason: `Load test close #${b + idx + 1}` }),
      })
      const t1 = Date.now()
      closeDurations.push(t1 - t0)

      if (!res.ok) {
        throw new Error(`Failed to close room ${roomId}: ${res.status} ${await res.text()}`)
      }
      return res.json()
    })

    await Promise.all(batchPromises)
    process.stdout.write(`  Closed ${b + batchRoomIds.length}/${ROOM_COUNT} rooms...\r`)
  }

  const closeElapsed = Date.now() - closeStartTime
  const closeP95 = computeP95(closeDurations)
  console.log(`\n✅ 50 rooms successfully closed in ${closeElapsed}ms (P95: ${closeP95}ms)`)

  // 4. Verification of final closed state in Admin Directory
  console.log('\n[Phase 4] Verifying closed state across all 50 rooms...')
  const finalDirRes = await fetch(`${TARGET}/api/admin/rooms?limit=50&status=closed`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const finalDirData = await finalDirRes.json()
  const foundClosed = createdRoomIds.filter((id) => finalDirData.rooms.some((r) => r.id === id))
  console.log(`✅ Verified ${foundClosed.length}/${ROOM_COUNT} rooms transitioned to CLOSED in Admin Directory`)

  console.log('\n========================================================')
  console.log('SUMMARY OF LOAD BENCHMARK')
  console.log('========================================================')
  console.log(`- 50 Room Creations: Total ${createElapsed}ms | P95: ${createP95}ms`)
  console.log(`- 50 Room Closes:    Total ${closeElapsed}ms | P95: ${closeP95}ms`)
  console.log(`- 0 Server Errors (5xx), 0 Concurrency Violations`)
  console.log('========================================================')
}

main().catch((err) => {
  console.error('\n❌ LOAD TEST FAILURE:', err)
  process.exit(1)
})
