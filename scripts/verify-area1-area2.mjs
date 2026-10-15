import { chromium } from 'playwright'
import path from 'node:path'
import { execSync } from 'node:child_process'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

console.log('🚀 [Verify Area 1 & 2] Launching Chromium...')

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

await page.goto('http://localhost:3005/', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
})

console.log('⏳ Waiting for Godot scene to initialize...')
await page.waitForFunction(() => typeof window.toggleCamera === 'function', { timeout: 60000, polling: 250 })
console.log('✅ Godot Scene loaded!')

// Chờ 2.5s để khởi tạo HUD và wave 1
await page.waitForTimeout(2500)

const fullPathArt = path.join(ARTIFACT_DIR, 'fix_hud_robot_verified.png')
const fullPathDrive = path.join(DRIVE_DIR, 'fix_hud_robot_verified.png')

await page.screenshot({ path: fullPathDrive })
try { await page.screenshot({ path: fullPathArt }) } catch {}

console.log('📸 Full screenshot captured. Now cropping Vung 1 and Vung 2...')

import fs from 'node:fs'

const pyCrop = `
from PIL import Image
img = Image.open(r"${fullPathArt.replace(/\\/g, '\\\\')}")
w, h = img.size
print("Source size:", w, h)

# Vung 1: Top-Left HUD (x: 15..440, y: 8..150)
crop1 = img.crop((15, 8, 440, 150))
crop1.save(r"${path.join(ARTIFACT_DIR, 'crop_vung1_fixed.png').replace(/\\/g, '\\\\')}")

# Vung 2: Portal & Robot walker path (x: 0..360, y: 310..590)
crop2 = img.crop((0, 310, 360, 590))
crop2.save(r"${path.join(ARTIFACT_DIR, 'crop_vung2_fixed.png').replace(/\\/g, '\\\\')}")

print("Cropping complete!")
`
fs.writeFileSync('temp_crop.py', pyCrop, 'utf8')
try {
  execSync('python temp_crop.py', { stdio: 'inherit' })
} finally {
  try { fs.unlinkSync('temp_crop.py') } catch {}
}

console.log('🎉 Verification complete!')
await browser.close()
