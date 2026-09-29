import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface QuickEmoteItem {
  id: string
  emoji: string
  label: string
  quote: string
  color?: string
}

export interface ActiveEmoteBubble {
  emoji: string
  quote: string
  sender?: 'player' | 'ai' | 'opponent'
  color?: string
}

export function GameOpponentBubble({
  bubble,
  theme = 'cyan',
  className,
}: {
  bubble?: ActiveEmoteBubble | null
  theme?: 'cyan' | 'amber' | 'red' | 'violet'
  className?: string
}) {
  if (!bubble) return null

  let borderClass = 'border-cyan-500/50 shadow-cyan-500/25'
  let labelClass = 'text-cyan-400'
  if (theme === 'red') {
    borderClass = 'border-red-500/50 shadow-red-500/25'
    labelClass = 'text-red-400'
  } else if (theme === 'amber') {
    borderClass = 'border-amber-500/50 shadow-amber-500/25'
    labelClass = 'text-amber-400'
  } else if (theme === 'violet') {
    borderClass = 'border-violet-500/50 shadow-violet-500/25'
    labelClass = 'text-violet-400'
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'w-[165px] xl:w-[185px] max-w-[calc(100%-8px)] p-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-3 duration-200 z-30 pointer-events-none bg-[#091322]/95 box-border',
        borderClass,
        className
      )}
    >
      <span className="text-xl animate-bounce shrink-0">{bubble.emoji}</span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn('text-[9px] font-black uppercase tracking-wider leading-none truncate', labelClass)}>
          {bubble.sender === 'ai' ? 'MÁY (AI)' : 'ĐỐI THỦ'}
        </span>
        <span className="text-[11px] font-bold text-white leading-tight mt-1 line-clamp-2 break-words">
          "{bubble.quote}"
        </span>
      </div>
    </div>
  )
}

interface GameQuickEmoteProps {
  /** Danh sách biểu cảm chọn nhanh (1 click là gửi ngay, không qua bước chọn nhóm) */
  emotes: QuickEmoteItem[]
  /** Callback gửi biểu cảm */
  onSend: (emote: QuickEmoteItem) => void
  /** Bong bóng thoại đang hiển thị của người chơi (VÙNG 1) */
  activeBubble?: ActiveEmoteBubble | null
  /** Tông màu chủ đạo cho viền / phát sáng */
  theme?: 'cyan' | 'amber' | 'red' | 'violet'
  /** Vị trí căn chỉnh popover */
  align?: 'end' | 'start' | 'center'
  /** Chế độ thu gọn để đặt trên thanh toolbar header */
  compact?: boolean
  className?: string
}

