// Cổng game không có bước xác thực bị giới hạn tần suất theo tài khoản, tìm YouTube chỉ dành cho người đã đăng nhập,
// và cron đánh dấu ván chơi đơn bỏ dở.
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { danhDauPhienChoiBoDo, PHIEN_CHOI_BO_DO_SAU_MS } from '../worker/games/phien-choi-don'

const post = (duongDan: string, cookie: string, body: unknown) =>
  exports.default.fetch(`${GOC}${duongDan}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  })

describe('Giới hạn tần suất cổng game (GAME_LIMITER)', () => {
  it('mở ván chơi đơn: quá 30 lần / phút / tài khoản thì trả 429', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu3')
    for (let i = 0; i < 30; i++) {
      const res = await post('/api/game/session/start', cookie, { gameType: 'solo_snake' })
      expect(res.status).toBe(200)
      await res.body?.cancel()
    }
    const res = await post('/api/game/session/start', cookie, { gameType: 'solo_snake' })
    expect(res.status).toBe(429)
    await res.body?.cancel()
  })

  it('gửi điểm legacy: quá 30 lần / phút / tài khoản thì trả 429, tài khoản khác không bị ảnh hưởng', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu3')
    for (let i = 0; i < 30; i++) {
      const res = await post('/api/game/highscore', cookie, { gameType: 'solo_memory', score: i })
      expect(res.status).toBe(200)
      await res.body?.cancel()
    }
    const bi = await post('/api/game/highscore', cookie, { gameType: 'solo_memory', score: 1 })
    expect(bi.status).toBe(429)
    await bi.body?.cancel()

    const khac = await post('/api/game/highscore', await dangNhapLayCookie('qa.v2.thu2'), { gameType: 'solo_memory', score: 1 })
    expect(khac.status).toBe(200)
    await khac.body?.cancel()
  })
})

describe('Tìm video YouTube', () => {
  it('khách chưa đăng nhập bị từ chối (không còn là proxy mở)', async () => {
    const res = await exports.default.fetch(`${GOC}/api/yt-search?q=toan`)
    expect(res.status).toBe(401)
    await res.body?.cancel()
  })

  it('người đã đăng nhập gọi được (từ khoá rỗng trả mảng rỗng, không gọi ra ngoài)', async () => {
    const res = await exports.default.fetch(`${GOC}/api/yt-search?q=`, {
      headers: { Cookie: await dangNhapLayCookie('qa.v2.thu1') },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('Cron: ván chơi đơn bỏ dở', () => {
  it('chỉ ván còn "active" quá 6 giờ bị đánh dấu "abandoned"', async () => {
    const bayGio = Date.now()
    const them = (id: string, status: string, startedAt: number) =>
      env.DB.prepare(
        `INSERT INTO game_sessions (id, game_type, account_id, seed, started_at, status) VALUES (?1, 'solo_snake', 1, 1, ?2, ?3)`,
      )
        .bind(id, startedAt, status)
        .run()
    await them('bo-do-cu', 'active', bayGio - PHIEN_CHOI_BO_DO_SAU_MS - 60_000)
    await them('dang-choi', 'active', bayGio - 60_000)
    await them('da-xong-cu', 'completed', bayGio - PHIEN_CHOI_BO_DO_SAU_MS - 60_000)

    expect(await danhDauPhienChoiBoDo(env.DB, bayGio)).toBe(1)

    const { results } = await env.DB.prepare(
      `SELECT id, status FROM game_sessions WHERE id IN ('bo-do-cu', 'dang-choi', 'da-xong-cu') ORDER BY id`,
    ).all<{ id: string; status: string }>()
    expect(results).toEqual([
      { id: 'bo-do-cu', status: 'abandoned' },
      { id: 'da-xong-cu', status: 'completed' },
      { id: 'dang-choi', status: 'active' },
    ])
  })
})
