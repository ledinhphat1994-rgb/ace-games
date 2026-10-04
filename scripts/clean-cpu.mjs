import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const psScriptPath = resolve(__dirname, 'clean-cpu.ps1')

try {
  const output = execSync(
    `powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`,
    { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
  )
  console.log(output.trim())
} catch (err) {
  console.error('Lỗi khi chạy dọn dẹp:', err.message)
}
