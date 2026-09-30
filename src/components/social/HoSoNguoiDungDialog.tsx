// Hồ sơ người dùng dạng Popover gọn: xuất hiện sát nơi click, không che mờ toàn màn hình.
// Thông tin lấy từ /api/social/profile/:id; quan hệ bạn bè theo SocialState thời gian thực.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, ChevronRight, Lock, MessageSquare, Trophy, User, X } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '@/features/games/GameLeaderboard'
import { AnhNguoiDung } from './AnhNguoiDung'
import { NutQuanHe } from './NutQuanHe'
import { nhanVaiTro } from './quan-he'

export interface AnchorRect {
  top: number
  left: number
  right: number
  bottom: number
  width?: number
  height?: number
}

/** Người đang được xem: chỉ cần mã + những gì đã biết sẵn để hiện ngay trong lúc tải hồ sơ. */
export interface NguoiXem {
  id: number
  ten: string
  lopTen?: string | null
  vaiTro?: string | null
  avatar?: string | null
  anchorRect?: AnchorRect | null
}

interface HoSoNguoiDungDialogProps {
  nguoi: NguoiXem | null
  onDong: () => void
}

export function HoSoNguoiDungDialog({ nguoi, onDong }: HoSoNguoiDungDialogProps) {
  if (!nguoi) return null

  return createPortal(
    <NoiDungHoSoPop key={nguoi.id} nguoi={nguoi} onDong={onDong} />,
    document.body,
  )
}

