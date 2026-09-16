import { test, expect, type Page, type Browser } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

// Enforce allowlist for destructive E2E
assertSafeDestructiveE2ETarget(process.env.PLAYWRIGHT_BASE_URL)

const HOST_USER = {
  username: process.env.E2E_HOST_USERNAME || 'qa.v2.thu1',
  password: process.env.E2E_HOST_PASSWORD || '',
}

const MEMBER_USER = {
  username: process.env.E2E_MEMBER_B_USERNAME || 'qa.v2.thu2',
  password: process.env.E2E_MEMBER_B_PASSWORD || '',
}

const TEST_ROOM_ID = process.env.E2E_PUBLIC_ROOM_ID || 'phong-7'
const TEST_VIDEO_ID = 'jNQXAC9IVRw'

if (!HOST_USER.password || !MEMBER_USER.password) {
  throw new Error('Missing E2E credentials in environment or .env.e2e. Please check .env.e2e.example.')
}

async function loginUser(page: Page, user: { username: string; password: string }) {
  await page.goto('/')
  const loginInput = page.locator('#ten-dang-nhap')
  const isLoginFormVisible = await loginInput.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false)
  if (isLoginFormVisible) {
    await loginInput.fill(user.username)
    await page.locator('#mat-khau').fill(user.password)
    await page.locator('button[type="submit"]:has-text("Đăng nhập")').click()
    await expect(loginInput).not.toBeVisible({ timeout: 15000 })
  }
}

async function enterStudyRoom(page: Page, roomId = TEST_ROOM_ID) {
  await page.goto(`/room/${roomId}`)
  await expect(page.locator('button[title="Chèn video YouTube"]')).toBeVisible({ timeout: 20000 })
  await expect(page.locator('svg.text-emerald-400')).toBeVisible({ timeout: 15000 })
}

declare global {
  interface Window {
    __YT_PLAYER_INSTANCE__?: {
      getCurrentTime: () => number
      getPlayerState: () => number
      getPlaybackRate: () => number
      getAvailablePlaybackRates: () => number[]
      getVideoData: () => { video_id?: string; title?: string } | null
      isReady: boolean
    }
  }
}

async function waitForYTPlayerReady(page: Page, timeout = 60000) {
  await page.waitForFunction(() => {
    return window.__YT_PLAYER_INSTANCE__ && window.__YT_PLAYER_INSTANCE__.isReady
  }, undefined, { timeout })
}

async function startOrUnblockPlayback(page: Page) {
  const syncBtn = page.locator('button:has-text("Đồng bộ & Phát ngay")')
  if (await syncBtn.isVisible().catch(() => false)) {
    await syncBtn.click({ force: true })
    return
  }
  const playBtn = page.locator('button[title="Phát"]')
  const canPlay = await playBtn.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
  if (canPlay) {
    await playBtn.click({ force: true })
  }
  const blockedAppeared = await syncBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (blockedAppeared) {
    await syncBtn.click({ force: true })
  }
}

async function loadVideoIfNone(page: Page, videoId = TEST_VIDEO_ID) {
  const isTargetLoaded = await page.evaluate((targetVid) => {
    const currentVid = window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id
    const title = document.querySelector('div.font-bold.text-white')?.textContent || ''
    return currentVid === targetVid || title.includes(targetVid)
  }, videoId).catch(() => false)

  if (isTargetLoaded) return

  const pasteTabBtn = page.locator('button:has-text("\uD83D\uDD17 Dán link")')
  const isPanelOpen = await pasteTabBtn.isVisible().catch(() => false)
  if (!isPanelOpen) {
    await page.locator('button[title="Chèn video YouTube"]').click()
    await expect(pasteTabBtn).toBeVisible({ timeout: 5000 })
  }
  await pasteTabBtn.click()

  const pasteInput = page.locator('input[placeholder="Dán link YouTube hoặc mã video..."]')
  await expect(pasteInput).toBeVisible({ timeout: 5000 })
  await pasteInput.fill(videoId)
  await page.locator('form:has(input[placeholder="Dán link YouTube hoặc mã video..."]) button[type="submit"]').click()
  await page.waitForTimeout(1000)
}

async function createContextWithE2EMode(browser: Browser) {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    try {
      window.sessionStorage.setItem('c10a7_e2e_mode', '1')
    } catch {}
  })
  return context
}

test.describe('Watch Together — Autoplay Policy Restricted Suite', () => {

  test('Autoplay Block Handling under --autoplay-policy=user-gesture-required — User Action "Đồng bộ & Phát ngay" Resumes Playback', async ({ browser }) => {
    test.setTimeout(180000)

    // Context A = Host, Context B = Member
    // Both contexts inherit the browser launched with --autoplay-policy=user-gesture-required
    const contextA = await createContextWithE2EMode(browser)
    const contextB = await createContextWithE2EMode(browser)
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      console.log('[Autoplay Test] 1. Logging in Host...')
      await loginUser(pageA, HOST_USER)
      console.log('[Autoplay Test] 2. Entering room as Host...')
      await enterStudyRoom(pageA, TEST_ROOM_ID)
      console.log('[Autoplay Test] 3. Loading video as Host...')
      await loadVideoIfNone(pageA)

      // Member B logs in and enters room FIRST, while video is paused at 0s
      console.log('[Autoplay Test] 4. Logging in Member B...')
      await loginUser(pageB, MEMBER_USER)
      console.log('[Autoplay Test] 5. Entering room as Member B...')
      await enterStudyRoom(pageB, TEST_ROOM_ID)
      // NOTE: Do NOT call waitForYTPlayerReady(pageB) here — Member B's YT player only mounts
      // AFTER the host starts playing (room state transitions to "playing"). Waiting for it
      // in the paused state causes a guaranteed 60s+ timeout in CI.

      // Ensure Host player is fully ready before starting playback
      console.log('[Autoplay Test] 6. Waiting for Host player to be ready...')
      await waitForYTPlayerReady(pageA)

      // Host starts playback with an explicit user click
      console.log('[Autoplay Test] 7. Host starting playback...')
      await startOrUnblockPlayback(pageA)
      await pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, undefined, { timeout: 15000 })
      console.log('[Autoplay Test] 8. Host is playing successfully.')

      // Since Member B browser requires user gesture and has not received one,
      // the incoming play command triggers autoplay block detection overlay!
      // Allow up to 30s for: player mount + WebSocket sync + overlay render
      console.log('[Autoplay Test] 9. Checking for blocked overlay on Member B...')
      const blockedOverlayBtn = pageB.locator('button:has-text("Đồng bộ & Phát ngay")')
      await expect(blockedOverlayBtn).toBeVisible({ timeout: 30000 })
      console.log('[Autoplay Test] 10. Blocked overlay IS visible.')

      // Host remains playing uninterrupted
      const hostState = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState())
      expect(hostState).toBe(1)

      // Member B clicks "Đồng bộ & Phát ngay" to dismiss block
      console.log('[Autoplay Test] 11. Member B clicks unblock button...')
      await blockedOverlayBtn.click({ force: true })

      // Overlay should disappear
      await expect(blockedOverlayBtn).not.toBeVisible({ timeout: 10000 })

      // Member B transitions to playing (state 1 or buffering 3)
      await pageB.waitForFunction(() => {
        const s = window.__YT_PLAYER_INSTANCE__?.getPlayerState()
        return s === 1 || s === 3
      }, undefined, { timeout: 15000 })

      const memberState = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState())
      console.log(`[Autoplay Test] 12. Member B final state: ${memberState}`)
      expect(memberState === 1 || memberState === 3).toBe(true)
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
    }
  })

})
