// Dải người tham gia trên thanh trên cùng: kéo qua kéo lại (hoặc lăn chuột) để xem hết danh sách.
// Rê chuột vào một người chỉ hiện tên (khung tooltip nằm ngoài dải nên không bị cắt); quyền hiện bằng biểu tượng nhỏ trên ảnh.
// Mỗi người hiện ảnh đại diện thật của tài khoản (không có / lỗi ảnh thì chữ cái đầu); dải có đệm đủ rộng để viền,
// quầng sáng, vương miện và huy hiệu quyền không bị cắt, và căn giữa kiểu "an toàn" (tràn thì vẫn cuộn tới người đầu).
// Chủ phòng bấm vào một người để cấp / thu hồi từng quyền công cụ; máy chủ lưu và kiểm quyền thật.
// Không có quyền tài liệu / bảng / video: phần trình chiếu luôn thuộc chủ phòng.

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, getInitials } from '@/lib/utils'
import { QUYEN_CONG_CU, type QuyenCongCu, type ThanhVienPhong } from '@shared/protocol/room'
import {
  Crown,
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

/** Ảnh đại diện tròn; ảnh không tải được thì quay về chữ cái đầu. `key` theo đường dẫn ảnh để đổi ảnh thì thử lại. */
function AnhDaiDien({ ten, avatar }: { ten: string; avatar?: string | null }) {
  const [loi, setLoi] = useState(false)
  if (avatar && !loi) {
    return (
      <img
        src={avatar}
        alt=""
        draggable={false}
        onError={() => setLoi(true)}
        className="size-full rounded-full object-cover"
        data-testid="member-strip-anh"
      />
    )
  }
  return <>{getInitials(ten)}</>
}

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
        // Không dùng justify-center trên khung cuộn (tràn thì người đầu bị cắt, không cuộn tới được): lề tự động ở
        // người đầu / cuối để căn giữa. Đệm ngang + dọc chừa chỗ cho viền, quầng sáng, vương miện, huy hiệu quyền.
        'flex min-w-0 max-w-full items-center gap-2 sm:gap-3 overflow-x-auto px-3 py-2 select-none touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li:first-child]:ml-auto [&>li:last-child]:mr-auto',
        dangKeo ? 'cursor-grabbing' : 'cursor-grab',
      )}
      aria-label="Người tham gia"
      data-testid="member-strip"
    >
      {members.map((m) => {
        const laToi = m.key === myActorKey
        const laTrinhChieu = Boolean(m.isHost || m.canModerate)
        const cap = quyenCongCu[m.key] ?? []
        const hasMic = Boolean(m.mic || cap.includes('mic'))
        const hasVe = cap.some((q) => ['but', 'to_sang', 'chu', 'hinh', 'tay', 'xoa'].includes(q))
        const hasLaser = cap.includes('laser')

        const avatar = (
          <Tooltip>
            <TooltipTrigger render={<span className="relative flex shrink-0" />}>
              <span
                className={cn(
                  'flex size-11 sm:size-12 items-center justify-center overflow-hidden rounded-full border-2 text-xs sm:text-sm font-black text-text-primary shadow-md transition-all duration-150 group-hover:scale-105',
                  mauCho(m.key),
                  laToi ? 'border-brand ring-2 ring-brand/30' : laTrinhChieu ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : cap.length > 0 ? 'border-brand ring-2 ring-brand/30 shadow-[0_0_10px_rgba(198,161,90,0.3)]' : 'border-border-default',
                  m.soKetNoi > 0 ? '' : 'opacity-40',
                )}
              >
                <AnhDaiDien key={m.avatar ?? ''} ten={m.ten} avatar={m.avatar} />
              </span>

              {/* Chủ phòng: Icon vương miện hoàng gia to rõ nổi bật */}
              {laTrinhChieu && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex size-5 sm:size-5.5 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 shadow-md ring-2 ring-canvas"
                >
                  <Crown className="size-3 sm:size-3.5 fill-current" />
                </span>
              )}

              {/* Người tham gia: Tóm tắt các quyền bằng icon được chủ phòng cấp to rõ nét */}
              {!laTrinhChieu && (hasMic || hasVe || hasLaser || cap.length > 0) && (
                <span
                  className="absolute -right-2 -bottom-1 flex items-center gap-1 rounded-full bg-surface px-1.5 py-0.5 border border-brand/50 shadow-lg ring-1 ring-canvas"
                  data-testid={`member-strip-co-quyen-${m.key}`}
                >
                  {hasMic && <Mic className="size-3 text-success drop-shadow-sm" />}
                  {hasVe && <Pen className="size-3 text-brand drop-shadow-sm" />}
                  {hasLaser && <MousePointer2 className="size-3 text-warning drop-shadow-sm" />}
                </span>
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} arrow={false} className="rounded-lg border border-border-default bg-surface-raised px-2.5 py-1 text-xs font-semibold text-text-primary shadow-lg">
              {m.ten}
            </TooltipContent>
          </Tooltip>
        )

        return (
          <li key={m.key} className="group relative shrink-0">
            {canGrant && !laToi && !laTrinhChieu ? (
              <Popover open={moCua === m.key} onOpenChange={(mo) => setMoCua(mo ? m.key : null)}>
                <PopoverTrigger
                  className="flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label={`Quyền của ${m.ten}`}
                  data-testid={`member-strip-${m.key}`}
                >
                  {avatar}
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-64 rounded-2xl border border-border-default bg-surface-raised p-3 text-text-primary shadow-2xl"
                  data-testid="member-grant-panel"
                >
                  <p className="mb-2 truncate text-sm font-semibold text-text-primary">{m.ten}</p>
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
                              ? 'border-brand/40 bg-brand/12 text-brand'
                              : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
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
                      className="h-8 cursor-pointer rounded-lg border border-border-default text-xs text-text-secondary transition-colors hover:bg-surface-overlay"
                      data-testid="grant-all"
                    >
                      Cấp tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => onGrant(m.key, [])}
                      className="h-8 cursor-pointer rounded-lg border border-border-default text-xs text-text-secondary transition-colors hover:bg-surface-overlay"
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
