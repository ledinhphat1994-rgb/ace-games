import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { NguoiDung } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import type { EngagementProfile, UserAchievementItem } from '@shared/protocol/engagement'
import { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'
import { AvatarPickerDialog } from '@/features/profile/AvatarPickerDialog'
import { doiAvatar } from '@/lib/api'
import {
  AlertCircle,
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  Vote,
  Zap,
} from 'lucide-react'
import { deriveAchievementViewState } from './account-quick-center-state'

export interface AccountQuickCenterProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
  onLamMoiPhien?: () => Promise<void>
  className?: string
}

// Menu tài khoản chỉ là lối tắt: sửa hồ sơ, ảnh đại diện và mật khẩu đều nằm ở một nơi duy nhất là trang /me.
// Riêng huy hiệu có khung xem nhanh ngay trong menu.
type QuickCenterView = 'main' | 'achievements'

const ICON_THANH_TUU: Record<string, ComponentType<{ className?: string }>> = {
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

export function AccountQuickCenter({
  nguoiDung,
  onDangXuat,
  onLamMoiPhien,
  className,
}: AccountQuickCenterProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<QuickCenterView>('main')

  // Điện thoại: ngăn trượt từ dưới lên; máy tính: bảng nổi neo dưới ảnh đại diện.
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640
    }
    return false
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) setCurrentView('main')
  }

  // Chuỗi ngày & XP cho khung huy hiệu — cùng endpoint và khoá cache với trang Hồ sơ
  // (trước đây gọi một đường dẫn máy chủ không có — luôn 404, khung này lúc nào cũng báo lỗi).
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useQuery<{ ok: boolean; profile: EngagementProfile }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) {
        throw new Error('Không thể tải thông tin hoạt động.')
      }
      const data = await res.json()
      if (data && data.ok === false) {
        throw new Error(data.loi || data.message || 'Không thể tải thông tin hoạt động.')
      }
      return data
    },
    enabled: isOpen && currentView === 'achievements',
    staleTime: 30_000,
  })

  // Authoritative achievements query
  const {
    data: achievementsData,
    isLoading: isLoadingAchievements,
    isError: isAchievementsError,
    refetch: refetchAchievements,
  } = useQuery<{
    ok: boolean
    achievements?: UserAchievementItem[]
    items?: UserAchievementItem[]
  }>({
    queryKey: ['engagement', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/achievements')
      if (!res.ok) {
        throw new Error('Không thể tải danh sách thành tựu.')
      }
      const data = await res.json()
      if (data && data.ok === false) {
        throw new Error(data.loi || data.message || 'Không thể tải danh sách thành tựu.')
      }
      return data
    },
    enabled: isOpen && currentView === 'achievements',
    staleTime: 30_000,
  })

  const rawAchievements = achievementsData?.achievements || achievementsData?.items || []
  const achievementViewState = deriveAchievementViewState({
    isLoading: isLoadingAchievements,
    isError: isAchievementsError,
    items: rawAchievements,
  })

  const [moDoiMatKhau, setMoDoiMatKhau] = useState(false)
  const [moDoiAvatar, setMoDoiAvatar] = useState(false)

  const tenHienThi = nguoiDung.ten || nguoiDung.username
  const roleLabel = nguoiDung.isSchoolAdmin
    ? 'Quản trị viên'
    : nguoiDung.role === 'teacher'
      ? 'Giáo viên'
      : 'Học sinh'

  const diToi = (duongDan: string) => {
    handleOpenChange(false)
    navigate(duongDan)
  }

  const triggerClass = cn(
    'flex size-9 shrink-0 items-center justify-center rounded-full outline-none transition-shadow',
    'hover:ring-2 hover:ring-border-strong focus-visible:ring-2 focus-visible:ring-ring data-popup-open:ring-2 data-popup-open:ring-brand/60',
    className,
  )
  const triggerContent = <AnhDaiDien nguoiDung={nguoiDung} className="size-8 text-xs" />

  const noiDung =
    currentView === 'main' ? (
      <div>
        <div className="flex items-center gap-3 px-1 pb-3">
          <div
            className="group/avatar relative cursor-pointer"
            onClick={() => {
              handleOpenChange(false)
              setMoDoiAvatar(true)
            }}
            title="Đổi ảnh đại diện"
          >
            <AnhDaiDien nguoiDung={nguoiDung} className="size-11 text-sm ring-1 ring-border-default transition-all group-hover/avatar:ring-brand" />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/avatar:opacity-100">
              <Camera className="size-4 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold break-words text-text-primary">{tenHienThi}</p>
            <p className="text-xs break-words text-text-tertiary">
              @{nguoiDung.username} · {roleLabel}
            </p>
          </div>
        </div>

        <nav aria-label="Tài khoản" className="space-y-0.5 border-t border-border-subtle pt-1.5">
          <MucMenu icon={User} onClick={() => diToi('/me')}>
            Hồ sơ của tôi
          </MucMenu>
          <MucMenu icon={Award} onClick={() => setCurrentView('achievements')} coMuiTen>
            Huy hiệu & thành tựu
          </MucMenu>
          <MucMenu
            icon={KeyRound}
            onClick={() => {
              handleOpenChange(false)
              setMoDoiMatKhau(true)
            }}
          >
            Đổi mật khẩu
          </MucMenu>
          {nguoiDung.isSchoolAdmin && (
            <MucMenu icon={ShieldCheck} onClick={() => diToi('/admin')}>
              Trang quản trị trường
            </MucMenu>
          )}
        </nav>

        <div className="mt-1.5 border-t border-border-subtle pt-1.5">
          <MucMenu
            icon={LogOut}
            nguyHiem
            onClick={() => {
              handleOpenChange(false)
              onDangXuat()
            }}
          >
            Đăng xuất
          </MucMenu>
        </div>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentView('main')}
            aria-label="Quay lại"
            title="Quay lại"
            className="-ml-1.5"
          >
            <ChevronLeft />
          </Button>
          <p className="text-sm font-semibold text-text-primary">Huy hiệu & thành tựu</p>
        </div>

        {/* Chuỗi ngày và XP thật từ máy chủ */}
        <div className="flex min-h-14 items-center gap-3 rounded-xl bg-achievement/10 px-3 py-2.5">
          <Flame className="size-5 shrink-0 text-achievement" />
          {isLoadingProfile ? (
            <p className="text-xs text-text-tertiary">Đang tải số liệu…</p>
          ) : isProfileError ? (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-destructive">
              Không tải được số liệu
              <button
                type="button"
                onClick={() => void refetchProfile()}
                className="font-medium text-text-primary underline underline-offset-2"
              >
                Thử lại
              </button>
            </p>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary tabular-nums">
                {profileData?.profile?.currentStreak ?? 0} ngày liên tiếp
              </p>
              <p className="text-xs text-text-tertiary tabular-nums">
                {profileData?.profile?.totalXp ?? 0} XP · hôm nay +{profileData?.profile?.todayXp ?? 0}
              </p>
            </div>
          )}
        </div>

        {achievementViewState.status === 'loading' ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-text-tertiary">
            <Loader2 className="size-4 animate-spin" />
            Đang tải thành tựu…
          </div>
        ) : achievementViewState.status === 'error' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="size-6 text-destructive" />
            <p className="mt-2 text-sm font-medium text-text-primary">Không tải được thành tựu</p>
            <Button variant="outline" size="xs" className="mt-3" onClick={() => void refetchAchievements()}>
              Thử lại
            </Button>
          </div>
        ) : achievementViewState.status === 'empty' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Award className="size-6 text-text-tertiary" />
            <p className="mt-2 text-sm font-medium text-text-primary">Chưa có huy hiệu nào</p>
            <p className="mt-0.5 text-xs text-text-tertiary">Học nhóm và giữ chuỗi ngày để mở khoá.</p>
          </div>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-1">
            {achievementViewState.items.map((ach) => {
              const Icon = ach.unlocked ? (ICON_THANH_TUU[ach.icon] ?? Award) : Lock
              return (
                <li key={ach.key} className={cn('flex items-start gap-3 rounded-lg px-2 py-2', !ach.unlocked && 'opacity-60')}>
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      ach.unlocked ? 'bg-achievement/12 text-achievement' : 'bg-surface-overlay text-text-tertiary',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-[0.8125rem] font-medium text-text-primary">
                      <span className="min-w-0 break-words">{ach.title}</span>
                      {ach.rewardXp ? (
                        <span className="text-xs font-medium text-achievement tabular-nums">+{ach.rewardXp} XP</span>
                      ) : null}
                    </p>
                    <p className="text-xs leading-snug break-words text-text-tertiary">{ach.description}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}


      </div>
    )

  const menuKichHoat = isMobile ? (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger
        data-testid="account-menu-trigger"
        className={triggerClass}
        title="Tài khoản"
        aria-label="Mở trung tâm tài khoản"
      >
        {triggerContent}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85svh] gap-0 overflow-y-auto rounded-t-2xl px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <div aria-hidden className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
        <SheetHeader className="sr-only">
          <SheetTitle>Tài khoản</SheetTitle>
        </SheetHeader>
        {noiDung}
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        data-testid="account-menu-trigger"
        className={triggerClass}
        title="Tài khoản"
        aria-label="Mở trung tâm tài khoản"
      >
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80 gap-0 p-3">
        {noiDung}
      </PopoverContent>
    </Popover>
  )

  return (
    <>
      {menuKichHoat}
      <DoiMatKhauDialog open={moDoiMatKhau} onOpenChange={setMoDoiMatKhau} />
      <AvatarPickerDialog
        open={moDoiAvatar}
        onOpenChange={setMoDoiAvatar}
        currentAvatarUrl={nguoiDung.avatar || undefined}
        onSaveAvatar={async (url) => {
          await doiAvatar(url)
          if (onLamMoiPhien) await onLamMoiPhien()
        }}
      />
    </>
  )
}

function AnhDaiDien({ nguoiDung, className }: { nguoiDung: NguoiDung; className?: string }) {
  const ten = nguoiDung.ten || nguoiDung.username
  if (nguoiDung.avatar) {
    return <img src={nguoiDung.avatar} alt="" className={cn('shrink-0 rounded-full object-cover', className)} />
  }
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand/15 font-semibold text-brand', className)}
    >
      {getInitials(ten)}
    </span>
  )
}

function MucMenu({
  icon: Icon,
  onClick,
  children,
  coMuiTen,
  nguyHiem,
}: {
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  children: ReactNode
  /** Mở khung con ngay trong menu (thay vì chuyển trang). */
  coMuiTen?: boolean
  nguyHiem?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
        nguyHiem
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
      )}
    >
      <Icon className={cn('size-4 shrink-0', nguyHiem ? 'text-destructive' : 'text-text-tertiary')} />
      <span className="min-w-0 flex-1 break-words">{children}</span>
      {coMuiTen && <ChevronRight className="size-4 shrink-0 text-text-tertiary" />}
    </button>
  )
}
