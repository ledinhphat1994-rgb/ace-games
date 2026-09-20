import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
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

export function AccountMenu({ nguoiDung, onDangXuat }: AccountMenuProps) {
  const navigate = useNavigate()
  const displayName = nguoiDung.ten || nguoiDung.username
  const avatarUrl = nguoiDung.avatar
  const roleText = nguoiDung.isSchoolAdmin
    ? 'Quản trị viên'
    : nguoiDung.isVerifiedTeacher
      ? 'Giáo viên'
      : 'Học sinh'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-testid="account-menu-trigger"
        className="flex items-center gap-2 rounded-full p-0.5 ring-1 ring-border/80 hover:ring-primary/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        title={`Tài khoản: ${displayName}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover border border-border/50"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary border border-primary/30 uppercase">
            {displayName.slice(0, 2)}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-56 border-border/80 bg-[#0f172a]/95 p-1.5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-2.5 p-2 border-b border-border/50 mb-1">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover border border-border/60 shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary border border-primary/30 shrink-0 uppercase">
              {displayName.slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium border-primary/30 text-primary">
                {roleText}
              </Badge>
              {nguoiDung.lop?.ten && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {nguoiDung.lop.ten}
                </span>
              )}
            </div>
          </div>
        </div>

        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => navigate('/me')}
            className="cursor-pointer gap-2 text-xs py-1.5"
          >
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Hồ sơ cá nhân</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate('/me?tab=progress')}
            className="cursor-pointer gap-2 text-xs py-1.5"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span>Tiến trình & Huy hiệu</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Contextual Admin section (School Admin only) */}
        {nguoiDung.isSchoolAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quản trị hệ thống
              </DropdownMenuLabel>
              <DropdownMenuItem
                data-testid="admin-control-plane-link"
                onClick={() => navigate('/admin')}
                className="cursor-pointer gap-2 text-xs py-1.5 text-indigo-300 focus:text-indigo-200"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
                <span>Quản trị phòng học</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                data-testid="admin-analytics-link"
                onClick={() => navigate('/admin/analytics')}
                className="cursor-pointer gap-2 text-xs py-1.5 text-primary focus:text-primary"
              >
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span>Phân tích & Analytics</span>
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
