// Dải người tham gia trên thanh trên cùng: kéo qua kéo lại (hoặc lăn chuột) để xem hết danh sách.
// Chủ phòng bấm vào một người để cấp / thu hồi từng quyền công cụ; máy chủ lưu và kiểm quyền thật.
// Không có quyền tài liệu / bảng / video: phần trình chiếu luôn thuộc chủ phòng.

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn, getInitials } from '@/lib/utils'
import { QUYEN_CONG_CU, type QuyenCongCu, type ThanhVienPhong } from '@shared/protocol/room'
import {
  Eraser,
  Highlighter,
  Mic,
  MousePointer2,
  Pen,
  Shapes,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export interface MemberStripProps {
  members: ThanhVienPhong[]
  myActorKey: string
  /** Chủ phòng / người điều hành mới cấp được quyền. */
  canGrant: boolean
  /** Quyền đã cấp, theo actorKey (không có = chỉ xem). */
  quyenCongCu: Record<string, QuyenCongCu[]>
  onGrant: (targetKey: string, cap: QuyenCongCu[]) => void
}

const O_QUYEN: { quyen: QuyenCongCu; ten: string; icon: LucideIcon }[] = [
  { quyen: 'mic', ten: 'Mic', icon: Mic },
  { quyen: 'laser', ten: 'Chuột (laser)', icon: MousePointer2 },
  { quyen: 'but', ten: 'Bút', icon: Pen },
  { quyen: 'to_sang', ten: 'Dạ quang', icon: Highlighter },
  { quyen: 'chu', ten: 'Chữ', icon: Type },
  { quyen: 'hinh', ten: 'Hình', icon: Shapes },
  { quyen: 'tay', ten: 'Tẩy', icon: Eraser },
  { quyen: 'xoa', ten: 'Xoá hết', icon: Trash2 },
]

const MAU_NEN = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500']

function mauCho(key: string): string {
  let tong = 0
  for (let i = 0; i < key.length; i++) tong = (tong * 31 + key.charCodeAt(i)) % 997
  return MAU_NEN[tong % MAU_NEN.length]
}

/** Kéo quá ngưỡng này mới tính là kéo (dưới ngưỡng là bấm chọn người). */
const NGUONG_KEO = 5

export function MemberStrip({ members, myActorKey, canGrant, quyenCongCu, onGrant }: MemberStripProps) {
  const dsRef = useRef<HTMLUListElement>(null)
  const keoRef = useRef<{ x: number; cuon: number; daKeo: boolean; id: number } | null>(null)
  const [dangKeo, setDangKeo] = useState(false)
  const [moCua, setMoCua] = useState<string | null>(null)

  // Lăn chuột dọc thì cuộn ngang (chuột thường không có bánh xe ngang).
  useEffect(() => {
    const el = dsRef.current
    if (!el) return
    const xuLy = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', xuLy, { passive: false })
    return () => el.removeEventListener('wheel', xuLy)
  }, [])

  const batDauKeo = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    keoRef.current = { x: e.clientX, cuon: e.currentTarget.scrollLeft, daKeo: false, id: e.pointerId }
  }
  const keo = (e: React.PointerEvent<HTMLUListElement>) => {
    const k = keoRef.current
    const el = dsRef.current
    if (!k || !el || k.id !== e.pointerId) return
    const dx = e.clientX - k.x
    if (!k.daKeo && Math.abs(dx) < NGUONG_KEO) return
    if (!k.daKeo) {
      k.daKeo = true
      setDangKeo(true)
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }
    el.scrollLeft = k.cuon - dx
  }
  const thaKeo = (e: React.PointerEvent<HTMLUListElement>) => {
    const k = keoRef.current
    if (!k || k.id !== e.pointerId) return
    try {
      dsRef.current?.releasePointerCapture(e.pointerId)
    } catch {}
    setDangKeo(false)
    // Vừa kéo xong: giữ cờ tới hết lượt click để không mở nhầm ô cấp quyền của người dưới con trỏ.
    setTimeout(() => {
      keoRef.current = null
    }, 0)
  }

  if (members.length === 0) return null

  return (
    <ul
      ref={dsRef}
      onPointerDown={batDauKeo}
      onPointerMove={keo}
      onPointerUp={thaKeo}
      onPointerCancel={thaKeo}
      onClickCapture={(e) => {
        if (keoRef.current?.daKeo) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className={cn(
        'flex min-w-0 max-w-[34vw] items-center gap-1 overflow-x-auto py-0.5 select-none touch-pan-x [scrollbar-width:none] sm:max-w-[30vw] lg:max-w-[26vw] [&::-webkit-scrollbar]:hidden',
        dangKeo ? 'cursor-grabbing' : 'cursor-grab',
      )}
      aria-label="Người tham gia"
      data-testid="member-strip"
    >
      {members.map((m) => {
        const laToi = m.key === myActorKey
        const laTrinhChieu = Boolean(m.isHost || m.canModerate)
        const cap = quyenCongCu[m.key] ?? []
        const avatar = (
          <span className="relative flex shrink-0">
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-full border-2 text-[11px] font-bold text-white',
                mauCho(m.key),
                laToi ? 'border-cyan-300' : laTrinhChieu ? 'border-amber-300' : 'border-transparent',
                m.soKetNoi > 0 ? '' : 'opacity-40',
              )}
            >
              {getInitials(m.ten)}
            </span>
            {m.mic && (
              <Mic className="absolute -right-1 -bottom-1 size-4 rounded-full bg-emerald-500 p-0.5 text-white ring-2 ring-slate-950" />
            )}
            {!laTrinhChieu && cap.length > 0 && !m.mic && (
              <span
                className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-cyan-400 ring-2 ring-slate-950"
                data-testid={`member-strip-co-quyen-${m.key}`}
              />
            )}
          </span>
        )

        return (
          <li key={m.key} className="shrink-0" title={m.ten}>
            {canGrant && !laToi && !laTrinhChieu ? (
              <Popover open={moCua === m.key} onOpenChange={(mo) => setMoCua(mo ? m.key : null)}>
                <PopoverTrigger
                  className="flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  aria-label={`Quyền của ${m.ten}`}
                  data-testid={`member-strip-${m.key}`}
                >
                  {avatar}
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-64 rounded-2xl border border-white/15 bg-slate-950/95 p-3 text-slate-200 shadow-2xl backdrop-blur-2xl"
                  data-testid="member-grant-panel"
                >
                  <p className="mb-2 truncate text-sm font-semibold text-white">{m.ten}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {O_QUYEN.map(({ quyen, ten, icon: Icon }) => {
                      const co = cap.includes(quyen)
                      return (
                        <button
                          key={quyen}
                          type="button"
                          aria-pressed={co}
                          onClick={() => onGrant(m.key, co ? cap.filter((q) => q !== quyen) : [...cap, quyen])}
                          className={cn(
                            'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors',
                            co
                              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                              : 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200',
                          )}
                          data-testid={`grant-${quyen}`}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span className="truncate">{ten}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => onGrant(m.key, [...QUYEN_CONG_CU])}
                      className="h-8 cursor-pointer rounded-lg border border-white/10 text-xs text-slate-300 transition-colors hover:bg-white/5"
                      data-testid="grant-all"
                    >
                      Cấp tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => onGrant(m.key, [])}
                      className="h-8 cursor-pointer rounded-lg border border-white/10 text-xs text-slate-300 transition-colors hover:bg-white/5"
                      data-testid="grant-none"
                    >
                      Thu hồi hết
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <span className="flex">{avatar}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
