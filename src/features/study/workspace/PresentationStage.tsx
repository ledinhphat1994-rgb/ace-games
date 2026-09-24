// src/features/study/workspace/PresentationStage.tsx
// Digital Campus v2: Dominant Central Presentation Stage

import type { SlideState, MediaState, WhiteboardStroke } from '@shared/protocol/room'
import {
  Maximize2,
  Minimize2,
  MonitorPlay,
  PenTool,
} from 'lucide-react'
import { ChalkboardCanvas } from '../ChalkboardCanvas'
import { DocumentStageView } from './DocumentStageView'
import { EmbeddedVideoPlayer } from './EmbeddedVideoPlayer'
import type { WorkspaceMode } from './types'

export interface PresentationStageProps {
  mode: WorkspaceMode
  onSelectMode: (mode: WorkspaceMode) => void
  isHost: boolean
  canModerate?: boolean
  // Document props
  slideState?: SlideState | null
  onPageChange?: (newPage: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  // Video props
  mediaState?: MediaState | null
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  calculateTargetTime: () => number
  // Whiteboard props
  whiteboardStrokes: WhiteboardStroke[]
  selectedColor: string
  selectedSize: number
  isEraser: boolean
  onSendStroke: (stroke: Omit<WhiteboardStroke, 'epoch'> | WhiteboardStroke) => void
  // Stage container props
  isFullscreen: boolean
  onToggleFullscreen: () => void
  isReconnecting?: boolean
}


function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function PresentationStage({
  mode,
  onSelectMode: _onSelectMode,
  isHost,
  canModerate = false,
  slideState,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  mediaState,
  canControlMedia = true,
  volume,
  onVolumeChange,
  onSyncMedia,
  onOpenSearchQueue,
  calculateTargetTime,
  whiteboardStrokes,
  selectedColor,
  selectedSize,
  isEraser,
  onSendStroke,
  isFullscreen,
  onToggleFullscreen,
  isReconnecting = false,
}: PresentationStageProps) {
  const canControl = !isReconnecting && (isHost || canModerate)

  return (
    <section
      aria-label="Khu vực trình chiếu trung tâm"
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090e18] shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-0' : ''
      }`}
      data-testid="presentation-stage-container"
    >
      {/* ── MODE 1: IDLE STAGE ── */}
      {mode === 'idle' && (
        <div
          className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
          data-testid="stage-idle-view"
        >
          <div className="flex flex-col items-center max-w-sm space-y-3" data-testid="idle-stage-empty-view">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
              <MonitorPlay className="h-7 w-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Chưa có nội dung trình bày
            </h2>
          </div>
        </div>
      )}

      {/* ── MODE 2: DOCUMENT STAGE ── */}
      {mode === 'document' && (
        <DocumentStageView
          slideState={slideState}
          isHost={isHost}
          canModerate={canModerate}
          onPageChange={onPageChange}
          onUploadSlide={onUploadSlide}
          onCloseDoc={onCloseDoc}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
          isReconnecting={isReconnecting}
        />
      )}

      {/* ── MODE 3: VIDEO STAGE ── */}
      {mode === 'video' && (
        mediaState && mediaState.videoId ? (
          <EmbeddedVideoPlayer
            mediaState={mediaState}
            isHost={isHost}
            canModerate={canModerate}
            canControlMedia={canControlMedia}
            volume={volume}
            onVolumeChange={onVolumeChange}
            onSyncMedia={onSyncMedia}
            onOpenSearchQueue={onOpenSearchQueue}
            calculateTargetTime={calculateTargetTime}
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen}
            isReconnecting={isReconnecting}
          />
        ) : (
          <div
            className="flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-[#090d16]"
            data-testid="video-stage-empty"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-3 shadow-inner">
              <YoutubeIcon className="h-7 w-7" />
            </div>
            {canControl ? (
              <div className="space-y-3 max-w-sm">
                <div>
                  <h3 className="text-base font-bold text-white">Chọn video để bắt đầu phát</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Dán đường dẫn YouTube hoặc tìm kiếm bài giảng trực tiếp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenSearchQueue}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                  data-testid="stage-open-yt-cta"
                >
                  <YoutubeIcon className="h-3.5 w-3.5" />
                  <span>Tìm / Chèn Video YouTube</span>
                </button>
              </div>
            ) : (
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-white">Chưa có video đang phát</h3>
                <p className="text-xs text-slate-400">
                  Chờ chủ phòng hoặc giáo viên chọn video học tập.
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* ── MODE 4: WHITEBOARD STAGE ── */}
      {mode === 'whiteboard' && (
        <div className="relative h-full w-full overflow-hidden" data-testid="whiteboard-stage">
          {/* Whiteboard Top Toolbar */}
          <div className="absolute top-0 inset-x-0 h-10 flex items-center justify-between px-4 border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-20 select-none">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-white">Bảng phấn lớp học</span>
            </div>

            <div className="flex items-center gap-2">
              {onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Thu nhỏ stage' : 'Toàn màn hình stage'}
                >
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>

          <div className="h-full w-full pt-10">
            <ChalkboardCanvas
              strokes={whiteboardStrokes}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              isEraser={isEraser}
              onSendStroke={onSendStroke}
            />
          </div>
        </div>
      )}
    </section>
  )
}
