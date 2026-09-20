import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { capNhatHoSo, doiAvatar, doiMatKhau } from '@/lib/api'
import {
  Award,
  KeyRound,
  Palette,
  Upload,
  User,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

const PRESET_AVATARS = [
  '🎓', '🚀', '🦉', '🦊', '🦁', '🐼',
  '🐯', '🦄', '🌟', '⚡', '🎨', '🔬',
]

export function ProfilePage() {
  const { nguoiDung, lamMoiPhien } = usePhien()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'progress' ? 'progress' : 'profile'

  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'progress' | 'security'>(initialTab)

  // Profile edit states
  const [tenHienThi, setTenHienThi] = useState(nguoiDung.ten || nguoiDung.username)
  const [tieuDeHoSo, setTieuDeHoSo] = useState('')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  // Avatar states
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [dangLuuAvatar, setDangLuuAvatar] = useState(false)
  const [dangUploadAvatar, setDangUploadAvatar] = useState(false)

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

  const handleSelectPresetAvatar = async (preset: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="#0f172a"/><text x="50" y="65" font-size="52" text-anchor="middle">${preset}</text></svg>`
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

    setDangLuuAvatar(true)
    try {
      await doiAvatar(dataUrl)
      toast.success(`Đã đổi avatar biểu tượng ${preset}!`)
      if (lamMoiPhien) await lamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu avatar.')
    } finally {
      setDangLuuAvatar(false)
    }
  }

  const handleUploadAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDangUploadAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Tải ảnh lên máy chủ thất bại.')
      const data = (await res.json()) as { ok?: boolean; url?: string }
      if (data.ok && data.url) {
        await doiAvatar(data.url)
        toast.success('Đã tải và đổi ảnh đại diện thành công!')
        if (lamMoiPhien) await lamMoiPhien()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không tải được ảnh đại diện.')
    } finally {
      setDangUploadAvatar(false)
    }
  }

  const handleSaveCustomAvatarUrl = async () => {
    if (!customAvatarUrl.trim()) return
    setDangLuuAvatar(true)
    try {
      await doiAvatar(customAvatarUrl.trim())
      toast.success('Đã cập nhật avatar tùy chỉnh!')
      setCustomAvatarUrl('')
      if (lamMoiPhien) await lamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu avatar.')
    } finally {
      setDangLuuAvatar(false)
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Profile Header Card */}
      <Card className="border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 shadow-sm">
        <CardContent className="flex flex-col sm:flex-row items-center gap-5 p-6">
          <div className="relative">
            {nguoiDung.avatar ? (
              <img
                src={nguoiDung.avatar}
                alt={displayName}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold text-primary border-2 border-primary/30 uppercase shadow-md">
                {displayName.slice(0, 2)}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-foreground">{displayName}</h1>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs">
                {nguoiDung.isVerifiedTeacher ? 'Giáo viên' : 'Học sinh'}
              </Badge>
              {nguoiDung.isSchoolAdmin && (
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Quản trị trường
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              @{nguoiDung.username} {nguoiDung.lop?.ten ? `· ${nguoiDung.lop.ten}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          const tab = v as any
          setActiveTab(tab)
          setSearchParams(tab === 'progress' ? { tab: 'progress' } : {})
        }}
        className="w-full space-y-4"
      >
        <TabsList className="bg-card border border-border/70 p-1 w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="profile" className="text-xs font-semibold gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Hồ sơ</span>
          </TabsTrigger>
          <TabsTrigger value="avatar" className="text-xs font-semibold gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span>Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="text-xs font-semibold gap-1.5">
            <Award className="h-3.5 w-3.5" />
            <span>Tiến trình</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs font-semibold gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            <span>Mật khẩu</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile */}
        <TabsContent value="profile">
          <Card className="border border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Thông tin cá nhân</CardTitle>
              <CardDescription className="text-xs">
                Cập nhật tên hiển thị của bạn trong phòng học và bảng tin trường
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
                <Button
                  type="submit"
                  size="sm"
                  disabled={dangLuuProfile}
                  className="h-8 text-xs font-semibold bg-primary text-primary-foreground"
                >
                  {dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Avatar */}
        <TabsContent value="avatar">
          <Card className="border border-border/70 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Ảnh đại diện</CardTitle>
              <CardDescription className="text-xs">
                Chọn biểu tượng sẵn có hoặc tải ảnh đại diện từ máy tính của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Presets */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-3">Biểu tượng cá tính</p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-w-sm">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={dangLuuAvatar}
                      onClick={() => handleSelectPresetAvatar(preset)}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-2xl hover:scale-110 hover:border-primary transition-all cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload file */}
              <div className="border-t border-border/60 pt-4 max-w-md space-y-2">
                <p className="text-xs font-semibold text-foreground">Tải ảnh từ thiết bị</p>
                <label className="flex items-center gap-2 rounded-xl border border-dashed border-border/80 p-3 hover:border-primary/60 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    {dangUploadAvatar ? 'Đang tải lên…' : 'Chọn tệp ảnh (.png, .jpg, .webp)…'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatarFile}
                    className="hidden"
                    disabled={dangUploadAvatar}
                  />
                </label>
              </div>

              {/* URL */}
              <div className="border-t border-border/60 pt-4 max-w-md space-y-2">
                <p className="text-xs font-semibold text-foreground">Hoặc dùng đường link ảnh</p>
                <div className="flex gap-2">
                  <Input
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="h-8 text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveCustomAvatarUrl}
                    disabled={dangLuuAvatar || !customAvatarUrl.trim()}
                    className="h-8 text-xs shrink-0"
                  >
                    Lưu link
                  </Button>
                </div>
              </div>
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
                Mật khẩu mới phải có tối thiểu 6 ký tự để đảm bảo an toàn
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
                <Button
                  type="submit"
                  size="sm"
                  disabled={dangDoiMk}
                  className="h-8 text-xs font-semibold mt-2"
                >
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
