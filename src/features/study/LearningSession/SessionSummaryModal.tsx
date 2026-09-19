import { Trophy, Clock, CheckCircle2, Users, Vote, Sparkles, Flame, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { SessionSummary } from '@shared/protocol/room'
import type { EngagementProfile } from '@shared/protocol/engagement'

interface SessionSummaryModalProps {
  summary: SessionSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionSummaryModal({
  summary,
  open,
  onOpenChange,
}: SessionSummaryModalProps) {
  const { data: engagementData } = useQuery<{
    ok: boolean
    profile: EngagementProfile
  }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) return { ok: false, profile: null as any }
      return res.json()
    },
    enabled: open && !!summary,
  })

  if (!summary) return null

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m === 0) return `${s} giây`
    if (s === 0) return `${m} phút`
    return `${m} phút ${s} giây`
  }

  // Calculate average completion rate
  const rates = Object.values(summary.taskCompletionRates || {})
  const avgCompletion =
    rates.length > 0
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:max-w-lg bg-card/95 backdrop-blur-xl border border-border/50">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 shadow-md mb-2">
            <Trophy className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2 justify-center sm:justify-start">
            Tổng kết buổi học
            <Sparkles className="h-4 w-4 text-amber-500" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Báo cáo thành tích và hoạt động phiên học nhóm vừa hoàn thành.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Lightweight Engagement Reward Result */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Star className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Hoàn thành phiên học!</span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                    +20 XP
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Đã ghi nhận vào chuyên cần cá nhân & thử thách lớp
                </div>
              </div>
            </div>

            {engagementData?.profile && engagementData.profile.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-500 shrink-0">
                <Flame className="h-3.5 w-3.5" />
                <span>Chuỗi {engagementData.profile.currentStreak} ngày</span>
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-border/40 bg-background/50 p-3 text-center">
              <Clock className="mx-auto h-4 w-4 text-blue-500 mb-1" />
              <div className="text-base font-extrabold text-foreground">
                {formatDuration(summary.durationSeconds)}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                Thời lượng
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/50 p-3 text-center">
              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500 mb-1" />
              <div className="text-base font-extrabold text-foreground">
                {avgCompletion}%
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                {summary.taskCount} nhiệm vụ
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/50 p-3 text-center">
              <Users className="mx-auto h-4 w-4 text-purple-500 mb-1" />
              <div className="text-base font-extrabold text-foreground">
                {summary.activeMembers.length}
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">
                Thành viên tích cực
              </div>
            </div>
          </div>

          {/* Poll Results Section if exists */}
          {summary.pollResults && summary.pollResults.length > 0 && (
            <div className="rounded-xl border border-border/40 bg-background/50 p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Vote className="h-3.5 w-3.5 text-purple-500" />
                <span>Kết quả bình chọn nhanh</span>
              </div>
              {summary.pollResults.map((pr, idx) => {
                const total = pr.options.reduce((a, b) => a + b.count, 0)
                return (
                  <div key={idx} className="space-y-1.5 text-xs pt-1">
                    <p className="font-medium text-foreground text-[11px]">
                      {pr.question}
                    </p>
                    <div className="space-y-1">
                      {pr.options.map((opt, oIdx) => {
                        const pct = total > 0 ? Math.round((opt.count / total) * 100) : 0
                        return (
                          <div
                            key={oIdx}
                            className="flex items-center justify-between rounded-md bg-accent/30 px-2.5 py-1 text-[11px]"
                          >
                            <span>{opt.text}</span>
                            <span className="font-semibold text-muted-foreground">
                              {opt.count} phiếu ({pct}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-xs font-medium"
          >
            Đã xem & Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
