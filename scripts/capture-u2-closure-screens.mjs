// scripts/capture-u2-closure-screens.mjs
// Digital Campus v2: Milestone U2 — Data-Truth Closure Screenshots Capture

import { chromium } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const STAGING = process.env.U2_STAGING_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const parsedUrl = new URL(STAGING)
const DOMAIN = parsedUrl.hostname

const ARTIFACTS_DIR = path.resolve(
  process.env.U2_SCREENSHOT_DIR || 'artifacts/u2-full-redesign'
)
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })

async function getAuthCookie(username, password) {
  const res = await fetch(`${STAGING}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed for specified user: ${res.status}`)
  const cookieHeader = res.headers.get('Set-Cookie') || ''
  const match = cookieHeader.match(/c10a7_session=([^;]+)/)
  if (!match) throw new Error('No session cookie returned from staging')
  return match[1]
}

async function createOrGetRoom(cookie) {
  // Create a clean public test room for study room screenshot
  const res = await fetch(`${STAGING}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `c10a7_session=${cookie}`,
    },
    body: JSON.stringify({
      ten: 'Phòng Tự Học Data-Truth U2',
      phamVi: 'truong',
      accessMode: 'public',
      sucChua: 10,
    }),
  })
  if (!res.ok) {
    // If creation fails, fetch list of rooms and pick first available
    const listRes = await fetch(`${STAGING}/api/rooms`, {
      headers: { Cookie: `c10a7_session=${cookie}` },
    })
    const listData = await listRes.json()
    if (listData.rooms && listData.rooms.length > 0) {
      return listData.rooms[0].id
    }
    throw new Error('Could not create or find a study room on staging')
  }
  const data = await res.json()
  return data.room?.id || data.id
}

async function run() {
  const username = process.env.U2_SCREENSHOT_USERNAME || process.env.U1_SCREENSHOT_STUDENT_USERNAME
  const password = process.env.U2_SCREENSHOT_PASSWORD || process.env.U1_SCREENSHOT_STUDENT_PASSWORD

  if (!username || !password) {
    console.error('Error: U2_SCREENSHOT_USERNAME and U2_SCREENSHOT_PASSWORD must be provided via environment variables.')
    process.exit(1)
  }

  console.log(`[U2 Closure] Staging Target: ${STAGING}`)
  console.log(`[U2 Closure] Output Directory: ${ARTIFACTS_DIR}`)
  console.log('[U2 Closure] Authenticating test user session...')

  const sessionCookie = await getAuthCookie(username, password)
  console.log('[U2 Closure] Authentication successful (session established).')

  console.log('[U2 Closure] Preparing Study Room...')
  const roomId = await createOrGetRoom(sessionCookie)
  console.log(`[U2 Closure] Target Study Room ID: ${roomId}`)

  console.log('[U2 Closure] Launching headless browser...')
  const browser = await chromium.launch({ headless: true })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DESKTOP HOME (1440x900)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Capturing Desktop Home (1440x900) ---')
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await desktopContext.addCookies([{
    name: 'c10a7_session',
    value: sessionCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])

  const dPage = await desktopContext.newPage()
  await dPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(3000)

  const homeDesktopPath = path.join(ARTIFACTS_DIR, '01_home_desktop_closure.png')
  await dPage.screenshot({ path: homeDesktopPath, fullPage: false })
  console.log(`Captured: ${homeDesktopPath}`)

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MOBILE HOME (390x844)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Capturing Mobile Home (390x844) ---')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  })
  await mobileContext.addCookies([{
    name: 'c10a7_session',
    value: sessionCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])

  const mPage = await mobileContext.newPage()
  await mPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await mPage.waitForTimeout(2500)

  const homeMobilePath = path.join(ARTIFACTS_DIR, '02_home_mobile_closure.png')
  await mPage.screenshot({ path: homeMobilePath, fullPage: false })
  console.log(`Captured: ${homeMobilePath}`)
  await mobileContext.close()

  // ──────────────────────────────────────────────────────────────────────────
  // 3. LEARNING PAGE METRIC SEMANTICS (1440x900)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Capturing Learning Page / Occupancy Semantics (1440x900) ---')
  await dPage.goto(`${STAGING}/learn`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2500)

  const learningPath = path.join(ARTIFACTS_DIR, '03_learning_occupancy_semantics.png')
  await dPage.screenshot({ path: learningPath, fullPage: false })
  console.log(`Captured: ${learningPath}`)

  // ──────────────────────────────────────────────────────────────────────────
  // 4. STUDY ROOM: 1 ACTUAL PARTICIPANT & TRUTHFUL EMPTY STAGE (1440x900)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Capturing Study Room (1 Actual Participant & Truthful Empty Stage) ---')
  await dPage.goto(`${STAGING}/room/phong-${roomId}`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(4000)

  const studyRoomPath = path.join(ARTIFACTS_DIR, '04_study_room_closure.png')
  await dPage.screenshot({ path: studyRoomPath, fullPage: false })
  console.log(`Captured: ${studyRoomPath}`)

  await desktopContext.close()
  await browser.close()

  console.log('\n[U2 Closure] All affected states captured successfully!')
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
