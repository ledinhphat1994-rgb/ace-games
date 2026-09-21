#!/usr/bin/env node
// Automated Regression Verification for Release Guard & Deployment Tooling
// Kiểm tra 10 invariants bắt buộc của Release Engineering:
// 1. Dirty working tree => BLOCK (exit 1)
// 2. Clean non-main feature branch => BLOCK (exit 1)
// 3. Stale local main where HEAD != origin/main => BLOCK (exit 1)
// 4. Current main where HEAD == origin/main => PASS (exit 0)
// 5. Detached HEAD without EXPECTED_RELEASE_SHA => BLOCK (exit 1)
// 6. Detached HEAD with matching EXPECTED_RELEASE_SHA => PASS (exit 0)
// 7. Mismatched EXPECTED_RELEASE_SHA => BLOCK (exit 1)
// 8. Deploy wrapper dry-run contains: release:<exact verified 40-char SHA>
// 9. No test-only environment variable can turn a dirty production tree into an allowed real deployment (BLOCK exit 1)
// 10. Shared R2 bucket between staging and production => BLOCK (exit 1)

import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const guardScript = path.join(__dirname, 'guard-production-release.mjs')
const deployScript = path.join(__dirname, 'deploy-production.mjs')

console.log('=== VERIFYING RELEASE GUARD & DEPLOY TOOLING (10 INVARIANTS) ===\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ PASS: ${name}`)
    passed++
  } catch (err) {
    console.error(`❌ FAIL: ${name}`)
    console.error('   ', err.message)
    failed++
  }
}

// Thiết lập Isolated Fixture Repository để kiểm thử mà không làm ảnh hưởng workspace chính
const fixtureDir = path.join(rootDir, 'node_modules', '.tmp-guard-fixture')
const remoteDir = path.join(fixtureDir, 'remote.git')
const localDir = path.join(fixtureDir, 'local')

function setupFixture() {
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }
  fs.mkdirSync(remoteDir, { recursive: true })
  fs.mkdirSync(localDir, { recursive: true })

  // 1. Khởi tạo Bare Remote với nhánh main
  execSync('git init --bare --initial-branch=main', { cwd: remoteDir, stdio: 'pipe' })

  // 2. Khởi tạo Local Repository kết nối tới remote
  execSync('git init --initial-branch=main', { cwd: localDir, stdio: 'pipe' })
  execSync('git config user.name "Test Runner"', { cwd: localDir, stdio: 'pipe' })
  execSync('git config user.email "test@example.com"', { cwd: localDir, stdio: 'pipe' })
  execSync(`git remote add origin "${remoteDir.replace(/\\/g, '/')}"`, { cwd: localDir, stdio: 'pipe' })

  // 3. Sao chép cấu hình release từ dự án chính
  fs.copyFileSync(path.join(rootDir, 'wrangler.production.jsonc'), path.join(localDir, 'wrangler.production.jsonc'))
  fs.copyFileSync(path.join(rootDir, 'wrangler.staging.jsonc'), path.join(localDir, 'wrangler.staging.jsonc'))
  fs.cpSync(path.join(rootDir, 'migrations'), path.join(localDir, 'migrations'), { recursive: true })
  fs.cpSync(path.join(rootDir, 'analytics-migrations'), path.join(localDir, 'analytics-migrations'), { recursive: true })

  fs.writeFileSync(path.join(localDir, 'package.json'), JSON.stringify({
    name: 'test-fixture',
    scripts: {
      build: 'node -e "console.log(\'mock build success\')"',
    },
  }, null, 2))

  // 4. Commit và push lên origin/main
  execSync('git add .', { cwd: localDir, stdio: 'pipe' })
  execSync('git commit -m "initial release commit"', { cwd: localDir, stdio: 'pipe' })
  execSync('git push -u origin main', { cwd: localDir, stdio: 'pipe' })
}

function teardownFixture() {
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }
}

