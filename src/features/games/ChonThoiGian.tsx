import { useState } from 'react'
import { Clock, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ChonThoiGianProps {
  turnSeconds: number
  onTurnSecondsChange: (sec: number) => void
  timePresets?: readonly number[]
}

/** Nút popover chọn thời gian mỗi lượt nước đi trên thanh công cụ game (gồm mốc cố định & mốc tùy chỉnh) */
export function ChonThoiGian({ turnSeconds, onTurnSecondsChange, timePresets }: ChonThoiGianProps) {
  const [open, setOpen] = useState(false)
  const [customVal, setCustomVal] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const presets = timePresets || [15, 30, 60, 90, 120]
  const isCustomActive = !presets.includes(turnSeconds)

  const handleSelectPreset = (sec: number) => {
    onTurnSecondsChange(sec)
    setErrorMsg('')
    setOpen(false)
  }

  const handleApplyCustom = () => {
    const parsed = parseInt(customVal.trim(), 10)
    if (isNaN(parsed) || parsed < 10 || parsed > 300) {
      setErrorMsg('Nhập từ 10 đến 300 giây')
      return
    }
    onTurnSecondsChange(parsed)
    setErrorMsg('')
    setCustomVal('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 border-border-default bg-surface hover:bg-surface-raised px-2 text-xs font-semibold text-text-primary transition-all active:scale-95 shrink-0 cursor-pointer shadow-xs"
            title="Thời gian mỗi lượt"
            aria-label="Cài đặt thời gian mỗi lượt"
          />
        }
      >
        <Clock className="size-3.5 text-brand" />
        <span className="font-mono text-[11px] font-bold">
          {turnSeconds}s{isCustomActive ? ' (tùy chỉnh)' : ''}
        </span>
        <ChevronDown className="size-3 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={6}
        className="w-56 p-3 bg-surface-raised border border-border-default shadow-xl rounded-xl z-50 select-none"
      >
        {/* Mốc thời gian cố định */}
        <div className="text-[11px] font-semibold text-text-secondary mb-1.5 px-0.5">
          Mốc thời gian cố định
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {presets.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => handleSelectPreset(sec)}
              className={cn(
                'px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border',
                turnSeconds === sec
                  ? 'bg-brand/15 text-brand border-brand/40 shadow-xs'
                  : 'bg-surface hover:bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary',
              )}
            >
              {sec}s
            </button>
          ))}
        </div>

        {/* Mốc thời gian tùy chỉnh */}
        <div className="mt-3 pt-2.5 border-t border-border-subtle">
          <div className="text-[11px] font-semibold text-text-secondary mb-1.5 px-0.5">
            Thời gian tùy chỉnh
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={10}
              max={300}
              placeholder={`${turnSeconds}s`}
              value={customVal}
              onChange={(e) => {
                setCustomVal(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyCustom()
                }
              }}
              className="flex-1 h-7 px-2 rounded-lg bg-surface border border-border-default text-xs font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-brand [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleApplyCustom}
              className="h-7 px-2.5 text-xs font-semibold gap-1 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Check className="size-3" />
              <span>Lưu</span>
            </Button>
          </div>
          {errorMsg && (
            <div className="text-[10px] text-rose-400 mt-1 px-0.5">{errorMsg}</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
