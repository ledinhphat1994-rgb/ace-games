import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

const consoleLogs = []
const consoleErrors = []
const pageErrors = []

console.log('🚀 [Steampunk UI Verification] Launching Chromium...')

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

await page.waitForTimeout(2000)

// 1. Chụp ảnh màn hình tổng thể HUD mới (Steampunk Brass Top-Bar, Command Deck, Tesla Dynamo trên cầu)
const hudDrivePath = path.join(DRIVE_DIR, 'steampunk_hud_overview.png')
const hudArtifactPath = path.join(ARTIFACT_DIR, 'steampunk_hud_overview.png')
console.log(`📸 Taking screenshot HUD Overview -> ${hudDrivePath}`)
await page.screenshot({ path: hudDrivePath })
try { await page.screenshot({ path: hudArtifactPath }) } catch (e) {}

// 2. Click vào tháp Gatling tại (640, 435) để kích hoạt Vòng Trận Pháp Cổ Ngữ và Bảng Nâng Cấp Đồng Thau Chiến Thuật Tinh Gọn
console.log('🎯 Clicking tower at (640, 435) to open Tower Upgrade Plaque & Runic Ring...')
await page.mouse.click(640, 435)
await page.waitForTimeout(800)

const towerPlaqueDrive = path.join(DRIVE_DIR, 'steampunk_tower_plaque.png')
const towerPlaqueArtifact = path.join(ARTIFACT_DIR, 'steampunk_tower_plaque.png')
console.log(`📸 Taking screenshot Tower Plaque & Runic Ring -> ${towerPlaqueDrive}`)
await page.screenshot({ path: towerPlaqueDrive })
try { await page.screenshot({ path: towerPlaqueArtifact }) } catch (e) {}

// 3. Kích hoạt Bẫy Cầu [E] để kiểm tra Tesla Dynamo kích hoạt sóng xung kích
console.log('⚡ Activating Bridge EMP...')
await page.keyboard.press('KeyE')
await page.waitForTimeout(250)

const bridgeEmpDrive = path.join(DRIVE_DIR, 'steampunk_bridge_dynamo_active.png')
const bridgeEmpArtifact = path.join(ARTIFACT_DIR, 'steampunk_bridge_dynamo_active.png')
console.log(`📸 Taking screenshot Bridge EMP Active -> ${bridgeEmpDrive}`)
await page.screenshot({ path: bridgeEmpDrive })
try { await page.screenshot({ path: bridgeEmpArtifact }) } catch (e) {}

// Đo FPS
console.log('⏱️ Measuring FPS...')
const fpsResult = await page.evaluate(async () => {
  return new Promise(resolve => {
    let frameCount = 0
    let startTime = performance.now()
    function frame(now) {
      frameCount++
      if (now - startTime < 1000) {
        requestAnimationFrame(frame)
      } else {
        resolve(Math.round(frameCount / ((now - startTime) / 1000)))
      }
    }
    requestAnimationFrame(frame)
  })
})

console.log(`\n=== STEAMPUNK UI REDESIGN RESULTS ===`)
console.log(`FPS: ${fpsResult}`)
console.log(`Console Errors: ${consoleErrors.length}`)
console.log(`Page Errors: ${pageErrors.length}`)
console.log(`====================================\n`)

await browser.close()
