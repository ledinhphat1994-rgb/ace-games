import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { NguoiDung } from '@/lib/api'
import type { EngagementProfile, UserAchievementItem } from '@shared/protocol/engagement'
import { capNhatHoSo, doiAvatar, doiMatKhau } from '@/lib/api'
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  User,
  Users,
  Vote,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { PRESET_AVATARS } from './preset-avatars'

export interface AccountQuickCenterProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
  onLamMoiPhien?: () => Promise<void>
  className?: string
}

type QuickCenterView = 'main' | 'avatar' | 'profile' | 'password' | 'achievements'

function renderAchievementIcon(iconName: string, unlocked: boolean) {
  if (!unlocked) {
    return <Lock className="h-4 w-4 text-slate-400" />
  }
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="h-4 w-4 text-emerald-400" />
    case 'Users':
      return <Users className="h-4 w-4 text-sky-400" />
    case 'Flame':
      return <Flame className="h-4 w-4 text-amber-400" />
    case 'Zap':
      return <Zap className="h-4 w-4 text-yellow-400" />
    case 'CheckCircle2':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    case 'Vote':
      return <Vote className="h-4 w-4 text-indigo-400" />
    case 'BookOpen':
      return <BookOpen className="h-4 w-4 text-blue-400" />
    case 'Target':
      return <Target className="h-4 w-4 text-rose-400" />
    case 'Trophy':
      return <Trophy className="h-4 w-4 text-amber-400" />
    case 'ShieldCheck':
      return <ShieldCheck className="h-4 w-4 text-cyan-400" />
    default:
      return <Award className="h-4 w-4 text-purple-400" />
  }
}

