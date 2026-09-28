// src/features/study/workspace/SlideAnnotationLayer.tsx
// Digital Campus v2: Milestone PQA-C3 — PDF/Slide Annotation Layer & Laser Pointer
// Toạ độ chuẩn hoá [0..1] theo trang; công cụ lấy từ bộ "Công cụ" chung của sân khấu.

import type { SlideAnnotationStroke } from '@shared/protocol/room'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useRef, useState } from 'react'

import { type AnnotationTool, downsampleStrokePoints, hitTestStrokes } from './annotation-geometry'
import { DO_MO_TO_SANG, diemHinh, doDayNet, tayXoaDuoc, type CoVe, type LoaiHinh } from './cong-cu'

export type { AnnotationTool }

interface SlideAnnotationLayerProps {
  pageNumber: number
  strokes: SlideAnnotationStroke[]
  activeTool: AnnotationTool
  /** Kiểu hình khi công cụ là Hình. */
  hinh?: LoaiHinh
  selectedColor: string
  selectedSize?: CoVe
  canAnnotate: boolean
  onSendStroke?: (stroke: SlideAnnotationStroke) => void
  onRemoveStroke?: (strokeId: string) => void
  laser?: {
    point: [number, number] | null
    page: number
    senderName?: string
    updatedAt: number
  } | null
  onSendLaser?: (point: [number, number] | null, page: number) => void
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q'],
  )
  d.push('Z')
  return d.join(' ')
}

const CONG_CU_TAO_NET: ReadonlySet<AnnotationTool> = new Set(['pen', 'highlighter', 'shape'])
/** Đầu mũi tên tối đa (theo chiều cao trang). */
const DAU_MUI_TEN = 0.05

/** Công cụ của bộ chung → kích thước trên trang (đơn vị 1/1000 chiều cao trang). */
function coTheoCongCu(tool: AnnotationTool, co: CoVe): number {
  if (tool === 'highlighter') return doDayNet('trang', 'to_sang', co)
  if (tool === 'text') return doDayNet('trang', 'chu', co)
  return doDayNet('trang', 'but', co)
}

