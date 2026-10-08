import { useState, type ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gem,
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
  IconCrown3D,
  IconCaroCubes3D,
  IconManaCrystal3D,
  IconChest3D,
  IconLaurelDiamond3D,
  IconTrophyGold3D,
  IconXpMedal3D,
  IconRankStar3D,
  IconStarSparkle,
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
  const [activeTab, setActiveTab] = useState<'shop' | 'badges'>('badges')

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
      <DialogContent className="skeuo-modal-surface sm:max-w-[560px] w-[calc(100vw-2rem)] max-h-[calc(100svh-3rem)] p-5 sm:p-6 overflow-y-auto text-white">
        <BlueprintArcadePattern className="opacity-75 pointer-events-none" />
        <DialogHeader className="shrink-0 mb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2 tracking-wide">
                <Award className="size-5 text-amber-400" />
                <span>Thành tựu & Huy hiệu</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Thông tin kinh nghiệm và cửa hàng vật phẩm
              </DialogDescription>

              {/* Thanh tiến trình điểm kinh nghiệm */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                  <span>Điểm kinh nghiệm</span>
                  <span className="text-amber-300 font-black">{xp} / {level * 100} XP</span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#070e1c] border border-sky-950 p-0.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.7)] transition-all duration-500"
                    style={{ width: `${Math.min(100, ((xp % 100) || 40))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Khung Kim Cương Nguyệt Quế 3D góc phải */}
            <div className="shrink-0 p-2 rounded-2xl bg-gradient-to-b from-[#111f3d] to-[#071124] border border-sky-500/25 shadow-lg flex items-center justify-center">
              <IconLaurelDiamond3D size={56} className="drop-shadow-md" />
            </div>
          </div>
        </DialogHeader>

        {/* 3 Thẻ Chỉ Số 3D (Điểm kinh nghiệm, Số trận thắng, Hạng hiện tại) */}
        <div className="grid grid-cols-3 gap-2.5 my-2">
          {/* 1. Điểm kinh nghiệm */}
          <div className="p-2.5 rounded-2xl border-2 border-slate-800 bg-[#0d1629] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold">Điểm kinh nghiệm</p>
              <p className="text-xl font-black text-white mt-0.5">{level}</p>
            </div>
            <IconXpMedal3D size={34} className="shrink-0 drop-shadow-md" />
          </div>

          {/* 2. Số trận thắng */}
          <div className="p-2.5 rounded-2xl border-2 border-slate-800 bg-[#0d1629] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-semibold">Số trận thắng</p>
              <p className="text-xl font-black text-white mt-0.5">{streak * 17 || 53}</p>
            </div>
            <IconTrophyGold3D size={34} className="shrink-0 drop-shadow-md" />
          </div>

          {/* 3. Hạng hiện tại */}
          <div className="p-2.5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#1a1c2e] to-[#0d1629] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-300/80 font-bold">Hạng hiện tại</p>
              <p className="text-xs font-black text-amber-300 mt-1">Hạng Vàng</p>
            </div>
            <IconRankStar3D size={34} className="shrink-0 drop-shadow-md" />
          </div>
        </div>

        {/* Chuyển đổi tab Cửa hàng / Huy hiệu */}
        <div className="flex items-center justify-between pt-2 pb-1 shrink-0">
          <div className="flex items-center gap-2 select-none">
            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              className={cn(
                'h-8 px-3.5 rounded-xl text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center',
                activeTab === 'shop'
                  ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white',
              )}
            >
              Cửa hàng vật phẩm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={cn(
                'h-8 px-3.5 rounded-xl text-xs font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center',
                activeTab === 'badges'
                  ? 'bg-amber-400 text-amber-950 shadow-md font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white',
              )}
            >
              Huy hiệu ({unlockedCount}/{totalCount})
            </button>
          </div>
        </div>

        {/* Khung nội dung cố định chiều cao cho cả 2 tab (Triệt tiêu 100% Layout Shift khi chuyển tab) */}
        {activeTab === 'shop' ? (
          /* Lưới 6 vật phẩm Cửa hàng 3D */
          <div className="h-[370px] min-h-[370px] max-h-[370px] overflow-y-auto pr-1 my-2 select-none">
            <div className="grid grid-cols-3 gap-2.5 py-1">
              {[
                {
                  id: 'chest_shard',
                  name: 'Gói Mảnh Tướng',
                  price: '1200 Vàng',
                  priceType: 'gold',
                  Icon: IconChest3D,
                },
                {
                  id: 'board_galaxy',
                  name: 'Giao diện Tinh tú',
                  price: '50 Kim cương',
                  priceType: 'diamond',
                  Icon: IconManaCrystal3D,
                },
                {
                  id: 'caro_classic',
                  name: 'Hậu vệ Caro Cổ điển',
                  price: '50 Kim cương',
                  priceType: 'diamond',
                  Icon: IconCaroCubes3D,
                },
                {
                  id: 'chest_gold',
                  name: 'Rương Báu Hoàng Kim',
                  price: '1200 Vàng',
                  priceType: 'gold',
                  Icon: IconChest3D,
                },
                {
                  id: 'crown_royal',
                  name: 'Vương Miện Quý Tộc',
                  price: '50 Kim cương',
                  priceType: 'diamond',
                  Icon: IconCrown3D,
                },
                {
                  id: 'throne_warlord',
                  name: 'Ngai Vàng Chiến Tướng',
                  price: '50 Kim cương',
                  priceType: 'diamond',
                  Icon: IconTrophyGold3D,
                },
              ].map((item) => {
                const ItemIcon = item.Icon
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border-2 border-slate-800 bg-[#0c1527] p-2.5 flex flex-col items-center justify-between text-center h-[170px] hover:border-amber-400/50 hover:shadow-lg transition-colors duration-150 group select-none"
                  >
                    <span className="text-[11px] font-bold text-white line-clamp-1 w-full">{item.name}</span>
                    <div className="my-1 py-1">
                      <ItemIcon size={48} className="drop-shadow-lg group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold mb-1">
                      {item.priceType === 'gold' ? (
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Coins className="size-3" />
                          {item.price}
                        </span>
                      ) : (
                        <span className="text-sky-300 flex items-center gap-0.5">
                          <Gem className="size-3 text-sky-400" />
                          {item.price}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {}}
                      className="w-full h-7 rounded-full border border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 text-amber-200 text-[11px] font-bold transition-colors duration-150 cursor-pointer flex items-center justify-center shadow-xs"
                    >
                      Mua bùa
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Danh sách Huy hiệu (Card cố định chiều cao, không rớt dòng badge XP, chống rung giật) */
          <div className="h-[370px] min-h-[370px] max-h-[370px] overflow-y-auto pr-1 my-2 select-none">
            {isLoading ? (
              <div className="grid gap-2 sm:grid-cols-2 py-1" aria-hidden>
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-[84px] w-full rounded-xl bg-slate-800/60" />
                ))}
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <AlertCircle className="size-6 text-red-400" />
                <p className="mt-2 text-sm text-slate-300">
                  {error instanceof Error ? error.message : 'Không thể tải huy hiệu.'}
                </p>
                <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : sapXep.length === 0 ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <Award className="size-6 text-slate-500" />
                <p className="mt-2 text-sm font-medium text-slate-300">Chưa có huy hiệu nào</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-1">
                {sapXep.map((badge) => {
                  const Icon = badge.unlocked ? (ICON[badge.icon] ?? Award) : Lock
                  return (
                    <li
                      key={badge.key}
                      className={cn(
                        'h-[84px] min-h-[84px] max-h-[84px] flex items-center gap-3 rounded-xl border-2 px-3 py-2 transition-colors duration-150 select-none overflow-hidden relative',
                        badge.unlocked
                          ? 'border-amber-400/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:border-amber-400/80'
                          : 'border-slate-800 bg-slate-900/40 opacity-75 hover:border-slate-700',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg',
                          badge.unlocked
                            ? 'bg-gradient-to-b from-amber-400/25 to-amber-600/30 border border-amber-400/50 text-amber-400 shadow-xs'
                            : 'bg-slate-800 text-slate-500',
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1 h-full flex flex-col justify-center">
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
                        <p className="mt-1 text-xs leading-snug text-slate-400 line-clamp-2 break-words">
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
        )}

        {/* Footer: Thoát & Nạp tiền ngay */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t border-sky-950/60 mt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-semibold px-6 h-10 cursor-pointer border border-slate-700/80 bg-[#162238] hover:bg-[#202f4d] text-slate-200 transition-colors"
          >
            Thoát
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="cyber-gold-charge-btn rounded-full text-xs font-black px-8 h-10 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_25px_rgba(245,158,11,0.6)] relative overflow-visible"
          >
            <span>Nạp tiền ngay</span>
            <IconStarSparkle className="absolute -top-2.5 -right-2 text-amber-200 drop-shadow-[0_0_8px_#fff]" size={20} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
