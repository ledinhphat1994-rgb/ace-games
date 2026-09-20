export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export type TerminalReason =
  | 'wall_collision'
  | 'self_collision'
  | 'victory'
  | 'aborted'
  | 'timeout'

export interface SnakeState {
  snake: Position[] // index 0 is head
  food: Position
  dir: Direction
  score: number
  foodsEaten: number
  isDead: boolean
  isVictory: boolean
  terminalReason: TerminalReason | null
  stepDurationMs: number
  tick: number
  elapsedMs: number
}

export interface SnakeConfig {
  readonly width: number
  readonly height: number
  readonly initialSnake: readonly Position[]
  readonly initialDir: Direction
  readonly initialStepMs: number
  readonly speedStepMs: number
  readonly minStepMs: number
  readonly foodScore: number
  readonly speedUpInterval: number // every N foods eaten, reduce step duration
}

export interface SnakeReplayResult {
  valid: boolean
  finalState: SnakeState
  computedScore: number
  foodsEaten: number
  totalTicks: number
  terminalReason: TerminalReason | null
  reason?: string
}
