import {
  DEFAULT_SNAKE_CONFIG,
  applySnakeDirection,
  createSnakeState,
  isOppositeDirection,
  isSnakeTerminal,
  stepSnake,
  type Direction,
  type SnakeConfig,
  type SnakeRng,
  type SnakeState,
} from '../../../../shared/games/snake'
import type { CampusGameSDK } from '../../../lib/game-sdk/campus-game-sdk'
import type { GameQualityLevel } from '../../../../shared/protocol/game-sdk'

export interface SnakeSceneConfig {
  seed: number
  sdk: CampusGameSDK
  onScoreUpdate: (score: number) => void
  onGameOver: (finalScore: number, reason: string) => void
  config?: SnakeConfig
}

export class SnakeScene {
  // Phaser Scene reference dynamically injected when Phaser loads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private scene: any
  private state: SnakeState
  private rng: SnakeRng
  private sdk: CampusGameSDK
  private config: SnakeConfig

  private onScoreUpdate: (score: number) => void
  private onGameOver: (finalScore: number, reason: string) => void

  // Procedural graphics objects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private graphics: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private particles: any = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timerEvent: any = null

  private cellSize = 24
  private boardPixelSize = 360 // 15 * 24 = 360
  private offsetX = 20
  private offsetY = 20

  private turnQueue: Direction[] = []
  private isDestroyed = false

  // Sound synthesis using Web Audio API via SDK volume settings
  private audioCtx: AudioContext | null = null

