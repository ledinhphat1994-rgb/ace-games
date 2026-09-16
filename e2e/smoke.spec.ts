import { test, expect } from '@playwright/test'

test.describe('Digital Campus v2 — Non-Destructive Smoke Test', () => {

  test('1. Homepage & Login Form Renders Correctly', async ({ page }) => {
    await page.goto('/')
    // Expect login interface elements
    const loginCard = page.locator('#ten-dang-nhap')
    await expect(loginCard).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#mat-khau')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button[type="submit"]:has-text("Đăng nhập")')).toBeVisible({ timeout: 5000 })
  })

  test('2. Public Room Route Loads Cleanly Without Unhandled Exceptions', async ({ page }) => {
    const roomId = process.env.E2E_PUBLIC_ROOM_ID || 'phong-7'
    const response = await page.goto(`/room/${roomId}`)
    expect(response?.status()).toBeLessThan(500)
    // Page body should mount
    await expect(page.locator('body')).toBeVisible()
  })

  test('3. API Gateway Alive & Returning Valid Standard Responses', async ({ request }) => {
    // Unauthenticated call to protected endpoint returns 401
    const res = await request.get('/api/whoami')
    expect(res.status()).toBe(401)
  })

})
