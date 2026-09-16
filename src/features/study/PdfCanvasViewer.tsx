import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'

// Lazy-load the heavy PDF.js engine so it doesn't inflate the main bundle.
// The actual implementation is in PdfCanvasViewerImpl.
const PdfCanvasViewerImpl = lazy(() =>
  import('./PdfCanvasViewerImpl').then((m) => ({ default: m.PdfCanvasViewerImpl }))
)

export interface PdfCanvasViewerProps {
  docUrl: string
  pageNumber: number
  onLoadSuccess?: (numPages: number) => void
  onError?: (error: Error) => void
}

/** Thin wrapper — defers the PDF.js bundle until first render */
export function PdfCanvasViewer(props: PdfCanvasViewerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full w-full bg-[#0a0f18] text-xs text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2 text-cyan-400" />
          Đang tải trình chiếu...
        </div>
      }
    >
      <PdfCanvasViewerImpl {...props} />
    </Suspense>
  )
}
