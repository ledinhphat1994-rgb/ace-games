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

const USER_TEACHER = {
  username: process.env.E2E_TEACHER_USERNAME || 'qa.v2.gv',
  password: process.env.E2E_TEACHER_PASSWORD || '',
}

const ROOM_ID = process.env.E2E_PUBLIC_ROOM_ID || 'phong-7'
const ROOM_NUM = parseInt(ROOM_ID.replace(/\D+/g, ''), 10) || 7

if (!USER_A.password || !USER_B.password || !USER_TEACHER.password) {
  throw new Error('Missing credentials for E2E users in environment or .env.e2e.')
}

async function login(page: Page, user: { username: string; password: string }): Promise<{ accountId?: number }> {
  await page.goto('/')
  const loginInput = page.locator('#ten-dang-nhap')
  const isLoginFormVisible = await loginInput
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)

  let accountId: number | undefined
  if (isLoginFormVisible) {
    await loginInput.fill(user.username)
    await page.locator('#mat-khau').fill(user.password)
    const [loginRes] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/login') && r.status() === 200, { timeout: 15000 }).catch(() => null),
      page.locator('button[type="submit"]:has-text("Đăng nhập")').click(),
    ])
    if (loginRes) {
      const data = (await loginRes.json().catch(() => null)) as { user?: { id?: number } } | null
      if (data?.user?.id) {
        accountId = data.user.id
      }
    }
    await expect(loginInput).not.toBeVisible({ timeout: 20000 })
  }
  return { accountId }
}

