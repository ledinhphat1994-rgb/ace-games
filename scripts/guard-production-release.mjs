#!/usr/bin/env node
// Production Release Guard Script
// Kiểm tra nghiêm ngặt cấu hình trước khi chạy npm run deploy:production
// Đảm bảo không sử dụng staging resources, migrations đã tách riêng, DB analytics đã được cấp phép,
// Worker name/env chính xác, working tree sạch 100%, và nợ kiến trúc R2 được theo dõi có kiểm soát.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Cho phép chỉ định thư mục target để phục vụ testing cô lập (deterministic test harness)
const targetDir = process.argv[2] && !process.argv[2].startsWith('-')
  ? path.resolve(process.argv[2])
  : rootDir

const isDryRunOrValidate = process.argv.includes('--dry-run') ||
  process.argv.includes('--validate-only') ||
  process.env.DRY_RUN === '1'

const EXPECTED_PROD_WORKER_NAME = 'gdtxdinhquan'
const EXPECTED_PROD_ENVIRONMENT = 'production'
const PLACEHOLDER_ID = 'UNPROVISIONED_PRODUCTION_ANALYTICS_DB_ID'

console.log('=== DIGITAL CAMPUS V2: PRODUCTION RELEASE GUARD ===')

// 1. Kiểm tra trạng thái Git & Khóa nguồn (Source Lock & Clean Tree)
let headSha = ''
let currentBranch = ''
try {
  headSha = execSync('git rev-parse HEAD', { cwd: targetDir, encoding: 'utf8' }).trim()
  currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: targetDir, encoding: 'utf8' }).trim()
} catch (gitErr) {
  console.error('❌ [RELEASE GUARD] LỖI GIT: Không thể đọc thông tin Git repository:', gitErr.message)
  process.exit(1)
}

if (!/^[a-f0-9]{40}$/i.test(headSha)) {
  console.error(`❌ [RELEASE GUARD] LỖI GIT SHA: Giá trị Git HEAD không hợp lệ: "${headSha}"`)
  process.exit(1)
}

// Kiểm tra Dirty Working Tree — HARD FAIL TUYỆT ĐỐI (Không có biến môi trường bypass)
let dirtyFiles = ''
try {
  dirtyFiles = execSync('git status --porcelain', { cwd: targetDir, encoding: 'utf8' }).trim()
} catch (statusErr) {
  console.error('❌ [RELEASE GUARD] LỖI GIT: Không thể kiểm tra git status:', statusErr.message)
  process.exit(1)
}

if (dirtyFiles.length > 0) {
  console.error('❌ [RELEASE GUARD] LỖI BẢO VỆ MÃ NGUỒN: Working tree đang có thay đổi chưa commit (dirty working tree)!')
  console.error('   Production release bắt buộc working tree phải hoàn toàn sạch (clean 100%).')
  console.error('   Danh sách thay đổi chưa commit:')
  console.error(dirtyFiles)
  process.exit(1)
}

