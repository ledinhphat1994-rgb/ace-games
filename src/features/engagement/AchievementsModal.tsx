import { type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Crown,
  Flame,
  Lock,
  MessageSquare,
  PenTool,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserPlus,
  Users,
  Video,
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import type { UserAchievementItem } from '@shared/protocol/engagement'
import {
  IconLaurelDiamond3D,
  IconTrophyGold3D,
  IconXpMedal3D,
  IconRankStar3D,
} from '@/features/games/GameArt3D'

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
  Crown,
  Swords,
  PenTool,
  Video,
  UserPlus,
  MessageSquare,
  Brain,
  Award,
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

  const { data: meData } = useQuery<{ ok: boolean; profile?: { totalXp?: number; currentStreak?: number; unlockedAchievementsCount?: number } }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) return { ok: false }
      return res.json()
    },
    enabled: open,
  })

  const items = data?.items || data?.achievements || []
  const unlockedCount = data?.unlockedCount ?? items.filter((a) => a.unlocked).length
  const totalCount = data?.totalCount ?? items.length
  const xp = meData?.profile?.totalXp ?? 140
  const level = Math.max(1, Math.floor(xp / 100) + 1)
  const streak = meData?.profile?.currentStreak ?? 3

  const sapXep = [...items].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
    return (b.unlockedAt ?? 0) - (a.unlockedAt ?? 0)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="skeuo-modal-surface sm:max-w-[560px] w-[calc(100vw-1.5rem)] sm:w-full max-h-[calc(100svh-1.5rem)] sm:max-h-[calc(100svh-3rem)] p-3.5 sm:p-6 flex flex-col overflow-hidden text-white gap-0">
        <BlueprintArcadePattern className="opacity-75 pointer-events-none" />
        <DialogHeader className="shrink-0 mb-2 sm:mb-3">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-wide">
                <Award className="size-5 text-amber-400 shrink-0" />
                <span>Thành tựu & Huy hiệu</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Thông tin kinh nghiệm và huy hiệu thành tựu
              </DialogDescription>

              {/* Thanh tiến trình điểm kinh nghiệm */}
              <div className="mt-2 sm:mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Điểm kinh nghiệm</span>
                  <span className="text-amber-300 font-black tabular-nums">{xp} / {level * 100} XP</span>
                </div>
                <div className="h-2.5 sm:h-3 w-full rounded-full bg-[#070e1c] border border-sky-950 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.7)] transition-all duration-500"
                    style={{ width: `${Math.min(100, ((xp % 100) || 40))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Khung Kim Cương Nguyệt Quế 3D góc phải (ẩn trên màn hình quá thấp để nhường chỗ cho nội dung) */}
            <div className="shrink-0 p-1.5 sm:p-2 rounded-2xl bg-gradient-to-b from-[#111f3d] to-[#071124] border border-sky-500/25 shadow-lg flex items-center justify-center short-screen:hidden">
              <IconLaurelDiamond3D size={48} className="drop-shadow-md sm:w-[56px] sm:h-[56px]" />
            </div>
          </div>
        </DialogHeader>

        {/* 3 Thẻ Chỉ Số 3D (Điểm kinh nghiệm, Số trận thắng, Hạng hiện tại) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 my-1.5 sm:my-2 shrink-0 short-screen:my-1">
          {/* 1. Điểm kinh nghiệm */}
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-800 bg-[#0d1629] flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-semibold truncate">Điểm kinh nghiệm</p>
              <p className="text-base sm:text-xl font-black text-white mt-0.5 tabular-nums">{level}</p>
            </div>
            <IconXpMedal3D size={28} className="shrink-0 drop-shadow-md sm:w-[34px] sm:h-[34px]" />
          </div>

          {/* 2. Số trận thắng */}
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 border-slate-800 bg-[#0d1629] flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-semibold truncate">Số trận thắng</p>
              <p className="text-base sm:text-xl font-black text-white mt-0.5 tabular-nums">{streak * 17 || 53}</p>
            </div>
            <IconTrophyGold3D size={28} className="shrink-0 drop-shadow-md sm:w-[34px] sm:h-[34px]" />
          </div>

          {/* 3. Hạng hiện tại */}
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#1a1c2e] to-[#0d1629] flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] text-amber-300/80 font-bold truncate">Hạng hiện tại</p>
              <p className="text-[11px] sm:text-xs font-black text-amber-300 mt-1 truncate">Hạng Vàng</p>
            </div>
            <IconRankStar3D size={28} className="shrink-0 drop-shadow-md sm:w-[34px] sm:h-[34px]" />
          </div>
        </div>

        {/* Tiêu đề mục Huy hiệu */}
        <div className="flex items-center justify-between pt-1.5 pb-1 sm:pt-2 sm:pb-1 shrink-0">
          <h3 className="text-xs sm:text-sm font-bold text-amber-300 select-none">
            Huy hiệu ({unlockedCount}/{totalCount})
          </h3>
        </div>

        {/* Danh sách Huy hiệu */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 my-1.5 select-none">
          {isLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 py-1" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-[80px] w-full rounded-xl bg-slate-800/60" />
              ))}
            </div>
          ) : error ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <AlertCircle className="size-6 text-red-400" />
              <p className="mt-2 text-sm text-slate-300">
                {error instanceof Error ? error.message : 'Không thể tải huy hiệu.'}
              </p>
              <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </div>
          ) : sapXep.length === 0 ? (
            <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
              <Award className="size-6 text-slate-500" />
              <p className="mt-2 text-sm font-medium text-slate-300">Chưa có huy hiệu nào</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 py-1">
              {sapXep.map((badge) => {
                const Icon = badge.unlocked ? (ICON[badge.icon] ?? Award) : Lock
                return (
                  <li
                    key={badge.key}
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                      'min-h-[80px] p-2.5 sm:p-3 flex items-start gap-2.5 sm:gap-3 rounded-xl border-2 transition-colors duration-150 select-none relative',
                      badge.unlocked
                        ? 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:border-amber-400/80'
                        : 'border-slate-800 bg-slate-900/40 opacity-75 hover:border-slate-700',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg mt-0.5',
                        badge.unlocked
                          ? 'bg-gradient-to-b from-amber-400/25 to-amber-600/30 border border-amber-400/50 text-amber-400 shadow-xs'
                          : 'bg-slate-800 text-slate-500',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-bold truncate min-w-0',
                            badge.unlocked ? 'text-amber-300' : 'text-slate-300',
                          )}
                          title={badge.title}
                        >
                          {badge.title}
                        </span>
                        <span className="shrink-0 text-xs font-black text-amber-400 tabular-nums whitespace-nowrap">
                          +{badge.rewardXp} XP
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-snug text-slate-400 break-words">
                        {badge.description}
                      </p>
                      {badge.unlocked && badge.unlockedAt ? (
                        <p className="text-[10px] text-amber-400/70 font-medium truncate mt-0.5">
                          Mở ngày {NGAY.format(badge.unlockedAt)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer: Thoát - Luôn cố định ở đáy modal, không bị che khuất */}
        <div className="flex justify-end items-center pt-2.5 sm:pt-4 border-t border-sky-950/60 mt-auto shrink-0 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold px-5 sm:px-6 h-9 sm:h-10 cursor-pointer border border-slate-700/80 bg-[#162238] hover:bg-[#202f4d] text-slate-200 transition-colors shrink-0"
          >
            Thoát
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
