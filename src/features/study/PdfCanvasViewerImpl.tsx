import { AlertTriangle, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useEffect, useRef, useState } from 'react'
import type { PdfCanvasViewerProps } from './PdfCanvasViewer'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

/**
  * Digital Campus v2: Milestone PQA-C2
  * Authoritative & High-DPI Responsive PDF.js Canvas Presentation Renderer.
  *
  * Features:
  * - Crisp Retina/HiDPI devicePixelRatio rasterization.
  * - Local responsive fitting (fit-page vs fit-width) & continuous zoom.
  * - Anti-flicker: retains previous page on canvas while loading next page.
  * - Cancellation & latest-request-wins race condition protection.
  * - Document instance caching across page flips (no re-fetching/re-parsing).
  * - Exposes `data-rendered-page` on <canvas> ONLY after pixel paint finishes.
  */
export function PdfCanvasViewerImpl({
  docUrl,
  pageNumber,
  onLoadSuccess,
  onError,
  onLoadingChange,
  zoomScale = 1.0,
  fitMode = 'page',
  children,
}: PdfCanvasViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [renderedPage, setRenderedPage] = useState<number | null>(null)

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const currentUrlRef = useRef<string>('')
  const renderCycleRef = useRef<number>(0)
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  const onLoadSuccessRef = useRef(onLoadSuccess)
  const onErrorRef = useRef(onError)
  const onLoadingChangeRef = useRef(onLoadingChange)

  useEffect(() => {
    onLoadSuccessRef.current = onLoadSuccess
    onErrorRef.current = onError
    onLoadingChangeRef.current = onLoadingChange
  })

  // 1. Observe container resize for responsive re-fitting
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setContainerSize({
      width: container.clientWidth || 800,
      height: container.clientHeight || 600,
    })

    if (typeof ResizeObserver === 'undefined') return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const cr = entry.contentRect
      if (cr.width <= 0 || cr.height <= 0) return

      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        setContainerSize({
          width: Math.round(cr.width),
          height: Math.round(cr.height),
        })
      }, 120)
    })

    ro.observe(container)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      ro.disconnect()
    }
  }, [])

  // 2. Render effect: triggers on document URL, pageNumber, zoomScale, fitMode, or container size change
  useEffect(() => {
    let cancelled = false
    const cycleId = ++renderCycleRef.current

    const fullUrl =
      docUrl.startsWith('/') && typeof window !== 'undefined'
        ? `${window.location.origin}${docUrl}`
        : docUrl

    const renderPdf = async () => {
      setLoading(true)
      onLoadingChangeRef.current?.(true)
      setErrorMsg(null)

      try {
        // Load document if new URL or not yet loaded
        if (!pdfDocRef.current || currentUrlRef.current !== fullUrl) {
          if (pdfDocRef.current) {
            try {
              void pdfDocRef.current.destroy()
            } catch {}
            pdfDocRef.current = null
          }
          const loadingTask = pdfjsLib.getDocument({
            url: fullUrl,
            withCredentials: true,
          })
          const doc = await loadingTask.promise
          if (cancelled || cycleId !== renderCycleRef.current) return
          pdfDocRef.current = doc
          currentUrlRef.current = fullUrl
          onLoadSuccessRef.current?.(doc.numPages)
        }

        const doc = pdfDocRef.current
        if (!doc) return

        const clampedPage = Math.min(Math.max(1, pageNumber), doc.numPages)
        const page = await doc.getPage(clampedPage)
        if (cancelled || cycleId !== renderCycleRef.current) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Cancel previous task if one is still in flight
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {}
          renderTaskRef.current = null
        }

        // Measure natural page dimensions (72 DPI points)
        const unscaledViewport = page.getViewport({ scale: 1.0 })
        const naturalWidth = unscaledViewport.width
        const naturalHeight = unscaledViewport.height

        // Calculate fitting scale to container
        const contW = containerSize.width || containerRef.current?.clientWidth || 800
        const contH = containerSize.height || containerRef.current?.clientHeight || 600

        const padX = 24
        const padY = 24
        const availW = Math.max(100, contW - padX)
        const availH = Math.max(100, contH - padY)

        let baseScale = 1.0
        if (fitMode === 'width') {
          baseScale = availW / naturalWidth
        } else {
          // 'page' mode: preserve full aspect ratio within available dimensions
          baseScale = Math.min(availW / naturalWidth, availH / naturalHeight)
        }
        if (!Number.isFinite(baseScale) || baseScale <= 0) baseScale = 1.0

        const zoom = Math.max(0.5, Math.min(3.0, zoomScale || 1.0))
        const displayScale = baseScale * zoom
        const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
        const renderScale = displayScale * dpr

        // PDF.js rasterization viewport at physical device pixels
        const viewport = page.getViewport({ scale: renderScale })

        // Canvas internal pixel buffer size
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        // Canvas CSS layout size
        const cssWidth = Math.floor(viewport.width / dpr)
        const cssHeight = Math.floor(viewport.height / dpr)
        canvas.style.width = `${cssWidth}px`
        canvas.style.height = `${cssHeight}px`

        const task = page.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = task

        // Await paint completion
        await task.promise

        if (!cancelled && cycleId === renderCycleRef.current) {
          setRenderedPage(clampedPage)
          setLoading(false)
          onLoadingChangeRef.current?.(false)
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return
        if (!cancelled && cycleId === renderCycleRef.current) {
          console.error('Lỗi hiển thị PDF canvas:', err)
          const msg = err?.message || 'Không thể tải PDF'
          setErrorMsg(msg)
          onErrorRef.current?.(err)
          setLoading(false)
          onLoadingChangeRef.current?.(false)
        }
      }
    }

    void renderPdf()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch {}
        renderTaskRef.current = null
      }
    }
  }, [docUrl, pageNumber, zoomScale, fitMode, containerSize])

  // Cleanup on complete unmount
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        try {
          void pdfDocRef.current.destroy()
        } catch {}
        pdfDocRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center h-full w-full overflow-auto bg-[#0a0f18] p-3 select-none"
      data-testid="rendered-pdf-page"
      data-page={pageNumber}
    >
      {/* Subtle non-blocking page-flip loading indicator */}
      {loading && renderedPage !== null && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-cyan-300 shadow-xl backdrop-blur-md border border-white/10 z-20 pointer-events-none transition-opacity animate-in fade-in"
          data-testid="pdf-loading-indicator"
        >
          <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
          <span>Đang tải trang {pageNumber}...</span>
        </div>
      )}

      {/* Initial load centered overlay */}
      {loading && renderedPage === null && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f18] text-xs text-slate-300 z-10"
          data-testid="pdf-initial-loading"
        >
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mb-2" />
          <span>Đang tải trang {pageNumber}...</span>
        </div>
      )}

      {errorMsg ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2" data-testid="doc-page-error">
          <AlertTriangle className="h-8 w-8 text-amber-400 opacity-90" />
          <p className="text-xs font-semibold text-slate-200">Không thể tải trang PDF</p>
          <p className="text-[11px] text-slate-500 max-w-[280px]">{errorMsg}</p>
        </div>
      ) : (
        <div className="relative inline-flex items-center justify-center m-auto transition-transform duration-100 ease-out">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full object-contain shadow-2xl rounded border border-white/10 bg-white"
            data-rendered-page={renderedPage ?? ''}
          />
          {children}
        </div>
      )}
    </div>
  )
}
