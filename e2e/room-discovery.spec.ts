import { test, expect, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

// Production Refusal Guard: E2E tests MUST NEVER run against production
assertSafeDestructiveE2ETarget(process.env.PLAYWRIGHT_BASE_URL)

const USER_A = {
  username: process.env.E2E_HOST_USERNAME || 'qa.v2.thu1',
  password: process.env.E2E_HOST_PASSWORD || '',
}

const USER_B = {
  username: process.env.E2E_MEMBER_B_USERNAME || 'qa.v2.thu2',
  password: process.env.E2E_MEMBER_B_PASSWORD || '',
}

const PASSWORD_ROOM_ID = process.env.E2E_PASSWORD_ROOM_ID || 'phong-8'
const PASSWORD_ROOM_PASSWORD = process.env.E2E_PASSWORD_ROOM_PASSWORD || 'R00m8#Secured_2026'

if (!USER_A.password || !USER_B.password) {
  throw new Error('Missing credentials for E2E users in environment or .env.e2e.')
}

async function login(page: Page, user: { username: string; password: string }) {
  await page.goto('/')
  const loginInput = page.locator('#ten-dang-nhap')
  const isLoginFormVisible = await loginInput
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)

  if (isLoginFormVisible) {
    await loginInput.fill(user.username)
    await page.locator('#mat-khau').fill(user.password)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/login') && r.status() === 200, { timeout: 15000 }).catch(() => null),
      page.locator('button[type="submit"]:has-text("Đăng nhập")').click(),
    ])
    await expect(loginInput).not.toBeVisible({ timeout: 20000 })
  }
}

/** Reset any existing relationship between A and B via direct authenticated API */
async function resetSocialRelationship(pageA: Page, pageB: Page) {
  for (const page of [pageA, pageB]) {
    await page.evaluate(async () => {
      try {
        const stateRes = await fetch('/api/social/state')
        const stateData = await stateRes.json()
        if (stateData.ok && stateData.state) {
          for (const req of stateData.state.incomingRequests || []) {
            await fetch('/api/social/reject', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requestId: req.id }),
            })
          }
          for (const req of stateData.state.outgoingRequests || []) {
            await fetch('/api/social/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requestId: req.id }),
            })
          }
          for (const f of stateData.state.friends || []) {
            await fetch('/api/social/unfriend', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ friendAccountId: f.id }),
            })
          }
          for (const b of stateData.state.blockedUsers || []) {
            await fetch('/api/social/unblock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetAccountId: b.id }),
            })
          }
        }
      } catch {}
    })
  }
}

