#!/usr/bin/env node
// Automated Regression Verification for Release Guard & Deployment Tooling
// Kiểm tra toàn diện các bất biến bắt buộc của Release Engineering:
//
// 1. Pure Comparison Logic Invariants (evaluateCiRuns):
//    - CI success + exact SHA => PASS
//    - CI success for different SHA => FAIL
//    - CI pending (in_progress) => FAIL
//    - CI failure => FAIL
//    - no CI result => FAIL
//
// 2. Bypass Regression Invariants (PR #21 Closure Requirements A -> G):
//    - A: Fake MOCK_CI_RUNS environment variable cannot make real release guard pass => FAIL (exit 1)
//    - B: GITHUB_REPOSITORY pointing to another repo cannot redirect authoritative CI lookup => FAIL (exit 1)
//    - C: Canonical repository CI exact SHA success => PASS (exit 0)
//    - D: Fork exact SHA success => NOT accepted as evidence => FAIL (exit 1)
//    - E: Detached HEAD == EXPECTED_RELEASE_SHA but origin/main advanced => FAIL (exit 1)
//    - F: Detached HEAD == freshly fetched origin/main + expected SHA + exact CI success => PASS (exit 0)
//    - G: Main advances between old checkout state and guard execution => guard fetch catches it and FAILS (exit 1)
//
// 3. Structural & Process Invariants:
//    - Dirty working tree => FAIL (exit 1)
//    - Clean non-main feature branch => FAIL (exit 1)
//    - Stale local main where HEAD != origin/main => FAIL (exit 1)
//    - CI pending in process guard => FAIL (exit 1)
//    - CI failure in process guard => FAIL (exit 1)
//    - No CI result in process guard => FAIL (exit 1)
//    - CI success for different SHA in process guard => FAIL (exit 1)
//    - Detached HEAD without EXPECTED_RELEASE_SHA => FAIL (exit 1)
//    - Mismatched EXPECTED_RELEASE_SHA => FAIL (exit 1)
//    - Deploy Wrapper: validate-only contains release:<exact verified 40-char SHA> => PASS (exit 0)
//    - No test-only environment variable can bypass dirty working tree => FAIL (exit 1)
//    - Shared R2 bucket between staging and production => FAIL (exit 1)

import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { evaluateCiRuns, CANONICAL_REPOSITORY } from './ci-gate-verifier.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const guardScript = path.join(__dirname, 'guard-production-release.mjs')
const deployScript = path.join(__dirname, 'deploy-production.mjs')

console.log('=== VERIFYING RELEASE GUARD & CI QUALITY GATES (HARDENED SUITE) ===\n')

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
// 2. ISOLATED FIXTURE SETUP WITH FAKE `gh` CLI
// ========================================================
console.log('\n--- 2. Bypass Regression & Process-Level Tests ---')

const fixtureDir = path.join(rootDir, 'node_modules', '.tmp-guard-fixture')
const remoteDir = path.join(fixtureDir, 'remote.git')
const localDir = path.join(fixtureDir, 'local')
const fixtureBinDir = path.join(fixtureDir, 'bin')
const mockGhDataFile = path.join(fixtureDir, 'mock-gh-data.json')

function setMockGhData(config) {
  fs.writeFileSync(mockGhDataFile, JSON.stringify(config), 'utf8')
}

function getFixtureEnv(extraEnv = {}) {
  return {
    ...process.env,
    PATH: `${fixtureBinDir}${path.delimiter}${process.env.PATH}`,
    ...extraEnv,
  }
}

