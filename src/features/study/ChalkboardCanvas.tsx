import { Button } from '@/components/ui/button'
import type { SlideState, WhiteboardStroke } from '@shared/protocol/room'
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileSpreadsheet,
  FileText,
  PenTool,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { getStroke } from 'perfect-freehand'
import { useEffect, useRef, useState } from 'react'

const CHALK_COLORS = [
  { name: 'Phấn trắng', color: '#FFFFFF' },
  { name: 'Phấn vàng', color: '#FEF08A' },
  { name: 'Phấn xanh', color: '#67E8F9' },
  { name: 'Phấn hồng', color: '#F472B6' },
  { name: 'Phấn lục', color: '#86EFAC' },
  { name: 'Dạ quang', color: '#FDBA74' },
]

const CHALK_SIZES = [
  { label: 'Nét thanh', size: 3 },
  { label: 'Nét vừa', size: 6 },
  { label: 'Phấn đậm', size: 12 },
  { label: 'Bút to', size: 20 },
]

interface ChalkboardCanvasProps {
  strokes: WhiteboardStroke[]
  slideState: SlideState | null
  isHost: boolean
  onSendStroke: (stroke: WhiteboardStroke) => void
  onClearWhiteboard: () => void
  onChangeSlidePage: (page: number) => void
  onCloseSlide: () => void
  onOpenUploadModal: () => void
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

export function ChalkboardCanvas({
  strokes,
  slideState,
  isHost,
  onSendStroke,
  onClearWhiteboard,
  onChangeSlidePage,
  onCloseSlide,
  onOpenUploadModal,
}: ChalkboardCanvasProps) {
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF')
  const [selectedSize, setSelectedSize] = useState<number>(6)
  const [isEraser, setIsEraser] = useState<boolean>(false)
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])

  // Slide frame positioning & zoom
  const [slideZoom, setSlideZoom] = useState<number>(100)
  const [slidePosition, setSlidePosition] = useState<{ x: number; y: number }>({ x: 30, y: 30 })
  const [isDraggingSlide, setIsDraggingSlide] = useState(false)
  const slideDragRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  })

  const svgRef = useRef<SVGSVGElement>(null)

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if ((e.target as HTMLElement).closest('.interactive-control')) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    setCurrentPoints([[x, y]])
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (currentPoints.length === 0) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    setCurrentPoints((prev) => [...prev, [x, y]])
  }

  const handlePointerUp = () => {
    if (currentPoints.length < 2) {
      setCurrentPoints([])
      return
    }

    const newStroke: WhiteboardStroke = {
      id: `str_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      points: currentPoints,
      color: isEraser ? '#0e1f18' : selectedColor,
      size: isEraser ? selectedSize * 3 : selectedSize,
    }

    onSendStroke(newStroke)
    setCurrentPoints([])
  }

  // Slide dragging handlers
  const handleSlideMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDraggingSlide(true)
    slideDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: slidePosition.x,
      startY: slidePosition.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlide) return
      const dx = e.clientX - slideDragRef.current.mouseX
      const dy = e.clientY - slideDragRef.current.mouseY
      setSlidePosition({
        x: Math.max(10, slideDragRef.current.startX + dx),
        y: Math.max(10, slideDragRef.current.startY + dy),
      })
    }
    const handleMouseUp = () => {
      if (isDraggingSlide) setIsDraggingSlide(false)
    }
    if (isDraggingSlide) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingSlide])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d1c16] select-none">
      {/* 1. Grid Pattern & Chalkboard Aesthetics */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 2. Floating Chalkboard Quick Bar at Top-Left of the board */}
      <div className="interactive-control absolute left-4 top-4 z-30 flex items-center gap-2 rounded-2xl border border-emerald-800/40 bg-[#091510]/95 p-1.5 shadow-2xl backdrop-blur-md ring-1 ring-emerald-500/20">
        <div className="flex items-center gap-1 pr-2 border-r border-emerald-800/40">
          <PenTool className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-200">Bảng Đen</span>
        </div>

        {/* Chalk Colors */}
        <div className="flex items-center gap-1">
          {CHALK_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => {
                setSelectedColor(c.color)
                setIsEraser(false)
              }}
              style={{ backgroundColor: c.color }}
              className={`h-5 w-5 rounded-full transition-transform ${
                !isEraser && selectedColor === c.color
                  ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#091510]'
                  : 'opacity-70 hover:opacity-100 hover:scale-110'
              }`}
              title={c.name}
            />
          ))}
        </div>

        {/* Chalk Sizes */}
        <div className="flex items-center gap-1 border-l border-emerald-800/40 pl-2">
          {CHALK_SIZES.map((s) => (
            <button
              key={s.size}
              onClick={() => {
                setSelectedSize(s.size)
                setIsEraser(false)
              }}
              className={`flex h-6 items-center justify-center rounded px-1.5 text-[10px] font-bold transition-colors ${
                !isEraser && selectedSize === s.size
                  ? 'bg-emerald-500 text-black font-extrabold'
                  : 'text-emerald-300 hover:bg-emerald-950/60'
              }`}
              title={s.label}
            >
              {s.size}px
            </button>
          ))}
        </div>

        {/* Eraser Tool */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEraser(!isEraser)}
          className={`h-7 px-2 text-xs font-semibold gap-1 border-l border-emerald-800/40 ${
            isEraser ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'
          }`}
          title="Tẩy phấn"
        >
          <Eraser className="h-3.5 w-3.5" />
          <span>Tẩy</span>
        </Button>

        {/* Clear All */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearWhiteboard}
          className="h-7 w-7 p-0 text-slate-400 hover:text-red-400"
          title="Xóa toàn bộ bảng đen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>

        {/* Upload PPTX / PDF Slide trigger */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenUploadModal}
          className="h-7 px-2.5 text-xs font-bold gap-1 bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 border border-cyan-500/40 rounded-lg ml-1"
          title="Chèn bài giảng PowerPoint (.pptx) hoặc PDF"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Chèn Slide / PDF</span>
        </Button>
      </div>

      {/* 3. Integrated Slide / PowerPoint Presentation Layer (If loaded) */}
      {slideState ? (
        <div
          style={{
            position: 'absolute',
            left: `${slidePosition.x}px`,
            top: `${slidePosition.y}px`,
            width: `${Math.round(620 * (slideZoom / 100))}px`,
            zIndex: 10,
          }}
          className="interactive-control flex flex-col overflow-hidden rounded-xl border border-white/20 bg-[#121b28]/95 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/30 transition-shadow"
        >
          {/* Slide Header with Drag Handle */}
          <div
            onMouseDown={handleSlideMouseDown}
            className="flex h-9 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="truncate text-xs font-bold text-slate-200">
                {slideState.docName || 'Bài giảng PowerPoint / PDF'}
              </span>
              <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                Trang {slideState.currentPage} / {slideState.totalPages}
              </span>
              {isHost ? (
                <span className="rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300">
                  Chủ tọa
                </span>
              ) : null}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSlideZoom((prev) => Math.max(60, prev - 15))}
                className="rounded p-1 text-slate-400 hover:text-white"
                title="Thu nhỏ slide"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-8 text-center">{slideZoom}%</span>
              <button
                onClick={() => setSlideZoom((prev) => Math.min(180, prev + 15))}
                className="rounded p-1 text-slate-400 hover:text-white"
                title="Phóng to slide"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                onClick={onCloseSlide}
                className="rounded p-1 text-slate-400 hover:text-red-400 ml-1"
                title="Đóng slide bài giảng"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Slide Body Frame */}
          <div className="relative aspect-[16/10] bg-[#090e17] overflow-hidden flex items-center justify-center p-2">
            {slideState.fileType === 'image' ? (
              <img
                src={slideState.docUrl}
                alt={slideState.docName}
                className="max-h-full max-w-full rounded object-contain"
              />
            ) : slideState.docUrl.startsWith('http') ? (
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                  slideState.docUrl
                )}`}
                title="Office Viewer"
                className="h-full w-full border-0 rounded bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileSpreadsheet className="h-12 w-12 text-cyan-400 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">{slideState.docName}</p>
                <p className="text-xs text-slate-400 mt-1">Đang hiển thị Slide trang {slideState.currentPage}</p>
              </div>
            )}
          </div>

          {/* Slide Navigation Footer (Synced with RoomDO) */}
          <div className="flex h-9 items-center justify-between border-t border-white/10 bg-[#0c1420]/90 px-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={slideState.currentPage <= 1}
              onClick={() => onChangeSlidePage(slideState.currentPage - 1)}
              className="h-6 px-2 text-xs font-semibold gap-1 text-slate-300 hover:text-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Trang trước</span>
            </Button>

            <span className="text-xs font-mono font-bold text-cyan-300">
              {slideState.currentPage} / {slideState.totalPages}
            </span>

            <Button
              variant="ghost"
              size="sm"
              disabled={slideState.currentPage >= slideState.totalPages}
              onClick={() => onChangeSlidePage(slideState.currentPage + 1)}
              className="h-6 px-2 text-xs font-semibold gap-1 text-slate-300 hover:text-white"
            >
              <span>Trang sau</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* 4. Interactive SVG Chalk Canvas Layer (Drawings overlay above or beside slides) */}
      <svg
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        style={{ zIndex: 20 }}
      >
        {/* Render all persistent chalk strokes */}
        {strokes.map((stroke) => {
          const outlinePoints = getStroke(stroke.points, {
            size: stroke.size,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          })
          const pathData = getSvgPathFromStroke(outlinePoints)
          return <path key={stroke.id} d={pathData} fill={stroke.color} opacity={0.92} />
        })}

        {/* Render current live drawing stroke */}
        {currentPoints.length > 1 ? (
          <path
            d={getSvgPathFromStroke(
              getStroke(currentPoints, {
                size: isEraser ? selectedSize * 3 : selectedSize,
                thinning: 0.5,
                smoothing: 0.5,
                streamline: 0.5,
              })
            )}
            fill={isEraser ? '#0e1f18' : selectedColor}
            opacity={0.92}
          />
        ) : null}
      </svg>
    </div>
  )
}
