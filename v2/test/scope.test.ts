import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { laGiaoVienDaDuyet, laQuanTriTruong, layPhamViQuanTri, xacDinhLopIdApDung } from '../worker/lib/scope'
import type { TaiKhoan } from '../worker/lib/session'

type DongTaiKhoan = Omit<TaiKhoan, 'teacherPending' | 'laAdminTruong'> & { teacherPending: number; laAdminTruong: number }

async function taiKhoan(username: string): Promise<TaiKhoan> {
  const r = await env.DB.prepare(
    `SELECT id, ten_dang_nhap AS username, ten_hien_thi AS ten, vai_tro AS role, teacher_pending AS teacherPending,
            hoc_sinh_id AS hocSinhId, lop_id AS lopId, avatar, tieu_de_ho_so AS tieuDeHoSo,
            la_admin_truong AS laAdminTruong
       FROM tai_khoan_campus WHERE ten_dang_nhap = ?1`,
  )
    .bind(username)
    .first<DongTaiKhoan>()
  if (!r) throw new Error(`Thiếu tài khoản thử ${username}`)
  return { ...r, teacherPending: r.teacherPending === 1, laAdminTruong: r.laAdminTruong === 1 }
}

describe('phạm vi quản trị (port functions/_lib/quan-tri.js)', () => {
  it('phân biệt học sinh, giáo viên chờ duyệt, giáo viên đã duyệt và quản trị trường', async () => {
    const hs = await taiKhoan('qa.v2.thu1')
    const gv = await taiKhoan('qa.v2.gv')
    const admin = await taiKhoan('qa.v2.admin')

    expect([laGiaoVienDaDuyet(hs), laGiaoVienDaDuyet(gv), laGiaoVienDaDuyet(admin)]).toEqual([false, true, true])
    expect(laGiaoVienDaDuyet({ ...gv, teacherPending: true })).toBe(false)
    expect([laQuanTriTruong(gv), laQuanTriTruong(admin)]).toEqual([false, true])
    expect(laQuanTriTruong({ ...hs, role: 'school_admin' })).toBe(true)
  })

  it('School Admin có mọi lớp; giáo viên chỉ dùng được lớp được gán', async () => {
    const admin = await layPhamViQuanTri(env.DB, await taiKhoan('qa.v2.admin'))
    expect(admin).toEqual({ quanTriTruong: true, lopIds: null })
    expect(xacDinhLopIdApDung(admin, 2, null)).toBe(2)

    const gv = await layPhamViQuanTri(env.DB, await taiKhoan('qa.v2.gv'))
    expect(gv).toEqual({ quanTriTruong: false, lopIds: [1] })
    expect(xacDinhLopIdApDung(gv, 1, null)).toBe(1)
    expect(xacDinhLopIdApDung(gv, 2, 1)).toBeNull()
    expect(xacDinhLopIdApDung(gv, null, 1)).toBe(1)
  })

  it('giáo viên chưa có dòng giao_vien_lop vẫn dùng lop_id của tài khoản (tương thích ngược)', async () => {
    const gv = await taiKhoan('qa.v2.gv')
    expect(await layPhamViQuanTri(env.DB, { ...gv, id: 999_999, lopId: 2 })).toEqual({ quanTriTruong: false, lopIds: [2] })
    expect(await layPhamViQuanTri(env.DB, { ...gv, id: 999_999, lopId: null })).toEqual({ quanTriTruong: false, lopIds: [] })
  })
})
