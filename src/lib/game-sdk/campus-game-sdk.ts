/**
 * Campus Game SDK — Client Platform Foundation
 *
 * Provides a standardized bridge between game activities (Canvas, Phaser, DOM)
 * and the Digital Campus platform:
 * - Deterministic lifecycle management
 * - Viewport scaling & zero-CLS canvas adaptation
 * - Audio bus linked to user profile settings
 * - Human-rate input recording & anti-cheat session verification
 * - Adaptive performance & visibility loop
 */

import type {
  GameAudioSettings,
  GameEndReason,
  GameInputEvent,
  GameLifecycleEvent,
  GameMode,
  GameQualityLevel,
  GameUserIdentity,
  GameViewportState,
  SoloSessionFinishResponse,
  SoloSessionStartResponse,
} from '../../../shared/protocol/game-sdk'

export interface CampusGameSDKOptions {
  container: HTMLElement
  gameType: string
  mode?: GameMode
  user?: GameUserIdentity | null
  initialAudio?: Partial<GameAudioSettings>
  onLifecycleChange?: (event: GameLifecycleEvent) => void
  onScoreUpdate?: (score: number) => void
  onQualityChange?: (quality: GameQualityLevel) => void
}

export class CampusGameSDK {
  readonly gameType: string
  readonly mode: GameMode
  readonly container: HTMLElement
  readonly user: GameUserIdentity | null

  private lifecycle: GameLifecycleEvent = 'init'
  private currentScore: number = 0
  private sessionId: string | null = null
  private sessionSeed: number = 0
  private sessionStartTime: number = 0
  private inputTrace: GameInputEvent[] = []

  // Viewport
  private resizeObserver: ResizeObserver | null = null
  private viewportState: GameViewportState = {
    width: 800,
    height: 600,
    dpr: 1,
    isFullscreen: false,
  }

  // Audio
  private audioSettings: GameAudioSettings = {
    master: 0.8,
    sfx: 0.8,
    bgm: 0.5,
    muted: false,
  }

  // Adaptive Quality & Performance
  private qualityLevel: GameQualityLevel = 'high'
  private frameCount: number = 0
  private lastFpsCheck: number = 0
  private currentFps: number = 60
  private animFrameId: number | null = null
  private isTabHidden: boolean = false

  // Callbacks
  private onLifecycleChange?: (event: GameLifecycleEvent) => void
  private onScoreUpdate?: (score: number) => void
  private onQualityChange?: (quality: GameQualityLevel) => void

  constructor(options: CampusGameSDKOptions) {
    this.container = options.container
    this.gameType = options.gameType
    this.mode = options.mode || 'solo'
    this.user = options.user || null

    if (options.initialAudio) {
      this.audioSettings = { ...this.audioSettings, ...options.initialAudio }
    }

    this.onLifecycleChange = options.onLifecycleChange
    this.onScoreUpdate = options.onScoreUpdate
    this.onQualityChange = options.onQualityChange

    this.setupViewport()
    this.setupVisibilityListener()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle API
  // ─────────────────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.lifecycle === 'start') return

    // 1. Nếu là solo mode, yêu cầu session từ server để kích hoạt anti-cheat trace
    if (this.mode === 'solo') {
      try {
        const res = await fetch('/api/game/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: this.gameType,
            clientMetadata: {
              viewport: {
                width: this.viewportState.width,
                height: this.viewportState.height,
                dpr: this.viewportState.dpr,
              },
            },
          }),
        })

