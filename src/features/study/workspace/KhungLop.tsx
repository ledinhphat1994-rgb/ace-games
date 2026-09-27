// Khung cho một lớp trên sân khấu (Tài liệu / Bảng / Video) + nút điều khiển góc phải đầu khung.
// Đổi vai trò (chính ⇄ cửa sổ nổi ⇄ ẩn) chỉ đổi class: phần tử con giữ nguyên, video YouTube không bị tải lại.

import { EyeOff, Layers, Maximize, Maximize2, Minimize, PictureInPicture2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LopId, VaiTroLop } from './stage-layout'

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
  children: ReactNode
}

export function KhungLop({ id, vaiTro, viTri, children }: KhungLopProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [dich, setDich] = useState({ x: 0, y: 0 })
  const [kichThuoc, setKichThuoc] = useState<{ rong?: number; cao?: number } | null>(null)
  const keoRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const resizeRef = useRef<{
    huong: string
    px: number
    py: number
    rong: number
    cao: number
    x: number
    y: number
  } | null>(null)

  // Rời chế độ cửa sổ nổi thì bỏ vị trí và kích thước đã kéo.
  useEffect(() => {
    if (vaiTro !== 'pip') {
      setDich({ x: 0, y: 0 })
      setKichThuoc(null)
    }
  }, [vaiTro])

  const goc = GOC_CUA_SO[Math.max(0, viTri) % GOC_CUA_SO.length]
  const isRightAnchor = goc.includes('right-')
  const isBottomAnchor = goc.includes('bottom-')

  const lop =
    vaiTro === 'main'
      ? 'absolute inset-0 z-0'
      : vaiTro === 'phu'
        ? 'pointer-events-none absolute inset-0 z-20'
        : vaiTro === 'pip'
          ? `absolute z-30 ${goc} ${kichThuoc?.rong ? '' : 'aspect-video w-[min(46%,440px)]'} min-w-[180px] overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/60`
          : 'pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0'

  // Kéo cửa sổ nổi bằng thanh tiêu đề (phần tử có data-keo-khung, trừ nút / ô nhập).
  const batDauKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    if (vaiTro !== 'pip' || resizeRef.current) return
    const dich0 = e.target as HTMLElement
    if (!dich0.closest('[data-keo-khung]') || dich0.closest('button, input, select, a, [role="slider"]')) return
    keoRef.current = { px: e.clientX, py: e.clientY, x: dich.x, y: dich.y }
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
    setDich({ x, y })
  }

  const thaKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!keoRef.current) return
    keoRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
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

    setKichThuoc({ rong: Math.round(moiRong), cao: Math.round(moiCao) })
    setDich({ x: Math.round(moiX), y: Math.round(moiY) })
  }

  const thaThayDoiKichThuoc = (e: React.PointerEvent) => {
    if (!resizeRef.current) return
    resizeRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
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
      {vaiTro === 'pip' && (
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
}

const nut =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer'

/** Vùng điều khiển khung: phóng to / thu nhỏ / phủ / toàn màn hình / ẩn — chỉ biểu tượng. */
export function NutKhung({ id, vaiTro, onPhongTo, onThuNho, onAn, onPhu, coThePhu, toanManHinh, onToanManHinh }: NutKhungProps) {
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
      {vaiTro === 'main' && onToanManHinh && (
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
      )}
      <button type="button" onClick={onAn} className={nut} title="Ẩn" aria-label="Ẩn" data-testid={`layer-${id}-hide`}>
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
