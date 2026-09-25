import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { GraduationCap, MessageSquare } from 'lucide-react'
import { DESKTOP_NAV_LINKS } from './navigation-config'

export { DESKTOP_NAV_LINKS }

interface AppHeaderProps {
  nguoiDung: NguoiDung
  trangThai: TrangThaiKetNoiCampus
  onlineCount: number
  latencyMs: number | null
  /** Có tin trò chuyện của người khác mới hơn lần xem gần nhất. */
  coTinNhanMoi: boolean
  onDoDoTre: () => void
  onKetNoiLai: () => void
  onDangXuat: () => void
  onToggleChat: () => void
  onLamMoiPhien?: () => Promise<void>
}


export function AppHeader({
  nguoiDung,
  trangThai,
  onlineCount,
  latencyMs,
  coTinNhanMoi,
  onDoDoTre,
  onKetNoiLai,
  onDangXuat,
  onToggleChat,
  onLamMoiPhien,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 glass border-b border-border-subtle">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">

        {/* ── Left: Brand + Desktop Nav ── */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5 min-w-0">
          {/* Brand mark pointing to canonical /learn */}
          <NavLink to="/learn" className="flex items-center gap-2 group shrink-0 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand shadow-sm group-hover:bg-brand/20 transition-all duration-150">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="hidden sm:block text-sm font-extrabold tracking-tight text-text-primary">
              Digital Campus
            </span>
          </NavLink>

          {/* Desktop nav — exactly 3 items: Học tập, Game, Cộng đồng */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-0.5 pl-2 lg:pl-3 border-l border-border-subtle"
          >
            {DESKTOP_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'relative whitespace-nowrap px-2 lg:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-brand/12 text-brand font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Right: Action cluster (Connection, Notifications, Chat, Account) ── */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Connection status */}
          <ConnectionIndicator
            trangThai={trangThai}
            onlineCount={onlineCount}
            latencyMs={latencyMs}
            onDoDoTre={onDoDoTre}
            onKetNoiLai={onKetNoiLai}
          />

          {/* Secondary icon group */}
          <div className="flex items-center gap-0.5">
            {/* Notifications */}
            <NotificationCenter />

            {/* Campus Chat trigger */}
            <Button
              variant="ghost"
              size="icon"
              data-testid="campus-chat-trigger"
              onClick={onToggleChat}
              title="Mở trò chuyện toàn trường"
              aria-label={coTinNhanMoi ? 'Trò chuyện toàn trường (có tin mới)' : 'Trò chuyện toàn trường'}
              className="relative size-9 rounded-xl text-text-secondary hover:text-text-primary"
            >
              <MessageSquare className="size-[18px]" />
              {coTinNhanMoi && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand ring-2 ring-canvas" />
              )}
            </Button>
          </div>

          {/* Divider + Account Quick Center */}
          <div className="ml-0.5 flex items-center border-l border-border-subtle pl-1 sm:pl-2">
            <UserAvatarMenu
              nguoiDung={nguoiDung}
              onDangXuat={onDangXuat}
              onLamMoiPhien={onLamMoiPhien}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
