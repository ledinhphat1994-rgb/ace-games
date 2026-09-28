// Cột trái trang Học tập: bảng xếp hạng học tập của lớp trong tuần — cùng kiểu cột xếp hạng của trang Game.
// Điểm là XP máy chủ cộng khi kết thúc phiên học trong phòng (xp_ledger), không phải số liệu trang trí.

import { useQuery } from '@tanstack/react-query'
import { Crown, Flame, LogIn, RefreshCw, Trophy } from 'lucide-react'
import type { ClassLeaderboardItem } from '@shared/protocol/engagement'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BangXepHangTuan {
  lopTen: string | null
  currentWeek: string
  items: ClassLeaderboardItem[]
}

const MAU_AVATAR = ['#06b6d4', '#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

function AnhDaiDien({ ten, anh, lon = false, vien }: { ten: string; anh: string | null; lon?: boolean; vien?: string }) {
  const co = lon ? 'size-12 text-base' : 'size-7 text-xs'
  if (anh) return <img src={anh} alt="" className={cn('shrink-0 rounded-full object-cover', co, vien)} />
  const so = [...ten].reduce((tong, kyTu) => tong + kyTu.charCodeAt(0), 0)
  return (
    <div
      className={cn('flex shrink-0 select-none items-center justify-center rounded-full font-black text-white', co, vien)}
      style={{ background: `linear-gradient(135deg, ${MAU_AVATAR[so % MAU_AVATAR.length]}, ${MAU_AVATAR[(so + 3) % MAU_AVATAR.length]})` }}
    >
      {ten.trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function ChuoiNgay({ soNgay }: { soNgay: number }) {
  if (soNgay <= 0) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-bold text-orange-300" title={`${soNgay} ngày học liên tiếp`}>
      <Flame className="size-3" />
      {soNgay}
    </span>
  )
}

export function BangXepHangHocTap({ className }: { className?: string }) {
  const { nguoiDung, moAuthModal } = usePhien()
  const { data, isPending, isError, refetch, isRefetching } = useQuery<BangXepHangTuan>({
    queryKey: ['engagement', 'leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard', { credentials: 'same-origin' })
      const json = (await res.json().catch(() => null)) as (BangXepHangTuan & { ok?: boolean; loi?: string }) | null
      if (!res.ok || !json?.ok || !Array.isArray(json.items)) throw new Error(json?.loi || 'Không tải được bảng xếp hạng.')
      return json
    },
    enabled: Boolean(nguoiDung),
    staleTime: 60_000,
  })

  // Chỉ người đã có XP trong tuần mới lên bảng (danh sách máy chủ đã xếp giảm dần).
  const coDiem = (data?.items ?? []).filter((r) => r.weeklyXp > 0)
  const quanQuan = coDiem[0]
  const conLai = coDiem.slice(1)

  return (
    <section
      aria-labelledby="learning-leaderboard-heading"
      data-testid="learning-leaderboard"
      className={cn(
        'flex h-[700px] flex-col overflow-hidden rounded-2xl border border-white/10 xl:h-[720px] 2xl:h-[740px]',
        'bg-gradient-to-b from-[#0e1527]/97 to-[#080c1a]/95 shadow-2xl backdrop-blur-md',
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/25 to-yellow-600/10">
            <Trophy className="size-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="learning-leaderboard-heading" className="text-sm leading-none font-black tracking-tight text-white">
                Bảng Xếp Hạng
              </h2>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-300 uppercase">
                Tuần này
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-none text-text-tertiary">{data?.lopTen ? `Lớp ${data.lopTen}` : 'Lớp của bạn'} • XP học tập</p>
          </div>
        </div>
        {nguoiDung && (
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isRefetching}
            aria-label="Làm mới bảng xếp hạng"
            className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-white/8 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className={cn('size-3.5', (isPending || isRefetching) && 'animate-spin')} />
          </button>
        )}
      </div>

      {!nguoiDung ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <Trophy className="size-6 text-amber-400" />
          <p className="text-sm font-bold text-white">Đăng nhập để xem bảng xếp hạng lớp</p>
          <Button size="sm" onClick={() => moAuthModal('dang_nhap')}>
            <LogIn />
            Đăng nhập
          </Button>
        </div>
      ) : isPending ? (
        <ul className="flex-1 space-y-1.5 p-3" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex animate-pulse items-center gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2">
              <div className="size-5 shrink-0 rounded bg-white/10" />
              <div className="size-7 shrink-0 rounded-full bg-white/10" />
              <div className="h-3 flex-1 rounded bg-white/10" />
              <div className="h-3 w-10 rounded bg-white/10" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-xs text-text-secondary">Không tải được bảng xếp hạng</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-white/5 hover:text-white"
          >
            <RefreshCw className="size-3" />
            Thử lại
          </button>
        </div>
      ) : !quanQuan ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center" data-testid="learning-leaderboard-empty">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Trophy className="size-6 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Chưa có ai lên bảng tuần này!</p>
            <p className="mt-1 text-xs text-text-tertiary">Học trong phòng để ghi điểm 🏆</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="shrink-0 px-3 pt-3 pb-1">
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-slate-950/80 p-3.5 shadow-xl">
              <div className="relative flex items-center gap-3">
                <div className="relative shrink-0">
                  <AnhDaiDien ten={quanQuan.displayName} anh={quanQuan.avatar} lon vien="ring-2 ring-amber-400/60" />
                  <span className="absolute -top-2.5 -left-1 text-base select-none">👑</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[10px] font-black tracking-wider text-amber-300 uppercase">
                    <Crown className="inline size-3 text-amber-400" />
                    Dẫn đầu tuần
                  </span>
                  <p className="mt-0.5 truncate text-sm font-black text-white" title={quanQuan.displayName}>
                    {quanQuan.displayName}
                    {quanQuan.isCurrentUser && <span className="ml-1 text-[10px] font-bold text-cyan-300">(Bạn)</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-xs font-bold text-amber-300">
                    {quanQuan.weeklyXp.toLocaleString('vi-VN')} <span className="font-sans text-[10px] font-normal text-text-tertiary">XP</span>
                    <ChuoiNgay soNgay={quanQuan.currentStreak} />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {conLai.length > 0 && (
            <ol className="space-y-1 px-2 pt-2 pb-3">
              {conLai.map((r) => (
                <li
                  key={r.accountId}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-2',
                    r.isCurrentUser
                      ? 'border-cyan-400/30 bg-cyan-500/10'
                      : r.rank === 2
                        ? 'border-slate-400/25 bg-gradient-to-r from-slate-400/15 via-slate-300/5 to-transparent'
                        : r.rank === 3
                          ? 'border-amber-700/25 bg-gradient-to-r from-amber-700/15 via-amber-600/5 to-transparent'
                          : 'border-white/[0.04] bg-white/[0.015]',
                  )}
                >
                  <div className="w-6 shrink-0 text-center">
                    {r.rank === 2 ? (
                      <span className="text-base leading-none select-none">🥈</span>
                    ) : r.rank === 3 ? (
                      <span className="text-base leading-none select-none">🥉</span>
                    ) : (
                      <span className="text-xs font-bold text-text-tertiary tabular-nums">#{r.rank}</span>
                    )}
                  </div>
                  <AnhDaiDien ten={r.displayName} anh={r.avatar} />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-text-primary" title={r.displayName}>
                    {r.displayName}
                    {r.isCurrentUser && <span className="ml-1 text-[10px] text-cyan-300">(Bạn)</span>}
                  </span>
                  <ChuoiNgay soNgay={r.currentStreak} />
                  <span className="min-w-[46px] shrink-0 text-right font-mono text-xs font-bold text-amber-300 tabular-nums">
                    {r.weeklyXp.toLocaleString('vi-VN')}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
