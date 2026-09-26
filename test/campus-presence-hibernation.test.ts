// CampusDO dùng WebSocket Hibernation: khi sảnh im lặng (chỉ có ping tự trả lời), runtime huỷ instance nhưng giữ
// kết nối. Instance MỚI được đánh thức phải suy ra ai đang online từ chính các WebSocket còn sống (và trạng thái
// away/hoạt động lưu trong attachment), không được coi mọi người là offline hay im lặng bỏ qua cập nhật.
import { evictDurableObject } from 'cloudflare:test'
import { env, exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiCampus } from '../shared/protocol/campus'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moCampus = (cookie: string) => moKetNoi<GoiCampus>('/ws/campus', cookie)
const ngu = () => evictDurableObject(env.CAMPUS.get(env.CAMPUS.idFromName('campus')))

async function layId(cookie: string): Promise<number> {
  const res = await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookie } })
  return ((await res.json()) as { accountId: number }).accountId
}

async function ketBan(cookieA: string, cookieB: string, idB: number): Promise<void> {
  await exports.default.fetch(`${GOC}/api/social/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ targetAccountId: idB }),
  })
  const res = await exports.default.fetch(`${GOC}/api/social/state`, { headers: { Cookie: cookieB } })
  const state = (await res.json()) as { state: { incomingRequests: { id: number }[] } }
  for (const req of state.state.incomingRequests) {
    await exports.default.fetch(`${GOC}/api/social/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ requestId: req.id }),
    })
  }
}

describe('CampusDO giữ đúng presence sau khi ngủ đông', () => {
  it('bạn bè kết nối sau khi DO bị evict vẫn thấy người đang online là online', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const idA = await layId(cookieA)
    const idB = await layId(cookieB)
    await ketBan(cookieA, cookieB, idB)

    const wsA = await moCampus(cookieA)
    await wsA.cho('snapshot')
    await ngu()

    const wsB = await moCampus(cookieB)
    const snap = await wsB.cho('social.presence_snapshot', (g) => g.friends.some((f) => f.accountId === idA))
    expect(snap.friends.find((f) => f.accountId === idA)?.state).toBe('online')

    wsA.dong()
    wsB.dong()
  })

  it('away gửi sau khi DO bị evict vẫn tới được bạn bè', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const idA = await layId(cookieA)
    const idB = await layId(cookieB)
    await ketBan(cookieA, cookieB, idB)

    const wsB = await moCampus(cookieB)
    await wsB.cho('snapshot')
    const wsA = await moCampus(cookieA)
    await wsA.cho('snapshot')
    await ngu()

    wsA.gui({ type: 'presence.away', away: true })
    const upd = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === idA && g.presence.state === 'away',
    )
    expect(upd.presence.state).toBe('away')

    // Trạng thái away phải sống qua lần ngủ đông kế tiếp: bạn kết nối lại vẫn thấy "away", không phải "online".
    await ngu()
    const wsB2 = await moCampus(cookieB)
    const snap = await wsB2.cho('social.presence_snapshot', (g) => g.friends.some((f) => f.accountId === idA))
    expect(snap.friends.find((f) => f.accountId === idA)?.state).toBe('away')

    wsA.dong()
    wsB.dong()
    wsB2.dong()
  })

  it('người rời đi sau khi DO bị evict vẫn được báo offline cho bạn bè', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const idA = await layId(cookieA)
    const idB = await layId(cookieB)
    await ketBan(cookieA, cookieB, idB)

    const wsB = await moCampus(cookieB)
    await wsB.cho('snapshot')
    const wsA = await moCampus(cookieA)
    await wsA.cho('snapshot')
    await ngu()

    wsA.dong()
    const upd = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === idA && g.presence.state === 'offline',
      9000,
    )
    expect(upd.presence.lastSeen).toBeGreaterThan(0)
    wsB.dong()
  }, 15000)
})
