import { MemoryGame } from './memory/MemoryGame'
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

export function SoloGameStage({ gameType, onBack, onSaveScore }: SoloGameStageProps) {
  if (gameType === 'solo_memory') {
    return <MemoryGame onSaveScore={onSaveScore} onBack={onBack} />
  }

  // Rắn săn mồi hiện đại: Hỗ trợ 100% PvE, PvP + PvE, hoặc 100% PvP
  return (
    <SnakeDuel
      onSaveScore={onSaveScore}
      onBack={onBack}
    />
  )
}
