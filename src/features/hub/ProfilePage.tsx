import { useEffect, useState, useCallback, type FormEvent } from 'react'
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
  Download,
  FileText,
  Flame,
  KeyRound,
  Pencil,
  ShieldCheck,
  Trophy,
  User,
  Zap,
} from 'lucide-react'
import { PodiumTop3 } from '@/features/games/GameArt3D'
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

  // Leaderboard data cho bục vinh danh Top 3
  const { data: leaderboardData } = useQuery<{
    ok: boolean
    lopTen: string | null
    items: Array<{ accountId: string; displayName: string; avatarUrl: string | null; weeklyXp: number; rank: number }>
  }>({
    queryKey: ['engagement', 'leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard')
      if (!res.ok) return { ok: false, lopTen: null, items: [] }
      return res.json()
    },
    staleTime: 60_000,
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
  const topUsers = (leaderboardData?.items ?? []).filter((u) => u.weeklyXp > 0).slice(0, 3)
  const userRankIdx = (leaderboardData?.items ?? []).findIndex((u) => u.accountId === String(nguoiDung.accountId))
  const myRank = userRankIdx !== -1 ? `#${userRankIdx + 1}` : '#--'

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

      {/* ── Bìa danh tính & 4 Huy hiệu (Đồng bộ chuẩn giao diện thẻ của web) ── */}
      <section className="overflow-hidden rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm shadow-xs relative">
        {/* Bìa phong cảnh trường học */}
        <div
          className="h-44 sm:h-56 bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/assets/profile/profile_cover_clean.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        </div>

        <div className="p-5 sm:p-6 -mt-12 sm:-mt-16 relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
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
                <Avatar className="size-20 sm:size-24 rounded-2xl ring-2 ring-border-default shadow-md transition-transform duration-150 group-hover/avatar:scale-105">
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
            <div className="min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 min-h-[2rem]">
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
                    className="flex min-w-0 items-center gap-1.5"
                  >
                    <Input
                      value={tenTam}
                      onChange={(e) => setTenTam(e.target.value)}
                      maxLength={TEN_HIEN_THI_TOI_DA}
                      className="h-8 w-44 text-sm font-semibold bg-surface border-border-default text-text-primary"
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
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
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
              <div className="mt-2.5 rounded-xl border border-border-default bg-surface-overlay/60 px-3 py-1.5 min-h-[2rem] flex items-center justify-between gap-2 max-w-md">
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

          {/* 4 Huy hiệu thống kê chuẩn giao diện campus */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            {/* Badge 1: XP */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-surface-overlay/80 text-xs font-semibold text-text-secondary select-none shadow-xs">
              <Zap className="size-4 text-amber-400" />
              <span className="text-text-primary font-bold">{soLieu(profile?.totalXp) ?? '0'} XP</span>
            </div>
            {/* Badge 2: Lớp */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-surface-overlay/80 text-xs font-semibold text-text-secondary select-none shadow-xs">
              <ShieldCheck className="size-4 text-sky-400" />
              <span className="text-text-primary font-bold">{nguoiDung.lop?.ten || leaderboardData?.lopTen || 'Lớp 10A7'}</span>
            </div>
            {/* Badge 3: BXH */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-surface-overlay/80 text-xs font-semibold text-text-secondary select-none shadow-xs">
              <Award className="size-4 text-purple-400" />
              <span className="text-text-primary font-bold">{myRank} BXH</span>
            </div>
            {/* Badge 4: Streaks */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default bg-surface-overlay/80 text-xs font-semibold text-text-secondary select-none shadow-xs">
              <Flame className="size-4 text-orange-400 fill-orange-400" />
              <span className="text-text-primary font-bold">{soLieu(profile?.currentStreak) ?? '0'} Streaks</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 Cột chuẩn Mockup 2: Cột Trái (Vinh danh + Tập tin) | Cột Phải (Thông tin + Bảo mật + Tiến trình) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Bảng vinh danh Top 3 Podiums & Bảng xếp hạng tuần */}
          <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 overflow-hidden relative shadow-xs">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              <span>Bảng vinh danh</span>
            </h3>

            {/* Bục Podiums 3D bậc thang */}
            {topUsers.length > 0 ? (
              <div className="flex items-end justify-center gap-3 sm:gap-8 pt-7 pb-3">
                {/* Rank 2 (Bạc) */}
                {topUsers[1] && (
                  <PodiumTop3 rank={2}>
                    <Avatar className="size-12 rounded-xl ring-2 ring-slate-300 shadow-md">
                      <AvatarImage src={topUsers[1].avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(topUsers[1].displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-slate-200 mt-1.5 max-w-[85px] truncate text-center">
                      {topUsers[1].displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{topUsers[1].weeklyXp} XP</span>
                  </PodiumTop3>
                )}
                {/* Rank 1 (Vàng Hoàng Kim) */}
                {topUsers[0] && (
                  <PodiumTop3 rank={1}>
                    <Avatar className="size-14 rounded-2xl ring-2 ring-amber-400 shadow-lg shadow-amber-400/50">
                      <AvatarImage src={topUsers[0].avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(topUsers[0].displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-amber-300 mt-1.5 max-w-[95px] truncate text-center">
                      {topUsers[0].displayName}
                    </span>
                    <span className="text-[10px] text-amber-400 font-black">{topUsers[0].weeklyXp} XP</span>
                  </PodiumTop3>
                )}
                {/* Rank 3 (Đồng) */}
                {topUsers[2] && (
                  <PodiumTop3 rank={3}>
                    <Avatar className="size-11 rounded-xl ring-2 ring-orange-400 shadow-md">
                      <AvatarImage src={topUsers[2].avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(topUsers[2].displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-orange-200 mt-1.5 max-w-[85px] truncate text-center">
                      {topUsers[2].displayName}
                    </span>
                    <span className="text-[10px] text-orange-400/80 font-semibold">{topUsers[2].weeklyXp} XP</span>
                  </PodiumTop3>
                )}
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-text-tertiary font-medium">
                Bảng xếp hạng tuần sẽ xuất hiện khi có học sinh tích luỹ XP
              </div>
            )}

            {/* Bảng xếp hạng chi tiết bên dưới */}
            {leaderboardData?.items && leaderboardData.items.length > 0 && (
              <div className="mt-5 border-t border-border-subtle pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-text-tertiary border-b border-border-subtle pb-2">
                        <th className="py-2 pl-2 font-bold w-12">Hạng</th>
                        <th className="py-2 font-bold">Thành viên</th>
                        <th className="py-2 font-bold text-right pr-2">XP Tuần</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {leaderboardData.items.slice(0, 5).map((user, idx) => {
                        const isMe = user.accountId === String(nguoiDung.accountId)
                        return (
                          <tr
                            key={user.accountId}
                            className={cn(
                              'hover:bg-surface-overlay/50 transition-colors',
                              isMe && 'bg-amber-500/10 font-bold',
                            )}
                          >
                            <td className="py-2.5 pl-2 font-black text-amber-500">
                              #{idx + 1}
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6 rounded-lg ring-1 ring-border-default">
                                  <AvatarImage src={user.avatarUrl || undefined} />
                                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <span className={cn('truncate max-w-[140px] text-text-primary', isMe && 'text-amber-500')}>
                                  {user.displayName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-2 text-right font-black text-amber-500">
                              +{user.weeklyXp.toLocaleString('vi-VN')} XP
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Card 2: Tập tin học tập */}
          <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 overflow-hidden relative shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText className="size-5 text-brand" />
                <span>Tập tin học tập</span>
              </h3>
            </div>

            {/* 2 Khung thông số chuyên cần & tích luỹ */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface-overlay/50">
                <Flame className="size-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">{profile?.currentStreak ?? 0} Ngày</p>
                  <p className="text-[11px] text-text-tertiary font-medium">Chuyên cần</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-surface-overlay/50">
                <Zap className="size-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">{profile?.totalXp ?? 0} XP</p>
                  <p className="text-[11px] text-text-tertiary font-medium">Tích luỹ</p>
                </div>
              </div>
            </div>

            {/* Danh sách tài liệu kèm nút Tải về */}
            <div className="space-y-2.5">
              {[
                { title: 'Đề cương ôn tập Toán 10 Học kỳ 1.pdf', size: '2.4 MB' },
                { title: 'Tài liệu chuyên đề Vật lý 10.pdf', size: '3.1 MB' },
                { title: 'Bài tập thực hành Hóa học 10.pdf', size: '1.8 MB' },
              ].map((file) => (
                <div
                  key={file.title}
                  className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-overlay/30 hover:bg-surface-overlay/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 font-bold text-[10px] tracking-wide">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{file.title}</p>
                      <p className="text-[11px] text-text-tertiary">{file.size}</p>
                    </div>
                  </div>
                  <a
                    href="/assets/learning/tai-lieu-mau.pdf"
                    download
                    className="p-2 rounded-lg border border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors"
                    title="Tải về"
                  >
                    <Download className="size-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CỘT PHẢI (5 CỘT) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Thông tin cá nhân */}
          <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 relative shadow-xs">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <User className="size-5 text-brand" />
              <span>Thông tin cá nhân</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ten" className="text-xs font-semibold text-text-secondary">
                  Họ và tên
                </Label>
                <Input
                  id="ho-so-ten"
                  value={tenHienThi}
                  onChange={(e) => setTenHienThi(e.target.value)}
                  placeholder="Nhập họ và tên…"
                  autoComplete="name"
                  maxLength={TEN_HIEN_THI_TOI_DA}
                  className="rounded-xl border border-border-default bg-surface text-text-primary placeholder:text-text-tertiary h-9.5 text-xs font-medium focus:border-brand focus:ring-1 focus:ring-brand"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ngaysinh" className="text-xs font-semibold text-text-secondary">
                  Ngày tháng năm sinh
                </Label>
                <Input
                  id="ho-so-ngaysinh"
                  type="date"
                  value={ngaySinh}
                  onChange={(e) => setNgaySinh(e.target.value)}
                  className="rounded-xl border border-border-default bg-surface text-text-primary placeholder:text-text-tertiary h-9.5 text-xs font-medium focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-noisinhsong" className="text-xs font-semibold text-text-secondary">
                  Nơi sinh sống
                </Label>
                <Input
                  id="ho-so-noisinhsong"
                  value={noiSinhSong}
                  onChange={(e) => setNoiSinhSong(e.target.value)}
                  placeholder="Ví dụ: Định Quán, Đồng Nai"
                  maxLength={100}
                  className="rounded-xl border border-border-default bg-surface text-text-primary placeholder:text-text-tertiary h-9.5 text-xs font-medium focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-sdt" className="text-xs font-semibold text-text-secondary">
                  SĐT liên hệ
                </Label>
                <Input
                  id="ho-so-sdt"
                  type="tel"
                  value={sdtLienHe}
                  onChange={(e) => setSdtLienHe(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  maxLength={20}
                  className="rounded-xl border border-border-default bg-surface text-text-primary placeholder:text-text-tertiary h-9.5 text-xs font-medium focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-sothich" className="text-xs font-semibold text-text-secondary">
                  Sở thích
                </Label>
                <Input
                  id="ho-so-sothich"
                  value={soThich}
                  onChange={(e) => setSoThich(e.target.value)}
                  placeholder="Ví dụ: Đọc sách, lập trình, cờ vua…"
                  maxLength={200}
                  className="rounded-xl border border-border-default bg-surface text-text-primary placeholder:text-text-tertiary h-9.5 text-xs font-medium focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={dangLuuProfile}
                  className="w-full rounded-xl py-2.5 h-10 text-xs font-bold bg-brand hover:bg-brand/90 text-white shadow-xs cursor-pointer"
                >
                  <span>{dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
                </Button>
              </div>
            </form>
          </section>

          {/* Card 4: Bảo mật & Liên kết Google */}
          <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 relative shadow-xs">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-4">
              <ShieldCheck className="size-5 text-success" />
              <span>Bảo mật & Liên kết</span>
            </h3>

            <div className="space-y-4">
              {/* Liên kết Google */}
              <LienKetGoogle />

              {/* Nút Đổi mật khẩu nhanh */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Mật khẩu tài khoản</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMoDoiMatKhauModal(true)}
                  className="gap-1.5 border-border-default bg-surface hover:bg-surface-raised text-text-primary text-xs font-semibold rounded-xl"
                >
                  <KeyRound className="size-3.5 text-text-tertiary" />
                  <span>Đổi mật khẩu</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Card 5: Tiến trình học tập */}
          <ProgressPanel />
        </div>
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
        <p className="text-xs font-bold text-white flex items-center gap-1.5">
          <LogoGoogle className="size-3.5" />
          <span>Tài khoản Google</span>
        </p>
        <p className="text-[10px] text-slate-400">Đăng nhập nhanh không cần mật khẩu</p>
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
