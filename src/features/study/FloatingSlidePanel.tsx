import { Button } from '@/components/ui/button'
import type { SlideState } from '@shared/protocol/room'
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, GripHorizontal, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Build the correct iframe src depending on the URL type */
function buildIframeSrc(docUrl: string, fileType: 'pptx' | 'pdf' | 'image'): string {
  // Google Slides — convert any share variant to embed
  if (docUrl.includes('docs.google.com/presentation')) {
    return docUrl.replace(/\/(edit|pub|preview)(\?.*)?$/, '/embed').replace(/(embed)(\?.*)?$/, 'embed')
  }
  // Already a viewer URL — pass through as-is
  if (docUrl.includes('docs.google.com/viewer') || docUrl.includes('view.officeapps.live.com')) {
    return docUrl
  }
  // Local blob / data URI
  if (docUrl.startsWith('blob:') || docUrl.startsWith('data:')) return docUrl
  // PDF → Google Docs viewer
  if (fileType === 'pdf' || docUrl.toLowerCase().endsWith('.pdf')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`
  }
  // Raw PPTX / DOCX / XLSX
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(docUrl)}`
}

type Corner = 'nw' | 'ne' | 'sw' | 'se'

const CORNER_CURSORS: Record<Corner, string> = {
  nw: 'nwse-resize', ne: 'nesw-resize',
  sw: 'nesw-resize', se: 'nwse-resize',
}

const CORNER_POS: Record<Corner, string> = {
  nw: 'top-0 left-0',
  ne: 'top-0 right-0',
  sw: 'bottom-0 left-0',
  se: 'bottom-0 right-0',
}

interface Interaction {
  type: 'drag' | 'resize'
  corner?: Corner
  startMouseX: number
  startMouseY: number
  startX: number
  startY: number
  startW: number
  startH: number
}

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
  const [size, setSize] = useState({ w: 640, h: 430 })
  const [isMinimized, setIsMinimized] = useState(false)

  const interRef = useRef<Interaction | null>(null)

  // Single always-mounted effect — no dependency on state booleans
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const ref = interRef.current
      if (!ref) return
      const dx = e.clientX - ref.startMouseX
      const dy = e.clientY - ref.startMouseY
      if (ref.type === 'drag') {
        setPosition({
          x: Math.max(0, ref.startX + dx),
          y: Math.max(0, ref.startY + dy),
        })
      } else if (ref.type === 'resize' && ref.corner) {
        const c = ref.corner
        let newW = ref.startW, newH = ref.startH
        let newX = ref.startX, newY = ref.startY
        if (c.includes('e')) newW = Math.max(320, ref.startW + dx)
        if (c.includes('w')) {
          newW = Math.max(320, ref.startW - dx)
          newX = Math.max(0, ref.startX + Math.min(dx, ref.startW - 320))
        }
        if (c.includes('s')) newH = Math.max(220, ref.startH + dy)
        if (c.includes('n')) {
          newH = Math.max(220, ref.startH - dy)
          newY = Math.max(0, ref.startY + Math.min(dy, ref.startH - 220))
        }
        setSize({ w: newW, h: newH })
        setPosition({ x: newX, y: newY })
      }
    }
    const up = () => { interRef.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  const startDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    onFocus()
    interRef.current = {
      type: 'drag',
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: position.x, startY: position.y,
      startW: size.w, startH: size.h,
    }
  }

  const startResize = (corner: Corner, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    onFocus()
    interRef.current = {
      type: 'resize', corner,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: position.x, startY: position.y,
      startW: size.w, startH: size.h,
    }
  }

  const TITLE_H = 36
  const FOOTER_H = 36
  const bodyH = Math.max(140, size.h - TITLE_H - FOOTER_H)

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        style={{ left: position.x, top: position.y, zIndex }}
        className="absolute flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#0d1424]/95 px-3 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-orange-500/20 cursor-move select-none"
        onMouseDown={startDrag}
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
        <button
          onClick={(e) => { e.stopPropagation(); setIsMinimized(false) }}
          className="rounded p-0.5 text-slate-400 hover:text-white"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="rounded p-0.5 text-slate-400 hover:text-red-400"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <div
      style={{ left: position.x, top: position.y, width: size.w, height: size.h, zIndex }}
      className="absolute flex flex-col overflow-hidden rounded-2xl border border-orange-500/25 bg-[#0a0f18]/97 shadow-2xl backdrop-blur-2xl ring-1 ring-orange-500/15 select-none"
      onClick={onFocus}
    >
      {/* ── Title bar ── */}
      <div
        onMouseDown={startDrag}
        className="flex shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3"
        style={{ height: TITLE_H }}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <FileText className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="truncate text-xs font-semibold text-slate-200">
            {slideState.docName || 'Bài giảng'}
          </span>
          {isHost && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 shrink-0">
              Chủ tọa
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] font-mono text-slate-600 select-none">
            {size.w}×{size.h}
          </span>
          <button
            onClick={() => setIsMinimized(true)}
            className="ml-1 rounded p-1 text-slate-400 hover:text-white transition-colors"
            title="Thu nhỏ"
          >
            <Minimize2 className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Đóng"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Slide body ── */}
      <div
        className="relative bg-[#060b12] overflow-hidden flex items-center justify-center"
        style={{ height: bodyH }}
      >
        {slideState.fileType === 'image' ? (
          <img
            src={slideState.docUrl}
            alt={slideState.docName}
            className="max-h-full max-w-full object-contain"
          />
        ) : slideState.docUrl && slideState.docUrl !== 'local_presentation' ? (
          <iframe
            src={buildIframeSrc(slideState.docUrl, slideState.fileType)}
            title="Slide Viewer"
            className="h-full w-full border-0 bg-white"
            allow="fullscreen"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileSpreadsheet className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">{slideState.docName}</p>
            <p className="text-xs text-slate-400 mt-1">Trang {slideState.currentPage}</p>
          </div>
        )}

        {/* Corner resize handles */}
        {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((corner) => (
          <div
            key={corner}
            onMouseDown={(e) => startResize(corner, e)}
            style={{ cursor: CORNER_CURSORS[corner] }}
            className={`absolute z-20 h-5 w-5 ${CORNER_POS[corner]}`}
          />
        ))}
      </div>

      {/* ── Navigation footer ── */}
      <div
        className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0c1420]/90 px-3"
        style={{ height: FOOTER_H }}
      >
        <Button
          variant="ghost" size="sm"
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
          variant="ghost" size="sm"
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
