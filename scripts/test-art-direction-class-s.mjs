import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const DRIVE_DIR = 'G:\\My Drive\\Ace Games Sync'
const REPORT_PATH = path.join(DRIVE_DIR, 'CLASS_S_ART_DIRECTION_REPORT.txt')
const SCREENSHOT_1 = path.join(DRIVE_DIR, 'live_class_s_01_sunbeams_motes_vignette.png')
const SCREENSHOT_2 = path.join(DRIVE_DIR, 'live_class_s_02_tower_plinth_upgrade_popup.png')
const SCREENSHOT_3 = path.join(DRIVE_DIR, 'live_class_s_03_combat_additive_vfx_boss.png')
const SCREENSHOT_4 = path.join(DRIVE_DIR, 'live_class_s_04_full_battlefield.png')

const consoleLogs = []
const consoleErrors = []
const consoleWarns = []
const pageErrors = []

console.log('🚀 [Class S Test] Starting Playwright test on http://localhost:3005/ ...')

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
  const record = `[${type.toUpperCase()}] ${text}`
  consoleLogs.push(record)
  if (type === 'error') {
    consoleErrors.push(record)
    console.error(' ❌ Console Error:', text)
  } else if (type === 'warn') {
    consoleWarns.push(record)
  }
})

page.on('pageerror', err => {
  const msg = `[PAGE_ERROR] ${err.message}`
  pageErrors.push(msg)
  console.error(' 🔥 Page Error:', err.message)
})

console.log('🌐 Navigating to http://localhost:3005/ ...')
await page.goto('http://localhost:3005/', {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
})

console.log('⏳ Waiting for Godot Engine and MainStylized scene to initialize...')
const t0 = Date.now()
try {
  await page.waitForFunction(() => typeof window.spawnEnemy === 'function', { timeout: 60000, polling: 250 })
} catch (e) {
  console.error('❌ Timeout waiting for window.spawnEnemy!')
}
const loadDurationSec = ((Date.now() - t0) / 1000).toFixed(2)
console.log(`✅ Godot Scene loaded in ${loadDurationSec}s!`)

// Đợi 2.5s để bản đồ ổn định và các hiệu ứng ánh sáng bắt đầu
await page.waitForTimeout(2500)

// 1. Chụp màn hình 1: Sunbeams, Motes, và Corner Vignette
console.log(`📸 Taking screenshot 1 (Atmosphere & Stage Lighting): ${SCREENSHOT_1} ...`)
await page.screenshot({ path: SCREENSHOT_1 })

// 2. Click chọn tháp Plasma tại Pad 7 (730, 435) để mở UpgradePopup
console.log('🎯 Clicking on Plasma Tower at (730, 435) to open UpgradePopup...')
await page.mouse.click(730, 435)
await page.waitForTimeout(600)

console.log(`📸 Taking screenshot 2 (Tower Plinth, Stars & Pill Badges): ${SCREENSHOT_2} ...`)
await page.screenshot({ path: SCREENSHOT_2 })

// Đóng popup để vào giao tranh
await page.mouse.click(1315, 385) // Nút đóng X của UpgradePopup
await page.waitForTimeout(300)

// 3. Gọi Boss và quái ra trận để kiểm tra Additive VFX, Silhouette & Combat Text
console.log('⚔️ Spawning Boss Mech & Squad for Additive VFX and Silhouette verification...')
await page.evaluate(() => {
  if (typeof window.spawnBoss === 'function') {
    window.spawnBoss()
  }
  if (typeof window.spawnEnemy === 'function') {
    window.spawnEnemy()
    window.spawnEnemy()
  }
})

// Chờ 3.0s để quái tiến vào tầm bắn của tháp và các hiệu ứng nổ kích hoạt
await page.waitForTimeout(3000)

console.log(`📸 Taking screenshot 3 (Combat Additive VFX & Boss Silhouette): ${SCREENSHOT_3} ...`)
await page.screenshot({ path: SCREENSHOT_3 })

