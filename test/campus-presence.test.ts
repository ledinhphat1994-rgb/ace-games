import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiCampus } from '../shared/protocol/campus'
import { GOC } from './fixtures'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moCampus = (cookie: string) => moKetNoi<GoiCampus>('/ws/campus', cookie)

const ketBanTruoc = async (cookieA: string, cookieB: string, idB: number) => {
  await exports.default.fetch(`${GOC}/api/social/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({ targetAccountId: idB }),
  })
  const resStateB = await exports.default.fetch(`${GOC}/api/social/state`, { headers: { Cookie: cookieB } })
  const stateB = (await resStateB.json()) as { state: { incomingRequests: { id: number; sender?: { id: number } }[] } }
  const req = stateB.state.incomingRequests.find((r) => r.sender?.id !== idB)
  if (req) {
    await exports.default.fetch(`${GOC}/api/social/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ requestId: req.id }),
    })
  }
}

describe('CampusDO Presence & Social Layer v1 — Realtime Invariants', () => {
  it('Bạn bè online -> nhận được snapshot ban đầu và sự kiện presence_update', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')

    const whoamiB = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieB } })).json()) as { accountId: number }

    await ketBanTruoc(cookieA, cookieB, whoamiB.accountId)

    // B kết nối trước
    const wsB = await moCampus(cookieB)
    expect(wsB.status).toBe(101)

    // A kết nối sau
    const wsA = await moCampus(cookieA)
    expect(wsA.status).toBe(101)

    // A nhận snapshot có thông tin presence bạn bè
    const snapshotA = await wsA.cho(
      'social.presence_snapshot',
      (g) => g.friends.some((f) => f.accountId === whoamiB.accountId),
      5000,
    )
    expect(snapshotA).toBeDefined()

    wsA.dong()
    wsB.dong()
  })

  it('Multi-Tab: Đóng một tab khi còn tab khác -> người dùng vẫn online', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const whoamiA = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieA } })).json()) as { accountId: number }
    const whoamiB = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieB } })).json()) as { accountId: number }

    await ketBanTruoc(cookieA, cookieB, whoamiB.accountId)

    // A mở Tab 1
    const wsA1 = await moCampus(cookieA)

    // B kết nối lắng nghe: B thấy A online trong snapshot
    const wsB = await moCampus(cookieB)
    const snapB = await wsB.cho(
      'social.presence_snapshot',
      (g) => g.friends.some((f) => f.accountId === whoamiA.accountId),
      5000,
    )
    expect(snapB.friends.find((f) => f.accountId === whoamiA.accountId)?.state).toBe('online')

    // A mở Tab 2 (cùng tài khoản)
    const wsA2 = await moCampus(cookieA)

    // A đóng Tab 1
    wsA1.dong()

    // B chắc chắn KHÔNG nhận sự kiện offline vì A vẫn còn Tab 2!
    await wsB.khongNhan(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.state === 'offline',
      1500,
    )

    wsA2.dong()
    wsB.dong()
  }, 10000)

  it('Away presence: client gửi presence.away -> bạn bè nhận cập nhật', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const whoamiA = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieA } })).json()) as { accountId: number }
    const whoamiB = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieB } })).json()) as { accountId: number }

    await ketBanTruoc(cookieA, cookieB, whoamiB.accountId)

    const wsB = await moCampus(cookieB)
    const wsA = await moCampus(cookieA)

    // A chuyển sang away
    wsA.gui({ type: 'presence.away', away: true })
    const updateAway = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.state === 'away',
      5000,
    )
    expect(updateAway.presence.state).toBe('away')

    // A chuyển lại online
    wsA.gui({ type: 'presence.away', away: false })
    const updateOnline = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.state === 'online',
      5000,
    )
    expect(updateOnline.presence.state).toBe('online')

    wsA.dong()
    wsB.dong()
  }, 10000)

  it('Hoạt động phòng học & Lọc quyền riêng tư: phòng không có quyền xem được ẩn danh an toàn', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1') // Lớp 1 (lopId = 1)
    const cookieB = await dangNhapLayCookie('qa.v2.thu2') // Lớp 1 (lopId = 1)
    const whoamiA = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieA } })).json()) as { accountId: number }
    const whoamiB = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieB } })).json()) as { accountId: number }

    await ketBanTruoc(cookieA, cookieB, whoamiB.accountId)

    const wsB = await moCampus(cookieB)
    const wsA = await moCampus(cookieA)

    // A vào phòng không tồn tại hoặc phòng kín -> B nhận activity đã được làm sạch
    wsA.gui({ type: 'activity.set', activity: { type: 'room', roomId: 9999 } })

    const updateAct = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.activity?.type === 'room',
      5000,
    )
    expect(updateAct.presence.activity).toBeDefined()
    expect(updateAct.presence.activity?.roomId).toBeUndefined() // Không lộ roomId của phòng không hợp lệ
    expect(updateAct.presence.activity?.roomTitle).toBe('Đang học nhóm')

    wsA.dong()
    wsB.dong()
  }, 10000)

  it('Disconnect Grace Period: Sau khi đóng socket cuối cùng, quá thời gian grace chuyển thành offline', async () => {
    const cookieA = await dangNhapLayCookie('qa.v2.thu1')
    const cookieB = await dangNhapLayCookie('qa.v2.thu2')
    const whoamiA = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieA } })).json()) as { accountId: number }
    const whoamiB = (await (await exports.default.fetch(`${GOC}/api/whoami`, { headers: { Cookie: cookieB } })).json()) as { accountId: number }

    await ketBanTruoc(cookieA, cookieB, whoamiB.accountId)

    const wsB = await moCampus(cookieB)
    const wsA = await moCampus(cookieA)

    // A đóng socket duy nhất
    wsA.dong()

    // B không nhận offline ngay lập tức (grace period 5s)
    await wsB.khongNhan(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.state === 'offline',
      1000,
    )

    // Sau khi hết grace period (5000ms), B nhận sự kiện offline
    const updateOffline = await wsB.cho(
      'social.presence_update',
      (g) => g.presence.accountId === whoamiA.accountId && g.presence.state === 'offline',
      6000,
    )
    expect(updateOffline.presence.state).toBe('offline')
    expect(updateOffline.presence.lastSeen).toBeGreaterThan(0)

    wsB.dong()
  }, 15000)
})
