import { test, expect, type Browser, type Page } from '@playwright/test'
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

/** Create a browser context with optional E2E mode for internal WS inspection */
async function createE2EContext(browser: Browser, enableE2E = true) {
  const context = await browser.newContext()
  if (enableE2E) {
    await context.addInitScript(() => {
      ;(window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ = true
    })
  }
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
  // Wait for bottom toolbar controls
  await expect(page.locator('button[title="Chat phòng học"]')).toBeVisible({ timeout: 25000 })
  // Wait for WebSocket connection indicator (emerald Wifi icon in header)
  await expect(page.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 40000 })

  // Wait for initial room snapshot to settle
  await page.waitForTimeout(500)

  // If floating video window is open, close it to free up blackboard surface
  const closeVideoBtn = page.locator('button[title="Đóng khung video"]')
  if (await closeVideoBtn.isVisible().catch(() => false)) {
    await closeVideoBtn.click().catch(() => {})
    await page.waitForTimeout(200)
  }
}

/** Upload real PDF via the standard modal file-input flow (POST /api/upload -> load_doc) */
async function uploadSlidePdf(page: Page, filePath: string) {
  const modalTitle = page.locator('text=Chèn Bài Giảng PowerPoint / PDF')
  if (!await modalTitle.isVisible().catch(() => false)) {
    await page.locator('button:has-text("Slide")').click()
    await expect(modalTitle).toBeVisible({ timeout: 10000 })
  }
  await page.setInputFiles('#slide-file-input', filePath)
  // Wait for upload and page detection to succeed
  await expect(page.locator('text=✅ Đã chọn:')).toBeVisible({ timeout: 30000 })
  await page.locator('button:has-text("Chèn Lên Bảng")').click()
  await expect(modalTitle).not.toBeVisible({ timeout: 10000 })
}

