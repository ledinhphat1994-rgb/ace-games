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
  SlideState,
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
import { lamSachVanBan } from '../shared/protocol/common'

interface AttachmentKetNoi {
  key: string
  ten: string
  accountId: number
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
  private gameMeta: GameMetaState = { ...DEFAULT_GAME_META }
  private gameBoard: BoardCell[][] = taoBanMoi('caro_15')
  private hostKey: string | null = null
  private isGameRoom = false
  private khoiTaoXong = false
  // Mã bàn public (đoạn cuối của /ws/game/<maPhong>) — dùng để báo GameLobbyDO, khác với ctx.id nội bộ của DO.
  private gameRoomId: string | null = null

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
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          meta TEXT NOT NULL,
          board TEXT NOT NULL
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
    } catch (err) {
      console.error('Lỗi nạp room_meta / game_state:', err)
    }

    this.khoiTaoXong = true
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
    server.serializeAttachment({ key, ten, accountId, mic: false, isGame: laGame } satisfies AttachmentKetNoi)

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
        queue: this.layQueue(),
        chat: this.layChat(),
        slide: this.slide,
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
    let goi: LenhPhong
    try {
      goi = raw as LenhPhong
    } catch {
      return
    }
    const laHost = att.key === this.hostKey

    switch (goi.type) {

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

      case 'slide.action': {
        const d = goi.data
        if (d.action === 'change_page') {
          if (this.slide) {
            this.slide = {
              ...this.slide,
              currentPage: Math.min(Math.max(1, d.page), this.slide.totalPages),
            }
          }
        } else if (d.action === 'load_doc') {
          this.slide = {
            docUrl: d.docUrl,
            docName: d.docName,
            fileType: d.fileType,
            currentPage: 1,
            totalPages: Math.max(1, d.totalPages),
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
    this.baoRoiLobbyNeuTrong(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.phatDanhSach(ws)
    this.baoRoiLobbyNeuTrong(ws)
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
}
