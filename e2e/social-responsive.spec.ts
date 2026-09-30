import { test, expect, chromium, request, type BrowserContext, type Locator, type Page } from '@playwright/test'
import { mkdtempSync, rmSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, relative } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { assertSafeDestructiveE2ETarget } from './safe-target'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'
assertSafeDestructiveE2ETarget(baseURL)
const local = ['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname)
const viewports = [[360, 800], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1440, 900]] as const
type Session = Awaited<ReturnType<BrowserContext['storageState']>>
const people: { id: number; username: string; name: string; session: Session }[] = []
let peer: BrowserContext

test.beforeAll(async () => {
  const suffix = Date.now().toString(36)
  for (const [index, name] of ['Lê Văn A', 'Nguyễn Hoàng Minh Anh', 'Lê An'].entries()) {
    const api = await request.newContext({ baseURL })
    const username = `qa.ui.${suffix}.${index}`
    const password = `UI-${crypto.randomUUID()}`
    expect((await api.post('/api/register', { data: { username, password, tenHienThi: name } })).ok()).toBeTruthy()
    expect((await api.post('/api/login', { data: { username, password } })).ok()).toBeTruthy()
    const user = await (await api.get('/api/whoami')).json()
    expect(user.accountId).toBeGreaterThan(0)
    people.push({ id: user.accountId, username, name, session: await api.storageState() })
    await api.dispose()
  }
  // Only seed a disposable local account; never write XP on staging or production.
  if (local) {
    const folder = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
    for (const file of readdirSync(folder).filter(file => file.endsWith('.sqlite') && file !== 'metadata.sqlite')) {
      const db = new DatabaseSync(join(folder, file))
      try {
        const account = db.prepare('SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = ?').get(people[1].username)
        if (account?.id !== people[1].id) continue
        db.prepare('INSERT INTO user_engagement_profile (account_id, total_xp, updated_at) VALUES (?, 12458, ?) ON CONFLICT(account_id) DO UPDATE SET total_xp = 12458').run(people[1].id, Date.now())
        break
      } catch (error) {
        if (!(error instanceof Error) || !error.message.includes('no such table: tai_khoan_campus')) throw error
      }
      finally { db.close() }
    }
  }
  const ownApi = await request.newContext({ baseURL, storageState: people[0].session })
  for (const person of people.slice(1)) {
    const other = await request.newContext({ baseURL, storageState: person.session })
    const invitation = await (await other.post('/api/social/request', { data: { targetAccountId: people[0].id } })).json()
    expect((await ownApi.post('/api/social/accept', { data: { requestId: invitation.requestId } })).ok()).toBeTruthy()
    await other.dispose()
  }
  await ownApi.dispose()
  peer = await chromium.launch().then(browser => browser.newContext({ baseURL, storageState: people[1].session }))
})

test.afterAll(async () => { await peer?.browser()?.close() })

async function browserAtZoom(zoom: number) {
  // Full Chromium settings change actual browser zoom, not CSS zoom or pinch emulation.
  const profile = mkdtempSync(join(tmpdir(), 'campus-ui-zoom-'))
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', baseURL, viewport: { width: 390, height: 844 }, hasTouch: true,
  })
  await context.addCookies(people[0].session.cookies)
  const page = await context.newPage()
  await page.goto('chrome://settings/appearance')
  await page.locator('#zoomLevel').selectOption(String(zoom))
  return { context, page, close: async () => {
    await context.close()
    const withinTemp = relative(resolve(tmpdir()), resolve(profile))
    if (!withinTemp.startsWith('..') && withinTemp.startsWith('campus-ui-zoom-')) rmSync(profile, { recursive: true, force: true })
  } }
}

async function gamePeople(page: Page, person = people[1]) {
  await page.goto('/game/xiangqi-layout-audit?gameType=xiangqi&turn=30')
  await page.getByTestId('bubble-activity').tap()
  await page.getByTestId('bubble-action-messages').tap()
  const panel = page.getByTestId('activity-panel-messages')
  await panel.getByRole('button', { name: /Bạn bè/ }).click()
  await panel.locator('input').first().fill(person.username)
  const trigger = panel.getByRole('button', { name: 'Xem thông tin ' + person.name, exact: true })
  await expect(trigger).toBeVisible()
  return trigger
}

async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
}

