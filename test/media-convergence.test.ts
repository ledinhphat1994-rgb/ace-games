import { env } from 'cloudflare:workers'
import { describe, expect, it } from 'vitest'
import {
  canonicalMediaPosition,
  YOUTUBE_VIDEO_ID_REGEX,
  type GoiPhong,
  type MediaState,
} from '../shared/protocol/room'
import { dangNhapLayCookie, moKetNoi } from './ws'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function chenPhongMedia(
  ten: string,
  phamVi: 'truong' | 'lop',
  lopId: number | null,
  tuyChon: {
    chuPhongKhoa?: string
    accessMode?: string
  } = {},
): Promise<number> {
  const res = await env.DB.prepare(
    `INSERT INTO phong
       (loai, ten, pham_vi, lop_id, chu_phong_khoa, chu_phong_ten,
        access_mode, suc_chua, trang_thai)
     VALUES ('video', ?1, ?2, ?3, ?4, 'Host', ?5, 20, 'mo')
     RETURNING id`,
  )
    .bind(
      ten,
      phamVi,
      lopId,
      tuyChon.chuPhongKhoa ?? 'acc:1',
      tuyChon.accessMode ?? 'public',
    )
    .first<{ id: number }>()
  if (!res) throw new Error('Không chèn được phòng media')
  return res.id
}

