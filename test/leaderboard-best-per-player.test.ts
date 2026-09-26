// Bảng xếp hạng trò chơi đơn: mỗi người một dòng (kỷ lục cao nhất), không để một người chơi nhiều ván chiếm cả
// top 10; và cổng điểm chưa xác thực chỉ nhận đúng các trò chơi đơn có bảng điểm.
import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

const guiDiem = (cookie: string, gameType: string, score: number) =>
  exports.default.fetch(`${GOC}/api/game/highscore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ gameType, score }),
  })

interface Dong {
  playerName: string
  score: number
}

describe('Bảng xếp hạng trò chơi đơn', () => {
  it('mỗi người chơi chỉ hiện một lần với điểm cao nhất, xếp giảm dần', async () => {
    const an = await dangNhapLayCookie('qa.v2.thu1')
    const binh = await dangNhapLayCookie('qa.v2.thu2')
    for (const diem of [300, 1200, 800]) expect((await guiDiem(an, 'solo_memory', diem)).status).toBe(200)
    for (const diem of [500, 900]) expect((await guiDiem(binh, 'solo_memory', diem)).status).toBe(200)

    const res = await exports.default.fetch(`${GOC}/api/game/highscores?gameType=solo_memory`)
    const { highscores } = (await res.json()) as { highscores: Dong[] }
    expect(highscores.map((h) => [h.playerName, h.score])).toEqual([
      ['QA Thử nghiệm 1', 1200],
      ['QA Thử nghiệm 2', 900],
    ])
  })

  it('cổng điểm chưa xác thực từ chối loại trò chơi tuỳ ý', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await guiDiem(cookie, 'x'.repeat(5000), 10)
    expect(res.status).toBe(400)
    await res.body?.cancel()
    const res2 = await guiDiem(cookie, 'caro_15', 10)
    expect(res2.status).toBe(400)
    await res2.body?.cancel()
  })
})
