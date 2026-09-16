import { AlertTriangle, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useEffect, useRef, useState } from 'react'

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
}

interface PdfCanvasViewerProps {
  docUrl: string
  pageNumber: number
  onLoadSuccess?: (numPages: number) => void
  onError?: (error: Error) => void
}

export function PdfCanvasViewer({ docUrl, pageNumber, onLoadSuccess, onError }: PdfCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const currentUrlRef = useRef<string>('')
  const onLoadSuccessRef = useRef(onLoadSuccess)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onLoadSuccessRef.current = onLoadSuccess
    onErrorRef.current = onError
  })

  useEffect(() => {
    let cancelled = false

    const fullUrl = docUrl.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${docUrl}`
      : docUrl

    const renderPdf = async () => {
      setLoading(true)
      setErrorMsg(null)
      try {
        if (!pdfDocRef.current || currentUrlRef.current !== fullUrl) {
          const loadingTask = pdfjsLib.getDocument(fullUrl)
          const doc = await loadingTask.promise
          if (cancelled) return
          pdfDocRef.current = doc
          currentUrlRef.current = fullUrl
          onLoadSuccessRef.current?.(doc.numPages)
        }

        const doc = pdfDocRef.current
        const clampedPage = Math.min(Math.max(1, pageNumber), doc.numPages)
        const page = await doc.getPage(clampedPage)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel()
          } catch {}
          renderTaskRef.current = null
        }

        const viewport = page.getViewport({ scale: 1.5 })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: ctx,
          viewport,
        }
        const task = page.render(renderContext)
        renderTaskRef.current = task
        await task.promise
        if (!cancelled) {
          setLoading(false)
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return
        if (!cancelled) {
          console.error('Lỗi hiển thị PDF canvas:', err)
          const msg = err?.message || 'Không thể tải PDF'
          setErrorMsg(msg)
          onErrorRef.current?.(err)
          setLoading(false)
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
  }, [docUrl, pageNumber])

  return (
    <div
      className="relative flex items-center justify-center h-full w-full overflow-auto bg-[#0a0f18] p-2"
      data-testid="rendered-pdf-page"
      data-page={pageNumber}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 text-xs text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-cyan-400" /> Đang tải trang {pageNumber}...
        </div>
      )}
      {errorMsg ? (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
          <AlertTriangle className="h-8 w-8 text-amber-400 opacity-90" />
          <p className="text-xs font-semibold text-slate-200">Không thể tải trang PDF</p>
          <p className="text-[11px] text-slate-500 max-w-[280px]">{errorMsg}</p>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="max-h-full max-w-full object-contain shadow-2xl rounded border border-white/5"
        />
      )}
    </div>
  )
}
