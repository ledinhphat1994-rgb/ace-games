import { Handshake } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface GameDrawModalProps {
  open: boolean
  onClose: () => void
  type: 'offer' | 'incoming'
  onConfirm: () => void
  onDecline?: () => void
  theme?: 'amber' | 'cyan' | 'violet'
}

export function GameDrawModal({
  open,
  onClose,
  type,
  onConfirm,
  onDecline,
  theme = 'amber',
}: GameDrawModalProps) {
  const isOffer = type === 'offer'

  const themeColors = {
    amber: {
      iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      btn: 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-amber-500/20',
      border: 'border-amber-500/30',
    },
    cyan: {
      iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
      btn: 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-bold shadow-cyan-500/20',
      border: 'border-cyan-500/30',
    },
    violet: {
      iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
      btn: 'bg-violet-500 hover:bg-violet-400 text-white font-bold shadow-violet-500/20',
      border: 'border-violet-500/30',
    },
  }[theme]

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        data-testid="game-draw-modal"
        className={cn(
          'w-[calc(100vw-2rem)] max-w-sm rounded-2xl border bg-surface/95 backdrop-blur-xl p-5 shadow-2xl text-text-primary overflow-hidden',
          themeColors.border,
        )}
      >
        <DialogHeader className="flex flex-col items-center text-center gap-2">
          <div
            className={cn(
              'size-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner',
              themeColors.iconBg,
            )}
          >
            <Handshake className="size-6" />
          </div>
          <DialogTitle className="text-base font-bold text-text-primary tracking-tight">
            {isOffer ? 'Đề nghị hòa' : 'Đối thủ xin hòa'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border-subtle mt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (onDecline) {
                onDecline()
              } else {
                onClose()
              }
            }}
            className="flex-1 h-9 rounded-xl text-xs font-semibold border-border-default hover:bg-surface-raised cursor-pointer transition-colors duration-150"
          >
            {isOffer ? 'Hủy' : 'Từ chối'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              'flex-1 h-9 rounded-xl text-xs font-bold cursor-pointer transition-colors duration-150 shadow-md',
              themeColors.btn,
            )}
          >
            {isOffer ? 'Đồng ý' : 'Chấp nhận'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
