#!/usr/bin/env node
// Automated Verification for Release Guard & Deployment Tooling
// Kiểm tra:
// 1. Dirty working tree -> HARD BLOCK (exit code 1)
// 2. EXPECTED_RELEASE_SHA mismatch -> HARD BLOCK (exit code 1)
// 3. Non-main branch without ALLOW_NON_MAIN_DEPLOY -> HARD BLOCK (exit code 1)
// 4. Clean tree + ALLOW_NON_MAIN_DEPLOY=1 -> SUCCESS (exit code 0)
// 5. scripts/deploy-production.mjs --dry-run -> SUCCESS with release:<SHA> metadata command construction

import { execSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const guardScript = path.join(__dirname, 'guard-production-release.mjs')
const deployScript = path.join(__dirname, 'deploy-production.mjs')

console.log('=== VERIFYING RELEASE GUARD & DEPLOY TOOLING ===\n')

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

// Test 1: Dirty Working Tree MUST HARD-FAIL
test('Guard exits non-zero (code 1) on dirty working tree', () => {
  const sentinelFile = path.join(rootDir, 'dirty_tree_test_sentinel.tmp')
  try {
    fs.writeFileSync(sentinelFile, 'dirty tree test payload', 'utf8')
    const res = spawnSync(process.execPath, [guardScript], {
      cwd: rootDir,
      encoding: 'utf8',
      env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '1', SKIP_DIRTY_CHECK: '' },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('dirty working tree')) {
      throw new Error(`Expected output to contain 'dirty working tree', received:\n${combined}`)
    }
  } finally {
    if (fs.existsSync(sentinelFile)) {
      fs.unlinkSync(sentinelFile)
    }
  }
})

// Test 2: EXPECTED_RELEASE_SHA Mismatch MUST HARD-FAIL
test('Guard exits non-zero (code 1) on EXPECTED_RELEASE_SHA mismatch', () => {
  const res = spawnSync(process.execPath, [guardScript], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, EXPECTED_RELEASE_SHA: '0000000000000000000000000000000000000000', ALLOW_NON_MAIN_DEPLOY: '1', SKIP_DIRTY_CHECK: '1' },
  })
  if (res.status !== 1) {
    throw new Error(`Expected status 1, received ${res.status}`)
  }
  const combined = res.stderr + res.stdout
  if (!combined.includes('LỖI SHA BẢO VỆ')) {
    throw new Error(`Expected output to contain 'LỖI SHA BẢO VỆ', received:\n${combined}`)
  }
})

// Test 3: Branch Check MUST HARD-FAIL on feature branches unless overridden
test('Guard exits non-zero (code 1) on non-main branch without override', () => {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()
  if (branch !== 'main' && branch !== 'HEAD') {
    const res = spawnSync(process.execPath, [guardScript], {
      cwd: rootDir,
      encoding: 'utf8',
      env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '', SKIP_DIRTY_CHECK: '1' },
    })
    if (res.status !== 1) {
      throw new Error(`Expected status 1, received ${res.status}`)
    }
    const combined = res.stderr + res.stdout
    if (!combined.includes('LỖI NHÁNH PHÁT HÀNH')) {
      throw new Error(`Expected output to contain 'LỖI NHÁNH PHÁT HÀNH', received:\n${combined}`)
    }
  } else {
    console.log('   (Skipped on main/HEAD branch)')
  }
})

// Test 4: Clean tree passes when branch rule satisfied
test('Guard exits zero (code 0) with allowed branch and clean tree', () => {
  const res = spawnSync(process.execPath, [guardScript], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '1', SKIP_DIRTY_CHECK: '1' },
  })
  if (res.status !== 0) {
    throw new Error(`Expected status 0, received ${res.status}:\n${res.stderr + res.stdout}`)
  }
})

// Test 5: Deploy Production Wrapper dry-run command construction
test('Deploy wrapper constructs --message "release:<SHA>" in --dry-run mode', () => {
  const headSha = execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()
  const res = spawnSync(process.execPath, [deployScript, '--dry-run'], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, ALLOW_NON_MAIN_DEPLOY: '1', SKIP_DIRTY_CHECK: '1' },
  })
  if (res.status !== 0) {
    throw new Error(`Expected status 0 for deploy wrapper dry-run, received ${res.status}:\n${res.stderr + res.stdout}`)
  }
  const combined = res.stderr + res.stdout
  if (!combined.includes(`release:${headSha}`)) {
    throw new Error(`Expected output to contain 'release:${headSha}', received:\n${combined}`)
  }
  if (!combined.includes('--dry-run')) {
    throw new Error(`Expected output to contain '--dry-run', received:\n${combined}`)
  }
})

console.log(`\nResults: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  process.exit(1)
}
process.exit(0)
