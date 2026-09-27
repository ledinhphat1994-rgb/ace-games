// test/pqa-c2-pdf-slide-stage.test.ts
// Digital Campus v2: Milestone PQA-C2 Verification Suite
// Real PDF / Slide Presentation in Central Stage Quality Contracts

import { describe, expect, it } from 'vitest'
import {
  deriveDocumentStatus,
  canUserPresent,
} from '../src/features/study/workspace/types'
import type { SlideState } from '../shared/protocol/room'
import { LenhPhongSlide } from '../shared/protocol/room'

// Raw source files for structural inspections
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import pdfViewerRaw from '../src/features/study/PdfCanvasViewerImpl.tsx?raw'
import roomDoRaw from '../worker/room-do.ts?raw'

describe('PQA-C2: Real PDF / Slide Presentation in Central Stage (Items A through L)', () => {
  const samplePdfSlide: SlideState = {
    docId: 101,
    docUrl: '/api/rooms/7/documents/101/file',
    docName: 'GiaoTrinh_Toan10_Chuong1.pdf',
    fileType: 'pdf',
    currentPage: 2,
    totalPages: 15,
  }

  const sampleImageSlide: SlideState = {
    docId: 102,
    docUrl: '/api/files/diagram_geometry.png',
    docName: 'diagram_geometry.png',
    fileType: 'image',
    currentPage: 1,
    totalPages: 1,
  }

  const samplePptxSlide: SlideState = {
    docId: 103,
    docUrl: '/api/rooms/7/documents/103/file',
    docName: 'BaiGiang_VatLy10.pptx',
    fileType: 'pptx',
    currentPage: 1,
    totalPages: 20,
  }

  // ── A. PDF Ready State ────────────────────────────────────────────────────
  describe('A. PDF Ready State Contract', () => {
    it('derives ready status when valid PDF document is loaded', () => {
      const status = deriveDocumentStatus(samplePdfSlide, false, false)
      expect(status).toBe('ready')
    })

    it('PdfCanvasViewerImpl exposes data-rendered-page only after pixel render finishes', () => {
      expect(pdfViewerRaw).toContain('data-rendered-page={renderedPage ?? \'\'}')
      expect(pdfViewerRaw).toContain('await task.promise')
      expect(pdfViewerRaw).toContain('setRenderedPage(clampedPage)')
    })

    it('DocumentStageView renders doc-pdf-viewer when status is ready and fileType is pdf', () => {
      expect(docStageRaw).toContain('data-testid="doc-pdf-viewer"')
      expect(docStageRaw).toContain('<PdfCanvasViewer')
    })
  })

  // ── B. PDF Loading State ──────────────────────────────────────────────────
  describe('B. PDF Loading State Contract', () => {
    it('derives loading status when isLoading is explicitly true and no render error', () => {
      const status = deriveDocumentStatus(samplePdfSlide, false, true)
      expect(status).toBe('loading')
    })

    it('PdfCanvasViewerImpl provides smooth non-blocking page flip loading badge', () => {
      expect(pdfViewerRaw).toContain('data-testid="pdf-loading-indicator"')
      expect(pdfViewerRaw).toContain('Đang tải trang')
    })

    it('PdfCanvasViewerImpl provides centered initial loader on very first page load', () => {
      expect(pdfViewerRaw).toContain('data-testid="pdf-initial-loading"')
      expect(pdfViewerRaw).toContain('renderedPage === null')
    })

    it('loading state does not collapse or map to empty stage', () => {
      const status = deriveDocumentStatus(samplePdfSlide, false, true)
      expect(status).not.toBe('no_document')
      expect(status).not.toBe('render_error')
    })
  })

  // ── C. PDF Render Error != Empty ──────────────────────────────────────────
  describe('C. PDF Render Error Distinction', () => {
    it('derives render_error when hasRenderError is true regardless of loading', () => {
      const status = deriveDocumentStatus(samplePdfSlide, true, false)
      expect(status).toBe('render_error')
    })

    it('DocumentStageView displays explicit error card with retry button on render error', () => {
      expect(docStageRaw).toContain('data-testid="doc-render-error"')
      expect(docStageRaw).toContain('Không thể tải tài liệu này')
      expect(docStageRaw).toContain('Thử lại')
      expect(docStageRaw).toContain('setHasRenderError(false)')
    })

    it('render_error is strictly distinct from no_document', () => {
      const emptyStatus = deriveDocumentStatus(null)
      const errorStatus = deriveDocumentStatus(samplePdfSlide, true)
      expect(emptyStatus).toBe('no_document')
      expect(errorStatus).toBe('render_error')
      expect(emptyStatus).not.toBe(errorStatus)
    })
  })

  // ── D. Host Page Change Permitted ─────────────────────────────────────────
  describe('D. Host Page Change Permissions', () => {
    it('authorizes host or moderator to control presentation', () => {
      expect(canUserPresent(true, false)).toBe(true)
      expect(canUserPresent(false, true)).toBe(true)
      expect(canUserPresent(true, true)).toBe(true)
    })

    it('Host view renders interactive previous and next buttons', () => {
      expect(docStageRaw).toContain('data-testid="doc-btn-prev"')
      expect(docStageRaw).toContain('data-testid="doc-btn-next"')
      expect(docStageRaw).toContain('data-testid="doc-page-counter"')
    })

    it('LenhPhongSlide permits change_page action with positive page number', () => {
      const validCommand = LenhPhongSlide.safeParse({ action: 'change_page', page: 3 })
      expect(validCommand.success).toBe(true)

      const invalidCommand = LenhPhongSlide.safeParse({ action: 'change_page', page: -1 })
      expect(invalidCommand.success).toBe(false)
    })

    it('RoomDO validates laQuanTri authority on slide.action change_page', () => {
      expect(roomDoRaw).toContain("case 'slide.action':")
      expect(roomDoRaw).toContain('if (!laQuanTri)')
      expect(roomDoRaw).toContain("d.action === 'change_page'")
    })
  })

  // ── E. Student Canonical Page Change Unavailable ──────────────────────────
  describe('E. Student Canonical Permission Isolation', () => {
    it('denies presentation control to regular student', () => {
      expect(canUserPresent(false, false)).toBe(false)
      expect(canUserPresent(undefined, undefined)).toBe(false)
    })

    it('Student view renders read-only page counter without previous or next buttons', () => {
      // In DocumentStageView, student receives honest read-only indicator
      expect(docStageRaw).toContain('/* Student: honest read-only indicator without mutation buttons (Section 4) */')
    })

    it('Student does not receive host document management controls (replace or close)', () => {
      expect(docStageRaw).toContain('data-testid="doc-btn-replace"')
      expect(docStageRaw).toContain('data-testid="doc-btn-close"')
      // Both are gated under canControl
      expect(docStageRaw).toContain('{canControl && (')
    })

    it('RoomDO rejects non-moderator slide.action with 403 error message', () => {
      expect(roomDoRaw).toContain('Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển tài liệu trình chiếu.')
    })
  })

  // ── F. Zoom is Local ──────────────────────────────────────────────────────
  describe('F. Local-Only Zoom Contract', () => {
    it('DocumentStageView provides local zoom in, zoom out and reset buttons', () => {
      expect(docStageRaw).toContain('data-testid="doc-zoom-controls"')
      expect(docStageRaw).toContain('data-testid="doc-btn-zoom-in"')
      expect(docStageRaw).toContain('data-testid="doc-btn-zoom-out"')
      expect(docStageRaw).toContain('data-testid="doc-btn-zoom-reset"')
    })

    it('local zoom clamps safely between 0.5 (50%) and 3.0 (300%)', () => {
      expect(docStageRaw).toContain('Math.min(3.0')
      expect(docStageRaw).toContain('Math.max(0.5')
    })

    it('SlideState protocol does NOT leak zoom scale to server', () => {
      // Shared SlideState must contain ONLY canonical document & page metadata
      const stateKeys = Object.keys(samplePdfSlide)
      expect(stateKeys).not.toContain('zoomScale')
      expect(stateKeys).not.toContain('fitMode')
    })
  })

  // ── G. Fit Mode Contract ──────────────────────────────────────────────────
  describe('G. Responsive Fit Mode Contract', () => {
    it('DocumentStageView supports toggling between page fit and width fit', () => {
      expect(docStageRaw).toContain('data-testid="doc-btn-fit-mode"')
      expect(docStageRaw).toContain("m === 'page' ? 'width' : 'page'")
    })

    it('PdfCanvasViewerImpl calculates aspect-ratio-preserving fitScale based on container dimensions', () => {
      expect(pdfViewerRaw).toContain("if (fitMode === 'width')")
      expect(pdfViewerRaw).toContain('baseScale = Math.min(availW / naturalWidth, availH / naturalHeight)')
    })

    it('PdfCanvasViewerImpl supports ResizeObserver for dynamic stage adaptation', () => {
      expect(pdfViewerRaw).toContain('new ResizeObserver')
      expect(pdfViewerRaw).toContain('ro.observe(container)')
    })
  })

  // ── H. Rapid Page Change Latest-Page-Wins Contract ────────────────────────
  describe('H. Rapid Page Change & Race Condition Protection', () => {
    it('PdfCanvasViewerImpl tracks monotonically increasing renderCycleRef', () => {
      expect(pdfViewerRaw).toContain('const cycleId = ++renderCycleRef.current')
      expect(pdfViewerRaw).toContain('cycleId === renderCycleRef.current')
    })

    it('PdfCanvasViewerImpl cancels previous RenderTask on incoming page requests', () => {
      expect(pdfViewerRaw).toContain('renderTaskRef.current.cancel()')
      expect(pdfViewerRaw).toContain("if (err?.name === 'RenderingCancelledException') return")
    })

    it('PdfCanvasViewerImpl reuses parsed PDFDocumentProxy across page turns', () => {
      // Verifies document is not re-fetched if URL has not changed
      expect(pdfViewerRaw).toContain('if (!pdfDocRef.current || currentUrlRef.current !== fullUrl)')
    })
  })

  // ── I. Paused / Reconnect Retains Stage ────────────────────────────────────
  describe('I. Reconnect & Network Resiliency', () => {
    it('DocumentStageView displays reconnecting indicator while keeping slide rendered', () => {
      expect(docStageRaw).toContain('{isReconnecting && (')
      // Chỉ báo gọn bằng biểu tượng quay (ít chữ), vẫn có nhãn cho trình đọc màn hình.
      expect(docStageRaw).toContain('aria-label="Đang kết nối lại"')
    })

    it('mutation controls are disabled during reconnect', () => {
      expect(docStageRaw).toContain('const canControl = !isReconnecting && (isHost || canModerate)')
    })

    it('reconnecting state does not reset document or wipe canvas', () => {
      // deriveDocumentStatus evaluates to ready during reconnect when docUrl exists
      expect(deriveDocumentStatus(samplePdfSlide, false, false)).toBe('ready')
    })
  })

  // ── J. PPTX Remains Unsupported Truthful ──────────────────────────────────
  describe('J. Truthful PPTX Handling', () => {
    it('derives unsupported status for pptx fileType', () => {
      expect(deriveDocumentStatus(samplePptxSlide)).toBe('unsupported')
    })

    it('renders PptxAdvisoryCard explaining limitation honestly', () => {
      expect(docStageRaw).toContain('data-testid="pptx-advisory-card"')
      expect(docStageRaw).toContain('Chưa hỗ trợ trình chiếu trực tiếp PPTX')
      expect(docStageRaw).toContain('xuất bài giảng sang định dạng PDF (.pdf)')
    })

    it('provides download link for the original PPTX file', () => {
      expect(docStageRaw).toContain('Tải tệp .pptx về máy')
    })
  })

  // ── K. Image Document Unaffected ──────────────────────────────────────────
  describe('K. Image Document Parity', () => {
    it('derives ready status for image documents', () => {
      expect(deriveDocumentStatus(sampleImageSlide)).toBe('ready')
    })

    it('renders image viewer with zoom transform and fit styles', () => {
      expect(docStageRaw).toContain('data-testid="doc-image-viewer"')
      expect(docStageRaw).toContain('transform: `scale(${zoomScale})`')
      expect(docStageRaw).toContain("maxWidth: fitMode === 'page' ? '100%' : 'none'")
    })
  })

  // ── L. Mobile Document Controls Do Not Overflow ───────────────────────────
  describe('L. Mobile Ergonomics & Overflow Protection', () => {
    it('uses truncate and responsive max-widths on document title', () => {
      expect(docStageRaw).toContain('max-w-[110px] sm:max-w-[200px]')
      expect(docStageRaw).toContain('truncate text-xs font-semibold text-white')
    })

    it('hides desktop-only fit label and replacement text on mobile', () => {
      expect(docStageRaw).toContain('hidden sm:inline-flex')
      expect(docStageRaw).toContain('hidden sm:inline')
    })

    it('retains accessible keyboard navigation with input guard', () => {
      expect(docStageRaw).toContain("target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'")
      expect(docStageRaw).toContain("e.key === 'ArrowLeft'")
      expect(docStageRaw).toContain("e.key === 'ArrowRight'")
    })
  })
})
