import { useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { NguoiDung } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'
import { DoiTenDialog } from '@/features/profile/DoiTenDialog'
import { AvatarPickerDialog } from '@/features/profile/AvatarPickerDialog'
import { doiAvatar } from '@/lib/api'
import {
  Camera,
  KeyRound,
  LogOut,
  Pencil,
  ShieldCheck,
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

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
  }

  const [moDoiMatKhau, setMoDoiMatKhau] = useState(false)
  const [moDoiAvatar, setMoDoiAvatar] = useState(false)
  const [moDoiTen, setMoDoiTen] = useState(false)

  const tenHienThi = nguoiDung.ten || nguoiDung.username

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
        <button
          type="button"
          className="group/avatar relative cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0"
          onClick={() => {
            handleOpenChange(false)
            setMoDoiAvatar(true)
          }}
          title="Bấm để đổi ảnh đại diện"
          aria-label="Đổi ảnh đại diện"
        >
          <AnhDaiDien nguoiDung={nguoiDung} className="size-11 text-sm ring-1 ring-border-default transition-all group-hover/avatar:ring-brand" />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-[1px] transition-opacity group-hover/avatar:opacity-100">
            <Camera className="size-4 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand text-slate-950 shadow-sm ring-2 ring-slate-950">
            <Camera className="size-2.5" />
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              handleOpenChange(false)
              setMoDoiTen(true)
            }}
            className="group/name flex items-center gap-1.5 text-left text-sm font-semibold text-text-primary hover:text-brand transition-colors cursor-pointer w-full py-0.5"
            title="Bấm để đổi tên"
            aria-label="Đổi tên người chơi"
          >
            <span className="truncate">{tenHienThi}</span>
            <Pencil className="size-3.5 text-text-tertiary group-hover/name:text-brand transition-colors shrink-0" />
          </button>
        </div>
      </div>

      <nav aria-label="Tài khoản" className="space-y-0.5 border-t border-border-subtle pt-1.5">
        <MucMenu
          icon={Pencil}
          onClick={() => {
            handleOpenChange(false)
            setMoDoiTen(true)
          }}
        >
          Đổi tên người chơi
        </MucMenu>
        <MucMenu
          icon={Camera}
          onClick={() => {
            handleOpenChange(false)
            setMoDoiAvatar(true)
          }}
        >
          Đổi ảnh đại diện
        </MucMenu>
        {nguoiDung.accountId > 0 && (
          <MucMenu
            icon={KeyRound}
            onClick={() => {
              handleOpenChange(false)
              setMoDoiMatKhau(true)
            }}
          >
            Đổi mật khẩu
          </MucMenu>
        )}
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

  const menuKichHoat = (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        data-testid="account-menu-trigger"
        className={triggerClass}
        title="Tài khoản"
        aria-label="Mở trung tâm tài khoản"
      >
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] gap-0 p-3 bg-slate-950/95 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-md z-50"
      >
        {noiDung}
      </PopoverContent>
    </Popover>
  )

  return (
    <>
      {menuKichHoat}
      <DoiTenDialog open={moDoiTen} onOpenChange={setMoDoiTen} onSuccess={onLamMoiPhien} />
      <DoiMatKhauDialog open={moDoiMatKhau} onOpenChange={setMoDoiMatKhau} />
      <AvatarPickerDialog
        open={moDoiAvatar}
        onOpenChange={setMoDoiAvatar}
        currentAvatarUrl={nguoiDung.avatar || undefined}
        onSaveAvatar={async (url) => {
          if (!nguoiDung || nguoiDung.accountId === 0) {
            try {
              localStorage.setItem('dc_guest_avatar', url)
            } catch {}
          } else {
            await doiAvatar(url)
          }
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
