import { useQuery } from '@tanstack/react-query'
import { Target, Users, Calendar, Sparkles, CheckCircle2, Award } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClassChallenge } from '@shared/protocol/engagement'
import { tenLop } from '@/lib/utils'

interface ClassChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChallengeResponse {
  ok: boolean
  lopTen: string | null
  challenge: ClassChallenge | null
}

export function ClassChallengeModal({ open, onOpenChange }: ClassChallengeModalProps) {
  const { data, isLoading, error } = useQuery<ChallengeResponse>({
    queryKey: ['engagement', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/challenges')
      if (!res.ok) {
        const err = await res.json()
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success border border-success/20">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Thử thách lớp học
                <Sparkles className="h-4 w-4 text-success" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {data?.lopTen ? tenLop(data.lopTen) : 'Tập thể lớp'} • Cùng nhau hoàn thành mục tiêu tuần
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-destructive">
            {error instanceof Error ? error.message : 'Lỗi tải thử thách.'}
          </div>
        ) : !challenge ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Hiện chưa có thử thách tập thể nào cho tuần này. Hãy quay lại sau nhé!
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl border border-success/30 bg-success/5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {challenge.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {challenge.description}
                  </p>
                </div>
                <Badge
                  variant={challenge.status === 'completed' ? 'default' : 'secondary'}
                  className={
                    challenge.status === 'completed'
                      ? 'bg-success text-white shrink-0'
                      : 'text-xs shrink-0'
                  }
                >
                  {challenge.status === 'completed' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Hoàn thành
                    </span>
                  ) : (
                    'Đang diễn ra'
                  )}
                </Badge>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Tiến độ lớp:</span>
                  <span className="font-bold text-foreground">
                    {challenge.currentValue} / {challenge.targetValue} ({percent}%)
                  </span>
                </div>
                <Progress value={percent} className="h-2.5 bg-muted" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-success" />
                  <span>{challenge.participantCount || 0} bạn đã đóng góp</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Award className="h-3.5 w-3.5 text-achievement" />
                  <span className="font-semibold text-foreground">+{challenge.rewardXp} XP thưởng</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <span>
                Thời hạn: Đến hết Chủ Nhật tuần này ({new Date(challenge.endDate).toLocaleDateString('vi-VN')})
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
