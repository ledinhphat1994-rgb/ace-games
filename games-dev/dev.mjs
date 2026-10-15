import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serveScript = path.resolve(__dirname, 'web-preview/serve.mjs')
const watchScript = path.resolve(__dirname, 'watch-and-sync.mjs')
const projectDir = path.resolve(__dirname, 'godot-project')
const godotExe = 'D:\\Godot_v4.7.2-stable_win64.exe\\Godot_v4.7.2-stable_win64.exe'

console.log('\x1b[35m╔══════════════════════════════════════════════════════╗\x1b[0m')
console.log('\x1b[35m║      🎮 ACE GAMES — GODOT DEV ENVIRONMENT            ║\x1b[0m')
console.log('\x1b[35m╚══════════════════════════════════════════════════════╝\x1b[0m\n')

// 1. Mở Godot Editor nếu file thực thi tồn tại
if (fs.existsSync(godotExe)) {
  try {
    const godotProc = spawn(godotExe, ['-e', '--path', projectDir], {
      detached: true,
      stdio: 'ignore',
    })
    godotProc.unref()
    console.log('\x1b[32m🎮 Đã tự động mở Godot Editor với dự án game của bạn!\x1b[0m\n')
  } catch (err) {
    console.warn('⚠️ Chưa thể khởi chạy Godot GUI:', err.message)
  }
} else {
  console.log('💡 Lưu ý: Hãy mở Godot Editor từ shortcut của bạn nếu cần chỉnh sửa giao diện.')
}

// 2. Khởi động Web Preview Server
const serverProcess = spawn('node', [serveScript], {
  stdio: 'inherit',
})

// 3. Khởi động File Watcher Auto-Export
const watchProcess = spawn('node', [watchScript], {
  stdio: 'inherit',
})

const cleanup = () => {
  console.log('\n🛑 Đang dừng môi trường làm game Godot...')
  serverProcess.kill()
  watchProcess.kill()
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
