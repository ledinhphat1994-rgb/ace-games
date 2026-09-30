// Hồ sơ người dùng dạng Popover gọn: xuất hiện sát nơi click, không che mờ toàn màn hình.
// Thông tin lấy từ /api/social/profile/:id; quan hệ bạn bè theo SocialState thời gian thực.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onDong])

  useEffect(() => {
    const rect = nguoi.anchorRect
    const cardW = 280
    const cardH = 340
    const pad = 12

    const winW = window.innerWidth
    const winH = window.innerHeight

    if (!rect) {
      // Mặc định nếu không có anchor: neo bên trái thanh sidebar bên phải
      setPos({
        left: Math.max(pad, winW - cardW - 340),
        top: Math.max(pad, Math.min(winH - cardH - pad, 120)),
      })
      return
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

    setPos({ top, left })
  }, [nguoi.anchorRect])

  const { data: hoSo, isPending, isError } = useQuery({
    queryKey: ['ho-so-nguoi-dung', nguoi.id],
    queryFn: () => layHoSoNguoiDung(nguoi.id),
    staleTime: 60_000,
    retry: false,
  })

  const ten = hoSo?.displayName ?? nguoi.ten
  const avatar = hoSo?.avatar ?? nguoi.avatar ?? null
  const vaiTro = nhanVaiTro(hoSo?.role ?? nguoi.vaiTro)
  const lopTen = hoSo ? hoSo.lopTen : (nguoi.lopTen ?? null)
  const capDo = hoSo ? tinhLevel(hoSo.totalXp) : null

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
        className="fixed z-50 w-72 rounded-2xl border border-white/10 bg-[#0c1222]/95 backdrop-blur-md shadow-2xl shadow-black/80 animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden"
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

        <div className="flex flex-col items-center gap-2 px-4 pt-6 pb-4 text-center">
          <AnhNguoiDung ten={ten} avatar={avatar} className="size-16 text-xl ring-2 ring-border-strong" />
          <h3 className="text-base font-bold text-text-primary break-words leading-tight">{ten}</h3>

          {(vaiTro || lopTen) && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {vaiTro && (
                <span className="rounded-full bg-brand/12 px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                  {vaiTro}
                </span>
              )}
              {lopTen && (
                <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-text-secondary">
                  {lopTen}
                </span>
              )}
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
          <dl className="grid grid-cols-2 divide-x divide-white/5 border-t border-white/5 bg-white/[0.01]">
            <div className="px-3 py-2 text-center">
              <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">Cấp</dt>
              <dd className="mt-0.5 text-lg font-black tabular-nums text-text-primary" data-testid="ho-so-cap">
                {isPending ? <span className="mx-auto block h-5 w-6 animate-pulse rounded bg-white/10" /> : capDo}
              </dd>
            </div>
            <div className="px-3 py-2 text-center">
              <dt className="text-[10px] font-semibold tracking-wide text-text-tertiary uppercase">XP</dt>
              <dd className="mt-0.5 text-lg font-black tabular-nums text-amber-300" data-testid="ho-so-xp">
                {isPending ? (
                  <span className="mx-auto block h-5 w-10 animate-pulse rounded bg-white/10" />
                ) : (
                  (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')
                )}
              </dd>
            </div>
          </dl>
        )}

        <div className="border-t border-white/5 p-3 bg-white/[0.02]">
          <NutQuanHe id={nguoi.id} day />
        </div>
      </div>
    </>
  )
}
