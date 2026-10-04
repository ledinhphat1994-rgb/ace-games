// src/features/study/workspace/DocumentStageView.tsx
// Digital Campus v2: Milestone PQA-C2 — Classroom Presentation Surface

import type { TiaLaserTrang } from '@/hooks/use-room'
import type { SlideState, SlideAnnotationStroke, LoaiTaiLieuNap, TaiLieuNapItem, QuyenCongCu } from '@shared/protocol/room'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Presentation,
  RefreshCw,
  Search,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useQuery } from '@tanstack/react-query'
import { PdfCanvasViewer } from '../PdfCanvasViewer'
import { PptxSlideViewer } from '../PptxSlideViewer'
import { BUOC_HET } from '../pptx-hieu-ung'
import { DocxDocumentViewer } from '../DocxDocumentViewer'
import { XlsxSpreadsheetViewer } from '../XlsxSpreadsheetViewer'
import { deriveDocumentStatus, laTepPptx } from './types'
import { SlideAnnotationLayer, type AnnotationTool } from './SlideAnnotationLayer'
import type { CongCu, CoVe, LoaiHinh } from './cong-cu'

/** Công cụ chung của sân khấu → công cụ chú thích trên trang tài liệu. */
const CONG_CU_TREN_TRANG: Record<CongCu, AnnotationTool> = {
  chuot: 'pointer',
  di_chuyen: 'move',
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
  onCloseDoc?: (loai?: LoaiTaiLieuNap, docUrl?: string) => void
  /** Chuyển đổi giữa các loại tài liệu đã nạp (PowerPoint, Excel, Word, Ảnh). */
  onSwitchDoc?: (loai: LoaiTaiLieuNap, docUrl?: string) => void
  /** Người trình chiếu: báo số slide thật của .pptx dựng trên trình duyệt (tệp cũ / có slide ẩn). */
  onSetTotalPages?: (totalPages: number) => void
  /** Tài liệu nhúng (Word / Excel / Office Online) không vẽ theo trang được: lớp vẽ tàng hình riêng của tài liệu phủ lên. */
  lopVeNhung?: ReactNode
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
  slideLasers?: TiaLaserTrang[]
  onSendSlideLaser?: (point: [number, number] | null, page: number) => void
  /** Dùng được công cụ đang chọn trên trang (người trình chiếu, hoặc người tham gia được cấp quyền). */
  coTheChuThich?: boolean
  /** Được dùng laser trên trang. */
  coLaser?: boolean
  /** Tẩy được nét của người khác (chỉ người trình chiếu). */
  coTheTayMoiNet?: boolean
  khoaCuaToi?: string
  slideScroll?: { scrollRatio: number; scrollTop?: number; scrollHeight?: number; docUrl?: string; zoom?: number; panX?: number; panY?: number } | null
  onSendSlideScroll?: (ratio: number, scrollTop?: number, scrollHeight?: number, docUrl?: string, zoom?: number, panX?: number, panY?: number) => void
  quyenCongCu?: Record<string, QuyenCongCu[]>
}

