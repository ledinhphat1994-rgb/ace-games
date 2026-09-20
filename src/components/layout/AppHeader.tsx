import { NavLink, useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationCenter } from '@/components/NotificationCenter'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import { AccountMenu } from './AccountMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import {
  GraduationCap,
  MessageSquare,
  Search,
} from 'lucide-react'
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
}

const DESKTOP_NAV_LINKS = [
  { to: '/', label: 'Trang chủ', exact: true },
  { to: '/learn', label: 'Học tập' },
  { to: '/arena', label: 'Game' },
  { to: '/community', label: 'Cộng đồng' },
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
    <header className="sticky top-0 z-30 border-b border-border/80 bg-[#080c14]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Brand & Desktop Navigation */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-sm group-hover:bg-primary/20 transition-all">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-foreground">
                  Digital Campus
                </span>
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 px-1 py-0 text-[10px] font-semibold text-primary"
                >
                  v2.1
                </Badge>
              </div>
            </div>
          </NavLink>

          {/* Primary Desktop Nav */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-1 pl-2 border-l border-border/60"
          >
            {DESKTOP_NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary/15 text-primary shadow-xs'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Center: Search input */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center flex-1 max-w-xs mx-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Tìm phòng học, bạn bè…"
              className="h-8 pl-8 pr-3 text-xs bg-card/60 border-border/70 focus:bg-card"
            />
          </div>
        </form>

        {/* Right: Status & Supporting Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live presence indicator */}
          <ConnectionIndicator
            trangThai={trangThai}
            onlineCount={onlineCount}
            latencyMs={latencyMs}
            onDoDoTre={onDoDoTre}
            onKetNoiLai={onKetNoiLai}
          />

          {/* Notifications */}
          <NotificationCenter />

          {/* Friends Drawer */}
          <FriendsDrawer />

          {/* Chat Drawer Trigger (On-demand, doesn't consume desktop 400px column) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleChat}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-white/10 relative"
            title="Mở trò chuyện toàn trường"
          >
            <MessageSquare className="h-4 w-4" />
            {messageCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </Button>

          {/* Account & Profile Menu (with contextual admin controls) */}
          <div className="flex items-center pl-1 border-l border-border/60">
            <AccountMenu
              nguoiDung={nguoiDung}
              onDangXuat={onDangXuat}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