export function AccountQuickCenter({
  nguoiDung,
  onDangXuat,
  onLamMoiPhien,
  className = '',
}: AccountQuickCenterProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<QuickCenterView>('main')

  // Screen size detection for responsive popover vs bottom sheet
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

  // Form states
  const [tenHienThi, setTenHienThi] = useState(nguoiDung.ten || nguoiDung.username)
  const [tieuDeHoSo, setTieuDeHoSo] = useState(nguoiDung.tieuDeHoSo ?? '')
  const [dangLuuProfile, setDangLuuProfile] = useState(false)

  // Password change states
  const [matKhauCu, setMatKhauCu] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMoi, setXacNhanMoi] = useState('')
  const [dangDoiMk, setDangDoiMk] = useState(false)

  // Avatar states
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [dangLuuAvatar, setDangLuuAvatar] = useState(false)
  const [dangUploadAvatar, setDangUploadAvatar] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      setCurrentView('main')
      setMatKhauCu('')
      setMatKhauMoi('')
      setXacNhanMoi('')
    } else {
      setTenHienThi(nguoiDung.ten || nguoiDung.username)
      setTieuDeHoSo(nguoiDung.tieuDeHoSo ?? '')
    }
  }

  // Profile engagement query for achievements view
  const { data: profileData } = useQuery<{ ok: boolean; profile: EngagementProfile }>({
    queryKey: ['engagement', 'profile'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/profile')
      if (!res.ok) return { ok: false, profile: null as any }
      return res.json()
    },
    enabled: isOpen && currentView === 'achievements',
    staleTime: 30_000,
  })

  // Authoritative achievements query
  const { data: achievementsData, isLoading: isLoadingAchievements } = useQuery<{
    ok: boolean
    achievements?: UserAchievementItem[]
    items?: UserAchievementItem[]
  }>({
    queryKey: ['engagement', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/achievements')
      if (!res.ok) return { ok: false, achievements: [] }
      return res.json()
    },
    enabled: isOpen && currentView === 'achievements',
    staleTime: 30_000,
  })

  const totalXp = profileData?.profile?.totalXp ?? 0
  const currentStreak = profileData?.profile?.currentStreak ?? 0
  const todayXp = profileData?.profile?.todayXp ?? 0
  const realAchievements: UserAchievementItem[] =
    achievementsData?.achievements || achievementsData?.items || []

  const handleSelectPresetAvatar = async (src: string) => {
    setDangLuuAvatar(true)
    try {
      await doiAvatar(src)
      toast.success('Đã cập nhật ảnh đại diện mới!')
      if (onLamMoiPhien) await onLamMoiPhien()
      setCurrentView('main')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật avatar.')
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
        toast.success('Đã tải và cập nhật ảnh đại diện thành công!')
        if (onLamMoiPhien) await onLamMoiPhien()
        setCurrentView('main')
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
      toast.success('Đã cập nhật ảnh đại diện!')
      setCustomAvatarUrl('')
      if (onLamMoiPhien) await onLamMoiPhien()
      setCurrentView('main')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đổi được ảnh đại diện.')
    } finally {
      setDangLuuAvatar(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenHienThi.trim()) {
      toast.error('Tên hiển thị không được để trống.')
      return
    }
    setDangLuuProfile(true)
    try {
      await capNhatHoSo({
        tenHienThi: tenHienThi.trim(),
        tieuDeHoSo: tieuDeHoSo.trim() || undefined,
      })
      toast.success('Đã lưu thông tin hồ sơ!')
      if (onLamMoiPhien) await onLamMoiPhien()
      setCurrentView('main')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể lưu hồ sơ.')
    } finally {
      setDangLuuProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matKhauCu || !matKhauMoi || !xacNhanMoi) {
      toast.error('Vui lòng điền đầy đủ các trường.')
      return
    }
    if (matKhauMoi !== xacNhanMoi) {
      toast.error('Mật khẩu mới và xác nhận không khớp.')
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
      setCurrentView('main')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
    } finally {
      setDangDoiMk(false)
    }
  }

  const displayInitial = (nguoiDung.ten || nguoiDung.username || 'U').charAt(0).toUpperCase()
  const roleLabel = nguoiDung.isSchoolAdmin
    ? 'Quản trị viên'
    : nguoiDung.role === 'teacher'
      ? 'Giáo viên'
      : 'Học sinh'

  // Trigger content (No fake decorative green dot, no sub-12px microtext)
  const triggerContent = (
    <>
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/50 bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 text-sm font-bold text-white shadow-md">
        {nguoiDung.avatar ? (
          <img
            src={nguoiDung.avatar}
            alt={nguoiDung.ten || nguoiDung.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{displayInitial}</span>
        )}
      </div>

      <div className="hidden sm:flex flex-col text-left leading-none">
        <span className="max-w-[100px] truncate text-xs font-semibold text-slate-200 group-hover:text-white">
          {nguoiDung.ten || nguoiDung.username}
        </span>
        <span className="text-xs text-slate-400">
          {nguoiDung.isSchoolAdmin ? 'Admin' : nguoiDung.role === 'teacher' ? 'GV' : 'HS'}
        </span>
      </div>
    </>
  )
  const triggerClass = `group relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pl-1.5 pr-2.5 transition-all hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${className}`

  // ── Render Content based on currentView ──
  const renderViewContent = () => {
    switch (currentView) {
      // ──────────────────────────────────────────────────────────────────────
      // 1. MAIN OVERVIEW (Simplified: Who am I? What to change?)
      // ──────────────────────────────────────────────────────────────────────
      case 'main':
        return (
          <div className="space-y-3.5">
            {/* User Profile Identity Surface */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('avatar')}
                  className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/50 bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md transition-transform hover:scale-105"
                  title="Bấm để đổi ảnh đại diện"
                >
                  {nguoiDung.avatar ? (
                    <img
                      src={nguoiDung.avatar}
                      alt={nguoiDung.ten || nguoiDung.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-white">{displayInitial}</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-white leading-tight">
                    {nguoiDung.ten || nguoiDung.username}
                  </h3>
                  <p className="truncate text-xs font-mono text-slate-400">@{nguoiDung.username}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions List (Restrained single brand accent) */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setCurrentView('avatar')}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-400 transition-colors">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <span>Đổi ảnh đại diện</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('profile')}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-400 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Chỉnh sửa hồ sơ</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('password')}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-400 transition-colors">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <span>Đổi mật khẩu</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('achievements')}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 group-hover:bg-cyan-500/15 group-hover:text-cyan-400 transition-colors">
                    <Award className="h-4 w-4" />
                  </div>
                  <span>Thành tựu & Huy hiệu</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-slate-300" />
              </button>

              {nguoiDung.isSchoolAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/admin')
                  }}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <span>Trang quản trị trường</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-amber-500/60" />
                </button>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-white/10 pt-2.5 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/profile')
                }}
                className="h-8 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5"
              >
                Hồ sơ chi tiết
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  onDangXuat()
                }}
                className="h-8 gap-1.5 text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Đăng xuất
              </Button>
            </div>
          </div>
        )

      // ──────────────────────────────────────────────────────────────────────
      // 2. AVATAR PICKER IN-PLACE
      // ──────────────────────────────────────────────────────────────────────
      case 'avatar':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setCurrentView('main')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Chọn ảnh đại diện
              </h4>
            </div>

            {/* Preset Avatars Grid */}
            <div>
              <Label className="text-xs font-semibold text-slate-300 mb-2 block">
                12 Avatar học sinh phong cách Teen Campus
              </Label>
              <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => void handleSelectPresetAvatar(preset.src)}
                    disabled={dangLuuAvatar}
                    className={`group relative aspect-square overflow-hidden rounded-xl border p-1 transition-all hover:scale-105 active:scale-95 ${
                      nguoiDung.avatar === preset.src
                        ? 'border-cyan-400 bg-cyan-500/25 ring-2 ring-cyan-400/50'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                    title={preset.label}
                  >
                    <img
                      src={preset.src}
                      alt={preset.label}
                      className="h-full w-full object-cover rounded-lg"
                      loading="lazy"
                    />
                    {nguoiDung.avatar === preset.src && (
                      <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload File Section */}
            <div className="border-t border-white/10 pt-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-2.5 text-xs text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 transition-colors">
                <Upload className="h-4 w-4 text-cyan-400" />
                <span>{dangUploadAvatar ? 'Đang tải ảnh…' : 'Tải ảnh từ máy (PNG, JPG, WEBP)'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleUploadAvatarFile}
                  className="hidden"
                  disabled={dangUploadAvatar}
                />
              </label>
            </div>

            {/* Custom URL Section */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <Label className="text-xs font-semibold text-slate-400">Hoặc dán link ảnh trực tiếp</Label>
              <div className="flex gap-2">
                <Input
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="h-8 border-white/10 bg-black/40 text-xs text-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCustomAvatarUrl}
                  disabled={dangLuuAvatar || !customAvatarUrl.trim()}
                  className="h-8 px-3 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shrink-0"
                >
                  Lưu
                </Button>
              </div>
            </div>
          </div>
        )

      // ──────────────────────────────────────────────────────────────────────
      // 3. EDIT PROFILE IN-PLACE
      // ──────────────────────────────────────────────────────────────────────
      case 'profile':
        return (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setCurrentView('main')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Chỉnh sửa hồ sơ
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300 font-semibold">Tên hiển thị</Label>
                <Input
                  value={tenHienThi}
                  onChange={(e) => setTenHienThi(e.target.value)}
                  placeholder="Tên của bạn..."
                  className="h-9 mt-1 border-white/10 bg-black/40 text-xs text-white"
                  required
                />
                <p className="mt-1 text-xs text-slate-400">Từ 2 đến 50 ký tự</p>
              </div>

              <div>
                <Label className="text-xs text-slate-300 font-semibold">Tiểu sử / Châm ngôn</Label>
                <Input
                  value={tieuDeHoSo}
                  onChange={(e) => setTieuDeHoSo(e.target.value)}
                  placeholder="Chia sẻ phương châm học tập..."
                  className="h-9 mt-1 border-white/10 bg-black/40 text-xs text-white"
                />
                <p className="mt-1 text-xs text-slate-400">Tối đa 150 ký tự</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400 space-y-1">
                <p><span className="text-slate-300 font-semibold">Tên đăng nhập:</span> @{nguoiDung.username}</p>
                <p><span className="text-slate-300 font-semibold">Vai trò:</span> {roleLabel}</p>
                <p><span className="text-slate-300 font-semibold">Đơn vị:</span> Trung tâm GDTX Định Quán</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={dangLuuProfile}
              className="w-full h-9 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
            >
              {dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </form>
        )

      // ──────────────────────────────────────────────────────────────────────
      // 4. CHANGE PASSWORD IN-PLACE
      // ──────────────────────────────────────────────────────────────────────
      case 'password':
        return (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setCurrentView('main')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Đổi mật khẩu tài khoản
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-300 font-semibold">Mật khẩu hiện tại</Label>
                <Input
                  type="password"
                  value={matKhauCu}
                  onChange={(e) => setMatKhauCu(e.target.value)}
                  className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300 font-semibold">Mật khẩu mới</Label>
                <Input
                  type="password"
                  value={matKhauMoi}
                  onChange={(e) => setMatKhauMoi(e.target.value)}
                  className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                  placeholder="Từ 6 ký tự trở lên"
                  required
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300 font-semibold">Xác nhận mật khẩu mới</Label>
                <Input
                  type="password"
                  value={xacNhanMoi}
                  onChange={(e) => setXacNhanMoi(e.target.value)}
                  className="h-8 mt-1 border-white/10 bg-black/40 text-xs text-white"
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={dangDoiMk}
              className="w-full h-9 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
            >
              {dangDoiMk ? 'Đang cập nhật…' : 'Xác nhận đổi mật khẩu'}
            </Button>
          </form>
        )

      // ──────────────────────────────────────────────────────────────────────
      // 5. ACHIEVEMENTS & PROGRESS IN-PLACE (Dedicated subview)
      // ──────────────────────────────────────────────────────────────────────
      case 'achievements':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setCurrentView('main')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                title="Quay lại"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Huy hiệu & Thành tựu
              </h4>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2.5">
                <Flame className="h-6 w-6 text-amber-400 fill-amber-400/20" />
                <div>
                  <p className="text-xs font-bold text-white">{currentStreak} ngày chuỗi học</p>
                  <p className="text-xs text-slate-400">{totalXp} XP tích lũy</p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                +{todayXp} XP hôm nay
              </Badge>
            </div>

            {isLoadingAchievements ? (
              <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-xs">Đang tải thành tựu...</span>
              </div>
            ) : realAchievements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <Award className="h-8 w-8 text-slate-500 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-300">Chưa có danh hiệu nào</p>
                <p className="text-xs text-slate-500 mt-0.5">Tham gia lớp học để mở khóa thành tựu.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {realAchievements.map((ach) => (
                  <div
                    key={ach.key}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                      ach.unlocked
                        ? 'border-white/10 bg-white/5'
                        : 'border-white/5 bg-white/[0.02] opacity-60'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        ach.unlocked ? 'bg-white/10' : 'bg-white/5'
                      }`}
                    >
                      {renderAchievementIcon(ach.icon, ach.unlocked)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-xs font-semibold text-white">{ach.title}</p>
                        {ach.rewardXp ? (
                          <span className="shrink-0 text-xs text-amber-400 font-medium">+{ach.rewardXp}</span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-slate-400">{ach.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // MOBILE: Ergonomic Bottom Sheet
  // ──────────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger
          data-testid="account-menu-trigger"
          className={triggerClass}
          title="Trung tâm tài khoản nhanh"
          aria-label="Mở trung tâm tài khoản"
        >
          {triggerContent}
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-white/15 bg-[#0a0f1d]/98 px-5 pb-8 pt-3 text-slate-100 backdrop-blur-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Drag Handle */}
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/20" />
          <SheetHeader className="sr-only">
            <SheetTitle>Trung tâm tài khoản nhanh</SheetTitle>
          </SheetHeader>
          {renderViewContent()}
        </SheetContent>
      </Sheet>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DESKTOP: Sleek Anchored Popover
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        data-testid="account-menu-trigger"
        className={triggerClass}
        title="Trung tâm tài khoản nhanh"
        aria-label="Mở trung tâm tài khoản"
      >
        {triggerContent}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[340px] rounded-2xl border border-white/15 bg-[#0a0f1d]/95 p-4 text-slate-100 backdrop-blur-2xl shadow-2xl transition-all"
      >
        {renderViewContent()}
      </PopoverContent>
    </Popover>
  )
}
