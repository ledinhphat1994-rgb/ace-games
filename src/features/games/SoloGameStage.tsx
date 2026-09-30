import { useState } from 'react'
import { ArrowLeft, Flame, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  // Rắn săn mồi: Tab đối kháng (PvE / PvP) hoặc Tab Cổ điển xác thực máy chủ
  if (snakeTab === 'classic') {
    return (
      <div className="flex flex-col items-center justify-between w-full h-full max-w-5xl mx-auto">
        <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Quay lại sảnh"
              className="h-8 gap-1.5 text-xs text-text-secondary hover:text-white"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Quay lại sảnh</span>
            </Button>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="size-7 sm:size-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
                <ShieldCheck className="size-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-wide uppercase bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">
                  Rắn Cổ Điển
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  CLASSIC
                </span>
              </div>
            </div>
          </div>

          <div className="flex rounded-xl bg-slate-900/80 p-0.5 border border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSnakeTab('duel')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-slate-400 hover:text-slate-200 transition-all text-xs"
            >
              <Flame className="size-3.5" />
              Đối Kháng
            </button>
            <button
              type="button"
              onClick={() => setSnakeTab('classic')}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm font-semibold transition-all text-xs"
            >
              <ShieldCheck className="size-3.5" />
              Cổ Điển
            </button>
          </div>

          <div className="hidden w-16 xl:block" />
        </div>
        <div className="my-auto flex w-full min-w-0 flex-col items-center justify-center py-3">
          <SnakeDeluxe onSettled={onSnakeSettled} />
        </div>
      </div>
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
