import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'

/** Bàn phím ảo 4 hướng — chỉ hiện trên thiết bị cảm ứng; máy tính dùng phím mũi tên. */
export function DPad({ onDir }: { onDir: (d: 'up' | 'down' | 'left' | 'right') => void }) {
  const nut = 'flex size-12 items-center justify-center rounded-xl border border-border-default bg-surface text-text-secondary transition-colors active:bg-surface-overlay active:text-text-primary'
  return (
    <>
      <div className="hidden flex-col items-center gap-1.5 pointer-coarse:flex">
        <button type="button" className={nut} onClick={() => onDir('up')} aria-label="Lên">
          <ArrowUp className="size-5" />
        </button>
        <div className="flex gap-1.5">
          <button type="button" className={nut} onClick={() => onDir('left')} aria-label="Trái">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" className={nut} onClick={() => onDir('down')} aria-label="Xuống">
            <ArrowDown className="size-5" />
          </button>
          <button type="button" className={nut} onClick={() => onDir('right')} aria-label="Phải">
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
      <p className="text-xs text-text-tertiary pointer-coarse:hidden">Dùng phím mũi tên ← ↑ → ↓ để chơi.</p>
    </>
  )
}
