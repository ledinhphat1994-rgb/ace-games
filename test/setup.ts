import { applyD1Migrations } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { bamMatKhau, taoSalt } from '../worker/lib/passwords'
import { LOP_THU, MAT_KHAU, TAI_KHOAN_THU } from './fixtures'

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)

// Storage được tách riêng cho từng file test, nên mỗi file cần nạp lại lớp và tài khoản thử.
const daCo = await env.DB.prepare('SELECT COUNT(*) AS n FROM tai_khoan_campus').first<{ n: number }>()
if (!daCo?.n) {
  for (const ten of LOP_THU) {
    await env.DB.prepare('INSERT INTO lop (ten) VALUES (?1)').bind(ten).run()
  }
  for (const tk of TAI_KHOAN_THU) {
    const salt = taoSalt()
    const kq = await env.DB.prepare(
      `INSERT INTO tai_khoan_campus
         (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, teacher_pending, lop_id, la_admin_truong, dang_hoat_dong)
       VALUES (?1, ?2, ?3, ?4, 100000, ?5, ?6, ?7, ?8, ?9)`,
    )
      .bind(
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
        .bind(kq.meta.last_row_id, lopId)
        .run()
    }
  }
}
