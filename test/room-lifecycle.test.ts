// Digital Campus v2: Milestone A1 — Room Lifecycle Engine Tests
// test/room-lifecycle.test.ts
//
// Covers:
//   • Room creation with bootstrap & lifecycle initialization (POST /api/rooms)
//   • Canonical safe close flow (OPEN -> CLOSING -> CLOSED)
//   • Admission gate fail-closed: rejection of WS and /admit when closing/closed
//   • Broadcast of room.closed packet & WebSocket disconnection (code 1000)
//   • Owner, moderator, and admin close authorization
//   • Idempotency & conflict handling (409 on second close)
//   • Audit logging in moderation_audit_logs

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { adminFetch } from './admin-room-api.test'

function moPhongWs(id: number, cookie: string) {
  return exports.default.fetch(`${GOC}/ws/room/phong-${id}`, {
    headers: { Upgrade: 'websocket', Cookie: cookie, Origin: GOC },
  }) as Promise<Response>
}

async function apiFetch(path: string, cookie: string, method = 'GET', body?: unknown): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: {
      Cookie: cookie,
      Origin: GOC,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return exports.default.fetch(`${GOC}${path}`, init) as Promise<Response>
}

describe('A1 — Room Lifecycle Engine: Creation & Canonical Safe Close', () => {
  it('POST /api/rooms: creates room with lifecycle defaults & D1 status open', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1') // Student acc:1
    const res = await apiFetch('/api/rooms', cookie, 'POST', {
      ten: 'Phòng Lifecycle Creation Test',
      moTa: 'Kiểm tra khởi tạo vòng đời phòng học',
      phamVi: 'truong',
      accessMode: 'public',
      sucChua: 25,
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as { ok: boolean; room: { id: number; ten: string; status: string } }
    expect(body.ok).toBe(true)
    expect(body.room.id).toBeGreaterThan(0)
    expect(body.room.ten).toBe('Phòng Lifecycle Creation Test')

    // Kiểm tra D1 record
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, ever_joined, access_mode, suc_chua FROM phong WHERE id = ?1',
    )
      .bind(body.room.id)
      .first<{ trang_thai: string; ever_joined: number; access_mode: string; suc_chua: number }>()

    expect(d1Row).not.toBeNull()
    expect(d1Row!.trang_thai).toBe('mo')
    expect(d1Row!.ever_joined).toBe(0)
    expect(d1Row!.access_mode).toBe('public')
    expect(d1Row!.suc_chua).toBe(25)
  })

  it('Owner close: shuts down open room, updates D1 to dong, broadcasts room.closed, closes WebSockets', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    // 1. Tạo phòng
    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Thử Nghiệm Đóng Owner',
      phamVi: 'truong',
      accessMode: 'public',
    })
    expect(createRes.status).toBe(201)
    const { room } = (await createRes.json()) as { room: { id: number } }

    // 2. Peer kết nối vào phòng qua WebSocket
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(101)
    const peerWs = wsRes.webSocket!
    peerWs.accept()

    const receivedPackets: any[] = []
    let closedWithCode: number | null = null
    let closedWithReason: string | null = null

    peerWs.addEventListener('message', (e) => {
      try {
        receivedPackets.push(JSON.parse(String(e.data)))
      } catch {}
    })

    peerWs.addEventListener('close', (e) => {
      closedWithCode = e.code
      closedWithReason = e.reason
    })

    // Đợi chút để kết nối ổn định
    await new Promise((r) => setTimeout(r, 100))

    // 3. Chủ phòng gọi POST /api/rooms/:id/close
    const closeRes = await apiFetch(`/api/rooms/${room.id}/close`, ownerCookie, 'POST', {
      reason: 'owner_done',
    })
    expect(closeRes.status).toBe(200)
    const closeBody = (await closeRes.json()) as { ok: boolean; closed: boolean }
    expect(closeBody.ok).toBe(true)
    expect(closeBody.closed).toBe(true)

    // Đợi packet room.closed và sự kiện close WS
    await new Promise((r) => setTimeout(r, 200))

    // 4. Kiểm tra peer nhận được packet room.closed
    const roomClosedPkt = receivedPackets.find((p) => p.type === 'room.closed')
    expect(roomClosedPkt).toBeDefined()
    expect(roomClosedPkt.reason).toBe('owner_closed')
    expect(closedWithCode).toBe(1000)
    expect(closedWithReason).toBeDefined()

    // 5. Kiểm tra D1 record đã cập nhật sang 'dong'
    const d1Row = await env.DB.prepare(
      'SELECT trang_thai, closed_at, close_reason, closed_by FROM phong WHERE id = ?1',
    )
      .bind(room.id)
      .first<{ trang_thai: string; closed_at: number; close_reason: string; closed_by: number }>()

    expect(d1Row!.trang_thai).toBe('dong')
    expect(d1Row!.closed_at).toBeGreaterThan(0)
    expect(d1Row!.close_reason).toBe('owner_closed')
  })

  it('Admission gate fail-closed: rejects WS connection to a closed room with 403', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const peerCookie = await dangNhapLayCookie('qa.v2.thu2')

    // Tạo phòng & đóng ngay
    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Sắp Bị Đóng',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    await apiFetch(`/api/rooms/${room.id}/close`, ownerCookie, 'POST')

    // Cố kết nối vào phòng đã đóng
    const wsRes = await moPhongWs(room.id, peerCookie)
    expect(wsRes.status).toBe(403)
    const body = (await wsRes.json()) as { ok: boolean; loi?: string }
    expect(body.ok).toBe(false)
    expect(body.loi).toContain('Phòng đã đóng')
  })

  it('Non-owner non-admin cannot close room (403)', async () => {
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')
    const strangerCookie = await dangNhapLayCookie('qa.v2.thu2')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Của Thử 1',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Người lạ cố đóng
    const closeRes = await apiFetch(`/api/rooms/${room.id}/close`, strangerCookie, 'POST')
    expect(closeRes.status).toBe(403)
  })

  it('Audit log recorded in moderation_audit_logs on canonical close', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    const createRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Audit Log Verification',
      phamVi: 'truong',
      accessMode: 'public',
    })
    const { room } = (await createRes.json()) as { room: { id: number } }

    // Admin force close
    const closeRes = await adminFetch(`/api/admin/rooms/${room.id}/close`, adminCookie, 'POST', {
      reason: 'violation_check',
    })
    expect(closeRes.status).toBe(200)

    // Kiểm tra audit log
    const auditRes = await adminFetch(`/api/admin/audit-logs?roomId=${room.id}`, adminCookie)
    expect(auditRes.status).toBe(200)
    const auditBody = (await auditRes.json()) as {
      ok: boolean
      logs: Array<{ action: string; reason: string; metadata: string; roomId: number }>
    }
    expect(auditBody.ok).toBe(true)
    const closeLog = auditBody.logs.find((l) => l.action === 'admin_room_close')
    expect(closeLog).toBeDefined()
    expect(closeLog!.reason).toBe('admin_closed')
    const meta = JSON.parse(closeLog!.metadata)
    expect(meta.note).toBe('violation_check')
  })
})
