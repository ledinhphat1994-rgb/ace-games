// src/features/study/workspace/SlideAnnotationLayer.tsx
// Digital Campus v2: Milestone PQA-C3 — PDF/Slide Annotation Layer & Laser Pointer
// Toạ độ chuẩn hoá [0..1] theo trang; công cụ lấy từ bộ "Công cụ" chung của sân khấu.

import type { SlideAnnotationStroke } from '@shared/protocol/room'
import { getStroke } from 'perfect-freehand'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { TiaLaserTrang } from '@/hooks/use-room'
import { type AnnotationTool, downsampleStrokePoints, hitTestStrokes } from './annotation-geometry'
import { DO_MO_TO_SANG, diemHinh, doDayNet, hopGioiHanNet, netDuocCham, type CoVe, type LoaiHinh } from './cong-cu'
import { LopTiaLaser } from './LopLaserTrinhChieu'

export type { AnnotationTool }

interface SlideAnnotationLayerProps {
  pageNumber: number
  strokes: SlideAnnotationStroke[]
  activeTool: AnnotationTool
  /** Kiểu hình khi công cụ là Hình. */
  hinh?: LoaiHinh
  selectedColor: string
  selectedSize?: CoVe
  /** Dùng được công cụ đang chọn (người trình chiếu, hoặc người tham gia được cấp đúng quyền). */
  canAnnotate: boolean
  onSendStroke?: (stroke: SlideAnnotationStroke) => void
  onRemoveStroke?: (strokeId: string) => void
  /** Kéo nền/hình ảnh khi dùng công cụ Di chuyển */
  onPanBackground?: (dx: number, dy: number, isDone: boolean) => void
  /** Tia laser của người khác đang trỏ trên tài liệu (lọc theo trang ở đây). */
  lasers?: TiaLaserTrang[]
  onSendLaser?: (point: [number, number] | null, page: number) => void
  /** Được dùng laser (người trình chiếu, hoặc được cấp quyền laser). */
  coLaser?: boolean
  /** Tẩy được nét của người khác (chỉ người trình chiếu); người tham gia chỉ tẩy nét của mình. */
  coTheTayMoiNet?: boolean
  khoaCuaToi?: string
  /** URL tài liệu hiện hành để phân định nét vẽ theo từng tab tài liệu. */
  docUrl?: string
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
  lasers = [],
  onSendLaser,
  coLaser = false,
  coTheTayMoiNet = true,
  khoaCuaToi,
  onPanBackground,
  docUrl,
}: SlideAnnotationLayerProps) {
  const isDrawingRef = useRef(false)
  const isErasingRef = useRef(false)
  const currentPointsRef = useRef<[number, number][]>([])
  const [activePoints, setActivePoints] = useState<[number, number][]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const khungRef = useRef<HTMLDivElement>(null)
  const [coKhung, setCoKhung] = useState({ rong: 1, cao: 1 })

  const dangKeoRef = useRef(false)
  const dangKeoNenRef = useRef(false)
  const diemBatDauNenRef = useRef<{ x: number; y: number } | null>(null)
  const keoNetRef = useRef<SlideAnnotationStroke | null>(null)
  const diemBatDauRef = useRef<[number, number] | null>(null)
  const diemGocNetRef = useRef<[number, number][]>([])
  const rafKeoRef = useRef<number | null>(null)
  const offsetKeoRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const [keoNetId, setKeoNetId] = useState<string | null>(null)
  const [keoOffset, setKeoOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [netDuocChon, setNetDuocChon] = useState<string | null>(null)

  // Ô gõ chữ: `diem` là toạ độ nét (0..1 theo trang), `left/top` là vị trí ô nhập (px trong khung trang, đã kẹp sát mép).
  const [oChu, setOChu] = useState<{ diem: [number, number]; left: number; top: number; coChuPx?: number } | null>(null)
  const [chuDangGo, setChuDangGo] = useState('')
  const oChuRef = useRef<HTMLTextAreaElement>(null)

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

  // Filter strokes for current page and active document
  const pageStrokes = strokes.filter(
    (s) => s.page === pageNumber && (!docUrl || !s.docUrl || s.docUrl === docUrl),
  )
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
    // Người tham gia chỉ tẩy nét của mình (máy chủ cũng chặn).
    const coTheTay = coTheTayMoiNet ? pageStrokes : pageStrokes.filter((s) => khoaCuaToi && s.by === khoaCuaToi)
    const hitId = hitTestStrokes(pt, coTheTay, 0.03, tiLeNgang)
    if (hitId) {
      onRemoveStroke?.(hitId)
    }
  }

  const guiChu = () => {
    const noiDung = chuDangGo.trimEnd().slice(0, 500)
    if (oChu && noiDung.trim() && onSendStroke) {
      onSendStroke({
        id: `slide_chu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        page: pageNumber,
        tool: 'text',
        points: [oChu.diem],
        color: selectedColor,
        size: coTheoCongCu('text', selectedSize),
        text: noiDung,
        ...(docUrl ? { docUrl } : {}),
      })
    }
    setOChu(null)
    setChuDangGo('')
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!canAnnotate) return
    const pt = getNormalizedPoint(e)
    if (!pt) return

    if (activeTool === 'move') {
      const coTheDiChuyen = pageStrokes.filter(
        (s) => coTheTayMoiNet || (khoaCuaToi && s.by === khoaCuaToi) || !s.by,
      )
      const theoTrang = coTheDiChuyen.map((s) => (s.tool === 'text' ? { ...s, size: s.size / 1000 } : s))
      let hit: (typeof theoTrang)[number] | null = null
      if (netDuocChon) {
        const daChon = theoTrang.find((s) => s.id === netDuocChon)
        if (daChon) {
          const hop = hopGioiHanNet(daChon, tiLeNgang)
          if (hop) {
            const padX = 12 / (1000 * (tiLeNgang || 1))
            const padY = 12 / 1000
            if (
              pt[0] >= hop.minX - padX &&
              pt[0] <= hop.maxX + padX &&
              pt[1] >= hop.minY - padY &&
              pt[1] <= hop.maxY + padY
            ) {
              hit = daChon
            }
          }
        }
      }
      if (!hit) {
        hit = netDuocCham(pt, theoTrang, 0.04, tiLeNgang, true, true)
      }
      if (hit) {
        dangKeoRef.current = true
        // Giữ nét gốc để không làm biến đổi size hay các trường ban đầu
        const strokeGoc = pageStrokes.find((s) => s.id === hit.id) || hit
        keoNetRef.current = strokeGoc
        diemBatDauRef.current = pt
        diemGocNetRef.current = strokeGoc.points.map(([x, y]) => [x, y])
        setKeoNetId(hit.id)
        setNetDuocChon(hit.id)
        setKeoOffset({ dx: 0, dy: 0 })
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
      } else {
        setNetDuocChon(null)
        setKeoNetId(null)
        setKeoOffset(null)
        // Khi bấm vào vùng không có nét: cho phép kéo di chuyển nền / hình ảnh
        if (onPanBackground) {
          e.preventDefault()
          dangKeoNenRef.current = true
          diemBatDauNenRef.current = { x: e.clientX, y: e.clientY }
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {}
        }
      }
      return
    }

    if (activeTool === 'text') {
      // Chặn hành vi mặc định: sau pointerdown trình duyệt dời tiêu điểm về trang, làm ô chữ vừa mở tự đóng ngay.
      e.preventDefault()
      if (oChu) guiChu()
      const khung = khungRef.current?.getBoundingClientRect()
      if (khung) {
        const coChuTrang = coTheoCongCu('text', selectedSize ?? 1)
        const coChuPx = Math.max(12, Math.round(((coChuTrang / 1000) * coKhung.cao) * 10) / 10)
        setOChu({
          diem: pt,
          left: Math.max(0, Math.min(e.clientX - khung.left, khung.width - 200)),
          top: Math.max(0, Math.min(e.clientY - khung.top, khung.height - (coChuPx * 2 + 24))),
          coChuPx,
        })
      }
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

    if (activeTool === 'move') {
      if (dangKeoRef.current && diemBatDauRef.current && keoNetRef.current) {
        const pt = getNormalizedPoint(e)
        if (!pt) return
        const dx = pt[0] - diemBatDauRef.current[0]
        const dy = pt[1] - diemBatDauRef.current[1]
        offsetKeoRef.current = { dx, dy }
        if (!rafKeoRef.current) {
          rafKeoRef.current = requestAnimationFrame(() => {
            rafKeoRef.current = null
            setKeoOffset({ dx, dy })
          })
        }
      } else if (dangKeoNenRef.current && diemBatDauNenRef.current && onPanBackground) {
        const dx = e.clientX - diemBatDauNenRef.current.x
        const dy = e.clientY - diemBatDauNenRef.current.y
        onPanBackground(dx, dy, false)
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
    if (activeTool === 'move') {
      if (dangKeoNenRef.current && diemBatDauNenRef.current && onPanBackground) {
        const dx = e.clientX - diemBatDauNenRef.current.x
        const dy = e.clientY - diemBatDauNenRef.current.y
        dangKeoNenRef.current = false
        diemBatDauNenRef.current = null
        onPanBackground(dx, dy, true)
        try {
          e.currentTarget.releasePointerCapture(e.pointerId)
        } catch {}
        return
      }
      if (rafKeoRef.current !== null) {
        cancelAnimationFrame(rafKeoRef.current)
        rafKeoRef.current = null
      }
      const finalOffset = offsetKeoRef.current
      if (dangKeoRef.current && keoNetRef.current && diemGocNetRef.current.length) {
        const { dx, dy } = finalOffset
        if (Math.hypot(dx, dy) >= 0.005) {
          const newPoints: [number, number][] = diemGocNetRef.current.map(([x, y]) => [
            Math.max(0, Math.min(1, Math.round((x + dx) * 10000) / 10000)),
            Math.max(0, Math.min(1, Math.round((y + dy) * 10000) / 10000)),
          ])
          onSendStroke?.({
            ...keoNetRef.current,
            points: newPoints,
            ...(docUrl ? { docUrl } : {}),
          })
        }
      }
      dangKeoRef.current = false
      keoNetRef.current = null
      diemBatDauRef.current = null
      offsetKeoRef.current = { dx: 0, dy: 0 }
      setKeoNetId(null)
      setKeoOffset(null)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
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
        ...(docUrl ? { docUrl } : {}),
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
        ...(docUrl ? { docUrl } : {}),
      })
    }
  }

  // Laser do lớp tia riêng (bên dưới) nhận chuột: mượt, không đi qua mặt vẽ.
  const isInteractive = canAnnotate && activeTool !== 'pointer' && activeTool !== 'laser'

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
        className={`absolute inset-0 h-full w-full touch-none ${
          isInteractive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
        }`}
        style={{
          cursor:
            activeTool === 'text'
              ? 'text'
              : activeTool === 'move'
                ? (dangKeoRef.current || dangKeoNenRef.current)
                  ? 'grabbing'
                  : 'grab'
                : isInteractive
                  ? 'crosshair'
                  : 'default',
        }}
      >
        {/* Render committed strokes (chữ vẽ riêng bằng HTML bên dưới) */}
        {pageStrokes
          .filter((s) => s.tool !== 'text')
          .map((s) => {
            const laDangKeo = keoNetId === s.id && keoOffset !== null
            const dx = laDangKeo ? keoOffset.dx * 1000 : 0
            const dy = laDangKeo ? keoOffset.dy * 1000 : 0
            const laChon = activeTool === 'move' && (netDuocChon === s.id || keoNetId === s.id)
            const hop = laChon ? hopGioiHanNet(s, tiLeNgang) : null
            return (
              <g
                key={s.id}
                transform={laDangKeo ? `translate(${dx}, ${dy})` : undefined}
                filter={laDangKeo ? 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.45))' : undefined}
              >
                <NetTrang s={s} caoKhung={coKhung.cao} />
                {hop && (
                  <g className="pointer-events-none">
                    <rect
                      x={hop.minX * 1000 - 4}
                      y={hop.minY * 1000 - 4}
                      width={hop.width * 1000 + 8}
                      height={hop.height * 1000 + 8}
                      fill={laDangKeo ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.08)'}
                      stroke="#38bdf8"
                      strokeWidth={laDangKeo ? 2.5 : 2}
                      strokeDasharray={laDangKeo ? 'none' : '6 6'}
                      rx={4}
                    />
                  </g>
                )}
              </g>
            )
          })}

        {/* Render currently drawn active stroke */}
        {xemTruoc}

      </svg>

      {/* Tia laser theo trang: tia của mình vẽ tại máy, tia người khác trượt mượt tới vị trí mới. */}
      <LopTiaLaser
        dangChieu={coLaser && activeTool === 'laser'}
        tiaKhac={lasers.filter((t) => t.page === pageNumber)}
        onSend={onSendLaser ? (diem) => onSendLaser(diem, pageNumber) : undefined}
        testId="slide-laser"
      />

      {/* Chữ trên trang: HTML theo % vị trí, cỡ chữ theo chiều cao trang — không méo như chữ trong SVG co giãn */}
      {pageStrokes
        .filter((s) => s.tool === 'text' && s.text)
        .map((s) => {
          const dx = keoNetId === s.id && keoOffset ? keoOffset.dx : 0
          const dy = keoNetId === s.id && keoOffset ? keoOffset.dy : 0
          const posX = Math.max(0, Math.min(1, s.points[0][0] + dx)) * 100
          const posY = Math.max(0, Math.min(1, s.points[0][1] + dy)) * 100
          const laChon = activeTool === 'move' && (netDuocChon === s.id || keoNetId === s.id)
          return (
            <span
              key={s.id}
              className={`absolute whitespace-pre-wrap font-semibold leading-snug select-none ${
                laChon ? 'ring-2 ring-brand ring-offset-2 ring-offset-black/50 rounded-sm' : ''
              }`}
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                color: s.color,
                fontSize: (s.size / 1000) * coKhung.cao,
                lineHeight: 1.25,
              }}
            >
              {s.text}
            </span>
          )
        })}

      {oChu && (
        <textarea
          ref={oChuRef}
          value={chuDangGo}
          onChange={(e) => setChuDangGo(e.target.value)}
          onBlur={guiChu}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOChu(null)
              setChuDangGo('')
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              guiChu()
            }
          }}
          maxLength={500}
          rows={Math.max(1, chuDangGo.split(/\r?\n/).length)}
          aria-label="Nhập chữ lên tài liệu"
          className="pointer-events-auto absolute z-30 min-w-44 max-w-md resize-none rounded-md border border-slate-400 bg-surface-overlay px-2 py-1 font-semibold shadow-xl outline-none leading-snug"
          style={{
            left: oChu.left,
            top: oChu.top,
            color: selectedColor,
            fontSize: oChu.coChuPx ? `${oChu.coChuPx}px` : undefined,
            lineHeight: 1.25,
          }}
        />
      )}
    </div>
  )
}
