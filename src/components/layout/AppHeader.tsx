import { NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { NguoiDung } from '@/lib/api'
import type { TrangThaiKetNoiCampus } from '@/hooks/use-campus'
import { GraduationCap } from 'lucide-react'
import { ThemeSwitch } from './ThemeSwitch'
import { CampusSearch } from './CampusSearch'
import { DESKTOP_NAV_LINKS } from './navigation-config'

export { DESKTOP_NAV_LINKS }

interface AppHeaderProps {
  nguoiDung: NguoiDung | null
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
  onMoAuthModal?: (mode?: 'dang_nhap' | 'dang_ky' | 'quen_mat_khau') => void
}

export function AppHeader({
  nguoiDung,
  trangThai,
  onlineCount,
  latencyMs,
  coTinNhanMoi: _coTinNhanMoi,
  onDoDoTre,
  onKetNoiLai,
  onDangXuat,
  onToggleChat: _onToggleChat,
  onLamMoiPhien,
  onMoAuthModal,
}: AppHeaderProps) {
  return (
    // Nền đặc (không dùng kính mờ): cuộn trang thì tiêu đề bên dưới không lộ xuyên qua thanh trên.
    <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] border-b border-border-subtle bg-canvas">
      {/* Ba cột: thương hiệu | nhóm tab căn giữa đúng tâm thanh | tài khoản */}
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-2 md:grid md:grid-cols-[1fr_auto_1fr] px-2.5 sm:px-4">

        {/* ── Left: Brand ── */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-self-start">
          {/* Brand mark pointing to canonical /learn */}
          <NavLink to="/learn" className="flex items-center gap-2 group shrink-0 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand shadow-sm group-hover:bg-brand/20 transition-all duration-150">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="hidden min-[480px]:block text-xs sm:text-sm font-bold tracking-tight text-text-primary">
              Digital Campus
            </span>
          </NavLink>
        </div>

        {/* ── Center: nhóm tab hoạt động (Học tập · Game) ── */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden lg:flex items-center gap-1 justify-self-center rounded-full border border-border-default bg-surface p-1"
          data-testid="nav-hoat-dong"
        >
          {DESKTOP_NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'relative flex min-h-10 items-center whitespace-nowrap rounded-full px-4 xl:px-6 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isActive
                    ? 'bg-brand/12 text-brand [text-shadow:0_0_14px_rgb(34_211_238/0.8)]'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right: Action cluster (Connection, Notifications, Chat, Account) ── */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-self-end">
          {/* Connection status — khách chưa đăng nhập không kết nối sảnh nên không có số trực tuyến thật để hiện */}
          {nguoiDung && (
            <ConnectionIndicator
              trangThai={trangThai}
              onlineCount={onlineCount}
              latencyMs={latencyMs}
              onDoDoTre={onDoDoTre}
              onKetNoiLai={onKetNoiLai}
            />
          )}

          {/* Secondary icon group */}
          <div className="flex items-center gap-0.5">
            <CampusSearch />
            <ThemeSwitch />
            {/* Notifications — chỉ khi đã đăng nhập */}
            {nguoiDung && <NotificationCenter />}
          </div>

          {/* Divider + Account / Auth buttons */}
          <div className="ml-0.5 flex items-center border-l border-border-subtle pl-1 sm:pl-2">
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
                  className="h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  onClick={() => onMoAuthModal?.('dang_ky')}
                  className="h-10 px-3 text-xs sm:text-sm font-semibold bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
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