export function GameQuickEmote({
  emotes,
  onSend,
  activeBubble,
  theme = 'cyan',
  align = 'end',
  compact = false,
  className,
}: GameQuickEmoteProps) {
  const [isOpen, setIsOpen] = useState(false)

  let themeBorder = 'border-cyan-500/35 hover:border-cyan-400'
  let themeBg = 'bg-cyan-950/40 hover:bg-cyan-900/40'
  let themeText = 'text-cyan-300'
  let themeGlow = 'rgba(6,182,212,0.3)'

  let bubbleBorder = 'border-cyan-500/50 shadow-cyan-500/20'
  let bubbleText = 'text-cyan-400'
  let bubbleBg = 'bg-[#091322]/95'

  if (theme === 'amber') {
    themeBorder = 'border-amber-500/35 hover:border-amber-400'
    themeBg = 'bg-amber-950/40 hover:bg-amber-900/40'
    themeText = 'text-amber-300'
    themeGlow = 'rgba(245,158,11,0.3)'
    bubbleBorder = 'border-amber-500/50 shadow-amber-500/20'
    bubbleText = 'text-amber-400'
    bubbleBg = 'bg-[#181106]/95'
  } else if (theme === 'red') {
    themeBorder = 'border-red-500/35 hover:border-red-400'
    themeBg = 'bg-red-950/40 hover:bg-red-900/40'
    themeText = 'text-red-300'
    themeGlow = 'rgba(239,68,68,0.3)'
    bubbleBorder = 'border-red-500/50 shadow-red-500/20'
    bubbleText = 'text-red-400'
    bubbleBg = 'bg-[#180909]/95'
  } else if (theme === 'violet') {
    themeBorder = 'border-violet-500/35 hover:border-violet-400'
    themeBg = 'bg-violet-950/40 hover:bg-violet-900/40'
    themeText = 'text-violet-300'
    themeGlow = 'rgba(168,85,247,0.3)'
    bubbleBorder = 'border-violet-500/50 shadow-violet-500/20'
    bubbleText = 'text-violet-400'
    bubbleBg = 'bg-[#140b24]/95'
  }

  return (
    <div className={cn('relative flex flex-col items-center gap-2 select-none', className)}>
      {/* VÙNG 1: Bong bóng thoại nổi của Bạn (Người chơi) - xuất hiện ngay trên icon */}
      {activeBubble && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'w-[165px] xl:w-[185px] max-w-[calc(100%-8px)] p-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-2 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 z-30 pointer-events-none box-border',
            bubbleBorder,
            bubbleBg
          )}
        >
          <span className="text-xl animate-bounce shrink-0">{activeBubble.emoji}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className={cn('text-[9px] font-black uppercase tracking-wider leading-none truncate', bubbleText)}>
              BẠN
            </span>
            <span className="text-[11px] font-bold text-white leading-tight mt-1 line-clamp-2 break-words">
              "{activeBubble.quote}"
            </span>
          </div>
        </div>
      )}

      {/* VÙNG 2: Chỉ để icon tinh gọn - không để card - bấm là chọn nhanh ngay 1 bước */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            compact ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                title="Cảm xúc nhanh"
                aria-label="Mở danh sách cảm xúc nhanh"
                className={cn(
                  'h-8 gap-1.5 border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 shrink-0 px-2.5 cursor-pointer',
                  isOpen && 'bg-white/15 border-white/20 text-white',
                )}
              >
                <span className="text-sm leading-none select-none">
                  {isOpen ? '💬' : '😊'}
                </span>
                <span className="hidden min-[480px]:inline">Biểu cảm</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Cảm xúc nhanh"
                aria-label="Mở danh sách cảm xúc nhanh"
                className={cn(
                  'size-11 sm:size-12 rounded-full border shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer',
                  themeBorder,
                  themeBg,
                  themeText
                )}
                style={{
                  boxShadow: `0 0 16px ${themeGlow}, 0 4px 12px rgba(0,0,0,0.5)`,
                }}
              >
                <span className="text-xl sm:text-2xl leading-none select-none">
                  {isOpen ? '💬' : '😊'}
                </span>
              </Button>
            )
          }
        />

        <PopoverContent
          side={compact ? 'bottom' : 'top'}
          align={align}
          sideOffset={compact ? 6 : 10}
          className="w-[210px] xl:w-[225px] p-2.5 rounded-2xl border border-white/15 bg-gradient-to-b from-[#0e1628]/98 to-[#090f1e]/98 backdrop-blur-2xl shadow-2xl z-50 text-xs"
          style={{
            boxShadow: `0 0 24px ${themeGlow}, 0 12px 32px rgba(0,0,0,0.8)`,
          }}
        >
          {/* Tiêu đề ngắn gọn & nút đóng */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-white/10">
            <span className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
              <span>⚡</span>
              <span>Chọn nhanh cảm xúc</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              title="Đóng"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>

          {/* Danh sách chọn nhanh: 1 click là gửi ngay, không cần bước chọn nhóm */}
          <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-0.5">
            {emotes.map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => {
                  onSend(em)
                  setIsOpen(false)
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 min-h-9 rounded-xl border border-white/10 hover:border-white/30 bg-white/[0.03] hover:bg-white/[0.1] text-left transition-all duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform duration-150 shrink-0 select-none">
                  {em.emoji}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-white group-hover:text-cyan-300 leading-tight truncate">
                    {em.quote}
                  </span>
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-200 leading-tight mt-0.5">
                    {em.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