async function geometry(scope: Locator, page: Page, minimumTouch = true) {
  await expect(async () => {
    const errors = await scope.evaluate((root, minimumTouch) => {
      const issues: string[] = []
      const viewport = { w: innerWidth, h: innerHeight }
      const box = root.getBoundingClientRect()
      if (box.left < 0 || box.right > viewport.w + 1 || box.top < 0 || box.bottom > viewport.h + 1) issues.push('container outside viewport')
      const controls = [...root.querySelectorAll('button')].filter(el => el.getBoundingClientRect().height > 0)
      for (const el of controls) {
        const rect = el.getBoundingClientRect()
        if (minimumTouch && (rect.height < 40 || rect.width < 40)) issues.push('touch target: ' + el.innerText)
        if (rect.left < box.left || rect.right > box.right + 1) issues.push('control outside container')
        const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        if (!el.disabled && !el.contains(top)) issues.push('pointer blocked: ' + (el.getAttribute('aria-label') ?? el.innerText))
      }
      for (let i = 0; i < controls.length; i++) for (const other of controls.slice(i + 1)) {
        const a = controls[i].getBoundingClientRect(), b = other.getBoundingClientRect()
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) issues.push('overlapping controls')
      }
      for (const el of root.querySelectorAll<HTMLElement>('h2,h3,p,dt,dd,button')) {
        if (el.clientWidth && el.scrollWidth > el.clientWidth + 1) issues.push('clipped text: ' + el.innerText)
      }
      return issues
    }, minimumTouch)
    expect(errors).toEqual([])
    await noPageOverflow(page)
  }).toPass({ timeout: 3000 })
}

test('Real relationship actions, dismissal and message entry remain usable', async () => {
  const run = await browserAtZoom(1)
  try {
    expect((await run.context.request.post('/api/social/unfriend', { data: { friendAccountId: people[1].id } })).ok()).toBeTruthy()
    await run.page.setViewportSize({ width: 360, height: 800 })
    const trigger = await gamePeople(run.page)
    await trigger.tap()
    const popup = run.page.getByTestId('ho-so-nguoi-dung')
    await popup.getByTestId(`ket-ban-${people[1].id}`).click()
    await expect(popup.getByText('Đã gửi', { exact: true })).toBeVisible()
    await geometry(popup, run.page)
    await popup.getByRole('button', { name: 'Hủy', exact: true }).click()
    await expect(popup.getByTestId(`ket-ban-${people[1].id}`)).toBeVisible()
    expect((await peer.request.post('/api/social/request', { data: { targetAccountId: people[0].id } })).ok()).toBeTruthy()
    await expect(popup.getByTestId(`chap-nhan-${people[1].id}`)).toBeEnabled()
    await geometry(popup, run.page)
    await popup.getByTestId(`chap-nhan-${people[1].id}`).tap()
    await expect(popup.getByTestId(`huy-ket-ban-${people[1].id}`)).toBeVisible()
    await popup.getByTestId(`huy-ket-ban-${people[1].id}`).click()
    await expect(popup.getByTestId(`ket-ban-${people[1].id}`)).toBeVisible()
    expect((await peer.request.post('/api/social/request', { data: { targetAccountId: people[0].id } })).ok()).toBeTruthy()
    await expect(popup.getByTestId(`chap-nhan-${people[1].id}`)).toBeEnabled()
    await popup.getByRole('button', { name: 'Từ chối', exact: true }).click()
    await expect(popup.getByTestId(`ket-ban-${people[1].id}`)).toBeVisible()
    expect((await peer.request.post('/api/social/request', { data: { targetAccountId: people[0].id } })).ok()).toBeTruthy()
    await popup.getByTestId(`chap-nhan-${people[1].id}`).click()
    await expect(popup.getByTestId(`ban-be-${people[1].id}`)).toBeVisible()
    await popup.getByTestId('ho-so-btn-nhan-tin').tap()
    await expect(popup).toHaveCount(0)
    await expect(run.page.getByTestId('activity-panel-messages')).toContainText(people[1].name)
    expect((await run.context.request.post('/api/social/unfriend', { data: { friendAccountId: people[2].id } })).ok()).toBeTruthy()
    const shortApi = await request.newContext({ baseURL, storageState: people[2].session })
    expect((await shortApi.post('/api/social/request', { data: { targetAccountId: people[0].id } })).ok()).toBeTruthy()
    await run.page.goto('/community')
    await run.page.getByTestId('community-pending-requests-cta').tap()
    const invitationRow = run.page.getByTestId('incoming-request-' + people[2].username)
    await expect(invitationRow).toBeVisible()
    await geometry(invitationRow, run.page)
    await invitationRow.getByTestId('accept-request-btn-' + people[2].username).tap()
    await run.page.getByTestId('tab-friends').click()
    const friendRow = run.page.getByTestId('friend-item-' + people[1].username)
    await expect(friendRow).toBeVisible()
    await geometry(friendRow, run.page)
    await shortApi.dispose()
  } finally { await run.close() }
})

