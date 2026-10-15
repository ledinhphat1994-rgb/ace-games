import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

const consoleLogs = []
const consoleErrors = []
const pageErrors = []

console.log('🚀 [Hotfix Verification] Launching Chromium on http://localhost:3005/ ...')

const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-webgl',
    '--enable-webgl2',
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--enable-gpu-rasterization',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--autoplay-policy=no-user-gesture-required',
  ]
})

const context = await browser.newContext({
  viewport: { width: 1376, height: 768 },
  deviceScaleFactor: 1,
})

const page = await context.newPage()

page.on('console', msg => {
  const type = msg.type()
  const text = msg.text()
  consoleLogs.push(`[${type}] ${text}`)
  if (type === 'error') {
    consoleErrors.push(text)
    console.error('❌ Console Error:', text)
  }
})

page.on('pageerror', err => {
  pageErrors.push(err.message)
  console.error('🔥 Page Error:', err.message)
})

await page.goto('http://localhost:3005/', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
})

console.log('⏳ Waiting for Godot scene to initialize...')
await page.waitForFunction(() => typeof window.toggleCamera === 'function', { timeout: 60000, polling: 250 })
console.log('✅ Godot Scene loaded!')

await page.waitForTimeout(1500)

// 1. Chuyển sang chế độ Camera Toàn Cảnh Đảo (Overview)
console.log('🔭 Calling window.toggleCamera() to switch to Overview (Toàn Cảnh Đảo)...')
await page.evaluate(() => {
  if (typeof window.toggleCamera === 'function') {
    window.toggleCamera()
  }
})
await page.waitForTimeout(1500) // Đợi Camera LERP mượt mà về Overview

// 2. Sinh quái vật & Boss để quan sát đường đi
console.log('👾 Spawning enemies & boss...')
await page.evaluate(() => {
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy()
    window.spawnEnemy()
  }
  if (typeof window.spawnBoss === 'function') {
    window.spawnBoss()
  }
})

await page.waitForTimeout(1200)

// 3. Chụp ảnh thời điểm t = 0.0s (Overview)
const t0OverviewDrive = path.join(DRIVE_DIR, 'hotfix_overview_t0.png')
const t0OverviewArt = path.join(ARTIFACT_DIR, 'hotfix_overview_t0.png')
console.log(`📸 Taking screenshot Overview at t = 0.0s -> ${t0OverviewDrive}`)
await page.screenshot({ path: t0OverviewDrive })
try { await page.screenshot({ path: t0OverviewArt }) } catch (e) {}

// Chờ đúng 1.5s (1500ms) để quan sát chuyển động xoay của cối xay gió, dòng nước chảy, bước chân quái
console.log('⏳ Waiting exactly 1.5s (1500ms)...')
await page.waitForTimeout(1500)

// 4. Chụp ảnh thời điểm t = 1.5s (Overview)
const t15OverviewDrive = path.join(DRIVE_DIR, 'hotfix_overview_t1_5.png')
const t15OverviewArt = path.join(ARTIFACT_DIR, 'hotfix_overview_t1_5.png')
console.log(`📸 Taking screenshot Overview at t = 1.5s -> ${t15OverviewDrive}`)
await page.screenshot({ path: t15OverviewDrive })
try { await page.screenshot({ path: t15OverviewArt }) } catch (e) {}

// 5. Chuyển camera về Tactical để chụp cận cảnh nòng súng Gatling đang quay và chân tháp
console.log('🎯 Switching back to Tactical mode...')
await page.evaluate(() => {
  if (typeof window.toggleCamera === 'function') {
    window.toggleCamera() // overview -> action_focus
    window.toggleCamera() // action_focus -> tactical
  }
})
await page.waitForTimeout(1500) // Đợi Camera LERP về Tactical

const tTacticalDrive = path.join(DRIVE_DIR, 'hotfix_tactical_combat.png')
const tTacticalArt = path.join(ARTIFACT_DIR, 'hotfix_tactical_combat.png')
console.log(`📸 Taking screenshot Tactical -> ${tTacticalDrive}`)
await page.screenshot({ path: tTacticalDrive })
try { await page.screenshot({ path: tTacticalArt }) } catch (e) {}

// 6. Đo FPS
console.log('⏱️ Measuring FPS...')
const fpsResult = await page.evaluate(async () => {
  return new Promise(resolve => {
    let frameCount = 0
    let startTime = null
    function measureFrame(now) {
      if (startTime === null) {
        startTime = now
        requestAnimationFrame(measureFrame)
        return
      }
      frameCount++
      if (now - startTime < 2000) {
        requestAnimationFrame(measureFrame)
      } else {
        const totalDurationMs = now - startTime
        const avgFps = Math.min(60, Math.round(frameCount / (totalDurationMs / 1000)))
        resolve({ avgFps, frameCount })
      }
    }
    requestAnimationFrame(measureFrame)
  })
})
console.log(`📊 Measured FPS: ${fpsResult.avgFps}`)

await browser.close()

console.log('\n=== HOTFIX VERIFICATION RESULT ===')
console.log(`FPS: ${fpsResult.avgFps}`)
console.log(`Console Errors: ${consoleErrors.length}`)
console.log(`Page Errors: ${pageErrors.length}`)
console.log(`Screenshot Overview t=0.0s: ${t0OverviewDrive}`)
console.log(`Screenshot Overview t=1.5s: ${t15OverviewDrive}`)
console.log(`Screenshot Tactical: ${tTacticalDrive}`)
console.log('==================================\n')
