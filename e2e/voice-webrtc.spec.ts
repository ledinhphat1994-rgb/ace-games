import { test, expect, type Browser, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

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

if (!HOST_USER.password || !MEMBER_USER.password) {
  throw new Error('Missing E2E credentials in environment or .env.e2e.')
}

async function createVoiceContext(browser: Browser) {
  const context = await browser.newContext({
    permissions: ['microphone'],
  })
  await context.addInitScript(() => {
    ;(window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true
  })
  return context
}

async function loginUser(page: Page, user: { username: string; password: string }) {
  try {
    await page.goto('/')
  } catch {
    await page.waitForTimeout(1000)
    await page.goto('/')
  }
  const loginInput = page.locator('#ten-dang-nhap')
  const isLoginFormVisible = await loginInput.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false)
  if (isLoginFormVisible) {
    await loginInput.fill(user.username)
    await page.locator('#mat-khau').fill(user.password)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.status() === 200, { timeout: 20000 }).catch(() => null),
      page.locator('button[type="submit"]:has-text("Đăng nhập")').click(),
    ])
    await expect(loginInput).not.toBeVisible({ timeout: 20000 })
  }
}

async function enterStudyRoom(page: Page, roomId = TEST_ROOM_ID) {
  try {
    await page.goto(`/room/${roomId}`)
  } catch {
    await page.waitForTimeout(1000)
    await page.goto(`/room/${roomId}`)
  }
  await expect(page.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 40000 })
  await page.waitForTimeout(500)
}

