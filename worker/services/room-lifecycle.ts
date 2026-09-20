// Digital Campus v2: Milestone A1 — Admin Control Plane & Room Lifecycle Management
// Canonical Server-Authoritative Room Lifecycle Service

import type { RoomLifecyclePolicy, UpdateRoomPolicyPayload } from '../../shared/protocol/room'
import { recordAnalyticsEvent } from '../lib/analytics'
import type { TaiKhoan } from '../lib/session'

export const DEFAULT_ROOM_POLICY: RoomLifecyclePolicy = {
  id: 1,
  autoCloseEnabled: true,
  neverJoinedTtlMinutes: 5,
  emptyRoomTtlMinutes: 15,
  maxRoomLifetimeMinutes: 480,
  updatedAt: 0,
  revision: 1,
}

export async function getRoomLifecyclePolicy(db: D1Database): Promise<RoomLifecyclePolicy> {
  try {
    const row = await db
      .prepare(
        `SELECT id, auto_close_enabled AS autoCloseEnabled,
                never_joined_ttl_minutes AS neverJoinedTtlMinutes,
                empty_room_ttl_minutes AS emptyRoomTtlMinutes,
                max_room_lifetime_minutes AS maxRoomLifetimeMinutes,
                updated_at AS updatedAt, updated_by AS updatedBy, revision
         FROM campus_room_policy WHERE id = 1`,
      )
      .first<{
        id: number
        autoCloseEnabled: number
        neverJoinedTtlMinutes: number
        emptyRoomTtlMinutes: number
        maxRoomLifetimeMinutes: number
        updatedAt: number
        updatedBy: number | null
        revision: number
      }>()

    if (!row) return DEFAULT_ROOM_POLICY

    return {
      id: row.id,
      autoCloseEnabled: Boolean(row.autoCloseEnabled),
      neverJoinedTtlMinutes: Number(row.neverJoinedTtlMinutes) || 5,
      emptyRoomTtlMinutes: Number(row.emptyRoomTtlMinutes) || 15,
      maxRoomLifetimeMinutes: Number(row.maxRoomLifetimeMinutes) || 480,
      updatedAt: Number(row.updatedAt) || Date.now(),
      updatedBy: row.updatedBy ?? null,
      revision: Number(row.revision) || 1,
    }
  } catch (err) {
    console.warn('[RoomLifecycle] Không thể đọc campus_room_policy từ D1, dùng mặc định:', err)
    return DEFAULT_ROOM_POLICY
  }
}

export async function updateRoomLifecyclePolicy(
  db: D1Database,
  actor: TaiKhoan,
  payload: UpdateRoomPolicyPayload,
): Promise<{ ok: boolean; policy?: RoomLifecyclePolicy; error?: string }> {
  const current = await getRoomLifecyclePolicy(db)
  if (payload.expectedRevision && payload.expectedRevision !== current.revision) {
    return {
      ok: false,
      error: `Xung đột phiên bản chính sách: phiên bản hiện tại là ${current.revision}, yêu cầu gửi lên là ${payload.expectedRevision}. Vui lòng tải lại.`,
    }
  }

  const now = Date.now()
  const newRevision = current.revision + 1

  try {
    const res = await db
      .prepare(
        `UPDATE campus_room_policy
         SET auto_close_enabled = ?1,
             never_joined_ttl_minutes = ?2,
             empty_room_ttl_minutes = ?3,
             max_room_lifetime_minutes = ?4,
             updated_at = ?5,
             updated_by = ?6,
             revision = ?7
         WHERE id = 1 AND revision = ?8`,
      )
      .bind(
        payload.autoCloseEnabled ? 1 : 0,
        payload.neverJoinedTtlMinutes,
        payload.emptyRoomTtlMinutes,
        payload.maxRoomLifetimeMinutes,
        now,
        actor.id,
        newRevision,
        current.revision,
      )
      .run()

    if (!res.success || (res.meta.changes ?? 0) === 0) {
      return { ok: false, error: 'Cập nhật chính sách thất bại do xung đột đồng thời.' }
    }

    // Ghi nhận audit log
    await db
      .prepare(
        `INSERT INTO moderation_audit_logs (actor_id, target_id, room_id, action, reason, metadata, created_at)
         VALUES (?1, NULL, NULL, 'room_policy_update', ?2, ?3, ?4)`,
      )
      .bind(
        actor.id,
        'Cập nhật chính sách dọn dẹp phòng học',
        JSON.stringify({
          previous: current,
          updated: {
            autoCloseEnabled: payload.autoCloseEnabled,
            neverJoinedTtlMinutes: payload.neverJoinedTtlMinutes,
            emptyRoomTtlMinutes: payload.emptyRoomTtlMinutes,
            maxRoomLifetimeMinutes: payload.maxRoomLifetimeMinutes,
            revision: newRevision,
          },
        }),
        now,
      )
      .run()

    const updatedPolicy: RoomLifecyclePolicy = {
      id: 1,
      autoCloseEnabled: payload.autoCloseEnabled,
      neverJoinedTtlMinutes: payload.neverJoinedTtlMinutes,
      emptyRoomTtlMinutes: payload.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: payload.maxRoomLifetimeMinutes,
      updatedAt: now,
      updatedBy: actor.id,
      revision: newRevision,
    }

    return { ok: true, policy: updatedPolicy }
  } catch (err: any) {
    console.error('[RoomLifecycle] Lỗi ghi campus_room_policy:', err)
    return { ok: false, error: 'Lỗi cơ sở dữ liệu khi lưu chính sách: ' + (err.message || String(err)) }
  }
}

