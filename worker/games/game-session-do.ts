import { DurableObject } from 'cloudflare:workers'
import {
  EMOTE_BURST_MAX,
  EMOTE_COOLDOWN_MS,
  MAX_CONSECUTIVE_INVALID_PACKETS,
  MAX_SPECTATORS_PER_MATCH,
  MAX_WS_FRAME_BYTES,
  WS_RATE_LIMIT_BURST,
  WS_RATE_LIMIT_TOKENS_PER_SEC,
  type GameEndReason,
  type GoiMatchSession,
  type LenhMatchSession,
  type MatchPlayerInfo,
  type MatchRole,
  type MatchStateSnapshot,
  type OperationalLoadState,
} from '../../shared/protocol/game-sdk'
import type { BoardCell, GameType, PlayerSide } from '../../shared/protocol/game'
import {
  kiemTraThangCaro,
  taoBanMoi,
} from '../game-engine'
import { TEN_GAME_LOBBY, tenLobbyTheoLoai } from './game-lobby-do'

export const TEN_GAME_SESSION_PREFIX = 'match:'

// ─── Alarm arbiter constants ───────────────────────────────────────────────
// Do NOT use setTimeout/setInterval anywhere in GameSessionDO.
// All timed obligations are persisted to DO SQLite and processed via alarm().
// Cloudflare alarm is at-least-once → every handler must be idempotent.
const RECONNECT_GRACE_MS = 30_000
const CLEANUP_DELAY_MS = 120_000
const COUNTDOWN_MS = 1_000
const SETTLEMENT_RETRY_BASE_MS = 5_000
const SETTLEMENT_MAX_ATTEMPTS = 5
const SETTLEMENT_WARN_THRESHOLD = 3

/**
 * Operational Load State Thresholds & Hysteresis Guards
 *
 * Evaluated locally within GameSessionDO to protect DO memory & CPU:
 * - NORMAL: Full features, emotes enabled, normal spectator freshness.
 * - CONSERVATIVE: Emotes throttled/dropped, spectator broadcasts throttled.
 * - LOAD_SHED: New spectators rejected with 429, non-essential broadcasts dropped,
 *              authoritative player moves & settlement preserved 100%.
 */
export const LOAD_STATE_THRESHOLDS = {
  CONSERVATIVE_ENTER: {
    activeSockets: 20,
    spectators: 15,
    msgRatePerSec: 15,
    outboxDepth: 3,
    invalidRatePerSec: 5,
  },
  LOAD_SHED_ENTER: {
    activeSockets: 30,
    spectators: 25,
    msgRatePerSec: 35,
    outboxDepth: 6,
    invalidRatePerSec: 10,
  },
  LOAD_SHED_EXIT: {
    activeSockets: 22,
    spectators: 18,
    msgRatePerSec: 25,
    outboxDepth: 4,
    invalidRatePerSec: 6,
  },
  CONSERVATIVE_EXIT: {
    activeSockets: 14,
    spectators: 10,
    msgRatePerSec: 10,
    outboxDepth: 1,
    invalidRatePerSec: 2,
  },
  MIN_STATE_DWELL_MS: 5000,
}

interface AttachmentKetNoi {
  actorKey: string
  accountId: number
  name: string
  role: MatchRole
  // Per-socket rate limiter (Token Bucket, in-memory on attachment)
  tokens: number
  lastTokenRefill: number
  // Emote cooldown tracking
  lastEmoteAt: number
  emoteBurstCount: number
  // Malformed / abusive packet counter
  invalidPacketCount: number
}

/**
 * GameSessionDO — Hibernation-Safe Multiplayer Match Room
 *
 * Design principles:
 * - Zero setTimeout / setInterval anywhere. All deadlines persisted in SQLite.
 * - Single alarm arbiter: picks earliest due obligation and schedules ONE alarm.
 * - Every alarm handler is idempotent (at-least-once alarm delivery).
 * - D1 settlement uses an outbox: game ends → outbox row → broadcast → retry until D1 confirms.
 * - Rematch creates a new round_id (match_room_id:rN) with its own D1 row.
 * - Per-player reconnect grace: each player has their own reconnect_deadline, never shared.
 */
