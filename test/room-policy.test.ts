// Digital Campus v2: Milestone A1 — Room Policy Management Tests
// test/room-policy.test.ts
//
// Covers:
//   • Policy retrieval (GET /api/admin/room-policy)
//   • Policy validation & range bounds (PUT /api/admin/room-policy)
//   • Optimistic concurrency control (revision check & 409 Conflict)
//   • Audit trail recording in moderation_audit_logs (action = room_policy_update)
//   • RBAC authorization (only school admin allowed)

import { exports, env } from 'cloudflare:workers'
import { describe, it, expect } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'
import { adminFetch } from './admin-room-api.test'
import type { AdminRoomItem } from '../shared/protocol/room'

async function apiFetch(path: string, cookie: string, method = 'GET', body?: unknown): Promise<Response> {
  const init: RequestInit = {
    method,
    headers: {
      Cookie: cookie,
      Origin: GOC,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
  }
  if (body) init.body = JSON.stringify(body)
  return exports.default.fetch(`${GOC}${path}`, init) as Promise<Response>
}

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

  it('Policy snapshot per room: Room A keeps snapshot, Room B gets new policy, deadlines reflect individual snapshots', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')
    const ownerCookie = await dangNhapLayCookie('qa.v2.thu1')

    // 1. Cấu hình chính sách A: 5 / 15 / 480
    const curRes = await adminFetch('/api/admin/room-policy', adminCookie)
    const { policy: curPolicy } = (await curRes.json()) as { policy: { revision: number } }

    const setPolicyA = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 5,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 480,
      expectedRevision: curPolicy.revision,
    })
    expect(setPolicyA.status).toBe(200)

    // 2. Tạo Phòng A dưới chính sách A
    const roomARes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Snapshot A',
      phamVi: 'truong',
      accessMode: 'public',
    })
    expect(roomARes.status).toBe(201)
    const { room: roomA } = (await roomARes.json()) as { room: { id: number } }

    // Kiểm tra snapshot của Phòng A trong D1
    const rowA = await env.DB.prepare(
      'SELECT lifecycle_never_joined_ttl_minutes, lifecycle_empty_room_ttl_minutes, lifecycle_max_lifetime_minutes FROM phong WHERE id = ?1',
    )
      .bind(roomA.id)
      .first<{
        lifecycle_never_joined_ttl_minutes: number
        lifecycle_empty_room_ttl_minutes: number
        lifecycle_max_lifetime_minutes: number
      }>()
    expect(rowA!.lifecycle_never_joined_ttl_minutes).toBe(5)
    expect(rowA!.lifecycle_empty_room_ttl_minutes).toBe(15)
    expect(rowA!.lifecycle_max_lifetime_minutes).toBe(480)

    // Kiểm tra RoomDO của Phòng A nhận đúng snapshot qua /internal/lifecycle/init
    const doAId = env.ROOMS.idFromName(`phong-${roomA.id}`)
    const doAStub = env.ROOMS.get(doAId)
    const doAState = (await (await doAStub.fetch('http://room.internal/internal/lifecycle/state')).json()) as any
    expect(doAState.lifecycle.neverJoinedTtlMinutes).toBe(5)
    expect(doAState.lifecycle.emptyRoomTtlMinutes).toBe(15)
    expect(doAState.lifecycle.maxRoomLifetimeMinutes).toBe(480)

    // 3. Đổi chính sách toàn cục sang chính sách B: 10 / 20 / 600
    const polARes = await adminFetch('/api/admin/room-policy', adminCookie)
    const { policy: polA } = (await polARes.json()) as { policy: { revision: number } }

    const setPolicyB = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 20,
      maxRoomLifetimeMinutes: 600,
      expectedRevision: polA.revision,
    })
    expect(setPolicyB.status).toBe(200)

    // 4. Xác nhận Phòng A KHÔNG bị thay đổi (giữ nguyên 5 / 15 / 480)
    const rowAAfter = await env.DB.prepare(
      'SELECT lifecycle_never_joined_ttl_minutes, lifecycle_empty_room_ttl_minutes, lifecycle_max_lifetime_minutes FROM phong WHERE id = ?1',
    )
      .bind(roomA.id)
      .first<{
        lifecycle_never_joined_ttl_minutes: number
        lifecycle_empty_room_ttl_minutes: number
        lifecycle_max_lifetime_minutes: number
      }>()
    expect(rowAAfter!.lifecycle_never_joined_ttl_minutes).toBe(5)

    const doAStateAfter = (await (await doAStub.fetch('http://room.internal/internal/lifecycle/state')).json()) as any
    expect(doAStateAfter.lifecycle.neverJoinedTtlMinutes).toBe(5)

    // 5. Tạo Phòng B -> Phòng B nhận chính sách B: 10 / 20 / 600
    const roomBRes = await apiFetch('/api/rooms', ownerCookie, 'POST', {
      ten: 'Phòng Snapshot B',
      phamVi: 'truong',
      accessMode: 'public',
    })
    expect(roomBRes.status).toBe(201)
    const { room: roomB } = (await roomBRes.json()) as { room: { id: number } }

    const rowB = await env.DB.prepare(
      'SELECT lifecycle_never_joined_ttl_minutes, lifecycle_empty_room_ttl_minutes, lifecycle_max_lifetime_minutes FROM phong WHERE id = ?1',
    )
      .bind(roomB.id)
      .first<{
        lifecycle_never_joined_ttl_minutes: number
        lifecycle_empty_room_ttl_minutes: number
        lifecycle_max_lifetime_minutes: number
      }>()
    expect(rowB!.lifecycle_never_joined_ttl_minutes).toBe(10)
    expect(rowB!.lifecycle_empty_room_ttl_minutes).toBe(20)
    expect(rowB!.lifecycle_max_lifetime_minutes).toBe(600)

    const doBId = env.ROOMS.idFromName(`phong-${roomB.id}`)
    const doBStub = env.ROOMS.get(doBId)
    const doBState = (await (await doBStub.fetch('http://room.internal/internal/lifecycle/state')).json()) as any
    expect(doBState.lifecycle.neverJoinedTtlMinutes).toBe(10)
    expect(doBState.lifecycle.emptyRoomTtlMinutes).toBe(20)
    expect(doBState.lifecycle.maxRoomLifetimeMinutes).toBe(600)

    // 6. Kiểm tra Admin Directory list:
    // Phòng A tính autoCloseDeadline từ snapshot 5m
    // Phòng B tính autoCloseDeadline từ snapshot 10m
    const listRes = await adminFetch('/api/admin/rooms?limit=50', adminCookie)
    expect(listRes.status).toBe(200)
    const listBody = (await listRes.json()) as { ok: boolean; rooms: AdminRoomItem[] }
    expect(listBody.ok).toBe(true)

    const itemA = listBody.rooms.find((r) => r.id === roomA.id)
    const itemB = listBody.rooms.find((r) => r.id === roomB.id)
    expect(itemA).toBeDefined()
    expect(itemB).toBeDefined()

    expect(itemA!.effectiveNeverJoinedTtl).toBe(5)
    expect(itemA!.effectiveEmptyRoomTtl).toBe(15)
    expect(itemA!.effectiveMaxLifetime).toBe(480)
    expect(itemA!.autoCloseDeadline).toBe(itemA!.createdAt + 5 * 60 * 1000)

    expect(itemB!.effectiveNeverJoinedTtl).toBe(10)
    expect(itemB!.effectiveEmptyRoomTtl).toBe(20)
    expect(itemB!.effectiveMaxLifetime).toBe(600)
    expect(itemB!.autoCloseDeadline).toBe(itemB!.createdAt + 10 * 60 * 1000)

    // 7. Khôi phục lại chính sách chuẩn 5 / 15 / 480
    const finalPolRes = await adminFetch('/api/admin/room-policy', adminCookie)
    const { policy: finalPol } = (await finalPolRes.json()) as { policy: { revision: number } }
    await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 5,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 480,
      expectedRevision: finalPol.revision,
    })
  })

  it('No RoomDO fan-out: saving policy is bounded O(1) operationally', async () => {
    const adminCookie = await dangNhapLayCookie('qa.v2.admin')

    const getRes = await adminFetch('/api/admin/room-policy', adminCookie)
    const { policy } = (await getRes.json()) as { policy: { revision: number } }

    const t0 = Date.now()
    const updateRes = await adminFetch('/api/admin/room-policy', adminCookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 5,
      emptyRoomTtlMinutes: 15,
      maxRoomLifetimeMinutes: 480,
      expectedRevision: policy.revision,
    })
    const duration = Date.now() - t0

    expect(updateRes.status).toBe(200)
    // Hoàn tất cực nhanh O(1) vì không fan-out tới các RoomDO
    expect(duration).toBeLessThan(1000)
  })
})
