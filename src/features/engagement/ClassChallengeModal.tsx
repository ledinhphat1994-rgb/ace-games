import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CalendarDays, CheckCircle2, Target, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClassChallenge } from '@shared/protocol/engagement'
import { cn } from '@/lib/utils'

interface ClassChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChallengeResponse {
  ok: boolean
  lopTen: string | null
  challenge: ClassChallenge | null
}

const NGAY_TRONG_TUAN = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })

/** "YYYY-MM-DD" theo lịch địa phương (new Date('YYYY-MM-DD') là nửa đêm UTC, có thể lệch ngày). */
function ngayDiaPhuong(chuoi: string): Date {
  const [nam, thang, ngay] = chuoi.split('-').map(Number)
  return nam && thang && ngay ? new Date(nam, thang - 1, ngay) : new Date(chuoi)
}

const TRANG_THAI: Record<ClassChallenge['status'], { nhan: string; mau: string }> = {
  active: { nhan: 'Đang diễn ra', mau: 'bg-brand/12 text-brand' },
  completed: { nhan: 'Đã hoàn thành', mau: 'bg-success/12 text-success' },
  expired: { nhan: 'Đã hết hạn', mau: 'bg-surface-overlay text-text-tertiary' },
}

export function ClassChallengeModal({ open, onOpenChange }: ClassChallengeModalProps) {
  const { data, isLoading, error, refetch } = useQuery<ChallengeResponse>({
    queryKey: ['engagement', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/challenges')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.loi || 'Không thể tải thử thách lớp.')
      }
      return res.json()
    },
    enabled: open,
  })

  const challenge = data?.challenge
  const percent = challenge
    ? Math.min(100, Math.round((challenge.currentValue / Math.max(1, challenge.targetValue)) * 100))
    : 0
  const trangThai = challenge ? TRANG_THAI[challenge.status] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thử thách thi đua</DialogTitle>
          <DialogDescription>
            Cùng góp sức hoàn thành mục tiêu tuần.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-44">
          {isLoading ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-6 w-2/3 rounded-lg" />
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : error ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="mt-2 text-sm text-text-primary">
                {error instanceof Error ? error.message : 'Không thể tải thử thách lớp.'}
              </p>
              <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </div>
          ) : !challenge || !trangThai ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <Target className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Tuần này chưa có thử thách</p>
              <p className="mt-1 text-xs text-text-tertiary">Thử thách mới sẽ xuất hiện ở đây khi được mở.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className={cn('inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium', trangThai.mau)}>
                  {challenge.status === 'completed' && <CheckCircle2 className="mr-1 size-3" />}
                  {trangThai.nhan}
                </span>
                <p className="mt-2 text-base font-semibold break-words text-text-primary">{challenge.title}</p>
                <p className="mt-1 text-sm leading-relaxed break-words text-text-secondary">{challenge.description}</p>
              </div>

              <div className="rounded-2xl border border-border-subtle bg-surface-raised/50 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-2xl font-semibold text-text-primary tabular-nums">
                    {challenge.currentValue}
                    <span className="text-base font-normal text-text-tertiary"> / {challenge.targetValue}</span>
                  </p>
                  <span className="text-sm font-medium text-text-secondary tabular-nums">{percent}%</span>
                </div>
                <Progress value={percent} className="mt-3 h-2" aria-label="Tiến độ của lớp" />
                <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {challenge.participantCount || 0} bạn đã góp sức
                    {challenge.hasContributed ? ' (có bạn)' : ''}
                  </span>
                  <span className="font-medium text-achievement">Thưởng +{challenge.rewardXp} XP</span>
                </p>
              </div>

              <p className="flex items-center gap-2 text-xs text-text-tertiary">
                <CalendarDays className="size-4 shrink-0" />
                <span>
                  Hạn chót: {NGAY_TRONG_TUAN.format(ngayDiaPhuong(challenge.endDate))}
                </span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