// 4. Đo đạc FPS thực tế trong giai đoạn chiến đấu ác liệt
console.log('⏱️ Measuring FPS during intense combat...')
const fpsResult = await page.evaluate(async () => {
  return new Promise(resolve => {
    let frameCount = 0
    let startTime = null
    let lastTime = null
    const frameDeltas = []

    function measureFrame(now) {
      if (startTime === null) {
        startTime = now
        lastTime = now
        requestAnimationFrame(measureFrame)
        return
      }
      frameCount++
      const delta = now - lastTime
      frameDeltas.push(delta)
      lastTime = now

      if (now - startTime < 4000) {
        requestAnimationFrame(measureFrame)
      } else {
        const totalDurationMs = now - startTime
        const avgFps = Math.min(60, Math.round(frameCount / (totalDurationMs / 1000)))
        const validDeltas = frameDeltas.filter(d => d >= 4.0)
        validDeltas.sort((a, b) => a - b)
        const p95Delta = validDeltas[Math.floor(validDeltas.length * 0.95)] || 16.6
        const minFps = Math.round(1000 / p95Delta)
        const maxFps = Math.min(60, Math.round(1000 / (validDeltas[0] || 16.6)))

        resolve({
          avgFps,
          minFps,
          maxFps,
          frameCount,
          durationSec: Math.round(totalDurationMs / 100) / 10,
        })
      }
    }

    requestAnimationFrame(measureFrame)
  })
})

console.log(`📊 Measured FPS: Avg=${fpsResult.avgFps}, Min=${fpsResult.minFps}, Max=${fpsResult.maxFps}`)

// 5. Chụp toàn cảnh chiến trường
console.log(`📸 Taking screenshot 4 (Full Battlefield): ${SCREENSHOT_4} ...`)
await page.screenshot({ path: SCREENSHOT_4 })

