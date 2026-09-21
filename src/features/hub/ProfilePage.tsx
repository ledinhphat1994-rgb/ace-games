import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { AvatarPicker } from '@/features/profile/AvatarPicker'
import { capNhatHoSo, doiAvatar, doiMatKhau } from '@/lib/api'
import type { EngagementProfile } from '@shared/protocol/engagement'
import {
  Award,
  Camera,
  Flame,
  KeyRound,
  Palette,
  Sparkles,
  User,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

export function ProfilePage() {
  const { nguoiDung, lamMoiPhien } = usePhien()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'progress' ? 'progress' : 'profile'

  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'progress' | 'security'>(initialTab)

  // Engagement data for student passport header
  const { data: profileData } = useQuery<{
    ok: boolean
    profile: EngagementProfile
  }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin chuyên cần.')
      return res.json()
    },
    staleTime: 30_000,
  })

  // Profile edit states
  const [tenHienThi, setTenHienThi] = useState(nguoiDung.ten || nguoiDung.username)
  const [tieuDeHoSo, setTieuDeHoSo] = useState(nguoiDung.tieuDeHoSo ?? '')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  useEffect(() => {
    setTenHienThi(nguoiDung.ten || nguoiDung.username)
    setTieuDeHoSo(nguoiDung.tieuDeHoSo ?? '')
  }, [nguoiDung.ten, nguoiDung.username, nguoiDung.tieuDeHoSo])

  // Password states
  const [matKhauCu, setMatKhauCu] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMoi, setXacNhanMoi] = useState('')
  const [dangDoiMk, setDangDoiMk] = useState(false)

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
  const lopText = nguoiDung.lop?.ten ? `Lớp ${nguoiDung.lop.ten}` : 'Học sinh toàn trường'
  const profile = profileData?.profile
  const defaultAvatar = '/assets/avatars/avatar_01_boy.webp'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Student Campus Identity Passport Card with Cover Art */}
      <Card className="relative overflow-hidden border border-border/80 bg-card shadow-sm">
        {/* Profile Cover Art Banner */}
        <div className="relative h-40 sm:h-52 w-full overflow-hidden bg-slate-900">
          <img
            src="/assets/profile/profile_cover.webp"
            alt="Profile Cover"
            className="h-full w-full object-cover object-center brightness-90"
            onError={(e) => {
              // Fallback gradient if asset missing
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-black/30 to-black/10" />

          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
            <Badge variant="outline" className="bg-black/40 backdrop-blur-md text-white border-white/20 text-xs font-semibold px-2.5 py-1">
              Digital Campus Passport
            </Badge>
          </div>
        </div>

        <CardContent className="px-5 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 -mt-14 sm:-mt-16">
            {/* Avatar with click-to-change overlay */}
            <div className="relative group shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-4 border-card bg-card shadow-xl ring-2 ring-primary/30">
                <img
                  src={nguoiDung.avatar || defaultAvatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to default boy avatar
                    e.currentTarget.src = defaultAvatar
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer gap-1"
                title="Đổi ảnh đại diện"
              >
                <Camera className="h-4 w-4" />
                <span>Đổi Avatar</span>
              </button>
            </div>

            {/* Identity Details */}
            <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0 pt-2 sm:pt-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  {displayName}
                </h1>
                <Badge variant="default" className="text-xs font-semibold">
                  {nguoiDung.isVerifiedTeacher ? 'Giáo viên' : lopText}
                </Badge>
                {nguoiDung.isSchoolAdmin && (
                  <Badge variant="achievement" className="text-xs font-semibold">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Quản trị trường
                  </Badge>
                )}
              </div>

              <p className="text-xs text-text-secondary">
                @{nguoiDung.username} {nguoiDung.lop?.ten ? `· ${nguoiDung.lop.ten}` : ''}
              </p>

              {/* Motto or bio if set */}
              {nguoiDung.tieuDeHoSo ? (
                <p className="text-xs italic text-foreground/90 bg-muted/40 border-l-2 border-brand/60 rounded-r-lg px-3 py-1.5 inline-block">
                  "{nguoiDung.tieuDeHoSo}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 flex items-center justify-center sm:justify-start gap-1">
                  <Sparkles className="h-3 w-3 text-primary/70" />
                  <span>Chưa đặt châm ngôn học tập</span>
                </p>
              )}
            </div>

            {/* Quick Gamified Stats & Action */}
            <div className="flex flex-col items-center sm:items-end gap-3 pt-2 sm:pt-4 shrink-0">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-1 text-xs text-warning">
                  <Flame className="h-3.5 w-3.5" />
                  <span className="font-bold">{profile?.currentStreak ?? 0}</span>
                  <span className="text-[10px] text-text-tertiary">ngày chuỗi</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs text-brand">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="font-bold">{profile?.totalXp ?? 0} XP</span>
                  <span className="text-[10px] text-text-tertiary">tích lũy</span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-social/25 bg-social/10 px-2.5 py-1 text-xs text-social">
                  <Award className="h-3.5 w-3.5" />
                  <span className="font-bold">{profile?.unlockedAchievementsCount ?? 0}</span>
                  <span className="text-[10px] text-text-tertiary">huy hiệu</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('avatar')}
                className="text-xs font-semibold gap-1.5 hover:border-primary/50"
              >
                <Palette className="h-3.5 w-3.5 text-primary" />
                <span>Kho Avatar Nhân Vật</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = v as any
          setActiveTab(tab)
          setSearchParams(tab === 'progress' ? { tab: 'progress' } : {})
        }}
        className="w-full space-y-4"
      >
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="profile" className="text-xs gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Hồ sơ</span>
          </TabsTrigger>
          <TabsTrigger value="avatar" className="text-xs gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span>Kho Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>Tiến trình</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Mật khẩu</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile form */}
        <TabsContent value="profile">
          <Card className="border border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Thông tin cá nhân</CardTitle>
              <CardDescription className="text-xs">
                Cập nhật tên hiển thị và châm ngôn học tập của bạn trên Digital Campus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tên hiển thị</Label>
                  <Input
                    value={tenHienThi}
                    onChange={(e) => setTenHienThi(e.target.value)}
                    placeholder="Nhập họ và tên…"
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Tiểu sử / Châm ngôn học tập</Label>
                  <Input
                    value={tieuDeHoSo}
                    onChange={(e) => setTieuDeHoSo(e.target.value)}
                    placeholder="Ví dụ: Quyết tâm đạt điểm 9 môn Toán!"
                    className="h-9 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" disabled={dangLuuProfile}>
                  {dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Avatar Gallery Picker */}
        <TabsContent value="avatar">
          <Card className="border border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Kho Ảnh Đại Diện Nhân Vật</CardTitle>
              <CardDescription className="text-xs">
                Chọn hình tượng nhân vật phong cách yêu thích hoặc tải ảnh đại diện từ thiết bị của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvatarPicker
                currentAvatarUrl={nguoiDung.avatar || undefined}
                onSaveAvatar={async (newUrl) => {
                  await doiAvatar(newUrl)
                  if (lamMoiPhien) await lamMoiPhien()
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Progress & Achievements */}
        <TabsContent value="progress">
          <div className="space-y-4">
            <ProgressSummary />
          </div>
        </TabsContent>

        {/* Tab 4: Security */}
        <TabsContent value="security">
          <Card className="border border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Đổi mật khẩu</CardTitle>
              <CardDescription className="text-xs">
                Mật khẩu mới phải có tối thiểu 6 ký tự để đảm bảo an toàn cho tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-sm">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mật khẩu hiện tại</Label>
                  <Input
                    type="password"
                    value={matKhauCu}
                    onChange={(e) => setMatKhauCu(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Mật khẩu mới</Label>
                  <Input
                    type="password"
                    value={matKhauMoi}
                    onChange={(e) => setMatKhauMoi(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Xác nhận mật khẩu mới</Label>
                  <Input
                    type="password"
                    value={xacNhanMoi}
                    onChange={(e) => setXacNhanMoi(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>
                <Button type="submit" size="sm" disabled={dangDoiMk} className="mt-2">
                  {dangDoiMk ? 'Đang cập nhật…' : 'Đổi mật khẩu'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
