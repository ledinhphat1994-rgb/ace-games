// Digital Campus v2: Milestone A1 — Room Policy Management Tests
// test/room-policy.test.ts
//
// Covers:
//   • Policy retrieval (GET /api/admin/room-policy)
//   • Policy validation & range bounds (PUT /api/admin/room-policy)
//   • Optimistic concurrency control (revision check & 409 Conflict)
//   • Audit trail recording in moderation_audit_logs (action = room_policy_update)
//   • RBAC authorization (only school admin allowed)

import { describe, it, expect } from 'vitest'
import { dangNhapLayCookie } from './ws'
import { adminFetch } from './admin-room-api.test'

describe('A1 — Campus Room Policy Management', () => {
  it('RBAC: non-admin gets 403 on GET /api/admin/room-policy', async () => {
    const studentCookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await adminFetch('/api/admin/room-policy', studentCookie)
    expect(res.status).toBe(403)
  })

  it('RBAC: non-admin gets 403 on PUT /api/admin/room-policy', async () => {
    const studentCookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await adminFetch('/api/admin/room-policy', studentCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 20,
      maxRoomLifetimeMinutes: 300,
    })
    expect(res.status).toBe(403)
  })

  it('Admin can retrieve current room lifecycle policy', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/room-policy', adminCookie)
    expect(res.status).toBe(200)

    const body = (await res.json()) as {
      ok: boolean
      policy: {
        autoCloseEnabled: boolean
        neverJoinedTtlMinutes: number
        emptyRoomTtlMinutes: number
        maxRoomLifetimeMinutes: number
        revision: number
      }
    }

    expect(body.ok).toBe(true)
    expect(typeof body.policy.autoCloseEnabled).toBe('boolean')
    expect(body.policy.neverJoinedTtlMinutes).toBeGreaterThanOrEqual(1)
    expect(body.policy.emptyRoomTtlMinutes).toBeGreaterThanOrEqual(1)
    expect(body.policy.maxRoomLifetimeMinutes).toBeGreaterThanOrEqual(5)
    expect(body.policy.revision).toBeGreaterThanOrEqual(1)
  })

  it('Rejects updates with out-of-range bounds (400)', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')

    // neverJoinedTtlMinutes < 1
    const r1 = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 0,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 300,
    })
    expect(r1.status).toBe(400)

    // neverJoinedTtlMinutes > 1440
    const r2 = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 2000,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 300,
    })
    expect(r2.status).toBe(400)

    // emptyRoomTtlMinutes < 1
    const r3 = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 0,
      maxRoomLifetimeMinutes: 300,
    })
    expect(r3.status).toBe(400)

    // maxRoomLifetimeMinutes < 5
    const r4 = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 2,
    })
    expect(r4.status).toBe(400)
  })

  it('Valid update succeeds, increments revision, and records audit log', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')

    // 1. Đọc chính sách hiện hành
    const getRes = await adminFetch('/api/admin/room-policy', adminCookie)
    const { policy: current } = (await getRes.json()) as { policy: { revision: number } }

    // 2. Cập nhật chính sách mới kèm expectedRevision
    const updateRes = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 12,
      emptyRoomTtlMinutes: 18,
      maxRoomLifetimeMinutes: 420,
      expectedRevision: current.revision,
    })
    expect(updateRes.status).toBe(200)

    const updateBody = (await updateRes.json()) as {
      ok: boolean
      policy: {
        autoCloseEnabled: boolean
        neverJoinedTtlMinutes: number
        emptyRoomTtlMinutes: number
        maxRoomLifetimeMinutes: number
        revision: number
      }
    }
    expect(updateBody.ok).toBe(true)
    expect(updateBody.policy.neverJoinedTtlMinutes).toBe(12)
    expect(updateBody.policy.emptyRoomTtlMinutes).toBe(18)
    expect(updateBody.policy.maxRoomLifetimeMinutes).toBe(420)
    expect(updateBody.policy.revision).toBe(current.revision + 1)

    // 3. Kiểm tra nhật ký kiểm toán trong moderation_audit_logs
    const auditRes = await adminFetch('/api/admin/audit-logs?action=room_policy_update', adminCookie)
    expect(auditRes.status).toBe(200)
    const auditBody = (await auditRes.json()) as {
      ok: boolean
      logs: Array<{ action: string; metadata: string }>
    }
    expect(auditBody.ok).toBe(true)
    expect(auditBody.logs.length).toBeGreaterThanOrEqual(1)
    const log = auditBody.logs[0]
    expect(log.action).toBe('room_policy_update')
    expect(log.metadata).toContain('420')
  })

  it('Optimistic locking: rejects update with mismatched expectedRevision (409)', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')

    // Gửi expectedRevision sai lệch (ví dụ 999999)
    const res = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 300,
      expectedRevision: 999999,
    })
    expect(res.status).toBe(409)
    const body = (await res.json()) as { ok: boolean; loi: string }
    expect(body.ok).toBe(false)
    expect(body.loi).toContain('Xung đột phiên bản')
  })
})
