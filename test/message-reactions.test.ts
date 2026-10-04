import { exports } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
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

describe('Message Reactions Synchronization — Direct Messages & Campus Chat', () => {
  it('chưa đăng nhập -> không thể gửi reaction tin nhắn riêng (401)', async () => {
    const res = await goi('/api/social/messages/999/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: 1, emojis: ['❤️'] }),
    })
    expect(res.status).toBe(401)
  })

  it('chưa đăng nhập -> không thể gửi reaction campus chat (401)', async () => {
    const res = await goi('/api/campus/chat/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: 1, emojis: ['🔥'] }),
    })
    expect(res.status).toBe(401)
  })

  it('gửi reaction DM -> lưu CSDL D1 và lấy lại qua GET /messages/:friendId', async () => {
    const userA = await dangNhap('qa.v2.thu1')
    const userB = await dangNhap('qa.v2.thu2')

    // Kết bạn giữa A và B nếu chưa là bạn
    await goi('/api/social/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ targetAccountId: userB.accountId }),
    })
    // B chấp nhận
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

    // A gửi tin nhắn riêng cho B
    const sendRes = await goi(`/api/social/messages/${userB.accountId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ noiDung: 'Chào bạn, cùng thử emoji nhé!' }),
    })
    expect(sendRes.status).toBe(200)
    const sendJson = (await sendRes.json()) as { ok: boolean; message: { id: number } }
    expect(sendJson.ok).toBe(true)
    const msgId = sendJson.message.id

    // B thả reaction trên tin nhắn đó
    const reactRes = await goi(`/api/social/messages/${userA.accountId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ messageId: msgId, emojis: ['❤️', '👍'] }),
    })
    expect(reactRes.status).toBe(200)
    const reactJson = (await reactRes.json()) as { ok: boolean; messageId: number; reactions: string[] }
    expect(reactJson.ok).toBe(true)
    expect(reactJson.reactions).toEqual(['❤️', '👍'])

    // A lấy danh sách tin nhắn -> nhận được cả reactions đồng bộ
    const getResA = await goi(`/api/social/messages/${userB.accountId}`, {
      headers: { Cookie: userA.cookie },
    })
    expect(getResA.status).toBe(200)
    const getJsonA = (await getResA.json()) as {
      ok: boolean
      messages: Array<{ id: number }>
      reactions?: Record<number, string[]>
    }
    expect(getJsonA.ok).toBe(true)
    expect(getJsonA.reactions?.[msgId]).toEqual(['❤️', '👍'])

    // Giới hạn tối đa 3 emojis (userA gửi trên cuộc trò chuyện với userB)
    const react3Res = await goi(`/api/social/messages/${userB.accountId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ messageId: msgId, emojis: ['🎉', '😂', '🔥', '💯'] }),
    })
    expect(react3Res.status).toBe(200)
    const react3Json = (await react3Res.json()) as { ok: boolean; reactions: string[] }
    expect(react3Json.reactions).toEqual(['🎉', '😂', '🔥']) // capped at 3

    // Xóa reaction (gửi mảng rỗng)
    const removeRes = await goi(`/api/social/messages/${userA.accountId}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userB.cookie },
      body: JSON.stringify({ messageId: msgId, emojis: [] }),
    })
    expect(removeRes.status).toBe(200)

    const getResAfter = await goi(`/api/social/messages/${userB.accountId}`, {
      headers: { Cookie: userA.cookie },
    })
    const getJsonAfter = (await getResAfter.json()) as any
    expect(getJsonAfter.reactions?.[msgId]).toBeUndefined()
  })

  it('gửi reaction Campus Chat -> lưu CSDL D1 thành công', async () => {
    const userA = await dangNhap('qa.v2.thu1')

    const reactRes = await goi('/api/campus/chat/reaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userA.cookie },
      body: JSON.stringify({ messageId: 9999, emojis: ['👏', '✨'] }),
    })
    expect(reactRes.status).toBe(200)
    const reactJson = (await reactRes.json()) as { ok: boolean; messageId: number; reactions: string[] }
    expect(reactJson.ok).toBe(true)
    expect(reactJson.reactions).toEqual(['👏', '✨'])
  })
})
