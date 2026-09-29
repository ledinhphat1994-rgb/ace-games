import { useState, useRef, useEffect } from 'react'
import { Flame, Maximize2, Play, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'
import { GamePlayToolbar } from '../GamePlayToolbar'
import { CAP_DO_MAY } from '../cap-do-may'
import { ChonSoMay } from './ChonSoMay'
import { docThietLap, ghiThietLap, type ThietLapRan } from './thiet-lap'

export type SnakeDifficulty = 'easy' | 'medium' | 'hard'

interface SnakeDuelProps {
  onSaveScore?: (score: number) => void
  onBack?: () => void
  snakeTab?: 'duel' | 'classic'
  onTabChange?: (tab: 'duel' | 'classic') => void
}

export function SnakeDuel({ onSaveScore, onBack }: SnakeDuelProps) {
  // Thiết lập PvE nhớ theo thiết bị; chọn được ở sảnh lẫn ngay trong ván (cùng một nơi lưu).
  const [thietLap, setThietLap] = useState<ThietLapRan>(docThietLap)
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

  // Đổi thiết lập: lưu ngay; đang chơi thì mở lại ván với thiết lập mới, chưa chơi thì chỉ ghi nhận (không tự bắt đầu).
  const doiThietLap = (moi: ThietLapRan) => {
    setThietLap(moi)
    ghiThietLap(moi)
    if (isRunning) handleStartGame()
  }

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
      {/* ── 1. THANH CÔNG CỤ: cùng khung với các bàn cờ (Quay lại · tên game · chế độ · hành động) — ẩn khi toàn màn hình ── */}
      {!isFullscreen && (
        <GamePlayToolbar
          onBack={onBack}
          title="Rắn Săn Mồi"
          icon={<Flame className="size-4 text-emerald-400" />}
          mode="ai"
          onModeChange={() => {}}
          aiLevel={difficulty}
          onAiLevelChange={(capDo) => doiThietLap({ ...thietLap, capDo })}
          chiPve
          nhanChipPve={`${CAP_DO_MAY[difficulty].nhan} · ${aiCount}`}
          phuPve={
            <div className="mt-2.5 border-t border-white/10 pt-2.5">
              <p className="mb-1.5 px-1 text-[11px] font-bold text-text-tertiary">Số rắn máy</p>
              <ChonSoMay soMay={aiCount} onChon={(soMay) => doiThietLap({ ...thietLap, soMay })} />
            </div>
          }
          onReset={handleStartGame}
          resetLabel={isGameOver ? 'Ván mới' : isRunning ? 'Chơi lại' : 'Bắt đầu'}
          resetIcon={isRunning || isGameOver ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
          resetNoiBat={!isRunning && !isGameOver}
          turnLabel=""
          activeSide="red"
          hideCenterTurn
          rightSlot={
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleFullscreen}
              className="h-8 gap-1.5 border-white/10 bg-white/5 px-2 text-xs font-bold text-slate-200 transition-all hover:scale-105 hover:bg-white/10 active:scale-95 cursor-pointer"
              title="Phóng to toàn màn hình"
              aria-label="Toàn màn hình"
            >
              <Maximize2 className="size-3.5 text-cyan-400" />
              <span className="hidden min-[420px]:inline">Toàn màn hình</span>
            </Button>
          }
          className="w-full shrink-0 px-1"
        />
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
