#!/usr/bin/env node
// Automated Regression Verification for Release Guard & Deployment Tooling
// Kiểm tra toàn diện các bất biến bắt buộc của Release Engineering:
// 1. Dirty working tree => FAIL (exit 1)
// 2. Clean non-main feature branch => FAIL (exit 1)
// 3. Stale local main where HEAD != origin/main => FAIL (exit 1)
// 4. Detached HEAD without EXPECTED_RELEASE_SHA => FAIL (exit 1)
// 5. Mismatched EXPECTED_RELEASE_SHA => FAIL (exit 1)
// 6. No test-only environment variable can bypass dirty working tree => FAIL (exit 1)
// 7. Shared R2 bucket between staging and production => FAIL (exit 1)
//
// Authoritative Exact-SHA CI Quality Gates Invariants:
// 8. CI Evaluation: CI success + exact SHA => PASS
// 9. CI Evaluation: CI success for different SHA => FAIL
// 10. CI Evaluation: CI pending (in_progress) => FAIL
// 11. CI Evaluation: CI failure => FAIL
// 12. CI Evaluation: no CI result => FAIL
//
// Process-Level Release Guard Invariants:
// 13. Process Guard: CI success + exact SHA => PASS (exit 0)
// 14. Process Guard: CI success for different SHA => FAIL (exit 1)
// 15. Process Guard: CI pending => FAIL (exit 1)
// 16. Process Guard: CI failure => FAIL (exit 1)
// 17. Process Guard: no CI result => FAIL (exit 1)
// 18. Process Guard: Detached HEAD with matching EXPECTED_RELEASE_SHA + passing CI => PASS (exit 0)
// 19. Deploy Wrapper: validate-only contains release:<exact verified 40-char SHA> => PASS (exit 0)

import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateCiRuns } from './ci-gate-verifier.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const guardScript = path.join(__dirname, 'guard-production-release.mjs')
const deployScript = path.join(__dirname, 'deploy-production.mjs')

console.log('=== VERIFYING RELEASE GUARD & CI QUALITY GATES (DETERMINISTIC SUITE) ===\n')

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

// ========================================================
// 1. PURE COMPARISON LOGIC TESTS (evaluateCiRuns)
// ========================================================
console.log('--- 1. Pure Comparison Logic Tests (evaluateCiRuns) ---')

const SAMPLE_SHA = 'db522daf7a990f350fd493709343209a06135b7f'
const OTHER_SHA = 'a2ef68628b030438b4d82f7c220f86235123d578'

test('CI Evaluation: CI success + exact SHA => PASS', () => {
  const runs = [
    { name: 'CI Quality Gates', headSha: SAMPLE_SHA, status: 'completed', conclusion: 'success' },
  ]
  const result = evaluateCiRuns(runs, SAMPLE_SHA)
  if (!result.ok || !result.matchedRun) {
    throw new Error(`Expected ok: true, received: ${JSON.stringify(result)}`)
  }
})

test('CI Evaluation: CI success for different SHA => FAIL', () => {
  const runs = [
    { name: 'CI Quality Gates', headSha: OTHER_SHA, status: 'completed', conclusion: 'success' },
  ]
  const result = evaluateCiRuns(runs, SAMPLE_SHA)
  if (result.ok) {
    throw new Error(`Expected ok: false for different SHA, received ok: true`)
  }
  if (!result.reason.includes('Không có CI Quality Gates run nào cho exact SHA')) {
    throw new Error(`Expected reason to mention exact SHA mismatch, received: ${result.reason}`)
  }
})

test('CI Evaluation: CI pending (in_progress) => FAIL', () => {
  const runs = [
    { name: 'CI Quality Gates', headSha: SAMPLE_SHA, status: 'in_progress' },
  ]
  const result = evaluateCiRuns(runs, SAMPLE_SHA)
  if (result.ok) {
    throw new Error(`Expected ok: false for pending CI, received ok: true`)
  }
  if (!result.reason.includes('chưa hoàn tất')) {
    throw new Error(`Expected reason to mention 'chưa hoàn tất', received: ${result.reason}`)
  }
})