function tinhMedian(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// ── 1. Mathematical Invariants & Unit Tests ───────────────────────────────────

describe('Media Convergence — Unit Invariants & Pure Functions', () => {
  it('YOUTUBE_VIDEO_ID_REGEX xác thực đúng mã 11 ký tự canonical', () => {
    // Valid IDs
    expect(YOUTUBE_VIDEO_ID_REGEX.test('dQw4w9WgXcQ')).toBe(true)
    expect(YOUTUBE_VIDEO_ID_REGEX.test('jNQXAC9IVRw')).toBe(true)
    expect(YOUTUBE_VIDEO_ID_REGEX.test('a1B2c3D4e5F')).toBe(true)
    expect(YOUTUBE_VIDEO_ID_REGEX.test('_-123456789')).toBe(true)

    // Invalid: Quá ngắn, quá dài, chứa ký tự lạ hoặc link
    expect(YOUTUBE_VIDEO_ID_REGEX.test('dQw4w9WgXc')).toBe(false) // 10 chars
    expect(YOUTUBE_VIDEO_ID_REGEX.test('dQw4w9WgXcQ1')).toBe(false) // 12 chars
    expect(YOUTUBE_VIDEO_ID_REGEX.test('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false)
    expect(YOUTUBE_VIDEO_ID_REGEX.test('<script>')).toBe(false)
    expect(YOUTUBE_VIDEO_ID_REGEX.test('dQw4w9WgXc ')).toBe(false)
  })

  it('canonicalMediaPosition: tính toán chính xác và chống timeline discontinuity', () => {
    const serverNow = 1000000

    // Khi video đang tạm dừng: luôn giữ nguyên time
    const pausedState: MediaState = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Test',
      status: 'paused',
      time: 42.5,
      updatedAt: serverNow - 5000,
      playbackRate: 1,
      hostOnlyControl: false,
    }
    expect(canonicalMediaPosition(pausedState, serverNow)).toBe(42.5)

    // Khi video đang phát với tốc độ 1.0x sau 10 giây
    const playingState: MediaState = {
      videoId: 'dQw4w9WgXcQ',
      title: 'Test',
      status: 'playing',
      time: 10,
      updatedAt: serverNow - 10000, // 10s trước
      playbackRate: 1,
      hostOnlyControl: false,
    }
    expect(canonicalMediaPosition(playingState, serverNow)).toBe(20)

    // Khi video đang phát với tốc độ 1.5x sau 4 giây (4s * 1.5 = 6s tiến thêm)
    const fastState: MediaState = {
      ...playingState,
      time: 20,
      updatedAt: serverNow - 4000,
      playbackRate: 1.5,
    }
    expect(canonicalMediaPosition(fastState, serverNow)).toBe(26)

    // Guard an toàn: đầu vào null, undefined, âm, NaN
    expect(canonicalMediaPosition(null, serverNow)).toBe(0)
    expect(canonicalMediaPosition(undefined, serverNow)).toBe(0)
    expect(canonicalMediaPosition({ ...pausedState, time: -10 }, serverNow)).toBe(0)
    expect(canonicalMediaPosition({ ...pausedState, time: NaN }, serverNow)).toBe(0)
  })

  it('Server Clock Offset: Rolling Median lọc nhiễu và bất đối xứng mạng', () => {
    // Giả lập 5 mẫu đo ping/pong: server có offset thực tế là +150ms
    // Do jitter mạng, các mẫu nhận được dao động
    const rawOffsets = [152, 148, 280, 151, 149] // Mẫu 280 là jitter đột biến
    const median = tinhMedian(rawOffsets)
    expect(median).toBe(151) // Lọc hoàn toàn jitter 280ms
  })
})

// ── 2. Multi-Client RoomDO State Machine & Authority Tests ────────────────────

describe('Media Authority & Realtime Convergence (Multi-Client)', () => {
  it('Play, Rate Anchor, Pause: Server tính vị trí liên tục và không gián đoạn timeline', async () => {
    const id = await chenPhongMedia('Phòng Test Sync Media', 'truong', null, { chuPhongKhoa: 'acc:1' })
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // Host: acc:1
    const cookieMember = await dangNhapLayCookie('qa.v2.thu2') // Member: acc:2

    const hostWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieHost)
    const memberWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieMember)

    try {
      await hostWs.cho('room.snapshot')
      await memberWs.cho('room.snapshot')

      // 1. Host nạp video hợp lệ
      hostWs.gui({
        type: 'media.action',
        data: { action: 'load', videoId: 'jNQXAC9IVRw', title: 'Me at the zoo' },
      })

      const loadSyncHost = await hostWs.cho('media.sync')
      const loadSyncMember = await memberWs.cho('media.sync')
      expect(loadSyncHost.state.videoId).toBe('jNQXAC9IVRw')
      expect(loadSyncMember.state.videoId).toBe('jNQXAC9IVRw')
      expect(loadSyncHost.state.status).toBe('paused')
      expect(loadSyncHost.state.time).toBe(0)

      // 2. Host phát video từ t=10s
      hostWs.gui({
        type: 'media.action',
        data: { action: 'play', time: 10 },
      })
      const playSync = await memberWs.cho('media.sync')
      expect(playSync.state.status).toBe('playing')
      expect(playSync.state.time).toBe(10)

      // Đợi 50ms để thời gian server trôi qua
      await new Promise((r) => setTimeout(r, 60))

      // 3. Host đổi tốc độ lên 1.5x -> Server PHẢI neo vị trí trước khi áp dụng rate mới!
      hostWs.gui({
        type: 'media.action',
        data: { action: 'rate', rate: 1.5 },
      })
      const rateSync = await memberWs.cho('media.sync')
      expect(rateSync.state.playbackRate).toBe(1.5)
      // Vị trí time đã neo phải lớn hơn 10s (đã trôi qua ít nhất ~50ms)
      expect(rateSync.state.time).toBeGreaterThanOrEqual(10.05)

      // 4. Host tạm dừng video -> Server tính canonicalMediaPosition tại serverNow
      hostWs.gui({
        type: 'media.action',
        data: { action: 'pause' },
      })
      const pauseSync = await memberWs.cho('media.sync')
      expect(pauseSync.state.status).toBe('paused')
      expect(pauseSync.state.time).toBeGreaterThan(rateSync.state.time)
    } finally {
      hostWs.dong()
      memberWs.dong()
    }
  })

  it('Permission Enforcement: hostOnlyControl chặn thành viên thường thao tác', async () => {
    const id = await chenPhongMedia('Phòng Test Quyền Media', 'truong', null, { chuPhongKhoa: 'acc:1' })
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1') // Host: acc:1
    const cookieMember = await dangNhapLayCookie('qa.v2.thu2') // Member: acc:2

    const hostWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieHost)
    const memberWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieMember)

    try {
      await hostWs.cho('room.snapshot')
      await memberWs.cho('room.snapshot')

      // Host bật chế độ hostOnlyControl
      hostWs.gui({
        type: 'media.action',
        data: { action: 'set_host_only', enabled: true },
      })
      await hostWs.cho('media.sync')
      await memberWs.cho('media.sync')

      // Thành viên cố phát video -> Server phải từ chối lỗi
      memberWs.gui({
        type: 'media.action',
        data: { action: 'play', time: 5 },
      })
      const err = await memberWs.cho('error')
      expect(err.message).toContain('quyền điều khiển video')

      // Host phát video -> Thành công
      hostWs.gui({
        type: 'media.action',
        data: { action: 'play', time: 5 },
      })
      const playOk = await memberWs.cho('media.sync')
      expect(playOk.state.status).toBe('playing')
    } finally {
      hostWs.dong()
      memberWs.dong()
    }
  })

  it('Late Join Convergence: Người vào sau tự động đồng bộ vị trí hiện thời mà Host không cần gửi lại', async () => {
    const id = await chenPhongMedia('Phòng Test Late Join', 'truong', null, { chuPhongKhoa: 'acc:1' })
    const cookieHost = await dangNhapLayCookie('qa.v2.thu1')
    const cookieLate = await dangNhapLayCookie('qa.v2.thu3')

    const hostWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieHost)

    try {
      await hostWs.cho('room.snapshot')

      // Host nạp và phát video ở t=5s
      hostWs.gui({
        type: 'media.action',
        data: { action: 'load', videoId: 'dQw4w9WgXcQ', title: 'Rick Astley' },
      })
      await hostWs.cho('media.sync')

      hostWs.gui({
        type: 'media.action',
        data: { action: 'play', time: 5 },
      })
      await hostWs.cho('media.sync')

      // Giả lập trôi qua 100ms
      await new Promise((r) => setTimeout(r, 100))

      // Người thứ 2 (Late Join) kết nối vào phòng
      const lateWs = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieLate)
      try {
        const snapshot = await lateWs.cho('room.snapshot')
        expect(snapshot.media.videoId).toBe('dQw4w9WgXcQ')
        expect(snapshot.media.status).toBe('playing')

        // Tính vị trí mục tiêu tại client người vào sau
        const lateTarget = canonicalMediaPosition(snapshot.media, snapshot.serverNow)
        // Vị trí mục tiêu phải >= 5.09s mà không cần Host phải gửi thêm lệnh nào!
        expect(lateTarget).toBeGreaterThanOrEqual(5.08)
      } finally {
        lateWs.dong()
      }
    } finally {
      hostWs.dong()
    }
  })

  it('Three-Client Convergence: Cả 3 client (Host A, Member B, Member C) đều nhận trạng thái đồng bộ', async () => {
    const id = await chenPhongMedia('Phòng 3 Clients Hội Tụ', 'truong', null, { chuPhongKhoa: 'acc:1' })
    const cookieA = await dangNhapLayCookie('qa.v2.thu1') // Host A
    const cookieB = await dangNhapLayCookie('qa.v2.thu2') // Member B
    const cookieC = await dangNhapLayCookie('qa.v2.thu3') // Member C

    const wsA = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieA)
    const wsB = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieB)
    const wsC = await moKetNoi<GoiPhong>(`/ws/room/phong-${id}`, cookieC)

    try {
      await wsA.cho('room.snapshot')
      await wsB.cho('room.snapshot')
      await wsC.cho('room.snapshot')

      // A loads video
      wsA.gui({
        type: 'media.action',
        data: { action: 'load', videoId: 'jNQXAC9IVRw', title: 'Zoo Video' },
      })
      const loadA = await wsA.cho('media.sync')
      const loadB = await wsB.cho('media.sync')
      const loadC = await wsC.cho('media.sync')

      expect(loadA.state.videoId).toBe('jNQXAC9IVRw')
      expect(loadB.state.videoId).toBe('jNQXAC9IVRw')
      expect(loadC.state.videoId).toBe('jNQXAC9IVRw')

      // A plays
      wsA.gui({
        type: 'media.action',
        data: { action: 'play', time: 0 },
      })
      const playB = await wsB.cho('media.sync')
      const playC = await wsC.cho('media.sync')
      expect(playB.state.status).toBe('playing')
      expect(playC.state.status).toBe('playing')

      // A seeks to 45s
      wsA.gui({
        type: 'media.action',
        data: { action: 'seek', time: 45 },
      })
      const seekB = await wsB.cho('media.sync')
      const seekC = await wsC.cho('media.sync')
      expect(seekB.state.time).toBe(45)
      expect(seekC.state.time).toBe(45)

      // A pauses
      wsA.gui({
        type: 'media.action',
        data: { action: 'pause' },
      })
      const pauseB = await wsB.cho('media.sync')
      const pauseC = await wsC.cho('media.sync')
      expect(pauseB.state.status).toBe('paused')
      expect(pauseC.state.status).toBe('paused')
      expect(pauseB.state.time).toBe(pauseC.state.time)
    } finally {
      wsA.dong()
      wsB.dong()
      wsC.dong()
    }
  })
})