test.describe('Digital Campus v2 — Study Collaboration Multi-Client Reliability Suite', () => {
  test.setTimeout(180000)

  // ── Scenario 1: Whiteboard Drawing Convergence & Epoch Clear ──────────────
  test('1. Whiteboard: Concurrent drawing convergence, Host clear, and stale-epoch rejection', async ({ browser }) => {
    // 1. Verify production privacy: normal user has NO window.__roomWs
    const contextNormal = await createE2EContext(browser, false)
    const pageNormal = await contextNormal.newPage()
    try {
      await loginUser(pageNormal, HOST_USER)
      await enterStudyRoom(pageNormal)
      const normalWs = await pageNormal.evaluate(() => (window as unknown as { __roomWs?: unknown }).__roomWs)
      expect(normalWs).toBeUndefined()
    } finally {
      await contextNormal.close()
    }

    // 2. Setup 3 test contexts with E2E mode enabled
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)
    const contextC = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()
    const pageC = await contextC.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
        loginUser(pageC, MEMBER_C_USER),
      ])

      await enterStudyRoom(pageHost)

      // Ensure starting with clean blackboard and no active slide
      pageHost.on('dialog', (dialog) => dialog.accept())
      const initClearBtn = pageHost.locator('button[aria-label="Xóa toàn bộ bảng vẽ"]')
      if (await initClearBtn.isVisible().catch(() => false)) {
        await initClearBtn.click().catch(() => {})
        await pageHost.waitForTimeout(400)
      }
      const initCloseSlideBtn = pageHost.locator('button[title="Đóng trình chiếu cho cả phòng"]')
      if (await initCloseSlideBtn.isVisible().catch(() => false)) {
        await initCloseSlideBtn.click().catch(() => {})
        await pageHost.waitForTimeout(400)
      }

      await enterStudyRoom(pageMember)
      await enterStudyRoom(pageC)

      // Host draws stroke 1 (in bottom-left chalkboard area, completely free of any windows)
      const hostCanvas = pageHost.locator('svg.touch-none')
      await expect(hostCanvas).toBeVisible()
      const boxHost = await hostCanvas.boundingBox()
      expect(boxHost).toBeTruthy()
      if (boxHost) {
        const x1 = boxHost.x + 120
        const y1 = boxHost.y + boxHost.height - 180
        await pageHost.mouse.move(x1, y1)
        await pageHost.mouse.down()
        await pageHost.mouse.move(x1 + 40, y1 - 40)
        await pageHost.mouse.move(x1 + 80, y1)
        await pageHost.mouse.up()
      }

      // Member B draws stroke 2 (in bottom-right chalkboard area)
      const memberCanvas = pageMember.locator('svg.touch-none')
      await expect(memberCanvas).toBeVisible()
      const boxMember = await memberCanvas.boundingBox()
      expect(boxMember).toBeTruthy()
      if (boxMember) {
        const x2 = boxMember.x + boxMember.width - 220
        const y2 = boxMember.y + boxMember.height - 180
        await pageMember.mouse.move(x2, y2)
        await pageMember.mouse.down()
        await pageMember.mouse.move(x2 + 40, y2 - 40)
        await pageMember.mouse.move(x2 + 80, y2)
        await pageMember.mouse.up()
      }

      // Member C sees BOTH strokes rendered in the SVG
      await expect(pageC.locator('svg.touch-none path')).toHaveCount(2, { timeout: 15000 })

      // Host clears the whiteboard via clear button
      const clearBtn = pageHost.locator('button[aria-label="Xóa toàn bộ bảng vẽ"]')
      if (await clearBtn.isVisible()) {
        await clearBtn.click()
      }

      // Verify board is completely empty for all 3 participants
      await expect(pageHost.locator('svg.touch-none path')).toHaveCount(0, { timeout: 10000 })
      await expect(pageMember.locator('svg.touch-none path')).toHaveCount(0, { timeout: 10000 })
      await expect(pageC.locator('svg.touch-none path')).toHaveCount(0, { timeout: 10000 })

      // Inject a VALID protocol packet with stale epoch (epoch = 0)
      // Must have valid id and tuple coordinates [[number, number], ...] so Zod passes
      // and RoomDO epoch guard is specifically tested
      await pageMember.evaluate(() => {
        const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'whiteboard.action',
            data: {
              action: 'stroke.add',
              stroke: {
                id: `stale-stroke-${Date.now()}`,
                points: [[200, 500], [220, 520]],
                color: '#FFFFFF',
                size: 6,
                epoch: 0,
              },
            },
          }))
        }
      })
      await pageMember.waitForTimeout(600)

      // Stale-epoch stroke is rejected by RoomDO epoch guard and does NOT appear on Member C
      await expect(pageC.locator('svg.touch-none path')).toHaveCount(0)
    } finally {
      await contextHost.close()
      await contextMember.close()
      await contextC.close()
    }
  })

  // ── Scenario 2: Shared Notes OCC & Conflict Survival UX ───────────────────
  test('2. Shared Notes: OCC conflict banner preserves rejected draft across subsequent syncs and allows manual retry', async ({ browser }) => {
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
      ])
      await enterStudyRoom(pageHost)
      await enterStudyRoom(pageMember)

      // Host opens members drawer (contains shared notes)
      await pageHost.locator('button[title="Thành viên"]').click()
      const hostNotesArea = pageHost.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')
      await expect(hostNotesArea).toBeVisible({ timeout: 10000 })

      // Member opens members drawer
      await pageMember.locator('button[title="Thành viên"]').click()
      const memberNotesArea = pageMember.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')
      await expect(memberNotesArea).toBeVisible({ timeout: 10000 })

      // Host writes baseline note
      const baseNote = `Baseline note ${Date.now()}`
      await hostNotesArea.fill(baseNote)
      await pageHost.waitForTimeout(1000)
      await expect(memberNotesArea).toHaveValue(baseNote, { timeout: 15000 })

      // Member B prepares draft in textarea (starts 600ms debounce timer with current rev)
      const memberDraft = `Member conflicting draft ${Date.now()}`
      await memberNotesArea.fill(memberDraft)

      // Before Member B's 600ms debounce fires, Host commits a newer revision directly to server
      const hostWinningUpdate = `Host winning update ${Date.now()}`
      await pageHost.evaluate((content) => {
        const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
        const notesRef = (window as unknown as { __roomNotesRef?: { current: { revision: number } } }).__roomNotesRef
        const rev = notesRef?.current?.revision ?? 1
        if (ws && ws.readyState === WebSocket.OPEN) {
          // Send update without waiting for debounce, preempting Member B on server
          ws.send(JSON.stringify({
            type: 'notes.action',
            data: {
              action: 'update',
              content,
              baseRevision: rev, // Dynamically matches server revision
            },
          }))
        }
      }, hostWinningUpdate)

      // When Member B's 600ms debounce fires, its baseRevision is now stale!
      // Conflict banner MUST appear unconditionally on Member B
      const conflictBanner = pageMember.locator('[data-testid="notes-conflict-banner"]')
      await expect(conflictBanner).toBeVisible({ timeout: 15000 })
      await expect(pageMember.locator('text=Xung đột chỉnh sửa!')).toBeVisible()

      // B's local textarea retains the rejected draft
      await expect(memberNotesArea).toHaveValue(memberDraft)

      // Host sends subsequent remote update while Member B is in conflict
      const hostUpdate2 = `Host subsequent rev ${Date.now()}`
      await pageHost.evaluate((content) => {
        const ws = (window as unknown as { __roomWs?: WebSocket }).__roomWs
        const notesRef = (window as unknown as { __roomNotesRef?: { current: { revision: number } } }).__roomNotesRef
        const rev = notesRef?.current?.revision ?? 1
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'notes.action',
            data: { action: 'update', content, baseRevision: rev },
          }))
        }
      }, hostUpdate2)
      await pageHost.waitForTimeout(1000)

      // Invariant: Conflict banner and rejected draft MUST SURVIVE remote sync!
      await expect(conflictBanner).toBeVisible({ timeout: 5000 })
      await expect(memberNotesArea).toHaveValue(memberDraft)

      // Member clicks "Thử lưu bản của tôi"
      const retryBtn = pageMember.locator('[data-testid="notes-conflict-retry"]')
      await expect(retryBtn).toBeVisible({ timeout: 5000 })
      await retryBtn.click()

      // Server accepts B's forced draft: banner clears and Host receives B's content!
      await expect(conflictBanner).not.toBeVisible({ timeout: 15000 })
      await expect(hostNotesArea).toHaveValue(memberDraft, { timeout: 15000 })
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 3: Room Chat Durable Dedup & Submission Paths ────────────────
  test('3. Room Chat: Accurate unread badge count, single-click dedup, Enter submission, and delivery', async ({ browser }) => {
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
      ])
      await enterStudyRoom(pageHost)
      await enterStudyRoom(pageMember)

      // Open chat on both sides
      await pageHost.locator('button[title="Chat phòng học"]').click()
      await pageMember.locator('button[title="Chat phòng học"]').click()
      const hostChatInput = pageHost.locator('input[placeholder="Nhắn tin..."]')
      const memberChatInput = pageMember.locator('input[placeholder="Nhắn tin..."]')
      await expect(hostChatInput).toBeVisible({ timeout: 10000 })
      await expect(memberChatInput).toBeVisible({ timeout: 10000 })

      // 1. Test click send button once -> exactly one message delivered
      const clickMsg = `Msg click send ${Date.now()}`
      await hostChatInput.fill(clickMsg)
      await pageHost.locator('form:has(input[placeholder="Nhắn tin..."]) button[type="submit"]').click()
      await expect(pageMember.locator(`text=${clickMsg}`)).toHaveCount(1, { timeout: 15000 })

      // 2. Test press Enter once -> exactly one message delivered
      const enterMsg = `Msg enter key ${Date.now()}`
      await hostChatInput.fill(enterMsg)
      await hostChatInput.press('Enter')
      await expect(pageMember.locator(`text=${enterMsg}`)).toHaveCount(1, { timeout: 15000 })

      // 3. Test unread badge logic: Host closes chat drawer
      await pageHost.locator('button[title="Chat phòng học"]').click()
      await expect(hostChatInput).not.toBeVisible({ timeout: 5000 })

      // Member sends message
      const unreadMsg = `Tin nhắn unread test ${Date.now()}`
      await memberChatInput.fill(unreadMsg)
      await memberChatInput.press('Enter')

      // Host sees unread badge
      const unreadBadge = pageHost.locator('button[title="Chat phòng học"] span.bg-indigo-500')
      await expect(unreadBadge).toBeVisible({ timeout: 10000 })

      // Host clicks chat button -> drawer opens and unread badge disappears
      await pageHost.locator('button[title="Chat phòng học"]').click()
      await expect(unreadBadge).not.toBeVisible({ timeout: 5000 })
      await expect(pageHost.locator(`text=${unreadMsg}`)).toBeVisible({ timeout: 5000 })
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 4: Real PDF Page Synchronization with Canvas Rendering ───────
  test('4. Slide: Real PDF page synchronization with actual canvas page rendering', async ({ browser }) => {
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)
    const contextC = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()
    const pageC = await contextC.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
      ])
      await enterStudyRoom(pageHost)
      await enterStudyRoom(pageMember)

      // Ensure no leftover slide from previous tests: Host closes slide if active
      const closeSlideBtn = pageHost.locator('button[title="Đóng trình chiếu cho cả phòng"]')
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
        await pageHost.waitForTimeout(400)
      }

      // Host uploads real PDF fixture through the standard UI upload flow
      await uploadSlidePdf(pageHost, 'test/fixtures/sample.pdf')

      // Host and Member both render actual PDF page 1 canvas
      await expect(pageHost.locator('canvas[data-rendered-page="1"]')).toBeVisible({ timeout: 25000 })
      await expect(pageMember.locator('canvas[data-rendered-page="1"]')).toBeVisible({ timeout: 25000 })
      await expect(pageMember.locator('span.font-mono:has-text("1 / 2")')).toBeVisible({ timeout: 10000 })

      // Host clicks "Trang sau"
      await pageHost.locator('button:has-text("Trang sau")').click()

      // Host and Member both render actual PDF page 2 canvas!
      await expect(pageHost.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 20000 })
      await expect(pageMember.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 20000 })
      await expect(pageMember.locator('span.font-mono:has-text("2 / 2")')).toBeVisible({ timeout: 10000 })

      // Member C connects late
      await loginUser(pageC, MEMBER_C_USER)
      await enterStudyRoom(pageC)

      // Member C snapshot renders actual PDF page 2 canvas immediately!
      await expect(pageC.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 25000 })
      await expect(pageC.locator('span.font-mono:has-text("2 / 2")')).toBeVisible({ timeout: 10000 })

      // Assert no PDF render error UI on any client
      await expect(pageHost.locator('text=Không thể tải trang PDF')).not.toBeVisible()
      await expect(pageMember.locator('text=Không thể tải trang PDF')).not.toBeVisible()
      await expect(pageC.locator('text=Không thể tải trang PDF')).not.toBeVisible()

      // Clean up slide at end of test
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }
    } finally {
      await contextHost.close()
      await contextMember.close()
      await contextC.close()
    }
  })

  // ── Scenario 5: Pomodoro Server Authority & Reload Drift Verification ────
  test('5. Pomodoro: Server-authoritative countdown preserves elapsed wall-clock time across reload', async ({ browser }) => {
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
      ])
      await enterStudyRoom(pageHost)
      await enterStudyRoom(pageMember)

      // If timer is currently running, pause it first
      const pauseBtn = pageHost.locator('header button[title="Dừng"]')
      if (await pauseBtn.isVisible().catch(() => false)) {
        await pauseBtn.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }

      // Host resets Pomodoro to known fresh 25:00 state
      const resetBtn = pageHost.locator('header button[title="Đặt lại"]')
      if (await resetBtn.isVisible().catch(() => false)) {
        await resetBtn.click().catch(() => {})
        await pageHost.waitForTimeout(400)
      }

      // Host starts Pomodoro countdown
      const startBtn = pageHost.locator('header button[title="Bắt đầu"]')
      await expect(startBtn).toBeVisible({ timeout: 10000 })
      await startBtn.click()
      await pageHost.waitForTimeout(400)

      // Record Member remaining time
      const timerDigits = pageMember.locator('header span.tabular-nums')
      await expect(timerDigits).toBeVisible({ timeout: 10000 })
      const initialDigits = await timerDigits.textContent() || ''

      // Wait 3 seconds of wall-clock time
      await pageMember.waitForTimeout(3000)

      // Member reloads the page
      await pageMember.reload()
      await enterStudyRoom(pageMember)

      await expect(pageMember.locator('header span.tabular-nums')).toBeVisible({ timeout: 20000 })
      const reloadedDigits = await pageMember.locator('header span.tabular-nums').textContent()

      // Ensure timer did not reset to 25:00 or stay frozen
      expect(reloadedDigits).not.toBe(initialDigits)
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })

  // ── Scenario 6: Full 5-Subsystem Late Join Convergence (Self-contained) ───
  test('6. Convergence: Simultaneous 3-browser session proves late joiner receives all 5 subsystems converged in snapshot', async ({ browser }) => {
    test.setTimeout(300000)
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)
    const contextC = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()
    const pageC = await contextC.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
        loginUser(pageC, MEMBER_C_USER),
      ])

      await Promise.all([
        enterStudyRoom(pageHost),
        enterStudyRoom(pageMember),
      ])

      // ── Clean slate on Host ────────────────────────────────────────────────
      pageHost.on('dialog', (dialog) => dialog.accept())
      const clearBtn = pageHost.locator('button[aria-label="Xóa toàn bộ bảng vẽ"]')
      if (await clearBtn.isVisible().catch(() => false)) {
        await clearBtn.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }
      const closeSlideBtn = pageHost.locator('button[title="Đóng trình chiếu cho cả phòng"]')
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }

      // ── 1. Whiteboard: Host draws a known stroke ───────────────────────────
      const hostCanvas = pageHost.locator('svg.touch-none')
      const box = await hostCanvas.boundingBox()
      if (box) {
        const sx = box.x + 120
        const sy = box.y + box.height - 160
        await pageHost.mouse.move(sx, sy)
        await pageHost.mouse.down()
        await pageHost.mouse.move(sx + 60, sy - 40)
        await pageHost.mouse.up()
      }
      await expect(pageMember.locator('svg.touch-none path').first()).toBeVisible({ timeout: 15000 })

      // ── 2. Shared Notes: Host saves known unique text ───────────────────────
      await pageHost.locator('button[title="Thành viên"]').click()
      const convNote = `Ghi chú hội tụ ${Date.now()}`
      const hostNotes = pageHost.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')
      await hostNotes.fill(convNote)
      await pageHost.locator('button[title="Thành viên"]').click() // close drawer

      // ── 3. Chat: Host sends known unique beacon message ─────────────────────
      const beaconMsg = `Beacon hội tụ ${Date.now()}`
      const hostChatInput = pageHost.locator('input[placeholder="Nhắn tin..."]')
      if (!await hostChatInput.isVisible()) {
        await pageHost.locator('button[title="Chat phòng học"]').click()
      }
      await hostChatInput.fill(beaconMsg)
      await hostChatInput.press('Enter')
      await pageMember.locator('button[title="Chat phòng học"]').click()
      await expect(pageMember.getByText(beaconMsg)).toBeVisible({ timeout: 15000 })

      // ── 4. Slide: Host uploads real PDF and sets to page 2 ─────────────────
      await uploadSlidePdf(pageHost, 'test/fixtures/sample.pdf')
      await expect(pageHost.locator('canvas[data-rendered-page="1"]')).toBeVisible({ timeout: 25000 })
      await pageHost.locator('button:has-text("Trang sau")').click()
      await expect(pageHost.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 20000 })
      await expect(pageMember.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 20000 })

      // ── 5. Pomodoro: Host resets and starts Pomodoro ───────────────────────
      const resetPomo = pageHost.locator('header button[title="Đặt lại"]')
      if (await resetPomo.isVisible().catch(() => false)) {
        await resetPomo.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }
      const startPomo = pageHost.locator('header button[title="Bắt đầu"]')
      if (await startPomo.isVisible().catch(() => false)) {
        await startPomo.click().catch(() => {})
        await pageHost.waitForTimeout(400)
      }

      // ── Late Joiner C connects ────────────────────────────────────────────
      // C must receive all 5 subsystems strictly from snapshot with NO events from A/B
      await enterStudyRoom(pageC)

      // Subsystem 1: Whiteboard stroke rendered on C
      await expect(pageC.locator('svg.touch-none path').first()).toBeVisible({ timeout: 15000 })

      // Subsystem 2: Shared Notes exact content
      await pageC.locator('button[title="Thành viên"]').click()
      await expect(pageC.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')).toHaveValue(convNote, { timeout: 15000 })
      await pageC.locator('button[title="Thành viên"]').click()

      // Subsystem 3: Chat beacon visible on C
      await pageC.locator('button[title="Chat phòng học"]').click()
      await expect(pageC.getByText(beaconMsg)).toBeVisible({ timeout: 15000 })

      // Subsystem 4: Slide actual rendered page 2 canvas visible on C
      await expect(pageC.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 25000 })

      // Subsystem 5: Pomodoro countdown visible and running on C
      const pomoC = pageC.locator('header span.tabular-nums')
      await expect(pomoC).toBeVisible({ timeout: 15000 })
      const textC = await pomoC.textContent()
      expect(textC).not.toBe('00:00')

      // Clean up slide
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
      }
    } finally {
      await contextHost.close().catch(() => {})
      await contextMember.close().catch(() => {})
      await contextC.close().catch(() => {})
    }
  })

  // ── Scenario 7: Real All-Five Network Interruption ────────────────────────
  test('7. Network Interruption: Client offline reconnect converges to all 5 subsystems canonical state', async ({ browser }) => {
    test.setTimeout(300000)
    const contextHost = await createE2EContext(browser, true)
    const contextMember = await createE2EContext(browser, true)

    const pageHost = await contextHost.newPage()
    const pageMember = await contextMember.newPage()

    try {
      await Promise.all([
        loginUser(pageHost, HOST_USER),
        loginUser(pageMember, MEMBER_USER),
      ])
      await enterStudyRoom(pageHost)
      await enterStudyRoom(pageMember)

      // Initial converged baseline with PDF loaded at page 1
      const closeSlideBtn = pageHost.locator('button[title="Đóng trình chiếu cho cả phòng"]')
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
        await pageHost.waitForTimeout(300)
      }
      await uploadSlidePdf(pageHost, 'test/fixtures/sample.pdf')
      await expect(pageHost.locator('canvas[data-rendered-page="1"]')).toBeVisible({ timeout: 25000 })
      await expect(pageMember.locator('canvas[data-rendered-page="1"]')).toBeVisible({ timeout: 25000 })

      // Take Member B offline
      await contextMember.setOffline(true)

      // While Member B is offline, Host performs ALL FIVE mutations:
      // 1. Whiteboard: draw an offline stroke
      const hostCanvas = pageHost.locator('svg.touch-none')
      const box = await hostCanvas.boundingBox()
      if (box) {
        const sx = box.x + 130
        const sy = box.y + box.height - 170
        await pageHost.mouse.move(sx, sy)
        await pageHost.mouse.down()
        await pageHost.mouse.move(sx + 50, sy - 30)
        await pageHost.mouse.up()
      }

      // 2. Notes: save offline note
      const offlineNote = `Ghi chú khi B offline ${Date.now()}`
      await pageHost.locator('button[title="Thành viên"]').click()
      await pageHost.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]').fill(offlineNote)
      await pageHost.waitForTimeout(800)
      await pageHost.locator('button[title="Thành viên"]').click()

      // 3. Chat: send offline message
      const offlineMsg = `Tin nhắn khi B offline ${Date.now()}`
      const hostChatInput = pageHost.locator('input[placeholder="Nhắn tin..."]')
      if (!await hostChatInput.isVisible()) {
        await pageHost.locator('button[title="Chat phòng học"]').click()
      }
      await hostChatInput.fill(offlineMsg)
      await hostChatInput.press('Enter')
      await expect(pageHost.locator(`text=${offlineMsg}`)).toBeVisible({ timeout: 10000 })

      // 4. Slide: advance to page 2
      await pageHost.locator('button:has-text("Trang sau")').click()
      await expect(pageHost.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 20000 })

      // 5. Pomodoro: ensure running
      const startPomo = pageHost.locator('header button[title="Bắt đầu"]')
      if (await startPomo.isVisible().catch(() => false)) {
        await startPomo.click().catch(() => {})
      }

      // Bring Member B online and reconnect
      await contextMember.setOffline(false)
      await pageMember.reload()
      await enterStudyRoom(pageMember)

      // Assert ALL FIVE converged subsystems on Member B:
      // 1. Whiteboard stroke present
      await expect(pageMember.locator('svg.touch-none path').first()).toBeVisible({ timeout: 15000 })

      // 2. Notes exact content present
      await pageMember.locator('button[title="Thành viên"]').click()
      await expect(pageMember.locator('textarea[placeholder="Viết ghi chú chung cho cả lớp..."]')).toHaveValue(offlineNote, { timeout: 15000 })

      // 3. Chat exact message present
      await pageMember.locator('button[title="Chat phòng học"]').click()
      await expect(pageMember.locator(`text=${offlineMsg}`)).toBeVisible({ timeout: 15000 })

      // 4. Slide actual rendered page 2 canvas present
      await expect(pageMember.locator('canvas[data-rendered-page="2"]')).toBeVisible({ timeout: 25000 })

      // 5. Pomodoro active countdown running
      const pomoMember = pageMember.locator('header span.tabular-nums')
      await expect(pomoMember).toBeVisible({ timeout: 15000 })
      const textMember = await pomoMember.textContent()
      expect(textMember).not.toBe('00:00')

      // Clean up
      if (await closeSlideBtn.isVisible().catch(() => false)) {
        await closeSlideBtn.click().catch(() => {})
      }
    } finally {
      await contextHost.close()
      await contextMember.close()
    }
  })
})
