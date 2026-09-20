import { GameEngineLoader } from '../../../lib/game-loader/engine-loader'
import { CampusGameSDK } from '../../../lib/game-sdk/campus-game-sdk'
import type { Direction } from '../../../../shared/games/snake'
import { SnakeScene } from './SnakeScene'

export type SnakeVerificationStatus = 'idle' | 'verifying' | 'verified' | 'unverified' | 'practice'

export interface SnakeGameControllerOptions {
  container: HTMLElement
  onScoreUpdate?: (score: number) => void
  onGameOver?: (finalScore: number, reason: string) => void
  onStatusChange?: (status: SnakeVerificationStatus, verifiedScore: number | null) => void
  onEngineLoadingChange?: (loading: boolean) => void
  onStateChange?: (state: { isPlaying: boolean; isDead: boolean; deathReason: string | null }) => void
}

export class SnakeGameController {
  private container: HTMLElement
  private sdk: CampusGameSDK | null = null
  private scene: SnakeScene | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private phaserGame: any = null

  private isPlaying = false
  private isDead = false
  private deathReason: string | null = null
  private isDestroyed = false

  private onScoreUpdate?: (score: number) => void
  private onGameOver?: (finalScore: number, reason: string) => void
  private onStatusChange?: (status: SnakeVerificationStatus, verifiedScore: number | null) => void
  private onEngineLoadingChange?: (loading: boolean) => void
  private onStateChange?: (state: { isPlaying: boolean; isDead: boolean; deathReason: string | null }) => void

