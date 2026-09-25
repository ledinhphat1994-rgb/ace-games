import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { GameLeaderboard } from './GameLeaderboard'
import { GameScreenHeader } from './GameScreenHeader'
import { SoloGameStage, type SoloGameType } from './SoloGameStage'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface SoloGamePageProps {
  gameType: SoloGameType
  onLeave: () => void
}

// Trò chơi đơn chạy hoàn toàn ở trình duyệt (Rắn săn mồi được máy chủ chấm lại điểm) — không mở bàn
// WebSocket như trò đối kháng. Trang gồm khu chơi ở giữa và bảng xếp hạng thật của đúng trò đó.
export function SoloGamePage({ gameType, onLeave }: SoloGamePageProps) {
  const queryClient = useQueryClient()
  const info = GAME_CATALOG_BY_ID[gameType]
  const laRan = gameType === 'solo_snake'

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
    <div className="flex min-h-svh flex-col bg-background text-text-primary">
      <GameScreenHeader title={info.shortTitle} subtitle={`Chơi đơn · ${info.subtitle}`} onBack={onLeave} backLabel="Về sảnh Game" />

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section aria-label={`Khu chơi ${info.shortTitle}`} className="flex min-w-0 justify-center">
          <SoloGameStage gameType={gameType} onSaveScore={(s) => void luuDiem(s)} onSnakeSettled={lamMoiBangXepHang} />
        </section>

        <aside className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start lg:grid-cols-1 lg:self-start">
          <section className="rounded-2xl border border-border-subtle bg-surface p-4">
            <GameLeaderboard gameType={gameType} verifiedOnly={laRan} limit={10} />
            {!laRan && (
              <p className="mt-3 flex items-start gap-2 border-t border-border-subtle pt-3 text-xs leading-relaxed text-text-tertiary">
                <Info className="mt-px size-3.5 shrink-0" />
                Điểm trò này do trình duyệt gửi lên, máy chủ chưa chấm lại — dùng để tham khảo.
              </p>
            )}
          </section>
          <section className="rounded-2xl border border-border-subtle bg-surface p-4">
            <h2 className="text-sm font-semibold text-text-primary">Cách chơi</h2>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-text-secondary">{info.description}</p>
          </section>
        </aside>
      </main>
    </div>
  )
}
