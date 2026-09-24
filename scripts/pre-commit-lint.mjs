import { execSync, spawnSync } from 'node:child_process'

try {
  // Lấy danh sách các file được staged để commit (bỏ qua file đã xóa)
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=d', { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && /\.(ts|tsx|js|mjs)$/i.test(f))

  if (stagedFiles.length > 0) {
    const isWin = process.platform === 'win32'
    const npxCmd = isWin ? 'npx.cmd' : 'npx'
    const result = spawnSync(npxCmd, ['oxlint', ...stagedFiles], {
      stdio: 'inherit',
      shell: isWin,
    })
    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }
  }
} catch {
  process.exit(1)
}