/** Đảm bảo gỡ ban chỉ cho tài khoản kiểm thử B để không ảnh hưởng dữ liệu khác */
async function cleanupBans(page: Page, targetAccountId?: number) {
  if (!targetAccountId) return
  await page.evaluate(
    async ({ roomNum, accountId }) => {
      try {
        await fetch(`/api/rooms/${roomNum}/unban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetAccountId: accountId }),
        }).catch(() => {})
      } catch {}
    },
    { roomNum: ROOM_NUM, accountId: targetAccountId },
  )
}

async function enterStudyRoom(page: Page, roomId = ROOM_ID) {
  await page.goto(`/room/${roomId}`)
  await expect(page.locator('button[title="Chat phòng học"]')).toBeVisible({ timeout: 25000 })
  await expect(page.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 40000 })
  await page.waitForTimeout(500)
}

test.describe('Moderation & Safety v1 — Multi-Browser Staging E2E Suite', () => {
  test('1. Báo cáo vi phạm (Report User/Message) từ chat và members drawer', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      // 1. Đăng nhập cả 2 người dùng
      const userB = await login(pageB, USER_B)
      await login(pageA, USER_A)

      await cleanupBans(pageA, userB.accountId)

      // 2. Cả 2 cùng vào phòng học phong-7 và chờ kết nối WebSocket ổn định
      await enterStudyRoom(pageA, ROOM_ID)
      await enterStudyRoom(pageB, ROOM_ID)

      // 3. Mở chat cả 2 bên
      await pageA.locator('button[title="Chat phòng học"]').click()
      await pageB.locator('button[title="Chat phòng học"]').click()

      const chatInputB = pageB.locator('input[placeholder="Nhắn tin..."]')
      await expect(chatInputB).toBeVisible({ timeout: 10000 })

      const testMsg = `Tin nhắn kiểm tra báo cáo vi phạm E2E ${Date.now()}`
      await chatInputB.fill(testMsg)
      await pageB.locator('form:has(input[placeholder="Nhắn tin..."]) button[type="submit"]').click()

      // 4. Người A nhìn thấy tin nhắn của B
      const msgItem = pageA.locator(`text=${testMsg}`).first()
      await expect(msgItem).toBeVisible({ timeout: 15000 })

      // 5. Người A hover vào tin nhắn và bấm nút Flag báo cáo
      const msgContainer = msgItem.locator('..')
      const flagBtn = msgContainer.locator('button[title="Báo cáo tin nhắn này"]')
      await flagBtn.click({ force: true })

      // 6. Modal Báo cáo vi phạm xuất hiện
      await expect(pageA.locator('#report-category-select')).toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('text=Nội dung tin nhắn vi phạm:').first()).toBeVisible()

      // Chọn loại vi phạm và nhập lý do
      await pageA.locator('#report-category-select').selectOption('spam')
      await pageA.locator('#report-reason-input').fill('Spam nội dung thử nghiệm trong phòng học')

      // Bấm Gửi báo cáo
      const submitReportBtn = pageA.locator('button:has-text("Gửi báo cáo")')
      await expect(submitReportBtn).toBeEnabled()
      await submitReportBtn.click()

      // 7. Modal đóng lại và thông báo thành công
      await expect(pageA.locator('#report-category-select')).not.toBeVisible({ timeout: 10000 })
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
      const userB = await login(pageB, USER_B)
      await login(pageA, USER_A)

      await cleanupBans(pageA, userB.accountId)

      // Cả 2 cùng vào phòng học phong-7
      await enterStudyRoom(pageA, ROOM_ID)
      await enterStudyRoom(pageB, ROOM_ID)

      // Host A mở drawer thành viên
      const membersBtnA = pageA.locator('button[title="Thành viên"]').first()
      await membersBtnA.click()
      await expect(pageA.locator('text=👥 Thành viên').first()).toBeVisible({ timeout: 10000 })

      // Chờ Member B xuất hiện trong danh sách thành viên của Host A
      await expect(pageA.locator('text=QA Thử nghiệm 2').first()).toBeVisible({ timeout: 15000 })

      // Host A tìm nút mời ra ngoài (UserX)
      const kickBtn = pageA.locator('button[title="Mời thành viên này ra khỏi phòng"]').first()
      await expect(kickBtn).toBeVisible({ timeout: 10000 })
      await kickBtn.click()

      // Modal xác nhận kick hiện ra
      await expect(pageA.locator('text=Mời thành viên ra khỏi phòng').first()).toBeVisible({ timeout: 10000 })
      await pageA.locator('#kick-reason-input').fill('E2E Test: Mời ra khỏi phòng do quấy rối')

      // Xác nhận mời ra
      await pageA.locator('button:has-text("Xác nhận mời ra")').click()

      // Member B lập tức nhận modal bị từ chối truy cập (websocket đóng)
      await expect(pageB.locator('text=Không thể truy cập phòng học').first()).toBeVisible({ timeout: 15000 })
      await expect(pageB.locator('text=Bạn đã bị mời ra khỏi phòng').first()).toBeVisible({ timeout: 10000 })

      // Member B bấm quay lại sảnh
      await pageB.locator('button:has-text("Quay lại Sảnh")').click()
      await expect(pageB).not.toHaveURL(new RegExp(`/room/${ROOM_ID}`), { timeout: 15000 })

      // Host A thấy số lượng thành viên cập nhật (Member B không còn trong danh sách)
      await expect(kickBtn).not.toBeVisible({ timeout: 10000 })

      // B lập tức cố gắng vào lại cùng phòng -> Bị từ chối dứt khoát bởi kick cooldown!
      await pageB.goto(`/room/${ROOM_ID}`)
      await expect(pageB.locator('h2:has-text("Không thể truy cập phòng học")').first()).toBeVisible({ timeout: 15000 })
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).not.toBeVisible()
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('3. Banned Members Lifecycle: Real Ban, Banned List, Unban, Re-entry', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    try {
      const userB = await login(pageB, USER_B)
      await login(pageA, USER_A)
      await cleanupBans(pageA, userB.accountId)

      // 1. Host A và Member B cùng vào phòng
      await enterStudyRoom(pageA, ROOM_ID)
      await enterStudyRoom(pageB, ROOM_ID)

      // 2. Host A mở drawer thành viên và thực hiện Ban vĩnh viễn B
      const membersBtnA = pageA.locator('button[title="Thành viên"]').first()
      await membersBtnA.click()
      await expect(pageA.locator('text=QA Thử nghiệm 2').first()).toBeVisible({ timeout: 15000 })

      const kickBtn = pageA.locator('button[title="Mời thành viên này ra khỏi phòng"]').first()
      await kickBtn.click()

      await expect(pageA.locator('text=Mời thành viên ra khỏi phòng').first()).toBeVisible({ timeout: 10000 })
      await pageA.locator('#kick-reason-input').fill('E2E Real Ban Test')
      // Đánh dấu chọn cấm vĩnh viễn
      await pageA.locator('label:has-text("Đồng thời cấm vào phòng vĩnh viễn") input[type="checkbox"]').check()
      await pageA.locator('button:has-text("Xác nhận mời ra")').click()

      // 3. Member B bị kick ra khỏi phòng
      await expect(pageB.locator('text=Không thể truy cập phòng học').first()).toBeVisible({ timeout: 15000 })
      await pageB.locator('button:has-text("Quay lại Sảnh")').click()
      await expect(pageB).not.toHaveURL(new RegExp(`/room/${ROOM_ID}`), { timeout: 15000 })

      // 4. Member B cố vào lại phòng -> Bị chặn 403
      await pageB.goto(`/room/${ROOM_ID}`)
      await expect(pageB.locator('h2:has-text("Không thể truy cập phòng học")').first()).toBeVisible({ timeout: 15000 })

      // 5. Host A mở danh sách cấm và thấy Member B thực sự nằm trong danh sách
      const dsCamBtn = pageA.locator('button:has-text("DS Cấm")').first()
      await expect(dsCamBtn).toBeVisible({ timeout: 10000 })
      await dsCamBtn.click()

      await expect(pageA.locator('text=Danh sách thành viên bị cấm').first()).toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('text=QA Thử nghiệm 2').first()).toBeVisible({ timeout: 15000 })

      // 6. Host A thực hiện gỡ cấm (unban) cho Member B
      const unbanBtn = pageA.locator('button:has-text("Gỡ cấm")').first()
      await expect(unbanBtn).toBeVisible({ timeout: 10000 })
      await unbanBtn.click()

      // B biến mất khỏi danh sách cấm
      await expect(pageA.locator('text=QA Thử nghiệm 2').first()).not.toBeVisible({ timeout: 10000 })
      await expect(pageA.locator('text=Chưa có thành viên nào bị cấm').first()).toBeVisible({ timeout: 10000 })

      // Đóng modal danh sách cấm
      await pageA.locator('button:has-text("Đóng")').first().click()

      // 7. Member B vào lại phòng thành công
      await pageB.goto(`/room/${ROOM_ID}`)
      await expect(pageB.locator('button[title="Chat phòng học"]')).toBeVisible({ timeout: 25000 })
      await expect(pageB.locator('header svg.lucide-wifi.text-emerald-400')).toBeVisible({ timeout: 40000 })
    } finally {
      await contextA.close()
      await contextB.close()
    }
  })

  test('4. Scoped Teacher Authority: Giáo viên không có quyền moderation trong phòng toàn trường', async ({ browser }) => {
    const contextGv = await browser.newContext()
    const pageGv = await contextGv.newPage()

    try {
      await login(pageGv, USER_TEACHER)

      // Giáo viên vào phòng toàn trường phong-7 (Host là học sinh acc:2)
      await enterStudyRoom(pageGv, ROOM_ID)

      // Mở drawer thành viên
      const membersBtn = pageGv.locator('button[title="Thành viên"]').first()
      await membersBtn.click()
      await expect(pageGv.locator('text=👥 Thành viên').first()).toBeVisible({ timeout: 10000 })

      // Khẳng định âm tính 1: Giáo viên không thấy nút "DS Cấm" trong phòng toàn trường
      await expect(pageGv.locator('button:has-text("DS Cấm")')).not.toBeVisible({ timeout: 5000 })

      // Khẳng định âm tính 2: Giáo viên không thấy nút mời ra ngoài (kick) đối với thành viên khác
      await expect(pageGv.locator('button[title="Mời thành viên này ra khỏi phòng"]')).not.toBeVisible({ timeout: 5000 })

      // Khẳng định âm tính 3 phía server: Gọi API kick từ session của Giáo viên trả về 403
      const kickAttemptStatus = await pageGv.evaluate(async (roomNum) => {
        const res = await fetch(`/api/rooms/${roomNum}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetActorKey: 'acc:2', reason: 'Attempt from out-of-scope teacher' }),
        })
        return res.status
      }, ROOM_NUM)

      expect(kickAttemptStatus).toBe(403)
    } finally {
      await contextGv.close()
    }
  })
})
