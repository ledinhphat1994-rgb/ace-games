import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Flame, Trophy } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClassLeaderboardItem } from '@shared/protocol/engagement'
import { cn, getInitials, tenLop } from '@/lib/utils'

interface ClassLeaderboardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LeaderboardResponse {
  ok: boolean
  lopTen: string | null
  currentWeek: string
  dateRange: { startDate: string; endDate: string }
  items: ClassLeaderboardItem[]
}

/** "2026-09-22" → "22/9" (không qua new Date để khỏi lệch múi giờ). */
function ngayNgan(chuoi: string | undefined): string | null {
  const [, thang, ngay] = (chuoi ?? '').split('-').map(Number)
  return thang && ngay ? `${ngay}/${thang}` : null
}

const MAU_HANG: Record<number, string> = {
  1: 'bg-achievement/20 text-achievement',
  2: 'bg-text-secondary/15 text-text-primary',
  3: 'bg-warning/15 text-warning',
}

export function ClassLeaderboardModal({ open, onOpenChange }: ClassLeaderboardModalProps) {
  const { data, isLoading, error, refetch } = useQuery<LeaderboardResponse>({
    queryKey: ['engagement', 'leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.loi || 'Không thể tải bảng xếp hạng.')
      }
      return res.json()
    },
    enabled: open,
  })

  const tu = ngayNgan(data?.dateRange?.startDate)
  const den = ngayNgan(data?.dateRange?.endDate)
  const items = data?.items ?? []
  // Xếp hạng giữa những người cùng 0 XP là vô nghĩa: chỉ đánh số người đã có XP trong tuần
  const chuaAiCoXp = items.every((item) => item.weeklyXp <= 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bảng xếp hạng tuần</DialogTitle>
          <DialogDescription>
            {data?.lopTen ? `${tenLop(data.lopTen)} · ` : ''}XP kiếm được khi học
            {tu && den ? ` từ ${tu} đến ${den}` : ' trong tuần này'}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-48">
          {isLoading ? (
            <div className="space-y-2" aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="mt-2 text-sm text-text-primary">
                {error instanceof Error ? error.message : 'Không thể tải bảng xếp hạng.'}
              </p>
              <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </div>
          ) : chuaAiCoXp ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Trophy className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Tuần này chưa ai có XP</p>
              <p className="mt-1 text-xs text-text-tertiary">Vào một phòng học để mở đầu bảng xếp hạng.</p>
            </div>
          ) : (
            <ol className="-mx-1 max-h-[60svh] space-y-1 overflow-y-auto overscroll-contain px-1">
              {items.map((item) => (
                <li
                  key={item.accountId}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    item.isCurrentUser ? 'bg-brand/[0.08] ring-1 ring-brand/30' : 'hover:bg-surface-raised/60',
                  )}
                >
                  {item.weeklyXp > 0 ? (
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                        MAU_HANG[item.rank] ?? 'text-text-tertiary',
                      )}
                      aria-label={`Hạng ${item.rank}`}
                    >
                      {item.rank}
                    </span>
                  ) : (
                    <span aria-label="Chưa xếp hạng" className="flex size-7 shrink-0 items-center justify-center text-xs text-text-tertiary">
                      –
                    </span>
                  )}
                  {item.avatar ? (
                    <img src={item.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-secondary"
                    >
                      {getInitials(item.displayName)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words text-text-primary">
                      {item.displayName}
                      {item.isCurrentUser && <span className="ml-1.5 text-xs font-normal text-brand">(bạn)</span>}
                    </p>
                    {item.currentStreak > 0 && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-text-tertiary">
                        <Flame className="size-3 text-warning" />
                        {item.currentStreak} ngày liên tiếp
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-text-primary tabular-nums">
                    {item.weeklyXp}
                    <span className="ml-1 text-xs font-normal text-text-tertiary">XP</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
