import { useCallback } from 'react'
import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
import { useQueryClient } from '@tanstack/react-query'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameSocialSidebar } from './GameSocialSidebar'
import { SoloGameStage, type SoloGameType } from './SoloGameStage'

interface SoloGamePageProps {
  gameType: SoloGameType
  onLeave: () => void
}

// Bố cục đồng bộ chuẩn Game Arena 3 cột: Cột 1 (Bảng xếp hạng) - Cột 2 (Khung trò chơi) - Cột 3 (Cột chat)
export function SoloGamePage({ gameType, onLeave }: SoloGamePageProps) {
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
    <ResponsiveActivityLayout
      bubbleBottomOffset={gameType === 'solo_snake' ? 224 : undefined}
      leaderboard={<GameArenaLeaderboard defaultGame={gameType} />}
      social={<GameSocialSidebar roomId={`solo_${gameType}`} roomName={gameType === 'solo_snake' ? 'Phòng Rắn Săn Mồi' : 'Phòng Lật Thẻ Trí Nhớ'} userRole="player" />}
    >
      <div className="game-stage flex min-w-0 w-full flex-col rounded-2xl border border-border-default bg-surface p-2 sm:p-3.5">
        <SoloGameStage gameType={gameType} onBack={onLeave} onSaveScore={(score) => void luuDiem(score)} onSnakeSettled={lamMoiBangXepHang} />
      </div>
    </ResponsiveActivityLayout>
  )
}
