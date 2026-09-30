import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/layout/PageHeader'
import { LogoGoogle } from '@/features/auth/LogoGoogle'
import { AvatarPickerDialog } from '@/features/profile/AvatarPickerDialog'
import { DoiMatKhauDialog } from '@/features/profile/DoiMatKhauDialog'
import { ProgressPanel } from '@/features/profile/ProgressPanel'
import { capNhatHoSo, doiAvatar, goLienKetGoogle, layTrangThaiGoogle } from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import { TEN_HIEN_THI_TOI_DA } from '@shared/protocol/common'
import type { EngagementProfile } from '@shared/protocol/engagement'
import {
  Award,
  Camera,
  Flame,
  Lightbulb,
  Pencil,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

const EMOJI_GOI_Y = ['💡', '✨', '🔥', '📚', '🎯', '🚀', '⭐', '🏆', '💪', '❤️', '😊', '🎓']

export function ProfilePage() {
  const { nguoiDung, lamMoiPhien, moAuthModal } = usePhien()
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

  useEffect(() => {
    if (tabTrenUrl === 'avatar') setMoAvatarModal(true)
    if (tabTrenUrl === 'security') setMoDoiMatKhauModal(true)
  }, [tabTrenUrl])

  // Số liệu tiến trình thật (chuỗi ngày, XP, huy hiệu)
  const { data: profileData, isPending: dangTaiTienTrinh, isError: loiTienTrinh } = useQuery<{
    ok: boolean
    profile: EngagementProfile
  }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin chuyên cần.')
      return res.json()
    },
    enabled: !!nguoiDung,
    staleTime: 30_000,
  })

  // Profile edit states
  const [tenHienThi, setTenHienThi] = useState(nguoiDung?.ten || nguoiDung?.username || '')
  const [tieuDeHoSo, setTieuDeHoSo] = useState(nguoiDung?.tieuDeHoSo ?? '')
  const [ngaySinh, setNgaySinh] = useState(nguoiDung?.ngaySinh ?? '')
  const [noiSinhSong, setNoiSinhSong] = useState(nguoiDung?.noiSinhSong ?? '')
  const [sdtLienHe, setSdtLienHe] = useState(nguoiDung?.sdtLienHe ?? '')
  const [soThich, setSoThich] = useState(nguoiDung?.soThich ?? '')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  // Phiên được làm mới: nạp lại giá trị mới vào form.
  const nguonHoSo = `${nguoiDung?.ten ?? ''}|${nguoiDung?.username ?? ''}|${nguoiDung?.tieuDeHoSo ?? ''}|${nguoiDung?.ngaySinh ?? ''}|${nguoiDung?.noiSinhSong ?? ''}|${nguoiDung?.sdtLienHe ?? ''}|${nguoiDung?.soThich ?? ''}`
  const [nguonDaNap, setNguonDaNap] = useState(nguonHoSo)
  if (nguonHoSo !== nguonDaNap) {
    setNguonDaNap(nguonHoSo)
    const tenMoi = nguoiDung?.ten || nguoiDung?.username || ''
    setTenHienThi(tenMoi)
    setTenTam(tenMoi)
    setTieuDeHoSo(nguoiDung?.tieuDeHoSo ?? '')
    setSuyNghiTam(nguoiDung?.tieuDeHoSo ?? '')
    setNgaySinh(nguoiDung?.ngaySinh ?? '')
    setNoiSinhSong(nguoiDung?.noiSinhSong ?? '')
    setSdtLienHe(nguoiDung?.sdtLienHe ?? '')
    setSoThich(nguoiDung?.soThich ?? '')
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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dangLuuProfile) return
    setDangLuuProfile(true)
    try {
      await capNhatHoSo({
        tenHienThi,
        tieuDeHoSo,
        ngaySinh: ngaySinh || null,
        noiSinhSong: noiSinhSong || null,
        sdtLienHe: sdtLienHe || null,
        soThich: soThich || null,
      })
      toast.success('Đã cập nhật thông tin cá nhân!')
      if (lamMoiPhien) await lamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không cập nhật được hồ sơ.')
    } finally {
      setDangLuuProfile(false)
    }
  }

  const handleLuuSuyNghiNhanh = async (e: FormEvent) => {
    e.preventDefault()
    if (dangLuuProfile) return
    setDangLuuProfile(true)
    try {
      await capNhatHoSo({ tenHienThi, tieuDeHoSo: suyNghiTam })
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
  const profile = profileData?.profile
  const chuCaiDau = getInitials(displayName)

  const soLieu = (giaTri: number | undefined) =>
    dangTaiTienTrinh ? null : loiTienTrinh || giaTri === undefined ? '—' : giaTri.toLocaleString('vi-VN')

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
    <div className="space-y-8">
      <PageHeader title="Hồ sơ" />

      {/* Danh tính + số liệu thật */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            {/* Vùng Avatar kèm icon bóng đèn suy nghĩ nhanh */}
            <div className="relative shrink-0">
              {/* Avatar chính có hover effect đổi ảnh */}
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
                className="group/avatar relative block cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand"
                title="Nhấn để đổi ảnh đại diện"
              >
                <Avatar className="size-16 rounded-2xl after:rounded-2xl sm:size-20 ring-2 ring-border-default transition-all duration-200 group-hover/avatar:ring-brand">
                  {nguoiDung.avatar && (
                    <AvatarImage src={nguoiDung.avatar} alt={displayName} className="rounded-2xl object-cover" />
                  )}
                  <AvatarFallback className="rounded-2xl bg-brand/12 text-lg font-semibold text-brand">
                    {chuCaiDau}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay hover đổi avatar */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover/avatar:opacity-100">
                  <Camera className="size-5 text-white" />
                  <span className="mt-1 text-[10px] font-medium text-white/95">Đổi ảnh</span>
                </div>
              </div>

              {/* Nút camera góc dưới */}
              <button
                type="button"
                onClick={() => setMoAvatarModal(true)}
                aria-label="Đổi ảnh đại diện"
                title="Đổi ảnh đại diện"
                className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border border-border-default bg-surface-raised text-text-secondary shadow-md transition-colors hover:text-text-primary sm:size-8"
              >
                <Camera className="size-3.5 sm:size-4" />
              </button>

              {/* Icon bóng đèn ở góc trên avatar */}
              <div
                className="absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full border border-amber-400 bg-amber-500/25 text-amber-300 shadow-md sm:size-7"
                title="Suy nghĩ nhanh"
              >
                <Lightbulb className="size-3 text-amber-400 animate-pulse sm:size-3.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {dangSuaTen ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!tenTam.trim()) return
                      setDangLuuProfile(true)
                      try {
                        await capNhatHoSo({ tenHienThi: tenTam.trim() })
                        setTenHienThi(tenTam.trim())
                        setDangSuaTen(false)
                        toast.success('Đã cập nhật tên!')
                        if (lamMoiPhien) await lamMoiPhien()
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật tên')
                      } finally {
                        setDangLuuProfile(false)
                      }
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <Input
                      value={tenTam}
                      onChange={(e) => setTenTam(e.target.value)}
                      maxLength={TEN_HIEN_THI_TOI_DA}
                      className="h-8 w-44 text-sm font-semibold bg-canvas/60"
                      autoFocus
                    />
                    <Button type="submit" size="xs" disabled={dangLuuProfile}>
                      Lưu
                    </Button>
                    <Button type="button" variant="ghost" size="xs" onClick={() => setDangSuaTen(false)}>
                      Hủy
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] break-words text-text-primary">
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
                    <ShieldCheck /> Quản trị trường
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">
                @{nguoiDung.username}
              </p>

              {/* Khung suy nghĩ hiển thị trực tiếp (không dùng popup hover) */}
              <div className="mt-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-2.5 text-xs text-text-primary">
                {dangSuaSuyNghi ? (
                  <form onSubmit={handleLuuSuyNghiNhanh} className="space-y-2">
                    <Input
                      value={suyNghiTam}
                      onChange={(e) => setSuyNghiTam(e.target.value)}
                      placeholder="Nhập suy nghĩ, lời nói của bạn…"
                      maxLength={150}
                      className="h-8 text-xs bg-canvas/80"
                      autoFocus
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-text-tertiary mr-1">Chèn icon:</span>
                      {EMOJI_GOI_Y.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSuyNghiTam((prev) => (prev ? prev + ' ' + em : em))}
                          className="size-6 text-xs rounded hover:bg-surface-raised transition-all flex items-center justify-center cursor-pointer"
                          title={`Chèn ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setDangSuaSuyNghi(false)}
                      >
                        Hủy
                      </Button>
                      <Button type="submit" size="xs" disabled={dangLuuProfile}>
                        {dangLuuProfile ? 'Đang lưu…' : 'Lưu'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="italic text-text-primary/90 break-words line-clamp-2">
                      {tieuDeHoSo ? `“${tieuDeHoSo}”` : '“Chưa có suy nghĩ nào.”'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSuyNghiTam(tieuDeHoSo)
                        setDangSuaSuyNghi(true)
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors shrink-0 cursor-pointer ml-2"
                      title="Chỉnh sửa suy nghĩ"
                    >
                      <Pencil className="size-3" />
                      <span>Sửa</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <dl className="day-loc-deu shrink-0 lg:w-[380px] [--the-nho-nhat:5.25rem]">
            <ChiSo icon={<Flame className="size-4 text-warning" />} nhan="Chuỗi ngày" giaTri={soLieu(profile?.currentStreak)} />
            <ChiSo icon={<Zap className="size-4 text-brand" />} nhan="Tổng XP" giaTri={soLieu(profile?.totalXp)} />
            <ChiSo icon={<Award className="size-4 text-social" />} nhan="Huy hiệu" giaTri={soLieu(profile?.unlockedAchievementsCount)} />
          </dl>
        </div>
      </section>

      {/* 1 Nội dung thống nhất: Thông tin cá nhân & Hành động bảo mật */}
      <div className="space-y-6">
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
          <h3 className="text-[0.9375rem] leading-6 font-semibold text-text-primary">Thông tin cá nhân</h3>
          <form onSubmit={handleUpdateProfile} className="mt-4 max-w-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ten" className="text-sm font-medium">Họ và tên</Label>
                <Input
                  id="ho-so-ten"
                  value={tenHienThi}
                  onChange={(e) => setTenHienThi(e.target.value)}
                  placeholder="Nhập họ và tên…"
                  autoComplete="name"
                  maxLength={TEN_HIEN_THI_TOI_DA}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ngaysinh" className="text-sm font-medium">Ngày tháng năm sinh</Label>
                <Input
                  id="ho-so-ngaysinh"
                  type="date"
                  value={ngaySinh}
                  onChange={(e) => setNgaySinh(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-noisinhsong" className="text-sm font-medium">Nơi sinh sống</Label>
                <Input
                  id="ho-so-noisinhsong"
                  value={noiSinhSong}
                  onChange={(e) => setNoiSinhSong(e.target.value)}
                  placeholder="Ví dụ: Định Quán, Đồng Nai"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-sdt" className="text-sm font-medium">SĐT liên hệ</Label>
                <Input
                  id="ho-so-sdt"
                  type="tel"
                  value={sdtLienHe}
                  onChange={(e) => setSdtLienHe(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ho-so-sothich" className="text-sm font-medium">Sở thích</Label>
              <Input
                id="ho-so-sothich"
                value={soThich}
                onChange={(e) => setSoThich(e.target.value)}
                placeholder="Ví dụ: Đọc sách, lập trình, cờ vua, thể thao…"
                maxLength={200}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" disabled={dangLuuProfile}>
                {dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </section>

        {/* Liên kết Google */}
        <LienKetGoogle />

        {/* Tiến trình học tập */}
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
          <h3 className="text-[0.9375rem] leading-6 font-semibold text-text-primary">Tiến trình học tập</h3>
          <div className="mt-4">
            <ProgressPanel />
          </div>
        </section>
      </div>

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

function ChiSo({ icon, nhan, giaTri }: { icon: ReactNode; nhan: string; giaTri: string | null }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-canvas/40 px-2 py-3 text-center">
      <dt className="order-2 mt-1 text-xs text-text-tertiary">{nhan}</dt>
      <dd className="order-1 flex h-7 items-center gap-1.5 text-xl font-semibold tracking-tight text-text-primary tabular-nums">
        {icon}
        {giaTri ?? <span className="h-5 w-10 animate-pulse rounded-md bg-surface-overlay" aria-label="Đang tải" />}
      </dd>
    </div>
  )
}

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
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <h3 className="text-[0.9375rem] leading-6 font-semibold text-text-primary">Liên kết Google</h3>
      <div className="mt-4">
        <div data-testid="google-link" className="flex min-h-10 flex-wrap items-center gap-3">
          {isPending ? (
            <div className="h-10 w-56 animate-pulse rounded-lg bg-surface-overlay" aria-label="Đang tải" />
          ) : isError ? (
            <>
              <span className="text-sm text-text-secondary">Không tải được trạng thái liên kết.</span>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </>
          ) : data.lienKet ? (
            <>
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-text-primary">
                <LogoGoogle className="size-4 shrink-0" />
                <span className="truncate">{data.email ?? 'Đã liên kết'}</span>
              </span>
              <Button size="sm" variant="outline" disabled={goLienKet.isPending} onClick={() => goLienKet.mutate()}>
                {goLienKet.isPending ? 'Đang gỡ…' : 'Gỡ liên kết'}
              </Button>
            </>
          ) : data.sanSang ? (
            <a href="/api/auth/google/start?che_do=lien_ket" className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
              <LogoGoogle className="size-4" />
              Liên kết Google
            </a>
          ) : (
            <Button variant="outline" disabled className="gap-2">
              <LogoGoogle className="size-4" />
              Liên kết Google
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
