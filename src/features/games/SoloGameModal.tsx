import { useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{GAME_CATALOG_BY_ID[gameType].shortTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <SoloGameStage gameType={gameType} onSaveScore={luuDiem} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
