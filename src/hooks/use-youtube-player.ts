import { useEffect, useRef, useState, useCallback } from 'react'
import type { MediaState } from '@shared/protocol/room'
import { loadYouTubeIframeAPI } from '../features/study/youtube-loader'
import { type YTPlayer, YT_PLAYER_STATE } from '../features/study/youtube-types'

export interface UseYouTubePlayerOptions {
  containerId: string
  mediaState: MediaState
  calculateTargetTime: () => number
  onUserIntent: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  volume: number
  canControlMedia: boolean
}

export interface UseYouTubePlayerReturn {
  isReady: boolean
  currentTime: number
  duration: number
  playbackRate: number
  availableRates: number[]
  rateWarning: string | null
  isAutoplayBlocked: boolean
  errorMessage: string | null
  handleUserPlay: () => void
  handleUserPause: () => void
  handleUserSeek: (targetSec: number) => void
  handleUserRate: (rate: number) => void
  handleDismissAutoplayBlock: () => void
  playerState: number
}

const DRIFT_TOLERANCE_SEC = 0.35
const HARD_SEEK_DRIFT_SEC = 1.5
const SEEK_COOLDOWN_MS = 1000
const NUDGE_COOLDOWN_MS = 1500
/** Còn chưa tới chừng này giây là coi như hết bài (dừng ở khung cuối, không phát lại). */
const HET_BAI_SEC = 0.5

