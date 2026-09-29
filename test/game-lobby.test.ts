import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { BanSanh, GoiGame } from '../shared/protocol/game'
import { TEN_GAME_LOBBY, tenLobbyTheoLoai } from '../worker/games/game-lobby-do'
import { dangNhapLayCookie, moKetNoi } from './ws'

const layLobby = () => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))

function banMau(id: string, overrides: Partial<BanSanh> = {}): BanSanh {
  return {
    id,
    gameType: 'caro_15',
    tenChu: 'Chủ bàn',
    tenKhach: null,
    trangThai: 'waiting',
    soNguoiXem: 1,
    turnTimerSeconds: 30,
    capNhatLuc: Date.now(),
    ...overrides,
  }
}

// Trong CÙNG 1 file test, các it() dùng chung storage DO (test/setup.ts) — luôn dọn sạch trước mỗi test
// đơn vị để không phụ thuộc thứ tự chạy hay dữ liệu bàn còn sót lại từ test khác.
async function xoaSachLobby(): Promise<void> {
  const lobby = layLobby()
  for (const b of await lobby.danhSach()) await lobby.xoaBan(b.id)
}

describe('GameLobbyDO (danh bạ bàn đấu)', () => {
  it('capNhatBan thêm/ghi đè theo id; xoaBan gỡ khỏi danh sách; sắp mới nhất lên đầu', async () => {
    await xoaSachLobby()
    const lobby = layLobby()
    const bayGio = Date.now()
    await lobby.capNhatBan(banMau('b1', { capNhatLuc: bayGio - 2000 }))
    await lobby.capNhatBan(banMau('b2', { capNhatLuc: bayGio - 1000, gameType: 'chess' }))
    let ds = await lobby.danhSach()
    expect(ds.map((b) => b.id)).toEqual(['b2', 'b1'])

    // Ghi đè cùng id: cập nhật dữ liệu, không tạo dòng mới
    await lobby.capNhatBan(banMau('b1', { capNhatLuc: bayGio, trangThai: 'playing', tenKhach: 'Khách' }))
    ds = await lobby.danhSach()
    expect(ds.map((b) => b.id)).toEqual(['b1', 'b2'])
    expect(ds[0]).toMatchObject({ trangThai: 'playing', tenKhach: 'Khách' })

    await lobby.xoaBan('b2')
    ds = await lobby.danhSach()
    expect(ds.map((b) => b.id)).toEqual(['b1'])

    await lobby.xoaBan('khong-ton-tai')
    ds = await lobby.danhSach()
    expect(ds).toHaveLength(1)
  })

  it('danhSach tự dọn bàn quá hạn (không được cập nhật > 20 phút)', async () => {
    await xoaSachLobby()
    const lobby = layLobby()
    await lobby.capNhatBan(banMau('cu', { capNhatLuc: Date.now() - 25 * 60 * 1000 }))
    await lobby.capNhatBan(banMau('moi', { capNhatLuc: Date.now() }))
    const ds = await lobby.danhSach()
    expect(ds.map((b) => b.id)).toEqual(['moi'])
  })
})

describe('GET /api/game/rooms', () => {
  it('khách chưa đăng nhập -> 401; sai phương thức -> 405', async () => {
    const { exports } = await import('cloudflare:workers')
    const r1 = await exports.default.fetch('https://campus.test/api/game/rooms')
    expect(r1.status).toBe(401)
    await r1.body?.cancel()
    const r2 = await exports.default.fetch('https://campus.test/api/game/rooms', { method: 'POST' })
    expect(r2.status).toBe(405)
    await r2.body?.cancel()
  })

  it('trả đúng danh sách hiện có trong GameLobbyDO', async () => {
    const { exports } = await import('cloudflare:workers')
    await layLobby().capNhatBan(banMau('phong-api-test'))
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await exports.default.fetch('https://campus.test/api/game/rooms', { headers: { Cookie: cookie } })
    expect(res.status).toBe(200)
    const data = (await res.json()) as { ok: boolean; rooms: BanSanh[] }
    expect(data.ok).toBe(true)
    expect(data.rooms.some((b) => b.id === 'phong-api-test')).toBe(true)
  })
})

