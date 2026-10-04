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
  Flame,
  KeyRound,
  Pencil,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react'
import {
  IconCrown3D,
  IconPdf3D,
  IconXpMedal3D,
  IconShield3D,
  IconTrophyGold3D,
  IconStarSparkle,
  PodiumTop3,
  CornerBolts,
} from '@/features/games/GameArt3D'
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

      {/* ── Bìa danh tính & 4 Huy hiệu 3D (Đúng phong cách Mockup 2) ── */}
      <section className="overflow-hidden rounded-2xl sm:rounded-3xl cyber-steel-card shadow-xl relative">
        <CornerBolts />

        {/* Bìa phong cảnh trường học lúc hoàng hôn */}
        <div
          className="h-44 sm:h-56 bg-cover bg-center relative"
          style={{ backgroundImage: 'url(/assets/profile/profile_cover_clean.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-transparent" />
        </div>

        <div className="p-5 sm:p-6 -mt-12 sm:-mt-16 relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar kim loại ánh ngọc sapphire */}
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
                <Avatar className="size-20 sm:size-24 rounded-2xl ring-4 ring-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-transform duration-150 group-hover/avatar:scale-105">
                  {nguoiDung.avatar && (
                    <AvatarImage src={nguoiDung.avatar} alt={displayName} className="rounded-2xl object-cover" />
                  )}
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-2xl font-black text-amber-400">
                    {chuCaiDau}
                  </AvatarFallback>
                </Avatar>

                {/* Overlay hover đổi avatar */}
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover/avatar:opacity-100">
                  <Camera className="size-5 text-amber-300" />
                  <span className="mt-1 text-[10px] font-bold text-amber-300">Đổi ảnh</span>
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
                      className="h-8 w-44 text-sm font-semibold cyber-stardust-input text-white"
                      ref={focusEditor}
                    />
                    <Button type="submit" size="xs" disabled={dangLuuProfile} className="cyber-gold-btn text-xs font-bold">
                      Lưu
                    </Button>
                    <Button type="button" variant="ghost" size="xs" onClick={() => setDangSuaTen(false)}>
                      Hủy
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-md">
                      {displayName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setTenTam(displayName)
                        setDangSuaTen(true)
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-800/60 cursor-pointer"
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
              <p className="text-xs text-sky-400/80 font-medium mt-0.5">@{nguoiDung.username}</p>

              {/* Suy nghĩ nhanh */}
              <div className="mt-2.5 rounded-xl border border-sky-500/20 bg-black/40 px-3 py-1.5 min-h-[2rem] flex items-center justify-between gap-2 max-w-md">
                {dangSuaSuyNghi ? (
                  <form onSubmit={handleLuuSuyNghiNhanh} className="w-full space-y-2">
                    <Input
                      value={suyNghiTam}
                      onChange={(e) => setSuyNghiTam(e.target.value)}
                      placeholder="Nhập suy nghĩ của bạn…"
                      maxLength={150}
                      className="h-8 text-xs cyber-stardust-input text-white"
                      autoFocus
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 mr-1">Icon:</span>
                      {EMOJI_GOI_Y.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSuyNghiTam((prev) => (prev ? prev + ' ' + em : em))}
                          className="size-6 text-xs rounded hover:bg-slate-700 transition-all flex items-center justify-center cursor-pointer"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button type="button" variant="ghost" size="xs" onClick={() => setDangSuaSuyNghi(false)}>
                        Hủy
                      </Button>
                      <Button type="submit" size="xs" disabled={dangLuuProfile} className="cyber-gold-btn text-xs font-bold">
                        {dangLuuProfile ? 'Đang lưu…' : 'Lưu'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-xs italic text-slate-300 break-words line-clamp-1 flex-1">
                      {tieuDeHoSo ? `"${tieuDeHoSo}"` : '"Chưa có suy nghĩ nào."'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSuyNghiTam(tieuDeHoSo)
                        setDangSuaSuyNghi(true)
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 shrink-0 cursor-pointer ml-1"
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

          {/* 4 Huy hiệu Cyber Glow nổi bật (Mockup 2) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            {/* Badge 1: Ribbon Medal XP */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-amber-400/50 bg-gradient-to-r from-amber-500/15 to-amber-600/10 text-amber-300 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] select-none">
              <IconXpMedal3D size={20} />
              <span>{soLieu(profile?.totalXp) ?? '0'} XP</span>
            </div>
            {/* Badge 2: Class Shield */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-sky-400/50 bg-gradient-to-r from-sky-500/15 to-blue-600/10 text-sky-300 font-bold text-xs shadow-[0_0_15px_rgba(56,189,248,0.25)] select-none">
              <IconShield3D size={20} />
              <span>{nguoiDung.lop?.ten || leaderboardData?.lopTen || 'Lớp 10A7'}</span>
            </div>
            {/* Badge 3: Trophy Ranking */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-purple-400/50 bg-gradient-to-r from-purple-500/15 to-indigo-600/10 text-purple-300 font-bold text-xs shadow-[0_0_15px_rgba(168,85,247,0.25)] select-none">
              <IconTrophyGold3D size={20} />
              <span>{myRank} BXH</span>
            </div>
            {/* Badge 4: Streaks Flame */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-orange-400/50 bg-gradient-to-r from-orange-500/15 to-red-600/10 text-orange-300 font-bold text-xs shadow-[0_0_15px_rgba(249,115,22,0.25)] select-none">
              <Flame className="size-4.5 text-orange-400 fill-orange-400" />
              <span>{soLieu(profile?.currentStreak) ?? '0'} Streaks</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 Cột chuẩn Mockup 2: Cột Trái (Vinh danh + Tập tin) | Cột Phải (Thông tin + Bảo mật + Tiến trình) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Bảng vinh danh Top 3 Podiums & Bảng xếp hạng tuần */}
          <section className="rounded-2xl cyber-steel-card p-5 sm:p-6 overflow-hidden relative shadow-lg">
            <CornerBolts />
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <IconCrown3D size={22} />
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
              <div className="h-28 flex items-center justify-center text-xs text-slate-400 font-medium">
                Bảng xếp hạng tuần sẽ xuất hiện khi có học sinh tích luỹ XP
              </div>
            )}

            {/* Bảng xếp hạng chi tiết bên dưới */}
            {leaderboardData?.items && leaderboardData.items.length > 0 && (
              <div className="mt-5 border-t border-slate-700/60 pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700/40 pb-2">
                        <th className="py-2 pl-2 font-bold w-12">Hạng</th>
                        <th className="py-2 font-bold">Thành viên</th>
                        <th className="py-2 font-bold text-right pr-2">XP Tuần</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {leaderboardData.items.slice(0, 5).map((user, idx) => {
                        const isMe = user.accountId === String(nguoiDung.accountId)
                        return (
                          <tr
                            key={user.accountId}
                            className={cn(
                              'hover:bg-slate-800/40 transition-colors',
                              isMe && 'bg-amber-500/10 font-bold',
                            )}
                          >
                            <td className="py-2.5 pl-2 font-black text-amber-400">
                              #{idx + 1}
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6 rounded-lg ring-1 ring-slate-600">
                                  <AvatarImage src={user.avatarUrl || undefined} />
                                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                </Avatar>
                                <span className={cn('truncate max-w-[140px] text-white', isMe && 'text-amber-300')}>
                                  {user.displayName}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pr-2 text-right font-black text-amber-400">
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

          {/* Card 2: Tập tin học tập (Khung kim loại đồng thau 3D vát cạnh Brass Plate) */}
          <section className="rounded-2xl cyber-brass-plate p-5 sm:p-6 overflow-hidden relative shadow-xl">
            <CornerBolts color="brass" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                <IconPdf3D size={24} />
                <span>Tập tin học tập</span>
              </h3>
            </div>

            {/* 2 Khung rãnh thông số đồng thau âm bản (Mockup 2) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-600/40 bg-black/40 shadow-inner">
                <Flame className="size-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-amber-300 tabular-nums">{profile?.currentStreak ?? 0} Ngày</p>
                  <p className="text-[10px] text-amber-400/80 font-medium">Chuyên cần</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-600/40 bg-black/40 shadow-inner">
                <Zap className="size-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-black text-amber-300 tabular-nums">{profile?.totalXp ?? 0} XP</p>
                  <p className="text-[10px] text-amber-400/80 font-medium">Tích luỹ</p>
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
                  className="flex items-center justify-between p-3 rounded-xl border border-amber-600/40 bg-[#160e06]/80 hover:border-amber-400/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconPdf3D size={28} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-100 truncate">{file.title}</p>
                      <p className="text-[10px] text-amber-400/70">{file.size}</p>
                    </div>
                  </div>
                  <a
                    href="/assets/learning/tai-lieu-mau.pdf"
                    download
                    className="p-2 rounded-lg border border-amber-600/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors"
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
          {/* Card 3: Thông tin cá nhân (Thép phay xước có 4 ốc vít) */}
          <section className="rounded-2xl cyber-steel-card p-5 sm:p-6 relative shadow-lg">
            <CornerBolts />
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="size-5 text-sky-400" />
              <span>Thông tin cá nhân</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ten" className="text-xs font-bold text-slate-300">
                  Họ và tên
                </Label>
                <Input
                  id="ho-so-ten"
                  value={tenHienThi}
                  onChange={(e) => setTenHienThi(e.target.value)}
                  placeholder="Nhập họ và tên…"
                  autoComplete="name"
                  maxLength={TEN_HIEN_THI_TOI_DA}
                  className="cyber-stardust-input text-white rounded-xl h-9.5 text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-ngaysinh" className="text-xs font-bold text-slate-300">
                  Ngày tháng năm sinh
                </Label>
                <Input
                  id="ho-so-ngaysinh"
                  type="date"
                  value={ngaySinh}
                  onChange={(e) => setNgaySinh(e.target.value)}
                  className="cyber-stardust-input text-white rounded-xl h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-noisinhsong" className="text-xs font-bold text-slate-300">
                  Nơi sinh sống
                </Label>
                <Input
                  id="ho-so-noisinhsong"
                  value={noiSinhSong}
                  onChange={(e) => setNoiSinhSong(e.target.value)}
                  placeholder="Ví dụ: Định Quán, Đồng Nai"
                  maxLength={100}
                  className="cyber-stardust-input text-white rounded-xl h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-sdt" className="text-xs font-bold text-slate-300">
                  SĐT liên hệ
                </Label>
                <Input
                  id="ho-so-sdt"
                  type="tel"
                  value={sdtLienHe}
                  onChange={(e) => setSdtLienHe(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  maxLength={20}
                  className="cyber-stardust-input text-white rounded-xl h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ho-so-sothich" className="text-xs font-bold text-slate-300">
                  Sở thích
                </Label>
                <Input
                  id="ho-so-sothich"
                  value={soThich}
                  onChange={(e) => setSoThich(e.target.value)}
                  placeholder="Ví dụ: Đọc sách, lập trình, cờ vua…"
                  maxLength={200}
                  className="cyber-stardust-input text-white rounded-xl h-9.5 text-xs font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={dangLuuProfile}
                  className="cyber-gold-btn w-full rounded-xl py-2.5 text-xs font-black cursor-pointer transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <IconStarSparkle className="size-3.5" />
                  <span>{dangLuuProfile ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Card 4: Bảo mật & Liên kết Google */}
          <section className="rounded-2xl cyber-steel-card p-5 sm:p-6 relative shadow-lg">
            <CornerBolts />
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="size-5 text-emerald-400" />
              <span>Bảo mật & Liên kết</span>
            </h3>

            <div className="space-y-4">
              {/* Liên kết Google */}
              <LienKetGoogle />

              {/* Nút Đổi mật khẩu nhanh */}
              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Mật khẩu tài khoản</p>
                  <p className="text-[10px] text-slate-400">Đổi mật khẩu định kỳ để bảo vệ tài khoản</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMoDoiMatKhauModal(true)}
                  className="gap-1.5 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold"
                >
                  <KeyRound className="size-3.5" />
                  <span>Đổi mật khẩu</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Card 5: Tiến trình học tập */}
          <section className="rounded-2xl cyber-steel-card p-5 sm:p-6 relative shadow-lg">
            <CornerBolts />
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <Award className="size-5 text-amber-400" />
              <span>Tiến trình học tập</span>
            </h3>
            <ProgressPanel />
          </section>
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
