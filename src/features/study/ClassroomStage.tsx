import { useState } from 'react'
import { ChevronLeft, ChevronRight, PenTool, Sparkles, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

interface ClassroomStageProps {
  roomTitle?: string
  onUploadSlide: () => void
  onOpenYoutube: () => void
  onSwitchToChalk: () => void
}

export function ClassroomStage({
  roomTitle = 'Phòng Học Nhóm Lớp 10A7',
  onUploadSlide,
  onOpenYoutube,
  onSwitchToChalk,
}: ClassroomStageProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 12
  const [isMinimized, setIsMinimized] = useState(false)

  if (isMinimized) {
    return (
      <div className="absolute bottom-24 right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-950/90 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md hover:bg-slate-900 transition-all hover:scale-105"
        >
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Hiện Màn Chiếu Bài Giảng</span>
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 pointer-events-none z-[5] select-none">
      <div className="relative w-full max-w-4xl max-h-[82vh] rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950/90 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col ring-1 ring-emerald-500/20">
        {/* Stage Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              {roomTitle}
            </span>
            <span className="hidden sm:inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Bài giảng số hóa
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Page navigation */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-0.5 border border-white/10">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                title="Trang trước"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-mono font-bold text-emerald-300 px-1">
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                title="Trang sau"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Thu nhỏ màn chiếu (để viết bảng tự do)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Presentation Slide Display */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[420px] bg-[#0c1322] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <img
            src="/assets/classroom/study_slide_math.webp"
            alt="Study Slide Presentation"
            className="max-h-full max-w-full object-contain rounded-lg shadow-xl border border-white/10"
            onError={(e) => {
              // Fallback to placeholder if not loaded
              e.currentTarget.style.display = 'none'
            }}
          />

          {/* Floating subtle badge */}
          <div className="absolute bottom-3 left-4 hidden sm:flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-slate-300 backdrop-blur-md border border-white/10">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Chuyên đề: Toán học 10 · Khảo sát hàm số bậc hai</span>
          </div>
        </div>

        {/* Stage Bottom Action Prompt */}
        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">Bắt đầu bài học:</span>
            <span className="text-slate-400 hidden sm:inline">Bạn có thể trình chiếu slide riêng, viết bảng phấn hoặc chèn video YouTube.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUploadSlide}
              className="h-8 text-xs font-semibold gap-1.5 border-orange-500/40 text-orange-300 hover:bg-orange-500/20"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Tải Slide Riêng</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenYoutube}
              className="h-8 text-xs font-semibold gap-1.5 border-red-500/40 text-red-300 hover:bg-red-500/20"
            >
              <YoutubeIcon className="h-3.5 w-3.5" />
              <span>Video YouTube</span>
            </Button>

            <Button
              size="sm"
              onClick={onSwitchToChalk}
              className="h-8 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Viết Bảng Phấn</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
