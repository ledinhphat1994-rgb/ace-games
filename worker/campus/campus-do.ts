import { DurableObject } from 'cloudflare:workers'
import { LenhCampus, type GoiCampus, type PhongSanh, type TinCampus } from '../../shared/protocol/campus'
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

const DOI_SOAT_MOI_MS = 10 * 60 * 1000
const KHUNG_TOI_DA_KY_TU = 4096
const LENH_TOI_DA = 30
const CUA_SO_LENH_MS = 10_000
const PHONG_GUI_KEM = 100

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

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING_GIU_KET_NOI, PONG_GIU_KET_NOI))
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS phong (id INTEGER PRIMARY KEY, du_lieu TEXT NOT NULL, pham_vi TEXT NOT NULL, lop_id INTEGER)',
    )
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS meta (khoa TEXT PRIMARY KEY, gia_tri TEXT NOT NULL)')
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
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    } catch {
      // Mã đóng dành riêng (1005/1006) hoặc kết nối đã đóng.
    }
    this.phatTatCa({ type: 'online', count: this.demOnline(ws) }, ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.phatTatCa({ type: 'online', count: this.demOnline(ws) }, ws)
  }

  /** Worker gọi khi tài khoản vừa đăng nhập: đóng ngay kết nối Campus của phiên cũ (luật 1 thiết bị). */
  async dangNhapMoi(accountId: number, phienId: string): Promise<void> {
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
}
