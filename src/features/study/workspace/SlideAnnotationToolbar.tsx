// src/features/study/workspace/SlideAnnotationToolbar.tsx
// Digital Campus v2: Milestone PQA-C3 — Minimal Floating Annotation Toolbar

import { ChevronDown, ChevronUp, Highlighter, MousePointer2, Pen, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { AnnotationTool } from './SlideAnnotationLayer'
import { ANNOTATION_COLORS } from './types'

interface SlideAnnotationToolbarProps {
  canAnnotate: boolean
  activeTool: AnnotationTool
  onSelectTool: (tool: AnnotationTool) => void
  selectedColor: string
  onSelectColor: (color: string) => void
  onClearPage: () => void
  hasPageStrokes?: boolean
}

export function SlideAnnotationToolbar({
  canAnnotate,
  activeTool,
  onSelectTool,
  selectedColor,
  onSelectColor,
  onClearPage,
  hasPageStrokes = false,
}: SlideAnnotationToolbarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Students do not get mutation or drawing toolbar (PQA-C3 permission truth)
  if (!canAnnotate) {
    return null
  }

  if (isCollapsed) {
    return (
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-200"
        data-testid="slide-annotation-toolbar-collapsed"
      >
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white px-3 py-1.5 text-xs font-semibold shadow-xl border border-white/10 backdrop-blur-md transition-all cursor-pointer ring-1 ring-white/5"
          title="Mở thanh công cụ chú thích"
          data-testid="btn-expand-annotation-toolbar"
        >
          <Pen className="h-3.5 w-3.5 text-orange-400" />
          <span>Chú thích & Laser</span>
          <ChevronUp className="h-3 w-3 text-slate-400" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 max-w-[92vw] transition-all duration-200 select-none"
      data-testid="slide-annotation-toolbar"
    >
      <div className="flex items-center gap-1 rounded-2xl bg-slate-950/90 px-2 py-1.5 shadow-2xl border border-white/10 backdrop-blur-md">
        {/* Tool: Normal Pointer / Select */}
        <button
          type="button"
          onClick={() => onSelectTool('pointer')}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'pointer'
              ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Con trỏ bình thường"
          aria-label="Con trỏ chuột"
          data-testid="tool-btn-pointer"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>

        {/* Tool: Pen */}
        <button
          type="button"
          onClick={() => onSelectTool('pen')}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'pen'
              ? 'bg-orange-500/30 text-orange-300 shadow-sm ring-1 ring-orange-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Bút vẽ"
          aria-label="Bút vẽ"
          data-testid="tool-btn-pen"
        >
          <Pen className="h-4 w-4" />
        </button>

        {/* Tool: Highlighter */}
        <button
          type="button"
          onClick={() => onSelectTool('highlighter')}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'highlighter'
              ? 'bg-yellow-500/30 text-yellow-300 shadow-sm ring-1 ring-yellow-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Bút dạ quang (Highlighter)"
          aria-label="Bút dạ quang"
          data-testid="tool-btn-highlighter"
        >
          <Highlighter className="h-4 w-4" />
        </button>

        {/* Tool: Laser Pointer */}
        <button
          type="button"
          onClick={() => onSelectTool('laser')}
          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
            activeTool === 'laser'
              ? 'bg-red-500/30 text-red-300 shadow-sm ring-1 ring-red-500/40 animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="Con trỏ Laser"
          aria-label="Con trỏ laser"
          data-testid="tool-btn-laser"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Color Palette (Visible when Pen or Highlighter is active) */}
        {(activeTool === 'pen' || activeTool === 'highlighter') && (
          <div className="flex items-center gap-1 px-1.5 border-l border-r border-white/10 mx-0.5" data-testid="annotation-color-palette">
            {ANNOTATION_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onSelectColor(c.value)}
                className={`h-4.5 w-4.5 rounded-full transition-transform cursor-pointer ${
                  selectedColor === c.value ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
                aria-label={`Màu ${c.name}`}
              />
            ))}
          </div>
        )}

        {/* Clear Page Annotations */}
        <button
          type="button"
          disabled={!hasPageStrokes}
          onClick={onClearPage}
          className="p-1.5 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          title="Xóa chú thích trang này"
          aria-label="Xóa chú thích"
          data-testid="tool-btn-clear"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ml-0.5"
          title="Thu nhỏ thanh công cụ"
          aria-label="Thu nhỏ"
          data-testid="btn-collapse-annotation-toolbar"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
