import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { MAT_KHAU, TAI_KHOAN_THU } from './fixtures'

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)

// Storage được tách riêng cho từng file test, nên mỗi file cần nạp lại tài khoản thử.
const daCo = await env.DB.prepare('SELECT COUNT(*) AS n FROM tai_khoan_campus').first<{ n: number }>()
if (!daCo?.n) {
  for (const tk of TAI_KHOAN_THU) {
    const salt = taoSalt()
    await env.DB.prepare(
      `INSERT INTO tai_khoan_campus (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, dang_hoat_dong)
       VALUES (?1, ?2, ?3, ?4, 100000, 'student', ?5)`,
    )
      .bind(tk.username, tk.ten, await bamMatKhau(MAT_KHAU, salt, 100000), salt, tk.hoatDong)
      .run()
  }
}
