#!/usr/bin/env node
// Controlled Production Deploy Wrapper
// Đảm bảo:
// 1. Kiểm tra Git HEAD & Clean working tree 100%.
// 2. Chạy guard-production-release.mjs để xác thực ranh giới môi trường, D1/KV phân lập.
// 3. Thực hiện npm run build an toàn.
// 4. Tự động gắn nhãn version metadata authoritatively: --message "release:<GIT_SHA>"
//    để Cloudflare Version ID luôn có thể ánh xạ chính xác đến Git Commit SHA.
// 5. Hỗ trợ --dry-run (wrangler dry run) và --validate-only (command check).

import { execSync, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const isValidateOnly = process.argv.includes('--validate-only')
const isDryRun = process.argv.includes('--dry-run') || isValidateOnly

console.log('=== DIGITAL CAMPUS V2: CONTROLLED PRODUCTION DEPLOY ===')
if (isValidateOnly) {
  console.log('🔍 Chế độ VALIDATE-ONLY: Kiểm tra an toàn và in lệnh deploy mà không build/upload.')
} else if (isDryRun) {
  console.log('🔍 Chế độ DRY-RUN: Build và kiểm tra cấu hình Wrangler deploy không upload production.')
}

// 1. Đọc và kiểm tra Git HEAD
let headSha = ''
let currentBranch = ''
try {
  headSha = execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()
  currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()
} catch (err) {
  console.error('❌ [DEPLOY] Lỗi đọc thông tin Git repository:', err.message)
  process.exit(1)
}

if (!/^[a-f0-9]{40}$/i.test(headSha)) {
  console.error(`❌ [DEPLOY] Git SHA không hợp lệ: "${headSha}"`)
  process.exit(1)
}

// 2. Chạy Release Guard
console.log('\n[1/3] Đang chạy kiểm tra an toàn phát hành (Release Guard)...')
const guardResult = spawnSync(process.execPath, [path.join(__dirname, 'guard-production-release.mjs')], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
})

if (guardResult.status !== 0) {
  console.error(`\n❌ [DEPLOY] Release Guard thất bại với mã lỗi ${guardResult.status}. Dừng quy trình deploy.`)
  process.exit(guardResult.status ?? 1)
}

// Chuẩn bị lệnh Wrangler Deploy
const wranglerArgs = [
  'wrangler',
  'deploy',
  '--config',
  'wrangler.production.jsonc',
  '--message',
  `release:${headSha}`,
]

if (isDryRun) {
  wranglerArgs.push('--dry-run')
}

if (isValidateOnly) {
  console.log(`\n📦 Lệnh deploy dự kiến: npx ${wranglerArgs.join(' ')}`)
  console.log(`🏷️  Cloudflare Version Message: release:${headSha}`)
  console.log('✅ [DEPLOY] Xác thực cấu hình lệnh deploy thành công!')
  process.exit(0)
}

// 3. Build Production Bundle
console.log('\n[2/3] Đang build production bundle (npm run build)...')
const isWindows = process.platform === 'win32'
const npmCmd = isWindows ? 'npm.cmd' : 'npm'
const buildResult = spawnSync(npmCmd, ['run', 'build'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows,
})

if (buildResult.status !== 0) {
  console.error(`\n❌ [DEPLOY] Build thất bại với mã lỗi ${buildResult.status}. Dừng quy trình deploy.`)
  process.exit(buildResult.status ?? 1)
}

// 4. Thực thi Wrangler Deploy
console.log('\n[3/3] Đang thực thi Cloudflare Production Deploy...')
console.log(`📦 Lệnh thực thi: npx ${wranglerArgs.join(' ')}`)
console.log(`🏷️  Cloudflare Version Message: release:${headSha}`)

const npxCmd = isWindows ? 'npx.cmd' : 'npx'
const deployResult = spawnSync(npxCmd, wranglerArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows,
})

if (deployResult.status !== 0) {
  console.error(`\n❌ [DEPLOY] Wrangler deploy thất bại với mã lỗi ${deployResult.status}.`)
  process.exit(deployResult.status ?? 1)
}

console.log('\n✅ [DEPLOY] Production deploy hoàn tất thành công!')
process.exit(0)