function NetTrang({
  s,
  caoKhung,
}: {
  s: Pick<SlideAnnotationStroke, 'tool' | 'points' | 'color' | 'size' | 'opacity'>
  caoKhung: number
}) {
  const diem = s.points.map(([px, py]) => [px * 1000, py * 1000])
  if (s.tool === 'shape') {
    // Viền đều theo pixel màn hình (khung SVG co giãn không đều khi trang không vuông).
    return (
      <polyline
        points={diem.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={s.color}
        strokeWidth={Math.max(1, (s.size / 1000) * caoKhung)}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    )
  }
  const laToSang = s.tool === 'highlighter'
  return (
    <path
      d={getSvgPathFromStroke(
        getStroke(diem, { size: s.size, thinning: laToSang ? 0 : 0.45, smoothing: 0.6, streamline: 0.5 }),
      )}
      fill={s.color}
      opacity={s.opacity ?? (laToSang ? DO_MO_TO_SANG : 1)}
      style={{ mixBlendMode: laToSang ? 'multiply' : 'normal' }}
    />
  )
}

export function SlideAnnotationLayer({
  pageNumber,
  strokes,
  activeTool,
  hinh = 'chu_nhat',
  selectedColor,
  selectedSize = 1,
  canAnnotate,
  onSendStroke,
  onRemoveStroke,
  laser,
  onSendLaser,
}: SlideAnnotationLayerProps) {
  const isDrawingRef = useRef(false)
  const isErasingRef = useRef(false)
  const currentPointsRef = useRef<[number, number][]>([])
  const [activePoints, setActivePoints] = useState<[number, number][]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const khungRef = useRef<HTMLDivElement>(null)
  const [coKhung, setCoKhung] = useState({ rong: 1, cao: 1 })
  const [oChu, setOChu] = useState<[number, number] | null>(null)
  const [chuDangGo, setChuDangGo] = useState('')
  const oChuRef = useRef<HTMLInputElement>(null)

  // Laser throttle ref
  const lastLaserSentAtRef = useRef(0)

  // Kích thước trang trên màn hình: chữ tính theo chiều cao trang để không méo khi trang không vuông.
  useEffect(() => {
    const el = khungRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([muc]) => {
      const { width, height } = muc.contentRect
      if (width > 0 && height > 0) setCoKhung({ rong: width, cao: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (oChu) oChuRef.current?.focus({ preventScroll: true })
  }, [oChu])

  // Ephemeral laser auto-fade (hide after 1.8s of inactivity)
  const [expiredLaserTime, setExpiredLaserTime] = useState<number | null>(null)
  useEffect(() => {
    if (laser?.point && laser.page === pageNumber) {
      const timer = setTimeout(() => {
        setExpiredLaserTime(laser.updatedAt)
      }, 1800)
      return () => clearTimeout(timer)
    }
  }, [laser, pageNumber])

  const laserVisible = Boolean(
    laser?.point &&
      laser.page === pageNumber &&
      expiredLaserTime !== laser.updatedAt,
  )

  // Filter strokes for current page
  const pageStrokes = strokes.filter((s) => s.page === pageNumber)
  const tiLeNgang = coKhung.rong / coKhung.cao

  // Get normalized [0..1] coordinates from mouse/pointer event relative to SVG
  const getNormalizedPoint = useCallback((e: React.PointerEvent<SVGSVGElement>): [number, number] | null => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0 || rect.height <= 0) return null
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    return [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]
  }, [])

  const eraseAt = (pt: [number, number]) => {
    const hitId = hitTestStrokes(pt, pageStrokes.filter(tayXoaDuoc), 0.03, tiLeNgang)
    if (hitId) {
      onRemoveStroke?.(hitId)
    }
  }

  const guiChu = () => {
    const noiDung = chuDangGo.trim().slice(0, 200)
    if (oChu && noiDung && onSendStroke) {
      onSendStroke({
        id: `slide_chu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        page: pageNumber,
        tool: 'text',
        points: [oChu],
        color: selectedColor,
        size: coTheoCongCu('text', selectedSize),
        text: noiDung,
      })
    }
    setOChu(null)
    setChuDangGo('')
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canAnnotate) return
    const pt = getNormalizedPoint(e)
    if (!pt) return

    if (activeTool === 'laser') {
      onSendLaser?.(pt, pageNumber)
      return
    }

    if (activeTool === 'text') {
      if (oChu) guiChu()
      setOChu(pt)
      return
    }

    if (activeTool === 'eraser') {
      eraseAt(pt)
      isErasingRef.current = true
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      return
    }

    if (CONG_CU_TAO_NET.has(activeTool)) {
      isDrawingRef.current = true
      currentPointsRef.current = [pt]
      setActivePoints([pt])
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canAnnotate) return

    if (activeTool === 'laser') {
      const now = Date.now()
      // Throttle laser broadcast to ~30fps (33ms)
      if (now - lastLaserSentAtRef.current > 33) {
        lastLaserSentAtRef.current = now
        const pt = getNormalizedPoint(e)
        if (pt) {
          onSendLaser?.(pt, pageNumber)
        }
      }
      return
    }

    if (activeTool === 'eraser') {
      if (isErasingRef.current) {
        const pt = getNormalizedPoint(e)
        if (pt) eraseAt(pt)
      }
      return
    }

    if (!isDrawingRef.current) return
    const pt = getNormalizedPoint(e)
    if (!pt) return

    if (activeTool === 'shape') {
      currentPointsRef.current = [currentPointsRef.current[0], pt]
    } else {
      currentPointsRef.current.push(pt)
    }
    setActivePoints([...currentPointsRef.current])
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTool === 'laser') {
      onSendLaser?.(null, pageNumber)
      return
    }

    if (activeTool === 'eraser') {
      isErasingRef.current = false
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
      return
    }

    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}

    const rawPts = currentPointsRef.current
    currentPointsRef.current = []
    setActivePoints([])
    if (!onSendStroke || rawPts.length < 2) return
    const id = `slide_str_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const strokeSize = coTheoCongCu(activeTool, selectedSize)

    if (activeTool === 'shape') {
      const [a, b] = [rawPts[0], rawPts[rawPts.length - 1]]
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.01) return
      onSendStroke({
        id,
        page: pageNumber,
        tool: 'shape',
        points: downsampleStrokePoints(diemHinh(hinh, a, b, tiLeNgang, DAU_MUI_TEN), 300),
        color: selectedColor,
        size: strokeSize,
      })
      return
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      onSendStroke({
        id,
        page: pageNumber,
        tool: activeTool,
        points: downsampleStrokePoints(rawPts, 300),
        color: selectedColor,
        size: strokeSize,
        opacity: activeTool === 'highlighter' ? DO_MO_TO_SANG : 1,
      })
    }
  }

  const handlePointerLeave = () => {
    if (activeTool === 'laser' && canAnnotate) {
      onSendLaser?.(null, pageNumber)
    }
  }

  const isInteractive = canAnnotate && activeTool !== 'pointer'

  let xemTruoc: React.ReactNode = null
  if (activePoints.length > 1) {
    const size = coTheoCongCu(activeTool, selectedSize)
    if (activeTool === 'shape') {
      const [a, b] = [activePoints[0], activePoints[activePoints.length - 1]]
      xemTruoc = (
        <NetTrang
          s={{ tool: 'shape', points: diemHinh(hinh, a, b, tiLeNgang, DAU_MUI_TEN), color: selectedColor, size }}
          caoKhung={coKhung.cao}
        />
      )
    } else if (activeTool === 'pen' || activeTool === 'highlighter') {
      xemTruoc = <NetTrang s={{ tool: activeTool, points: activePoints, color: selectedColor, size }} caoKhung={coKhung.cao} />
    }
  }

  return (
    <div
      ref={khungRef}
      className="absolute inset-0 h-full w-full pointer-events-none select-none z-10"
      data-testid="slide-annotation-layer"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`absolute inset-0 h-full w-full touch-none ${
          isInteractive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
        style={{
          cursor:
            activeTool === 'laser' ? 'none' : activeTool === 'text' ? 'text' : isInteractive ? 'crosshair' : 'default',
        }}
      >
        {/* Render committed strokes (chữ vẽ riêng bằng HTML bên dưới) */}
        {pageStrokes
          .filter((s) => s.tool !== 'text')
          .map((s) => (
            <NetTrang key={s.id} s={s} caoKhung={coKhung.cao} />
          ))}

        {/* Render currently drawn active stroke */}
        {xemTruoc}

        {/* Laser pointer dot on SVG coordinates */}
        {laserVisible && laser?.point && (
          <g transform={`translate(${laser.point[0] * 1000}, ${laser.point[1] * 1000})`} data-testid="slide-laser-pointer">
            {/* Outer pulsating ring */}
            <circle r="18" fill="#ef4444" opacity="0.3" className="animate-ping" />
            <circle r="12" fill="#ef4444" opacity="0.5" />
            {/* Core glowing dot */}
            <circle r="6" fill="#f87171" stroke="#ffffff" strokeWidth="1.5" />
            {/* Laser label tag */}
            {laser.senderName && (
              <g transform="translate(14, -14)">
                <rect
                  x="0"
                  y="0"
                  width={Math.max(60, laser.senderName.length * 8 + 14)}
                  height="20"
                  rx="6"
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="rgba(239, 68, 68, 0.6)"
                  strokeWidth="1"
                />
                <text
                  x="8"
                  y="14"
                  fill="#fecaca"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {laser.senderName}
                </text>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Chữ trên trang: HTML theo % vị trí, cỡ chữ theo chiều cao trang — không méo như chữ trong SVG co giãn */}
      {pageStrokes
        .filter((s) => s.tool === 'text' && s.text)
        .map((s) => (
          <span
            key={s.id}
            className="absolute whitespace-pre font-semibold leading-none"
            style={{
              left: `${s.points[0][0] * 100}%`,
              top: `${s.points[0][1] * 100}%`,
              color: s.color,
              fontSize: (s.size / 1000) * coKhung.cao,
            }}
          >
            {s.text}
          </span>
        ))}

      {oChu && (
        <input
          ref={oChuRef}
          value={chuDangGo}
          onChange={(e) => setChuDangGo(e.target.value)}
          onBlur={guiChu}
          onKeyDown={(e) => {
            if (e.key === 'Enter') guiChu()
            else if (e.key === 'Escape') {
              setOChu(null)
              setChuDangGo('')
            }
          }}
          maxLength={200}
          aria-label="Nhập chữ lên tài liệu"
          className="pointer-events-auto absolute z-10 min-w-40 rounded-md border border-slate-400 bg-white/90 px-2 py-1 text-sm font-semibold outline-none"
          style={{ left: `${oChu[0] * 100}%`, top: `${oChu[1] * 100}%`, color: selectedColor }}
        />
      )}
    </div>
  )
}
