import { test, expect, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

// Production Refusal Guard: Destructive Watch Together tests MUST NEVER run against production
assertSafeDestructiveE2ETarget(process.env.PLAYWRIGHT_BASE_URL)

const HOST_USER = {
  username: process.env.E2E_HOST_USERNAME || 'qa.v2.thu1',
  password: process.env.E2E_HOST_PASSWORD || '',
}

const MEMBER_USER = {
  username: process.env.E2E_MEMBER_B_USERNAME || 'qa.v2.thu2',
  password: process.env.E2E_MEMBER_B_PASSWORD || '',
}

const MEMBER_C_USER = {
  username: process.env.E2E_MEMBER_C_USERNAME || 'qa.v2.thu3',
  password: process.env.E2E_MEMBER_C_PASSWORD || '',
}

const TEST_ROOM_ID = process.env.E2E_PUBLIC_ROOM_ID || 'phong-7'
const PASSWORD_ROOM_ID = process.env.E2E_PASSWORD_ROOM_ID || 'phong-8'
const PASSWORD_ROOM_PASSWORD = process.env.E2E_PASSWORD_ROOM_PASSWORD || ''

// Fail-fast on missing credentials
if (!HOST_USER.password || !MEMBER_USER.password || !MEMBER_C_USER.password) {
  throw new Error('Missing E2E credentials in environment or .env.e2e. Please check .env.e2e.example.')
}

// "Me at the zoo" - First YouTube video, universally embeddable without region/copyright blocks (19s)
const TEST_VIDEO_ID = 'jNQXAC9IVRw'

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
  // Wait for WebSocket connection to be fully established and online
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

async function waitForYTPlayerReady(page: Page, timeout = 25000) {
  await page.waitForFunction(() => {
    return window.__YT_PLAYER_INSTANCE__ && window.__YT_PLAYER_INSTANCE__.isReady
  }, { timeout })
}

async function startOrUnblockPlayback(page: Page) {
  const syncBtn = page.locator('button:has-text("Đồng bộ & Phát ngay")')
  if (await syncBtn.isVisible().catch(() => false)) {
    await syncBtn.click()
    return
  }
  const playBtn = page.locator('button[title="Phát"]')
  const canPlay = await playBtn.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
  if (canPlay) {
    await playBtn.click()
  }
  const blockedAppeared = await syncBtn.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
  if (blockedAppeared) {
    await syncBtn.click()
  }
}

async function loadVideoIfNone(page: Page, videoId = TEST_VIDEO_ID) {
  let isTargetLoaded = await page.evaluate((targetVid) => {
    const currentVid = window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id
    const title = document.querySelector('div.font-bold.text-white')?.textContent || ''
    return currentVid === targetVid || title.includes(targetVid)
  }, videoId).catch(() => false)

  console.log(`[loadVideoIfNone] target: ${videoId} | isLoaded: ${isTargetLoaded}`)
  if (!isTargetLoaded) {
    const pasteTabBtn = page.locator('button:has-text("🔗 Dán link")')
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

  await waitForYTPlayerReady(page)

  // Pause if playing to ensure clean starting point
  const pauseBtn = page.locator('button[title="Tạm dừng"]')
  if (await pauseBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await pauseBtn.click()
    await page.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 5000 }).catch(() => {})
  }

  // Seek to 0
  const seekSlider = page.locator('input[title="Tua đến vị trí"]')
  if (await seekSlider.isVisible({ timeout: 1500 }).catch(() => false)) {
    await seekSlider.fill('0')
    await seekSlider.dispatchEvent('change')
  }

  // Reset rate to 1x
  const rateSelect = page.locator('select[title="Tốc độ phát chung"]')
  if (await rateSelect.isVisible({ timeout: 1500 }).catch(() => false)) {
    await rateSelect.selectOption('1')
  }
}

