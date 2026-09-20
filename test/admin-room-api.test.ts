// Digital Campus v2: Milestone A1 — Admin Room API Tests
// test/admin-room-api.test.ts
//
// Covers:
//   • GET /api/admin/rooms  — RBAC, pagination, status filter, search
//   • POST /api/admin/rooms/:id/close — force close with server-authoritative reason
//   • GET /api/admin/room-policy  — retrieve policy
//   • PUT /api/admin/room-policy  — validate & update policy
//   • GET /api/admin/audit-logs — paginated audit trail

import { exports, env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import { GOC } from './fixtures'
import { dangNhapLayCookie } from './ws'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Insert a study room directly into D1 and return its id */
async function insertRoom(
  name: string,
  options: { trangThai?: string; chuPhongKhoa?: string; everJoined?: number } = {},
): Promise<number> {
  const row = await env.DB.prepare(
    `INSERT INTO phong (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten, access_mode, suc_chua, trang_thai, ever_joined)
     VALUES ('video', ?1, 'truong', NULL, ?2, 'Chủ phòng', 'public', 20, ?3, ?4)
     RETURNING id`,
  )
    .bind(
      name,
      options.chuPhongKhoa ?? 'acc:1',
      options.trangThai ?? 'mo',
      options.everJoined ?? 0,
    )
    .first<{ id: number }>()
  if (!row) throw new Error('insertRoom failed')
  return row.id
}

/** Call admin API */
export async function adminFetch(path: string, cookie: string, method = 'GET', body?: unknown): Promise<Response> {
  return exports.default.fetch(`${GOC}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
      Origin: GOC,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as Promise<Response>
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('A1 — Admin Room API: RBAC', () => {
  it('403 for unauthenticated requests', async () => {
    const res = await adminFetch('/api/admin/rooms', '')
    expect(res.status).toBe(401)
  })

  it('403 for non-admin student', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await adminFetch('/api/admin/rooms', cookie)
    expect(res.status).toBe(403)
    const body = await res.json() as { ok: boolean; error: string }
    expect(body.ok).toBe(false)
    expect(body.error).toContain('quản trị')
  })

  it('403 for non-admin teacher', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.gv')
    const res = await adminFetch('/api/admin/rooms', cookie)
    expect(res.status).toBe(403)
  })

  it('200 for school admin', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/rooms', cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })
})

describe('A1 — Admin Room API: GET /api/admin/rooms', () => {
  it('returns AdminRoomItem shape with required fields', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    await insertRoom('Phòng Shape Test', { everJoined: 1 })
    const res = await adminFetch('/api/admin/rooms', cookie)
    const body = await res.json() as { ok: boolean; rooms: Array<Record<string, unknown>>; pagination: Record<string, number>; stats: Record<string, number> }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.rooms)).toBe(true)
    if (body.rooms.length > 0) {
      const room = body.rooms[0]
      expect(typeof room.id).toBe('number')
      expect(typeof room.name).toBe('string')
      expect(typeof room.ownerAccountId).toBe('number')
      expect(typeof room.ownerKey).toBe('string')
      expect(typeof room.ownerDisplayName).toBe('string')
      expect(['open', 'closing', 'closed']).toContain(room.lifecycleStatus)
      expect(typeof room.roomAgeMinutes).toBe('number')
      expect(body.rooms.every((r) => !('ten' in r))).toBe(true) // must not expose raw Vietnamese field
    }
    expect(typeof body.pagination.total).toBe('number')
    expect(typeof body.stats.openCount).toBe('number')
  })

  it('status=mo filter returns only open rooms', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    await insertRoom('Phòng Mở Filter', { trangThai: 'mo' })
    await insertRoom('Phòng Đóng Filter', { trangThai: 'dong' })
    const res = await adminFetch('/api/admin/rooms?status=mo', cookie)
    const body = await res.json() as { ok: boolean; rooms: Array<{ lifecycleStatus: string }> }
    expect(body.ok).toBe(true)
    body.rooms.forEach((r) => {
      expect(r.lifecycleStatus).toBe('open')
    })
  })

  it('search q= filters by room name', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const uniqueName = `UniqueTest_${Date.now()}`
    await insertRoom(uniqueName)
    const res = await adminFetch(`/api/admin/rooms?q=${encodeURIComponent(uniqueName)}`, cookie)
    const body = await res.json() as { ok: boolean; rooms: Array<{ name: string }> }
    expect(body.ok).toBe(true)
    expect(body.rooms.length).toBeGreaterThanOrEqual(1)
    expect(body.rooms.some((r) => r.name === uniqueName)).toBe(true)
  })

  it('pagination: limit=2 returns at most 2 rooms', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/rooms?limit=2', cookie)
    const body = await res.json() as { ok: boolean; rooms: unknown[] }
    expect(body.ok).toBe(true)
    expect(body.rooms.length).toBeLessThanOrEqual(2)
  })
})

describe('A1 — Admin Room API: POST /api/admin/rooms/:id/close', () => {
  it('non-admin cannot force close', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const id = await insertRoom('Phòng Không Cho Close')
    const res = await adminFetch(`/api/admin/rooms/${id}/close`, cookie, 'POST', { reason: 'test' })
    expect(res.status).toBe(403)
  })

  it('admin can force close an open room', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const id = await insertRoom(`Phòng Admin Close ${Date.now()}`)
    const res = await adminFetch(`/api/admin/rooms/${id}/close`, cookie, 'POST', { reason: 'Đóng để kiểm tra' })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)

    // Verify status updated in D1
    const row = await env.DB.prepare('SELECT trang_thai FROM phong WHERE id = ?').bind(id).first<{ trang_thai: string }>()
    expect(row?.trang_thai).toMatch(/dong|closing/)
  })

  it('closing already-closed room returns 409', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const id = await insertRoom('Phòng Đã Đóng', { trangThai: 'dong' })
    const res = await adminFetch(`/api/admin/rooms/${id}/close`, cookie, 'POST', { reason: 'double close' })
    expect(res.status).toBe(409)
  })

  it('closing non-existent room returns 404', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/rooms/99999999/close', cookie, 'POST', { reason: 'test' })
    expect(res.status).toBe(404)
  })
})

describe('A1 — Admin Room API: Room Lifecycle Policy', () => {
  it('GET /api/admin/room-policy returns policy object', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/room-policy', cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean; policy: Record<string, unknown> }
    expect(body.ok).toBe(true)
    expect(typeof body.policy.autoCloseEnabled).toBe('boolean')
    expect(typeof body.policy.neverJoinedTtlMinutes).toBe('number')
    expect(typeof body.policy.emptyRoomTtlMinutes).toBe('number')
    expect(typeof body.policy.maxRoomLifetimeMinutes).toBe('number')
    expect(typeof body.policy.revision).toBe('number')
  })

  it('PUT /api/admin/room-policy non-admin → 403', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await adminFetch('/api/admin/room-policy', cookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 10,
      emptyRoomTtlMinutes: 30,
      maxRoomLifetimeMinutes: 480,
    })
    expect(res.status).toBe(403)
  })

  it('PUT /api/admin/room-policy with invalid ranges → 400', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/room-policy', cookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 0, // below min of 1
      emptyRoomTtlMinutes: 30,
      maxRoomLifetimeMinutes: 480,
    })
    expect(res.status).toBe(400)
  })

  it('PUT /api/admin/room-policy valid update succeeds', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    // Get current revision first
    const getRes = await adminFetch('/api/admin/room-policy', cookie)
    const { policy } = await getRes.json() as { policy: { revision: number } }

    const res = await adminFetch('/api/admin/room-policy', cookie, 'PUT', {
      autoCloseEnabled: true,
      neverJoinedTtlMinutes: 15,
      emptyRoomTtlMinutes: 60,
      maxRoomLifetimeMinutes: 720,
      expectedRevision: policy.revision,
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean; policy: { neverJoinedTtlMinutes: number } }
    expect(body.ok).toBe(true)
    expect(body.policy.neverJoinedTtlMinutes).toBe(15)
  })
})

describe('A1 — Admin Room API: GET /api/admin/audit-logs', () => {
  it('non-admin → 403', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.thu1')
    const res = await adminFetch('/api/admin/audit-logs', cookie)
    expect(res.status).toBe(403)
  })

  it('admin can list audit logs', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/audit-logs', cookie)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean; logs: unknown[]; total: number }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.logs)).toBe(true)
    expect(typeof body.total).toBe('number')
  })

  it('pagination: limit=5 returns at most 5 entries', async () => {
    const cookie = await dangNhapLayCookie('qa.v2.admin')
    const res = await adminFetch('/api/admin/audit-logs?limit=5', cookie)
    const body = await res.json() as { ok: boolean; logs: unknown[] }
    expect(body.ok).toBe(true)
    expect(body.logs.length).toBeLessThanOrEqual(5)
  })
})