// Kiểm tra Khóa Nguồn Phát Hành (Authoritative Source Lock)
if (currentBranch === 'main' || currentBranch === 'HEAD') {
  // Yêu cầu hợp đồng nguồn trong môi trường detached HEAD (CI / Automation Pipeline)
  if (currentBranch === 'HEAD' && !process.env.EXPECTED_RELEASE_SHA) {
    console.error('❌ [RELEASE GUARD] LỖI SOURCE CONTRACT (DETACHED HEAD):')
    console.error('   Đang ở trạng thái detached HEAD nhưng thiếu biến môi trường EXPECTED_RELEASE_SHA!')
    console.error('   Trong CI hoặc môi trường detached HEAD, bắt buộc phải cung cấp EXPECTED_RELEASE_SHA được phê duyệt.')
    console.error('   Production release fail-closed: Từ chối phát hành từ commit không được chứng minh.')
    process.exit(1)
  }

  // Luôn luôn fetch và xác thực trực tiếp với remote origin/main mới nhất (cho cả main và detached HEAD)
  console.log('🔍 [RELEASE GUARD] Đang xác thực đồng bộ với remote origin/main mới nhất (git fetch origin main)...')
  let originMainSha = ''
  try {
    execSync('git fetch origin main', { cwd: targetDir, stdio: 'pipe', encoding: 'utf8', timeout: 30000 })
    originMainSha = execSync('git rev-parse origin/main', { cwd: targetDir, encoding: 'utf8' }).trim()
  } catch (fetchErr) {
    console.error('❌ [RELEASE GUARD] LỖI SOURCE LOCK: Không thể xác định trạng thái từ remote origin/main:', fetchErr.message)
    console.error('   Production release fail-closed: Bắt buộc phải kết nối và đồng bộ được với origin/main trước khi deploy.')
    process.exit(1)
  }

  if (!/^[a-f0-9]{40}$/i.test(originMainSha)) {
    console.error(`❌ [RELEASE GUARD] LỖI SOURCE LOCK: SHA của origin/main không hợp lệ: "${originMainSha}"`)
    process.exit(1)
  }

  // Khóa nguồn 1: HEAD phải khớp 100% với origin/main mới nhất
  if (headSha !== originMainSha) {
    console.error('❌ [RELEASE GUARD] LỖI SOURCE LOCK: HEAD không khớp với origin/main mới nhất (phát hiện stale commit / main đã tiến bước)!')
    console.error(`   Local HEAD:   ${headSha}`)
    console.error(`   origin/main:  ${originMainSha}`)
    console.error('   Production release fail-closed: Nhánh main trên remote đã có commit mới sau thời điểm checkout hoặc local main chưa pull.')
    console.error('   Hủy bỏ phát hành để chống triển khai commit lỗi thời.')
    process.exit(1)
  }

  // Khóa nguồn 2: Nếu có EXPECTED_RELEASE_SHA thì HEAD cũng phải khớp
  if (process.env.EXPECTED_RELEASE_SHA && process.env.EXPECTED_RELEASE_SHA !== headSha) {
    console.error('❌ [RELEASE GUARD] LỖI SHA BẢO VỆ (EXPECTED_RELEASE_SHA):')
    console.error(`   SHA mong đợi: ${process.env.EXPECTED_RELEASE_SHA}`)
    console.error(`   SHA hiện tại: ${headSha}`)
    process.exit(1)
  }

  console.log(`🔒 [RELEASE GUARD] Khóa nguồn thành công: HEAD (${headSha}) == origin/main (${originMainSha})`)
} else {
  // Nhánh feature (không phải main, không phải detached HEAD)
  // Trong real production deploy: tuyệt đối cấm mọi bypass
  if (!isDryRunOrValidate || !process.env.ALLOW_NON_MAIN_DEPLOY) {
    console.error(`❌ [RELEASE GUARD] LỖI NHÁNH PHÁT HÀNH:`)
    console.error(`   Production chỉ được phép phát hành từ nhánh 'main' hoặc detached HEAD với EXPECTED_RELEASE_SHA.`)
    console.error(`   Nhánh hiện tại: '${currentBranch}'.`)
    console.error('   Tuyệt đối cấm phát hành production từ feature branch.')
    process.exit(1)
  }
  console.log(`⚠️  [RELEASE GUARD] Chạy trên nhánh '${currentBranch}' với cờ non-mutating test (dry-run). Real deploy bị cấm 100%.`)
}

console.log(`📦 [RELEASE GUARD] Git Source Revision: ${headSha} (Branch: ${currentBranch}, Tree: CLEAN)`)

// 2. Kiểm tra migrations/ không chứa bất kỳ file analytics nào
const coreMigrationsDir = path.join(targetDir, 'migrations')
if (fs.existsSync(coreMigrationsDir)) {
  const files = fs.readdirSync(coreMigrationsDir)
  const analyticsFile = files.find((f) => f.toLowerCase().includes('analytics'))
  if (analyticsFile) {
    console.error(`❌ [RELEASE GUARD] LỖI VI PHẠM RANH GIỚI MIGRATION:`)
    console.error(`   Thư mục core migrations/ không được chứa migration của analytics: ${analyticsFile}`)
    console.error(`   Migration của analytics phải nằm trong thư mục analytics-migrations/.`)
    process.exit(1)
  }
}

// 3. Kiểm tra analytics-migrations/ tồn tại và có migration
const analyticsMigrationsDir = path.join(targetDir, 'analytics-migrations')
if (!fs.existsSync(analyticsMigrationsDir)) {
  console.error(`❌ [RELEASE GUARD] LỖI: Thư mục analytics-migrations/ không tồn tại!`)
  process.exit(1)
}
const analyticsFiles = fs.readdirSync(analyticsMigrationsDir)
if (analyticsFiles.length === 0) {
  console.error(`❌ [RELEASE GUARD] LỖI: Thư mục analytics-migrations/ không chứa file migration nào!`)
  process.exit(1)
}

