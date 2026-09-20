import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

describe('G1 Snake Deluxe End-to-End Integration & Verified Leaderboard', () => {
  it('toàn bộ luồng xác thực Snake Deluxe: start -> play -> finish -> verified leaderboard', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // 1. Khởi tạo session với seed từ máy chủ
    const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        gameType: 'solo_snake',
        clientMetadata: { engine: 'phaser' },
      }),
    })
    expect(resStart.status).toBe(200)
    const dataStart = (await resStart.json()) as { ok: boolean; sessionId: string; seed: number }
    expect(dataStart.ok).toBe(true)

    // 2. Client gửi trace có match.end và va chạm hợp lệ
    const inputTrace = [
      { t: 100, k: 'snake.turn', p: 'left' },
      { t: 1500, k: 'match.end', p: { reason: 'game_over' } },
    ]

    const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId: dataStart.sessionId,
        score: 0,
        durationMs: 2000,
        inputTrace,
      }),
    })
    expect(resFinish.status).toBe(200)
    const dataFinish = (await resFinish.json()) as {
      ok: boolean
      verified: boolean
      finalScore: number
      verificationHash?: string
    }
    expect(dataFinish.ok).toBe(true)
    expect(dataFinish.verified).toBe(true)
    expect(typeof dataFinish.finalScore).toBe('number')
    expect(typeof dataFinish.verificationHash).toBe('string')
    expect(dataFinish.verificationHash!.length).toBe(64) // SHA-256 hex string

    // 3. Kiểm tra bảng điểm verifiedOnly=1
    const resLeaderboard = await exports.default.fetch(
      `${GOC}/api/game/highscores?gameType=solo_snake&verifiedOnly=1`,
    )
    expect(resLeaderboard.status).toBe(200)
    const dataLb = (await resLeaderboard.json()) as {
      ok: boolean
      highscores: Array<{ verified: number; score: number }>
    }
    expect(dataLb.ok).toBe(true)
    expect(dataLb.highscores.length).toBeGreaterThan(0)
    expect(dataLb.highscores.every((h) => h.verified === 1)).toBe(true)
  })

  it('điểm số submit từ client bị bỏ qua, server tự tính toán điểm từ replay', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    const resStart = await exports.default.fetch(`${GOC}/api/game/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ gameType: 'solo_snake' }),
    })
    const { sessionId } = (await resStart.json()) as { sessionId: string }

    // Client tự bịa score: 90 điểm trong 2 giây (hợp lệ về physics ceiling <= 100/s)
    // nhưng replay chỉ ăn được 0 điểm vì snake đâm thẳng vào tường
    const inputTrace = [
      { t: 100, k: 'snake.turn', p: 'left' },
      { t: 1500, k: 'match.end', p: { reason: 'game_over' } },
    ]

    const resFinish = await exports.default.fetch(`${GOC}/api/game/session/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sessionId,
        score: 90, // Forged client score
        durationMs: 2000,
        inputTrace,
      }),
    })
    expect(resFinish.status).toBe(200)
    const dataFinish = (await resFinish.json()) as {
      ok: boolean
      verified: boolean
      finalScore: number
    }
    expect(dataFinish.ok).toBe(true)
    expect(dataFinish.verified).toBe(true)
    // Authoritative score is 0, client's 90 points is completely ignored!
    expect(dataFinish.finalScore).toBe(0)
  })

  it('điểm legacy từ POST /api/game/highscore KHÔNG xuất hiện trên verified leaderboard', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')

    // Submit legacy unverified score
    const resLegacy = await exports.default.fetch(`${GOC}/api/game/highscore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ gameType: 'solo_snake', score: 9999 }),
    })
    expect(resLegacy.status).toBe(200)

    // Check verified leaderboard — must NOT contain 9999
    const resVerifiedLb = await exports.default.fetch(
      `${GOC}/api/game/highscores?gameType=solo_snake&verifiedOnly=1`,
    )
    const dataVerifiedLb = (await resVerifiedLb.json()) as {
      highscores: Array<{ score: number; verified: number }>
    }
    expect(dataVerifiedLb.highscores.some((h) => h.score === 9999)).toBe(false)

    // Check unverified/all leaderboard — contains 9999
    const resAllLb = await exports.default.fetch(
      `${GOC}/api/game/highscores?gameType=solo_snake`,
    )
    const dataAllLb = (await resAllLb.json()) as {
      highscores: Array<{ score: number; verified: number }>
    }
    expect(dataAllLb.highscores.some((h) => h.score === 9999)).toBe(true)
  })
})
