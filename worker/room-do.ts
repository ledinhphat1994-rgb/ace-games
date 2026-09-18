import { DurableObject } from 'cloudflare:workers'
import {
  LenhPhong,
  canonicalMediaPosition,
  YOUTUBE_VIDEO_ID_REGEX,
  type GoiPhong,
  type MediaState,
  type PomodoroState,
  type QueueItem,
  type RoomChatMessage,
  type SharedNotes,
  type ThanhVienPhong,
  type WhiteboardStroke,
  type SlideState,
  type VoiceParticipantState,
} from '../shared/protocol/room'
import {
  type BanSanh,
  type BoardCell,
  type GameMetaState,
  type GoiGame,
  LenhGame,
  type PlayerSide,
} from '../shared/protocol/game'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import {
  coNuocDiHopLeReversi,
  demQuanReversi,
  kiemTraThangCaro,
  kiemTraThangConnect4,
  kiemTraVaLatReversi,
  taoBanMoi,
} from './game-engine'
import { lamSachVanBan, MA_DONG_SOCKET } from '../shared/protocol/common'

interface AttachmentKetNoi {
  key: string
  ten: string
  accountId: number
  role: string
  isAdmin: boolean
  isTeacher: boolean
  canModerate: boolean
  lopId: number | null
  mic: boolean
  isGame?: boolean
}

const DEFAULT_MEDIA: MediaState = {
  videoId: 'dQw4w9WgXcQ',
  title: 'Video học tập chung',
  status: 'paused',
  time: 0,
  updatedAt: Date.now(),
  playbackRate: 1,
  hostOnlyControl: true, // P0 Governance: Mặc định bảo vệ video khỏi thao tác tùy tiện của thành viên
}

const DEFAULT_POMODORO: PomodoroState = {
  running: false,
  mode: 'focus',
  duration: 1500,
  endsAt: 0,
  remaining: 1500,
  round: 1,
  revision: 1,
}

const DEFAULT_NOTES: SharedNotes = {
  content: '# Ghi chú bài học 📝\n\n- Thảo luận và ghi lại các công thức quan trọng tại đây.',
  lastEditedBy: 'Hệ thống',
  updatedAt: Date.now(),
  revision: 1,
}

const DEFAULT_GAME_META: GameMetaState = {
  gameType: 'caro_15',
  playerX: null,
  playerXName: null,
  playerO: null,
  playerOName: null,
  currentTurn: 'X',
  status: 'waiting',
  winner: null,
  winLine: null,
  turnTimerSeconds: 30,
  turnTimerEndsAt: 0,
  scoreX: 0,
  scoreO: 0,
}

