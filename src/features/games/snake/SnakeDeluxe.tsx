import { useCallback, useEffect, useRef, useState } from 'react'
import { BadgeCheck, CircleHelp, Flame, Loader2, Play, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { Direction } from '../../../../shared/games/snake'
import { cn } from '@/lib/utils'
import { KICH_THUOC_BAN_DON } from '../board-size'
import { DPad } from '../SoloGameControls'
import { GamePlayToolbar } from '../GamePlayToolbar'
import {
  SnakeGameController,
  type SnakeVerificationStatus,
} from './SnakeGameController'

interface SnakeDeluxeProps {
  onBack?: () => void
  snakeTab?: 'duel' | 'classic'
  onTabChange?: (tab: 'duel' | 'classic') => void
  /** Gọi khi máy chủ chấm xong một ván (đã xác thực hoặc không) — để làm mới bảng xếp hạng. */
  onSettled?: () => void
}

const LY_DO_KET_THUC: Record<string, string> = {
  wall_collision: 'Rắn đâm vào tường — ván đấu kết thúc.',
  self_collision: 'Rắn cắn vào thân mình — ván đấu kết thúc.',
  victory: 'Chiến thắng tuyệt đối! Chúc mừng bạn.',
  aborted: 'Ván đấu đã bị huỷ.',
}

export function SnakeDeluxe({ onBack, onTabChange, onSettled }: SnakeDeluxeProps = {}) {
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
    <div className="flex flex-col items-center justify-between w-full h-full max-w-6xl mx-auto select-none transition-all">
      {/* ── 1. THANH CÔNG CỤ: cùng chuẩn với Đối kháng ── */}
      <GamePlayToolbar
        onBack={onBack}
        title="Rắn Săn Mồi"
        icon={<ShieldCheck className="size-4 text-emerald-400" />}
        badge="CỔ ĐIỂN"
        hideModeSelector={true}
        onReset={startGame}
        resetLabel={engineLoading ? 'Đang tải…' : isDead || isPlaying ? 'Chơi lại' : 'Bắt đầu'}
        resetIcon={engineLoading ? <Loader2 className="animate-spin size-3.5" /> : isDead || isPlaying ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
        resetDisabled={engineLoading}
        resetNoiBat={!isPlaying && !isDead}
        turnLabel=""
        hideCenterTurn={true}
        showRoomChat={false}
        showRankings={false}
        hideFullscreen={true}
        rightSlot={
          <div className="flex items-center gap-2">
            <TrangThaiXacThuc status={verificationStatus} />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-raised border border-border-default shadow-xs">
              <span className="text-[11px] font-medium text-text-tertiary">Điểm:</span>
              <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                {verifiedScore !== null ? verifiedScore : score}
              </span>
            </div>
          </div>
        }
        className="w-full shrink-0 px-1"
      />

      {/* ── BỘ CHUYỂN CHẾ ĐỘ ĐỐI KHÁNG | CỔ ĐIỂN CHUẨN DUY NHẤT ── */}
      {onTabChange && (
        <div className="my-1.5 flex w-full justify-center shrink-0" role="group" aria-label="Chế độ Rắn săn mồi">
          <div className="flex rounded-xl bg-surface-raised p-0.5 border border-border-default text-xs font-semibold">
            <button
              type="button"
              onClick={() => onTabChange('duel')}
              aria-pressed="false"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <Flame className="size-3.5" />
              <span>Đối kháng</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('classic')}
              aria-pressed="true"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs bg-brand text-primary-foreground shadow-xs font-semibold cursor-pointer"
            >
              <ShieldCheck className="size-3.5" />
              <span>Cổ điển</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 2. VÙNG TRÒ CHƠI PHASER CỔ ĐIỂN ── */}
      <div className="my-auto flex w-full min-w-0 flex-col items-center justify-center py-2" style={KICH_THUOC_BAN_DON}>
        {loadError && (
          <p role="alert" className="w-full mb-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
            {loadError}
          </p>
        )}

        {isDead && (
          <p
            role="status"
            className={cn(
              'w-full mb-3 rounded-xl border px-3 py-2 text-center text-sm font-medium',
              deathReason === 'victory'
                ? 'border-success/30 bg-success-muted text-success'
                : 'border-border-default bg-surface text-text-secondary',
            )}
          >
            {(deathReason && LY_DO_KET_THUC[deathReason]) || 'Trò chơi kết thúc!'}
          </p>
        )}

        {/* Phaser Canvas Container (Zero CLS, fixed aspect, touch-action none) */}
        <div
          ref={containerRef}
          style={{ touchAction: 'none' }}
          className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-[#0a0f1d] shadow-2xl shadow-black/30"
        >
          {!isPlaying && !isDead && (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center select-none pointer-events-none">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Play className="size-5 fill-current" />
              </span>
              <p className="text-sm font-semibold text-text-primary">Rắn Cổ Điển (Xác thực máy chủ)</p>
              <p className="max-w-[240px] text-xs leading-relaxed text-text-tertiary">
                Bấm Bắt đầu trên thanh điều khiển, rồi dùng phím mũi tên, WASD hoặc vuốt trên màn hình để săn mồi.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex w-full flex-col items-center">
          <DPad onDir={handleTurn} />
        </div>
      </div>
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