// Helper: parse JSONC
function parseJsonc(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [RELEASE GUARD] LỖI: Không tìm thấy ${filePath}!`)
    process.exit(1)
  }
  const raw = fs.readFileSync(filePath, 'utf8')
  const clean = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  try {
    return JSON.parse(clean)
  } catch (err) {
    console.error(`❌ [RELEASE GUARD] LỖI: Không thể parse JSONC ${filePath}:`, err.message)
    process.exit(1)
  }
}

// 4. Đọc và phân tích wrangler.production.jsonc & wrangler.staging.jsonc
const prodConfigPath = path.join(targetDir, 'wrangler.production.jsonc')
const stagingConfigPath = path.join(targetDir, 'wrangler.staging.jsonc')

const prodConfig = parseJsonc(prodConfigPath)
const stagingConfig = parseJsonc(stagingConfigPath)

// 5. Kiểm tra định danh Worker & Biến môi trường
if (prodConfig.name !== EXPECTED_PROD_WORKER_NAME) {
  console.error(`❌ [RELEASE GUARD] LỖI TÊN WORKER:`)
  console.error(`   wrangler.production.jsonc có 'name' = '${prodConfig.name}', mong đợi: '${EXPECTED_PROD_WORKER_NAME}'!`)
  process.exit(1)
}

if (prodConfig.vars?.ENVIRONMENT !== EXPECTED_PROD_ENVIRONMENT) {
  console.error(`❌ [RELEASE GUARD] LỖI BIẾN MÔI TRƯỜNG:`)
  console.error(`   vars.ENVIRONMENT phải là '${EXPECTED_PROD_ENVIRONMENT}', nhận được: '${prodConfig.vars?.ENVIRONMENT}'!`)
  process.exit(1)
}

// 6. Kiểm tra phân tách cơ sở dữ liệu D1
const prodD1 = prodConfig.d1_databases || []
const stagingD1 = stagingConfig.d1_databases || []

const prodCoreDb = prodD1.find((db) => db.binding === 'DB')
const prodAnalyticsDb = prodD1.find((db) => db.binding === 'ANALYTICS_DB')

const stagingCoreDb = stagingD1.find((db) => db.binding === 'DB')
const stagingAnalyticsDb = stagingD1.find((db) => db.binding === 'ANALYTICS_DB')

if (!prodCoreDb) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'DB' cho core database!`)
  process.exit(1)
}

if (!prodAnalyticsDb) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'ANALYTICS_DB'!`)
  process.exit(1)
}

if (prodAnalyticsDb.migrations_dir !== 'analytics-migrations') {
  console.error(`❌ [RELEASE GUARD] LỖI: ANALYTICS_DB trong wrangler.production.jsonc phải có migrations_dir = "analytics-migrations", nhận được: "${prodAnalyticsDb.migrations_dir}"`)
  process.exit(1)
}

if (prodAnalyticsDb.database_id === PLACEHOLDER_ID || !prodAnalyticsDb.database_id || prodAnalyticsDb.database_id.includes('UNPROVISIONED')) {
  console.error(`🛑 [RELEASE GUARD] CHẶN PHÁT HÀNH: D1 ANALYTICS PRODUCTION CHƯA ĐƯỢC CẤP PHÁT:`)
  console.error(`   Binding ANALYTICS_DB hiện đang để placeholder: "${prodAnalyticsDb.database_id}"`)
  process.exit(1)
}

// Chống nhiễm chéo D1 giữa Staging và Production
if (stagingCoreDb && prodCoreDb.database_id === stagingCoreDb.database_id) {
  console.error(`❌ [RELEASE GUARD] LỖI BẢO VỆ NHIỄM CHÉO: Production DB ID trùng với Staging DB ID (${prodCoreDb.database_id})!`)
  process.exit(1)
}

if (stagingAnalyticsDb && prodAnalyticsDb.database_id === stagingAnalyticsDb.database_id) {
  console.error(`❌ [RELEASE GUARD] LỖI BẢO VỆ NHIỄM CHÉO: Production ANALYTICS_DB trùng với Staging ANALYTICS_DB (${prodAnalyticsDb.database_id})!`)
  process.exit(1)
}

// 7. Kiểm tra phân tách KV Namespace
const prodKv = (prodConfig.kv_namespaces || []).find((kv) => kv.binding === 'RATE_LIMIT')
const stagingKv = (stagingConfig.kv_namespaces || []).find((kv) => kv.binding === 'RATE_LIMIT')

if (!prodKv) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'RATE_LIMIT' cho KV namespace!`)
  process.exit(1)
}

if (stagingKv && prodKv.id === stagingKv.id) {
  console.error(`❌ [RELEASE GUARD] LỖI BẢO VỆ NHIỄM CHÉO: Production KV RATE_LIMIT ID trùng với Staging KV ID (${prodKv.id})!`)
  process.exit(1)
}

// 8. Kiểm tra R2 Bucket & Phân lập lưu trữ (Storage Isolation Invariant)
const prodR2 = (prodConfig.r2_buckets || []).find((r2) => r2.binding === 'ANH')
const stagingR2 = (stagingConfig.r2_buckets || []).find((r2) => r2.binding === 'ANH')

if (!prodR2) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'ANH' cho R2 bucket!`)
  process.exit(1)
}

if (!stagingR2) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.staging.jsonc thiếu binding 'ANH' cho R2 bucket!`)
  process.exit(1)
}

if (prodR2.bucket_name === stagingR2.bucket_name) {
  console.error(`❌ [RELEASE GUARD] LỖI BẢO VỆ NHIỄM CHÉO R2: Production R2 ANH bucket trùng với Staging R2 bucket ('${prodR2.bucket_name}')!`)
  console.error(`    Yêu cầu phân lập R2 bắt buộc: Production '${prodR2.bucket_name}' vs Staging '${stagingR2.bucket_name}'.`)
  process.exit(1)
}

console.log('✅ [RELEASE GUARD] Tất cả kiểm tra an toàn cấu hình và phân tách cơ sở dữ liệu đã đạt chuẩn 100%!')
process.exit(0)
