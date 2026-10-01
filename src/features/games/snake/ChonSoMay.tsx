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
          onClick={() => onChon(n)}
          className={cn(
            'flex items-center justify-center rounded-lg border py-1.5 font-mono text-xs font-bold tabular-nums transition-all cursor-pointer',
            soMay === n
              ? 'border-brand/40 bg-brand/15 font-black text-brand shadow-sm'
              : 'border-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