async function createContextWithE2EMode(browser: any, options = {}) {
  const ctx = await browser.newContext(options)
  await ctx.addInitScript(() => {
    ;(window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true
  })
  return ctx
}

test.describe('Real Watch Together — Multi-Browser Acceptance Suite', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      ;(window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true
    })
  })

  test.beforeAll(async ({ browser }) => {
    // Media State Hygiene: establish known deterministic baseline at suite start
    const context = await createContextWithE2EMode(browser)
    const page = await context.newPage()
    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page, TEST_ROOM_ID)
      await loadVideoIfNone(page, TEST_VIDEO_ID)
      const pauseBtn = page.locator('button[title="Tạm dừng"]')
      if (await pauseBtn.isVisible().catch(() => false)) {
        await pauseBtn.click()
      }
    } catch (e) {
      console.warn('[Suite Hygiene] beforeAll media baseline error:', e)
    } finally {
      await context.close().catch(() => {})
    }
  })

  test.afterAll(async ({ browser }) => {
    // Media State Hygiene: leave room in deterministic state (paused, time=0, rate=1)
    const context = await createContextWithE2EMode(browser)
    const page = await context.newPage()
    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page, TEST_ROOM_ID)
      const pauseBtn = page.locator('button[title="Tạm dừng"]')
      if (await pauseBtn.isVisible().catch(() => false)) {
        await pauseBtn.click()
      }
    } catch (e) {
      console.warn('[Suite Hygiene] afterAll media reset error:', e)
    } finally {
      await context.close().catch(() => {})
    }
  })

  test('1. Two Real Browser Contexts (Host A & Member B) — Load, Play, Drift, Seek, Rate, Reconnect', async ({ browser }) => {
    test.setTimeout(120000)
    // Context A = Host
    const contextA = await createContextWithE2EMode(browser, { viewport: { width: 1280, height: 800 } })
    const pageA = await contextA.newPage()

    // Context B = Member
    const contextB = await createContextWithE2EMode(browser, { viewport: { width: 1280, height: 800 } })
    const pageB = await contextB.newPage()

    try {
      // 1. Both log in and enter room
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA, TEST_ROOM_ID)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB, TEST_ROOM_ID)

      // 2. Host ensures video is loaded
      await loadVideoIfNone(pageA)

      // 3. Both clients must mount player and become ready
      await waitForYTPlayerReady(pageA)
      await waitForYTPlayerReady(pageB)

      // Wait for both players to load the exact videoId
      await pageA.waitForFunction((vid) => window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id === vid, TEST_VIDEO_ID, { timeout: 15000 })
      await pageB.waitForFunction((vid) => window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id === vid, TEST_VIDEO_ID, { timeout: 15000 })

      // Check both players loaded the exact videoId
      const videoDataA = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getVideoData())
      const videoDataB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getVideoData())
      expect(videoDataA?.video_id).toBe(TEST_VIDEO_ID)
      expect(videoDataB?.video_id).toBe(TEST_VIDEO_ID)

      // 4. Host presses Play and unblocks audio gesture if needed
      await startOrUnblockPlayback(pageA)
      await startOrUnblockPlayback(pageB)

      // 5. Wait for playback to begin on both and allow convergence window
      await pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 })
      await pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 })

      await Promise.all([
        pageA.waitForFunction(() => (window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0) >= 4.0, { timeout: 15000 }),
        pageB.waitForFunction(() => (window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0) >= 4.0, { timeout: 15000 }),
      ])

      // 6. Measure real player drift
      const timeA = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      const timeB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      const absoluteDrift = Math.abs(timeA - timeB)

      console.log(`[E2E 2-Browser Convergence] Time A: ${timeA.toFixed(3)}s | Time B: ${timeB.toFixed(3)}s | Absolute Drift: ${absoluteDrift.toFixed(3)}s`)
      expect(timeA).toBeGreaterThan(1.0)
      expect(timeB).toBeGreaterThan(1.0)
      expect(absoluteDrift).toBeLessThanOrEqual(1.0) // Must be <= 1.0s under healthy test connection

      // 7. Host pauses
      const pauseBtnA = pageA.locator('button[title="Tạm dừng"]')
      await pauseBtnA.click()

      // Both players should transition to paused (state 2)
      await pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 10000 })
      await pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 10000 })

      // 8. Host seeks to 6.0s
      const seekSlider = pageA.locator('input[title="Tua đến vị trí"]')
      await seekSlider.fill('6')
      await seekSlider.dispatchEvent('change')

      // Wait for convergence at seek target
      await pageB.waitForFunction(() => {
        const t = window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0
        return Math.abs(t - 6) < 1.5
      }, { timeout: 10000 })

      const postSeekB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      console.log(`[E2E Seek Convergence] Member B position post-seek: ${postSeekB.toFixed(3)}s`)
      expect(Math.abs(postSeekB - 6)).toBeLessThanOrEqual(1.5)

      // 9. Host changes playback rate to 1.5x
      const rateSelect = pageA.locator('select[title="Tốc độ phát chung"]')
      await rateSelect.selectOption('1.5')

      // Member B should apply canonical rate 1.5x
      await pageB.waitForFunction(() => {
        return window.__YT_PLAYER_INSTANCE__?.getPlaybackRate() === 1.5
      }, { timeout: 10000 })

      const rateB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getPlaybackRate())
      expect(rateB).toBe(1.5)

      // 10. Host seeks to 2.0s to ensure ample playback runway and resumes play
      await seekSlider.fill('2')
      await seekSlider.dispatchEvent('change')
      await startOrUnblockPlayback(pageA)
      await startOrUnblockPlayback(pageB)
      await pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 10000 })
      await pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 10000 })

      // 11. Member B refreshes page & reconverges
      await pageB.reload()
      await enterStudyRoom(pageB, TEST_ROOM_ID)
      await waitForYTPlayerReady(pageB)
      await startOrUnblockPlayback(pageB)

      await pageB.waitForFunction(() => {
        const state = window.__YT_PLAYER_INSTANCE__?.getPlayerState()
        const t = window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0
        return (state === 1 || state === 3) && t >= 2.0
      }, { timeout: 15000 })

      const reconvergeTimeB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      console.log(`[E2E Reconnect] Member B resumed after reload at ${reconvergeTimeB.toFixed(3)}s`)
      expect(reconvergeTimeB).toBeGreaterThanOrEqual(2.0)
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
    }
  })

  test('2. Three Real Browser Contexts (A, B, C) — Multi-Client Actions & Pairwise Drift', async ({ browser }) => {
    test.setTimeout(120000)
    const contextA = await createContextWithE2EMode(browser)
    const pageA = await contextA.newPage()

    const contextB = await createContextWithE2EMode(browser)
    const pageB = await contextB.newPage()

    const contextC = await createContextWithE2EMode(browser)
    const pageC = await contextC.newPage()

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA, TEST_ROOM_ID)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB, TEST_ROOM_ID)

      await loginUser(pageC, MEMBER_C_USER)
      await enterStudyRoom(pageC, TEST_ROOM_ID)

      // Host ensures video is loaded
      await loadVideoIfNone(pageA)

      await waitForYTPlayerReady(pageA)
      await waitForYTPlayerReady(pageB)
      await waitForYTPlayerReady(pageC)

      // 1. Start/unblock on all three clients
      await startOrUnblockPlayback(pageA)
      await startOrUnblockPlayback(pageB)
      await startOrUnblockPlayback(pageC)

      // 2. Wait until all 3 are in state 1 (playing)
      await Promise.all([
        pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
        pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
        pageC.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
      ])

      // 3. Allow convergence window for decoder warm-up & drift alignment
      await Promise.all([
        pageA.waitForFunction(() => (window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0) >= 3.0, { timeout: 15000 }),
        pageB.waitForFunction(() => (window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0) >= 2.5, { timeout: 15000 }),
        pageC.waitForFunction(() => (window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0) >= 2.5, { timeout: 15000 }),
      ])

      let timeA = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      let timeB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      let timeC = await pageC.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)

      let driftAB = Math.abs(timeA - timeB)
      let driftAC = Math.abs(timeA - timeC)
      let driftBC = Math.abs(timeB - timeC)

      console.log(`[E2E 3-Browser Triplet Metrics — Phase 1: Play]`)
      console.log(`  Client A (Host):     ${timeA.toFixed(3)}s`)
      console.log(`  Client B (Member 1): ${timeB.toFixed(3)}s`)
      console.log(`  Client C (Member 2): ${timeC.toFixed(3)}s`)
      console.log(`  Drift A-B:           ${driftAB.toFixed(3)}s`)
      console.log(`  Drift A-C:           ${driftAC.toFixed(3)}s`)
      console.log(`  Drift B-C:           ${driftBC.toFixed(3)}s`)

      expect(driftAB).toBeLessThanOrEqual(1.0)
      expect(driftAC).toBeLessThanOrEqual(1.0)
      expect(driftBC).toBeLessThanOrEqual(1.0)

      // 4. Host pauses
      const pauseBtnA = pageA.locator('button[title="Tạm dừng"]')
      await pauseBtnA.click()

      // Verify all three pause (state 2)
      await Promise.all([
        pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 10000 }),
        pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 10000 }),
        pageC.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 2, { timeout: 10000 }),
      ])

      // 5. Host seeks to 6.0s while paused
      const seekSlider = pageA.locator('input[title="Tua đến vị trí"]')
      await seekSlider.fill('6')
      await seekSlider.dispatchEvent('change')

      // Wait for both B and C to converge near 6.0s
      await Promise.all([
        pageB.waitForFunction(() => {
          const t = window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0
          return Math.abs(t - 6) < 1.5
        }, { timeout: 12000 }),
        pageC.waitForFunction(() => {
          const t = window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0
          return Math.abs(t - 6) < 1.5
        }, { timeout: 12000 }),
      ])

      // 6. Host seeks to 2.0s to ensure ample runway, then resumes playback
      await seekSlider.fill('2')
      await seekSlider.dispatchEvent('change')
      await pageA.waitForTimeout(500)

      await startOrUnblockPlayback(pageA)

      await Promise.all([
        pageA.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
        pageB.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
        pageC.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 }),
      ])

      // 7. Post-resume drift measurement
      await pageA.waitForTimeout(2000)
      timeA = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      timeB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      timeC = await pageC.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)

      driftAB = Math.abs(timeA - timeB)
      driftAC = Math.abs(timeA - timeC)
      driftBC = Math.abs(timeB - timeC)

      console.log(`[E2E 3-Browser Triplet Metrics — Phase 2: Post-Resume]`)
      console.log(`  Drift A-B: ${driftAB.toFixed(3)}s | Drift A-C: ${driftAC.toFixed(3)}s | Drift B-C: ${driftBC.toFixed(3)}s`)

      expect(driftAB).toBeLessThanOrEqual(1.0)
      expect(driftAC).toBeLessThanOrEqual(1.0)
      expect(driftBC).toBeLessThanOrEqual(1.0)
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
      await contextC.close().catch(() => {})
    }
  })

  test('3. Player Minimize / Restore Lifecycle — Preserves Mounted Host DOM Node', async ({ browser }) => {
    test.setTimeout(60000)
    const context = await createContextWithE2EMode(browser)
    const page = await context.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page, TEST_ROOM_ID)
      await loadVideoIfNone(page)
      await waitForYTPlayerReady(page)

      // Ensure playing
      await startOrUnblockPlayback(page)
      await page.waitForFunction(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState() === 1, { timeout: 15000 })
      const timeBefore = await page.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)

      // Click Minimize button
      const minBtn = page.locator('button[title="Thu nhỏ thành thanh dock mini"]')
      await expect(minBtn).toBeVisible({ timeout: 5000 })
      await minBtn.click()

      // VERIFY INVARIANT: The player host container DOM element MUST REMAIN MOUNTED IN DOCUMENT
      const isContainerMountedWhileMinimized = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="yt-player-host"], [id^="floating_yt_"]')
        return el !== null && el.isConnected
      })
      expect(isContainerMountedWhileMinimized).toBe(true)

      // Minimized floating pill must be visible
      const expandBtn = page.locator('button[title="Mở rộng khung video"]')
      await expect(expandBtn).toBeVisible({ timeout: 5000 })

      // Wait 3 seconds while minimized
      await page.waitForTimeout(3000)

      // Click Expand / Restore button
      await expandBtn.click()

      // Full window should be visible again
      await expect(page.locator('button[title="Thu nhỏ thành thanh dock mini"]')).toBeVisible({ timeout: 5000 })

      // Player must settle back into playing and time advance
      await page.waitForFunction(() => {
        const s = window.__YT_PLAYER_INSTANCE__?.getPlayerState()
        return s === 1
      }, { timeout: 15000 })

      const timeAfter = await page.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getCurrentTime() || 0)
      const stateAfter = await page.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getPlayerState())

      console.log(`[E2E Minimize Lifecycle] Before: ${timeBefore.toFixed(3)}s | After Restore: ${timeAfter.toFixed(3)}s | State: ${stateAfter}`)
      expect(stateAfter).toBe(1) // Still playing
      expect(timeAfter).toBeGreaterThan(timeBefore) // Time continuously advanced
    } finally {
      await context.close().catch(() => {})
    }
  })

  test('4. YouTube Search to Play Flow — Authoritative Load + Play on Host & Member', async ({ browser }) => {
    test.setTimeout(90000)
    const contextA = await createContextWithE2EMode(browser)
    const pageA = await contextA.newPage()

    const contextB = await createContextWithE2EMode(browser)
    const pageB = await contextB.newPage()

    try {
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA, TEST_ROOM_ID)

      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB, TEST_ROOM_ID)

      // Open YouTube panel on Host
      await pageA.locator('button[title="Chèn video YouTube"]').click()

      // Switch to search tab
      await pageA.locator('button:has-text("🔍 Tìm kiếm")').click()

      // Search for query
      const searchInput = pageA.locator('input[placeholder="Nhập từ khóa tìm bài giảng..."]')
      await expect(searchInput).toBeVisible({ timeout: 5000 })
      await searchInput.fill('toán 10')
      await pageA.locator('form:has(input[placeholder="Nhập từ khóa tìm bài giảng..."]) button[type="submit"]').click()

      // Wait for search results
      const firstResult = pageA.locator('div.max-h-60 button[data-video-id]').first()
      await expect(firstResult).toBeVisible({ timeout: 15000 })

      // Capture actual videoId from the search result card
      const selectedVideoId = await firstResult.getAttribute('data-video-id')
      expect(selectedVideoId).toBeTruthy()
      console.log(`[E2E Search to Play] Selected Video ID: ${selectedVideoId}`)

      // Click selected search result
      await firstResult.click()

      // Wait for player ready on both Host and Member B
      await waitForYTPlayerReady(pageA)
      await waitForYTPlayerReady(pageB)

      await startOrUnblockPlayback(pageA)
      await startOrUnblockPlayback(pageB)

      // Verify both Host and Member B player loaded the authoritative search videoId
      await pageA.waitForFunction((vid) => {
        return window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id === vid
      }, selectedVideoId, { timeout: 20000 })

      await pageB.waitForFunction((vid) => {
        return window.__YT_PLAYER_INSTANCE__?.getVideoData()?.video_id === vid
      }, selectedVideoId, { timeout: 20000 })

      const videoDataA = await pageA.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getVideoData())
      const videoDataB = await pageB.evaluate(() => window.__YT_PLAYER_INSTANCE__?.getVideoData())

      expect(videoDataA?.video_id).toBe(selectedVideoId)
      expect(videoDataB?.video_id).toBe(selectedVideoId)
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
    }
  })

  test('5. Password Room Admission — Reconnect with Valid Cookie, Expiry UX & Permanent Denial Handling', async ({ browser }) => {
    test.setTimeout(90000)
    const context = await createContextWithE2EMode(browser)
    const page = await context.newPage()

    try {
      await loginUser(page, HOST_USER)

      // ── Scenario A: Valid admission cookie reconnects smoothly ─────────────
      await page.goto(`/room/${PASSWORD_ROOM_ID}`)

      // If password modal appears, enter password
      const pwInput = page.locator('input[type="password"]')
      try {
        await pwInput.waitFor({ state: 'visible', timeout: 5000 })
        await pwInput.fill(PASSWORD_ROOM_PASSWORD)
        await page.locator('button:has-text("Vào phòng")').click()
      } catch {
        // No password prompt needed (already admitted)
      }

      // Should enter room successfully
      await expect(page.locator('button[title="Chèn video YouTube"]')).toBeVisible({ timeout: 15000 })

      // Reload page with VALID cookie — should automatically admit without password prompt
      await page.reload()
      await expect(page.locator('button[title="Chèn video YouTube"]')).toBeVisible({ timeout: 15000 })

      // ── Scenario B: Expired admission cookie stops reconnect and shows clean modal ──
      const cookies = await context.cookies()
      const sessionCookies = cookies.filter((c) => !c.name.startsWith('room_admit_'))
      await context.clearCookies()
      for (const c of sessionCookies) {
        await context.addCookies([c])
      }

      // Reload page — admission is now expired / missing
      await page.reload()

      // The admission-status check discovers admitted=false, stopping the reconnect loop
      // and rendering "Phiên vào phòng đã hết hạn." modal with action button
      await expect(page.locator('text=Phiên vào phòng đã hết hạn.')).toBeVisible({ timeout: 15000 })
      const backToLobbyBtn = page.locator('button:has-text("Quay lại sảnh để nhập lại mật khẩu")')
      await expect(backToLobbyBtn).toBeVisible({ timeout: 5000 })

      // ── Scenario C: Permanent room denial (e.g. non-existent room) stops reconnect ──
      await page.goto('/room/phong-999999')
      // Room does not exist -> admission-status returns 404 -> triggers permanent denial modal without infinite retry
      await expect(page.locator('text=Không thể truy cập phòng học')).toBeVisible({ timeout: 15000 })
      const backBtn = page.locator('button:has-text("Quay lại Sảnh")')
      await expect(backBtn).toBeVisible({ timeout: 5000 })
      await backBtn.click()
      await expect(page).toHaveURL(/\/(study)?$/)
    } finally {
      await context.close().catch(() => {})
    }
  })

})
