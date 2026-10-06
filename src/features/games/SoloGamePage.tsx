import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SoloGameStage, type SoloGameType } from './SoloGameStage'

interface SoloGamePageProps {
  gameType: SoloGameType
  onLeave: () => void
  initialTurnSeconds?: number
}

export function SoloGamePage({ gameType, onLeave, initialTurnSeconds }: SoloGamePageProps) {
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
    <div className="game-stage flex min-w-0 w-full flex-col rounded-3xl border border-border-default bg-surface/95 backdrop-blur-2xl p-2.5 sm:p-4 shadow-2xl">
      <SoloGameStage
        gameType={gameType}
        onBack={onLeave}
        onSaveScore={(score) => void luuDiem(score)}
        onSnakeSettled={lamMoiBangXepHang}
        initialTurnSeconds={initialTurnSeconds}
      />
    </div>
  )
}