  constructor(sceneConfig: SnakeSceneConfig) {
    this.sdk = sceneConfig.sdk
    this.config = sceneConfig.config ?? DEFAULT_SNAKE_CONFIG
    this.onScoreUpdate = sceneConfig.onScoreUpdate
    this.onGameOver = sceneConfig.onGameOver

    const { state, rng } = createSnakeState(sceneConfig.seed, this.config)
    this.state = state
    this.rng = rng

    this.initAudio()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  init(scene: any): void {
    this.scene = scene
    this.isDestroyed = false

    this.resize(this.scene.cameras.main.width, this.scene.cameras.main.height)

    this.graphics = this.scene.add.graphics()

    // Setup input listeners
    this.setupInputs()

    // Start deterministic simulation loop
    this.startSimulationTimer()

    // Initial render
    this.render()
  }

  resize(width: number, height: number): void {
    const minDim = Math.min(width, height)
    this.cellSize = Math.max(1, Math.floor((minDim - 24) / Math.max(this.config.width, this.config.height)))
    this.boardPixelSize = this.cellSize * this.config.width
    this.offsetX = Math.floor((width - this.boardPixelSize) / 2)
    this.offsetY = Math.floor((height - this.cellSize * this.config.height) / 2)
  }

  update(): void {
    if (this.isDestroyed) return
    this.render()
  }

  queueTurn(dir: Direction): void {
    if (this.isDestroyed || isSnakeTerminal(this.state)) return
    const lastPlannedDir = this.turnQueue.length > 0
      ? this.turnQueue[this.turnQueue.length - 1]
      : this.state.dir

    // Disallow direct 180° turn and redundant duplicate inputs
    if (isOppositeDirection(lastPlannedDir, dir) || dir === lastPlannedDir) {
      return
    }

    if (this.turnQueue.length < 2) {
      this.turnQueue.push(dir)
    }
  }

  getState(): Readonly<SnakeState> {
    return this.state
  }

  private setupInputs(): void {
    if (!this.scene?.input?.keyboard) return

    this.scene.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.matches('input, textarea, select') || event.target.isContentEditable)) return
      let nextDir: Direction | null = null
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          nextDir = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          nextDir = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          nextDir = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          nextDir = 'right'
          break
      }

      if (nextDir) {
        event.preventDefault()
        this.queueTurn(nextDir)
      }
    })
  }

  private startSimulationTimer(): void {
    if (!this.scene?.time) return

    if (this.timerEvent) {
      this.timerEvent.destroy()
    }

    this.timerEvent = this.scene.time.addEvent({
      delay: this.state.stepDurationMs,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    })
  }

  private tick(): void {
    if (this.isDestroyed || isSnakeTerminal(this.state)) return

    // 1. Apply queued direction using shared deterministic rule
    while (this.turnQueue.length > 0) {
      const nextDir = this.turnQueue.shift()!
      if (applySnakeDirection(this.state, nextDir)) {
        // Record input at simulation elapsed time
        this.sdk.recordInputAt('snake.turn', nextDir, this.state.elapsedMs)
        break
      }
    }

    // 2. Step simulation
    const prevScore = this.state.score
    const prevStepMs = this.state.stepDurationMs

    stepSnake(this.state, this.rng, this.config)

    // 3. Check score increase (food eaten)
    if (this.state.score > prevScore) {
      this.onScoreUpdate(this.state.score)
      this.sdk.updateScore(this.state.score)
      this.playTone(587.33, 0.08) // D5 note for eating

      // Speed progression adjustment
      if (this.state.stepDurationMs !== prevStepMs) {
        this.playTone(880, 0.12) // A5 note for speed level up
        this.startSimulationTimer()
      }
    }

    // 4. Check terminal state
    if (isSnakeTerminal(this.state)) {
      if (this.timerEvent) {
        this.timerEvent.destroy()
        this.timerEvent = null
      }
      this.playTone(196, 0.3, 'sawtooth') // Low G3 tone for death
      this.onGameOver(this.state.score, this.state.terminalReason ?? 'game_over')
    }
  }

  private render(): void {
    if (!this.graphics || this.isDestroyed) return

    const quality: GameQualityLevel = this.sdk.getQualityLevel()
    this.graphics.clear()

    // 1. Draw Grid Background
    this.graphics.fillStyle(0x0a0f1d, 1)
    this.graphics.fillRect(this.offsetX, this.offsetY, this.boardPixelSize, this.boardPixelSize)

    // 2. Draw Grid Lines (subtle neon cyan)
    if (quality !== 'low') {
      this.graphics.lineStyle(1, 0x1e293b, 0.6)
      for (let i = 0; i <= this.config.width; i++) {
        const x = this.offsetX + i * this.cellSize
        this.graphics.beginPath()
        this.graphics.moveTo(x, this.offsetY)
        this.graphics.lineTo(x, this.offsetY + this.boardPixelSize)
        this.graphics.strokePath()
      }
      for (let j = 0; j <= this.config.height; j++) {
        const y = this.offsetY + j * this.cellSize
        this.graphics.beginPath()
        this.graphics.moveTo(this.offsetX, y)
        this.graphics.lineTo(this.offsetX + this.boardPixelSize, y)
        this.graphics.strokePath()
      }
    }

    // 3. Draw Food (pulsing neon amber/red orb)
    const fx = this.offsetX + this.state.food.x * this.cellSize + this.cellSize / 2
    const fy = this.offsetY + this.state.food.y * this.cellSize + this.cellSize / 2
    const radius = Math.floor(this.cellSize * 0.38)

    if (quality === 'high') {
      // Outer glow
      this.graphics.fillStyle(0xf43f5e, 0.25)
      this.graphics.fillCircle(fx, fy, radius + 4)
    }
    this.graphics.fillStyle(0xf43f5e, 1)
    this.graphics.fillCircle(fx, fy, radius)
    this.graphics.fillStyle(0xfecdd3, 0.8)
    this.graphics.fillCircle(fx - 2, fy - 2, Math.max(1, Math.floor(radius * 0.4)))

    // 4. Draw Snake Body
    for (let i = this.state.snake.length - 1; i >= 0; i--) {
      const seg = this.state.snake[i]
      const sx = this.offsetX + seg.x * this.cellSize + 1
      const sy = this.offsetY + seg.y * this.cellSize + 1
      const sSize = this.cellSize - 2

      if (i === 0) {
        // Head: Glowing Neon Emerald
        if (quality === 'high') {
          this.graphics.fillStyle(0x34d399, 0.3)
          this.graphics.fillRoundedRect(sx - 2, sy - 2, sSize + 4, sSize + 4, 6)
        }
        this.graphics.fillStyle(0x34d399, 1)
        this.graphics.fillRoundedRect(sx, sy, sSize, sSize, 4)

        // Eyes
        this.graphics.fillStyle(0x064e3b, 1)
        const eyeSize = Math.max(2, Math.floor(sSize * 0.2))
        const eyeOffset = Math.floor(sSize * 0.25)
        if (this.state.dir === 'up' || this.state.dir === 'down') {
          this.graphics.fillRect(sx + eyeOffset, sy + eyeOffset, eyeSize, eyeSize)
          this.graphics.fillRect(sx + sSize - eyeOffset - eyeSize, sy + eyeOffset, eyeSize, eyeSize)
        } else {
          this.graphics.fillRect(sx + eyeOffset, sy + eyeOffset, eyeSize, eyeSize)
          this.graphics.fillRect(sx + eyeOffset, sy + sSize - eyeOffset - eyeSize, eyeSize, eyeSize)
        }
      } else {
        // Body: Emerald with slight gradient along length
        const alpha = Math.max(0.6, 1 - (i / this.state.snake.length) * 0.4)
        this.graphics.fillStyle(0x059669, alpha)
        this.graphics.fillRoundedRect(sx, sy, sSize, sSize, 3)
      }
    }

    // 5. Outer Border
    this.graphics.lineStyle(2, 0x334155, 1)
    this.graphics.strokeRect(this.offsetX, this.offsetY, this.boardPixelSize, this.boardPixelSize)
  }

  private initAudio(): void {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.audioCtx = new AudioCtx()
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  private playTone(freq: number, durationSec: number, type: OscillatorType = 'sine'): void {
    if (!this.audioCtx) return
    const vol = this.sdk.getEffectiveVolume('sfx')
    if (vol <= 0) return

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }
      const osc = this.audioCtx.createOscillator()
      const gain = this.audioCtx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime)

      gain.gain.setValueAtTime(vol * 0.25, this.audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationSec)

      osc.connect(gain)
      gain.connect(this.audioCtx.destination)

      osc.start()
      osc.stop(this.audioCtx.currentTime + durationSec)
    } catch {
      // Ignore audio synthesis errors gracefully
    }
  }

  destroy(): void {
    this.isDestroyed = true
    if (this.timerEvent) {
      this.timerEvent.destroy()
      this.timerEvent = null
    }
    if (this.graphics) {
      this.graphics.destroy()
      this.graphics = null
    }
    if (this.particles) {
      this.particles.destroy()
      this.particles = null
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close()
      } catch {
        // Safe ignore
      }
      this.audioCtx = null
    }
  }
}
