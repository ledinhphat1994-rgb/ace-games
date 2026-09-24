#!/usr/bin/env node
// scripts/ci-gate-verifier.mjs
// Authoritative CI Quality Gates Verification Module
// Đảm bảo:
// 1. Chỉ chấp nhận commit có CI Quality Gates chạy hoàn tất (status: completed).
// 2. Kết quả CI phải thành công tuyệt đối (conclusion: success).
// 3. Exact SHA match 100% — không chấp nhận commit khác, không chấp nhận branch khác.
// 4. Ràng buộc tuyệt đối vào canonical repository: ledinhphat1994-rgb/lop-10a7.
//    Cấm tuyệt đối mọi cờ mock runtime (như MOCK_CI_RUNS) và cấm redirect sang fork.
// 5. Fail-closed: Bất kỳ sự cố kết nối, thiếu quyền hoặc không tìm thấy kết quả đều chặn release.

import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const CANONICAL_REPOSITORY = 'ledinhphat1994-rgb/lop-10a7'

/**
 * Pure evaluation function for CI runs against an expected SHA.
 * @param {Array<any>} runs - List of workflow run objects
 * @param {string} expectedSha - Exact 40-character git commit SHA
 * @returns {{ ok: boolean, reason?: string, matchedRun?: any }}
 */
export function evaluateCiRuns(runs, expectedSha) {
  if (!expectedSha || !/^[a-f0-9]{40}$/i.test(expectedSha)) {
    return {
      ok: false,
      reason: `Expected SHA không hợp lệ: "${expectedSha}"`,
    }
  }

  if (!Array.isArray(runs) || runs.length === 0) {
    return {
      ok: false,
      reason: `Không tìm thấy bất kỳ lượt chạy CI Quality Gates nào cho commit ${expectedSha}.`,
    }
  }

  const normalizedExpectedSha = expectedSha.toLowerCase()

  // Tìm các run khớp với tên "CI Quality Gates"
  const ciRuns = runs.filter((r) => {
    const name = (r.name || '').trim().toLowerCase()
    return name === 'ci quality gates' || name === 'ci-quality-gates'
  })

  if (ciRuns.length === 0) {
    return {
      ok: false,
      reason: `Không tìm thấy workflow run nào có tên 'CI Quality Gates' trong kết quả trả về.`,
    }
  }

  // Lọc theo exact SHA
  const matchingShaRuns = ciRuns.filter((r) => {
    const runSha = (r.headSha || r.head_sha || '').trim().toLowerCase()
    return runSha === normalizedExpectedSha
  })

  if (matchingShaRuns.length === 0) {
    const otherShas = ciRuns
      .map((r) => (r.headSha || r.head_sha || '').slice(0, 8))
      .filter(Boolean)
      .join(', ')
    return {
      ok: false,
      reason: `Không có CI Quality Gates run nào cho exact SHA ${expectedSha} (phát hiện runs cho commit khác: ${otherShas || 'không rõ'}).`,
    }
  }

  // Sắp xếp các run khớp theo thời gian tạo hoặc ID giảm dần (mới nhất lên đầu)
  matchingShaRuns.sort((a, b) => {
    const dateA = a.createdAt || a.created_at ? new Date(a.createdAt || a.created_at).getTime() : 0
    const dateB = b.createdAt || b.created_at ? new Date(b.createdAt || b.created_at).getTime() : 0
    if (dateA && dateB) return dateB - dateA
    const idA = Number(a.id || 0)
    const idB = Number(b.id || 0)
    return idB - idA
  })

  // Lấy run mới nhất khớp với SHA
  const targetRun = matchingShaRuns[0]
  const status = (targetRun.status || '').toLowerCase()
  const conclusion = (targetRun.conclusion || '').toLowerCase()

  if (status !== 'completed') {
    return {
      ok: false,
      reason: `CI Quality Gates cho commit ${expectedSha} đang ở trạng thái '${targetRun.status}' (chưa hoàn tất).`,
      matchedRun: targetRun,
    }
  }

  if (conclusion !== 'success') {
    return {
      ok: false,
      reason: `CI Quality Gates cho commit ${expectedSha} hoàn tất với kết quả '${targetRun.conclusion}' (bắt buộc phải là 'success').`,
      matchedRun: targetRun,
    }
  }

  return {
    ok: true,
    matchedRun: targetRun,
  }
}

