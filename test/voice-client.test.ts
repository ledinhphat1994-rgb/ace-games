import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VoiceClient } from '../src/lib/voice-client'

describe('VoiceClient — Deterministic Device Replacement (replaceTrack) Invariants', () => {
  let originalNavigator: typeof globalThis.navigator

  beforeEach(() => {
    originalNavigator = globalThis.navigator
  })

  afterEach(() => {
    globalThis.navigator = originalNavigator
    vi.restoreAllMocks()
  })

  it('Invariants: replaceTrack called once, old track stopped only on success, generation unchanged, failure preserves old track', async () => {
    const oldTrackStop = vi.fn()
    const oldTrack = {
      id: 'old-track-id',
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: oldTrackStop,
    } as unknown as MediaStreamTrack

    const oldStream = {
      getTracks: () => [oldTrack],
      getAudioTracks: () => [oldTrack],
    } as unknown as MediaStream

    const newTrackStop = vi.fn()
    const newTrack = {
      id: 'new-track-id',
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: newTrackStop,
    } as unknown as MediaStream

    const newStream = {
      getTracks: () => [newTrack],
      getAudioTracks: () => [newTrack],
    } as unknown as MediaStream

    const replaceTrackMock = vi.fn().mockResolvedValue(undefined)
    const localSender = {
      replaceTrack: replaceTrackMock,
    } as unknown as RTCRtpSender

    const getUserMediaMock = vi.fn().mockResolvedValue(newStream)

    // Setup navigator.mediaDevices mock
    ;(globalThis as any).navigator = {
      mediaDevices: {
        getUserMedia: getUserMediaMock,
      },
    }

    const client = new VoiceClient({
      roomId: 7,
      currentActorKey: 'test.user',
    })

    // Simulate active published state
    ;(client as any).localStream = oldStream
    ;(client as any).localTrack = oldTrack
    ;(client as any).localSender = localSender
    ;(client as any).generation = 42

    const initialGen = client.getGeneration()
    expect(initialGen).toBe(42)

    // ── Test 1: Successful replaceTrack ──────────────────────────────────────
    const ok = await client.setAudioInputDevice('mic-device-2')

    expect(ok).toBe(true)
    // 1. getUserMedia was called with exact deviceId
    expect(getUserMediaMock).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.objectContaining({
          deviceId: { exact: 'mic-device-2' },
        }),
      }),
    )

    // 2. replaceTrack called exactly once with newTrack
    expect(replaceTrackMock).toHaveBeenCalledTimes(1)
    expect(replaceTrackMock).toHaveBeenCalledWith(newTrack)

    // 3. Old track stopped only after replaceTrack succeeded
    expect(oldTrackStop).toHaveBeenCalledTimes(1)

    // 4. Local track became newTrack
    expect((client as any).localTrack).toBe(newTrack)
    expect((client as any).localStream).toBe(newStream)

    // 5. Publication generation unchanged (no server renegotiation or duplicate publication)
    expect(client.getGeneration()).toBe(initialGen)

    // ── Test 2: Failure in replaceTrack preserves old track state ─────────────
    const failingReplaceTrackMock = vi.fn().mockRejectedValue(new Error('Hardware I/O failure in replaceTrack'))
    ;(client as any).localSender = { replaceTrack: failingReplaceTrackMock }

    const failingNewTrackStop = vi.fn()
    const failingNewTrack = {
      id: 'failing-track-id',
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: failingNewTrackStop,
    } as unknown as MediaStreamTrack

    getUserMediaMock.mockResolvedValueOnce({
      getTracks: () => [failingNewTrack],
      getAudioTracks: () => [failingNewTrack],
    } as unknown as MediaStream)

    // Reset stop call on current track (newTrack from Test 1)
    newTrackStop.mockClear()

    const failResult = await client.setAudioInputDevice('broken-device')

    // Returns false
    expect(failResult).toBe(false)
    expect(failingReplaceTrackMock).toHaveBeenCalledTimes(1)

    // Current active track was NOT stopped on failure!
    expect(newTrackStop).not.toHaveBeenCalled()

    // Current active track remains newTrack (usable and state truthful)
    expect((client as any).localTrack).toBe(newTrack)

    // Publication generation still unchanged
    expect(client.getGeneration()).toBe(initialGen)

    client.destroy()
  })

  it('Deterministic Reconnect: Snapshot before online must NOT cancel recovery; online executes rebuild and republishes with new generation', async () => {
    let sessionCallCount = 0
    let publishCallCount = 0

    // Setup global fetch mock
    const originalFetch = globalThis.fetch
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const urlStr = String(url)
      if (urlStr.includes('/voice/session')) {
        sessionCallCount++
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            sessionId: `session-id-${sessionCallCount}`,
            generation: sessionCallCount,
            sessionDescription: { type: 'answer', sdp: 'v=0...' },
          }),
        }
      }
      if (urlStr.includes('/voice/publish')) {
        publishCallCount++
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            canonicalTrackName: `track-pub-${publishCallCount}`,
            generation: publishCallCount,
            sessionDescription: { type: 'answer', sdp: 'v=0...' },
            tracks: [{ mid: '1', trackName: `track-pub-${publishCallCount}` }],
          }),
        }
      }
      if (urlStr.includes('/voice/subscribe')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            tracks: [{ mid: '0' }],
            sessionDescription: { type: 'offer', sdp: 'v=0...' },
          }),
        }
      }
      if (urlStr.includes('/voice/renegotiate')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      }
    })
    ;(globalThis as any).fetch = fetchMock

    // Setup mock RTCPeerConnection
    const originalRTCPeerConnection = (globalThis as any).RTCPeerConnection
    class MockRTCPeerConnection {
      signalingState = 'stable'
      connectionState = 'connected'
      iceConnectionState = 'connected'
      localDescription = { type: 'offer', sdp: 'v=0...' }
      remoteDescription: any = null
      private transceivers: any[] = []

      addTransceiver(trackOrKind: any, init?: any) {
        const mid = init?.direction === 'sendonly' ? '1' : '0'
        const transceiver = {
          mid,
          direction: init?.direction || 'recvonly',
          sender: { track: typeof trackOrKind === 'object' ? trackOrKind : null },
          receiver: { track: { id: 'remote-track-id', kind: 'audio', readyState: 'live' } },
        }
        this.transceivers.push(transceiver)
        return transceiver
      }

      getTransceivers() {
        return this.transceivers
      }

      async createOffer() {
        return { type: 'offer', sdp: 'v=0...' }
      }

      async createAnswer() {
        return { type: 'answer', sdp: 'v=0...' }
      }

      async setLocalDescription(desc: any) {
        this.localDescription = desc
      }

      async setRemoteDescription(desc: any) {
        this.remoteDescription = desc
      }

      close() {
        this.connectionState = 'closed'
        this.signalingState = 'closed'
      }

      addEventListener() {}
      removeEventListener() {}
    }
    ;(globalThis as any).RTCPeerConnection = MockRTCPeerConnection
    ;(globalThis as any).RTCSessionDescription = class {
      init: any
      constructor(init: any) {
        this.init = init
      }
    }
    const originalMediaStream = (globalThis as any).MediaStream
    ;(globalThis as any).MediaStream = class MockMediaStream {
      tracks: any[]
      constructor(tracks: any[] = []) {
        this.tracks = tracks
      }
      getTracks() { return this.tracks }
      getAudioTracks() { return this.tracks.filter((t: any) => t.kind === 'audio') }
    }

    const liveTrackStop = vi.fn()
    const liveTrack = {
      id: 'mic-track-1',
      kind: 'audio',
      readyState: 'live',
      enabled: true,
      stop: liveTrackStop,
    } as unknown as MediaStreamTrack

    const liveStream = {
      getTracks: () => [liveTrack],
      getAudioTracks: () => [liveTrack],
    } as unknown as MediaStream

    ;(globalThis as any).navigator = {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(liveStream),
      },
    }

    const client = new VoiceClient({
      roomId: 7,
      currentActorKey: 'member.user',
    })

    try {
      // 1. Client starts publishing initially
      const publishOk = await client.startPublishing()
      expect(publishOk).toBe(true)
      expect(client.state.isPublishing).toBe(true)
      expect(client.state.connectionState).toBe('connected')
      expect(client.getSessionId()).toBe('session-id-1')
      expect(client.getGeneration()).toBe(1)
      expect(publishCallCount).toBe(1)

      // 2. Network outage occurs -> failure entry semantics
      ;(client as any).handleConnectionFailure('network_offline')
      expect(client.state.connectionState).toBe('reconnecting')
      expect(client.state.isPublishing).toBe(false)
      expect((client as any).recoveryPending).toBe(true)
      expect((client as any).intendedPublishing).toBe(true)
      // Track is preserved (not stopped)
      expect(liveTrackStop).not.toHaveBeenCalled()

      // 3. RACE SCENARIO: Room WebSocket reconnects FIRST and sends snapshot -> syncRegistry() called BEFORE online handler
      await client.syncRegistry([
        { actorKey: 'host.user', ten: 'Host', status: 'live', sessionId: 'host-session', audioTrackId: 'host-track', generation: 1, updatedAt: Date.now() },
      ])

      // CRITICAL ASSERTION: Snapshot MUST NOT steal recovery ownership!
      // In the old bug, syncRegistry would create a listener session and flip connectionState to 'listening'
      // With the fix: recoveryPending remains true, connectionState remains 'reconnecting', and no premature listener session is created
      expect((client as any).recoveryPending).toBe(true)
      expect(client.state.connectionState).toBe('reconnecting')
      expect(client.state.isPublishing).toBe(false)
      expect(sessionCallCount).toBe(1) // Still old session, NOT opportunistically created

      // 4. Online event fires -> recovery owner executes rebuild
      ;(client as any).handleOnline()

      // Await completion of in-flight recovery
      await (client as any).signalingMutex.runExclusive(async () => {})

      // 5. Verification after recovery completes
      expect((client as any).recoveryPending).toBe(false)
      expect(client.getSessionId()).toBe('session-id-2')
      expect(client.getGeneration()).toBe(2)
      expect(client.getGeneration()).toBeGreaterThan(1)
      expect(client.state.isPublishing).toBe(true)
      expect(client.state.connectionState).toBe('connected')
      // Publish was called again for the new session
      expect(publishCallCount).toBe(2)
      // Local track still live and never stopped
      expect(liveTrackStop).not.toHaveBeenCalled()
    } finally {
      client.destroy()
      globalThis.fetch = originalFetch
      ;(globalThis as any).RTCPeerConnection = originalRTCPeerConnection
      ;(globalThis as any).MediaStream = originalMediaStream
    }
  })
})
