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
import { MAX_INPUT_TRACE_EVENTS } from '../../../shared/protocol/game-sdk'

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
  private traceOverflow: boolean = false

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

  // Adaptive Quality & Performance — with hysteresis to prevent oscillation
  private qualityLevel: GameQualityLevel = 'high'
  private frameCount: number = 0
  private lastFpsCheck: number = 0
  private currentFps: number = 60
  private animFrameId: number | null = null
  private isTabHidden: boolean = false

  // Listener references — stored for deterministic cleanup in destroy()
  private visibilityListener: (() => void) | null = null
  private fullscreenListener: (() => void) | null = null

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

  async end(
    reason: GameEndReason = 'game_over',
    finalScore?: number,
    deterministicElapsedMs?: number,
  ): Promise<SoloSessionFinishResponse | null> {
    if (this.lifecycle === 'end') return null

    if (typeof finalScore === 'number') {
      this.currentScore = finalScore
    }

    this.recordInputAt('match.end', { reason, finalScore: this.currentScore }, deterministicElapsedMs)
    this.setLifecycle('end')
    this.stopPerfMonitoring()

    // Submit solo run to server verification pipeline
    if (this.mode === 'solo' && this.sessionId) {
      const durationMs = typeof deterministicElapsedMs === 'number'
        ? Math.max(100, Math.round(deterministicElapsedMs))
        : Math.max(100, Date.now() - (this.sessionStartTime || Date.now()))
      try {
        const res = await fetch('/api/game/session/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            sessionId: this.sessionId,
            score: Math.round(this.currentScore),
            durationMs,
            // Trace is already bounded at recordInput; no extra slice needed
            inputTrace: this.inputTrace,
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

  /**
   * Explicitly aborts an active ranked session so it does not remain orphaned on the server.
   */
  async abort(reason: GameEndReason = 'aborted'): Promise<SoloSessionFinishResponse | null> {
    if (this.lifecycle === 'end' || this.lifecycle === 'destroy') return null
    if (!this.sessionId || this.mode !== 'solo') {
      this.setLifecycle('end')
      return null
    }
    return this.end(reason, this.currentScore)
  }

  destroy(): void {
    this.stopPerfMonitoring()
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
    // Remove visibility listener
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener)
      this.visibilityListener = null
    }
    // Remove fullscreen listener
    if (this.fullscreenListener && typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.fullscreenListener)
      this.fullscreenListener = null
    }
    // If an active solo ranked session is still running, abort it to prevent orphaned server session
    if (this.mode === 'solo' && this.sessionId && this.lifecycle !== 'end' && this.lifecycle !== 'destroy') {
      this.abort('aborted').catch(() => {})
    }
    this.inputTrace = []
    this.traceOverflow = false
    this.setLifecycle('destroy')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Input Recording & Anti-Cheat Trace
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Records an input event at an authoritative deterministic simulation timestamp.
   */
  recordInputAt(actionCode: string, payload?: unknown, deterministicElapsedMs?: number): void {
    if (this.traceOverflow) return
    const elapsed = typeof deterministicElapsedMs === 'number'
      ? Math.max(0, Math.round(deterministicElapsedMs))
      : (this.sessionStartTime ? Date.now() - this.sessionStartTime : 0)
    if (this.inputTrace.length >= MAX_INPUT_TRACE_EVENTS) {
      this.traceOverflow = true
      console.warn(`CampusGameSDK: inputTrace hit MAX (${MAX_INPUT_TRACE_EVENTS}). Further inputs not recorded.`)
      return
    }
    this.inputTrace.push({
      t: elapsed,
      k: actionCode,
      // Cast: payload conforms to GameInputPayloadSchema at runtime; SDK accepts any game value
      p: payload as GameInputEvent['p'],
    })
  }

  recordInput(actionCode: string, payload?: unknown): void {
    this.recordInputAt(actionCode, payload)
  }

  /** Returns a copy of the currently recorded input trace (useful for testing & assertions). */
  getRecordedInputs(): readonly GameInputEvent[] {
    return [...this.inputTrace]
  }

  /** Whether input trace overflowed. Server will note this in verification. */
  isTraceOverflow(): boolean {
    return this.traceOverflow
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

    this.visibilityListener = () => {
      this.isTabHidden = document.visibilityState === 'hidden'
      if (this.isTabHidden && this.lifecycle === 'start') {
        this.pause()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityListener)

    // Fullscreen change — deterministic viewport sync via event, not polling
    this.fullscreenListener = () => {
      this.viewportState = {
        ...this.viewportState,
        isFullscreen: Boolean(document.fullscreenElement),
      }
    }
    document.addEventListener('fullscreenchange', this.fullscreenListener)
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

        // Adaptive quality with hysteresis to avoid oscillation:
        // Degrade: fps < 30 → low, fps < 45 → medium
        // Recover: fps >= 55 → high, fps >= 40 → medium
        if (this.currentFps < 30 && this.qualityLevel !== 'low') {
          this.qualityLevel = 'low'
          this.onQualityChange?.('low')
        } else if (this.currentFps >= 30 && this.currentFps < 45 && this.qualityLevel === 'high') {
          this.qualityLevel = 'medium'
          this.onQualityChange?.('medium')
        } else if (this.currentFps >= 40 && this.qualityLevel === 'low') {
          this.qualityLevel = 'medium'
          this.onQualityChange?.('medium')
        } else if (this.currentFps >= 55 && this.qualityLevel !== 'high') {
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

  /**
   * Tính toán thời gian chờ kết nối lại (reconnect backoff) có áp dụng
   * Exponential Backoff và Randomized Jitter để chống bão kết nối (Reconnect Storm).
   */
  calculateReconnectDelay(attempt: number, config?: ReconnectConfig): number {
    const base = config?.baseDelayMs ?? 1000
    const maxDelay = config?.maxDelayMs ?? 15000
    const jitterFactor = config?.jitterFactor ?? 0.3 // +/- 30% jitter

    const expDelay = Math.min(maxDelay, base * Math.pow(2, attempt))
    const jitter = (Math.random() * 2 - 1) * jitterFactor * expDelay
    return Math.max(100, Math.round(expDelay + jitter))
  }

  private setLifecycle(event: GameLifecycleEvent): void {
    this.lifecycle = event
    this.onLifecycleChange?.(event)
  }
}

export interface ReconnectConfig {
  maxRetries?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterFactor?: number
}