/**
 * Truy vấn danh sách CI runs từ GitHub cho một commit cụ thể.
 * Hỗ trợ gh CLI hoặc GITHUB_TOKEN REST API.
 * Luôn luôn truy vấn từ CANONICAL_REPOSITORY ('ledinhphat1994-rgb/lop-10a7').
 * Fail-closed nếu không thể truy vấn hoặc phát hiện redirection sang repository khác.
 * @param {string} targetSha
 * @param {string} cwd
 * @returns {Array<any>}
 */
export function queryGitHubCiRuns(targetSha, cwd = process.cwd()) {
  // Bắt buộc ràng buộc repository phát hành chính thức:
  // Nếu có biến môi trường GITHUB_REPOSITORY (từ GitHub Actions runner hoặc caller),
  // nó BẮT BUỘC phải khớp với CANONICAL_REPOSITORY. Chặn đứng hoàn toàn nguy cơ fork redirect.
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== CANONICAL_REPOSITORY) {
    throw new Error(
      `[CI-VERIFY] LỖI BẢO MẬT: GITHUB_REPOSITORY ('${process.env.GITHUB_REPOSITORY}') không khớp với repository phát hành chính thức ('${CANONICAL_REPOSITORY}'). Chặn phát hành.`
    )
  }

  const repo = CANONICAL_REPOSITORY

  // 1. Thử dùng gh CLI
  try {
    const stdout = execSync(
      `gh run list --repo ${repo} --commit ${targetSha} --json name,status,conclusion,headSha,createdAt`,
      {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 20000,
      }
    ).trim()

    if (stdout) {
      const parsed = JSON.parse(stdout)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (_ghErr) {
    // gh CLI không khả dụng hoặc chưa login -> thử fallback qua GitHub REST API
  }

  // 2. Thử dùng GITHUB_TOKEN / GH_TOKEN qua GitHub REST API
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (token) {
    try {
      const apiUrl = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${targetSha}`
      // Sử dụng native fetch qua inline Node.js script
      const fetchCmd = `node -e "fetch('${apiUrl}', { headers: { Authorization: 'Bearer ' + process.env.CI_TOKEN, 'User-Agent': 'release-guard' } }).then(r=>r.json()).then(d=>console.log(JSON.stringify(d.workflow_runs || [])))"`

      const stdout = execSync(fetchCmd, {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CI_TOKEN: token },
        timeout: 20000,
      }).trim()

      if (stdout) {
        const parsed = JSON.parse(stdout)
        if (Array.isArray(parsed)) {
          return parsed.map((r) => ({
            name: r.name,
            status: r.status,
            conclusion: r.conclusion,
            headSha: r.head_sha,
            createdAt: r.created_at,
          }))
        }
      }
    } catch (_apiErr) {
      // API fail-closed
    }
  }

  // 3. Fail-closed
  throw new Error(
    `[CI-VERIFY] Không thể truy vấn trạng thái CI Quality Gates từ GitHub cho commit ${targetSha} tại ${repo}. ` +
    `Yêu cầu GitHub CLI (gh) đã đăng nhập hoặc GITHUB_TOKEN hợp lệ. Production release bị chặn an toàn.`
  )
}

// Hỗ trợ thực thi trực tiếp từ CLI: node scripts/ci-gate-verifier.mjs [TARGET_SHA]
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let targetSha = process.argv[2]
  if (!targetSha) {
    try {
      targetSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch (_err) {
      console.error('❌ [CI-GATE] Không thể xác định Git HEAD.')
      process.exit(1)
    }
  }

  console.log(`🔍 [CI-GATE] Đang kiểm tra CI Quality Gates cho commit: ${targetSha}`)
  console.log(`🔒 [CI-GATE] Canonical Repository: ${CANONICAL_REPOSITORY}`)
  try {
    const runs = queryGitHubCiRuns(targetSha)
    const evaluation = evaluateCiRuns(runs, targetSha)
    if (!evaluation.ok) {
      console.error(`❌ [CI-GATE] FAILED: ${evaluation.reason}`)
      process.exit(1)
    }
    console.log(`✅ [CI-GATE] SUCCESS: Exact-SHA CI Quality Gates verified for ${targetSha}`)
    console.log(`   Run: name="${evaluation.matchedRun.name}", status="${evaluation.matchedRun.status}", conclusion="${evaluation.matchedRun.conclusion}"`)
    process.exit(0)
  } catch (err) {
    console.error(`❌ [CI-GATE] ERROR: ${err.message}`)
    process.exit(1)
  }
}