for (const zoom of [1, 1.25]) test(`Profile, achievements, Community and action rows at ${zoom * 100}% browser zoom`, async () => {
  const run = await browserAtZoom(zoom)
  try {
    for (const [width, height] of viewports) {
      await test.step(`${width}×${height}`, async () => {
        await run.page.setViewportSize({ width, height })
        await run.page.goto('/community')
        expect(await run.page.evaluate(() => devicePixelRatio)).toBeCloseTo(zoom, 2)
        const trigger = run.page.getByRole('button', { name: 'Xem thông tin ' + people[1].name, exact: true })
        await expect(trigger).toBeVisible()
        // Presence may regroup this row while its first snapshot settles.
        await expect(async () => {
          await trigger.scrollIntoViewIfNeeded()
          await geometry(trigger.locator('..'), run.page)
        }).toPass({ timeout: 5000 })
        await noPageOverflow(run.page)
        await run.page.screenshot({ path: test.info().outputPath(`community-${width}-${zoom}.png`) })
        await trigger.tap()
        const popup = run.page.getByTestId('ho-so-nguoi-dung')
        await expect(popup.getByTestId('ho-so-xp')).toHaveText(local ? '12.458' : '0')
        await geometry(popup, run.page)
        await expect(popup.getByRole('heading', { name: people[1].name, exact: true })).toBeVisible()
        await run.page.keyboard.press('Tab')
        expect(await popup.evaluate(el => el.contains(document.activeElement))).toBeTruthy()
        await run.page.screenshot({ path: test.info().outputPath(`profile-${width}-${zoom}.png`) })
        await popup.getByTestId('ho-so-btn-thanh-tuu').tap()
        await expect(popup.getByText('Đang tải thành tựu…', { exact: true })).not.toBeVisible()
        await geometry(popup, run.page)
        const last = popup.getByTestId('ho-so-danh-sach-thanh-tuu').locator('h3').last()
        await last.scrollIntoViewIfNeeded()
        await expect(last).toBeVisible()
        await run.page.screenshot({ path: test.info().outputPath(`achievements-${width}-${zoom}.png`) })
        await popup.getByRole('button', { name: 'Quay lại hồ sơ', exact: true }).click()
        await run.page.keyboard.press('Escape')
        await expect(popup).toHaveCount(0)
        await expect(trigger).toBeFocused()
        const shortTrigger = run.page.getByRole('button', { name: 'Xem thông tin ' + people[2].name, exact: true })
        await shortTrigger.click()
        await expect(popup.getByTestId('ho-so-xp')).toHaveText('0')
        await geometry(popup, run.page)
        await run.page.mouse.click(1, 1)
        await expect(popup).toHaveCount(0)
        await run.page.getByTestId('community-find-friends-cta').tap()
        const input = run.page.getByTestId('search-user-input')
        await input.fill(people[1].username)
        const row = run.page.getByTestId('search-result-' + people[1].username)
        await expect(row).toBeVisible()
        await geometry(row, run.page)
        // Large counts are geometry stress fixtures, never product data.
        await run.page.evaluate(() => {
          const badge = document.querySelector('[data-testid="tab-friends"] span')
          if (badge) badge.textContent = '999+'
        })
        await noPageOverflow(run.page)
        await run.page.keyboard.press('Escape')
        await expect(input).not.toBeVisible()
        if (width <= 390) {
          const gameTrigger = await gamePeople(run.page)
          await geometry(run.page.getByTestId('game-friend-' + people[1].id), run.page)
          await gameTrigger.tap()
          await geometry(popup, run.page)
          await expect(popup.getByTestId('ho-so-btn-thanh-tuu')).toHaveAccessibleName(/Xem tất cả thành tựu/)
          await popup.getByTestId('ho-so-btn-nhan-tin').tap()
          const back = run.page.getByRole('button', { name: 'Quay lại danh sách bạn bè', exact: true })
          await expect(back).toBeVisible()
          await geometry(back.locator('../..'), run.page)
        }
      })
    }
  } finally { await run.close() }
})


test('Closing a profile returns focus after realtime presence regroups its trigger', async () => {
  const run = await browserAtZoom(1)
  const otherPage = await peer.newPage()
  try {
    await run.page.goto('/community')
    const trigger = run.page.getByRole('button', { name: 'Xem thông tin ' + people[1].name, exact: true })
    const original = await trigger.elementHandle()
    await trigger.click()
    await expect(run.page.getByTestId('ho-so-nguoi-dung')).toBeVisible()
    await otherPage.goto('/community')
    await expect(run.page.locator('[data-testid="friend-online-' + people[1].username + '"]')).toBeVisible()
    expect(await original!.evaluate(element => element.isConnected)).toBeFalsy()
    await run.page.keyboard.press('Escape')
    await expect(run.page.getByTestId('ho-so-nguoi-dung')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  } finally { await otherPage.close(); await run.close() }
})
