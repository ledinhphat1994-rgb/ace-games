import { useState, useRef, useEffect, useMemo } from 'react'
import { Flame, Gamepad2, Lock, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import { docThietLap, ghiThietLap, type ThietLapRan } from './thiet-lap'
import { useGame } from '@/hooks/use-game'

export type SnakeDifficulty = 'easy' | 'medium' | 'hard'

const MAX_CAPACITY = 6

interface SnakeDuelProps {
  roomId?: string
  myActorKey?: string
  myActorName?: string
  onSaveScore?: (score: number) => void
  onBack?: () => void
}

export function SnakeDuel({ roomId, myActorKey, myActorName, onSaveScore, onBack }: SnakeDuelProps) {
  // Thiết lập PvE nhớ theo thiết bị
  const [thietLap, setThietLap] = useState<ThietLapRan>(docThietLap)
  const [mode, setMode] = useState<PlayMode>('ai')
  const [restartKey, setRestartKey] = useState(0)

  // Kết nối phòng nếu có mã bàn
  const ban = useGame(
    roomId || 'solo_snake',
    myActorKey,
    'solo_snake',
  )
  const { thanhVien } = ban

  const myKey = myActorKey || 'me'
  const myName = myActorName || 'Bạn'

  // Danh sách thành viên thực tế trong phòng
  const realMembers = useMemo(() => {
    if (thanhVien && thanhVien.length > 0) {
      return thanhVien.map((m, idx) => ({
        id: m.key,
        name: m.ten || `Người chơi ${idx + 1}`,
        isHost: Boolean(m.isHost || idx === 0),
      }))
    }
    return [
      { id: myKey, name: myName, isHost: true },
    ]
  }, [thanhVien, myKey, myName])

  // Cấu hình PvP
  const [pvpTargetCount, setPvpTargetCount] = useState<number>(2)
  const [sanSangMap, setSanSangMap] = useState<Record<string, boolean>>({})

  // Cấu hình PvE: Mặc định 6 rắn, tùy chỉnh tối đa 50 rắn cùng lúc
  const [pveCapacity, setPveCapacity] = useState<number>(MAX_CAPACITY)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [hasConfirmedPlay, setHasConfirmedPlay] = useState(false)

  // Host là người đầu tiên
  const isHost = realMembers.length > 0 ? realMembers[0].id === myKey : true
  const myReady = sanSangMap[myKey] ?? isHost

  const handleToggleReady = () => {
    setSanSangMap((prev) => ({ ...prev, [myKey]: !prev[myKey] }))
  }

  // Số người thật trong phòng
  const soNguoiThat = Math.min(pveCapacity, realMembers.length)

  // PvE: Mặc định có PvE, mỗi người chơi thật vào sẽ thay thế 1 bot máy cho tới tối đa số rắn
  const soBotPve = Math.max(0, pveCapacity - soNguoiThat)

  // PvP: 100% đối kháng thuần túy người chơi thật (0 bot)
  const aiCount = mode === 'ai' ? soBotPve : 0

  // Điều kiện bắt đầu PvP:
  // 1. Số người thật >= số lượng mong muốn của chủ phòng
  // 2. HOẶC tất cả thành viên khác (tổng số lượng yêu cầu >= 2) đã bấm xác nhận sẵn sàng
  const cacThanhVienKhacSanSang =
    realMembers.length >= 2 && realMembers.filter((m) => !m.isHost).every((m) => sanSangMap[m.id])
  const canStartPvp = soNguoiThat >= pvpTargetCount || cacThanhVienKhacSanSang

  const difficulty = thietLap.capDo
  const [isRunning, setIsRunning] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  // Lưu ý quan trọng: chế độ pve và pvp khi đã xác nhận chơi thành công thì không thay đổi được cho tới khi hủy phòng
  const isSessionLocked = hasConfirmedPlay || isRunning

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

  // Đổi thiết lập độ khó
  const doiThietLap = (moi: ThietLapRan) => {
    setThietLap(moi)
    ghiThietLap(moi)
    if (isRunning) handleStartGame()
  }

  const handleStartGame = () => {
    if (mode === 'pass_and_play' && !canStartPvp && isHost) return
    setHasConfirmedPlay(true)
    setIsGameOver(false)
    setIsRunning(true)
    setPlayerScore(0)
    setRestartKey((k) => k + 1)
  }

  const handleHuyPhong = () => {
    setHasConfirmedPlay(false)
    setIsRunning(false)
    setIsGameOver(false)
    setIsConfigOpen(false)
  }

  const handleBackRoom = () => {
    setHasConfirmedPlay(false)
    onBack?.()
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

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        'relative flex flex-col items-center justify-center w-full h-full flex-1 min-h-0 overflow-hidden touch-none select-none overscroll-none transition-colors duration-150',
        isFullscreen && 'fixed inset-0 z-50 w-full h-dvh max-w-none p-0 bg-surface justify-center overflow-hidden'
      )}
    >
      {/* ── 1. THANH CÔNG CỤ VÙNG 2: DẠNG HUD NỔI TRONG SUỐT (FLOATING TRANSLUCENT HUD) CHUẨN QUỐC TẾ ── */}
      {/* Hỗ trợ chế độ chơi: 100% PVE, PVP + PVE, và 100% PVP */}
      <GamePlayToolbar
        floatingHud={true}
        onBack={handleBackRoom}
        title="Rắn Săn Mồi"
        icon={<Flame className="size-4 text-emerald-400" />}
        mode={mode}
        onModeChange={(m) => {
          if (!isSessionLocked) {
            setMode(m)
            setIsRunning(false)
            setIsGameOver(false)
          }
        }}
        hideModeSelector={true}
        centerRowSlot={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigOpen((prev) => !prev)}
            data-testid="nut-che-do-choi"
            className={cn(
              'h-8 px-2 sm:px-2.5 rounded-xl border-border-default bg-surface/90 backdrop-blur-md text-text-primary hover:bg-surface-raised font-bold text-xs gap-1 sm:gap-1.5 shadow-xs cursor-pointer transition-colors duration-150 flex items-center shrink-0 w-auto min-w-0',
              isConfigOpen && 'border-emerald-500/60 bg-surface-raised',
            )}
            title="Chế độ chơi"
            aria-label="Chế độ chơi"
          >
            <Gamepad2 className="size-3.5 text-emerald-400 shrink-0" />
            <span>Chế độ chơi</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-md text-[10px] font-bold border-2 shrink-0 transition-colors duration-150',
                mode === 'ai'
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                  : 'border-sky-500/40 bg-sky-500/20 text-sky-300',
              )}
            >
              {mode === 'ai' ? 'PvE' : 'PvP'}
            </span>
            {isSessionLocked && (
              <Lock className="size-3 text-amber-400 shrink-0" />
            )}
          </Button>
        }
        aiLevel={difficulty}
        onAiLevelChange={(capDo) => doiThietLap({ ...thietLap, capDo })}
        phuPve={
          <div className="mt-2 border-t border-border-subtle/60 pt-2 flex items-center justify-between text-xs font-bold text-text-secondary px-1">
            <span>Máy</span>
            <span className="font-mono text-brand">{soBotPve}</span>
          </div>
        }
        onReset={handleStartGame}
        hideReset={!isRunning}
        resetLabel={isGameOver ? 'Ván mới' : isRunning ? 'Chơi lại' : 'Bắt đầu'}
        resetDisabled={mode === 'pass_and_play' && !canStartPvp && !isRunning && !isGameOver}
        resetIcon={isRunning || isGameOver ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
        resetNoiBat={!isRunning && !isGameOver}
        turnLabel=""
        activeSide="red"
        hideCenterTurn
        showRoomChat={false}
        showRankings={false}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        className="w-full shrink-0 px-1"
      />

      {/* ── 2. ĐẤU TRƯỜNG RẮN SĂN MỒI ── */}
      <div className="relative flex flex-col items-center justify-center w-full flex-1 h-full min-h-0 overflow-hidden touch-none select-none overscroll-none">
        <Wormate3DArena
          difficulty={difficulty}
          onDifficultyChange={(capDo) => doiThietLap({ ...thietLap, capDo })}
          aiCount={aiCount}
          isRunning={isRunning}
          isGameOver={isGameOver}
          isFullscreen={isFullscreen}
          restartKey={restartKey}
          mode={mode === 'pass_and_play' ? 'pass_and_play' : 'ai'}
          onModeChange={(m) => {
            if (!isSessionLocked) {
              setMode(m)
              setIsRunning(false)
              setIsGameOver(false)
            }
          }}
          pveCapacity={pveCapacity}
          onPveCapacityChange={(count) => {
            if (!isSessionLocked) setPveCapacity(count)
          }}
          isSessionLocked={isSessionLocked}
          onHuyPhong={handleHuyPhong}
          isConfigOpen={isConfigOpen}
          onCloseConfig={() => setIsConfigOpen(false)}
          realPlayerCount={soNguoiThat}
          pvpTargetCount={pvpTargetCount}
          onPvpTargetCountChange={(count) => {
            if (!isSessionLocked) setPvpTargetCount(count)
          }}
          isHost={isHost}
          canStartPvp={canStartPvp}
          isReady={myReady}
          onToggleReady={handleToggleReady}
          pvpMembersList={realMembers.map((m) => ({
            id: m.id,
            name: m.name,
            isHost: m.isHost,
            ready: m.isHost || Boolean(sanSangMap[m.id]),
          }))}
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
