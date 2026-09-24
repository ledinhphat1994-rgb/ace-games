import { execSync } from 'node:child_process'

try {
  // Lấy danh sách các file được staged để commit (bỏ qua file đã xóa)
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=d', { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => /\.(ts|tsx|js|mjs)$/i.test(f))

  if (stagedFiles.length > 0) {
    const isWin = process.platform === 'win32'
    const cmd = `npx oxlint ${stagedFiles.map((f) => `"${f}"`).join(' ')}`
    execSync(cmd, { stdio: 'inherit', shell: isWin })
  }
} catch {
  process.exit(1)
}