function NoiDungHoSoPop({ nguoi, onDong }: { nguoi: NguoiXem; onDong: () => void }) {
  const { nguoiDung } = usePhien()
  const isMe = nguoiDung ? nguoiDung.accountId === nguoi.id : false
  const cardRef = useRef<HTMLDivElement>(null)
  const [moTatCaThanhTuu, setMoTatCaThanhTuu] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDong])

  const pos = useMemo(() => {
    const rect = nguoi.anchorRect
    const cardW = 320
    const cardH = 460
    const pad = 12

    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800

    if (!rect) {
      return {
        left: Math.max(pad, winW - cardW - 340),
        top: Math.max(pad, Math.min(winH - cardH - pad, 120)),
      }
    }

    let left: number
    if (rect.left >= cardW + pad) {
      left = rect.left - cardW - 8
    } else if (winW - rect.right >= cardW + pad) {
      left = rect.right + 8
    } else {
      left = Math.max(pad, Math.min(winW - cardW - pad, rect.left))
    }

    const idealTop = rect.top - 16
    const top = Math.max(pad, Math.min(winH - cardH - pad, idealTop))

    return { top, left }
  }, [nguoi.anchorRect])

  const { data: hoSo, isPending, isError } = useQuery({
    queryKey: ['ho-so-nguoi-dung', nguoi.id],
    queryFn: () => layHoSoNguoiDung(nguoi.id),
    staleTime: 60_000,
    retry: false,
  })

  // Dữ liệu thành tựu authoritative từ máy chủ
  const { data: achievementsData } = useQuery<{
    ok: boolean
    achievements?: Array<{
      key: string
      title: string
      description: string
      unlocked: boolean
      rewardXp?: number
    }>
    unlockedCount?: number
    totalCount?: number
  }>({
    queryKey: ['engagement', 'achievements', nguoi.id],
    queryFn: async () => {
      const res = await fetch(`/api/engagement/achievements?accountId=${nguoi.id}`)
      if (!res.ok) return { ok: false, achievements: [] }
      return res.json()
    },
    staleTime: 60_000,
  })

  const ten = hoSo?.displayName ?? nguoi.ten
  const avatar = hoSo?.avatar ?? nguoi.avatar ?? null
  const vaiTro = nhanVaiTro(hoSo?.role ?? nguoi.vaiTro)
  const lopTen = hoSo ? hoSo.lopTen : (nguoi.lopTen ?? null)
  const capDo = hoSo ? tinhLevel(hoSo.totalXp) : null

  const danhSachThanhTuu = achievementsData?.achievements ?? []
  const unlockedCount =
    achievementsData?.unlockedCount ??
    (danhSachThanhTuu.length > 0 ? danhSachThanhTuu.filter((a) => a.unlocked).length : null)
  const totalCount = achievementsData?.totalCount ?? danhSachThanhTuu.length ?? 8

  return (
    <>
      {/* Vùng bấm ra ngoài trong suốt — không làm mờ các vùng xung quanh */}
      <div
        className="fixed inset-0 z-40 bg-transparent cursor-default"
        onClick={onDong}
        aria-hidden="true"
      />

      <div
        ref={cardRef}
        style={{ top: `${pos.top}px`, left: `${pos.left}px` }}
        className="fixed z-50 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-[#0c1222]/98 backdrop-blur-xl shadow-2xl shadow-black/90 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[90vh]"
        data-testid="ho-so-nguoi-dung"
      >
        {/* ── VÙNG 3+: Highlighted chữ "Bạn" nổi bật ở góc trên bên trái khi là chính mình ── */}
        {isMe && (
          <div
            data-testid="badge-ban-highlight"
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500/25 to-blue-500/25 border border-cyan-400/50 px-2.5 py-0.5 shadow-[0_0_12px_rgba(6,182,212,0.35)] select-none"
          >
            <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-black text-cyan-300 tracking-wider uppercase">★ BẠN</span>
          </div>
        )}

        {/* Nút đóng góc phải */}
        <button
          type="button"
          onClick={onDong}
          aria-label="Đóng"
          className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Thân popup: Các card phân tách hoàn toàn, cấm chạm nhau (Zero Touch & Zero Overlap) */}
        <div className="p-3.5 flex flex-col gap-3 overflow-y-auto overscroll-contain">
          {/* ── CARD 1: Thông tin người dùng ── */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-center flex flex-col items-center gap-2 relative">
            <AnhNguoiDung ten={ten} avatar={avatar} className="size-16 text-xl ring-2 ring-border-strong" />
            <h3 className="text-base font-bold text-text-primary break-words leading-tight">{ten}</h3>

            {vaiTro && (
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="rounded-full bg-brand/12 border border-brand/20 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                  {vaiTro}
                </span>
              </div>
            )}

            {hoSo?.tieuDeHoSo && (
              <p className="max-w-full text-xs text-text-secondary italic line-clamp-2">“{hoSo.tieuDeHoSo}”</p>
            )}
          </div>

          {/* ── CARD 2: Chỉ số Cấp & XP ── */}
          {isError ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2 text-center text-xs text-text-tertiary" data-testid="ho-so-loi">
              Không tải được thông tin.
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
              <dl className="grid grid-cols-2 divide-x divide-white/10">
                <div className="px-2 py-1 text-center">
                  <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">Cấp</dt>
                  <dd className="mt-0.5 text-base font-black tabular-nums text-text-primary" data-testid="ho-so-cap">
                    {isPending ? <span className="mx-auto block h-5 w-6 animate-pulse rounded bg-white/10" /> : capDo}
                  </dd>
                </div>
                <div className="px-2 py-1 text-center">
                  <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">XP</dt>
                  <dd className="mt-0.5 text-base font-black tabular-nums text-amber-300" data-testid="ho-so-xp">
                    {isPending ? (
                      <span className="mx-auto block h-5 w-10 animate-pulse rounded bg-white/10" />
                    ) : (
                      (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* ── CARD 3: CARD THÀNH TỰU (Bổ sung card thành tựu riêng biệt) ── */}
          <div
            data-testid="card-thanh-tuu"
            className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Trophy className="size-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300">Thành tựu & Huy hiệu</span>
              </div>
              <span
                data-testid="ho-so-thanh-tuu-count"
                className="text-[11px] font-mono text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 tabular-nums font-bold"
              >
                {unlockedCount !== null ? `${unlockedCount}/${totalCount}` : '—'}
              </span>
            </div>

            {/* Danh sách huy hiệu hiển thị trực tiếp trong card */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto overscroll-contain pr-0.5 select-none" data-testid="ho-so-danh-sach-thanh-tuu">
              {danhSachThanhTuu.length === 0 ? (
                <div className="py-2 text-center text-xs text-text-tertiary">
                  Đang tải thành tựu…
                </div>
              ) : (
                (moTatCaThanhTuu ? danhSachThanhTuu : danhSachThanhTuu.slice(0, 3)).map((ach) => (
                  <div
                    key={ach.key}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border transition-colors ${
                      ach.unlocked
                        ? 'border-amber-500/25 bg-amber-500/10 text-text-primary'
                        : 'border-white/5 bg-white/[0.02] text-text-tertiary opacity-60'
                    }`}
                  >
                    <div
                      className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                        ach.unlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-text-tertiary'
                      }`}
                    >
                      {ach.unlocked ? <Award className="size-3.5" /> : <Lock className="size-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-text-primary truncate">{ach.title}</p>
                    </div>
                    {ach.rewardXp ? (
                      <span className="text-[10px] font-mono text-amber-300/90 shrink-0">+{ach.rewardXp} XP</span>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            {danhSachThanhTuu.length > 3 && (
              <button
                type="button"
                data-testid="ho-so-btn-thanh-tuu"
                onClick={() => setMoTatCaThanhTuu(!moTatCaThanhTuu)}
                className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1 pt-1 border-t border-amber-500/20 transition-colors cursor-pointer"
              >
                <span>{moTatCaThanhTuu ? 'Thu gọn' : `Xem thêm (${danhSachThanhTuu.length - 3} huy hiệu)`}</span>
                <ChevronRight className={`size-3 transition-transform ${moTatCaThanhTuu ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            )}
          </div>

          {/* ── CARD 4: Thao tác & Tương tác (Zero Touch - Các nút phân tầng rõ ràng, cấm chạm nhau) ── */}
          <div
            data-testid="ho-so-quan-he-row"
            className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex flex-col gap-2.5"
          >
            {/* Hàng nút quan hệ bạn bè (độc lập, đủ khoảng trống) */}
            {!isMe && (
              <div className="w-full flex items-center justify-between">
                <NutQuanHe id={nguoi.id} day />
              </div>
            )}

            {/* Hàng nút hành động thứ hai (tách biệt, không chạm nút trên) */}
            {!isMe ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent('campus:open-dm', {
                      detail: {
                        id: nguoi.id,
                        displayName: ten,
                        avatar: avatar,
                        lopTen: lopTen,
                      },
                    })
                  )
                  onDong()
                }}
                className="w-full h-9 rounded-xl gap-2 border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 hover:text-brand cursor-pointer justify-center font-bold"
                title={`Nhắn tin với ${ten}`}
                aria-label={`Nhắn tin với ${ten}`}
                data-testid="ho-so-btn-nhan-tin"
              >
                <MessageSquare className="size-4 shrink-0 text-brand" />
                <span>Nhắn tin</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.location.href = '/me'
                  onDong()
                }}
                className="w-full h-9 rounded-xl gap-2 border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 cursor-pointer justify-center font-bold"
                title="Xem và chỉnh sửa hồ sơ cá nhân"
                aria-label="Xem và chỉnh sửa hồ sơ cá nhân"
              >
                <User className="size-4 shrink-0 text-cyan-300" />
                <span>Hồ sơ cá nhân</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
