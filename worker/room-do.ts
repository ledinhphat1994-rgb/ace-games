import { DurableObject } from 'cloudflare:workers'
import {
  LenhPhong,
  LenhPhongSession,
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
  type SlideAnnotationStroke,
  type BoCucSanKhau,
  type VoiceParticipantState,
  type SessionGoal,
  type SessionTask,
  type SessionTimerState,
  type ActivePoll,
  type PollOption,
  type SessionSummary,
} from '../shared/protocol/room'
import {
  type BanSanh,
  type BoardCell,
  type GameMetaState,
  type GoiGame,
  LenhGame,
  laCoNuoc,
  mauQuanCua,
  type NuocCo,
  type NuocVuaDi,
  type PlayerSide,
} from '../shared/protocol/game'
import { EMOTE_BURST_MAX, EMOTE_COOLDOWN_MS } from '../shared/protocol/game-sdk'
import { TEN_GAME_LOBBY } from './games/game-lobby-do'
import {
  GIA_HAN_HET_GIO_MS,
  batDauVan,
  benKia,
  daHetGioLuot,
  ketThucVan,
  kiemTraThangCaro,
  taoBanMoi,
  trongTaiNuocCo,
} from './game-engine'
import { lamSachVanBan, MA_DONG_SOCKET } from '../shared/protocol/common'
import { TEN_CAMPUS } from './campus/danh-tinh'
import { callCloudflareRealtime } from './routes/voice-api'
import { recordAnalyticsEvent } from './lib/analytics'
import { processLearningSessionSummaryEngagement } from './lib/engagement'
import type { SessionEngagementFacts } from '../shared/protocol/engagement'
import { claimRoomCloseD1, finalizeRoomCloseD1, getSystemAccountId } from './services/room-lifecycle'

const theTaiKhoan = (accountId: number) => `acc:${accountId}`

// Trần số gói mỗi kết nối được gửi (chống một người làm ngập cả phòng). Laser gửi ~30 gói/giây nên trần phải rộng hơn thế.
const CUA_SO_LENH_MS = 1000
const LENH_TOI_DA_MOI_CUA_SO = 60
// Chat phòng mỗi kết nối: tối đa 5 tin / 5 giây và 30 tin / phút.
const CHAT_CUA_SO_NGAN_MS = 5000
const CHAT_TOI_DA_CUA_SO_NGAN = 5
const CHAT_TOI_DA_MOI_PHUT = 30
// Laser là gói tạm thời, không ghi dữ liệu và chỉ người điều hành gửi được: dùng lại kết quả đối chiếu phiên D1 gần
// nhất của kết nối trong khoảng này thay vì truy vấn D1 cho từng gói. Mọi lệnh ghi dữ liệu vẫn đối chiếu D1 từng lệnh.
const LASER_TIN_PHIEN_MS = 15_000

interface AttachmentKetNoi {
  key: string
  ten: string
  accountId: number
  phienId: string
  role: string
  isAdmin: boolean
  isTeacher: boolean
  canModerate: boolean
  lopId: number | null
  mic: boolean
  isGame?: boolean
  _joinedAt?: number
}

