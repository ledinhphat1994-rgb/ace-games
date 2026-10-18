import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DailyCheckInModal } from './DailyCheckInModal'
import type { DailyCheckInStatus } from '@shared/protocol/engagement'
import { cn } from '@/lib/utils'

interface DailyCheckInButtonProps {
  className?: string
  variant?: 'header' | 'compact' | 'pill'
}

export function DailyCheckInButton({
  className,
  variant = 'header',
}: DailyCheckInButtonProps) {
  const [open, setOpen] = useState(false)

  const { data } = useQuery<DailyCheckInStatus>({
    queryKey: ['engagement', 'checkin'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/checkin')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 30_000,
  })

  const canCheckIn = data?.canCheckIn ?? false

  return (
    <>
      {variant === 'pill' ? (
        <Button
          data-testid="daily-checkin-pill-btn"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          title="Điểm danh hằng ngày"
          aria-label="Điểm danh hằng ngày"
          className={cn(
            'relative h-8 px-2.5 rounded-lg border-2 text-xs font-bold gap-1.5 transition-colors duration-150 cursor-pointer',
            canCheckIn
              ? 'border-sky-400 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
              : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary',
            className,
          )}
        >
          <CalendarCheck className={cn('size-3.5', canCheckIn ? 'text-sky-400' : 'text-text-secondary')} />
          <span>Điểm danh</span>
          {canCheckIn && (
            <span className="flex size-2 rounded-full bg-sky-400 animate-pulse" />
          )}
        </Button>
      ) : variant === 'header' ? (
        <Button
          data-testid="header-checkin-btn"
          variant="ghost"
          size="icon-lg"
          onClick={() => setOpen(true)}
          title="Điểm danh hằng ngày"
          aria-label="Điểm danh hằng ngày"
          className={cn(
            'relative rounded-lg hover:bg-surface-interactive transition-colors duration-150 cursor-pointer',
            className,
          )}
        >
          <CalendarCheck
            className={cn(
              'size-4.5 transition-colors duration-150',
              canCheckIn ? 'text-sky-400' : 'text-text-secondary hover:text-text-primary',
            )}
          />
          {canCheckIn && (
            <span className="absolute top-2 right-2 flex size-2">
              <span className="relative inline-flex rounded-full size-2 bg-sky-400" />
            </span>
          )}
        </Button>
      ) : (
        <Button
          data-testid="daily-checkin-compact-btn"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          title="Điểm danh hằng ngày"
          aria-label="Điểm danh hằng ngày"
          className={cn(
            'h-8 px-2 text-xs font-semibold rounded-lg gap-1.5 transition-colors duration-150 cursor-pointer',
            canCheckIn
              ? 'text-sky-400 hover:bg-sky-500/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised',
            className,
          )}
        >
          <CalendarCheck className="size-3.5" />
          <span>Điểm danh</span>
          {canCheckIn && <Sparkles className="size-3 text-sky-400" />}
        </Button>
      )}

      <DailyCheckInModal open={open} onOpenChange={setOpen} />
    </>
  )
}
