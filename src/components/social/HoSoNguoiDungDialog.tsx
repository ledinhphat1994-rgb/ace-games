// Hồ sơ người dùng dạng Popover gọn: xuất hiện sát nơi click, không che mờ toàn màn hình.
// Thông tin lấy từ /api/social/profile/:id; quan hệ bạn bè theo SocialState thời gian thực.

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Award, Lock, MessageSquare, User, X } from 'lucide-react'
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
  const [xemThanhTuu, setXemThanhTuu] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (xemThanhTuu) {
          setXemThanhTuu(false)
        } else {
          onDong()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDong, xemThanhTuu])

  const pos = useMemo(() => {
    const rect = nguoi.anchorRect
    const cardW = 320
    const cardH = 380
    const pad = 12

    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800

    if (!rect) {
      // Mặc định nếu không có anchor: neo bên trái thanh sidebar bên phải
      return {
        left: Math.max(pad, winW - cardW - 340),
        top: Math.max(pad, Math.min(winH - cardH - pad, 120)),
      }
    }

    // Nếu click ở nửa bên phải màn hình (như sidebar / chat), popover sẽ mở sang bên trái của phần tử click
    let left: number
    if (rect.left >= cardW + pad) {
      left = rect.left - cardW - 8
    } else if (winW - rect.right >= cardW + pad) {
      left = rect.right + 8
    } else {
      left = Math.max(pad, Math.min(winW - cardW - pad, rect.left))
    }

    // Căn dọc: ngang hàng với phần tử click
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

  // Thành tựu của người dùng (authoritative từ máy chủ)
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
  const unlockedCount =
    achievementsData?.unlockedCount ??
    (achievementsData?.achievements ? achievementsData.achievements.filter((a) => a.unlocked).length : null)
  const totalCount = achievementsData?.totalCount ?? achievementsData?.achievements?.length ?? 8
  const danhSachThanhTuu = achievementsData?.achievements ?? []

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
        className="fixed z-50 w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-white/10 bg-[#0c1222]/95 backdrop-blur-md shadow-2xl shadow-black/80 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
        data-testid="ho-so-nguoi-dung"
      >
        <button
          type="button"
          onClick={onDong}
          aria-label="Đóng"
          className="absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {xemThanhTuu ? (
          <div className="flex flex-col min-h-[320px]">
            <div className="flex items-center gap-2 border-b border-white/5 px-3 py-3">
              <button
                type="button"
                onClick={() => setXemThanhTuu(false)}
                className="flex size-7 items-center justify-center rounded-lg text-text-tertiary hover:bg-white/10 hover:text-text-primary transition-colors cursor-pointer"
                title="Quay lại hồ sơ"
                aria-label="Quay lại hồ sơ"
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text-primary truncate">Thành tựu · {ten}</p>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 tabular-nums">
                {unlockedCount ?? 0}/{totalCount}
              </span>
            </div>

            <div className="p-3 max-h-72 overflow-y-auto space-y-2 select-none" data-testid="ho-so-danh-sach-thanh-tuu">
              {danhSachThanhTuu.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-tertiary">
                  <Award className="size-8 mx-auto mb-2 opacity-30 text-amber-400" />
                  Chưa có dữ liệu thành tựu.
                </div>
              ) : (
                danhSachThanhTuu.map((ach) => (
                  <div
                    key={ach.key}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border transition-colors ${
                      ach.unlocked
                        ? 'border-amber-500/20 bg-amber-500/5 text-text-primary'
                        : 'border-white/5 bg-white/[0.01] text-text-tertiary opacity-60'
                    }`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        ach.unlocked ? 'bg-amber-500/15 text-amber-300' : 'bg-white/5 text-text-tertiary'
                      }`}
                    >
                      {ach.unlocked ? <Award className="size-4" /> : <Lock className="size-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-text-primary truncate">{ach.title}</p>
                        {ach.rewardXp ? (
                          <span className="text-[10px] font-mono text-amber-300 tabular-nums">+{ach.rewardXp} XP</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-text-tertiary line-clamp-2 mt-0.5">{ach.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 px-4 pt-6 pb-4 text-center">
              <AnhNguoiDung ten={ten} avatar={avatar} className="size-16 text-xl ring-2 ring-border-strong" />
              <h3 className="text-base font-bold text-text-primary break-words leading-tight">{ten}</h3>

              {vaiTro && (
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="rounded-full bg-brand/12 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                    {vaiTro}
                  </span>
                </div>
              )}

              {hoSo?.tieuDeHoSo && (
                <p className="max-w-full text-xs text-text-secondary italic line-clamp-2">“{hoSo.tieuDeHoSo}”</p>
              )}
            </div>

            {isError ? (
              <p className="border-t border-white/5 px-4 py-3 text-center text-xs text-text-tertiary" data-testid="ho-so-loi">
                Không tải được thông tin.
              </p>
            ) : (
              <dl className="grid grid-cols-3 divide-x divide-white/5 border-t border-white/5 bg-white/[0.01]">
                <div className="px-2 py-2 text-center">
                  <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">Cấp</dt>
                  <dd className="mt-0.5 text-base font-black tabular-nums text-text-primary" data-testid="ho-so-cap">
                    {isPending ? <span className="mx-auto block h-5 w-6 animate-pulse rounded bg-white/10" /> : capDo}
                  </dd>
                </div>
                <div className="px-2 py-2 text-center">
                  <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">XP</dt>
                  <dd className="mt-0.5 text-base font-black tabular-nums text-amber-300" data-testid="ho-so-xp">
                    {isPending ? (
                      <span className="mx-auto block h-5 w-10 animate-pulse rounded bg-white/10" />
                    ) : (
                      (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')
                    )}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => setXemThanhTuu(true)}
                  className="px-2 py-2 text-center hover:bg-white/5 transition-colors cursor-pointer"
                  title="Xem thành tựu"
                >
                  <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">Thành tựu</dt>
                  <dd className="mt-0.5 text-base font-black tabular-nums text-cyan-300" data-testid="ho-so-thanh-tuu-count">
                    {unlockedCount !== null ? `${unlockedCount}/${totalCount}` : '—'}
                  </dd>
                </button>
              </dl>
            )}

            {/* Bố cục hành động độc lập, tuyệt đối không đè lên nhau */}
            <div className="border-t border-white/5 p-3 bg-white/[0.02] flex flex-col gap-2.5">
              {/* Hàng 1: Nút quan hệ bạn bè - Chiếm trọn 100% bề ngang */}
              <div className="w-full flex items-center justify-between" data-testid="ho-so-quan-he-row">
                <NutQuanHe id={nguoi.id} day />
              </div>

              {/* Hàng 2: Grid 2 cột hành động Nhắn tin / Xem thành tựu - Tuyệt đối không bao giờ đè nhau */}
              <div className="grid grid-cols-2 gap-2 w-full">
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
                    className="h-9.5 rounded-xl px-2 gap-1.5 border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 hover:text-brand cursor-pointer justify-center"
                    title={`Nhắn tin với ${ten}`}
                    aria-label={`Nhắn tin với ${ten}`}
                    data-testid="ho-so-btn-nhan-tin"
                  >
                    <MessageSquare className="size-4 shrink-0" />
                    <span className="truncate">Nhắn tin</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.location.href = '/me'
                      onDong()
                    }}
                    className="h-9.5 rounded-xl px-2 gap-1.5 border-white/10 hover:bg-white/10 text-text-primary cursor-pointer justify-center"
                    title="Xem hồ sơ của tôi"
                    aria-label="Xem hồ sơ của tôi"
                  >
                    <User className="size-4 shrink-0" />
                    <span className="truncate">Hồ sơ</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setXemThanhTuu(true)}
                  className="h-9.5 rounded-xl px-2 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 cursor-pointer justify-center"
                  title={`Xem thành tựu của ${ten}`}
                  aria-label={`Xem thành tựu của ${ten}`}
                  data-testid="ho-so-btn-thanh-tuu"
                >
                  <Award className="size-4 shrink-0" />
                  <span className="truncate">Thành tựu</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
