import { useState } from 'react'
import { MemoryGame } from './memory/MemoryGame'
import { SnakeDeluxe } from './snake/SnakeDeluxe'
import { SnakeDuel } from './snake/SnakeDuel'

export type SoloGameType = 'solo_memory' | 'solo_snake'

interface SoloGameStageProps {
  gameType: SoloGameType
  onBack?: () => void
  /** Lưu kỷ lục cho Trí nhớ / Rắn. */
  onSaveScore: (score: number) => void
  /** Gọi khi máy chủ đã chấm xong một ván Rắn săn mồi (để làm mới bảng xếp hạng). */
  onSnakeSettled?: () => void
}

export function SoloGameStage({ gameType, onBack, onSaveScore, onSnakeSettled }: SoloGameStageProps) {
  const [snakeTab, setSnakeTab] = useState<'duel' | 'classic'>('duel')

  if (gameType === 'solo_memory') {
    return <MemoryGame onSaveScore={onSaveScore} onBack={onBack} />
  }

  // Rắn săn mồi: Tab đối kháng hoặc Tab Cổ điển xác thực máy chủ
  if (snakeTab === 'classic') {
    return (
      <SnakeDeluxe
        onBack={onBack}
        snakeTab={snakeTab}
        onTabChange={setSnakeTab}
        onSettled={onSnakeSettled}
      />
    )
  }

  return (
    <SnakeDuel
      onSaveScore={onSaveScore}
      onBack={onBack}
      snakeTab={snakeTab}
      onTabChange={setSnakeTab}
    />
  )
}
