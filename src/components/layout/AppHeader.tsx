import { NavLink, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { GraduationCap, MessageSquare, Search } from 'lucide-react'
import { useState } from 'react'

interface AppHeaderProps {
  nguoiDung: NguoiDung
  trangThai: TrangThaiKetNoiCampus
  onlineCount: number
  latencyMs: number | null
  messageCount: number
  onDoDoTre: () => void
  onKetNoiLai: () => void
  onDangXuat: () => void
  onToggleChat: () => void
  onLamMoiPhien?: () => Promise<void>
}

const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Trang chủ', exact: true },
  { to: '/learn', label: 'Học tập' },
  { to: '/arena', label: 'Game' },
  { to: '/community', label: 'Cộng đồng' },
  { to: '/me', label: 'Cá nhân' },
]

export function AppHeader({
  nguoiDung,
  trangThai,
  onlineCount,
  latencyMs,
  messageCount,
  onDoDoTre,
  onKetNoiLai,
  onDangXuat,
  onToggleChat,
  onLamMoiPhien,
}: AppHeaderProps) {
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/learn?q=${encodeURIComponent(searchVal.trim())}`)
    } else {
      navigate('/learn')
    }
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-border-subtle">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">

        {/* ── Left: Brand + Desktop Nav ── */}
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          {/* Brand mark */}
          <NavLink to="/" className="flex items-center gap-2 group shrink-0 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand shadow-sm group-hover:bg-brand/20 transition-all duration-150">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="hidden sm:block text-sm font-extrabold tracking-tight text-text-primary">
              Digital Campus
            </span>
            <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-[10px] font-semibold text-brand leading-none">
              v2.1
            </span>
          </NavLink>

          {/* Desktop nav — separator + pill-link items */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-0.5 pl-3 border-l border-border-subtle"
          >
            {DESKTOP_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  [
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
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

        {/* ── Center: Search ── */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center flex-1 max-w-[280px] mx-4"
          role="search"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
            <input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Tìm phòng học…"
              aria-label="Tìm phòng học"
              className={[
                'h-9 w-full rounded-lg pl-9 pr-3',
                'border border-border-default bg-surface/60',
                'text-sm text-text-primary placeholder:text-text-tertiary',
                'outline-none transition-all duration-150',
                'focus:border-brand/40 focus:bg-surface focus:ring-2 focus:ring-brand/15',
              ].join(' ')}
            />
          </div>
        </form>

        {/* ── Right: Action cluster ── */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Connection status */}
          <ConnectionIndicator
            trangThai={trangThai}
            onlineCount={onlineCount}
            latencyMs={latencyMs}
            onDoDoTre={onDoDoTre}
            onKetNoiLai={onKetNoiLai}
          />

          {/* Notifications */}
          <NotificationCenter />

          {/* Friends — hidden on mobile (in community tab) */}
          <div className="hidden sm:block">
            <FriendsDrawer />
          </div>

          {/* Campus Chat trigger */}
          <Button
            variant="ghost"
            size="icon-sm"
            data-testid="campus-chat-trigger"
            onClick={onToggleChat}
            title="Mở trò chuyện toàn trường"
            className="relative text-text-secondary hover:text-text-primary"
          >
            <MessageSquare className="h-4 w-4" />
            {messageCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            )}
          </Button>

          {/* Divider + Account Quick Center */}
          <div className="flex items-center pl-1 sm:pl-2 border-l border-border-subtle">
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
