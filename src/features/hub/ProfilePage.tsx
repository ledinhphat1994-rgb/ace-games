import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/layout/PageHeader'
import { AvatarPicker } from '@/features/profile/AvatarPicker'
import { ProgressPanel } from '@/features/profile/ProgressPanel'
import { capNhatHoSo, doiAvatar, doiMatKhau } from '@/lib/api'
import { getInitials, tenLop } from '@/lib/utils'
import { TEN_HIEN_THI_TOI_DA } from '@shared/protocol/common'
import type { EngagementProfile } from '@shared/protocol/engagement'
import { Award, Camera, Flame, KeyRound, Palette, ShieldCheck, TrendingUp, User, Zap } from 'lucide-react'
import { toast } from 'sonner'

type TabHoSo = 'profile' | 'avatar' | 'progress' | 'security'
const CAC_TAB_HO_SO: readonly TabHoSo[] = ['profile', 'avatar', 'progress', 'security']

export function ProfilePage() {
  const { nguoiDung, lamMoiPhien, moAuthModal } = usePhien()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab lấy thẳng từ URL (/me?tab=avatar…) để menu tài khoản mở đúng tab kể cả khi đang ở sẵn trang này.
  const tabTrenUrl = searchParams.get('tab')
  const activeTab: TabHoSo = CAC_TAB_HO_SO.find((tab) => tab === tabTrenUrl) ?? 'profile'

  // Số liệu tiến trình thật (chuỗi ngày, XP, huy hiệu) — cùng khoá cache với menu tài khoản.
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
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  // Phiên được làm mới (vừa lưu hồ sơ ở đây hoặc nơi khác): nạp lại giá trị mới vào form.
  const nguonHoSo = `${nguoiDung?.ten ?? ''}|${nguoiDung?.username ?? ''}|${nguoiDung?.tieuDeHoSo ?? ''}`
  const [nguonDaNap, setNguonDaNap] = useState(nguonHoSo)
  if (nguonHoSo !== nguonDaNap) {
    setNguonDaNap(nguonHoSo)
    setTenHienThi(nguoiDung?.ten || nguoiDung?.username || '')
    setTieuDeHoSo(nguoiDung?.tieuDeHoSo ?? '')
  }

  // Password states
  const [matKhauCu, setMatKhauCu] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMoi, setXacNhanMoi] = useState('')
  const [dangDoiMk, setDangDoiMk] = useState(false)

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

  const doiTab = (tab: TabHoSo) => {
    setSearchParams(tab === 'profile' ? {} : { tab }, { replace: true })
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (dangLuuProfile) return
    setDangLuuProfile(true)
    try {
      await capNhatHoSo({ tenHienThi, tieuDeHoSo })
      toast.success('Đã cập nhật hồ sơ cá nhân!')
      if (lamMoiPhien) await lamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không cập nhật được hồ sơ.')
    } finally {
      setDangLuuProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (matKhauMoi !== xacNhanMoi) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }
    if (matKhauMoi.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.')
      return
    }
    setDangDoiMk(true)
    try {
      await doiMatKhau({ matKhauCu, matKhauMoi })
      toast.success('Đổi mật khẩu thành công!')
      setMatKhauCu('')
      setMatKhauMoi('')
      setXacNhanMoi('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
    } finally {
      setDangDoiMk(false)
    }
  }

  const displayName = nguoiDung.ten || nguoiDung.username
  const profile = profileData?.profile
  // Cùng quy tắc với menu tài khoản trên thanh đầu trang: chữ cái đầu của tên hiển thị.
  const chuCaiDau = getInitials(displayName)

  const soLieu = (giaTri: number | undefined) =>
    dangTaiTienTrinh ? null : loiTienTrinh || giaTri === undefined ? '—' : giaTri.toLocaleString('vi-VN')

  return (
    <div className="space-y-8">
      <PageHeader title="Hồ sơ" description="Thông tin cá nhân, ảnh đại diện, tiến trình học tập và bảo mật tài khoản." />

      {/* Danh tính + số liệu thật */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <Avatar className="size-16 rounded-2xl after:rounded-2xl sm:size-20">
                {nguoiDung.avatar && (
                  <AvatarImage src={nguoiDung.avatar} alt={displayName} className="rounded-2xl" />
                )}
                <AvatarFallback className="rounded-2xl bg-brand/12 text-lg font-semibold text-brand">
                  {chuCaiDau}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => doiTab('avatar')}
                aria-label="Đổi ảnh đại diện"
                className="absolute -right-1.5 -bottom-1.5 flex size-8 items-center justify-center rounded-full border border-border-default bg-surface-raised text-text-secondary shadow-md transition-colors hover:text-text-primary"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] break-words text-text-primary">
                  {displayName}
                </h2>
                {nguoiDung.isVerifiedTeacher && <Badge variant="default">Giáo viên</Badge>}
                {nguoiDung.isSchoolAdmin && (
                  <Badge variant="achievement">
                    <ShieldCheck /> Quản trị trường
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm break-words text-text-secondary">
                @{nguoiDung.username}
                {nguoiDung.lop?.ten && <> · {tenLop(nguoiDung.lop.ten)}</>}
              </p>
              {nguoiDung.tieuDeHoSo ? (
                <p className="mt-2 text-sm break-words text-text-primary/90">“{nguoiDung.tieuDeHoSo}”</p>
              ) : (
                <button
                  type="button"
                  onClick={() => doiTab('profile')}
                  className="mt-2 text-sm text-text-tertiary transition-colors hover:text-brand"
                >
                  + Thêm châm ngôn học tập
                </button>
              )}
            </div>
          </div>

          <dl className="day-loc-deu shrink-0 lg:w-[380px] [--the-nho-nhat:5.25rem]">
            <ChiSo icon={<Flame className="size-4 text-warning" />} nhan="Chuỗi ngày" giaTri={soLieu(profile?.currentStreak)} />
            <ChiSo icon={<Zap className="size-4 text-brand" />} nhan="Tổng XP" giaTri={soLieu(profile?.totalXp)} />
            <ChiSo icon={<Award className="size-4 text-social" />} nhan="Huy hiệu" giaTri={soLieu(profile?.unlockedAchievementsCount)} />
          </dl>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={(v) => doiTab(v as TabHoSo)} className="w-full gap-4">
        <TabsList className="grid-cols-2! sm:grid-cols-4!">
          <TabsTrigger value="profile">
            <User />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="avatar">
            <Palette />
            Ảnh đại diện
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp />
            Tiến trình
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound />
            Mật khẩu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <KhungTab tieuDe="Thông tin cá nhân" moTa="Tên hiển thị và châm ngôn xuất hiện với bạn bè, thầy cô trên Digital Campus.">
            <form onSubmit={handleUpdateProfile} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ho-so-ten" className="text-sm font-medium">Tên hiển thị</Label>
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
              <div className="space-y-2">
                <Label htmlFor="ho-so-cham-ngon" className="text-sm font-medium">Châm ngôn học tập</Label>
                <Input
                  id="ho-so-cham-ngon"
                  value={tieuDeHoSo}
                  onChange={(e) => setTieuDeHoSo(e.target.value)}
                  maxLength={150}
                  placeholder="Ví dụ: Quyết tâm đạt điểm 9 môn Toán!"
                />
              </div>
              <Button type="submit" disabled={dangLuuProfile}>
                {dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </form>
          </KhungTab>
        </TabsContent>

        <TabsContent value="avatar">
          <KhungTab tieuDe="Ảnh đại diện" moTa="Chọn một nhân vật có sẵn, hoặc tải ảnh của bạn lên.">
            <AvatarPicker
              currentAvatarUrl={nguoiDung.avatar || undefined}
              onSaveAvatar={async (newUrl) => {
                await doiAvatar(newUrl)
                if (lamMoiPhien) await lamMoiPhien()
              }}
            />
          </KhungTab>
        </TabsContent>

        <TabsContent value="progress">
          <ProgressPanel />
        </TabsContent>

        <TabsContent value="security">
          <KhungTab tieuDe="Đổi mật khẩu" moTa="Mật khẩu mới cần tối thiểu 6 ký tự.">
            <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mk-cu" className="text-sm font-medium">Mật khẩu hiện tại</Label>
                <PasswordInput id="mk-cu" autoComplete="current-password" value={matKhauCu} onChange={(e) => setMatKhauCu(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mk-moi" className="text-sm font-medium">Mật khẩu mới</Label>
                <PasswordInput id="mk-moi" autoComplete="new-password" value={matKhauMoi} onChange={(e) => setMatKhauMoi(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mk-xac-nhan" className="text-sm font-medium">Nhập lại mật khẩu mới</Label>
                <PasswordInput id="mk-xac-nhan" autoComplete="new-password" value={xacNhanMoi} onChange={(e) => setXacNhanMoi(e.target.value)} required />
              </div>
              <Button type="submit" disabled={dangDoiMk}>
                {dangDoiMk ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
              </Button>
            </form>
          </KhungTab>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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

function KhungTab({ tieuDe, moTa, children }: { tieuDe: string; moTa: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <h3 className="text-[0.9375rem] leading-6 font-semibold text-text-primary">{tieuDe}</h3>
      <p className="mt-0.5 text-sm text-text-secondary">{moTa}</p>
      <div className="mt-5">{children}</div>
    </section>
  )
}
