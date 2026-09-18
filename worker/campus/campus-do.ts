import { DurableObject } from 'cloudflare:workers'
import { LenhCampus, type GoiCampus, type PhongSanh, type TinCampus } from '../../shared/protocol/campus'
import type { FriendPresence, PresenceState, UserActivity } from '../../shared/protocol/social'
import {
  lamSachVanBan,
  MA_DONG_SOCKET,
  PING_GIU_KET_NOI,
  PONG_GIU_KET_NOI,
  type MaLoi,
} from '../../shared/protocol/common'
import { CHAT_CAMPUS, MON_HOC, type MonHoc } from '../../shared/rooms/constants'
import { msTuD1 } from '../lib/thoi-gian'
import { giaiMaDanhTinh, HEADER_DANH_TINH, laYeuCauWebSocket } from '../lib/ws'
import { thayPhong, type DanhTinhCampus } from './danh-tinh'

const DOI_SOAT_MOI_MS = 10 * 1000
const KHUNG_TOI_DA_KY_TU = 4096
const LENH_TOI_DA = 30
const CUA_SO_LENH_MS = 10_000
const PHONG_GUI_KEM = 100
export const DISCONNECT_GRACE_MS = 5000

interface TrangThaiNguoiDung {
  state: PresenceState
  lastSeen: number
  activity: UserActivity | null
  timerDisconnect?: ReturnType<typeof setTimeout>
}

interface DongTinD1 {
  id: number
  accountId: number
  ten: string
  role: string
  noiDung: string
  taoLuc: string
  lopTen: string | null
}

interface DongPhongD1 {
  id: number
  ten: string
  moTa: string | null
  phamVi: string
  lopId: number | null
  lopTen: string | null
  chuPhongTen: string
  cauHinh: string | null
  accessMode: string
  sucChua: number
  taoLuc: string
}

const theTaiKhoan = (accountId: number) => `acc:${accountId}`
const laMonHoc = (v: unknown): v is MonHoc => MON_HOC.some((m) => m.id === v)

