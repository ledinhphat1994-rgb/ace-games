import { NavLink } from 'react-router'
import {
  Home,
  BookOpen,
  Gamepad2,
  Users,
  Trophy,
  MessageSquare,
  UserCheck,
  Bell,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NguoiDung } from '@/lib/api'
import { useCampusContext } from '@/app/CampusContext'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'

interface AppSidebarProps {
  nguoiDung: NguoiDung | null
  coTinNhanMoi?: boolean
  onToggleChat?: () => void
  className?: string
}

export function AppSidebar({
  nguoiDung,
  coTinNhanMoi = false,
  onToggleChat,
  className,
}: AppSidebarProps) {
  const { notifications } = useCampusContext()
  const thongBaoChuaDoc = notifications.filter((n) => !n.read).length

  const mainNavItems = [
    { to: '/', label: 'Trang chủ', icon: Home, exact: true },
    { to: '/learn', label: 'Học tập', icon: BookOpen },
    { to: '/arena', label: 'Game', icon: Gamepad2 },
    { to: '/community', label: 'Cộng đồng', icon: Users },
    { to: '/rankings', label: 'Bảng xếp hạng', icon: Trophy },
  ]

  const handleOpenChat = () => {
    if (onToggleChat) {
      onToggleChat()
    } else {
      window.dispatchEvent(new CustomEvent('campus:open-chat'))
    }
  }

  const handleOpenNotifications = () => {
    window.dispatchEvent(new CustomEvent('campus:open-notifications'))
  }

  return (
    <aside
      aria-label="Điều hướng chính"
      className={cn(
        'hidden lg:flex w-60 xl:w-64 shrink-0 flex-col justify-between border-r border-border-subtle bg-surface sticky top-0 h-screen z-20 select-none py-4 px-3',
        className,
      )}
    >
      {/* ── Top: Brand & Main Navigation ── */}
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <NavLink
          to="/"
          className="flex items-center gap-3 px-2 py-1.5 group rounded-2xl hover:bg-surface-overlay transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/12 border border-brand/25 text-brand shadow-sm group-hover:scale-105 group-hover:bg-brand/20 transition-all duration-200">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="block text-sm font-bold tracking-tight text-text-primary leading-tight">
                Digital Campus
              </span>
              <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand leading-none">
                v2.4
              </span>
            </div>
            <span className="block text-[11px] font-medium text-text-tertiary truncate mt-0.5">
              Lớp 10A7 · 2026-2027
            </span>
          </div>
        </NavLink>

        {/* Primary Navigation List */}
        <div className="space-y-1">
          <p className="px-3 pb-1.5 text-[10px] font-black text-text-tertiary uppercase tracking-wider">
            Khám phá
          </p>
          <nav aria-label="Khu vực hoạt động" className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand',
                      isActive
                        ? 'bg-brand/12 text-brand font-bold shadow-xs'
                        : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      )}
                      <Icon className={cn('h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-brand' : 'text-text-secondary')} />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Communication & Social Section */}
        <div className="pt-2 border-t border-border-subtle/80 space-y-1">
          <p className="px-3 pb-1.5 text-[10px] font-black text-text-tertiary uppercase tracking-wider">
            Kết nối & Tiện ích
          </p>

          {/* Tin nhắn */}
          <button
            type="button"
            onClick={handleOpenChat}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <MessageSquare className="h-4.5 w-4.5 shrink-0 text-text-secondary group-hover:text-text-primary transition-colors" />
              <span className="truncate">Tin nhắn trường</span>
            </div>
            {coTinNhanMoi && (
              <span className="flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>

          {/* Bạn bè */}
          <NavLink
            to="/community?tab=friends"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-text-secondary hover:bg-surface-overlay hover:text-text-primary group',
                isActive && 'bg-surface-overlay text-text-primary font-semibold',
              )
            }
          >
            <UserCheck className="h-4.5 w-4.5 shrink-0 text-text-secondary group-hover:text-text-primary transition-colors" />
            <span className="truncate">Bạn bè</span>
          </NavLink>

          {/* Thông báo */}
          <button
            type="button"
            onClick={handleOpenNotifications}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-colors cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Bell className="h-4.5 w-4.5 shrink-0 text-text-secondary group-hover:text-text-primary transition-colors" />
              <span className="truncate">Thông báo</span>
            </div>
            {thongBaoChuaDoc > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand/20 text-brand px-1.5 text-[10px] font-black tabular-nums border border-brand/30">
                {thongBaoChuaDoc > 99 ? '99+' : thongBaoChuaDoc}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Bottom: User profile card in sidebar ── */}
      {nguoiDung ? (
        <NavLink
          to="/me"
          className="flex items-center gap-3 p-2.5 rounded-2xl border border-border-default/80 bg-surface-raised/60 hover:bg-surface-overlay hover:border-brand/30 transition-all duration-200 group shadow-xs"
        >
          <div className="relative shrink-0">
            <AnhNguoiDung
              avatar={nguoiDung.avatar}
              ten={nguoiDung.ten || nguoiDung.username}
              className="h-9 w-9 rounded-xl border border-border-default text-xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-surface" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate group-hover:text-brand transition-colors">
              {nguoiDung.ten || nguoiDung.username}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary mt-0.5">
              <span className="font-semibold text-brand">Cấp 5</span>
              <span>•</span>
              <span className="truncate">
                {nguoiDung.role === 'teacher' ? 'Giáo viên' : nguoiDung.role === 'admin' ? 'Quản trị' : 'Lớp 10A7'}
              </span>
            </div>
          </div>
        </NavLink>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised/40 p-3 text-center">
          <p className="text-xs font-semibold text-text-secondary">Chưa đăng nhập</p>
          <p className="text-[10px] text-text-tertiary mt-0.5 mb-2">Đăng nhập để kết nối lớp học</p>
          <NavLink
            to="/learn"
            className="block w-full py-1.5 text-xs font-bold rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 transition-colors shadow-xs"
          >
            Đăng nhập
          </NavLink>
        </div>
      )}

    </aside>
  )
}
