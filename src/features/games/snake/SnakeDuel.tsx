import { useState, useRef, useEffect, useMemo } from 'react'
import { Flame, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'
import { GamePlayToolbar, type PlayMode } from '../GamePlayToolbar'
import { CAP_DO_MAY } from '../cap-do-may'
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

  // Host là người đầu tiên
  const isHost = realMembers.length > 0 ? realMembers[0].id === myKey : true
  const myReady = sanSangMap[myKey] ?? isHost

  const handleToggleReady = () => {
    setSanSangMap((prev) => ({ ...prev, [myKey]: !prev[myKey] }))
  }

  // Số người thật trong phòng
  const soNguoiThat = Math.min(MAX_CAPACITY, realMembers.length)

  // PvE: Mặc định có PvE, mỗi người chơi thật vào sẽ thay thế 1 bot máy cho tới tối đa 6 người
  const soBotPve = Math.max(0, MAX_CAPACITY - soNguoiThat)

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

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        'flex flex-col items-center justify-between w-full h-full max-w-6xl mx-auto transition-colors duration-150',
        isFullscreen && 'fixed inset-0 z-50 w-full h-dvh max-w-none p-2 bg-surface justify-center overflow-hidden'
      )}
    >
      {/* ── 1. THANH CÔNG CỤ VÙNG 2: BỎ BIỂU TƯỢNG CẢM XÚC NHANH ── */}
      <GamePlayToolbar
        onBack={onBack}
        title="Rắn Săn Mồi"
        icon={<Flame className="size-4 text-emerald-400" />}
        badge={
          mode === 'ai'
            ? `PVE · ${soNguoiThat}/${MAX_CAPACITY} (${soBotPve} Máy)`
            : `100% PVP · ${soNguoiThat}/${pvpTargetCount}`
        }
        mode={mode}
        onModeChange={(m) => {
          setMode(m)
          setIsRunning(false)
          setIsGameOver(false)
        }}
        aiLevel={difficulty}
        onAiLevelChange={(capDo) => doiThietLap({ ...thietLap, capDo })}
        nhanChipPve={`${CAP_DO_MAY[difficulty].nhan} · ${soBotPve} Máy`}
        phuPve={
          <div className="mt-2.5 border-t border-border-subtle pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-text-primary px-1">
              <span>Dung lượng phòng</span>
              <span className="font-mono text-brand">{MAX_CAPACITY} Người</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-text-primary px-1">
              <span>Người chơi hiện tại</span>
              <span className="font-mono text-emerald-400">{soNguoiThat}/{MAX_CAPACITY}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-text-primary px-1">
              <span>Rắn máy PvE (Tự bù)</span>
              <span className="font-mono text-amber-400">{soBotPve} máy</span>
            </div>
          </div>
        }
        onReset={handleStartGame}
        hideReset={!isRunning}
        phuPvp={
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-bold text-text-tertiary">
              Số người yêu cầu để bắt đầu
            </p>
            <div className="grid grid-cols-4 gap-1">
              {[2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPvpTargetCount(num)}
                  className={cn(
                    'h-8 rounded-lg border text-xs font-bold transition-colors duration-150 cursor-pointer',
                    pvpTargetCount === num
                      ? 'border-brand/40 bg-brand/15 text-brand font-black'
                      : 'border-border-default text-text-secondary hover:bg-surface-raised hover:text-text-primary',
                  )}
                >
                  {num} Người
                </button>
              ))}
            </div>
          </div>
        }
        nhanChipPvp={`100% PvP · ${soNguoiThat}/${pvpTargetCount}`}
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
      <div className={cn('relative flex items-center justify-center w-full flex-1 h-full min-h-0', !isFullscreen && 'my-auto py-1')}>
        <Wormate3DArena
          difficulty={difficulty}
          aiCount={aiCount}
          isRunning={isRunning}
          isGameOver={isGameOver}
          isFullscreen={isFullscreen}
          restartKey={restartKey}
          mode={mode === 'pass_and_play' ? 'pass_and_play' : 'ai'}
          realPlayerCount={soNguoiThat}
          pvpTargetCount={pvpTargetCount}
          onPvpTargetCountChange={setPvpTargetCount}
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
