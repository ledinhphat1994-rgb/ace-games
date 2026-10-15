import { chromium } from 'playwright'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const ARTIFACT_DIR = 'C:\\Users\\lepha\\.gemini\\antigravity-ide\\brain\\3193f4ba-102a-4717-bb2f-b9c0a9d07bdb'

console.log('🚀 [Visual Verification] Launching Chromium to verify 4 user requests...')

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

// 1. Chụp ảnh ban đầu: Thấy rõ Súng Gatling, Súng Plasma, Không còn vòng tròn trên mặt đất, Cầu sạch, Thanh Máu Lâu Đài (Castle Core HP)
const s1Art = path.join(ARTIFACT_DIR, 'verify_clean_ground_and_castle_hp.png')
await page.screenshot({ path: s1Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'verify_clean_ground_and_castle_hp.png') }) } catch (e) {}
console.log('📸 Shot 1: Clean ground & Castle HP Bar captured.')

// 2. Spawn quái để kích hoạt Súng Gatling và Súng Plasma bắn
console.log('👾 Spawning Mech Walker & Steam Train...')
await page.evaluate(() => {
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy() // Mech
  }
})

// Chờ 2 giây khi quái đi vào tầm ngắm của súng Gatling & Plasma
await page.waitForTimeout(2000)
const s2Art = path.join(ARTIFACT_DIR, 'verify_gatling_spin_plasma_fire.png')
await page.screenshot({ path: s2Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'verify_gatling_spin_plasma_fire.png') }) } catch (e) {}
console.log('📸 Shot 2: Gatling spinning & Plasma stable fire captured.')

// Chụp liên tiếp 3 frame cách nhau 150ms để thấy nòng súng Gatling đang quay tít và vỏ đạn văng ra
await page.waitForTimeout(150)
await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_gatling_spin_f1.png') })
await page.waitForTimeout(150)
await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_gatling_spin_f2.png') })
console.log('📸 Gatling spinning frames captured.')

// 3. Cho quái tiến về gần lâu đài hoặc spawn quái nhanh để công thành
// Tăng tốc độ game lên 2x để quái đến lâu đài nhanh hơn
await page.evaluate(() => {
  if (typeof window.toggleSpeed === 'function') {
    window.toggleSpeed() // x2 speed
  }
  // Spawn thêm Mech và Train
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy()
    window.spawnEnemy()
  }
})

// Chờ quái đi hết đường vào lâu đài và tung đòn tấn công công thành (Castle Siege Attack)
console.log('⏳ Waiting for enemies to reach castle gates (approx 7-8s)...')
await page.waitForTimeout(6500)

const s3Art = path.join(ARTIFACT_DIR, 'verify_castle_siege_attack_1.png')
await page.screenshot({ path: s3Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'verify_castle_siege_attack_1.png') }) } catch (e) {}

await page.waitForTimeout(1500)
const s4Art = path.join(ARTIFACT_DIR, 'verify_castle_siege_attack_2.png')
await page.screenshot({ path: s4Art })
try { await page.screenshot({ path: path.join(DRIVE_DIR, 'verify_castle_siege_attack_2.png') }) } catch (e) {}

console.log('📸 Castle siege attack & HP reduction shots captured.')

await browser.close()
console.log('🎉 Verification script finished successfully!')
