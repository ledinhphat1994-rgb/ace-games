import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import { TEN_GAME_LOBBY } from '../worker/games/game-lobby-do'
import type { GoiGame } from '../shared/protocol/game'

const layLobby = () => env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))

function moPhongWs(id: number, cookie: string) {
  return exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
  }) as Promise<Response>
}

async function apiFetch(path: string, cookie: string, method = 'GET', body?: unknown): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: {
      Cookie: cookie,
      Origin: GOC,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  }
  if (body) init.body = JSON.stringify(body)
  return exports.default.fetch(`${GOC}${path}`, init) as Promise<Response>
}

describe('Tự động xóa phòng game và phòng học tập hoàn toàn sau 10 giây nếu không có người', () => {
  it('Phòng học tập: tự động đóng hoàn toàn sau 10 giây nếu vừa tạo mà không ai vào', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng 10s Never Joined',
      phamVi: 'truong',
      accessMode: 'public',
    })
    expect(createRes.status).toBe(201)
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // Giả lập thời gian tạo là 11 giây trước
    const elevenSecAgo = Date.now() - 11 * 1000
    await stub.testSetLifecycleState({
      createdAt: elevenSecAgo,
      everJoined: false,
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10 / 60,
    })

    // Kích hoạt alarm
    await (stub as any).testTriggerAlarm()

    // D1 phòng phải đóng với lý do never_joined_timeout
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('never_joined_timeout')
  })

  it('Phòng học tập: tự động đóng hoàn toàn sau 10 giây khi tất cả thành viên đã rời phòng', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng 10s Empty Timeout',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    const doId = env.ROOMS.idFromName(`phong-${room.id}`)
    const stub = env.ROOMS.get(doId)

    // Vào phòng rồi rời đi
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(101)
    const ws = wsRes.webSocket!
    ws.accept()
    await new Promise((r) => setTimeout(r, 50))
    ws.close(1000, 'roi phong')

    // Giả lập người cuối cùng rời phòng 11 giây trước
    const elevenSecAgo = Date.now() - 11 * 1000
    await stub.testSetLifecycleState({
      everJoined: true,
      lastParticipantLeftAt: elevenSecAgo,
      autoCloseEnabled: true,
      emptyRoomTtlMinutes: 10 / 60,
    })

    // Kích hoạt alarm
    await (stub as any).testTriggerAlarm()

    // D1 phòng phải đóng với lý do empty_timeout
    const d1Row = await env.DB.prepare('SELECT trang_thai, close_reason FROM phong WHERE id = ?1')
      .bind(room.id)
      .first<{ trang_thai: string; close_reason: string }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.close_reason).toBe('empty_timeout')
  })

  it('Phòng game: tự động xóa phòng hoàn toàn khỏi sảnh GameLobbyDO sau 10 giây khi không có người', async () => {
    const cookieChu = await dangNhapLayCookie('qa.v2.thu1')

    const resCreate = await exports.default.fetch('https://campus.test/api/game/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieChu,
      },
      body: JSON.stringify({
        gameType: 'caro_15',
        tieuDe: 'Bàn Caro 10s Tự Xóa',
        turnTimerSeconds: 30,
        soPhong: 88,
      }),
    })
    expect(resCreate.status).toBe(200)
    const jsonCreate = (await resCreate.json()) as { ok: boolean; roomId: string }
    const maBan = jsonCreate.roomId

    // Kiểm tra bàn có trên sảnh
    let ds = await layLobby().danhSach()
    expect(ds.some((b) => b.id === maBan)).toBe(true)

    // Chủ phòng kết nối vào bàn rồi rời đi
    const wsChu = await moKetNoi<GoiGame>(`/ws/game/${maBan}`, cookieChu)
    await wsChu.cho('game.snapshot')
    wsChu.dong()

    // Lấy stub RoomDO của bàn game (được gán prefix 'game_')
    const roomDoId = env.ROOMS.idFromName('game_' + maBan)
    const roomStub = env.ROOMS.get(roomDoId)

    // Cài đặt thời gian phòng trống là 11 giây trước (quá hạn 10s)
    const elevenSecAgo = Date.now() - 11 * 1000
    await (roomStub as any).testSetGameEmptySince(elevenSecAgo)

    // Kích hoạt alarm trong RoomDO
    await (roomStub as any).testTriggerAlarm()

    // Bàn game phải được xóa hoàn toàn khỏi GameLobbyDO
    ds = await layLobby().danhSach()
    expect(ds.some((b) => b.id === maBan)).toBe(false)
  })
})
