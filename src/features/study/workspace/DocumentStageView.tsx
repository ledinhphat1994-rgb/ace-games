// src/features/study/workspace/DocumentStageView.tsx
// Digital Campus v2: Milestone PQA-C2 — Classroom Presentation Surface

import type { SlideState } from '@shared/protocol/room'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Maximize2,
  Minimize2,
  RefreshCw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PdfCanvasViewer } from '../PdfCanvasViewer'
import { deriveDocumentStatus } from './types'

export interface DocumentStageViewProps {
  slideState?: SlideState | null
  isHost: boolean
  canModerate?: boolean
  onPageChange?: (newPage: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  isReconnecting?: boolean
}

function PptxAdvisoryCard({ docName, docUrl }: { docName: string; docUrl: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-6 text-center text-slate-300 max-w-md mx-auto space-y-3 select-auto"
      data-testid="pptx-advisory-card"
    >
      <div className="rounded-2xl bg-orange-500/10 p-4 ring-1 ring-orange-500/20">
        <FileSpreadsheet className="h-10 w-10 text-orange-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-100 break-all line-clamp-2 max-w-md" title={docName}>
          {docName}
        </h4>
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Tải tệp .pptx về máy
        </a>
      )}
    </div>
  )
}

export function DocumentStageView({
  slideState = null,
  isHost,
  canModerate = false,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  isFullscreen,
  onToggleFullscreen,
  isReconnecting = false,
}: DocumentStageViewProps) {
  const [hasRenderError, setHasRenderError] = useState(false)

  // Local-only view settings (PQA-C2 Section 5: never synchronized via RoomDO)
  const [zoomScale, setZoomScale] = useState<number>(1.0)
  const [fitMode, setFitMode] = useState<'page' | 'width'>('page')

  const canControl = !isReconnecting && (isHost || canModerate)
  const status = deriveDocumentStatus(slideState, hasRenderError)

  // Zoom handlers (clamped between 0.5 and 3.0)
  const handleZoomIn = useCallback(() => {
    setZoomScale((z) => Math.min(3.0, Math.round((z + 0.25) * 100) / 100))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomScale((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoomScale(1.0)
  }, [])

  const handleToggleFit = useCallback(() => {
    setFitMode((m) => (m === 'page' ? 'width' : 'page'))
  }, [])

  // Keyboard navigation & accessibility (Section 14)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack keys if user is typing in chat input or any form field
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      if (e.key === 'ArrowLeft') {
        if (canControl && slideState && slideState.currentPage > 1) {
          e.preventDefault()
          onPageChange?.(slideState.currentPage - 1)
        }
      } else if (e.key === 'ArrowRight') {
        if (canControl && slideState && slideState.currentPage < slideState.totalPages) {
          e.preventDefault()
          onPageChange?.(slideState.currentPage + 1)
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        handleZoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        handleResetZoom()
      } else if (e.key === 'Escape') {
        if (isFullscreen && onToggleFullscreen) {
          onToggleFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canControl, slideState, onPageChange, handleZoomIn, handleZoomOut, handleResetZoom, isFullscreen, onToggleFullscreen])

  // Reset error state if document URL changes (React recommended render-time adjustment)
  const [prevDocUrl, setPrevDocUrl] = useState(slideState?.docUrl)
  if (slideState?.docUrl !== prevDocUrl) {
    setPrevDocUrl(slideState?.docUrl)
    setHasRenderError(false)
  }

  // ── 1. EMPTY DOCUMENT STATE ──
  if (status === 'no_document') {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-[#090d16]"
        data-testid="document-stage-empty"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-3 shadow-inner">
          <FileText className="h-7 w-7" />
        </div>
        {canControl ? (
          <div className="space-y-3 max-w-sm">
            <div>
              <h3 className="text-base font-bold text-white">Chọn tài liệu để trình chiếu</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tải lên tệp PDF hoặc hình ảnh bài giảng để cả lớp cùng xem đồng bộ.
              </p>
            </div>
            <button
              type="button"
              onClick={onUploadSlide}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs px-4 py-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
              data-testid="stage-upload-doc-cta"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Tải Slide / PDF</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-white">Chưa có tài liệu đang trình bày</h3>
            <p className="text-xs text-slate-400">
              Chờ chủ phòng hoặc giáo viên tải lên bài giảng cho buổi học.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#070b12] select-none"
      data-testid="document-stage-active"
    >
      {/* ── TOP DOCUMENT TOOLBAR / HEADER ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/85 px-3 sm:px-4 backdrop-blur-md z-10 select-none">
        {/* Left: Doc Name & Type Badge */}
        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
          <FileText className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="truncate text-xs font-semibold text-white max-w-[110px] sm:max-w-[200px]" data-testid="document-stage-docname" title={slideState?.docName || 'Tài liệu'}>
            {slideState?.docName || 'Tài liệu'}
          </span>
          <span className="hidden sm:inline-block rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-300">
            {slideState?.fileType || 'Doc'}
          </span>
          {isReconnecting && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
              Đang kết nối lại...
            </span>
          )}
        </div>

        {/* Center: Synchronized Page Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          {slideState && slideState.totalPages > 1 && (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-0.5 border border-white/10" data-testid="doc-page-nav">
              {canControl ? (
                <>
                  <button
                    type="button"
                    disabled={slideState.currentPage <= 1}
                    onClick={() => onPageChange?.(Math.max(1, slideState.currentPage - 1))}
                    className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="Trang trước (←)"
                    aria-label="Trang trước"
                    data-testid="doc-btn-prev"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-orange-300 px-1" data-testid="doc-page-counter">
                    {slideState.currentPage}/{slideState.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={slideState.currentPage >= slideState.totalPages}
                    onClick={() => onPageChange?.(Math.min(slideState.totalPages, slideState.currentPage + 1))}
                    className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
                    title="Trang sau (→)"
                    aria-label="Trang sau"
                    data-testid="doc-btn-next"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                /* Student: honest read-only indicator without mutation buttons (Section 4) */
                <span className="text-xs font-mono font-bold text-orange-300 px-1.5" data-testid="doc-page-counter">
                  {slideState.currentPage}/{slideState.totalPages}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Local Zoom/Fit, Fullscreen & Host Document Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Local Zoom Controls Group (Section 5: local only) */}
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10" data-testid="doc-zoom-controls">
            <button
              type="button"
              disabled={zoomScale <= 0.5}
              onClick={handleZoomOut}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Thu nhỏ (-)"
              aria-label="Thu nhỏ"
              data-testid="doc-btn-zoom-out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-200 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Đặt lại độ phóng 100% (0)"
              aria-label="Đặt lại thu phóng"
              data-testid="doc-btn-zoom-reset"
            >
              {Math.round(zoomScale * 100)}%
            </button>

            <button
              type="button"
              disabled={zoomScale >= 3.0}
              onClick={handleZoomIn}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Phóng to (+)"
              aria-label="Phóng to"
              data-testid="doc-btn-zoom-in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleFit}
              className={`hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                fitMode === 'width' ? 'bg-orange-600/40 text-orange-200' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={fitMode === 'page' ? 'Chuyển sang Vừa chiều ngang' : 'Chuyển sang Vừa toàn trang'}
              aria-label="Chế độ vừa màn hình"
              data-testid="doc-btn-fit-mode"
            >
              {fitMode === 'page' ? 'Fit Trang' : 'Fit Ngang'}
            </button>
          </div>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ stage (Escape)' : 'Toàn màn hình stage'}
              aria-label={isFullscreen ? 'Thu nhỏ stage' : 'Toàn màn hình stage'}
              data-testid="doc-btn-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Host-Only: Replace document & Close presentation (Section 4) */}
          {canControl && (
            <>
              <button
                type="button"
                onClick={onUploadSlide}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                title="Đổi hoặc tải slide khác"
                aria-label="Đổi tài liệu"
                data-testid="doc-btn-replace"
              >
                <Upload className="h-3 w-3" />
                <span className="hidden sm:inline text-[11px]">Đổi tài liệu</span>
              </button>

              {onCloseDoc && (
                <button
                  type="button"
                  onClick={onCloseDoc}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đóng trình chiếu"
                  aria-label="Đóng trình chiếu"
                  data-testid="doc-btn-close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN DOCUMENT VIEWPORT AREA ── */}
      <div className="relative flex-1 bg-[#060a12] overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {status === 'render_error' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2" data-testid="doc-render-error">
            <AlertTriangle className="h-8 w-8 text-amber-400 opacity-90" />
            <p className="text-xs font-semibold text-slate-200">Không thể tải tài liệu này</p>
            <p className="text-[11px] text-slate-500 max-w-[280px]">
              Tài liệu có thể không tồn tại hoặc định dạng tệp không được hỗ trợ để hiển thị.
            </p>
            <button
              type="button"
              onClick={() => setHasRenderError(false)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : slideState?.fileType === 'pdf' ? (
          <div className="h-full w-full flex items-center justify-center overflow-auto" data-testid="doc-pdf-viewer">
            <PdfCanvasViewer
              docUrl={slideState.docUrl}
              pageNumber={slideState.currentPage}
              zoomScale={zoomScale}
              fitMode={fitMode}
              onError={() => setHasRenderError(true)}
            />
          </div>
        ) : slideState?.fileType === 'image' ? (
          <div className="h-full w-full flex items-center justify-center overflow-auto p-2" data-testid="doc-image-container">
            <img
              src={slideState.docUrl}
              alt={slideState.docName || 'Bài giảng'}
              onError={() => setHasRenderError(true)}
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                maxWidth: fitMode === 'page' ? '100%' : 'none',
                maxHeight: fitMode === 'page' ? '100%' : 'none',
              }}
              className="object-contain rounded-lg shadow-2xl border border-white/10 select-none"
              draggable={false}
              data-testid="doc-image-viewer"
            />
          </div>
        ) : slideState?.fileType === 'pptx' ? (
          <PptxAdvisoryCard docName={slideState.docName} docUrl={slideState.docUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">{slideState?.docName}</p>
            <p className="text-xs text-slate-400 mt-1">Trang {slideState?.currentPage}</p>
          </div>
        )}
      </div>
    </div>
  )
}
