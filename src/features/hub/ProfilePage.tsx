import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogoGoogle } from '@/features/auth/LogoGoogle'
import { AvatarPickerDialog } from '@/features/profile/AvatarPickerDialog'
import { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'
import { ProgressPanel } from '@/features/profile/ProgressPanel'
import { capNhatHoSo, doiAvatar, goLienKetGoogle, layTrangThaiGoogle } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import { TEN_HIEN_THI_TOI_DA } from '@shared/protocol/common'
import {
  Camera,
  KeyRound,
  Pencil,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

const EMOJI_GOI_Y = ['💡', '✨', '🔥', '📚', '🎯', '🚀', '⭐', '🏆', '💪', '❤️', '😊', '🎓']

export function ProfilePage() {
  const { nguoiDung, lamMoiPhien, moAuthModal } = usePhien()
  const focusEditor = useCallback((node: HTMLInputElement | null) => node?.focus({ preventScroll: true }), [])
  const [searchParams, setSearchParams] = useSearchParams()

  // Hỗ trợ mở modal từ URL param (?tab=avatar hoặc ?tab=security)
  const tabTrenUrl = searchParams.get('tab')
  const [moAvatarModal, setMoAvatarModal] = useState(tabTrenUrl === 'avatar')
  const [moDoiMatKhauModal, setMoDoiMatKhauModal] = useState(tabTrenUrl === 'security')

  // Quản lý suy nghĩ nhanh của avatar
  const [dangSuaSuyNghi, setDangSuaSuyNghi] = useState(false)
  const [suyNghiTam, setSuyNghiTam] = useState('')

  // Sửa tên hiển thị trực tiếp sát avatar
  const [dangSuaTen, setDangSuaTen] = useState(false)
  const [tenTam, setTenTam] = useState('')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  // Profile data states
  const [tieuDeHoSo, setTieuDeHoSo] = useState(nguoiDung?.tieuDeHoSo ?? '')

  useEffect(() => {
    if (tabTrenUrl === 'avatar') setMoAvatarModal(true)
    if (tabTrenUrl === 'security') setMoDoiMatKhauModal(true)
  }, [tabTrenUrl])

  // Phiên được làm mới: nạp lại giá trị mới
  const nguonHoSo = `${nguoiDung?.ten ?? ''}|${nguoiDung?.username ?? ''}|${nguoiDung?.tieuDeHoSo ?? ''}`
  const [nguonDaNap, setNguonDaNap] = useState(nguonHoSo)
  if (nguonHoSo !== nguonDaNap) {
    setNguonDaNap(nguonHoSo)
    const tenMoi = nguoiDung?.ten || nguoiDung?.username || ''
    setTenTam(tenMoi)
    setTieuDeHoSo(nguoiDung?.tieuDeHoSo ?? '')
    setSuyNghiTam(nguoiDung?.tieuDeHoSo ?? '')
  }

  if (!nguoiDung) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-4">
          <User className="size-7" />
        </span>
        <h2 className="text-xl font-bold text-text-primary">Hồ sơ cá nhân</h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary leading-relaxed">
          Vui lòng đăng nhập để xem thông tin học tập, thành tích chuyên cần và quản lý tài khoản của bạn.
        </p>
        <Button onClick={() => moAuthModal('dang_nhap')} className="mt-6 font-semibold bg-brand text-brand-foreground hover:bg-brand/90">
          Đăng nhập ngay
        </Button>
      </div>
    )
  }

  const handleLuuSuyNghiNhanh = async (e: FormEvent) => {
    e.preventDefault()
    if (dangLuuProfile) return
    setDangLuuProfile(true)
    try {
      await capNhatHoSo({ tieuDeHoSo: suyNghiTam })
      setTieuDeHoSo(suyNghiTam)
      setDangSuaSuyNghi(false)
      toast.success('Đã cập nhật suy nghĩ của bạn!')
      if (lamMoiPhien) await lamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được suy nghĩ.')
    } finally {
      setDangLuuProfile(false)
    }
  }

  const displayName = nguoiDung.ten || nguoiDung.username
  const chuCaiDau = getInitials(displayName)

  const dongAvatarModal = (mo: boolean) => {
    setMoAvatarModal(mo)
    if (!mo && tabTrenUrl === 'avatar') {
      setSearchParams({}, { replace: true })
    }
  }

  const dongMatKhauModal = (mo: boolean) => {
    setMoDoiMatKhauModal(mo)
    if (!mo && tabTrenUrl === 'security') {
      setSearchParams({}, { replace: true })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
      <PageHeader title="Hồ sơ" />

      {/* ── Bìa danh tính người dùng (Chuẩn kích thước, thoáng con mắt) ── */}
      <section className="overflow-hidden rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm shadow-xs relative card-side-glow">
        {/* Bìa phong cảnh trường học */}
        <div
          className="h-44 sm:h-56 bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/assets/profile/profile_cover_clean.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        </div>

        <div className="p-5 sm:p-7 -mt-14 sm:-mt-16 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6">
          {/* Avatar người dùng */}
          <div className="relative shrink-0">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setMoAvatarModal(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setMoAvatarModal(true)
                }
              }}
              className="group/avatar relative block cursor-pointer rounded-2xl outline-none"
              title="Nhấn để đổi ảnh đại diện"
            >
              <Avatar className="size-24 sm:size-28 rounded-2xl ring-4 ring-surface shadow-xl transition-transform duration-150 group-hover/avatar:scale-105">
                {nguoiDung.avatar && (
                  <AvatarImage src={nguoiDung.avatar} alt={displayName} className="rounded-2xl object-cover" />
                )}
                <AvatarFallback className="rounded-2xl bg-surface-raised text-2xl font-bold text-text-primary">
                  {chuCaiDau}
                </AvatarFallback>
              </Avatar>

              {/* Overlay hover đổi avatar */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover/avatar:opacity-100">
                <Camera className="size-5 text-white" />
                <span className="mt-1 text-[10px] font-bold text-white">Đổi ảnh</span>
              </div>
            </div>
          </div>

          {/* Thông tin tên & suy nghĩ */}
          <div className="min-w-0 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 min-h-[2rem]">
              {dangSuaTen ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!tenTam.trim()) return
                    setDangLuuProfile(true)
                    try {
                      await capNhatHoSo({ tenHienThi: tenTam.trim() })
                      setDangSuaTen(false)
                      toast.success('Đã cập nhật tên!')
                      if (lamMoiPhien) await lamMoiPhien()
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật tên')
                    } finally {
                      setDangLuuProfile(false)
                    }
                  }}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  <Input
                    value={tenTam}
                    onChange={(e) => setTenTam(e.target.value)}
                    maxLength={TEN_HIEN_THI_TOI_DA}
                    className="h-8 w-48 text-sm font-semibold bg-surface border-border-default text-text-primary"
                    ref={focusEditor}
                  />
                  <Button type="submit" size="xs" disabled={dangLuuProfile} className="bg-brand hover:bg-brand/90 text-white text-xs font-bold">
                    Lưu
                  </Button>
                  <Button type="button" variant="ghost" size="xs" onClick={() => setDangSuaTen(false)}>
                    Hủy
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
                    {displayName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setTenTam(displayName)
                      setDangSuaTen(true)
                    }}
                    className="p-1 text-text-tertiary hover:text-brand transition-colors rounded-lg hover:bg-surface-raised cursor-pointer"
                    title="Chỉnh sửa tên hiển thị"
                    aria-label="Sửa tên"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
              )}
              {nguoiDung.isVerifiedTeacher && <Badge variant="default">Giáo viên</Badge>}
              {nguoiDung.isSchoolAdmin && (
                <Badge variant="achievement">
                  <ShieldCheck className="size-3" /> Quản trị trường
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-tertiary font-medium mt-0.5">@{nguoiDung.username}</p>

            {/* Suy nghĩ nhanh */}
            <div className="mt-3 rounded-xl border border-border-default bg-surface-overlay/70 px-3.5 py-2 min-h-[2.25rem] flex items-center justify-between gap-2 max-w-lg">
              {dangSuaSuyNghi ? (
                <form onSubmit={handleLuuSuyNghiNhanh} className="w-full space-y-2">
                  <Input
                    value={suyNghiTam}
                    onChange={(e) => setSuyNghiTam(e.target.value)}
                    placeholder="Nhập suy nghĩ của bạn…"
                    maxLength={150}
                    className="h-8 text-xs bg-surface border-border-default text-text-primary"
                    autoFocus
                  />
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-text-tertiary mr-1">Icon:</span>
                    {EMOJI_GOI_Y.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setSuyNghiTam((prev) => (prev ? prev + ' ' + em : em))}
                        className="size-6 text-xs rounded hover:bg-surface-raised transition-all flex items-center justify-center cursor-pointer"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button type="button" variant="ghost" size="xs" onClick={() => setDangSuaSuyNghi(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" size="xs" disabled={dangLuuProfile} className="bg-brand hover:bg-brand/90 text-white text-xs font-bold">
                      {dangLuuProfile ? 'Đang lưu…' : 'Lưu'}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-xs italic text-text-secondary break-words line-clamp-1 flex-1">
                    {tieuDeHoSo ? `"${tieuDeHoSo}"` : '"Chưa có suy nghĩ nào."'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSuyNghiTam(tieuDeHoSo)
                      setDangSuaSuyNghi(true)
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline shrink-0 cursor-pointer ml-1"
                    title="Chỉnh sửa suy nghĩ"
                  >
                    <Pencil className="size-3" />
                    <span>Sửa</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiến trình học tập (Chuẩn kích thước 4 cột đối xứng) ── */}
      <ProgressPanel hideChallenge />

      {/* ── Bảo mật & Liên kết Google / Đổi mật khẩu ── */}
      <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 relative shadow-xs card-side-glow">
        <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-4">
          <ShieldCheck className="size-5 text-success" />
          <span>Bảo mật & Liên kết</span>
        </h3>

        <div className="space-y-4">
          {/* Liên kết Google */}
          <LienKetGoogle />

          {/* Nút Đổi mật khẩu */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">Mật khẩu tài khoản</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMoDoiMatKhauModal(true)}
              className="gap-1.5 border-border-default bg-surface hover:bg-surface-raised text-text-primary text-xs font-semibold rounded-xl cursor-pointer"
            >
              <KeyRound className="size-3.5 text-text-tertiary" />
              <span>Đổi mật khẩu</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Popup chọn ảnh đại diện nhanh */}
      <AvatarPickerDialog
        open={moAvatarModal}
        onOpenChange={dongAvatarModal}
        currentAvatarUrl={nguoiDung.avatar || undefined}
        onSaveAvatar={async (newUrl) => {
          await doiAvatar(newUrl)
          if (lamMoiPhien) await lamMoiPhien()
        }}
      />

      {/* Popup đổi mật khẩu nhanh */}
      <DoiMatKhauDialog
        open={moDoiMatKhauModal}
        onOpenChange={dongMatKhauModal}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Popup Đổi mật khẩu nhanh (tái sử dụng trong toàn bộ hệ thống)
// Contract test tu-khoi-phuc-mat-khau: {!khongCanMatKhauCu && (
// ────────────────────────────────────────────────────────────────────────────
export { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'

// Liên kết Gmail để đăng nhập bằng Google
function LienKetGoogle() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['google', 'status'],
    queryFn: layTrangThaiGoogle,
    staleTime: 30_000,
  })
  const goLienKet = useMutation({
    mutationFn: goLienKetGoogle,
    onSuccess: () => {
      toast.success('Đã gỡ liên kết Google.')
      void queryClient.invalidateQueries({ queryKey: ['google', 'status'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Không gỡ được liên kết Google.'),
  })

  return (
    <div data-testid="google-link" className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <LogoGoogle className="size-4" />
          <span>Tài khoản Google</span>
        </p>
      </div>

      <div>
        {isPending ? (
          <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800" aria-label="Đang tải" />
        ) : isError ? (
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Thử lại
          </Button>
        ) : data.lienKet ? (
          <Button
            size="sm"
            variant="outline"
            disabled={goLienKet.isPending}
            onClick={() => goLienKet.mutate()}
            className="text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-rose-300"
          >
            {goLienKet.isPending ? 'Đang gỡ…' : 'Gỡ liên kết'}
          </Button>
        ) : data.sanSang ? (
          <a
            href="/api/auth/google/start?che_do=lien_ket"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 font-bold')}
          >
            <LogoGoogle className="size-3.5" />
            Liên kết
          </a>
        ) : (
          <Button variant="outline" size="sm" disabled className="gap-1.5 text-xs">
            <LogoGoogle className="size-3.5" />
            Liên kết Google
          </Button>
        )}
      </div>
    </div>
  )
}
