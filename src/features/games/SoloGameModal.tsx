import { useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import { SoloGameStage, type SoloGameType } from './SoloGameStage'
import { GAME_CATALOG_BY_ID } from './game-catalog'

export type { SoloGameType }

interface SoloGameModalProps {
  gameType: SoloGameType
  onClose: () => void
}

// Hộp thoại chơi nhanh một trò đơn. Luồng chính từ sảnh mở trang riêng (SoloGamePage); hộp thoại này
// dùng chung khu chơi SoloGameStage để hai nơi luôn giống nhau.
export function SoloGameModal({ gameType, onClose }: SoloGameModalProps) {
  const luuDiem = useCallback(
    (score: number) => {
      void fetch('/api/game/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ gameType, score }),
      }).catch((err: unknown) => console.error('Lỗi lưu điểm:', err))
    },
    [gameType],
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(640px, calc(100svh - 88px))',
        }}
        className="w-[min(540px,calc(100vw-2rem))] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Arcade Schematic mờ chìm toàn diện */}
        <BlueprintArcadePattern className="opacity-80" />

        <DialogHeader className="relative z-10 pb-3 border-b border-sky-500/15">
          <DialogTitle className="text-lg font-bold text-white tracking-wide">
            {GAME_CATALOG_BY_ID[gameType].shortTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {GAME_CATALOG_BY_ID[gameType].shortTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-10 flex justify-center py-2 flex-1 overflow-y-auto">
          <SoloGameStage gameType={gameType} onSaveScore={luuDiem} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
