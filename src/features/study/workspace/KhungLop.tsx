// Khung cho một lớp trên sân khấu (Tài liệu / Bảng / Video) + nút điều khiển góc phải đầu khung.
// Đổi vai trò (chính ⇄ cửa sổ nổi ⇄ ẩn) chỉ đổi class: phần tử con giữ nguyên, video YouTube không bị tải lại.

import { EyeOff, Maximize, Maximize2, Minimize, PictureInPicture2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { kepKhung, type KhungCuaSo, type LopId, type VaiTroLop } from './stage-layout'

// Góc đặt cửa sổ nổi theo thứ tự: dưới-phải, trên-phải, dưới-trái, trên-trái.
const GOC_CUA_SO = [
  'right-3 bottom-3',
  'right-3 top-3',
  'left-3 bottom-3',
  'left-3 top-3',
] as const

/**
 * Tay kéo đổi cỡ cửa sổ nổi: vùng bắt chuột dày, nằm vắt qua mép (một nửa ngoài, một nửa trong) — cửa sổ không còn
 * overflow-hidden ở khung ngoài nên phần ngoài mép không bị cắt. Rê vào cửa sổ thì hiện vạch / góc chữ L để biết chỗ kéo.
 */
const TAY_KEO_CANH: { huong: 'n' | 's' | 'w' | 'e'; lop: string; tieuDe: string }[] = [
  { huong: 'n', lop: '-top-2 inset-x-4 h-4 cursor-ns-resize', tieuDe: 'Kéo thay đổi chiều cao' },
  { huong: 's', lop: '-bottom-2 inset-x-4 h-4 cursor-ns-resize', tieuDe: 'Kéo thay đổi chiều cao' },
  { huong: 'w', lop: '-left-2 inset-y-4 w-4 cursor-ew-resize', tieuDe: 'Kéo thay đổi chiều rộng' },
  { huong: 'e', lop: '-right-2 inset-y-4 w-4 cursor-ew-resize', tieuDe: 'Kéo thay đổi chiều rộng' },
]

/** Góc: ô 28px (12px ngoài mép), góc chữ L dày 4px rõ nét ôm đúng góc cửa sổ. */
const TAY_KEO_GOC: { huong: 'nw' | 'ne' | 'sw' | 'se'; lop: string; chuL: string }[] = [
  { huong: 'nw', lop: '-top-3 -left-3 cursor-nwse-resize', chuL: 'top-3 left-3 border-t-4 border-l-4 rounded-tl-lg' },
  { huong: 'ne', lop: '-top-3 -right-3 cursor-nesw-resize', chuL: 'top-3 right-3 border-t-4 border-r-4 rounded-tr-lg' },
  { huong: 'sw', lop: '-bottom-3 -left-3 cursor-nesw-resize', chuL: 'bottom-3 left-3 border-b-4 border-l-4 rounded-bl-lg' },
  { huong: 'se', lop: '-bottom-3 -right-3 cursor-nwse-resize', chuL: 'bottom-3 right-3 border-b-4 border-r-4 rounded-br-lg' },
]

interface KhungLopProps {
  id: LopId
  vaiTro: VaiTroLop
  viTri: number
  /** Người tham gia chỉ xem: không kéo, không đổi cỡ cửa sổ nổi. */
  khoa?: boolean
  /** Vị trí + cỡ cửa sổ nổi do người trình chiếu đặt (tỉ lệ sân khấu); chưa có thì nằm ở góc mặc định. */
  khung?: KhungCuaSo
  /** Người trình chiếu thả chuột sau khi kéo / đổi cỡ → khung mới (đồng bộ cho cả phòng). */
  onDoiKhung?: (khung: KhungCuaSo) => void
  /** Trong lúc kéo / đổi cỡ: khung tạm để cả phòng thấy cửa sổ di chuyển theo ngay. */
  onKeoKhung?: (khung: KhungCuaSo) => void
  children: ReactNode
}

/** Hộp cửa sổ lúc bắt đầu kéo (px, so với sân khấu) — khung tạm = hộp này + độ dời, không phải đọc DOM giữa chừng. */
interface HopBatDau {
  trai: number
  tren: number
  rong: number
  cao: number
  chaRong: number
  chaCao: number
}

function hopBatDau(el: HTMLElement | null): HopBatDau | undefined {
  const cha = el?.parentElement
  if (!el || !cha) return undefined
  const a = el.getBoundingClientRect()
  const b = cha.getBoundingClientRect()
  if (b.width <= 0 || b.height <= 0) return undefined
  return { trai: a.left - b.left, tren: a.top - b.top, rong: a.width, cao: a.height, chaRong: b.width, chaCao: b.height }
}

const khungTuHop = (h: HopBatDau, trai: number, tren: number, rong: number, cao: number) =>
  kepKhung({ x: trai / h.chaRong, y: tren / h.chaCao, w: rong / h.chaRong, h: cao / h.chaCao })

export function KhungLop({ id, vaiTro, viTri, khoa = false, khung, onDoiKhung, onKeoKhung, children }: KhungLopProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dich, setDich] = useState({ x: 0, y: 0 })
  const [kichThuoc, setKichThuoc] = useState<{ rong?: number; cao?: number } | null>(null)
  // `cuoi`: vị trí / cỡ tính ở lần di chuột gần nhất — lúc thả có thể chưa kịp vẽ lại (kéo nhanh), nên không đọc từ state.
  const keoRef = useRef<{ px: number; py: number; x: number; y: number; hop?: HopBatDau; cuoi?: { x: number; y: number } } | null>(null)
  const resizeRef = useRef<{
    huong: string
    px: number
    py: number
    rong: number
    cao: number
    x: number
    y: number
    hop?: HopBatDau
    cuoi?: { rong: number; cao: number; x: number; y: number }
  } | null>(null)

  // Rời chế độ cửa sổ nổi thì bỏ vị trí và kích thước đã kéo.
  useEffect(() => {
    if (vaiTro !== 'pip') {
      setDich({ x: 0, y: 0 })
      setKichThuoc(null)
    }
  }, [vaiTro])

  const goc = GOC_CUA_SO[Math.max(0, viTri) % GOC_CUA_SO.length]
  // Có khung đồng bộ thì đặt theo mép trái / trên (phần trăm sân khấu) thay vì bám góc.
  const isRightAnchor = !khung && goc.includes('right-')
  const isBottomAnchor = !khung && goc.includes('bottom-')

  // Thả chuột: quy vị trí + cỡ hiện tại ra tỉ lệ sân khấu rồi báo lên (bỏ độ dời tạm thời).
  const ghiKhung = () => {
    const el = ref.current
    const cha = el?.parentElement
    if (!onDoiKhung || !el || !cha) return
    const a = el.getBoundingClientRect()
    const b = cha.getBoundingClientRect()
    if (b.width <= 0 || b.height <= 0) return
    onDoiKhung(kepKhung({ x: (a.left - b.left) / b.width, y: (a.top - b.top) / b.height, w: a.width / b.width, h: a.height / b.height }))
    setDich({ x: 0, y: 0 })
    setKichThuoc(null)
  }

  const lop =
    vaiTro === 'main'
      ? 'absolute inset-0 z-0'
      : vaiTro === 'pip'
        ? `group/khung absolute z-30 ${khung ? '' : goc} ${khoa && khung ? 'transition-[left,top,width,height] duration-100 ease-linear' : ''} ${kichThuoc?.rong || khung ? '' : 'aspect-video w-[min(46%,440px)]'} min-w-[180px] rounded-xl border border-border-default shadow-2xl shadow-black/60`
        : 'pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0'

  // Kéo cửa sổ nổi bằng thanh tiêu đề (phần tử có data-keo-khung, trừ nút / ô nhập).
  const batDauKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    if (khoa || vaiTro !== 'pip' || resizeRef.current) return
    const dich0 = e.target as HTMLElement
    if (!dich0.closest('[data-keo-khung]') || dich0.closest('button, input, select, a, [role="slider"]')) return
    keoRef.current = { px: e.clientX, py: e.clientY, x: dich.x, y: dich.y, hop: hopBatDau(ref.current) }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }

  const dangKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    const keo = keoRef.current
    const el = ref.current
    const cha = el?.parentElement
    if (!keo || !el || !cha) return
    const khung = el.getBoundingClientRect()
    const vien = cha.getBoundingClientRect()
    let x = keo.x + (e.clientX - keo.px)
    let y = keo.y + (e.clientY - keo.py)
    // Giữ cửa sổ trong sân khấu.
    const trai = khung.left + (x - dich.x)
    const tren = khung.top + (y - dich.y)
    if (trai < vien.left + 4) x += vien.left + 4 - trai
    if (trai + khung.width > vien.right - 4) x -= trai + khung.width - (vien.right - 4)
    if (tren < vien.top + 4) y += vien.top + 4 - tren
    if (tren + khung.height > vien.bottom - 4) y -= tren + khung.height - (vien.bottom - 4)
    keo.cuoi = { x, y }
    setDich({ x, y })
    if (onKeoKhung && keo.hop) {
      onKeoKhung(khungTuHop(keo.hop, keo.hop.trai + (x - keo.x), keo.hop.tren + (y - keo.y), keo.hop.rong, keo.hop.cao))
    }
  }

  const thaKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    const keo = keoRef.current
    if (!keo) return
    keoRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    const cuoi = keo.cuoi
    if (!cuoi || (cuoi.x === keo.x && cuoi.y === keo.y) || !onDoiKhung) return
    // Vẽ ngay vị trí cuối rồi mới đo (lần di chuột cuối có thể chưa kịp vẽ).
    flushSync(() => setDich(cuoi))
    ghiKhung()
  }

  // Kéo to thu nhỏ ở các cạnh và góc cửa sổ
  const batDauThayDoiKichThuoc = (e: React.PointerEvent, huong: string) => {
    e.stopPropagation()
    e.preventDefault()
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    resizeRef.current = {
      huong,
      px: e.clientX,
      py: e.clientY,
      rong: rect.width,
      cao: rect.height,
      x: dich.x,
      y: dich.y,
      hop: hopBatDau(el),
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
  }

  const dangThayDoiKichThuoc = (e: React.PointerEvent) => {
    const r = resizeRef.current
    const el = ref.current
    const cha = el?.parentElement
    if (!r || !el || !cha) return

    const dx = e.clientX - r.px
    const dy = e.clientY - r.py

    const vienCha = cha.getBoundingClientRect()
    const maxRong = Math.max(220, vienCha.width - 24)
    const maxCao = Math.max(140, vienCha.height - 24)

    let moiRong = r.rong
    let moiCao = r.cao
    let moiX = r.x
    let moiY = r.y

    // Chiều ngang
    if (r.huong.includes('e')) {
      moiRong = Math.min(maxRong, Math.max(180, r.rong + dx))
      if (isRightAnchor) {
        moiX = r.x + (moiRong - r.rong)
      }
    } else if (r.huong.includes('w')) {
      moiRong = Math.min(maxRong, Math.max(180, r.rong - dx))
      if (!isRightAnchor) {
        moiX = r.x + (r.rong - moiRong)
      }
    }

    // Chiều dọc
    if (r.huong.includes('s')) {
      moiCao = Math.min(maxCao, Math.max(120, r.cao + dy))
      if (isBottomAnchor) {
        moiY = r.y + (moiCao - r.cao)
      }
    } else if (r.huong.includes('n')) {
      moiCao = Math.min(maxCao, Math.max(120, r.cao - dy))
      if (!isBottomAnchor) {
        moiY = r.y + (r.cao - moiCao)
      }
    }

    r.cuoi = { rong: Math.round(moiRong), cao: Math.round(moiCao), x: Math.round(moiX), y: Math.round(moiY) }
    setKichThuoc({ rong: r.cuoi.rong, cao: r.cuoi.cao })
    setDich({ x: r.cuoi.x, y: r.cuoi.y })
    if (onKeoKhung && r.hop) {
      // Cửa sổ bám góc phải / dưới thì lớn thêm về bên trái / lên trên.
      const trai = r.hop.trai + (r.cuoi.x - r.x) - (isRightAnchor ? r.cuoi.rong - r.rong : 0)
      const tren = r.hop.tren + (r.cuoi.y - r.y) - (isBottomAnchor ? r.cuoi.cao - r.cao : 0)
      onKeoKhung(khungTuHop(r.hop, trai, tren, r.cuoi.rong, r.cuoi.cao))
    }
  }

  const thaThayDoiKichThuoc = (e: React.PointerEvent) => {
    const r = resizeRef.current
    if (!r) return
    resizeRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    const cuoi = r.cuoi
    if (!cuoi || !onDoiKhung) return
    flushSync(() => {
      setKichThuoc({ rong: cuoi.rong, cao: cuoi.cao })
      setDich({ x: cuoi.x, y: cuoi.y })
    })
    ghiKhung()
  }

  return (
    <div
      ref={ref}
      data-lop={id}
      data-vai-tro={vaiTro}
      data-testid={`stage-layer-${id}`}
      aria-hidden={vaiTro === 'an' || undefined}
      className={lop}
      style={
        vaiTro === 'pip'
          ? {
              ...(khung
                ? { left: `${khung.x * 100}%`, top: `${khung.y * 100}%`, width: `${khung.w * 100}%`, height: `${khung.h * 100}%` }
                : {}),
              transform: `translate(${dich.x}px, ${dich.y}px)`,
              ...(kichThuoc?.rong ? { width: `${kichThuoc.rong}px` } : {}),
              ...(kichThuoc?.cao ? { height: `${kichThuoc.cao}px` } : {}),
            }
          : undefined
      }
      onPointerDown={batDauKeo}
      onPointerMove={dangKeo}
      onPointerUp={thaKeo}
      onPointerCancel={thaKeo}
    >
      {/* Nội dung cắt theo góc bo ở lớp trong, để tay kéo đổi cỡ được phép thò ra ngoài mép cửa sổ. */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">{children}</div>

      {/* Tay kéo đổi cỡ ở 4 cạnh và 4 góc cửa sổ nổi (chỉ người trình chiếu) */}
      {vaiTro === 'pip' && !khoa && (
        <>
          {TAY_KEO_CANH.map(({ huong, lop, tieuDe }) => (
            <div
              key={huong}
              onPointerDown={(e) => batDauThayDoiKichThuoc(e, huong)}
              onPointerMove={dangThayDoiKichThuoc}
              onPointerUp={thaThayDoiKichThuoc}
              onPointerCancel={thaThayDoiKichThuoc}
              className={`group/tay absolute z-50 select-none touch-none ${lop}`}
              title={tieuDe}
              data-testid={`khung-${id}-keo-${huong}`}
            />
          ))}
          {TAY_KEO_GOC.map(({ huong, lop, chuL }) => (
            <div
              key={huong}
              onPointerDown={(e) => batDauThayDoiKichThuoc(e, huong)}
              onPointerMove={dangThayDoiKichThuoc}
              onPointerUp={thaThayDoiKichThuoc}
              onPointerCancel={thaThayDoiKichThuoc}
              className={`group/tay absolute z-50 size-7 select-none touch-none ${lop}`}
              title="Kéo đổi kích thước"
              data-testid={`khung-${id}-keo-${huong}`}
            >
              <span
                className={`pointer-events-none absolute size-4.5 border-brand/90 opacity-70 transition-opacity group-hover/khung:opacity-100 group-hover/tay:opacity-100 drop-shadow-md ${chuL}`}
              />
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export interface NutKhungProps {
  id: LopId
  vaiTro: VaiTroLop
  onPhongTo: () => void
  onThuNho: () => void
  onAn: () => void
  toanManHinh?: boolean
  onToanManHinh?: () => void
  /** Người tham gia chỉ xem: không có nút điều khiển khung nào (ẩn, mở, phóng to, thu nhỏ, toàn màn hình). */
  chiXem?: boolean
  onDoi?: () => void
  iconDoi?: typeof EyeOff
  tieuDeDoi?: string
  testIdDoi?: string
  onDong?: () => void
  tieuDeDong?: string
  testIdDong?: string
}

const nut =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary cursor-pointer'

/** Vùng điều khiển khung: đổi, phóng to / thu nhỏ, toàn màn hình, góc phải ngoài cùng là ẩn và đóng. */
export function NutKhung({
  id,
  vaiTro,
  onPhongTo,
  onThuNho,
  onAn,
  toanManHinh,
  onToanManHinh,
  chiXem = false,
  onDoi,
  iconDoi: IconDoi,
  tieuDeDoi = 'Đổi',
  testIdDoi,
  onDong,
  tieuDeDong = 'Đóng',
  testIdDong,
}: NutKhungProps) {
  if (chiXem) return null

  const nutToanManHinh = vaiTro === 'main' && onToanManHinh && (
    <button
      type="button"
      onClick={onToanManHinh}
      className={nut}
      title={toanManHinh ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      aria-label={toanManHinh ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      data-testid={`layer-${id}-fullscreen`}
    >
      {toanManHinh ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
    </button>
  )

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-testid={`layer-controls-${id}`}>
      {onDoi && IconDoi && (
        <button
          type="button"
          onClick={onDoi}
          className={nut}
          title={tieuDeDoi}
          aria-label={tieuDeDoi}
          data-testid={testIdDoi || `layer-${id}-change`}
        >
          <IconDoi className="h-3.5 w-3.5" />
        </button>
      )}

      {vaiTro === 'main' ? (
        <button type="button" onClick={onThuNho} className={nut} title="Thu nhỏ" aria-label="Thu nhỏ thành cửa sổ" data-testid={`layer-${id}-shrink`}>
          <PictureInPicture2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button type="button" onClick={onPhongTo} className={nut} title="Phóng to" aria-label="Phóng to" data-testid={`layer-${id}-enlarge`}>
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}

      {nutToanManHinh}

      <button type="button" onClick={onAn} className={nut} title="Ẩn" aria-label="Ẩn" data-testid={`layer-${id}-hide`}>
        <EyeOff className="h-3.5 w-3.5" />
      </button>

      {onDong && (
        <button
          type="button"
          onClick={onDong}
          className={`${nut} hover:text-red-400`}
          title={tieuDeDong}
          aria-label={tieuDeDong}
          data-testid={testIdDong || `layer-${id}-close`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
