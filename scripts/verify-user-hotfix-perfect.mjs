import { chromium } from 'playwright'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\4536cde0-2a78-4af6-bf51-859020471e84'

console.log('🚀 [Perfect Verification] Launching Chromium...')

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

await page.waitForTimeout(2000)

// 1. Chụp ảnh toàn cảnh: Cụm 6 nòng súng tiểu liên, Trụ plasma cố định, Mặt đất sạch bóng không vòng tròn, Cầu đá tự nhiên, Thanh Máu Lâu Đài trên vòm cổng thành
const p1Art = path.join(ARTIFACT_DIR, 'shot1_initial_clean_and_castle_hp.png')
await page.screenshot({ path: p1Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'shot1_initial_clean_and_castle_hp.png') }) } catch (e) {}
console.log('📸 Shot 1: Initial clean map, 6-barrel Gatling & Castle HP bar captured.')

// 2. Chụp cận cảnh hoạt ảnh xoay nòng của súng tiểu liên Gatling khi bắn
console.log('👾 Spawning enemy for Gatling and Plasma target firing...')
await page.evaluate(() => {
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy()
  }
})

await page.waitForTimeout(1600)
const p2Art = path.join(ARTIFACT_DIR, 'shot2_gatling_firing_spin.png')
await page.screenshot({ path: p2Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'shot2_gatling_firing_spin.png') }) } catch (e) {}
console.log('📸 Shot 2: Gatling spinning & firing captured.')

// 3. Xóa các tháp phòng thủ để quái vật tự do hành quân đến cổng lâu đài nhà chính và tung đòn công thành!
console.log('🏰 Clearing towers and spawning enemies to march to Castle Gate...')
await page.evaluate(() => {
  if (typeof window.clearTowers === 'function') {
    window.clearTowers()
  }
  if (typeof window.toggleSpeed === 'function') {
    window.toggleSpeed() // x2 tốc độ
  }
  if (typeof window.spawnCustomEnemy === 'function') {
    window.spawnCustomEnemy(1, 0) // Mech Walker
    window.spawnCustomEnemy(2, 0) // Steam Train
    window.spawnCustomEnemy(3, 0) // Winged Bot
  }
})

// Chờ quái vật đi đến cổng thành (khoảng 5-6s ở tốc độ 2x)
console.log('⏳ Waiting for enemies to reach Castle Gate...')
await page.waitForTimeout(5500)

// Chụp khoảnh khắc quái vật đang công thành: đập vào cổng thành, văng tia lửa, hiện -MÁU, thanh máu lâu đài tụt!
const p3Art = path.join(ARTIFACT_DIR, 'shot3_castle_siege_attack_active.png')
await page.screenshot({ path: p3Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'shot3_castle_siege_attack_active.png') }) } catch (e) {}
console.log('📸 Shot 3: Castle siege attack & HP loss captured.')

// Chờ thêm 3 giây quái tiếp tục đập cổng thành cho đến khi lâu đài mất máu / thất thủ
await page.waitForTimeout(3000)
const p4Art = path.join(ARTIFACT_DIR, 'shot4_castle_siege_continuous.png')
await page.screenshot({ path: p4Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'shot4_castle_siege_continuous.png') }) } catch (e) {}
console.log('📸 Shot 4: Castle siege continuous damage captured.')

await browser.close()
console.log('🎉 Verification finished successfully!')
