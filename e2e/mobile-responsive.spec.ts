import { test, expect, type Page } from '@playwright/test'
import { assertSafeDestructiveE2ETarget } from './safe-target'

assertSafeDestructiveE2ETarget(process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173')

async function noOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }))
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport + 1)
}

const viewports = [
  [320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [480, 800],
  [600, 960], [768, 1024], [820, 1180], [1024, 768], [1280, 800], [1440, 900], [1920, 1080],
  [568, 320], [844, 390],
]

for (const [width, height] of viewports) {
  test('all activity screens fit ' + width + '×' + height, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 1024, hasTouch: width < 1280 })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    for (const route of ['/learn', '/arena', '/arena/solo_snake', '/arena/solo_memory', '/arena/chess', '/arena/xiangqi', '/arena/caro_15']) {
      await page.goto(route)
      await expect(page.locator('main').first()).toBeVisible()
      await noOverflow(page)
      if (width < 1280) {
        await expect(page.getByTestId('bubble-leaderboard')).toBeVisible()
        await expect(page.getByTestId('bubble-messages')).toBeVisible()
      }
      if (route.startsWith('/arena/') && !route.endsWith('solo_snake')) {
        await page.getByTestId('game-lobby-play-now').click()
        await expect(page.locator('.game-board-shell')).toBeVisible()
        await noOverflow(page)
        const board = await page.locator('.game-board-shell').boundingBox()
        expect(board!.x).toBeGreaterThanOrEqual(0)
        expect(board!.x + board!.width).toBeLessThanOrEqual(width + 1)
      }
    }
    expect(errors).toEqual([])
    await context.close()
  })
}

test.describe('mobile controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })

  test('bubbles drag, remember position, clamp after rotation and open complete panels', async ({ page }) => {
    await page.goto('/learn')
    const bubble = page.getByTestId('bubble-leaderboard')
    const box = (await bubble.boundingBox())!
    await page.mouse.move(box.x + 24, box.y + 24)
    await page.mouse.down()
    await page.mouse.move(38, 230, { steps: 12 })
    await page.mouse.up()
    await expect(page.getByTestId('activity-panel-leaderboard')).not.toBeVisible()
    expect((await bubble.boundingBox())!.x).toBe(12)
    await page.reload()
    expect((await bubble.boundingBox())!.x).toBe(12)
    await page.setViewportSize({ width: 844, height: 390 })
    const rotated = (await bubble.boundingBox())!
    expect(rotated.y + rotated.height).toBeLessThanOrEqual(390)
    await bubble.click()
    await expect(page.getByTestId('activity-panel-leaderboard')).toBeVisible()
    await page.getByTestId('activity-panel-leaderboard').getByText('Rắn Săn Mồi', { exact: true }).click()
    await page.keyboard.press('Escape')
    await page.getByTestId('bubble-messages').click()
    const panel = page.getByTestId('activity-panel-messages')
    await expect(panel.getByRole('button', { name: /Chat chung/ })).toBeVisible()
    await panel.getByRole('button', { name: /Bạn bè/ }).click()
    await page.keyboard.press('Escape')
    await page.getByTestId('bubble-messages').click()
    await expect(panel.getByRole('button', { name: /Bạn bè/ })).toHaveClass(/bg-purple/)
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByTestId('bubble-messages')).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Tin nhắn & bạn bè', exact: true })).toBeVisible()
  })

  test('snake starts, steers with touch, releases boost, restarts and supports both players', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('c10a7:ran-san-moi:thiet-lap', JSON.stringify({ capDo: 'easy', soMay: 4 })))
    await page.goto('/arena/solo_snake')
    await page.getByTestId('game-lobby-play-now').click()
    await page.getByTestId('ran-man-san-sang').click()
    const joystick = page.getByTestId('snake-joystick-p1')
    await expect(joystick).toBeVisible()
    const box = (await joystick.boundingBox())!
    await page.touchscreen.tap(box.x + 70, box.y + 40)
    const boost = page.getByRole('button', { name: 'Tăng tốc P1', exact: true })
    const boostBox = (await boost.boundingBox())!
    await page.mouse.move(boostBox.x + 20, boostBox.y + 20)
    await page.mouse.down()
    await expect(boost).toHaveClass(/bg-amber-400/)
    await page.mouse.move(195, 100)
    await page.mouse.up()
    await expect(boost).not.toHaveClass(/bg-amber-400/)
    await page.getByRole('button', { name: 'Chơi lại', exact: true }).click()
    await expect(joystick).toBeVisible()
    await page.getByRole('button', { name: /PvP/ }).click()
    await expect(page.getByTestId('snake-joystick-p2')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tăng tốc P2', exact: true })).toBeVisible()
    await noOverflow(page)
  })

  test('classic snake mounts a single canvas, resizes and stays controllable', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('/arena/solo_snake')
    await page.getByTestId('game-lobby-play-now').click()
    await page.getByRole('button', { name: 'Cổ điển', exact: true }).click()
    await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click()
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Lên', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Lên', exact: true }).click()
    await page.setViewportSize({ width: 320, height: 568 })
    await expect.poll(async () => page.locator('canvas').evaluate(c => c.width)).toBeLessThanOrEqual(300)
    await page.getByRole('button', { name: 'Chơi lại', exact: true }).click()
    await expect(page.locator('canvas')).toHaveCount(1)
    await noOverflow(page)
    expect(errors).toEqual([])
  })

  test('auth forms remain reachable in landscape', async ({ page }) => {
    await page.setViewportSize({ width: 568, height: 320 })
    await page.goto('/learn')
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS('min-height', '0px')
    const box = (await dialog.boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y + box.height).toBeLessThanOrEqual(321)
    await dialog.locator('button[type="submit"]').scrollIntoViewIfNeeded()
    await expect(dialog.locator('button[type="submit"]')).toBeInViewport()
    await noOverflow(page)
  })
})

