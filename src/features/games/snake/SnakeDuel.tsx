import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  Flame,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Swords,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'

export type SnakeDifficulty = 'easy' | 'medium' | 'hard'

interface SnakeDuelProps {
  onSaveScore?: (score: number) => void
  onBack?: () => void
  snakeTab?: 'duel' | 'classic'
  onTabChange?: (tab: 'duel' | 'classic') => void
}

export function SnakeDuel({ onSaveScore, onBack }: SnakeDuelProps) {
  const [playMode, setPlayMode] = useState<'ai' | 'pass_and_play'>('ai')
  const [difficulty, setDifficulty] = useState<SnakeDifficulty>('medium')
  const [aiCount, setAiCount] = useState<number>(6)
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

    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {
        toast.error('Trình duyệt không cho phép chuyển chế độ toàn màn hình')
      })
    } else {
      document.exitFullscreen?.().catch(() => {})
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

  const handleStartGame = () => {
    setIsGameOver(false)
    setIsRunning(true)
    setPlayerScore(0)
  }

  const handleGameOver = (winner: boolean, reason: string) => {
    setIsRunning(false)
    setIsGameOver(true)
    if (winner) {
      playGameOverSound('win')
    } else {
      playGameOverSound('lose')
    }
    toast.info(reason)
    if (onSaveScore && playerScore > 0) {
      onSaveScore(playerScore)
    }
  }

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        'flex flex-col items-center justify-between w-full h-full max-w-6xl mx-auto transition-all',
        isFullscreen && 'fixed inset-0 z-50 w-screen h-screen max-w-none p-0 bg-slate-950 justify-center overflow-hidden'
      )}
    >
      {/* ── 1. THANH ĐIỀU KHIỂN CHÍNH: Ẩn khi Toàn màn hình (Nhấn Esc hoặc Back để trở lại) ── */}
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full py-1.5 px-1 shrink-0">
        {/* Nút quay lại sảnh & Tiêu đề game: Chỉ ghi Rắn Săn Mồi cân đối, nổi bật */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1.5 font-bold border-white/10 hover:bg-white/5 text-xs text-text-secondary hover:text-white h-8 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Quay lại sảnh</span>
            </Button>
          )}

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2 shrink-0">
            <div className="size-7 sm:size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shadow-sm">
              <Flame className="size-4 text-emerald-400" />
            </div>
            <span className="text-sm sm:text-base font-black tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm whitespace-nowrap">
              Rắn Săn Mồi
            </span>
          </div>
        </div>

        {/* Cụm chế độ chơi PvE (độ khó + số lượng máy) | PvP (hai người cùng máy) — cùng dáng và cách gọi với các bàn cờ */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center gap-1 rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs font-semibold shadow-md shrink-0">
            {/* PvE (đấu máy): độ khó & số lượng máy */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setPlayMode('ai')}
                    aria-label={playMode === 'ai' ? 'Chế độ PvE (Đấu máy), chọn độ khó và số lượng máy' : 'Chế độ PvE (Đấu máy)'}
                    data-testid="che-do-pve"
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs transition-all cursor-pointer h-8 font-black tracking-wide',
                      playMode === 'ai'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    )}
                    title="Nhấn để chơi PvE (Đấu máy) hoặc tùy chỉnh độ khó và số lượng máy"
                  >
                    <Bot className="size-3.5 shrink-0" />
                    <span>PvE</span>
                    {playMode === 'ai' && (
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm shrink-0 flex items-center gap-1 ml-1',
                          difficulty === 'easy' && 'bg-emerald-400 text-slate-950 border-emerald-300',
                          difficulty === 'medium' && 'bg-amber-400 text-slate-950 border-amber-200',
                          difficulty === 'hard' && 'bg-rose-500 text-white border-rose-300'
                        )}
                      >
                        {difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'} · {aiCount}
                        <ChevronDown className="size-3 opacity-70" />
                      </span>
                    )}
                  </button>
                }
              />
              <PopoverContent
                align="center"
                side="bottom"
                sideOffset={6}
                className="w-68 p-3 bg-[#0e1628]/95 border-white/15 backdrop-blur-md shadow-2xl text-xs z-50 rounded-2xl"
              >
                {/* 1. Chọn độ khó */}
                <div className="text-[11px] font-bold text-text-tertiary px-1 pb-1 mb-1.5 border-b border-white/10 flex items-center justify-between">
                  <span>Độ khó Máy AI</span>
                  <span className="text-[10px] text-slate-400 font-normal">3 mức</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setDifficulty(lvl)
                        handleStartGame()
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border',
                        difficulty === lvl
                          ? lvl === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : lvl === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                          : 'border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span>{lvl === 'easy' ? 'Dễ' : lvl === 'medium' ? 'Vừa' : 'Khó'}</span>
                    </button>
                  ))}
                </div>

                {/* 2. Chọn số lượng máy tham gia */}
                <div className="text-[11px] font-bold text-text-tertiary px-1 pb-1 mb-1.5 border-b border-white/10 flex items-center justify-between">
                  <span>Số lượng máy tham gia</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">{aiCount} đối thủ</span>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[3, 5, 8, 12, 16, 20].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setAiCount(count)
                        handleStartGame()
                      }}
                      className={cn(
                        'flex items-center justify-center py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border',
                        aiCount === count
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm font-black'
                          : 'border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {count}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-text-tertiary italic text-center">
                  *Chọn số lượng sâu AI cùng tranh mồi bánh ngọt trong đấu trường.
                </p>
              </PopoverContent>
            </Popover>

            {/* PvP (người đấu người) */}
            <button
              type="button"
              onClick={() => setPlayMode('pass_and_play')}
              aria-label="Chế độ PvP (Đối kháng)"
              data-testid="che-do-pvp"
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs transition-all cursor-pointer h-8 font-black tracking-wide',
                playMode === 'pass_and_play'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
              title="Chế độ PvP (Đối kháng)"
            >
              <Swords className="size-3.5 shrink-0" />
              <span>PvP</span>
            </button>
          </div>
        </div>

        {/* Nút Toàn màn hình & Nút Bắt đầu / Ván mới */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFullscreen}
            className="h-8 gap-1.5 border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="size-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="size-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleStartGame}
            className="h-8 gap-1.5 border-emerald-500/30 bg-emerald-950/40 text-xs text-emerald-300 hover:bg-emerald-500/20 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            {isRunning ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
            <span>{isGameOver ? 'Ván mới' : isRunning ? 'Chơi lại' : 'Bắt đầu'}</span>
          </Button>
        </div>
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
