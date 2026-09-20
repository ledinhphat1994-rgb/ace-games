import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const DB_NAME = 'lop-10a7-db-staging'
const TARGET_TOTAL = 520

console.log('Seeding staging room history for directory scale benchmark...')

// Check current count
const countOut = execSync(`npx wrangler d1 execute ${DB_NAME} --remote --command="SELECT COUNT(*) as cnt FROM phong;"`, { encoding: 'utf-8' })
const jsonMatch = countOut.match(/\[\s*\{\s*"results":\s*\[\s*\{\s*"cnt":\s*(\d+)/)
const currentCnt = jsonMatch ? parseInt(jsonMatch[1], 10) : 0
console.log(`Current room count in ${DB_NAME}: ${currentCnt}`)

const needed = Math.max(0, TARGET_TOTAL - currentCnt)
if (needed === 0) {
  console.log(`Already have >= ${TARGET_TOTAL} rooms. No seeding needed.`)
  process.exit(0)
}

console.log(`Generating SQL for ${needed} closed historical rooms...`)

const sqlStatements = []
const now = Date.now()
for (let i = 1; i <= needed; i++) {
  const roomNum = currentCnt + i
  const createdAt = now - (needed - i) * 60000
  const closedAt = createdAt + 300000
  const ten = `Lịch sử phòng học chuyên đề #${roomNum}`
  const reason = (i % 3 === 0) ? 'owner_closed' : (i % 3 === 1) ? 'admin_closed' : 'empty_timeout'

  sqlStatements.push(
    `INSERT INTO phong (loai, ten, mo_ta, pham_vi, chu_phong_khoa, chu_phong_ten, trang_thai, tao_luc, cap_nhat_luc, access_mode, suc_chua, created_at, last_activity_at, ever_joined, closed_at, closed_by, close_reason, lifecycle_revision) ` +
    `VALUES ('video', '${ten}', 'Phòng lịch sử phục vụ test quy mô', 'truong', 'acc:2', 'QA Thử nghiệm 1', 'dong', datetime('now'), datetime('now'), 'public', 20, ${createdAt}, ${closedAt}, 1, ${closedAt}, 6, '${reason}', 1);`
  )
}

const tmpSqlPath = path.resolve('./scripts/scratch_seed_500_rooms.sql')
fs.writeFileSync(tmpSqlPath, sqlStatements.join('\n'), 'utf-8')

console.log(`Executing batch insert via wrangler d1 execute --file...`)
execSync(`npx wrangler d1 execute ${DB_NAME} --remote --file="${tmpSqlPath}"`, { stdio: 'inherit' })

fs.unlinkSync(tmpSqlPath)
console.log('✅ Seed completed successfully!')
