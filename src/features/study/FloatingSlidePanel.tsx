import { Button } from '@/components/ui/button'
import type { SlideState } from '@shared/protocol/room'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  GripHorizontal,
  Maximize2,
  Minus,
  Pin,
  PinOff,
  RefreshCw,
  X,
} from 'lucide-react'
import { PdfCanvasViewer } from './PdfCanvasViewer'
import { useEffect, useRef, useState } from 'react'

function isGoogleSlidesUrl(url?: string): boolean {
  return typeof url === 'string' && url.includes('docs.google.com/presentation')
}

function PptxAdvisoryCard({ docName, docUrl }: { docName: string; docUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 max-w-md mx-auto space-y-3 select-auto">
      <div className="rounded-2xl bg-orange-500/10 p-4 ring-1 ring-orange-500/20">
        <FileSpreadsheet className="h-10 w-10 text-orange-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-100 break-all line-clamp-2 max-w-md" title={docName}>{docName}</h4>
        <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
          Tệp PowerPoint đã được lưu trữ an toàn trong phòng học
        </p>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-amber-300 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Chưa hỗ trợ trình chiếu trực tiếp PPTX
        </p>
        <p className="leading-relaxed">
          Để bảo mật dữ liệu phòng học, tài liệu chỉ được truy cập nội bộ bởi thành viên phòng.
          Bạn hãy <strong className="text-slate-200">xuất bài giảng sang định dạng PDF (.pdf)</strong> để trình chiếu và đồng bộ từng trang trực tiếp trên bảng học.
        </p>
      </div>
      {docUrl && (
        <a
          href={docUrl}
          download={docName}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Tải tệp .pptx về máy
        </a>
      )}
    </div>
  )
}

/** Build the correct iframe src depending on the URL type */
function buildIframeSrc(docUrl: string, fileType: 'pptx' | 'pdf' | 'image', useGoogleViewer = false): string {
  // Convert relative /api/files/... to absolute URL so cloud viewers can reach it
  let fullUrl = docUrl
  if (typeof window !== 'undefined' && docUrl.startsWith('/')) {
    fullUrl = `${window.location.origin}${docUrl}`
  }

  // Google Slides — convert any share variant to embed
  if (fullUrl.includes('docs.google.com/presentation')) {
    return fullUrl.replace(/\/(edit|pub|preview)(\?.*)?$/, '/embed').replace(/(embed)(\?.*)?$/, 'embed')
  }
  // Already an embedded viewer URL — pass through as-is
  if (fullUrl.includes('docs.google.com/viewer') || fullUrl.includes('view.officeapps.live.com')) {
    return fullUrl
  }
  // Local blob / data URI: only for direct image or pdf
  if (fullUrl.startsWith('blob:') || fullUrl.startsWith('data:')) {
    return fullUrl
  }
  // Forced Google Viewer or PDF fallback
  if (useGoogleViewer || fileType === 'pdf' || fullUrl.toLowerCase().endsWith('.pdf')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
  }
  // Raw PPTX / DOCX / XLSX -> Microsoft Office Live Viewer
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
}

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

const RESIZE_CURSORS: Record<ResizeDir, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

interface Interaction {
  type: 'drag' | 'resize'
  dir?: ResizeDir
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
  canModerate?: boolean
  zIndex: number
  onFocus: () => void
  onClose: () => void
  onChangeSlidePage: (page: number) => void
  onPin?: () => void
}

