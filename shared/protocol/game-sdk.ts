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

export interface GameInputEvent {
  t: number // Milliseconds since session start
  k: string // Input key / action code ('up', 'down', 'move', etc.)
  p?: unknown // Optional parameters (coordinates, angle, etc.)
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
  inputTrace: z.array(
    z.object({
      t: z.number().int().nonnegative(),
      k: z.string().min(1).max(32),
      p: z.unknown().optional(),
    }),
  ),
  clientHash: z.string().max(128).optional(),
})
export type SoloSessionFinishRequest = z.infer<typeof SoloSessionFinishRequest>

export const SoloSessionFinishResponse = z.object({
  ok: z.boolean(),
  verified: z.boolean(),
  finalScore: z.number(),
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
