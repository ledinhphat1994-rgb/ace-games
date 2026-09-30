import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC, MAT_KHAU } from './fixtures'
import type { SocialState, SearchResultItem } from '../shared/protocol/social'

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

describe('Social Graph & Presence API — Invariants & Core Matrix', () => {
  it('chưa đăng nhập -> tất cả endpoints /api/social/* trả về 401', async () => {
    const resState = await goi('/api/social/state')
    expect(resState.status).toBe(401)

    const resSearch = await goi('/api/social/search?q=thu')
    expect(resSearch.status).toBe(401)

    const resReq = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAccountId: 2 }),
    })
    expect(resReq.status).toBe(401)
  })

  it('không thể tự gửi lời mời kết bạn cho chính mình (no self-request)', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const res = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userA.accountId }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { ok: boolean; loi: string }
    expect(json.ok).toBe(false)
    expect(json.loi).toContain('chính mình')
  })

  it('gửi lời mời -> người nhận thấy incoming, người gửi thấy outgoing', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // A gửi lời mời cho B
    const resSend = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(resSend.status).toBe(200)
    const sendJson = (await resSend.json()) as { ok: boolean; requestId: number }
    expect(sendJson.ok).toBe(true)
    expect(sendJson.requestId).toBeGreaterThan(0)

    // A kiểm tra state -> có outgoing request
    const resStateA = await goi('/api/social/state', { headers: { Cookie: userA.cookie } })
    const stateA = ((await resStateA.json()) as { state: SocialState }).state
    expect(stateA.outgoingRequests.some((r) => r.receiver?.id === userB.accountId)).toBe(true)

    // B kiểm tra state -> có incoming request
    const resStateB = await goi('/api/social/state', { headers: { Cookie: userB.cookie } })
    const stateB = ((await resStateB.json()) as { state: SocialState }).state
    const incomingReq = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)
    expect(incomingReq).toBeDefined()

    // Hủy lời mời (Cancel outgoing request)
    const resCancel = await goi('/api/social/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ requestId: incomingReq!.id }),
    })
    expect(resCancel.status).toBe(200)

    // Sau khi hủy -> không còn trong danh sách
    const resStateA2 = await goi('/api/social/state', { headers: { Cookie: userA.cookie } })
    const stateA2 = ((await resStateA2.json()) as { state: SocialState }).state
    expect(stateA2.outgoingRequests.some((r) => r.receiver?.id === userB.accountId)).toBe(false)
  })

  it('từ chối lời mời (Reject) -> lời mời bị xoá, không kết bạn', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // A gửi lời mời cho B
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })

    const stateB = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const req = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)!
    expect(req).toBeDefined()

    // B từ chối
    const resReject = await goi('/api/social/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })
    expect(resReject.status).toBe(200)

    // Cả hai không là bạn bè
    const stateB2 = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    expect(stateB2.friends.some((f) => f.id === userA.accountId)).toBe(false)
    expect(stateB2.incomingRequests.length).toBe(0)
  })

  it('chấp nhận lời mời (Accept) -> trở thành bạn bè đối xứng, idempotent', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // A gửi lời mời cho B
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })

    const stateB = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const req = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)!
    expect(req).toBeDefined()

    // B chấp nhận
    const resAccept = await goi('/api/social/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })
    expect(resAccept.status).toBe(200)

    // Kiểm tra tính đối xứng (A thấy B, B thấy A)
    const [stateAFinal, stateBFinal] = await Promise.all([
      goi('/api/social/state', { headers: { Cookie: userA.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
      goi('/api/social/state', { headers: { Cookie: userB.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
    ])

    expect(stateAFinal.state.friends.some((f) => f.id === userB.accountId)).toBe(true)
    expect(stateBFinal.state.friends.some((f) => f.id === userA.accountId)).toBe(true)

    // B chấp nhận lại lời mời cũ sau khi đã là bạn bè -> không lỗi 404, trả về alreadyFriends: true
    const resAcceptAgain = await goi('/api/social/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })
    expect(resAcceptAgain.status).toBe(200)
    const acceptAgainJson = (await resAcceptAgain.json()) as { ok: boolean; alreadyFriends?: boolean; isFriend?: boolean }
    expect(acceptAgainJson.ok).toBe(true)
    expect(acceptAgainJson.isFriend).toBe(true)
    expect(acceptAgainJson.alreadyFriends).toBe(true)

    // Gửi lại khi đã là bạn bè -> idempotent
    const resDup = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(resDup.status).toBe(200)
    expect(((await resDup.json()) as { alreadyFriends?: boolean }).alreadyFriends).toBe(true)

    // Hủy kết bạn (Unfriend)
    const resUnfriend = await goi('/api/social/unfriend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ friendAccountId: userB.accountId }),
    })
    expect(resUnfriend.status).toBe(200)

    const stateAAfter = ((await (await goi('/api/social/state', { headers: { Cookie: userA.cookie } })).json()) as { state: SocialState }).state
    expect(stateAAfter.friends.some((f) => f.id === userB.accountId)).toBe(false)
  })

  it('Crossed Requests Convergence: A gửi B, B đồng thời gửi A -> tự động hội tụ thành bạn bè', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userC = await dangNhap('qa.v2.thu3')

    // A gửi lời mời cho C
    const resA = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userC.accountId }),
    })
    expect(resA.status).toBe(200)

    // C gửi chéo lại cho A -> hệ thống phát hiện crossed request và tự động hội tụ!
    const resC = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userC.cookie },
      body: JSON.stringify({ targetAccountId: userA.accountId }),
    })
    expect(resC.status).toBe(200)
    const cJson = (await resC.json()) as { ok: boolean; converged?: boolean; isFriend?: boolean }
    expect(cJson.ok).toBe(true)
    expect(cJson.converged).toBe(true)
    expect(cJson.isFriend).toBe(true)

    // Cả hai đã là bạn bè và không còn pending request nào
    const [stateA, stateC] = await Promise.all([
      goi('/api/social/state', { headers: { Cookie: userA.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
      goi('/api/social/state', { headers: { Cookie: userC.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
    ])

    expect(stateA.state.friends.some((f) => f.id === userC.accountId)).toBe(true)
    expect(stateC.state.friends.some((f) => f.id === userA.accountId)).toBe(true)
    expect(stateA.state.incomingRequests.length).toBe(0)
    expect(stateA.state.outgoingRequests.length).toBe(0)
    expect(stateC.state.incomingRequests.length).toBe(0)
    expect(stateC.state.outgoingRequests.length).toBe(0)

    // Dọn dẹp
    await goi('/api/social/unfriend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ friendAccountId: userC.accountId }),
    })
  })

  it('chặn người dùng (Block): xóa bạn bè, xóa lời mời, ngăn gửi lời mời, ẩn khỏi tìm kiếm', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // Thiết lập kết bạn
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    const stateB = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const req = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)!
    await goi('/api/social/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })

    // B chặn A
    const resBlock = await goi('/api/social/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ targetAccountId: userA.accountId }),
    })
    expect(resBlock.status).toBe(200)

    // Quan hệ bạn bè bị xoá tức thì ở cả 2 phía
    const [stateA, stateBPost] = await Promise.all([
      goi('/api/social/state', { headers: { Cookie: userA.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
      goi('/api/social/state', { headers: { Cookie: userB.cookie } }).then((r) => r.json() as Promise<{ state: SocialState }>),
    ])
    expect(stateA.state.friends.some((f) => f.id === userB.accountId)).toBe(false)
    expect(stateBPost.state.friends.some((f) => f.id === userA.accountId)).toBe(false)
    expect(stateBPost.state.blockedUsers.some((u) => u.id === userA.accountId)).toBe(true)

    // A không thể gửi lại lời mời kết bạn cho B -> 403
    const resBlockedReq = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(resBlockedReq.status).toBe(403)

    // Tìm kiếm discovery: A tìm B hoặc B tìm A không thấy nhau
    const searchRes = await goi('/api/social/search?q=thu2', { headers: { Cookie: userA.cookie } })
    const searchResults = ((await searchRes.json()) as { results: SearchResultItem[] }).results
    expect(searchResults.some((r) => r.id === userB.accountId)).toBe(false)

    // B bỏ chặn A
    const resUnblock = await goi('/api/social/unblock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ targetAccountId: userA.accountId }),
    })
    expect(resUnblock.status).toBe(200)

    // Sau khi bỏ chặn, A có thể gửi lời mời trở lại
    const resAllowReq = await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    expect(resAllowReq.status).toBe(200)

    // Dọn dẹp request
    const stateBFinal = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const reqToClean = stateBFinal.incomingRequests.find((r) => r.sender?.id === userA.accountId)
    if (reqToClean) {
      await goi('/api/social/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
        body: JSON.stringify({ requestId: reqToClean.id }),
      })
    }
  })

  it('Discovery search: trả về đúng relationshipStatus (none, pending_sent, friend)', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // Ban đầu chưa có quan hệ: status = 'none'
    const resSearch1 = await goi('/api/social/search?q=thu2', { headers: { Cookie: userA.cookie } })
    const r1 = ((await resSearch1.json()) as { results: SearchResultItem[] }).results
    const item1 = r1.find((x) => x.id === userB.accountId)
    expect(item1).toBeDefined()
    expect(item1?.relationshipStatus).toBe('none')

    // A gửi lời mời cho B -> search thấy pending_sent
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })

    const resSearch2 = await goi('/api/social/search?q=thu2', { headers: { Cookie: userA.cookie } })
    const r2 = ((await resSearch2.json()) as { results: SearchResultItem[] }).results
    expect(r2.find((x) => x.id === userB.accountId)?.relationshipStatus).toBe('pending_sent')

    // B search thấy pending_received
    const resSearchB = await goi('/api/social/search?q=thu1', { headers: { Cookie: userB.cookie } })
    const rB = ((await resSearchB.json()) as { results: SearchResultItem[] }).results
    expect(rB.find((x) => x.id === userA.accountId)?.relationshipStatus).toBe('pending_received')

    // B chấp nhận
    const stateB = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const req = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)!
    await goi('/api/social/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })

    // Search thấy 'friend'
    const resSearch3 = await goi('/api/social/search?q=thu2', { headers: { Cookie: userA.cookie } })
    const r3 = ((await resSearch3.json()) as { results: SearchResultItem[] }).results
    expect(r3.find((x) => x.id === userB.accountId)?.relationshipStatus).toBe('friend')

    // Dọn dẹp
    await goi('/api/social/unfriend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ friendAccountId: userB.accountId }),
    })
  })

  it('Tin nhắn riêng 1-1: chỉ bạn bè mới nhắn được, lưu D1 và đọc lịch sử', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // Chưa kết bạn -> 403
    const resForbidden = await goi(`/api/social/messages/${userB.accountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ noiDung: 'Chào bạn!' }),
    })
    expect(resForbidden.status).toBe(403)

    // Kết bạn A <-> B
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    const stateB = ((await (await goi('/api/social/state', { headers: { Cookie: userB.cookie } })).json()) as { state: SocialState }).state
    const req = stateB.incomingRequests.find((r) => r.sender?.id === userA.accountId)!
    await goi('/api/social/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ requestId: req.id }),
    })

    // A gửi tin nhắn cho B
    const resSend = await goi(`/api/social/messages/${userB.accountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ noiDung: 'Chào B, mình là A nhé!' }),
    })
    expect(resSend.status).toBe(200)
    const jsonSend = (await resSend.json()) as { ok: boolean; message: any }
    expect(jsonSend.ok).toBe(true)
    expect(jsonSend.message.noiDung).toBe('Chào B, mình là A nhé!')
    expect(jsonSend.message.senderId).toBe(userA.accountId)
    expect(jsonSend.message.receiverId).toBe(userB.accountId)

    // B đọc lịch sử tin nhắn với A
    const resGet = await goi(`/api/social/messages/${userA.accountId}`, {
      headers: { Cookie: userB.cookie },
    })
    expect(resGet.status).toBe(200)
    const jsonGet = (await resGet.json()) as { ok: boolean; messages: any[] }
    expect(jsonGet.ok).toBe(true)
    expect(jsonGet.messages.length).toBeGreaterThanOrEqual(1)
    const msg = jsonGet.messages.find((m) => m.id === jsonSend.message.id)
    expect(msg).toBeDefined()
    expect(msg?.noiDung).toBe('Chào B, mình là A nhé!')

    // Dọn dẹp bạn bè sau test
    await goi('/api/social/unfriend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ friendAccountId: userB.accountId }),
    })
  })
})
