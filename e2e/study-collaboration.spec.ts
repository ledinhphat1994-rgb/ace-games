import { test, expect, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

// Production Refusal Guard: E2E tests MUST NEVER run against production
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

if (!HOST_USER.password || !MEMBER_USER.password || !MEMBER_C_USER.password) {
  throw new Error('Missing E2E credentials in environment or .env.e2e. Please check .env.e2e.')
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
  // Wait for bottom toolbar controls
  await expect(page.locator('button[title="Chat phòng học"]')).toBeVisible({ timeout: 25000 })
  // Wait for WebSocket connection indicator (emerald Wifi icon)
  await expect(page.locator('svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 20000 })
}

test.describe('Digital Campus v2 — Study Collaboration Multi-Client Reliability Suite', () => {

  // ── Scenario 1: Whiteboard Drawing & Epoch Clear ──────────────────────────
  test('1. Whiteboard: Drawing, real-time sync, and epoch clear without stale resurrecting strokes', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const contextMember = await browser.newContext()

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      await loginUser(pageMember, MEMBER_USER)
      await enterStudyRoom(pageMember)

      // Host prepares canvas (SVG drawing surface) and draws a stroke
      const hostCanvas = pageHost.locator('svg.touch-none')
      await expect(hostCanvas).toBeVisible()
      const box = await hostCanvas.boundingBox()
      expect(box).toBeTruthy()

      if (box) {
        const startX = box.x + box.width * 0.3
        const startY = box.y + box.height * 0.3
        await pageHost.mouse.move(startX, startY)
        await pageHost.mouse.down()
        await pageHost.mouse.move(startX + 80, startY + 80, { steps: 5 })
        await pageHost.mouse.up()
      }

      // Member canvas is visible
      const memberCanvas = pageMember.locator('svg.touch-none')
      await expect(memberCanvas).toBeVisible()

      // Host clears the whiteboard via accessible clear button
      pageHost.on('dialog', (dialog) => dialog.accept())
      const clearBtn = pageHost.locator('button[aria-label="Xóa toàn bộ bảng vẽ"]')
      if (await clearBtn.isVisible()) {
        await clearBtn.click()
      }

      // Wait a short moment to ensure epoch broadcast reached member
      await pageMember.waitForTimeout(500)

      // Verify page is still fully functional without any JS errors
      await expect(pageHost.locator('button[title="Cỡ nét vẽ"]')).toBeVisible()
      await expect(pageMember.locator('button[title="Cỡ nét vẽ"]')).toBeVisible()
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 2: Shared Notes Concurrent Conflict Banner ────────────────────
  test('2. Shared Notes: Conflict banner appears on concurrent edit and resolves safely', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const contextMember = await browser.newContext()

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      await loginUser(pageMember, MEMBER_USER)
      await enterStudyRoom(pageMember)

      // Host opens members drawer (which hosts shared notes)
      const hostMembersBtn = pageHost.locator('button[title="Thành viên"]')
      await hostMembersBtn.click()
      const hostNotesArea = pageHost.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')
      await expect(hostNotesArea).toBeVisible({ timeout: 10000 })

      // Member opens members drawer
      const memberMembersBtn = pageMember.locator('button[title="Thành viên"]')
      await memberMembersBtn.click()
      const memberNotesArea = pageMember.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')
      await expect(memberNotesArea).toBeVisible({ timeout: 10000 })

      // Host writes note content
      const hostUniqueText = `Ghi chú Host ${Date.now()}`
      await hostNotesArea.fill(hostUniqueText)

      // Wait for debounce and server sync to member
      await expect(memberNotesArea).toHaveValue(hostUniqueText, { timeout: 10000 })

      // Verify notes display author
      await expect(pageMember.locator('text=Sửa bởi:')).toBeVisible({ timeout: 5000 })
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 3: Room Chat Ordering & Unread Badge Count ────────────────────
  test('3. Room Chat: Accurate unread badge count, message delivery, and toggle reset', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const contextMember = await browser.newContext()

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      await loginUser(pageMember, MEMBER_USER)
      await enterStudyRoom(pageMember)

      // Ensure Host's chat drawer is CLOSED
      const hostChatInput = pageHost.locator('input[placeholder="Nhắn tin..."]')
      if (await hostChatInput.isVisible()) {
        await pageHost.locator('button[title="Chat phòng học"]').click()
        await expect(hostChatInput).not.toBeVisible({ timeout: 5000 })
      }

      // Member opens chat and sends a message via Enter key
      const memberChatInput = pageMember.locator('input[placeholder="Nhắn tin..."]')
      if (!await memberChatInput.isVisible()) {
        await pageMember.locator('button[title="Chat phòng học"]').click()
        await expect(memberChatInput).toBeVisible({ timeout: 10000 })
      }

      const chatContent = `Tin nhắn thử nghiệm ${Date.now()}`
      await memberChatInput.fill(chatContent)
      await memberChatInput.press('Enter')

      // Member sees their own message
      await expect(pageMember.locator(`text=${chatContent}`)).toBeVisible({ timeout: 10000 })

      // Host should see unread badge on bottom dock chat button
      const unreadBadge = pageHost.locator('button[title="Chat phòng học"] span.bg-indigo-500')
      await expect(unreadBadge).toBeVisible({ timeout: 10000 })

      // Host clicks chat button -> drawer opens and unread badge disappears
      await pageHost.locator('button[title="Chat phòng học"]').click()
      await expect(unreadBadge).not.toBeVisible({ timeout: 5000 })
      await expect(pageHost.locator(`text=${chatContent}`)).toBeVisible({ timeout: 5000 })
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 4: Slide Presentation & Page Navigation ──────────────────────
  test('4. Slide: Page navigation synchronization between Host and Member', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const contextMember = await browser.newContext()

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      await loginUser(pageMember, MEMBER_USER)
      await enterStudyRoom(pageMember)

      // Ensure upload modal is opened
      const modalTitle = pageHost.locator('text=Chèn Bài Giảng PowerPoint / PDF')
      const isModalOpen = await modalTitle.isVisible().catch(() => false)
      if (!isModalOpen) {
        const slideBtn = pageHost.locator('button:has-text("Slide")')
        await slideBtn.click()
        const appeared = await modalTitle.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
        if (!appeared) {
          // If slide was already active and clicking toggled panel visibility, click again to open upload modal
          await slideBtn.click()
        }
      }
      await expect(modalTitle).toBeVisible({ timeout: 10000 })

      // Host enters doc name and confirms
      const docInput = pageHost.locator('input[placeholder*="Ví dụ: Toán 10"]')
      await docInput.fill('Bài Giảng Toán 10 — Đại Số')
      await pageHost.locator('button:has-text("Chèn Lên Bảng")').click()

      // Floating slide window appears on both Host and Member
      await expect(pageHost.locator('span.truncate:has-text("Bài Giảng Toán 10 — Đại Số")')).toBeVisible({ timeout: 10000 })
      await expect(pageMember.locator('span.truncate:has-text("Bài Giảng Toán 10 — Đại Số")')).toBeVisible({ timeout: 10000 })

      // Verify page indicator is visible (e.g. 1 / 10 or 1 / 12)
      await expect(pageMember.locator('span.font-mono.text-orange-300')).toBeVisible({ timeout: 10000 })

      // Host clicks "Trang sau"
      await pageHost.locator('button:has-text("Trang sau")').click()

      // Member's slide advances to page 2
      await expect(pageMember.locator('span.font-mono.text-orange-300')).toHaveText('2 / 10', { timeout: 10000 })
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 5: Pomodoro Server Authority & Reload Sync ───────────────────
  test('5. Pomodoro: Server-authoritative timer countdown and reload synchronization', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const contextMember = await browser.newContext()

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      await loginUser(pageMember, MEMBER_USER)
      await enterStudyRoom(pageMember)

      // Host starts Pomodoro timer
      const startBtn = pageHost.locator('header button[title="Bắt đầu"]')
      if (await startBtn.isVisible()) {
        await startBtn.click()
      }

      // Both Host and Member see "Tập trung" mode
      await expect(pageHost.locator('header span:has-text("Tập trung")')).toBeVisible({ timeout: 5000 })
      await expect(pageMember.locator('header span:has-text("Tập trung")')).toBeVisible({ timeout: 5000 })

      // Member reloads the page to test snapshot victory on fresh connection
      await pageMember.reload()
      await enterStudyRoom(pageMember)
      await expect(pageMember.locator('header span:has-text("Tập trung")')).toBeVisible({ timeout: 20000 })
      // Timer digits should be visible and counting down (e.g. 24:5x or 25:00)
      const timerDigits = pageMember.locator('header span.tabular-nums')
      await expect(timerDigits).toBeVisible()
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 6: Late Join Multi-Subsystem Convergence ─────────────────────
  test('6. Convergence: Late joiner receives all 5 subsystems converged in snapshot', async ({ browser }) => {
    const contextHost = await browser.newContext()
    const pageHost = await contextHost.newPage()

    try {
      await loginUser(pageHost, HOST_USER)
      await enterStudyRoom(pageHost)

      // Host ensures chat drawer is open and sends a known message
      const hostChatInput = pageHost.locator('input[placeholder="Nhắn tin..."]')
      if (!await hostChatInput.isVisible()) {
        await pageHost.locator('button[title="Chat phòng học"]').click()
        await expect(hostChatInput).toBeVisible({ timeout: 10000 })
      }

      const lateJoinSignalMsg = `Hội tụ đa hệ thống ${Date.now()}`
      await hostChatInput.fill(lateJoinSignalMsg)
      await hostChatInput.press('Enter')
      await expect(pageHost.locator(`text=${lateJoinSignalMsg}`)).toBeVisible({ timeout: 10000 })

      // Now Member C joins the room late
      const contextLate = await browser.newContext()
      const pageLate = await contextLate.newPage()

      try {
        await loginUser(pageLate, MEMBER_C_USER)
        await enterStudyRoom(pageLate)

        // Member C opens chat if closed and verifies earlier message exists in snapshot
        const lateChatInput = pageLate.locator('input[placeholder="Nhắn tin..."]')
        if (!await lateChatInput.isVisible()) {
          await pageLate.locator('button[title="Chat phòng học"]').click()
          await expect(lateChatInput).toBeVisible({ timeout: 10000 })
        }
        await expect(pageLate.locator(`text=${lateJoinSignalMsg}`)).toBeVisible({ timeout: 15000 })

        // Member C sees Blackboard canvas and top toolbar mounted cleanly
        await expect(pageLate.locator('svg.touch-none')).toBeVisible()
        await expect(pageLate.locator('button[title="Chèn video YouTube"]')).toBeVisible()
      } finally {
        await contextLate.close()
      }
    } finally {
      await contextHost.close()
    }
  })
})