describe('RoomDO báo GameLobbyDO khi trạng thái bàn đối kháng đổi', () => {
  it('game.init đăng bàn "đang chờ"; game.join lấp đủ 2 chỗ -> "đang chơi"', async () => {
    const maBan = `test-init-${Date.now()}`
    const chu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu1'))
    await chu.cho('game.snapshot')
    chu.gui({ type: 'game.init', gameType: 'chess', turnSeconds: 15 })
    await chu.cho('game.sync')

    let ds = await layLobby().danhSach()
    let ban = ds.find((b) => b.id === maBan)
    expect(ban).toMatchObject({ gameType: 'chess', trangThai: 'waiting', turnTimerSeconds: 15, tenKhach: null })

    const khach = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu2'))
    await khach.cho('game.snapshot')
    khach.gui({ type: 'game.join' })
    await khach.cho('game.sync', (g) => g.meta.status === 'playing')

    ds = await layLobby().danhSach()
    ban = ds.find((b) => b.id === maBan)
    expect(ban).toMatchObject({ trangThai: 'playing', tenChu: 'QA Thử nghiệm 1', tenKhach: 'QA Thử nghiệm 2' })

    chu.dong()
    khach.dong()
  })

  it('ván kết thúc (đầu hàng) -> gỡ khỏi sảnh; cả 2 đồng ý đấu lại -> lại "đang chơi"', async () => {
    const maBan = `test-end-${Date.now()}`
    const chu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu1'))
    await chu.cho('game.snapshot')
    chu.gui({ type: 'game.init', gameType: 'caro_15' })
    await chu.cho('game.sync')

    const khach = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu2'))
    await khach.cho('game.snapshot')
    khach.gui({ type: 'game.join' })
    await chu.cho('game.sync', (g) => g.meta.status === 'playing')
    await khach.cho('game.sync', (g) => g.meta.status === 'playing')

    chu.gui({ type: 'game.surrender' })
    await khach.cho('game.sync', (g) => g.meta.status === 'ended')

    let ds = await layLobby().danhSach()
    expect(ds.some((b) => b.id === maBan)).toBe(false)

    chu.gui({ type: 'game.rematch' })
    await khach.cho('game.sync', (g) => g.meta.rematchBy === 'X')
    // Mới một người mời thì bàn chưa quay lại sảnh.
    expect((await layLobby().danhSach()).some((b) => b.id === maBan)).toBe(false)
    khach.gui({ type: 'game.rematch' })
    await khach.cho('game.sync', (g) => g.meta.status === 'playing' && g.meta.winner === null)

    ds = await layLobby().danhSach()
    expect(ds.find((b) => b.id === maBan)).toMatchObject({ trangThai: 'playing' })

    chu.dong()
    khach.dong()
  })

  it('phòng trống hẳn (mọi người rời) -> gỡ khỏi sảnh dù ván chưa xong', async () => {
    const maBan = `test-empty-${Date.now()}`
    const chu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu1'))
    await chu.cho('game.snapshot')
    chu.gui({ type: 'game.init', gameType: 'caro_15' })
    await chu.cho('game.sync')

    expect((await layLobby().danhSach()).some((b) => b.id === maBan)).toBe(true)

    chu.dong()
    // Đợi webSocketClose của RoomDO xử lý xong (đóng cục bộ qua Hibernation API, không đồng bộ tức thời).
    for (let i = 0; i < 50; i++) {
      if (!(await layLobby().danhSach()).some((b) => b.id === maBan)) break
      await new Promise((r) => setTimeout(r, 20))
    }
    expect((await layLobby().danhSach()).some((b) => b.id === maBan)).toBe(false)
  })
})

describe('Sảnh riêng từng trò chơi (/arena/:gameType)', () => {
  const laySanhRieng = (loai: string) => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(tenLobbyTheoLoai(loai)))

  it('bàn đối kháng đăng lên cả sảnh chung lẫn sảnh riêng của đúng trò; phòng trống thì gỡ khỏi cả hai', async () => {
    const maBan = `test-shard-${Date.now()}`
    const chu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, await dangNhapLayCookie('qa.v2.thu1'))
    await chu.cho('game.snapshot')
    chu.gui({ type: 'game.init', gameType: 'xiangqi', turnSeconds: 60 })
    await chu.cho('game.sync')

    const coBan = async (lobby: ReturnType<typeof laySanhRieng>) => (await lobby.danhSach()).some((b) => b.id === maBan)
    expect(await coBan(layLobby())).toBe(true)
    expect(await coBan(laySanhRieng('xiangqi'))).toBe(true)
    // Không lọt sang sảnh của trò khác.
    expect(await coBan(laySanhRieng('chess'))).toBe(false)

    chu.dong()
    for (let i = 0; i < 50; i++) {
      if (!(await coBan(laySanhRieng('xiangqi'))) && !(await coBan(layLobby()))) break
      await new Promise((r) => setTimeout(r, 20))
    }
    expect(await coBan(laySanhRieng('xiangqi'))).toBe(false)
    expect(await coBan(layLobby())).toBe(false)
  })
})
