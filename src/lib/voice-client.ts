import type { VoiceParticipantState } from '../../shared/protocol/room'

export interface VoiceClientState {
  isSupported: boolean
  isConnecting: boolean
  isPublishing: boolean
  isMuted: boolean
  hasError: boolean
  errorMessage: string | null
  blockedReason: string | null
  activeSpeakers: string[] // list of actorKeys with active streams
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

export class VoiceClient {
  private roomId: number
  private currentActorKey: string
  private onStateChange?: (state: VoiceClientState) => void
  private onRemoteTrack?: (actorKey: string, stream: MediaStream) => void
  private onRemoteTrackRemoved?: (actorKey: string) => void
  private onError?: (err: Error) => void

  private pc: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private localTrack: MediaStreamTrack | null = null
  private localSender: RTCRtpSender | null = null
  private sessionId: string | null = null
  private canonicalTrackName: string | null = null

  private isPublishing = false
  private isMuted = false
  private isConnecting = false
  private generation = 0
  private blockedReason: string | null = null
  private errorMessage: string | null = null
  private isAudioAutoplayBlocked = false
  private currentInputDeviceId?: string
  private currentOutputDeviceId?: string

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

  constructor(options: VoiceClientOptions) {
    this.roomId = options.roomId
    this.currentActorKey = options.currentActorKey
    this.onStateChange = options.onStateChange
    this.onRemoteTrack = options.onRemoteTrack
    this.onRemoteTrackRemoved = options.onRemoteTrackRemoved
    this.onError = options.onError

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
      isConnecting: this.isConnecting,
      isPublishing: this.isPublishing,
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

  getSessionId(): string | null {
    return this.sessionId
  }

  private emitState(): void {
    this.onStateChange?.(this.state)
  }

  private setupE2EDiagnostics(): void {
    if (typeof window !== 'undefined' && (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ === true) {
      ;(window as unknown as { __VOICE_DIAGNOSTICS__?: unknown }).__VOICE_DIAGNOSTICS__ = {
        getState: () => this.state,
        getSessionId: () => this.sessionId,
        getGeneration: () => this.generation,
        getSubscribedTracks: () => Array.from(this.subscribedTracks.entries()),
        getMidToActorMap: () => Array.from(this.midToActorMap.entries()),
        getSpeakingActors: () => Array.from(this.speakingActors),
        unblockAutoplay: () => this.unblockAutoplay(),
        getStats: async () => {
          if (!this.pc) return []
          const stats = await this.pc.getStats()
          const result: Record<string, unknown>[] = []
          stats.forEach((report) => result.push({ ...report }))
          return result
        },
      }
    }
  }

  /**
   * Khởi tạo WebRTC PeerConnection
   */
  private async ensurePeerConnection(): Promise<RTCPeerConnection> {
    if (this.pc && this.pc.connectionState !== 'closed' && this.pc.connectionState !== 'failed') {
      return this.pc
    }

    if (typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt không hỗ trợ WebRTC RTCPeerConnection.')
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      bundlePolicy: 'max-bundle',
    })

    pc.ontrack = (event) => {
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
      if (pc.connectionState === 'failed') {
        this.errorMessage = 'Kết nối WebRTC thất bại.'
        this.emitState()
      } else if (pc.connectionState === 'disconnected') {
        console.warn('Kết nối WebRTC bị ngắt quãng.')
      }
    }

    this.pc = pc
    return pc
  }

  private attachAudioElement(actorKey: string, stream: MediaStream): void {
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
   * Giải phóng chặn Autoplay từ người dùng tương tác
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
    if (this.sessionId && this.pc && this.pc.connectionState !== 'closed') {
      return true
    }

    this.isConnecting = true
    this.errorMessage = null
    this.emitState()

    try {
      const pc = await this.ensurePeerConnection()

      // Thêm transceiver nhận nếu chưa có
      pc.addTransceiver('audio', { direction: 'recvonly' })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

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
          this.emitState()
          return false
        }
        throw new Error(data?.loi || `Lỗi khởi tạo phiên thoại (${res.status}).`)
      }

      this.sessionId = data.sessionId
      this.generation = typeof data.generation === 'number' ? data.generation : 1

      if (data.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      this.isConnecting = false
      this.emitState()
      return true
    } catch (err: unknown) {
      this.isConnecting = false
      this.errorMessage = (err as Error)?.message || 'Không thể kết nối đến máy chủ âm thanh.'
      this.onError?.(err as Error)
      this.emitState()
      return false
    }
  }

