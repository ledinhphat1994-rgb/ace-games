import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SoloGameStage, type SoloGameType } from './SoloGameStage'

interface SoloGamePageProps {
  gameType: SoloGameType
  roomId?: string
  myActorKey?: string
  myActorName?: string
  onLeave: () => void
  initialTurnSeconds?: number
}

export function SoloGamePage({
  gameType,
  roomId,
  myActorKey,
  myActorName,
  onLeave,
  initialTurnSeconds,
}: SoloGamePageProps) {
  const queryClient = useQueryClient()

  const lamMoiBangXepHang = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['game-highscores', gameType] })
  }, [queryClient, gameType])

  const luuDiem = useCallback(
    async (score: number) => {
      try {
        await fetch('/api/game/highscore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ gameType, score }),
        })
      } catch (err) {
        console.error('Lỗi lưu điểm:', err)
      } finally {
        lamMoiBangXepHang()
      }
    },
    [gameType, lamMoiBangXepHang],
  )

  return (
    <div className="game-stage flex min-w-0 w-full flex-1 h-full min-h-0 flex-col rounded-2xl border border-border-default bg-slate-950 p-1.5 sm:p-2 shadow-xl landscape:p-1 landscape:rounded-xl overflow-hidden">
      <SoloGameStage
        gameType={gameType}
        roomId={roomId}
        myActorKey={myActorKey}
        myActorName={myActorName}
        onBack={onLeave}
        onSaveScore={(score) => void luuDiem(score)}
        onSnakeSettled={lamMoiBangXepHang}
        initialTurnSeconds={initialTurnSeconds}
      />
    </div>
  )
}