function PptxAdvisoryCard({ docName, docUrl }: { docName: string; docUrl: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-6 text-center text-text-secondary max-w-md mx-auto space-y-3 select-auto"
      data-testid="pptx-advisory-card"
    >
      <div className="rounded-2xl bg-orange-500/10 p-4 ring-1 ring-orange-500/20">
        <FileSpreadsheet className="h-10 w-10 text-orange-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-text-primary break-all line-clamp-2 max-w-md" title={docName}>
          {docName}
        </h4>
        <p className="text-[11px] text-warning/90 mt-1 font-medium">
          Tệp PowerPoint đã được lưu trữ an toàn trong phòng học
        </p>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left text-[11px] text-text-secondary space-y-1">
        <p className="font-semibold text-warning flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Chưa hỗ trợ trình chiếu trực tiếp PPTX
        </p>
        <p className="leading-relaxed">
          Để bảo mật dữ liệu phòng học, tài liệu chỉ được truy cập nội bộ bởi thành viên phòng.
          Bạn hãy <strong className="text-text-primary">xuất bài giảng sang định dạng PDF (.pdf)</strong> để trình chiếu và đồng bộ từng trang trực tiếp trên bảng học.
        </p>
      </div>
      {docUrl && (
        <a
          href={docUrl}
          download={docName}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-overlay px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
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
  canControl = false,
}: {
  docName: string
  docUrl: string
  canControl?: boolean
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
    // Học sinh / người tham gia không xem cảnh báo kỹ thuật hoặc hướng dẫn chuyển đổi PDF
    if (!canControl) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center text-text-secondary select-none" data-testid="student-doc-waiting">
          <div className="rounded-2xl bg-surface-overlay p-4 border border-border-subtle text-text-tertiary mb-3">
            <Presentation className="h-8 w-8 text-brand" />
          </div>
          <h4 className="text-sm font-semibold text-text-primary">
            Chủ phòng đang chuẩn bị bài giảng
          </h4>
          <p className="text-xs text-text-tertiary mt-1">
            Nội dung bài giảng sẽ tự động hiển thị khi sẵn sàng
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <PptxAdvisoryCard docName={docName} docUrl={docUrl} />
        <button
          type="button"
          onClick={() => setShowAdvisory(false)}
          className="mt-3 text-xs text-brand hover:underline cursor-pointer"
        >
          Quay lại trình chiếu trực tiếp
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-surface rounded-lg overflow-hidden">
      <div className="relative flex-1 w-full h-full">
        {fullUrl ? (
          <iframe
            src={embedUrl}
            title={docName}
            className="h-full w-full border-0 bg-canvas"
            allow="fullscreen"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-text-tertiary" aria-label="Đang mở tài liệu" />
          </div>
        )}
      </div>
      {!isGoogleSlides && canControl && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-t border-border-subtle text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-secondary">Trình xem:</span>
            <button
              type="button"
              onClick={() => setViewerType('microsoft')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewerType === 'microsoft' ? 'bg-orange-500/20 text-orange-300' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Office Live
            </button>
            <button
              type="button"
              onClick={() => setViewerType('google')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewerType === 'google' ? 'bg-blue-500/20 text-blue-300' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Google Docs
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvisory(true)}
              className="text-[11px] text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Thông tin tệp
            </button>
            {docUrl && (
              <a
                href={docUrl}
                download={docName}
                className="inline-flex items-center gap-1 text-[11px] text-text-secondary hover:text-text-primary"
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
  lopVeNhung,
  isHost,
  canModerate = false,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  onSwitchDoc,
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
  slideLasers,
  coTheChuThich,
  coLaser,
  coTheTayMoiNet,
  khoaCuaToi,
  onSendSlideLaser,
  slideScroll,
  onSendSlideScroll,
  quyenCongCu = {},
}: DocumentStageViewProps) {
  const [hasRenderError, setHasRenderError] = useState(false)
  const [searchExcel, setSearchExcel] = useState('')
  const activeTool = CONG_CU_TREN_TRANG[congCu]

  const canControl = !isReconnecting && (isHost || canModerate)
  const coQuyenCuon = canControl || Boolean(khoaCuaToi && quyenCongCu[khoaCuaToi]?.includes('cuon'))
  const coQuyenDiChuyen = canControl || Boolean(khoaCuaToi && quyenCongCu[khoaCuaToi]?.includes('di_chuyen'))
  const status = deriveDocumentStatus(slideState, hasRenderError)

  // Local-only view settings per document (PQA-C2 Section 5: never synchronized via RoomDO; scoped per active document)
  const [docViewSettings, setDocViewSettings] = useState<Record<string, { zoom: number; fit: 'page' | 'width' }>>({})
  const currentDocKey = slideState?.docUrl || 'default'
  const currentView = docViewSettings[currentDocKey] || { zoom: 1.0, fit: 'page' as const }
  // Zoom: nếu là người tham gia thì tự động đồng bộ theo góc nhìn người trình chiếu (Host Follow Mode)
  const zoomScale =
    !canControl && slideScroll && (!slideScroll.docUrl || slideScroll.docUrl === slideState?.docUrl) && slideScroll.zoom !== undefined
      ? slideScroll.zoom
      : currentView.zoom
  const fitMode = currentView.fit

  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)

  // .pptx dựng ngay trên trình duyệt, chuyển trang đồng bộ như PDF; dựng lỗi thì quay về trình xem Office Online.
  const [pptxLoi, setPptxLoi] = useState(false)
  const dungPptx = laTepPptx(slideState) && !pptxLoi
  const coChuyenTrang = slideState?.fileType === 'pdf' || dungPptx

  const isWord = Boolean(
    slideState &&
      (/\.(docx|doc)$/i.test(slideState.docName || '') ||
        /\.(docx|doc)$/i.test(slideState.docUrl.split('?')[0]) ||
        ((slideState.docName || '').toLowerCase().includes('.doc') && !laTepPptx(slideState))),
  )

  const isExcel = Boolean(
    slideState &&
      (/\.(xlsx|xls|csv)$/i.test(slideState.docName || '') ||
        /\.(xlsx|xls|csv)$/i.test(slideState.docUrl.split('?')[0]) ||
        ((slideState.docName || '').toLowerCase().includes('.xls') && !laTepPptx(slideState))),
  )

  const isLegacyXls = Boolean(
    slideState &&
      (/\.xls$/i.test(slideState.docName || '') || /\.xls$/i.test(slideState.docUrl.split('?')[0])) &&
      !/\.xlsx$/i.test(slideState.docName || '') &&
      !/\.xlsx$/i.test(slideState.docUrl.split('?')[0]),
  )

  const isImage = Boolean(
    slideState &&
      (slideState.fileType === 'image' ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(slideState.docName || '') ||
        /\.(png|jpe?g|webp|gif|svg)$/i.test(slideState.docUrl.split('?')[0])),
  )

  const loaiHienTai: LoaiTaiLieuNap = isImage ? 'image' : isExcel ? 'excel' : isWord ? 'word' : 'pptx'

  const [openAppMenu, setOpenAppMenu] = useState<LoaiTaiLieuNap | null>(null)

  const docsByApp = useMemo(() => {
    const map: Record<LoaiTaiLieuNap, TaiLieuNapItem[]> = {
      pptx: [],
      excel: [],
      word: [],
      image: [],
    }
    if (!slideState?.loadedDocs || slideState.loadedDocs.length === 0) {
      if (slideState) {
        map[loaiHienTai].push({
          loai: loaiHienTai,
          docId: slideState.docId,
          docUrl: slideState.docUrl,
          docName: slideState.docName,
          fileType: slideState.fileType,
          currentPage: slideState.currentPage,
          totalPages: slideState.totalPages,
          step: slideState.step,
        })
      }
      return map
    }
    for (const doc of slideState.loadedDocs) {
      if (map[doc.loai]) {
        map[doc.loai].push(doc)
      }
    }
    return map
  }, [slideState, loaiHienTai])

  const activeApps = useMemo(() => {
    return (['pptx', 'excel', 'word', 'image'] as const).filter((app) => docsByApp[app].length > 0)
  }, [docsByApp])

  // Image pan state (Kéo di chuyển hình ảnh mượt mà không nhấp nháy/biến mất)
  const [imagePan, setImagePan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanningImage, setIsPanningImage] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null)

  const effectivePan =
    !canControl && slideScroll && (!slideScroll.docUrl || slideScroll.docUrl === slideState?.docUrl) && slideScroll.panX !== undefined && slideScroll.panY !== undefined
      ? { x: slideScroll.panX, y: slideScroll.panY }
      : imagePan

  const handlePanBackground = useCallback((dx: number, dy: number, isDone: boolean) => {
    if (!coQuyenDiChuyen) return
    if (!panStartRef.current) {
      panStartRef.current = { x: 0, y: 0, startPanX: imagePan.x, startPanY: imagePan.y }
    }
    setIsPanningImage(!isDone)
    const newX = Math.round(panStartRef.current.startPanX + dx)
    const newY = Math.round(panStartRef.current.startPanY + dy)
    setImagePan({ x: newX, y: newY })
    if (isDone) {
      panStartRef.current = null
      if (canControl && onSendSlideScroll && slideState) {
        onSendSlideScroll(0, 0, 0, slideState.docUrl, zoomScale, newX, newY)
      }
    }
  }, [coQuyenDiChuyen, imagePan.x, imagePan.y, canControl, onSendSlideScroll, slideState, zoomScale])

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

  // Zoom handlers (clamped between 0.5 and 3.0) — scoped strictly to active document
  const handleZoomIn = useCallback(() => {
    setDocViewSettings((prev) => {
      const cur = prev[currentDocKey] || { zoom: 1.0, fit: 'page' }
      const newZoom = Math.min(3.0, Math.round((cur.zoom + 0.25) * 100) / 100)
      if (canControl && onSendSlideScroll && slideState) {
        onSendSlideScroll(0, 0, 0, slideState.docUrl, newZoom, imagePan.x, imagePan.y)
      }
      return {
        ...prev,
        [currentDocKey]: { ...cur, zoom: newZoom },
      }
    })
  }, [currentDocKey, canControl, onSendSlideScroll, slideState, imagePan.x, imagePan.y])

  const handleZoomOut = useCallback(() => {
    setDocViewSettings((prev) => {
      const cur = prev[currentDocKey] || { zoom: 1.0, fit: 'page' }
      const newZoom = Math.max(0.5, Math.round((cur.zoom - 0.25) * 100) / 100)
      if (canControl && onSendSlideScroll && slideState) {
        onSendSlideScroll(0, 0, 0, slideState.docUrl, newZoom, imagePan.x, imagePan.y)
      }
      return {
        ...prev,
        [currentDocKey]: { ...cur, zoom: newZoom },
      }
    })
  }, [currentDocKey, canControl, onSendSlideScroll, slideState, imagePan.x, imagePan.y])

  const handleResetZoom = useCallback(() => {
    setDocViewSettings((prev) => {
      const cur = prev[currentDocKey] || { zoom: 1.0, fit: 'page' }
      return { ...prev, [currentDocKey]: { ...cur, zoom: 1.0 } }
    })
    setImagePan({ x: 0, y: 0 })
    if (canControl && onSendSlideScroll && slideState) {
      onSendSlideScroll(0, 0, 0, slideState.docUrl, 1.0, 0, 0)
    }
  }, [currentDocKey, canControl, onSendSlideScroll, slideState])

  const handleToggleFit = useCallback(() => {
    setDocViewSettings((prev) => {
      const cur = prev[currentDocKey] || { zoom: 1.0, fit: 'page' }
      const m = cur.fit
      return { ...prev, [currentDocKey]: { ...cur, fit: m === 'page' ? 'width' : 'page' } }
    })
  }, [currentDocKey])

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
    setImagePan({ x: 0, y: 0 })
    setImageNaturalSize(null)
  }

  // Xử lý cuộn vùng xem hình ảnh và phát tỷ lệ cuộn cho người tham gia
  const handleImageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScrollRef.current) return
    if (!coQuyenCuon) return
    const el = e.currentTarget
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll <= 0) return
    const ratio = Math.max(0, Math.min(1, el.scrollTop / maxScroll))
    if (canControl && onSendSlideScroll && slideState) {
      onSendSlideScroll(ratio, el.scrollTop, el.scrollHeight, slideState.docUrl, zoomScale, imagePan.x, imagePan.y)
    }
  }

  // Đồng bộ vị trí cuộn cho container ảnh từ người trình chiếu
  useEffect(() => {
    if (canControl || !slideScroll || !imageContainerRef.current) return
    if (slideScroll.docUrl && slideState && slideScroll.docUrl !== slideState.docUrl) return
    const el = imageContainerRef.current
    const maxScroll = el.scrollHeight - el.clientHeight
    if (maxScroll > 0 && typeof slideScroll.scrollRatio === 'number') {
      isProgrammaticScrollRef.current = true
      el.scrollTop = Math.round(slideScroll.scrollRatio * maxScroll)
      requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false
      })
    }
  }, [slideScroll, canControl, slideState])

  // ── 1. EMPTY DOCUMENT STATE ──
  if (status === 'no_document') {
    return (
      <div className="relative flex h-full w-full flex-col bg-surface select-none" data-testid="document-stage-empty">
        <div
          data-keo-khung
          className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border-subtle bg-surface px-3"
        >
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-text-primary">
            <FileText className="h-4 w-4 shrink-0 text-orange-400" />
            <span className="truncate">Tài liệu</span>
          </span>
          {dieuKhienKhung}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <h3 className="text-sm font-semibold text-text-secondary">Chưa có tài liệu</h3>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-surface select-none"
      data-testid="document-stage-active"
    >
      {/* ── TOP DOCUMENT TOOLBAR / HEADER ── */}
      <div
        data-keo-khung
        className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border-subtle bg-surface z-10 select-none ${compact ? 'h-9 px-2' : 'h-11 px-3 sm:px-4'}`}
      >
        {/* Left (Col 1): Drag handle + App Cards (EXCEL, POWERPOINT, WORD, ẢNH) — VÙNG 1 */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto [scrollbar-width:none] pr-2" data-testid="doc-loaded-tabs">
          <div
            data-keo-khung-handle
            data-keo-khung
            role="button"
            tabIndex={-1}
            className="flex items-center justify-center p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-raised cursor-grab active:cursor-grabbing transition-colors shrink-0 touch-none select-none"
            title="Giữ chuột hoặc ngón tay để di chuyển khung tài liệu"
            aria-label="Kéo di chuyển khung tài liệu"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {activeApps.map((app) => {
            const files = docsByApp[app]
            const isAppActive = loaiHienTai === app
            const activeDocInApp = files.find((d) => d.docUrl === slideState?.docUrl) || files[0]
            const isMenuOpen = openAppMenu === app
            const hasMultipleFiles = files.length > 1

            const iconColor =
              app === 'excel'
                ? 'text-emerald-400'
                : app === 'word'
                  ? 'text-blue-400'
                  : app === 'image'
                    ? 'text-purple-400'
                    : 'text-amber-400'
            const bgBadge =
              app === 'excel'
                ? 'bg-emerald-500/15 border-emerald-500/30'
                : app === 'word'
                  ? 'bg-blue-500/15 border-blue-500/30'
                  : app === 'image'
                    ? 'bg-purple-500/15 border-purple-500/30'
                    : 'bg-amber-500/15 border-amber-500/30'
            const badgeCountColor =
              app === 'excel'
                ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-500/40'
                : app === 'word'
                  ? 'bg-blue-500/25 text-blue-200 ring-1 ring-blue-500/40'
                  : app === 'image'
                    ? 'bg-purple-500/25 text-purple-200 ring-1 ring-purple-500/40'
                    : 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/40'
            const tenLoai =
              app === 'excel'
                ? 'Excel'
                : app === 'word'
                  ? 'Word'
                  : app === 'image'
                    ? 'Ảnh'
                    : 'PowerPoint'

            const renderAppIcon = (sizeCls = 'h-3.5 w-3.5') =>
              app === 'excel' ? (
                <FileSpreadsheet className={`${sizeCls} shrink-0 ${iconColor}`} />
              ) : app === 'word' ? (
                <FileText className={`${sizeCls} shrink-0 ${iconColor}`} />
              ) : app === 'image' ? (
                <ImageIcon className={`${sizeCls} shrink-0 ${iconColor}`} />
              ) : (
                <Presentation className={`${sizeCls} shrink-0 ${iconColor}`} />
              )

            // Người tham gia không thấy gì khi click vào các card tài liệu; chỉ có chủ phòng mới thấy & tương tác được
            if (!canControl) {
              return (
                <div
                  key={app}
                  className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs select-none shrink-0 cursor-default ${
                    isAppActive
                      ? `${bgBadge} ring-1 ring-brand/40 shadow-xs font-semibold text-text-primary`
                      : 'border-border-default/60 bg-surface-overlay/50 text-text-secondary'
                  }`}
                  title={`${tenLoai}: ${activeDocInApp?.docName || 'Tài liệu'}`}
                  data-testid={`doc-tab-${app}`}
                >
                  {renderAppIcon('h-4 w-4')}
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${iconColor}`}>
                    {tenLoai}
                  </span>
                  {hasMultipleFiles && (
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold font-mono shadow-xs shrink-0 ${badgeCountColor}`}
                      title={`${files.length} tài liệu`}
                    >
                      {files.length}
                    </span>
                  )}
                </div>
              )
            }

            if (hasMultipleFiles) {
              return (
                <Popover
                  key={app}
                  open={isMenuOpen}
                  onOpenChange={(nextOpen) => setOpenAppMenu(nextOpen ? app : null)}
                >
                  <PopoverTrigger
                    type="button"
                    className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all cursor-pointer shrink-0 select-none ${
                      isAppActive
                        ? `${bgBadge} ring-1 ring-brand/40 shadow-xs font-semibold text-text-primary`
                        : 'border-border-default/60 bg-surface-overlay/50 text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                    }`}
                    title={`${tenLoai}: ${activeDocInApp?.docName || 'Tài liệu'}`}
                    data-testid={`doc-tab-${app}`}
                  >
                    {renderAppIcon('h-4 w-4')}
                    <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${iconColor}`}>
                      {tenLoai}
                    </span>

                    {/* Số to rõ thẩm mỹ nằm trong card: chỉ hiện nếu hơn 1 tài liệu */}
                    <span
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold font-mono shadow-xs shrink-0 transition-transform group-hover:scale-105 ${badgeCountColor}`}
                      title={`${files.length} tài liệu`}
                    >
                      {files.length}
                    </span>
                  </PopoverTrigger>

                  <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    className="w-72 p-2 rounded-xl border border-border-default bg-surface-raised shadow-xl backdrop-blur-md flex flex-col gap-1 text-xs z-50"
                    data-testid={`doc-app-menu-${app}`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-border-subtle px-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase ${iconColor}`}>{tenLoai}</span>
                        <span className="text-[11px] text-text-tertiary font-mono">({files.length}/5 tệp)</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 max-h-56 overflow-y-auto [scrollbar-width:thin]">
                      {files.map((file, idx) => {
                        const isCurrent = file.docUrl === slideState?.docUrl
                        return (
                          <button
                            type="button"
                            key={file.docUrl || idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              onSwitchDoc?.(app, file.docUrl)
                              setOpenAppMenu(null)
                            }}
                            className={`group flex w-full items-center justify-between gap-2 p-1.5 rounded-lg border transition-colors cursor-pointer text-left ${
                              isCurrent
                                ? `${bgBadge} ring-1 ring-brand/30 font-medium text-text-primary`
                                : 'border-transparent hover:bg-surface-overlay text-text-secondary hover:text-text-primary'
                            }`}
                            title={file.docName}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isCurrent ? (
                                <Check className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-border-strong shrink-0 ml-1" />
                              )}
                              <span className="truncate text-xs min-w-0" title={file.docName}>
                                {file.docName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {file.totalPages > 1 && (
                                <span className="text-[10px] font-mono text-text-tertiary">
                                  {file.currentPage}/{file.totalPages}
                                </span>
                              )}
                              {canControl && onCloseDoc && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onCloseDoc(app, file.docUrl)
                                    if (files.length <= 1) setOpenAppMenu(null)
                                  }}
                                  className="p-1 rounded text-text-tertiary hover:bg-surface-overlay hover:text-red-400 transition-colors cursor-pointer"
                                  title={`Gỡ tệp ${file.docName}`}
                                  aria-label={`Gỡ tệp ${file.docName}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            }

            // Chỉ 1 tài liệu: không hiện số, bấm trực tiếp để chuyển tài liệu
            return (
              <div key={app} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => onSwitchDoc?.(app, files[0]?.docUrl)}
                  className={`group relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all cursor-pointer shrink-0 select-none ${
                    isAppActive
                      ? `${bgBadge} ring-1 ring-brand/40 shadow-xs font-semibold text-text-primary`
                      : 'border-border-default/60 bg-surface-overlay/50 text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                  }`}
                  title={`${tenLoai}: ${activeDocInApp?.docName || 'Tài liệu'}`}
                  data-testid={`doc-tab-${app}`}
                >
                  {renderAppIcon()}
                  <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 ${iconColor}`}>
                    {tenLoai}
                  </span>
                  {canControl && onCloseDoc && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        onCloseDoc(app, files[0]?.docUrl)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          onCloseDoc(app, files[0]?.docUrl)
                        }
                      }}
                      className="ml-0.5 rounded p-0.5 text-text-tertiary hover:bg-surface-overlay hover:text-red-400 transition-colors shrink-0"
                      title={`Đóng ${tenLoai}`}
                      aria-label={`Đóng ${tenLoai}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              </div>
            )
          })}
          {isReconnecting && (
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-warning" aria-label="Đang kết nối lại" />
          )}
        </div>

        {/* Center (Col 2): Căn giữa 50% tuyệt đối — VÙNG 1 & 2 (Chỉ hiển thị với chủ phòng canControl) */}
        <div className="flex items-center justify-center shrink-0">
          {canControl && (
            isExcel ? (
              <div className="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-overlay px-2 py-0.5 shrink-0">
                <Search className="h-3 w-3 text-text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={searchExcel}
                  onChange={(e) => setSearchExcel(e.target.value)}
                  placeholder="Tìm ô..."
                  className="w-20 sm:w-32 bg-transparent text-[11px] text-text-primary outline-none placeholder:text-text-tertiary"
                  data-testid="doc-excel-search"
                />
              </div>
            ) : slideState && (slideState.totalPages > 1 || soBuocTrang(trangHienTai) > 0) && coChuyenTrang ? (
              <div className="flex items-center gap-1 bg-surface-overlay rounded-lg px-1.5 py-0.5 border border-border-default shrink-0 shadow-xs" data-testid="doc-page-nav">
                <button
                  type="button"
                  disabled={!conLui}
                  onClick={diLui}
                  className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors rounded hover:bg-surface-overlay"
                  title="Trang trước (←)"
                  aria-label="Trang trước"
                  data-testid="doc-btn-prev"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-mono font-bold text-orange-300 px-1.5" data-testid="doc-page-counter">
                  {slideState.currentPage}/{slideState.totalPages}
                </span>
                <button
                  type="button"
                  disabled={!conTien}
                  onClick={diTien}
                  className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors rounded hover:bg-surface-overlay"
                  title="Trang sau (→)"
                  aria-label="Trang sau"
                  data-testid="doc-btn-next"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null
          )}
        </div>

        {/* Right (Col 3): Local Zoom/Fit, Host Document Actions & layer frame controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
          {/* Thu phóng tại máy mình (không đồng bộ) — chỉ người trình chiếu; ẩn khi là cửa sổ nổi. Người tham gia chỉ xem. */}
          {!compact && !dungPptx && canControl && (
            <div className="hidden lg:flex items-center gap-0.5 bg-surface-overlay rounded-lg p-0.5 border border-border-default" data-testid="doc-zoom-controls">
              <button
                type="button"
                disabled={zoomScale <= 0.5}
                onClick={handleZoomOut}
                className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-overlay transition-colors cursor-pointer"
                title="Thu nhỏ (-)"
                aria-label="Thu nhỏ"
                data-testid="doc-btn-zoom-out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[11px] font-mono font-semibold text-text-primary hover:text-text-primary rounded hover:bg-surface-overlay transition-colors cursor-pointer"
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
                className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-30 rounded hover:bg-surface-overlay transition-colors cursor-pointer"
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
                  fitMode === 'width' ? 'bg-orange-600/40 text-orange-200' : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
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
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onUploadSlide}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary cursor-pointer"
                title="Nạp / Đổi tài liệu"
                aria-label="Nạp / Đổi tài liệu"
                data-testid="doc-btn-replace"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>

              {dieuKhienKhung}

              {onCloseDoc && (
                <button
                  type="button"
                  onClick={() => onCloseDoc()}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-red-400 cursor-pointer"
                  title="Tắt trình chiếu"
                  aria-label="Tắt trình chiếu"
                  data-testid="doc-btn-close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          {!canControl && dieuKhienKhung && (
            <div className="flex items-center gap-0.5">
              {dieuKhienKhung}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN DOCUMENT VIEWPORT AREA ── */}
      <div className="relative flex-1 bg-canvas overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {status === 'render_error' ? (
          canControl ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-text-secondary space-y-2" data-testid="doc-render-error">
              <AlertTriangle className="h-8 w-8 text-warning opacity-90" />
              <p className="text-xs font-semibold text-text-primary">Không thể tải tài liệu này</p>
              <button
                type="button"
                onClick={() => setHasRenderError(false)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-overlay px-3 py-1.5 text-xs text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Thử lại</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-text-secondary space-y-2" data-testid="doc-render-waiting">
              <div className="rounded-2xl bg-surface-overlay p-4 border border-border-subtle text-text-tertiary mb-1">
                <Presentation className="h-8 w-8 text-brand" />
              </div>
              <p className="text-xs font-semibold text-text-primary">Chủ phòng đang chuẩn bị bài giảng</p>
              <p className="text-[11px] text-text-tertiary">Vui lòng đợi trong giây lát...</p>
            </div>
          )
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
                docUrl={slideState.docUrl}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={coTheChuThich ?? canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                lasers={slideLasers}
                coLaser={coLaser ?? canControl}
                coTheTayMoiNet={coTheTayMoiNet ?? canControl}
                khoaCuaToi={khoaCuaToi}
                onSendLaser={onSendSlideLaser}
              />
            </PdfCanvasViewer>
          </div>
        ) : slideState?.fileType === 'image' ? (
          <div
            ref={imageContainerRef}
            onScroll={handleImageScroll}
            className={`h-full w-full flex items-center justify-center p-2 ${
              coQuyenCuon ? 'overflow-auto' : 'overflow-hidden overscroll-none'
            }`}
            data-testid="doc-image-container"
          >
            <div
              className={`relative inline-flex items-center justify-center m-auto ${isPanningImage ? '' : 'transition-transform duration-100 ease-out'}`}
              style={{
                transform: `translate(${effectivePan.x}px, ${effectivePan.y}px) scale(${zoomScale})`,
                transformOrigin: 'center center',
                aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : undefined,
                maxWidth: fitMode === 'page' ? '100%' : 'none',
                maxHeight: fitMode === 'page' ? '100%' : 'none',
                width: imageNaturalSize && fitMode === 'width' ? '100%' : undefined,
                height: imageNaturalSize && fitMode === 'page' ? '100%' : undefined,
              }}
            >
              <img
                src={slideState.docUrl}
                alt={slideState.docName || 'Bài giảng'}
                onLoad={(e) => {
                  const img = e.currentTarget
                  if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
                  }
                }}
                onError={() => setHasRenderError(true)}
                onDragStart={(e) => e.preventDefault()}
                className="w-full h-full object-cover rounded-lg shadow-2xl border border-border-default select-none block"
                draggable={false}
                data-testid="doc-image-viewer"
              />
              <SlideAnnotationLayer
                pageNumber={1}
                docUrl={slideState.docUrl}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={coTheChuThich ?? canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                onPanBackground={handlePanBackground}
                lasers={slideLasers}
                coLaser={coLaser ?? canControl}
                coTheTayMoiNet={coTheTayMoiNet ?? canControl}
                khoaCuaToi={khoaCuaToi}
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
                docUrl={slideState.docUrl}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={coTheChuThich ?? canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                lasers={slideLasers}
                coLaser={coLaser ?? canControl}
                coTheTayMoiNet={coTheTayMoiNet ?? canControl}
                khoaCuaToi={khoaCuaToi}
                onSendLaser={onSendSlideLaser}
              />
            </PptxSlideViewer>
          </div>
        ) : isWord && slideState ? (
          <div className="relative h-full w-full" data-testid="doc-word-viewer">
            <DocxDocumentViewer
              docName={slideState.docName}
              docUrl={slideState.docUrl}
              compact={compact}
              hideHeader={true}
              scale={zoomScale}
              canControl={canControl}
              canScroll={coQuyenCuon}
              scrollRatio={
                slideScroll && (!slideScroll.docUrl || slideScroll.docUrl === slideState.docUrl)
                  ? slideScroll.scrollRatio
                  : undefined
              }
              onScrollRatioChange={
                coQuyenCuon && onSendSlideScroll
                  ? (ratio, sTop, sHeight) => onSendSlideScroll(ratio, sTop, sHeight, slideState.docUrl)
                  : undefined
              }
            >
              <SlideAnnotationLayer
                pageNumber={1}
                docUrl={slideState.docUrl}
                strokes={slideAnnotations}
                activeTool={activeTool}
                hinh={hinh}
                selectedColor={mau}
                selectedSize={co}
                canAnnotate={coTheChuThich ?? canControl}
                onSendStroke={onSendSlideAnnotation}
                onRemoveStroke={onRemoveSlideAnnotation}
                lasers={slideLasers}
                coLaser={coLaser ?? canControl}
                coTheTayMoiNet={coTheTayMoiNet ?? canControl}
                khoaCuaToi={khoaCuaToi}
                onSendLaser={onSendSlideLaser}
              />
            </DocxDocumentViewer>
          </div>
        ) : isExcel && slideState ? (
          <div className="relative h-full w-full" data-testid="doc-excel-viewer">
            {isLegacyXls ? (
              <>
                <OfficeEmbedViewer docName={slideState.docName} docUrl={slideState.docUrl} canControl={canControl} />
                {lopVeNhung && <div className="pointer-events-none absolute inset-0 z-10">{lopVeNhung}</div>}
              </>
            ) : (
              <XlsxSpreadsheetViewer
                docName={slideState.docName}
                docUrl={slideState.docUrl}
                compact={compact}
                hideHeader={true}
                scale={zoomScale}
                search={searchExcel}
                canControl={canControl}
                canScroll={coQuyenCuon}
                scrollRatio={
                  slideScroll && (!slideScroll.docUrl || slideScroll.docUrl === slideState.docUrl)
                    ? slideScroll.scrollRatio
                    : undefined
                }
                onScrollRatioChange={
                  coQuyenCuon && onSendSlideScroll
                    ? (ratio, sTop, sHeight) => onSendSlideScroll(ratio, sTop, sHeight, slideState.docUrl)
                    : undefined
                }
                onSearchChange={setSearchExcel}
              >
                <SlideAnnotationLayer
                  pageNumber={1}
                  docUrl={slideState.docUrl}
                  strokes={slideAnnotations}
                  activeTool={activeTool}
                  hinh={hinh}
                  selectedColor={mau}
                  selectedSize={co}
                  canAnnotate={coTheChuThich ?? canControl}
                  onSendStroke={onSendSlideAnnotation}
                  onRemoveStroke={onRemoveSlideAnnotation}
                  lasers={slideLasers}
                  coLaser={coLaser ?? canControl}
                  coTheTayMoiNet={coTheTayMoiNet ?? canControl}
                  khoaCuaToi={khoaCuaToi}
                  onSendLaser={onSendSlideLaser}
                />
              </XlsxSpreadsheetViewer>
            )}
          </div>
        ) : slideState?.fileType === 'pptx' ? (
          <div className="relative h-full w-full">
            <OfficeEmbedViewer docName={slideState.docName} docUrl={slideState.docUrl} canControl={canControl} />
            {lopVeNhung && <div className="pointer-events-none absolute inset-0 z-10">{lopVeNhung}</div>}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-text-secondary">
            <FileText className="h-12 w-12 text-orange-400 mb-2 opacity-80" />
            <p className="text-sm font-semibold text-text-primary">{slideState?.docName}</p>
            <p className="text-xs text-text-secondary mt-1">Trang {slideState?.currentPage}</p>
          </div>
        )}
      </div>
      {/* Chú thích & laser dùng bộ "Công cụ" chung trên thanh dock (không còn thanh công cụ riêng trên trang). */}
    </div>
  )
}
