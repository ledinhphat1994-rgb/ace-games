import { useNavigate } from 'react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { NguoiDung } from '@/lib/api'
import {
  BarChart3,
  LogOut,
  Shield,
  Trophy,
  User,
} from 'lucide-react'

interface AccountMenuProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
}

/** Shared avatar circle used in trigger and dropdown header */
function AvatarCircle({
  avatarUrl,
  displayName,
  size = 'sm',
}: {
  avatarUrl: string | undefined | null
  displayName: string
  size?: 'sm' | 'md'
}) {
  const cls = size === 'md'
    ? 'h-9 w-9 text-xs'
    : 'h-8 w-8 text-[11px]'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${cls} rounded-full object-cover border border-border-default shrink-0`}
      />
    )
  }
  return (
    <div
      className={`${cls} flex items-center justify-center rounded-full bg-brand/15 font-bold text-brand border border-brand/25 shrink-0 uppercase select-none`}
    >
      {displayName.slice(0, 2)}
    </div>
  )
}

export function AccountMenu({ nguoiDung, onDangXuat }: AccountMenuProps) {
  const navigate = useNavigate()
  const displayName = nguoiDung.ten || nguoiDung.username
  const avatarUrl = nguoiDung.avatar
  const roleText = nguoiDung.isSchoolAdmin
    ? 'Quản trị viên'
    : nguoiDung.isVerifiedTeacher
      ? 'Giáo viên'
      : 'Học sinh'
  const roleBg = nguoiDung.isSchoolAdmin
    ? 'bg-social/15 text-social border-social/20'
    : nguoiDung.isVerifiedTeacher
      ? 'bg-success/15 text-success border-success/20'
      : 'bg-brand/15 text-brand border-brand/20'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="account-menu-trigger"
        className="flex items-center rounded-full p-0.5 ring-1 ring-border-default hover:ring-brand/50 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand/60 cursor-pointer"
        title={`Tài khoản: ${displayName}`}
      >
        <AvatarCircle avatarUrl={avatarUrl} displayName={displayName} size="sm" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-56 border-border-default bg-surface-raised/96 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        {/* Identity header */}
        <div className="flex items-center gap-2.5 px-2 py-2 border-b border-border-subtle mb-1">
          <AvatarCircle avatarUrl={avatarUrl} displayName={displayName} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-text-primary">{displayName}</p>
            <span
              className={`mt-0.5 inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold leading-5 ${roleBg}`}
            >
              {roleText}
            </span>
          </div>
        </div>

        {/* User actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate('/me')}
            className="cursor-pointer gap-2 text-xs py-1.5"
          >
            <User className="h-3.5 w-3.5 text-text-tertiary" />
            <span>Hồ sơ cá nhân</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/me?tab=progress')}
            className="cursor-pointer gap-2 text-xs py-1.5"
          >
            <Trophy className="h-3.5 w-3.5 text-achievement" />
            <span>Tiến trình &amp; Huy hiệu</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Contextual admin section */}
        {nguoiDung.isSchoolAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                Quản trị hệ thống
              </DropdownMenuLabel>
              <DropdownMenuItem
                data-testid="admin-control-plane-link"
                onClick={() => navigate('/admin')}
                className="cursor-pointer gap-2 text-xs py-1.5 text-social focus:text-social"
              >
                <Shield className="h-3.5 w-3.5 text-social" />
                <span>Quản trị phòng học</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="admin-analytics-link"
                onClick={() => navigate('/admin/analytics')}
                className="cursor-pointer gap-2 text-xs py-1.5 text-brand focus:text-brand"
              >
                <BarChart3 className="h-3.5 w-3.5 text-brand" />
                <span>Phân tích &amp; Analytics</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDangXuat}
          className="cursor-pointer gap-2 text-xs py-1.5 text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
