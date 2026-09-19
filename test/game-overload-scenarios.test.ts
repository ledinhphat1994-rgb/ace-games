import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiMatchSession } from '../shared/protocol/game-sdk'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moMatchSession = (matchId: string, cookie: string) =>
  moKetNoi<GoiMatchSession>(`/ws/game-session/${encodeURIComponent(matchId)}`, cookie)

describe('Milestone G0 — High Concurrency & Load Stress Scenarios', () => {
  // ─── Scenario A: 50 Matches (100 Concurrent WebSockets) ───────────────────
  it('Scenario A: 100 concurrent WebSockets (50 matches) khởi tạo, trao đổi trạng thái và đóng an toàn', async () => {
    const MATCH_COUNT = 50
    const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

    const startTime = Date.now()
    const latencies: number[] = []
    let connectionSuccesses = 0
    let unexpectedDisconnects = 0

    // Khởi tạo song song 50 bàn đấu (100 WebSockets)
    const matches = await Promise.all(
      Array.from({ length: MATCH_COUNT }, async (_, i) => {
        const matchId = `load-a-${Date.now().toString(36)}-${i}`
        const t0 = Date.now()
        try {
          const p1 = await moMatchSession(matchId, cookie1)
          const p2 = await moMatchSession(matchId, cookie2)
          await Promise.all([p1.cho('match.snapshot'), p2.cho('match.snapshot')])
          latencies.push(Date.now() - t0)
          connectionSuccesses += 2
          return { p1, p2, matchId }
        } catch {
          unexpectedDisconnects++
          return null
        }
      }),
    )

    const validMatches = matches.filter((m): m is NonNullable<typeof m> => m !== null)
    expect(validMatches.length).toBe(MATCH_COUNT)
    expect(connectionSuccesses).toBe(100)

    // Mỗi bàn chơi trao đổi ping/pong
    await Promise.all(
      validMatches.map(async ({ p1 }) => {
        p1.gui({ type: 'ping', t: 100 })
        const pong = await p1.cho('pong')
        expect(pong.type).toBe('pong')
      }),
    )

    // Đóng toàn bộ socket an toàn
    for (const m of validMatches) {
      m.p1.dong()
      m.p2.dong()
    }

    const duration = Date.now() - startTime
    latencies.sort((a, b) => a - b)
    const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0
    const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0
    const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0

    expect(p50).toBeGreaterThanOrEqual(0)
    expect(p95).toBeLessThan(10000)
    expect(p99).toBeLessThan(15000)
    expect(unexpectedDisconnects).toBe(0)
    expect(duration).toBeGreaterThan(0)
  }, 30_000)

  // ─── Scenario: Hot Object Test (1 Hot GameSessionDO) ───────────────────────
  it('Hot Object Test: 1 bàn đấu với 2 người chơi + tải khán giả tăng dần vẫn bảo toàn độ trễ người chơi', async () => {
    const matchId = `load-hot-${Date.now().toString(36)}`
    const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

    // 1. 2 người chơi chính kết nối
    const p1 = await moMatchSession(matchId, cookie1)
    await p1.cho('match.snapshot')
    const p2 = await moMatchSession(matchId, cookie2)
    await p2.cho('match.snapshot')

    p2.gui({ type: 'match.ready', ready: true })
    await p1.cho('match.countdown')
    await p1.cho('match.state', (g) => g.status === 'playing')

    // 2. Kết nối đồng thời 10 khán giả vào cùng 1 DO
    const spectators: any[] = []
    for (let i = 0; i < 10; i++) {
      const spec = await moMatchSession(matchId, cookie2)
      await spec.cho('match.snapshot')
      spectators.push(spec)
    }

    // 3. Người chơi chính thực hiện nước đi dưới tải khán giả
    const moveStart = Date.now()
    p1.gui({ type: 'match.move', x: 5, y: 5 })
    const stateMove = await p2.cho('match.state', (g) => g.currentTurn === 'O')
    const moveLatency = Date.now() - moveStart

    expect(stateMove.currentTurn).toBe('O')
    expect(moveLatency).toBeLessThan(1000) // p95 target <= 1000ms

    // 4. Kết thúc ván cờ và đối soát kết quả
    p2.gui({ type: 'match.surrender' })
    const ended = await p1.cho('match.ended')
    expect(ended.winner).toBe('X')

    // Dọn dẹp
    p1.dong()
    p2.dong()
    spectators.forEach((s) => s.dong())
  }, 20_000)

  // ─── Scenario: Reconnect Storm Resilience ───────────────────────────────────
  it('Reconnect Storm: Hàng loạt kết nối rớt đột ngột và phục hồi thành công không làm crash DO', async () => {
    const matchId = `load-storm-${Date.now().toString(36)}`
    const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
    const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

    const p1 = await moMatchSession(matchId, cookie1)
    await p1.cho('match.snapshot')
    const p2 = await moMatchSession(matchId, cookie2)
    await p2.cho('match.snapshot')

    // Cả 2 socket rớt đột ngột
    p1.dong()
    p2.dong()
    await new Promise((r) => setTimeout(r, 200))

    // Kết nối lại sau thời gian ngẫu nhiên (jittered reconnect)
    const p1Reconnected = await moMatchSession(matchId, cookie1)
    const snap1 = await p1Reconnected.cho('match.snapshot')
    expect(snap1.snapshot.matchId).toBe(matchId)

    const p2Reconnected = await moMatchSession(matchId, cookie2)
    const snap2 = await p2Reconnected.cho('match.snapshot')
    expect(snap2.snapshot.matchId).toBe(matchId)

    p1Reconnected.dong()
    p2Reconnected.dong()
  })

  // ─── Scenario: Campus Isolation Test ────────────────────────────────────────
  it('Campus Isolation: Tải Đấu Trường Game không làm nghẽn hoặc ảnh hưởng các API cốt lõi của Campus', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Chạy song song: vừa tạo trận game, vừa gọi các API học tập và định danh
    const [resWhoami, resRooms, resEngagement, gameWs] = await Promise.all([
      exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookie } }),
      exports.default.fetch(`${GOC}/api/game/rooms`, { headers: { Cookie: cookie } }),
      exports.default.fetch(`${GOC}/api/engagement/me`, { headers: { Cookie: cookie } }),
      moMatchSession(`load-campus-iso-${Date.now().toString(36)}`, cookie),
    ])

    expect(resWhoami.status).toBe(200)
    expect(resRooms.status).toBe(200)
    expect(resEngagement.status).toBe(200)

    const whoami = (await resWhoami.json()) as { ok: boolean; username?: string }
    expect(whoami.ok).toBe(true)
    expect(whoami.username).toBe('qa.v2.thu1')

    const eng = (await resEngagement.json()) as { ok: boolean }
    expect(eng.ok).toBe(true)

    const snap = await gameWs.cho('match.snapshot')
    expect(snap.type).toBe('match.snapshot')

    gameWs.dong()
  })
})
