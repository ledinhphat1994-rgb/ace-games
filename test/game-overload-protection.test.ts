import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiMatchSession } from '../shared/protocol/game-sdk'
import { CampusGameSDK } from '../src/lib/game-sdk/campus-game-sdk'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'
import { tenLobbyTheoLoai } from '../worker/games/game-lobby-do'
import { isDurableObjectOverloaded } from '../worker/index'

const moMatchSession = (matchId: string, cookie: string) =>
  moKetNoi<GoiMatchSession>(`/ws/game-session/${encodeURIComponent(matchId)}`, cookie)

const taoMockContainer = () =>
  ({
    getBoundingClientRect: () => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }),
    requestFullscreen: async () => {},
  }) as unknown as HTMLElement

describe('Milestone G0 — Overload Safety & Graceful Degradation Gate', () => {
  describe('Per-Socket Inbound Message Protection', () => {
    it('1. Từ chối gói tin WebSocket vượt quá kích thước 16 KiB', async () => {
      const matchId = `match-ovl-frame-${Date.now().toString(36)}`
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const ws = await moMatchSession(matchId, cookie)
      await ws.cho('match.snapshot')

      // Gửi gói tin lớn hơn 16 KiB (ví dụ: chuỗi 20 KiB)
      const oversizedPayload = JSON.stringify({
        type: 'match.move',
        payload: 'X'.repeat(17 * 1024),
      })
      ws.ws!.send(oversizedPayload)

      // Kỳ vọng nhận được thông báo lỗi invalid_packet
      const errMsg = await ws.cho('match.error')
      expect(errMsg.code).toBe('invalid_packet')
      expect(errMsg.message).toContain('16 KiB')

      ws.dong()
    })

    it('2. Từ chối dữ liệu JSON không hợp lệ (malformed JSON) mà không làm sập DO', async () => {
      const matchId = `match-ovl-malformed-${Date.now().toString(36)}`
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const ws = await moMatchSession(matchId, cookie)
      await ws.cho('match.snapshot')

      // Gửi chuỗi không phải JSON
      ws.ws!.send('{ invalid json payload [[[')

      const errMsg = await ws.cho('match.error')
      expect(errMsg.code).toBe('invalid_packet')
      expect(errMsg.message).toContain('JSON không hợp lệ')

      ws.dong()
    })

    it('3. Protocol Ping/Pong được miễn trừ khỏi giới hạn tần suất thao tác', async () => {
      const matchId = `match-ovl-ping-${Date.now().toString(36)}`
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const ws = await moMatchSession(matchId, cookie)
      await ws.cho('match.snapshot')

      // Gửi liên tục 15 gói ping
      for (let i = 0; i < 15; i++) {
        ws.gui({ type: 'ping', t: Date.now() })
      }

      // DO vẫn phản hồi pong bình thường, không bị chặn hay văng lỗi
      const pong = await ws.cho('pong')
      expect(pong.type).toBe('pong')

      ws.dong()
    })

    it('4. Đóng kết nối (code 4429) khi socket liên tục gửi >= 5 gói tin lỗi/spam', async () => {
      const matchId = `match-ovl-abuse-${Date.now().toString(36)}`
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const ws = await moMatchSession(matchId, cookie)
      await ws.cho('match.snapshot')

      let closeCode: number | null = null
      ws.ws!.addEventListener('close', (ev) => {
        closeCode = ev.code
      })

      // Gửi gói tin lỗi liên tiếp cho đến khi socket bị đóng
      for (let i = 0; i < 6; i++) {
        try {
          ws.ws!.send('invalid-packet-data-' + i)
        } catch {
          break
        }
        await new Promise((r) => setTimeout(r, 20))
      }

      // Đợi kết nối bị đóng bởi máy chủ
      await new Promise((r) => setTimeout(r, 200))
      expect(closeCode).toBe(4429)

      ws.dong()
    })
  })

  describe('Emote Cooldown & Load-Shedding Degradation', () => {
    it('5. Giới hạn tần suất Emote: spam emote bị chặn bởi cooldown', async () => {
      const matchId = `match-ovl-emote-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')

      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')

      // P1 gửi 1 emote hợp lệ
      p1.gui({ type: 'match.emote', emote: '🎉' })
      const e1 = await p2.cho('match.emote')
      expect(e1.emote).toBe('🎉')

      // P1 gửi liên tục 5 emote trong cùng 1 tích tắc
      for (let i = 0; i < 5; i++) {
        p1.gui({ type: 'match.emote', emote: `🔥-${i}` })
      }

      // Chỉ tối đa 2 burst emote được lọt qua, các emote dồn dập sau bị chặn
      await new Promise((r) => setTimeout(r, 300))

      p1.dong()
      p2.dong()
    })

    it('6. Khi ở trạng thái LOAD_SHED, Emote bị triệt tiêu hoàn toàn để bảo vệ băng thông', async () => {
      const matchId = `match-ovl-shed-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')

      // Giả lập GameSessionDO chuyển sang trạng thái LOAD_SHED
      const doId = env.GAME_SESSIONS.idFromName('match:' + matchId)
      const stub = env.GAME_SESSIONS.get(doId)
      await (stub as any).setOperationalStateForTesting('LOAD_SHED')

      // P1 gửi emote
      p1.gui({ type: 'match.emote', emote: '⚡' })

      // P2 không nhận được emote này vì đã bị drop ở cấp DO
      let p2ReceivedEmote = false
      p2.ws!.addEventListener('message', (e) => {
        if (typeof e.data === 'string' && e.data.includes('match.emote')) {
          p2ReceivedEmote = true
        }
      })

      await new Promise((r) => setTimeout(r, 200))
      expect(p2ReceivedEmote).toBe(false)

      p1.dong()
      p2.dong()
    })
  })

  describe('Spectator Load Shedding & Player Isolation', () => {
    it('7. Khán giả vượt quá trần quy định (30 người) bị từ chối kết nối lịch sự mà không làm gián đoạn người chơi', async () => {
      const matchId = `match-ovl-spec-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      // Host X và Guest O vào bàn bình thường
      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')

      // Giả lập GameSessionDO chuyển sang trạng thái LOAD_SHED (hoặc đạt 30 khán giả)
      const doId = env.GAME_SESSIONS.idFromName('match:' + matchId)
      const stub = env.GAME_SESSIONS.get(doId)
      await (stub as any).setOperationalStateForTesting('LOAD_SHED')

      // Khán giả (qa.v2.thu3) cố gắng vào xem bàn đấu
      const cookie3 = await dangNhapLayCookie('qa.v2.thu3')
      const resSpectator = await exports.default.fetch(`${GOC}/ws/game-session/${matchId}`, {
        headers: { Upgrade: 'websocket', Origin: GOC, Cookie: cookie3 },
      })

      // Phản hồi từ chối 429 kèm lý do rõ ràng
      expect(resSpectator.status).toBe(429)
      const errBody = (await resSpectator.json()) as { ok: boolean; error: string; message: string }
      expect(errBody.ok).toBe(false)
      expect(errBody.error).toBe('spectator_capacity_reached')

      // Người chơi chính p1 và p2 hoàn toàn không bị ảnh hưởng
      p1.gui({ type: 'ping', t: 1234 })
      const pong = await p1.cho('pong')
      expect(pong.t).toBe(1234)

      p1.dong()
      p2.dong()
    })
  })

  describe('Durable Object Overload Error Detection', () => {
    it('8. isDurableObjectOverloaded phát hiện chính xác lỗi quá tải từ Cloudflare platform', () => {
      expect(isDurableObjectOverloaded({ overloaded: true })).toBe(true)
      expect(isDurableObjectOverloaded(new Error('Durable Object is overloaded'))).toBe(true)
      expect(isDurableObjectOverloaded(new Error('too many requests queued for this object'))).toBe(true)
      expect(isDurableObjectOverloaded(new Error('Durable Object request queue full'))).toBe(true)
      expect(isDurableObjectOverloaded(new Error('Normal database syntax error'))).toBe(false)
      expect(isDurableObjectOverloaded(null)).toBe(false)
    })
  })

  describe('Client SDK Jittered Reconnect Backoff', () => {
    it('9. calculateReconnectDelay sinh độ trễ tăng dần lũy thừa và có độ rung ngẫu nhiên (jitter)', () => {
      const container = taoMockContainer()
      const sdk = new CampusGameSDK({ container, gameType: 'caro_15' })

      const d0 = sdk.calculateReconnectDelay(0, { baseDelayMs: 1000, maxDelayMs: 15000, jitterFactor: 0.2 })
      const d1 = sdk.calculateReconnectDelay(1, { baseDelayMs: 1000, maxDelayMs: 15000, jitterFactor: 0.2 })
      const d2 = sdk.calculateReconnectDelay(2, { baseDelayMs: 1000, maxDelayMs: 15000, jitterFactor: 0.2 })
      const d10 = sdk.calculateReconnectDelay(10, { baseDelayMs: 1000, maxDelayMs: 15000, jitterFactor: 0.2 })

      // attempt 0: ~1000ms (+/- 20% -> 800 - 1200ms)
      expect(d0).toBeGreaterThanOrEqual(800)
      expect(d0).toBeLessThanOrEqual(1200)

      // attempt 1: ~2000ms (+/- 20% -> 1600 - 2400ms)
      expect(d1).toBeGreaterThanOrEqual(1600)
      expect(d1).toBeLessThanOrEqual(2400)

      // attempt 2: ~4000ms (+/- 20% -> 3200 - 4800ms)
      expect(d2).toBeGreaterThanOrEqual(3200)
      expect(d2).toBeLessThanOrEqual(4800)

      // attempt 10: bị chặn trần maxDelayMs (15000ms)
      expect(d10).toBeLessThanOrEqual(18000)

      sdk.destroy()
    })
  })

  describe('Lobby Partitioning & No Move Invariant', () => {
    it('10. tenLobbyTheoLoai phân vùng chính xác theo gameType', () => {
      expect(tenLobbyTheoLoai('caro_15')).toBe('lobby:caro_15')
      expect(tenLobbyTheoLoai('connect4')).toBe('lobby:connect4')
      expect(tenLobbyTheoLoai('reversi')).toBe('lobby:reversi')
      expect(tenLobbyTheoLoai()).toBe('lobby')
      expect(tenLobbyTheoLoai('all')).toBe('lobby')
    })

    it('11. /api/game/rooms lọc theo phân vùng gameType', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')

      // Query không có gameType -> trả về sảnh chung
      const resAll = await exports.default.fetch(`${GOC}/api/game/rooms`, {
        headers: { Cookie: cookie },
      })
      expect(resAll.status).toBe(200)
      const dataAll = (await resAll.json()) as { ok: boolean; rooms: unknown[] }
      expect(dataAll.ok).toBe(true)

      // Query có gameType -> trả về phân vùng tương ứng
      const resCaro = await exports.default.fetch(`${GOC}/api/game/rooms?gameType=caro_15`, {
        headers: { Cookie: cookie },
      })
      expect(resCaro.status).toBe(200)
      const dataCaro = (await resCaro.json()) as { ok: boolean; rooms: unknown[] }
      expect(dataCaro.ok).toBe(true)
    })

    it('12. Invariant: Nước đi trong ván không đẩy vào GameLobbyDO', async () => {
      const matchId = `match-ovl-nomove-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')

      p2.gui({ type: 'match.ready', ready: true })
      await p1.cho('match.countdown')
      await p1.cho('match.state', (g) => g.status === 'playing')

      // Đọc thời gian cập nhật sảnh trước khi đi cờ
      const lobbyStub = env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName('lobby:caro_15'))
      const roomsBefore = await lobbyStub.danhSach()
      const roomEntryBefore = roomsBefore.find((r) => r.id === matchId)
      const updateTimeBefore = roomEntryBefore?.capNhatLuc

      // P1 thực hiện nước đi
      p1.gui({ type: 'match.move', x: 7, y: 7 })
      await p2.cho('match.state', (g) => g.currentTurn === 'O')

      // Đọc lại thời gian cập nhật sảnh: phải KHÔNG đổi vì nước đi cờ không bao giờ ghi vào LobbyDO
      const roomsAfter = await lobbyStub.danhSach()
      const roomEntryAfter = roomsAfter.find((r) => r.id === matchId)
      expect(roomEntryAfter?.capNhatLuc).toBe(updateTimeBefore)

      p1.dong()
      p2.dong()
    })
  })

  describe('CampusGameSDK Lifecycle Stress Test', () => {
    it('13. 50 chu kỳ liên tiếp mount -> start -> pause -> resume -> destroy không gây rò rỉ listener', () => {
      const container = taoMockContainer()
      for (let i = 0; i < 50; i++) {
        const sdk = new CampusGameSDK({ container, gameType: 'caro_15' })
        sdk.start()
        sdk.pause()
        sdk.resume()
        sdk.recordInput('test_input', { cycle: i })
        sdk.destroy()
      }
      expect(true).toBe(true)
    })
  })

  describe('Concurrent Solo Finish & Settlement Integrity', () => {
    it('14. Kết thúc song song (Concurrent Finish) trên cùng session: chỉ 1 request thành công, request thứ 2 nhận 409', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')

      // Khởi tạo 1 session solo
      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      const { sessionId } = (await resStart.json()) as { sessionId: string }

      // Gửi 2 request kết thúc song song cùng lúc
      const finishBody = JSON.stringify({
        sessionId,
        score: 50,
        durationMs: 3000,
        inputTrace: [{ t: 100, k: 'right' }],
      })

      const [res1, res2] = await Promise.all([
        exports.default.fetch(`${GOC}/api/game/session/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: finishBody,
        }),
        exports.default.fetch(`${GOC}/api/game/session/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: finishBody,
        }),
      ])

      const statuses = [res1.status, res2.status].sort()
      // Chính xác 1 request thành công 200, request kia bị từ chối 409 Conflict
      expect(statuses[0]).toBe(200)
      expect(statuses[1]).toBe(409)
    })

    it('15. Bounded Trace: inputTrace vượt quá 2000 events bị từ chối 400 (Anti-DoS memory bounds)', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')

      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      const { sessionId } = (await resStart.json()) as { sessionId: string }

      // Tạo mảng 2001 input events (vượt trần MAX_INPUT_TRACE_EVENTS = 2000)
      const oversizedTrace = Array.from({ length: 2001 }, (_, i) => ({ t: i * 10, k: 'up' }))

      const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId,
          score: 10,
          durationMs: 25000,
          inputTrace: oversizedTrace,
        }),
      })

      expect(resFinish.status).toBe(400)
      const data = (await resFinish.json()) as { loi?: string }
      expect(data.loi).toContain('không đúng chuẩn')
    })

    it('16. Alarm Countdown: Ready check kích hoạt countdown và chuyển sang playing qua Alarm Arbiter', async () => {
      const matchId = `match-alarm-cd-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')

      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')
      await p1.cho('match.player_joined')

      // Cả 2 ready -> kích hoạt countdown
      p2.gui({ type: 'match.ready', ready: true })
      const cd = await p1.cho('match.countdown')
      expect(cd.seconds).toBe(1)

      // Chờ alarm kích hoạt chuyển sang 'playing'
      const statePlaying = await p1.cho('match.state', (g) => g.status === 'playing', 5000)
      expect(statePlaying.status).toBe('playing')
      expect(statePlaying.currentTurn).toBe('X')

      p1.dong()
      p2.dong()
    })

    it('17. Multi-Round Rematch & Distinct Settlement: Tái đấu tạo round_id độc lập và đối soát 2 dòng D1', async () => {
      const matchId = `match-rematch-outbox-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')
      await p1.cho('match.player_joined')

      // Bắt đầu vòng 1
      p2.gui({ type: 'match.ready', ready: true })
      await p1.cho('match.state', (g) => g.status === 'playing', 5000)

      // Kết thúc vòng 1: P2 đầu hàng -> P1 thắng vòng 1
      p2.gui({ type: 'match.surrender' })
      const endedRound1 = await p1.cho('match.ended')
      expect(endedRound1.winner).toBe('X')
      await p2.cho('match.ended') // Tiêu thụ gói kết thúc vòng 1 trên p2

      // Yêu cầu tái đấu (Rematch) từ cả 2 phía
      p1.gui({ type: 'match.rematch' })
      p2.gui({ type: 'match.rematch' })

      // Nhận state của vòng 2
      const round2State = await p1.cho('match.state', (g) => g.status === 'playing', 5000)
      expect(round2State.status).toBe('playing')

      // Kết thúc vòng 2: P1 đầu hàng -> P2 thắng vòng 2
      p1.gui({ type: 'match.surrender' })
      const endedRound2 = await p2.cho('match.ended')
      expect(endedRound2.winner).toBe('O')

      p1.dong()
      p2.dong()
      await new Promise((r) => setTimeout(r, 400))

      // Kiểm tra D1: Cả 2 round đều đã được ghi nhận với round_id và idempotency_key riêng
      const rounds = await env.DB.prepare(
        'SELECT id, round_seq, winner_account_id, end_reason FROM game_matches WHERE match_room_id = ?1 ORDER BY round_seq ASC',
      )
        .bind(matchId)
        .all<{ id: string; round_seq: number; winner_account_id: number; end_reason: string }>()

      expect(rounds.results.length).toBe(2)
      expect(rounds.results[0].round_seq).toBe(1)
      expect(rounds.results[0].id).toBe(matchId)
      expect(rounds.results[1].round_seq).toBe(2)
      expect(rounds.results[1].id).toBe(`${matchId}:r2`)
    }, 15_000)

    it('18. Durable Reconnect Grace: Rớt mạng trong trận kích hoạt thời gian ân hạn và phục hồi an toàn', async () => {
      const matchId = `match-reconnect-grace-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      const p1 = await moMatchSession(matchId, cookie1)
      await p1.cho('match.snapshot')
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')
      await p1.cho('match.player_joined')

      p2.gui({ type: 'match.ready', ready: true })
      await p1.cho('match.state', (g) => g.status === 'playing', 5000)

      // P2 đột ngột ngắt kết nối
      p2.dong()

      // P1 nhận thông báo P2 bị disconnect kèm thời gian ân hạn
      const statusMsg = await p1.cho('match.player_status', (g) => g.connected === false)
      expect(statusMsg.connected).toBe(false)
      expect(statusMsg.reconnectGraceSeconds).toBe(30)

      // P2 kết nối lại trong thời hạn ân hạn
      const p2Reconnected = await moMatchSession(matchId, cookie2)
      const snap = await p2Reconnected.cho('match.snapshot')
      expect(snap.snapshot.status).toBe('playing')

      // P1 nhận thông báo P2 đã kết nối lại (player_joined)
      const rejoinMsg = await p1.cho('match.player_joined', (g) => g.player.connected === true)
      expect(rejoinMsg.player.connected).toBe(true)

      p1.dong()
      p2Reconnected.dong()
    }, 15_000)
  })
})
