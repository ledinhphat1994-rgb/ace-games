import { useState } from 'react'
import { ChevronLeft, ChevronRight, PenTool, Sparkles, Upload, X, Presentation, MonitorPlay } from 'lucide-react'
import type { SlideState } from '../../../shared/protocol/room'
import { deriveStageState, type DerivedStageState } from './classroom-stage-state'

export { deriveStageState, type DerivedStageState }

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export interface ClassroomStageProps {
  roomTitle?: string
  slideState?: SlideState | null
  onPageChange?: (newPage: number) => void
  onUploadSlide: () => void
  onOpenYoutube: () => void
  onSwitchToChalk: () => void
}

export function ClassroomStage({
  roomTitle = 'Phòng Học Trực Tuyến',
  slideState = null,
  onPageChange,
  onUploadSlide,
  onOpenYoutube,
  onSwitchToChalk,
}: ClassroomStageProps) {
  const [isMinimized, setIsMinimized] = useState(false)
  const stage = deriveStageState(slideState)

  if (isMinimized) {
    return (
      <div className="absolute bottom-24 right-6 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-950/90 px-3.5 py-2 text-xs font-bold text-emerald-300 shadow-2xl backdrop-blur-md hover:bg-slate-900 transition-all hover:scale-105 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>Hiện Màn Chiếu Phòng Học</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-3 sm:p-6 pointer-events-none z-[5] select-none"
      data-testid="classroom-stage"
    >
      <div className="relative w-full max-w-4xl max-h-[82vh] rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950/90 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col ring-1 ring-emerald-500/20">
        {/* Stage Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white truncate" data-testid="classroom-room-title">
              {roomTitle}
            </span>
            {stage.hasActivePresentation ? (
              <span className="hidden sm:inline-block rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 truncate max-w-[200px]" data-testid="active-presentation-docname">
                {stage.docName}
              </span>
            ) : (
              <span className="hidden sm:inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                Sẵn sàng trình chiếu
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Only render page navigation when there is an active multi-page presentation */}
            {stage.hasActivePresentation && stage.totalPages && stage.totalPages > 1 && (
              <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-0.5 border border-white/10" data-testid="slide-page-nav">
                <button
                  type="button"
                  disabled={stage.currentPage! <= 1}
                  onClick={() => onPageChange?.(Math.max(1, stage.currentPage! - 1))}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-mono font-bold text-emerald-300 px-1" data-testid="slide-page-counter">
                  {stage.currentPage}/{stage.totalPages}
                </span>
                <button
                  type="button"
                  disabled={stage.currentPage! >= stage.totalPages}
                  onClick={() => onPageChange?.(Math.min(stage.totalPages!, stage.currentPage! + 1))}
                  className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Trang sau"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Thu nhỏ màn chiếu (để viết bảng tự do)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center Presentation Display: Real document when active, premium empty state when idle */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[420px] bg-[#0c1322] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {stage.hasActivePresentation && stage.docUrl ? (
            <div className="relative h-full w-full flex items-center justify-center" data-testid="live-slide-content">
              {stage.fileType === 'image' ? (
                <img
                  src={stage.docUrl}
                  alt={stage.docName || 'Bài giảng'}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xl border border-white/10"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl bg-slate-900/80 border border-white/10 text-center">
                  <Presentation className="h-12 w-12 text-emerald-400" />
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">{stage.docName}</h3>
                    <p className="text-xs text-slate-400 mt-1">Trang {stage.currentPage} trên tổng số {stage.totalPages} trang</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Premium Empty State: No fictional lessons, no fake 1/12, no masquerading artwork */
            <div
              className="flex flex-col items-center justify-center text-center max-w-md p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-3"
              data-testid="classroom-empty-stage"
            >
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <MonitorPlay className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  {stage.emptyState.title}
                </h3>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  {stage.emptyState.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stage Bottom Action Prompt with real interactive buttons */}
        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">Bắt đầu buổi học:</span>
            <span className="text-slate-400 hidden sm:inline">
              Chọn một trong các công cụ hỗ trợ học tập trực quan:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUploadSlide}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-orange-500/40 bg-transparent text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-all cursor-pointer"
              data-testid="stage-btn-upload"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Tải Slide</span>
            </button>

            <button
              type="button"
              onClick={onOpenYoutube}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-red-500/40 bg-transparent text-xs font-semibold text-red-300 hover:bg-red-500/20 transition-all cursor-pointer"
              data-testid="stage-btn-youtube"
            >
              <YoutubeIcon className="h-3.5 w-3.5" />
              <span>YouTube</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToChalk}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              data-testid="stage-btn-chalkboard"
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Viết Bảng Phấn</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
