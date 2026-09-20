import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { beforeEach, afterEach } from 'vitest'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { LOP_THU, MAT_KHAU, TAI_KHOAN_THU } from './fixtures'

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
if (env.ANALYTICS_DB && (env as any).ANALYTICS_TEST_MIGRATIONS) {
  await applyD1Migrations(env.ANALYTICS_DB, (env as any).ANALYTICS_TEST_MIGRATIONS)
}

// Miniflare workerd chưa triển khai RPC receiver cho Ratelimit binding trong môi trường test cục bộ.
// Cung cấp triển khai in-memory tương thích 100% với semantics của Cloudflare RateLimit binding.
function createRateLimitMock(limit: number, periodMs = 60000) {
  const localCounters = new Map<string, { count: number; resetAt: number }>()
  return {
    binding: {
      limit: async ({ key }: { key: string }) => {
        const now = Date.now()
        const entry = localCounters.get(key)
        if (!entry || entry.resetAt <= now) {
          localCounters.set(key, { count: 1, resetAt: now + periodMs })
          return { success: true }
        }
        if (entry.count >= limit) {
          return { success: false }
        }
        entry.count++
        return { success: true }
      },
      _reset: () => localCounters.clear(),
    },
    reset: () => localCounters.clear(),
  }
}

const modLimiterMock = createRateLimitMock(20, 60000)
;(env as any).MODERATION_LIMITER = modLimiterMock.binding

const uploadLimiterMock = createRateLimitMock(10, 60000)
;(env as any).UPLOAD_LIMITER = uploadLimiterMock.binding

const loginLimiterMock = createRateLimitMock(10, 60000)
;(env as any).LOGIN_LIMITER = loginLimiterMock.binding

const admitLimiterMock = createRateLimitMock(10, 60000)
;(env as any).ADMIT_LIMITER = admitLimiterMock.binding

beforeEach(() => {
  modLimiterMock.reset()
  uploadLimiterMock.reset()
  loginLimiterMock.reset()
  admitLimiterMock.reset()
})

afterEach(async () => {
  // Cho phép workerd event loop hoàn tất các handshake đóng WebSocket và DO lifecycle
  await new Promise((r) => setTimeout(r, 60))
})

// Đảm bảo tài khoản system không chiếm dải ID 1..8 của fixtures thử nghiệm
await env.DB.prepare("UPDATE tai_khoan_campus SET id = 99 WHERE ten_dang_nhap = 'system' AND id < 10").run()
try {
  await env.DB.prepare("DELETE FROM sqlite_sequence WHERE name = 'tai_khoan_campus'").run()
} catch {}

// Storage được tách riêng cho từng file test, nên mỗi file cần nạp lại lớp và tài khoản thử.
const daCo = await env.DB.prepare("SELECT COUNT(*) AS n FROM tai_khoan_campus WHERE ten_dang_nhap != 'system'").first<{ n: number }>()
if (!daCo?.n) {
  for (const ten of LOP_THU) {
    await env.DB.prepare('INSERT INTO lop (ten) VALUES (?1)').bind(ten).run()
  }
  for (let i = 0; i < TAI_KHOAN_THU.length; i++) {
    const tk = TAI_KHOAN_THU[i]
    const id = i + 1
    const salt = taoSalt()
    await env.DB.prepare(
      `INSERT INTO tai_khoan_campus
         (id, ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, lop_id, la_admin_truong, dang_hoat_dong)
       VALUES (?1, ?2, ?3, ?4, ?5, 100000, ?6, ?7, ?8, ?9, ?10)
       ON CONFLICT(id) DO UPDATE SET
         ten_dang_nhap = excluded.ten_dang_nhap,
         ten_hien_thi = excluded.ten_hien_thi,
         mat_khau_hash = excluded.mat_khau_hash,
         salt = excluded.salt,
         iterations = excluded.iterations,
         vai_tro = excluded.vai_tro,
         teacher_pending = excluded.teacher_pending,
         lop_id = excluded.lop_id,
         la_admin_truong = excluded.la_admin_truong,
         dang_hoat_dong = excluded.dang_hoat_dong`,
    )
      .bind(
        id,
        tk.username,
        tk.ten,
        await bamMatKhau(MAT_KHAU, salt, 100000),
        salt,
        tk.vaiTro,
        tk.teacherPending ? 1 : 0,
        tk.lopId,
        tk.laAdminTruong ? 1 : 0,
        tk.hoatDong,
      )
      .run()
    for (const lopId of tk.lopPhuTrach ?? []) {
      await env.DB.prepare('INSERT INTO giao_vien_lop (giao_vien_id, lop_id, la_chinh) VALUES (?1, ?2, 1)')
        .bind(id, lopId)
        .run()
    }
  }
}