export function FloatingSlidePanel({
  slideState,
  isHost,
  canModerate,
  zIndex,
  onFocus,
  onClose,
  onChangeSlidePage,
  onPin,
}: FloatingSlidePanelProps) {
  const canControl = isHost || Boolean(canModerate)
  const [position, setPosition] = useState({ x: 340, y: 70 })
  const [size, setSize] = useState({ w: 640, h: 430 })
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [useGoogleViewer, setUseGoogleViewer] = useState(false)
  const [lastFailedDocUrl, setLastFailedDocUrl] = useState<string | null>(null)
  const hasRenderError = Boolean(lastFailedDocUrl && lastFailedDocUrl === slideState.docUrl)
  const [prevBounds, setPrevBounds] = useState<{ pos: { x: number; y: number }; size: { w: number; h: number } } | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [activeCursor, setActiveCursor] = useState<string>('default')

  const interRef = useRef<Interaction | null>(null)

  // Single always-mounted mouse listener on window
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
      } else if (ref.type === 'resize' && ref.dir) {
        const c = ref.dir
        let newW = ref.startW
        let newH = ref.startH
        let newX = ref.startX
        let newY = ref.startY
        if (c.includes('e')) newW = Math.max(340, ref.startW + dx)
        if (c.includes('w')) {
          newW = Math.max(340, ref.startW - dx)
          newX = Math.max(0, ref.startX + Math.min(dx, ref.startW - 340))
        }
        if (c.includes('s')) newH = Math.max(240, ref.startH + dy)
        if (c.includes('n')) {
          newH = Math.max(240, ref.startH - dy)
          newY = Math.max(0, ref.startY + Math.min(dy, ref.startH - 240))
        }
        setSize({ w: newW, h: newH })
        setPosition({ x: newX, y: newY })
      }
    }
    const up = () => {
      if (interRef.current) {
        interRef.current = null
        setIsInteracting(false)
      }
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  const startDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (isMaximized) return
    onFocus()
    setActiveCursor('move')
    setIsInteracting(true)
    interRef.current = {
      type: 'drag',
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.w,
      startH: size.h,
    }
  }

  const startResize = (dir: ResizeDir, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMaximized) return
    onFocus()
    setActiveCursor(RESIZE_CURSORS[dir])
    setIsInteracting(true)
    interRef.current = {
      type: 'resize',
      dir,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.w,
      startH: size.h,
    }
  }

  const toggleMaximize = () => {
    if (isMaximized) {
      if (prevBounds) {
        setPosition(prevBounds.pos)
        setSize(prevBounds.size)
      }
      setIsMaximized(false)
    } else {
      setPrevBounds({ pos: position, size })
      setPosition({ x: 16, y: 56 })
      setSize({
        w: Math.max(640, window.innerWidth - 32),
        h: Math.max(400, window.innerHeight - 128),
      })
      setIsMaximized(true)
    }
  }

  const TITLE_H = 38
  const FOOTER_H = 38
  const bodyH = Math.max(140, size.h - TITLE_H - FOOTER_H)

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div
        style={{ left: position.x, top: position.y, zIndex }}
        className="absolute flex items-center gap-2 rounded-full border border-orange-500/30 bg-[#1c1a14]/95 px-3 py-1.5 shadow-xl backdrop-blur-xl ring-1 ring-orange-500/20 cursor-move select-none"
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
          title="Mở rộng"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          className="rounded p-0.5 text-slate-400 hover:text-red-400"
          title="Đóng"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // ── Full panel ────────────────────────────────────────────────────────────
  return (
    <>
      {/* Global transparent overlay during drag/resize to prevent iframe from swallowing mouse events */}
      {isInteracting && (
        <div
          className="fixed inset-0 z-[99999] select-none"
          style={{ cursor: activeCursor }}
        />
      )}

      <div
        style={{ left: position.x, top: position.y, width: size.w, height: size.h, zIndex: isMaximized ? 999 : zIndex }}
        className="absolute flex flex-col rounded-2xl border border-orange-500/25 bg-[#0a0f18]/97 shadow-2xl backdrop-blur-2xl ring-1 ring-orange-500/15 select-none transition-shadow"
        onClick={onFocus}
      >
        {/* Inner container with rounded corners and overflow hidden */}
        <div className="flex flex-col h-full w-full overflow-hidden rounded-2xl">
          {/* ── Title bar ── */}
          <div
            onMouseDown={startDrag}
            className="flex shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
            style={{ height: TITLE_H }}
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <GripHorizontal className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <FileText className="h-4 w-4 text-orange-400 shrink-0" />
              <span className="truncate text-xs font-semibold text-slate-200">
                {slideState.docName || 'Bài giảng'}
              </span>
              {isHost ? (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 shrink-0">
                  Chủ tọa
                </span>
              ) : canModerate ? (
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300 shrink-0">
                  Điều hành
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[9px] font-mono text-slate-500 select-none mr-1">
                {size.w}×{size.h}
              </span>

              {/* Pin to blackboard background */}
              {onPin && (
                <button
                  onClick={onPin}
                  className="rounded p-1 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Ghim slide làm nền bảng vẽ (để viết vẽ trực tiếp lên slide)"
                >
                  <Pin className="h-3 w-3" />
                </button>
              )}

              {/* Switch viewer for web-based PPTX (e.g. Google Slides) */}
              {slideState.fileType === 'pptx' && isGoogleSlidesUrl(slideState.docUrl) && (
                <button
                  onClick={() => setUseGoogleViewer((v) => !v)}
                  className="rounded p-1 text-slate-400 hover:text-brand transition-colors"
                  title={useGoogleViewer ? 'Đang dùng Google Docs Viewer (bấm đổi Office Live)' : 'Đang dùng Office Live (bấm đổi Google Docs Viewer)'}
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}

              <button
                onClick={toggleMaximize}
                className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                title={isMaximized ? 'Thu về kích thước ban đầu' : 'Phóng to toàn màn hình'}
              >
                <Maximize2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                title="Thu nhỏ thành thanh nổi"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
                title={canControl ? 'Đóng trình chiếu cho cả phòng' : 'Ẩn cửa sổ trình chiếu'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ── Slide body ── */}
          <div
            className="relative bg-[#060b12] overflow-hidden flex items-center justify-center flex-1"
            style={{ height: bodyH }}
          >
            {hasRenderError ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <AlertTriangle className="h-8 w-8 text-amber-400 opacity-90" />
                <p className="text-xs font-semibold text-slate-200">Không thể tải tài liệu này</p>
                <p className="text-[11px] text-slate-500 max-w-[280px]">
                  Tài liệu có thể không tồn tại hoặc viewer từ chối hiển thị.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-white/20 text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      setLastFailedDocUrl(null)
                      setUseGoogleViewer((v) => !v)
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Thử lại / Đổi viewer
                  </Button>
                </div>
              </div>
            ) : slideState.fileType === 'pdf' ? (
              <PdfCanvasViewer
                docUrl={slideState.docUrl}
                pageNumber={slideState.currentPage}
                onError={() => setLastFailedDocUrl(slideState.docUrl)}
              />
            ) : slideState.fileType === 'image' ? (
              <img
                src={slideState.docUrl}
                alt={slideState.docName}
                onError={() => setLastFailedDocUrl(slideState.docUrl)}
                className="max-h-full max-w-full object-contain select-none"
                draggable={false}
              />
            ) : slideState.fileType === 'pptx' && !isGoogleSlidesUrl(slideState.docUrl) ? (
              <PptxAdvisoryCard docName={slideState.docName} docUrl={slideState.docUrl} />
            ) : slideState.docUrl && slideState.docUrl !== 'local_presentation' ? (
              <div className="relative h-full w-full">
                <div className="absolute top-2 left-2 z-10 rounded bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-[10px] font-semibold text-amber-200 backdrop-blur">
                  Chế độ xem ngoài (Chưa hỗ trợ đồng bộ từng trang PPTX)
                </div>
                <iframe
                  src={buildIframeSrc(slideState.docUrl, slideState.fileType, useGoogleViewer)}
                  title="Slide Viewer"
                  className={`h-full w-full border-0 bg-white ${isInteracting ? 'pointer-events-none' : ''}`}
                  allow="fullscreen"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <FileSpreadsheet className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">{slideState.docName}</p>
                <p className="text-xs text-slate-400 mt-1">Trang {slideState.currentPage}</p>
              </div>
            )}
          </div>

          {/* ── Navigation footer ── */}
          <div
            className="flex shrink-0 items-center justify-between border-t border-white/10 bg-[#0c1420]/90 px-3 select-none"
            style={{ height: FOOTER_H }}
          >
            {slideState.fileType === 'pptx' ? (
              <div className="w-full flex items-center justify-between text-slate-400 text-xs">
                <span className="text-[11px] text-amber-400/90 font-medium">
                  {isGoogleSlidesUrl(slideState.docUrl) ? 'Google Slides trực tuyến' : 'Tệp PPTX lưu trữ • Khuyên dùng PDF để trình chiếu'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isGoogleSlidesUrl(slideState.docUrl) ? 'Lướt độc lập' : 'Tải về máy để xem'}
                </span>
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!canControl || slideState.currentPage <= 1}
                  onClick={() => onChangeSlidePage(slideState.currentPage - 1)}
                  className="h-6 px-2 text-xs gap-1 text-slate-300 hover:text-white"
                  title={canControl ? 'Trang trước' : 'Chỉ chủ phòng hoặc người điều hành mới có quyền chuyển trang'}
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
                  disabled={!canControl || slideState.currentPage >= slideState.totalPages}
                  onClick={() => onChangeSlidePage(slideState.currentPage + 1)}
                  className="h-6 px-2 text-xs gap-1 text-slate-300 hover:text-white"
                  title={canControl ? 'Trang sau' : 'Chỉ chủ phòng hoặc người điều hành mới có quyền chuyển trang'}
                >
                  Trang sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── Outer 4 Corner Resize Handles ── */}
        {!isMaximized && (
          <>
            {/* Top-Left Corner (NW) */}
            <div
              onMouseDown={(e) => startResize('nw', e)}
              style={{ cursor: RESIZE_CURSORS.nw }}
              className="absolute -top-1 -left-1 z-40 h-5 w-5 rounded-tl-xl hover:bg-orange-400/30 transition-colors"
              title="Kéo góc trên-trái để chỉnh kích thước"
            />
            {/* Top-Right Corner (NE) */}
            <div
              onMouseDown={(e) => startResize('ne', e)}
              style={{ cursor: RESIZE_CURSORS.ne }}
              className="absolute -top-1 -right-1 z-40 h-5 w-5 rounded-tr-xl hover:bg-orange-400/30 transition-colors"
              title="Kéo góc trên-phải để chỉnh kích thước"
            />
            {/* Bottom-Left Corner (SW) */}
            <div
              onMouseDown={(e) => startResize('sw', e)}
              style={{ cursor: RESIZE_CURSORS.sw }}
              className="absolute -bottom-1 -left-1 z-40 h-5 w-5 rounded-bl-xl hover:bg-orange-400/30 transition-colors"
              title="Kéo góc dưới-trái để chỉnh kích thước"
            />
            {/* Bottom-Right Corner (SE) */}
            <div
              onMouseDown={(e) => startResize('se', e)}
              style={{ cursor: RESIZE_CURSORS.se }}
              className="absolute -bottom-1 -right-1 z-40 h-6 w-6 rounded-br-xl hover:bg-orange-400/40 transition-colors flex items-end justify-end p-0.5"
              title="Kéo góc dưới-phải để chỉnh kích thước"
            >
              {/* Visible corner resize grip affordance */}
              <svg width="10" height="10" viewBox="0 0 10 10" className="text-orange-400/60 pointer-events-none mb-0.5 mr-0.5">
                <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* ── Outer 4 Edge Resize Handles ── */}
            {/* Top Edge (N) */}
            <div
              onMouseDown={(e) => startResize('n', e)}
              style={{ cursor: RESIZE_CURSORS.n }}
              className="absolute top-0 left-5 right-5 z-30 h-1.5 -translate-y-0.5 hover:bg-orange-400/20 transition-colors"
            />
            {/* Bottom Edge (S) */}
            <div
              onMouseDown={(e) => startResize('s', e)}
              style={{ cursor: RESIZE_CURSORS.s }}
              className="absolute bottom-0 left-5 right-5 z-30 h-1.5 translate-y-0.5 hover:bg-orange-400/20 transition-colors"
            />
            {/* Left Edge (W) */}
            <div
              onMouseDown={(e) => startResize('w', e)}
              style={{ cursor: RESIZE_CURSORS.w }}
              className="absolute left-0 top-5 bottom-5 z-30 w-1.5 -translate-x-0.5 hover:bg-orange-400/20 transition-colors"
            />
            {/* Right Edge (E) */}
            <div
              onMouseDown={(e) => startResize('e', e)}
              style={{ cursor: RESIZE_CURSORS.e }}
              className="absolute right-0 top-5 bottom-5 z-30 w-1.5 translate-x-0.5 hover:bg-orange-400/20 transition-colors"
            />
          </>
        )}
      </div>
    </>
  )
}

