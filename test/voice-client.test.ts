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
})