function docCauHinh(v: string | null): Record<string, unknown> {
  if (!v) return {}
  try {
    const o: unknown = JSON.parse(v)
    return o && typeof o === 'object' ? (o as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function layReqId(goi: unknown): string | undefined {
  const reqId = goi && typeof goi === 'object' ? (goi as { reqId?: unknown }).reqId : undefined
  return typeof reqId === 'string' && reqId.length <= 40 ? reqId : undefined
}

function tinTuD1(r: DongTinD1): TinCampus {
  return {
    id: r.id,
    accountId: r.accountId,
    ten: r.ten,
    vaiTro: r.role === 'teacher' ? 'giao_vien' : 'hoc_sinh',
    lopTen: r.lopTen,
    noiDung: r.noiDung,
    taoLuc: msTuD1(r.taoLuc),
  }
}

function phongSanhTuD1(r: DongPhongD1): PhongSanh {
  const cauHinh = docCauHinh(r.cauHinh)
  const coMatKhau = r.accessMode === 'password'
  return {
    id: r.id,
    ten: r.ten,
    moTa: r.moTa,
    monHoc: laMonHoc(cauHinh.monHoc) ? cauHinh.monHoc : null,
    phamVi: r.phamVi === 'lop' ? 'lop' : 'truong',
    lopId: r.lopId,
    lopTen: r.lopTen,
    chuPhongTen: r.chuPhongTen,
    coMatKhau,
    sucChua: r.sucChua,
    soNguoi: 0,
    // Như lamSachPhong của bản cũ: phòng có mật khẩu không lộ nội dung đang học ra sảnh.
    dangPhat: !coMatKhau && typeof cauHinh.videoTitle === 'string' ? cauHinh.videoTitle : null,
    taoLuc: msTuD1(r.taoLuc),
  }
}

// Một object cho toàn trường: người đang online, chat toàn trường (lưu D1 campus_chat_message) và danh bạ
// phòng học cho sảnh. Dùng WebSocket Hibernation API nên lúc không ai nhắn tin thì object được ngủ.
export class CampusDO extends DurableObject<Env> {
  private tinGanDay: TinCampus[] | null = null
  private guiChatGanNhat = new Map<number, { luc: number; batDauPhut: number; demPhut: number }>()
  private demLenh = new WeakMap<WebSocket, { batDau: number; dem: number }>()
  private presenceMap = new Map<number, TrangThaiNguoiDung>()
  private friendMap = new Map<number, Set<number>>()
  private blockMap = new Map<number, Set<number>>()
  private phongCuaTaiKhoan = new Map<number, Set<string>>()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING_GIU_KET_NOI, PONG_GIU_KET_NOI))
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS phong (id INTEGER PRIMARY KEY, du_lieu TEXT NOT NULL, pham_vi TEXT NOT NULL, lop_id INTEGER)',
    )
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS meta (khoa TEXT PRIMARY KEY, gia_tri TEXT NOT NULL)')
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS phong_tai_khoan (account_id INTEGER, room_name TEXT, phien_id TEXT, updated_at INTEGER, PRIMARY KEY (account_id, room_name))',
    )
    try {
      const cols = [
        ...ctx.storage.sql.exec<{ name: string }>(
          "PRAGMA table_info(pending_room_revocations)",
        ),
      ]
      const hasPhienId = cols.some((c) => c.name === 'phien_id')
      if (hasPhienId) {
        ctx.storage.sql.exec(
          `CREATE TABLE IF NOT EXISTS pending_room_revocations_v2 (
            account_id INTEGER NOT NULL,
            room_name TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 1,
            last_attempt_at INTEGER NOT NULL,
            error_text TEXT,
            PRIMARY KEY (account_id, room_name)
          )`,
        )
        ctx.storage.sql.exec(
          `INSERT OR REPLACE INTO pending_room_revocations_v2 (account_id, room_name, attempts, last_attempt_at, error_text)
           SELECT account_id, room_name, MAX(attempts), MAX(last_attempt_at), 'migrated'
           FROM pending_room_revocations
           GROUP BY account_id, room_name`,
        )
        ctx.storage.sql.exec('DROP TABLE pending_room_revocations')
        ctx.storage.sql.exec('ALTER TABLE pending_room_revocations_v2 RENAME TO pending_room_revocations')
      } else if (cols.length === 0) {
        ctx.storage.sql.exec(
          `CREATE TABLE IF NOT EXISTS pending_room_revocations (
            account_id INTEGER NOT NULL,
            room_name TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 1,
            last_attempt_at INTEGER NOT NULL,
            error_text TEXT,
            PRIMARY KEY (account_id, room_name)
          )`,
        )
      }
    } catch (e) {
      console.warn('[CampusDO.taoBangNeuChuaCo] pending_room_revocations init error:', e)
    }
    try {
      const pendingRows = [
        ...ctx.storage.sql.exec<{ count: number }>(
          'SELECT COUNT(*) as count FROM pending_room_revocations',
        ),
      ]
      if (pendingRows[0]?.count > 0) {
        ctx.blockConcurrencyWhile(async () => {
          await this.scheduleRoomRevocationAlarm(1000)
        })
        ctx.waitUntil(this.retryPendingRoomRevocations().catch(() => {}))
      }
    } catch {}
  }

  async fetch(request: Request): Promise<Response> {
    if (!laYeuCauWebSocket(request)) return new Response('Cần kết nối WebSocket.', { status: 426 })
    const dt = giaiMaDanhTinh<DanhTinhCampus>(request.headers.get(HEADER_DANH_TINH))
    if (!dt) return new Response('Thiếu danh tính.', { status: 401 })

    await this.doiSoatDanhBaNeuCan()
    const chat = await this.layTinGanDay()

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server, [theTaiKhoan(dt.accountId)])
    server.serializeAttachment(dt)
    await this.dangKyKetNoi(server, dt)

    const online = this.demOnline()
    this.gui(server, {
      type: 'snapshot',
      online,
      rooms: this.phongChoNguoiXem(dt),
      chat,
      me: { accountId: dt.accountId, xoaMoiTin: dt.xoaMoiTin },
      serverNow: Date.now(),
    })
    this.phatTatCa({ type: 'online', count: online }, server)
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const dt = ws.deserializeAttachment() as DanhTinhCampus | null
    if (!dt) {
      ws.close(1011, 'thieu_danh_tinh')
      return
    }
    if (typeof message !== 'string' || message.length > KHUNG_TOI_DA_KY_TU) {
      return this.loi(ws, undefined, 'invalid_payload', 'Dữ liệu gửi lên không hợp lệ.')
    }
    let tho: unknown
    try {
      tho = JSON.parse(message)
    } catch {
      return this.loi(ws, undefined, 'invalid_payload', 'Dữ liệu gửi lên không hợp lệ.')
    }
    const reqId = layReqId(tho)
    if (this.vuotGioiHanLenh(ws)) return this.loi(ws, reqId, 'rate_limited', 'Bạn thao tác quá nhanh, chờ một chút nhé.')

    const lenh = LenhCampus.safeParse(tho)
    if (!lenh.success) return this.loi(ws, reqId, 'invalid_payload', 'Dữ liệu gửi lên không hợp lệ.')
    switch (lenh.data.type) {
      case 'ping':
        return this.gui(ws, { type: 'pong', t: lenh.data.t, s: Date.now() })
      case 'chat.send':
        return this.guiChat(ws, dt, lenh.data.text, reqId)
      case 'chat.delete':
        return this.xoaChat(ws, dt, lenh.data.id, reqId)
      case 'presence.away':
        return this.capNhatAway(dt.accountId, lenh.data.away)
      case 'activity.set':
        return this.capNhatHoatDong(dt.accountId, lenh.data.activity)
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    } catch {
      // Mã đóng dành riêng (1005/1006) hoặc kết nối đã đóng.
    }
    this.huyKetNoi(ws)
    this.phatTatCa({ type: 'online', count: this.demOnline(ws) }, ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.huyKetNoi(ws)
    this.phatTatCa({ type: 'online', count: this.demOnline(ws) }, ws)
  }

  /** Worker gọi khi WebSocket kết nối vào một RoomDO bất kỳ (phòng học hoặc phòng game). */
  async dangKyPhong(accountId: number, roomName: string, phienId: string): Promise<void> {
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO phong_tai_khoan (account_id, room_name, phien_id, updated_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(account_id, room_name) DO UPDATE SET phien_id = excluded.phien_id, updated_at = excluded.updated_at`,
        accountId,
        roomName,
        phienId,
        Date.now(),
      )
    } catch {}
    let rooms = this.phongCuaTaiKhoan.get(accountId)
    if (!rooms) {
      rooms = new Set()
      this.phongCuaTaiKhoan.set(accountId, rooms)
    }
    rooms.add(roomName)
  }

  /** Worker hoặc RoomDO gọi khi WebSocket rời khỏi RoomDO. */
  async roiPhong(accountId: number, roomName: string): Promise<void> {
    try {
      this.ctx.storage.sql.exec(
        'DELETE FROM phong_tai_khoan WHERE account_id = ? AND room_name = ?',
        accountId,
        roomName,
      )
    } catch {}
    const rooms = this.phongCuaTaiKhoan.get(accountId)
    if (rooms) {
      rooms.delete(roomName)
      if (rooms.size === 0) this.phongCuaTaiKhoan.delete(accountId)
    }
  }

  public static simulateRoomRpcFailure = false

  static setSimulateRoomRpcFailure(val: boolean): void {
    CampusDO.simulateRoomRpcFailure = val
  }

  /** Worker gọi khi tài khoản vừa đăng nhập hoặc đổi mật khẩu: đóng ngay kết nối Campus và Room của phiên cũ (luật 1 thiết bị). */
  async dangNhapMoi(
    accountId: number,
    phienId: string,
  ): Promise<{ successfulRooms: string[]; failedRooms: string[] }> {
    const daDong: WebSocket[] = []
    for (const ws of this.ctx.getWebSockets(theTaiKhoan(accountId))) {
      const dt = ws.deserializeAttachment() as DanhTinhCampus | null
      if (!dt?.phienId || dt.phienId === phienId) continue
      this.gui(ws, { type: 'session.replaced' })
      try {
        ws.close(MA_DONG_SOCKET.PHIEN_BI_THAY, 'da_dang_nhap_noi_khac')
      } catch {
        // Đã đóng.
      }
      daDong.push(ws)
    }
    if (daDong.length) this.phatTatCa({ type: 'online', count: this.demOnline(...daDong) }, ...daDong)

    // Thu hồi phiên trên tất cả các RoomDO mà account đã tham gia
    const activeRooms = new Set<string>()
    const memRooms = this.phongCuaTaiKhoan.get(accountId)
    if (memRooms) {
      for (const r of memRooms) activeRooms.add(r)
    }
    try {
      const rows = [...this.ctx.storage.sql.exec<{ room_name: string }>(
        'SELECT room_name FROM phong_tai_khoan WHERE account_id = ?',
        accountId,
      )]
      for (const r of rows) activeRooms.add(r.room_name)
    } catch {}

    const successfulRooms: string[] = []
    const failedRooms: string[] = []

    for (const roomName of activeRooms) {
      try {
        if (CampusDO.simulateRoomRpcFailure) {
          throw new Error('INJECTED_ROOM_RPC_FAILURE')
        }
        const doId = this.env.ROOMS.idFromName(roomName)
        await (this.env.ROOMS.get(doId) as any).dongBoPhienTaiKhoan(accountId, phienId)
        successfulRooms.push(roomName)
      } catch (err: any) {
        console.warn(`[dangNhapMoi] Lỗi gọi dongBoPhienTaiKhoan tới room ${roomName}:`, err)
        failedRooms.push(roomName)
      }
    }

    // Chỉ xóa các phòng đã thu hồi thành công khỏi storage
    for (const r of successfulRooms) {
      try {
        this.ctx.storage.sql.exec(
          'DELETE FROM phong_tai_khoan WHERE account_id = ? AND room_name = ?',
          accountId,
          r,
        )
      } catch {}
      this.phongCuaTaiKhoan.get(accountId)?.delete(r)
    }

    // Nếu còn phòng thất bại: GIỮ LẠI trong storage để retry và lưu vào pending_room_revocations + schedule alarm
    if (failedRooms.length > 0) {
      for (const roomName of failedRooms) {
        try {
          this.ctx.storage.sql.exec(
            `INSERT INTO pending_room_revocations (account_id, room_name, attempts, last_attempt_at, error_text)
             VALUES (?, ?, 1, ?, 'initial_rpc_failed')
             ON CONFLICT(account_id, room_name) DO UPDATE SET
               attempts = pending_room_revocations.attempts + 1,
               last_attempt_at = excluded.last_attempt_at,
               error_text = excluded.error_text`,
            accountId,
            roomName,
            Date.now(),
          )
        } catch {}
      }
      await this.scheduleRoomRevocationAlarm(1000)
      this.ctx.waitUntil(this.retryPendingRoomRevocations().catch(() => {}))
    } else {
      if (this.phongCuaTaiKhoan.get(accountId)?.size === 0) {
        this.phongCuaTaiKhoan.delete(accountId)
      }
    }

    return { successfulRooms, failedRooms }
  }

  tinhRoomBackoffDelay(attempts: number): number {
    const safe = Math.max(1, attempts || 1)
    return Math.min(1000 * Math.pow(2, safe - 1), 60000)
  }

  async scheduleRoomRevocationAlarm(delayMs: number): Promise<void> {
    try {
      const targetTime = Date.now() + Math.max(500, delayMs)
      const currentAlarm = await this.ctx.storage.getAlarm()
      if (!currentAlarm || currentAlarm > targetTime) {
        await this.ctx.storage.setAlarm(targetTime)
      }
    } catch (err) {
      console.error('[CampusDO] Lỗi scheduleRoomRevocationAlarm:', err)
    }
  }

  getPendingRoomRevocations(): Array<{
    accountId: number
    roomName: string
    attempts: number
    lastAttemptAt: number
    errorText: string | null
  }> {
    try {
      return [...this.ctx.storage.sql.exec<{
        account_id: number
        room_name: string
        attempts: number
        last_attempt_at: number
        error_text: string | null
      }>(
        'SELECT account_id, room_name, attempts, last_attempt_at, error_text FROM pending_room_revocations',
      )].map((r) => ({
        accountId: r.account_id,
        roomName: r.room_name,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        errorText: r.error_text,
      }))
    } catch {
      return []
    }
  }

  async getRoomRevocationAlarmTime(): Promise<number | null> {
    try {
      return await this.ctx.storage.getAlarm()
    } catch {
      return null
    }
  }

  async retryPendingRoomRevocations(_now = Date.now()): Promise<number> {
    const pendingList = this.getPendingRoomRevocations()
    let cleared = 0
    let minNextDelay = Infinity

    for (const item of pendingList) {
      try {
        if (CampusDO.simulateRoomRpcFailure) {
          throw new Error('INJECTED_ROOM_RPC_FAILURE')
        }

        // PRV8.2 Invariant: DO NOT TRUST STORED "CURRENT SESSION" SNAPSHOT.
        // Fetch current authoritative session from D1 at execution time!
        let authoritativePhienId: string | null = null
        try {
          const row = await this.env.DB.prepare(
            'SELECT thiet_bi, dang_hoat_dong FROM tai_khoan_campus WHERE id = ?1',
          )
            .bind(item.accountId)
            .first<{ thiet_bi: string | null; dang_hoat_dong: number }>()

          if (!row || row.dang_hoat_dong === 0) {
            authoritativePhienId = null
          } else {
            authoritativePhienId = row.thiet_bi ?? null
          }
        } catch (d1Err) {
          console.warn(
            `[retryPendingRoomRevocations] Không thể tra cứu D1 cho account=${item.accountId}, hoãn retry:`,
            d1Err,
          )
          // FAIL-CLOSED: D1 lookup error -> DO NOT call RoomDO with stale state. Keep pending row and reschedule.
          throw d1Err
        }

        const doId = this.env.ROOMS.idFromName(item.roomName)
        await (this.env.ROOMS.get(doId) as any).dongBoPhienTaiKhoan(item.accountId, authoritativePhienId)

        // Authoritative success from RoomDO
        try {
          this.ctx.storage.sql.exec(
            'DELETE FROM pending_room_revocations WHERE account_id = ? AND room_name = ?',
            item.accountId,
            item.roomName,
          )
          this.ctx.storage.sql.exec(
            'DELETE FROM phong_tai_khoan WHERE account_id = ? AND room_name = ?',
            item.accountId,
            item.roomName,
          )
        } catch {}
        this.phongCuaTaiKhoan.get(item.accountId)?.delete(item.roomName)
        if (this.phongCuaTaiKhoan.get(item.accountId)?.size === 0) {
          this.phongCuaTaiKhoan.delete(item.accountId)
        }
        cleared++
      } catch (err: any) {
        const nextAttempts = item.attempts + 1
        console.warn(
          `[retryPendingRoomRevocations] Thất bại lần ${nextAttempts} cho account=${item.accountId} room=${item.roomName}:`,
          err,
        )
        try {
          this.ctx.storage.sql.exec(
            `UPDATE pending_room_revocations
             SET attempts = attempts + 1, last_attempt_at = ?, error_text = ?
             WHERE account_id = ? AND room_name = ?`,
            Date.now(),
            err?.message || 'rpc_failure',
            item.accountId,
            item.roomName,
          )
        } catch {}

        if (nextAttempts >= 5) {
          console.warn(
            `[OPERATIONAL_ALERT] Pending room revocation cho account=${item.accountId} room=${item.roomName} đã đạt ${nextAttempts} lần thử nhưng chưa thu hồi được. Tiếp tục retry theo chu kỳ capped backoff.`,
          )
        }

        const nextDelay = this.tinhRoomBackoffDelay(nextAttempts)
        if (nextDelay < minNextDelay) minNextDelay = nextDelay
      }
    }

    if (pendingList.length > cleared && Number.isFinite(minNextDelay)) {
      await this.scheduleRoomRevocationAlarm(minNextDelay)
    }
    return cleared
  }

  override async alarm(): Promise<void> {
    try {
      await this.retryPendingRoomRevocations()
    } catch (err) {
      console.error('[CampusDO.alarm] Lỗi xử lý retry pending room revocations:', err)
      try {
        const remaining = this.getPendingRoomRevocations()
        if (remaining.length > 0) {
          await this.scheduleRoomRevocationAlarm(5000)
        }
      } catch {}
    }
  }

  /** RoomDO báo trạng thái phòng để sảnh cập nhật tức thì. */
  async capNhatPhong(phong: PhongSanh): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT INTO phong (id, du_lieu, pham_vi, lop_id) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET du_lieu = excluded.du_lieu, pham_vi = excluded.pham_vi, lop_id = excluded.lop_id`,
      phong.id,
      JSON.stringify(phong),
      phong.phamVi,
      phong.lopId,
    )
    this.phatTheoPhamVi(phong, { type: 'room.upsert', room: phong })
  }

  /** Phòng đã đóng: gỡ khỏi sảnh. */
  async goPhong(id: number): Promise<void> {
    const cu = this.docTatCaPhong().find((p) => p.id === id)
    this.ctx.storage.sql.exec('DELETE FROM phong WHERE id = ?', id)
    if (cu) this.phatTheoPhamVi(cu, { type: 'room.remove', id })
  }

  private async guiChat(ws: WebSocket, dt: DanhTinhCampus, text: string, reqId?: string): Promise<void> {
    const noiDung = lamSachVanBan(text)
    if (!noiDung) return this.loi(ws, reqId, 'invalid_payload', 'Tin nhắn trống.')
    if (noiDung.length > CHAT_CAMPUS.TOI_DA_KY_TU) {
      return this.loi(ws, reqId, 'invalid_payload', `Tin nhắn tối đa ${CHAT_CAMPUS.TOI_DA_KY_TU} ký tự.`)
    }

    const bayGio = Date.now()
    const truoc = this.guiChatGanNhat.get(dt.accountId)
    if (truoc && bayGio - truoc.luc < CHAT_CAMPUS.GIAN_CACH_MS) {
      return this.loi(ws, reqId, 'rate_limited', 'Gửi chậm lại một chút nhé!')
    }
    const cungPhut = truoc !== undefined && bayGio - truoc.batDauPhut < 60_000
    const demPhut = cungPhut ? truoc.demPhut + 1 : 1
    if (demPhut > CHAT_CAMPUS.TOI_DA_MOI_PHUT) {
      return this.loi(ws, reqId, 'rate_limited', 'Bạn đã gửi quá nhiều tin trong một phút, nghỉ tay chút nhé!')
    }
    this.guiChatGanNhat.set(dt.accountId, { luc: bayGio, batDauPhut: cungPhut ? truoc.batDauPhut : bayGio, demPhut })

    let dong: { id: number; taoLuc: string } | null
    try {
      dong = await this.env.DB.prepare(
        `INSERT INTO campus_chat_message (sender_account_id, display_name, role, lop_id, content)
         VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id, created_at AS taoLuc`,
      )
        .bind(dt.accountId, dt.ten, dt.vaiTro === 'giao_vien' ? 'teacher' : 'student', dt.lopId, noiDung)
        .first<{ id: number; taoLuc: string }>()
    } catch (e) {
      console.error('Không lưu được tin chat Campus:', e)
      dong = null
    }
    if (!dong) return this.loi(ws, reqId, 'server_error', 'Chưa gửi được tin, thử lại nhé.')

    const tin: TinCampus = {
      id: dong.id,
      accountId: dt.accountId,
      ten: dt.ten,
      vaiTro: dt.vaiTro,
      lopTen: dt.lopTen,
      noiDung,
      taoLuc: msTuD1(dong.taoLuc),
    }
    if (this.tinGanDay) this.tinGanDay = [...this.tinGanDay, tin].slice(-CHAT_CAMPUS.GUI_KEM)
    this.gui(ws, { type: 'ack', reqId })
    this.phatTatCa({ type: 'chat.msg', message: tin })
  }

  private async xoaChat(ws: WebSocket, dt: DanhTinhCampus, id: number, reqId?: string): Promise<void> {
    let dong: { accountId: number; taoLuc: string; daXoa: string | null } | null
    try {
      dong = await this.env.DB.prepare(
        `SELECT sender_account_id AS accountId, created_at AS taoLuc, deleted_at AS daXoa
           FROM campus_chat_message WHERE id = ?1`,
      )
        .bind(id)
        .first()
    } catch (e) {
      console.error('Không đọc được tin chat Campus để xoá:', e)
      return this.loi(ws, reqId, 'server_error', 'Chưa xoá được tin, thử lại nhé.')
    }
    if (!dong || dong.daXoa) return this.loi(ws, reqId, 'not_found', 'Tin nhắn không còn nữa.')

    const cuaMinh = dong.accountId === dt.accountId
    const conHanTuXoa = Date.now() - msTuD1(dong.taoLuc) <= CHAT_CAMPUS.TU_XOA_TRONG_MS
    if (!dt.xoaMoiTin && !(cuaMinh && conHanTuXoa)) {
      return this.loi(
        ws,
        reqId,
        'forbidden',
        cuaMinh ? 'Chỉ xoá được tin của mình trong 15 phút sau khi gửi.' : 'Bạn không có quyền xoá tin này.',
      )
    }

    try {
      await this.env.DB.prepare(
        'UPDATE campus_chat_message SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?1 AND deleted_at IS NULL',
      )
        .bind(id)
        .run()
    } catch (e) {
      console.error('Không xoá được tin chat Campus:', e)
      return this.loi(ws, reqId, 'server_error', 'Chưa xoá được tin, thử lại nhé.')
    }
    if (this.tinGanDay) this.tinGanDay = this.tinGanDay.filter((t) => t.id !== id)
    this.gui(ws, { type: 'ack', reqId })
    // Bản cũ chỉ xoá ở máy người bấm; giờ mọi người đang xem đều mất tin ngay.
    this.phatTatCa({ type: 'chat.deleted', id })
  }

  private async layTinGanDay(): Promise<TinCampus[]> {
    if (this.tinGanDay) return this.tinGanDay
    try {
      const { results } = await this.env.DB.prepare(
        `SELECT m.id, m.sender_account_id AS accountId, m.display_name AS ten, m.role, m.content AS noiDung,
                m.created_at AS taoLuc, l.ten AS lopTen
           FROM campus_chat_message m LEFT JOIN lop l ON l.id = m.lop_id
          WHERE m.deleted_at IS NULL
          ORDER BY m.id DESC LIMIT ?1`,
      )
        .bind(CHAT_CAMPUS.GUI_KEM)
        .all<DongTinD1>()
      this.tinGanDay = results.map(tinTuD1).reverse()
      return this.tinGanDay
    } catch (e) {
      console.error('Không tải được chat Campus:', e)
      return []
    }
  }

  // Lưới an toàn cho danh bạ: phòng tạo/đóng mà chưa kịp báo (hoặc có từ trước khi chuyển sang v2) vẫn khớp D1.
  private async doiSoatDanhBaNeuCan(): Promise<void> {
    const bayGio = Date.now()
    const cuoi = Number(
      this.ctx.storage.sql
        .exec<{ gia_tri: string }>("SELECT gia_tri FROM meta WHERE khoa = 'doi_soat_luc'")
        .toArray()[0]?.gia_tri ?? 0,
    )
    if (bayGio - cuoi < DOI_SOAT_MOI_MS) return
    // Ghi mốc trước khi chờ D1 để các kết nối đến cùng lúc không đối soát lặp.
    this.ctx.storage.sql.exec(
      "INSERT INTO meta (khoa, gia_tri) VALUES ('doi_soat_luc', ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri",
      String(bayGio),
    )

    let dsD1: DongPhongD1[]
    try {
      const { results } = await this.env.DB.prepare(
        `SELECT p.id, p.ten, p.mo_ta AS moTa, p.pham_vi AS phamVi, p.lop_id AS lopId, l.ten AS lopTen,
                p.chu_phong_ten AS chuPhongTen, p.cau_hinh AS cauHinh, p.access_mode AS accessMode,
                p.suc_chua AS sucChua, p.tao_luc AS taoLuc
           FROM phong p LEFT JOIN lop l ON l.id = p.lop_id
          WHERE p.trang_thai = 'mo' AND p.loai = 'video'
          ORDER BY p.id DESC LIMIT 200`,
      ).all<DongPhongD1>()
      dsD1 = results
    } catch (e) {
      console.error('Không đối soát được danh bạ phòng với D1:', e)
      return
    }

    const hienCo = new Map(this.docTatCaPhong().map((p) => [p.id, p]))
    const conMo = new Set<number>()
    for (const dong of dsD1) {
      conMo.add(dong.id)
      const cu = hienCo.get(dong.id)
      const tuD1 = phongSanhTuD1(dong)
      // Số người và video đang phát do RoomDO báo mới là số liệu sống; D1 chỉ giữ thông tin tĩnh.
      const phong: PhongSanh = cu
        ? { ...tuD1, soNguoi: cu.soNguoi, dangPhat: tuD1.coMatKhau ? null : cu.dangPhat }
        : tuD1
      if (JSON.stringify(cu) !== JSON.stringify(phong)) await this.capNhatPhong(phong)
    }
    for (const id of hienCo.keys()) {
      if (!conMo.has(id)) await this.goPhong(id)
    }
  }

  private docTatCaPhong(): PhongSanh[] {
    return this.ctx.storage.sql
      .exec<{ du_lieu: string }>('SELECT du_lieu FROM phong')
      .toArray()
      .map((r) => JSON.parse(r.du_lieu) as PhongSanh)
  }

  private phongChoNguoiXem(dt: DanhTinhCampus): PhongSanh[] {
    return this.docTatCaPhong()
      .filter((p) => thayPhong(dt, p))
      .sort((a, b) => b.soNguoi - a.soNguoi || b.taoLuc - a.taoLuc)
      .slice(0, PHONG_GUI_KEM)
  }

  private demOnline(...boQua: WebSocket[]): number {
    const taiKhoan = new Set<number>()
    for (const ws of this.ctx.getWebSockets()) {
      if (boQua.includes(ws)) continue
      const dt = ws.deserializeAttachment() as DanhTinhCampus | null
      if (dt) taiKhoan.add(dt.accountId)
    }
    return taiKhoan.size
  }

  private vuotGioiHanLenh(ws: WebSocket): boolean {
    const bayGio = Date.now()
    const dem = this.demLenh.get(ws)
    if (!dem || bayGio - dem.batDau > CUA_SO_LENH_MS) {
      this.demLenh.set(ws, { batDau: bayGio, dem: 1 })
      return false
    }
    dem.dem++
    return dem.dem > LENH_TOI_DA
  }

  private gui(ws: WebSocket, goi: GoiCampus): void {
    try {
      ws.send(JSON.stringify(goi))
    } catch {
      // Kết nối đang đóng dở.
    }
  }

  private loi(ws: WebSocket, reqId: string | undefined, code: MaLoi, message: string): void {
    this.gui(ws, { type: 'error', reqId, code, message })
  }

  private phatTatCa(goi: GoiCampus, ...boQua: WebSocket[]): void {
    const chuoi = JSON.stringify(goi)
    for (const ws of this.ctx.getWebSockets()) {
      if (boQua.includes(ws)) continue
      try {
        ws.send(chuoi)
      } catch {
        // Kết nối đang đóng dở.
      }
    }
  }

  private phatTheoPhamVi(phong: PhongSanh, goi: GoiCampus): void {
    const chuoi = JSON.stringify(goi)
    for (const ws of this.ctx.getWebSockets()) {
      const dt = ws.deserializeAttachment() as DanhTinhCampus | null
      if (!dt || !thayPhong(dt, phong)) continue
      try {
        ws.send(chuoi)
      } catch {
        // Kết nối đang đóng dở.
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Presence & Social Graph Logic
  // ─────────────────────────────────────────────────────────────────────────────

  private async dangKyKetNoi(ws: WebSocket, dt: DanhTinhCampus): Promise<void> {
    await this.napSocialGraph(dt.accountId)

    let entry = this.presenceMap.get(dt.accountId)
    const wasOffline = !entry || entry.state === 'offline'

    if (entry?.timerDisconnect) {
      clearTimeout(entry.timerDisconnect)
      entry.timerDisconnect = undefined
    }

    if (!entry) {
      entry = {
        state: 'online',
        lastSeen: Date.now(),
        activity: null,
      }
      this.presenceMap.set(dt.accountId, entry)
    } else {
      entry.state = 'online'
      entry.lastSeen = Date.now()
    }

    // Gửi snapshot presence bạn bè cho WebSocket mới
    const snapshot = this.laySnapshotBanBe(dt)
    this.gui(ws, { type: 'social.presence_snapshot', friends: snapshot })

    // Nếu vừa online (từ offline), phát sóng tới bạn bè
    if (wasOffline) {
      this.phatPresenceBanBe(dt.accountId)
    }
  }

  private huyKetNoi(ws: WebSocket): void {
    const dt = ws.deserializeAttachment() as DanhTinhCampus | null
    if (!dt) return

    // Kiểm tra các WebSocket còn lại của accountId này (multi-tab/device)
    const conLai = this.ctx.getWebSockets(theTaiKhoan(dt.accountId)).filter((s) => s !== ws)
    if (conLai.length > 0) {
      // Vẫn còn tab/thiết bị khác kết nối -> Giữ online!
      return
    }

    // Kết nối cuối cùng vừa đóng -> bắt đầu Bounded Disconnect Grace Period (5 giây)
    const entry = this.presenceMap.get(dt.accountId)
    if (!entry) return

    if (entry.timerDisconnect) clearTimeout(entry.timerDisconnect)
    entry.timerDisconnect = setTimeout(() => {
      // Sau grace period kiểm tra lại: nếu vẫn 0 kết nối -> offline
      const recheck = this.ctx.getWebSockets(theTaiKhoan(dt.accountId))
      if (recheck.length > 0) return

      entry.state = 'offline'
      entry.lastSeen = Date.now()
      entry.activity = null
      entry.timerDisconnect = undefined
      this.phatPresenceBanBe(dt.accountId)
    }, DISCONNECT_GRACE_MS)
  }

  private capNhatAway(accountId: number, away: boolean): void {
    const entry = this.presenceMap.get(accountId)
    if (entry && this.ctx.getWebSockets(theTaiKhoan(accountId)).length > 0) {
      entry.state = away ? 'away' : 'online'
      entry.lastSeen = Date.now()
      this.phatPresenceBanBe(accountId)
    }
  }

  private capNhatHoatDong(accountId: number, activity: UserActivity | null): void {
    const entry = this.presenceMap.get(accountId)
    if (entry && this.ctx.getWebSockets(theTaiKhoan(accountId)).length > 0) {
      entry.activity = activity
      entry.lastSeen = Date.now()
      this.phatPresenceBanBe(accountId)
    }
  }

  private phatPresenceBanBe(accountId: number): void {
    const entry = this.presenceMap.get(accountId)
    if (!entry) return

    const friendIds = this.friendMap.get(accountId)
    if (!friendIds || friendIds.size === 0) return

    const blocked = this.blockMap.get(accountId) ?? new Set()
    const danhBa = this.docTatCaPhong()

    for (const friendId of friendIds) {
      if (blocked.has(friendId)) continue

      const sockets = this.ctx.getWebSockets(theTaiKhoan(friendId))
      if (sockets.length === 0) continue

      for (const ws of sockets) {
        const friendDt = ws.deserializeAttachment() as DanhTinhCampus | null
        if (!friendDt) continue

        const sanitized = this.locHoatDong(friendDt, entry.activity, danhBa)
        this.gui(ws, {
          type: 'social.presence_update',
          presence: {
            accountId,
            state: entry.state,
            lastSeen: entry.lastSeen,
            activity: sanitized,
          },
        })
      }
    }
  }

  private laySnapshotBanBe(dt: DanhTinhCampus): FriendPresence[] {
    const friendIds = this.friendMap.get(dt.accountId)
    if (!friendIds || friendIds.size === 0) return []
    const blocked = this.blockMap.get(dt.accountId) ?? new Set()
    const danhBa = this.docTatCaPhong()

    const results: FriendPresence[] = []
    for (const fid of friendIds) {
      if (blocked.has(fid)) continue
      const entry = this.presenceMap.get(fid)
      results.push({
        accountId: fid,
        state: entry?.state ?? 'offline',
        lastSeen: entry?.lastSeen ?? 0,
        activity: entry ? this.locHoatDong(dt, entry.activity, danhBa) : null,
      })
    }
    return results
  }

  private locHoatDong(
    nguoiXem: DanhTinhCampus,
    activity: UserActivity | null,
    danhBa: PhongSanh[],
  ): UserActivity | null {
    if (!activity) return null
    if (activity.type === 'room' && activity.roomId) {
      let phong = danhBa.find((p) => p.id === activity.roomId)
      if (!phong) {
        phong = this.docTatCaPhong().find((p) => p.id === activity.roomId)
      }
      if (!phong) {
        return { type: 'room', roomTitle: 'Đang học nhóm' }
      }
      const duocXem = thayPhong(nguoiXem, phong)
      if (!duocXem) {
        return { type: 'room', roomTitle: 'Đang học nhóm' }
      }
      return {
        type: 'room',
        roomId: phong.id,
        roomTitle: phong.ten,
      }
    }
    return activity
  }

  private async napSocialGraph(accountId: number): Promise<void> {
    if (this.friendMap.has(accountId) && this.blockMap.has(accountId)) return
    try {
      const [friendsDb, blocksDb] = await Promise.all([
        this.env.DB.prepare(
          `SELECT CASE WHEN account_low_id = ?1 THEN account_high_id ELSE account_low_id END as friendId
             FROM friendships
            WHERE account_low_id = ?1 OR account_high_id = ?1`,
        )
          .bind(accountId)
          .all<{ friendId: number }>(),
        this.env.DB.prepare(
          `SELECT CASE WHEN blocker_id = ?1 THEN blocked_id ELSE blocker_id END as blockedId
             FROM blocks
            WHERE blocker_id = ?1 OR blocked_id = ?1`,
        )
          .bind(accountId)
          .all<{ blockedId: number }>(),
      ])
      const friends = new Set((friendsDb.results ?? []).map((r) => r.friendId))
      const blocks = new Set((blocksDb.results ?? []).map((r) => r.blockedId))
      this.friendMap.set(accountId, friends)
      this.blockMap.set(accountId, blocks)
    } catch (e) {
      console.error('Lỗi khi nạp social graph vào CampusDO:', e)
      if (!this.friendMap.has(accountId)) this.friendMap.set(accountId, new Set())
      if (!this.blockMap.has(accountId)) this.blockMap.set(accountId, new Set())
    }
  }

  async layTrangThaiPresence(accountId: number): Promise<FriendPresence> {
    const entry = this.presenceMap.get(accountId)
    return {
      accountId,
      state: entry?.state ?? 'offline',
      lastSeen: entry?.lastSeen ?? 0,
      activity: entry?.activity ?? null,
    }
  }

  async thongBaoSocial(suKien: any): Promise<void> {
    if (!suKien || typeof suKien !== 'object') return

    switch (suKien.type) {
      case 'social.request_received': {
        const sockets = this.ctx.getWebSockets(theTaiKhoan(suKien.receiverId))
        for (const ws of sockets) {
          this.gui(ws, { type: 'social.request_received', request: suKien.request })
        }
        break
      }
      case 'social.request_resolved': {
        for (const aid of suKien.accountIds ?? []) {
          const sockets = this.ctx.getWebSockets(theTaiKhoan(aid))
          for (const ws of sockets) {
            this.gui(ws, { type: 'social.request_resolved', requestId: suKien.requestId })
          }
        }
        break
      }
      case 'social.friend_added': {
        const [idA, idB] = suKien.accountIds as [number, number]
        if (!this.friendMap.has(idA)) this.friendMap.set(idA, new Set())
        if (!this.friendMap.has(idB)) this.friendMap.set(idB, new Set())
        this.friendMap.get(idA)!.add(idB)
        this.friendMap.get(idB)!.add(idA)

        this.blockMap.get(idA)?.delete(idB)
        this.blockMap.get(idB)?.delete(idA)

        const entryA = this.presenceMap.get(idA)
        const entryB = this.presenceMap.get(idB)

        const socketsA = this.ctx.getWebSockets(theTaiKhoan(idA))
        const socketsB = this.ctx.getWebSockets(theTaiKhoan(idB))

        for (const ws of socketsA) {
          this.gui(ws, {
            type: 'social.friend_added',
            friend: suKien.friendB,
            presence: {
              accountId: idB,
              state: entryB?.state ?? 'offline',
              lastSeen: entryB?.lastSeen ?? 0,
              activity: entryB?.activity ?? null,
            },
          })
        }
        for (const ws of socketsB) {
          this.gui(ws, {
            type: 'social.friend_added',
            friend: suKien.friendA,
            presence: {
              accountId: idA,
              state: entryA?.state ?? 'offline',
              lastSeen: entryA?.lastSeen ?? 0,
              activity: entryA?.activity ?? null,
            },
          })
        }
        break
      }
      case 'social.friend_removed': {
        const { userA, userB } = suKien
        this.friendMap.get(userA)?.delete(userB)
        this.friendMap.get(userB)?.delete(userA)

        for (const ws of this.ctx.getWebSockets(theTaiKhoan(userA))) {
          this.gui(ws, { type: 'social.friend_removed', friendId: userB })
        }
        for (const ws of this.ctx.getWebSockets(theTaiKhoan(userB))) {
          this.gui(ws, { type: 'social.friend_removed', friendId: userA })
        }
        break
      }
      case 'social.blocked': {
        const { blockerId, blockedId } = suKien
        this.friendMap.get(blockerId)?.delete(blockedId)
        this.friendMap.get(blockedId)?.delete(blockerId)

        if (!this.blockMap.has(blockerId)) this.blockMap.set(blockerId, new Set())
        if (!this.blockMap.has(blockedId)) this.blockMap.set(blockedId, new Set())
        this.blockMap.get(blockerId)!.add(blockedId)
        this.blockMap.get(blockedId)!.add(blockerId)

        for (const ws of this.ctx.getWebSockets(theTaiKhoan(blockerId))) {
          this.gui(ws, { type: 'social.blocked', targetId: blockedId })
          this.gui(ws, { type: 'social.friend_removed', friendId: blockedId })
        }
        for (const ws of this.ctx.getWebSockets(theTaiKhoan(blockedId))) {
          this.gui(ws, { type: 'social.friend_removed', friendId: blockerId })
        }
        break
      }
      case 'social.unblocked': {
        const { blockerId, blockedId } = suKien
        this.blockMap.get(blockerId)?.delete(blockedId)
        this.blockMap.get(blockedId)?.delete(blockerId)
        break
      }
    }
  }
}
