import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Timer, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SessionTimerState } from '@shared/protocol/room'

interface SessionTimerWidgetProps {
  timer: SessionTimerState
  serverClockOffset?: number
  canControl: boolean
  onStart: (durationSeconds: number) => void
  onPause: () => void
  onReset: () => void
  compact?: boolean
}

const PRESET_DURATIONS = [
  { label: '15p', seconds: 900 },
  { label: '25p', seconds: 1500 },
  { label: '30p', seconds: 1800 },
  { label: '45p', seconds: 2700 },
  { label: '60p', seconds: 3600 },
]

export function SessionTimerWidget({
  timer,
  serverClockOffset = 0,
  canControl,
  onStart,
  onPause,
  onReset,
  compact = false,
}: SessionTimerWidgetProps) {
  const [remaining, setRemaining] = useState<number>(timer.remaining)
  const [selectedDuration, setSelectedDuration] = useState<number>(
    timer.durationSeconds || 1800,
  )

  useEffect(() => {
    if (!timer.running || timer.endsAt <= 0) {
      // oxlint-disable-next-line react/set-state-in-effect
      setRemaining(timer.remaining)
      return
    }

    const update = () => {
      const estimatedServerNow = Date.now() + serverClockOffset
      const diff = Math.max(0, Math.round((timer.endsAt - estimatedServerNow) / 1000))
      setRemaining(diff)
    }

    update()
    const interval = setInterval(update, 500)
    return () => clearInterval(interval)
  }, [timer.running, timer.endsAt, timer.remaining, serverClockOffset])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Compact header button style
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-bold transition-all ${
          timer.running
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 animate-pulse'
            : 'bg-secondary/70 text-muted-foreground border border-border/40'
        }`}
      >
        <Timer className="h-3.5 w-3.5" />
        <span>{formatTime(remaining)}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Clock className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Đồng hồ buổi học
          </h4>
        </div>
        {timer.running && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Đang chạy
          </span>
        )}
      </div>

      {/* Timer Display */}
      <div className="my-3 flex flex-col items-center justify-center rounded-xl bg-background/50 border border-border/20 py-4">
        <div
          className={`font-mono text-3xl font-extrabold tracking-wider transition-colors ${
            timer.running
              ? 'text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'text-foreground'
          }`}
        >
          {formatTime(remaining)}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {timer.running
            ? 'Đang đếm ngược'
            : remaining === 0
            ? 'Đã kết thúc thời gian'
            : 'Đã tạm dừng'}
        </div>
      </div>

      {/* Controller Buttons */}
      {canControl && (
        <div className="space-y-2.5">
          {!timer.running && (
            <div className="flex items-center justify-center gap-1">
              {PRESET_DURATIONS.map((p) => (
                <Button
                  key={p.seconds}
                  variant={selectedDuration === p.seconds ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={() => {
                    setSelectedDuration(p.seconds)
                    onStart(p.seconds)
                  }}
                  className={`text-[11px] font-medium h-7 px-2.5 ${
                    selectedDuration === p.seconds
                      ? 'border border-primary/30 font-semibold'
                      : ''
                  }`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            {timer.running ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPause}
                className="h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Tạm dừng
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onStart(selectedDuration)}
                className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Play className="mr-1.5 h-3.5 w-3.5" />
                {remaining < selectedDuration && remaining > 0
                  ? 'Tiếp tục'
                  : 'Bắt đầu'}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Đặt lại
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
