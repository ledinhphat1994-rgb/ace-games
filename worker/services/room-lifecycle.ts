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

export const VALID_MACHINE_CODES = new Set([
  'admin_closed',
  'owner_closed',
  'moderator_room_close',
  'moderation',
  'never_joined_timeout',
  'empty_timeout',
  'max_lifetime',
  'system_cleanup',
  'lifecycle_bootstrap_failed',
])

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
  env?: Env,
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

    // Hội tụ chính sách tới các phòng học đang mở (Option A - Sync policy to open rooms)
    if (env?.ROOMS) {
      try {
        const openRooms = await db
          .prepare("SELECT id FROM phong WHERE trang_thai = 'mo' LIMIT 100")
          .all<{ id: number }>()
        for (const r of openRooms.results || []) {
          try {
            const doId = env.ROOMS.idFromName(`phong-${r.id}`)
            const stub = env.ROOMS.get(doId)
            void stub.fetch('http://room.internal/internal/lifecycle/policy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ policy: updatedPolicy }),
            }).catch(() => {})
          } catch {}
        }
      } catch (syncErr) {
        console.warn('[RoomLifecycle] Lỗi đồng bộ chính sách tới các RoomDO đang mở:', syncErr)
      }
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
  status?: 'closed'
  alreadyClosed?: boolean
  notFound?: boolean
  closedSocketsCount?: number
  error?: string
  partial?: boolean
  retryable?: boolean
  lifecycleStatus?: 'closing' | 'closed'
}

export interface ClaimCloseResult {
  ok: boolean
  claimed?: boolean
  alreadyClosing?: boolean
  alreadyClosed?: boolean
  notFound?: boolean
  error?: string
  room?: {
    id: number
    trang_thai: string
    chu_phong_khoa: string
    chu_phong_ten: string
  }
}

/**
 * Lấy hoặc tạo tài khoản hệ thống cho mục đích kiểm toán (Audit Trail)
 * Ngăn ngừa gán nhầm actor_id sang chủ phòng khi hệ thống tự động dọn dẹp.
 */
export async function getSystemAccountId(db: D1Database): Promise<number> {
  const existing = await db
    .prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'system'")
    .first<{ id: number }>()
  if (existing?.id) return existing.id

  try {
    const res = await db
      .prepare(
        `INSERT INTO tai_khoan_campus
         (ten_dang_nhap, ten_hien_thi, mat_khau_hash, salt, iterations, vai_tro, dang_hoat_dong, la_admin_truong)
         VALUES ('system', 'Hệ thống', 'SYSTEM_ACCOUNT_LOCKED', 'SYSTEM_SALT', 100000, 'admin', 0, 1)
         RETURNING id`,
      )
      .first<{ id: number }>()
    if (res?.id) return res.id
  } catch {}

  const fallback = await db
    .prepare("SELECT id FROM tai_khoan_campus WHERE ten_dang_nhap = 'system'")
    .first<{ id: number }>()
  return fallback?.id ?? 1
}

/**
 * Pha 1: Chốt claim đóng phòng trên D1 (OPEN -> CLOSING).
 * Nếu phòng đang ở trạng thái CLOSING, chấp nhận là resumable và tiếp tục các bước sau mà không từ chối sớm.
 */
export async function claimRoomCloseD1(
  db: D1Database,
  roomId: number,
  reasonCode: string,
  actorId: number | null,
): Promise<ClaimCloseResult> {
  const now = Date.now()
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
    console.error(`[RoomLifecycle.claim] Lỗi đọc phòng ${roomId}:`, err)
    return { ok: false, error: 'Không thể truy vấn thông tin phòng học.' }
  }

  if (!roomRow) {
    return { ok: false, notFound: true, error: 'Không tìm thấy phòng học.' }
  }

  // Đã đóng hoàn toàn (Terminal state)
  if (roomRow.trang_thai === 'dong') {
    return { ok: true, alreadyClosed: true, room: roomRow }
  }

  // Đang ở trạng thái CLOSING: Chấp nhận resumable để thử lại quy trình đóng RoomDO/D1
  if (roomRow.trang_thai === 'closing') {
    return { ok: true, alreadyClosing: true, room: roomRow }
  }

  // Phòng đang 'mo': Chuyển trạng thái sang 'closing'
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
      .bind(now, actorId, reasonCode, roomId)
      .run()

    if (!step1.success) {
      return { ok: false, error: 'Không thể cập nhật trạng thái phòng sang CLOSING.' }
    }

    if ((step1.meta.changes ?? 0) === 0) {
      // Re-check trạng thái do tranh chấp đồng thời
      const recheck = await db
        .prepare('SELECT id, trang_thai, chu_phong_khoa, chu_phong_ten FROM phong WHERE id = ?1')
        .bind(roomId)
        .first<{ id: number; trang_thai: string; chu_phong_khoa: string; chu_phong_ten: string }>()
      if (recheck?.trang_thai === 'dong') {
        return { ok: true, alreadyClosed: true, room: recheck }
      }
      if (recheck?.trang_thai === 'closing') {
        return { ok: true, alreadyClosing: true, room: recheck }
      }
      return { ok: false, error: 'Xung đột khi claim trạng thái CLOSING.' }
    }

    return { ok: true, claimed: true, room: roomRow }
  } catch (err: any) {
    console.error(`[RoomLifecycle.claim] Lỗi D1 chuyển sang CLOSING cho phòng ${roomId}:`, err)
    return { ok: false, error: 'Lỗi D1 khi chuyển phòng sang trạng thái đóng.' }
  }
}