  /**
   * Bật phát Micro cá nhân (Sendonly Transceiver with confirmed MID)
   */
  async startPublishing(): Promise<boolean> {
    if (this.isPublishing && this.localTrack) {
      this.localTrack.enabled = true
      this.isMuted = false
      this.emitState()
      return true
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.errorMessage = 'Trình duyệt không hỗ trợ truy cập micro hoặc trang không chạy qua HTTPS.'
      this.emitState()
      return false
    }

    this.isConnecting = true
    this.errorMessage = null
    this.emitState()

    try {
      const sessionOk = await this.initSession()
      if (!sessionOk || !this.sessionId || !this.pc) {
        this.isConnecting = false
        this.emitState()
        return false
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.currentInputDeviceId ? { exact: this.currentInputDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })

      const track = stream.getAudioTracks()[0]
      if (!track) {
        throw new Error('Không tìm thấy luồng micro khả dụng.')
      }

      this.localStream = stream
      this.localTrack = track

      // Invariant: Thêm transceiver sendonly và lấy mid sau khi setLocalDescription
      const transceiver = this.pc.addTransceiver(track, {
        direction: 'sendonly',
        streams: [stream],
      })
      this.localSender = transceiver.sender

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

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
          this.emitState()
          return false
        }
        throw new Error(data?.loi || `Không thể đăng ký phát micro (${res.status}).`)
      }

      this.canonicalTrackName = data.canonicalTrackName || track.id
      if (typeof data.generation === 'number') {
        this.generation = data.generation
      }

      if (data.sessionDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      if (data.requiresImmediateRenegotiation) {
        await this.renegotiateSession()
      }

      this.attachSpeakingDetector('local', stream)

      this.isPublishing = true
      this.isMuted = false
      this.isConnecting = false
      this.emitState()
      return true
    } catch (err: unknown) {
      this.isConnecting = false
      this.errorMessage = (err as Error)?.message || 'Không thể bật micro.'
      this.onError?.(err as Error)
      this.emitState()
      return false
    }
  }

  /**
   * Tái đàm phán Session khi Cloudflare yêu cầu (Renegotiation cycle)
   */
  private async renegotiateSession(): Promise<void> {
    if (!this.pc || !this.sessionId) return
    try {
      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

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

      if (res.ok && data?.ok && data.sessionDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }
    } catch (err) {
      console.warn('Lỗi tái đàm phán session:', err)
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
    this.emitState()
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
    this.emitState()
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
    if (!registry || !Array.isArray(registry)) return

    const liveParticipants = registry.filter(
      (p) => p.actorKey !== this.currentActorKey && p.status === 'live',
    )

    // Nếu có người đang nói mà client chưa có session -> tự động mở session ở chế độ Listener
    if (liveParticipants.length > 0 && !this.sessionId) {
      await this.initSession()
    }

    if (!this.sessionId || !this.pc) return

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
          await this.subscribeToParticipant(p)
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

  private async subscribeToParticipant(p: VoiceParticipantState): Promise<void> {
    if (!this.sessionId || !this.pc) return
    if (this.inFlightSubscriptions.has(p.actorKey)) return

    this.inFlightSubscriptions.add(p.actorKey)

    try {
      // Chuẩn bị transceiver nhận luồng từ xa
      this.pc.addTransceiver('audio', { direction: 'recvonly' })

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      const res = await fetch(`/api/rooms/${this.roomId}/voice/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          remoteSessionId: p.sessionId,
          remoteTrackName: p.audioTrackId,
          sessionDescription: {
            type: this.pc.localDescription?.type,
            sdp: this.pc.localDescription?.sdp,
          },
        }),
      })

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        tracks?: Array<{ location?: string; mid?: string; trackName?: string }>
        sessionDescription?: { type: RTCSdpType; sdp: string }
        requiresImmediateRenegotiation?: boolean
      } | null

      if (!res.ok || !data?.ok) {
        return
      }

      // Map transceiver mid và track name vào actorKey
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

      if (data.sessionDescription) {
        if (data.sessionDescription.type === 'offer' || data.requiresImmediateRenegotiation) {
          // Cloudflare gửi offer -> client tạo answer và gửi /renegotiate
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
          const answer = await this.pc.createAnswer()
          await this.pc.setLocalDescription(answer)

          await fetch(`/api/rooms/${this.roomId}/voice/renegotiate`, {
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
        } else {
          await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
        }
      }
    } catch (err) {
      console.warn(`Không thể subscribe track của ${p.actorKey}:`, err)
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
    if (this.speakingDetectorInterval) {
      clearInterval(this.speakingDetectorInterval)
      this.speakingDetectorInterval = null
    }

    // Dừng local stream
    if (this.localStream) {
      for (const t of this.localStream.getTracks()) {
        t.stop()
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
      this.pc.close()
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
    this.emitState()
  }
}
