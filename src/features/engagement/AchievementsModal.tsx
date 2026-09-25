import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Vote,
  Zap,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { UserAchievementItem } from '@shared/protocol/engagement'

interface AchievementsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AchievementsResponse {
  ok: boolean
  items?: UserAchievementItem[]
  achievements?: UserAchievementItem[]
  unlockedCount?: number
  totalCount?: number
}

const ICON: Record<string, ComponentType<{ className?: string }>> = {
  Sparkles,
  Users,
  Flame,
  Zap,
  CheckCircle2,
  Vote,
  BookOpen,
  Target,
  Trophy,
  ShieldCheck,
}

const NGAY = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })

export function AchievementsModal({ open, onOpenChange }: AchievementsModalProps) {
  const { data, isLoading, error, refetch } = useQuery<AchievementsResponse>({
    queryKey: ['engagement', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/achievements')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.loi || 'Không thể tải huy hiệu.')
      }
      return res.json()
    },
    enabled: open,
  })

  const items = data?.items || data?.achievements || []
  const unlockedCount = data?.unlockedCount ?? items.filter((a) => a.unlocked).length
  const totalCount = data?.totalCount ?? items.length
  // Đã mở khoá lên trước (mới nhất trước), còn lại giữ thứ tự của máy chủ
  const sapXep = [...items].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Huy hiệu</DialogTitle>
          <DialogDescription>Mỗi huy hiệu ghi nhận một thói quen học tập tốt và thưởng thêm XP.</DialogDescription>
        </DialogHeader>

        {data && totalCount > 0 && (
          <div className="flex items-center gap-3">
            <Progress value={(unlockedCount / totalCount) * 100} className="h-1.5 flex-1" aria-label="Huy hiệu đã mở" />
            <span className="shrink-0 text-xs text-text-tertiary tabular-nums">
              <span className="font-semibold text-text-primary">{unlockedCount}</span> / {totalCount} đã mở
            </span>
          </div>
        )}

        <div className="min-h-48">
          {isLoading ? (
            <div className="grid gap-2 sm:grid-cols-2" aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <AlertCircle className="size-6 text-destructive" />
              <p className="mt-2 text-sm text-text-primary">
                {error instanceof Error ? error.message : 'Không thể tải huy hiệu.'}
              </p>
              <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </div>
          ) : sapXep.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Award className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Chưa có huy hiệu nào</p>
            </div>
          ) : (
            <ul className="-mx-1 grid max-h-[60svh] gap-2 overflow-y-auto overscroll-contain px-1 sm:grid-cols-2">
              {sapXep.map((badge) => {
                const Icon = badge.unlocked ? (ICON[badge.icon] ?? Award) : Lock
                return (
                  <li
                    key={badge.key}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3',
                      badge.unlocked ? 'border-achievement/25 bg-achievement/[0.06]' : 'border-border-subtle',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        badge.unlocked ? 'bg-achievement/15 text-achievement' : 'bg-surface-overlay text-text-tertiary',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span
                          className={cn(
                            'min-w-0 text-sm font-medium break-words',
                            badge.unlocked ? 'text-text-primary' : 'text-text-secondary',
                          )}
                        >
                          {badge.title}
                        </span>
                        <span className="text-xs text-achievement tabular-nums">+{badge.rewardXp} XP</span>
                      </p>
                      <p className="mt-0.5 text-xs leading-snug break-words text-text-tertiary">{badge.description}</p>
                      {badge.unlocked && badge.unlockedAt ? (
                        <p className="mt-1 text-[11px] text-text-tertiary">Mở ngày {NGAY.format(badge.unlockedAt)}</p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
