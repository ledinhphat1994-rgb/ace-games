import { chromium } from 'playwright'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--enable-webgl2', '--use-gl=angle', '--use-angle=d3d11', '--enable-gpu-rasterization']
})
const page = await browser.newPage({ viewport: { width: 1376, height: 768 } })
await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => typeof window.toggleCamera === 'function', { timeout: 60000 })
await page.waitForTimeout(1500)

// Switch camera to Overview
await page.evaluate(() => { window.toggleCamera() })
await page.waitForTimeout(1500)

const ovPath = path.join(DRIVE_DIR, 'fix_overview_windmills_clean.png')
const ovArt = path.join(ARTIFACT_DIR, 'fix_overview_windmills_clean.png')
await page.screenshot({ path: ovPath })
try { await page.screenshot({ path: ovArt }) } catch (e) {}

await browser.close()
console.log('Clean overview screenshot taken successfully!')