// Uses a disposable account and a real local/staging RoomDO, never production or mocked room data.
test('study room retains chat, notes, drawing and all host controls at mobile sizes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const username = 'qa.mobile.' + Date.now().toString(36)
  const password = 'Local-mobile-QA-' + Date.now().toString(36)
  expect((await page.request.post('/api/register', { data: { username, password, tenHienThi: 'Kiểm thử mobile' } })).ok()).toBeTruthy()
  expect((await page.request.post('/api/login', { data: { username, password } })).ok()).toBeTruthy()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn')
  await page.getByTestId('create-room-btn').click()
  await page.getByTestId('create-room-name-input').fill('Phòng học kiểm thử giao diện di động với tên dài')
  await page.getByTestId('create-room-mode-password').click()
  await page.getByTestId('create-room-password-input').fill('mobile-qa')
  await page.getByTestId('create-room-submit-button').click()
  await expect(page.getByTestId('classroom-workspace')).toBeVisible()
  for (const [width, height] of [[320, 568], [600, 960], [844, 390], [1024, 768]]) {
    await page.setViewportSize({ width, height })
    await noOverflow(page)
    await expect(page.getByTestId('topbar-btn-leave')).toBeVisible()
    await expect(page.getByTestId('topbar-btn-close-room')).toBeVisible()
    await page.getByTestId('topbar-btn-members').click()
    await expect(page.getByTestId('context-panel-members')).toBeVisible()
    await page.getByRole('textbox', { name: 'Ghi chú chung', exact: true }).fill('Ghi chú mobile ' + width)
    await page.getByRole('button', { name: 'Đóng bảng', exact: true }).click()
    await page.getByTestId('topbar-btn-chat').click()
    await expect(page.getByTestId('chat-input')).toBeVisible()
    await page.getByRole('button', { name: 'Đóng bảng', exact: true }).click()
    await expect(page.getByTestId('tool-btn-pen')).toBeAttached()
    await expect(page.getByTestId('dock-btn-secondary-tools')).toBeAttached()
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByTestId('classroom-workspace').screenshot({ path: 'artifacts/mobile/study-room-390.png' })
  const boardButton = page.getByTestId('dock-btn-whiteboard')
  await boardButton.scrollIntoViewIfNeeded()
  if (await boardButton.getAttribute('aria-pressed') === 'false') await boardButton.click()
  await expect(page.getByTestId('whiteboard-stage')).toBeVisible()
  await page.getByTestId('tool-btn-pen').click()
  await expect(page.getByTestId('dock-pen-tray')).toBeVisible()
  await page.keyboard.press('Escape')
  const svg = page.getByTestId('whiteboard-surface').locator('svg')
  const pathCount = await svg.locator('path').count()
  const surface = (await svg.boundingBox())!
  const touch = await page.context().newCDPSession(page)
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  const point = { x: surface.x + surface.width * 0.3, y: surface.y + surface.height * 0.5 }
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 45, y: point.y + 10 }] })
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect.poll(() => svg.locator('path').count()).toBeGreaterThan(pathCount)
  await touch.detach()
  await page.getByTestId('dock-btn-secondary-tools').click()
  await expect(page.getByTestId('tool-btn-calculator')).toBeVisible()
  await expect(page.getByTestId('tool-btn-session')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByTestId('topbar-btn-chat').click()
  await page.getByTestId('chat-input').fill('Tin nhắn kiểm thử mobile')
  await page.getByTestId('chat-send-btn').click()
  await expect(page.getByText('Tin nhắn kiểm thử mobile', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng bảng', exact: true }).click()
  await page.getByTestId('topbar-btn-close-room').click()
  await page.getByTestId('btn-confirm-close-room').click()
  await expect(page.getByTestId('learning-layout')).toBeVisible()
  expect(errors).toEqual([])
})
