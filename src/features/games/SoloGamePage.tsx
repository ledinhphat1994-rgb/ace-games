import { useCallback } from 'react'
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
    <div className="w-full">
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] items-stretch w-full">
        {/* Cột 1 (Trái): Bảng xếp hạng */}
        <div className="min-w-0 order-2 lg:order-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
          <GameArenaLeaderboard defaultGame={gameType} className="h-full" />
        </div>

        {/* Cột 2 (Trung tâm): Khung trò chơi */}
        <div className="min-w-0 order-1 lg:order-2 h-[700px] xl:h-[720px] 2xl:h-[740px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0d1424]/75 to-[#070b14]/75 backdrop-blur-md shadow-2xl p-2.5 sm:p-3.5 flex flex-col items-center justify-between overflow-hidden">
          <SoloGameStage
            gameType={gameType}
            onBack={onLeave}
            onSaveScore={(s) => void luuDiem(s)}
            onSnakeSettled={lamMoiBangXepHang}
          />
        </div>

        {/* Cột 3 (Phải): Khung Chat & Bạn bè */}
        <div className="min-w-0 order-3 lg:col-span-2 xl:col-span-1 h-[700px] xl:h-[720px] 2xl:h-[740px]">
          <GameSocialSidebar
            roomId={`solo_${gameType}`}
            roomName={gameType === 'solo_snake' ? 'Phòng Rắn Săn Mồi' : 'Phòng Lật Thẻ Trí Nhớ'}
            userRole="player"
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
