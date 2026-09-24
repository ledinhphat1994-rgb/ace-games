// src/features/study/workspace/ClassroomToolDock.tsx
// Digital Campus v2: Compact Presentation & Content Toolbar

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { SlideState, MediaState } from '@shared/protocol/room'
import {
  Calculator as CalcIcon,
  Clock,
  Eraser,
  FileText,
  MoreHorizontal,
  PenTool,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import type { WorkspaceMode } from './types'

export interface ClassroomToolDockProps {
  mode: WorkspaceMode
  onSelectMode: (mode: WorkspaceMode) => void
  isHost: boolean
  canModerate?: boolean
  slideState?: SlideState | null
  mediaState?: MediaState | null
  // Whiteboard contextual tools
  selectedColor: string
  onSelectColor: (color: string) => void
  selectedSize: number
  onSelectSize: (size: number) => void
  isEraser: boolean
  onToggleEraser: () => void
  onClearWhiteboard: () => void
  // Secondary tools triggers
  onOpenCalculator: () => void
  onOpenSessionPanel: () => void
  isReconnecting?: boolean
}

const CHALK_COLORS = [
  { name: 'Trắng', color: '#FFFFFF' },
  { name: 'Vàng', color: '#FEF08A' },
  { name: 'Xanh lam', color: '#67E8F9' },
  { name: 'Hồng', color: '#F472B6' },
  { name: 'Lục nhạt', color: '#86EFAC' },
  { name: 'Cam', color: '#FDBA74' },
]

const CHALK_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 6 },
  { label: 'L', size: 12 },
  { label: 'XL', size: 22 },
]

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function ClassroomToolDock({
  mode,
  onSelectMode,
  isHost,
  canModerate = false,
  slideState,
  mediaState,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  isEraser,
  onToggleEraser,
  onClearWhiteboard,
  onOpenCalculator,
  onOpenSessionPanel,
  isReconnecting = false,
}: ClassroomToolDockProps) {
  const [showColorPopover, setShowColorPopover] = useState(false)
  const [showSizePopover, setShowSizePopover] = useState(false)
  const [showToolsPopover, setShowToolsPopover] = useState(false)

  const canControl = !isReconnecting && (isHost || canModerate)

  return (
    <nav
      aria-label="Thanh công cụ trình chiếu"
      className="flex items-center justify-center p-2 z-30 select-none"
      data-testid="classroom-tool-dock"
    >
      <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-slate-950/90 px-3 py-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
        {/* ── 1. PRIMARY STAGE MODE SELECTORS ── */}
        <div className="flex items-center gap-1">
          {/* Document Button */}
          <button
            type="button"
            onClick={() => onSelectMode('document')}
            className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'document'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            data-testid="dock-btn-document"
            title="Trình chiếu tài liệu / Slide"
          >
            <FileText className="h-4 w-4 text-orange-400" />
            <span>Tài liệu</span>
            {slideState?.docUrl && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            )}
          </button>

          {/* Whiteboard Button */}
          <button
            type="button"
            onClick={() => onSelectMode('whiteboard')}
            className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'whiteboard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            data-testid="dock-btn-whiteboard"
            title="Bảng trắng viết phấn"
          >
            <PenTool className="h-4 w-4 text-emerald-400" />
            <span>Bảng trắng</span>
          </button>

          {/* Video Button */}
          <button
            type="button"
            onClick={() => onSelectMode('video')}
            className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all cursor-pointer ${
              mode === 'video'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            data-testid="dock-btn-video"
            title="Video YouTube cùng xem"
          >
            <YoutubeIcon className="h-4 w-4 text-red-500" />
            <span>Video</span>
            {mediaState?.videoId && mediaState.status === 'playing' && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ── 2. CONTEXTUAL WHITEBOARD CONTROLS (Only when whiteboard is active) ── */}
        {mode === 'whiteboard' && (
          <>
            <div className="mx-1 h-5 w-px bg-white/15" />

            <div className="flex items-center gap-1" data-testid="whiteboard-contextual-controls">
              {/* Color picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowColorPopover((v) => !v)
                    setShowSizePopover(false)
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Màu phấn"
                  aria-label="Chọn màu phấn vẽ"
                >
                  <span
                    className="h-4 w-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="hidden sm:inline text-[11px]">Màu</span>
                </button>

                {showColorPopover && (
                  <div className="absolute bottom-full left-0 mb-3 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-2xl z-50">
                    {CHALK_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => {
                          onSelectColor(c.color)
                          setShowColorPopover(false)
                        }}
                        style={{ backgroundColor: c.color }}
                        className={`h-6 w-6 rounded-full transition-all cursor-pointer ${
                          !isEraser && selectedColor === c.color
                            ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-950'
                            : 'opacity-70 hover:opacity-100 hover:scale-110'
                        }`}
                        title={c.name}
                        aria-label={`Màu ${c.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Size picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSizePopover((v) => !v)
                    setShowColorPopover(false)
                  }}
                  className="flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cỡ nét phấn"
                  aria-label="Chọn cỡ nét vẽ"
                >
                  <PenTool className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold">Nét</span>
                </button>

                {showSizePopover && (
                  <div className="absolute bottom-full left-0 mb-3 flex items-center gap-1 rounded-2xl border border-white/15 bg-slate-950/95 p-1.5 shadow-2xl backdrop-blur-2xl z-50">
                    {CHALK_SIZES.map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => {
                          onSelectSize(s.size)
                          setShowSizePopover(false)
                        }}
                        className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all cursor-pointer ${
                          !isEraser && selectedSize === s.size
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="rounded-full bg-current inline-block"
                          style={{ width: Math.max(3, Math.min(8, s.size)), height: Math.max(3, Math.min(8, s.size)) }}
                        />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Eraser */}
              <button
                type="button"
                onClick={onToggleEraser}
                className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  isEraser
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                title="Tẩy nét vẽ"
                aria-pressed={isEraser}
              >
                <Eraser className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tẩy</span>
              </button>

              {/* Clear board (Host only) */}
              {canControl && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nét vẽ trên bảng đen không?')) {
                      onClearWhiteboard()
                    }
                  }}
                  className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                  title="Xóa toàn bộ bảng vẽ"
                  aria-label="Xóa toàn bộ bảng vẽ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </>
        )}

        <div className="mx-1 h-5 w-px bg-white/15" />

        {/* ── 3. SECONDARY TOOLS POPOVER ── */}
        <Popover open={showToolsPopover} onOpenChange={setShowToolsPopover}>
          <PopoverTrigger
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            title="Công cụ hỗ trợ học tập"
            data-testid="dock-btn-secondary-tools"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Công cụ</span>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="top"
            sideOffset={10}
            className="w-56 rounded-2xl border border-white/15 bg-slate-950/95 p-2 text-slate-200 backdrop-blur-2xl shadow-2xl space-y-1"
          >
            <button
              type="button"
              onClick={() => {
                onOpenCalculator()
                setShowToolsPopover(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <CalcIcon className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>Máy tính khoa học FX</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenSessionPanel()
                setShowToolsPopover(false)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer text-left"
            >
              <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Phiên học & Mục tiêu</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
