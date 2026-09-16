import type { VoiceParticipantState } from '../../shared/protocol/room'

export interface VoiceClientState {
  isSupported: boolean
  isConnecting: boolean
  isPublishing: boolean
  isMuted: boolean
  hasError: boolean
  errorMessage: string | null
  blockedReason: string | null
  activeSpeakers: string[] // list of actorKeys
}

export interface VoiceClientOptions {
  roomId: number
  currentActorKey: string
  onStateChange?: (state: VoiceClientState) => void
  onRemoteTrack?: (actorKey: string, stream: MediaStream) => void
  onRemoteTrackRemoved?: (actorKey: string) => void
  onError?: (err: Error) => void
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

  private isPublishing = false
  private isMuted = false
  private isConnecting = false
  private generation = 0
  private blockedReason: string | null = null
  private errorMessage: string | null = null

  private subscribedTracks = new Map<string, { sessionId: string; trackName: string }>()
  private remoteStreams = new Map<string, MediaStream>()
  private audioElements = new Map<string, HTMLAudioElement>()
  private trackToActorMap = new Map<string, string>()

  constructor(options: VoiceClientOptions) {
    this.roomId = options.roomId
    this.currentActorKey = options.currentActorKey
    this.onStateChange = options.onStateChange
    this.onRemoteTrack = options.onRemoteTrack
    this.onRemoteTrackRemoved = options.onRemoteTrackRemoved
    this.onError = options.onError
  }