export function useYouTubePlayer({
  containerId,
  mediaState,
  calculateTargetTime,
  onUserIntent,
  volume,
  canControlMedia,
}: UseYouTubePlayerOptions): UseYouTubePlayerReturn {
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [availableRates, setAvailableRates] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2])
  const [rateWarning, setRateWarning] = useState<string | null>(null)
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [playerState, setPlayerState] = useState<number>(YT_PLAYER_STATE.UNSTARTED)

  const playerRef = useRef<YTPlayer | null>(null)
  const isMountedRef = useRef(true)
  const isRemoteApplyRef = useRef(false)
  const lastSeekTimeRef = useRef<number>(0)
  const lastNudgeTimeRef = useRef<number>(0)
  const isNudgedRef = useRef(false)
  /** Người điều khiển đã báo máy chủ dừng ở cuối bài (tránh gửi lặp mỗi nhịp). */
  const daBaoHetRef = useRef(false)
  const currentVideoIdRef = useRef<string>(mediaState.videoId)

  const volumeRef = useRef(volume)
  const canControlMediaRef = useRef(canControlMedia)
  const onUserIntentRef = useRef(onUserIntent)

  useEffect(() => {
    volumeRef.current = volume
    canControlMediaRef.current = canControlMedia
    onUserIntentRef.current = onUserIntent
  })

  // ── 1. Initialize Player ───────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    let destroyed = false

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (!isMountedRef.current || destroyed) return

        const container = document.getElementById(containerId)
        if (!container) return

        // Clean any existing iframe inside container
        container.innerHTML = ''
        const playerDiv = document.createElement('div')
        playerDiv.id = `${containerId}_player`
        container.appendChild(playerDiv)

        playerRef.current = new YT.Player(playerDiv.id, {
          width: '100%',
          height: '100%',
          videoId: currentVideoIdRef.current,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event) => {
              if (!isMountedRef.current || destroyed) return
              const p = event.target
              setIsReady(true)
              p.setVolume(Math.max(0, Math.min(100, volumeRef.current)))
              const dur = p.getDuration()
              if (Number.isFinite(dur) && dur > 0) {
                setDuration(dur)
              }
              const cur = p.getCurrentTime()
              if (Number.isFinite(cur)) {
                setCurrentTime(cur)
              }

              if (p.getAvailablePlaybackRates) {
                try {
                  const rates = p.getAvailablePlaybackRates()
                  if (Array.isArray(rates) && rates.length > 0) {
                    setAvailableRates(rates)
                  }
                } catch {}
              }

              // Test-only read interface in DEV / E2E mode (read-only, no mutation/backdoors)
              if (import.meta.env.DEV || (typeof window !== 'undefined' && (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__)) {
                ;(window as unknown as { __YT_PLAYER_INSTANCE__?: unknown }).__YT_PLAYER_INSTANCE__ = {
                  getPlayerState: () => p.getPlayerState?.() ?? -1,
                  getCurrentTime: () => p.getCurrentTime?.() ?? 0,
                  getDuration: () => p.getDuration?.() ?? 0,
                  getPlaybackRate: () => p.getPlaybackRate?.() ?? 1,
                  getAvailablePlaybackRates: () => p.getAvailablePlaybackRates?.() ?? [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
                  getVideoData: () => (p as unknown as { getVideoData?: () => unknown }).getVideoData?.() ?? null,
                  isReady: true,
                }
              }
            },
            onStateChange: (event) => {
              if (!isMountedRef.current || destroyed) return
              setPlayerState(event.data)

              const p = event.target
              try {
                const dur = p.getDuration()
                if (Number.isFinite(dur) && dur > 0) {
                  setDuration(dur)
                }
              } catch {}
            },
            onError: (event) => {
              if (!isMountedRef.current || destroyed) return
              const errCode = event.data
              let msg = 'Không thể tải video YouTube này.'
              if (errCode === 2) msg = 'ID video YouTube không hợp lệ.'
              else if (errCode === 100) msg = 'Video không tồn tại hoặc đã bị xóa.'
              else if (errCode === 101 || errCode === 150) msg = 'Chủ sở hữu video chặn phát trên trang khác (chỉ xem được trên YouTube).'
              setErrorMessage(msg)
              // Video không phát được thì không phải trình duyệt chặn tự phát: bỏ lớp "Tiếp tục phát".
              setIsAutoplayBlocked(false)
              // Bị chặn nhúng (kể cả vì bản quyền, máy chủ không tự dò được): báo máy chủ nhớ để lần tìm / dán link sau bỏ qua.
              const idLoi = currentVideoIdRef.current
              if ((errCode === 101 || errCode === 150) && idLoi) {
                void fetch('/api/yt-check', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'same-origin',
                  body: JSON.stringify({ id: idLoi }),
                }).catch(() => {})
              }
            },
          },
        })
      })
      .catch((err: Error) => {
        if (!isMountedRef.current || destroyed) return
        setErrorMessage(err.message || 'Lỗi nạp YouTube API.')
      })

    return () => {
      destroyed = true
      isMountedRef.current = false
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {}
        playerRef.current = null
      }
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __YT_PLAYER_INSTANCE__?: unknown }).__YT_PLAYER_INSTANCE__
      }
      setIsReady(false)
    }
  }, [containerId]) // re-init only if containerId changes

  // ── 2. Handle Volume Updates ───────────────────────────────────────────────
  useEffect(() => {
    const p = playerRef.current
    if (isReady && p) {
      try {
        p.setVolume(Math.max(0, Math.min(100, volume)))
      } catch {}
    }
  }, [volume, isReady])

  // ── 3. Handle Video ID Switching ───────────────────────────────────────────
  useEffect(() => {
    const p = playerRef.current
    if (!isReady || !p) return

    if (currentVideoIdRef.current !== mediaState.videoId) {
      currentVideoIdRef.current = mediaState.videoId
      setErrorMessage(null)
      isRemoteApplyRef.current = true
      try {
        p.loadVideoById(mediaState.videoId, Math.max(0, mediaState.time))
        if (mediaState.status !== 'playing') {
          p.pauseVideo()
        }
      } catch {}
      setTimeout(() => {
        isRemoteApplyRef.current = false
      }, 500)
    }
  }, [mediaState.videoId, mediaState.status, mediaState.time, isReady])

  // ── 3.5. Handle Playback Rate Changes Immediately ──────────────────────────
  useEffect(() => {
    const p = playerRef.current
    if (!isReady || !p) return

    try {
      const canonicalRate = mediaState.playbackRate
      const available = p.getAvailablePlaybackRates?.() || [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
      if (Array.isArray(available) && available.length > 0) {
        setAvailableRates(available)
      }
      if (available.includes(canonicalRate)) {
        p.setPlaybackRate(canonicalRate)
        setRateWarning(null)
        queueMicrotask(() => {
          if (isMountedRef.current) setPlaybackRate(canonicalRate)
        })
      } else {
        const nearest = available.reduce((prev, curr) =>
          Math.abs(curr - canonicalRate) < Math.abs(prev - canonicalRate) ? curr : prev,
          1
        )
        p.setPlaybackRate(nearest)
        setRateWarning(`Tốc độ ${canonicalRate}x không được hỗ trợ trên video này; tự động dùng ${nearest}x.`)
        queueMicrotask(() => {
          if (isMountedRef.current) setPlaybackRate(nearest)
        })
      }
    } catch {}
  }, [mediaState.playbackRate, isReady])

  // ── 4. Player Convergence Loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !playerRef.current) return

    const interval = setInterval(() => {
      const p = playerRef.current
      if (!p || !isMountedRef.current) return
      // Video lỗi (bị chặn nhúng, đã xoá…): không thử phát / tua nữa.
      if (errorMessage) return

      let cur = 0
      let dur = 0
      try {
        cur = p.getCurrentTime()
        if (Number.isFinite(cur)) {
          setCurrentTime(cur)
        }
        dur = p.getDuration()
        if (Number.isFinite(dur) && dur > 0) {
          setDuration(dur)
        } else {
          dur = 0
        }
      } catch {
        return
      }

      const currentState = p.getPlayerState()
      const now = Date.now()

      // Target position derived from server canonical time + clock offset
      const targetTime = calculateTargetTime()
      const drift = targetTime - cur

      // Hết bài theo đồng hồ chung: dừng ở khung cuối. Không gọi playVideo — YouTube đang ENDED sẽ phát lại từ giây 0,
      // rồi bị tua quá cuối, rồi lại phát từ 0… (giật mãi ở giây đầu).
      const hetBai = dur > 0 && targetTime >= dur - HET_BAI_SEC
      if (!hetBai) daBaoHetRef.current = false
      if (mediaState.status === 'playing' && hetBai) {
        if (currentState !== YT_PLAYER_STATE.ENDED && dur - cur > HARD_SEEK_DRIFT_SEC && now - lastSeekTimeRef.current > SEEK_COOLDOWN_MS) {
          isRemoteApplyRef.current = true
          try {
            p.seekTo(dur, true)
            p.pauseVideo()
            lastSeekTimeRef.current = now
          } catch {}
          setTimeout(() => {
            isRemoteApplyRef.current = false
          }, 300)
        }
        // Người điều khiển báo máy chủ dừng ở cuối bài để cả phòng (và người vào sau) cùng dừng.
        if (canControlMediaRef.current && !daBaoHetRef.current) {
          daBaoHetRef.current = true
          onUserIntentRef.current('pause')
          onUserIntentRef.current('seek', dur)
        }
        return
      }

      if (mediaState.status === 'playing') {
        // A. If remote says playing but local is paused / cued / unstarted
        if (currentState !== YT_PLAYER_STATE.PLAYING && currentState !== YT_PLAYER_STATE.BUFFERING) {
          isRemoteApplyRef.current = true
          try {
            p.playVideo()
          } catch {}

          // Autoplay Block detection
          setTimeout(() => {
            if (!isMountedRef.current) return
            isRemoteApplyRef.current = false
            const stateAfter = p.getPlayerState()
            if (stateAfter !== YT_PLAYER_STATE.PLAYING && stateAfter !== YT_PLAYER_STATE.BUFFERING) {
              setIsAutoplayBlocked(true)
            }
          }, 800)
        }

        // B. Drift Correction
        const absDrift = Math.abs(drift)

        if (absDrift < DRIFT_TOLERANCE_SEC) {
          // In sync: restore canonical playback rate if previously nudged
          if (isNudgedRef.current && now - lastNudgeTimeRef.current > NUDGE_COOLDOWN_MS) {
            try {
              p.setPlaybackRate(mediaState.playbackRate)
              setPlaybackRate(mediaState.playbackRate)
              isNudgedRef.current = false
            } catch {}
          }
        } else if (absDrift < HARD_SEEK_DRIFT_SEC) {
          // Moderate drift: nudge rate smoothly without audio stutter
          if (now - lastNudgeTimeRef.current > NUDGE_COOLDOWN_MS) {
            try {
              const availableRates = p.getAvailablePlaybackRates() || [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
              const baseRate = mediaState.playbackRate
              let targetRate = baseRate

              if (drift > 0) {
                // Local is behind server target -> nudge faster
                const higherRates = availableRates.filter((r) => r > baseRate)
                targetRate = higherRates.length > 0 ? higherRates[0] : baseRate
              } else {
                // Local is ahead of server target -> nudge slower
                const lowerRates = availableRates.filter((r) => r < baseRate).reverse()
                targetRate = lowerRates.length > 0 ? lowerRates[0] : baseRate
              }

              if (targetRate !== p.getPlaybackRate()) {
                p.setPlaybackRate(targetRate)
                setPlaybackRate(targetRate)
                isNudgedRef.current = true
                lastNudgeTimeRef.current = now
              }
            } catch {}
          }
        } else {
          // Large drift >= 1.5s: hard seek to authoritative target
          if (now - lastSeekTimeRef.current > SEEK_COOLDOWN_MS) {
            isRemoteApplyRef.current = true
            try {
              p.seekTo(targetTime, true)
              if (currentState !== YT_PLAYER_STATE.PLAYING) {
                p.playVideo()
              }
              lastSeekTimeRef.current = now
            } catch {}
            setTimeout(() => {
              isRemoteApplyRef.current = false
            }, 300)
          }
        }
      } else {
        // Remote says paused
        if (currentState === YT_PLAYER_STATE.PLAYING) {
          isRemoteApplyRef.current = true
          try {
            p.pauseVideo()
          } catch {}
          setTimeout(() => {
            isRemoteApplyRef.current = false
          }, 200)
        }

        // If local paused position is drifted significantly from server paused time (không tua quá cuối bài)
        const mocDung = dur > 0 ? Math.min(mediaState.time, dur) : mediaState.time
        if (Math.abs(cur - mocDung) >= 1.0 && now - lastSeekTimeRef.current > SEEK_COOLDOWN_MS) {
          isRemoteApplyRef.current = true
          try {
            p.seekTo(mocDung, true)
            lastSeekTimeRef.current = now
          } catch {}
          setTimeout(() => {
            isRemoteApplyRef.current = false
          }, 300)
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [isReady, mediaState.status, mediaState.time, mediaState.playbackRate, calculateTargetTime, errorMessage])

  // ── 5. User Intent Handlers ────────────────────────────────────────────────
  const handleUserPlay = useCallback(() => {
    if (!canControlMedia) return
    // Đã hết bài: bấm phát là xem lại từ đầu.
    if (duration > 0 && mediaState.status !== 'playing' && mediaState.time >= duration - HET_BAI_SEC) {
      onUserIntent('seek', 0)
    }
    onUserIntent('play')
  }, [canControlMedia, onUserIntent, duration, mediaState.status, mediaState.time])

  const handleUserPause = useCallback(() => {
    if (!canControlMedia) return
    onUserIntent('pause')
  }, [canControlMedia, onUserIntent])

  const handleUserSeek = useCallback((targetSec: number) => {
    if (!canControlMedia) return
    const safeTarget = Math.max(0, targetSec)
    setCurrentTime(safeTarget)
    onUserIntent('seek', safeTarget)
  }, [canControlMedia, onUserIntent])

  const handleUserRate = useCallback((rate: number) => {
    if (!canControlMedia) return
    onUserIntent('rate', undefined, rate)
  }, [canControlMedia, onUserIntent])

  const handleDismissAutoplayBlock = useCallback(() => {
    const p = playerRef.current
    if (p) {
      isRemoteApplyRef.current = true
      try {
        p.seekTo(calculateTargetTime(), true)
        p.playVideo()
      } catch {}
      // Fallback: If strict browser autoplay policy rejects unmuted playback from an external overlay gesture,
      // mute and trigger playback so the video starts playing and syncs with the room immediately.
      setTimeout(() => {
        if (p) {
          const s = p.getPlayerState()
          if (s !== YT_PLAYER_STATE.PLAYING && s !== YT_PLAYER_STATE.BUFFERING) {
            try {
              p.mute()
              p.playVideo()
            } catch {}
          }
        }
      }, 150)
      setTimeout(() => {
        isRemoteApplyRef.current = false
      }, 500)
    }
    setIsAutoplayBlocked(false)
  }, [calculateTargetTime])

  return {
    isReady,
    currentTime,
    duration,
    playbackRate,
    availableRates,
    rateWarning,
    isAutoplayBlocked,
    errorMessage,
    handleUserPlay,
    handleUserPause,
    handleUserSeek,
    handleUserRate,
    handleDismissAutoplayBlock,
    playerState,
  }
}
