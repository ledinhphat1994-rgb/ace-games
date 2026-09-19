import { Trophy, Clock, CheckCircle2, Users, Vote, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { SessionSummary } from '@shared/protocol/room'

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
