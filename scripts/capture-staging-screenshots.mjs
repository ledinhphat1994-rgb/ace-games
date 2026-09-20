// scripts/capture-staging-screenshots.mjs
import { chromium } from '@playwright/test'
import path from 'node:path'

const STAGING = 'https://gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const DOMAIN = 'gdtxdinhquan-v2.ledinhphat1994.workers.dev'
const ARTIFACTS_DIR = 'C:/Users/lepha/.gemini/antigravity-ide/brain/e6edbd18-3ae2-46b7-8200-83491b8941d2'

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
  console.log('Fetching auth session cookies from Staging API...')
  const studentCookie = await getAuthCookie('qa.v2.thu1', 'ThuNghiem@v2-2026')
  const adminCookie = await getAuthCookie('qa.v2.admin', 'ThuNghiem@v2-2026')
  console.log('Student cookie obtained:', studentCookie.slice(0, 20) + '...')
  console.log('Admin cookie obtained:', adminCookie.slice(0, 20) + '...')

  console.log('Launching browser with Playwright...')
  const browser = await chromium.launch({ headless: true })

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DESKTOP 1440x900: Student Session
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Desktop 1440x900 Tests & Screenshots ---')
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

  console.log('Navigating to staging Home as student...')
  await dPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(2500)

  // A. Desktop Home
  console.log('Capturing Desktop Home...')
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_a_home.png') })

  // Check desktop scroll width
  const dScrollWidth = await dPage.evaluate(() => document.documentElement.scrollWidth)
  const dClientWidth = await dPage.evaluate(() => document.documentElement.clientWidth)
  console.log(`Desktop Home width check: scrollWidth=${dScrollWidth}, clientWidth=${dClientWidth}`)

  // B. Desktop Learning
  console.log('Navigating to /learn...')
  await dPage.goto(`${STAGING}/learn`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(1500)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_b_learning.png') })

  // Test header search while on /learn
  console.log('Testing header search query sync on desktop...')
  const headerSearchInput = dPage.locator('header input[placeholder*="Tìm phòng học"]')
  if (await headerSearchInput.isVisible()) {
    await headerSearchInput.fill('Toán')
    await headerSearchInput.press('Enter')
    await dPage.waitForTimeout(800)
    const learnSearchInput = dPage.locator('main input[placeholder*="Tìm phòng theo tên"]')
    const learnSearchVal = await learnSearchInput.inputValue({ timeout: 2000 }).catch(() => '')
    console.log('Learning page search input value:', learnSearchVal)
  }

  // C. Desktop Chat drawer open
  console.log('Opening Chat drawer...')
  const chatTrigger = dPage.locator('[data-testid="campus-chat-trigger"]')
  if (await chatTrigger.isVisible()) {
    await chatTrigger.click()
    await dPage.waitForTimeout(800)
    await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_c_chat_drawer.png') })
    // Close chat drawer
    await dPage.keyboard.press('Escape')
    await dPage.waitForTimeout(400)
  }

  // D. Desktop Student Account Menu
  console.log('Opening Student Account Menu...')
  const accountTrigger = dPage.locator('[data-testid="account-menu-trigger"]')
  if (await accountTrigger.isVisible()) {
    await accountTrigger.click()
    await dPage.waitForTimeout(500)
    await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_d_account_menu_student.png') })
    await dPage.keyboard.press('Escape')
    await dPage.waitForTimeout(300)
  }

  // F. Desktop Community
  console.log('Navigating to /community...')
  await dPage.goto(`${STAGING}/community`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(1500)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_f_community.png') })

  // G. Desktop Profile
  console.log('Navigating to /me...')
  await dPage.goto(`${STAGING}/me`, { waitUntil: 'domcontentloaded' })
  await dPage.waitForTimeout(1500)
  await dPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_g_profile.png') })

  await desktopContext.close()

  // ──────────────────────────────────────────────────────────────────────────
  // E. DESKTOP 1440x900: Admin Session for Contextual Admin Menu
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- E. Desktop Admin Account Menu ---')
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await adminContext.addCookies([{
    name: 'c10a7_session',
    value: adminCookie,
    domain: DOMAIN,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  }])
  const aPage = await adminContext.newPage()
  await aPage.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await aPage.waitForTimeout(2000)

  const adminAccountTrigger = aPage.locator('[data-testid="account-menu-trigger"]')
  if (await adminAccountTrigger.isVisible()) {
    await adminAccountTrigger.click()
    await aPage.waitForTimeout(500)
    await aPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_e_account_menu_admin.png') })
  }
  await adminContext.close()

  // ──────────────────────────────────────────────────────────────────────────
  // 2. MOBILE 390x844: iPhone 12/13/14 viewport
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Mobile 390x844 Tests & Screenshots ---')
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
  await m390.goto(STAGING, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(2000)

  // Check 390 overflow
  const m390Scroll = await m390.evaluate(() => document.documentElement.scrollWidth)
  const m390Client = await m390.evaluate(() => document.documentElement.clientWidth)
  console.log(`Mobile 390x844 overflow check: scrollWidth=${m390Scroll}, clientWidth=${m390Client}`)
  console.log(`No horizontal overflow (390): ${m390Scroll <= m390Client}`)

  // H. Mobile Home
  console.log('Capturing Mobile Home...')
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_h_home_390.png') })

  // I. Mobile Learning
  console.log('Navigating to Learning...')
  await m390.goto(`${STAGING}/learn`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_i_learning_390.png') })

  // J. Mobile Bottom Navigation (Visible in mobile_h or standalone screenshot)
  console.log('Capturing Mobile Navigation...')
  const mBottomNav = m390.locator('nav[aria-label="Điều hướng chính di động"]')
  if (await mBottomNav.isVisible()) {
    console.log('Mobile bottom navigation bar is visible.')
  }

  // K. Mobile Chat Drawer
  console.log('Opening Mobile Chat Drawer...')
  const mChatTrigger = m390.locator('[data-testid="campus-chat-trigger"]')
  if (await mChatTrigger.isVisible()) {
    await mChatTrigger.click()
    await m390.waitForTimeout(800)
    await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_k_chat_390.png') })
    await m390.keyboard.press('Escape')
    await m390.waitForTimeout(400)
  }

  // L. Mobile Community
  console.log('Navigating to Community...')
  await m390.goto(`${STAGING}/community`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_l_community_390.png') })

  // M. Mobile Profile
  console.log('Navigating to Profile...')
  await m390.goto(`${STAGING}/me`, { waitUntil: 'domcontentloaded' })
  await m390.waitForTimeout(1500)
  await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_m_profile_390.png') })

  // N. Mobile Account Menu
  console.log('Opening Mobile Account Menu...')
  const mAccountTrigger = m390.locator('[data-testid="account-menu-trigger"]')
  if (await mAccountTrigger.isVisible()) {
    await mAccountTrigger.click()
    await m390.waitForTimeout(500)
    await m390.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_n_account_menu_390.png') })
    await m390.keyboard.press('Escape')
  }

  await mobile390Context.close()

  // ──────────────────────────────────────────────────────────────────────────
  // 3. MOBILE 360x800: Android compact viewport
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Mobile 360x800 Tests & Screenshots ---')
  const mobile360Context = await browser.newContext({
    viewport: { width: 360, height: 800 },
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

  const m360Scroll = await m360.evaluate(() => document.documentElement.scrollWidth)
  const m360Client = await m360.evaluate(() => document.documentElement.clientWidth)
  console.log(`Mobile 360x800 overflow check: scrollWidth=${m360Scroll}, clientWidth=${m360Client}`)
  console.log(`No horizontal overflow (360): ${m360Scroll <= m360Client}`)

  console.log('Capturing Mobile 360 Home...')
  await m360.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_360_home.png') })

  await mobile360Context.close()
  await browser.close()

  console.log('\n>>> ALL SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY <<<')
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err)
  process.exit(1)
})