function setupFixture() {
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }
  fs.mkdirSync(remoteDir, { recursive: true })
  fs.mkdirSync(localDir, { recursive: true })
  fs.mkdirSync(fixtureBinDir, { recursive: true })

  // Tạo fake gh CLI bên trong fixtureBinDir để test process level mà không có mock backdoor trong production code
  const mockGhScript = `import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const binDir = path.dirname(__filename)
const fixtureDir = path.dirname(binDir)
const dataFile = path.join(fixtureDir, 'mock-gh-data.json')

const args = process.argv.slice(2)
const repoIndex = args.indexOf('--repo')
const requestedRepo = repoIndex !== -1 ? args[repoIndex + 1] : ''

if (!fs.existsSync(dataFile)) {
  console.log('[]')
  process.exit(0)
}

const mockConfig = JSON.parse(fs.readFileSync(dataFile, 'utf8'))

if (mockConfig.exitCode !== undefined && mockConfig.exitCode !== 0) {
  if (mockConfig.stderr) console.error(mockConfig.stderr)
  process.exit(mockConfig.exitCode)
}

if (mockConfig.allowedRepo && requestedRepo !== mockConfig.allowedRepo) {
  console.log('[]')
  process.exit(0)
}

console.log(JSON.stringify(mockConfig.runs || []))
process.exit(0)
`
  fs.writeFileSync(path.join(fixtureBinDir, 'mock-gh.mjs'), mockGhScript, 'utf8')

  // gh.cmd cho Windows
  fs.writeFileSync(
    path.join(fixtureBinDir, 'gh.cmd'),
    `@echo off\r\nnode "%~dp0mock-gh.mjs" %*\r\n`,
    'utf8'
  )

  // gh cho Linux/macOS
  const shScript = `#!/bin/sh\nexec node "$(dirname "$0")/mock-gh.mjs" "$@"\n`
  fs.writeFileSync(path.join(fixtureBinDir, 'gh'), shScript, 'utf8')
  try {
    fs.chmodSync(path.join(fixtureBinDir, 'gh'), 0o755)
  } catch (_err) {
    // Ignore chmod on Windows
  }

  // Khởi tạo Bare Remote với nhánh main
  execSync('git init --bare --initial-branch=main', { cwd: remoteDir, stdio: 'pipe' })

  // Khởi tạo Local Repository kết nối tới remote
  execSync('git init --initial-branch=main', { cwd: localDir, stdio: 'pipe' })
  execSync('git config user.name "Test Runner"', { cwd: localDir, stdio: 'pipe' })
  execSync('git config user.email "test@example.com"', { cwd: localDir, stdio: 'pipe' })
  execSync(`git remote add origin "${remoteDir.replace(/\\/g, '/')}"`, { cwd: localDir, stdio: 'pipe' })

  // Sao chép cấu hình release từ dự án chính
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

  // Commit và push lên origin/main
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
  let fixtureHeadSha = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()

  // -------------------------------------------------------------
  // PR #21 Closure Regression Tests: A through G
  // -------------------------------------------------------------

  // Test A: fake MOCK_CI_RUNS environment variable cannot make real release guard pass
  test('A. Fake MOCK_CI_RUNS environment variable cannot make real release guard pass => FAIL (exit 1)', () => {
    // Chạy guardScript KHÔNG có fake gh trong PATH
    // Đặt MOCK_CI_RUNS giả mạo trạng thái thành công
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: {
        ...process.env,
        MOCK_CI_RUNS: JSON.stringify([
          { name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' },
        ]),
      },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1 (MOCK_CI_RUNS must be completely ignored), received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI TRUY VẤN CI QUALITY GATES TỪ GITHUB') && !combined.includes('LỖI BẢO VỆ CI QUALITY GATES')) {
      throw new Error(`Expected output to contain CI query failure, received:\n${combined}`)
    }
  })

  // Test B: GITHUB_REPOSITORY pointing to another repo cannot redirect authoritative CI lookup
  test('B. GITHUB_REPOSITORY pointing to another repo cannot redirect authoritative CI lookup => FAIL (exit 1)', () => {
    setMockGhData({
      runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv({
        GITHUB_REPOSITORY: 'attacker-fork/lop-10a7',
      }),
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI BẢO MẬT: GITHUB_REPOSITORY')) {
      throw new Error(`Expected output to contain 'LỖI BẢO MẬT: GITHUB_REPOSITORY', received:\n${combined}`)
    }
  })

  // Test C: canonical repository CI exact SHA success => PASS
  test('C. Canonical repository CI exact SHA success => PASS (exit 0)', () => {
    setMockGhData({
      allowedRepo: CANONICAL_REPOSITORY,
      runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
    })
    if (res.status !== 0) {
      throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('Exact-SHA CI Quality Gates: PASS')) {
      throw new Error(`Expected output to contain 'Exact-SHA CI Quality Gates: PASS', received:\n${combined}`)
    }
  })

  // Test D: fork exact SHA success => NOT accepted as evidence
  test('D. Fork exact SHA success => NOT accepted as evidence => FAIL (exit 1)', () => {
    // Mock gh chỉ trả dữ liệu nếu repo là fork; đối với canonical repo thì trả về []
    setMockGhData({
      allowedRepo: 'attacker-fork/lop-10a7',
      runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1 (fork runs must not be accepted for canonical repo), received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI BẢO VỆ CI QUALITY GATES')) {
      throw new Error(`Expected output to contain 'LỖI BẢO VỆ CI QUALITY GATES', received:\n${combined}`)
    }
  })

  // Test E: detached HEAD == EXPECTED_RELEASE_SHA but origin/main advanced => FAIL
  test('E. Detached HEAD == EXPECTED_RELEASE_SHA but origin/main advanced => FAIL (exit 1)', () => {
    try {
      // 1. Checkout detached HEAD tại commit hiện tại
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })

      // 2. Tạo clone tạm để đẩy commit mới lên remote origin/main
      const tempAdvDir = path.join(fixtureDir, 'adv-clone-e')
      execSync(`git clone "${remoteDir.replace(/\\/g, '/')}" "${tempAdvDir.replace(/\\/g, '/')}"`, { stdio: 'pipe' })
      execSync('git config user.name "Advancer" && git config user.email "adv@test.com"', { cwd: tempAdvDir, stdio: 'pipe' })
      fs.writeFileSync(path.join(tempAdvDir, 'advance_e.txt'), 'advance commit on main E', 'utf8')
      execSync('git add advance_e.txt && git commit -m "main advanced by another PR" && git push origin main', { cwd: tempAdvDir, stdio: 'pipe' })
      fs.rmSync(tempAdvDir, { recursive: true, force: true })

      setMockGhData({
        allowedRepo: CANONICAL_REPOSITORY,
        runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
      })

      // 3. Thực thi guardScript: HEAD == EXPECTED_RELEASE_SHA == fixtureHeadSha, NHƯNG remote origin/main đã tiến bước
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({
          EXPECTED_RELEASE_SHA: fixtureHeadSha,
        }),
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1 (detached HEAD must fail when origin/main advanced), received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('HEAD không khớp với origin/main mới nhất')) {
        throw new Error(`Expected output to contain 'HEAD không khớp với origin/main mới nhất', received:\n${combined}`)
      }
    } finally {
      setupFixture()
      fixtureHeadSha = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()
    }
  })

  // Test F: detached HEAD == freshly fetched origin/main + expected SHA + exact CI success => PASS
  test('F. Detached HEAD == freshly fetched origin/main + expected SHA + exact CI success => PASS (exit 0)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      setMockGhData({
        allowedRepo: CANONICAL_REPOSITORY,
        runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
      })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({
          EXPECTED_RELEASE_SHA: fixtureHeadSha,
        }),
      })
      if (res.status !== 0) {
        throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('Khóa nguồn thành công') || !combined.includes('Exact-SHA CI Quality Gates: PASS')) {
        throw new Error(`Expected output to contain success logs, received:\n${combined}`)
      }
    } finally {
      execSync('git checkout main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test G: main advances between old checkout state and guard execution => guard fetch catches it and FAILS
  test('G. Main advances between old checkout state and guard execution => guard fetch catches it and FAILS (exit 1)', () => {
    try {
      // Local main ở fixtureHeadSha
      // Đẩy commit mới lên remote origin/main qua clone tạm
      const tempAdvDir = path.join(fixtureDir, 'adv-clone-g')
      execSync(`git clone "${remoteDir.replace(/\\/g, '/')}" "${tempAdvDir.replace(/\\/g, '/')}"`, { stdio: 'pipe' })
      execSync('git config user.name "Advancer" && git config user.email "adv@test.com"', { cwd: tempAdvDir, stdio: 'pipe' })
      fs.writeFileSync(path.join(tempAdvDir, 'advance_g.txt'), 'advance commit on main G', 'utf8')
      execSync('git add advance_g.txt && git commit -m "main advanced on remote" && git push origin main', { cwd: tempAdvDir, stdio: 'pipe' })
      fs.rmSync(tempAdvDir, { recursive: true, force: true })

      setMockGhData({
        allowedRepo: CANONICAL_REPOSITORY,
        runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
      })

      // Chạy guardScript trên local main cũ (stale)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv(),
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1 when remote main has advanced, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('HEAD không khớp với origin/main mới nhất')) {
        throw new Error(`Expected output to contain 'HEAD không khớp với origin/main mới nhất', received:\n${combined}`)
      }
    } finally {
      setupFixture()
      fixtureHeadSha = execSync('git rev-parse HEAD', { cwd: localDir, encoding: 'utf8' }).trim()
    }
  })

  // -------------------------------------------------------------
  // Standard Process Guard Tests
  // -------------------------------------------------------------

  const defaultPassingMock = {
    allowedRepo: CANONICAL_REPOSITORY,
    runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'success' }],
  }

  // Test: dirty working tree => FAIL (exit code 1)
  test('Process Guard: Dirty working tree => FAIL (exit 1)', () => {
    const dirtyFile = path.join(localDir, 'dirty.txt')
    try {
      fs.writeFileSync(dirtyFile, 'uncommitted dirty change', 'utf8')
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv(),
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
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({ ALLOW_NON_MAIN_DEPLOY: '' }),
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
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv(),
      })
      if (res.status !== 1) {
        throw new Error(`Expected status 1, received ${res.status}`)
      }
      const combined = res.stderr + res.stdout
      if (!combined.includes('HEAD không khớp với origin/main mới nhất')) {
        throw new Error(`Expected output to contain 'HEAD không khớp với origin/main mới nhất', received:\n${combined}`)
      }
    } finally {
      execSync('git reset --hard origin/main', { cwd: localDir, stdio: 'pipe' })
    }
  })

  // Test: CI success for different SHA in process guard => FAIL (exit code 1)
  test('Process Guard: CI success for different SHA => FAIL (exit 1)', () => {
    setMockGhData({
      allowedRepo: CANONICAL_REPOSITORY,
      runs: [{ name: 'CI Quality Gates', headSha: '0000000000000000000000000000000000000000', status: 'completed', conclusion: 'success' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI BẢO VỆ CI QUALITY GATES')) {
      throw new Error(`Expected output to contain 'LỖI BẢO VỆ CI QUALITY GATES', received:\n${combined}`)
    }
  })

  // Test: CI pending in process guard => FAIL (exit code 1)
  test('Process Guard: CI pending => FAIL (exit 1)', () => {
    setMockGhData({
      allowedRepo: CANONICAL_REPOSITORY,
      runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'in_progress' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('chưa hoàn tất')) {
      throw new Error(`Expected output to contain 'chưa hoàn tất', received:\n${combined}`)
    }
  })

  // Test: CI failure in process guard => FAIL (exit code 1)
  test('Process Guard: CI failure => FAIL (exit 1)', () => {
    setMockGhData({
      allowedRepo: CANONICAL_REPOSITORY,
      runs: [{ name: 'CI Quality Gates', headSha: fixtureHeadSha, status: 'completed', conclusion: 'failure' }],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes("hoàn tất với kết quả 'failure'")) {
      throw new Error(`Expected output to contain failure error, received:\n${combined}`)
    }
  })

  // Test: no CI result in process guard => FAIL (exit code 1)
  test('Process Guard: no CI result => FAIL (exit 1)', () => {
    setMockGhData({
      allowedRepo: CANONICAL_REPOSITORY,
      runs: [],
    })
    const res = spawnSync(process.execPath, [guardScript, localDir], {
      encoding: 'utf8',
      env: getFixtureEnv(),
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
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({ EXPECTED_RELEASE_SHA: '' }),
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

  // Test: mismatched EXPECTED_RELEASE_SHA => FAIL (exit code 1)
  test('Process Guard: Mismatched EXPECTED_RELEASE_SHA => FAIL (exit 1)', () => {
    try {
      execSync('git checkout --detach HEAD', { cwd: localDir, stdio: 'pipe' })
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({ EXPECTED_RELEASE_SHA: '0000000000000000000000000000000000000000' }),
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
    setMockGhData(defaultPassingMock)
    const res = spawnSync(process.execPath, [deployScript, '--target-dir', localDir, '--validate-only'], {
      encoding: 'utf8',
      env: getFixtureEnv(),
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
      setMockGhData(defaultPassingMock)
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv({
          SKIP_DIRTY_CHECK: '1',
          ALLOW_NON_MAIN_DEPLOY: '1',
          FORCE: '1',
          DRY_RUN: '1',
        }),
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
      setMockGhData({
        allowedRepo: CANONICAL_REPOSITORY,
        runs: [{ name: 'CI Quality Gates', headSha: newHead, status: 'completed', conclusion: 'success' }],
      })
      const res = spawnSync(process.execPath, [guardScript, localDir], {
        encoding: 'utf8',
        env: getFixtureEnv(),
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
