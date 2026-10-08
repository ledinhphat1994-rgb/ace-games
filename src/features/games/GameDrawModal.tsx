import { Handshake } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
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
      btn: 'skeuo-btn-cta-amber',
    },
    cyan: {
      iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
      btn: 'skeuo-btn-cta-cyan',
    },
    violet: {
      iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
      btn: 'skeuo-btn-cta-amber',
    },
  }[theme]

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent
        data-testid="game-draw-modal"
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(380px, calc(100svh - 88px))',
        }}
        className="w-[min(380px,calc(100vw-2rem))] p-5 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Arcade Schematic mờ chìm toàn diện */}
        <BlueprintArcadePattern className="opacity-80" />

        <DialogHeader className="relative z-10 space-y-1.5 text-center">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/15">
            <DialogTitle className="text-sm font-black uppercase tracking-wider text-white">
              {isOffer ? 'Đề nghị hòa' : 'Đối thủ xin hòa'}
            </DialogTitle>
          </div>

          <div className="space-y-3 pt-2 text-left">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'size-10 rounded-xl border flex items-center justify-center shrink-0 shadow-inner',
                  themeColors.iconBg,
                )}
              >
                <Handshake className="size-5" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {isOffer
                  ? 'Xác nhận gửi yêu cầu đề nghị hòa cờ cho đối thủ?'
                  : 'Đối thủ gửi lời mời hòa cờ, bạn có chấp nhận kết thúc ván hòa không?'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-sky-500/15">
              <button
                type="button"
                onClick={() => {
                  if (onDecline) {
                    onDecline()
                  } else {
                    onClose()
                  }
                }}
                className="skeuo-btn-cancel h-9 text-xs font-semibold cursor-pointer"
              >
                {isOffer ? 'Hủy bỏ' : 'Từ chối'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={cn(
                  'h-9 text-xs font-bold cursor-pointer',
                  themeColors.btn,
                )}
              >
                {isOffer ? 'Đồng ý' : 'Chấp nhận'}
              </button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
