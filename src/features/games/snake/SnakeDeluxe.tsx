import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { Direction } from '../../../../shared/games/snake'
import {
  SnakeGameController,
  type SnakeVerificationStatus,
} from './SnakeGameController'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SnakeDeluxeProps {}

export function SnakeDeluxe(_props?: SnakeDeluxeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDead, setIsDead] = useState(false)
  const [deathReason, setDeathReason] = useState<string | null>(null)
  const [engineLoading, setEngineLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<SnakeVerificationStatus>('idle')
  const [verifiedScore, setVerifiedScore] = useState<number | null>(null)

  const controllerRef = useRef<SnakeGameController | null>(null)

  // Touch gesture tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const getController = useCallback(() => {
    if (!controllerRef.current && containerRef.current) {
      controllerRef.current = new SnakeGameController({
        container: containerRef.current,
        onScoreUpdate: (s) => setScore(s),
        onStatusChange: (status, vScore) => {
          setVerificationStatus(status)
          setVerifiedScore(vScore)
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

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
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
    <div className="flex flex-col items-center gap-3 w-full select-none">
      {/* HUD Header */}
      <div className="flex items-center justify-between w-full max-w-sm px-3 py-2 bg-slate-900/80 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Điểm số
          </span>
          <span className="text-2xl font-black text-emerald-400 font-mono leading-none">
            {verifiedScore !== null ? verifiedScore : score}
          </span>
        </div>

        {/* Verification / Mode Badge */}
        <div className="flex items-center gap-1.5">
          {verificationStatus === 'verified' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đã xác minh ✓
            </span>
          )}
          {verificationStatus === 'verifying' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 animate-pulse">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Đang xác minh...
            </span>
          )}
          {verificationStatus === 'unverified' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Không thể xác minh
            </span>
          )}
          {verificationStatus === 'practice' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              <HelpCircle className="w-3 h-3 text-amber-400" /> Luyện tập
            </span>
          )}
        </div>

        {/* Action Button */}
        {!isPlaying ? (
          <button
            type="button"
            onClick={startGame}
            disabled={engineLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {engineLoading ? (
              <span className="animate-pulse">Đang tải...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={startGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Chơi lại
          </button>
        )}
      </div>

      {/* Game Over Banner */}
      {isDead && (
        <div className="text-xs font-bold text-red-400 bg-red-950/80 px-4 py-1.5 rounded-xl border border-red-800/80 animate-fade-in flex items-center gap-1.5">
          <Award className="w-4 h-4 text-red-400" />
          {deathReason === 'wall_collision' && 'Rắn đâm vào tường! Ván đấu kết thúc.'}
          {deathReason === 'self_collision' && 'Rắn cắn vào đuôi mình! Ván đấu kết thúc.'}
          {deathReason === 'victory' && 'Chiến thắng tuyệt đối! Chúc mừng bạn.'}
          {deathReason === 'aborted' && 'Ván đấu bị hủy bỏ.'}
          {!deathReason && 'Trò chơi kết thúc!'}
        </div>
      )}

      {/* Phaser Canvas Container (Zero CLS, fixed aspect) */}
      <div
        ref={containerRef}
        style={{ touchAction: 'none' }}
        className="relative w-72 h-72 sm:w-80 sm:h-80 bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center"
      >
        {!isPlaying && !isDead && (
          <div className="flex flex-col items-center justify-center p-6 text-center gap-2 text-slate-400">
            <span className="text-4xl">🐍</span>
            <span className="font-bold text-sm text-slate-200">Snake Deluxe (G1)</span>
            <span className="text-[11px] text-slate-400 max-w-[200px]">
              Dùng phím mũi tên, WASD hoặc vuốt trên màn hình để săn mồi.
            </span>
          </div>
        )}
      </div>

      {/* Mobile Touch Direction Controls (Virtual D-Pad) */}
      <div className="flex flex-col items-center gap-1 mt-1">
        <button
          type="button"
          onClick={() => handleTurn('up')}
          className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/80 shadow-md transition-all"
          aria-label="Lên"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => handleTurn('left')}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/80 shadow-md transition-all"
            aria-label="Trái"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleTurn('down')}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/80 shadow-md transition-all"
            aria-label="Xuống"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleTurn('right')}
            className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:scale-90 text-slate-200 border border-slate-700/80 shadow-md transition-all"
            aria-label="Phải"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
