import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Bot, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/web-experience'
import { toast } from 'sonner'
import type { CapDoMay } from './cap-do-may'

export interface AiDifficultyHoldMenuProps {
  isOpen: boolean
  onClose: () => void
  anchorRect?: { top: number; left: number; right: number; bottom: number } | null
  currentLevel: CapDoMay
  onSelectLevel: (level: CapDoMay) => void
  gameTitle?: string
}

const AI_LEVEL_ITEMS: Array<{
  id: CapDoMay
  name: string
  colorDot: string
  activeBorder: string
  activeBg: string
  activeText: string
}> = [
  {
    id: 'easy',
    name: 'Dễ',
    colorDot: 'bg-emerald-400',
    activeBorder: 'border-emerald-500',
    activeBg: 'bg-emerald-500/20',
    activeText: 'text-emerald-300',
  },
  {
    id: 'medium',
    name: 'Vừa',
    colorDot: 'bg-amber-400',
    activeBorder: 'border-amber-500',
    activeBg: 'bg-amber-500/20',
    activeText: 'text-amber-300',
  },
  {
    id: 'hard',
    name: 'Khó',
    colorDot: 'bg-rose-500',
    activeBorder: 'border-rose-500',
    activeBg: 'bg-rose-500/20',
    activeText: 'text-rose-300',
  },
]

export function AiDifficultyHoldMenu({
  isOpen,
  onClose,
  anchorRect,
  currentLevel,
  onSelectLevel,
  gameTitle,
}: AiDifficultyHoldMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  // Tính vị trí menu hiển thị phía trên icon bot (mobile bottom bar) hoặc fallback căn giữa an toàn
  let stylePosition: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    bottom: '88px',
    transform: 'translateX(-50%)',
    zIndex: 90,
  }

  if (anchorRect) {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const menuWidth = 220
    const centerX = anchorRect.left + (anchorRect.right - anchorRect.left) / 2
    const clampedLeft = Math.max(12, Math.min(screenWidth - menuWidth - 12, centerX - menuWidth / 2))

    // Ưu tiên hiển thị phía trên nút nếu ở nửa dưới màn hình
    if (anchorRect.bottom > screenHeight / 2) {
      stylePosition = {
        position: 'fixed',
        left: `${clampedLeft}px`,
        bottom: `${screenHeight - anchorRect.top + 10}px`,
        zIndex: 90,
      }
    } else {
      stylePosition = {
        position: 'fixed',
        left: `${clampedLeft}px`,
        top: `${anchorRect.bottom + 10}px`,
        zIndex: 90,
      }
    }
  }

  return createPortal(
    <>
      {/* Lớp phủ trong suốt bắt sự kiện click bên ngoài để đóng menu (Rule 11 Transparent backdrop) */}
      <div
        className="fixed inset-0 z-[89] bg-transparent select-none"
        onClick={onClose}
        onPointerDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />

      <div
        ref={menuRef}
        id="ai-difficulty-hold-popup"
        style={stylePosition}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-[220px] p-3 rounded-2xl bg-[#141824]/98 border border-amber-400/40 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150 select-none shrink-0 pointer-events-auto"
      >
        {/* Header menu */}
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
            <Bot className="size-4" />
            <span>Mức độ AI{gameTitle ? ` · ${gameTitle}` : ''}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Danh sách 3 mức độ AI */}
        <div className="flex flex-col gap-1.5">
          {AI_LEVEL_ITEMS.map((item) => {
            const isSelected = currentLevel === item.id
            return (
              <button
                key={item.id}
                type="button"
                id={`ai-level-btn-${item.id}`}
                onClick={() => {
                  triggerHaptic('selection')
                  onSelectLevel(item.id)
                  toast.info(`Đã chọn mức độ AI: ${item.name}`)
                  onClose()
                }}
                className={cn(
                  'w-full px-3 py-2 rounded-xl border-2 flex items-center justify-between transition-colors duration-150 cursor-pointer text-xs font-semibold',
                  isSelected
                    ? `${item.activeBorder} ${item.activeBg} ${item.activeText} shadow-md`
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn('size-2 rounded-full shrink-0', item.colorDot)} />
                  <span className="font-bold">{item.name}</span>
                </div>
                <div
                  className={cn(
                    'size-4 rounded-full flex items-center justify-center',
                    isSelected ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  <Check className="size-3 stroke-[3]" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </>,
    document.body
  )
}
