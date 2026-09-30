import { useRef, useState, type PointerEvent } from 'react'
import { snakeKeyAngle } from './keyboard-steering'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SnakeTouchControlsProps {
  player: 1 | 2
  onSteer: (angle: number) => void
  onBoost: (boost: boolean) => void
}

export function SnakeTouchControls({ player, onSteer, onBoost }: SnakeTouchControlsProps) {
  const pointer = useRef<number | null>(null)
  const [thumb, setThumb] = useState({ x: 0, y: 0 })
  const [boosting, setBoosting] = useState(false)
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    const distance = Math.hypot(x, y)
    const scale = distance > 28 ? 28 / distance : 1
    setThumb({ x: x * scale, y: y * scale })
    if (distance > 5) onSteer(Math.atan2(y, x))
  }
  const release = () => { pointer.current = null; setThumb({ x: 0, y: 0 }) }
  const stopBoost = () => { setBoosting(false); onBoost(false) }

  return (
    <div className="flex flex-col items-center gap-2" data-testid={'snake-touch-p' + player}>
      <button type="button" aria-label={'Tăng tốc P' + player} className={cn('flex size-11 touch-none items-center justify-center rounded-full border shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white', boosting ? 'border-amber-300 bg-amber-400/40 text-amber-200' : 'border-white/20 bg-slate-950/70 text-amber-300')}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setBoosting(true); onBoost(true) }}
        onPointerUp={stopBoost} onPointerCancel={stopBoost} onLostPointerCapture={stopBoost}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setBoosting(true); onBoost(true) } }} onKeyUp={stopBoost} onBlur={stopBoost}>
        <Zap className="size-5" />
      </button>
      <div role="group" tabIndex={0} onKeyDown={event => { const angle = snakeKeyAngle(event.code); if (angle !== null) { event.preventDefault(); event.stopPropagation(); onSteer(angle) } }} aria-label={'Lái rắn P' + player} data-testid={'snake-joystick-p' + player} className={cn('relative flex size-20 touch-none select-none items-center justify-center rounded-full border bg-slate-950/55 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-brand', player === 1 ? 'border-cyan-300/35' : 'border-rose-300/35')}
        onPointerDown={e => { if (pointer.current !== null) return; pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
        onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
        <span className="absolute text-[10px] font-bold text-white/50">P{player}</span>
        <span className={cn('pointer-events-none size-9 rounded-full border border-white/30 shadow-lg', player === 1 ? 'bg-cyan-400/45' : 'bg-rose-400/45')} style={{ transform: 'translate(' + thumb.x + 'px,' + thumb.y + 'px)' }} />
      </div>
    </div>
  )
}