/**
 * Pha 3: Hoàn tất trạng thái D1 (CLOSING -> DONG) và ghi nhận Audit Trail.
 */
export async function finalizeRoomCloseD1(
  db: D1Database,
  roomId: number,
  reasonCode: string,
  actor: CloseActor,
  closedSocketsCount: number,
  doRpcSuccess: boolean,
  humanNote?: string | null,
  requestId?: string,
): Promise<{ ok: boolean; error?: string }> {
  const now = Date.now()
  const actorId = actor.accountId ?? null

  // Chuyển D1: CLOSING -> DONG
  try {
    const res = await db
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
      .bind(now, actorId, reasonCode, roomId)
      .run()

    if (!res.success) {
      return { ok: false, error: 'Lỗi D1 khi cập nhật trạng thái phòng sang DONG.' }
    }
  } catch (err: any) {
    console.error(`[RoomLifecycle.finalize] Lỗi D1 chuyển sang CLOSED cho phòng ${roomId}:`, err)
    return { ok: false, error: 'Lỗi cơ sở dữ liệu khi đóng phòng: ' + (err.message || String(err)) }
  }

  // Ghi nhận Audit Log
  const auditAction =
    actor.type === 'admin'
      ? 'admin_room_close'
      : actor.type === 'owner'
        ? 'owner_room_close'
        : actor.type === 'moderator'
          ? 'moderator_room_close'
          : 'system_room_close'

  let auditActorId = actorId
  if (actor.type === 'system' || !auditActorId) {
    auditActorId = await getSystemAccountId(db)
  }

  const metaObj: Record<string, unknown> = {
    closedAt: now,
    actorType: actor.type,
    actorName: actor.type === 'system' ? 'Hệ thống' : (actor.name ?? 'Quản trị viên'),
    reasonCode,
    note: humanNote ?? null,
    previousState: 'closing',
    finalState: 'dong',
    closedSocketsCount,
    doRpcSuccess,
  }
  if (requestId) {
    metaObj.requestId = requestId
  }

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
        reasonCode,
        JSON.stringify(metaObj),
        now,
      )
      .run()
  } catch (auditErr) {
    console.warn('[RoomLifecycle.finalize] Lỗi ghi audit log (không chặn đóng phòng):', auditErr)
  }

  return { ok: true }
}

/**
 * HÀM ĐÓNG PHÒNG CHUẨN MỰC (Canonical Safe Close Flow)
 * Tuân thủ bất biến mục 2 & 3:
 * 1. D1 chuyển OPEN -> CLOSING (khóa ngay cổng admission, fail-closed)
 * 2. Gửi RPC nội bộ tới RoomDO: phát room.closed, dọn dẹp WebSockets & voice, chốt Learning Session
 *    -> NẾU RoomDO close RPC thất bại: D1 BẮT BUỘC GIỮ LẠI 'closing', KHÔNG ĐƯỢC CHUYỂN 'dong'!
 * 3. NẾU RoomDO close RPC thành công: D1 chuyển CLOSING -> DONG (lưu closed_at, close_reason, closed_by)
 * 4. Ghi nhận audit trail trong moderation_audit_logs với định danh actor chuẩn xác
 */
