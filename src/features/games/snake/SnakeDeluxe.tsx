import { useCallback, useEffect, useRef, useState } from 'react'
import { BadgeCheck, CircleHelp, Loader2, Play, RotateCcw, ShieldAlert } from 'lucide-react'
import type { Direction } from '../../../../shared/games/snake'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { KICH_THUOC_BAN_DON } from '../board-size'
import { DPad } from '../SoloGameControls'
import {
  SnakeGameController,
  type SnakeVerificationStatus,
} from './SnakeGameController'

interface SnakeDeluxeProps {
  /** Gọi khi máy chủ chấm xong một ván (đã xác thực hoặc không) — để làm mới bảng xếp hạng. */
  onSettled?: () => void
}

const LY_DO_KET_THUC: Record<string, string> = {
  wall_collision: 'Rắn đâm vào tường — ván đấu kết thúc.',
  self_collision: 'Rắn cắn vào thân mình — ván đấu kết thúc.',
  victory: 'Chiến thắng tuyệt đối! Chúc mừng bạn.',
  aborted: 'Ván đấu đã bị huỷ.',
}

export function SnakeDeluxe({ onSettled }: SnakeDeluxeProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const [deathReason, setDeathReason] = useState<string | null>(null)
  const [engineLoading, setEngineLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<SnakeVerificationStatus>('idle')
  const [verifiedScore, setVerifiedScore] = useState<number | null>(null)

  const controllerRef = useRef<SnakeGameController | null>(null)
  const onSettledRef = useRef(onSettled)
  useEffect(() => {
    onSettledRef.current = onSettled
  }, [onSettled])

  // Touch gesture tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const getController = useCallback(() => {
    if (!controllerRef.current && containerRef.current) {
      controllerRef.current = new SnakeGameController({
        container: containerRef.current,
        onError: setLoadError,
        onScoreUpdate: (s) => setScore(s),
        onStatusChange: (status, vScore) => {
          setVerificationStatus(status)
          setVerifiedScore(vScore)
          if (status === 'verified' || status === 'unverified') onSettledRef.current?.()
        },
        onEngineLoadingChange: (loading) => setEngineLoading(loading),
        onStateChange: (state) => {
          setIsPlaying(state.isPlaying)
          setIsDead(state.isDead)
          setDeathReason(state.deathReason)
        },
      })
    }
    return controllerRef.current
  }, [])

  const startGame = useCallback(async () => {
    const ctrl = getController()
    if (ctrl) {
      await ctrl.start()
    }
  }, [getController])

  // Handle direct turn command from UI or touch
  const handleTurn = useCallback((dir: Direction) => {
    controllerRef.current?.handleTurn(dir)
  }, [])

  // Touch gesture listeners (swipe)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent page scrolling while swiping on the game area
      if (touchStartRef.current) {
        e.preventDefault()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      touchStartRef.current = null

      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const MIN_SWIPE = 20

      if (Math.max(absX, absY) < MIN_SWIPE) return

      if (absX > absY) {
        handleTurn(dx > 0 ? 'right' : 'left')
      } else {
        handleTurn(dy > 0 ? 'down' : 'up')
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    const cancelTouch = () => { touchStartRef.current = null }
    el.addEventListener('touchcancel', cancelTouch, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', cancelTouch)
    }
  }, [handleTurn])

  // Hidden tab aborts active ranked run immediately with deterministic elapsed time
  useEffect(() => {
    const handleVisibilityChange = () => {
      controllerRef.current?.handleVisibilityChange(document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Cleanup on component unmount only
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy()
      controllerRef.current = null
    }
  }, [])

  return (
    <div className="flex w-full flex-col items-center gap-4 select-none" style={KICH_THUOC_BAN_DON}>
      <div className="flex w-full items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-text-tertiary">Điểm</p>
          <p className="text-3xl leading-none font-semibold tracking-tight text-emerald-400 tabular-nums">
            {verifiedScore !== null ? verifiedScore : score}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TrangThaiXacThuc status={verificationStatus} />
          {!isPlaying ? (
            <Button size="sm" onClick={startGame} disabled={engineLoading}>
              {engineLoading ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
              {engineLoading ? 'Đang tải…' : isDead ? 'Chơi lại' : 'Bắt đầu'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startGame} disabled={engineLoading}>
              <RotateCcw />
              Chơi lại
            </Button>
          )}
        </div>
      </div>

      {loadError && <p role="alert" className="w-full rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">{loadError}</p>}

      {isDead && (
        <p
          role="status"
          className={cn(
            'w-full rounded-xl border px-3 py-2 text-center text-sm font-medium',
            deathReason === 'victory' ? 'border-success/30 bg-success-muted text-success' : 'border-border-default bg-surface text-text-secondary',
          )}
        >
          {(deathReason && LY_DO_KET_THUC[deathReason]) || 'Trò chơi kết thúc!'}
        </p>
      )}

      {/* Phaser Canvas Container (Zero CLS, fixed aspect) */}
      <div
        ref={containerRef}
        style={{ touchAction: 'none' }}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-[#0a0f1d] shadow-2xl shadow-black/30"
      >
        {!isPlaying && !isDead && (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Play className="size-5 fill-current" />
            </span>
            <p className="text-sm font-semibold text-text-primary">Rắn săn mồi</p>
            <p className="max-w-[220px] text-xs leading-relaxed text-text-tertiary">
              Bấm Bắt đầu, rồi dùng phím mũi tên, WASD hoặc vuốt trên màn hình để săn mồi.
            </p>
          </div>
        )}
      </div>

      <DPad onDir={handleTurn} />
    </div>
  )
}

function TrangThaiXacThuc({ status }: { status: SnakeVerificationStatus }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success">
        <BadgeCheck className="size-3.5" /> Đã xác thực
      </span>
    )
  }
  if (status === 'verifying') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
        <Loader2 className="size-3.5 animate-spin" /> Đang xác thực…
      </span>
    )
  }
  if (status === 'unverified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-medium text-destructive">
        <ShieldAlert className="size-3.5" /> Không xác thực được
      </span>
    )
  }
  if (status === 'practice') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-overlay px-2.5 py-1 text-xs font-medium text-text-secondary">
        <CircleHelp className="size-3.5" /> Luyện tập
      </span>
    )
  }
  return null
}
