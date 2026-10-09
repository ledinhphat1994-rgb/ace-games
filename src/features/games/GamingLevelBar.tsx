import { memo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Flame, Sparkles } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { calculateGamingRank } from './gaming-level'
import { AchievementsModal } from '@/features/engagement/AchievementsModal'
import type { ProgressDataResponse } from '@/components/progress/progress-state'

export const GamingLevelBar = memo(function GamingLevelBar() {
  const { nguoiDung } = usePhien()
  const [moThanhTuu, setMoThanhTuu] = useState(false)

  const { data } = useQuery<ProgressDataResponse>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải cấp bậc.')
      return res.json()
    },
    enabled: Boolean(nguoiDung),
    staleTime: 30_000,
  })

  if (!nguoiDung) {
    return null
  }

  const totalXp = data?.profile?.totalXp ?? 0
  const currentStreak = data?.profile?.currentStreak ?? 0
  const rank = calculateGamingRank(totalXp)

  return (
    <>
      <div className="w-full rounded-2xl border border-sky-400/25 bg-gradient-to-r from-[#03132e] via-[#041a3d] to-[#03132e] p-3 sm:p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Cột trái: Level & Danh hiệu */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/30 to-blue-600/30 border border-sky-400/40 shadow-[0_0_16px_rgba(56,189,248,0.35)]">
              <Sparkles className="size-5 sm:size-6 text-sky-400" />
              <span className="absolute -bottom-1 -right-1 flex h-4 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[9px] font-black text-white shadow-sm">
                {rank.level}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
                  Lv.{rank.level} · {rank.title}
                </span>
                {currentStreak > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                    <Flame className="size-3 text-amber-400" />
                    <span>{currentStreak} ngày</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {rank.currentXp.toLocaleString('vi-VN')} / {rank.nextLevelXp.toLocaleString('vi-VN')} XP
              </p>
            </div>
          </div>

          {/* Cột phải: Thanh XP & Nút Thành tựu */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:max-w-xs">
            {/* Thanh tiến trình XP */}
            <div className="flex-1 min-w-0">
              <div className="relative h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                  style={{ width: `${rank.progressPercent}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tiến độ cấp</span>
                <span className="font-bold text-sky-300">{rank.progressPercent}%</span>
              </div>
            </div>

            {/* Nút Thành tựu */}
            <button
              type="button"
              onClick={() => setMoThanhTuu(true)}
              aria-label="Thành tựu người chơi"
              className="flex h-8 sm:h-9 shrink-0 items-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 sm:px-3 text-xs font-bold text-sky-300 transition-colors cursor-pointer active:scale-95 shadow-sm"
            >
              <Award className="size-3.5 sm:size-4 text-sky-400" />
              <span>Thành tựu</span>
            </button>
          </div>
        </div>
      </div>

      {moThanhTuu && <AchievementsModal open={moThanhTuu} onOpenChange={setMoThanhTuu} />}
    </>
  )
})
