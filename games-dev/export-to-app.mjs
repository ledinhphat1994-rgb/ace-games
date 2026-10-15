import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, 'godot-project')
const exportTargetDir = path.resolve(__dirname, '../public/games/godot')
const exportHtml = path.join(exportTargetDir, 'index.html')
const bridgeSrc = path.resolve(__dirname, 'bridge/campus-game-bridge.js')
const bridgeDest = path.join(exportTargetDir, 'campus-game-bridge.js')

console.log('\x1b[36m========================================================\x1b[0m')
console.log('\x1b[36m🚀 Đang chuẩn bị xuất bản Godot Web vào App Mobile...\x1b[0m')
console.log(`📁 Thư mục dự án: ${projectRoot}`)
console.log(`📁 Thư mục đích:  ${exportTargetDir}`)
console.log('\x1b[36m========================================================\x1b[0m')

// 1. Tạo thư mục đích nếu chưa có
if (!fs.existsSync(exportTargetDir)) {
  fs.mkdirSync(exportTargetDir, { recursive: true })
}

// 2. Chạy Godot Export Release
console.log('\x1b[33m📦 Đang biên dịch Game Godot sang WebAssembly (HTML5)...\x1b[0m')
try {
  execSync(`godot --headless --path "${projectRoot}" --export-release "Web" "${exportHtml}"`, {
    stdio: 'inherit',
  })
  console.log('\x1b[32m✅ Xuất bản Godot hoàn tất!\x1b[0m')
} catch (err) {
  console.error('\x1b[31m❌ Lỗi trong quá trình xuất bản Godot:\x1b[0m', err.message)
  process.exit(1)
}

// 3. Sao chép Bridge và nhúng vào index.html
if (fs.existsSync(bridgeSrc)) {
  fs.copyFileSync(bridgeSrc, bridgeDest)
  console.log('\x1b[32m✅ Đã sao chép Campus Game Bridge vào thư mục xuất bản!\x1b[0m')

  if (fs.existsSync(exportHtml)) {
    let html = fs.readFileSync(exportHtml, 'utf-8')
    if (!html.includes('campus-game-bridge.js')) {
      const scriptTag = '  <script src="campus-game-bridge.js"></script>\n</head>'
      html = html.replace('</head>', scriptTag)
      fs.writeFileSync(exportHtml, html, 'utf-8')
      console.log('\x1b[32m✅ Đã nhúng Bridge tự động vào index.html!\x1b[0m')
    }
  }
}

console.log('\n\x1b[32m🎉 HOÀN TẤT TÍCH HỢP GAME VÀO APP MOBILE!\x1b[0m')
console.log('\x1b[36m👉 Đường dẫn Web Game: /games/godot/index.html\x1b[0m')
console.log('\x1b[36m👉 App Mobile và Web đều có thể mở chơi ngay lập tức!\x1b[0m')
console.log('\x1b[36m========================================================\x1b[0m\n')
