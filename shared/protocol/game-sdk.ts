import { z } from 'zod'
import type { GameType, PlayerSide } from './game'

export type GameEngineType = 'phaser' | 'canvas2d' | 'dom' | 'custom'

export type GameMode = 'solo' | '1v1' | 'multiplayer'

export type GameLifecycleEvent = 'init' | 'start' | 'pause' | 'resume' | 'end' | 'destroy'

export type GameEndReason =
  | 'normal'
  | 'game_over'
  | 'victory'
  | 'defeat'
  | 'surrender'
  | 'timeout'
  | 'disconnect'
  | 'aborted'

export type GameQualityLevel = 'low' | 'medium' | 'high'

export interface GameAudioSettings {
  master: number // 0.0 to 1.0
  sfx: number // 0.0 to 1.0
  bgm: number // 0.0 to 1.0
  muted: boolean
}

export interface GameViewportState {
  width: number
  height: number
  dpr: number
  isFullscreen: boolean
}

export interface GameUserIdentity {
  id: number
  username: string
  displayName: string
  role: string
  lopId: number | null
  avatarUrl?: string
}

export const MAX_INPUT_TRACE_EVENTS = 2000

// ─────────────────────────────────────────────────────────────────────────────
// Overload & Rate-Limiting Protocol Constants
// ─────────────────────────────────────────────────────────────────────────────
/** Maximum WebSocket inbound application frame payload (16 KiB). */
export const MAX_WS_FRAME_BYTES = 16_384

/** Rate limit tokens added per second per connection (normal gameplay). */
export const WS_RATE_LIMIT_TOKENS_PER_SEC = 20

/** Burst allowance for rapid valid turns or quick interactions. */
export const WS_RATE_LIMIT_BURST = 40

/** Emote cooldown to prevent UI/chat flooding (2 seconds). */
export const EMOTE_COOLDOWN_MS = 2_000

/** Max burst emotes allowed before cooldown forces dropping. */
export const EMOTE_BURST_MAX = 2

/** Max consecutive malformed/oversized packets before socket is closed (code 4429). */
export const MAX_CONSECUTIVE_INVALID_PACKETS = 5

/** Configurable per-match spectator ceiling for load shedding. */
export const MAX_SPECTATORS_PER_MATCH = 30

/** Operational states for local overload degradation. */
export type OperationalLoadState = 'NORMAL' | 'CONSERVATIVE' | 'LOAD_SHED'

/**
 * ARCHITECTURAL CONTRACT: NO NETWORK-PER-FRAME
 *
 * 1. Turn-based games (caro_15, caro_9, connect4, reversi):
 *    Emits network packets STRICTLY on user action/move. Zero messages when idle.
 * 2. Future realtime games (solo/multiplayer physics, snake, arcade):
 *    - Client rendering runs locally at 60 FPS (requestAnimationFrame).
 *    - Server authoritative simulation runs at lower fixed tick rate (10-20 Hz).
 *    - Client network input vectors are sampled at fixed tick rate (<= 20 Hz),
 *      NEVER 60 messages/sec/player.
 *    - State interpolation/extrapolation runs on the client.
 */

export const GameInputPayloadSchema = z
  .union([
    z.string().max(128),
    z.number().finite(),
    z.boolean(),
    z.record(z.string().max(32), z.union([z.string().max(64), z.number().finite(), z.boolean()])),
  ])
  .optional()

export const GameInputEventSchema = z.object({
  t: z.number().int().nonnegative(),
  k: z.string().min(1).max(32),
  p: GameInputPayloadSchema,
})
export type GameInputEvent = z.infer<typeof GameInputEventSchema>

export interface SoloGameVerifierResult {
  valid: boolean
  computedScore: number
  verificationHash: string
  reason?: string
  terminalReason?: string
}

export interface SoloGameVerifier {
  gameType: string
  verify(input: {
    seed: number
    serverStartedAt: number
    serverEndedAt: number
    inputTrace: readonly GameInputEvent[]
  }): Promise<SoloGameVerifierResult>
}

// ─────────────────────────────────────────────────────────────────────────────
// Solo Session API Schemas (Anti-Cheat & Verification)
// ─────────────────────────────────────────────────────────────────────────────

export const SoloSessionStartRequest = z.object({
  gameType: z.string().min(1).max(50),
  clientMetadata: z
    .object({
      engine: z.string().optional(),
      viewport: z
        .object({
          width: z.number().positive(),
          height: z.number().positive(),
          dpr: z.number().positive(),
        })
        .optional(),
      platform: z.string().optional(),
    })
    .optional(),
})
export type SoloSessionStartRequest = z.infer<typeof SoloSessionStartRequest>

