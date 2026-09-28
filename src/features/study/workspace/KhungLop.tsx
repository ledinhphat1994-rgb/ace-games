// Khung cho một lớp trên sân khấu (Tài liệu / Bảng / Video) + nút điều khiển góc phải đầu khung.
// Đổi vai trò (chính ⇄ cửa sổ nổi ⇄ ẩn) chỉ đổi class: phần tử con giữ nguyên, video YouTube không bị tải lại.

import { EyeOff, Layers, Maximize, Maximize2, Minimize, PictureInPicture2 } from 'lucide-react'
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
      : vaiTro === 'phu'
        ? 'pointer-events-none absolute inset-0 z-20'
        : vaiTro === 'pip'
          ? `absolute z-30 ${khung ? '' : goc} ${khoa && khung ? 'transition-[left,top,width,height] duration-100 ease-linear' : ''} ${kichThuoc?.rong || khung ? '' : 'aspect-video w-[min(46%,440px)]'} min-w-[180px] overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/60`
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
      {children}

      {/* 8 Điểm kéo to thu nhỏ ở các cạnh và góc của cửa sổ nổi */}
      {vaiTro === 'pip' && !khoa && (
        <>
          {/* Cạnh trên */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'n')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -top-1.5 left-3 right-3 h-3 cursor-ns-resize z-50 select-none touch-none hover:bg-brand/20 transition-colors rounded"
            title="Kéo thay đổi chiều cao"
          />
          {/* Cạnh dưới */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 's')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -bottom-1.5 left-3 right-3 h-3 cursor-ns-resize z-50 select-none touch-none hover:bg-brand/20 transition-colors rounded"
            title="Kéo thay đổi chiều cao"
          />
          {/* Cạnh trái */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'w')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute top-3 bottom-3 -left-1.5 w-3 cursor-ew-resize z-50 select-none touch-none hover:bg-brand/20 transition-colors rounded"
            title="Kéo thay đổi chiều rộng"
          />
          {/* Cạnh phải */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'e')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute top-3 bottom-3 -right-1.5 w-3 cursor-ew-resize z-50 select-none touch-none hover:bg-brand/20 transition-colors rounded"
            title="Kéo thay đổi chiều rộng"
          />
          {/* Góc trên - trái */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'nw')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -top-1.5 -left-1.5 size-4 cursor-nwse-resize z-50 select-none touch-none hover:bg-brand/30 transition-colors rounded-sm"
          />
          {/* Góc trên - phải */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'ne')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -top-1.5 -right-1.5 size-4 cursor-nesw-resize z-50 select-none touch-none hover:bg-brand/30 transition-colors rounded-sm"
          />
          {/* Góc dưới - trái */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'sw')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -bottom-1.5 -left-1.5 size-4 cursor-nesw-resize z-50 select-none touch-none hover:bg-brand/30 transition-colors rounded-sm"
          />
          {/* Góc dưới - phải */}
          <div
            onPointerDown={(e) => batDauThayDoiKichThuoc(e, 'se')}
            onPointerMove={dangThayDoiKichThuoc}
            onPointerUp={thaThayDoiKichThuoc}
            onPointerCancel={thaThayDoiKichThuoc}
            className="absolute -bottom-1.5 -right-1.5 size-4 cursor-nwse-resize z-50 select-none touch-none hover:bg-brand/30 transition-colors rounded-sm"
          />
        </>
      )}
    </div>
  )
}

interface NutKhungProps {
  id: LopId
  vaiTro: VaiTroLop
  onPhongTo: () => void
  onThuNho: () => void
  onAn: () => void
  /** Chỉ bảng: phủ trong suốt lên lớp chính ⇄ cửa sổ. */
  onPhu?: () => void
  coThePhu?: boolean
  toanManHinh?: boolean
  onToanManHinh?: () => void
  /** Người tham gia chỉ xem: không có nút điều khiển khung nào (ẩn, mở, phóng to, thu nhỏ, phủ, toàn màn hình). */
  chiXem?: boolean
}

const nut =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer'

/** Vùng điều khiển khung: phóng to / thu nhỏ / phủ / toàn màn hình / ẩn — chỉ biểu tượng. */
export function NutKhung({
  id,
  vaiTro,
  onPhongTo,
  onThuNho,
  onAn,
  onPhu,
  coThePhu,
  toanManHinh,
  onToanManHinh,
  chiXem = false,
}: NutKhungProps) {
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
  if (chiXem) return null
  return (
    <div className="flex shrink-0 items-center gap-0.5" data-testid={`layer-controls-${id}`}>
      {vaiTro === 'main' ? (
        <button type="button" onClick={onThuNho} className={nut} title="Thu nhỏ" aria-label="Thu nhỏ thành cửa sổ" data-testid={`layer-${id}-shrink`}>
          <PictureInPicture2 className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button type="button" onClick={onPhongTo} className={nut} title="Phóng to" aria-label="Phóng to" data-testid={`layer-${id}-enlarge`}>
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
      {onPhu && (vaiTro === 'pip' || vaiTro === 'phu') && (
        <button
          type="button"
          onClick={onPhu}
          disabled={vaiTro === 'pip' && !coThePhu}
          className={`${nut} disabled:opacity-30 disabled:cursor-not-allowed ${vaiTro === 'phu' ? 'bg-emerald-500/20 text-emerald-300' : ''}`}
          title={vaiTro === 'phu' ? 'Thành cửa sổ' : 'Phủ lên'}
          aria-label={vaiTro === 'phu' ? 'Thành cửa sổ' : 'Phủ lên nội dung chính'}
          aria-pressed={vaiTro === 'phu'}
          data-testid={`layer-${id}-overlay`}
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
      )}
      {nutToanManHinh}
      <button type="button" onClick={onAn} className={nut} title="Ẩn" aria-label="Ẩn" data-testid={`layer-${id}-hide`}>
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
