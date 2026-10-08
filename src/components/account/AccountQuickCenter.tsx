import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
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
import { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'
import { AvatarPickerDialog } from '@/features/profile/AvatarPickerDialog'
import { doiAvatar } from '@/lib/api'
import {
  Camera,
  KeyRound,
  LogOut,
  ShieldCheck,
  User,
} from 'lucide-react'

export interface AccountQuickCenterProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
  onLamMoiPhien?: () => Promise<void>
  className?: string
}

export function AccountQuickCenter({
  nguoiDung,
  onDangXuat,
  onLamMoiPhien,
  className,
}: AccountQuickCenterProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

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
  }

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

  const noiDung = (
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
  nguyHiem,
}: {
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  children: ReactNode
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
    </button>
  )
}