export async function closeStudyRoomCanonical(
  env: Env,
  roomId: number,
  actor: CloseActor,
  reasonCodeOrOptions?:
    | string
    | {
        reasonCode?: string
        humanNote?: string | null
        requestId?: string
      },
  maybeNote?: string | null,
  maybeRequestId?: string,
): Promise<CloseResult> {
  const db = env.DB
  let rawReason = typeof reasonCodeOrOptions === 'string' ? reasonCodeOrOptions : reasonCodeOrOptions?.reasonCode
  let humanNote = typeof reasonCodeOrOptions === 'object' ? reasonCodeOrOptions.humanNote : maybeNote
  const requestId = typeof reasonCodeOrOptions === 'object' ? reasonCodeOrOptions.requestId : maybeRequestId

  let canonicalReasonCode: string
  if (rawReason && VALID_MACHINE_CODES.has(rawReason)) {
    canonicalReasonCode = rawReason
  } else {
    if (rawReason && !humanNote) {
      humanNote = rawReason
    }
    canonicalReasonCode =
      actor.type === 'admin'
        ? 'admin_closed'
        : actor.type === 'owner'
          ? 'owner_closed'
          : actor.type === 'moderator'
            ? 'moderator_room_close'
            : 'system_cleanup'
  }

  // 1. Claim D1 sang CLOSING (hoặc kiểm tra đã closing/closed)
  const claim = await claimRoomCloseD1(db, roomId, canonicalReasonCode, actor.accountId ?? null)
  if (!claim.ok) {
    return { ok: false, notFound: claim.notFound, error: claim.error }
  }

  if (claim.alreadyClosed) {
    return { ok: true, status: 'closed', alreadyClosed: true, closedSocketsCount: 0 }
  }

  // 2. Gửi lệnh đóng nội bộ tới RoomDO
  let closedSocketsCount = 0
  let doRpcSuccess = false
  let alreadyClosedLocally = false

  try {
    const doId = env.ROOMS.idFromName(`phong-${roomId}`)
    const roomStub = env.ROOMS.get(doId)
    const doRes = await roomStub.fetch('http://room.internal/internal/lifecycle/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: canonicalReasonCode,
        closedByAccountId: actor.accountId ?? null,
        closedByName: actor.name ?? (actor.type === 'system' ? 'Hệ thống' : 'Quản trị viên'),
        actorType: actor.type,
        note: humanNote ?? null,
      }),
    })

    if (doRes.ok) {
      const body = (await doRes.json().catch(() => null)) as {
        ok?: boolean
        closedCount?: number
        alreadyClosedLocally?: boolean
      } | null
      if (body?.ok === true) {
        doRpcSuccess = true
        closedSocketsCount = body.closedCount ?? 0
        alreadyClosedLocally = Boolean(body.alreadyClosedLocally)
      } else {
        console.warn(`[RoomLifecycle.close] RoomDO close RPC trả về body không hợp lệ:`, body)
      }
    } else {
      console.warn(`[RoomLifecycle.close] RoomDO close RPC thất bại với HTTP ${doRes.status}`)
    }
  } catch (err) {
    console.error(`[RoomLifecycle.close] Ngoại lệ khi gọi RoomDO close RPC cho phòng ${roomId}:`, err)
  }

  // CHỐT CHẶN BẢO VỆ (Items 2 & 3):
  // Nếu RoomDO close RPC thất bại, D1 BẮT BUỘC PHẢI GIỮ 'closing'. Tuyệt đối không đánh 'dong'!
  if (!doRpcSuccess) {
    return {
      ok: false,
      partial: true,
      retryable: true,
      lifecycleStatus: 'closing',
      error: 'RoomDO close RPC thất bại. Phòng học vẫn giữ trạng thái CLOSING để đảm bảo an toàn admission.',
    }
  }

  // 3. Finalize D1: CLOSING -> DONG + Audit logging
  const finalRes = await finalizeRoomCloseD1(
    db,
    roomId,
    canonicalReasonCode,
    actor,
    closedSocketsCount,
    doRpcSuccess,
    humanNote,
    requestId,
  )

  if (!finalRes.ok) {
    return {
      ok: false,
      partial: true,
      retryable: true,
      lifecycleStatus: 'closing',
      error: finalRes.error || 'Lỗi cập nhật D1 sang CLOSED',
    }
  }

  // 4. Analytics event
  if (env.ANALYTICS_DB) {
    try {
      void recordAnalyticsEvent(env.ANALYTICS_DB, undefined, {
        event: 'room.lifecycle.closed',
        actorId: actor.accountId ?? null,
        roomId,
        properties: {
          actorType: actor.type,
          reason: canonicalReasonCode,
          closedSocketsCount,
        },
      })
    } catch {}
  }

  return {
    ok: true,
    status: 'closed',
    alreadyClosed: alreadyClosedLocally,
    closedSocketsCount,
  }
}
