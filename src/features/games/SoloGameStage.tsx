import { MemoryGame } from './memory/MemoryGame'
import { SnakeDuel } from './snake/SnakeDuel'

export type SoloGameType = 'solo_memory' | 'solo_snake'

interface SoloGameStageProps {
  gameType: SoloGameType
  roomId?: string
  myActorKey?: string
  myActorName?: string
  onBack?: () => void
  /** Lưu kỷ lục cho Trí nhớ / Rắn. */
  onSaveScore: (score: number) => void
  /** Gọi khi máy chủ đã chấm xong một ván Rắn săn mồi (để làm mới bảng xếp hạng). */
  onSnakeSettled?: () => void
  initialTurnSeconds?: number
}

export function SoloGameStage({
  gameType,
  roomId,
  myActorKey,
  myActorName,
  onBack,
  onSaveScore,
  initialTurnSeconds,
}: SoloGameStageProps) {
  if (gameType === 'solo_memory') {
    return <MemoryGame onSaveScore={onSaveScore} onBack={onBack} initialTurnSeconds={initialTurnSeconds} />
  }

  // Rắn săn mồi: Mặc định PvE tự thay thế bot khi có người chơi vào, PvP đối kháng thuần người chơi
  return (
    <SnakeDuel
      roomId={roomId}
      myActorKey={myActorKey}
      myActorName={myActorName}
      onSaveScore={onSaveScore}
      onBack={onBack}
    />
  )
}
