import { z } from 'zod'

export type GameType =
  | 'caro_15'
  | 'caro_9'
  | 'connect4'
  | 'reversi'
  | 'solo_2048'
  | 'solo_memory'
  | 'solo_snake'

export type PlayerSide = 'X' | 'O'
export type GameStatus = 'waiting' | 'playing' | 'ended'
export type BoardCell = PlayerSide | null

export interface GameMetaState {
  gameType: GameType
  playerX: string | null
  playerXName: string | null
  playerO: string | null
  playerOName: string | null
  currentTurn: PlayerSide
  status: GameStatus
  winner: PlayerSide | 'draw' | null
  winLine: [number, number][] | null
  turnTimerSeconds: number
  turnTimerEndsAt: number
  scoreX: number
  scoreO: number
}

export const LenhGame = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({
    type: z.literal('game.init'),
    gameType: z.enum(['caro_15', 'caro_9', 'connect4', 'reversi', 'solo_2048', 'solo_memory', 'solo_snake']),
    turnSeconds: z.number().int().min(10).max(120).optional(),
  }),
  z.object({
    type: z.literal('game.join'),
    side: z.enum(['X', 'O']).optional(),
  }),
  z.object({
    type: z.literal('game.move'),
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('game.surrender') }),
  z.object({ type: z.literal('game.rematch') }),
  z.object({ type: z.literal('game.emote'), emote: z.string().max(50) }),
])
export type LenhGame = z.infer<typeof LenhGame>

export type GoiGame =
  | {
      type: 'game.snapshot'
      meta: GameMetaState
      board: BoardCell[][]
      spectators: number
      serverNow: number
    }
  | {
      type: 'game.sync'
      meta: GameMetaState
      board: BoardCell[][]
      lastMove?: { player: PlayerSide; x: number; y: number }
      serverNow: number
    }
  | {
      type: 'game.emote'
      sender: string
      emote: string
    }
  | { type: 'pong'; t: number; serverNow: number }
  | { type: 'error'; message: string }
