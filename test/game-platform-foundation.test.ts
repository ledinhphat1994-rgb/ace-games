import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiMatchSession } from '../shared/protocol/game-sdk'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moMatchSession = (matchId: string, cookie: string) =>
  moKetNoi<GoiMatchSession>(`/ws/game-session/${encodeURIComponent(matchId)}`, cookie)

describe('Milestone G0 — Campus Game Platform Foundation', () => {
  describe('D1 Migration 0013 Schema Verification', () => {
    it('bảng game_sessions và game_matches tồn tại đầy đủ cột và index', async () => {
      // Kiểm tra bảng game_sessions
      const sessionCols = await env.DB.prepare('PRAGMA table_info(game_sessions)').all<{ name: string }>()
      const colNames = sessionCols.results.map((c) => c.name)
      expect(colNames).toContain('id')
      expect(colNames).toContain('game_type')
      expect(colNames).toContain('account_id')
      expect(colNames).toContain('seed')
      expect(colNames).toContain('started_at')
      expect(colNames).toContain('ended_at')
      expect(colNames).toContain('score')
      expect(colNames).toContain('status')
      expect(colNames).toContain('verification_hash')
      expect(colNames).toContain('client_metadata')

      // Kiểm tra bảng game_matches
      const matchCols = await env.DB.prepare('PRAGMA table_info(game_matches)').all<{ name: string }>()
      const matchColNames = matchCols.results.map((c) => c.name)
      expect(matchColNames).toContain('id')
      expect(matchColNames).toContain('game_type')
      expect(matchColNames).toContain('mode')
      expect(matchColNames).toContain('host_account_id')
      expect(matchColNames).toContain('guest_account_id')
      expect(matchColNames).toContain('winner_account_id')
      expect(matchColNames).toContain('status')
      expect(matchColNames).toContain('score_host')
      expect(matchColNames).toContain('score_guest')
      expect(matchColNames).toContain('idempotency_key')
    })
  })

  describe('Solo Game Sessions & Anti-Cheat Pipeline', () => {
    it('chặn truy cập khi chưa đăng nhập (401)', async () => {
      const rStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      expect(rStart.status).toBe(401)

      const rFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: '00000000-0000-0000-0000-000000000000',
          score: 100,
          durationMs: 5000,
          inputTrace: [],
        }),
      })
      expect(rFinish.status).toBe(401)
    })

    it('vòng đời solo hợp lệ: start -> thu thập input -> finish -> ghi bảng điểm D1', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')

      // 1. Khởi tạo session
      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          gameType: 'solo_snake',
          clientMetadata: { engine: 'phaser', viewport: { width: 800, height: 600, dpr: 2 } },
        }),
      })
      expect(resStart.status).toBe(200)
      const dataStart = (await resStart.json()) as { ok: boolean; sessionId: string; seed: number }
      expect(dataStart.ok).toBe(true)
      expect(typeof dataStart.sessionId).toBe('string')
      expect(typeof dataStart.seed).toBe('number')

      // 2. Kết thúc session với input hợp lý
      const inputTrace = [
        { t: 100, k: 'right' },
        { t: 500, k: 'down' },
        { t: 1200, k: 'left' },
      ]

      const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId: dataStart.sessionId,
          score: 30,
          durationMs: 2500,
          inputTrace,
          clientHash: 'hash_test_123',
        }),
      })
      expect(resFinish.status).toBe(200)
      const dataFinish = (await resFinish.json()) as { ok: boolean; verified: boolean; finalScore: number }
      expect(dataFinish.ok).toBe(true)
      expect(dataFinish.verified).toBe(true)
      expect(dataFinish.finalScore).toBe(30)

      // 3. Kiểm tra bản ghi D1
      const sessionRow = await env.DB.prepare('SELECT status, score FROM game_sessions WHERE id = ?1')
        .bind(dataStart.sessionId)
        .first<{ status: string; score: number }>()
      expect(sessionRow?.status).toBe('completed')
      expect(sessionRow?.score).toBe(30)

      // 4. Kết thúc lại session cũ -> bị từ chối 409 Conflict
      const resDuplicate = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId: dataStart.sessionId,
          score: 30,
          durationMs: 2500,
          inputTrace,
        }),
      })
      expect(resDuplicate.status).toBe(409)
    })

    it('Anti-Cheat: từ chối thời lượng quá ngắn (< 500ms)', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      const { sessionId } = (await resStart.json()) as { sessionId: string }

      const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId,
          score: 10,
          durationMs: 200,
          inputTrace: [{ t: 50, k: 'up' }],
        }),
      })
      expect(resFinish.status).toBe(400)
      const err = (await resFinish.json()) as { loi: string }
      expect(err.loi).toContain('Thời lượng ván đấu không hợp lý')

      const row = await env.DB.prepare('SELECT status FROM game_sessions WHERE id = ?1')
        .bind(sessionId)
        .first<{ status: string }>()
      expect(row?.status).toBe('rejected')
    })

    it('Anti-Cheat: từ chối tần suất thao tác bất khả thi (> 35 phím/giây)', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      const { sessionId } = (await resStart.json()) as { sessionId: string }

      // 50 inputs trong 1 giây (1000ms)
      const spamInputs = Array.from({ length: 50 }, (_, i) => ({ t: i * 20, k: 'up' }))

      const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId,
          score: 10,
          durationMs: 1000,
          inputTrace: spamInputs,
        }),
      })
      expect(resFinish.status).toBe(400)
      const err = (await resFinish.json()) as { loi: string }
      expect(err.loi).toContain('Tần suất thao tác vượt quá giới hạn')
    })

    it('Anti-Cheat: từ chối điểm số phi lý vượt giới hạn cơ chế trò chơi (Physics ceiling)', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_snake' }),
      })
      const { sessionId } = (await resStart.json()) as { sessionId: string }

      // Điểm 1000 trong 2 giây (> 500 điểm/giây, trong khi max trần rắn là 100 điểm/giây)
      const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({
          sessionId,
          score: 1000,
          durationMs: 2000,
          inputTrace: [{ t: 100, k: 'up' }],
        }),
      })
      expect(resFinish.status).toBe(400)
      const err = (await resFinish.json()) as { loi: string }
      expect(err.loi).toContain('Điểm số vượt quá giới hạn')
    })
  })

  describe('GameSessionDO Real-time Multiplayer Flow', () => {
    it('chặn kết nối không phiên đăng nhập (401)', async () => {
      const res = await exports.default.fetch(`${GOC}/ws/game-session/match-test-1`, {
        headers: { Upgrade: 'websocket', Origin: GOC },
      })
      expect(res.status).toBe(401)
    })

    it('vòng đời trận đấu hoàn chỉnh: ghép cặp, sẵn sàng, đi cờ, thắng thua và lưu D1', async () => {
      const matchId = `match-${Date.now().toString(36)}`
      const cookie1 = await dangNhapLayCookie('qa.v2.thu1')
      const cookie2 = await dangNhapLayCookie('qa.v2.thu2')

      // 1. Player 1 kết nối (Host - X)
      const p1 = await moMatchSession(matchId, cookie1)
      const snap1 = await p1.cho('match.snapshot')
      expect(snap1.snapshot.matchId).toBe(matchId)
      expect(snap1.snapshot.status).toBe('waiting')

      // 2. Player 2 kết nối (Guest - O)
      const p2 = await moMatchSession(matchId, cookie2)
      await p2.cho('match.snapshot')

      // Player 1 thấy Player 2 vào
      await p1.cho('match.player_joined', (g) => g.player.side === 'O')

      // 3. Sẵn sàng bắt đầu ván (Ready check)
      p2.gui({ type: 'match.ready', ready: true })
      const cdMsg = await p1.cho('match.countdown')
      expect(cdMsg.seconds).toBe(3)

      // Chờ chuyển sang 'playing'
      const statePlaying = await p1.cho('match.state', (g) => g.status === 'playing', 5000)
      expect(statePlaying.currentTurn).toBe('X')

      // 4. Player 1 đi nước (4, 4)
      p1.gui({ type: 'match.move', x: 4, y: 4 })
      const move1 = await p2.cho('match.state', (g) => g.currentTurn === 'O')
      expect(move1.lastMove).toMatchObject({ player: 'X', x: 4, y: 4 })

      // 5. Player 2 đi nước (4, 5)
      p2.gui({ type: 'match.move', x: 4, y: 5 })
      const move2 = await p1.cho('match.state', (g) => g.currentTurn === 'X')
      expect(move2.lastMove).toMatchObject({ player: 'O', x: 4, y: 5 })

      // 6. Gửi emote
      p1.gui({ type: 'match.emote', emote: '👏' })
      const emote = await p2.cho('match.emote')
      expect(emote.emote).toBe('👏')

      // 7. Player 2 xin hàng -> kết thúc ván
      p2.gui({ type: 'match.surrender' })
      const endedMsg = await p1.cho('match.ended')
      expect(endedMsg.winner).toBe('X')
      expect(endedMsg.endReason).toBe('surrender')
      expect(endedMsg.scoreHost).toBe(1)

      p1.dong()
      p2.dong()
      await new Promise((r) => setTimeout(r, 100))

      // 8. Đối soát D1 game_matches đã ghi nhận kết quả
      const matchRow = await env.DB.prepare('SELECT status, winner_account_id, end_reason FROM game_matches WHERE id = ?1')
        .bind(matchId)
        .first<{ status: string; winner_account_id: number; end_reason: string }>()
      expect(matchRow?.status).toBe('ended')
      expect(matchRow?.end_reason).toBe('surrender')
      expect(matchRow?.winner_account_id).toBeGreaterThan(0)
    })
  })

  describe('Backward Compatibility Checks', () => {
    it('GameLobbyDO danh sách bàn đang mở vẫn phản hồi HTTP 200', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const res = await exports.default.fetch(`${GOC}/api/game/rooms`, {
        headers: { Cookie: cookie },
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as { ok: boolean; rooms: unknown[] }
      expect(data.ok).toBe(true)
      expect(Array.isArray(data.rooms)).toBe(true)
    })

    it('Legacy /api/game/highscore vẫn hoạt động nhưng bị giới hạn an toàn', async () => {
      const cookie = await dangNhapLayCookie('qa.v2.thu1')
      const resValid = await exports.default.fetch(`${GOC}/api/game/highscore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_memory', score: 250 }),
      })
      expect(resValid.status).toBe(200)

      // Điểm số lố bị chặn
      const resExceed = await exports.default.fetch(`${GOC}/api/game/highscore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ gameType: 'solo_memory', score: 999999 }),
      })
      expect(resExceed.status).toBe(400)
    })
  })
})
