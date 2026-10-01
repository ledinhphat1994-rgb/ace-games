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

  let borderClass = 'border-brand/40 shadow-brand/20'
  let labelClass = 'text-brand'
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
        'w-[165px] xl:w-[185px] max-w-[calc(100%-8px)] p-2.5 rounded-2xl border shadow-xl backdrop-blur-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-3 duration-200 z-30 pointer-events-none bg-surface-overlay/95 box-border',
        borderClass,
        className
      )}
    >
      <span className="text-xl animate-bounce shrink-0">{bubble.emoji}</span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn('text-[9px] font-black uppercase tracking-wider leading-none truncate', labelClass)}>
          {bubble.sender === 'ai' ? 'MÁY (AI)' : 'ĐỐI THỦ'}
        </span>
        <span className="text-[11px] font-bold text-text-primary leading-tight mt-1 line-clamp-2 break-words">
          "{bubble.quote}"
        </span>
      </div>
    </div>
  )
}

export function GamePlayerBubble({
  bubble,
  theme = 'cyan',
  className,
}: {
  bubble?: ActiveEmoteBubble | null
  theme?: 'cyan' | 'amber' | 'red' | 'violet'
  className?: string
}) {
  if (!bubble) return null

  let borderClass = 'border-brand/40 shadow-brand/20'
  let labelClass = 'text-brand'
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
        'w-[165px] xl:w-[185px] max-w-[calc(100%-8px)] p-2.5 rounded-2xl border shadow-xl backdrop-blur-xl flex items-start gap-2 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 z-30 pointer-events-none bg-surface-overlay/95 box-border',
        borderClass,
        className
      )}
    >
      <span className="text-xl animate-bounce shrink-0">{bubble.emoji}</span>
      <div className="flex flex-col min-w-0 flex-1">
        <span className={cn('text-[9px] font-black uppercase tracking-wider leading-none truncate', labelClass)}>
          BẠN
        </span>
        <span className="text-[11px] font-bold text-text-primary leading-tight mt-1 line-clamp-2 break-words">
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
  /** Bong bóng thoại đang hiển thị của người chơi (VÙNG 1+) */
  activeBubble?: ActiveEmoteBubble | null
  /** Tông màu chủ đạo cho viền / phát sáng */
  theme?: 'cyan' | 'amber' | 'red' | 'violet'
  /** Vị trí căn chỉnh popover */
  align?: 'end' | 'start' | 'center'
  /** Chế độ thu gọn để đặt trên thanh toolbar header (VÙNG 1) */
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

  let themeBorder = 'border-brand/30 hover:border-brand'
  let themeBg = 'bg-brand/10 hover:bg-brand/20'
  let themeText = 'text-brand'
  let themeGlow = 'rgba(198,161,90,0.3)'

  if (theme === 'amber') {
    themeBorder = 'border-amber-500/35 hover:border-amber-400'
    themeBg = 'bg-amber-950/40 hover:bg-amber-900/40'
    themeText = 'text-amber-300'
    themeGlow = 'rgba(245,158,11,0.3)'
  } else if (theme === 'red') {
    themeBorder = 'border-red-500/35 hover:border-red-400'
    themeBg = 'bg-red-950/40 hover:bg-red-900/40'
    themeText = 'text-red-300'
    themeGlow = 'rgba(239,68,68,0.3)'
  } else if (theme === 'violet') {
    themeBorder = 'border-violet-500/35 hover:border-violet-400'
    themeBg = 'bg-violet-950/40 hover:bg-violet-900/40'
    themeText = 'text-violet-300'
    themeGlow = 'rgba(168,85,247,0.3)'
  }

  return (
    <div className={cn('relative flex flex-col items-center gap-2 select-none', className)}>
      {/* VÙNG 1+: Bong bóng thoại của Bạn chỉ hiện khi không ở chế độ compact trên thanh toolbar */}
      {!compact && activeBubble && (
        <GamePlayerBubble bubble={activeBubble} theme={theme} />
      )}

      {/* VÙNG 1: Nút bấm chọn cảm xúc tinh gọn */}
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
                  'h-8 gap-1.5 border-border-default bg-surface hover:bg-surface-raised text-xs text-text-primary font-bold transition-all hover:scale-105 active:scale-95 shrink-0 px-2.5 cursor-pointer shadow-xs',
                  isOpen && 'bg-surface-raised border-border-strong text-text-primary shadow-sm',
                )}
              >
                <span className="text-sm leading-none select-none">
                  {isOpen ? '💬' : '😊'}
                </span>
                <span className="game-control-label">Biểu cảm</span>
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
          className="w-[210px] xl:w-[225px] p-2.5 rounded-2xl border border-border-default bg-surface-overlay/98 backdrop-blur-2xl shadow-2xl z-50 text-xs"
          style={{
            boxShadow: `0 0 24px ${themeGlow}, 0 12px 32px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Tiêu đề ngắn gọn & nút đóng */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border-subtle">
            <span className="text-xs font-black text-text-primary tracking-tight flex items-center gap-1.5">
              <span>⚡</span>
              <span>Chọn nhanh cảm xúc</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-5 rounded-full bg-surface-raised hover:bg-surface text-text-tertiary hover:text-text-primary flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
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
                className="flex items-center gap-2.5 px-2.5 py-2 min-h-9 rounded-xl border border-border-subtle hover:border-border-default bg-surface-raised/40 hover:bg-surface-raised text-left transition-all duration-150 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform duration-150 shrink-0 select-none">
                  {em.emoji}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-text-primary group-hover:text-brand leading-tight truncate">
                    {em.quote}
                  </span>
                  <span className="text-[9px] text-text-tertiary group-hover:text-text-secondary leading-tight mt-0.5">
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
