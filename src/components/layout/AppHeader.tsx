// Digital Campus v2: Canonical Global Header (Approved Reference Design)
// src/components/layout/AppHeader.tsx

import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { GraduationCap, MessageSquare } from 'lucide-react'
import { ThemeSwitch } from './ThemeSwitch'
import { CampusSearch } from './CampusSearch'

interface AppHeaderProps {
  nguoiDung: NguoiDung | null
  trangThai: TrangThaiKetNoiCampus
  onlineCount: number
  latencyMs: number | null
  /** Có tin trò chuyện của người khác mới hơn lần xem gần nhất */
  coTinNhanMoi: boolean
  onDoDoTre: () => void
  onKetNoiLai: () => void
  onDangXuat: () => void
  onToggleChat: () => void
  onLamMoiPhien?: () => Promise<void>
  onMoAuthModal?: (mode?: 'dang_nhap' | 'dang_ky' | 'quen_mat_khau') => void
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
  onMoAuthModal,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] border-b border-border-subtle bg-canvas/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-3 sm:px-6">
        {/* ── Left Area: Mobile Brand + Desktop Search ── */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile brand logo (visible only on mobile/tablet when sidebar is hidden) */}
          <NavLink to="/learn" className="flex lg:hidden items-center gap-2.5 group shrink-0 select-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/30 bg-brand/15 text-brand shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-text-primary leading-tight">
                Digital Campus
              </span>
            </div>
          </NavLink>

          {/* Search bar (Full width pill input on desktop, icon on mobile) */}
          <div className="flex-1 max-w-xl">
            <CampusSearch />
          </div>
        </div>

        {/* ── Right Area: Status + Theme + Notifications + Messages + Avatar ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Connection status (only when logged in) */}
          {nguoiDung && (
            <ConnectionIndicator
              trangThai={trangThai}
              onlineCount={onlineCount}
              latencyMs={latencyMs}
              onDoDoTre={onDoDoTre}
              onKetNoiLai={onKetNoiLai}
            />
          )}

          {/* Theme switch */}
          <ThemeSwitch />

          {/* Notifications (only when logged in) */}
          {nguoiDung && <NotificationCenter />}

          {/* Messages / Campus Chat trigger button */}
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onToggleChat}
            aria-label="Trò chuyện toàn trường"
            title="Trò chuyện toàn trường"
            data-testid="header-chat-button"
            className="relative"
          >
            <MessageSquare className="size-4.5 text-text-secondary hover:text-text-primary transition-colors" />
            {coTinNhanMoi && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
            )}
          </Button>

          {/* Account / User Menu */}
          <div className="ml-1 sm:ml-2 flex items-center border-l border-border-subtle pl-2 sm:pl-3">
            {nguoiDung ? (
              <UserAvatarMenu
                nguoiDung={nguoiDung}
                onDangXuat={onDangXuat}
                onLamMoiPhien={onLamMoiPhien}
              />
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoAuthModal?.('dang_nhap')}
                  className="h-9 px-3 text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => onMoAuthModal?.('dang_ky')}
                  className="h-9 px-3.5 text-xs sm:text-sm font-semibold bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