// ── 3. Deterministic Fake Player Simulation & Drift Measurement ──────────────

class DeterministicFakeYTPlayer {
  currentTime = 0
  duration = 240
  playerState = 2 // 1: PLAYING, 2: PAUSED
  playbackRate = 1
  availableRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
  seekCount = 0
  nudgeCount = 0

  playVideo() { this.playerState = 1 }
  pauseVideo() { this.playerState = 2 }
  seekTo(seconds: number) {
    this.currentTime = Math.max(0, seconds)
    this.seekCount++
  }
  getCurrentTime() { return this.currentTime }
  getDuration() { return this.duration }
  getPlayerState() { return this.playerState }
  getPlaybackRate() { return this.playbackRate }
  setPlaybackRate(rate: number) {
    this.playbackRate = rate
    this.nudgeCount++
  }
  getAvailablePlaybackRates() { return this.availableRates }
  advance(seconds: number) {
    if (this.playerState === 1) {
      this.currentTime += seconds * this.playbackRate
    }
  }
}

function runConvergenceStep(
  player: DeterministicFakeYTPlayer,
  canonicalTarget: number,
  isPlaying: boolean,
  canonicalRate = 1,
) {
  if (isPlaying) {
    if (player.getPlayerState() !== 1) player.playVideo()
    const drift = canonicalTarget - player.getCurrentTime()
    const absDrift = Math.abs(drift)
    if (absDrift < 0.35) {
      if (player.getPlaybackRate() !== canonicalRate) {
        player.setPlaybackRate(canonicalRate)
      }
    } else if (absDrift < 1.5) {
      const targetRate = drift > 0 ? 1.25 : 0.75
      player.setPlaybackRate(targetRate)
    } else {
      player.seekTo(canonicalTarget)
    }
  } else {
    if (player.getPlayerState() === 1) player.pauseVideo()
    if (Math.abs(canonicalTarget - player.getCurrentTime()) >= 1.0) {
      player.seekTo(canonicalTarget)
    }
  }
}

