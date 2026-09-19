#!/usr/bin/env node
// Production Release Guard Script
// Kiểm tra nghiêm ngặt cấu hình trước khi chạy npm run deploy:production
// Đảm bảo không sử dụng staging analytics DB, migrations đã tách riêng, và DB analytics đã được cấp phép.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const STAGING_ANALYTICS_DB_ID = 'c5c3eaec-c6b2-4b09-9d1b-bc18a2288a54'
const STAGING_ANALYTICS_DB_NAME = 'lop-10a7-analytics-staging'
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

// 3. Đọc và phân tích wrangler.production.jsonc
const prodConfigPath = path.join(rootDir, 'wrangler.production.jsonc')
if (!fs.existsSync(prodConfigPath)) {
  console.error(`❌ [RELEASE GUARD] LỖI: Không tìm thấy ${prodConfigPath}!`)
  process.exit(1)
}

const prodConfigContent = fs.readFileSync(prodConfigPath, 'utf8')

// Chống nhiễm chéo Staging ID hoặc Staging Name trong Production config
if (prodConfigContent.includes(STAGING_ANALYTICS_DB_ID) || prodConfigContent.includes(STAGING_ANALYTICS_DB_NAME)) {
  console.error(`❌ [RELEASE GUARD] LỖI BẢO VỆ NHIỄM CHÉO MÔI TRƯỜNG (CROSS-ENV CONTAMINATION):`)
  console.error(`   wrangler.production.jsonc phát hiện ID hoặc Name của Staging Analytics DB:`)
  console.error(`   - Staging DB ID: ${STAGING_ANALYTICS_DB_ID}`)
  console.error(`   - Staging DB Name: ${STAGING_ANALYTICS_DB_NAME}`)
  console.error(`   Tuyệt đối không được gán tài nguyên Staging vào Production Worker!`)
  process.exit(1)
}

// Kiểm tra cấu hình D1 trong wrangler.production.jsonc
// Loại bỏ comments JSONC cơ bản để parse an toàn
const cleanJson = prodConfigContent.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
let parsedConfig
try {
  parsedConfig = JSON.parse(cleanJson)
} catch (err) {
  console.error(`❌ [RELEASE GUARD] LỖI: Không thể parse wrangler.production.jsonc:`, err.message)
  process.exit(1)
}

const d1Databases = parsedConfig.d1_databases || []
const coreDb = d1Databases.find((db) => db.binding === 'DB')
const analyticsDb = d1Databases.find((db) => db.binding === 'ANALYTICS_DB')

if (!coreDb) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'DB' cho core database!`)
  process.exit(1)
}

if (!analyticsDb) {
  console.error(`❌ [RELEASE GUARD] LỖI: wrangler.production.jsonc thiếu binding 'ANALYTICS_DB'!`)
  process.exit(1)
}

if (analyticsDb.migrations_dir !== 'analytics-migrations') {
  console.error(`❌ [RELEASE GUARD] LỖI: ANALYTICS_DB trong wrangler.production.jsonc phải có migrations_dir = "analytics-migrations", nhận được: "${analyticsDb.migrations_dir}"`)
  process.exit(1)
}

if (analyticsDb.database_id === PLACEHOLDER_ID || !analyticsDb.database_id || analyticsDb.database_id.includes('UNPROVISIONED')) {
  console.error(`🛑 [RELEASE GUARD] CHẶN PHÁT HÀNH: D1 ANALYTICS PRODUCTION CHƯA ĐƯỢC CẤP PHÁT (UNPROVISIONED):`)
  console.error(`   Binding ANALYTICS_DB hiện đang để placeholder: "${analyticsDb.database_id}"`)
  console.error(`   Khi người quản trị cấp phép phát hành Production, thực hiện các bước:`)
  console.error(`   1. Chạy: npx wrangler d1 create lop-10a7-analytics --location apac`)
  console.error(`   2. Ghi UUID trả về vào trường database_id của ANALYTICS_DB trong wrangler.production.jsonc`)
  console.error(`   3. Áp dụng migration: npx wrangler d1 migrations apply ANALYTICS_DB --config wrangler.production.jsonc --remote`)
  console.error(`   4. Chạy lại: npm run deploy:production`)
  process.exit(1)
}

console.log('✅ [RELEASE GUARD] Tất cả kiểm tra an toàn cấu hình và phân tách cơ sở dữ liệu đã đạt chuẩn 100%!')
process.exit(0)
