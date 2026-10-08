import { DurableObject } from 'cloudflare:workers'
import type { BanSanh } from '../../shared/protocol/game'
import type { GoiLobbyEvent, GoiLobbySnapshot, LobbyEventType } from '../../shared/protocol/game-sdk'

/**
 * Tên mặc định của Lobby DO cho tính tương thích ngược.
 * Khi phân vùng theo gameType, dùng hàm `tenLobbyTheoLoai(gameType)`.
 */
export const TEN_GAME_LOBBY = 'lobby'

/**
 * Trả về shard key cho LobbyDO dựa trên loại trò chơi.
 * Tránh dồn toàn bộ học sinh toàn trường vào một object "lobby" duy nhất.
 */
export function tenLobbyTheoLoai(gameType?: string): string {
  if (!gameType || gameType === 'all' || gameType === 'legacy') return TEN_GAME_LOBBY
  return `lobby:${gameType}`
}

const BAN_TOI_DA_GUI = 100
// Bàn không được RoomDO cập nhật quá lâu (RoomDO lỗi/bị khởi động lại giữa chừng, không kịp báo gỡ)
// coi như đã bỏ hoang — dọn khi có ai đọc danh sách hoặc định kỳ.
const BAN_HET_HAN_MS = 20 * 60 * 1000

/**
 * GameLobbyDO — Phân vùng danh bạ bàn đấu theo gameType và hỗ trợ WebSocket Event Stream.
 *
 * Invariants:
 * - Không bao giờ đẩy từng nước đi (game move) vào Lobby.
 * - Chỉ đẩy các sự kiện vòng đời bàn: room_created, player_joined, match_started, match_ended, room_closed.
 * - Hỗ trợ WebSocket Hibernation API để đẩy tin thời gian thực, loại bỏ polling định kỳ 4s.
 */
export class GameLobbyDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS ban (id TEXT PRIMARY KEY, du_lieu TEXT NOT NULL, cap_nhat_luc INTEGER NOT NULL)',
    )
  }

  // ─── WebSocket / HTTP Ingress ───────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const upgradeHeader = request.headers.get('Upgrade')

    if (upgradeHeader === 'websocket') {
      const pair = new WebSocketPair()
      const client = pair[0]
      const server = pair[1]

      // WebSocket Hibernation: tự động trả lời "ping" -> "pong"
      this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
      this.ctx.acceptWebSocket(server)

      // Gửi ngay snapshot các bàn hiện có
      const rooms = await this.danhSach()
      const snap: GoiLobbySnapshot = {
        type: 'lobby.snapshot',
        rooms,
        serverTime: Date.now(),
      }
      server.send(JSON.stringify(snap))

      return new Response(null, { status: 101, webSocket: client })
    }

    if (url.pathname === '/rooms' || url.pathname === '/api/rooms') {
      const rooms = await this.danhSach()
      return Response.json({ ok: true, rooms })
    }

    if (url.pathname === '/reset' || url.pathname === '/internal/reset') {
      await this.xoaTatCaBan()
      return Response.json({ ok: true, message: 'Đã xóa toàn bộ bàn đấu trong sảnh.' })
    }

    return new Response('Not Found', { status: 404 })
  }

  // ─── RPC từ GameSessionDO ───────────────────────────────────────────────────

  /** GameSessionDO gọi mỗi khi bàn tạo mới hoặc có thay đổi trạng thái (vào bàn, bắt đầu, kết thúc). */
  async capNhatBan(ban: BanSanh): Promise<void> {
    const existing = this.ctx.storage.sql
      .exec<{ du_lieu: string }>('SELECT du_lieu FROM ban WHERE id = ?', ban.id)
      .toArray()[0]

    let eventType: LobbyEventType = 'room_created'
    if (existing) {
      try {
        const old = JSON.parse(existing.du_lieu) as BanSanh
        if (old.trangThai !== ban.trangThai) {
          eventType = ban.trangThai === 'playing' ? 'match_started' : 'match_ended'
        } else if (old.tenKhach !== ban.tenKhach) {
          eventType = 'player_joined'
        } else {
          eventType = 'spectator_count_sample'
        }
      } catch {
        eventType = 'player_joined'
      }
    }

    this.ctx.storage.sql.exec(
      `INSERT INTO ban (id, du_lieu, cap_nhat_luc) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET du_lieu = excluded.du_lieu, cap_nhat_luc = excluded.cap_nhat_luc`,
      ban.id,
      JSON.stringify(ban),
      ban.capNhatLuc,
    )

    // Phát live stream event tới các client WebSocket đang theo dõi sảnh
    this.broadcastEvent({
      type: 'lobby.event',
      event: eventType,
      ban,
      serverTime: Date.now(),
    })
  }

  /** GameSessionDO gọi khi ván kết thúc hoặc phòng đã trống hẳn (mọi người rời) — gỡ khỏi sảnh. */
  async xoaBan(id: string): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM ban WHERE id = ?', id)
    this.broadcastEvent({
      type: 'lobby.event',
      event: 'room_closed',
      ban: { id },
      serverTime: Date.now(),
    })
  }

  /** Xóa sạch toàn bộ bàn trong sảnh về 0 và phát snapshot rỗng tức thì tới toàn bộ client WebSocket */
  async xoaTatCaBan(): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM ban')
    const snap: GoiLobbySnapshot = {
      type: 'lobby.snapshot',
      rooms: [],
      serverTime: Date.now(),
    }
    const payload = JSON.stringify(snap)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload)
        } catch {}
      }
    }
  }

  async danhSach(): Promise<BanSanh[]> {
    this.ctx.storage.sql.exec('DELETE FROM ban WHERE cap_nhat_luc < ?', Date.now() - BAN_HET_HAN_MS)
    return this.ctx.storage.sql
      .exec<{ du_lieu: string }>('SELECT du_lieu FROM ban ORDER BY cap_nhat_luc DESC LIMIT ?', BAN_TOI_DA_GUI)
      .toArray()
      .map((r) => JSON.parse(r.du_lieu) as BanSanh)
  }

  // ─── WebSocket Event Broadcast ──────────────────────────────────────────────

  private broadcastEvent(event: GoiLobbyEvent): void {
    const payload = JSON.stringify(event)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload)
        } catch {
          // Bỏ qua lỗi gửi socket hỏng; hibernation sẽ dọn khi close
        }
      }
    }
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // Sảnh chỉ nhận ping từ client nếu client gửi dạng JSON
    if (typeof message === 'string' && message.includes('"ping"')) {
      try {
        const parsed = JSON.parse(message) as { type?: string; t?: number }
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', t: parsed.t ?? 0, serverNow: Date.now() }))
        }
      } catch {
        // Bỏ qua
      }
    }
  }

  async webSocketClose(_ws: WebSocket, _code: number, _reason: string): Promise<void> {
    // Không cần quản lý thủ công; getWebSockets() tự động loại bỏ socket đã đóng
  }

  async webSocketError(_ws: WebSocket, _error: unknown): Promise<void> {
    // Tự động giải phóng
  }
}
