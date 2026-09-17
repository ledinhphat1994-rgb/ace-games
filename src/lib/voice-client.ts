import type { VoiceParticipantState } from '../../shared/protocol/room'

export type VoiceConnectionState =
  | 'idle'
  | 'listening'
  | 'requesting_media'
  | 'negotiating'
  | 'connected'
  | 'muted'
  | 'reconnecting'
  | 'failed'

export interface VoiceClientState {
  isSupported: boolean
  connectionState: VoiceConnectionState
  isPublishing: boolean
  isConnecting: boolean
  isMuted: boolean
  hasError: boolean
  errorMessage: string | null
  blockedReason: string | null
  activeSpeakers: string[] // list of actorKeys with active remote streams
  speakingActors: string[] // list of actorKeys currently speaking (RMS detector)
  isAudioAutoplayBlocked: boolean
  currentInputDeviceId?: string
  currentOutputDeviceId?: string
}

export interface VoiceClientOptions {
  roomId: number
  currentActorKey: string
  onStateChange?: (state: VoiceClientState) => void
  onRemoteTrack?: (actorKey: string, stream: MediaStream) => void
  onRemoteTrackRemoved?: (actorKey: string) => void
  onError?: (err: Error) => void
}

interface AudioAnalyserEntry {
  source: MediaStreamAudioSourceNode
  analyser: AnalyserNode
  lastSpokeAt: number
}

class AsyncMutex {
  private queue: Array<() => void> = []
  private locked = false

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true
        resolve(() => {
          this.locked = false
          const next = this.queue.shift()
          if (next) {
            next()
          }
        })
      }
      if (!this.locked) {
        run()
      } else {
        this.queue.push(run)
      }
    })
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire()
    try {
      return await fn()
    } finally {
      release()
    }
  }
}

export class VoiceClient {
  private roomId: number
  private currentActorKey: string
  private onStateChange?: (state: VoiceClientState) => void
  private onRemoteTrack?: (actorKey: string, stream: MediaStream) => void
  private onRemoteTrackRemoved?: (actorKey: string) => void
  private onError?: (err: Error) => void

  // PC lifecycle generation token to discard stale async callbacks
  private pcGeneration = 0

  // Signaling Mutex to serialize all SDP offer/answer exchanges and API requests
  private signalingMutex = new AsyncMutex()

  private pc: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private localTrack: MediaStreamTrack | null = null
  private localSender: RTCRtpSender | null = null
  private sessionId: string | null = null
  private canonicalTrackName: string | null = null

  // State Machine
  private connectionState: VoiceConnectionState = 'idle'
  private isPublishing = false
  private isMuted = false
  private isConnecting = false
  private intendedPublishing = false
  private recoveryPending = false
  private rebuildInFlight = false
  private isDestroyed = false
  private generation = 0
  private blockedReason: string | null = null
  private errorMessage: string | null = null
  private isAudioAutoplayBlocked = false
  private lastLocalTrackState: { kind: string; readyState: string; enabled: boolean } | null = null
  private lastPcConnectionState: string | null = null
  private currentInputDeviceId?: string
  private currentOutputDeviceId?: string

  // Reconnection management
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private disconnectGraceTimer: ReturnType<typeof setTimeout> | null = null
  private currentRegistry: VoiceParticipantState[] = []

  // Subscriptions & Track mappings (Transactional)
  private subscribedTracks = new Map<string, { sessionId: string; trackName: string; mid?: string }>()
  private inFlightSubscriptions = new Set<string>()
  private remoteStreams = new Map<string, MediaStream>()
  private audioElements = new Map<string, HTMLAudioElement>()
  private trackToActorMap = new Map<string, string>()
  private midToActorMap = new Map<string, string>()

  // Speaking Detector (AudioContext RMS)
  private audioCtx: AudioContext | null = null
  private analysers = new Map<string, AudioAnalyserEntry>()
  private speakingActors = new Set<string>()
  private speakingDetectorInterval: ReturnType<typeof setInterval> | null = null
  handleOffline = (): void => {
    if (!this.isDestroyed) {
      this.handleConnectionFailure('network_offline')
    }
  }

