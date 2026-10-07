import { useRef, useState, type PointerEvent } from 'react'
import { snakeKeyAngle } from './keyboard-steering'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SnakeJoystickProps {
  player: 1 | 2
  onSteer: (angle: number) => void
  className?: string
}

export function SnakeJoystick({ player, onSteer, className }: SnakeJoystickProps) {
  const pointer = useRef<number | null>(null)
  const thumbRef = useRef<HTMLSpanElement | null>(null)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const distance = Math.hypot(x, y)
    const scale = distance > 34 ? 34 / distance : 1
    const finalX = Math.round(x * scale)
    const finalY = Math.round(y * scale)

    // Cập nhật vị trí DOM trực tiếp (Zero React re-render ở tần số 120Hz)
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`
    }
    if (distance > 5) onSteer(Math.atan2(y, x))
  }

  const release = () => {
    pointer.current = null
    if (thumbRef.current) {
      thumbRef.current.style.transform = 'translate3d(0px, 0px, 0)'
    }
  }

  return (
    <div
      role="group"
      tabIndex={0}
      onKeyDown={(event) => {
        const angle = snakeKeyAngle(event.code)
        if (angle !== null) {
          event.preventDefault()
          event.stopPropagation()
          onSteer(angle)
        }
      }}
      aria-label={'Lái rắn P' + player}
      data-testid={'snake-joystick-p' + player}
      className={cn(
        'relative flex size-24 sm:size-26 touch-none select-none items-center justify-center rounded-full border-2 bg-slate-950/80 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand backdrop-blur-sm ring-1 ring-white/10 active:border-brand/70 transition-colors',
        player === 1 ? 'border-brand/50' : 'border-rose-400/50',
        className,
      )}
      onPointerDown={(e) => {
        if (pointer.current !== null) return
        pointer.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span className="absolute text-[10px] font-bold text-white/35 pointer-events-none">P{player}</span>
      <span
        ref={thumbRef}
        className={cn(
          'pointer-events-none size-11 sm:size-12 rounded-full border border-white/60 shadow-xl will-change-transform flex items-center justify-center',
          player === 1
            ? 'bg-gradient-to-tr from-brand to-emerald-400/80 shadow-brand/30'
            : 'bg-gradient-to-tr from-rose-500 to-amber-400/80 shadow-rose-500/30',
        )}
        style={{ transform: 'translate3d(0px, 0px, 0)' }}
      >
        <span className="size-2 rounded-full bg-white/80" />
      </span>
    </div>
  )
}

export interface SnakeBoostButtonProps {
  player: 1 | 2
  onBoost: (boost: boolean) => void
  className?: string
  size?: 'normal' | 'large'
}

export function SnakeBoostButton({ player, onBoost, className, size = 'normal' }: SnakeBoostButtonProps) {
  const [boosting, setBoosting] = useState(false)
  const stopBoost = () => {
    setBoosting(false)
    onBoost(false)
  }

  const isLarge = size === 'large'

  return (
    <button
      type="button"
      aria-label={'Tăng tốc P' + player}
      data-testid={'snake-boost-p' + player}
      className={cn(
        'flex touch-none items-center justify-center rounded-full border-2 shadow-2xl outline-none transition-all duration-150 cursor-pointer select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-300 backdrop-blur-sm ring-1 ring-white/10',
        isLarge ? 'size-18 sm:size-20' : 'size-13',
        boosting
          ? 'border-amber-300 bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.8)] scale-95'
          : 'border-amber-400/60 bg-slate-950/85 text-amber-300 hover:bg-slate-900 hover:border-amber-300 active:border-amber-300',
        className,
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setBoosting(true)
        onBoost(true)
      }}
      onPointerUp={stopBoost}
      onPointerCancel={stopBoost}
      onLostPointerCapture={stopBoost}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          setBoosting(true)
          onBoost(true)
        }
      }}
      onKeyUp={stopBoost}
      onBlur={stopBoost}
    >
      <Zap className={cn('fill-current transition-transform duration-100', isLarge ? (boosting ? 'size-9 sm:size-10 scale-110' : 'size-8 sm:size-9') : 'size-6')} />
    </button>
  )
}

export interface SnakeTouchControlsProps {
  player: 1 | 2
  onSteer: (angle: number) => void
  onBoost: (boost: boolean) => void
  className?: string
}

export function SnakeTouchControls({ player, onSteer, onBoost, className }: SnakeTouchControlsProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2', className)} data-testid={'snake-touch-p' + player}>
      <SnakeBoostButton player={player} onBoost={onBoost} />
      <SnakeJoystick player={player} onSteer={onSteer} />
    </div>
  )
}
