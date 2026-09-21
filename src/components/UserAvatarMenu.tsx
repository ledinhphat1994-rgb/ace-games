import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { NguoiDung } from '@/lib/api'
import type { EngagementProfile } from '../../shared/protocol/engagement'
import { capNhatHoSo, doiAvatar, doiMatKhau } from '@/lib/api'
import {
  Award,
  Check,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

// 12 Avatar biểu tượng hiện đại sẵn có
const PRESET_AVATARS = [
  '🎓', '🚀', '🦉', '🦊', '🦁', '🐼',
  '🐯', '🦄', '🌟', '⚡', '🎨', '🔬',
]

interface UserAvatarMenuProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
  onLamMoiPhien?: () => Promise<void>
  className?: string
}

export function UserAvatarMenu({
  nguoiDung,
  onDangXuat,
  onLamMoiPhien,
  className = '',
}: UserAvatarMenuProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'avatar' | 'achievements' | 'settings'>('profile')

  // Form states
  const [tenHienThi, setTenHienThi] = useState(nguoiDung.ten || nguoiDung.username)
  const [tieuDeHoSo, setTieuDeHoSo] = useState(nguoiDung.tieuDeHoSo ?? '')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  useEffect(() => {
    setTenHienThi(nguoiDung.ten || nguoiDung.username)
    setTieuDeHoSo(nguoiDung.tieuDeHoSo ?? '')
  }, [nguoiDung.ten, nguoiDung.username, nguoiDung.tieuDeHoSo])

  // Profile data query for achievements & progress tab
  const { data: profileData } = useQuery<{ ok: boolean; profile: EngagementProfile }>({
    queryKey: ['engagement', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/profile')
      if (!res.ok) return { ok: false, profile: null as any }
      return res.json()
    },
    enabled: open,
    staleTime: 30_000,
  })

  const totalXp = profileData?.profile?.totalXp ?? 0

  // Avatar states
  const [selectedPreset, setSelectedPreset] = useState<string>('')
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
      if (onLamMoiPhien) await onLamMoiPhien()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không cập nhật được hồ sơ.')
    } finally {
      setDangLuuProfile(false)
    }
  }

  const handleSelectPresetAvatar = async (preset: string) => {
    setSelectedPreset(preset)
    // Chuyển emoji thành SVG data URL để lưu làm avatar chuẩn
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="30" fill="#0f172a"/><text x="50" y="65" font-size="52" text-anchor="middle">${preset}</text></svg>`
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

    setDangLuuAvatar(true)
    try {
      await doiAvatar(dataUrl)
      toast.success(`Đã đổi avatar biểu tượng ${preset}!`)
      if (onLamMoiPhien) await onLamMoiPhien()
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
      formData.append('purpose', 'avatar')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Tải ảnh lên máy chủ thất bại.')
      const data = (await res.json()) as { ok?: boolean; url?: string }
      if (data.ok && data.url) {
        await doiAvatar(data.url)
        toast.success('Đã tải và đổi ảnh đại diện thành công!')
        if (onLamMoiPhien) await onLamMoiPhien()
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
      if (onLamMoiPhien) await onLamMoiPhien()
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
      toast.success('Đã đổi mật khẩu thành công!')
      setMatKhauCu('')
      setMatKhauMoi('')
      setXacNhanMoi('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
    } finally {
      setDangDoiMk(false)
    }
  }

  const displayInitial = (nguoiDung.ten || nguoiDung.username || 'U').charAt(0).toUpperCase()

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 pl-1.5 pr-2.5 transition-all hover:border-cyan-400/50 hover:bg-white/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/40 ${className}`}
        title="Bấm để mở hồ sơ cá nhân, đổi avatar & thành tựu"
      >
        {/* Avatar icon / image */}
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/40 bg-gradient-to-tr from-cyan-600 to-indigo-600 font-bold text-white shadow-md">
          {nguoiDung.avatar ? (
            <img
              src={nguoiDung.avatar}
              alt={nguoiDung.ten || nguoiDung.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-black tracking-tighter">{displayInitial}</span>
          )}
        </div>

        {/* User name & Role badge */}
        <div className="hidden sm:flex flex-col text-left leading-none">
          <span className="max-w-[110px] truncate text-xs font-semibold text-slate-200 group-hover:text-white">
            {nguoiDung.ten || nguoiDung.username}
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            {nguoiDung.isSchoolAdmin ? 'Admin' : nguoiDung.role === 'teacher' ? 'GV' : 'HS'}
          </span>
        </div>
      </button>

      {/* ── Profile Dialog Modal ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/15 bg-[#090e18]/98 text-slate-100 sm:max-w-[560px] backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          {/* Header banner */}
          <div className="relative bg-gradient-to-r from-cyan-950/80 via-indigo-950/60 to-purple-950/80 px-6 pt-6 pb-5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-cyan-400/50 bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-xl">
                {nguoiDung.avatar ? (
                  <img
                    src={nguoiDung.avatar}
                    alt={nguoiDung.ten || nguoiDung.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-white">{displayInitial}</span>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center text-[9px] font-mono text-cyan-300">
                  {totalXp} XP
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="truncate text-lg font-bold text-white">
                    {nguoiDung.ten || nguoiDung.username}
                  </DialogTitle>
                  <Badge
                    variant="outline"
                    className="border-cyan-400/40 bg-cyan-500/10 text-[10px] text-cyan-300"
                  >
                    {nguoiDung.isSchoolAdmin
                      ? 'Quản trị viên'
                      : nguoiDung.role === 'teacher'
                        ? 'Giáo viên'
                        : 'Học sinh'}
                  </Badge>
                </div>
                <DialogDescription className="truncate text-xs text-slate-400">
                  @{nguoiDung.username} {nguoiDung.lop ? `· Lớp ${nguoiDung.lop.ten}` : ''}
                </DialogDescription>

                {/* Truthful XP & Streak summary */}
                <div className="mt-2 flex items-center gap-3 text-[10px] text-cyan-300 font-mono">
                  <span>{totalXp} XP tích lũy</span>
                  {profileData?.profile?.currentStreak ? (
                    <>
                      <span className="text-white/30">·</span>
                      <span>🔥 {profileData.profile.currentStreak} ngày chuỗi</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="p-6 pt-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 p-1 rounded-xl">
                <TabsTrigger value="profile" className="text-xs gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Hồ sơ
                </TabsTrigger>
                <TabsTrigger value="avatar" className="text-xs gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Avatar
                </TabsTrigger>
                <TabsTrigger value="achievements" className="text-xs gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  Thành tựu
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  Cài đặt
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1: Profile ── */}
              <TabsContent value="profile" className="space-y-4 pt-4">
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-300">Tên hiển thị</Label>
                    <Input
                      value={tenHienThi}
                      onChange={(e) => setTenHienThi(e.target.value)}
                      placeholder="Họ và tên hoặc biệt danh"
                      className="h-9 mt-1 border-white/10 bg-black/40 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">Tiểu sử / Châm ngôn</Label>
                    <Input
                      value={tieuDeHoSo}
                      onChange={(e) => setTieuDeHoSo(e.target.value)}
                      placeholder="Chia sẻ vài dòng về bạn..."
                      className="h-9 mt-1 border-white/10 bg-black/40 text-xs text-white"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400 space-y-1">
                    <p><span className="text-slate-300 font-semibold">Tên đăng nhập:</span> @{nguoiDung.username}</p>
                    <p><span className="text-slate-300 font-semibold">Vai trò hệ thống:</span> {nguoiDung.role || 'Thành viên'}</p>
                    <p><span className="text-slate-300 font-semibold">Đơn vị:</span> Trung tâm GDTX Định Quán</p>
                  </div>
                  <Button type="submit" disabled={dangLuuProfile} className="w-full h-9 text-xs">
                    {dangLuuProfile ? 'Đang lưu…' : 'Lưu thông tin hồ sơ'}
                  </Button>
                </form>
              </TabsContent>

              {/* ── TAB 2: Change Avatar ── */}
              <TabsContent value="avatar" className="space-y-4 pt-4">
                <div>
                  <Label className="text-xs text-slate-300 block mb-2 font-semibold">
                    1. Chọn avatar biểu tượng sẵn có
                  </Label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => void handleSelectPresetAvatar(emoji)}
                        disabled={dangLuuAvatar}
                        className={`flex h-12 items-center justify-center rounded-xl border text-2xl transition-all hover:scale-105 ${
                          selectedPreset === emoji
                            ? 'border-cyan-400 bg-cyan-500/20 shadow-lg'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        }`}
                        title={`Chọn biểu tượng ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <Label className="text-xs text-slate-300 block mb-2 font-semibold">
                    2. Hoặc tải ảnh từ thiết bị lên Cloudflare R2
                  </Label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-xs text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors">
                    <Upload className="h-4 w-4 text-cyan-400" />
                    <span>{dangUploadAvatar ? 'Đang tải ảnh lên…' : 'Chọn tệp ảnh từ máy tính / điện thoại'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAvatarFile}
                      className="hidden"
                      disabled={dangUploadAvatar}
                    />
                  </label>
                </div>

                <div className="border-t border-white/10 pt-3 space-y-2">
                  <Label className="text-xs text-slate-300 font-semibold">
                    3. Hoặc dán đường dẫn ảnh trực tiếp
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/my-photo.jpg"
                      className="h-8 border-white/10 bg-black/40 text-xs text-white"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCustomAvatarUrl}
                      disabled={dangLuuAvatar || !customAvatarUrl.trim()}
                      className="h-8 px-3 text-xs shrink-0"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 3: Achievements & Progress ── */}
              <TabsContent value="achievements" className="space-y-3 pt-4">
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <div className="flex items-center gap-2.5">
                    <Zap className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {profileData?.profile?.totalXp ?? 0} XP tích lũy
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Duy trì chuỗi {profileData?.profile?.currentStreak ?? 0} ngày học tập
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/40">
                    +{profileData?.profile?.todayXp ?? 0} XP hôm nay
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-300 font-semibold">Huy hiệu đạt được</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">Chăm chỉ Pomodoro</p>
                        <p className="truncate text-[10px] text-slate-400">Tập trung trên 25 phút</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                        <Award className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">Vua Cờ Caro</p>
                        <p className="truncate text-[10px] text-slate-400">Chiến thắng Đấu Trường</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">Thuyết Trình Viên</p>
                        <p className="truncate text-[10px] text-slate-400">Trình chiếu slide bài giảng</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                        <Check className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white">Bảng Đen Sáng Tạo</p>
                        <p className="truncate text-[10px] text-slate-400">Viết vẽ & ghi chú lên slide</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 4: Settings & Password ── */}
              <TabsContent value="settings" className="space-y-4 pt-4">
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <Label className="text-xs text-slate-300 font-semibold block">Đổi mật khẩu tài khoản</Label>
                  <div>
                    <Label className="text-[11px] text-slate-400">Mật khẩu hiện tại</Label>
                    <Input
                      type="password"
                      value={matKhauCu}
                      onChange={(e) => setMatKhauCu(e.target.value)}
                      className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400">Mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={matKhauMoi}
                      onChange={(e) => setMatKhauMoi(e.target.value)}
                      className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-slate-400">Xác nhận mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={xacNhanMoi}
                      onChange={(e) => setXacNhanMoi(e.target.value)}
                      className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={dangDoiMk} className="w-full h-8 text-xs">
                    {dangDoiMk ? 'Đang cập nhật…' : 'Xác nhận đổi mật khẩu'}
                  </Button>
                </form>

                <div className="border-t border-white/10 pt-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setOpen(false)
                      onDangXuat()
                    }}
                    className="w-full h-9 text-xs gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất khỏi tài khoản
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
