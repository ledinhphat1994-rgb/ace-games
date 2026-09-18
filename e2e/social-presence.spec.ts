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

test.describe('Digital Campus v2 — Campus Presence & Social Layer v1 Acceptance Suite', () => {
  test.setTimeout(120000)

  test('Complete Social Lifecycle: Request -> Accept -> Presence -> Activity -> Join Room -> Multi-Tab -> Offline Grace -> Reconnect -> Block', async ({
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

      // 2. A searches for B
      await pageA.locator('[data-testid="friends-drawer-trigger"]').click()
      await expect(pageA.locator('[data-testid="tab-search"]')).toBeVisible({ timeout: 5000 })
      await pageA.locator('[data-testid="tab-search"]').click()

      await pageA.locator('[data-testid="search-user-input"]').fill(USER_B.username)
      const searchResultB = pageA.locator(`[data-testid="search-result-${USER_B.username}"]`)
      await expect(searchResultB).toBeVisible({ timeout: 10000 })

      // 3. A sends friend request to B
      const addFriendBtn = pageA.locator(`[data-testid="add-friend-btn-${USER_B.username}"]`)
      await expect(addFriendBtn).toBeVisible()
      await addFriendBtn.click()

      // 4. B receives request in realtime
      const pendingBadgeB = pageB.locator('[data-testid="pending-requests-badge"]')
      await expect(pendingBadgeB).toBeVisible({ timeout: 15000 })
      await expect(pendingBadgeB).toHaveText('1')

      // 5. B opens drawer and accepts
      await pageB.locator('[data-testid="friends-drawer-trigger"]').click()
      await pageB.locator('[data-testid="tab-requests"]').click()

      const incomingReqA = pageB.locator(`[data-testid="incoming-request-${USER_A.username}"]`)
      await expect(incomingReqA).toBeVisible({ timeout: 5000 })

      const acceptBtn = pageB.locator(`[data-testid="accept-request-btn-${USER_A.username}"]`)
      await acceptBtn.click()

      // 6. Both see mutual friendship and online presence
      // On B:
      await pageB.locator('[data-testid="tab-friends"]').click()
      const friendItemAonB = pageB.locator(`[data-testid="friend-item-${USER_A.username}"]`)
      await expect(friendItemAonB).toBeVisible({ timeout: 10000 })
      const presenceDotA = pageB.locator(`[data-testid="presence-dot-${USER_A.username}"]`)
      await expect(presenceDotA).toHaveClass(/bg-emerald-500/, { timeout: 10000 })

      // On A:
      await pageA.locator('[data-testid="tab-friends"]').click()
      const friendItemBonA = pageA.locator(`[data-testid="friend-item-${USER_B.username}"]`)
      await expect(friendItemBonA).toBeVisible({ timeout: 10000 })
      const presenceDotB = pageA.locator(`[data-testid="presence-dot-${USER_B.username}"]`)
      await expect(presenceDotB).toHaveClass(/bg-emerald-500/, { timeout: 10000 })

      // 7. B enters room (phong-7) whose activity is allowed to be visible
      await pageB.goto('/room/phong-7')
      // Wait for room to connect
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // 8. A sees B's room activity in realtime
      const activityBonA = pageA.locator(`[data-testid="friend-activity-${USER_B.username}"]`)
      await expect(activityBonA).toBeVisible({ timeout: 15000 })
      await expect(activityBonA).toContainText(/Phòng|học nhóm/)

      // 9. A clicks Join Friend -> Existing room admission flow executes
      const joinFriendBtn = pageA.locator(`[data-testid="join-friend-btn-${USER_B.username}"]`)
      await expect(joinFriendBtn).toBeVisible({ timeout: 5000 })
      await joinFriendBtn.click()

      // A is navigated to the room and standard room admission runs
      await expect(pageA).toHaveURL(/\/room\/phong-7/, { timeout: 15000 })
      await expect(pageA.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 25000 })

      // Return A to Campus lobby to continue monitoring B's presence
      await pageA.goto('/')
      await expect(pageA.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })
      await pageA.locator('[data-testid="friends-drawer-trigger"]').click()
      await pageA.locator('[data-testid="tab-friends"]').click()

      // 10. Multi-tab/device test: B opens second tab
      const pageB2 = await contextB.newPage()
      await pageB2.goto('/')
      await expect(pageB2.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })

      // B closes first tab (room)
      await pageB.close()

      // B MUST remain online on A's screen because B still has pageB2 open!
      const presenceDotBAfterTabClose = pageA.locator(`[data-testid="presence-dot-${USER_B.username}"]`)
      await expect(presenceDotBAfterTabClose).toHaveClass(/bg-emerald-500/)

      // 11. B closes last campus connection -> after bounded grace period, B becomes offline
      await pageB2.close()

      // Immediately after closing, grace period is active (5000ms), then transitions to offline
      await expect(presenceDotBAfterTabClose).toHaveClass(/bg-slate-500/, { timeout: 15000 })

      // 12. B reconnects -> Presence returns online without duplicate social state
      const pageB3 = await contextB.newPage()
      await pageB3.goto('/')
      await expect(pageB3.locator('[data-testid="friends-drawer-trigger"]')).toBeVisible({ timeout: 15000 })

      // A sees B return online
      await expect(presenceDotBAfterTabClose).toHaveClass(/bg-emerald-500/, { timeout: 15000 })

      // Assert no duplicate friend items
      const friendItemsCount = await pageA.locator(`[data-testid="friend-item-${USER_B.username}"]`).count()
      expect(friendItemsCount).toBe(1)

      // 13. B blocks A
      await pageB3.locator('[data-testid="friends-drawer-trigger"]').click()
      await pageB3.locator('[data-testid="tab-friends"]').click()

      const blockBtnForA = pageB3.locator(`[data-testid="friend-item-${USER_A.username}"] button[title="Chặn người dùng"]`)
      await expect(blockBtnForA).toBeVisible({ timeout: 5000 })
      await blockBtnForA.click()

      // B's friends list no longer shows A
      await expect(pageB3.locator(`[data-testid="friend-item-${USER_A.username}"]`)).not.toBeVisible({ timeout: 10000 })

      // A loses social visibility of B: B disappears from A's friend list
      await expect(pageA.locator(`[data-testid="friend-item-${USER_B.username}"]`)).not.toBeVisible({ timeout: 10000 })

      // A cannot create a new friend request to B
      await pageA.locator('[data-testid="tab-search"]').click()
      await pageA.locator('[data-testid="search-user-input"]').fill(USER_B.username)
      // B's add friend button is blocked / not available
      const addBtnAfterBlock = pageA.locator(`[data-testid="add-friend-btn-${USER_B.username}"]`)
      await expect(addBtnAfterBlock).not.toBeVisible({ timeout: 5000 })
    } finally {
      await contextA.close().catch(() => {})
      await contextB.close().catch(() => {})
    }
  })
})
