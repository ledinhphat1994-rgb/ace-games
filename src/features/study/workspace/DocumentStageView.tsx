// src/features/study/workspace/DocumentStageView.tsx
// Digital Campus v2: Milestone PQA-C2 — Classroom Presentation Surface

import type { SlideState, SlideAnnotationStroke } from '@shared/protocol/room'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PdfCanvasViewer } from '../PdfCanvasViewer'
import { PptxSlideViewer } from '../PptxSlideViewer'
import { BUOC_HET } from '../pptx-hieu-ung'
import { deriveDocumentStatus, laTepPptx } from './types'
import { SlideAnnotationLayer, type AnnotationTool } from './SlideAnnotationLayer'
import type { CongCu, CoVe, LoaiHinh } from './cong-cu'

/** Công cụ chung của sân khấu → công cụ chú thích trên trang tài liệu. */
const CONG_CU_TREN_TRANG: Record<CongCu, AnnotationTool> = {
  chuot: 'pointer',
  but: 'pen',
  to_sang: 'highlighter',
  tay: 'eraser',
  laser: 'laser',
  chu: 'text',
  khung: 'shape',
}

export interface DocumentStageViewProps {
  slideState?: SlideState | null
  isHost: boolean
  canModerate?: boolean
  /** step: số cú bấm hiệu ứng .pptx đã chạy trên trang đó (bỏ trống với PDF). */
  onPageChange?: (newPage: number, step?: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  /** Người trình chiếu: báo số slide thật của .pptx dựng trên trình duyệt (tệp cũ / có slide ẩn). */
  onSetTotalPages?: (totalPages: number) => void
  /** Nút điều khiển khung (phóng to / thu nhỏ / ẩn …) đặt ở góc phải đầu khung. */
  dieuKhienKhung?: ReactNode
  /** Đang là cửa sổ nổi: đầu khung gọn, bỏ thu phóng. */
  compact?: boolean
  /** Chỉ lớp chính nhận phím ← → + − 0. */
  nhanPhim?: boolean
  congCu?: CongCu
  hinh?: LoaiHinh
  mau?: string
  co?: CoVe
  isReconnecting?: boolean
  slideAnnotations?: SlideAnnotationStroke[]
  onSendSlideAnnotation?: (stroke: SlideAnnotationStroke) => void
  onClearSlideAnnotations?: (page?: number) => void
  onRemoveSlideAnnotation?: (id: string) => void
  slideLaser?: { point: [number, number] | null; page: number; senderName?: string; updatedAt: number } | null
  onSendSlideLaser?: (point: [number, number] | null, page: number) => void
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

/** Tệp tài liệu của phòng học (`/api/rooms/:id/documents/:docId/file`) — trình xem ngoài cần liên kết có chữ ký. */
const MAU_TEP_PHONG = /^\/api\/rooms\/\d+\/documents\/\d+\/file$/

async function layLienKetXem(docUrl: string): Promise<string> {
  const res = await fetch(docUrl.replace(/\/file$/, '/view-link'), { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as { ok?: boolean; url?: string } | null
  if (!res.ok || !duLieu?.ok || !duLieu.url) throw new Error(`Không lấy được liên kết xem (${res.status}).`)
  return duLieu.url
}

function OfficeEmbedViewer({
  docName,
  docUrl,
}: {
  docName: string
  docUrl: string
}) {
  const [viewerType, setViewerType] = useState<'microsoft' | 'google'>('microsoft')
  const [showAdvisory, setShowAdvisory] = useState(false)

  // Office Online / Google Docs tải tệp từ máy chủ của họ (không có cookie phiên): xin liên kết có chữ ký, ngắn hạn
  // thay vì mở công khai tệp của phòng. Trình xem chỉ tải tệp lúc mở, nên mỗi lần mở / đổi trình xem xin liên kết mới.
  const duongDanTep = docUrl.split('?')[0]
  const laTepPhong = MAU_TEP_PHONG.test(duongDanTep)
  const lienKetXem = useQuery({
    queryKey: ['lien-ket-xem-tai-lieu', duongDanTep, viewerType],
    queryFn: () => layLienKetXem(duongDanTep),
    enabled: laTepPhong,
    retry: 1,
  })

  const nguonTep = laTepPhong ? lienKetXem.data : docUrl
  let fullUrl = nguonTep ?? ''
  if (typeof window !== 'undefined' && fullUrl.startsWith('/')) {
    fullUrl = `${window.location.origin}${fullUrl}`
  }

  const isGoogleSlides = fullUrl.includes('docs.google.com/presentation')
  const embedUrl = isGoogleSlides
    ? fullUrl.replace(/\/(edit|pub|preview)(\?.*)?$/, '/embed').replace(/(embed)(\?.*)?$/, 'embed')
    : fullUrl.includes('docs.google.com/viewer') || fullUrl.includes('view.officeapps.live.com')
      ? fullUrl
      : viewerType === 'microsoft'
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`
        : `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`

  if (showAdvisory || (laTepPhong && lienKetXem.isError)) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <PptxAdvisoryCard docName={docName} docUrl={docUrl} />
        <button
          type="button"
          onClick={() => setShowAdvisory(false)}
          className="mt-3 text-xs text-cyan-400 hover:underline cursor-pointer"
        >
          Quay lại trình chiếu trực tiếp
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-[#070b12] rounded-lg overflow-hidden">
      <div className="relative flex-1 w-full h-full">
        {fullUrl ? (
          <iframe
            src={embedUrl}
            title={docName}
            className="h-full w-full border-0 bg-slate-950"
            allow="fullscreen"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-500" aria-label="Đang mở tài liệu" />
          </div>
        )}
      </div>
      {!isGoogleSlides && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-t border-white/10 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Trình xem:</span>
            <button
              type="button"
              onClick={() => setViewerType('microsoft')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewerType === 'microsoft' ? 'bg-orange-500/20 text-orange-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Office Live
            </button>
            <button
              type="button"
              onClick={() => setViewerType('google')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewerType === 'google' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Docs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvisory(true)}
              className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              Thông tin tệp
            </button>
            {docUrl && (
              <a
                href={docUrl}
                download={docName}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                <Download className="h-3 w-3" />
                Tải tệp
              </a>
            )}
          </div>
        </div>
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
  onSetTotalPages,
  dieuKhienKhung,
  compact = false,
  nhanPhim = true,
  congCu = 'chuot',
  hinh = 'chu_nhat',
  mau = '#ef4444',
  co = 1,
  isReconnecting = false,
  slideAnnotations = [],
  onSendSlideAnnotation,
  onRemoveSlideAnnotation,
  slideLaser,
  onSendSlideLaser,
}: DocumentStageViewProps) {
  const [hasRenderError, setHasRenderError] = useState(false)
  const activeTool = CONG_CU_TREN_TRANG[congCu]

  // Local-only view settings (PQA-C2 Section 5: never synchronized via RoomDO)
  const [zoomScale, setZoomScale] = useState<number>(1.0)
  const [fitMode, setFitMode] = useState<'page' | 'width'>('page')

  const canControl = !isReconnecting && (isHost || canModerate)
  const status = deriveDocumentStatus(slideState, hasRenderError)

  // .pptx dựng ngay trên trình duyệt, chuyển trang đồng bộ như PDF; dựng lỗi thì quay về trình xem Office Online.
  const [pptxLoi, setPptxLoi] = useState(false)
  const dungPptx = laTepPptx(slideState) && !pptxLoi
  const coChuyenTrang = slideState?.fileType === 'pdf' || dungPptx

  // .pptx: mỗi slide có thể có nhiều cú bấm hiệu ứng — tiến / lùi đi qua từng cú bấm trước khi đổi slide (như PowerPoint).
  const [soBuocPptx, setSoBuocPptx] = useState<number[] | null>(null)
  const trangHienTai = slideState?.currentPage ?? 1
  const tongTrang = slideState?.totalPages ?? 1
  const buocHienTai = dungPptx ? (slideState?.step ?? 0) : 0
  const soBuocTrang = (t: number) => (dungPptx ? (soBuocPptx?.[t - 1] ?? 0) : 0)
  // Vị trí người trình chiếu vừa gửi (chưa kịp nhận lại từ máy chủ) — bấm nhanh liên tiếp không bị mất bước.
  const viTriRef = useRef({ trang: trangHienTai, buoc: buocHienTai })
  useEffect(() => {
    viTriRef.current = { trang: trangHienTai, buoc: buocHienTai }
  }, [trangHienTai, buocHienTai])

  const diTien = () => {
    const { trang, buoc } = viTriRef.current
    const moi =
      buoc < soBuocTrang(trang) ? { trang, buoc: buoc + 1 } : trang < tongTrang ? { trang: trang + 1, buoc: 0 } : null
    if (!moi) return
    viTriRef.current = moi
    onPageChange?.(moi.trang, dungPptx ? moi.buoc : undefined)
  }
  const diLui = () => {
    const { trang, buoc } = viTriRef.current
    const daChay = Math.min(buoc, soBuocTrang(trang))
    const moi = daChay > 0 ? { trang, buoc: daChay - 1 } : trang > 1 ? { trang: trang - 1, buoc: BUOC_HET } : null
    if (!moi) return
    viTriRef.current = moi
    onPageChange?.(moi.trang, dungPptx ? moi.buoc : undefined)
  }
  const diTienRef = useRef(diTien)
  const diLuiRef = useRef(diLui)
  useEffect(() => {
    diTienRef.current = diTien
    diLuiRef.current = diLui
  })
  const conTien = trangHienTai < tongTrang || buocHienTai < soBuocTrang(trangHienTai)
  const conLui = trangHienTai > 1 || Math.min(buocHienTai, soBuocTrang(trangHienTai)) > 0

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

  // Keyboard navigation & accessibility (Section 14) — chỉ khi tài liệu là lớp chính
  useEffect(() => {
    if (!nhanPhim) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack keys if user is typing in chat input or any form field
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      // PageUp / PageDown: bút trình chiếu (clicker) gửi hai phím này.
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (canControl && slideState) {
          e.preventDefault()
          diLuiRef.current()
        }
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (canControl && slideState) {
          e.preventDefault()
          diTienRef.current()
        }
      } else if (!canControl) {
        return
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        handleZoomOut()
      } else if (e.key === '0') {
        e.preventDefault()
        handleResetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nhanPhim, canControl, slideState, handleZoomIn, handleZoomOut, handleResetZoom])

  // Reset error state if document URL changes (React recommended render-time adjustment)
  const [prevDocUrl, setPrevDocUrl] = useState(slideState?.docUrl)
  if (slideState?.docUrl !== prevDocUrl) {
    setPrevDocUrl(slideState?.docUrl)
    setHasRenderError(false)
    setPptxLoi(false)
    setSoBuocPptx(null)
  }

  // ── 1. EMPTY DOCUMENT STATE ──
  if (status === 'no_document') {
    return (
      <div className="relative flex h-full w-full flex-col bg-[#090d16] select-none" data-testid="document-stage-empty">
        <div
          data-keo-khung
          className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/85 px-3"
        >
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white">
            <FileText className="h-4 w-4 shrink-0 text-orange-400" />
            <span className="truncate">Tài liệu</span>
          </span>
          {dieuKhienKhung}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          {canControl ? (
            <button
              type="button"
              onClick={onUploadSlide}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs px-4 py-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
              data-testid="stage-upload-doc-cta"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Tải Slide / PDF</span>
            </button>
          ) : (
            <h3 className="text-sm font-bold text-white">Chưa có tài liệu</h3>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#070b12] select-none"
      data-testid="document-stage-active"
    >
      {/* ── TOP DOCUMENT TOOLBAR / HEADER ── */}
      <div
        data-keo-khung
        className={`flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/85 backdrop-blur-md z-10 select-none ${compact ? 'h-9 px-2' : 'h-11 px-3 sm:px-4'}`}
      >
        {/* Left: Doc Name & Type Badge */}
        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
          <FileText className="h-4 w-4 text-orange-400 shrink-0" />
          <span className="truncate text-xs font-semibold text-white max-w-[110px] sm:max-w-[200px]" data-testid="document-stage-docname" title={slideState?.docName || 'Tài liệu'}>
            {slideState?.docName || 'Tài liệu'}
          </span>
          {!compact && (
            <span className="hidden sm:inline-block rounded bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-300">
              {slideState?.fileType || 'Doc'}
            </span>
          )}
          {isReconnecting && (
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-amber-400" aria-label="Đang kết nối lại" />
          )}
        </div>

        {/* Center: Synchronized Page Navigation (PDF và .pptx dựng trên trình duyệt — hệ thống tự đồng bộ trang) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {slideState && (slideState.totalPages > 1 || soBuocTrang(trangHienTai) > 0) && coChuyenTrang && (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-0.5 border border-white/10" data-testid="doc-page-nav">
              {canControl ? (
                <>
                  <button
                    type="button"
                    disabled={!conLui}
                    onClick={diLui}
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
                    disabled={!conTien}
                    onClick={diTien}
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

        {/* Right: Local Zoom/Fit, Host Document Actions & layer frame controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Thu phóng tại máy mình (không đồng bộ) — chỉ người trình chiếu; ẩn khi là cửa sổ nổi. Người tham gia chỉ xem. */}
          {!compact && !dungPptx && canControl && (
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
                {!compact && <span className="hidden sm:inline text-[11px]">Đổi tài liệu</span>}
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

          {dieuKhienKhung && (
            <>
              <span className="mx-0.5 h-4 w-px bg-white/15" />
              {dieuKhienKhung}
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
            >
              <SlideAnnotationLayer
                pageNumber={slideState.currentPage}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                laser={slideLaser}
                onSendLaser={onSendSlideLaser}
              />
            </PdfCanvasViewer>
          </div>
        ) : slideState?.fileType === 'image' ? (
          <div className="h-full w-full flex items-center justify-center overflow-auto p-2" data-testid="doc-image-container">
            <div
              className="relative inline-flex items-center justify-center m-auto transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'center center',
                maxWidth: fitMode === 'page' ? '100%' : 'none',
                maxHeight: fitMode === 'page' ? '100%' : 'none',
              }}
            >
              <img
                src={slideState.docUrl}
                alt={slideState.docName || 'Bài giảng'}
                onError={() => setHasRenderError(true)}
                className="object-contain rounded-lg shadow-2xl border border-white/10 select-none max-h-full max-w-full"
                draggable={false}
                data-testid="doc-image-viewer"
              />
              <SlideAnnotationLayer
                pageNumber={1}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                laser={slideLaser}
                onSendLaser={onSendSlideLaser}
              />
            </div>
          </div>
        ) : dungPptx && slideState ? (
          <div className="h-full w-full" data-testid="doc-pptx-viewer">
            <PptxSlideViewer
              docUrl={slideState.docUrl}
              trang={slideState.currentPage}
              buoc={slideState.step ?? 0}
              onSoTrang={(soTrang) => {
                if (canControl && soTrang !== slideState.totalPages) onSetTotalPages?.(soTrang)
              }}
              onSoBuoc={setSoBuocPptx}
              onBamSlide={canControl && activeTool === 'pointer' ? diTien : undefined}
              onLoi={() => setPptxLoi(true)}
            >
              <SlideAnnotationLayer
                pageNumber={slideState.currentPage}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                laser={slideLaser}
                onSendLaser={onSendSlideLaser}
              />
            </PptxSlideViewer>
          </div>
        ) : slideState?.fileType === 'pptx' ? (
          <OfficeEmbedViewer docName={slideState.docName} docUrl={slideState.docUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-200">{slideState?.docName}</p>
            <p className="text-xs text-slate-400 mt-1">Trang {slideState?.currentPage}</p>
          </div>
        )}
      </div>
      {/* Chú thích & laser dùng bộ "Công cụ" chung trên thanh dock (không còn thanh công cụ riêng trên trang). */}
    </div>
  )
}