test('CI Evaluation: CI failure => FAIL', () => {
  const runs = [
    { name: 'CI Quality Gates', headSha: SAMPLE_SHA, status: 'completed', conclusion: 'failure' },
  ]
  const result = evaluateCiRuns(runs, SAMPLE_SHA)
  if (result.ok) {
    throw new Error(`Expected ok: false for failed CI, received ok: true`)
  }
  if (!result.reason.includes("hoàn tất với kết quả 'failure'")) {
    throw new Error(`Expected reason to mention failure, received: ${result.reason}`)
  }
})

test('CI Evaluation: no CI result => FAIL', () => {
  const result = evaluateCiRuns([], SAMPLE_SHA)
  if (result.ok) {
    throw new Error(`Expected ok: false for empty runs, received ok: true`)
  }
  if (!result.reason.includes('Không tìm thấy bất kỳ lượt chạy CI Quality Gates nào')) {
    throw new Error(`Expected reason to mention no runs found, received: ${result.reason}`)
  }
})

// ========================================================
// 2. REPOSITORY & RELEASE GUARD PROCESS TESTS
// ========================================================
console.log('\n--- 2. Process-Level Release Guard Tests ---')

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
  const fixtureHeadSha = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()

  const passingRunsJson = JSON.stringify([
    { name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' },
  ])

  // Test: dirty working tree => FAIL (exit code 1)
  test('Process Guard: Dirty working tree => FAIL (exit 1)', () => {
    const dirtyFile = path.join(localDir, 'dirty.txt')
    try {
      fs.writeFileSync(dirtyFile, 'uncommitted dirty change', 'utf8')
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, MOCK_CI_RUNS: passingRunsJson },
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

  // Test: clean non-main feature branch => FAIL (exit code 1)
  test('Process Guard: Clean non-main feature branch => FAIL (exit 1)', () => {
    try {
      execSync('git checkout -b feature/test-branch', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '', MOCK_CI_RUNS: passingRunsJson },
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

  // Test: stale local main where HEAD != origin/main => FAIL (exit code 1)
  test('Process Guard: Stale local main where HEAD != origin/main => FAIL (exit 1)', () => {
    const unpushedFile = path.join(localDir, 'unpushed.txt')
    try {
      fs.writeFileSync(unpushedFile, 'unpushed commit payload', 'utf8')
      execSync('git add unpushed.txt && git commit -m "unpushed local commit"', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, MOCK_CI_RUNS: passingRunsJson },
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

  // Test: CI success + exact SHA => PASS (exit code 0)
  test('Process Guard: CI success + exact SHA => PASS (exit 0)', () => {
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: passingRunsJson },
    })
    if (res.status !== 0) {
      throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('Exact-SHA CI Quality Gates: PASS')) {
      throw new Error(`Expected output to contain 'Exact-SHA CI Quality Gates: PASS', received:\n${combined}`)
    }
  })

  // Test: CI success for different SHA => FAIL (exit code 1)
  test('Process Guard: CI success for different SHA => FAIL (exit 1)', () => {
    const mismatchedRunsJson = JSON.stringify([
      { name: 'CI Quality Gates', headSha: '0000000000000000000000000000000000000000', status: 'completed', conclusion: 'success' },
    ])
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: mismatchedRunsJson },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI BẢO VỆ CI QUALITY GATES')) {
      throw new Error(`Expected output to contain 'LỖI BẢO VỆ CI QUALITY GATES', received:\n${combined}`)
    }
  })

  // Test: CI pending => FAIL (exit code 1)
  test('Process Guard: CI pending => FAIL (exit 1)', () => {
    const pendingRunsJson = JSON.stringify([
      { name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'in_progress' },
    ])
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: pendingRunsJson },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('chưa hoàn tất')) {
      throw new Error(`Expected output to contain 'chưa hoàn tất', received:\n${combined}`)
    }
  })

  // Test: CI failure => FAIL (exit code 1)
  test('Process Guard: CI failure => FAIL (exit 1)', () => {
    const failedRunsJson = JSON.stringify([
      { name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'failure' },
    ])
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: failedRunsJson },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes("hoàn tất với kết quả 'failure'")) {
      throw new Error(`Expected output to contain failure error, received:\n${combined}`)
    }
  })

  // Test: no CI result => FAIL (exit code 1)
  test('Process Guard: no CI result => FAIL (exit 1)', () => {
    const emptyRunsJson = JSON.stringify([])
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: emptyRunsJson },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('Không tìm thấy bất kỳ lượt chạy CI Quality Gates nào')) {
      throw new Error(`Expected output to contain no runs found error, received:\n${combined}`)
    }
  })

  // Test: detached HEAD without EXPECTED_RELEASE_SHA => FAIL (exit code 1)
  test('Process Guard: Detached HEAD without EXPECTED_RELEASE_SHA => FAIL (exit 1)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: '', MOCK_CI_RUNS: passingRunsJson },
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

  // Test: detached HEAD with matching EXPECTED_RELEASE_SHA + passing CI => PASS (exit code 0)
  test('Process Guard: Detached HEAD with matching EXPECTED_RELEASE_SHA => PASS (exit 0)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: fixtureHeadSha, MOCK_CI_RUNS: passingRunsJson },
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

  // Test: mismatched EXPECTED_RELEASE_SHA => FAIL (exit code 1)
  test('Process Guard: Mismatched EXPECTED_RELEASE_SHA => FAIL (exit 1)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, EXPECTED_RELEASE_SHA: '0000000000000000000000000000000000000000', MOCK_CI_RUNS: passingRunsJson },
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

  // Test: deploy wrapper validate-only contains: release:<exact verified 40-char SHA>
  test('Deploy Wrapper: validate-only contains release:<exact verified 40-char SHA>', () => {
    const res = spawnSync(process.execPath, [deployScript, '--target-dir', localDir, '--validate-only'], {
      encoding: 'utf8',
      env: { ...process.env, MOCK_CI_RUNS: passingRunsJson },
    })
    if (res.status !== 0) {
      throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes(`release:${fixtureHeadSha}`)) {
      throw new Error(`Expected output to contain 'release:${fixtureHeadSha}', received:\n${combined}`)
    }
    if (!combined.includes('--message')) {
      throw new Error(`Expected output to contain '--message', received:\n${combined}`)
    }
    if (!combined.includes('Exact-SHA CI Quality Gates: PASS')) {
      throw new Error(`Expected output to contain 'Exact-SHA CI Quality Gates: PASS', received:\n${combined}`)
    }
  })

  // Test: no test-only environment variable can turn a dirty production tree into an allowed real deployment
  test('Process Guard: No test-only environment variable can bypass dirty working tree', () => {
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
          MOCK_CI_RUNS: passingRunsJson,
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

  // Test: shared R2 bucket between staging and production => FAIL (exit 1)
  test('Process Guard: Shared R2 bucket between staging and production => FAIL (exit 1)', () => {
    const stagingConfigPath = path.join(localDir, 'wrangler.staging.jsonc')
    const originalStagingConfig = fs.readFileSync(stagingConfigPath, 'utf8')
    try {
      const regressedStagingConfig = originalStagingConfig.replace(
        /"bucket_name":\s*"lop-10a7-anh-staging"/,
        '"bucket_name": "lop-10a7-anh"',
      )
      fs.writeFileSync(stagingConfigPath, regressedStagingConfig, 'utf8')
      execSync('git add wrangler.staging.jsonc && git commit -m "simulate shared r2 regression" && git push origin main', { cwd: localDir, stdio: 'pipe' })
      const newHead = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()
      const newHeadRunsJson = JSON.stringify([
        { name: 'CI Quality Gates', headSha: newHead, status: 'completed', conclusion: 'success' },
      ])
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: { ...process.env, MOCK_CI_RUNS: newHeadRunsJson },
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
console.log('✅ All deterministic release guard & CI quality gates invariants verified successfully!\n')
process.exit(0)
