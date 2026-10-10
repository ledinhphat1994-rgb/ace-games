import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck,
  Check,
  Flame,
  Gift,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import type { DailyCheckInStatus, ClaimDailyCheckInResult } from '@shared/protocol/engagement'
import { toast } from 'sonner'

interface DailyCheckInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DailyCheckInModal({ open, onOpenChange }: DailyCheckInModalProps) {
  const queryClient = useQueryClient()
  const [isClaiming, setIsClaiming] = useState(false)

  const { data, isLoading } = useQuery<DailyCheckInStatus>({
    queryKey: ['engagement', 'checkin'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/checkin')
      if (!res.ok) throw new Error('Không thể tải dữ liệu điểm danh')
      return res.json()
    },
    enabled: open,
    staleTime: 10_000,
  })

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/engagement/checkin', {
        method: 'POST',
      })
      const json = (await res.json()) as ClaimDailyCheckInResult
      if (!res.ok || !json.ok) {
        throw new Error(json.loi || 'Điểm danh thất bại')
      }
      return json
    },
    onMutate: () => {
      setIsClaiming(true)
    },
    onSuccess: (result) => {
      setIsClaiming(false)
      toast.success(`+${result.rewardXp} XP`)
      void queryClient.invalidateQueries({ queryKey: ['engagement', 'checkin'] })
      void queryClient.invalidateQueries({ queryKey: ['engagement', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['thong-tin-tai-khoan'] })
    },
    onError: (err: Error) => {
      setIsClaiming(false)
      toast.error(err.message || 'Lỗi khi điểm danh')
    },
  })

  const rewards = data?.rewards || [15, 20, 25, 30, 35, 40, 50]
  const currentStreak = data?.currentStreak || 0
  const canCheckIn = data?.canCheckIn ?? false
  const cycleDay = data?.cycleDay || 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="daily-checkin-modal"
        className="fixed top-18 sm:top-20 left-1/2 -translate-x-1/2 translate-y-0 max-w-xl w-[94vw] bg-[#0c1322] border-2 border-sky-500/30 p-0 overflow-hidden shadow-2xl text-slate-100 rounded-2xl"
      >
        <BlueprintArcadePattern />

        {/* Header - rule 6: Only title */}
        <div className="relative border-b-2 border-sky-500/20 px-4 py-3 sm:px-6 sm:py-4">
          <DialogHeader className="p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-sky-400" />
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-100">
                  Điểm danh hằng ngày
                </DialogTitle>
              </div>

              {/* Status pills - uniform height */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 text-xs font-bold"
                  title={`Chuỗi ${currentStreak} ngày`}
                >
                  <Flame className="size-3.5 fill-amber-400" />
                  <span>{currentStreak} ngày</span>
                </div>
                {data && (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border-2 border-sky-500/30 text-sky-400 text-xs font-bold"
                    title={`Tổng ${data.totalXp} XP`}
                  >
                    <Zap className="size-3.5 fill-sky-400" />
                    <span>{data.totalXp} XP</span>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content area: 7-day grid */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {isLoading ? (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 7 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 sm:h-28 rounded-xl bg-slate-800/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
              {rewards.map((xp, index) => {
                const dayNumber = index + 1
                const isPast = canCheckIn ? dayNumber < cycleDay : dayNumber <= cycleDay
                const isToday = canCheckIn ? dayNumber === cycleDay : false
                const isFuture = canCheckIn ? dayNumber > cycleDay : dayNumber > cycleDay

                return (
                  <div
                    key={dayNumber}
                    data-testid={`checkin-day-${dayNumber}`}
                    className={cn(
                      'relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl border-2 transition-colors duration-150 h-24 sm:h-28 text-center',
                      isPast && 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
                      isToday && 'bg-sky-500/15 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.25)]',
                      isFuture && 'bg-slate-900/40 border-slate-700/50 text-slate-400',
                    )}
                  >
                    <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Ngày {dayNumber}
                    </span>

                    <div className="my-auto flex flex-col items-center justify-center">
                      {isPast ? (
                        <div className="size-6 sm:size-7 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40">
                          <Check className="size-3.5 sm:size-4 text-emerald-400" />
                        </div>
                      ) : isToday ? (
                        <div className="size-6 sm:size-7 rounded-full bg-sky-500/25 flex items-center justify-center border-2 border-sky-400">
                          <Gift className="size-3.5 sm:size-4 text-sky-300 animate-bounce" />
                        </div>
                      ) : (
                        <div className="size-6 sm:size-7 rounded-full bg-slate-800/60 flex items-center justify-center border-2 border-slate-700/60">
                          <Lock className="size-3 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <span
                      className={cn(
                        'text-xs sm:text-sm font-bold',
                        isPast && 'text-emerald-400',
                        isToday && 'text-sky-300 font-extrabold',
                        isFuture && 'text-slate-400',
                      )}
                    >
                      +{xp} XP
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Action Button - Rule 9: Fixed Action Placement */}
          <div className="pt-2 flex justify-center">
            {canCheckIn ? (
              <Button
                data-testid="claim-checkin-btn"
                onClick={() => claimMutation.mutate()}
                disabled={isClaiming || isLoading}
                className="w-full sm:w-auto px-8 h-10 sm:h-11 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl border-2 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-colors duration-150 gap-2 cursor-pointer"
              >
                <Sparkles className="size-4" />
                <span>Điểm danh (+{data?.rewardXp || 15} XP)</span>
              </Button>
            ) : (
              <Button
                disabled
                className="w-full sm:w-auto px-8 h-10 sm:h-11 bg-slate-800/80 border-2 border-slate-700 text-slate-400 font-semibold text-sm sm:text-base rounded-xl gap-2 cursor-not-allowed"
              >
                <Check className="size-4 text-emerald-400" />
                <span>Đã điểm danh hôm nay</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
