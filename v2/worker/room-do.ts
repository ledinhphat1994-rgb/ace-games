import { DurableObject } from 'cloudflare:workers'
import type {
  GoiPhong,
  LenhPhong,
  MediaState,
  PomodoroState,
  QueueItem,
  RoomChatMessage,
  SharedNotes,
  ThanhVienPhong,
  WhiteboardStroke,
} from '../shared/protocol/room'
import { lamSachVanBan } from '../shared/protocol/common'

interface AttachmentKetNoi {
  key: string
  ten: string
  accountId: number
  mic: boolean
}

const DEFAULT_MEDIA: MediaState = {
  videoId: 'dQw4w9WgXcQ',
  title: 'Video học tập chung',
  status: 'paused',
  time: 0,
  updatedAt: Date.now(),
  playbackRate: 1,
  hostOnlyControl: false,
}

const DEFAULT_POMODORO: PomodoroState = {
  running: false,
  mode: 'focus',
  duration: 1500,
  endsAt: 0,
  remaining: 1500,
  round: 1,
}

const DEFAULT_NOTES: SharedNotes = {
  content: '# Ghi chú bài học 📝\n\n- Thảo luận và ghi lại các công thức quan trọng tại đây.',
  lastEditedBy: 'Hệ thống',
  updatedAt: Date.now(),
}

