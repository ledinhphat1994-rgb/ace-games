import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Flame, Sparkles, Plus, BookOpen, AlertCircle, RotateCw } from 'lucide-react'
import { deriveProgressState, type ProgressDataResponse } from '@/components/progress/progress-state'

interface LearningHeaderProps {
  onOpenCreateRoom: () => void
  onOpenQuickStart: () => void
}

export function LearningHeader({ onOpenCreateRoom, onOpenQuickStart }: LearningHeaderProps) {
  const { nguoiDung } = usePhien()

  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<ProgressDataResponse>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải hồ sơ học tập.')
      const json = (await res.json()) as ProgressDataResponse
      if (!json || json.ok === false) {
        throw new Error(json?.loi || json?.message || 'Không thể tải hồ sơ học tập.')
      }
      if (!json.profile) {
        throw new Error('Dữ liệu hồ sơ học tập không hợp lệ.')
      }
      return json
    },
    staleTime: 30_000,
  })

  const progressState = deriveProgressState({
    isLoading: loadingProfile,
    isError: isProfileError,
    data: profileData,
    error: profileError,
  })

  const displayName = nguoiDung?.ten || nguoiDung?.username || 'Khách'

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border-default bg-surface p-4 sm:p-6 shadow-xl">
      {/* Background Subtle Gradient & Artwork */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-40 sm:opacity-50 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/learning/learning_hero.webp)',
          backgroundPosition: 'right 10% center',
        }}
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#14140f] via-[#14140f]/80 to-transparent sm:bg-gradient-to-r sm:from-[#14140f] sm:via-[#14140f]/85 sm:to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Salutation & Personal Metric Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/12 text-brand border border-brand/30">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-brand uppercase tracking-wider">
              Không gian học tập
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
            Chào {displayName}, sẵn sàng vào bài hôm nay chưa?
          </h1>

          {/* Quick Truthful Metrics Badges */}
          {progressState.type === 'loading' && (
            <div className="flex items-center gap-2 pt-0.5" data-testid="learning-header-loading">
              <div className="h-6 w-24 rounded-full bg-surface-overlay animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-surface-overlay animate-pulse" />
            </div>
          )}

          {progressState.type === 'error' && (
            <div className="flex items-center gap-2 pt-0.5" data-testid="learning-header-error">
              <span className="text-xs text-destructive font-medium flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                Không tải được tiến trình
              </span>
              <button
                type="button"
                onClick={() => refetchProfile()}
                className="text-[11px] font-semibold text-destructive hover:text-destructive underline ml-1 cursor-pointer flex items-center gap-1"
                title="Thử lại"
              >
                <RotateCw className="h-2.5 w-2.5" />
                <span>Thử lại</span>
              </button>
            </div>
          )}

          {progressState.type === 'success' && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5" data-testid="learning-header-success">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-warning">
                <Flame className="h-3.5 w-3.5 text-warning fill-amber-400" />
                <span>Chuỗi {progressState.currentStreak} ngày</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/30 text-xs font-bold text-brand">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                <span>+{progressState.todayXp} XP hôm nay</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Primary Call-to-Actions */}
        <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <Button
            size="sm"
            onClick={onOpenQuickStart}
            className="h-10 px-4 rounded-xl text-xs font-extrabold bg-brand hover:bg-brand-hover text-primary-foreground shadow-lg shadow-brand/20 gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Học nhanh</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCreateRoom}
            className="h-10 px-4 rounded-xl text-xs font-bold bg-surface-overlay border-border-default text-text-primary hover:bg-surface-overlay hover:text-text-primary gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phòng nhóm</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