export const SoloSessionStartResponse = z.object({
  ok: z.boolean(),
  sessionId: z.string(),
  seed: z.number(),
  serverTime: z.number(),
  error: z.string().optional(),
})
export type SoloSessionStartResponse = z.infer<typeof SoloSessionStartResponse>

export const SoloSessionFinishRequest = z.object({
  sessionId: z.string().uuid(),
  score: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
  inputTrace: z.array(GameInputEventSchema).max(MAX_INPUT_TRACE_EVENTS),
  clientHash: z.string().max(128).optional(),
})
export type SoloSessionFinishRequest = z.infer<typeof SoloSessionFinishRequest>

export const SoloSessionFinishResponse = z.object({
  ok: z.boolean(),
  verified: z.boolean(),
  finalScore: z.number(),
  verificationHash: z.string().optional(),
  reason: z.string().optional(),
  rank: z.number().optional(),
  xpAwarded: z.number().optional(),
  error: z.string().optional(),
})
export type SoloSessionFinishResponse = z.infer<typeof SoloSessionFinishResponse>

// ─────────────────────────────────────────────────────────────────────────────
// Multiplayer GameSessionDO Protocol
// ─────────────────────────────────────────────────────────────────────────────

export type MatchRole = 'player' | 'spectator'

export interface MatchPlayerInfo {
  accountId: number
  actorKey: string
  name: string
  role: MatchRole
  side: PlayerSide | null
  connected: boolean
  ready: boolean
  pingMs: number
  disconnectedAt: number | null
}

export interface MatchStateSnapshot {
  matchId: string
  roundSeq?: number
  roundId?: string
  gameType: GameType | string
  status: 'waiting' | 'countdown' | 'playing' | 'ended'
  hostAccountId: number
  players: Record<string, MatchPlayerInfo>
  spectatorCount: number
  currentTurn: PlayerSide | null
  turnTimerSeconds: number
  turnTimerEndsAt: number
  winner: PlayerSide | 'draw' | null
  endReason: GameEndReason | null
  serverTime: number
  board?: unknown
}

export const LenhMatchSession = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({ type: z.literal('match.join'), side: z.enum(['X', 'O']).optional() }),
  z.object({ type: z.literal('match.ready'), ready: z.boolean() }),
  z.object({
    type: z.literal('match.move'),
    x: z.number().int().nonnegative().optional(),
    y: z.number().int().nonnegative().optional(),
    action: z.string().optional(),
    payload: z.unknown().optional(),
  }),
  z.object({ type: z.literal('match.surrender') }),
  z.object({ type: z.literal('match.rematch') }),
  z.object({ type: z.literal('match.emote'), emote: z.string().max(50) }),
])
export type LenhMatchSession = z.infer<typeof LenhMatchSession>

export type GoiMatchSession =
  | {
      type: 'match.snapshot'
      snapshot: MatchStateSnapshot
    }
  | {
      type: 'match.state'
      status: MatchStateSnapshot['status']
      currentTurn: PlayerSide | null
      turnTimerEndsAt: number
      board?: unknown
      lastMove?: unknown
      serverTime: number
    }
  | {
      type: 'match.countdown'
      seconds: number
      startsAt: number
    }
  | {
      type: 'match.player_joined'
      player: MatchPlayerInfo
    }
  | {
      type: 'match.player_left'
      actorKey: string
      name: string
    }
  | {
      type: 'match.player_status'
      actorKey: string
      connected: boolean
      reconnectGraceSeconds?: number
    }
  | {
      type: 'match.ended'
      winner: PlayerSide | 'draw' | null
      endReason: GameEndReason
      scoreHost: number
      scoreGuest: number
    }
  | {
      type: 'match.emote'
      sender: string
      emote: string
    }
  | { type: 'pong'; t: number; serverNow: number }
  | { type: 'error'; message: string; code?: string }
  | { type: 'match.error'; code: string; message: string }

// ─────────────────────────────────────────────────────────────────────────────
// LobbyDO Partitioned Event Protocol
// ─────────────────────────────────────────────────────────────────────────────

export type LobbyEventType =
  | 'room_created'
  | 'player_joined'
  | 'match_started'
  | 'match_ended'
  | 'room_closed'
  | 'spectator_count_sample'

export interface GoiLobbyEvent {
  type: 'lobby.event'
  event: LobbyEventType
  ban: unknown
  serverTime: number
}

export interface GoiLobbySnapshot {
  type: 'lobby.snapshot'
  gameType?: string
  rooms: unknown[]
  serverTime: number
}

export type GoiLobbySession = GoiLobbyEvent | GoiLobbySnapshot | { type: 'pong'; t: number; serverNow: number }