  handleOnline = (): void => {
    if (!this.isDestroyed && this.recoveryPending && !this.rebuildInFlight) {
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }
      this.rebuildConnection().catch((err) => {
        console.error('Lỗi khi phục hồi kết nối sau online:', err)
        if (this.recoveryPending && !this.isDestroyed) {
          this.handleConnectionFailure('retry')
        }
      })
    }
  }

  constructor(options: VoiceClientOptions) {
    this.roomId = options.roomId
    this.currentActorKey = options.currentActorKey
    this.onStateChange = options.onStateChange
    this.onRemoteTrack = options.onRemoteTrack
    this.onRemoteTrackRemoved = options.onRemoteTrackRemoved
    this.onError = options.onError

    if (typeof window !== 'undefined') {
      window.addEventListener('offline', this.handleOffline)
      window.addEventListener('online', this.handleOnline)
    }

    this.startSpeakingDetector()
    this.setupE2EDiagnostics()
  }

  get state(): VoiceClientState {
    const isSupported =
      typeof window !== 'undefined' &&
      Boolean(navigator?.mediaDevices?.getUserMedia) &&
      typeof RTCPeerConnection !== 'undefined'
    return {
      isSupported,
      connectionState: this.connectionState,
      isPublishing: this.isPublishing,
      isConnecting: this.connectionState === 'requesting_media' || this.connectionState === 'negotiating' || this.isConnecting,
      isMuted: this.isMuted,
      hasError: Boolean(this.errorMessage),
      errorMessage: this.errorMessage,
      blockedReason: this.blockedReason,
      activeSpeakers: Array.from(this.remoteStreams.keys()),
      speakingActors: Array.from(this.speakingActors),
      isAudioAutoplayBlocked: this.isAudioAutoplayBlocked,
      currentInputDeviceId: this.currentInputDeviceId,
      currentOutputDeviceId: this.currentOutputDeviceId,
    }
  }

  getGeneration(): number {
    return this.generation
  }

  getPcGeneration(): number {
    return this.pcGeneration
  }

  getSessionId(): string | null {
    return this.sessionId
  }

  private setConnectionState(nextState: VoiceConnectionState): void {
    if (this.connectionState !== nextState) {
      this.connectionState = nextState
      this.emitState()
    }
  }

  private emitState(): void {
    this.onStateChange?.(this.state)
  }

  /**
   * Read-only diagnostics exclusively in E2E mode.
   * Completely undefined in standard production.
   */
  private setupE2EDiagnostics(): void {
    if (typeof window === 'undefined') return
    const isE2E = (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ === true
    if (!isE2E) {
      delete (window as unknown as { __VOICE_DIAGNOSTICS__?: unknown }).__VOICE_DIAGNOSTICS__
      return
    }

    ;(window as unknown as { __VOICE_DIAGNOSTICS__?: unknown }).__VOICE_DIAGNOSTICS__ = {
      getConnectionState: () => this.connectionState,
      getPeerConnectionState: () => this.pc?.connectionState ?? (this.lastPcConnectionState as any) ?? 'none',
      getIceConnectionState: () => this.pc?.iceConnectionState ?? (this.lastPcConnectionState === 'closed' ? 'closed' : 'none'),
      getSessionId: () => this.sessionId,
      getServerGeneration: () => this.generation,
      getPcGeneration: () => this.pcGeneration,
      isPublishing: () => this.isPublishing,
      isMuted: () => this.isMuted,
      getLocalTrack: () => {
        if (this.localTrack) {
          return {
            kind: this.localTrack.kind,
            readyState: this.localTrack.readyState,
            enabled: this.localTrack.enabled,
          }
        }
        return this.lastLocalTrackState
      },
      getRemoteTracks: () => {
        const tracks: Array<{ actorKey: string; kind: string; readyState: string; transceiverMid?: string }> = []
        for (const [actorKey, stream] of this.remoteStreams) {
          for (const t of stream.getAudioTracks()) {
            const sub = this.subscribedTracks.get(actorKey)
            tracks.push({
              actorKey,
              kind: t.kind,
              readyState: t.readyState,
              transceiverMid: sub?.mid,
            })
          }
        }
        return tracks
      },
      getSubscriptions: () =>
        Array.from(this.subscribedTracks.entries()).map(([k, v]) => ({
          actorKey: k,
          ...v,
        })),
      getAudioElementsCount: () => this.audioElements.size,
      hasAudioElementForActor: (actorKey: string) => this.audioElements.has(actorKey),
      getAudioElementActorKeys: () => Array.from(this.audioElements.keys()),
      isRecoveryPending: () => this.recoveryPending,
      isRebuildInFlight: () => this.rebuildInFlight,
      getIntendedPublishing: () => this.intendedPublishing,
      getSpeakingActors: () => Array.from(this.speakingActors),
      isAudioAutoplayBlocked: () => this.isAudioAutoplayBlocked,
      getVoiceRegistry: () => [...this.currentRegistry],
      getInboundStatsForActor: async (actorKey: string) => {
        if (!this.pc) return null
        const stream = this.remoteStreams.get(actorKey)
        const track = stream?.getAudioTracks()[0]
        const sub = this.subscribedTracks.get(actorKey)
        if (!track && !sub) return null

        const stats = await this.pc.getStats()
        let matchingReport: any = null
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && (report.kind === 'audio' || report.mediaType === 'audio')) {
            if (track && (report.trackIdentifier === track.id || (report as any).trackId === track.id)) {
              matchingReport = { ...report }
            } else if (sub?.mid && report.mid === sub.mid) {
              matchingReport = { ...report }
            }
          }
        })
        if (!matchingReport) return null
        return {
          actorKey,
          trackId: track?.id,
          mid: sub?.mid,
          bytesReceived: Number(matchingReport.bytesReceived) || 0,
          packetsReceived: Number(matchingReport.packetsReceived) || 0,
          kind: track?.kind || matchingReport.kind || 'audio',
          readyState: track?.readyState || 'live',
        }
      },
      getStats: async () => {
        if (!this.pc) return []
        const stats = await this.pc.getStats()
        const result: Record<string, unknown>[] = []
        stats.forEach((report) => result.push({ ...report }))
        return result
      },
    }
  }

  /**
   * Khởi tạo WebRTC PeerConnection với pcGeneration token
   */
  private async ensurePeerConnection(): Promise<RTCPeerConnection> {
    if (this.pc && this.pc.connectionState !== 'closed' && this.pc.connectionState !== 'failed') {
      return this.pc
    }

    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ WebRTC RTCPeerConnection.')
    }

    this.pcGeneration++
    const currentPcGen = this.pcGeneration

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      bundlePolicy: 'max-bundle',
    })

    pc.ontrack = (event) => {
      // Invariant 4: Token check — ignore stale callbacks from older PC generation
      if (currentPcGen !== this.pcGeneration) return

      const track = event.track
      if (track.kind !== 'audio') return

      const mid = event.transceiver?.mid
      const actorKey =
        (mid ? this.midToActorMap.get(mid) : null) ||
        this.trackToActorMap.get(track.id)

      if (actorKey) {
        const stream = event.streams[0] || new MediaStream([track])
        this.remoteStreams.set(actorKey, stream)
        this.attachAudioElement(actorKey, stream)
        this.attachSpeakingDetector(actorKey, stream)
        this.onRemoteTrack?.(actorKey, stream)
        this.emitState()
      }
    }

    pc.onconnectionstatechange = () => {
      if (currentPcGen !== this.pcGeneration || this.isDestroyed) return

      const state = pc.connectionState
      if (state === 'connected') {
        if (this.disconnectGraceTimer) {
          clearTimeout(this.disconnectGraceTimer)
          this.disconnectGraceTimer = null
        }
        if (!this.recoveryPending) {
          this.reconnectAttempts = 0
          if (this.isMuted) {
            this.setConnectionState('muted')
          } else if (this.isPublishing) {
            this.setConnectionState('connected')
          } else {
            this.setConnectionState('listening')
          }
        }
      } else if (state === 'disconnected') {
        // Short grace timer before triggering rebuild
        if (!this.disconnectGraceTimer) {
          this.disconnectGraceTimer = setTimeout(() => {
            this.disconnectGraceTimer = null
            if (this.pc?.connectionState === 'disconnected') {
              this.handleConnectionFailure('disconnected')
            }
          }, 2000)
        }
      } else if (state === 'failed') {
        this.handleConnectionFailure('failed')
      }
    }

    this.pc = pc
    return pc
  }

  private handleConnectionFailure(reason: string): void {
    if (this.isDestroyed) return

    console.warn(`WebRTC kết nối gặp sự cố (${reason}). Đang tự động kết nối lại...`)
    this.recoveryPending = true
    this.isPublishing = false
    this.setConnectionState('reconnecting')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.reconnectAttempts >= 5) {
      this.errorMessage = 'Không thể phục hồi kết nối âm thanh sau nhiều lần thử.'
      this.setConnectionState('failed')
      return
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.isDestroyed || !this.recoveryPending || this.rebuildInFlight) return
      this.rebuildConnection().catch((err) => {
        console.error('Lỗi khi tái tạo kết nối thoại:', err)
        if (this.recoveryPending && !this.isDestroyed) {
          this.handleConnectionFailure('retry')
        }
      })
    }, delay)
  }

  /**
   * Tái tạo SFU session và resubscribe sau khi rớt mạng
   */
  private async rebuildConnection(): Promise<void> {
    if (this.isDestroyed || !this.recoveryPending || this.rebuildInFlight) return
    this.rebuildInFlight = true
    try {
      await this.signalingMutex.runExclusive(() => this.executeRebuildConnection())
    } finally {
      this.rebuildInFlight = false
    }
  }

  private async executeRebuildConnection(): Promise<void> {
    if (this.isDestroyed || !this.recoveryPending) return

    const shouldRepublish = this.intendedPublishing
    const wasMuted = this.isMuted

    // Invalidate old media authority
    this.isPublishing = false

    // Đóng PC cũ và dọn dẹp map/audio phần tử cũ
    if (this.pc) {
      try {
        this.pc.close()
      } catch {}
      this.pc = null
    }

    this.pcGeneration++
    this.sessionId = null
    this.subscribedTracks.clear()
    this.midToActorMap.clear()
    this.trackToActorMap.clear()
    this.inFlightSubscriptions.clear()
    this.localSender = null

    for (const audio of this.audioElements.values()) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
    }
    this.audioElements.clear()
    this.remoteStreams.clear()

    // Khởi tạo lại Listener SFU session (do NOT stop still-live local mic track)
    const ok = await this.executeInitSession()
    if (!ok || !this.sessionId || !this.pc) {
      throw new Error('Không thể khởi tạo session mới khi reconnect.')
    }

    // Đăng ký nghe lại các track hiện có trong danh bạ mới nhất
    if (this.currentRegistry.length > 0) {
      for (const p of this.currentRegistry) {
        if (p.actorKey !== this.currentActorKey && p.status === 'live') {
          await this.executeSubscribeToParticipant(p)
        }
      }
    }

    // Nếu người dùng trước đó đang bật mic (trên cùng trang) -> tự động republish
    if (shouldRepublish) {
      const pubOk = await this.executeStartPublishing()
      if (!pubOk) {
        throw new Error('Không thể tái phát micro sau khi reconnect.')
      }
      if (wasMuted) {
        this.mute()
      }
    }

    // Toàn bộ recovery thành công!
    this.recoveryPending = false
    this.reconnectAttempts = 0
    this.errorMessage = null
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.isPublishing) {
      this.setConnectionState(this.isMuted ? 'muted' : 'connected')
    } else {
      this.setConnectionState('listening')
    }
  }

  private async waitForSignalingStateStable(timeoutMs = 5000): Promise<boolean> {
    const pc = this.pc
    if (!pc || pc.signalingState === 'stable') return true
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null
      const check = () => {
        if (!this.pc || this.pc.signalingState === 'stable') {
          if (timer) clearTimeout(timer)
          pc.removeEventListener('signalingstatechange', check)
          resolve(true)
        }
      }
      timer = setTimeout(() => {
        pc.removeEventListener('signalingstatechange', check)
        resolve(this.pc?.signalingState === 'stable')
      }, timeoutMs)
      pc.addEventListener('signalingstatechange', check)
    })
  }

  private attachAudioElement(actorKey: string, stream: MediaStream): void {
    if (typeof document === 'undefined') return
    let audio = this.audioElements.get(actorKey)
    if (!audio) {
      audio = document.createElement('audio')
      audio.autoplay = true
      audio.setAttribute('playsinline', 'true')
      audio.dataset.actorKey = actorKey
      this.audioElements.set(actorKey, audio)
    }

    if (this.currentOutputDeviceId && typeof (audio as unknown as { setSinkId?: (id: string) => Promise<void> }).setSinkId === 'function') {
      ;(audio as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(this.currentOutputDeviceId).catch(() => {})
    }

    audio.srcObject = stream
    audio.play().then(() => {
      if (this.isAudioAutoplayBlocked) {
        this.isAudioAutoplayBlocked = false
        this.emitState()
      }
    }).catch((err: unknown) => {
      const errorName = (err as { name?: string })?.name
      if (errorName === 'NotAllowedError' || errorName === 'AutoplayBlocked') {
        this.isAudioAutoplayBlocked = true
        this.emitState()
      }
      console.warn('Không thể tự động phát âm thanh phòng học:', err)
    })
  }

  /**
   * Giải phóng chặn Autoplay từ tương tác người dùng
   */
  async unblockAutoplay(): Promise<boolean> {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      try {
        await this.audioCtx.resume()
      } catch {}
    }

    let success = true
    for (const audio of this.audioElements.values()) {
      try {
        await audio.play()
      } catch {
        success = false
      }
    }

    if (success) {
      this.isAudioAutoplayBlocked = false
      this.emitState()
    }
    return success
  }

  /**
   * Khởi tạo Voice Session với Cloudflare Realtime SFU (Listener-only ban đầu)
   */
  async initSession(): Promise<boolean> {
    return this.signalingMutex.runExclusive(() => this.executeInitSession())
  }

  private async executeInitSession(): Promise<boolean> {
    if (this.isDestroyed) return false
    if (this.sessionId && this.pc && this.pc.connectionState !== 'closed' && this.pc.connectionState !== 'failed') {
      return true
    }

    this.isConnecting = true
    this.errorMessage = null
    if (!this.recoveryPending) {
      this.setConnectionState('negotiating')
    }

    try {
      const pc = await this.ensurePeerConnection()
      const localPcGen = this.pcGeneration

      // Thêm transceiver nhận nếu chưa có
      pc.addTransceiver('audio', { direction: 'recvonly' })

      await this.waitForSignalingStateStable()
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return false

      const res = await fetch(`/api/rooms/${this.roomId}/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionDescription: {
            type: pc.localDescription?.type,
            sdp: pc.localDescription?.sdp,
          },
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        sessionId?: string
        generation?: number
        code?: string
        loi?: string
        sessionDescription?: { type: RTCSdpType; sdp: string }
      } | null

      if (!res.ok || !data?.ok || !data.sessionId) {
        if (data?.code === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS' || res.status === 503) {
          this.blockedReason = 'Máy chủ chưa cấu hình Cloudflare Realtime credentials (App ID / Secret).'
          this.isConnecting = false
          this.setConnectionState('idle')
          return false
        }
        throw new Error(data?.loi || `Lỗi khởi tạo phiên thoại (${res.status}).`)
      }

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return false

      this.sessionId = data.sessionId
      this.generation = typeof data.generation === 'number' ? data.generation : 1

      if (data.sessionDescription) {
        await this.waitForSignalingStateStable()
        await pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      this.isConnecting = false
      if (!this.recoveryPending) {
        this.setConnectionState(this.isPublishing ? 'connected' : 'listening')
      }
      return true
    } catch (err: unknown) {
      this.isConnecting = false
      this.errorMessage = (err as Error)?.message || 'Không thể kết nối đến máy chủ âm thanh.'
      this.onError?.(err as Error)
      if (!this.recoveryPending) {
        this.setConnectionState('failed')
      }
      return false
    }
  }

  /**
   * Bật phát Micro cá nhân (Sendonly Transceiver with confirmed MID)
   */
  async startPublishing(): Promise<boolean> {
    return this.signalingMutex.runExclusive(() => this.executeStartPublishing())
  }

  private async executeStartPublishing(): Promise<boolean> {
    if (this.isDestroyed) return false
    if (this.isPublishing && this.localTrack) {
      this.localTrack.enabled = true
      this.isMuted = false
      this.setConnectionState('connected')
      return true
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.errorMessage = 'Trình duyệt không hỗ trợ truy cập micro hoặc trang không chạy qua HTTPS.'
      this.setConnectionState('failed')
      return false
    }

    this.intendedPublishing = true
    this.isConnecting = true
    this.errorMessage = null
    if (!this.recoveryPending) {
      this.setConnectionState('requesting_media')
    }

    try {
      const sessionOk = await this.executeInitSession()
      if (!sessionOk || !this.sessionId || !this.pc) {
        this.isConnecting = false
        this.setConnectionState('failed')
        return false
      }
      const localPcGen = this.pcGeneration

      let stream: MediaStream | null = this.localStream
      let track = stream ? stream.getAudioTracks()[0] : null

      if (!stream || !track || track.readyState !== 'live') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: this.currentInputDeviceId ? { exact: this.currentInputDeviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        track = stream.getAudioTracks()[0]
        if (!track) {
          throw new Error('Không tìm thấy luồng micro khả dụng.')
        }
        this.localStream = stream
        this.localTrack = track
      }

      const activeStream: MediaStream = stream

      if (!this.recoveryPending) {
        this.setConnectionState('negotiating')
      }

      await this.waitForSignalingStateStable()

      // Invariant: Thêm transceiver sendonly và trích xuất MID sau setLocalDescription
      const transceiver = this.pc.addTransceiver(track, {
        direction: 'sendonly',
        streams: [activeStream],
      })
      this.localSender = transceiver.sender

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return false

      const mid = transceiver.mid
      if (!mid) {
        throw new Error('Không trích xuất được transceiver mid sau khi tạo SDP offer.')
      }

      const res = await fetch(`/api/rooms/${this.roomId}/voice/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          trackName: track.id,
          mid,
          generation: this.generation,
          sessionDescription: {
            type: this.pc.localDescription?.type,
            sdp: this.pc.localDescription?.sdp,
          },
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        canonicalTrackName?: string
        generation?: number
        code?: string
        loi?: string
        sessionDescription?: { type: RTCSdpType; sdp: string }
        requiresImmediateRenegotiation?: boolean
      } | null

      if (!res.ok || !data?.ok) {
        if (data?.code === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
          this.blockedReason = 'Cần cấu hình Cloudflare Realtime credentials để truyền phát âm thanh.'
          this.isConnecting = false
          this.setConnectionState('listening')
          return false
        }
        throw new Error(data?.loi || `Không thể đăng ký phát micro (${res.status}).`)
      }

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return false

      this.canonicalTrackName = data.canonicalTrackName || track.id
      if (typeof data.generation === 'number') {
        this.generation = data.generation
      }

      if (data.sessionDescription) {
        await this.waitForSignalingStateStable()
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      if (data.requiresImmediateRenegotiation) {
        await this.executeRenegotiateSession()
      }

      this.attachSpeakingDetector('local', activeStream)

      this.isPublishing = true
      this.isMuted = false
      this.isConnecting = false
      if (!this.recoveryPending) {
        this.setConnectionState('connected')
      }
      return true
    } catch (err: unknown) {
      this.isConnecting = false
      this.errorMessage = (err as Error)?.message || 'Không thể bật micro.'
      this.onError?.(err as Error)
      if (!this.recoveryPending) {
        this.setConnectionState('failed')
      }
      return false
    }
  }

  /**
   * Tái đàm phán Session khi Cloudflare yêu cầu (Renegotiation cycle)
   */
  private async executeRenegotiateSession(): Promise<void> {
    if (!this.pc || !this.sessionId || this.isDestroyed) return
    const localPcGen = this.pcGeneration

    try {
      await this.waitForSignalingStateStable()
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return

      const res = await fetch(`/api/rooms/${this.roomId}/voice/renegotiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          sessionDescription: {
            type: this.pc.localDescription?.type,
            sdp: this.pc.localDescription?.sdp,
          },
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        sessionDescription?: { type: RTCSdpType; sdp: string }
      } | null

      if (!res.ok || !data?.ok) {
        throw new Error(`Renegotiate failed: status ${res.status}`)
      }

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return

      if (data.sessionDescription) {
        await this.waitForSignalingStateStable()
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }
    } catch (err) {
      console.warn('Lỗi tái đàm phán session:', err)
      throw err
    }
  }

  /**
   * Tắt tạm thời micro (Mute)
   */
  mute(): { generation: number; muted: boolean } {
    if (this.localTrack) {
      this.localTrack.enabled = false
    }
    this.isMuted = true
    this.speakingActors.delete('local')
    this.setConnectionState('muted')
    return { generation: this.generation, muted: true }
  }

  /**
   * Bật lại micro (Unmute)
   */
  unmute(): { generation: number; muted: boolean } {
    if (this.localTrack) {
      this.localTrack.enabled = true
    }
    this.isMuted = false
    this.setConnectionState(this.isPublishing ? 'connected' : 'listening')
    return { generation: this.generation, muted: false }
  }

  /**
   * Đổi trạng thái Mic (Toggle)
   */
  async toggleMic(): Promise<boolean> {
    if (!this.isPublishing) {
      return this.startPublishing()
    }
    if (this.isMuted) {
      this.unmute()
      return true
    } else {
      this.mute()
      return false
    }
  }

  /**
   * Đồng bộ Voice Registry từ RoomDO: tự động nghe các track của người khác
   */
  async syncRegistry(registry: VoiceParticipantState[]): Promise<void> {
    return this.signalingMutex.runExclusive(() => this.executeSyncRegistry(registry))
  }

  private async executeSyncRegistry(registry: VoiceParticipantState[]): Promise<void> {
    if (this.isDestroyed) return
    if (!registry || !Array.isArray(registry)) return
    this.currentRegistry = registry

    // If recovery is pending or rebuild is in-flight, do NOT opportunistically
    // initialize a listener session. Store currentRegistry and let recovery owner handle it.
    if (this.recoveryPending || this.rebuildInFlight) {
      return
    }

    const liveParticipants = registry.filter(
      (p) => p.actorKey !== this.currentActorKey && p.status === 'live',
    )

    // Nếu có người đang nói mà client chưa có session -> tự động mở session ở chế độ Listener
    if (liveParticipants.length > 0 && !this.sessionId) {
      await this.executeInitSession()
    }

    if (!this.sessionId || !this.pc || this.isDestroyed) return

    const activeKeys = new Set<string>()

    for (const p of registry) {
      if (p.actorKey === this.currentActorKey) continue

      if (p.status === 'live') {
        activeKeys.add(p.actorKey)
        const currentSub = this.subscribedTracks.get(p.actorKey)
        if (!currentSub || currentSub.trackName !== p.audioTrackId || currentSub.sessionId !== p.sessionId) {
          if (currentSub) {
            this.unsubscribeParticipant(p.actorKey)
          }
          await this.executeSubscribeToParticipant(p)
        }
      } else if (p.status === 'muted') {
        const audio = this.audioElements.get(p.actorKey)
        if (audio) {
          audio.pause()
        }
        this.speakingActors.delete(p.actorKey)
      }
    }

    // Dọn dẹp những ai không còn trong registry
    for (const [actorKey] of this.subscribedTracks) {
      if (!activeKeys.has(actorKey)) {
        this.unsubscribeParticipant(actorKey)
      }
    }
  }

  /**
   * Invariant 1 & 2: Transactional Subscription
   * Mọi mapping chỉ được commit SAU KHI toàn bộ renegotiation thành công.
   */
  private async executeSubscribeToParticipant(p: VoiceParticipantState): Promise<void> {
    if (this.isDestroyed || !this.sessionId || !this.pc) return
    if (!p.sessionId || !p.audioTrackId) return
    if (this.inFlightSubscriptions.has(p.actorKey)) return

    this.inFlightSubscriptions.add(p.actorKey)
    const localPcGen = this.pcGeneration

    try {
      const res = await fetch(`/api/rooms/${this.roomId}/voice/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          remoteSessionId: p.sessionId,
          remoteTrackName: p.audioTrackId,
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        tracks?: Array<{ location?: string; mid?: string; trackName?: string }>
        sessionDescription?: { type: RTCSdpType; sdp: string }
        requiresImmediateRenegotiation?: boolean
      } | null

      if (!res.ok || !data?.ok) {
        throw new Error(`Subscribe failed on server: ${res.status}`)
      }

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return

      // Xử lý renegotiation nếu Cloudflare trả về offer hoặc yêu cầu
      if (data.sessionDescription) {
        if (data.sessionDescription.type === 'offer' || data.requiresImmediateRenegotiation) {
          await this.waitForSignalingStateStable()
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
          const answer = await this.pc.createAnswer()
          await this.pc.setLocalDescription(answer)

          if (localPcGen !== this.pcGeneration || this.isDestroyed) return

          const renegRes = await fetch(`/api/rooms/${this.roomId}/voice/renegotiate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
              sessionId: this.sessionId,
              sessionDescription: {
                type: this.pc.localDescription?.type,
                sdp: this.pc.localDescription?.sdp,
              },
            }),
          })

          const renegData = (await renegRes.json().catch(() => null)) as {
            ok?: boolean
            sessionDescription?: { type: RTCSdpType; sdp: string }
          } | null

          if (!renegRes.ok || !renegData?.ok) {
            throw new Error(`Renegotiate during subscribe failed: ${renegRes.status}`)
          }

          if (localPcGen !== this.pcGeneration || this.isDestroyed) return

          if (renegData.sessionDescription) {
            await this.waitForSignalingStateStable()
            await this.pc.setRemoteDescription(new RTCSessionDescription(renegData.sessionDescription))
          }
        } else {
          await this.waitForSignalingStateStable()
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
        }
      }

      if (localPcGen !== this.pcGeneration || this.isDestroyed) return

      // ONLY COMMIT MAPPINGS NOW WHEN ENTIRE RENEGOTIATION HAS SUCCEEDED:
      const confirmedTrack = data.tracks?.[0]
      const mid = confirmedTrack?.mid
      if (mid) {
        this.midToActorMap.set(mid, p.actorKey)
      }
      this.trackToActorMap.set(p.audioTrackId, p.actorKey)

      this.subscribedTracks.set(p.actorKey, {
        sessionId: p.sessionId,
        trackName: p.audioTrackId,
        mid,
      })

      // Commit remote stream from confirmed receiver track
      const transceivers = this.pc.getTransceivers()
      const matchingTransceiver =
        (mid ? transceivers.find((t) => t.mid === mid) : null) ||
        transceivers.find((t) => t.direction === 'recvonly' || t.direction === 'sendrecv') ||
        transceivers[transceivers.length - 1]

      if (matchingTransceiver?.receiver?.track) {
        const remoteTrack = matchingTransceiver.receiver.track
        this.trackToActorMap.set(remoteTrack.id, p.actorKey)
        const stream = new MediaStream([remoteTrack])
        this.remoteStreams.set(p.actorKey, stream)
        this.attachAudioElement(p.actorKey, stream)
        this.attachSpeakingDetector(p.actorKey, stream)
        this.onRemoteTrack?.(p.actorKey, stream)
        this.emitState()
      }
    } catch (err) {
      console.warn(`Không thể subscribe track của ${p.actorKey}:`, err)
      // Rollback any provisional mapping on error
      this.subscribedTracks.delete(p.actorKey)
      this.trackToActorMap.delete(p.audioTrackId)
    } finally {
      this.inFlightSubscriptions.delete(p.actorKey)
    }
  }

  private unsubscribeParticipant(actorKey: string): void {
    const sub = this.subscribedTracks.get(actorKey)
    if (sub) {
      this.trackToActorMap.delete(sub.trackName)
      if (sub.mid) {
        this.midToActorMap.delete(sub.mid)
      }
      this.subscribedTracks.delete(actorKey)
    }

    const audio = this.audioElements.get(actorKey)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
      this.audioElements.delete(actorKey)
    }

    this.detachSpeakingDetector(actorKey)
    this.remoteStreams.delete(actorKey)
    this.onRemoteTrackRemoved?.(actorKey)
    this.emitState()
  }

  // ─── Speaking Detector (AudioContext RMS) ──────────────────────────────────

  private ensureAudioContext(): AudioContext | null {
    if (this.audioCtx) return this.audioCtx
    if (typeof window === 'undefined') return null

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null

    try {
      this.audioCtx = new AudioContextClass()
      return this.audioCtx
    } catch {
      return null
    }
  }

  private attachSpeakingDetector(key: string, stream: MediaStream): void {
    const ctx = this.ensureAudioContext()
    if (!ctx) return

    try {
      this.detachSpeakingDetector(key)
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      this.analysers.set(key, {
        source,
        analyser,
        lastSpokeAt: 0,
      })
    } catch (err) {
      console.warn(`Không thể gắn speaking detector cho ${key}:`, err)
    }
  }

  private detachSpeakingDetector(key: string): void {
    const entry = this.analysers.get(key)
    if (entry) {
      try {
        entry.source.disconnect()
      } catch {}
      this.analysers.delete(key)
    }
    this.speakingActors.delete(key)
  }

  private startSpeakingDetector(): void {
    if (this.speakingDetectorInterval) return
    const buffer = new Uint8Array(128)
    const THRESHOLD = 0.02
    const HYSTERESIS_MS = 400

    this.speakingDetectorInterval = setInterval(() => {
      if (this.analysers.size === 0) return
      const now = Date.now()
      let changed = false

      for (const [key, entry] of this.analysers) {
        if (key === 'local' && (this.isMuted || !this.isPublishing)) {
          if (this.speakingActors.has('local')) {
            this.speakingActors.delete('local')
            changed = true
          }
          continue
        }

        entry.analyser.getByteTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buffer.length)

        if (rms > THRESHOLD) {
          entry.lastSpokeAt = now
          if (!this.speakingActors.has(key)) {
            this.speakingActors.add(key)
            changed = true
          }
        } else if (now - entry.lastSpokeAt > HYSTERESIS_MS) {
          if (this.speakingActors.has(key)) {
            this.speakingActors.delete(key)
            changed = true
          }
        }
      }

      if (changed) {
        this.emitState()
      }
    }, 60)
  }

  // ─── Device Selection & replaceTrack ──────────────────────────────────────

  async setAudioInputDevice(deviceId: string): Promise<boolean> {
    this.currentInputDeviceId = deviceId
    if (!this.localStream || !this.localSender) return true

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const newTrack = newStream.getAudioTracks()[0]
      if (!newTrack) return false

      await this.localSender.replaceTrack(newTrack)

      if (this.localTrack) {
        this.localTrack.stop()
      }
      this.localTrack = newTrack
      this.localStream = newStream

      this.attachSpeakingDetector('local', newStream)
      this.emitState()
      return true
    } catch (err) {
      console.error('Lỗi chuyển thiết bị micro:', err)
      return false
    }
  }

  async setAudioOutputDevice(deviceId: string): Promise<boolean> {
    this.currentOutputDeviceId = deviceId
    for (const audio of this.audioElements.values()) {
      try {
        if (typeof (audio as unknown as { setSinkId?: (id: string) => Promise<void> }).setSinkId === 'function') {
          await (audio as unknown as { setSinkId: (id: string) => Promise<void> }).setSinkId(deviceId)
        }
      } catch (err) {
        console.warn('Không thể đặt output device:', err)
      }
    }
    this.emitState()
    return true
  }

  /**
   * Ngắt kết nối và giải phóng toàn bộ tài nguyên WebRTC / Audio
   */
  destroy(): void {
    this.isDestroyed = true
    this.intendedPublishing = false
    this.recoveryPending = false
    this.rebuildInFlight = false

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.disconnectGraceTimer) {
      clearTimeout(this.disconnectGraceTimer)
      this.disconnectGraceTimer = null
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('offline', this.handleOffline)
      window.removeEventListener('online', this.handleOnline)
    }

    if (this.speakingDetectorInterval) {
      clearInterval(this.speakingDetectorInterval)
      this.speakingDetectorInterval = null
    }

    // Dừng local stream
    if (this.localStream) {
      for (const t of this.localStream.getTracks()) {
        t.stop()
        this.lastLocalTrackState = {
          kind: t.kind,
          readyState: t.readyState,
          enabled: t.enabled,
        }
      }
      this.localStream = null
      this.localTrack = null
    }

    // Thông báo đóng track lên server nếu đang phát
    if (this.sessionId && this.isPublishing) {
      fetch(`/api/rooms/${this.roomId}/voice/close-track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          trackName: this.canonicalTrackName || 'audio_track',
          generation: this.generation,
        }),
      }).catch(() => {})
    }

    // Đóng PeerConnection
    if (this.pc) {
      try {
        this.pc.close()
      } catch {}
      this.lastPcConnectionState = 'closed'
      this.pc = null
    }

    // Dọn dẹp toàn bộ remote audio elements
    for (const audio of this.audioElements.values()) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
    }
    this.audioElements.clear()

    // Dọn dẹp analysers
    for (const entry of this.analysers.values()) {
      try {
        entry.source.disconnect()
      } catch {}
    }
    this.analysers.clear()
    this.speakingActors.clear()

    if (this.audioCtx) {
      try {
        this.audioCtx.close().catch(() => {})
      } catch {}
      this.audioCtx = null
    }

    this.remoteStreams.clear()
    this.subscribedTracks.clear()
    this.trackToActorMap.clear()
    this.midToActorMap.clear()

    this.isPublishing = false
    this.isMuted = false
    this.isConnecting = false
    this.sessionId = null
    this.setConnectionState('idle')

    if (typeof window !== 'undefined' && (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ === true) {
      ;(window as unknown as { __VOICE_CLEANUP_SNAPSHOT__?: unknown }).__VOICE_CLEANUP_SNAPSHOT__ = {
        localTrackReadyState: this.lastLocalTrackState?.readyState ?? 'ended',
        peerConnectionState: this.lastPcConnectionState ?? 'closed',
        isDestroyed: true,
      }
    }
  }
}
