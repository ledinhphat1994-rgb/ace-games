import { DurableObject } from 'cloudflare:workers'
import type {
  GameEndReason,
  GoiMatchSession,
  LenhMatchSession,
  MatchPlayerInfo,
  MatchRole,
  MatchStateSnapshot,
} from '../../shared/protocol/game-sdk'
import type { BoardCell, GameType, PlayerSide } from '../../shared/protocol/game'
import {
  coNuocDiHopLeReversi,
  demQuanReversi,
  kiemTraThangCaro,
  kiemTraThangConnect4,
  kiemTraVaLatReversi,
  taoBanMoi,
} from '../game-engine'
import { TEN_GAME_LOBBY } from './game-lobby-do'

export const TEN_GAME_SESSION_PREFIX = 'match:'
const RECONNECT_GRACE_MS = 30_000
const CLEANUP_ALARM_MS = 120_000

interface AttachmentKetNoi {
  actorKey: string
  accountId: number
  name: string
  role: MatchRole
}

export class GameSessionDO extends DurableObject<Env> {
  private matchId: string = ''
  private gameType: GameType = 'caro_15'
  private status: MatchStateSnapshot['status'] = 'waiting'
  private hostAccountId: number = 0
  private currentTurn: PlayerSide | null = null
  private turnTimerSeconds: number = 30
  private turnTimerEndsAt: number = 0
  private winner: PlayerSide | 'draw' | null = null
  private endReason: GameEndReason | null = null
  private scoreHost: number = 0
  private scoreGuest: number = 0
  private board: BoardCell[][] = []
  private countdownStartsAt: number = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.khoiTaoSql()
    this.napTrangThaiTuSql()
  }

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
        disconnected_at INTEGER
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

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Khởi tạo match qua RPC HTTP nếu cần
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

    // WebSocket Admission
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

    // Xác định vai trò: nếu chưa có player, người tạo bàn là player1, người thứ 2 là player2, còn lại là spectator
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
      // Cập nhật kết nối lại
      this.ctx.storage.sql.exec(
        'UPDATE session_players SET connected = 1, disconnected_at = NULL WHERE actor_key = ?',
        actorKey,
      )
    } else if (playersCount === 0) {
      role = 'player'
      side = 'X'
      this.hostAccountId = accountId
      this.ghiMeta('host_account_id', String(accountId))
      this.ctx.storage.sql.exec(
        'INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, ?, ?, 1, 1)',
        actorKey,
        accountId,
        ten,
        role,
        side,
      )
    } else if (playersCount === 1) {
      role = 'player'
      side = 'O'
      this.ctx.storage.sql.exec(
        'INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, ?, ?, 0, 1)',
        actorKey,
        accountId,
        ten,
        role,
        side,
      )
    } else {
      role = 'spectator'
      this.ctx.storage.sql.exec(
        'INSERT INTO session_players (actor_key, account_id, name, role, side, ready, connected) VALUES (?, ?, ?, ?, NULL, 0, 1)',
        actorKey,
        accountId,
        ten,
        role,
      )
    }

    const att: AttachmentKetNoi = { actorKey, accountId, name: ten, role }
    server.serializeAttachment(att)
    this.ctx.acceptWebSocket(server, [actorKey, 'role:' + role])

    // Gửi snapshot tức thì
    server.send(JSON.stringify({ type: 'match.snapshot', snapshot: this.laySnapshot() }))

    // Báo sảnh GameLobbyDO cập nhật trạng thái
    void this.baoLobby()

    // Broadcast sự kiện tham gia
    this.broadcast({
      type: 'match.player_joined',
      player: {
        accountId,
        actorKey,
        name: ten,
        role,
        side,
        connected: true,
        ready: role === 'player' && side === 'X',
        pingMs: 0,
        disconnectedAt: null,
      },
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return

    let raw: unknown
    try {
      raw = typeof message === 'string' ? JSON.parse(message) : null
    } catch {
      return
    }

    if (!raw || typeof raw !== 'object' || !('type' in raw)) return
    const packet = raw as LenhMatchSession

    if (packet.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong', t: packet.t, serverNow: Date.now() }))
      return
    }

    if (packet.type === 'match.ready') {
      if (att.role !== 'player' || this.status !== 'waiting') return
      this.ctx.storage.sql.exec(
        'UPDATE session_players SET ready = ? WHERE actor_key = ?',
        packet.ready ? 1 : 0,
        att.actorKey,
      )
      this.kiemTraBatDauTran()
      return
    }

    if (packet.type === 'match.move') {
      await this.xuLyNuocDi(att, packet)
      return
    }

    if (packet.type === 'match.surrender') {
      if (att.role !== 'player' || this.status !== 'playing') return
      const playerRow = this.ctx.storage.sql
        .exec<{ side: PlayerSide }>('SELECT side FROM session_players WHERE actor_key = ?', att.actorKey)
        .toArray()[0]
      if (!playerRow || !playerRow.side) return

      const winnerSide: PlayerSide = playerRow.side === 'X' ? 'O' : 'X'
      await this.ketThucTran(winnerSide, 'surrender')
      return
    }

    if (packet.type === 'match.rematch') {
      if (att.role !== 'player' || this.status !== 'ended') return
      this.ctx.storage.sql.exec('UPDATE session_players SET ready = 1 WHERE actor_key = ?', att.actorKey)
      const allReady = this.ctx.storage.sql
        .exec<{ c: number }>("SELECT COUNT(*) as c FROM session_players WHERE role = 'player' AND ready = 1")
        .toArray()[0]?.c === 2

      if (allReady) {
        this.board = taoBanMoi(this.gameType)
        this.status = 'playing'
        this.winner = null
        this.endReason = null
        this.currentTurn = 'X'
        this.turnTimerEndsAt = Date.now() + this.turnTimerSeconds * 1000

        this.ghiMeta('status', this.status)
        this.ghiMeta('board', JSON.stringify(this.board))
        this.ghiMeta('current_turn', 'X')
        this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))
        this.ghiMeta('winner', '')
        this.ghiMeta('end_reason', '')

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
      return
    }

    if (packet.type === 'match.emote') {
      this.broadcast({
        type: 'match.emote',
        sender: att.name,
        emote: packet.emote.slice(0, 50),
      })
    }
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
    const att = ws.deserializeAttachment() as AttachmentKetNoi | null
    if (!att) return

    // Cập nhật trạng thái ngắt kết nối
    const now = Date.now()
    this.ctx.storage.sql.exec(
      'UPDATE session_players SET connected = 0, disconnected_at = ? WHERE actor_key = ?',
      now,
      att.actorKey,
    )

    this.broadcast({
      type: 'match.player_status',
      actorKey: att.actorKey,
      connected: false,
      reconnectGraceSeconds: Math.ceil(RECONNECT_GRACE_MS / 1000),
    })

    // Nếu là player khi đang chơi, kích hoạt đếm ngược 30s xử thua
    if (att.role === 'player' && this.status === 'playing') {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
      this.reconnectTimer = setTimeout(() => {
        void this.xuLyQuaHanKetNoiLai(att.actorKey)
      }, RECONNECT_GRACE_MS)
    }

    // Kiểm tra xem phòng có trống hoàn toàn không
    const remainingOpen = this.ctx.getWebSockets().filter((w) => w !== ws && w.readyState === WebSocket.OPEN)
    if (remainingOpen.length === 0) {
      // Đặt alarm dọn dẹp sau 2 phút nếu không ai vào lại
      await this.ctx.storage.setAlarm(Date.now() + CLEANUP_ALARM_MS)
      void this.baoLobbyRong()
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws, 1006, 'WebSocket error')
  }

  async alarm(): Promise<void> {
    // Dọn dẹp trận đấu khi kết thúc hoặc bỏ hoang
    const activeSockets = this.ctx.getWebSockets().filter((w) => w.readyState === WebSocket.OPEN)
    if (activeSockets.length === 0 && (this.status === 'ended' || this.status === 'waiting')) {
      await this.baoLobbyRong()
      this.ctx.storage.sql.exec('DELETE FROM session_meta')
      this.ctx.storage.sql.exec('DELETE FROM session_players')
      this.ctx.storage.sql.exec('DELETE FROM session_moves')
    }
  }

  private async xuLyNuocDi(att: AttachmentKetNoi, packet: { x?: number; y?: number; action?: string; payload?: unknown }): Promise<void> {
    if (this.status !== 'playing' || att.role !== 'player') return

    const playerRow = this.ctx.storage.sql
      .exec<{ side: PlayerSide }>('SELECT side FROM session_players WHERE actor_key = ?', att.actorKey)
      .toArray()[0]
    if (!playerRow || playerRow.side !== this.currentTurn) return

    const x = packet.x
    const y = packet.y
    if (x === undefined || y === undefined) return

    const H = this.board.length
    const W = this.board[0].length
    if (y < 0 || y >= H || x < 0 || x >= W) return

    const side = playerRow.side

    // Logic kiểm tra theo từng loại trò chơi
    if (this.gameType === 'caro_15' || this.gameType === 'caro_9') {
      if (this.board[y][x] !== null) return
      this.board[y][x] = side

      this.ctx.storage.sql.exec(
        'INSERT INTO session_moves (actor_key, side, x, y, created_at) VALUES (?, ?, ?, ?, ?)',
        att.actorKey,
        side,
        x,
        y,
        Date.now(),
      )

      const winLine = kiemTraThangCaro(this.board, x, y, side)
      if (winLine) {
        await this.ketThucTran(side, 'normal')
        return
      }

      // Kiểm tra hòa
      if (this.banCoKinh()) {
        await this.ketThucTran('draw', 'normal')
        return
      }
    } else if (this.gameType === 'connect4') {
      // Connect 4: thả quân rơi xuống đáy cột x
      let droppedY = -1
      for (let r = H - 1; r >= 0; r--) {
        if (this.board[r][x] === null) {
          droppedY = r
          break
        }
      }
      if (droppedY === -1) return // Cột đã đầy
      this.board[droppedY][x] = side

      this.ctx.storage.sql.exec(
        'INSERT INTO session_moves (actor_key, side, x, y, created_at) VALUES (?, ?, ?, ?, ?)',
        att.actorKey,
        side,
        x,
        droppedY,
        Date.now(),
      )

      const winLine = kiemTraThangConnect4(this.board, x, droppedY, side)
      if (winLine) {
        await this.ketThucTran(side, 'normal')
        return
      }

      if (this.banCoKinh()) {
        await this.ketThucTran('draw', 'normal')
        return
      }
    } else if (this.gameType === 'reversi') {
      const { hopLe, flipped } = kiemTraVaLatReversi(this.board, x, y, side)
      if (!hopLe) return

      this.board[y][x] = side
      for (const [fx, fy] of flipped) {
        this.board[fy][fx] = side
      }

      this.ctx.storage.sql.exec(
        'INSERT INTO session_moves (actor_key, side, x, y, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        att.actorKey,
        side,
        x,
        y,
        JSON.stringify(flipped),
        Date.now(),
      )

      const nextSide: PlayerSide = side === 'X' ? 'O' : 'X'
      const oppHasMove = coNuocDiHopLeReversi(this.board, nextSide)
      const myHasMove = coNuocDiHopLeReversi(this.board, side)

      if (!oppHasMove && !myHasMove) {
        // Hết nước đi cả 2 bên -> đếm quân phân định thắng bại
        const { scoreX, scoreO } = demQuanReversi(this.board)
        let winResult: PlayerSide | 'draw' = 'draw'
        if (scoreX > scoreO) winResult = 'X'
        else if (scoreO > scoreX) winResult = 'O'
        await this.ketThucTran(winResult, 'normal')
        return
      }

      // Nếu đối thủ không có nước đi, lượt vẫn thuộc về người hiện tại
      if (!oppHasMove) {
        this.currentTurn = side
      } else {
        this.currentTurn = nextSide
      }

      this.turnTimerEndsAt = Date.now() + this.turnTimerSeconds * 1000
      this.ghiMeta('board', JSON.stringify(this.board))
      this.ghiMeta('current_turn', this.currentTurn)
      this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))

      this.broadcast({
        type: 'match.state',
        status: this.status,
        currentTurn: this.currentTurn,
        turnTimerEndsAt: this.turnTimerEndsAt,
        board: this.board,
        lastMove: { player: side, x, y },
        serverTime: Date.now(),
      })
      return
    }

    // Đổi lượt bình thường
    this.currentTurn = side === 'X' ? 'O' : 'X'
    this.turnTimerEndsAt = Date.now() + this.turnTimerSeconds * 1000
    this.ghiMeta('board', JSON.stringify(this.board))
    this.ghiMeta('current_turn', this.currentTurn)
    this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))

    this.broadcast({
      type: 'match.state',
      status: this.status,
      currentTurn: this.currentTurn,
      turnTimerEndsAt: this.turnTimerEndsAt,
      board: this.board,
      lastMove: { player: side, x, y },
      serverTime: Date.now(),
    })
  }

  private banCoKinh(): boolean {
    for (const row of this.board) {
      for (const cell of row) {
        if (cell === null) return false
      }
    }
    return true
  }

  private kiemTraBatDauTran(): void {
    const players = this.ctx.storage.sql
      .exec<{ side: PlayerSide; ready: number }>("SELECT side, ready FROM session_players WHERE role = 'player'")
      .toArray()

    if (players.length === 2 && players.every((p) => p.ready === 1)) {
      this.status = 'countdown'
      this.countdownStartsAt = Date.now() + 3000
      this.ghiMeta('status', 'countdown')

      this.broadcast({
        type: 'match.countdown',
        seconds: 3,
        startsAt: this.countdownStartsAt,
      })

      setTimeout(() => {
        if (this.status === 'countdown') {
          this.status = 'playing'
          this.currentTurn = 'X'
          this.turnTimerEndsAt = Date.now() + this.turnTimerSeconds * 1000
          this.ghiMeta('status', 'playing')
          this.ghiMeta('current_turn', 'X')
          this.ghiMeta('turn_timer_ends_at', String(this.turnTimerEndsAt))

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
      }, 3000)
    }
  }

  private async xuLyQuaHanKetNoiLai(actorKey: string): Promise<void> {
    if (this.status !== 'playing') return
    const p = this.ctx.storage.sql
      .exec<{ side: PlayerSide; connected: number }>(
        'SELECT side, connected FROM session_players WHERE actor_key = ?',
        actorKey,
      )
      .toArray()[0]

    if (p && p.connected === 0 && p.side) {
      const winnerSide: PlayerSide = p.side === 'X' ? 'O' : 'X'
      await this.ketThucTran(winnerSide, 'disconnect')
    }
  }

  private async ketThucTran(winner: PlayerSide | 'draw', reason: GameEndReason): Promise<void> {
    this.status = 'ended'
    this.winner = winner
    this.endReason = reason

    if (winner === 'X') this.scoreHost++
    else if (winner === 'O') this.scoreGuest++

    this.ghiMeta('status', 'ended')
    this.ghiMeta('winner', winner)
    this.ghiMeta('end_reason', reason)
    this.ghiMeta('score_host', String(this.scoreHost))
    this.ghiMeta('score_guest', String(this.scoreGuest))

    this.broadcast({
      type: 'match.ended',
      winner,
      endReason: reason,
      scoreHost: this.scoreHost,
      scoreGuest: this.scoreGuest,
    })

    // Lưu kết quả vào D1 game_matches & gỡ khỏi sảnh GameLobbyDO
    await this.luuKetQuaVaoD1(winner, reason)
    void this.baoLobbyRong()

    // Lập lịch dọn dẹp sau 2 phút nếu không rematch
    await this.ctx.storage.setAlarm(Date.now() + CLEANUP_ALARM_MS)
  }

  private async luuKetQuaVaoD1(winner: PlayerSide | 'draw', reason: GameEndReason): Promise<void> {
    try {
      const players = this.ctx.storage.sql
        .exec<{ account_id: number; side: PlayerSide }>(
          "SELECT account_id, side FROM session_players WHERE role = 'player'",
        )
        .toArray()

      const host = players.find((p) => p.side === 'X')
      const guest = players.find((p) => p.side === 'O')
      if (!host) return

      let winnerAccountId: number | null = null
      if (winner === 'X') winnerAccountId = host.account_id
      else if (winner === 'O' && guest) winnerAccountId = guest.account_id

      const idempotencyKey = `match:${this.matchId}:seq:${this.scoreHost + this.scoreGuest}`

      await this.env.DB.prepare(`
        INSERT INTO game_matches (
          id, game_type, mode, host_account_id, guest_account_id,
          winner_account_id, status, score_host, score_guest,
          started_at, ended_at, end_reason, idempotency_key, created_at
        ) VALUES (?1, ?2, '1v1', ?3, ?4, ?5, 'ended', ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ON CONFLICT(idempotency_key) DO NOTHING
      `).bind(
        this.matchId,
        this.gameType,
        host.account_id,
        guest ? guest.account_id : null,
        winnerAccountId,
        this.scoreHost,
        this.scoreGuest,
        Date.now() - 60000,
        Date.now(),
        reason,
        idempotencyKey,
        Date.now(),
      ).run()
    } catch (err) {
      console.error('GameSessionDO: lỗi lưu ván đấu vào D1:', err)
    }
  }

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
        try {
          ws.send(payload)
        } catch {}
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

      const lobbyStub = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
      await lobbyStub.capNhatBan({
        id: this.matchId,
        gameType: this.gameType,
        tenChu: host ? host.name : null,
        tenKhach: guest ? guest.name : null,
        trangThai: this.status === 'playing' ? 'playing' : 'waiting',
        soNguoiXem: this.ctx.getWebSockets().length,
        turnTimerSeconds: this.turnTimerSeconds,
        capNhatLuc: Date.now(),
      })
    } catch (err) {
      console.warn('GameSessionDO: lỗi báo sảnh GameLobbyDO:', err)
    }
  }

  private async baoLobbyRong(): Promise<void> {
    try {
      const lobbyStub = this.env.GAME_LOBBY.get(this.env.GAME_LOBBY.idFromName(TEN_GAME_LOBBY))
      await lobbyStub.xoaBan(this.matchId)
    } catch (err) {
      console.warn('GameSessionDO: lỗi xoá bàn GameLobbyDO:', err)
    }
  }
}