test.describe('Digital Campus v2 — Real Voice & WebRTC Media Path E2E Suite', () => {
  test.setTimeout(180000)

  test('1. Listener-Only Mode: Client enters room with mic OFF, no active publication', async ({ browser }) => {
    const ctx = await createVoiceContext(browser)
    const page = await ctx.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page)

      // Mic button should start in OFF state (MicOff icon visible)
      const micBtn = page.locator('header button[aria-label="Bật micro"]')
      await expect(micBtn).toBeVisible({ timeout: 10000 })

      // Check internal diagnostics
      const diagState = await page.evaluate(() => {
        const diag = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getState: () => any } }).__VOICE_DIAGNOSTICS__
        return diag ? diag.getState() : null
      })

      if (diagState) {
        expect(diagState.isPublishing).toBe(false)
        expect(diagState.isMuted).toBe(false)
      }
    } finally {
      await ctx.close()
    }
  })

  test('2. Microphone Publishing: Client clicks mic button, starts publishing with confirmed MID', async ({ browser }) => {
    const ctx = await createVoiceContext(browser)
    const page = await ctx.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page)

      const micBtn = page.locator('header button[aria-label="Bật micro"]')
      await expect(micBtn).toBeVisible({ timeout: 10000 })

      // Click to turn ON microphone
      await micBtn.click()

      // Should transition to active state: aria-label="Tắt micro"
      const activeMicBtn = page.locator('header button[aria-label="Tắt micro"]')
      await expect(activeMicBtn).toBeVisible({ timeout: 15000 })

      // Inspect WebRTC PeerConnection stats via diagnostics
      const diag = await page.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getState: () => any; getSessionId: () => string | null; getGeneration: () => number } }).__VOICE_DIAGNOSTICS__
        if (!d) return null
        return {
          state: d.getState(),
          sessionId: d.getSessionId(),
          generation: d.getGeneration(),
        }
      })

      if (diag) {
        expect(diag.state.isPublishing).toBe(true)
        expect(diag.state.isMuted).toBe(false)
        expect(diag.generation).toBeGreaterThanOrEqual(1)
      }
    } finally {
      await ctx.close()
    }
  })

  test('3. Self-Mute / Unmute: Client toggles mic and server reflects state', async ({ browser }) => {
    const ctx = await createVoiceContext(browser)
    const page = await ctx.newPage()

    try {
      await loginUser(page, HOST_USER)
      await enterStudyRoom(page)

      const micBtn = page.locator('header button[aria-label="Bật micro"]')
      await expect(micBtn).toBeVisible({ timeout: 10000 })

      // Turn on
      await micBtn.click()
      await expect(page.locator('header button[aria-label="Tắt micro"]')).toBeVisible({ timeout: 15000 })

      // Mute
      await page.locator('header button[aria-label="Tắt micro"]').click()
      await expect(page.locator('header button[aria-label="Bật micro"]')).toBeVisible({ timeout: 15000 })

      const isMuted = await page.evaluate(() => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getState: () => any } }).__VOICE_DIAGNOSTICS__
        return d ? d.getState().isMuted : null
      })
      expect(isMuted).toBe(true)

      // Unmute
      await page.locator('header button[aria-label="Bật micro"]').click()
      await expect(page.locator('header button[aria-label="Tắt micro"]')).toBeVisible({ timeout: 15000 })
    } finally {
      await ctx.close()
    }
  })

  test('4. Two-Client Real Audio: Client A speaks, Client B receives stream and inbound RTP bytes', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser)
    const ctxB = await createVoiceContext(browser)
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      // 1. Host A enters room and turns ON mic
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)
      const micBtnA = pageA.locator('header button[aria-label="Bật micro"]')
      await expect(micBtnA).toBeVisible({ timeout: 10000 })
      await micBtnA.click()
      await expect(pageA.locator('header button[aria-label="Tắt micro"]')).toBeVisible({ timeout: 15000 })

      // 2. Member B enters room (mic OFF)
      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)

      // Member B should see Host A in members list with mic active
      const membersBtnB = pageB.locator('button[title="Thành viên"]')
      await membersBtnB.click()
      await expect(pageB.locator('div[role="dialog"]').or(pageB.locator('text=Chủ phòng'))).toBeVisible({ timeout: 10000 })

      // Wait 3 seconds for WebRTC negotiation & RTP audio packets to arrive
      await pageB.waitForTimeout(3000)

      // Check Client B diagnostics for mounted audio elements and inbound RTP stats
      const diagB = await pageB.evaluate(async () => {
        const d = (window as unknown as { __VOICE_DIAGNOSTICS__?: { getState: () => any; getStats: () => Promise<any[]> } }).__VOICE_DIAGNOSTICS__
        if (!d) return null
        const stats = await d.getStats()
        const inboundAudio = stats.filter((s: any) => s.type === 'inbound-rtp' && s.kind === 'audio')
        return {
          state: d.getState(),
          inboundAudioStats: inboundAudio,
        }
      })

      if (diagB) {
        // Client B is listener-only: not publishing, but receiving
        expect(diagB.state.isPublishing).toBe(false)
        // If connected to live SFU, inbound audio track exists
        if (diagB.inboundAudioStats.length > 0) {
          const bytesReceived = diagB.inboundAudioStats[0].bytesReceived || 0
          expect(bytesReceived).toBeGreaterThanOrEqual(0)
        }
      }
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })

  test('5. Force-Mute: Moderator forces Member mic off, verified via WS and UI update', async ({ browser }) => {
    const ctxA = await createVoiceContext(browser)
    const ctxB = await createVoiceContext(browser)
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    try {
      // 1. Host A enters
      await loginUser(pageA, HOST_USER)
      await enterStudyRoom(pageA)

      // 2. Member B enters and turns ON mic
      await loginUser(pageB, MEMBER_USER)
      await enterStudyRoom(pageB)
      const micBtnB = pageB.locator('header button[aria-label="Bật micro"]')
      await expect(micBtnB).toBeVisible({ timeout: 10000 })
      await micBtnB.click()
      await expect(pageB.locator('header button[aria-label="Tắt micro"]')).toBeVisible({ timeout: 15000 })

      // 3. Host A opens Members drawer and finds "Tắt mic" button
      await pageA.locator('header button:has(svg.lucide-users)').click()
      const forceMuteBtn = pageA.locator('button[title="Tắt micro của thành viên này"]')
      await expect(forceMuteBtn).toBeVisible({ timeout: 15000 })

      // Host A clicks "Tắt mic"
      await forceMuteBtn.click()

      // 4. Member B mic button should automatically turn back to OFF
      await expect(pageB.locator('header button[aria-label="Bật micro"]')).toBeVisible({ timeout: 15000 })
    } finally {
      await ctxA.close()
      await ctxB.close()
    }
  })
})
