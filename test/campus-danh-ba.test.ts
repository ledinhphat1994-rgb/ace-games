import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiCampus, PhongSanh } from '../shared/protocol/campus'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moCampus = async (username: string) => {
  const kn = await moKetNoi<GoiCampus>('/ws/campus', await dangNhapLayCookie(username))
  return { kn, snap: await kn.cho('snapshot') }
}

async function chenPhong(ten: string, phamVi: 'truong' | 'lop', lopId: number | null, tuyChon: { trangThai?: string; matKhau?: boolean } = {}) {
  await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, cau_hinh, access_mode, mat_khau_hash, mat_khau_salt, suc_chua, trang_thai)
     VALUES ('video', ?1, ?2, ?3, 'acc:1', 'QA Thử nghiệm 1', ?4, ?5, ?6, ?7, 8, ?8)`,
  )
    .bind(
      ten,
      phamVi,
      lopId,
      JSON.stringify({ monHoc: 'toan', videoTitle: 'Bài 1: Mệnh đề' }),
      tuyChon.matKhau ? 'password' : 'public',
      tuyChon.matKhau ? 'bi-mat-hash' : null,
      tuyChon.matKhau ? 'bi-mat-salt' : null,
      tuyChon.trangThai ?? 'mo',
    )
    .run()
}

describe('danh bạ phòng trên sảnh (CampusDO)', () => {
  it('lọc theo phạm vi như bản cũ; phòng đóng và phòng không phải phòng học không hiện; không lộ mật khẩu', async () => {
    await chenPhong('Phòng toàn trường', 'truong', null)
    await chenPhong('Phòng lớp 1', 'lop', 1, { matKhau: true })
    await chenPhong('Phòng lớp 2', 'lop', 2)
    await chenPhong('Phòng đã đóng', 'truong', null, { trangThai: 'dong' })
    await env.DB.prepare(
      `INSERT INTO phong (loai, ten, pham_vi, chu_phong_khoa, chu_phong_ten) VALUES ('chat', 'Sảnh chat cũ', 'truong', 'he-thong', 'Hệ thống')`,
    ).run()

    const tenPhong = async (username: string) => {
      const { kn, snap } = await moCampus(username)
      kn.dong()
      return snap.rooms.map((p) => p.ten).sort()
    }
    expect(await tenPhong('qa.v2.thu1')).toEqual(['Phòng lớp 1', 'Phòng toàn trường'].sort())
    expect(await tenPhong('qa.v2.thu3')).toEqual(['Phòng lớp 2', 'Phòng toàn trường'].sort())
    expect(await tenPhong('qa.v2.tudo')).toEqual(['Phòng toàn trường'])
    expect(await tenPhong('qa.v2.gv')).toEqual(['Phòng lớp 1', 'Phòng toàn trường'].sort())
    expect(await tenPhong('qa.v2.admin')).toEqual(['Phòng lớp 1', 'Phòng lớp 2', 'Phòng toàn trường'].sort())

    const { kn, snap } = await moCampus('qa.v2.admin')
    kn.dong()
    expect(snap.rooms.find((p) => p.ten === 'Phòng lớp 1')).toMatchObject({
      phamVi: 'lop',
      lopTen: '10A7 Thử nghiệm',
      monHoc: 'toan',
      coMatKhau: true,
      dangPhat: null,
      sucChua: 8,
      soNguoi: 0,
    })
    expect(snap.rooms.find((p) => p.ten === 'Phòng toàn trường')).toMatchObject({ coMatKhau: false, dangPhat: 'Bài 1: Mệnh đề' })
    expect(JSON.stringify(snap.rooms)).not.toMatch(/bi-mat|acc:1/)
  })

  it('RoomDO báo cập nhật -> chỉ người trong phạm vi nhận room.upsert; gỡ phòng -> room.remove', async () => {
    const hs1 = await moCampus('qa.v2.thu1')
    const hs2 = await moCampus('qa.v2.thu3')
    const campus = env.CAMPUS.get(env.CAMPUS.idFromName('campus'))

    const phong: PhongSanh = {
      id: 9001,
      ten: 'Ôn Toán lớp 1',
      moTa: null,
      monHoc: 'toan',
      phamVi: 'lop',
      lopId: 1,
      lopTen: '10A7 Thử nghiệm',
      chuPhongTen: 'QA Thử nghiệm 1',
      coMatKhau: false,
      sucChua: 8,
      soNguoi: 3,
      dangPhat: null,
      taoLuc: Date.now(),
    }
    await campus.capNhatPhong(phong)
    expect((await hs1.kn.cho('room.upsert')).room).toMatchObject({ id: 9001, soNguoi: 3 })
    await hs2.kn.khongNhan('room.upsert')

    await campus.goPhong(9001)
    await hs1.kn.cho('room.remove', (g) => g.id === 9001)
    await hs2.kn.khongNhan('room.remove')
    hs1.kn.dong()
    hs2.kn.dong()
  })
})