export class RoomDO extends DurableObject<Env> {
  private media: MediaState = { ...DEFAULT_MEDIA }
  private pomodoro: PomodoroState = { ...DEFAULT_POMODORO }
  private notes: SharedNotes = { ...DEFAULT_NOTES }
  private slide: SlideState | null = null
  private whiteboardEpoch = 1
  private gameMeta: GameMetaState = { ...DEFAULT_GAME_META }
  private gameBoard: BoardCell[][] = taoBanMoi('caro_15')
  private hostKey: string | null = null
  private isGameRoom = false
  private khoiTaoXong = false
  // Mã bàn public (đoạn cuối của /ws/game/<maPhong>) — dùng để báo GameLobbyDO, khác với ctx.id nội bộ của DO.
  private gameRoomId: string | null = null
  private voiceRegistry = new Map<string, VoiceParticipantState>()
  private voiceGeneration = new Map<string, number>()
  private voiceSessions = new Map<string, { actorKey: string; generation: number; createdAt: number; updatedAt: number; tracks: Set<string> }>()
  private kickCooldowns = new Map<string, { cooldownId: string; expiresAt: number; authorityRank: number; revision: number }>()

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
          added_by_key TEXT,
          added_at INTEGER NOT NULL,
          position INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS room_chat (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id INTEGER NOT NULL,
          req_id TEXT,
          sender_name TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          meta TEXT NOT NULL,
          board TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS voice_sessions (
          session_id TEXT PRIMARY KEY,
          actor_key TEXT NOT NULL,
          generation INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS voice_publications (
          actor_key TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          track_name TEXT NOT NULL,
          mid TEXT,
          generation INTEGER NOT NULL,
          status TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS voice_generations (
          actor_key TEXT PRIMARY KEY,
          generation INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS kick_cooldowns (
          actor_key TEXT PRIMARY KEY,
          cooldown_id TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          authority_rank INTEGER DEFAULT 3,
          issuer_key TEXT,
          revision INTEGER NOT NULL DEFAULT 1
        );
      `)
      try {
        this.ctx.storage.sql.exec('ALTER TABLE playlist_queue ADD COLUMN added_by_key TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_chat ADD COLUMN req_id TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE voice_publications ADD COLUMN mid TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec(
          'CREATE UNIQUE INDEX IF NOT EXISTS idx_room_chat_actor_req ON room_chat(account_id, req_id) WHERE req_id IS NOT NULL',
        )
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE kick_cooldowns ADD COLUMN cooldown_id TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE kick_cooldowns ADD COLUMN authority_rank INTEGER DEFAULT 3')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE kick_cooldowns ADD COLUMN issuer_key TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE kick_cooldowns ADD COLUMN revision INTEGER NOT NULL DEFAULT 1')
      } catch {}
      try {
        this.ctx.storage.sql.exec("UPDATE kick_cooldowns SET cooldown_id = hex(randomblob(16)) WHERE cooldown_id IS NULL")
      } catch {}
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
          try {
            const p = JSON.parse(r.value) as PomodoroState
            this.pomodoro = { ...p, revision: typeof p.revision === 'number' ? p.revision : 1 }
          } catch {}
        } else if (r.key === 'notes') {
          try {
            const n = JSON.parse(r.value) as SharedNotes
            this.notes = { ...n, revision: typeof n.revision === 'number' ? n.revision : 1 }
          } catch {}
        } else if (r.key === 'whiteboard_epoch') {
          const ep = parseInt(r.value, 10)
          if (Number.isFinite(ep) && ep > 0) this.whiteboardEpoch = ep
        } else if (r.key === 'slide') {
          try { this.slide = JSON.parse(r.value) as SlideState } catch {}
        } else if (r.key === 'host_key') {
          this.hostKey = r.value
        }
      }

      // Đọc game_state
      const gameRow = [...this.ctx.storage.sql.exec<{ meta: string; board: string }>('SELECT meta, board FROM game_state WHERE id = 1')][0]
      if (gameRow) {
        try {
          this.gameMeta = JSON.parse(gameRow.meta) as GameMetaState
          this.gameBoard = JSON.parse(gameRow.board) as BoardCell[][]
        } catch {}
      }

      // Đọc voice_generations
      try {
        const genRows = [...this.ctx.storage.sql.exec<{ actor_key: string; generation: number }>(
          'SELECT actor_key, generation FROM voice_generations',
        )]
        for (const gr of genRows) {
          this.voiceGeneration.set(gr.actor_key, gr.generation)
        }
      } catch {}

      // Đọc voice_sessions & voice_publications có giới hạn TTL (2 giờ)
      const now = Date.now()
      const SESSION_TTL_MS = 2 * 60 * 60 * 1000
      try {
        const sesRows = [...this.ctx.storage.sql.exec<{
          session_id: string
          actor_key: string
          generation: number
          created_at: number
          updated_at: number
        }>('SELECT session_id, actor_key, generation, created_at, updated_at FROM voice_sessions')]
        for (const sr of sesRows) {
          if (now - sr.updated_at < SESSION_TTL_MS) {
            this.voiceSessions.set(sr.session_id, {
              actorKey: sr.actor_key,
              generation: sr.generation,
              createdAt: sr.created_at,
              updatedAt: sr.updated_at,
              tracks: new Set(),
            })
          } else {
            this.ctx.storage.sql.exec('DELETE FROM voice_sessions WHERE session_id = ?1', sr.session_id)
          }
        }
      } catch {}

      try {
        const pubRows = [...this.ctx.storage.sql.exec<{
          actor_key: string
          session_id: string
          track_name: string
          mid: string | null
          generation: number
          status: string
          updated_at: number
        }>('SELECT actor_key, session_id, track_name, mid, generation, status, updated_at FROM voice_publications')]
        for (const pr of pubRows) {
          if (now - pr.updated_at < SESSION_TTL_MS && (pr.status === 'live' || pr.status === 'muted')) {
            this.voiceRegistry.set(pr.actor_key, {
              actorKey: pr.actor_key,
              ten: pr.actor_key,
              status: pr.status as 'live' | 'muted',
              sessionId: pr.session_id,
              audioTrackId: pr.track_name,
              mid: pr.mid ?? undefined,
              generation: pr.generation,
              updatedAt: pr.updated_at,
            })
          } else {
            this.ctx.storage.sql.exec('DELETE FROM voice_publications WHERE actor_key = ?1', pr.actor_key)
          }
        }
      } catch {}

      // Đối soát với các kết nối WebSocket đang hoạt động (prune mọi publication không có kết nối sống)
      const activeSockets = this.ctx.getWebSockets()
      const activeActorKeys = new Set<string>()
      for (const ws of activeSockets) {
        const a = ws.deserializeAttachment() as AttachmentKetNoi | null
        if (a?.key) {
          activeActorKeys.add(a.key)
          const pub = this.voiceRegistry.get(a.key)
          if (pub) {
            pub.ten = a.ten
            a.mic = pub.status === 'live'
            ws.serializeAttachment(a)
          }
        }
      }
      for (const [actorKey] of this.voiceRegistry) {
        if (!activeActorKeys.has(actorKey)) {
          this.voiceRegistry.delete(actorKey)
          try {
            this.ctx.storage.sql.exec('DELETE FROM voice_publications WHERE actor_key = ?1', actorKey)
          } catch {}
        }
      }
    } catch (err) {
      console.error('Lỗi nạp room_meta / game_state / voice_state:', err)
    }

    this.khoiTaoXong = true
  }

  private kiemTraVaCapNhatPomodoro(now: number): boolean {
    if (!this.pomodoro.running || this.pomodoro.endsAt <= 0 || now < this.pomodoro.endsAt) {
      return false
    }
    const nextMode: 'focus' | 'break' = this.pomodoro.mode === 'focus' ? 'break' : 'focus'
    const nextDuration = nextMode === 'focus' ? 1500 : 300
    const nextRound = nextMode === 'focus' ? this.pomodoro.round + 1 : this.pomodoro.round
    this.pomodoro = {
      ...this.pomodoro,
      mode: nextMode,
      running: false,
      duration: nextDuration,
      remaining: nextDuration,
      endsAt: 0,
      round: nextRound,
      revision: (this.pomodoro.revision || 1) + 1,
    }
    this.luuMeta('pomodoro', this.pomodoro)
    return true
  }

  override async alarm(): Promise<void> {
    const now = Date.now()
    if (this.kiemTraVaCapNhatPomodoro(now)) {
      this.broadcast({ type: 'pomodoro.sync', state: this.pomodoro, serverNow: now })
    }
  }

  private luuGameState(): void {
    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO game_state (id, meta, board) VALUES (1, ?1, ?2) ON CONFLICT(id) DO UPDATE SET meta = ?1, board = ?2',
        JSON.stringify(this.gameMeta),
        JSON.stringify(this.gameBoard),
      )
    } catch (err) {
      console.error('Lỗi lưu game_state:', err)
    }
  }

  private broadcastGame(packet: GoiGame, boQua?: WebSocket): void {
    const json = JSON.stringify(packet)
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => ws !== boQua)
    for (const ws of dsKetNoi) {
      try {
        ws.send(json)
      } catch {}
    }
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
        'SELECT stroke_data FROM whiteboard_strokes ORDER BY created_at ASC LIMIT 200',
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
        added_by_key: string | null
        added_at: number
      }>('SELECT id, video_id, title, added_by, added_by_key, added_at FROM playlist_queue ORDER BY position ASC LIMIT 50')]
      return rows.map((r) => ({
        id: r.id,
        videoId: r.video_id,
        title: r.title,
        addedBy: r.added_by,
        addedByKey: r.added_by_key ?? undefined,
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
    const url = new URL(request.url)
    if (url.pathname.startsWith('/internal/')) {
      return this.xuLyYeuCauNoiBo(request, url)
    }

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

    const role = request.headers.get('X-Actor-Role') || 'student'
    const isAdmin = request.headers.get('X-Actor-Is-Admin') === '1'
    const isTeacher = request.headers.get('X-Actor-Is-Teacher') === '1'
    const lopIdStr = request.headers.get('X-Actor-Lop-Id')
    const lopId = lopIdStr ? parseInt(lopIdStr, 10) || null : null

    this.nạpDuLieuNeuCan()

    // ── Kick Cooldown Gate (server-authoritative durable storage, fail-closed) ──
    const cdResult = this.kiemTraKickCooldown(key)
    if (cdResult.status === 'error') {
      return new Response(
        JSON.stringify({
          type: 'error',
          code: 'storage_error',
          message: 'Không thể xác minh trạng thái kết nối phòng. Vui lòng thử lại sau.',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }
    if (cdResult.status === 'active') {
      const remainingSec = Math.ceil(cdResult.remainingMs / 1000)
      return new Response(
        JSON.stringify({
          type: 'error',
          code: 'kicked_cooldown',
          message: `Bạn vừa bị mời ra khỏi phòng. Vui lòng chờ ${remainingSec} giây trước khi vào lại.`,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    // ── Capacity Gate (server-authoritative, unique actor) ──
    // Cho phép cùng một actor mở nhiều tab mà không tốn thêm slot.
    const capacityStr = request.headers.get('X-Room-Capacity')
    if (capacityStr) {
      const capacity = parseInt(capacityStr, 10)
      if (Number.isFinite(capacity) && capacity > 0) {
        const uniqueActors = new Set(
          this.ctx.getWebSockets().map((ws) => {
            const a = ws.deserializeAttachment() as AttachmentKetNoi | null
            return a?.key ?? ''
          }).filter(Boolean),
        )
        // Chỉ từ chối nếu actor này CHƯA có slot (multi-tab của actor đã có slot luôn được vào)
        if (!uniqueActors.has(key) && uniqueActors.size >= capacity) {
          return new Response(JSON.stringify({ type: 'error', code: 'room_full', message: 'Phòng đã đủ sức chứa.' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
    }

    // ── Canonical Host Resolution — STRICT D1 only ──
    // Host key LUÔN là chu_phong_khoa từ D1; Teacher/Admin KHÔNG override hostKey.
    const canonicalHostKey = request.headers.get('X-Room-Host-Key') ?? null
    const canModerate = request.headers.get('X-Actor-Can-Moderate') === '1'
    if (canonicalHostKey) {
      if (!this.hostKey || this.hostKey !== canonicalHostKey) {
        this.hostKey = canonicalHostKey
        this.luuMeta('host_key', canonicalHostKey)
      }
    } else if (!this.hostKey) {
      // Game room / legacy: người đầu tiên vào làm host.
      this.hostKey = key
      this.luuMeta('host_key', key)
    }

    const mode = request.headers.get('X-Room-Mode')
    const laGame = mode === 'game' || this.isGameRoom
    if (laGame) {
      this.isGameRoom = true
      if (!this.gameRoomId) {
        this.gameRoomId = new URL(request.url).pathname.match(/^\/ws\/game\/([^/]+)$/)?.[1] ?? null
      }
    }

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({
      key,
      ten,
      accountId,
      role,
      isAdmin,
      isTeacher,
      canModerate,
      lopId,
      mic: false,
      isGame: laGame,
    } satisfies AttachmentKetNoi)

    if (laGame) {
      const snapshot: GoiGame = {
        type: 'game.snapshot',
        meta: this.gameMeta,
        board: this.gameBoard,
        spectators: this.layDanhSachThanhVien().length,
        serverNow: Date.now(),
      }
      try {
        server.send(JSON.stringify(snapshot))
      } catch {}
    } else {
      // Đảm bảo Pomodoro được cập nhật trạng thái mới nhất nếu đã hết giờ trước khi gửi snapshot
      this.kiemTraVaCapNhatPomodoro(Date.now())

      // Gửi snapshot ngay cho người mới vào phòng học
      const snapshot: GoiPhong = {
        type: 'room.snapshot',
        roomId: this.ctx.id.toString(),
        hostKey: this.hostKey,
        members: this.layDanhSachThanhVien(),
        media: this.media,
        pomodoro: this.pomodoro,
        notes: this.notes,
        strokes: this.layStrokes(),
        whiteboardEpoch: this.whiteboardEpoch,
        queue: this.layQueue(),
        chat: this.layChat(),
        slide: this.slide,
        voiceRegistry: this.getVoiceRegistry(),
        serverNow: Date.now(),
      }
      try {
        server.send(JSON.stringify(snapshot))
      } catch {}
    }

    // Broadcast presence cho toàn phòng
    this.phatDanhSach()

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string' || message.length > 65536) return
    let raw: { type?: string; [k: string]: unknown }
    try {
      const parsed = JSON.parse(message) as unknown
      if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) return
      raw = parsed as { type?: string; [k: string]: unknown }
    } catch {
      return
    }

    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return
    const type = String(raw.type || '')

    if (type === 'ping') {
      const t = typeof raw.t === 'number' ? raw.t : Date.now()
      ws.send(JSON.stringify({ type: 'pong', t, serverNow: Date.now() }))
      return
    }

    if (type.startsWith('game.')) {
      const parseRes = LenhGame.safeParse(raw)
      if (!parseRes.success) {
        ws.send(JSON.stringify({ type: 'error', message: 'Lệnh game không hợp lệ.' }))
        return
      }
      const goi = parseRes.data
      const now = Date.now()

      switch (goi.type) {
        case 'game.init': {
          const gameType = goi.gameType
          const turnSeconds = goi.turnSeconds ?? 30
          this.gameMeta = {
            gameType,
            playerX: att.key,
            playerXName: att.ten,
            playerO: null,
            playerOName: null,
            currentTurn: 'X',
            status: 'waiting',
            winner: null,
            winLine: null,
            turnTimerSeconds: turnSeconds,
            turnTimerEndsAt: 0,
            scoreX: 0,
            scoreO: 0,
          }
          this.gameBoard = taoBanMoi(gameType)
          this.luuGameState()
          this.baoLobby()
          this.broadcastGame({
            type: 'game.sync',
            meta: this.gameMeta,
            board: this.gameBoard,
            serverNow: now,
          })
          break
        }

        case 'game.join': {
          const desiredSide = goi.side
          if (this.gameMeta.playerX === att.key || this.gameMeta.playerO === att.key) {
            this.broadcastGame({
              type: 'game.sync',
              meta: this.gameMeta,
              board: this.gameBoard,
              serverNow: now,
            })
            break
          }
          if (desiredSide === 'X' && !this.gameMeta.playerX) {
            this.gameMeta.playerX = att.key
            this.gameMeta.playerXName = att.ten
          } else if (desiredSide === 'O' && !this.gameMeta.playerO) {
            this.gameMeta.playerO = att.key
            this.gameMeta.playerOName = att.ten
          } else if (!this.gameMeta.playerX) {
            this.gameMeta.playerX = att.key
            this.gameMeta.playerXName = att.ten
          } else if (!this.gameMeta.playerO) {
            this.gameMeta.playerO = att.key
            this.gameMeta.playerOName = att.ten
          }

          if (this.gameMeta.playerX && this.gameMeta.playerO && this.gameMeta.status === 'waiting') {
            this.gameMeta.status = 'playing'
            this.gameMeta.currentTurn = 'X'
            this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
          }

          this.luuGameState()
          this.baoLobby()
          this.broadcastGame({
            type: 'game.sync',
            meta: this.gameMeta,
            board: this.gameBoard,
            serverNow: now,
          })
          break
        }

        case 'game.move': {
          if (this.gameMeta.status !== 'playing') {
            ws.send(JSON.stringify({ type: 'error', message: 'Ván đấu chưa bắt đầu hoặc đã kết thúc.' }))
            return
          }
          const side: PlayerSide | null =
            att.key === this.gameMeta.playerX ? 'X' : (att.key === this.gameMeta.playerO ? 'O' : null)
          if (!side || side !== this.gameMeta.currentTurn) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chưa tới lượt của bạn.' }))
            return
          }

          const { x } = goi
          let { y } = goi

          if (this.gameMeta.gameType === 'caro_15' || this.gameMeta.gameType === 'caro_9') {
            const H = this.gameBoard.length
            const W = this.gameBoard[0].length
            if (x < 0 || x >= W || y < 0 || y >= H || this.gameBoard[y][x] !== null) {
              ws.send(JSON.stringify({ type: 'error', message: 'Nước đi không hợp lệ.' }))
              return
            }
            this.gameBoard[y][x] = side
            const winLine = kiemTraThangCaro(this.gameBoard, x, y, side)
            if (winLine) {
              this.gameMeta.status = 'ended'
              this.gameMeta.winner = side
              this.gameMeta.winLine = winLine
              if (side === 'X') this.gameMeta.scoreX++
              else this.gameMeta.scoreO++
            } else {
              const hetO = this.gameBoard.every((row) => row.every((c) => c !== null))
              if (hetO) {
                this.gameMeta.status = 'ended'
                this.gameMeta.winner = 'draw'
              } else {
                this.gameMeta.currentTurn = side === 'X' ? 'O' : 'X'
                this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
              }
            }
          } else if (this.gameMeta.gameType === 'connect4') {
            const H = this.gameBoard.length
            const W = this.gameBoard[0].length
            if (x < 0 || x >= W) {
              ws.send(JSON.stringify({ type: 'error', message: 'Cột không hợp lệ.' }))
              return
            }
            let dropY = -1
            for (let r = H - 1; r >= 0; r--) {
              if (this.gameBoard[r][x] === null) {
                dropY = r
                break
              }
            }
            if (dropY === -1) {
              ws.send(JSON.stringify({ type: 'error', message: 'Cột này đã đầy.' }))
              return
            }
            y = dropY
            this.gameBoard[y][x] = side
            const winLine = kiemTraThangConnect4(this.gameBoard, x, y, side)
            if (winLine) {
              this.gameMeta.status = 'ended'
              this.gameMeta.winner = side
              this.gameMeta.winLine = winLine
              if (side === 'X') this.gameMeta.scoreX++
              else this.gameMeta.scoreO++
            } else {
              const hetO = this.gameBoard.every((row) => row.every((c) => c !== null))
              if (hetO) {
                this.gameMeta.status = 'ended'
                this.gameMeta.winner = 'draw'
              } else {
                this.gameMeta.currentTurn = side === 'X' ? 'O' : 'X'
                this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
              }
            }
          } else if (this.gameMeta.gameType === 'reversi') {
            const { hopLe, flipped } = kiemTraVaLatReversi(this.gameBoard, x, y, side)
            if (!hopLe) {
              ws.send(JSON.stringify({ type: 'error', message: 'Nước đi Reversi không hợp lệ.' }))
              return
            }
            this.gameBoard[y][x] = side
            for (const [fx, fy] of flipped) {
              this.gameBoard[fy][fx] = side
            }
            const { scoreX, scoreO } = demQuanReversi(this.gameBoard)
            this.gameMeta.scoreX = scoreX
            this.gameMeta.scoreO = scoreO

            const opponent: PlayerSide = side === 'X' ? 'O' : 'X'
            const opponentHasMoves = coNuocDiHopLeReversi(this.gameBoard, opponent)
            const currentHasMoves = coNuocDiHopLeReversi(this.gameBoard, side)

            if (opponentHasMoves) {
              this.gameMeta.currentTurn = opponent
              this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
            } else if (currentHasMoves) {
              this.gameMeta.currentTurn = side
              this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
            } else {
              this.gameMeta.status = 'ended'
              if (scoreX > scoreO) this.gameMeta.winner = 'X'
              else if (scoreO > scoreX) this.gameMeta.winner = 'O'
              else this.gameMeta.winner = 'draw'
            }
          }

          this.luuGameState()
          this.baoLobby()
          this.broadcastGame({
            type: 'game.sync',
            meta: this.gameMeta,
            board: this.gameBoard,
            lastMove: { player: side, x, y },
            serverNow: now,
          })
          break
        }

        case 'game.surrender': {
          if (this.gameMeta.status !== 'playing') return
          const side: PlayerSide | null =
            att.key === this.gameMeta.playerX ? 'X' : (att.key === this.gameMeta.playerO ? 'O' : null)
          if (!side) return
          const winner: PlayerSide = side === 'X' ? 'O' : 'X'
          this.gameMeta.status = 'ended'
          this.gameMeta.winner = winner
          if (winner === 'X') this.gameMeta.scoreX++
          else this.gameMeta.scoreO++
          this.luuGameState()
          this.baoLobby()
          this.broadcastGame({
            type: 'game.sync',
            meta: this.gameMeta,
            board: this.gameBoard,
            serverNow: now,
          })
          break
        }

        case 'game.rematch': {
          this.gameBoard = taoBanMoi(this.gameMeta.gameType)
          this.gameMeta.winner = null
          this.gameMeta.winLine = null
          if (this.gameMeta.gameType === 'reversi') {
            const { scoreX, scoreO } = demQuanReversi(this.gameBoard)
            this.gameMeta.scoreX = scoreX
            this.gameMeta.scoreO = scoreO
          }
          if (this.gameMeta.playerX && this.gameMeta.playerO) {
            this.gameMeta.status = 'playing'
            this.gameMeta.currentTurn = 'X'
            this.gameMeta.turnTimerEndsAt = now + this.gameMeta.turnTimerSeconds * 1000
          } else {
            this.gameMeta.status = 'waiting'
          }
          this.luuGameState()
          this.baoLobby()
          this.broadcastGame({
            type: 'game.sync',
            meta: this.gameMeta,
            board: this.gameBoard,
            serverNow: now,
          })
          break
        }

        case 'game.emote': {
          this.broadcastGame({
            type: 'game.emote',
            sender: att.ten,
            emote: goi.emote,
          })
          break
        }
      }
      return
    }

    // Xử lý các lệnh phòng học thường (LenhPhong)
    const parseRes = LenhPhong.safeParse(raw)
    if (!parseRes.success) {
      ws.send(JSON.stringify({ type: 'error', message: 'Lệnh phòng không hợp lệ.' }))
      return
    }
    const goi = parseRes.data
    const laQuanTri = this.coQuyenDieuKhien(att)

    switch (goi.type) {

      case 'media.action': {
        const d = goi.data
        if (this.media.hostOnlyControl && !laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển video.' }))
          return
        }

        const now = Date.now()
        if (d.action === 'play') {
          const canonicalPos = canonicalMediaPosition(this.media, now)
          this.media = { ...this.media, status: 'playing', time: canonicalPos, updatedAt: now }
        } else if (d.action === 'pause') {
          const canonicalPos = canonicalMediaPosition(this.media, now)
          this.media = { ...this.media, status: 'paused', time: canonicalPos, updatedAt: now }
        } else if (d.action === 'seek') {
          const targetTime = Math.min(86400, Math.max(0, d.time))
          this.media = { ...this.media, time: targetTime, updatedAt: now }
        } else if (d.action === 'rate') {
          const currentCanonicalTime = canonicalMediaPosition(this.media, now)
          this.media = { ...this.media, time: currentCanonicalTime, playbackRate: d.rate, updatedAt: now }
        } else if (d.action === 'load') {
          if (!YOUTUBE_VIDEO_ID_REGEX.test(d.videoId)) {
            ws.send(JSON.stringify({ type: 'error', message: 'ID video YouTube không hợp lệ.' }))
            return
          }
          this.media = {
            ...this.media,
            videoId: d.videoId,
            title: d.title || 'Video bài học',
            status: 'paused',
            time: 0,
            playbackRate: 1,
            updatedAt: now,
          }
        } else if (d.action === 'set_host_only') {
          if (!laQuanTri) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền đổi chế độ điều khiển.' }))
            return
          }
          this.media = { ...this.media, hostOnlyControl: d.enabled }
        }

        this.luuMeta('media', this.media)
        this.broadcast({ type: 'media.sync', state: this.media, serverNow: now })
        break
      }

      case 'pomodoro.action': {
        const d = goi.data
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển Pomodoro.' }))
          return
        }
        const now = Date.now()

        if (d.action === 'start') {
          if (this.pomodoro.running) {
            // Idempotent: already running, do not extend endsAt or change timeline
            return
          }
          const endsAt = now + this.pomodoro.remaining * 1000
          this.pomodoro = {
            ...this.pomodoro,
            running: true,
            endsAt,
            revision: (this.pomodoro.revision || 1) + 1,
          }
          try {
            this.ctx.storage.setAlarm(endsAt)
          } catch (err) {
            console.error('Lỗi đặt DO alarm cho pomodoro:', err)
          }
        } else if (d.action === 'pause') {
          if (!this.pomodoro.running) {
            // Idempotent: already paused
            return
          }
          try {
            this.ctx.storage.deleteAlarm()
          } catch {}
          const remaining = this.pomodoro.endsAt > now
            ? Math.max(0, Math.round((this.pomodoro.endsAt - now) / 1000))
            : 0
          this.pomodoro = {
            ...this.pomodoro,
            running: false,
            endsAt: 0,
            remaining,
            revision: (this.pomodoro.revision || 1) + 1,
          }
        } else if (d.action === 'reset') {
          try {
            this.ctx.storage.deleteAlarm()
          } catch {}
          const rawDur = d.duration || (this.pomodoro.mode === 'focus' ? 1500 : 300)
          const dur = Math.min(7200, Math.max(1, Math.round(rawDur)))
          this.pomodoro = {
            ...this.pomodoro,
            running: false,
            duration: dur,
            remaining: dur,
            endsAt: 0,
            revision: (this.pomodoro.revision || 1) + 1,
          }
        } else if (d.action === 'switch_mode') {
          if (this.pomodoro.mode === d.mode && !this.pomodoro.running) {
            // Idempotent: already in this mode and paused
            return
          }
          try {
            this.ctx.storage.deleteAlarm()
          } catch {}
          const dur = d.mode === 'focus' ? 1500 : 300
          const round = (d.mode === 'focus' && this.pomodoro.mode !== 'focus') ? this.pomodoro.round + 1 : this.pomodoro.round
          this.pomodoro = {
            ...this.pomodoro,
            mode: d.mode,
            running: false,
            duration: dur,
            remaining: dur,
            endsAt: 0,
            round,
            revision: (this.pomodoro.revision || 1) + 1,
          }
        }

        this.luuMeta('pomodoro', this.pomodoro)
        this.broadcast({ type: 'pomodoro.sync', state: this.pomodoro, serverNow: now })
        break
      }

      case 'whiteboard.action': {
        const d = goi.data
        if (d.action === 'stroke.add') {
          const st = d.stroke
          // Epoch guard: stroke.epoch is mandatory and must match current whiteboardEpoch
          if (typeof st.epoch !== 'number' || st.epoch < 0) {
            ws.send(JSON.stringify({ type: 'error', message: 'Nét vẽ thiếu epoch hợp lệ.' }))
            return
          }
          if (st.epoch !== this.whiteboardEpoch) {
            // Stale epoch (e.g. from previous board before clear) -> dropped
            return
          }
          if (!Array.isArray(st.points) || st.points.length === 0 || st.points.length > 200) {
            ws.send(JSON.stringify({ type: 'error', message: 'Nét vẽ vượt quá giới hạn (tối đa 200 điểm).' }))
            return
          }
          const strokeWithEpoch: WhiteboardStroke = {
            ...st,
            epoch: this.whiteboardEpoch,
          }
          try {
            this.ctx.storage.sql.exec(
              'INSERT OR IGNORE INTO whiteboard_strokes (id, stroke_data, created_at) VALUES (?1, ?2, ?3)',
              st.id,
              JSON.stringify(strokeWithEpoch),
              Date.now(),
            )
            // Giới hạn lịch sử tối đa 200 nét vẽ gần nhất
            this.ctx.storage.sql.exec(
              'DELETE FROM whiteboard_strokes WHERE id NOT IN (SELECT id FROM whiteboard_strokes ORDER BY created_at DESC LIMIT 200)',
            )
          } catch (err) {
            console.error('Lỗi lưu nét vẽ whiteboard:', err)
          }
          this.broadcast({ type: 'whiteboard.sync', action: 'stroke.add', stroke: strokeWithEpoch })
        } else if (d.action === 'stroke.clear') {
          if (!laQuanTri) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền xóa toàn bộ bảng vẽ.' }))
            return
          }
          this.whiteboardEpoch++
          this.luuMeta('whiteboard_epoch', String(this.whiteboardEpoch))
          try {
            this.ctx.storage.sql.exec('DELETE FROM whiteboard_strokes')
          } catch {}
          this.broadcast({ type: 'whiteboard.sync', action: 'stroke.clear', epoch: this.whiteboardEpoch })
        }
        break
      }

      case 'notes.action': {
        // Shared notes is open to all admitted room members, protected by Optimistic Concurrency Control (OCC)
        const text = goi.data.content ?? ''
        const baseRev = goi.data.baseRevision
        if (typeof baseRev !== 'number' || baseRev < 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Thiếu baseRevision hợp lệ cho ghi chú.' }))
          return
        }

        // Optimistic Concurrency Control: Kiểm tra conflict revision tránh silent lost updates
        if (baseRev !== this.notes.revision) {
          ws.send(
            JSON.stringify({
              type: 'notes.conflict',
              currentNotes: this.notes,
              rejectedContent: text,
            }),
          )
          return
        }

        this.notes = {
          content: text,
          lastEditedBy: att.ten || 'Thành viên',
          updatedAt: Date.now(),
          revision: (this.notes.revision || 1) + 1,
        }
        this.luuMeta('notes', this.notes)
        // Broadcast tới mọi người (bao gồm cả người gửi để client nhận được revision mới nhất)
        this.broadcast({ type: 'notes.sync', notes: this.notes })
        break
      }

      case 'queue.action': {
        const d = goi.data
        if (d.action === 'add') {
          if (typeof d.videoId !== 'string' || d.videoId.length < 1 || d.videoId.length > 64) {
            ws.send(JSON.stringify({ type: 'error', message: 'ID video trong hàng đợi không hợp lệ.' }))
            return
          }
          const queue = this.layQueue()
          const pos = queue.length + 1
          const item: QueueItem = {
            id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            videoId: d.videoId,
            title: d.title,
            addedBy: att.ten,
            addedByKey: att.key,
            addedAt: Date.now(),
          }
          try {
            this.ctx.storage.sql.exec(
              'INSERT INTO playlist_queue (id, video_id, title, added_by, added_by_key, added_at, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
              item.id,
              item.videoId,
              item.title,
              item.addedBy,
              att.key,
              item.addedAt,
              pos,
            )
          } catch {}
          this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
        } else if (d.action === 'remove') {
          const queue = this.layQueue()
          const target = queue.find((q) => q.id === d.id)
          // So sánh bằng actorKey; display name trùng nhau không gây nhầm ownership
          if (target && !laQuanTri && (target.addedByKey ?? null) !== att.key) {
            ws.send(JSON.stringify({ type: 'error', message: 'Bạn không thể xóa bài hát của người khác.' }))
            return
          }
          try {
            this.ctx.storage.sql.exec('DELETE FROM playlist_queue WHERE id = ?1', d.id)
          } catch {}
          this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
        } else if (d.action === 'play') {
          if (this.media.hostOnlyControl && !laQuanTri) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền phát video từ danh sách chờ.' }))
            return
          }
          const queue = this.layQueue()
          const target = queue.find((q) => q.id === d.id)
          if (target) {
            if (!YOUTUBE_VIDEO_ID_REGEX.test(target.videoId)) {
              ws.send(JSON.stringify({ type: 'error', message: 'ID video YouTube trong hàng đợi không hợp lệ.' }))
              return
            }
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
              playbackRate: 1,
              updatedAt: now,
            }
            this.luuMeta('media', this.media)
            this.broadcast({ type: 'media.sync', state: this.media, serverNow: now })
            this.broadcast({ type: 'queue.sync', queue: this.layQueue() })
          }
        }
        break
      }

      case 'slide.action': {
        const d = goi.data
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển tài liệu trình chiếu.' }))
          return
        }
        if (d.action === 'change_page') {
          if (this.slide) {
            this.slide = {
              ...this.slide,
              currentPage: Math.min(Math.max(1, d.page), this.slide.totalPages),
            }
          }
        } else if (d.action === 'load_doc') {
          const rawUrl = d.docUrl.trim()
          let pathname = rawUrl
          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
            try {
              pathname = new URL(rawUrl).pathname
            } catch {
              pathname = rawUrl
            }
          }
          const isR2Asset = !pathname.includes('..') && (/^\/api\/files\/[a-zA-Z0-9_./-]+$/.test(pathname) || /^\/api\/slides\/[a-zA-Z0-9_./-]+$/.test(pathname))
          const isGoogleSlide = /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+(\/.*)?$/.test(rawUrl)
          if (!isR2Asset && !isGoogleSlide) {
            ws.send(JSON.stringify({ type: 'error', message: 'Đường dẫn tài liệu không hợp lệ. Chỉ chấp nhận tệp tải lên (/api/files/...) hoặc Google Slides.' }))
            return
          }
          const totalPages = d.fileType === 'image' ? 1 : Math.max(1, Math.min(500, d.totalPages))
          this.slide = {
            docUrl: isR2Asset ? pathname : rawUrl,
            docName: lamSachVanBan(d.docName) || 'Tài liệu trình chiếu',
            fileType: d.fileType,
            currentPage: 1,
            totalPages,
          }
        } else if (d.action === 'close_doc') {
          this.slide = null
        }
        this.luuMeta('slide', this.slide)
        this.broadcast({ type: 'slide.sync', slide: this.slide })
        break
      }

      case 'chat.send': {
        const text = lamSachVanBan(goi.text)
        if (!text) return
        const reqId = goi.reqId?.trim()
        if (!reqId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Thiếu reqId tin nhắn.' }))
          return
        }

        // Durable deduplication by (account_id, req_id) in SQLite
        try {
          const existing = [...this.ctx.storage.sql.exec<{ id: number }>(
            'SELECT id FROM room_chat WHERE account_id = ?1 AND req_id = ?2 LIMIT 1',
            att.accountId,
            reqId,
          )]
          if (existing.length > 0) {
            ws.send(JSON.stringify({ type: 'ack', reqId }))
            return
          }
        } catch (err) {
          console.error('Lỗi kiểm tra chat dedup:', err)
        }

        const now = Date.now()
        let id = now
        try {
          const res = this.ctx.storage.sql.exec(
            'INSERT INTO room_chat (account_id, req_id, sender_name, content, created_at) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id',
            att.accountId,
            reqId,
            att.ten,
            text,
            now,
          )
          const row = [...res][0] as { id: number } | undefined
          if (row) id = row.id

          // Giữ tối đa 200 tin nhắn gần nhất trong SQLite
          this.ctx.storage.sql.exec(
            'DELETE FROM room_chat WHERE id NOT IN (SELECT id FROM room_chat ORDER BY id DESC LIMIT 200)',
          )
        } catch (err: any) {
          if (String(err).includes('UNIQUE') || String(err).includes('constraint')) {
            ws.send(JSON.stringify({ type: 'ack', reqId }))
            return
          }
          console.error('Lỗi lưu chat vào SQLite:', err)
        }

        const msg: RoomChatMessage = {
          id: String(id),
          accountId: att.accountId,
          ten: att.ten,
          text,
          taoLuc: now,
        }
        ws.send(JSON.stringify({ type: 'ack', reqId }))
        this.broadcast({ type: 'room.chat', message: msg })
        break
      }

      case 'voice.self_state': {
        const pub = this.voiceRegistry.get(att.key)
        if (!pub) {
          break
        }
        if (typeof goi.generation === 'number' && pub.generation !== goi.generation) {
          break
        }
        const nextStatus = goi.muted ? 'muted' : 'live'
        this.updateVoiceStatus(att.key, nextStatus, goi.generation)
        break
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason)
    } catch {}
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (att) {
      const conLai = this.ctx.getWebSockets().filter((w) => {
        if (w === ws || w.readyState !== WebSocket.OPEN) return false
        const a = w.deserializeAttachment() as AttachmentKetNoi | null
        return a?.key === att.key
      })
      if (conLai.length === 0) {
        this.removeVoicePublication(att.key)
      }
    }
    this.phatDanhSach(ws)
    this.baoRoiLobbyNeuTrong(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (att) {
      const conLai = this.ctx.getWebSockets().filter((w) => {
        if (w === ws || w.readyState !== WebSocket.OPEN) return false
        const a = w.deserializeAttachment() as AttachmentKetNoi | null
        return a?.key === att.key
      })
      if (conLai.length === 0) {
        this.removeVoicePublication(att.key)
      }
    }
    this.phatDanhSach(ws)
    this.baoRoiLobbyNeuTrong(ws)
  }

  private coQuyenDieuKhien(att: AttachmentKetNoi): boolean {
    // Host canonical từ D1 HOẶC actor có canModerate (teacher đã duyệt / admin trường).
    // KHÔNG dùng isTeacher/isAdmin trực tiếp để tránh identity = authorization leak.
    return att.key === this.hostKey || att.canModerate
  }

  private layDanhSachThanhVien(boQua?: WebSocket): ThanhVienPhong[] {
    const dsKetNoi = this.ctx.getWebSockets().filter((ws) => (boQua ? ws !== boQua : true) && ws.readyState === WebSocket.OPEN)
    const map = new Map<string, ThanhVienPhong>()

    for (const ws of dsKetNoi) {
      const att = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (!att) continue
      const isVoiceLive = this.voiceRegistry.get(att.key)?.status === 'live'
      const cu = map.get(att.key)
      if (cu) {
        cu.soKetNoi++
        if (att.mic || isVoiceLive) cu.mic = true
      } else {
        map.set(att.key, {
          key: att.key,
          ten: att.ten,
          soKetNoi: 1,
          mic: Boolean(att.mic || isVoiceLive),
          isHost: att.key === this.hostKey,
          canModerate: Boolean(att.canModerate),
        })
      }
    }

    return [...map.values()]
  }

  // Báo GameLobbyDO bàn đang chờ/đang chơi (upsert) hoặc đã kết thúc (gỡ khỏi sảnh) — không chờ kết quả,
  // lỗi báo cáo không được phép làm hỏng phản hồi nước đi thật cho người chơi.
  private baoLobby(): void {
    if (!this.isGameRoom || !this.gameRoomId) return
    const ban: BanSanh = {
      id: this.gameRoomId,
      gameType: this.gameMeta.gameType,
      tenChu: this.gameMeta.playerXName,
      tenKhach: this.gameMeta.playerOName,
      trangThai: this.gameMeta.status,
      soNguoiXem: this.layDanhSachThanhVien().length,
      turnTimerSeconds: this.gameMeta.turnTimerSeconds,
      capNhatLuc: Date.now(),
    }
    const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
    const rpc = ban.trangThai === 'ended' ? lobby.xoaBan(ban.id) : lobby.capNhatBan(ban)
    this.ctx.waitUntil(rpc.catch((err: unknown) => console.error('Không báo được GameLobbyDO:', err)))
  }

  // Phòng đã trống hẳn (mọi người, kể cả khán giả, đã rời) — gỡ khỏi sảnh dù ván chưa kết thúc.
  private baoRoiLobbyNeuTrong(vuaRoi: WebSocket): void {
    if (!this.isGameRoom || !this.gameRoomId) return
    if (this.layDanhSachThanhVien(vuaRoi).length > 0) return
    const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
    this.ctx.waitUntil(
      lobby.xoaBan(this.gameRoomId).catch((err: unknown) => console.error('Không gỡ được khỏi GameLobbyDO:', err)),
    )
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

  // ── Voice Registry & WebRTC Media Session Coordination ──

  hasConnectedActor(actorKey: string): boolean {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== WebSocket.OPEN) continue
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a?.key === actorKey) {
        return true
      }
    }
    return false
  }

  issueVoiceGeneration(actorKey: string): number {
    const current = this.voiceGeneration.get(actorKey) ?? 0
    const next = current + 1
    this.voiceGeneration.set(actorKey, next)
    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO voice_generations (actor_key, generation) VALUES (?1, ?2) ON CONFLICT(actor_key) DO UPDATE SET generation = ?2',
        actorKey,
        next,
      )
    } catch (err) {
      console.error('Lỗi lưu voice_generations:', err)
    }
    return next
  }

  getVoiceGeneration(actorKey: string): number {
    return this.voiceGeneration.get(actorKey) ?? 0
  }

  getVoiceRegistry(): VoiceParticipantState[] {
    return Array.from(this.voiceRegistry.values())
  }

  getVoiceParticipant(actorKey: string): VoiceParticipantState | null {
    return this.voiceRegistry.get(actorKey) ?? null
  }

  bindVoiceSession(sessionId: string, actorKey: string, generation?: number): void {
    const now = Date.now()
    let gen = generation
    if (typeof gen !== 'number') {
      gen = this.voiceGeneration.get(actorKey) ?? 1
    }
    const current = this.voiceGeneration.get(actorKey) ?? 0
    if (gen > current) {
      this.voiceGeneration.set(actorKey, gen)
      try {
        this.ctx.storage.sql.exec(
          'INSERT INTO voice_generations (actor_key, generation) VALUES (?1, ?2) ON CONFLICT(actor_key) DO UPDATE SET generation = ?2',
          actorKey,
          gen,
        )
      } catch {}
    }
    const existing = this.voiceSessions.get(sessionId)
    if (existing) {
      existing.actorKey = actorKey
      existing.generation = gen
      existing.updatedAt = now
    } else {
      this.voiceSessions.set(sessionId, {
        actorKey,
        generation: gen,
        createdAt: now,
        updatedAt: now,
        tracks: new Set(),
      })
    }
    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO voice_sessions (session_id, actor_key, generation, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(session_id) DO UPDATE SET actor_key = ?2, generation = ?3, updated_at = ?5',
        sessionId,
        actorKey,
        gen,
        now,
        now,
      )
    } catch (err) {
      console.error('Lỗi lưu voice_sessions:', err)
    }
  }

  getVoiceSession(sessionId: string): { actorKey: string; generation: number; createdAt: number; updatedAt: number } | null {
    const s = this.voiceSessions.get(sessionId)
    if (!s) return null
    return {
      actorKey: s.actorKey,
      generation: s.generation,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }
  }

  verifyVoiceSession(sessionId: string, actorKey: string, generation?: number): boolean {
    const s = this.voiceSessions.get(sessionId)
    if (!s) return false
    if (s.actorKey !== actorKey) return false
    if (typeof generation === 'number' && s.generation !== generation) return false
    return true
  }

  getVoiceSessionOwner(sessionId: string): string | null {
    return this.voiceSessions.get(sessionId)?.actorKey ?? null
  }

  addTrackToSession(sessionId: string, trackName: string): void {
    const s = this.voiceSessions.get(sessionId)
    if (s) {
      s.tracks.add(trackName)
    }
  }

  getActorRoleInfo(actorKey: string): { isHost: boolean; canModerate: boolean; ten: string } | null {
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a?.key === actorKey) {
        return {
          isHost: a.key === this.hostKey,
          canModerate: Boolean(a.canModerate),
          ten: a.ten,
        }
      }
    }
    return null
  }

  registerVoicePublication(participant: Omit<VoiceParticipantState, 'updatedAt'>): {
    ok: boolean
    participant?: VoiceParticipantState
    reason?: string
  } {
    // 1. Kiểm tra session ownership và generation khớp
    const session = this.voiceSessions.get(participant.sessionId)
    if (!session || session.actorKey !== participant.actorKey) {
      return { ok: false, reason: 'unauthorized_session' }
    }
    if (session.generation !== participant.generation) {
      return { ok: false, reason: 'generation_mismatch' }
    }

    // 2. Kiểm tra monotonic generation do server cấp
    const currentGen = this.voiceGeneration.get(participant.actorKey) ?? 0
    if (participant.generation < currentGen) {
      return { ok: false, reason: 'stale_generation' }
    }
    if (participant.generation > currentGen) {
      return { ok: false, reason: 'invalid_generation' }
    }

    const state: VoiceParticipantState = {
      ...participant,
      updatedAt: Date.now(),
    }
    this.voiceRegistry.set(participant.actorKey, state)

    this.addTrackToSession(participant.sessionId, participant.audioTrackId)

    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO voice_publications (actor_key, session_id, track_name, mid, generation, status, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ON CONFLICT(actor_key) DO UPDATE SET session_id = ?2, track_name = ?3, mid = ?4, generation = ?5, status = ?6, updated_at = ?7',
        state.actorKey,
        state.sessionId,
        state.audioTrackId,
        state.mid ?? null,
        state.generation,
        state.status,
        state.updatedAt,
      )
    } catch (err) {
      console.error('Lỗi lưu voice_publications:', err)
    }

    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a && a.key === participant.actorKey) {
        a.mic = participant.status === 'live'
        ws.serializeAttachment(a)
      }
    }

    this.broadcast({
      type: 'voice.updated',
      participant: state,
    })
    this.phatDanhSach()
    return { ok: true, participant: state }
  }

  updateVoiceStatus(actorKey: string, status: 'live' | 'muted', generation?: number): boolean {
    const p = this.voiceRegistry.get(actorKey)
    if (!p) return false
    if (typeof generation === 'number' && p.generation !== generation) {
      return false
    }
    p.status = status
    p.updatedAt = Date.now()

    try {
      this.ctx.storage.sql.exec(
        'UPDATE voice_publications SET status = ?1, updated_at = ?2 WHERE actor_key = ?3',
        status,
        p.updatedAt,
        actorKey,
      )
    } catch (err) {
      console.error('Lỗi cập nhật voice_publications:', err)
    }

    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a && a.key === actorKey) {
        a.mic = status === 'live'
        ws.serializeAttachment(a)
      }
    }

    this.broadcast({
      type: 'voice.updated',
      participant: p,
    })
    this.phatDanhSach()
    return true
  }

  removeVoicePublicationExact(params: {
    actorKey: string
    sessionId?: string
    audioTrackId?: string
    trackName?: string
    generation?: number
    mid?: string | null
  }): boolean {
    const p = this.voiceRegistry.get(params.actorKey)
    if (!p) return false
    if (typeof params.generation === 'number' && p.generation !== params.generation) {
      return false
    }
    if (params.sessionId && p.sessionId !== params.sessionId) {
      return false
    }
    const expectedTrackId = params.audioTrackId || params.trackName
    if (expectedTrackId && p.audioTrackId !== expectedTrackId) {
      return false
    }
    if (typeof params.mid === 'string' && p.mid && p.mid !== params.mid) {
      return false
    }

    this.voiceRegistry.delete(params.actorKey)
    try {
      if (typeof params.generation === 'number') {
        this.ctx.storage.sql.exec(
          'DELETE FROM voice_publications WHERE actor_key = ?1 AND generation = ?2',
          params.actorKey,
          params.generation,
        )
      } else {
        this.ctx.storage.sql.exec('DELETE FROM voice_publications WHERE actor_key = ?1', params.actorKey)
      }
    } catch (err) {
      console.error('Lỗi xóa voice_publications:', err)
    }

    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a && a.key === params.actorKey) {
        a.mic = false
        ws.serializeAttachment(a)
      }
    }

    this.broadcast({
      type: 'voice.removed',
      actorKey: params.actorKey,
    })
    this.phatDanhSach()
    return true
  }

  removeVoicePublication(actorKey: string, generation?: number): boolean {
    return this.removeVoicePublicationExact({ actorKey, generation })
  }

  forceMute(
    targetOrParams:
      | {
          targetActorKey: string
          byActorName: string
          sessionId?: string
          trackName?: string
          audioTrackId?: string
          generation?: number
          mid?: string | null
        }
      | string,
    byActorNameLegacy?: string,
    expectedGenerationLegacy?: number,
  ): boolean {
    const params =
      typeof targetOrParams === 'string'
        ? {
            targetActorKey: targetOrParams,
            byActorName: byActorNameLegacy || 'Người điều hành',
            generation: expectedGenerationLegacy,
          }
        : targetOrParams

    const p = this.voiceRegistry.get(params.targetActorKey)
    if (!p) return false
    if (typeof params.generation === 'number' && p.generation !== params.generation) {
      return false
    }
    if (params.sessionId && p.sessionId !== params.sessionId) {
      return false
    }
    const expectedTrackId = params.audioTrackId || params.trackName
    if (expectedTrackId && p.audioTrackId !== expectedTrackId) {
      return false
    }
    if (typeof params.mid === 'string' && p.mid && p.mid !== params.mid) {
      return false
    }

    this.voiceRegistry.delete(params.targetActorKey)
    try {
      this.ctx.storage.sql.exec(
        'DELETE FROM voice_publications WHERE actor_key = ?1',
        params.targetActorKey,
      )
    } catch (err) {
      console.error('Lỗi xóa forceMute voice_publications:', err)
    }

    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a && a.key === params.targetActorKey) {
        a.mic = false
        ws.serializeAttachment(a)
      }
    }

    this.broadcast({
      type: 'voice.force_muted',
      targetKey: params.targetActorKey,
      by: params.byActorName,
    })
    this.broadcast({
      type: 'voice.removed',
      actorKey: params.targetActorKey,
    })
    this.phatDanhSach()
    return true
  }

  private luuKickCooldown(
    actorKey: string,
    expiresAt: number,
    authorityRank: number = 1,
    issuerKey: string = '',
  ): { ok: true; revision: number; cooldownId: string } | { ok: false; error: 'higher_authority' | 'storage_error' } {
    const now = Date.now()
    const cooldownId = crypto.randomUUID()
    // 1. Kiểm tra cooldown hiện hữu trong SQLite: cấp thấp hơn không được phép ghi đè cấp cao hơn
    // Bản ghi legacy cũ thiếu authority_rank được xử lý an toàn bảo thủ (fail-closed) coi như cấp 3 (Admin)
    try {
      const rows = [
        ...this.ctx.storage.sql.exec<{
          actor_key: string
          cooldown_id: string | null
          expires_at: number
          authority_rank: number | null
          revision: number
        }>(
          'SELECT actor_key, cooldown_id, expires_at, authority_rank, revision FROM kick_cooldowns WHERE actor_key = ?1',
          actorKey,
        ),
      ]
      if (rows.length > 0 && rows[0].expires_at > now) {
        const existingAuth = rows[0].authority_rank ?? 3
        if (existingAuth > authorityRank) {
          return { ok: false, error: 'higher_authority' }
        }
      }
    } catch (err) {
      console.error('Lỗi kiểm tra kick_cooldowns trước khi ghi:', err)
      return { ok: false, error: 'storage_error' }
    }

    // 2. Ghi trực tiếp xuống SQLite trước (Authoritative Storage)
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO kick_cooldowns (actor_key, cooldown_id, expires_at, authority_rank, issuer_key, revision)
         VALUES (?1, ?2, ?3, ?4, ?5, 1)
         ON CONFLICT(actor_key) DO UPDATE SET
           cooldown_id = ?2,
           expires_at = ?3,
           authority_rank = ?4,
           issuer_key = ?5,
           revision = kick_cooldowns.revision + 1`,
        actorKey,
        cooldownId,
        expiresAt,
        authorityRank,
        issuerKey,
      )

      const updated = [
        ...this.ctx.storage.sql.exec<{ revision: number }>(
          'SELECT revision FROM kick_cooldowns WHERE actor_key = ?1',
          actorKey,
        ),
      ][0]
      const rev = updated?.revision ?? 1

      // 3. Chỉ cập nhật in-memory Map khi lưu storage thành công
      this.kickCooldowns.set(actorKey, { cooldownId, expiresAt, authorityRank, revision: rev })
      return { ok: true, revision: rev, cooldownId }
    } catch (err) {
      console.error('Lỗi lưu kick_cooldowns SQLite:', err)
      // Tuyệt đối không cập nhật in-memory Map nếu SQLite lỗi
      return { ok: false, error: 'storage_error' }
    }
  }

  private kiemTraKickCooldown(actorKey: string):
    | { status: 'active'; cooldownId: string; expiresAt: number; remainingMs: number; authorityRank: number; revision: number }
    | { status: 'inactive' }
    | { status: 'error'; message: string } {
    const now = Date.now()
    try {
      const rows = [
        ...this.ctx.storage.sql.exec<{
          actor_key: string
          cooldown_id: string | null
          expires_at: number
          authority_rank: number | null
          revision: number
        }>(
          'SELECT actor_key, cooldown_id, expires_at, authority_rank, revision FROM kick_cooldowns WHERE actor_key = ?1',
          actorKey,
        ),
      ]
      if (rows.length > 0) {
        const row = rows[0]
        if (row.expires_at > now) {
          const authRank = row.authority_rank ?? 3
          const rev = row.revision ?? 1
          const cooldownId = row.cooldown_id || 'legacy'
          this.kickCooldowns.set(actorKey, {
            cooldownId,
            expiresAt: row.expires_at,
            authorityRank: authRank,
            revision: rev,
          })
          return {
            status: 'active',
            cooldownId,
            expiresAt: row.expires_at,
            remainingMs: row.expires_at - now,
            authorityRank: authRank,
            revision: rev,
          }
        } else {
          // Hết hạn: dọn dẹp hàng
          this.ctx.storage.sql.exec('DELETE FROM kick_cooldowns WHERE actor_key = ?1', actorKey)
          this.kickCooldowns.delete(actorKey)
          return { status: 'inactive' }
        }
      }
      this.kickCooldowns.delete(actorKey)
      return { status: 'inactive' }
    } catch (err) {
      console.error('Lỗi đọc kick_cooldowns SQLite:', err)
      // In-memory Map không được phép cấp quyền khi authoritative storage gặp lỗi (fail-closed)
      return { status: 'error', message: 'Không thể truy vấn cơ sở dữ liệu cooldown' }
    }
  }

  kickMemberInternal(params: {
    targetActorKey: string
    reason?: string
    byActorName: string
    byActorKey: string
    authorityRank?: number
  }): {
    ok: boolean
    removed: boolean
    absent?: boolean
    message?: string
    cooldownSaved: boolean
    cooldownError?: string
    cooldownId?: string
  } {
    // 1. Luôn thiết lập durable cooldown 5 phút (300_000 ms) trong RoomDO SQLite
    const cooldownUntil = Date.now() + 5 * 60 * 1000
    const cdRes = this.luuKickCooldown(
      params.targetActorKey,
      cooldownUntil,
      params.authorityRank ?? 1,
      params.byActorKey,
    )
    if (!cdRes.ok) {
      console.warn('Lưu kick cooldown không thành công:', cdRes.error)
    }

    const targetSockets = this.ctx.getWebSockets().filter((ws) => {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      return a?.key === params.targetActorKey
    })

    if (targetSockets.length === 0) {
      return {
        ok: cdRes.ok,
        removed: false,
        absent: true,
        message: 'Thành viên không còn trong phòng.',
        cooldownSaved: cdRes.ok,
        cooldownError: cdRes.ok ? undefined : cdRes.error,
        cooldownId: cdRes.ok ? cdRes.cooldownId : undefined,
      }
    }

    // 2. Force mute if target has voice publication
    try {
      this.forceMute({
        targetActorKey: params.targetActorKey,
        byActorName: params.byActorName,
      })
    } catch {}

    // 3. Broadcast room.kicked packet to all connected sockets
    this.broadcast({
      type: 'room.kicked',
      targetKey: params.targetActorKey,
      reason: params.reason || undefined,
      by: params.byActorName,
    })

    // 4. Close all target sockets with close code 4003 (BI_CHAN)
    for (const ws of targetSockets) {
      try {
        ws.close(MA_DONG_SOCKET.BI_CHAN, params.reason || 'Bị mời ra khỏi phòng')
      } catch {}
    }

    // 5. Broadcast presence update to remaining members
    this.phatDanhSach()

    return {
      ok: true,
      removed: true,
      absent: false,
      cooldownSaved: cdRes.ok,
      cooldownError: cdRes.ok ? undefined : cdRes.error,
      cooldownId: cdRes.ok ? cdRes.cooldownId : undefined,
    }
  }

  private async xuLyYeuCauNoiBo(request: Request, url: URL): Promise<Response> {
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })

    if (request.method === 'GET' && url.pathname === '/internal/moderation/cooldown') {
      const actorKey = url.searchParams.get('actorKey') || ''
      const cdResult = this.kiemTraKickCooldown(actorKey)
      if (cdResult.status === 'error') {
        return json({ ok: false, error: 'storage_error', message: cdResult.message }, 503)
      }
      return json({
        ok: true,
        active: cdResult.status === 'active',
        cooldownId: cdResult.status === 'active' ? cdResult.cooldownId : null,
        expiresAt: cdResult.status === 'active' ? cdResult.expiresAt : null,
        remainingMs: cdResult.status === 'active' ? cdResult.remainingMs : 0,
        authorityRank: cdResult.status === 'active' ? cdResult.authorityRank : 0,
        revision: cdResult.status === 'active' ? cdResult.revision : 0,
      })
    }

    if (request.method === 'POST' && url.pathname === '/internal/moderation/cooldown/set') {
      try {
        const body = (await request.json()) as {
          actorKey: string
          expiresAt: number
          authorityRank?: number
          issuerKey?: string
        }
        if (!body.actorKey || typeof body.expiresAt !== 'number') {
          return json({ ok: false, message: 'Thiếu dữ liệu' }, 400)
        }
        const res = this.luuKickCooldown(
          body.actorKey,
          body.expiresAt,
          body.authorityRank ?? 1,
          body.issuerKey ?? '',
        )
        if (!res.ok) {
          if (res.error === 'higher_authority') {
            return json({ ok: false, message: 'Không thể ghi đè cooldown cấp cao hơn' }, 403)
          }
          return json({ ok: false, message: 'Lỗi lưu cooldown' }, 500)
        }
        return json({ ok: true, revision: res.revision, cooldownId: res.cooldownId })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/moderation/cooldown/clear') {
      try {
        const body = (await request.json()) as {
          actorKey: string
          callerAuthorityRank?: number
          expectedCooldownId?: string
          expectedRevision?: number
        }
        if (!body.actorKey) {
          return json({ ok: false, message: 'Thiếu actorKey' }, 400)
        }

        const callerRank = body.callerAuthorityRank ?? 1
        const cdResult = this.kiemTraKickCooldown(body.actorKey)

        if (cdResult.status === 'error') {
          return json({ ok: false, message: cdResult.message }, 503)
        }

        if (cdResult.status === 'active') {
          // Phân cấp thẩm quyền: Cấp thấp hơn không thể xóa cooldown cấp cao hơn
          if (callerRank < cdResult.authorityRank) {
            return json(
              {
                ok: false,
                error: 'forbidden',
                message: 'Không thể xóa thời gian chờ của cấp có thẩm quyền cao hơn',
              },
              403,
            )
          }

          // Kiểm soát định danh & phiên bản (Incarnation & OCC): Chống xóa nhầm cooldown mới hơn hoặc khác incarnation
          if (body.expectedCooldownId != null && cdResult.cooldownId !== body.expectedCooldownId) {
            return json(
              {
                ok: false,
                error: 'stale_cooldown',
                message: 'Thời gian chờ đã bị thay đổi bởi thao tác khác hoặc không còn tồn tại',
              },
              409,
            )
          }
          if (body.expectedRevision != null && cdResult.revision !== body.expectedRevision) {
            return json(
              {
                ok: false,
                error: 'stale_revision',
                message: 'Thời gian chờ đã bị thay đổi bởi thao tác khác',
              },
              409,
            )
          }

          try {
            if (body.expectedCooldownId) {
              this.ctx.storage.sql.exec(
                'DELETE FROM kick_cooldowns WHERE actor_key = ?1 AND cooldown_id = ?2',
                body.actorKey,
                body.expectedCooldownId,
              )
            } else {
              this.ctx.storage.sql.exec(
                'DELETE FROM kick_cooldowns WHERE actor_key = ?1 AND revision = ?2',
                body.actorKey,
                cdResult.revision,
              )
            }
            this.kickCooldowns.delete(body.actorKey)
            return json({ ok: true, cleared: true })
          } catch (err) {
            console.error('Lỗi xóa kick_cooldowns SQLite:', err)
            return json({ ok: false, message: 'Lỗi cơ sở dữ liệu khi xóa cooldown' }, 500)
          }
        }

        if (body.expectedCooldownId) {
          return json(
            {
              ok: false,
              error: 'not_found',
              message: 'Thời gian chờ dự kiến không còn tồn tại',
            },
            409,
          )
        }

        return json({ ok: true, cleared: false, message: 'Không có cooldown hoạt động' })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/voice/registry') {
      return json({ ok: true, registry: this.getVoiceRegistry() })
    }

    if (request.method === 'GET' && url.pathname === '/internal/voice/has-connected-actor') {
      const actorKey = url.searchParams.get('actorKey') || ''
      return json({ ok: true, hasConnected: this.hasConnectedActor(actorKey) })
    }

    if (request.method === 'POST' && url.pathname === '/internal/moderation/kick') {
      try {
        const body = (await request.json()) as {
          targetActorKey: string
          reason?: string
          byActorName: string
          byActorKey: string
          authorityRank?: number
        }
        if (!body.targetActorKey) {
          return json({ ok: false, message: 'Thiếu targetActorKey' }, 400)
        }
        const result = this.kickMemberInternal(body)
        return json(result)
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/generation/issue') {
      try {
        const body = (await request.json()) as { actorKey: string }
        if (!body.actorKey) return json({ ok: false, message: 'Thiếu actorKey' }, 400)
        const generation = this.issueVoiceGeneration(body.actorKey)
        return json({ ok: true, generation })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/voice/generation/get') {
      const actorKey = url.searchParams.get('actorKey') || ''
      return json({ ok: true, generation: this.getVoiceGeneration(actorKey) })
    }

    if (request.method === 'GET' && url.pathname === '/internal/voice/participant/get') {
      const actorKey = url.searchParams.get('actorKey') || ''
      return json({ ok: true, participant: this.getVoiceParticipant(actorKey) })
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/session/bind') {
      try {
        const body = (await request.json()) as { sessionId: string; actorKey: string; generation?: number }
        if (!body.sessionId || !body.actorKey) return json({ ok: false, message: 'Thiếu dữ liệu' }, 400)
        this.bindVoiceSession(body.sessionId, body.actorKey, body.generation)
        return json({ ok: true })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/voice/session/get') {
      const sessionId = url.searchParams.get('sessionId') || ''
      const session = this.getVoiceSession(sessionId)
      return json({ ok: true, session })
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/session/verify') {
      try {
        const body = (await request.json()) as { sessionId: string; actorKey: string; generation?: number }
        const ok = this.verifyVoiceSession(body.sessionId, body.actorKey, body.generation)
        if (!ok) {
          return json({ ok: false, message: 'Phiên thoại không hợp lệ hoặc sai generation' }, 403)
        }
        return json({ ok: true })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/publish') {
      try {
        const body = (await request.json()) as Omit<VoiceParticipantState, 'updatedAt'>
        const res = this.registerVoicePublication(body)
        return json(res, res.ok ? 200 : 409)
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/status') {
      try {
        const body = (await request.json()) as { actorKey: string; status: 'live' | 'muted'; generation?: number }
        const ok = this.updateVoiceStatus(body.actorKey, body.status, body.generation)
        return json({ ok })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/remove') {
      try {
        const body = (await request.json()) as {
          actorKey: string
          sessionId?: string
          trackName?: string
          audioTrackId?: string
          generation?: number
          mid?: string | null
        }
        const ok = this.removeVoicePublicationExact(body)
        return json({ ok })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/force-mute') {
      try {
        const body = (await request.json()) as {
          targetActorKey: string
          byActorName: string
          sessionId?: string
          trackName?: string
          audioTrackId?: string
          generation?: number
          mid?: string | null
        }
        const ok = this.forceMute(body)
        return json({ ok })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/actor/role') {
      const actorKey = url.searchParams.get('actorKey') || ''
      const info = this.getActorRoleInfo(actorKey)
      return json({ ok: true, info })
    }

    return new Response('Không tìm thấy endpoint nội bộ.', { status: 404 })
  }
}
