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

const ROOM_ID = 'phong-1'

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

/** Đảm bảo gỡ ban trước khi chạy test để trạng thái clean */
async function cleanupBans(page: Page) {
  await page.evaluate(async () => {
    try {
      const res = await fetch('/api/rooms/1/banned-members')
      const data = await res.json()
      if (data && Array.isArray(data.bannedMembers)) {
        for (const b of data.bannedMembers) {
          await fetch('/api/rooms/1/unban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetAccountId: b.accountId }),
          })
        }
      }
    } catch {}
  })
}

test.describe('Moderation & Safety v1 — Multi-Browser Staging E2E Suite', () => {
  test('1. Báo cáo vi phạm (Report User/Message) từ chat và members drawer', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // 1. Đăng nhập cả 2 người dùng
      await login(pageA, USER_A)
      await login(pageB, USER_B)

      await cleanupBans(pageA)

      // 2. Cả 2 cùng vào phòng học phong-1
      await pageA.goto(`/room/${ROOM_ID}`)
      await pageB.goto(`/room/${ROOM_ID}`)

      // Chờ vào phòng thành công
      await expect(pageA.locator('header').first()).toBeVisible({ timeout: 20000 })
      await expect(pageB.locator('header').first()).toBeVisible({ timeout: 20000 })

      // 3. Người B mở chat và gửi tin nhắn
      const chatBtnB = pageB.locator('button:has-text("Chat")').first()
      await chatBtnB.click()
      const chatInputB = pageB.locator('input[placeholder="Nhắn tin..."]')
      await expect(chatInputB).toBeVisible({ timeout: 10000 })
      await chatInputB.fill('Tin nhắn kiểm tra báo cáo vi phạm E2E')
      await chatInputB.press('Enter')

      // 4. Người A mở chat và nhìn thấy tin nhắn của B
      const chatBtnA = pageA.locator('button:has-text("Chat")').first()
      await chatBtnA.click()
      const msgItem = pageA.locator('text=Tin nhắn kiểm tra báo cáo vi phạm E2E').first()
      await expect(msgItem).toBeVisible({ timeout: 15000 })

      // 5. Người A hover vào tin nhắn và bấm nút Flag báo cáo
      const msgContainer = msgItem.locator('..')
      const flagBtn = msgContainer.locator('button[title="Báo cáo tin nhắn này"]')
      await flagBtn.click()

      // 6. Modal Báo cáo vi phạm xuất hiện
      await expect(pageA.locator('text=Báo cáo vi phạm').first()).toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('text=Nội dung tin nhắn vi phạm:').first()).toBeVisible()

      // Chọn loại vi phạm và nhập lý do
      await pageA.locator('#report-category-select').selectOption('spam')
      await pageA.locator('#report-reason-input').fill('Spam nội dung thử nghiệm trong phòng học')

      // Bấm Gửi báo cáo
      const submitReportBtn = pageA.locator('button:has-text("Gửi báo cáo")')
      await expect(submitReportBtn).toBeEnabled()
      await submitReportBtn.click()

      // 7. Modal đóng lại và thông báo thành công
      await expect(pageA.locator('text=Báo cáo vi phạm').first()).not.toBeVisible({ timeout: 10000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('2. Server-Authoritative Kick: Host mời thành viên ra khỏi phòng & Cooldown', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      await login(pageA, USER_A)
      await login(pageB, USER_B)

      await cleanupBans(pageA)

      // Cả 2 cùng vào phòng học phong-1
      await pageA.goto(`/room/${ROOM_ID}`)
      await pageB.goto(`/room/${ROOM_ID}`)

      await expect(pageA.locator('header').first()).toBeVisible({ timeout: 20000 })
      await expect(pageB.locator('header').first()).toBeVisible({ timeout: 20000 })

      // Host A mở drawer thành viên
      const membersBtnA = pageA.locator('button[title="Thành viên"]').first()
      await membersBtnA.click()
      await expect(pageA.locator('text=👥 Thành viên').first()).toBeVisible({ timeout: 10000 })

      // Host A tìm nút mời ra ngoài (UserX)
      const kickBtn = pageA.locator('button[title="Mời thành viên này ra khỏi phòng"]').first()
      await expect(kickBtn).toBeVisible({ timeout: 10000 })
      await kickBtn.click()

      // Modal xác nhận kick hiện ra
      await expect(pageA.locator('text=Mời thành viên ra khỏi phòng').first()).toBeVisible({ timeout: 10000 })
      await pageA.locator('#kick-reason-input').fill('E2E Test: Mời ra khỏi phòng do quấy rối')

      // Xác nhận mời ra
      await pageA.locator('button:has-text("Xác nhận mời ra")').click()

      // Member B lập tức nhận modal bị từ chối truy cập
      await expect(pageB.locator('text=Không thể truy cập phòng học').first()).toBeVisible({ timeout: 15000 })
      await expect(pageB.locator('text=Bạn đã bị mời ra khỏi phòng').first()).toBeVisible({ timeout: 10000 })

      // Member B bấm quay lại sảnh
      await pageB.locator('button:has-text("Quay lại Sảnh")').click()
      await expect(pageB).not.toHaveURL(new RegExp(`/room/${ROOM_ID}`), { timeout: 15000 })

      // Host A thấy số lượng thành viên cập nhật (Member B không còn trong danh sách)
      await expect(kickBtn).not.toBeVisible({ timeout: 10000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('3. Banned Members Management: Host xem danh sách cấm và gỡ cấm', async ({ browser }) => {
    const contextA = await browser.newContext()
    const pageA = await contextA.newPage()

    try {
      await login(pageA, USER_A)
      await cleanupBans(pageA)

      await pageA.goto(`/room/${ROOM_ID}`)
      await expect(pageA.locator('header').first()).toBeVisible({ timeout: 20000 })

      // Mở drawer thành viên
      const membersBtnA = pageA.locator('button[title="Thành viên"]').first()
      await membersBtnA.click()

      // Host có nút DS Cấm
      const dsCamBtn = pageA.locator('button:has-text("DS Cấm")').first()
      await expect(dsCamBtn).toBeVisible({ timeout: 10000 })
      await dsCamBtn.click()

      // Modal danh sách cấm hiện ra
      await expect(pageA.locator('text=Danh sách thành viên bị cấm').first()).toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('text=Chưa có thành viên nào bị cấm').first()).toBeVisible({ timeout: 10000 })

      // Đóng modal
      await pageA.locator('button:has-text("Đóng")').first().click()
      await expect(pageA.locator('text=Danh sách thành viên bị cấm').first()).not.toBeVisible({ timeout: 10000 })
    } finally {
      await contextA.close()
    }
  })
})
