import { Button } from '@/components/ui/button'
import type { SlideState } from '@shared/protocol/room'
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, GripHorizontal, Minimize2, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface FloatingSlidePanelProps {
  slideState: SlideState
  isHost: boolean
  zIndex: number
  onFocus: () => void
  onClose: () => void
  onChangeSlidePage: (page: number) => void
}

export function FloatingSlidePanel({
  slideState,
  isHost,
  zIndex,
  onFocus,
  onClose,
  onChangeSlidePage,
}: FloatingSlidePanelProps) {
  const [position, setPosition] = useState({ x: 340, y: 70 })
  const [isDragging, setIsDragging] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [zoom, setZoom] = useState(100)

  const dragRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onFocus()
    setIsDragging(true)
    dragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    }
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!isDragging) return
      setPosition({
        x: Math.max(0, dragRef.current.startX + e.clientX - dragRef.current.mouseX),
        y: Math.max(0, dragRef.current.startY + e.clientY - dragRef.current.mouseY),
      })
    }
    const up = () => { if (isDragging) setIsDragging(false) }
    if (isDragging) {
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', up)
    }
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [isDragging])

  const panelWidth = Math.round(640 * (zoom / 100))

  if (isMinimized) {
    return (
      <div
        style={{ left: position.x, top: position.y, zIndex }}
        className="absolute flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0d1424]/95 px-3 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-orange-500/20 cursor-move"
        onMouseDown={handleMouseDown}
        onClick={onFocus}
      >
        <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
        <FileText className="h-4 w-4 text-orange-400" />
        <span className="max-w-[160px] truncate text-xs font-semibold text-slate-200">
          {slideState.docName}
        </span>
        <span className="text-[10px] font-mono text-orange-300">
          {slideState.currentPage}/{slideState.totalPages}
        </span>
        <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false) }} className="rounded p-0.5 text-slate-400 hover:text-white">
          <ZoomIn className="h-3 w-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose() }} className="rounded p-0.5 text-slate-400 hover:text-red-400">
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ left: position.x, top: position.y, width: panelWidth, zIndex }}
      className="absolute flex flex-col overflow-hidden rounded-2xl border border-orange-500/25 bg-[#0a0f18]/97 shadow-2xl backdrop-blur-2xl ring-1 ring-orange-500/15"
      onClick={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex h-9 shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <FileText className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="truncate text-xs font-semibold text-slate-200">
            {slideState.docName || 'Bài giảng'}
          </span>
          {isHost ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
              Chủ tọa
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setZoom(z => Math.max(50, z - 15))} className="rounded p-1 text-slate-400 hover:text-white" title="Thu nhỏ">
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-[10px] font-mono text-slate-400">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 15))} className="rounded p-1 text-slate-400 hover:text-white" title="Phóng to">
            <ZoomIn className="h-3 w-3" />
          </button>
          <button onClick={() => setIsMinimized(true)} className="ml-1 rounded p-1 text-slate-400 hover:text-white" title="Thu nhỏ">
            <Minimize2 className="h-3 w-3" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-red-400" title="Đóng">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Slide body */}
      <div className="relative aspect-[16/10] bg-[#060b12] overflow-hidden flex items-center justify-center">
        {slideState.fileType === 'image' ? (
          <img
            src={slideState.docUrl}
            alt={slideState.docName}
            className="max-h-full max-w-full rounded object-contain"
          />
        ) : slideState.docUrl.startsWith('http') ? (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(slideState.docUrl)}`}
            title="Office Viewer"
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileSpreadsheet className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">{slideState.docName}</p>
            <p className="text-xs text-slate-400 mt-1">Trang {slideState.currentPage}</p>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex h-9 items-center justify-between border-t border-white/10 bg-[#0c1420]/90 px-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={slideState.currentPage <= 1}
          onClick={() => onChangeSlidePage(slideState.currentPage - 1)}
          className="h-6 px-2 text-xs gap-1 text-slate-300 hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Trang trước
        </Button>

        <span className="text-xs font-mono font-bold text-orange-300">
          {slideState.currentPage} / {slideState.totalPages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          disabled={slideState.currentPage >= slideState.totalPages}
          onClick={() => onChangeSlidePage(slideState.currentPage + 1)}
          className="h-6 px-2 text-xs gap-1 text-slate-300 hover:text-white"
        >
          Trang sau
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