export class RoomDO extends DurableObject<Env> {
  private media: MediaState = { ...DEFAULT_MEDIA }
  private pomodoro: PomodoroState = { ...DEFAULT_POMODORO }
  private notes: SharedNotes = { ...DEFAULT_NOTES }
  private hostKey: string | null = null
  private khoiTaoXong = false

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.khoiTaoSqlite()
  }

  private khoiTaoSqlite(): void {
    try {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS room_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS whiteboard_strokes (
          id TEXT PRIMARY KEY,
          stroke_data TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS playlist_queue (
          id TEXT PRIMARY KEY,
          video_id TEXT NOT NULL,
          title TEXT NOT NULL,
          added_by TEXT NOT NULL,
          added_at INTEGER NOT NULL,
          position INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS room_chat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id INTEGER NOT NULL,
          sender_name TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
      `)
    } catch (err) {
      console.error('Lỗi khởi tạo SQLite trong RoomDO:', err)
    }
  }

  private nạpDuLieuNeuCan(): void {
    if (this.khoiTaoXong) return

    try {
      // Đọc room_meta
      const rows = [...this.ctx.storage.sql.exec<{ key: string; value: string }>('SELECT key, value FROM room_meta')]
      for (const r of rows) {
        if (r.key === 'media') {
          try { this.media = JSON.parse(r.value) as MediaState } catch {}
        } else if (r.key === 'pomodoro') {
          try { this.pomodoro = JSON.parse(r.value) as PomodoroState } catch {}
        } else if (r.key === 'notes') {
          try { this.notes = JSON.parse(r.value) as SharedNotes } catch {}
        } else if (r.key === 'host_key') {
          this.hostKey = r.value
        }
      }
    } catch (err) {
      console.error('Lỗi nạp room_meta:', err)
    }

    this.khoiTaoXong = true
  }

  private luuMeta(key: string, val: unknown): void {
    try {
      const str = typeof val === 'string' ? val : JSON.stringify(val)
      this.ctx.storage.sql.exec(
        'INSERT INTO room_meta (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2',
        key,
        str,
      )
    } catch (err) {
      console.error(`Lỗi lưu room_meta (${key}):`, err)
    }
  }

  private layStrokes(): WhiteboardStroke[] {
    try {
      const rows = [...this.ctx.storage.sql.exec<{ stroke_data: string }>(
        'SELECT stroke_data FROM whiteboard_strokes ORDER BY created_at ASC LIMIT 1000',
      )]
      return rows.map((r) => JSON.parse(r.stroke_data) as WhiteboardStroke)
    } catch {
      return []
    }
  }

  private layQueue(): QueueItem[] {
    try {
      const rows = [...this.ctx.storage.sql.exec<{
        id: string
        video_id: string
        title: string
        added_by: string
        added_at: number
      }>('SELECT id, video_id, title, added_by, added_at FROM playlist_queue ORDER BY position ASC LIMIT 50')]
      return rows.map((r) => ({
        id: r.id,
        videoId: r.video_id,
        title: r.title,
        addedBy: r.added_by,
        addedAt: r.added_at,
      }))
    } catch {
      return []
    }
  }

  private layChat(): RoomChatMessage[] {
    try {
      const rows = [...this.ctx.storage.sql.exec<{
        id: number
        account_id: number
        sender_name: string
        content: string
        created_at: number
      }>('SELECT id, account_id, sender_name, content, created_at FROM room_chat ORDER BY id DESC LIMIT 50')]
      return rows.reverse().map((r) => ({
        id: String(r.id),
        accountId: r.account_id,
        ten: r.sender_name,
        text: r.content,
        taoLuc: r.created_at,
      }))
    } catch {
      return []
    }
  }

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

    let accountId = 0
    if (key.startsWith('acc:')) {
      accountId = parseInt(key.slice(4), 10) || 0
    }

    this.nạpDuLieuNeuCan()

    // Nếu chưa có chủ phòng thì người đầu tiên vào làm chủ phòng
    if (!this.hostKey) {
      this.hostKey = key
      this.luuMeta('host_key', key)
    }

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({ key, ten, accountId, mic: false } satisfies AttachmentKetNoi)

    // Gửi snapshot ngay cho người mới vào
    const snapshot: GoiPhong = {
      type: 'room.snapshot',
      roomId: this.ctx.id.toString(),
      hostKey: this.hostKey,
      members: this.layDanhSachThanhVien(),
      media: this.media,
      pomodoro: this.pomodoro,
      notes: this.notes,
      strokes: this.layStrokes(),
      queue: this.layQueue(),
      chat: this.layChat(),
      serverNow: Date.now(),
    }
    try {
      server.send(JSON.stringify(snapshot))
    } catch {}

    // Broadcast presence cho toàn phòng
    this.phatDanhSach()

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string' || message.length > 65536) return
    let goi: LenhPhong
    try {
      const raw = JSON.parse(message) as unknown
      if (!raw || typeof raw !== 'object' || !('type' in raw)) return
      goi = raw as LenhPhong
    } catch {
      return
    }

    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return
    const laHost = att.key === this.hostKey

    switch (goi.type) {
      case 'ping': {
        const t = typeof (goi as { t?: number }).t === 'number' ? (goi as { t: number }).t : Date.now()
        ws.send(JSON.stringify({ type: 'pong', t, serverNow: Date.now() }))
        break
      }

      case 'media.action': {
        const d = goi.data
        if (this.media.hostOnlyControl && !laHost) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng mới có quyền điều khiển video.' }))
          return
        }

        const now = Date.now()
        if (d.action === 'play') {
          this.media = { ...this.media, status: 'playing', time: d.time, updatedAt: now }
        } else if (d.action === 'pause') {
          this.media = { ...this.media, status: 'paused', time: d.time, updatedAt: now }
        } else if (d.action === 'seek') {
          this.media = { ...this.media, time: d.time, updatedAt: now }
        } else if (d.action === 'rate') {
          this.media = { ...this.media, playbackRate: d.rate, updatedAt: now }
        } else if (d.action === 'load') {
          this.media = {
            ...this.media,
            videoId: d.videoId,
            title: d.title || 'Video bài học',
            status: 'paused',
            time: 0,
            updatedAt: now,
          }
        } else if (d.action === 'set_host_only' && laHost) {
          this.media = { ...this.media, hostOnlyControl: d.enabled }
        }

        this.luuMeta('media', this.media)
        this.broadcast({ type: 'media.sync', state: this.media, serverNow: now })
        break
      }

      case 'pomodoro.action': {
        const d = goi.data
        const now = Date.now()

        if (d.action === 'start') {
          const endsAt = now + this.pomodoro.remaining * 1000
          this.pomodoro = { ...this.pomodoro, running: true, endsAt }
        } else if (d.action === 'pause') {
          const remaining = this.pomodoro.endsAt > now
            ? Math.max(0, Math.round((this.pomodoro.endsAt - now) / 1000))
            : 0
          this.pomodoro = { ...this.pomodoro, running: false, endsAt: 0, remaining }
        } else if (d.action === 'reset') {
          const dur = d.duration || (this.pomodoro.mode === 'focus' ? 1500 : 300)
          this.pomodoro = {
            ...this.pomodoro,
            running: false,
            duration: dur,
            remaining: dur,
            endsAt: 0,
          }
        } else if (d.action === 'switch_mode') {
          const dur = d.mode === 'focus' ? 1500 : 300
          const round = d.mode === 'focus' ? this.pomodoro.round + 1 : this.pomodoro.round
          this.pomodoro = {
            ...this.pomodoro,
            mode: d.mode,
            running: false,
            duration: dur,
            remaining: dur,
            endsAt: 0,
            round,
          }
        }

        this.luuMeta('pomodoro', this.pomodoro)
        this.broadcast({ type: 'pomodoro.sync', state: this.pomodoro, serverNow: now })
        break
      }

      case 'whiteboard.action': {
        const d = goi.data
        if (d.action === 'stroke.add') {
          try {
            this.ctx.storage.sql.exec(
              'INSERT INTO whiteboard_strokes (id, stroke_data, created_at) VALUES (?1, ?2, ?3)',
              d.stroke.id,
              JSON.stringify(d.stroke),
              Date.now(),
            )
          } catch (err) {
            console.error('Lỗi lưu nét vẽ whiteboard:', err)
          }
          this.broadcast({ type: 'whiteboard.sync', action: 'stroke.add', stroke: d.stroke })
        } else if (d.action === 'stroke.clear') {
          try {
            this.ctx.storage.sql.exec('DELETE FROM whiteboard_strokes')
          } catch {}
          this.broadcast({ type: 'whiteboard.sync', action: 'stroke.clear' })
        }
        break
      }

      case 'notes.action': {
        const text = goi.data.content ?? ''
        this.notes = {
          content: text,
          lastEditedBy: att.ten || 'Thành viên',
          updatedAt: Date.now(),
        }
        this.luuMeta('notes', this.notes)
        this.broadcast({ type: 'notes.sync', notes: this.notes }, ws)
        break
      }

      case 'queue.action': {
        const d = goi.data
        if (d.action === 'add') {
          const queue = this.layQueue()
          const pos = queue.length + 1
          const item: QueueItem = {
            id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            videoId: d.videoId,
            title: d.title,
            addedBy: att.ten,
            addedAt: Date.now(),
          }
          try {
            this.ctx.storage.sql.exec(
              'INSERT INTO playlist_queue (id, video_id, title, added_by, added_at, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
              item.id,
              item.videoId,
              item.title,
              item.addedBy,
              item.addedAt,
              pos,
            )
          } catch {}
          this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
        } else if (d.action === 'remove') {
          try {
            this.ctx.storage.sql.exec('DELETE FROM playlist_queue WHERE id = ?1', d.id)
          } catch {}
          this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
        } else if (d.action === 'play') {
          const queue = this.layQueue()
          const target = queue.find((q) => q.id === d.id)
          if (target) {
            try {
              this.ctx.storage.sql.exec('DELETE FROM playlist_queue WHERE id = ?1', d.id)
            } catch {}
            const now = Date.now()
            this.media = {
              ...this.media,
              videoId: target.videoId,
              title: target.title,
              status: 'playing',
              time: 0,
              updatedAt: now,
            }
            this.luuMeta('media', this.media)
            this.broadcast({ type: 'media.sync', state: this.media, serverNow: now })
            this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
          }
        }
        break
      }

      case 'chat.send': {
        const text = lamSachVanBan(goi.text)
        if (!text) return
        const now = Date.now()
        let id = now
        try {
          const res = this.ctx.storage.sql.exec(
            'INSERT INTO room_chat (account_id, sender_name, content, created_at) VALUES (?1, ?2, ?3, ?4) RETURNING id',
            att.accountId,
            att.ten,
            text,
            now,
          )
          const row = [...res][0] as { id: number } | undefined
          if (row) id = row.id
        } catch {}

        const msg: RoomChatMessage = {
          id: String(id),
          accountId: att.accountId,
          ten: att.ten,
          text,
          taoLuc: now,
        }
        if (goi.reqId) {
          ws.send(JSON.stringify({ type: 'ack', reqId: goi.reqId }))
        }
        this.broadcast({ type: 'room.chat', message: msg })
        break
      }

      case 'voice.mic': {
        att.mic = Boolean(goi.mic)
        ws.serializeAttachment(att)
        this.phatDanhSach()
        break
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    } catch {}
    this.phatDanhSach(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.phatDanhSach(ws)
  }

  private layDanhSachThanhVien(boQua?: WebSocket): ThanhVienPhong[] {
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => ws !== boQua)
    const map = new Map<string, ThanhVienPhong>()

    for (const ws of dsKetNoi) {
      const att = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (!att) continue
      const cu = map.get(att.key)
      if (cu) {
        cu.soKetNoi++
        if (att.mic) cu.mic = true
      } else {
        map.set(att.key, {
          key: att.key,
          ten: att.ten,
          soKetNoi: 1,
          mic: att.mic,
          isHost: att.key === this.hostKey,
        })
      }
    }

    return [...map.values()]
  }

  private phatDanhSach(boQua?: WebSocket): void {
    const members = this.layDanhSachThanhVien(boQua)
    const goi = JSON.stringify({ type: 'presence', members })
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => ws !== boQua)

    for (const ws of dsKetNoi) {
      try {
        ws.send(goi)
      } catch {}
    }
  }

  private broadcast(packet: GoiPhong, boQua?: WebSocket): void {
    const json = JSON.stringify(packet)
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => ws !== boQua)

    for (const ws of dsKetNoi) {
      try {
        ws.send(json)
      } catch {}
    }
  }
}
