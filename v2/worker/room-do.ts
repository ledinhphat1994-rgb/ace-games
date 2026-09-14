import { DurableObject } from 'cloudflare:workers'

interface ThanhVienKetNoi {
  key: string
  ten: string
}

// Dùng WebSocket Hibernation API: phòng không có tin nhắn thì object được ngủ, không bị tính thời gian chạy.
export class RoomDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Cần kết nối WebSocket.', { status: 426 })
    }
    const key = request.headers.get('X-Actor-Key')
    if (!key) return new Response('Thiếu danh tính.', { status: 401 })
    let ten = ''
    try {
      ten = decodeURIComponent(request.headers.get('X-Actor-Ten') ?? '')
    } catch {
      ten = ''
    }

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ key, ten } satisfies ThanhVienKetNoi)
    this.phatDanhSach()
    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string' || message.length > 1024) return
    let goi: { type?: unknown }
    try {
      goi = JSON.parse(message) as { type?: unknown }
    } catch {
      return
    }
    if (goi.type === 'ping') ws.send(JSON.stringify({ type: 'pong', t: Date.now() }))
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    } catch {
      // Mã đóng dành riêng (1005/1006) hoặc kết nối đã đóng — không cần làm gì thêm.
    }
    this.phatDanhSach(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.phatDanhSach(ws)
  }

  private phatDanhSach(boQua?: WebSocket): void {
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => ws !== boQua)
    const thanhVien = new Map<string, ThanhVienKetNoi & { soKetNoi: number }>()
    for (const ws of dsKetNoi) {
      const tv = ws.deserializeAttachment() as ThanhVienKetNoi | null
      if (!tv) continue
      const cu = thanhVien.get(tv.key)
      if (cu) cu.soKetNoi++
      else thanhVien.set(tv.key, { ...tv, soKetNoi: 1 })
    }
    const goi = JSON.stringify({ type: 'presence', members: [...thanhVien.values()] })
    for (const ws of dsKetNoi) {
      try {
        ws.send(goi)
      } catch {
        // Kết nối đang đóng dở.
      }
    }
  }
}
