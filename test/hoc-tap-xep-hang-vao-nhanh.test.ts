// Tab Học tập của bảng xếp hạng chung (Top 50 toàn trường theo tổng XP học tập) và nút "Vào phòng nhanh".
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { PhongSanh } from '../shared/protocol/campus'
import type { SchoolStudyLeaderboardItem } from '../shared/protocol/engagement'
import { chonPhongVaoNhanh, type RoomFriendInfo } from '../src/features/hub/room-discovery'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

const phong = (id: number, them: Partial<PhongSanh> = {}): PhongSanh => ({
  id,
  ten: `Phòng ${id}`,
  moTa: null,
  monHoc: null,
  phamVi: 'truong',
  lopId: null,
  lopTen: null,
  chuPhongTen: 'Chủ phòng',
  coMatKhau: false,
  sucChua: 20,
  soNguoi: 1,
  dangPhat: null,
  taoLuc: 1_700_000_000_000 + id,
  ...them,
})

describe('Vào phòng nhanh', () => {
  const khongBan = new Map<number, RoomFriendInfo[]>()

  it('ưu tiên phòng có bạn bè, rồi phòng đông người', () => {
    const ban = new Map<number, RoomFriendInfo[]>([[3, [{ id: 9, displayName: 'Bạn', username: 'ban' }] as RoomFriendInfo[]]])
    const rooms = [phong(1, { soNguoi: 8 }), phong(2, { soNguoi: 12 }), phong(3, { soNguoi: 2 })]
    expect(chonPhongVaoNhanh(rooms, ban)?.id).toBe(3)
    expect(chonPhongVaoNhanh(rooms, khongBan)?.id).toBe(2)
  })

  it('bỏ qua phòng đầy và phòng cần mật khẩu; không còn phòng nào thì trả null', () => {
    const rooms = [phong(1, { soNguoi: 20, sucChua: 20 }), phong(2, { coMatKhau: true, soNguoi: 15 }), phong(3, { soNguoi: 0 })]
    expect(chonPhongVaoNhanh(rooms, khongBan)?.id).toBe(3)
    expect(chonPhongVaoNhanh([phong(1, { soNguoi: 20, sucChua: 20 }), phong(2, { coMatKhau: true })], khongBan)).toBeNull()
    expect(chonPhongVaoNhanh([], khongBan)).toBeNull()
  })
})

async function datXp(accountId: number, totalXp: number) {
  await env.DB.prepare(
    `INSERT INTO user_engagement_profile (account_id, total_xp, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(account_id) DO UPDATE SET total_xp = excluded.total_xp, updated_at = excluded.updated_at`,
  )
    .bind(accountId, totalXp, Date.now())
    .run()
}

const layBang = async (cookie?: string) => {
  const res = await exports.default.fetch(`${GOC}/api/engagement/leaderboard/school`, {
    headers: cookie ? { Cookie: cookie } : {},
  })
  expect(res.status).toBe(200)
  return ((await res.json()) as { items: SchoolStudyLeaderboardItem[] }).items
}

describe('Bảng xếp hạng Học tập toàn trường', () => {
  it('Top toàn trường theo tổng XP (mọi lớp), bỏ người 0 XP và tài khoản bị khoá; Lv. cùng công thức game', async () => {
    await datXp(1, 120) // qa.v2.thu1 — lớp 1
    await datXp(4, 300) // qa.v2.thu3 — lớp 2
    await datXp(2, 0) // qa.v2.thu2 — chưa có XP
    await datXp(3, 999) // qa.v2.khoa — bị khoá

    const items = await layBang(await dangNhapLayCookie('qa.v2.thu1'))
    expect(items.map((r) => r.playerName)).toEqual(['QA Học sinh lớp 2', 'QA Thử nghiệm 1'])
    expect(items[0]).toMatchObject({ rank: 1, totalXp: 300, level: Math.floor(Math.sqrt(300 / 15)) + 1 })
    expect(items[1]).toMatchObject({ rank: 2, totalXp: 120 })
    expect(JSON.stringify(items)).not.toMatch(/accountId|username|qa\.v2/)
  })

  it('khách chưa đăng nhập vẫn xem được nhưng chỉ thấy họ tên rút gọn', async () => {
    await datXp(4, 300)
    const items = await layBang()
    expect(items[0].playerName).toBe('Q. H. s. l. 2')
  })
})