interface PinnedSlideViewProps {
  slideState: SlideState
  isHost: boolean
  canModerate?: boolean
  onChangeSlidePage: (page: number) => void
  onUnpin: () => void
  onClose: () => void
}

export function PinnedSlideView({
  slideState,
  isHost,
  canModerate,
  onChangeSlidePage,
  onUnpin,
  onClose,
}: PinnedSlideViewProps) {
  const canControl = isHost || Boolean(canModerate)
  const [useGoogleViewer, setUseGoogleViewer] = useState(false)
  const [lastFailedDocUrl, setLastFailedDocUrl] = useState<string | null>(null)
  const hasRenderError = Boolean(lastFailedDocUrl && lastFailedDocUrl === slideState.docUrl)

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3 md:p-6 pointer-events-none select-none z-[2]">
      {/* Pinned slide presentation frame directly on blackboard */}
      <div className="relative w-full h-full max-w-[94%] max-h-[88%] rounded-2xl overflow-hidden border border-orange-500/35 bg-[#060b12] shadow-2xl pointer-events-auto flex items-center justify-center ring-1 ring-orange-500/20">
        {hasRenderError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
            <AlertTriangle className="h-10 w-10 text-amber-400 opacity-90" />
            <p className="text-sm font-semibold text-slate-200">Không thể tải tài liệu này</p>
            <p className="text-xs text-slate-500 max-w-[320px]">
              Tài liệu có thể không tồn tại hoặc viewer từ chối hiển thị.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-white/20 text-slate-200 hover:bg-white/10"
                onClick={() => {
                  setLastFailedDocUrl(null)
                  setUseGoogleViewer((v) => !v)
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Thử lại / Đổi viewer
              </Button>
            </div>
          </div>
        ) : slideState.fileType === 'pdf' ? (
          <PdfCanvasViewer
            docUrl={slideState.docUrl}
            pageNumber={slideState.currentPage}
            onError={() => setLastFailedDocUrl(slideState.docUrl)}
          />
        ) : slideState.fileType === 'image' ? (
          <img
            src={slideState.docUrl}
            alt={slideState.docName}
            onError={() => setLastFailedDocUrl(slideState.docUrl)}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : slideState.fileType === 'pptx' && !isGoogleSlidesUrl(slideState.docUrl) ? (
          <PptxAdvisoryCard docName={slideState.docName} docUrl={slideState.docUrl} />
        ) : slideState.docUrl && slideState.docUrl !== 'local_presentation' ? (
          <div className="relative h-full w-full">
            <div className="absolute top-2 left-2 z-10 rounded bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 text-[10px] font-semibold text-amber-200 backdrop-blur">
              Chế độ xem ngoài (Chưa hỗ trợ đồng bộ từng trang PPTX)
            </div>
            <iframe
              src={buildIframeSrc(slideState.docUrl, slideState.fileType, useGoogleViewer)}
              title="Slide Viewer (Pinned)"
              className="h-full w-full border-0 bg-white"
              allow="fullscreen"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileSpreadsheet className="h-14 w-14 text-orange-400 mb-2 opacity-80" />
            <p className="text-base font-semibold text-slate-200">{slideState.docName}</p>
            <p className="text-xs text-slate-400 mt-1">Trang {slideState.currentPage}</p>
          </div>
        )}
      </div>

      {/* Floating mini controller bar for pinned slide */}
      <div className="absolute top-14 left-6 z-30 pointer-events-auto flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#0a0f18]/95 px-3 py-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-amber-500/20">
        <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="max-w-[140px] truncate text-xs font-semibold text-slate-200">
          {slideState.docName}
        </span>
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
          Nền bảng vẽ
        </span>

        {slideState.fileType === 'pptx' ? (
          <span className="text-[10px] text-amber-300/80 border-l border-white/10 pl-2">
            {isGoogleSlidesUrl(slideState.docUrl) ? 'Chế độ xem ngoài (lướt độc lập)' : 'Tệp PPTX lưu trữ • Khuyên dùng PDF'}
          </span>
        ) : (
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!canControl || slideState.currentPage <= 1}
              onClick={() => onChangeSlidePage(slideState.currentPage - 1)}
              className="h-6 px-1.5 text-xs text-slate-300 hover:text-white"
              title={canControl ? 'Trang trước' : 'Chỉ chủ phòng hoặc người điều hành mới có quyền chuyển trang'}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-mono font-bold text-orange-300 px-1">
              {slideState.currentPage}/{slideState.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canControl || slideState.currentPage >= slideState.totalPages}
              onClick={() => onChangeSlidePage(slideState.currentPage + 1)}
              className="h-6 px-1.5 text-xs text-slate-300 hover:text-white"
              title={canControl ? 'Trang sau' : 'Chỉ chủ phòng hoặc người điều hành mới có quyền chuyển trang'}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {slideState.fileType === 'pptx' && isGoogleSlidesUrl(slideState.docUrl) && (
          <button
            onClick={() => setUseGoogleViewer((v) => !v)}
            className="rounded p-1 text-slate-400 hover:text-brand transition-colors"
            title={useGoogleViewer ? 'Đang dùng Google Docs Viewer (bấm đổi Office Live)' : 'Đang dùng Office Live (bấm đổi Google Docs Viewer)'}
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        )}

        <button
          onClick={onUnpin}
          className="rounded p-1 text-slate-400 hover:text-amber-300 transition-colors ml-1"
          title="Bỏ ghim (chuyển sang cửa sổ nổi)"
        >
          <PinOff className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
          title="Đóng slide"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
