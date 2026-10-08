import { cn } from '@/lib/utils'
import { SO_MAY_CHON } from './thiet-lap'

/** Dãy chọn số rắn máy — dùng trong bảng PvE của ván và ở sảnh Rắn Săn Mồi. */
export function ChonSoMay({ soMay, onChon, className }: { soMay: number; onChon: (n: number) => void; className?: string }) {
  return (
    <div className={cn('grid grid-cols-6 gap-1', className)} role="group" aria-label="Số rắn máy" data-testid="chon-so-may">
      {SO_MAY_CHON.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={soMay === n}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChon(n)}
          className={cn(
            'flex h-8 min-h-8 max-h-8 items-center justify-center rounded-lg border-2 font-mono text-xs font-bold tabular-nums transition-colors duration-150 cursor-pointer select-none',
            soMay === n
              ? 'border-brand bg-brand/15 font-black text-brand shadow-xs'
              : 'border-border-default bg-surface/50 text-slate-400 hover:bg-surface-raised hover:text-white',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
