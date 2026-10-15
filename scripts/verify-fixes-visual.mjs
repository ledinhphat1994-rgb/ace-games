import { chromium } from 'playwright'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

const consoleErrors = []
const pageErrors = []

console.log('🚀 [Fix Verification] Launching Chromium...')

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
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text())
    console.error('❌ Console Error:', msg.text())
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

// Chụp ảnh t = 0s
const t0Drive = path.join(DRIVE_DIR, 'fix_verified_t0.png')
const t0Art = path.join(ARTIFACT_DIR, 'fix_verified_t0.png')
await page.screenshot({ path: t0Drive })
try { await page.screenshot({ path: t0Art }) } catch (e) {}

// Sinh thêm quái vật để kiểm tra đoàn quân hành quân dọc đường
console.log('👾 Spawning wave of enemies...')
await page.evaluate(() => {
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy()
    window.spawnEnemy()
    window.spawnEnemy()
  }
})

// Chờ 2.5s để quan sát quái di chuyển
await page.waitForTimeout(2500)
const t2Drive = path.join(DRIVE_DIR, 'fix_verified_t2_5.png')
const t2Art = path.join(ARTIFACT_DIR, 'fix_verified_t2_5.png')
await page.screenshot({ path: t2Drive })
try { await page.screenshot({ path: t2Art }) } catch (e) {}

// Chờ thêm 2.5s nữa (tổng 5s) để thấy quái tiến về phía cầu đá
await page.waitForTimeout(2500)
const t5Drive = path.join(DRIVE_DIR, 'fix_verified_t5_0.png')
const t5Art = path.join(ARTIFACT_DIR, 'fix_verified_t5_0.png')
await page.screenshot({ path: t5Drive })
try { await page.screenshot({ path: t5Art }) } catch (e) {}

console.log(`\n=== FIX VERIFICATION COMPLETE ===`)
console.log(`Console Errors: ${consoleErrors.length}`)
console.log(`Page Errors: ${pageErrors.length}`)
console.log(`Screenshots saved: fix_verified_t0.png, fix_verified_t2_5.png, fix_verified_t5_0.png`)
console.log(`=================================\n`)

await browser.close()