        if (res.ok) {
          const data = (await res.json()) as SoloSessionStartResponse
          if (data.ok) {
            this.sessionId = data.sessionId
            this.sessionSeed = data.seed
            this.sessionStartTime = Date.now()
          }
        }
      } catch (err) {
        console.warn('CampusGameSDK: Failed to initialize server session token, falling back to local run:', err)
      }
    }

    this.currentScore = 0
    this.inputTrace = []
    this.setLifecycle('start')
    this.startPerfMonitoring()
  }

  pause(): void {
    if (this.lifecycle === 'start') {
      this.setLifecycle('pause')
    }
  }

  resume(): void {
    if (this.lifecycle === 'pause') {
      this.setLifecycle('resume')
      this.setLifecycle('start')
    }
  }

  async end(reason: GameEndReason = 'game_over', finalScore?: number): Promise<SoloSessionFinishResponse | null> {
    if (this.lifecycle === 'end') return null

    if (typeof finalScore === 'number') {
      this.currentScore = finalScore
    }

    this.recordInput('match.end', { reason, finalScore: this.currentScore })
    this.setLifecycle('end')
    this.stopPerfMonitoring()

    // Submit solo run to server verification pipeline
    if (this.mode === 'solo' && this.sessionId) {
      const durationMs = Math.max(100, Date.now() - (this.sessionStartTime || Date.now()))
      try {
        const res = await fetch('/api/game/session/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            score: Math.round(this.currentScore),
            durationMs,
            inputTrace: this.inputTrace.slice(0, 2000), // Cap payload trace
          }),
        })

        if (res.ok) {
          const data = (await res.json()) as SoloSessionFinishResponse
          return data
        }
      } catch (err) {
        console.error('CampusGameSDK: Failed to submit verified session score:', err)
      }
    }

    return null
  }

  destroy(): void {
    this.stopPerfMonitoring()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    this.setLifecycle('destroy')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Input Recording & Anti-Cheat Trace
  // ─────────────────────────────────────────────────────────────────────────

  recordInput(actionCode: string, payload?: unknown): void {
    const elapsed = this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
    this.inputTrace.push({
      t: elapsed,
      k: actionCode,
      p: payload,
    })
  }

  updateScore(score: number): void {
    this.currentScore = score
    this.onScoreUpdate?.(score)
  }

  getScore(): number {
    return this.currentScore
  }

  getSessionSeed(): number {
    return this.sessionSeed
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Viewport & Scaling
  // ─────────────────────────────────────────────────────────────────────────

  private setupViewport(): void {
    if (typeof window === 'undefined' || !this.container) return

    const updateDimensions = () => {
      const rect = this.container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      this.viewportState = {
        width: Math.floor(rect.width) || 800,
        height: Math.floor(rect.height) || 600,
        dpr,
        isFullscreen: Boolean(document.fullscreenElement),
      }
    }

    updateDimensions()

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        updateDimensions()
      })
      this.resizeObserver.observe(this.container)
    }
  }

  getViewport(): GameViewportState {
    return { ...this.viewportState }
  }

  async toggleFullscreen(): Promise<void> {
    if (typeof document === 'undefined') return
    try {
      if (!document.fullscreenElement) {
        await this.container.requestFullscreen()
        this.viewportState.isFullscreen = true
      } else {
        await document.exitFullscreen()
        this.viewportState.isFullscreen = false
      }
    } catch (err) {
      console.warn('CampusGameSDK: Fullscreen toggle failed:', err)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Audio Bus
  // ─────────────────────────────────────────────────────────────────────────

  getAudioSettings(): GameAudioSettings {
    return { ...this.audioSettings }
  }

  setAudioSettings(settings: Partial<GameAudioSettings>): void {
    this.audioSettings = { ...this.audioSettings, ...settings }
  }

  getEffectiveVolume(type: 'sfx' | 'bgm'): number {
    if (this.audioSettings.muted || this.isTabHidden) return 0
    const channelVol = type === 'sfx' ? this.audioSettings.sfx : this.audioSettings.bgm
    return Math.max(0, Math.min(1, this.audioSettings.master * channelVol))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Adaptive Performance & Visibility Loop
  // ─────────────────────────────────────────────────────────────────────────

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      this.isTabHidden = document.visibilityState === 'hidden'
      if (this.isTabHidden) {
        if (this.lifecycle === 'start') {
          this.pause()
        }
      }
    })
  }

  private startPerfMonitoring(): void {
    if (typeof window === 'undefined') return
    this.frameCount = 0
    this.lastFpsCheck = performance.now()

    const check = (now: number) => {
      this.frameCount++
      if (now - this.lastFpsCheck >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCheck))
        this.frameCount = 0
        this.lastFpsCheck = now

        // Check for degradation
        if (this.currentFps < 30 && this.qualityLevel !== 'low') {
          this.qualityLevel = 'low'
          this.onQualityChange?.('low')
        } else if (this.currentFps >= 50 && this.qualityLevel !== 'high') {
          this.qualityLevel = 'high'
          this.onQualityChange?.('high')
        }
      }

      if (this.lifecycle === 'start') {
        this.animFrameId = requestAnimationFrame(check)
      }
    }

    this.animFrameId = requestAnimationFrame(check)
  }

  private stopPerfMonitoring(): void {
    if (this.animFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId)
      this.animFrameId = null
    }
  }

  getFps(): number {
    return this.currentFps
  }

  getQualityLevel(): GameQualityLevel {
    return this.qualityLevel
  }

  private setLifecycle(event: GameLifecycleEvent): void {
    this.lifecycle = event
    this.onLifecycleChange?.(event)
  }
}
