// scripts/capture-u2-screenshots.mjs
import { chromium } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'

const STAGING = process.env.U2_STAGING_URL || 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const parsedUrl = new URL(STAGING)
const DOMAIN = parsedUrl.hostname

const ARTIFACTS_DIR = path.resolve(
  process.env.U2_SCREENSHOT_DIR || 'artifacts/u2-visual-review'
)
fs.mkdirSync(ARTIFACTS_DIR, { recursive: true })

async function getAuthCookie(username, password) {
  const res = await fetch(`${STAGING}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(`Login failed for ${username}: ${res.status}`)
  const cookieHeader = res.headers.get('Set-Cookie') || ''
  const match = cookieHeader.match(/c10a7_session=([^;]+)/)
  if (!match) throw new Error(`No c10a7_session cookie returned for ${username}`)
  return match[1]
}

async function run() {
  const studentUsername =
    process.env.U2_SCREENSHOT_STUDENT_USERNAME ||
    process.env.U1_SCREENSHOT_STUDENT_USERNAME
  const studentPassword =
    process.env.U2_SCREENSHOT_STUDENT_PASSWORD ||
    process.env.U1_SCREENSHOT_STUDENT_PASSWORD

  if (!studentUsername || !studentPassword) {
    console.error('Error: Missing required environment variables.')
    console.error('Please configure U2_SCREENSHOT_STUDENT_USERNAME and U2_SCREENSHOT_STUDENT_PASSWORD')
    process.exit(1)
  }

  console.log(`Target Staging URL: ${STAGING}`)
  console.log(`Writing screenshot artifacts to: ${ARTIFACTS_DIR}`)
  console.log('Authenticating student session via Staging API...')

  const studentCookie = await getAuthCookie(studentUsername, studentPassword)
  console.log('Student session established.')

  console.log('Launching browser with Playwright...')
  const browser = await chromium.launch({ headless: true })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DESKTOP 1440x900
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Desktop 1440x900 Screenshots ---')
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await desktopContext.addCookies([{
    name: 'c10a7_session',
    value: studentCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])

  const dPage = await desktopContext.newPage()

  // 1. Home
  console.log('Navigating to Home (1440x900)...')
  await dPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(3000)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_a_home.png') })
  console.log('Captured: desktop_a_home.png')

  const dScroll = await dPage.evaluate(() => document.documentElement.scrollWidth)
  const dClient = await dPage.evaluate(() => document.documentElement.clientWidth)
  console.log(`Desktop Home overflow check: scrollWidth=${dScroll}, clientWidth=${dClient} (Pass: ${dScroll <= dClient})`)

  // 2. Learning
  console.log('Navigating to Learning /learn (1440x900)...')
  await dPage.goto(`${STAGING}/learn`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2000)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_b_learning.png') })
  console.log('Captured: desktop_b_learning.png')

  // 3. Community
  console.log('Navigating to Community /community (1440x900)...')
  await dPage.goto(`${STAGING}/community`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2000)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_c_community.png') })
  console.log('Captured: desktop_c_community.png')

  // 4. Profile
  console.log('Navigating to Profile /me (1440x900)...')
  await dPage.goto(`${STAGING}/me`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2000)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_d_profile.png') })
  console.log('Captured: desktop_d_profile.png')

  // 5. Progress View
  console.log('Navigating to Home for Progress View modal...')
  await dPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2000)
  const progressCta = dPage.locator('button:has-text("Xem tiến trình")')
  if (await progressCta.isVisible()) {
    await progressCta.click()
    await dPage.waitForTimeout(1000)
  }
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_e_progress.png') })
  console.log('Captured: desktop_e_progress.png')
  await dPage.keyboard.press('Escape')
  await dPage.waitForTimeout(400)

  // 6. Chat Empty State
  console.log('Opening Chat Drawer for empty state check...')
  const chatTrigger = dPage.locator('[data-testid="campus-chat-trigger"]')
  if (await chatTrigger.isVisible()) {
    await chatTrigger.click()
    await dPage.waitForTimeout(1000)
    await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_f_chat_empty.png') })
    console.log('Captured: desktop_f_chat_empty.png')
    await dPage.keyboard.press('Escape')
    await dPage.waitForTimeout(400)
  }

  await desktopContext.close()

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MOBILE 390x844
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Mobile 390x844 Screenshots ---')
  const mobile390Context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  })
  await mobile390Context.addCookies([{
    name: 'c10a7_session',
    value: studentCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])
  const m390 = await mobile390Context.newPage()

  // Mobile Home
  await m390.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(2500)
  const m390Scroll = await m390.evaluate(() => document.documentElement.scrollWidth)
  const m390Client = await m390.evaluate(() => document.documentElement.clientWidth)
  console.log(`Mobile 390x844 Home overflow check: scrollWidth=${m390Scroll}, clientWidth=${m390Client} (Pass: ${m390Scroll <= m390Client})`)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_a_home_390.png') })
  console.log('Captured: mobile_a_home_390.png')

  // Mobile Learning
  await m390.goto(`${STAGING}/learn`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_b_learning_390.png') })
  console.log('Captured: mobile_b_learning_390.png')

  // Mobile Community
  await m390.goto(`${STAGING}/community`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_c_community_390.png') })
  console.log('Captured: mobile_c_community_390.png')

  // Mobile Profile
  await m390.goto(`${STAGING}/me`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_d_profile_390.png') })
  console.log('Captured: mobile_d_profile_390.png')

  // Mobile Progress
  await m390.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  const mProgressCta = m390.locator('button:has-text("Xem tiến trình")')
  if (await mProgressCta.isVisible()) {
    await mProgressCta.click()
    await m390.waitForTimeout(1000)
  }
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_e_progress_390.png') })
  console.log('Captured: mobile_e_progress_390.png')
  await m390.keyboard.press('Escape')
  await m390.waitForTimeout(400)

  // Mobile Chat
  const mChatTrigger = m390.locator('[data-testid="campus-chat-trigger"]')
  if (await mChatTrigger.isVisible()) {
    await mChatTrigger.click()
    await m390.waitForTimeout(1000)
    await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_f_chat_390.png') })
    console.log('Captured: mobile_f_chat_390.png')
    await m390.keyboard.press('Escape')
  }

  await mobile390Context.close()

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MOBILE 360x800
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Mobile 360x800 Screenshots & Overflow Verification ---')
  const mobile360Context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36',
  })
  await mobile360Context.addCookies([{
    name: 'c10a7_session',
    value: studentCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])
  const m360 = await mobile360Context.newPage()

  await m360.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await m360.waitForTimeout(2000)
  const m360ScrollHome = await m360.evaluate(() => document.documentElement.scrollWidth)
  const m360ClientHome = await m360.evaluate(() => document.documentElement.clientWidth)
  console.log(`Mobile 360x800 Home overflow check: scrollWidth=${m360ScrollHome}, clientWidth=${m360ClientHome} (Pass: ${m360ScrollHome <= m360ClientHome})`)
  await m360.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_360_home.png') })
  console.log('Captured: mobile_360_home.png')

  await m360.goto(`${STAGING}/me`, { waitUntil: 'domcontentloaded' })
  await m360.waitForTimeout(1500)
  const m360ScrollProfile = await m360.evaluate(() => document.documentElement.scrollWidth)
  const m360ClientProfile = await m360.evaluate(() => document.documentElement.clientWidth)
  console.log(`Mobile 360x800 Profile overflow check: scrollWidth=${m360ScrollProfile}, clientWidth=${m360ClientProfile} (Pass: ${m360ScrollProfile <= m360ClientProfile})`)
  await m360.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_360_profile.png') })
  console.log('Captured: mobile_360_profile.png')

  await mobile360Context.close()
  await browser.close()

  console.log('\n>>> ALL U2 SCREENSHOTS CAPTURED SUCCESSFULLY! <<<')
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err)
  process.exit(1)
})