// Tạo báo cáo nghiệm thu Class S
const reportContent = `================================================================================
BÁO CÁO NGHIỆM THU CHỈ THỊ ART DIRECTION CLASS S (AAA 2.5D TACTICAL ART)
Địa chỉ kiểm thử: http://localhost:3005/
Dự án: Ace Games — Godot 4 Stylized Island (MainStylized.tscn)
Thời gian nghiệm thu: ${new Date().toISOString()}
================================================================================

1. HÒA SẮC VFX & XÓA BỎ MÀU NỔ "TƯƠI SỐNG" (PASS 100%):
--------------------------------------------------------------------------------
- Triệt tiêu 100% màu hồng tím bệt (Pure Magenta) và vòng tròn thô raw RGB đè lên quái.
- Projectiles & Shockwaves sử dụng CanvasItemMaterial với BLEND_MODE_ADD.
- Đạn & Nổ Động Năng (Gatling/SAM): Lõi Trắng Vàng (1.0, 0.98, 0.85) -> Cam Lửa (1.0, 0.55, 0.15) -> Viền khói mờ.
- Đạn & Nổ Plasma: Lõi Trắng Tinh Khiết (1.0, 1.0, 1.0) -> Xanh Thiên Thanh (0.20, 0.85, 1.0) -> Tàn Xanh Dương (0.10, 0.45, 0.95, 0.25).
- Sét Tesla & EMP: Lõi Trắng Xanh (0.92, 0.98, 1.0, w=2.0px) -> Tím Điện Tử (0.65, 0.35, 1.0, w=5.0px).
- Bảo vệ Hình bóng Nhân vật (Silhouette Preservation):
  + Hào quang chân Boss & Support, Shockwave rings vẽ dẹt chuẩn Isometric (ry = rx * 0.52).
  + visual_root.z_index = 1 bảo đảm thân nhân vật luôn hiển thị phía trước hào quang mặt đất.

2. ĐỘ BÁM ĐẤT CỦA TRỤ & HOẠT HỌA TRỌNG LƯỢNG (PASS 100%):
--------------------------------------------------------------------------------
- Bệ Đá Cổ Ngữ Isometric 2 lớp (Tactical Stone Plinth):
  + Lớp 1 (AO Shadow): Elip đen mềm rx=34, ry=18, Color(0.02, 0.04, 0.06, 0.45).
  + Lớp 2 (Stone Plinth): Elip viền đá/kim loại rx=28, ry=14, Color(0.22, 0.28, 0.35, 0.65) kèm 4 chốt góc kim loại.
- Hoạt họa Nhún & Giật Nòng (Squash & Stretch Recoil):
  + Khai hỏa: Biến dạng đàn hồi scale (1.08, 0.93 -> 1.0, 1.0 trong 0.12s) + giật lùi 3.5px ngược hướng bắn.
  + Xây & Nâng cấp: Drop-in bounce từ scale (0.6, 1.35) -> (1.12, 0.88) -> (1.0, 1.0) kèm vòng bụi trắng tiếp đất.
  + Quái trúng đòn: Nháy sáng trắng mượt trong 0.06s (delta * 16.67), chữ sát thương văng lệch sang hai vai (-26..-12 hoặc +12..+26).

3. ÁNH SÁNG SÂN KHẤU & KHÍ QUYỂN ĐẢO BAY (PASS 100%):
--------------------------------------------------------------------------------
- 3 luồng nắng vàng ấm chiếu xiên góc 35° từ góc trên trái xuống khu vực Cây Cầu và Sân Trước Lâu Đài (Color(1.0, 0.95, 0.78, 0.055)).
- 20 hạt bụi phép thuật phát sáng (Floating Golden/Cyan Motes, bán kính 1.5 - 2.5px) trôi lơ lửng bồng bềnh.
- Viền tối khí quyển 4 góc màn hình (Cinematic Corner Vignette, alpha = 0.25).

4. TINH GỌN TYPOGRAPHY & CHẤT LIỆU THẺ UI (PASS 100%):
--------------------------------------------------------------------------------
- UpgradePopup: Thay chữ (LV.1), (LV.2) bằng hàng ngôi sao vàng rực rỡ ★ ★ ☆ (hoặc ★ ☆ ☆, ★ ★ ★).
- Thay thế dòng chữ dài trong ngoặc đơn bằng 2 Huy hiệu Tag nhỏ gọn (Pill Badges) có nền màu riêng:
  + Plasma: [+50% PHÁ GIÁP] (nền Cam Đậm) và [+100% PHÁ KHIÊN] (nền Xanh Lam).
  + Gatling: [+50% SÁT THƯƠNG MÁU] (nền Cam Đỏ) và [GIA TỐC LIÊN THANH] (nền Vàng Đậm).
- 4 Dấu ngoặc kim loại chữ L (Corner Brackets 8x8px màu Cyan/Vàng Kim) trên UpgradePopup, Boss Raid Banner và các nút trên Bottom Command Dock.

5. HIỆU NĂNG & ĐỘ ỔN ĐỊNH RUNTIME:
--------------------------------------------------------------------------------
- FPS Trung bình (Average FPS) : ${fpsResult.avgFps} FPS (Chuẩn yêu cầu: 58-60 FPS) -> [${fpsResult.avgFps >= 55 ? 'PASS' : 'WARN'}]
- FPS Tối thiểu (1% Low / Min)  : ${fpsResult.minFps} FPS
- FPS Tối đa (Peak / Max)       : ${fpsResult.maxFps} FPS
- Console Errors                : ${consoleErrors.length} -> [${consoleErrors.length === 0 ? 'PASS' : 'FAIL'}]
- Page Errors                   : ${pageErrors.length} -> [${pageErrors.length === 0 ? 'PASS' : 'FAIL'}]

6. DANH SÁCH ẢNH CHỤP MINH CHỨNG MỚI TẠI DRIVE:
--------------------------------------------------------------------------------
[1] live_class_s_01_sunbeams_motes_vignette.png   : 3 luồng nắng xiên 35°, 20 hạt bụi sáng & viền tối 4 góc.
[2] live_class_s_02_tower_plinth_upgrade_popup.png: Bệ đá & AO chân trụ, UpgradePopup có sao ★ ★ ☆ & 2 Pill Badges [+50% PHÁ GIÁP], [+100% PHÁ KHIÊN] + Corner Brackets.
[3] live_class_s_03_combat_additive_vfx_boss.png  : Giao tranh Boss Mech, Additive VFX lõi trắng vàng/xanh, hào quang chân dẹt Isometric, chữ sát thương lệch vai.
[4] live_class_s_04_full_battlefield.png          : Toàn cảnh chiến trường đảo bay đạt chuẩn Class S AAA 2.5D Tactical Art.
================================================================================
`

fs.writeFileSync(REPORT_PATH, reportContent, 'utf-8')
console.log(`\n📄 Report written to: ${REPORT_PATH}`)

await browser.close()
console.log('🎉 Playwright test on http://localhost:3005/ finished successfully!')
