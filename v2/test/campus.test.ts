import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import type { GoiCampus } from '../shared/protocol/campus'
import { dangNhapLayCookie, moKetNoi } from './ws'

const moCampus = (cookie: string, origin?: string) => moKetNoi<GoiCampus>('/ws/campus', cookie, origin)

describe('Campus real-time (CampusDO)', () => {
  it('trang web lạ mở kết nối -> 403, chưa đăng nhập -> 401', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    expect((await moCampus(cookie, 'https://trang-la.example')).status).toBe(403)
    expect((await moCampus('')).status).toBe(401)
  })

  it('snapshot có số người online; người khác vào hoặc ra thì số online cập nhật cho mọi người', async () => {
    const a = await moCampus(await dangNhapLayCookie('qa.v2.thu1'))
    expect(a.status).toBe(101)
    const snap = await a.cho('snapshot')
    expect(snap.online).toBe(1)
    expect(snap.me.xoaMoiTin).toBe(false)

    const b = await moCampus(await dangNhapLayCookie('qa.v2.thu2'))
    expect((await b.cho('snapshot')).online).toBe(2)
    await a.cho('online', (g) => g.count === 2)

    b.dong()
    await a.cho('online', (g) => g.count === 1)
    a.dong()
  })

  it('chat: tin tới mọi người và lưu D1; tin rỗng, quá dài, không phải JSON hoặc gửi dồn đều bị từ chối', async () => {
    const a = await moCampus(await dangNhapLayCookie('qa.v2.thu1'))
    const b = await moCampus(await dangNhapLayCookie('qa.v2.thu2'))
    await a.cho('snapshot')
    await b.cho('snapshot')

    a.gui({ type: 'chat.send', reqId: 'r1', text: '  Chào cả lớp​  ' })
    await a.cho('ack', (g) => g.reqId === 'r1')
    await a.cho('chat.msg')
    const tin = (await b.cho('chat.msg')).message
    expect(tin).toMatchObject({ ten: 'QA Thử nghiệm 1', vaiTro: 'hoc_sinh', lopTen: '10A7 Thử nghiệm', noiDung: 'Chào cả lớp' })
    const dong = await env.DB.prepare('SELECT content, role, sender_account_id AS acc FROM campus_chat_message WHERE id = ?1')
      .bind(tin.id)
      .first()
    expect(dong).toEqual({ content: 'Chào cả lớp', role: 'student', acc: tin.accountId })

    a.gui({ type: 'chat.send', reqId: 'r2', text: 'gửi dồn' })
    expect((await a.cho('error', (g) => g.reqId === 'r2')).code).toBe('rate_limited')

    b.gui({ type: 'chat.send', reqId: 'r3', text: '   ' })
    expect((await b.cho('error', (g) => g.reqId === 'r3')).code).toBe('invalid_payload')
    b.gui({ type: 'chat.send', reqId: 'r4', text: 'x'.repeat(501) })
    expect((await b.cho('error', (g) => g.reqId === 'r4')).code).toBe('invalid_payload')
    b.gui('khong phai json')
    expect((await b.cho('error')).code).toBe('invalid_payload')
    await a.khongNhan('chat.msg')
    a.dong()
    b.dong()
  })

  it('xoá tin: người khác không xoá được; người gửi tự xoá trong 15 phút; giáo viên xoá mọi tin; mọi người đều nhận chat.deleted', async () => {
    const a = await moCampus(await dangNhapLayCookie('qa.v2.thu1'))
    const b = await moCampus(await dangNhapLayCookie('qa.v2.thu2'))
    const gv = await moCampus(await dangNhapLayCookie('qa.v2.gv'))
    const snapA = await a.cho('snapshot')
    await b.cho('snapshot')
    expect((await gv.cho('snapshot')).me.xoaMoiTin).toBe(true)

    const tinCu = await env.DB.prepare(
      `INSERT INTO campus_chat_message (sender_account_id, display_name, role, content, created_at)
       VALUES (?1, 'QA Thử nghiệm 1', 'student', 'tin cũ', datetime('now', '-20 minutes')) RETURNING id`,
    )
      .bind(snapA.me.accountId)
      .first<{ id: number }>()
    const idCu = tinCu?.id ?? 0

    b.gui({ type: 'chat.send', reqId: 'm', text: 'tin mới của B' })
    const moi = (await a.cho('chat.msg', (g) => g.message.noiDung === 'tin mới của B')).message

    a.gui({ type: 'chat.delete', reqId: 'x1', id: moi.id })
    expect((await a.cho('error', (g) => g.reqId === 'x1')).code).toBe('forbidden')
    b.gui({ type: 'chat.delete', reqId: 'x2', id: moi.id })
    await b.cho('ack', (g) => g.reqId === 'x2')
    await a.cho('chat.deleted', (g) => g.id === moi.id)
    await gv.cho('chat.deleted', (g) => g.id === moi.id)

    a.gui({ type: 'chat.delete', reqId: 'x3', id: idCu })
    expect((await a.cho('error', (g) => g.reqId === 'x3')).code).toBe('forbidden')
    gv.gui({ type: 'chat.delete', reqId: 'x4', id: idCu })
    await gv.cho('ack', (g) => g.reqId === 'x4')
    await a.cho('chat.deleted', (g) => g.id === idCu)
    const daXoa = await env.DB.prepare('SELECT deleted_at FROM campus_chat_message WHERE id = ?1')
      .bind(idCu)
      .first<{ deleted_at: string | null }>()
    expect(daXoa?.deleted_at).not.toBeNull()

    b.gui({ type: 'chat.delete', reqId: 'x5', id: moi.id })
    expect((await b.cho('error', (g) => g.reqId === 'x5')).code).toBe('not_found')
    a.dong()
    b.dong()
    gv.dong()
  })

  it('đăng nhập ở thiết bị khác -> kết nối Campus cũ nhận session.replaced và bị đóng 4001', async () => {
    const cu = await moCampus(await dangNhapLayCookie('qa.v2.thu3'))
    await cu.cho('snapshot')
    await dangNhapLayCookie('qa.v2.thu3')
    await cu.cho('session.replaced')
    expect((await cu.choDong()).code).toBe(4001)
  })
})