export interface CloseActor {
  type: 'admin' | 'owner' | 'system' | 'moderator'
  accountId?: number | null
  name?: string
}

export interface CloseResult {
  ok: boolean
  alreadyClosed?: boolean
  notFound?: boolean
  closedSocketsCount?: number
  error?: string
}

/**
 * HÀM ĐÓNG PHÒNG CHUẨN MỰC (Canonical Safe Close Flow)
 * Tuân thủ bất biến mục 5 & 15:
 * 1. D1 chuyển OPEN -> CLOSING (khóa ngay cổng admission, fail-closed)
 * 2. Gửi RPC nội bộ tới RoomDO: phát room.closed, dọn dẹp WebSockets & voice, chốt Learning Session
 * 3. D1 chuyển CLOSING -> CLOSED (lưu closed_at, close_reason, closed_by)
 * 4. Ghi nhận audit trail trong moderation_audit_logs
 */
export async function closeStudyRoomCanonical(
  env: Env,
  roomId: number,
  actor: CloseActor,
  reason?: string,
): Promise<CloseResult> {
  const now = Date.now()
  const db = env.DB

  // 1. Kiểm tra trạng thái hiện thời của phòng
  let roomRow: {
    id: number
    trang_thai: string
    chu_phong_khoa: string
    chu_phong_ten: string
  } | null = null

  try {
    roomRow = await db
      .prepare('SELECT id, trang_thai, chu_phong_khoa, chu_phong_ten FROM phong WHERE id = ?1')
      .bind(roomId)
      .first<{
        id: number
        trang_thai: string
        chu_phong_khoa: string
        chu_phong_ten: string
      }>()
  } catch (err: any) {
    console.error(`[RoomLifecycle.close] Lỗi đọc phòng ${roomId}:`, err)
    return { ok: false, error: 'Không thể truy vấn thông tin phòng học.' }
  }

  if (!roomRow) {
    return { ok: false, notFound: true, error: 'Không tìm thấy phòng học.' }
  }

  // Idempotent: phòng đã đóng hoặc đang đóng hoàn toàn từ trước
  if (roomRow.trang_thai === 'dong' || roomRow.trang_thai === 'closing') {
    return { ok: true, alreadyClosed: true, closedSocketsCount: 0 }
  }

  const effectiveReason =
    reason ||
    (actor.type === 'admin'
      ? 'admin_closed'
      : actor.type === 'owner'
        ? 'owner_closed'
        : actor.type === 'moderator'
          ? 'moderation'
          : 'system_cleanup')

  const actorId = actor.accountId ?? null

  // 2. Chuyển trạng thái D1: OPEN -> CLOSING
  // Nếu phòng đang ở trạng thái 'mo', chuyển sang 'closing' để ngay lập tức từ chối mọi yêu cầu admission mới.
  if (roomRow.trang_thai === 'mo') {
    try {
      const step1 = await db
        .prepare(
          `UPDATE phong
           SET trang_thai = 'closing',
               closing_at = ?1,
               closed_by = ?2,
               close_reason = ?3,
               lifecycle_revision = lifecycle_revision + 1,
               cap_nhat_luc = datetime('now')
           WHERE id = ?4 AND trang_thai = 'mo'`,
        )
        .bind(now, actorId, effectiveReason, roomId)
        .run()

      if (!step1.success) {
        return { ok: false, error: 'Không thể cập nhật trạng thái phòng sang CLOSING.' }
      }

      if ((step1.meta.changes ?? 0) === 0) {
        // Một tiến trình khác vừa cập nhật trạng thái đồng thời
        return { ok: true, alreadyClosed: true, closedSocketsCount: 0 }
      }
    } catch (err: any) {
      console.error(`[RoomLifecycle.close] Lỗi D1 chuyển sang CLOSING cho phòng ${roomId}:`, err)
      return { ok: false, error: 'Lỗi D1 khi chuyển phòng sang trạng thái đóng.' }
    }
  }

  // 3. Gửi lệnh đóng nội bộ tới RoomDO
  let closedSocketsCount = 0
  let doRpcSuccess = false
  try {
    const doId = env.ROOMS.idFromName(`phong-${roomId}`)
    const roomStub = env.ROOMS.get(doId)
    const doRes = await roomStub.fetch('https://room.internal/internal/lifecycle/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: effectiveReason,
        closedByAccountId: actorId,
        closedByName: actor.name ?? 'Quản trị viên',
        actorType: actor.type,
      }),
    })

    if (doRes.ok) {
      const body = (await doRes.json()) as { ok: boolean; closedCount?: number }
      closedSocketsCount = body.closedCount ?? 0
      doRpcSuccess = true
    } else {
      console.warn(`[RoomLifecycle.close] RoomDO /internal/lifecycle/close trả về status ${doRes.status}`)
    }
  } catch (err) {
    console.error(`[RoomLifecycle.close] Ngoại lệ khi gọi RoomDO close RPC cho phòng ${roomId}:`, err)
  }

  // 4. Chuyển trạng thái D1 sang CLOSED: CLOSING -> DONG
  try {
    await db
      .prepare(
        `UPDATE phong
         SET trang_thai = 'dong',
             closed_at = ?1,
             closed_by = ?2,
             close_reason = ?3,
             lifecycle_revision = lifecycle_revision + 1,
             cap_nhat_luc = datetime('now')
         WHERE id = ?4 AND (trang_thai = 'closing' OR trang_thai = 'mo')`,
      )
      .bind(now, actorId, effectiveReason, roomId)
      .run()
  } catch (err: any) {
    console.error(`[RoomLifecycle.close] Lỗi D1 chuyển sang CLOSED cho phòng ${roomId}:`, err)
    // Nếu DO đã đóng mà D1 update lỗi, báo lại một cách trung thực (Section 22)
    if (doRpcSuccess) {
      return {
        ok: false,
        error: 'Phòng đã ngắt kết nối trực tiếp nhưng chưa thể chốt trạng thái lưu trữ trên D1.',
      }
    }
    return { ok: false, error: 'Lỗi cơ sở dữ liệu khi đóng phòng.' }
  }

  // 5. Ghi nhận nhật ký kiểm duyệt / kiểm toán (Audit Trail)
  const auditAction =
    actor.type === 'admin'
      ? 'admin_room_close'
      : actor.type === 'owner'
        ? 'owner_room_close'
        : actor.type === 'moderator'
          ? 'ban'
          : 'system_room_close'

  let auditActorId = actorId
  if (!auditActorId && roomRow?.chu_phong_khoa?.startsWith('acc:')) {
    auditActorId = parseInt(roomRow.chu_phong_khoa.slice(4), 10) || null
  }

  if (auditActorId) {
    try {
      await db
        .prepare(
          `INSERT INTO moderation_audit_logs (actor_id, target_id, room_id, action, reason, metadata, created_at)
           VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(
          auditActorId,
          roomId,
          auditAction,
          effectiveReason,
          JSON.stringify({
            closedAt: now,
            actorType: actor.type,
            actorName: actor.name ?? 'Hệ thống',
            closedSocketsCount,
            doRpcSuccess,
          }),
          now,
        )
        .run()
    } catch (auditErr) {
      console.warn('[RoomLifecycle.close] Lỗi ghi audit log (không chặn đóng phòng):', auditErr)
    }
  }

  // 6. Ghi nhận sự kiện Analytics (fail-safe)
  if (env.ANALYTICS_DB) {
    try {
      void recordAnalyticsEvent(env.ANALYTICS_DB, undefined, {
        event: 'room.lifecycle.closed',
        actorId,
        roomId,
        properties: {
          actorType: actor.type,
          reason: effectiveReason,
          closedSocketsCount,
        },
      })
    } catch {}
  }

  return { ok: true, closedSocketsCount }
}