test.describe('Digital Campus v2 — Activity / Room Discovery v1 Acceptance Suite', () => {
  test.setTimeout(180000)

  test('Live Room Discovery Flow: Friend entry indicator -> Filter -> Room migration -> Admission safety -> Offline / Block invalidation', async ({
    browser,
  }) => {
    // ── Setup two isolated browser sessions ──────────────────────────────────
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()

    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // 1. A and B login
      await login(pageA, USER_A)
      await login(pageB, USER_B)

      // Reset any previous state for idempotent testing
      await resetSocialRelationship(pageA, pageB)

      // Reload both pages to reflect clean social state
      await pageA.goto('/')
      await pageB.goto('/')

      // Ensure Campus websocket connects on both clients
      await expect(pageA.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })
      await expect(pageB.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })

      // 2. Establish friendship through canonical flow: A requests, B accepts
      await pageA.locator('[data-testid="friends-drawer-trigger"]').click()
      await expect(pageA.locator('[data-testid="tab-search"]')).toBeVisible({ timeout: 5000 })
      await pageA.locator('[data-testid="tab-search"]').click()

      await pageA.locator('[data-testid="search-user-input"]').fill(USER_B.username)
      const searchResultB = pageA.locator(`[data-testid="search-result-${USER_B.username}"]`)
      await expect(searchResultB).toBeVisible({ timeout: 10000 })

      const addFriendBtn = pageA.locator(`[data-testid="add-friend-btn-${USER_B.username}"]`)
      await expect(addFriendBtn).toBeVisible()
      await addFriendBtn.click()

      // B receives and accepts
      const pendingBadgeB = pageB.locator('[data-testid="pending-requests-badge"]')
      await expect(pendingBadgeB).toBeVisible({ timeout: 15000 })
      await pageB.locator('[data-testid="friends-drawer-trigger"]').click()
      await pageB.locator('[data-testid="tab-requests"]').click()

      const acceptBtn = pageB.locator(`[data-testid="accept-request-btn-${USER_A.username}"]`)
      await expect(acceptBtn).toBeVisible({ timeout: 5000 })
      await acceptBtn.click()

      // Close drawers
      await pageA.keyboard.press('Escape')
      await pageB.keyboard.press('Escape')

      // Ensure both are on Campus lobby
      await expect(pageA.locator('[data-testid="room-card-7"]')).toBeVisible({ timeout: 15000 })

      // Initially no friend indicators on room cards
      await expect(pageA.locator('[data-testid="room-friends-indicator-7"]')).not.toBeVisible()

      // 3. B enters visible room X (phong-7)
      await pageB.goto('/room/phong-7')
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // 4. On A without reload: room 7 card shows "1 bạn đang ở đây"
      const room7Indicator = pageA.locator('[data-testid="room-friends-indicator-7"]')
      await expect(room7Indicator).toBeVisible({ timeout: 15000 })
      await expect(room7Indicator).toContainText('1 bạn đang ở đây')

      // Assert presentational semantics: not exposed as interactive button/control, no button role, no tabindex
      await expect(room7Indicator).not.toHaveRole('button')
      await expect(room7Indicator).not.toHaveAttribute('tabindex')
      const room7JoinBtn = pageA.locator('[data-testid="room-card-7"] button:has-text("Vào phòng")')
      await expect(room7JoinBtn).toBeVisible()
      await expect(room7JoinBtn).toBeEnabled()

      // 5. A activates "Có bạn bè" filter
      const filterBtn = pageA.locator('[data-testid="filter-co-ban-be"]')
      await expect(filterBtn).toBeVisible()
      await filterBtn.click()

      // Require: room 7 visible, rooms with no visible friends (e.g. room 8, room 9) excluded
      await expect(pageA.locator('[data-testid="room-card-7"]')).toBeVisible()
      await expect(pageA.locator('[data-testid="room-card-8"]')).not.toBeVisible()
      await expect(pageA.locator('[data-testid="room-card-9"]')).not.toBeVisible()

      // 6. B moves from room 7 (X) to room 9 (Y)
      await pageB.goto('/room/phong-9')
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // 7. On A without reload:
      // X friend indicator disappears, Y receives friend indicator
      // Because "Có bạn bè" filter is still active, room 7 disappears and room 9 appears!
      await expect(pageA.locator('[data-testid="room-friends-indicator-7"]')).not.toBeVisible({ timeout: 15000 })
      await expect(pageA.locator('[data-testid="room-card-7"]')).not.toBeVisible({ timeout: 15000 })
      await expect(pageA.locator('[data-testid="room-card-9"]')).toBeVisible({ timeout: 15000 })
      const room9Indicator = pageA.locator('[data-testid="room-friends-indicator-9"]')
      await expect(room9Indicator).toBeVisible({ timeout: 15000 })
      await expect(room9Indicator).toContainText('1 bạn đang ở đây')

      // 8. A clicks room Y Join -> existing room admission path executes
      await pageA.locator('[data-testid="room-card-9"] button:has-text("Vào phòng")').click()
      await expect(pageA).toHaveURL(/\/room\/phong-9/, { timeout: 15000 })
      await expect(pageA.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // 9. Password / Gated room admission test:
      // A returns to lobby
      await pageA.goto('/')
      await expect(pageA.locator('[data-testid="room-card-7"]')).toBeVisible({ timeout: 15000 })

      // B enters password room (phong-8) via canonical admit API
      await pageB.evaluate(async (pw) => {
        await fetch('/api/rooms/8/admit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw }),
        })
      }, PASSWORD_ROOM_PASSWORD)
      await pageB.goto('/room/phong-8')
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // On A's lobby: Room 8 shows friend indicator
      const room8Indicator = pageA.locator('[data-testid="room-friends-indicator-8"]')
      await expect(room8Indicator).toBeVisible({ timeout: 15000 })
      await expect(room8Indicator).toContainText('1 bạn đang ở đây')

      // A clicks Room 8 Join -> password modal MUST appear, admission gate cannot be bypassed
      await pageA.locator('[data-testid="room-card-8"] button:has-text("Vào phòng")').click()
      const pwDialogA = pageA.locator('#room-password-input')
      await expect(pwDialogA).toBeVisible({ timeout: 8000 })
      // Close password dialog
      await pageA.keyboard.press('Escape')

      // 10. B leaves / goes offline -> friend indicator disappears without reload
      await pageB.close()

      // After B closes tab and grace period expires, friend indicator on A clears
      await expect(room8Indicator).not.toBeVisible({ timeout: 20000 })

      // 11. Block scenario: B reopens, logs in, and blocks A
      const pageB2 = await contextB.newPage()
      await login(pageB2, USER_B)
      await expect(pageB2.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })

      // B enters room 7
      await pageB2.goto('/room/phong-7')
      await expect(pageB2.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // A sees friend on room 7
      await expect(pageA.locator('[data-testid="room-friends-indicator-7"]')).toBeVisible({ timeout: 15000 })

      // B blocks A via API or drawer
      await pageB2.evaluate(async () => {
        try {
          const stateRes = await fetch('/api/social/state')
          const stateData = await stateRes.json()
          const friend = stateData.state?.friends?.[0]
          if (friend) {
            await fetch('/api/social/block', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ targetAccountId: friend.id }),
            })
          }
        } catch {}
      })

      // Without reload: A immediately loses friend visibility on room 7
      await expect(pageA.locator('[data-testid="room-friends-indicator-7"]')).not.toBeVisible({ timeout: 15000 })
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
    }
  })
})
