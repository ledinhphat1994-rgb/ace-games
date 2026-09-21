#!/usr/bin/env node
// Production Release Guard Script
// Kiểm tra nghiêm ngặt cấu hình trước khi chạy npm run deploy:production
// Đảm bảo không sử dụng staging resources, migrations đã tách riêng, DB analytics đã được cấp phép,
// Worker name/env chính xác, và nợ kiến trúc R2 được theo dõi có kiểm soát.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const EXPECTED_PROD_WORKER_NAME = 'gdtxdinhquan'
const EXPECTED_PROD_ENVIRONMENT = 'production'
const PLACEHOLDER_ID = 'UNPROVISIONED_PRODUCTION_ANALYTICS_DB_ID'

console.log('=== DIGITAL CAMPUS V2: PRODUCTION RELEASE GUARD ===')

// 1. Kiểm tra migrations/ không chứa bất kỳ file analytics nào
const coreMigrationsDir = path.join(rootDir, 'migrations')
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

// 2. Kiểm tra analytics-migrations/ tồn tại và có migration
const analyticsMigrationsDir = path.join(rootDir, 'analytics-migrations')
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

// 3. Đọc và phân tích wrangler.production.jsonc & wrangler.staging.jsonc
const prodConfigPath = path.join(rootDir, 'wrangler.production.jsonc')
const stagingConfigPath = path.join(rootDir, 'wrangler.staging.jsonc')

const prodConfig = parseJsonc(prodConfigPath)
const stagingConfig = parseJsonc(stagingConfigPath)

// 4. Kiểm tra định danh Worker & Biến môi trường
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

// 5. Kiểm tra phân tách cơ sở dữ liệu D1
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

// 6. Kiểm tra phân tách KV Namespace
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

// 7. Kiểm tra R2 Bucket & Theo dõi nợ kiến trúc (Architectural Debt Tracker)
const prodR2 = (prodConfig.r2_buckets || []).find((r2) => r2.binding === 'ANH')
const stagingR2 = (stagingConfig.r2_buckets || []).find((r2) => r2.binding === 'ANH')

if (!prodR2) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'ANH' cho R2 bucket!`)
  process.exit(1)
}

if (stagingR2 && prodR2.bucket_name === stagingR2.bucket_name) {
  console.log(`ℹ️  [RELEASE GUARD] GHI NHẬN NỢ KIẾN TRÚC ĐANG THEO DÕI:`)
  console.log(`    R2 binding 'ANH' đang dùng chung bucket '${prodR2.bucket_name}' giữa staging và production.`)
  console.log(`    (Kế hoạch phân tách sang 'lop-10a7-anh-staging' đang trong quy trình backlog).`)
}

// 8. Đọc Git SHA của mã nguồn đang chuẩn bị release (Traceability)
try {
  const headSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const isDirty = execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0
  console.log(`📦 [RELEASE GUARD] Git Source Revision: ${headSha}${isDirty ? ' (DIRTY TREE WARNING)' : ' (CLEAN)'}`)
} catch {
  console.log(`⚠️  [RELEASE GUARD] Không thể đọc Git SHA từ môi trường hiện tại.`)
}

console.log('✅ [RELEASE GUARD] Tất cả kiểm tra an toàn cấu hình và phân tách cơ sở dữ liệu đã đạt chuẩn 100%!')
process.exit(0)