  get state(): VoiceClientState {
    const isSupported = typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia) && typeof RTCPeerConnection !== 'undefined'
    return {
      isSupported,
      isConnecting: this.isConnecting,
      isPublishing: this.isPublishing,
      isMuted: this.isMuted,
      hasError: Boolean(this.errorMessage),
      errorMessage: this.errorMessage,
      blockedReason: this.blockedReason,
      activeSpeakers: Array.from(this.remoteStreams.keys()),
    }
  }

  private emitState(): void {
    this.onStateChange?.(this.state)
  }

  /**
   * Khởi tạo WebRTC PeerConnection và SFU session
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

      let stream = event.streams[0]
      if (!stream) {
        stream = new MediaStream([track])
      }

      // Xác định actorKey từ map trackId
      const actorKey = this.trackToActorMap.get(track.id)
      if (actorKey) {
        this.remoteStreams.set(actorKey, stream)
        this.attachAudioElement(actorKey, stream)
        this.onRemoteTrack?.(actorKey, stream)
        this.emitState()
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.errorMessage = 'Kết nối WebRTC thất bại.'
        this.emitState()
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
      this.audioElements.set(actorKey, audio)
    }
    audio.srcObject = stream
    audio.play().catch((err) => {
      console.warn('Không thể tự động phát âm thanh phòng học:', err)
    })
  }

  /**
   * Khởi tạo Voice Session với Cloudflare Realtime SFU
   */
  async initSession(): Promise<boolean> {
    if (this.sessionId) return true

    this.isConnecting = true
    this.errorMessage = null
    this.emitState()

    try {
      const pc = await this.ensurePeerConnection()

      // Tạo transceivers nhận nếu chưa có
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

      const data = await res.json().catch(() => null) as any

      if (!res.ok || !data?.ok) {
        if (data?.code === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS' || res.status === 503) {
          this.blockedReason = 'Máy chủ chưa cấu hình Cloudflare Realtime credentials (App ID / Secret).'
          this.isConnecting = false
          this.emitState()
          return false
        }
        throw new Error(data?.loi || `Lỗi khởi tạo phiên thoại (${res.status}).`)
      }

      this.sessionId = data.sessionId
      if (data.sessionDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      this.isConnecting = false
      this.emitState()
      return true
    } catch (err: any) {
      this.isConnecting = false
      this.errorMessage = err?.message || 'Không thể kết nối đến máy chủ âm thanh.'
      this.onError?.(err)
      this.emitState()
      return false
    }
  }

  /**
   * Bật phát Micro cá nhân
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
      // Đảm bảo session SFU đã sẵn sàng
      const sessionOk = await this.initSession()
      if (!sessionOk || !this.sessionId || !this.pc) {
        this.isConnecting = false
        this.emitState()
        return false
      }

      // Xin quyền micro
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
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
      this.generation += 1

      // Thêm track vào PeerConnection
      this.localSender = this.pc.addTrack(track, stream)

      const offer = await this.pc.createOffer()
      await this.pc.setLocalDescription(offer)

      // Gửi yêu cầu publish tới server
      const res = await fetch(`/api/rooms/${this.roomId}/voice/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          sessionId: this.sessionId,
          trackName: track.id,
          mid: this.localSender.track?.id,
          generation: this.generation,
          sessionDescription: {
            type: this.pc.localDescription?.type,
            sdp: this.pc.localDescription?.sdp,
          },
        }),
      })

      const data = await res.json().catch(() => null) as any
      if (!res.ok || !data?.ok) {
        if (data?.code === 'BLOCKED_EXTERNAL_REALTIME_CREDENTIALS') {
          this.blockedReason = 'Cần cấu hình Cloudflare Realtime credentials để truyền phát âm thanh.'
          this.isConnecting = false
          this.emitState()
          return false
        }
        throw new Error(data?.loi || `Không thể đăng ký phát micro (${res.status}).`)
      }

      if (data.sessionDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }

      this.isPublishing = true
      this.isMuted = false
      this.isConnecting = false
      this.emitState()
      return true
    } catch (err: any) {
      this.isConnecting = false
      this.errorMessage = err?.message || 'Không thể bật micro.'
      this.onError?.(err)
      this.emitState()
      return false
    }
  }

  /**
   * Tắt tạm thời micro (Mute)
   */
  mute(): void {
    if (this.localTrack) {
      this.localTrack.enabled = false
    }
    this.isMuted = true
    this.emitState()
  }

  /**
   * Bật lại micro (Unmute)
   */
  unmute(): void {
    if (this.localTrack) {
      this.localTrack.enabled = true
    }
    this.isMuted = false
    this.emitState()
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
   * Đồng bộ Voice Registry từ RoomDO: tự động đăng ký nghe (subscribe) các track mới
   */
  async syncRegistry(registry: VoiceParticipantState[]): Promise<void> {
    if (!registry || !Array.isArray(registry)) return
    if (!this.sessionId || !this.pc) return

    const activeKeys = new Set<string>()

    for (const p of registry) {
      if (p.actorKey === this.currentActorKey) continue
      activeKeys.add(p.actorKey)

      if (p.status === 'live' && !this.subscribedTracks.has(p.actorKey)) {
        await this.subscribeToParticipant(p)
      } else if (p.status === 'muted' && this.audioElements.has(p.actorKey)) {
        const audio = this.audioElements.get(p.actorKey)
        if (audio) {
          audio.pause()
        }
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

    try {
      this.subscribedTracks.set(p.actorKey, { sessionId: p.sessionId, trackName: p.audioTrackId })
      this.trackToActorMap.set(p.audioTrackId, p.actorKey)

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

      const data = await res.json().catch(() => null) as any
      if (res.ok && data?.ok && data.sessionDescription) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.sessionDescription))
      }
    } catch (err) {
      console.warn(`Không thể subscribe track của ${p.actorKey}:`, err)
    }
  }

  private unsubscribeParticipant(actorKey: string): void {
    const sub = this.subscribedTracks.get(actorKey)
    if (sub) {
      this.trackToActorMap.delete(sub.trackName)
      this.subscribedTracks.delete(actorKey)
    }
    const audio = this.audioElements.get(actorKey)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
      this.audioElements.delete(actorKey)
    }
    this.remoteStreams.delete(actorKey)
    this.onRemoteTrackRemoved?.(actorKey)
    this.emitState()
  }

  /**
   * Ngắt kết nối và giải phóng toàn bộ tài nguyên WebRTC / Audio
   */
  destroy(): void {
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
          trackName: this.localTrack?.id || 'audio_track',
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
    for (const [, audio] of this.audioElements) {
      audio.pause()
      audio.srcObject = null
      audio.remove()
    }
    this.audioElements.clear()
    this.remoteStreams.clear()
    this.subscribedTracks.clear()
    this.trackToActorMap.clear()

    this.isPublishing = false
    this.isMuted = false
    this.isConnecting = false
    this.sessionId = null
    this.emitState()
  }
}