  constructor(options: SnakeGameControllerOptions) {
    this.container = options.container
    this.onScoreUpdate = options.onScoreUpdate
    this.onGameOver = options.onGameOver
    this.onStatusChange = options.onStatusChange
    this.onEngineLoadingChange = options.onEngineLoadingChange
    this.onStateChange = options.onStateChange
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  getIsDead(): boolean {
    return this.isDead
  }

  getDeathReason(): string | null {
    return this.deathReason
  }

  getSdk(): CampusGameSDK | null {
    return this.sdk
  }

  getScene(): SnakeScene | null {
    return this.scene
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPhaserGame(): any {
    return this.phaserGame
  }

  private notifyState(): void {
    this.onStateChange?.({
      isPlaying: this.isPlaying,
      isDead: this.isDead,
      deathReason: this.deathReason,
    })
  }

  /**
   * Stop the current game instances (Phaser, SnakeScene, SDK) cleanly.
   */
  stop(): void {
    if (this.phaserGame) {
      try {
        this.phaserGame.destroy(true)
      } catch {
        // Safe tear down
      }
      this.phaserGame = null
    }
    if (this.scene) {
      this.scene.destroy()
      this.scene = null
    }
    if (this.sdk) {
      this.sdk.destroy()
      this.sdk = null
    }
  }

  /**
   * Starts a new game session.
   * If a previous session was active, aborts it first with deterministic elapsed time.
   */
  async start(): Promise<void> {
    if (this.isDestroyed || !this.container) return

    // If an active session was already playing, abort it first so it doesn't stay orphaned
    if (this.sdk && this.isPlaying && !this.isDead) {
      const elapsed = this.scene?.getState().elapsedMs
      this.sdk.abort('aborted', elapsed).catch(() => {})
    }

    this.stop()

    this.isPlaying = true
    this.isDead = false
    this.deathReason = null
    this.notifyState()

    this.onScoreUpdate?.(0)
    this.onStatusChange?.('idle', null)
    this.onEngineLoadingChange?.(true)

    try {
      // 1. Initialize CampusGameSDK
      const sdk = new CampusGameSDK({
        container: this.container,
        gameType: 'solo_snake',
        mode: 'solo',
        onScoreUpdate: (s: number) => this.onScoreUpdate?.(s),
      })
      this.sdk = sdk

      // 2. Start server session for seed & anti-cheat
      await sdk.start()
      const seed = sdk.getSessionSeed()
      const isPracticeRun = seed === 0
      if (isPracticeRun) {
        this.onStatusChange?.('practice', null)
      }

      // Check if aborted/stopped while waiting for sdk.start()
      if (!this.isPlaying || this.isDestroyed) {
        return
      }

      // 3. Lazy load Phaser 4.2.1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Phaser: any = await GameEngineLoader.loadPhaser()
      if (!this.container || !this.isPlaying || this.isDestroyed) {
        return
      }

      // 4. Create SnakeScene instance
      const snakeScene = new SnakeScene({
        seed: seed || Date.now(),
        sdk,
        onScoreUpdate: (s) => this.onScoreUpdate?.(s),
        onGameOver: async (finalScore, reason) => {
          this.isPlaying = false
          this.isDead = true
          this.deathReason = reason
          this.notifyState()
          this.onGameOver?.(finalScore, reason)

          if (isPracticeRun) {
            this.onStatusChange?.('practice', null)
            return
          }

          // Submit to server verification pipeline with simulation elapsed time
          this.onStatusChange?.('verifying', null)
          try {
            const finishRes = await sdk.end('game_over', finalScore, snakeScene.getState().elapsedMs)
            if (finishRes?.ok && finishRes.verified) {
              this.onStatusChange?.('verified', finishRes.finalScore)
            } else {
              this.onStatusChange?.('unverified', null)
            }
          } catch {
            this.onStatusChange?.('unverified', null)
          }
        },
      })
      this.scene = snakeScene

      // 5. Mount Phaser.Game
      const rect = this.container.getBoundingClientRect()
      const gameWidth = Math.max(300, Math.floor(rect.width) || 360)
      const gameHeight = Math.max(300, Math.floor(rect.height) || 360)

      const phaserConfig = {
        type: Phaser.AUTO,
        parent: this.container,
        width: gameWidth,
        height: gameHeight,
        transparent: true,
        scene: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          create(this: any) {
            snakeScene.init(this)
          },
          update() {
            snakeScene.update()
          },
        },
      }

      this.phaserGame = new Phaser.Game(phaserConfig)
    } catch (err) {
      console.error('Lỗi khởi động Snake Deluxe:', err)
      this.isPlaying = false
      this.notifyState()
      this.onStatusChange?.('practice', null)
    } finally {
      this.onEngineLoadingChange?.(false)
    }
  }

  /**
   * Handles visibility changes (e.g. user switching tabs or minimizing window).
   * Aborts active ranked session immediately with deterministic elapsed time.
   */
  async handleVisibilityChange(hidden: boolean): Promise<void> {
    if (hidden && this.isPlaying && !this.isDead) {
      const elapsed = this.scene?.getState().elapsedMs

      // 1. Stop simulation and renderer immediately
      if (this.scene) {
        this.scene.destroy()
        this.scene = null
      }
      if (this.phaserGame) {
        try {
          this.phaserGame.destroy(true)
        } catch {}
        this.phaserGame = null
      }

      this.isPlaying = false
      this.isDead = true
      this.deathReason = 'aborted'
      this.notifyState()
      this.onStatusChange?.('unverified', null)

      // 2. Abort server session with authoritative deterministic elapsed time
      if (this.sdk) {
        try {
          await this.sdk.abort('aborted', elapsed)
        } catch {
          // Ignore network errors on unload
        }
      }
    }
  }

  /**
   * Queues a directional turn.
   */
  handleTurn(dir: Direction): void {
    this.scene?.queueTurn(dir)
  }

  /**
   * Final teardown on component unmount.
   */
  destroy(): void {
    this.isDestroyed = true
    if (this.sdk && this.isPlaying && !this.isDead) {
      const elapsed = this.scene?.getState().elapsedMs
      this.sdk.abort('aborted', elapsed).catch(() => {})
    }
    this.stop()
  }
}
