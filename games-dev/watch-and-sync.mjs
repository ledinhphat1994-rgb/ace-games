import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, 'godot-project')
const exportScript = path.resolve(__dirname, 'export-to-app.mjs')

console.log('\x1b[36m========================================================\x1b[0m')
console.log('\x1b[36m👀 BẮT ĐẦU THEO DÕI THAY ĐỔI DỰ ÁN GODOT (AUTO-SYNC)\x1b[0m')
console.log(`📁 Thư mục theo dõi: ${projectRoot}`)
console.log('\x1b[32m💡 Mẹo: Khi bạn lưu file (Ctrl+S) trong Godot, game sẽ tự động biên dịch lại vào App!\x1b[0m')
console.log('\x1b[36m========================================================\x1b[0m\n')

let isExporting = false
let debounceTimer = null

function triggerExport(changedFile) {
  if (isExporting) return
  if (debounceTimer) clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    isExporting = true
    const timestamp = new Date().toLocaleTimeString('vi-VN')
    console.log(`\n\x1b[33m[${timestamp}] 🔄 Phát hiện thay đổi: ${changedFile || 'file'}\x1b[0m`)
    console.log('\x1b[33m⚡ Đang tự động cập nhật game vào App Mobile...\x1b[0m')

    try {
      execSync(`node "${exportScript}"`, { stdio: 'inherit' })
      console.log(`\x1b[32m[${timestamp}] ✨ Đã cập nhật thành công!\x1b[0m\n`)
    } catch (err) {
      console.error(`\x1b[31m[${timestamp}] ❌ Lỗi biên dịch:\x1b[0m`, err.message)
    } finally {
      isExporting = false
    }
  }, 1200) // Đợi 1.2s sau khi lưu để Godot ghi file hoàn tất
}

// Bắt đầu theo dõi đệ quy thư mục Godot
try {
  fs.watch(projectRoot, { recursive: true }, (eventType, filename) => {
    if (!filename) return
    // Bỏ qua các file tạm của Godot và thư mục cache .godot
    if (
      filename.includes('.godot') ||
      filename.endsWith('.tmp') ||
      filename.endsWith('~')
    ) {
      return
    }

    if (
      filename.endsWith('.gd') ||
      filename.endsWith('.tscn') ||
      filename.endsWith('.tres') ||
      filename.endsWith('.svg') ||
      filename.endsWith('.png') ||
      filename.endsWith('.ogg') ||
      filename.endsWith('.wav') ||
      filename === 'project.godot'
    ) {
      triggerExport(filename)
    }
  })
  console.log('✅ Đang lắng nghe file (.gd, .tscn, assets)... Sẵn sàng!')
} catch (err) {
  console.error('❌ Không thể khởi động trình theo dõi:', err.message)
}
