/**
 * Milestone A1: True 50 Distinct Simultaneous Close Test & Admin Directory Scale Benchmark
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

function computePercentile(numbers, p) {
  if (numbers.length === 0) return 0
  const sorted = [...numbers].sort((a, b) => a - b)
  const idx = Math.floor(sorted.length * p)
  return sorted[Math.min(idx, sorted.length - 1)]
}

async function main() {
  console.log('========================================================')
  console.log('MILESTONE A1: TRUE 50 SIMULTANEOUS CLOSE & DIRECTORY SCALE')
  console.log(`Target: ${TARGET}`)
  console.log('========================================================\n')

  const adminAuth = await login('qa.v2.admin', MAT_KHAU)
  const studentAuth = await login('qa.v2.thu1', MAT_KHAU)
  console.log('✅ Logged in Admin (qa.v2.admin) & Student (qa.v2.thu1)\n')

  // -------------------------------------------------------------------
  // ITEM 14: TRUE 50 DISTINCT SIMULTANEOUS CLOSE TEST (Promise.all)
  // -------------------------------------------------------------------
  if (!process.env.SKIP_BURST) {
    console.log('----------------------------------------------------------------')
    console.log('[ITEM 14] True 50 Distinct Simultaneous Close Burst (Promise.all)')
    console.log('----------------------------------------------------------------')

  const ROOM_COUNT = 50
  console.log(`Creating ${ROOM_COUNT} distinct OPEN rooms...`)

  const createdRoomIds = []
  // Create in parallel batches of 5 to avoid overwhelming creation rate limits, but all 50 will be open
  for (let i = 0; i < ROOM_COUNT; i += 5) {
    const chunk = Array.from({ length: Math.min(5, ROOM_COUNT - i) }).map(async (_, idx) => {
      const num = i + idx + 1
      const res = await fetch(`${TARGET}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: studentAuth.cookie,
        },
        body: JSON.stringify({
          ten: `Burst Close Room #${num} ${Date.now()}`,
          phamVi: 'truong',
          accessMode: 'public',
        }),
      })
      if (!res.ok) {
        throw new Error(`Failed to create burst room #${num}: ${res.status} ${await res.text()}`)
      }
      const data = await res.json()
      return data.room?.id || data.id
    })
    const ids = await Promise.all(chunk)
    createdRoomIds.push(...ids)
    process.stdout.write(`  Created ${createdRoomIds.length}/${ROOM_COUNT} rooms...\r`)
  }
  console.log(`\n✅ Successfully created ${createdRoomIds.length} distinct OPEN rooms.`)

  // Now, FIRE ALL 50 ADMIN CLOSE REQUESTS AT ONCE WITHOUT BATCHING
  console.log(`\n🚀 Firing all ${ROOM_COUNT} Admin Close requests simultaneously with Promise.all...`)
  const burstStartTime = Date.now()

  const closeResults = await Promise.all(
    createdRoomIds.map(async (roomId, index) => {
      const t0 = Date.now()
      let status = 0
      let body = null
      try {
        const res = await fetch(`${TARGET}/api/admin/rooms/${roomId}/close`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: adminAuth.cookie,
          },
          body: JSON.stringify({
            note: `Simultaneous burst close test room ${roomId} (#${index + 1})`,
          }),
        })
        const t1 = Date.now()
        status = res.status
        try {
          body = await res.json()
        } catch {
          body = await res.text()
        }
        return {
          roomId,
          duration: t1 - t0,
          status,
          ok: res.ok,
          body,
          error: null,
        }
      } catch (err) {
        const t1 = Date.now()
        return {
          roomId,
          duration: t1 - t0,
          status: 0,
          ok: false,
          body: null,
          error: err.message,
        }
      }
    })
  )

  const burstTotalElapsed = Date.now() - burstStartTime
  console.log(`✅ All ${ROOM_COUNT} simultaneous requests resolved in ${burstTotalElapsed}ms.`)

  // Analyze close results
  const durations = closeResults.map((r) => r.duration)
  const p50 = computePercentile(durations, 0.50)
  const p95 = computePercentile(durations, 0.95)
  const p99 = computePercentile(durations, 0.99)

  const statusDistribution = {}
  let successCount = 0
  let serverErrorCount = 0
  let clientErrorCount = 0
  let fetchErrorCount = 0

  for (const r of closeResults) {
    statusDistribution[r.status] = (statusDistribution[r.status] || 0) + 1
    if (r.ok) successCount++
    if (r.status >= 500) serverErrorCount++
    if (r.status >= 400 && r.status < 500) clientErrorCount++
    if (r.status === 0) fetchErrorCount++
  }

  console.log('\n--- Burst Request Metrics ---')
  console.log(`- Total attempts:      ${ROOM_COUNT}`)
  console.log(`- Success (2xx):       ${successCount}`)
  console.log(`- Server errors (5xx): ${serverErrorCount}`)
  console.log(`- Client errors (4xx): ${clientErrorCount}`)
  console.log(`- Network errors:      ${fetchErrorCount}`)
  console.log(`- Status codes:        ${JSON.stringify(statusDistribution)}`)
  console.log(`- Latency P50:         ${p50}ms`)
  console.log(`- Latency P95:         ${p95}ms`)
  console.log(`- Latency P99:         ${p99}ms`)
  console.log(`- Burst elapsed:       ${burstTotalElapsed}ms`)

  // Verify final D1 state of all 50 rooms
  console.log('\n--- Verifying Final D1 & RoomDO States for 50 Rooms ---')
  let closedCount = 0
  let closingLeftovers = 0
  let wrongReasons = 0
  let d1Errors = 0
  let roomDoErrors = 0

  for (const roomId of createdRoomIds) {
    const detailRes = await fetch(`${TARGET}/api/admin/rooms/${roomId}`, {
      headers: { Cookie: adminAuth.cookie },
    })
    if (!detailRes.ok) {
      d1Errors++
      continue
    }
    const detail = await detailRes.json()
    const r = detail.room || detail

    const st = r.status || r.trang_thai
    const reason = r.closeReason || r.close_reason

    if (st === 'dong' || st === 'closed') {
      closedCount++
      if (reason !== 'admin_closed') {
        wrongReasons++
        console.warn(`  Room ${roomId} has unexpected reason: ${reason}`)
      }
    } else if (st === 'closing') {
      closingLeftovers++
    }

    if (detail.roomDoStatus?.error) {
      roomDoErrors++
    }
  }

  console.log(`- Final CLOSED count:  ${closedCount}/${ROOM_COUNT}`)
  console.log(`- CLOSING leftovers:   ${closingLeftovers}`)
  console.log(`- Wrong close reasons: ${wrongReasons}`)
  console.log(`- D1 lookup errors:    ${d1Errors}`)
  console.log(`- RoomDO errors:       ${roomDoErrors}`)
  }

  // Campus Core Health Check
  const healthRes = await fetch(`${TARGET}/api/whoami`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const healthData = await healthRes.json()
  console.log(`- Campus Core Health:  HTTP ${healthRes.status} (${healthRes.ok && healthData.ok ? 'HEALTHY: ' + healthData.ten + ' (@' + healthData.username + ')' : 'UNHEALTHY'})`)

  // -------------------------------------------------------------------
  // ITEM 15: ADMIN DIRECTORY SCALE (>= 500 ROOMS)
  // -------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------')
  console.log('[ITEM 15] Admin Directory Scale Benchmark (Target >= 500 rooms)')
  console.log('----------------------------------------------------------------')

  // Check current total count
  const countCheckRes = await fetch(`${TARGET}/api/admin/rooms?limit=1`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const countCheckData = await countCheckRes.json()
  const totalInDb = countCheckData.pagination?.total ?? 0
  console.log(`Current D1 room directory total rows in DB: ${totalInDb} (Target >= 500: ${totalInDb >= 500})`)

  // Measure repeated queries
  const queryRuns = 10
  const listDurations = []
  let lastData = null

  for (let i = 0; i < queryRuns; i++) {
    const t0 = Date.now()
    const res = await fetch(`${TARGET}/api/admin/rooms?page=1&limit=50`, {
      headers: { Cookie: adminAuth.cookie },
    })
    const t1 = Date.now()
    if (!res.ok) throw new Error(`List rooms failed: ${res.status}`)
    listDurations.push(t1 - t0)
    lastData = await res.json()
  }

  const listP50 = computePercentile(listDurations, 0.50)
  const listP95 = computePercentile(listDurations, 0.95)
  const listP99 = computePercentile(listDurations, 0.99)

  console.log(`\nDirectory Query Latency over ${queryRuns} runs (limit=50):`)
  console.log(`- P50: ${listP50}ms`)
  console.log(`- P95: ${listP95}ms`)
  console.log(`- P99: ${listP99}ms`)
  console.log(`- Total records in DB: ${lastData.pagination.total}`)
  console.log(`- Returned records:    ${lastData.rooms.length}`)
  console.log(`- Bounded <= 100:      ${lastData.rooms.length <= 100}`)

  // Test pagination (page 1 vs page 2)
  const page2Res = await fetch(`${TARGET}/api/admin/rooms?page=2&limit=50`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const page2Data = await page2Res.json()
  const page1Ids = new Set(lastData.rooms.map((r) => r.id))
  const page2Overlap = page2Data.rooms.filter((r) => page1Ids.has(r.id)).length
  console.log(`- Pagination test (page 2, limit 50): returned ${page2Data.rooms.length} rows, 0 overlap with page 1: ${page2Overlap === 0}`)

  // Test status filtering
  const openRes = await fetch(`${TARGET}/api/admin/rooms?page=1&limit=50&status=mo`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const openData = await openRes.json()
  const allOpen = openData.rooms.every((r) => r.rawStatus === 'mo' || r.lifecycleStatus === 'open')
  console.log(`- Status filter (status=mo): returned ${openData.rooms.length} rows, all open: ${allOpen} (total open: ${openData.pagination.total})`)

  const closedRes = await fetch(`${TARGET}/api/admin/rooms?page=1&limit=50&status=dong`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const closedData = await closedRes.json()
  const allClosed = closedData.rooms.every((r) => r.rawStatus === 'dong' || r.lifecycleStatus === 'closed')
  console.log(`- Status filter (status=dong): returned ${closedData.rooms.length} rows, all closed: ${allClosed} (total closed: ${closedData.pagination.total})`)

  // Test search
  const searchKeyword = 'chuyên đề'
  const searchRes = await fetch(`${TARGET}/api/admin/rooms?page=1&limit=20&q=${encodeURIComponent(searchKeyword)}`, {
    headers: { Cookie: adminAuth.cookie },
  })
  const searchData = await searchRes.json()
  const allMatchSearch = searchData.rooms.every((r) => r.name.includes(searchKeyword))
  console.log(`- Search query (q="${searchKeyword}"): returned ${searchData.rooms.length} matches (total: ${searchData.pagination.total}), all match: ${allMatchSearch}`)

  // Test no N+1 RoomDO calls: list endpoint response contains autoCloseDeadline calculated purely from D1 policy + row timestamps, roomDoStatus is NOT fetched
  const hasNoRoomDoStatus = lastData.rooms.every((r) => r.roomDoStatus === undefined)
  console.log(`- Bounded listing (no N+1 RoomDO calls on list endpoint): ${hasNoRoomDoStatus}`)

  console.log('\n========================================================')
  console.log('BURST & SCALE BENCHMARK COMPLETE')
  console.log('========================================================')
}

main().catch((err) => {
  console.error('\n❌ SCRIPT ERROR:', err)
  process.exit(1)
})
