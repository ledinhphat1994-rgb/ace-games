import React from 'react'
import { cn } from '@/lib/utils'

export interface GameStatusWidgetProps {
  /** Icon hoặc emoji trung tâm */
  icon: React.ReactNode
  /** Nhãn trạng thái chính: LƯỢT BẠN, CHIẾU TƯỚNG!, BẠN THẮNG... */
  label: string
  /** Mô tả phụ: Đặt quân X, Bạn 3 - 2 Máy AI... */
  subLabel?: string
  /** Có phải lượt của người chơi không */
  isPlayerTurn?: boolean
  /** Máy AI đang suy nghĩ */
  isAiThinking?: boolean
  /** Ván đấu kết thúc */
  isGameOver?: boolean
  /** Kết quả thắng/thua (null nếu chưa kết thúc hoặc hòa) */
  isWinner?: boolean | null
  /** Đang bị chiếu tướng (Cờ vua / Cờ tướng) */
  isCheck?: boolean
  /** Tông màu chủ đạo */
  theme?: 'cyan' | 'amber' | 'red' | 'violet'
  className?: string
}

export function GameStatusWidget({
  icon,
  label,
  subLabel,
  isPlayerTurn = true,
  isAiThinking = false,
  isGameOver = false,
  isWinner = null,
  isCheck = false,
  theme = 'cyan',
  className,
}: GameStatusWidgetProps) {
  // Xác định màu sắc động theo trạng thái
  let mainColor = '#c6a15a'
  let glowColor = 'rgba(198,161,90,0.35)'
  let bgColor = 'rgba(198,161,90,0.12)'
  let borderColor = 'rgba(198,161,90,0.45)'

  if (isGameOver) {
    if (isWinner === true) {
      mainColor = '#10b981'
      glowColor = 'rgba(16,185,129,0.5)'
      bgColor = 'rgba(16,185,129,0.18)'
      borderColor = 'rgba(16,185,129,0.6)'
    } else if (isWinner === false) {
      mainColor = '#f43f5e'
      glowColor = 'rgba(244,63,94,0.5)'
      bgColor = 'rgba(244,63,94,0.18)'
      borderColor = 'rgba(244,63,94,0.6)'
    } else {
      mainColor = '#eab308'
      glowColor = 'rgba(234,179,8,0.5)'
      bgColor = 'rgba(234,179,8,0.18)'
      borderColor = 'rgba(234,179,8,0.6)'
    }
  } else if (isCheck) {
    mainColor = '#ef4444'
    glowColor = 'rgba(239,68,68,0.6)'
    bgColor = 'rgba(239,68,68,0.22)'
    borderColor = 'rgba(239,68,68,0.7)'
  } else if (isAiThinking) {
    mainColor = '#38bdf8'
    glowColor = 'rgba(56,189,248,0.45)'
    bgColor = 'rgba(56,189,248,0.15)'
    borderColor = 'rgba(56,189,248,0.5)'
  } else {
    // Theo theme
    if (theme === 'amber') {
      mainColor = '#f59e0b'
      glowColor = 'rgba(245,158,11,0.4)'
      bgColor = 'rgba(245,158,11,0.15)'
      borderColor = 'rgba(245,158,11,0.5)'
    } else if (theme === 'red') {
      mainColor = '#ef4444'
      glowColor = 'rgba(239,68,68,0.4)'
      bgColor = 'rgba(239,68,68,0.15)'
      borderColor = 'rgba(239,68,68,0.5)'
    } else if (theme === 'violet') {
      mainColor = '#a855f7'
      glowColor = 'rgba(168,85,247,0.4)'
      bgColor = 'rgba(168,85,247,0.15)'
      borderColor = 'rgba(168,85,247,0.5)'
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center gap-2.5 animate-in duration-200 select-none text-center', className)}
    >
      {/* Vòng tròn Avatar phát quang */}
      <div className="relative flex shrink-0 items-center justify-center size-16">
        {/* Vòng ping lan tỏa khi kết thúc ván hoặc chiếu tướng */}
        {(isGameOver || isCheck) && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ border: `2px solid ${mainColor}` }}
          />
        )}

        {/* Vòng quay khi AI suy nghĩ */}
        {isAiThinking && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed border-brand/40 animate-spin"
              style={{ animationDuration: '3s' }}
            />
            <div
              className="absolute inset-1.5 rounded-full border border-brand/30 animate-ping"
              style={{ animationDuration: '2s' }}
            />
          </>
        )}

        {/* Ping nhẹ khi tới lượt người chơi */}
        {!isGameOver && !isCheck && !isAiThinking && isPlayerTurn && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-25"
            style={{ border: `1.5px solid ${mainColor}` }}
          />
        )}

        {/* Khối tròn trung tâm chứa Icon / Emoji */}
        <div
          className={cn(
            'rounded-full flex items-center justify-center transition-all duration-200',
            isGameOver || isCheck ? 'size-14 shadow-xl' : 'size-12 shadow-lg'
          )}
          style={{
            background: bgColor,
            border: `1.5px solid ${borderColor}`,
            boxShadow: `0 0 20px ${glowColor}, inset 0 0 12px ${bgColor}`,
          }}
        >
          {typeof icon === 'string' ? (
            <span className={cn('leading-none select-none', isGameOver ? 'text-3xl' : 'text-2xl')}>
              {icon}
            </span>
          ) : (
            <div className={cn('flex items-center justify-center', isGameOver ? 'scale-115' : 'scale-100')}>
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Thông tin nhãn trạng thái chính & phụ */}
      <div className="flex flex-col items-center gap-0.5 min-w-0">
        <span
          className={cn(
            'font-black tracking-widest uppercase leading-none truncate max-w-[170px]',
            isGameOver || isCheck ? 'text-base' : 'text-sm'
          )}
          style={{
            color: mainColor,
            textShadow: `0 0 16px ${glowColor}`,
          }}
        >
          {label}
        </span>

        {/* Phụ đề: AI bouncing dots hoặc text mô tả */}
        <div className="h-5 flex items-center justify-center">
          {isAiThinking ? (
            <div className="flex gap-1.5 items-center">
              {[0, 150, 300].map((delay, i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full animate-bounce"
                  style={{ backgroundColor: mainColor, animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          ) : (
            subLabel && (
              <span className="text-[10px] text-slate-400 font-medium leading-tight max-w-[170px] truncate">
                {subLabel}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  )
}