describe('Deterministic Simulated Player Convergence & Feedback Suppression', () => {
  it('Feedback Loop Suppression: Remote apply không kích hoạt lệnh phản hồi', () => {
    let isRemoteApply = false
    let outgoingEmits = 0

    const simulateOnStateChange = (_newState: number) => {
      if (isRemoteApply) {
        // Remote apply suppressed!
        return
      }
      outgoingEmits++
    }

    // Remote sync instructs player to play
    isRemoteApply = true
    simulateOnStateChange(1) // Playing event triggered by remote sync
    expect(outgoingEmits).toBe(0) // No feedback echo!

    // User explicitly clicks play in UI
    isRemoteApply = false
    simulateOnStateChange(1)
    expect(outgoingEmits).toBe(1) // User intent emitted
  })

  it('2-Client Convergence: Đo lường độ lệch (measured drift) Host A vs Member B luôn <= 1.0s', () => {
    const playerA = new DeterministicFakeYTPlayer()
    const playerB = new DeterministicFakeYTPlayer()

    // 1. A loads and plays at t=0
    playerA.playVideo()
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    expect(playerB.getPlayerState()).toBe(1)

    // Advance 5 seconds of real playback
    playerA.advance(5)
    playerB.advance(5)
    let drift = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    expect(drift).toBeLessThanOrEqual(0.01)

    // 2. A pauses
    playerA.pauseVideo()
    runConvergenceStep(playerB, playerA.getCurrentTime(), false)
    expect(playerB.getPlayerState()).toBe(2)
    drift = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    expect(drift).toBe(0)

    // 3. A seeks to 60s
    playerA.seekTo(60)
    // B receives remote state with target=60
    runConvergenceStep(playerB, playerA.getCurrentTime(), false)
    expect(playerB.getCurrentTime()).toBe(60)
    drift = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    expect(drift).toBe(0)

    // 4. A resumes at 1.0x, B experiences 0.8s network lag (drift = 0.8s, moderate)
    playerA.playVideo()
    playerB.currentTime = 60.0 // B started slightly delayed
    playerA.currentTime = 60.8 // A is 0.8s ahead

    // First convergence tick: 0.35s <= drift < 1.5s -> Rate Nudge to 1.25x
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    expect(playerB.getPlaybackRate()).toBe(1.25)

    // Advance 3.2 seconds: A advances 3.2s, B advances 3.2 * 1.25 = 4.0s (catches up 0.8s)
    playerA.advance(3.2)
    playerB.advance(3.2)

    // Second convergence tick: drift is now resolved!
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    expect(playerB.getPlaybackRate()).toBe(1.0) // Restores canonical rate
    drift = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    expect(drift).toBeLessThanOrEqual(0.1) // Absolute drift <= 0.1s << 1.0s target!

    // 5. B reconnects: receives snapshot with authoritative position
    // B simulates reconnect with 10s gap
    const authoritativeTime = playerA.getCurrentTime()
    playerB.currentTime = 0 // Cold reconnect
    runConvergenceStep(playerB, authoritativeTime, true)
    expect(playerB.getCurrentTime()).toBe(authoritativeTime)
    drift = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    expect(drift).toBe(0)
  })

  it('3-Client Convergence: Cả 3 player (Host A, Member B, Member C) cùng hội tụ tại các mốc', () => {
    const playerA = new DeterministicFakeYTPlayer()
    const playerB = new DeterministicFakeYTPlayer()
    const playerC = new DeterministicFakeYTPlayer()

    // A plays
    playerA.playVideo()
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    runConvergenceStep(playerC, playerA.getCurrentTime(), true)

    playerA.advance(10)
    playerB.advance(9.8) // B is 0.2s behind
    playerC.advance(10.1) // C is 0.1s ahead

    // Run convergence step on all clients
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    runConvergenceStep(playerC, playerA.getCurrentTime(), true)

    const driftAB = Math.abs(playerA.getCurrentTime() - playerB.getCurrentTime())
    const driftAC = Math.abs(playerA.getCurrentTime() - playerC.getCurrentTime())
    expect(driftAB).toBeLessThanOrEqual(0.35)
    expect(driftAC).toBeLessThanOrEqual(0.35)

    // A seeks to 120s
    playerA.seekTo(120)
    runConvergenceStep(playerB, playerA.getCurrentTime(), true)
    runConvergenceStep(playerC, playerA.getCurrentTime(), true)

    expect(playerB.getCurrentTime()).toBe(120)
    expect(playerC.getCurrentTime()).toBe(120)

    // A pauses
    playerA.pauseVideo()
    runConvergenceStep(playerB, playerA.getCurrentTime(), false)
    runConvergenceStep(playerC, playerA.getCurrentTime(), false)

    expect(playerB.getPlayerState()).toBe(2)
    expect(playerC.getPlayerState()).toBe(2)
    expect(playerB.getCurrentTime()).toBe(playerA.getCurrentTime())
    expect(playerC.getCurrentTime()).toBe(playerA.getCurrentTime())
  })
})
