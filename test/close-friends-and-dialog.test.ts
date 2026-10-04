import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import dialogRaw from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import nutQuanHeRaw from '../src/components/social/NutQuanHe.tsx?raw'
import notifCenterRaw from '../src/components/NotificationCenter.tsx?raw'
import { GOC, MAT_KHAU } from './fixtures'

const goi = (duongDan: string, init?: RequestInit) => exports.default.fetch(`${GOC}${duongDan}`, init)
const layCookie = (res: Response) => (res.headers.get('Set-Cookie') ?? '').split(';')[0]

const dangNhap = async (username: string, password = MAT_KHAU) => {
  const res = await goi('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  expect(res.status).toBe(200)
  const cookie = layCookie(res)
  const whoamiRes = await goi('/api/whoami', { headers: { Cookie: cookie } })
  const whoamiData = (await whoamiRes.json()) as { accountId: number }
  return { cookie, accountId: whoamiData.accountId }
}

describe('Hồ sơ người dùng: Popover sát bên trên Avatar & Không làm mờ xung quanh', () => {
  it('HoSoNguoiDungDialog: modal={false} cho phép tương tác bình thường các khu vực xung quanh', () => {
    expect(dialogRaw).toContain('modal={false}')
  })

  it('HoSoNguoiDungDialog: Không có Popover.Backdrop gây mờ xung quanh', () => {
    expect(dialogRaw).not.toContain('<Popover.Backdrop')
  })

  it('HoSoNguoiDungDialog: side="top" và sideOffset={6} hiện sát bên trên avatar', () => {
    expect(dialogRaw).toContain('side="top"')
    expect(dialogRaw).toContain('sideOffset={6}')
  })
})

describe('Nút quan hệ: Tùy chọn Bạn thân và Hủy kết bạn', () => {
  it('NutQuanHe: Hiển thị ⭐ Bạn thân khi quan hệ là bạn thân (không còn ghi là bạn bè)', () => {
    expect(nutQuanHeRaw).toContain('isCloseFriend ? "⭐ Bạn thân" : "Bạn bè"')
  })

  it('NutQuanHe: Chứa tùy chọn Đặt làm bạn thân ⭐ / Hủy bạn thân và Hủy kết bạn trong popup', () => {
    expect(nutQuanHeRaw).toContain('Đặt làm bạn thân ⭐')
    expect(nutQuanHeRaw).toContain('Hủy bạn thân')
    expect(nutQuanHeRaw).toContain('Hủy kết bạn')
  })

  it('NotificationCenter: Hiển thị nút Xác nhận Bạn thân ⭐ khi nhận được thông báo yêu cầu', () => {
    expect(notifCenterRaw).toContain('close_friend_request')
    expect(notifCenterRaw).toContain('Xác nhận Bạn thân ⭐')
    expect(notifCenterRaw).toContain('Từ chối')
  })
})

describe('API Backend: Luồng quan hệ Bạn thân (Close Friends)', () => {
  it('Chưa là bạn bè -> không thể đặt làm bạn thân (400)', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const res = await goi('/api/social/close-friend/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: 999999 }),
    })
    expect(res.status).toBe(400)
  })

  it('Luồng kết bạn -> Gửi lời mời bạn thân -> Xác nhận qua thông báo -> Cập nhật thành Bạn thân', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // 1. Kết bạn nếu chưa là bạn
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    const stateResB = await goi('/api/social/state', { headers: { Cookie: userB.cookie } })
    const stateB = ((await stateResB.json()) as any).state
    const req = stateB?.incomingRequests?.find((r: any) => r.sender?.id === userA.accountId)
    if (req) {
      await goi('/api/social/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
        body: JSON.stringify({ requestId: req.id }),
      })
    }

    // 2. User A gửi lời mời Bạn thân cho User B
    const cfReqRes = await goi('/api/social/close-friend/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(cfReqRes.status).toBe(200)
    const cfReqData = (await cfReqRes.json()) as any
    expect(cfReqData.ok).toBe(true)

    // User A xem state: friend có closeFriendPending = true
    const stateResA = await goi('/api/social/state', { headers: { Cookie: userA.cookie } })
    const stateDataA = ((await stateResA.json()) as any).state
    const frItemA = stateDataA.friends.find((f: any) => f.id === userB.accountId)
    expect(frItemA).toBeDefined()
    expect(frItemA.isCloseFriend).toBe(false)
    expect(frItemA.closeFriendPending).toBe(true)

    // User B nhận thông báo lời mời Bạn thân
    const notifsResB = await goi('/api/notifications', { headers: { Cookie: userB.cookie } })
    const notifsB = ((await notifsResB.json()) as any).notifications
    const cfNotif = notifsB.find((n: any) => n.data?.subType === 'close_friend_request' && n.data?.actorId === userA.accountId)
    expect(cfNotif).toBeDefined()

    // 3. User B chấp nhận qua endpoint accept
    const cfAcceptRes = await goi('/api/social/close-friend/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ targetAccountId: userA.accountId }),
    })
    expect(cfAcceptRes.status).toBe(200)
    const cfAcceptData = (await cfAcceptRes.json()) as any
    expect(cfAcceptData.ok).toBe(true)
    expect(cfAcceptData.isCloseFriend).toBe(true)

    // 4. Cả hai người đều có isCloseFriend = true trong social/state
    const finalStateResA = await goi('/api/social/state', { headers: { Cookie: userA.cookie } })
    const finalStateA = ((await finalStateResA.json()) as any).state
    const finalFriendB = finalStateA.friends.find((f: any) => f.id === userB.accountId)
    expect(finalFriendB.isCloseFriend).toBe(true)

    const finalStateResB = await goi('/api/social/state', { headers: { Cookie: userB.cookie } })
    const finalStateB = ((await finalStateResB.json()) as any).state
    const finalFriendA = finalStateB.friends.find((f: any) => f.id === userA.accountId)
    expect(finalFriendA.isCloseFriend).toBe(true)

    // 5. Thử hủy bạn thân (remove)
    const removeCfRes = await goi('/api/social/close-friend/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(removeCfRes.status).toBe(200)

    const revertedStateRes = await goi('/api/social/state', { headers: { Cookie: userA.cookie } })
    const revertedState = ((await revertedStateRes.json()) as any).state
    const revertedFriendB = revertedState.friends.find((f: any) => f.id === userB.accountId)
    expect(revertedFriendB.isCloseFriend).toBe(false)
  })
})
