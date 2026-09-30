import { useState, useRef, useEffect } from 'react'
import { Flame, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import { CAP_DO_MAY } from '../cap-do-may'
import { ChonSoMay } from './ChonSoMay'
import { docThietLap, ghiThietLap, type ThietLapRan } from './thiet-lap'
import { GameQuickEmote, type QuickEmoteItem } from '../GameQuickEmote'

export type SnakeDifficulty = 'easy' | 'medium' | 'hard'

const DANH_SACH_THAI_DO_SNAKE: QuickEmoteItem[] = [
  { id: 'snake_boost', emoji: '⚡', label: 'Tăng tốc', quote: 'Tăng tốc vượt mặt nào! ⚡' },
  { id: 'snake_nom', emoji: '🧁', label: 'Ngon mắt', quote: 'Bánh ngọt này là của tôi! 🧁' },
  { id: 'snake_oops', emoji: '💥', label: 'Toang', quote: 'Suýt nữa thì đâm vào rào! 💥' },
  { id: 'snake_king', emoji: '👑', label: 'Top 1', quote: 'Đích đến là ngôi vương Top 1! 👑' },
  { id: 'snake_love', emoji: '❤️', label: 'Thả tim', quote: 'Chơi vui vẻ nhé bạn ơi! ❤️' },
  { id: 'snake_bye', emoji: '👋', label: 'Chào', quote: 'Chào toàn thể đấu trường rắn! 👋' },
]

interface SnakeDuelProps {
  onSaveScore?: (score: number) => void
  onBack?: () => void
  snakeTab?: 'duel' | 'classic'
  onTabChange?: (tab: 'duel' | 'classic') => void
}

export function SnakeDuel({ onSaveScore, onBack, onTabChange }: SnakeDuelProps) {
  // Thiết lập PvE / PvP nhớ theo thiết bị
  const [thietLap, setThietLap] = useState<ThietLapRan>(docThietLap)
  const [mode, setMode] = useState<PlayMode>('ai')
  const [restartKey, setRestartKey] = useState(0)
  const [playerEmote, setPlayerEmote] = useState<{ emoji: string; quote: string } | null>(null)

  const difficulty = thietLap.capDo
  const aiCount = thietLap.soMay
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  // Chỉ số người chơi
  const [playerScore, setPlayerScore] = useState(0)

  // Toàn màn hình (Fullscreen)
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleToggleFullscreen = () => {
    const el = fullscreenContainerRef.current
    if (!el) return

    if (isFullscreen) {
      if (document.fullscreenElement) void document.exitFullscreen?.()
      setIsFullscreen(false)
    } else if (el.requestFullscreen) {
      void el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true))
    } else {
      setIsFullscreen(true)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Thoát toàn màn hình bằng phím Esc hoặc nút Back trên điện thoại
  useEffect(() => {
    if (!isFullscreen) return

    try {
      window.history.pushState({ dc_snake_fullscreen: true }, '')
    } catch {}

    const handlePopState = () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
      setIsFullscreen(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {})
        }
        setIsFullscreen(false)
      }
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  // Đổi thiết lập: lưu ngay; đang chơi thì mở lại ván với thiết lập mới
  const doiThietLap = (moi: ThietLapRan) => {
    setThietLap(moi)
    ghiThietLap(moi)
    if (isRunning) handleStartGame()
  }

  const handleStartGame = () => {
    setIsGameOver(false)
    setIsRunning(true)
    setPlayerScore(0)
    setRestartKey((k) => k + 1)
  }

  const handleGameOver = (winner: boolean, _reason?: string, finalScore = playerScore) => {
    setIsRunning(false)
    setIsGameOver(true)
    if (winner) {
      playGameOverSound('win')
    } else {
      playGameOverSound('lose')
    }
    if (onSaveScore && finalScore > 0) {
      onSaveScore(finalScore)
    }
  }

  const handleQuickEmote = (em: QuickEmoteItem) => {
    setPlayerEmote({ emoji: em.emoji, quote: em.quote })
    setTimeout(() => setPlayerEmote(null), 3500)
  }

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        'flex flex-col items-center justify-between w-full h-full max-w-6xl mx-auto transition-all',
        isFullscreen && 'fixed inset-0 z-50 w-full h-dvh max-w-none p-2 bg-slate-950 justify-center overflow-hidden'
      )}
    >
      {/* ── 1. THANH CÔNG CỤ: cùng khung với các bàn cờ (Quay lại · tên game · chế độ · biểu cảm · toàn màn hình · chơi lại) — ẩn khi toàn màn hình ── */}
      {(
        <GamePlayToolbar
          onBack={onBack}
          title="Rắn Săn Mồi"
          icon={<Flame className="size-4 text-emerald-400" />}
          mode={mode}
          onModeChange={(m) => {
            setMode(m)
            handleStartGame()
          }}
          aiLevel={difficulty}
          onAiLevelChange={(capDo) => doiThietLap({ ...thietLap, capDo })}
          nhanChipPve={`${CAP_DO_MAY[difficulty].nhan} · ${aiCount}`}
          phuPve={
            <div className="mt-2.5 border-t border-white/10 pt-2.5">
              <p className="mb-1.5 px-1 text-[11px] font-bold text-text-tertiary">
                {mode === 'pass_and_play' ? 'Số rắn bot tham gia' : 'Số rắn máy'}
              </p>
              <ChonSoMay soMay={aiCount} onChon={(soMay) => doiThietLap({ ...thietLap, soMay })} />
            </div>
          }
          onReset={handleStartGame}
          phuPvp={
            <div className="space-y-1.5">
              <p className="px-1 text-[11px] font-bold text-text-tertiary">
                Số rắn bot tham gia cùng
              </p>
              <ChonSoMay soMay={aiCount} onChon={(soMay) => doiThietLap({ ...thietLap, soMay })} />
            </div>
          }
          nhanChipPvp={`${aiCount} Bot`}
          resetLabel={isGameOver ? 'Ván mới' : isRunning ? 'Chơi lại' : 'Bắt đầu'}
          resetIcon={isRunning || isGameOver ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
          resetNoiBat={!isRunning && !isGameOver}
          turnLabel=""
          activeSide="red"
          hideCenterTurn
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          rightSlot={
            <GameQuickEmote
              emotes={DANH_SACH_THAI_DO_SNAKE}
              onSend={handleQuickEmote}
              theme="cyan"
              compact={true}
            />
          }
          className="w-full shrink-0 px-1"
        />
      )}

      {onTabChange && !isFullscreen && (
        <div className="mb-2 flex w-full justify-center gap-2" role="group" aria-label="Chế độ Rắn săn mồi">
          <button type="button" aria-pressed="true" className="min-h-10 rounded-xl border border-emerald-400/30 bg-emerald-400/15 px-4 text-xs font-semibold text-emerald-300">Đối kháng</button>
          <button type="button" onClick={() => onTabChange('classic')} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-semibold text-slate-300">Cổ điển</button>
        </div>
      )}
      {/* ── 2. VÙNG 2: ĐẤU TRƯỜNG RẮN SĂN MỒI MỞ RỘNG 100% KHÔNG GIAN ── */}
      <div className={cn('relative flex items-center justify-center w-full flex-1 h-full min-h-0', !isFullscreen && 'my-auto py-1')}>
        <Wormate3DArena
          difficulty={difficulty}
          aiCount={aiCount}
          isRunning={isRunning}
          isGameOver={isGameOver}
          isFullscreen={isFullscreen}
          restartKey={restartKey}
          mode={mode === 'pass_and_play' ? 'pass_and_play' : 'ai'}
          playerEmote={playerEmote}
          onScoreUpdate={(s) => {
            setPlayerScore(s)
          }}
          onGameOver={handleGameOver}
          onStartGame={handleStartGame}
        />
      </div>
    </div>
  )
}