export const DEFAULT_MEDIA: MediaState = {
  videoId: '',
  title: '',
  status: 'paused',
  time: 0,
  updatedAt: 0,
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

export const DEFAULT_NOTES: SharedNotes = {
  content: '',
  lastEditedBy: '',
  updatedAt: 0,
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
  endReason: null,
  rematchBy: null,
  firstTurn: 'X',
}

const DEFAULT_SESSION_TIMER: SessionTimerState = {
  running: false,
  durationSeconds: 1800,
  startedAt: 0,
  endsAt: 0,
  remaining: 1800,
  revision: 1,
}

export interface RoomLifecycleLocalState {
  createdAt: number
  everJoined: boolean
  lastJoinAt: number | null
  lastParticipantLeftAt: number | null
  lastActivityAt: number | null
  isClosed: boolean
  closeReason: string | null
  closedAt: number | null
  closedBy: number | null
  neverJoinedTtlMinutes: number
  emptyRoomTtlMinutes: number
  maxRoomLifetimeMinutes: number
  autoCloseEnabled: boolean
  retryAttempts?: number
  nextRetryAt?: number
  finalizePending?: boolean
  finalizeRetryAttempts?: number
  finalizeNextRetryAt?: number
  consecutiveOverdueAlarms?: number
}

const DEFAULT_LIFECYCLE_STATE: RoomLifecycleLocalState = {
  createdAt: 0,
  everJoined: false,
  lastJoinAt: null,
  lastParticipantLeftAt: null,
  lastActivityAt: null,
  isClosed: false,
  closeReason: null,
  closedAt: null,
  closedBy: null,
  neverJoinedTtlMinutes: 5,
  emptyRoomTtlMinutes: 15,
  maxRoomLifetimeMinutes: 480,
  autoCloseEnabled: true,
  retryAttempts: 0,
  nextRetryAt: 0,
  finalizePending: false,
  finalizeRetryAttempts: 0,
  finalizeNextRetryAt: 0,
  consecutiveOverdueAlarms: 0,
}

export class RoomDO extends DurableObject<Env> {
  private media: MediaState = { ...DEFAULT_MEDIA }
  private pomodoro: PomodoroState = { ...DEFAULT_POMODORO }
  private notes: SharedNotes = { ...DEFAULT_NOTES }
  private slide: SlideState | null = null
  /** Bố cục sân khấu người trình chiếu đặt gần nhất — học sinh hiển thị theo. */
  private stageLayout: BoCucSanKhau | null = null
  private whiteboardEpoch = 1
  private gameMeta: GameMetaState = { ...DEFAULT_GAME_META }
  private gameBoard: BoardCell[][] = taoBanMoi('caro_15')
  /** Cờ vua / cờ tướng: mọi nước đã đi của ván hiện tại (thế cờ được dựng lại từ đây). */
  private gameMoves: NuocCo[] = []
  private hostKey: string | null = null
  private isGameRoom = false
  private khoiTaoXong = false
  private lifecycleState: RoomLifecycleLocalState = { ...DEFAULT_LIFECYCLE_STATE }
  private lastD1ActivityPersistAt = 0
  // P0 Alarm Storm Safety Fuse: Bộ đếm các lần overdue liên tiếp để backoff lũy tiến (lưu bền bỉ vào SQLite)
  private consecutiveOverdueAlarms = 0
  // In-memory overrides đảm bảo next retry luôn tiến về tương lai kể cả khi SQLite gặp lỗi
  private voiceRetryOverrides = new Map<string, { attempts: number; nextRetryAt: number }>()
  private summaryRetryOverrides = new Map<string, { attempts: number; nextRetryAt: number }>()
  private testFailD1LifecycleClaim = false
  private testFailD1LifecycleFinalize = false
  // Mã bàn public (đoạn cuối của /ws/game/<maPhong>) — dùng để báo GameLobbyDO, khác với ctx.id nội bộ của DO.
  // Lưu bền trong room_meta (`game_room_id`) để sau khi DO ngủ đông rồi thức dậy vẫn báo được sảnh.
  private gameRoomId: string | null = null
  // Nhịp gửi biểu cảm của từng actor trong bàn game (chống spam; chỉ cần sống trong bộ nhớ).
  private nhipBieuCam = new Map<string, { luc: number; soLan: number }>()
  // Nhịp gửi của từng kết nối (chỉ cần sống trong bộ nhớ; ngủ đông dậy thì đếm lại từ đầu).
  private nhipLenh = new WeakMap<WebSocket, { batDau: number; dem: number; daBao: boolean }>()
  private nhipChat = new WeakMap<WebSocket, { batDauNgan: number; demNgan: number; batDauPhut: number; demPhut: number }>()
  /** Lúc phiên của kết nối được đối chiếu D1 thành công gần nhất (gói laser dùng lại trong LASER_TIN_PHIEN_MS). */
  private phienXacMinhLuc = new WeakMap<WebSocket, number>()
  /** Lệnh của một kết nối được xử lý lần lượt, kể cả khi lệnh trước còn chờ D1. */
  private hangDoiLenh = new WeakMap<WebSocket, Promise<void>>()
  private voiceRegistry = new Map<string, VoiceParticipantState>()

  private parseNumericRoomId(): number | null {
    const name = this.roomName || (this.ctx as any).id?.name || ''
    if (!name) return null
    const m = /^phong-(\d+)$/.exec(name)
    return m ? parseInt(m[1], 10) : null
  }
  private voiceGeneration = new Map<string, number>()
  private voiceSessions = new Map<string, { actorKey: string; generation: number; createdAt: number; updatedAt: number; tracks: Set<string> }>()
  private kickCooldowns = new Map<string, { cooldownId: string; expiresAt: number; authorityRank: number; revision: number }>()
  private roomName: string = ''
  /** Số người đã báo gần nhất cho danh bạ sảnh Campus (chỉ phòng học) — tránh gọi RPC khi số không đổi. */
  private soNguoiDaBaoSanh: number | null = null
  // Learning Session v1
  private activeLearningSession: { sessionId: string; startedAt: number } | null = null
  private sessionGoal: SessionGoal | null = null
  private sessionTasks: SessionTask[] = []
  /** taskId → Set<accountId> */
  private sessionTaskCompletions = new Map<string, Set<number>>()
  private sessionTimer: SessionTimerState = { ...DEFAULT_SESSION_TIMER }
  private activePoll: ActivePoll | null = null
  /** pollId → (accountId → optionId) */
  private pollVotes = new Map<string, Map<number, string>>()
  private sessionStartedAt: number | null = null
  private voiceAlarmTarget: number | null = null
  private testFailSessionStartSql: boolean = false
  private testFailSessionEndSql: boolean = false

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
        CREATE TABLE IF NOT EXISTS slide_annotations (
          id TEXT PRIMARY KEY,
          page INTEGER NOT NULL,
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
      // PRV8.2: Upgrade pending_voice_revocations schema to immutable revocation_id PRIMARY KEY
      try {
        const voiceCols = [
          ...this.ctx.storage.sql.exec<{ name: string }>(
            "PRAGMA table_info(pending_voice_revocations)",
          ),
        ]
        const hasRevocationId = voiceCols.some((c) => c.name === 'revocation_id')
        if (voiceCols.length > 0 && !hasRevocationId) {
          // Table exists with old actor_key PRIMARY KEY schema -> upgrade atomically
          this.ctx.storage.transactionSync(() => {
            this.ctx.storage.sql.exec(
              `CREATE TABLE IF NOT EXISTS pending_voice_revocations_v2 (
                revocation_id TEXT PRIMARY KEY,
                actor_key TEXT NOT NULL,
                session_id TEXT NOT NULL,
                track_name TEXT,
                mid TEXT,
                generation INTEGER NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 1,
                last_attempt_at INTEGER NOT NULL,
                next_retry_at INTEGER NOT NULL DEFAULT 0,
                error_text TEXT,
                created_at INTEGER NOT NULL
              )`,
            )
            this.ctx.storage.sql.exec(
              `INSERT INTO pending_voice_revocations_v2
               (revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, next_retry_at, error_text, created_at)
               SELECT 'legacy_' || actor_key || '_' || session_id || '_' || generation,
                      actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, 0, error_text, last_attempt_at
               FROM pending_voice_revocations`,
            )
            this.ctx.storage.sql.exec('DROP TABLE pending_voice_revocations')
            this.ctx.storage.sql.exec('ALTER TABLE pending_voice_revocations_v2 RENAME TO pending_voice_revocations')
            this.ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS idx_pending_voice_actor ON pending_voice_revocations(actor_key)')
          })
        } else if (voiceCols.length === 0) {
          this.ctx.storage.sql.exec(
            `CREATE TABLE IF NOT EXISTS pending_voice_revocations (
              revocation_id TEXT PRIMARY KEY,
              actor_key TEXT NOT NULL,
              session_id TEXT NOT NULL,
              track_name TEXT,
              mid TEXT,
              generation INTEGER NOT NULL,
              attempts INTEGER NOT NULL DEFAULT 1,
              last_attempt_at INTEGER NOT NULL,
              next_retry_at INTEGER NOT NULL DEFAULT 0,
              error_text TEXT,
              created_at INTEGER NOT NULL
            )`,
          )
          this.ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS idx_pending_voice_actor ON pending_voice_revocations(actor_key)')
        }
      } catch (e) {
        console.warn('[khoiTaoSqlite] pending_voice_revocations init error:', e)
      }
      try {
        this.ctx.storage.sql.exec('ALTER TABLE pending_voice_revocations ADD COLUMN next_retry_at INTEGER NOT NULL DEFAULT 0')
      } catch {}
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
        this.ctx.storage.sql.exec('ALTER TABLE game_state ADD COLUMN moves TEXT')
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
      // Learning Session v1 tables
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS session_tasks (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          position INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS session_task_completions (
          task_id TEXT NOT NULL,
          account_id INTEGER NOT NULL,
          completed_at INTEGER NOT NULL,
          PRIMARY KEY (task_id, account_id)
        );
        CREATE TABLE IF NOT EXISTS session_timer (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          running INTEGER NOT NULL DEFAULT 0,
          duration_seconds INTEGER NOT NULL DEFAULT 1800,
          started_at INTEGER NOT NULL DEFAULT 0,
          ends_at INTEGER NOT NULL DEFAULT 0,
          remaining INTEGER NOT NULL DEFAULT 1800,
          revision INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS session_polls (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          options_json TEXT NOT NULL,
          created_by TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          closed INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS session_poll_votes (
          poll_id TEXT NOT NULL,
          account_id INTEGER NOT NULL,
          option_id TEXT NOT NULL,
          voted_at INTEGER NOT NULL,
          PRIMARY KEY (poll_id, account_id)
        );
        CREATE TABLE IF NOT EXISTS session_activity (
          actor_key TEXT PRIMARY KEY,
          last_active_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS session_summaries (
          id TEXT PRIMARY KEY,
          room_id INTEGER NOT NULL,
          started_at INTEGER NOT NULL,
          ended_at INTEGER NOT NULL,
          summary_json TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pending_session_summary_sync (
          session_id TEXT PRIMARY KEY,
          room_id INTEGER NOT NULL,
          summary_json TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_attempt_at INTEGER NOT NULL DEFAULT 0,
          next_retry_at INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS room_lifecycle (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          created_at INTEGER NOT NULL,
          ever_joined INTEGER NOT NULL DEFAULT 0,
          last_join_at INTEGER,
          last_participant_left_at INTEGER,
          last_activity_at INTEGER,
          is_closed INTEGER NOT NULL DEFAULT 0,
          close_reason TEXT,
          closed_at INTEGER,
          closed_by INTEGER,
          never_joined_ttl_minutes INTEGER NOT NULL DEFAULT 5,
          empty_room_ttl_minutes INTEGER NOT NULL DEFAULT 15,
          max_room_lifetime_minutes INTEGER NOT NULL DEFAULT 480,
          auto_close_enabled INTEGER NOT NULL DEFAULT 1,
          retry_attempts INTEGER NOT NULL DEFAULT 0,
          next_retry_at INTEGER NOT NULL DEFAULT 0,
          finalize_pending INTEGER NOT NULL DEFAULT 0,
          finalize_retry_attempts INTEGER NOT NULL DEFAULT 0,
          finalize_next_retry_at INTEGER NOT NULL DEFAULT 0,
          consecutive_overdue_alarms INTEGER NOT NULL DEFAULT 0
        );
      `)
      try {
        this.ctx.storage.sql.exec('ALTER TABLE pending_session_summary_sync ADD COLUMN facts_json TEXT')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN retry_attempts INTEGER NOT NULL DEFAULT 0')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN next_retry_at INTEGER NOT NULL DEFAULT 0')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN finalize_pending INTEGER NOT NULL DEFAULT 0')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN finalize_retry_attempts INTEGER NOT NULL DEFAULT 0')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN finalize_next_retry_at INTEGER NOT NULL DEFAULT 0')
      } catch {}
      try {
        this.ctx.storage.sql.exec('ALTER TABLE room_lifecycle ADD COLUMN consecutive_overdue_alarms INTEGER NOT NULL DEFAULT 0')
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
        } else if (r.key === 'stage_layout') {
          try { this.stageLayout = JSON.parse(r.value) as BoCucSanKhau } catch {}
        } else if (r.key === 'host_key') {
          this.hostKey = r.value
        } else if (r.key === 'room_name') {
          this.roomName = r.value
        } else if (r.key === 'game_room_id') {
          this.gameRoomId = r.value
          this.isGameRoom = true
        }
      }

      // Đọc game_state (bàn lưu trước khi có endReason/rematchBy/firstTurn thì lấy giá trị mặc định)
      const gameRow = [
        ...this.ctx.storage.sql.exec<{ meta: string; board: string; moves: string | null }>(
          'SELECT meta, board, moves FROM game_state WHERE id = 1',
        ),
      ][0]
      if (gameRow) {
        try {
          this.gameMeta = { ...DEFAULT_GAME_META, ...(JSON.parse(gameRow.meta) as Partial<GameMetaState>) }
          this.gameBoard = JSON.parse(gameRow.board) as BoardCell[][]
          this.gameMoves = gameRow.moves ? (JSON.parse(gameRow.moves) as NuocCo[]) : []
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

      // Hydrate Learning Session v1 data
      try {
        const stateRows = [...this.ctx.storage.sql.exec<{ key: string; value: string }>('SELECT key, value FROM session_state')]
        for (const r of stateRows) {
          if (r.key === 'goal') {
            try { this.sessionGoal = JSON.parse(r.value) as SessionGoal } catch {}
          } else if (r.key === 'active_session') {
            try {
              this.activeLearningSession = JSON.parse(r.value) as { sessionId: string; startedAt: number }
              if (this.activeLearningSession && this.activeLearningSession.startedAt) {
                this.sessionStartedAt = this.activeLearningSession.startedAt
              }
            } catch {}
          } else if (r.key === 'started_at' && !this.activeLearningSession) {
            const st = parseInt(r.value, 10)
            if (Number.isFinite(st) && st > 0) {
              this.sessionStartedAt = st
              this.activeLearningSession = { sessionId: 'migrated_' + st, startedAt: st }
            }
          }
        }
      } catch {}

      try {
        const taskRows = [...this.ctx.storage.sql.exec<{
          id: string
          text: string
          created_by: string
          created_at: number
          position: number
        }>('SELECT id, text, created_by, created_at, position FROM session_tasks ORDER BY position ASC')]
        this.sessionTasks = taskRows.map((tr) => ({
          id: tr.id,
          text: tr.text,
          createdBy: tr.created_by,
          createdAt: tr.created_at,
          order: tr.position,
        }))
      } catch {}

      try {
        const compRows = [...this.ctx.storage.sql.exec<{
          task_id: string
          account_id: number
        }>('SELECT task_id, account_id FROM session_task_completions')]
        for (const cr of compRows) {
          let s = this.sessionTaskCompletions.get(cr.task_id)
          if (!s) {
            s = new Set<number>()
            this.sessionTaskCompletions.set(cr.task_id, s)
          }
          s.add(cr.account_id)
        }
      } catch {}

      try {
        const timerRows = [...this.ctx.storage.sql.exec<{
          running: number
          duration_seconds: number
          started_at: number
          ends_at: number
          remaining: number
          revision: number
        }>('SELECT running, duration_seconds, started_at, ends_at, remaining, revision FROM session_timer WHERE id = 1')]
        if (timerRows.length > 0) {
          const tr = timerRows[0]
          this.sessionTimer = {
            running: Boolean(tr.running),
            durationSeconds: tr.duration_seconds,
            startedAt: tr.started_at,
            endsAt: tr.ends_at,
            remaining: tr.remaining,
            revision: tr.revision,
          }
        }
      } catch {}

      try {
        const pollRows = [...this.ctx.storage.sql.exec<{
          id: string
          question: string
          options_json: string
          created_by: string
          created_at: number
          closed: number
        }>('SELECT id, question, options_json, created_by, created_at, closed FROM session_polls ORDER BY created_at DESC LIMIT 1')]
        if (pollRows.length > 0) {
          const pr = pollRows[0]
          try {
            this.activePoll = {
              id: pr.id,
              question: pr.question,
              options: JSON.parse(pr.options_json),
              createdBy: pr.created_by,
              createdAt: pr.created_at,
              closed: Boolean(pr.closed),
            }
          } catch {}
        }
      } catch {}

      try {
        const voteRows = [...this.ctx.storage.sql.exec<{
          poll_id: string
          account_id: number
          option_id: string
        }>('SELECT poll_id, account_id, option_id FROM session_poll_votes')]
        for (const vr of voteRows) {
          let vm = this.pollVotes.get(vr.poll_id)
          if (!vm) {
            vm = new Map<number, string>()
            this.pollVotes.set(vr.poll_id, vm)
          }
          vm.set(vr.account_id, vr.option_id)
        }
      } catch {}

      // Nạp room_lifecycle
      try {
        const lcRows = [
          ...this.ctx.storage.sql.exec<{
            created_at: number
            ever_joined: number
            last_join_at: number | null
            last_participant_left_at: number | null
            last_activity_at: number | null
            is_closed: number
            close_reason: string | null
            closed_at: number | null
            closed_by: number | null
            never_joined_ttl_minutes: number
            empty_room_ttl_minutes: number
            max_room_lifetime_minutes: number
            auto_close_enabled: number
            retry_attempts?: number
            next_retry_at?: number
            finalize_pending?: number
            finalize_retry_attempts?: number
            finalize_next_retry_at?: number
            consecutive_overdue_alarms?: number
          }>('SELECT * FROM room_lifecycle WHERE id = 1'),
        ]
        if (lcRows.length > 0) {
          const r = lcRows[0]
          this.lifecycleState = {
            createdAt: r.created_at,
            everJoined: Boolean(r.ever_joined),
            lastJoinAt: r.last_join_at,
            lastParticipantLeftAt: r.last_participant_left_at,
            lastActivityAt: r.last_activity_at,
            isClosed: Boolean(r.is_closed),
            closeReason: r.close_reason,
            closedAt: r.closed_at,
            closedBy: r.closed_by,
            neverJoinedTtlMinutes: r.never_joined_ttl_minutes,
            emptyRoomTtlMinutes: r.empty_room_ttl_minutes,
            maxRoomLifetimeMinutes: r.max_room_lifetime_minutes,
            autoCloseEnabled: Boolean(r.auto_close_enabled),
            retryAttempts: r.retry_attempts || 0,
            nextRetryAt: r.next_retry_at || 0,
            finalizePending: Boolean(r.finalize_pending),
            finalizeRetryAttempts: r.finalize_retry_attempts || 0,
            finalizeNextRetryAt: r.finalize_next_retry_at || 0,
            consecutiveOverdueAlarms: r.consecutive_overdue_alarms || 0,
          }
          this.consecutiveOverdueAlarms = r.consecutive_overdue_alarms || 0
        }
      } catch (err) {
        console.warn('[RoomDO] Lỗi đọc room_lifecycle:', err)
      }

      // Khôi phục và đối soát các nghĩa vụ alarm bền vững (lifecycle, voice, summary sync, timers) sau khi restart
      try {
        const pendingVoice = this.getPendingVoiceRevocations()
        const pendingSummary = this.getPendingSessionSummaries()
        const hasActiveTimer =
          (this.sessionTimer.running && this.sessionTimer.endsAt > 0) ||
          (this.pomodoro.running && this.pomodoro.endsAt > 0) ||
          this.hanChotLuotGame() !== null
        const hasLifecycleObligation =
          (!this.lifecycleState.isClosed && this.lifecycleState.autoCloseEnabled) ||
          Boolean(this.lifecycleState.finalizePending)
        if (pendingVoice.length > 0 || pendingSummary.length > 0 || hasActiveTimer || hasLifecycleObligation) {
          this.ctx.blockConcurrencyWhile(async () => {
            await this.reconcileRoomAlarm()
          })
          if (pendingVoice.length > 0) {
            this.ctx.waitUntil(this.retryPendingVoiceRevocations().catch(() => {}))
          }
          if (pendingSummary.length > 0) {
            this.ctx.waitUntil(this.xuLyPendingSummarySync().catch(() => {}))
          }
        }
      } catch (err) {
        console.error('Lỗi khôi phục alarm obligations sau restart:', err)
      }
    } catch (err) {
      console.error('Lỗi nạp room_meta / game_state / voice_state / session_state:', err)
    }

    this.khoiTaoXong = true
  }

  private luuLifecycleState(): void {
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO room_lifecycle (
          id, created_at, ever_joined, last_join_at, last_participant_left_at,
          last_activity_at, is_closed, close_reason, closed_at, closed_by,
          never_joined_ttl_minutes, empty_room_ttl_minutes, max_room_lifetime_minutes, auto_close_enabled,
          retry_attempts, next_retry_at, finalize_pending, finalize_retry_attempts, finalize_next_retry_at,
          consecutive_overdue_alarms
        ) VALUES (
          1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19
        ) ON CONFLICT(id) DO UPDATE SET
          created_at = ?1,
          ever_joined = ?2,
          last_join_at = ?3,
          last_participant_left_at = ?4,
          last_activity_at = ?5,
          is_closed = ?6,
          close_reason = ?7,
          closed_at = ?8,
          closed_by = ?9,
          never_joined_ttl_minutes = ?10,
          empty_room_ttl_minutes = ?11,
          max_room_lifetime_minutes = ?12,
          auto_close_enabled = ?13,
          retry_attempts = ?14,
          next_retry_at = ?15,
          finalize_pending = ?16,
          finalize_retry_attempts = ?17,
          finalize_next_retry_at = ?18,
          consecutive_overdue_alarms = ?19`,
        this.lifecycleState.createdAt,
        this.lifecycleState.everJoined ? 1 : 0,
        this.lifecycleState.lastJoinAt,
        this.lifecycleState.lastParticipantLeftAt,
        this.lifecycleState.lastActivityAt,
        this.lifecycleState.isClosed ? 1 : 0,
        this.lifecycleState.closeReason,
        this.lifecycleState.closedAt,
        this.lifecycleState.closedBy,
        this.lifecycleState.neverJoinedTtlMinutes,
        this.lifecycleState.emptyRoomTtlMinutes,
        this.lifecycleState.maxRoomLifetimeMinutes,
        this.lifecycleState.autoCloseEnabled ? 1 : 0,
        this.lifecycleState.retryAttempts || 0,
        this.lifecycleState.nextRetryAt || 0,
        this.lifecycleState.finalizePending ? 1 : 0,
        this.lifecycleState.finalizeRetryAttempts || 0,
        this.lifecycleState.finalizeNextRetryAt || 0,
        this.consecutiveOverdueAlarms || 0,
      )
    } catch (err) {
      console.error('[RoomDO] Lỗi lưu room_lifecycle:', err)
    }
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

  private kiemTraVaCapNhatSessionTimer(now: number): boolean {
    if (!this.sessionTimer.running || this.sessionTimer.endsAt <= 0 || now < this.sessionTimer.endsAt) {
      return false
    }
    this.sessionTimer = {
      ...this.sessionTimer,
      running: false,
      remaining: 0,
      endsAt: 0,
      revision: (this.sessionTimer.revision || 1) + 1,
    }
    this.luuSessionTimer()
    return true
  }

  getEarliestPendingVoiceRetryTime(_now = Date.now()): number | null {
    try {
      const rows = [...this.ctx.storage.sql.exec<{
        revocation_id: string
        attempts: number
        last_attempt_at: number
        next_retry_at: number
        created_at: number
      }>('SELECT revocation_id, attempts, last_attempt_at, next_retry_at, created_at FROM pending_voice_revocations')]
      if (rows.length === 0) return null
      let earliest = Infinity
      for (const r of rows) {
        const override = this.voiceRetryOverrides.get(r.revocation_id)
        const attempts = override?.attempts ?? r.attempts
        let dueAt = override?.nextRetryAt ?? (r.next_retry_at > 0 ? r.next_retry_at : 0)
        if (dueAt === 0) {
          dueAt = r.last_attempt_at > 0 ? r.last_attempt_at + this.tinhVoiceBackoffDelay(attempts) : r.created_at
        }
        if (dueAt < earliest) earliest = dueAt
      }
      return Number.isFinite(earliest) ? earliest : null
    } catch {
      return null
    }
  }

  getEarliestPendingSummaryRetryTime(_now = Date.now()): number | null {
    try {
      const rows = [...this.ctx.storage.sql.exec<{
        session_id: string
        next_retry_at: number
        last_attempt_at: number
        attempts: number
        created_at: number
      }>('SELECT session_id, next_retry_at, last_attempt_at, attempts, created_at FROM pending_session_summary_sync')]
      if (rows.length === 0) return null
      let earliest = Infinity
      for (const r of rows) {
        const override = this.summaryRetryOverrides.get(r.session_id)
        const attempts = override?.attempts ?? r.attempts
        let dueAt = override?.nextRetryAt ?? (r.next_retry_at > 0 ? r.next_retry_at : 0)
        if (dueAt === 0) {
          dueAt = r.last_attempt_at > 0 ? r.last_attempt_at + Math.min(1000 * Math.pow(2, Math.max(0, attempts - 1)), 60000) : r.created_at
        }
        if (dueAt < earliest) earliest = dueAt
      }
      return Number.isFinite(earliest) ? earliest : null
    } catch {
      return null
    }
  }

  async reconcileRoomAlarm(): Promise<void> {
    this.nạpDuLieuNeuCan()
    const deadlines: number[] = []
    const now = Date.now()

    // 1. Pomodoro deadline
    if (this.pomodoro.running && this.pomodoro.endsAt > 0) {
      deadlines.push(this.pomodoro.endsAt)
    }

    // 2. Learning session timer deadline
    if (this.sessionTimer.running && this.sessionTimer.endsAt > 0) {
      deadlines.push(this.sessionTimer.endsAt)
    }

    // 3. Earliest pending voice revocation retry
    const voiceDue = this.getEarliestPendingVoiceRetryTime(now)
    if (voiceDue !== null) {
      const effectiveVoice = this.voiceAlarmTarget !== null ? Math.min(voiceDue, this.voiceAlarmTarget) : voiceDue
      deadlines.push(effectiveVoice)
    } else if (this.voiceAlarmTarget !== null) {
      deadlines.push(this.voiceAlarmTarget)
    }

    // 4. Earliest pending session summary sync retry
    const summaryDue = this.getEarliestPendingSummaryRetryTime(now)
    if (summaryDue !== null) {
      deadlines.push(summaryDue)
    }

    // 4b. Hạn chót lượt đi của bàn game (máy chủ xử thua bên tới lượt khi quá hạn)
    const hanLuotGame = this.hanChotLuotGame()
    if (hanLuotGame !== null) {
      deadlines.push(hanLuotGame)
    }

    // 5. Room lifecycle deadlines
    if (this.lifecycleState.finalizePending) {
      // Có nghĩa vụ finalize pending D1: nếu có finalizeNextRetryAt trong tương lai thì xếp lịch, nếu không thì now
      const finalizeDue =
        this.lifecycleState.finalizeNextRetryAt && this.lifecycleState.finalizeNextRetryAt > 0
          ? this.lifecycleState.finalizeNextRetryAt
          : now
      deadlines.push(finalizeDue)
    } else if (!this.lifecycleState.isClosed && this.lifecycleState.autoCloseEnabled && this.lifecycleState.createdAt > 0) {
      if (this.lifecycleState.nextRetryAt && this.lifecycleState.nextRetryAt > now) {
        // Lifecycle đang trong chu kỳ backoff tạm thời sau lỗi D1
        deadlines.push(this.lifecycleState.nextRetryAt)
      } else {
        // 5.1 Never-joined deadline
        if (!this.lifecycleState.everJoined && this.lifecycleState.neverJoinedTtlMinutes > 0) {
          const neverDue = this.lifecycleState.createdAt + this.lifecycleState.neverJoinedTtlMinutes * 60 * 1000
          deadlines.push(neverDue)
        }
        // 5.2 Empty room deadline (only when ever_joined is true and room is empty)
        if (this.lifecycleState.everJoined && this.lifecycleState.lastParticipantLeftAt) {
          const activeSockets = this.ctx.getWebSockets().filter((ws) => ws.readyState === WebSocket.OPEN)
          const activeUnique = new Set(
            activeSockets
              .map((ws) => (ws.deserializeAttachment() as AttachmentKetNoi | null)?.key)
              .filter(Boolean),
          )
          if (activeUnique.size === 0 && this.lifecycleState.emptyRoomTtlMinutes > 0) {
            const emptyDue = this.lifecycleState.lastParticipantLeftAt + this.lifecycleState.emptyRoomTtlMinutes * 60 * 1000
            deadlines.push(emptyDue)
          }
        }
        // 5.3 Max lifetime deadline
        if (this.lifecycleState.maxRoomLifetimeMinutes > 0) {
          const maxDue = this.lifecycleState.createdAt + this.lifecycleState.maxRoomLifetimeMinutes * 60 * 1000
          deadlines.push(maxDue)
        }
      }
    }

    if (deadlines.length > 0) {
      const earliest = Math.min(...deadlines)
      let scheduledTime: number

      if (earliest > now) {
        scheduledTime = earliest
        if (this.consecutiveOverdueAlarms !== 0) {
          this.consecutiveOverdueAlarms = 0
          this.lifecycleState.consecutiveOverdueAlarms = 0
          this.luuLifecycleState()
        }
      } else {
        // Section 5: Global Alarm Safety Fuse
        // Phát hiện deadline quá hạn (earliest <= now). Tuyệt đối cấm lặp vô hạn now + 50ms.
        // Áp dụng backoff lũy tiến bền bỉ bắt đầu từ 1000ms đến tối đa 60000ms.
        this.consecutiveOverdueAlarms = (this.consecutiveOverdueAlarms || 0) + 1
        this.lifecycleState.consecutiveOverdueAlarms = this.consecutiveOverdueAlarms
        this.luuLifecycleState()
        const backoffDelay = Math.min(1000 * Math.pow(2, Math.max(0, this.consecutiveOverdueAlarms - 1)), 60000)
        scheduledTime = now + backoffDelay
        console.warn(
          `[RoomDO] ROOM_ALARM_OVERDUE_RECOVERY: Phát hiện nghĩa vụ quá hạn (${now - earliest}ms). Áp dụng backoff ${backoffDelay}ms (lần ${this.consecutiveOverdueAlarms}).`,
        )
      }

      try {
        await this.ctx.storage.setAlarm(scheduledTime)
      } catch (err) {
        console.error('[RoomDO] Lỗi setAlarm trong reconcileRoomAlarm:', err)
      }
    } else {
      if (this.consecutiveOverdueAlarms !== 0) {
        this.consecutiveOverdueAlarms = 0
        this.lifecycleState.consecutiveOverdueAlarms = 0
        this.luuLifecycleState()
      }
      try {
        await this.ctx.storage.deleteAlarm()
      } catch (err) {
        console.error('[RoomDO] Lỗi deleteAlarm trong reconcileRoomAlarm:', err)
      }
    }
  }

  private async updateTimerAlarm(): Promise<void> {
    await this.reconcileRoomAlarm()
  }

  private apDungLifecycleBackoff(now: number, reason: string): void {
    const attempts = (this.lifecycleState.retryAttempts || 0) + 1
    const delay = Math.min(1000 * Math.pow(2, Math.max(0, attempts - 1)), 60000)
    const nextRetryAt = now + delay
    this.lifecycleState.retryAttempts = attempts
    this.lifecycleState.nextRetryAt = nextRetryAt
    this.luuLifecycleState()
    console.warn(
      `[RoomDO] ROOM_ALARM_BACKOFF_APPLIED: Lifecycle retry #${attempts} lùi lại ${delay}ms do lỗi: ${reason}`,
    )
  }

  private apDungFinalizeBackoff(now: number, reason: string): void {
    const attempts = (this.lifecycleState.finalizeRetryAttempts || 0) + 1
    const delay = Math.min(1000 * Math.pow(2, Math.max(0, attempts - 1)), 60000)
    const nextRetryAt = now + delay
    this.lifecycleState.finalizePending = true
    this.lifecycleState.finalizeRetryAttempts = attempts
    this.lifecycleState.finalizeNextRetryAt = nextRetryAt
    this.luuLifecycleState()
    console.warn(
      `[RoomDO] ROOM_FINALIZE_BACKOFF_APPLIED: Finalize retry #${attempts} lùi lại ${delay}ms do lỗi: ${reason}`,
    )
  }

  private async thucHienFinalizeD1(
    now: number,
    roomId: number,
    reason: string,
    actorType: 'admin' | 'owner' | 'moderator' | 'system',
    closedBy: number | null,
    actorName: string,
    closedSocketsCount: number,
  ): Promise<boolean> {
    if (!this.env?.DB) {
      this.apDungFinalizeBackoff(now, 'missing_d1_database')
      return false
    }

    try {
      if (this.testFailD1LifecycleFinalize) {
        throw new Error('SIMULATED_D1_FINALIZE_FAILURE')
      }

      const res = await finalizeRoomCloseD1(
        this.env.DB,
        roomId,
        reason,
        { type: actorType, accountId: closedBy, name: actorName },
        closedSocketsCount,
        true,
      )

      if (res.ok) {
        this.lifecycleState.finalizePending = false
        this.lifecycleState.finalizeRetryAttempts = 0
        this.lifecycleState.finalizeNextRetryAt = 0
        this.luuLifecycleState()
        await this.reconcileRoomAlarm()
        return true
      } else {
        this.apDungFinalizeBackoff(now, res.error || 'finalize_failed')
        await this.reconcileRoomAlarm()
        return false
      }
    } catch (err: any) {
      console.error('[RoomDO.thucHienFinalizeD1] Lỗi finalize D1:', err)
      this.apDungFinalizeBackoff(now, err?.message || String(err))
      await this.reconcileRoomAlarm()
      return false
    }
  }

  private async xuLyLifecycleAlarm(now: number): Promise<void> {
    this.nạpDuLieuNeuCan()

    // ── Priority 0: Xử lý nghĩa vụ D1 Finalize Pending nếu có ──
    if (this.lifecycleState.finalizePending) {
      if (this.lifecycleState.finalizeNextRetryAt && this.lifecycleState.finalizeNextRetryAt > now) {
        return
      }
      const numericId = this.parseNumericRoomId()
      if (!numericId || !this.env?.DB) {
        this.apDungFinalizeBackoff(now, 'missing_db_or_id')
        return
      }
      const effectiveReason = this.lifecycleState.closeReason || 'empty_timeout'
      const effectiveClosedBy = this.lifecycleState.closedBy ?? null
      const actorType: 'admin' | 'owner' | 'moderator' | 'system' = effectiveReason.startsWith('admin_')
        ? 'admin'
        : effectiveReason.startsWith('owner_')
          ? 'owner'
          : effectiveReason.startsWith('moderator_')
            ? 'moderator'
            : 'system'
      const actorName = actorType === 'system' ? 'Hệ thống tự động' : 'Quản trị viên'
      await this.thucHienFinalizeD1(now, numericId, effectiveReason, actorType, effectiveClosedBy, actorName, 0)
      return
    }

    if (this.lifecycleState.isClosed || !this.lifecycleState.autoCloseEnabled || this.lifecycleState.createdAt <= 0) {
      return
    }

    // Nếu đang trong thời gian backoff thì chưa thử lại
    if (this.lifecycleState.nextRetryAt && this.lifecycleState.nextRetryAt > now) {
      return
    }

    let timeoutReason: string | null = null
    if (
      this.lifecycleState.maxRoomLifetimeMinutes > 0 &&
      now >= this.lifecycleState.createdAt + this.lifecycleState.maxRoomLifetimeMinutes * 60 * 1000
    ) {
      timeoutReason = 'max_lifetime'
    } else if (
      !this.lifecycleState.everJoined &&
      this.lifecycleState.neverJoinedTtlMinutes > 0 &&
      now >= this.lifecycleState.createdAt + this.lifecycleState.neverJoinedTtlMinutes * 60 * 1000
    ) {
      timeoutReason = 'never_joined_timeout'
    } else if (
      this.lifecycleState.everJoined &&
      this.lifecycleState.lastParticipantLeftAt &&
      this.lifecycleState.emptyRoomTtlMinutes > 0
    ) {
      const activeSockets = this.ctx.getWebSockets().filter((ws) => ws.readyState === WebSocket.OPEN)
      const activeUnique = new Set(
        activeSockets
          .map((ws) => (ws.deserializeAttachment() as AttachmentKetNoi | null)?.key)
          .filter(Boolean),
      )
      if (
        activeUnique.size === 0 &&
        now >= this.lifecycleState.lastParticipantLeftAt + this.lifecycleState.emptyRoomTtlMinutes * 60 * 1000
      ) {
        timeoutReason = 'empty_timeout'
      }
    }

    if (timeoutReason) {
      const numericId = this.parseNumericRoomId()
      if (!numericId || !this.env?.DB) {
        // Section 3: Room không hợp lệ hoặc thiếu binding D1 -> Fail-closed terminal local state
        console.warn(
          `[RoomDO] ROOM_LIFECYCLE_LOCAL_RECONCILED: Phòng không hợp lệ hoặc thiếu D1 (id=${numericId}). Đóng cục bộ fail-closed.`,
        )
        this.lifecycleState.finalizePending = false
        this.lifecycleState.finalizeRetryAttempts = 0
        this.lifecycleState.finalizeNextRetryAt = 0
        await this.dongPhongNoiBo({
          reason: 'invalid_or_missing_room',
          closedByAccountId: null,
          closedByName: 'Hệ thống tự động',
          actorType: 'system',
        })
        return
      }

      try {
        if (this.testFailD1LifecycleClaim) {
          throw new Error('SIMULATED_D1_TRANSIENT_FAILURE')
        }
        const systemAccountId = await getSystemAccountId(this.env.DB)
        const claim = await claimRoomCloseD1(this.env.DB, numericId, timeoutReason, systemAccountId)

        // Section 3: Phòng không tồn tại trong D1 -> Fail-closed terminal local state
        if (claim.notFound) {
          console.warn(
            `[RoomDO] ROOM_LIFECYCLE_LOCAL_RECONCILED: Phòng ${numericId} không tồn tại trên D1. Đóng cục bộ fail-closed.`,
          )
          this.lifecycleState.finalizePending = false
          this.lifecycleState.finalizeRetryAttempts = 0
          this.lifecycleState.finalizeNextRetryAt = 0
          await this.dongPhongNoiBo({
            reason: 'canonical_not_found',
            closedByAccountId: systemAccountId,
            closedByName: 'Hệ thống tự động',
            actorType: 'system',
          })
          return
        }

        // Section 2: D1 báo phòng đã đóng (alreadyClosed) -> Reconcile local state với canonical D1 truth
        if (claim.alreadyClosed) {
          console.log(
            `[RoomDO] ROOM_LIFECYCLE_LOCAL_RECONCILED: Phòng ${numericId} đã đóng trên D1 (reason=${claim.persistedReasonCode}). Đồng bộ trạng thái cục bộ.`,
          )
          const effectiveReason = claim.persistedReasonCode || timeoutReason
          const effectiveClosedBy = claim.persistedClosedBy ?? systemAccountId
          const effectiveClosedAt = claim.persistedClosedAt ?? now
          const actorType = effectiveReason.startsWith('admin_')
            ? 'admin'
            : effectiveReason.startsWith('owner_')
              ? 'owner'
              : effectiveReason.startsWith('moderator_')
                ? 'moderator'
                : 'system'

          const actorName = actorType === 'system' ? 'Hệ thống tự động' : 'Quản trị viên'

          this.lifecycleState.finalizePending = false
          this.lifecycleState.finalizeRetryAttempts = 0
          this.lifecycleState.finalizeNextRetryAt = 0

          await this.dongPhongNoiBo({
            reason: effectiveReason,
            closedByAccountId: effectiveClosedBy,
            closedByName: actorName,
            actorType,
            closedAt: effectiveClosedAt,
          })
          return
        }

        // Đã claim thành công hoặc đang closing
        if (claim.claimed || claim.alreadyClosing) {
          const effectiveReason = claim.persistedReasonCode || timeoutReason
          const effectiveClosedBy = claim.persistedClosedBy ?? systemAccountId
          const effectiveClosedAt = claim.persistedClosedAt ?? now

          const actorType = effectiveReason.startsWith('admin_')
            ? 'admin'
            : effectiveReason.startsWith('owner_')
              ? 'owner'
              : effectiveReason.startsWith('moderator_')
                ? 'moderator'
                : 'system'

          const actorName = actorType === 'system' ? 'Hệ thống tự động' : 'Quản trị viên'

          const localRes = await this.dongPhongNoiBo({
            reason: effectiveReason,
            closedByAccountId: effectiveClosedBy,
            closedByName: actorName,
            actorType,
            closedAt: effectiveClosedAt,
            finalizePending: true,
          })

          await this.thucHienFinalizeD1(
            now,
            numericId,
            effectiveReason,
            actorType,
            effectiveClosedBy,
            actorName,
            localRes.closedCount,
          )
          return
        }

        // Claim không thành công do lỗi D1 -> Áp dụng backoff (Section 4)
        this.apDungLifecycleBackoff(now, claim.error || 'claim_failed')
      } catch (err: any) {
        // Ngoại lệ mạng / D1 -> Áp dụng backoff (Section 4)
        console.error('[RoomDO.xuLyLifecycleAlarm] Lỗi đóng phòng alarm:', err)
        this.apDungLifecycleBackoff(now, err?.message || String(err))
      }
    }
  }

  override async alarm(): Promise<void> {
    this.nạpDuLieuNeuCan()
    const now = Date.now()
    this.voiceAlarmTarget = null
    if (this.kiemTraVaCapNhatPomodoro(now)) {
      this.broadcast({ type: 'pomodoro.sync', state: this.pomodoro, serverNow: now })
    }
    if (this.kiemTraVaCapNhatSessionTimer(now)) {
      this.broadcast({ type: 'session.timer.sync', state: this.sessionTimer, serverNow: now })
    }
    try {
      await this.retryPendingVoiceRevocations(now)
    } catch (err) {
      console.error('[RoomDO.alarm] Lỗi xử lý retry pending voice revocations:', err)
    }
    try {
      await this.xuLyPendingSummarySync(now)
    } catch (err) {
      console.error('[RoomDO.alarm] Lỗi xử lý pending summary sync:', err)
    }
    try {
      await this.xuLyLifecycleAlarm(now)
    } catch (err) {
      console.error('[RoomDO.alarm] Lỗi xử lý lifecycle alarm:', err)
    }
    this.xuLyHetGioLuot(now)
    await this.reconcileRoomAlarm()
  }

  /** Hạn chót (đã cộng ân hạn) mà alarm phải tới để xử lượt đi đang chạy của bàn game; null nếu không có. */
  private hanChotLuotGame(): number | null {
    if (!this.isGameRoom || this.gameMeta.status !== 'playing' || this.gameMeta.turnTimerEndsAt <= 0) return null
    return this.gameMeta.turnTimerEndsAt + GIA_HAN_HET_GIO_MS
  }

  /** Bên tới lượt đã quá giờ: xử thua ngay (idempotent — gọi thừa khi chưa quá hạn thì không làm gì). */
  private xuLyHetGioLuot(now: number): boolean {
    if (!this.isGameRoom || !daHetGioLuot(this.gameMeta, now)) return false
    this.gameMeta = ketThucVan(this.gameMeta, benKia(this.gameMeta.currentTurn), 'timeout')
    this.luuGameState()
    this.baoLobby()
    this.broadcastGame(this.goiDongBoGame(now))
    return true
  }

  private gheCua(actorKey: string): PlayerSide | null {
    if (actorKey === this.gameMeta.playerX) return 'X'
    if (actorKey === this.gameMeta.playerO) return 'O'
    return null
  }

  /** Người xem = người đang ở bàn nhưng không ngồi ghế X/O. */
  private demNguoiXemGame(boQua?: WebSocket): number {
    return this.layDanhSachThanhVien(boQua).filter((m) => this.gheCua(m.key) === null).length
  }

  private luuGameState(): void {
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO game_state (id, meta, board, moves) VALUES (1, ?1, ?2, ?3)
           ON CONFLICT(id) DO UPDATE SET meta = ?1, board = ?2, moves = ?3`,
        JSON.stringify(this.gameMeta),
        JSON.stringify(this.gameBoard),
        JSON.stringify(this.gameMoves),
      )
    } catch (err) {
      console.error('Lỗi lưu game_state:', err)
    }
  }

  /** Gói trạng thái bàn gửi cho máy khách (kèm nước vừa đi nếu có). */
  private goiDongBoGame(now: number, lastMove?: NuocVuaDi): GoiGame {
    return {
      type: 'game.sync',
      meta: this.gameMeta,
      board: this.gameBoard,
      moves: this.gameMoves,
      ...(lastMove ? { lastMove } : {}),
      serverNow: now,
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

  private phatTrangThaiGame(now: number, lastMove?: NuocVuaDi): void {
    this.broadcastGame(this.goiDongBoGame(now, lastMove))
  }

  private guiLoiGame(ws: WebSocket, message: string): void {
    try {
      ws.send(JSON.stringify({ type: 'error', message } satisfies GoiGame))
    } catch {}
  }

  /** Tối đa EMOTE_BURST_MAX biểu cảm trong mỗi cửa sổ EMOTE_COOLDOWN_MS cho mỗi người. */
  private choPhepBieuCam(actorKey: string, now: number): boolean {
    const nhip = this.nhipBieuCam.get(actorKey)
    if (!nhip || now - nhip.luc >= EMOTE_COOLDOWN_MS) {
      this.nhipBieuCam.set(actorKey, { luc: now, soLan: 1 })
      return true
    }
    if (nhip.soLan >= EMOTE_BURST_MAX) return false
    nhip.soLan += 1
    return true
  }

  // Trọng tài bàn đối kháng 1v1: mọi luật, lượt, đồng hồ và kết quả đều do máy chủ quyết định.
  private async xuLyLenhGame(ws: WebSocket, att: AttachmentKetNoi, goi: LenhGame): Promise<void> {
    const now = Date.now()
    // Lượt đang chạy đã quá hạn mà alarm chưa kịp tới: chốt thua vì hết giờ trước khi xét lệnh này.
    const benVuaHetGio = this.xuLyHetGioLuot(now) ? this.gameMeta.currentTurn : null

    switch (goi.type) {
      case 'game.init': {
        // Chỉ khởi tạo được bàn còn nguyên (chưa ai ngồi): người xem hay đối thủ không thể xoá ván của người khác.
        if (this.gameMeta.status !== 'waiting' || this.gameMeta.playerX || this.gameMeta.playerO) {
          this.guiLoiGame(ws, 'Bàn này đã có người chơi, không thể tạo lại.')
          return
        }
        this.gameMeta = {
          ...DEFAULT_GAME_META,
          gameType: goi.gameType,
          playerX: att.key,
          playerXName: att.ten,
          turnTimerSeconds: goi.turnSeconds ?? DEFAULT_GAME_META.turnTimerSeconds,
        }
        this.gameBoard = taoBanMoi(goi.gameType)
        this.gameMoves = []
        this.luuGameState()
        this.baoLobby()
        this.phatTrangThaiGame(now)
        return
      }

      case 'game.join': {
        if (this.gheCua(att.key)) {
          // Đã ngồi sẵn (mở thêm tab, vào lại sau khi rớt mạng): chỉ gửi lại trạng thái cho chính người này.
          ws.send(JSON.stringify(this.goiDongBoGame(now)))
          return
        }
        if (this.gameMeta.status !== 'waiting') {
          this.guiLoiGame(ws, 'Bàn đang có trận đấu — bạn đang xem.')
          return
        }
        // Ghế của người đã rời bàn (không còn kết nối nào) coi như trống: không ghép người mới với một người
        // vắng mặt để rồi người đó bị xử thua vì hết giờ.
        if (this.gameMeta.playerX && !this.hasConnectedActor(this.gameMeta.playerX)) {
          this.gameMeta = { ...this.gameMeta, playerX: null, playerXName: null }
        }
        if (this.gameMeta.playerO && !this.hasConnectedActor(this.gameMeta.playerO)) {
          this.gameMeta = { ...this.gameMeta, playerO: null, playerOName: null }
        }
        // Ghế X (chủ bàn, tên hiện trên sảnh) luôn được lấp trước.
        if (!this.gameMeta.playerX) {
          this.gameMeta = { ...this.gameMeta, playerX: att.key, playerXName: att.ten }
        } else if (!this.gameMeta.playerO) {
          this.gameMeta = { ...this.gameMeta, playerO: att.key, playerOName: att.ten }
        } else {
          this.guiLoiGame(ws, 'Bàn đã đủ hai người chơi.')
          return
        }

        if (this.gameMeta.playerX && this.gameMeta.playerO) {
          const van = batDauVan(this.gameMeta, now)
          this.gameMeta = van.meta
          this.gameBoard = van.board
          this.gameMoves = []
          if (this.env?.ANALYTICS_DB) {
            recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
              event: 'game.session_started',
              actorId: att.accountId || null,
              sessionId: att.phienId || null,
              roomId: this.parseNumericRoomId(),
              properties: {
                gameType: this.gameMeta.gameType,
              },
            })
          }
        }
        this.luuGameState()
        this.baoLobby()
        this.phatTrangThaiGame(now)
        await this.reconcileRoomAlarm()
        return
      }

      case 'game.move': {
        if (this.gameMeta.status !== 'playing') {
          this.guiLoiGame(
            ws,
            benVuaHetGio && this.gheCua(att.key) === benVuaHetGio
              ? 'Bạn đã hết giờ cho lượt này.'
              : 'Ván đấu chưa bắt đầu hoặc đã kết thúc.',
          )
          return
        }
        const side = this.gheCua(att.key)
        if (!side || side !== this.gameMeta.currentTurn) {
          this.guiLoiGame(ws, 'Chưa tới lượt của bạn.')
          return
        }

        const { x, y } = goi
        const H = this.gameBoard.length
        const W = this.gameBoard[0].length
        const hanLuotMoi = now + this.gameMeta.turnTimerSeconds * 1000
        let nuocVuaDi: NuocVuaDi = { player: side, x, y }

        if (this.gameMeta.gameType === 'caro_15') {
          if (x >= W || y >= H || this.gameBoard[y][x] !== null) {
            this.guiLoiGame(ws, 'Nước đi không hợp lệ.')
            return
          }
          this.gameBoard[y][x] = side
          const winLine = kiemTraThangCaro(this.gameBoard, x, y, side)
          if (winLine) {
            this.gameMeta = ketThucVan({ ...this.gameMeta, winLine }, side, 'normal')
          } else if (this.gameBoard.every((row) => row.every((c) => c !== null))) {
            this.gameMeta = ketThucVan(this.gameMeta, 'draw', 'normal')
          } else {
            this.gameMeta = { ...this.gameMeta, currentTurn: benKia(side), turnTimerEndsAt: hanLuotMoi }
          }
        } else if (laCoNuoc(this.gameMeta.gameType)) {
          if (goi.from === undefined || goi.to === undefined) {
            this.guiLoiGame(ws, 'Nước đi không hợp lệ.')
            return
          }
          const mauDi = mauQuanCua(this.gameMeta.firstTurn, side)
          const kq = trongTaiNuocCo(
            this.gameMeta.gameType,
            this.gameMoves,
            { from: goi.from, to: goi.to, ...(goi.promo !== undefined ? { promo: goi.promo } : {}) },
            mauDi,
          )
          if (!kq.hopLe) {
            this.guiLoiGame(ws, 'Nước đi không hợp lệ.')
            return
          }
          this.gameMoves = [...this.gameMoves, kq.nuoc]
          nuocVuaDi = { player: side, from: kq.nuoc.from, to: kq.nuoc.to }
          if (kq.ketThuc) {
            const { mauThang } = kq.ketThuc
            this.gameMeta = ketThucVan(
              this.gameMeta,
              mauThang === null ? 'draw' : mauThang === mauDi ? side : benKia(side),
              'normal',
            )
          } else {
            this.gameMeta = { ...this.gameMeta, currentTurn: benKia(side), turnTimerEndsAt: hanLuotMoi }
          }
        } else {
          this.guiLoiGame(ws, 'Trò chơi này không có bàn đối kháng.')
          return
        }

        this.luuGameState()
        // Sảnh chỉ nhận thay đổi vòng đời bàn, không nhận từng nước đi.
        if (this.gameMeta.status === 'ended') this.baoLobby()
        this.phatTrangThaiGame(now, nuocVuaDi)
        await this.reconcileRoomAlarm()
        return
      }

      case 'game.surrender': {
        const side = this.gheCua(att.key)
        if (this.gameMeta.status !== 'playing' || !side) return
        this.gameMeta = ketThucVan(this.gameMeta, benKia(side), 'surrender')
        this.luuGameState()
        this.baoLobby()
        this.phatTrangThaiGame(now)
        await this.reconcileRoomAlarm()
        return
      }

      case 'game.rematch': {
        const side = this.gheCua(att.key)
        if (!side) {
          this.guiLoiGame(ws, 'Chỉ hai người chơi của bàn mới đấu lại được.')
          return
        }
        if (this.gameMeta.status !== 'ended') {
          this.guiLoiGame(ws, 'Ván này chưa kết thúc.')
          return
        }
        if (this.gameMeta.rematchBy === side) return // Đã mời, đang chờ đối thủ đồng ý.
        if (this.gameMeta.rematchBy === benKia(side)) {
          // Cả hai cùng muốn đấu lại: ván mới, đổi bên đi trước.
          const van = batDauVan({ ...this.gameMeta, firstTurn: benKia(this.gameMeta.firstTurn) }, now)
          this.gameMeta = van.meta
          this.gameBoard = van.board
          this.gameMoves = []
          this.baoLobby()
        } else {
          this.gameMeta = { ...this.gameMeta, rematchBy: side }
        }
        this.luuGameState()
        this.phatTrangThaiGame(now)
        await this.reconcileRoomAlarm()
        return
      }

      case 'game.emote': {
        if (!this.choPhepBieuCam(att.key, now)) {
          this.guiLoiGame(ws, 'Bạn gửi biểu cảm hơi nhanh, chờ một chút nhé.')
          return
        }
        this.broadcastGame({ type: 'game.emote', sender: att.ten, senderKey: att.key, emote: goi.emote })
        return
      }

      default:
        return
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

  private laySlideAnnotations(): SlideAnnotationStroke[] {
    try {
      const rows = [...this.ctx.storage.sql.exec<{ stroke_data: string }>(
        'SELECT stroke_data FROM slide_annotations ORDER BY created_at ASC LIMIT 500',
      )]
      return rows.map((r) => JSON.parse(r.stroke_data) as SlideAnnotationStroke)
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

  layChat(): RoomChatMessage[] {
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

    // ── Lifecycle Closed Gate (server-authoritative fail-closed) ──
    if (this.lifecycleState.isClosed) {
      return new Response(
        JSON.stringify({
          type: 'error',
          code: 'room_closed',
          message: 'Phòng học đã đóng hoặc tạm dừng hoạt động.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

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

    const phienId = request.headers.get('X-Actor-Phien-Id') || ''
    const roomIdHeader = request.headers.get('X-Room-Id') || ''
    if (roomIdHeader && !this.roomName) {
      this.roomName = roomIdHeader
    }

    const mode = request.headers.get('X-Room-Mode')
    const laGame = mode === 'game' || this.isGameRoom
    if (laGame) {
      this.isGameRoom = true
      if (!this.gameRoomId) {
        this.gameRoomId = new URL(request.url).pathname.match(/^\/ws\/game\/([^/]+)$/)?.[1] ?? null
        // Bộ nhớ của DO mất khi ngủ đông: lưu mã bàn (và tên phòng để báo CampusDO khi rời) để còn dùng sau đó.
        if (this.gameRoomId) this.luuMeta('game_room_id', this.gameRoomId)
        if (this.roomName) this.luuMeta('room_name', this.roomName)
      }
    }

    const { 0: client, 1: server } = new WebSocketPair()
    this.ctx.acceptWebSocket(server, [theTaiKhoan(accountId), 'phien:' + phienId])
    const attObj: AttachmentKetNoi = {
      key,
      ten,
      accountId,
      phienId,
      role,
      isAdmin,
      isTeacher,
      canModerate,
      lopId,
      mic: false,
      isGame: laGame,
      _joinedAt: Date.now(),
    }
    server.serializeAttachment(attObj)

    if (laGame) {
      // Lượt đang chạy đã quá hạn mà alarm chưa kịp tới: chốt kết quả trước để người mới vào thấy đúng sự thật.
      this.xuLyHetGioLuot(Date.now())
      const snapshot: GoiGame = {
        type: 'game.snapshot',
        meta: this.gameMeta,
        board: this.gameBoard,
        moves: this.gameMoves,
        spectators: this.demNguoiXemGame(),
        chat: this.layChat(),
        serverNow: Date.now(),
      }
      try {
        server.send(JSON.stringify(snapshot))
      } catch {}
      // Cập nhật số người xem của bàn trên sảnh.
      if (this.gameMeta.playerX || this.gameMeta.playerO) this.baoLobby()
    } else {
      // Đảm bảo Pomodoro và Session Timer được cập nhật trạng thái mới nhất nếu đã hết giờ trước khi gửi snapshot
      this.kiemTraVaCapNhatPomodoro(Date.now())
      this.kiemTraVaCapNhatSessionTimer(Date.now())

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
        slideAnnotations: this.laySlideAnnotations(),
        stageLayout: this.stageLayout,
        voiceRegistry: this.getVoiceRegistry(),
        serverNow: Date.now(),
        // Learning Session v1
        sessionGoal: this.sessionGoal,
        sessionTasks: this.sessionTasks,
        sessionTaskCompletions: this.laySessionTaskCompletions(),
        sessionTimer: this.sessionTimer,
        activePoll: this.activePoll,
        pollVoteCounts: this.layPollVoteCountsChoNguoiDung(attObj),
        sessionStartedAt: this.sessionStartedAt,
        activeParticipantKeys: this.layActiveParticipants(),
      }
      try {
        server.send(JSON.stringify(snapshot))
      } catch {}
    }

    // Broadcast presence cho toàn phòng
    this.phatDanhSach()

    // ── Lifecycle: First Join & Rejoin Tracking ──
    const nowJoin = Date.now()
    let needReconcile = false
    if (!this.lifecycleState.everJoined) {
      this.lifecycleState.everJoined = true
      this.lifecycleState.lastJoinAt = nowJoin
      this.lifecycleState.lastActivityAt = nowJoin
      this.luuLifecycleState()
      needReconcile = true
      const numericId = this.parseNumericRoomId()
      if (numericId && this.env?.DB) {
        this.ctx.waitUntil(
          this.env.DB.prepare(
            'UPDATE phong SET ever_joined = 1, last_join_at = ?1, last_activity_at = ?1 WHERE id = ?2',
          )
            .bind(nowJoin, numericId)
            .run()
            .catch(() => {}),
        )
      }
    } else if (this.lifecycleState.lastParticipantLeftAt !== null) {
      // Rejoin cancels empty room timeout deadline
      this.lifecycleState.lastParticipantLeftAt = null
      this.lifecycleState.lastJoinAt = nowJoin
      this.lifecycleState.lastActivityAt = nowJoin
      this.luuLifecycleState()
      needReconcile = true
      const numericId = this.parseNumericRoomId()
      if (numericId && this.env?.DB) {
        this.ctx.waitUntil(
          this.env.DB.prepare(
            'UPDATE phong SET last_participant_left_at = NULL, last_join_at = ?1, last_activity_at = ?1 WHERE id = ?2',
          )
            .bind(nowJoin, numericId)
            .run()
            .catch(() => {}),
        )
      }
    }

    if (needReconcile) {
      this.ctx.waitUntil(this.reconcileRoomAlarm().catch(() => {}))
    }

    if (this.env?.ANALYTICS_DB) {
      recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
        event: 'room.joined',
        actorId: accountId || null,
        sessionId: phienId || null,
        roomId: this.parseNumericRoomId(),
        properties: {
          mode: laGame ? 'game' : 'study',
          role,
        },
      })
    }

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (this.vuotNhipLenh(ws)) return
    // Bước đối chiếu phiên phải chờ D1, trong lúc đó DO vẫn nhận gói kế tiếp: không xếp hàng thì lệnh sau của cùng một
    // người (vd seek) có thể chạy trước lệnh trước (vd play).
    const truoc = this.hangDoiLenh.get(ws)
    const lan = truoc ? truoc.then(() => this.xuLyTinNhan(ws, message)) : this.xuLyTinNhan(ws, message)
    const duoi = lan.catch(() => {})
    this.hangDoiLenh.set(ws, duoi)
    try {
      await lan
    } finally {
      if (this.hangDoiLenh.get(ws) === duoi) this.hangDoiLenh.delete(ws)
    }
  }

  /** Quá trần gói của kết nối thì bỏ gói; chỉ báo lỗi một lần trong mỗi cửa sổ để không tự khuếch đại. */
  private vuotNhipLenh(ws: WebSocket): boolean {
    const bayGio = Date.now()
    const nhip = this.nhipLenh.get(ws)
    if (!nhip || bayGio - nhip.batDau >= CUA_SO_LENH_MS) {
      this.nhipLenh.set(ws, { batDau: bayGio, dem: 1, daBao: false })
      return false
    }
    nhip.dem++
    if (nhip.dem <= LENH_TOI_DA_MOI_CUA_SO) return false
    if (!nhip.daBao) {
      nhip.daBao = true
      try {
        ws.send(JSON.stringify({ type: 'error', message: 'Bạn thao tác quá nhanh, chờ một chút nhé.' }))
      } catch {}
    }
    return true
  }

  private vuotNhipChat(ws: WebSocket): boolean {
    const bayGio = Date.now()
    const nhip = this.nhipChat.get(ws) ?? { batDauNgan: bayGio, demNgan: 0, batDauPhut: bayGio, demPhut: 0 }
    if (bayGio - nhip.batDauNgan >= CHAT_CUA_SO_NGAN_MS) {
      nhip.batDauNgan = bayGio
      nhip.demNgan = 0
    }
    if (bayGio - nhip.batDauPhut >= 60_000) {
      nhip.batDauPhut = bayGio
      nhip.demPhut = 0
    }
    if (nhip.demNgan >= CHAT_TOI_DA_CUA_SO_NGAN || nhip.demPhut >= CHAT_TOI_DA_MOI_PHUT) return true
    nhip.demNgan++
    nhip.demPhut++
    this.nhipChat.set(ws, nhip)
    return false
  }

  /** Gói laser vừa có phiên được đối chiếu D1 gần đây thì không cần truy vấn D1 lại. */
  private laserConTinPhien(ws: WebSocket, type: string, raw: { [k: string]: unknown }): boolean {
    if (type !== 'slide.action') return false
    const data = raw.data as { action?: unknown } | null | undefined
    if (data?.action !== 'laser') return false
    const luc = this.phienXacMinhLuc.get(ws)
    return luc !== undefined && Date.now() - luc < LASER_TIN_PHIEN_MS
  }

  private async xuLyTinNhan(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    // DO có thể vừa thức dậy từ ngủ đông (WebSocket Hibernation): bộ nhớ trống trơn, phải nạp lại trạng thái
    // từ SQLite trước khi xử lý — nếu không, lệnh chạy trên trạng thái mặc định (ván cờ "chưa bắt đầu",
    // video/ghi chú rỗng…) và có thể ghi đè dữ liệu thật.
    this.nạpDuLieuNeuCan()
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

    this.ghiNhanActivity(att.key)

    const type = String(raw.type || '')

    // Keepalive 'ping' is non-mutating and does not need D1 check
    if (type === 'ping') {
      const t = typeof raw.t === 'number' ? raw.t : Date.now()
      ws.send(JSON.stringify({ type: 'pong', t, serverNow: Date.now() }))
      return
    }

    // ── Tier 2 Fail-Closed Session Invariant: Authoritative mutation validation ──
    if (att.phienId && att.accountId && !this.laserConTinPhien(ws, type, raw)) {
      let thietBiDb: string | null = null
      try {
        const row = await this.env.DB.prepare(
          'SELECT thiet_bi FROM tai_khoan_campus WHERE id = ?1',
        )
          .bind(att.accountId)
          .first<{ thiet_bi: string | null }>()
        thietBiDb = row?.thiet_bi ?? null
      } catch (dbErr) {
        console.warn('[RoomDO] Lỗi tra cứu session D1 fallback:', dbErr)
        // STRICT FAIL-CLOSED: D1 lookup failed -> drop mutation immediately and close socket
        try {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Không thể xác thực phiên với cơ sở dữ liệu. Thao tác bị từ chối.',
          }))
        } catch {}
        try {
          ws.close(1011, 'd1_verification_failed')
        } catch {}
        this.phatDanhSach(ws)
        return
      }

      if (!thietBiDb || thietBiDb !== att.phienId) {
        // STRICT FAIL-CLOSED: Stale socket detected (session replaced or revoked in D1)
        try {
          ws.send(JSON.stringify({ type: 'session.replaced' }))
        } catch {}
        try {
          ws.close(MA_DONG_SOCKET.PHIEN_BI_THAY, 'da_dang_nhap_noi_khac')
        } catch {}
        await this.revokeVoiceForActor(att.key)
        this.phatDanhSach(ws)
        return
      }
      this.phienXacMinhLuc.set(ws, Date.now())
    }

    if (type.startsWith('game.')) {
      const parseRes = LenhGame.safeParse(raw)
      if (!parseRes.success) {
        ws.send(JSON.stringify({ type: 'error', message: 'Lệnh game không hợp lệ.' }))
        return
      }
      await this.xuLyLenhGame(ws, att, parseRes.data)
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
        // Người tham gia chỉ xem: mọi thao tác video (kể cả khi phòng cũ đã tắt hostOnlyControl) dành cho người trình chiếu.
        if (!laQuanTri) {
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
        if (this.env?.ANALYTICS_DB && (d.action === 'play' || d.action === 'load')) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'media.playback_started',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
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
          await this.reconcileRoomAlarm()
        } else if (d.action === 'pause') {
          if (!this.pomodoro.running) {
            // Idempotent: already paused
            return
          }
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
          await this.reconcileRoomAlarm()
        } else if (d.action === 'reset') {
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
          await this.reconcileRoomAlarm()
        } else if (d.action === 'switch_mode') {
          if (this.pomodoro.mode === d.mode && !this.pomodoro.running) {
            // Idempotent: already in this mode and paused
            return
          }
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
          await this.reconcileRoomAlarm()
        }

        this.luuMeta('pomodoro', this.pomodoro)
        this.broadcast({ type: 'pomodoro.sync', state: this.pomodoro, serverNow: now })
        break
      }

      case 'whiteboard.action': {
        const d = goi.data
        if (d.action === 'stroke.add') {
          // Chỉ người trình chiếu vẽ lên bảng (giao diện đã ẩn công cụ vẽ với học sinh — máy chủ cũng phải chặn).
          if (!laQuanTri) {
            ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới vẽ được lên bảng.' }))
            return
          }
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
            // Người vẽ do máy chủ gắn (không lấy từ client) — căn cứ cho quyền tẩy nét.
            by: att.key,
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
          if (this.env?.ANALYTICS_DB) {
            recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
              event: 'whiteboard.updated',
              actorId: att.accountId || null,
              sessionId: att.phienId || null,
              roomId: this.parseNumericRoomId(),
            })
          }
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
        } else if (d.action === 'stroke.remove') {
          // Tẩy một nét: người vẽ tẩy được nét của chính mình; chủ phòng / người điều hành tẩy được mọi nét.
          let dong: { stroke_data: string } | undefined
          try {
            dong = this.ctx.storage.sql
              .exec<{ stroke_data: string }>('SELECT stroke_data FROM whiteboard_strokes WHERE id = ?1', d.id)
              .toArray()[0]
          } catch (err) {
            console.error('Lỗi tra nét vẽ whiteboard để tẩy:', err)
            return
          }
          if (!dong) return
          let nguoiVe: string | undefined
          try {
            nguoiVe = (JSON.parse(dong.stroke_data) as WhiteboardStroke).by
          } catch {}
          if (!laQuanTri && nguoiVe !== att.key) {
            ws.send(JSON.stringify({ type: 'error', message: 'Bạn chỉ tẩy được nét vẽ của mình.' }))
            return
          }
          try {
            this.ctx.storage.sql.exec('DELETE FROM whiteboard_strokes WHERE id = ?1', d.id)
          } catch (err) {
            console.error('Lỗi tẩy nét vẽ whiteboard:', err)
            return
          }
          this.broadcast({ type: 'whiteboard.sync', action: 'stroke.remove', strokeId: d.id })
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
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'notes.updated',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'queue.action': {
        const d = goi.data
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới quản lý danh sách video.' }))
          return
        }
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
              ...(this.slide.fileType === 'pptx' ? { step: Math.min(Math.max(0, d.step ?? 0), 999) } : {}),
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
          const isR2Asset =
            !pathname.includes('..') &&
            (/^\/api\/files\/[a-zA-Z0-9_./-]+$/.test(pathname) ||
              /^\/api\/slides\/[a-zA-Z0-9_./-]+$/.test(pathname) ||
              /^\/api\/rooms\/[0-9]+\/documents\/[0-9]+\/file$/.test(pathname))
          const isGoogleSlide = /^https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9_-]+(\/.*)?$/.test(rawUrl)
          if (!isR2Asset && !isGoogleSlide) {
            ws.send(JSON.stringify({ type: 'error', message: 'Đường dẫn tài liệu không hợp lệ. Chỉ chấp nhận tệp tải lên (/api/rooms/... hoặc /api/files/...) hoặc Google Slides.' }))
            return
          }
          const totalPages = d.fileType === 'image' ? 1 : Math.max(1, Math.min(500, d.totalPages))
          this.slide = {
            docId: d.docId,
            docUrl: isR2Asset ? pathname : rawUrl,
            docName: lamSachVanBan(d.docName) || 'Tài liệu trình chiếu',
            fileType: d.fileType,
            currentPage: 1,
            totalPages,
          }
          try {
            this.ctx.storage.sql.exec('DELETE FROM slide_annotations')
          } catch {}
          this.broadcast({ type: 'slide.annotation', action: 'clear' })
        } else if (d.action === 'close_doc') {
          this.slide = null
          try {
            this.ctx.storage.sql.exec('DELETE FROM slide_annotations')
          } catch {}
          this.broadcast({ type: 'slide.annotation', action: 'clear' })
        } else if (d.action === 'set_total_pages') {
          // .pptx dựng trên trình duyệt: chỉ sửa số trang (giữ trang hiện tại trong giới hạn), không đụng tới chú thích.
          if (!this.slide || this.slide.fileType !== 'pptx') return
          const totalPages = Math.max(1, Math.min(500, d.totalPages))
          if (totalPages === this.slide.totalPages) return
          this.slide = {
            ...this.slide,
            totalPages,
            currentPage: Math.min(this.slide.currentPage, totalPages),
          }
        } else if (d.action === 'annotation_add') {
          const st = d.stroke
          if (!Array.isArray(st.points) || st.points.length === 0 || st.points.length > 300) {
            ws.send(JSON.stringify({ type: 'error', message: 'Nét vẽ chú thích không hợp lệ (tối đa 300 điểm).' }))
            return
          }
          const stroke: SlideAnnotationStroke = {
            id: st.id,
            page: st.page,
            tool: st.tool,
            points: st.points,
            color: st.color,
            size: st.size,
            opacity: st.opacity,
            ...(st.tool === 'text' && st.text ? { text: st.text } : {}),
          }
          try {
            this.ctx.storage.sql.exec(
              'INSERT OR REPLACE INTO slide_annotations (id, page, stroke_data, created_at) VALUES (?1, ?2, ?3, ?4)',
              stroke.id,
              stroke.page,
              JSON.stringify(stroke),
              Date.now(),
            )
            this.ctx.storage.sql.exec(
              'DELETE FROM slide_annotations WHERE id NOT IN (SELECT id FROM slide_annotations ORDER BY created_at DESC LIMIT 500)',
            )
          } catch (err) {
            console.error('Lỗi lưu nét vẽ slide:', err)
          }
          this.broadcast({ type: 'slide.annotation', action: 'add', stroke })
          return
        } else if (d.action === 'annotation_clear') {
          try {
            if (d.page) {
              this.ctx.storage.sql.exec('DELETE FROM slide_annotations WHERE page = ?1', d.page)
            } else {
              this.ctx.storage.sql.exec('DELETE FROM slide_annotations')
            }
          } catch (err) {
            console.error('Lỗi xóa nét vẽ slide:', err)
          }
          this.broadcast({ type: 'slide.annotation', action: 'clear', page: d.page })
          return
        } else if (d.action === 'annotation_remove') {
          try {
            this.ctx.storage.sql.exec('DELETE FROM slide_annotations WHERE id = ?1', d.id)
          } catch (err) {
            console.error('Lỗi xóa nét vẽ slide theo id:', err)
          }
          this.broadcast({ type: 'slide.annotation', action: 'remove', strokeId: d.id })
          return
        } else if (d.action === 'laser') {
          this.broadcast({
            type: 'slide.laser',
            point: d.point,
            page: d.page,
            senderName: att.ten || 'Giáo viên',
          })
          return
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
        if (this.vuotNhipChat(ws)) {
          ws.send(JSON.stringify({ type: 'error', reqId, message: 'Bạn gửi tin quá nhanh, chờ một chút nhé.' }))
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
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'chat.message_sent',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
            properties: {
              scope: 'room',
            },
          })
        }
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

      case 'stage.layout': {
        // Chỉ người trình chiếu đặt bố cục sân khấu; học sinh nhận stage.sync và hiển thị theo.
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc người điều hành mới đổi được bố cục trình chiếu.' }))
          return
        }
        this.stageLayout = goi.layout
        this.luuMeta('stage_layout', this.stageLayout)
        this.broadcast({ type: 'stage.sync', layout: this.stageLayout }, ws)
        break
      }

      case 'session.action': {
        const parsed = LenhPhongSession.safeParse(goi.data)
        if (!parsed.success) {
          ws.send(JSON.stringify({ type: 'error', message: 'Dữ liệu hành động phiên học không hợp lệ.' }))
          return
        }
        await this.handleSessionAction(ws, att, parsed.data)
        break
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.nạpDuLieuNeuCan()
    try {
      ws.close(code, reason)
    } catch {}
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (att) {
      if (this.env?.ANALYTICS_DB) {
        const durationMs = att._joinedAt ? Date.now() - att._joinedAt : null
        recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
          event: 'room.left',
          actorId: att.accountId || null,
          sessionId: att.phienId || null,
          roomId: this.parseNumericRoomId(),
          durationMs,
          properties: {
            closeCode: code,
          },
        })
      }
      const conLai = this.ctx.getWebSockets().filter((w) => {
        if (w === ws || w.readyState !== WebSocket.OPEN) return false
        const a = w.deserializeAttachment() as AttachmentKetNoi | null
        return a?.key === att.key
      })
      if (conLai.length === 0) {
        this.removeVoicePublication(att.key)
        if (this.roomName && att.accountId) {
          try {
            await this.env.CAMPUS.get(this.env.CAMPUS.idFromName(TEN_CAMPUS))
              .roiPhong(att.accountId, this.roomName)
          } catch {}
        }
      }
    }

    // ── Lifecycle: Empty Room Tracking ──
    if (this.lifecycleState.everJoined && !this.lifecycleState.isClosed) {
      const remainingUniqueActors = new Set(
        this.ctx
          .getWebSockets()
          .filter((w) => w !== ws && w.readyState === WebSocket.OPEN)
          .map((w) => (w.deserializeAttachment() as AttachmentKetNoi | null)?.key)
          .filter(Boolean),
      )
      if (remainingUniqueActors.size === 0 && this.lifecycleState.lastParticipantLeftAt === null) {
        const leftNow = Date.now()
        this.lifecycleState.lastParticipantLeftAt = leftNow
        this.luuLifecycleState()
        const numericId = this.parseNumericRoomId()
        if (numericId && this.env?.DB) {
          this.ctx.waitUntil(
            this.env.DB.prepare(
              'UPDATE phong SET last_participant_left_at = ?1 WHERE id = ?2',
            )
              .bind(leftNow, numericId)
              .run()
              .catch(() => {}),
          )
        }
        this.ctx.waitUntil(this.reconcileRoomAlarm().catch(() => {}))
      }
    }

    this.phatDanhSach(ws)
    this.baoRoiLobbyNeuTrong(ws)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.nạpDuLieuNeuCan()
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (att) {
      const conLai = this.ctx.getWebSockets().filter((w) => {
        if (w === ws || w.readyState !== WebSocket.OPEN) return false
        const a = w.deserializeAttachment() as AttachmentKetNoi | null
        return a?.key === att.key
      })
      if (conLai.length === 0) {
        this.removeVoicePublication(att.key)
        if (this.roomName && att.accountId) {
          try {
            await this.env.CAMPUS.get(this.env.CAMPUS.idFromName(TEN_CAMPUS))
              .roiPhong(att.accountId, this.roomName)
          } catch {}
        }
      }
    }

    // ── Lifecycle: Empty Room Tracking ──
    if (this.lifecycleState.everJoined && !this.lifecycleState.isClosed) {
      const remainingUniqueActors = new Set(
        this.ctx
          .getWebSockets()
          .filter((w) => w !== ws && w.readyState === WebSocket.OPEN)
          .map((w) => (w.deserializeAttachment() as AttachmentKetNoi | null)?.key)
          .filter(Boolean),
      )
      if (remainingUniqueActors.size === 0 && this.lifecycleState.lastParticipantLeftAt === null) {
        const leftNow = Date.now()
        this.lifecycleState.lastParticipantLeftAt = leftNow
        this.luuLifecycleState()
        const numericId = this.parseNumericRoomId()
        if (numericId && this.env?.DB) {
          this.ctx.waitUntil(
            this.env.DB.prepare(
              'UPDATE phong SET last_participant_left_at = ?1 WHERE id = ?2',
            )
              .bind(leftNow, numericId)
              .run()
              .catch(() => {}),
          )
        }
        this.ctx.waitUntil(this.reconcileRoomAlarm().catch(() => {}))
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

  private luuSessionTimer(): void {
    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO session_timer (id, running, duration_seconds, started_at, ends_at, remaining, revision)
         VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(id) DO UPDATE SET
           running = ?1,
           duration_seconds = ?2,
           started_at = ?3,
           ends_at = ?4,
           remaining = ?5,
           revision = ?6`,
        this.sessionTimer.running ? 1 : 0,
        this.sessionTimer.durationSeconds,
        this.sessionTimer.startedAt,
        this.sessionTimer.endsAt,
        this.sessionTimer.remaining,
        this.sessionTimer.revision,
      )
    } catch (err) {
      console.error('Lỗi lưu session_timer vào SQLite:', err)
    }
  }

  private laySessionTaskCompletions(): Record<string, number[]> {
    const res: Record<string, number[]> = {}
    for (const [taskId, set] of this.sessionTaskCompletions) {
      res[taskId] = Array.from(set)
    }
    return res
  }

  private phatTasksSync(): void {
    this.broadcast({
      type: 'session.tasks.sync',
      tasks: this.sessionTasks,
      completionMap: this.laySessionTaskCompletions(),
    })
  }

  private layPollVoteCounts(pollId: string): Record<string, number> {
    const counts: Record<string, number> = {}
    if (this.activePoll && this.activePoll.id === pollId) {
      for (const opt of this.activePoll.options) {
        counts[opt.id] = 0
      }
    }
    const votes = this.pollVotes.get(pollId)
    if (votes) {
      for (const optId of votes.values()) {
        counts[optId] = (counts[optId] || 0) + 1
      }
    }
    return counts
  }

  private layPollVoteCountsChoNguoiDung(att: AttachmentKetNoi | null): Record<string, number> | null {
    if (!this.activePoll) return null
    if (this.activePoll.closed) return this.layPollVoteCounts(this.activePoll.id)
    if (att && this.coQuyenDieuKhien(att)) return this.layPollVoteCounts(this.activePoll.id)
    return null
  }

  private phatPollSync(): void {
    if (!this.activePoll) {
      this.broadcast({ type: 'session.poll.sync', poll: null, voteCounts: null })
      return
    }
    const counts = this.layPollVoteCounts(this.activePoll.id)
    if (this.activePoll.closed) {
      this.broadcast({ type: 'session.poll.sync', poll: this.activePoll, voteCounts: counts })
      return
    }
    for (const ws of this.ctx.getWebSockets()) {
      if (ws.readyState !== WebSocket.OPEN) continue
      const att = ws.deserializeAttachment() as AttachmentKetNoi | null
      const isControl = att && this.coQuyenDieuKhien(att)
      const msg: GoiPhong = {
        type: 'session.poll.sync',
        poll: this.activePoll,
        voteCounts: isControl ? counts : null,
      }
      try {
        ws.send(JSON.stringify(msg))
      } catch {}
    }
  }

  private ghiNhanActivity(actorKey: string): void {
    const now = Date.now()
    try {
      this.ctx.storage.sql.exec(
        'INSERT INTO session_activity (actor_key, last_active_at) VALUES (?1, ?2) ON CONFLICT(actor_key) DO UPDATE SET last_active_at = ?2',
        actorKey,
        now,
      )
    } catch (err) {
      console.error('Lỗi ghi nhận session_activity:', err)
    }

    this.lifecycleState.lastActivityAt = now
    // Throttle ghi D1 tối đa 1 lần mỗi 30 giây per active room (Section 27)
    if (now - this.lastD1ActivityPersistAt > 30000) {
      this.lastD1ActivityPersistAt = now
      const numericId = this.parseNumericRoomId()
      if (numericId && this.env?.DB) {
        this.ctx.waitUntil(
          this.env.DB.prepare('UPDATE phong SET last_activity_at = ?1 WHERE id = ?2')
            .bind(now, numericId)
            .run()
            .catch(() => {}),
        )
      }
    }
  }

  private layActiveParticipants(windowMs: number = 5 * 60 * 1000): string[] {
    const threshold = Date.now() - windowMs
    try {
      const rows = [...this.ctx.storage.sql.exec<{ actor_key: string }>(
        'SELECT actor_key FROM session_activity WHERE last_active_at >= ?1',
        threshold,
      )]
      return rows.map((r) => r.actor_key)
    } catch {
      return []
    }
  }

  private async handleSessionAction(ws: WebSocket, att: AttachmentKetNoi, action: LenhPhongSession): Promise<void> {
    const laQuanTri = this.coQuyenDieuKhien(att)

    switch (action.action) {
      case 'goal.set': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền đặt mục tiêu buổi học.' }))
          return
        }
        const text = lamSachVanBan(action.text)
        if (!text) {
          ws.send(JSON.stringify({ type: 'error', message: 'Nội dung mục tiêu không được để trống.' }))
          return
        }
        this.sessionGoal = {
          text,
          setBy: att.ten || 'Giáo viên',
          setAt: Date.now(),
          revision: (this.sessionGoal?.revision || 0) + 1,
        }
        try {
          this.ctx.storage.sql.exec(
            "INSERT INTO session_state (key, value) VALUES ('goal', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1",
            JSON.stringify(this.sessionGoal),
          )
        } catch (err) {
          console.error('Lỗi lưu sessionGoal:', err)
        }
        this.broadcast({ type: 'session.goal.sync', goal: this.sessionGoal })
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.goal_set',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'goal.clear': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền xóa mục tiêu.' }))
          return
        }
        this.sessionGoal = null
        try {
          this.ctx.storage.sql.exec("DELETE FROM session_state WHERE key = 'goal'")
        } catch {}
        this.broadcast({ type: 'session.goal.sync', goal: null })
        break
      }

      case 'task.add': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền thêm nhiệm vụ.' }))
          return
        }
        if (this.sessionTasks.length >= 30) {
          ws.send(JSON.stringify({ type: 'error', message: 'Số lượng nhiệm vụ tối đa trong một buổi học là 30.' }))
          return
        }
        const text = lamSachVanBan(action.text)
        if (!text) {
          ws.send(JSON.stringify({ type: 'error', message: 'Nội dung nhiệm vụ không được để trống.' }))
          return
        }
        const newTask: SessionTask = {
          id: crypto.randomUUID(),
          text,
          createdBy: att.ten || 'Giáo viên',
          createdAt: Date.now(),
          order: this.sessionTasks.length,
        }
        this.sessionTasks.push(newTask)
        try {
          this.ctx.storage.sql.exec(
            'INSERT INTO session_tasks (id, text, created_by, created_at, position) VALUES (?1, ?2, ?3, ?4, ?5)',
            newTask.id,
            newTask.text,
            newTask.createdBy,
            newTask.createdAt,
            newTask.order,
          )
        } catch (err) {
          console.error('Lỗi lưu sessionTask:', err)
        }
        this.phatTasksSync()
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.task_added',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'task.remove': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền xóa nhiệm vụ.' }))
          return
        }
        this.sessionTasks = this.sessionTasks.filter((t) => t.id !== action.taskId)
        this.sessionTaskCompletions.delete(action.taskId)
        try {
          this.ctx.storage.sql.exec('DELETE FROM session_tasks WHERE id = ?1', action.taskId)
          this.ctx.storage.sql.exec('DELETE FROM session_task_completions WHERE task_id = ?1', action.taskId)
        } catch (err) {
          console.error('Lỗi xóa sessionTask:', err)
        }
        this.phatTasksSync()
        break
      }

      case 'task.tick': {
        if (!att.accountId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Yêu cầu đăng nhập để đánh dấu hoàn thành nhiệm vụ.' }))
          return
        }
        const task = this.sessionTasks.find((t) => t.id === action.taskId)
        if (!task) {
          ws.send(JSON.stringify({ type: 'error', message: 'Nhiệm vụ không tồn tại.' }))
          return
        }
        let set = this.sessionTaskCompletions.get(action.taskId)
        if (!set) {
          set = new Set<number>()
          this.sessionTaskCompletions.set(action.taskId, set)
        }
        if (!set.has(att.accountId)) {
          set.add(att.accountId)
          try {
            this.ctx.storage.sql.exec(
              'INSERT OR IGNORE INTO session_task_completions (task_id, account_id, completed_at) VALUES (?1, ?2, ?3)',
              action.taskId,
              att.accountId,
              Date.now(),
            )
          } catch (err) {
            console.error('Lỗi lưu session_task_completions:', err)
          }
          this.phatTasksSync()
          if (this.env?.ANALYTICS_DB) {
            recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
              event: 'session.task_completed',
              actorId: att.accountId,
              sessionId: att.phienId || null,
              roomId: this.parseNumericRoomId(),
            })
          }
        }
        break
      }

      case 'task.untick': {
        if (!att.accountId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Yêu cầu đăng nhập để bỏ đánh dấu nhiệm vụ.' }))
          return
        }
        const set = this.sessionTaskCompletions.get(action.taskId)
        if (set && set.has(att.accountId)) {
          set.delete(att.accountId)
          try {
            this.ctx.storage.sql.exec(
              'DELETE FROM session_task_completions WHERE task_id = ?1 AND account_id = ?2',
              action.taskId,
              att.accountId,
            )
          } catch (err) {
            console.error('Lỗi xóa session_task_completions:', err)
          }
          this.phatTasksSync()
        }
        break
      }

      case 'timer.start': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền điều khiển đồng hồ.' }))
          return
        }
        const now = Date.now()
        const dur = Math.max(60, Math.min(10800, action.durationSeconds))
        this.sessionTimer = {
          running: true,
          durationSeconds: dur,
          startedAt: now,
          endsAt: now + dur * 1000,
          remaining: dur,
          revision: (this.sessionTimer.revision || 1) + 1,
        }
        this.luuSessionTimer()
        await this.updateTimerAlarm()
        this.broadcast({ type: 'session.timer.sync', state: this.sessionTimer, serverNow: now })
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.timer_started',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'timer.pause': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền tạm dừng đồng hồ.' }))
          return
        }
        if (!this.sessionTimer.running) return
        const now = Date.now()
        const remaining = this.sessionTimer.endsAt > now
          ? Math.max(0, Math.round((this.sessionTimer.endsAt - now) / 1000))
          : 0
        this.sessionTimer = {
          ...this.sessionTimer,
          running: false,
          endsAt: 0,
          remaining,
          revision: (this.sessionTimer.revision || 1) + 1,
        }
        this.luuSessionTimer()
        await this.updateTimerAlarm()
        this.broadcast({ type: 'session.timer.sync', state: this.sessionTimer, serverNow: now })
        break
      }

      case 'timer.reset': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền đặt lại đồng hồ.' }))
          return
        }
        const dur = this.sessionTimer.durationSeconds || 1800
        this.sessionTimer = {
          running: false,
          durationSeconds: dur,
          startedAt: 0,
          endsAt: 0,
          remaining: dur,
          revision: (this.sessionTimer.revision || 1) + 1,
        }
        this.luuSessionTimer()
        await this.updateTimerAlarm()
        this.broadcast({ type: 'session.timer.sync', state: this.sessionTimer, serverNow: Date.now() })
        break
      }

      case 'poll.create': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền tạo bình chọn.' }))
          return
        }
        const question = lamSachVanBan(action.question)
        if (!question) {
          ws.send(JSON.stringify({ type: 'error', message: 'Nội dung câu hỏi không được để trống.' }))
          return
        }
        const cleanOptions = action.options
          .map((o) => lamSachVanBan(o))
          .filter(Boolean)
        if (cleanOptions.length < 2 || cleanOptions.length > 4) {
          ws.send(JSON.stringify({ type: 'error', message: 'Bình chọn phải có từ 2 đến 4 lựa chọn.' }))
          return
        }
        const pollId = crypto.randomUUID()
        const options: PollOption[] = cleanOptions.map((text) => ({
          id: crypto.randomUUID(),
          text,
        }))
        this.activePoll = {
          id: pollId,
          question,
          options,
          createdBy: att.ten || 'Giáo viên',
          createdAt: Date.now(),
          closed: false,
        }
        this.pollVotes.set(pollId, new Map())
        try {
          this.ctx.storage.sql.exec(
            'INSERT INTO session_polls (id, question, options_json, created_by, created_at, closed) VALUES (?1, ?2, ?3, ?4, ?5, 0)',
            pollId,
            question,
            JSON.stringify(options),
            this.activePoll.createdBy,
            this.activePoll.createdAt,
          )
        } catch (err) {
          console.error('Lỗi lưu session_polls:', err)
        }
        this.phatPollSync()
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.poll_created',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'poll.vote': {
        if (!att.accountId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Yêu cầu đăng nhập để tham gia bình chọn.' }))
          return
        }
        if (!this.activePoll || this.activePoll.closed || this.activePoll.id !== action.pollId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Bình chọn hiện không mở hoặc không tồn tại.' }))
          return
        }
        const optExists = this.activePoll.options.some((o) => o.id === action.optionId)
        if (!optExists) {
          ws.send(JSON.stringify({ type: 'error', message: 'Lựa chọn bình chọn không hợp lệ.' }))
          return
        }
        let votes = this.pollVotes.get(action.pollId)
        if (!votes) {
          votes = new Map<number, string>()
          this.pollVotes.set(action.pollId, votes)
        }
        votes.set(att.accountId, action.optionId)
        try {
          this.ctx.storage.sql.exec(
            `INSERT INTO session_poll_votes (poll_id, account_id, option_id, voted_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(poll_id, account_id) DO UPDATE SET option_id = ?3, voted_at = ?4`,
            action.pollId,
            att.accountId,
            action.optionId,
            Date.now(),
          )
        } catch (err) {
          console.error('Lỗi lưu session_poll_votes:', err)
        }
        this.phatPollSync()
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.poll_voted',
            actorId: att.accountId,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
          })
        }
        break
      }

      case 'poll.close': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền đóng bình chọn.' }))
          return
        }
        if (!this.activePoll || this.activePoll.closed) return
        this.activePoll.closed = true
        try {
          this.ctx.storage.sql.exec('UPDATE session_polls SET closed = 1 WHERE id = ?1', this.activePoll.id)
        } catch (err) {
          console.error('Lỗi đóng session_polls:', err)
        }
        this.phatPollSync()
        break
      }

      case 'session.start': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền bắt đầu phiên học.' }))
          return
        }
        if (this.activeLearningSession) {
          ws.send(JSON.stringify({ type: 'error', message: 'Phiên học đã bắt đầu từ trước đó.' }))
          return
        }
        const now = Date.now()
        const candidateSession = { sessionId: crypto.randomUUID(), startedAt: now }
        try {
          if (this.testFailSessionStartSql) {
            throw new Error('Simulated SQLite disk I/O error during session.start')
          }
          this.ctx.storage.sql.exec(
            "INSERT INTO session_state (key, value) VALUES ('active_session', ?1), ('started_at', ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            JSON.stringify(candidateSession),
            String(now),
          )
        } catch (err) {
          console.error('Lỗi lưu activeLearningSession:', err)
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Không thể lưu trạng thái bắt đầu phiên học vào cơ sở dữ liệu. Vui lòng thử lại.',
            }),
          )
          return
        }

        this.activeLearningSession = candidateSession
        this.sessionStartedAt = now
        this.broadcast({
          type: 'session.timer.sync',
          state: this.sessionTimer,
          serverNow: now,
        })
        break
      }

      case 'session.end': {
        if (!laQuanTri) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng hoặc giáo viên mới có quyền kết thúc phiên học.' }))
          return
        }
        if (!this.activeLearningSession) {
          ws.send(JSON.stringify({ type: 'error', message: 'Không có phiên học nào đang diễn ra để kết thúc.' }))
          return
        }
        const now = Date.now()
        const { sessionId, startedAt } = this.activeLearningSession
        const endedAt = now
        const durationSeconds = Math.max(0, Math.round((endedAt - startedAt) / 1000))

        const activeMembers = this.layActiveParticipants(Math.max(5 * 60 * 1000, now - startedAt))
        const totalAdmitted = Math.max(1, activeMembers.length)

        const taskCompletionRates: Record<string, number> = {}
        for (const t of this.sessionTasks) {
          const completedCount = this.sessionTaskCompletions.get(t.id)?.size || 0
          taskCompletionRates[t.id] = Math.min(100, Math.round((completedCount / totalAdmitted) * 100))
        }

        const pollResults = this.activePoll
          ? [
              {
                question: this.activePoll.question,
                options: this.activePoll.options.map((opt) => ({
                  text: opt.text,
                  count: this.layPollVoteCounts(this.activePoll!.id)[opt.id] || 0,
                })),
              },
            ]
          : []

        const summary: SessionSummary = {
          sessionId,
          roomId: this.parseNumericRoomId() ?? 0,
          goal: this.sessionGoal?.text || null,
          startedAt,
          endedAt,
          durationSeconds,
          taskCount: this.sessionTasks.length,
          taskCompletionRates,
          activeMembers,
          pollResults,
        }

        const taskCompletions: Array<{ taskId: string; accountId: number }> = []
        for (const [taskId, accSet] of this.sessionTaskCompletions.entries()) {
          for (const accId of accSet) {
            taskCompletions.push({ taskId, accountId: accId })
          }
        }

        const pollVotes: Array<{ pollId: string; accountId: number }> = []
        for (const [pollId, voteMap] of this.pollVotes.entries()) {
          for (const accId of voteMap.keys()) {
            pollVotes.push({ pollId, accountId: accId })
          }
        }

        const participantAccountIds: number[] = []
        for (const m of activeMembers) {
          const rawId = m.startsWith('acc:') ? m.slice(4) : m
          const idNum = parseInt(rawId, 10)
          if (Number.isFinite(idNum) && idNum > 0) {
            participantAccountIds.push(idNum)
          }
        }

        const facts: SessionEngagementFacts = {
          participantAccountIds,
          taskCompletions,
          pollVotes,
        }
        const factsJson = JSON.stringify(facts)

        // 1. Authoritative SQLite transaction (Linearization Point):
        // Archive summary + enqueue outbox + clear active session + wipe session working tables
        try {
          this.ctx.storage.transactionSync(() => {
            if (this.testFailSessionEndSql) {
              throw new Error('Simulated SQLite disk I/O error during session.end transaction')
            }
            this.ctx.storage.sql.exec(
              'INSERT INTO session_summaries (id, room_id, started_at, ended_at, summary_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
              summary.sessionId,
              summary.roomId,
              summary.startedAt,
              summary.endedAt,
              JSON.stringify(summary),
              now,
            )
            if (summary.roomId > 0) {
              this.ctx.storage.sql.exec(
                `INSERT OR IGNORE INTO pending_session_summary_sync
                 (session_id, room_id, summary_json, facts_json, attempts, last_attempt_at, next_retry_at, created_at)
                 VALUES (?1, ?2, ?3, ?4, 0, 0, 0, ?5)`,
                summary.sessionId,
                summary.roomId,
                JSON.stringify(summary),
                factsJson,
                now,
              )
            }
            this.ctx.storage.sql.exec("DELETE FROM session_state WHERE key IN ('active_session', 'started_at', 'goal')")
            this.ctx.storage.sql.exec('DELETE FROM session_tasks')
            this.ctx.storage.sql.exec('DELETE FROM session_task_completions')
            this.ctx.storage.sql.exec('DELETE FROM session_polls')
            this.ctx.storage.sql.exec('DELETE FROM session_poll_votes')
            this.ctx.storage.sql.exec('DELETE FROM session_activity')
            this.ctx.storage.sql.exec(
              'UPDATE session_timer SET running = 0, started_at = 0, ends_at = 0, remaining = duration_seconds, revision = revision + 1 WHERE id = 1',
            )
          })
        } catch (err) {
          console.error('Lỗi transaction lưu summary và xóa working state:', err)
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Không thể kết thúc phiên học do lỗi lưu trữ. Vui lòng thử lại.',
            }),
          )
          return
        }

        // 2. Only after SQLite transaction succeeds: Clear in-memory working state (Blocker 3)
        this.activeLearningSession = null
        this.sessionStartedAt = null
        this.sessionGoal = null
        this.sessionTasks = []
        this.sessionTaskCompletions.clear()
        this.activePoll = null
        this.pollVotes.clear()
        this.sessionTimer = {
          running: false,
          durationSeconds: this.sessionTimer.durationSeconds || 1800,
          startedAt: 0,
          endsAt: 0,
          remaining: this.sessionTimer.durationSeconds || 1800,
          revision: (this.sessionTimer.revision || 1) + 1,
        }

        // 3. Reconcile alarm (timer is stopped)
        await this.reconcileRoomAlarm()

        // 4. Broadcast summary & clean working state to all clients
        this.broadcast({ type: 'session.summary', summary })
        this.broadcast({ type: 'session.goal.sync', goal: null })
        this.broadcast({ type: 'session.tasks.sync', tasks: [], completionMap: {} })
        this.broadcast({ type: 'session.poll.sync', poll: null, voteCounts: null })
        this.broadcast({ type: 'session.timer.sync', state: this.sessionTimer, serverNow: now })
        this.broadcast({ type: 'session.participation', activeKeys: [] })

        // 5. Asynchronously deliver D1 outbox summary
        this.ctx.waitUntil(this.xuLyPendingSummarySync(now).catch(() => {}))

        // 6. Record analytics event
        if (this.env?.ANALYTICS_DB) {
          const avgCompletionRate =
            summary.taskCount > 0
              ? Math.round(
                  Object.values(taskCompletionRates).reduce((a, b) => a + b, 0) / summary.taskCount,
                )
              : 0
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'session.ended',
            actorId: att.accountId || null,
            sessionId: att.phienId || null,
            roomId: this.parseNumericRoomId(),
            durationMs: durationSeconds * 1000,
            properties: {
              durationSeconds,
              taskCompletionRate: avgCompletionRate,
              activeMemberCount: activeMembers.length,
            },
          })
        }
        break
      }
    }
  }

  getActiveLearningSession(): { sessionId: string; startedAt: number } | null {
    return this.activeLearningSession
  }

  getPendingSessionSummaries(): Array<{
    sessionId: string
    roomId: number
    summaryJson: string
    factsJson: string | null
    attempts: number
    lastAttemptAt: number
    nextRetryAt: number
    createdAt: number
  }> {
    try {
      return [...this.ctx.storage.sql.exec<{
        session_id: string
        room_id: number
        summary_json: string
        facts_json: string | null
        attempts: number
        last_attempt_at: number
        next_retry_at: number
        created_at: number
      }>(
        'SELECT session_id, room_id, summary_json, facts_json, attempts, last_attempt_at, next_retry_at, created_at FROM pending_session_summary_sync ORDER BY created_at ASC',
      )].map((r) => ({
        sessionId: r.session_id,
        roomId: r.room_id,
        summaryJson: r.summary_json,
        factsJson: r.facts_json || null,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        nextRetryAt: r.next_retry_at,
        createdAt: r.created_at,
      }))
    } catch {
      return []
    }
  }

  async xuLyPendingSummarySync(now = Date.now()): Promise<number> {
    if (!this.env?.DB) return 0
    const pending = this.getPendingSessionSummaries()
    if (pending.length === 0) return 0

    let delivered = 0
    const d1 = this.env.DB

    for (const item of pending) {
      const override = this.summaryRetryOverrides.get(item.sessionId)
      const effectiveNextRetry = override?.nextRetryAt ?? item.nextRetryAt
      if (effectiveNextRetry > now) continue
      try {
        const summary = JSON.parse(item.summaryJson) as SessionSummary
        let facts: SessionEngagementFacts | undefined
        if (item.factsJson) {
          try {
            facts = JSON.parse(item.factsJson)
          } catch {}
        }

        // 1. Authoritative persistence in D1
        await d1
          .prepare(
            `INSERT OR IGNORE INTO hoc_session_summary
             (id, phong_id, started_at, ended_at, duration_seconds, summary_json, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime(?7, 'unixepoch'))`,
          )
          .bind(
            summary.sessionId,
            summary.roomId,
            summary.startedAt,
            summary.endedAt,
            summary.durationSeconds,
            item.summaryJson,
            Math.floor(item.createdAt / 1000),
          )
          .run()

        // 2. Authoritative engagement reward delivery (throws if any participant/operation fails)
        await processLearningSessionSummaryEngagement(d1, summary, this.env.ANALYTICS_DB, this.ctx, facts)

        // 3. ONLY after BOTH D1 summary persistence AND engagement delivery succeed:
        // Delete from RoomDO durable outbox and clear in-memory override
        this.summaryRetryOverrides.delete(item.sessionId)
        try {
          this.ctx.storage.sql.exec('DELETE FROM pending_session_summary_sync WHERE session_id = ?1', item.sessionId)
        } catch {}
        delivered++
      } catch (err) {
        console.error(`[xuLyPendingSummarySync] Outbox processing failed for session=${item.sessionId}:`, err)
        const currentAttempts = override?.attempts ?? item.attempts
        const nextAttempts = currentAttempts + 1
        if (nextAttempts >= 5) {
          console.warn(
            `[xuLyPendingSummarySync] CẢNH BÁO VẬN HÀNH: summary sync cho session=${item.sessionId} đã thử thất bại ${nextAttempts} lần. Tiếp tục duy trì outbox và retry với backoff tối đa.`,
          )
        }
        const backoffDelay = Math.min(1000 * Math.pow(2, Math.max(0, nextAttempts - 1)), 60000)
        const nextRetryAt = now + backoffDelay

        try {
          this.ctx.storage.sql.exec(
            'UPDATE pending_session_summary_sync SET attempts = ?1, last_attempt_at = ?2, next_retry_at = ?3 WHERE session_id = ?4',
            nextAttempts,
            now,
            nextRetryAt,
            item.sessionId,
          )
          this.summaryRetryOverrides.delete(item.sessionId)
        } catch (sqlErr) {
          console.warn('[xuLyPendingSummarySync] Lỗi SQLite khi ghi nhận backoff summary sync:', sqlErr)
          // Invariant: Override bảo đảm nextRetryAt luôn nằm ở tương lai kể cả khi SQLite UPDATE bị ngoại lệ
          this.summaryRetryOverrides.set(item.sessionId, { attempts: nextAttempts, nextRetryAt })
        }
      }
    }

    await this.reconcileRoomAlarm()
    return delivered
  }

  // ── Testing & Adversarial Invariant Helpers (RPC exposed for vitest) ──

  async testSetFailSessionStartSql(fail: boolean): Promise<void> {
    this.testFailSessionStartSql = fail
  }

  async testSetFailSessionEndSql(fail: boolean): Promise<void> {
    this.testFailSessionEndSql = fail
  }

  async testGetPendingSummaryCount(): Promise<number> {
    return this.getPendingSessionSummaries().length
  }

  async testSetTimer(running: boolean, endsAt: number, remaining: number): Promise<void> {
    this.sessionTimer = {
      ...this.sessionTimer,
      running,
      endsAt,
      remaining,
      revision: (this.sessionTimer.revision || 1) + 1,
    }
    this.luuSessionTimer()
    await this.reconcileRoomAlarm()
  }

  async testAddPendingVoiceRevocation(
    revocationId: string,
    actorKey: string,
    sessionId: string,
    nextRetryAt: number,
  ): Promise<void> {
    const now = Date.now()
    this.voiceRetryOverrides.delete(revocationId)
    this.ctx.storage.sql.exec(
      `INSERT INTO pending_voice_revocations
       (revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, next_retry_at, created_at)
       VALUES (?1, ?2, ?3, 'audio', NULL, 1, 1, ?4, ?5, ?4)`,
      revocationId,
      actorKey,
      sessionId,
      now,
      nextRetryAt,
    )
    await this.reconcileRoomAlarm()
  }

  async testDeletePendingVoiceRevocation(revocationId: string): Promise<void> {
    this.voiceRetryOverrides.delete(revocationId)
    this.ctx.storage.sql.exec('DELETE FROM pending_voice_revocations WHERE revocation_id = ?1', revocationId)
    await this.reconcileRoomAlarm()
  }

  async testAddPendingSummarySync(
    sessionId: string,
    roomId: number,
    summaryJson: string,
    nextRetryAt: number,
    factsJson?: string,
  ): Promise<void> {
    const now = Date.now()
    this.summaryRetryOverrides.delete(sessionId)
    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO pending_session_summary_sync
       (session_id, room_id, summary_json, facts_json, attempts, last_attempt_at, next_retry_at, created_at)
       VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?5)`,
      sessionId,
      roomId,
      summaryJson,
      factsJson || null,
      now,
      nextRetryAt,
    )
    await this.reconcileRoomAlarm()
  }

  async testTriggerAlarm(): Promise<void> {
    await this.alarm()
  }

  async testGetSessionSummariesCount(): Promise<number> {
    const rows = [...this.ctx.storage.sql.exec<{ cnt: number }>('SELECT count(*) as cnt FROM session_summaries')]
    return rows[0]?.cnt ?? 0
  }

  // Báo GameLobbyDO bàn đang chờ/đang chơi (upsert) hoặc đã kết thúc (gỡ khỏi sảnh) — không chờ kết quả,
  // lỗi báo cáo không được phép làm hỏng phản hồi nước đi thật cho người chơi.
  private baoLobby(boQua?: WebSocket): void {
    if (!this.isGameRoom || !this.gameRoomId) return
    const ban: BanSanh = {
      id: this.gameRoomId,
      gameType: this.gameMeta.gameType,
      tenChu: this.gameMeta.playerXName,
      tenKhach: this.gameMeta.playerOName,
      trangThai: this.gameMeta.status,
      soNguoiXem: this.demNguoiXemGame(boQua),
      turnTimerSeconds: this.gameMeta.turnTimerSeconds,
      capNhatLuc: Date.now(),
    }
    const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
    const rpc = ban.trangThai === 'ended' ? lobby.xoaBan(ban.id) : lobby.capNhatBan(ban)
    this.ctx.waitUntil(rpc.catch((err: unknown) => console.error('Không báo được GameLobbyDO:', err)))
  }

  // Phòng đã trống hẳn (mọi người, kể cả khán giả, đã rời) — gỡ khỏi sảnh dù ván chưa kết thúc.
  // Còn người ở lại thì chỉ cập nhật số người xem của bàn trên sảnh.
  private baoRoiLobbyNeuTrong(vuaRoi: WebSocket): void {
    if (!this.isGameRoom || !this.gameRoomId) return
    if (this.layDanhSachThanhVien(vuaRoi).length > 0) {
      if (this.gameMeta.playerX || this.gameMeta.playerO) this.baoLobby(vuaRoi)
      return
    }
    const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
    this.ctx.waitUntil(
      lobby.xoaBan(this.gameRoomId).catch((err: unknown) => console.error('Không gỡ được khỏi GameLobbyDO:', err)),
    )
  }

  // Phòng học báo sảnh Campus số người đang ở trong phòng (bàn game có GameLobbyDO riêng) — không chờ kết quả,
  // lỗi báo cáo không được làm hỏng việc vào/ra phòng thật; báo hỏng thì lần thay đổi sau thử lại.
  private baoSoNguoiChoSanh(soNguoi: number): void {
    if (this.isGameRoom || this.lifecycleState.isClosed || this.soNguoiDaBaoSanh === soNguoi) return
    const id = this.parseNumericRoomId()
    if (!id) return
    this.soNguoiDaBaoSanh = soNguoi
    const campus = this.env.CAMPUS.get(this.env.CAMPUS.idFromName(TEN_CAMPUS))
    this.ctx.waitUntil(
      campus.capNhatSoNguoi(id, soNguoi).catch((err: unknown) => {
        this.soNguoiDaBaoSanh = null
        console.error('Không báo được số người phòng học cho sảnh Campus:', err)
      }),
    )
  }

  private phatDanhSach(boQua?: WebSocket): void {
    const members = this.layDanhSachThanhVien(boQua)
    this.baoSoNguoiChoSanh(members.length)
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

  tinhVoiceBackoffDelay(attempts: number): number {
    const safe = Math.max(1, attempts || 1)
    return Math.min(1000 * Math.pow(2, safe - 1), 60000)
  }

  async scheduleVoiceRevocationAlarm(delayMs: number): Promise<void> {
    try {
      const targetTime = Date.now() + Math.max(500, delayMs)
      this.voiceAlarmTarget = this.voiceAlarmTarget === null ? targetTime : Math.min(this.voiceAlarmTarget, targetTime)
      try {
        this.ctx.storage.sql.exec(
          'UPDATE pending_voice_revocations SET next_retry_at = ?1 WHERE next_retry_at = 0 OR next_retry_at > ?1',
          targetTime,
        )
      } catch {}
      await this.reconcileRoomAlarm()
    } catch (err) {
      console.error('[RoomDO] Lỗi scheduleVoiceRevocationAlarm:', err)
    }
  }

  async getVoiceRevocationAlarmTime(): Promise<number | null> {
    try {
      return await this.ctx.storage.getAlarm()
    } catch {
      return null
    }
  }

  async revokeVoiceForActor(actorKey: string): Promise<void> {
    const p = this.voiceRegistry.get(actorKey)
    if (!p) {
      // Check if there is already a pending revocation to retry
      const pending = this.getPendingVoiceRevocation(actorKey)
      if (pending) {
        await this.retrySingleVoiceRevocation(pending)
      }
      return
    }

    const targetSessionId = p.sessionId
    const targetTrackId = p.audioTrackId
    const targetMid = p.mid ?? null
    const generation = p.generation

    let targetRevocationId: string | null = null
    const now = Date.now()

    // 1 & 2. Atomic SQLite transaction: revoke local publication authority and persist pending remote close
    if (targetSessionId && (targetMid || targetTrackId)) {
      targetRevocationId = 'rev_' + crypto.randomUUID()
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec('DELETE FROM voice_publications WHERE actor_key = ?1', actorKey)
        this.ctx.storage.sql.exec(
          `INSERT INTO pending_voice_revocations
           (revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, next_retry_at, error_text, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?7, NULL, ?7)`,
          targetRevocationId,
          actorKey,
          targetSessionId,
          targetTrackId || null,
          targetMid || null,
          generation,
          now,
        )
      })
    } else {
      this.ctx.storage.transactionSync(() => {
        this.ctx.storage.sql.exec('DELETE FROM voice_publications WHERE actor_key = ?1', actorKey)
      })
    }

    // Update in-memory registry and websocket attachments
    this.voiceRegistry.delete(actorKey)
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      if (a && a.key === actorKey) {
        a.mic = false
        ws.serializeAttachment(a)
      }
    }
    this.broadcast({
      type: 'voice.removed',
      actorKey,
    })
    this.phatDanhSach()

    // 3. Attempt external Cloudflare Calls /tracks/close
    if (targetRevocationId && targetSessionId && (targetMid || targetTrackId)) {
      await this.attemptSfuCloseWithTracking(
        targetRevocationId,
        actorKey,
        targetSessionId,
        targetMid,
        targetTrackId,
        generation,
      )
    }
  }

  async attemptSfuCloseWithTracking(
    revocationId: string,
    actorKey: string,
    sessionId: string,
    mid: string | null,
    trackName: string | null,
    _generation?: number,
  ): Promise<{ ok: boolean; status: number; errorText?: string }> {
    try {
      const sfuPayloadTracks: Array<{ trackName: string } | { mid: string }> = mid
        ? [{ mid }]
        : [{ trackName: trackName || '' }]

      const res = await callCloudflareRealtime(this.env, `/sessions/${sessionId}/tracks/close`, 'PUT', {
        tracks: sfuPayloadTracks,
        force: true,
      })

      // Invariant: Success (200/201) OR authoritative already-closed (404/410) clears pending
      if (res.ok || res.status === 404 || res.status === 410) {
        this.voiceRetryOverrides.delete(revocationId)
        try {
          this.ctx.storage.sql.exec('DELETE FROM pending_voice_revocations WHERE revocation_id = ?1', revocationId)
        } catch {}
        return res
      }

      // Transient or non-terminal failure
      console.warn(`[attemptSfuCloseWithTracking] SFU close thất bại (${res.status}): ${res.errorText || 'lỗi'}`)
      const existingRow = this.getPendingVoiceRevocation(revocationId)
      const currentAttempts = this.voiceRetryOverrides.get(revocationId)?.attempts ?? existingRow?.attempts ?? 0
      const nextAttempts = currentAttempts + 1
      const backoffDelay = this.tinhVoiceBackoffDelay(nextAttempts)
      const nextRetryAt = Date.now() + backoffDelay

      try {
        this.ctx.storage.sql.exec(
          `UPDATE pending_voice_revocations
           SET attempts = ?1, last_attempt_at = ?2, next_retry_at = ?3, error_text = ?4
           WHERE revocation_id = ?5`,
          nextAttempts,
          Date.now(),
          nextRetryAt,
          res.errorText || `HTTP_${res.status}`,
          revocationId,
        )
        this.voiceRetryOverrides.delete(revocationId)
      } catch (sqlErr) {
        console.warn('[attemptSfuCloseWithTracking] Lỗi SQLite khi cập nhật voice revocation:', sqlErr)
        this.voiceRetryOverrides.set(revocationId, { attempts: nextAttempts, nextRetryAt })
      }

      if (nextAttempts >= 5) {
        console.warn(
          `[OPERATIONAL_ALERT] SFU close cho actor=${actorKey} revocation=${revocationId} session=${sessionId} thất bại lần thứ ${nextAttempts} (${res.status}): ${res.errorText || 'lỗi'}`,
        )
        if (this.env?.ANALYTICS_DB) {
          recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
            event: 'do.sfu_close_failed',
            errorClass: 'SFU_CLOSE_FAILED',
            properties: { attempts: nextAttempts },
          })
        }
      }

      // Schedule retry via alarm with bounded backoff
      await this.scheduleVoiceRevocationAlarm(backoffDelay)

      return res
    } catch (err: any) {
      console.warn(`[attemptSfuCloseWithTracking] Ngoại lệ khi gọi SFU close:`, err)
      const existingRow = this.getPendingVoiceRevocation(revocationId)
      const currentAttempts = this.voiceRetryOverrides.get(revocationId)?.attempts ?? existingRow?.attempts ?? 0
      const nextAttempts = currentAttempts + 1
      const backoffDelay = this.tinhVoiceBackoffDelay(nextAttempts)
      const nextRetryAt = Date.now() + backoffDelay

      this.voiceRetryOverrides.set(revocationId, { attempts: nextAttempts, nextRetryAt })

      try {
        this.ctx.storage.sql.exec(
          `UPDATE pending_voice_revocations
           SET attempts = ?1, last_attempt_at = ?2, next_retry_at = ?3, error_text = ?4
           WHERE revocation_id = ?5`,
          nextAttempts,
          Date.now(),
          nextRetryAt,
          err?.message || 'exception',
          revocationId,
        )
      } catch (sqlErr) {
        console.warn('[attemptSfuCloseWithTracking] Lỗi SQLite khi cập nhật voice revocation:', sqlErr)
      }

      if (nextAttempts >= 5) {
        console.warn(
          `[OPERATIONAL_ALERT] SFU close cho actor=${actorKey} revocation=${revocationId} session=${sessionId} gặp ngoại lệ lần thứ ${nextAttempts}: ${err?.message || 'exception'}`,
        )
      }

      // Fix PRV8.1: Thrown exception MUST schedule alarm retry with bounded backoff
      await this.scheduleVoiceRevocationAlarm(backoffDelay)

      return { ok: false, status: 502, errorText: err?.message || 'exception' }
    }
  }

  getPendingVoiceRevocation(idOrActorKey: string): {
    revocationId: string
    actorKey: string
    sessionId: string
    trackName: string | null
    mid: string | null
    generation: number
    attempts: number
    lastAttemptAt: number
    errorText: string | null
    createdAt: number
  } | null {
    try {
      const isRevocationId = idOrActorKey.startsWith('rev_') || idOrActorKey.startsWith('legacy_')
      const query = isRevocationId
        ? 'SELECT revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, error_text, created_at FROM pending_voice_revocations WHERE revocation_id = ?1'
        : 'SELECT revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, error_text, created_at FROM pending_voice_revocations WHERE actor_key = ?1 ORDER BY created_at DESC LIMIT 1'
      const rows = [...this.ctx.storage.sql.exec<{
        revocation_id: string
        actor_key: string
        session_id: string
        track_name: string | null
        mid: string | null
        generation: number
        attempts: number
        last_attempt_at: number
        error_text: string | null
        created_at: number
      }>(query, idOrActorKey)]
      if (rows.length === 0) return null
      const r = rows[0]
      return {
        revocationId: r.revocation_id,
        actorKey: r.actor_key,
        sessionId: r.session_id,
        trackName: r.track_name,
        mid: r.mid,
        generation: r.generation,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        errorText: r.error_text,
        createdAt: r.created_at,
      }
    } catch {
      return null
    }
  }

  getPendingVoiceRevocationsForActor(actorKey: string): Array<{
    revocationId: string
    actorKey: string
    sessionId: string
    trackName: string | null
    mid: string | null
    generation: number
    attempts: number
    lastAttemptAt: number
    errorText: string | null
    createdAt: number
  }> {
    try {
      return [...this.ctx.storage.sql.exec<{
        revocation_id: string
        actor_key: string
        session_id: string
        track_name: string | null
        mid: string | null
        generation: number
        attempts: number
        last_attempt_at: number
        error_text: string | null
        created_at: number
      }>(
        'SELECT revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, error_text, created_at FROM pending_voice_revocations WHERE actor_key = ?1 ORDER BY created_at ASC',
        actorKey,
      )].map((r) => ({
        revocationId: r.revocation_id,
        actorKey: r.actor_key,
        sessionId: r.session_id,
        trackName: r.track_name,
        mid: r.mid,
        generation: r.generation,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        errorText: r.error_text,
        createdAt: r.created_at,
      }))
    } catch {
      return []
    }
  }

  getPendingVoiceRevocations(): Array<{
    revocationId: string
    actorKey: string
    sessionId: string
    trackName: string | null
    mid: string | null
    generation: number
    attempts: number
    lastAttemptAt: number
    errorText: string | null
    createdAt: number
  }> {
    try {
      return [...this.ctx.storage.sql.exec<{
        revocation_id: string
        actor_key: string
        session_id: string
        track_name: string | null
        mid: string | null
        generation: number
        attempts: number
        last_attempt_at: number
        error_text: string | null
        created_at: number
      }>(
        'SELECT revocation_id, actor_key, session_id, track_name, mid, generation, attempts, last_attempt_at, error_text, created_at FROM pending_voice_revocations ORDER BY created_at ASC',
      )].map((r) => ({
        revocationId: r.revocation_id,
        actorKey: r.actor_key,
        sessionId: r.session_id,
        trackName: r.track_name,
        mid: r.mid,
        generation: r.generation,
        attempts: r.attempts,
        lastAttemptAt: r.last_attempt_at,
        errorText: r.error_text,
        createdAt: r.created_at,
      }))
    } catch {
      return []
    }
  }

  async retrySingleVoiceRevocation(pending: {
    revocationId: string
    actorKey: string
    sessionId: string
    trackName: string | null
    mid: string | null
    generation?: number
    attempts: number
  }): Promise<boolean> {
    if (pending.attempts >= 5) {
      console.warn(
        `[OPERATIONAL_ALERT] Pending voice revocation ${pending.revocationId} cho actor=${pending.actorKey} session=${pending.sessionId} đã đạt ${pending.attempts} lần thử nhưng chưa đóng authoritative. Tiếp tục retry theo chu kỳ capped backoff.`,
      )
      if (this.env?.ANALYTICS_DB) {
        recordAnalyticsEvent(this.env.ANALYTICS_DB, this.ctx, {
          event: 'do.revocation_retry',
          errorClass: 'VOICE_REVOCATION_RETRY',
          properties: { attempts: pending.attempts },
        })
      }
    }
    const res = await this.attemptSfuCloseWithTracking(
      pending.revocationId,
      pending.actorKey,
      pending.sessionId,
      pending.mid,
      pending.trackName,
      pending.generation,
    )
    return res.ok || res.status === 404 || res.status === 410
  }

  async retryPendingVoiceRevocations(_now = Date.now()): Promise<number> {
    const pendingList = this.getPendingVoiceRevocations()
    let cleared = 0
    let minNextDelay = Infinity
    for (const row of pendingList) {
      const ok = await this.retrySingleVoiceRevocation(row)
      if (ok) {
        cleared++
      } else {
        const nextDelay = this.tinhVoiceBackoffDelay(row.attempts + 1)
        if (nextDelay < minNextDelay) minNextDelay = nextDelay
      }
    }
    if (pendingList.length > cleared && Number.isFinite(minNextDelay)) {
      await this.scheduleVoiceRevocationAlarm(minNextDelay)
    }
    return cleared
  }

  async dongBoPhienTaiKhoan(
    accountId: number,
    authoritativePhienId: string | null,
  ): Promise<{ ok: boolean; closedCount: number }> {
    const daDong: WebSocket[] = []
    const targetActorKey = theTaiKhoan(accountId)

    for (const ws of this.ctx.getWebSockets(targetActorKey)) {
      const a = ws.deserializeAttachment() as AttachmentKetNoi | null
      // Sockets matching authoritative session are PRESERVED!
      if (authoritativePhienId && a?.phienId === authoritativePhienId) {
        continue
      }
      try {
        ws.send(JSON.stringify({ type: 'session.replaced' }))
      } catch {}
      try {
        ws.close(MA_DONG_SOCKET.PHIEN_BI_THAY, 'da_dang_nhap_noi_khac')
      } catch {}
      daDong.push(ws)
    }

    if (daDong.length > 0) {
      const conLai = this.ctx.getWebSockets(targetActorKey).filter(
        (w) => !daDong.includes(w) && w.readyState === WebSocket.OPEN,
      )
      if (conLai.length === 0) {
        await this.revokeVoiceForActor(targetActorKey)
      }
      this.phatDanhSach()
    }
    return { ok: true, closedCount: daDong.length }
  }

  async reconcileAccountSession(
    accountId: number,
    authoritativePhienId: string | null,
  ): Promise<{ ok: boolean; closedCount: number }> {
    return this.dongBoPhienTaiKhoan(accountId, authoritativePhienId)
  }

  async huyPhienCu(accountId: number, currentPhienId: string): Promise<number> {
    const res = await this.dongBoPhienTaiKhoan(accountId, currentPhienId)
    return res.closedCount
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

    if (request.method === 'GET' && url.pathname === '/internal/voice/pending-revocations') {
      return json({ ok: true, pending: this.getPendingVoiceRevocations() })
    }

    if (request.method === 'POST' && url.pathname === '/internal/voice/pending-revocations/retry') {
      const cleared = await this.retryPendingVoiceRevocations()
      return json({ ok: true, cleared, pending: this.getPendingVoiceRevocations() })
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

    if (request.method === 'POST' && url.pathname === '/internal/session/revoke') {
      try {
        const body = (await request.json()) as { accountId: number; currentPhienId: string }
        const count = await this.huyPhienCu(body.accountId, body.currentPhienId)
        return json({ ok: true, closedCount: count })
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/session/reconcile') {
      try {
        const body = (await request.json()) as { accountId: number; authoritativePhienId: string | null }
        const res = await this.dongBoPhienTaiKhoan(body.accountId, body.authoritativePhienId ?? null)
        return json(res)
      } catch {
        return json({ ok: false, message: 'Dữ liệu không hợp lệ' }, 400)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/actor/role') {
      const actorKey = url.searchParams.get('actorKey') || ''
      const info = this.getActorRoleInfo(actorKey)
      return json({ ok: true, info })
    }

    // ── Milestone A1: Room Lifecycle Internal Endpoints ──

    if (request.method === 'POST' && url.pathname === '/internal/lifecycle/init') {
      try {
        const body = (await request.json()) as {
          roomId: number
          createdAt: number
          policy?: {
            autoCloseEnabled?: boolean
            neverJoinedTtlMinutes?: number
            emptyRoomTtlMinutes?: number
            maxRoomLifetimeMinutes?: number
          }
        }
        this.nạpDuLieuNeuCan()
        if (body.roomId) {
          this.roomName = `phong-${body.roomId}`
          try {
            this.ctx.storage.sql.exec(
              "INSERT INTO room_meta (key, value) VALUES ('room_name', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1",
              this.roomName,
            )
          } catch {}
        }
        this.lifecycleState.createdAt = body.createdAt || Date.now()
        this.lifecycleState.everJoined = false
        this.lifecycleState.lastJoinAt = null
        this.lifecycleState.lastParticipantLeftAt = null
        this.lifecycleState.lastActivityAt = body.createdAt || Date.now()
        this.lifecycleState.isClosed = false
        this.lifecycleState.closeReason = null
        this.lifecycleState.closedAt = null
        this.lifecycleState.closedBy = null
        if (body.policy) {
          if (typeof body.policy.autoCloseEnabled === 'boolean') {
            this.lifecycleState.autoCloseEnabled = body.policy.autoCloseEnabled
          }
          if (typeof body.policy.neverJoinedTtlMinutes === 'number') {
            this.lifecycleState.neverJoinedTtlMinutes = body.policy.neverJoinedTtlMinutes
          }
          if (typeof body.policy.emptyRoomTtlMinutes === 'number') {
            this.lifecycleState.emptyRoomTtlMinutes = body.policy.emptyRoomTtlMinutes
          }
          if (typeof body.policy.maxRoomLifetimeMinutes === 'number') {
            this.lifecycleState.maxRoomLifetimeMinutes = body.policy.maxRoomLifetimeMinutes
          }
        }
        this.luuLifecycleState()
        await this.reconcileRoomAlarm()
        return json({ ok: true })
      } catch (err: any) {
        return json({ ok: false, error: err?.message || 'init_failed' }, 500)
      }
    }

    if (request.method === 'POST' && url.pathname === '/internal/lifecycle/close') {
      try {
        const body = (await request.json()) as {
          reason: string
          closedByAccountId?: number | null
          closedByName?: string
          actorType?: string
          note?: string | null
        }
        const res = await this.dongPhongNoiBo(body)
        return json(res)
      } catch (err: any) {
        return json({ ok: false, error: err?.message || 'close_failed' }, 500)
      }
    }

    if (request.method === 'GET' && url.pathname === '/internal/lifecycle/state') {
      this.nạpDuLieuNeuCan()
      const liveSockets = this.ctx.getWebSockets().filter((ws) => ws.readyState === WebSocket.OPEN)
      const uniqueActors = new Set(
        liveSockets
          .map((ws) => (ws.deserializeAttachment() as AttachmentKetNoi | null)?.key)
          .filter(Boolean),
      )
      return json({
        ok: true,
        lifecycle: this.lifecycleState,
        uniqueLiveParticipants: uniqueActors.size,
        totalSockets: liveSockets.length,
      })
    }



    return new Response('Không tìm thấy endpoint nội bộ.', { status: 404 })
  }

  async dongPhongNoiBo(params: {
    reason: string
    closedByAccountId?: number | null
    closedByName?: string
    actorType?: string
    note?: string | null
    closedAt?: number | null
    finalizePending?: boolean
  }): Promise<{ ok: boolean; closedCount: number; alreadyClosedLocally?: boolean }> {
    this.nạpDuLieuNeuCan()
    if (this.lifecycleState.isClosed) {
      return { ok: true, closedCount: 0, alreadyClosedLocally: true }
    }
    const now = Date.now()

    // 1. Chốt trạng thái vòng đời trong RoomDO SQLite
    this.lifecycleState.isClosed = true
    this.lifecycleState.closeReason = params.reason
    this.lifecycleState.closedAt = params.closedAt || now
    this.lifecycleState.closedBy = params.closedByAccountId ?? null
    this.lifecycleState.retryAttempts = 0
    this.lifecycleState.nextRetryAt = 0
    this.lifecycleState.finalizePending = Boolean(params.finalizePending)
    if (!this.lifecycleState.finalizePending) {
      this.lifecycleState.finalizeRetryAttempts = 0
      this.lifecycleState.finalizeNextRetryAt = 0
    }
    this.consecutiveOverdueAlarms = 0
    this.lifecycleState.consecutiveOverdueAlarms = 0
    this.luuLifecycleState()

    // 2. Chốt Learning Session nếu đang chạy để không mất dữ liệu summary (Section 15 & 28)
    if (this.activeLearningSession) {
      try {
        const { sessionId, startedAt } = this.activeLearningSession
        const durationSeconds = Math.max(0, Math.round((now - startedAt) / 1000))
        const activeMembers = this.layActiveParticipants(Math.max(5 * 60 * 1000, now - startedAt))
        const totalAdmitted = Math.max(1, activeMembers.length)
        const taskCompletionRates: Record<string, number> = {}
        for (const t of this.sessionTasks) {
          const completedCount = this.sessionTaskCompletions.get(t.id)?.size || 0
          taskCompletionRates[t.id] = Math.min(100, Math.round((completedCount / totalAdmitted) * 100))
        }
        const summary: SessionSummary = {
          sessionId,
          roomId: this.parseNumericRoomId() ?? 0,
          goal: this.sessionGoal?.text || null,
          startedAt,
          endedAt: now,
          durationSeconds,
          taskCount: this.sessionTasks.length,
          taskCompletionRates,
          pollResults: this.activePoll
            ? [
                {
                  question: this.activePoll.question,
                  options: this.activePoll.options.map((opt) => ({
                    text: opt.text,
                    count: this.layPollVoteCounts(this.activePoll!.id)[opt.id] || 0,
                  })),
                },
              ]
            : [],
          activeMembers,
        }
        if (summary.roomId > 0) {
          this.ctx.storage.sql.exec(
            `INSERT OR IGNORE INTO pending_session_summary_sync
             (session_id, room_id, summary_json, facts_json, attempts, last_attempt_at, next_retry_at, created_at)
             VALUES (?1, ?2, ?3, NULL, 0, 0, 0, ?4)`,
            summary.sessionId,
            summary.roomId,
            JSON.stringify(summary),
            now,
          )
        }
      } catch (err) {
        console.warn('[RoomDO.dongPhongNoiBo] Lỗi lưu pending summary khi đóng phòng:', err)
      }
      this.activeLearningSession = null
      this.sessionStartedAt = null
    }

    // 3. Dừng timer và Pomodoro
    this.pomodoro.running = false
    this.sessionTimer.running = false

    // 4. Phát sự kiện room.closed cho tất cả socket đang kết nối
    let message = 'Phòng học đã đóng.'
    if (params.reason === 'admin_closed') {
      message = 'Phòng đã được quản trị viên đóng.'
    } else if (params.reason === 'never_joined_timeout') {
      message = 'Phòng đã tự động đóng do không có người tham gia.'
    } else if (params.reason === 'empty_timeout') {
      message = 'Phòng đã tự động đóng do tất cả thành viên đã rời phòng.'
    } else if (params.reason === 'max_lifetime') {
      message = 'Phòng đã tự động đóng do đạt thời gian hoạt động tối đa.'
    } else if (params.reason === 'owner_closed') {
      message = 'Chủ phòng đã đóng phòng học.'
    } else if (params.reason === 'moderator_room_close' || params.reason === 'moderation') {
      message = 'Phòng học đã được điều hành viên đóng.'
    }

    const closePacket: GoiPhong = {
      type: 'room.closed',
      reason: params.reason,
      message,
    }
    this.broadcast(closePacket)

    // 5. Đóng graceful các WebSocket hiện hữu (mã 1000 - Bình thường)
    const sockets = this.ctx.getWebSockets()
    let closedCount = 0
    for (const ws of sockets) {
      try {
        ws.close(1000, message)
        closedCount++
      } catch {}
    }

    // 6. Dọn dẹp publication thoại
    this.voiceRegistry.clear()
    try {
      this.ctx.storage.sql.exec('DELETE FROM voice_publications')
    } catch {}

    // 7. Báo gỡ khỏi GameLobby nếu là phòng game
    if (this.isGameRoom && this.gameRoomId) {
      try {
        const lobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
        this.ctx.waitUntil(lobby.xoaBan(this.gameRoomId).catch(() => {}))
      } catch {}
    }

    // 7b. Phòng học: gỡ khỏi danh bạ sảnh Campus ngay, không đợi lượt đối soát D1 kế tiếp.
    const idPhongHoc = this.isGameRoom ? null : this.parseNumericRoomId()
    if (idPhongHoc) {
      try {
        const campus = this.env.CAMPUS.get(this.env.CAMPUS.idFromName(TEN_CAMPUS))
        this.ctx.waitUntil(
          campus.goPhong(idPhongHoc).catch((err: unknown) => console.error('Không gỡ được phòng khỏi sảnh Campus:', err)),
        )
      } catch {}
    }

    // 8. Reconcile alarm: gỡ bỏ deadline lifecycle, duy trì retry summary/voice nếu có
    await this.reconcileRoomAlarm()

    return { ok: true, closedCount, alreadyClosedLocally: false }
  }

  async testGetLifecycleState(): Promise<RoomLifecycleLocalState> {
    this.nạpDuLieuNeuCan()
    return this.lifecycleState
  }

  async testSetLifecycleState(state: Partial<RoomLifecycleLocalState>, roomName?: string): Promise<void> {
    this.nạpDuLieuNeuCan()
    if (roomName) {
      this.roomName = roomName
    }
    this.lifecycleState = { ...this.lifecycleState, ...state }
    this.luuLifecycleState()
    await this.reconcileRoomAlarm()
  }

  async testGetScheduledAlarm(): Promise<number | null> {
    try {
      return await this.ctx.storage.getAlarm()
    } catch {
      return null
    }
  }

  async testSetPomodoro(p: Partial<PomodoroState>): Promise<void> {
    this.nạpDuLieuNeuCan()
    this.pomodoro = { ...this.pomodoro, ...p }
    this.luuMeta('pomodoro', this.pomodoro)
    await this.reconcileRoomAlarm()
  }

  async testSetSessionTimer(st: Partial<SessionTimerState>): Promise<void> {
    this.nạpDuLieuNeuCan()
    this.sessionTimer = { ...this.sessionTimer, ...st }
    this.luuMeta('session_timer', this.sessionTimer)
    await this.reconcileRoomAlarm()
  }

  testSetFailD1LifecycleClaim(fail: boolean): void {
    this.testFailD1LifecycleClaim = fail
  }

  testSetFailD1LifecycleFinalize(fail: boolean): void {
    this.testFailD1LifecycleFinalize = fail
  }

  async testReloadFromSqlite(): Promise<void> {
    this.khoiTaoXong = false
    this.nạpDuLieuNeuCan()
  }
}
