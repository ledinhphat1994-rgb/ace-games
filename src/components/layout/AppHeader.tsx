import { memo } from 'react'
import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import { NGUOI_DUNG_MAC_DINH, type NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { MessageSquare } from 'lucide-react'
import { ThemeSwitch } from './ThemeSwitch'
import { DigitalCampusLogo } from '@/components/brand/DigitalCampusLogo'


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
}

export const AppHeader = memo(function AppHeader({
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
    <header className="sticky top-0 z-30 w-full pt-[env(safe-area-inset-top)] border-b border-border-subtle bg-surface/95 backdrop-blur-md">
      <div className="flex h-13 sm:h-16 w-full items-center justify-between gap-2.5 sm:gap-6 px-2.5 sm:px-6">
        {/* ── Left Area: Brand Logo (Topbar dài hết chiều ngang chứa logo và chữ Digital Campus) + Desktop Search ── */}
        <div className="flex items-center gap-2.5 sm:gap-6 min-w-0 flex-1">
          {/* Brand logo (visible across desktop & mobile) */}
          <NavLink to="/" className="flex items-center gap-2.5 group shrink-0 select-none rounded-xl py-1 pr-1 sm:pr-2 hover:opacity-90 transition-opacity">
            <DigitalCampusLogo size="md" />
            <div className="min-w-0">
              <span className="block text-sm sm:text-base font-extrabold tracking-tight text-text-primary leading-tight">
                Ace Games
              </span>
            </div>
            <span className="lg:hidden sr-only">Thương hiệu Ace Games</span>
          </NavLink>
          {/* Vùng 1: Đã xóa thanh tìm kiếm theo yêu cầu (CampusSearch) */}
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

          {/* Notifications */}
          <NotificationCenter />

          {/* Messages / Campus Chat trigger button (Chuyển xuống Vùng 5 góc phải dưới cùng) */}
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={onToggleChat}
            aria-label="Trò chuyện toàn trường"
            title="Trò chuyện toàn trường"
            data-testid="header-chat-button"
            className="relative hidden"
          >
            <MessageSquare className="size-4.5 text-text-secondary hover:text-text-primary transition-colors" />
            {coTinNhanMoi && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
              </span>
            )}
          </Button>

          {/* Account / User Menu — Luôn hiển thị Avatar User, ẩn hoàn toàn chức năng đăng nhập / đăng ký */}
          <div className="ml-1 sm:ml-2 flex items-center border-l border-border-subtle pl-2 sm:pl-3">
            <UserAvatarMenu
              nguoiDung={nguoiDung || NGUOI_DUNG_MAC_DINH}
              onDangXuat={onDangXuat}
              onLamMoiPhien={onLamMoiPhien}
            />
          </div>
        </div>
      </div>
    </header>
  )
})