try {
  setupFixture()

  // Test 1: dirty working tree => BLOCK (exit code 1)
  test('1. Dirty working tree => BLOCK (exit 1)', () => {
    const dirtyFile = path.join(localDir, 'dirty.txt')
    try {
      fs.writeFileSync(dirtyFile, 'uncommitted dirty change', 'utf8')
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('dirty working tree')) {
        throw new Error(`Expected output to contain 'dirty working tree', received:\n${combined}`)
      }
    } finally {
      if (fs.existsSync(dirtyFile)) {
        fs.unlinkSync(dirtyFile)
      }
    }
  })

  // Test 2: clean non-main feature branch => BLOCK (exit code 1)
  test('2. Clean non-main feature branch => BLOCK (exit 1)', () => {
    try {
      execSync('git checkout -b feature/test-branch', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '' },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('LỖI NHÁNH PHÁT HÀNH')) {
        throw new Error(`Expected output to contain 'LỖI NHÁNH PHÁT HÀNH', received:\n${combined}`)
      }
    } finally {
      execSync('git checkout main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test 3: stale local main where HEAD != origin/main => BLOCK (exit code 1)
  test('3. Stale local main where HEAD != origin/main => BLOCK (exit 1)', () => {
    const unpushedFile = path.join(localDir, 'unpushed.txt')
    try {
      fs.writeFileSync(unpushedFile, 'unpushed commit payload', 'utf8')
      execSync('git add unpushed.txt && git commit -m "unpushed local commit"', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('stale local main')) {
        throw new Error(`Expected output to contain 'stale local main', received:\n${combined}`)
      }
    } finally {
      execSync('git reset --hard origin/main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test 4: current main where HEAD == origin/main => PASS (exit code 0)
  test('4. Current main where HEAD == origin/main => PASS (exit 0)', () => {
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env },
    })
    if (res.status !== 0) {
      throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('Khóa nguồn thành công')) {
      throw new Error(`Expected output to contain 'Khóa nguồn thành công', received:\n${combined}`)
    }
  })

  // Test 5: detached HEAD without EXPECTED_RELEASE_SHA => BLOCK (exit code 1)
  test('5. Detached HEAD without EXPECTED_RELEASE_SHA => BLOCK (exit 1)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: '' },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('LỖI SOURCE CONTRACT (DETACHED HEAD)')) {
        throw new Error(`Expected output to contain 'LỖI SOURCE CONTRACT (DETACHED HEAD)', received:\n${combined}`)
      }
    } finally {
      execSync('git checkout main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test 6: detached HEAD with matching EXPECTED_RELEASE_SHA => PASS (exit code 0)
  test('6. Detached HEAD with matching EXPECTED_RELEASE_SHA => PASS (exit 0)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const currentHead = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: currentHead },
      })
      if (res.status !== 0) {
        throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('Khóa nguồn CI thành công')) {
        throw new Error(`Expected output to contain 'Khóa nguồn CI thành công', received:\n${combined}`)
      }
    } finally {
      execSync('git checkout main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test 7: mismatched EXPECTED_RELEASE_SHA => BLOCK (exit code 1)
  test('7. Mismatched EXPECTED_RELEASE_SHA => BLOCK (exit 1)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: '0000000000000000000000000000000000000000' },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('LỖI SHA BẢO VỆ')) {
        throw new Error(`Expected output to contain 'LỖI SHA BẢO VỆ', received:\n${combined}`)
      }
    } finally {
      execSync('git checkout main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test 8: deploy wrapper dry-run contains: release:<exact verified 40-char SHA>
  test('8. Deploy wrapper contains release:<exact verified 40-char SHA>', () => {
    const currentHead = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()
    const res = spawnSync(process.execPath, [deployScript, '--target-dir', localDir, '--validate-only'], {
      encoding: 'utf8',
      env: { ...process.env },
    })
    if (res.status !== 0) {
      throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes(`release:${currentHead}`)) {
      throw new Error(`Expected output to contain 'release:${currentHead}', received:\n${combined}`)
    }
    if (!combined.includes('--message')) {
      throw new Error(`Expected output to contain '--message', received:\n${combined}`)
    }
  })

  // Test 9: no test-only environment variable can turn a dirty production tree into an allowed real deployment
  test('9. No test-only environment variable can bypass dirty working tree', () => {
    const dirtyFile = path.join(localDir, 'dirty.txt')
    try {
      fs.writeFileSync(dirtyFile, 'dirty bypass test', 'utf8')
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: {
          ...process.env,
          SKIP_DIRTY_CHECK: '1',
          ALLOW_NON_MAIN_DEPLOY: '1',
          FORCE: '1',
          DRY_RUN: '1',
        },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status} (Dirty tree check was bypassed!)`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('dirty working tree')) {
        throw new Error(`Expected output to contain 'dirty working tree', received:\n${combined}`)
      }
    } finally {
      if (fs.existsSync(dirtyFile)) {
        fs.unlinkSync(dirtyFile)
      }
    }
  })

  // Test 10: shared R2 bucket between staging and production => BLOCK (exit 1)
  test('10. Shared R2 bucket between staging and production => BLOCK (exit 1)', () => {
    const stagingConfigPath = path.join(localDir, 'wrangler.staging.jsonc')
    const originalStagingConfig = fs.readFileSync(stagingConfigPath, 'utf8')
    try {
      const regressedStagingConfig = originalStagingConfig.replace(
        /"bucket_name":\s*"lop-10a7-anh-staging"/,
        '"bucket_name": "lop-10a7-anh"',
      )
      fs.writeFileSync(stagingConfigPath, regressedStagingConfig, 'utf8')
      execSync('git add wrangler.staging.jsonc && git commit -m "simulate shared r2 regression" && git push origin main', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env },
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status} (Shared R2 bucket was allowed!)`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('LỖI BẢO VỆ NHIỄM CHÉO R2')) {
        throw new Error(`Expected output to contain 'LỖI BẢO VỆ NHIỄM CHÉO R2', received:\n${combined}`)
      }
    } finally {
      fs.writeFileSync(stagingConfigPath, originalStagingConfig, 'utf8')
      execSync('git add wrangler.staging.jsonc && git commit -m "revert shared r2 regression" && git push origin main', { cwd: localDir, stdio: 'pipe' })
    }
  })
} finally {
  teardownFixture()
}

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
console.log('✅ All 10 release guard invariants verified successfully!\n')
process.exit(0)