export class GameSessionDO extends DurableObject<Env> {
  private matchId: string = ''
  private gameType: GameType = 'caro_15'
  private status: MatchStateSnapshot['status'] = 'waiting'
  private operationalState: OperationalLoadState = 'NORMAL'
  private lastStateTransitionAt: number = 0
  private recentMessages: number[] = []
  private recentInvalidMessages: number[] = []
  private lastStateEvaluationAt: number = 0
  private hostAccountId: number = 0
  private currentTurn: PlayerSide | null = null
  private turnTimerSeconds: number = 30
  private turnTimerEndsAt: number = 0
  private winner: PlayerSide | 'draw' | null = null
  private endReason: GameEndReason | null = null
  private scoreHost: number = 0
  private scoreGuest: number = 0
  private board: BoardCell[][] = []
  private roundSeq: number = 0
  private roundId: string = ''
  private roundStartedAt: number = 0

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.khoiTaoSql()
    this.napTrangThaiTuSql()
  }

  // ─── Schema ─────────────────────────────────────────────────────────────────

  private khoiTaoSql(): void {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS session_meta (
        key TEXT PRIMARY KEY,
        val TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_players (
        actor_key TEXT PRIMARY KEY,
        account_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        side TEXT,
        ready INTEGER NOT NULL DEFAULT 0,
        connected INTEGER NOT NULL DEFAULT 1,
        disconnected_at INTEGER,
        reconnect_deadline INTEGER
      );
      CREATE TABLE IF NOT EXISTS session_moves (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_key TEXT NOT NULL,
        side TEXT,
        x INTEGER,
        y INTEGER,
        action TEXT,
        payload TEXT,
        created_at INTEGER NOT NULL
      );
      -- Alarm obligations: every timed event stored here
      CREATE TABLE IF NOT EXISTS alarm_obligations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        deadline INTEGER NOT NULL,
        payload TEXT
      );
      -- Settlement outbox: authoritative round results to be persisted in D1
      CREATE TABLE IF NOT EXISTS settlement_outbox (
        round_id TEXT PRIMARY KEY,
        match_room_id TEXT NOT NULL,
        round_seq INTEGER NOT NULL,
        game_type TEXT NOT NULL,
        host_account_id INTEGER NOT NULL,
        guest_account_id INTEGER,
        winner_account_id INTEGER,
        score_host INTEGER NOT NULL DEFAULT 0,
        score_guest INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER NOT NULL,
        ended_at INTEGER NOT NULL,
        end_reason TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_retry_at INTEGER NOT NULL DEFAULT 0,
        settled INTEGER NOT NULL DEFAULT 0
      );
    `)
  }

  private napTrangThaiTuSql(): void {
    const metaRows = this.ctx.storage.sql.exec<{ key: string; val: string }>('SELECT key, val FROM session_meta').toArray()
    const meta = new Map<string, string>()
    for (const r of metaRows) meta.set(r.key, r.val)

    if (meta.has('match_id')) this.matchId = meta.get('match_id')!
    if (meta.has('game_type')) this.gameType = meta.get('game_type') as GameType
    if (meta.has('status')) this.status = meta.get('status') as MatchStateSnapshot['status']
    if (meta.has('host_account_id')) this.hostAccountId = Number(meta.get('host_account_id'))
    if (meta.has('current_turn')) this.currentTurn = (meta.get('current_turn') as PlayerSide) || null
    if (meta.has('turn_timer_seconds')) this.turnTimerSeconds = Number(meta.get('turn_timer_seconds')) || 30
    if (meta.has('turn_timer_ends_at')) this.turnTimerEndsAt = Number(meta.get('turn_timer_ends_at')) || 0
    if (meta.has('winner')) this.winner = (meta.get('winner') as PlayerSide | 'draw') || null
    if (meta.has('end_reason')) this.endReason = (meta.get('end_reason') as GameEndReason) || null
    if (meta.has('score_host')) this.scoreHost = Number(meta.get('score_host')) || 0
    if (meta.has('score_guest')) this.scoreGuest = Number(meta.get('score_guest')) || 0
    if (meta.has('round_seq')) this.roundSeq = Number(meta.get('round_seq')) || 0
    if (meta.has('round_id')) this.roundId = meta.get('round_id') || ''
    if (meta.has('round_started_at')) this.roundStartedAt = Number(meta.get('round_started_at')) || 0

    if (meta.has('board')) {
      try {
        this.board = JSON.parse(meta.get('board')!) as BoardCell[][]
      } catch {
        this.board = taoBanMoi(this.gameType)
      }
    } else {
      this.board = taoBanMoi(this.gameType)
    }
  }

  private ghiMeta(key: string, val: string): void {
    this.ctx.storage.sql.exec(
      'INSERT INTO session_meta (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val',
      key,
      val,
    )
  }

  // ─── Alarm Arbiter ──────────────────────────────────────────────────────────

  /** Persists an obligation and reschedules the single alarm to fire at the earliest deadline. */
  private persistObligation(id: string, type: string, deadline: number, payload?: unknown): void {
    this.ctx.storage.sql.exec(
      'INSERT INTO alarm_obligations (id, type, deadline, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET type = excluded.type, deadline = excluded.deadline, payload = excluded.payload',
      id,
      type,
      deadline,
      payload !== undefined ? JSON.stringify(payload) : null,
    )
    void this.reconcileAlarm()
  }

  private clearObligation(id: string): void {
    this.ctx.storage.sql.exec('DELETE FROM alarm_obligations WHERE id = ?', id)
    void this.reconcileAlarm()
  }

  private async reconcileAlarm(): Promise<void> {
    const row = this.ctx.storage.sql.exec<{ deadline: number }>('SELECT MIN(deadline) as deadline FROM alarm_obligations').toArray()[0]
    if (row && row.deadline) {
      await this.ctx.storage.setAlarm(row.deadline)
    } else {
      // Nothing pending — clear alarm
      await this.ctx.storage.deleteAlarm()
    }
  }

  // ─── Alarm Dispatcher ──────────────────────────────────────────────────────

  async alarm(): Promise<void> {
    const now = Date.now()
    const dueRows = this.ctx.storage.sql.exec<{ id: string; type: string; payload: string | null }>(
      'SELECT id, type, payload FROM alarm_obligations WHERE deadline <= ?',
      now,
    ).toArray()

    for (const row of dueRows) {
      const payload = row.payload ? JSON.parse(row.payload) as unknown : undefined
      try {
        await this.dispatchObligation(row.id, row.type, payload, now)
      } catch (err) {
        console.error('GameSessionDO alarm obligation error:', row.type, err)
      }
    }

    // Process pending settlement retries
    await this.processSettlementOutbox(now)

    // Reschedule for remaining obligations
    await this.reconcileAlarm()
  }

  private async dispatchObligation(id: string, type: string, payload: unknown, now: number): Promise<void> {
    switch (type) {
      case 'countdown_end':
        this.clearObligation(id)
        await this.onCountdownEnd()
        break

      case 'turn_timeout':
        this.clearObligation(id)
        await this.onTurnTimeout()
        break

      case 'reconnect_grace': {
        const actorKey = (payload as { actorKey: string }).actorKey
        this.clearObligation(id)
        await this.onReconnectGraceExpired(actorKey, now)
        break
      }

      case 'cleanup':
        this.clearObligation(id)
        await this.onCleanup()
        break

      default:
        this.clearObligation(id)
        break
    }
  }

  // ─── Obligation Handlers ────────────────────────────────────────────────────

  private async onCountdownEnd(): Promise<void> {
    if (this.status !== 'countdown') return
    if (!this.roundId) {
      this.roundSeq = 1
      this.roundId = this.matchId
      this.roundStartedAt = Date.now()
      this.ghiMeta('round_id', this.roundId)
      this.ghiMeta('round_seq', '1')
    }
    this.status = 'playing'
    this.currentTurn = 'X'
    this.turnTimerEndsAt = Date.now() + this.turnTimerSeconds * 1000

    this.ghiMeta('status', 'playing')
    this.ghiMeta('current_turn', 'X')
    this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))

    // Schedule first turn timeout
    this.persistObligation('turn_timeout', 'turn_timeout', this.turnTimerEndsAt)

    this.broadcast({
      type: 'match.state',
      status: this.status,
      currentTurn: this.currentTurn,
      turnTimerEndsAt: this.turnTimerEndsAt,
      board: this.board,
      serverTime: Date.now(),
    })
    void this.baoLobby()
  }

  private async onTurnTimeout(): Promise<void> {
    if (this.status !== 'playing' || !this.currentTurn) return
    const now = Date.now()
    // Confirm deadline has actually passed (idempotent guard against spurious alarm)
    if (now < this.turnTimerEndsAt - 500) {
      // Re-schedule remaining
      this.persistObligation('turn_timeout', 'turn_timeout', this.turnTimerEndsAt)
      return
    }
    // Timed-out player loses
    const timedOutSide = this.currentTurn
    const winnerSide: PlayerSide = timedOutSide === 'X' ? 'O' : 'X'
    await this.ketThucTran(winnerSide, 'timeout')
  }

  private async onReconnectGraceExpired(actorKey: string, now: number): Promise<void> {
    if (this.status !== 'playing') return
    const p = this.ctx.storage.sql
      .exec<{ side: PlayerSide; connected: number; reconnect_deadline: number | null }>(
        'SELECT side, connected, reconnect_deadline FROM session_players WHERE actor_key = ?',
        actorKey,
      )
      .toArray()[0]

    if (!p || p.connected === 1) return // Reconnected already
    // Double-check the persisted deadline to guard duplicate alarm delivery
    if (p.reconnect_deadline && now < p.reconnect_deadline - 500) return

    const winnerSide: PlayerSide = p.side === 'X' ? 'O' : 'X'
    await this.ketThucTran(winnerSide, 'disconnect')
  }

  private async onCleanup(): Promise<void> {
    const activeSockets = this.ctx.getWebSockets().filter((w) => w.readyState === WebSocket.OPEN)
    if (activeSockets.length > 0) return // Someone reconnected
    if (this.status === 'playing') return  // Match resumed — don't clean

    await this.baoLobbyRong()
    this.ctx.storage.sql.exec('DELETE FROM session_meta')
    this.ctx.storage.sql.exec('DELETE FROM session_players')
    this.ctx.storage.sql.exec('DELETE FROM session_moves')
    this.ctx.storage.sql.exec('DELETE FROM alarm_obligations')
    // Keep settled outbox rows for audit; delete only settled ones
    this.ctx.storage.sql.exec('DELETE FROM settlement_outbox WHERE settled = 1')
  }

  // ─── Settlement Outbox ──────────────────────────────────────────────────────

  private enqueueSettlement(params: {
    roundId: string
    matchRoomId: string
    roundSeq: number
    gameType: string
    hostAccountId: number
    guestAccountId: number | null
    winnerAccountId: number | null
    scoreHost: number
    scoreGuest: number
    startedAt: number
    endedAt: number
    endReason: string
  }): void {
    this.ctx.storage.sql.exec(
      `INSERT INTO settlement_outbox
        (round_id, match_room_id, round_seq, game_type, host_account_id, guest_account_id,
         winner_account_id, score_host, score_guest, started_at, ended_at, end_reason, attempts, next_retry_at, settled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)
       ON CONFLICT(round_id) DO NOTHING`,
      params.roundId,
      params.matchRoomId,
      params.roundSeq,
      params.gameType,
      params.hostAccountId,
      params.guestAccountId,
      params.winnerAccountId,
      params.scoreHost,
      params.scoreGuest,
      params.startedAt,
      params.endedAt,
      params.endReason,
    )
  }

  private async processSettlementOutbox(now: number): Promise<void> {
    const pending = this.ctx.storage.sql.exec<{
      round_id: string
      match_room_id: string
      round_seq: number
      game_type: string
      host_account_id: number
      guest_account_id: number | null
      winner_account_id: number | null
      score_host: number
      score_guest: number
      started_at: number
      ended_at: number
      end_reason: string
      attempts: number
    }>(
      'SELECT * FROM settlement_outbox WHERE settled = 0 AND next_retry_at <= ? AND attempts < ?',
      now,
      SETTLEMENT_MAX_ATTEMPTS,
    ).toArray()

    for (const row of pending) {
      try {
        const idempotencyKey = `${row.round_id}`
        await this.env.DB.prepare(`
          INSERT INTO game_matches (
            id, game_type, mode, host_account_id, guest_account_id,
            winner_account_id, status, score_host, score_guest,
            started_at, ended_at, end_reason, idempotency_key, created_at,
            round_seq, match_room_id
          ) VALUES (?1, ?2, '1v1', ?3, ?4, ?5, 'ended', ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
          ON CONFLICT(idempotency_key) DO NOTHING
        `).bind(
          row.round_id,
          row.game_type,
          row.host_account_id,
          row.guest_account_id,
          row.winner_account_id,
          row.score_host,
          row.score_guest,
          row.started_at,
          row.ended_at,
          row.end_reason,
          idempotencyKey,
          now,
          row.round_seq,
          row.match_room_id,
        ).run()

        // D1 write succeeded — mark settled
        this.ctx.storage.sql.exec('UPDATE settlement_outbox SET settled = 1 WHERE round_id = ?', row.round_id)
      } catch (err) {
        const nextAttempt = row.attempts + 1
        const nextRetry = now + SETTLEMENT_RETRY_BASE_MS * Math.pow(2, row.attempts)
        this.ctx.storage.sql.exec(
          'UPDATE settlement_outbox SET attempts = ?, next_retry_at = ? WHERE round_id = ?',
          nextAttempt,
          nextRetry,
          row.round_id,
        )
        if (nextAttempt >= SETTLEMENT_WARN_THRESHOLD) {
          console.warn(`GameSessionDO: D1 settlement failed ${nextAttempt}x for ${row.round_id}:`, err)
        } else {
          console.error(`GameSessionDO: D1 settlement error attempt ${nextAttempt} for ${row.round_id}:`, err)
        }
        // Schedule retry alarm
        this.persistObligation(`settlement_retry_${row.round_id}`, 'settlement_retry', nextRetry, { roundId: row.round_id })
      }
    }
  }

  // ─── HTTP / WebSocket Admission ─────────────────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/internal/init' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as {
        matchId?: string
        gameType?: GameType
        hostAccountId?: number
        turnTimerSeconds?: number
      }
      if (body.matchId) this.matchId = body.matchId
      if (body.gameType) {
        this.gameType = body.gameType
        this.board = taoBanMoi(this.gameType)
      }
      if (body.hostAccountId) this.hostAccountId = body.hostAccountId
      if (body.turnTimerSeconds) this.turnTimerSeconds = body.turnTimerSeconds

      this.ghiMeta('match_id', this.matchId)
      this.ghiMeta('game_type', this.gameType)
      this.ghiMeta('host_account_id', String(this.hostAccountId))
      this.ghiMeta('turn_timer_seconds', String(this.turnTimerSeconds))
      this.ghiMeta('status', this.status)
      this.ghiMeta('board', JSON.stringify(this.board))

      return Response.json({ ok: true, matchId: this.matchId })
    }

    if (url.pathname === '/internal/outbox' && request.method === 'GET') {
      const rows = this.ctx.storage.sql
        .exec<{ round_id: string; match_room_id: string; settled: number; attempts: number }>(
          'SELECT round_id, match_room_id, settled, attempts FROM settlement_outbox',
        )
        .toArray()
      const pendingRows = rows.filter((r) => r.settled === 0)
      return Response.json({
        ok: true,
        matchId: this.matchId,
        totalRows: rows.length,
        pendingCount: pendingRows.length,
        pendingRoundIds: pendingRows.map((r) => r.round_id),
        rows,
      })
    }

    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Yêu cầu kết nối WebSocket.', { status: 426 })
    }

    const actorKey = request.headers.get('X-Actor-Key')
    const ten = decodeURIComponent(request.headers.get('X-Actor-Ten') || '')
    const accountId = Number(request.headers.get('X-Actor-Account-Id') || '0')
    const matchId = request.headers.get('X-Match-Id') || this.matchId

    if (!actorKey || !accountId) {
      return new Response('Thiếu thông tin xác thực phiên.', { status: 401 })
    }

    if (!this.matchId && matchId) {
      this.matchId = matchId
      this.ghiMeta('match_id', this.matchId)
    }

    const { 0: client, 1: server } = new WebSocketPair()

    const playersCount = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'player'")
      .toArray()[0]?.c || 0

    let role: MatchRole = 'spectator'
    let side: PlayerSide | null = null

    const existing = this.ctx.storage.sql
      .exec<{ role: MatchRole; side: PlayerSide | null }>(
        'SELECT role, side FROM session_players WHERE actor_key = ?',
        actorKey,
      )
      .toArray()[0]

    if (existing) {
      role = existing.role
      side = existing.side
      // Clear per-player reconnect deadline on reconnect
      const obligationId = `reconnect_${actorKey}`
      this.clearObligation(obligationId)
      this.ctx.storage.sql.exec(
        'UPDATE session_players SET connected = 1, disconnected_at = NULL, reconnect_deadline = NULL WHERE actor_key = ?',
        actorKey,
      )
    } else if (playersCount === 0) {
      role = 'player'
      side = 'X'
      this.hostAccountId = accountId
      this.ghiMeta('host_account_id', String(accountId))
      this.ctx.storage.sql.exec(
        'INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, ?, ?, 1, 1)',
        actorKey, accountId, ten, role, side,
      )
    } else if (playersCount === 1) {
      role = 'player'
      side = 'O'
      this.ctx.storage.sql.exec(
        'INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, ?, ?, 0, 1)',
        actorKey, accountId, ten, role, side,
      )
    } else {
      // Spectator Load Shedding: giới hạn tối đa 30 khán giả hoặc từ chối khi đang LOAD_SHED
      const currentSpectators = this.ctx.storage.sql
        .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'spectator' AND connected = 1")
        .toArray()[0]?.c ?? 0

      if (currentSpectators >= MAX_SPECTATORS_PER_MATCH || this.operationalState === 'LOAD_SHED') {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'spectator_capacity_reached',
            message: `Bàn chơi đã đạt giới hạn khán giả tối đa (${MAX_SPECTATORS_PER_MATCH} người).`,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Retry-After': '5' },
          },
        )
      }

      role = 'spectator'
      this.ctx.storage.sql.exec(
        "INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, 'spectator', NULL, 0, 1)",
        actorKey, accountId, ten,
      )
    }

    // Hibernation-compatible heartbeat: raw "ping" → raw "pong" via setWebSocketAutoResponse
    // This avoids waking the DO just to reply to heartbeats.
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))

    const nowConn = Date.now()
    const att: AttachmentKetNoi = {
      actorKey,
      accountId,
      name: ten,
      role,
      tokens: WS_RATE_LIMIT_BURST,
      lastTokenRefill: nowConn,
      lastEmoteAt: 0,
      emoteBurstCount: 0,
      invalidPacketCount: 0,
    }
    server.serializeAttachment(att)
    this.ctx.acceptWebSocket(server, [actorKey, 'role:' + role])

    server.send(JSON.stringify({ type: 'match.snapshot', snapshot: this.laySnapshot() }))
    void this.baoLobby()
    this.broadcast({
      type: 'match.player_joined',
      player: {
        accountId, actorKey, name: ten, role, side,
        connected: true, ready: role === 'player' && side === 'X', pingMs: 0, disconnectedAt: null,
      },
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  // ─── WebSocket Handlers ─────────────────────────────────────────────────────

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return

    // 1. Inbound application frame size protection (16 KiB)
    const msgLen = typeof message === 'string' ? message.length : message.byteLength
    if (msgLen > MAX_WS_FRAME_BYTES) {
      this.xuLyGoiLoi(ws, att, 'Gói tin vượt quá kích thước cho phép (tối đa 16 KiB).')
      return
    }

    // 2. Safe JSON parsing with early malformed rejection
    let raw: unknown
    try {
      raw = typeof message === 'string' ? JSON.parse(message) : null
    } catch {
      this.xuLyGoiLoi(ws, att, 'Dữ liệu JSON không hợp lệ.')
      return
    }

    if (!raw || typeof raw !== 'object' || !('type' in raw)) {
      this.xuLyGoiLoi(ws, att, 'Gói tin thiếu trường type hợp lệ.')
      return
    }
    const packet = raw as LenhMatchSession

    // Protocol ping/pong is exempt from gameplay action rate-limiting
    if (packet.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: packet.t, serverNow: Date.now() }))
      return
    }

    // 3. Per-socket token bucket rate limiter
    const now = Date.now()
    this.recentMessages.push(now)
    this.danhGiaOperationalState(now)

    const elapsedSec = Math.max(0, (now - att.lastTokenRefill) / 1000)
    att.tokens = Math.min(WS_RATE_LIMIT_BURST, att.tokens + elapsedSec * WS_RATE_LIMIT_TOKENS_PER_SEC)
    att.lastTokenRefill = now

    if (att.tokens < 1) {
      this.xuLyGoiLoi(ws, att, 'Tốc độ gửi tin vượt quá giới hạn cho phép.')
      return
    }
    att.tokens -= 1

    // Reset invalid packet counter on valid protocol dispatch
    att.invalidPacketCount = 0

    if (packet.type === 'match.ready') {
      if (att.role !== 'player' || this.status !== 'waiting') {
        this.xuLyGoiLoi(ws, att, 'Chỉ người chơi trong phòng đang chờ mới được sẵn sàng.')
        return
      }
      this.ctx.storage.sql.exec(
        'UPDATE session_players SET ready = ? WHERE actor_key = ?',
        packet.ready ? 1 : 0,
        att.actorKey,
      )
      ws.serializeAttachment(att)
      this.kiemTraBatDauTran()
      return
    }

    if (packet.type === 'match.move') {
      await this.xuLyNuocDi(att, packet, ws)
      ws.serializeAttachment(att)
      return
    }

    if (packet.type === 'match.surrender') {
      if (att.role !== 'player' || this.status !== 'playing') {
        this.xuLyGoiLoi(ws, att, 'Chỉ người chơi trong ván đang chơi mới được đầu hàng.')
        return
      }
      const playerRow = this.ctx.storage.sql
        .exec<{ side: PlayerSide }>('SELECT side FROM session_players WHERE actor_key = ?', att.actorKey)
        .toArray()[0]
      if (!playerRow || !playerRow.side) return
      const winnerSide: PlayerSide = playerRow.side === 'X' ? 'O' : 'X'
      ws.serializeAttachment(att)
      await this.ketThucTran(winnerSide, 'surrender')
      return
    }

    if (packet.type === 'match.rematch') {
      if (att.role !== 'player' || this.status !== 'ended') {
        this.xuLyGoiLoi(ws, att, 'Chỉ người chơi sau khi kết thúc ván mới được yêu cầu đấu lại.')
        return
      }
      this.ctx.storage.sql.exec('UPDATE session_players SET ready = 1 WHERE actor_key = ?', att.actorKey)
      const allReady = this.ctx.storage.sql
        .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'player' AND ready = 1")
        .toArray()[0]?.c === 2

      ws.serializeAttachment(att)
      if (allReady) {
        await this.batDauVongMoi()
      }
      return
    }

    if (packet.type === 'match.emote') {
      // Load-shedding degradation: suppress non-essential emotes under stress
      if (this.operationalState !== 'NORMAL') {
        ws.serializeAttachment(att)
        return
      }

      // Emote cooldown check
      if (now - att.lastEmoteAt < EMOTE_COOLDOWN_MS) {
        if (att.emoteBurstCount >= EMOTE_BURST_MAX) {
          // Throttled emote spam silently dropped
          ws.serializeAttachment(att)
          return
        }
        att.emoteBurstCount++
      } else {
        att.lastEmoteAt = now
        att.emoteBurstCount = 1
      }

      this.broadcast({
        type: 'match.emote',
        sender: att.name,
        emote: packet.emote.slice(0, 50),
      })
      ws.serializeAttachment(att)
      return
    }

    ws.serializeAttachment(att)
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return

    const now = Date.now()
    const reconnectDeadline = now + RECONNECT_GRACE_MS

    this.ctx.storage.sql.exec(
      'UPDATE session_players SET connected = 0, disconnected_at = ?, reconnect_deadline = ? WHERE actor_key = ?',
      now,
      reconnectDeadline,
      att.actorKey,
    )

    this.broadcast({
      type: 'match.player_status',
      actorKey: att.actorKey,
      connected: false,
      reconnectGraceSeconds: Math.ceil(RECONNECT_GRACE_MS / 1000),
    })

    // Per-player durable reconnect obligation (never shared between players)
    if (att.role === 'player' && this.status === 'playing') {
      this.persistObligation(`reconnect_${att.actorKey}`, 'reconnect_grace', reconnectDeadline, { actorKey: att.actorKey })
    }

    const remainingOpen = this.ctx.getWebSockets().filter((w) => w !== ws && w.readyState === WebSocket.OPEN)
    if (remainingOpen.length === 0) {
      this.persistObligation('cleanup', 'cleanup', now + CLEANUP_DELAY_MS)
      void this.baoLobbyRong()
    }
    this.danhGiaOperationalState(now)
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws, 1006, 'WebSocket error')
  }

  // ─── Game Logic ─────────────────────────────────────────────────────────────

  private kiemTraBatDauTran(): void {
    const players = this.ctx.storage.sql
      .exec<{ side: PlayerSide; ready: number }>("SELECT side, ready FROM session_players WHERE role = 'player'")
      .toArray()

    if (players.length === 2 && players.every((p) => p.ready === 1)) {
      const now = Date.now()
      this.status = 'countdown'
      this.ghiMeta('status', 'countdown')

      const countdownDeadline = now + COUNTDOWN_MS
      this.broadcast({
        type: 'match.countdown',
        seconds: COUNTDOWN_MS / 1000,
        startsAt: countdownDeadline,
      })

      // Durable countdown: alarm-based, survives hibernation
      this.persistObligation('countdown_end', 'countdown_end', countdownDeadline)
    }
  }

  /** Starts a new round (initial or rematch) with a fresh round identity. */
  private async batDauVongMoi(): Promise<void> {
    const now = Date.now()
    this.roundSeq++
    // Round 1 uses matchId directly (backward-compatible with legacy test queries).
    // Subsequent rounds (rematch) use matchId:rN to prevent PK collision.
    this.roundId = this.roundSeq === 1 ? this.matchId : `${this.matchId}:r${this.roundSeq}`
    this.roundStartedAt = now  // Authoritative server start time — never fabricated

    this.board = taoBanMoi(this.gameType)
    this.status = 'playing'
    this.winner = null
    this.endReason = null
    this.currentTurn = 'X'
    this.turnTimerEndsAt = now + this.turnTimerSeconds * 1000

    this.ghiMeta('status', 'playing')
    this.ghiMeta('board', JSON.stringify(this.board))
    this.ghiMeta('current_turn', 'X')
    this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))
    this.ghiMeta('winner', '')
    this.ghiMeta('end_reason', '')
    this.ghiMeta('round_seq', String(this.roundSeq))
    this.ghiMeta('round_id', this.roundId)
    this.ghiMeta('round_started_at', String(this.roundStartedAt))

    // Cancel previous turn timeout if any; set new one
    this.persistObligation('turn_timeout', 'turn_timeout', this.turnTimerEndsAt)

    this.broadcast({
      type: 'match.state',
      status: this.status,
      currentTurn: this.currentTurn,
      turnTimerEndsAt: this.turnTimerEndsAt,
      board: this.board,
      serverTime: now,
    })
    void this.baoLobby()
  }

  private async xuLyNuocDi(
    att: AttachmentKetNoi,
    packet: { x?: number; y?: number; action?: string; payload?: unknown },
    ws?: WebSocket,
  ): Promise<void> {
    if (this.status !== 'playing' || att.role !== 'player') {
      if (ws) this.xuLyGoiLoi(ws, att, 'Chỉ người chơi trong trận mới được gửi nước đi.')
      return
    }

    const playerRow = this.ctx.storage.sql
      .exec<{ side: PlayerSide }>('SELECT side FROM session_players WHERE actor_key = ?', att.actorKey)
      .toArray()[0]
    if (!playerRow || playerRow.side !== this.currentTurn) {
      if (ws) this.xuLyGoiLoi(ws, att, 'Chưa đến lượt đi của bạn.')
      return
    }

    const x = packet.x
    const y = packet.y
    if (x === undefined || y === undefined) {
      if (ws) this.xuLyGoiLoi(ws, att, 'Nước đi thiếu toạ độ x, y.')
      return
    }

    const H = this.board.length
    const W = this.board[0].length
    if (y < 0 || y >= H || x < 0 || x >= W) {
      if (ws) this.xuLyGoiLoi(ws, att, 'Toạ độ nước đi nằm ngoài bàn cờ.')
      return
    }

    const side = playerRow.side
    const now = Date.now()

    // Server-authoritative late-move rejection: if turn timer has expired, reject the move
    if (this.turnTimerEndsAt > 0 && now > this.turnTimerEndsAt + 500) {
      // Move is too late — do not process; alarm will handle timeout
      return
    }

    if (this.gameType === 'caro_15') {
      if (this.board[y][x] !== null) return
      this.board[y][x] = side
      this.ctx.storage.sql.exec(
        'INSERT INTO session_moves (actor_key, side, x, y, created_at) VALUES (?, ?, ?, ?, ?)',
        att.actorKey, side, x, y, now,
      )
      const winLine = kiemTraThangCaro(this.board, x, y, side)
      if (winLine) { await this.ketThucTran(side, 'normal'); return }
      if (this.banCoKinh()) { await this.ketThucTran('draw', 'normal'); return }
    } else if (this.gameType === 'chess' || this.gameType === 'xiangqi') {
      this.ctx.storage.sql.exec(
        'INSERT INTO session_moves (actor_key, side, x, y, created_at) VALUES (?, ?, ?, ?, ?)',
        att.actorKey, side, x, y, now,
      )
    }

    // Normal turn switch
    this.currentTurn = side === 'X' ? 'O' : 'X'
    this.turnTimerEndsAt = now + this.turnTimerSeconds * 1000
    this.ghiMeta('board', JSON.stringify(this.board))
    this.ghiMeta('current_turn', this.currentTurn)
    this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))
    this.persistObligation('turn_timeout', 'turn_timeout', this.turnTimerEndsAt)
    this.broadcast({
      type: 'match.state', status: this.status, currentTurn: this.currentTurn,
      turnTimerEndsAt: this.turnTimerEndsAt, board: this.board,
      lastMove: { player: side, x, y }, serverTime: now,
    })
  }

  private banCoKinh(): boolean {
    for (const row of this.board) for (const cell of row) if (cell === null) return false
    return true
  }

  /**
   * Atomic match end sequence:
   * 1. Write final board + winner + end_reason to local SQLite (linearization point)
   * 2. Enqueue settlement outbox row
   * 3. Broadcast match.ended
   * 4. Attempt immediate D1 write
   * 5. Cancel turn timeout alarm
   * 6. Schedule cleanup alarm
   */
  private async ketThucTran(winner: PlayerSide | 'draw', reason: GameEndReason): Promise<void> {
    const now = Date.now()
    this.status = 'ended'
    this.winner = winner
    this.endReason = reason

    if (winner === 'X') this.scoreHost++
    else if (winner === 'O') this.scoreGuest++

    // If no round has been started yet (shouldn't happen, but safe guard)
    if (!this.roundId) {
      this.roundSeq = 1
      this.roundId = this.matchId
      this.roundStartedAt = now - 1000
      this.ghiMeta('round_id', this.roundId)
      this.ghiMeta('round_seq', '1')
    }

    // Atomic SQLite writes: Cloudflare DO automatically coalesces all synchronous
    // sql.exec calls in the same turn into one atomic transaction — no explicit
    // BEGIN/COMMIT needed (and sql.exec('BEGIN') is banned in workerd).
    this.ghiMeta('status', 'ended')
    this.ghiMeta('winner', winner)
    this.ghiMeta('end_reason', reason)
    this.ghiMeta('score_host', String(this.scoreHost))
    this.ghiMeta('score_guest', String(this.scoreGuest))
    this.ghiMeta('board', JSON.stringify(this.board))

    const players = this.ctx.storage.sql
      .exec<{ account_id: number; side: PlayerSide }>("SELECT account_id, side FROM session_players WHERE role = 'player'")
      .toArray()
    const host = players.find((p) => p.side === 'X')
    const guest = players.find((p) => p.side === 'O')
    const winnerAccountId = winner === 'X' ? (host?.account_id ?? null) : winner === 'O' ? (guest?.account_id ?? null) : null

    this.enqueueSettlement({
      roundId: this.roundId,
      matchRoomId: this.matchId,
      roundSeq: this.roundSeq,
      gameType: this.gameType,
      hostAccountId: host?.account_id ?? this.hostAccountId,
      guestAccountId: guest?.account_id ?? null,
      winnerAccountId,
      scoreHost: this.scoreHost,
      scoreGuest: this.scoreGuest,
      startedAt: this.roundStartedAt,
      endedAt: now,
      endReason: reason,
    })

    // Broadcast AFTER local commit — match.ended is linearized on outbox enqueue
    this.broadcast({
      type: 'match.ended',
      winner,
      endReason: reason,
      scoreHost: this.scoreHost,
      scoreGuest: this.scoreGuest,
    })

    // Cancel turn timeout since match ended
    this.clearObligation('turn_timeout')

    // Attempt immediate D1 settlement (outbox will retry on failure)
    await this.processSettlementOutbox(now)

    void this.baoLobbyRong()
    this.persistObligation('cleanup', 'cleanup', now + CLEANUP_DELAY_MS)
  }

  // ─── Snapshot & Broadcast ───────────────────────────────────────────────────

  private laySnapshot(): MatchStateSnapshot {
    const playersArr = this.ctx.storage.sql
      .exec<{
        actor_key: string
        account_id: number
        name: string
        role: MatchRole
        side: PlayerSide | null
        ready: number
        connected: number
        disconnected_at: number | null
      }>('SELECT * FROM session_players')
      .toArray()

    const players: Record<string, MatchPlayerInfo> = {}
    let spectatorCount = 0

    for (const p of playersArr) {
      if (p.role === 'spectator') spectatorCount++
      players[p.actor_key] = {
        accountId: p.account_id,
        actorKey: p.actor_key,
        name: p.name,
        role: p.role,
        side: p.side,
        connected: p.connected === 1,
        ready: p.ready === 1,
        pingMs: 0,
        disconnectedAt: p.disconnected_at,
      }
    }

    return {
      matchId: this.matchId,
      roundSeq: this.roundSeq || undefined,
      roundId: this.roundId || undefined,
      gameType: this.gameType,
      status: this.status,
      hostAccountId: this.hostAccountId,
      players,
      spectatorCount,
      currentTurn: this.currentTurn,
      turnTimerSeconds: this.turnTimerSeconds,
      turnTimerEndsAt: this.turnTimerEndsAt,
      winner: this.winner,
      endReason: this.endReason,
      serverTime: Date.now(),
      board: this.board,
    }
  }

  private broadcast(packet: GoiMatchSession, boQua?: WebSocket): void {
    const payload = JSON.stringify(packet)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== boQua && ws.readyState === WebSocket.OPEN) {
        try { ws.send(payload) } catch {}
      }
    }
  }

  private async baoLobby(): Promise<void> {
    try {
      const players = this.ctx.storage.sql
        .exec<{ name: string; side: PlayerSide }>("SELECT name, side FROM session_players WHERE role = 'player'")
        .toArray()
      const host = players.find((p) => p.side === 'X')
      const guest = players.find((p) => p.side === 'O')

      const roomData = {
        id: this.matchId,
        gameType: this.gameType,
        tenChu: host ? host.name : null,
        tenKhach: guest ? guest.name : null,
        trangThai: (this.status === 'playing' ? 'playing' : 'waiting') as 'playing' | 'waiting',
        soNguoiXem: this.ctx.getWebSockets().length,
        turnTimerSeconds: this.turnTimerSeconds,
        capNhatLuc: Date.now(),
      }

      // 1. Cập nhật phân vùng Lobby theo gameType
      const shardName = tenLobbyTheoLoai(this.gameType)
      const shardLobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(shardName))
      await shardLobby.capNhatBan(roomData)

      // 2. Cập nhật Lobby chung (nếu khác shardName) để tương thích ngược
      if (shardName !== TEN_GAME_LOBBY) {
        try {
          const globalLobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
          await globalLobby.capNhatBan(roomData)
        } catch {}
      }
    } catch (err) {
      console.warn('GameSessionDO: lỗi báo sảnh GameLobbyDO:', err)
    }
  }

  private async baoLobbyRong(): Promise<void> {
    try {
      const shardName = tenLobbyTheoLoai(this.gameType)
      const shardLobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(shardName))
      await shardLobby.xoaBan(this.matchId)

      if (shardName !== TEN_GAME_LOBBY) {
        try {
          const globalLobby = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
          await globalLobby.xoaBan(this.matchId)
        } catch {}
      }
    } catch (err) {
      console.warn('GameSessionDO: lỗi xoá bàn GameLobbyDO:', err)
    }
  }

  // ─── Overload & Abusive Packet Handling ─────────────────────────────────────

  private xuLyGoiLoi(ws: WebSocket, att: AttachmentKetNoi, lyDo: string): void {
    const now = Date.now()
    this.recentInvalidMessages.push(now)
    this.danhGiaOperationalState(now)

    att.invalidPacketCount++
    if (att.invalidPacketCount >= MAX_CONSECUTIVE_INVALID_PACKETS) {
      try {
        ws.send(
          JSON.stringify({
            type: 'match.error',
            code: 'rate_limit_exceeded',
            message: 'Kết nối bị ngắt do vượt quá giới hạn gửi tin hoặc gửi gói tin lỗi liên tiếp.',
          }),
        )
        ws.close(4429, 'Rate/Policy violation')
      } catch {}
      return
    }

    try {
      ws.send(
        JSON.stringify({
          type: 'match.error',
          code: 'invalid_packet',
          message: lyDo,
        }),
      )
      ws.serializeAttachment(att)
    } catch {}
  }

  // ─── Local Operational State Evaluation & Hysteresis ─────────────────────────

  danhGiaOperationalState(now: number): void {
    if (now - this.lastStateEvaluationAt < 500) return
    this.lastStateEvaluationAt = now

    // Clean sliding window (last 5000ms)
    const cutoff = now - 5000
    this.recentMessages = this.recentMessages.filter((t) => t >= cutoff)
    this.recentInvalidMessages = this.recentInvalidMessages.filter((t) => t >= cutoff)

    const activeSockets = this.ctx.getWebSockets().filter((w) => w.readyState === WebSocket.OPEN).length
    const spectatorCount = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'spectator' AND connected = 1")
      .toArray()[0]?.c ?? 0
    const outboxDepth = this.getSettlementOutboxDepth()
    const msgRatePerSec = this.recentMessages.length / 5
    const invalidRatePerSec = this.recentInvalidMessages.length / 5

    const enterLoadShed =
      activeSockets >= LOAD_STATE_THRESHOLDS.LOAD_SHED_ENTER.activeSockets ||
      spectatorCount >= LOAD_STATE_THRESHOLDS.LOAD_SHED_ENTER.spectators ||
      msgRatePerSec >= LOAD_STATE_THRESHOLDS.LOAD_SHED_ENTER.msgRatePerSec ||
      outboxDepth >= LOAD_STATE_THRESHOLDS.LOAD_SHED_ENTER.outboxDepth ||
      invalidRatePerSec >= LOAD_STATE_THRESHOLDS.LOAD_SHED_ENTER.invalidRatePerSec

    const enterConservative =
      activeSockets >= LOAD_STATE_THRESHOLDS.CONSERVATIVE_ENTER.activeSockets ||
      spectatorCount >= LOAD_STATE_THRESHOLDS.CONSERVATIVE_ENTER.spectators ||
      msgRatePerSec >= LOAD_STATE_THRESHOLDS.CONSERVATIVE_ENTER.msgRatePerSec ||
      outboxDepth >= LOAD_STATE_THRESHOLDS.CONSERVATIVE_ENTER.outboxDepth ||
      invalidRatePerSec >= LOAD_STATE_THRESHOLDS.CONSERVATIVE_ENTER.invalidRatePerSec

    const exitLoadShed =
      activeSockets < LOAD_STATE_THRESHOLDS.LOAD_SHED_EXIT.activeSockets &&
      spectatorCount < LOAD_STATE_THRESHOLDS.LOAD_SHED_EXIT.spectators &&
      msgRatePerSec < LOAD_STATE_THRESHOLDS.LOAD_SHED_EXIT.msgRatePerSec &&
      outboxDepth < LOAD_STATE_THRESHOLDS.LOAD_SHED_EXIT.outboxDepth &&
      invalidRatePerSec < LOAD_STATE_THRESHOLDS.LOAD_SHED_EXIT.invalidRatePerSec

    const exitConservative =
      activeSockets < LOAD_STATE_THRESHOLDS.CONSERVATIVE_EXIT.activeSockets &&
      spectatorCount < LOAD_STATE_THRESHOLDS.CONSERVATIVE_EXIT.spectators &&
      msgRatePerSec < LOAD_STATE_THRESHOLDS.CONSERVATIVE_EXIT.msgRatePerSec &&
      outboxDepth < LOAD_STATE_THRESHOLDS.CONSERVATIVE_EXIT.outboxDepth &&
      invalidRatePerSec < LOAD_STATE_THRESHOLDS.CONSERVATIVE_EXIT.invalidRatePerSec

    const timeInState = now - this.lastStateTransitionAt
    let nextState: OperationalLoadState = this.operationalState

    if (this.operationalState === 'NORMAL') {
      if (enterLoadShed) {
        nextState = 'LOAD_SHED'
      } else if (enterConservative) {
        nextState = 'CONSERVATIVE'
      }
    } else if (this.operationalState === 'CONSERVATIVE') {
      if (enterLoadShed) {
        nextState = 'LOAD_SHED'
      } else if (exitConservative && timeInState >= LOAD_STATE_THRESHOLDS.MIN_STATE_DWELL_MS) {
        nextState = 'NORMAL'
      }
    } else if (this.operationalState === 'LOAD_SHED') {
      if (exitLoadShed && timeInState >= LOAD_STATE_THRESHOLDS.MIN_STATE_DWELL_MS) {
        nextState = 'CONSERVATIVE'
      }
    }

    if (nextState !== this.operationalState) {
      this.operationalState = nextState
      this.lastStateTransitionAt = now
    }
  }

  // ─── Test & Metrics Inspection API ──────────────────────────────────────────

  getOperationalMetrics(): {
    state: OperationalLoadState
    activeSockets: number
    spectators: number
    msgRatePerSec: number
    invalidRatePerSec: number
    outboxDepth: number
    lastStateTransitionAt: number
  } {
    const activeSockets = this.ctx.getWebSockets().filter((w) => w.readyState === WebSocket.OPEN).length
    const spectators = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'spectator' AND connected = 1")
      .toArray()[0]?.c ?? 0
    return {
      state: this.operationalState,
      activeSockets,
      spectators,
      msgRatePerSec: this.recentMessages.length / 5,
      invalidRatePerSec: this.recentInvalidMessages.length / 5,
      outboxDepth: this.getSettlementOutboxDepth(),
      lastStateTransitionAt: this.lastStateTransitionAt,
    }
  }

  getSettlementOutboxDepth(): number {
    return (
      this.ctx.storage.sql
        .exec<{ c: number }>('SELECT COUNT(*) as c FROM settlement_outbox WHERE settled = 0')
        .toArray()[0]?.c ?? 0
    )
  }

  setOperationalStateForTesting(state: OperationalLoadState): void {
    this.operationalState = state
  }

  getOperationalState(): OperationalLoadState {
    return this.operationalState
  }
}
