import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft, Gamepad2, Maximize2, Minimize2, RotateCcw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Wormate3DArena } from './Wormate3DArena'
import { playGameOverSound } from '../game-audio'
import { docThietLap, ghiThietLap, type ThietLapRan } from './thiet-lap'
import { useGame } from '@/hooks/use-game'
import type { PlayMode } from '../GamePlayToolbar'

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
    setSanSangMap((prev: Record<string, boolean>) => ({ ...prev, [myKey]: !prev[myKey] }))
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
    realMembers.length >= 2 && realMembers.filter((m: { isHost: boolean }) => !m.isHost).every((m: { id: string }) => sanSangMap[m.id])
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

  const handleToggleFullscreen = useCallback(() => {
    const el = fullscreenContainerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null
    if (!el) return

    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> }

    if (isFullscreen) {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) void doc.exitFullscreen().catch?.(() => {})
        else if (doc.webkitExitFullscreen) void doc.webkitExitFullscreen().catch?.(() => {})
      }
      setIsFullscreen(false)
    } else {
      const requestFn = el.requestFullscreen || el.webkitRequestFullscreen
      if (requestFn) {
        void requestFn.call(el).then(() => setIsFullscreen(true)).catch(() => setIsFullscreen(true))
      } else {
        setIsFullscreen(true)
      }
    }
  }, [isFullscreen])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element }
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Thoát toàn màn hình bằng nút Back trên điện thoại
  useEffect(() => {
    if (!isFullscreen) return

    try {
      window.history.pushState({ dc_snake_fullscreen: true }, '')
    } catch {}

    const handlePopState = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> }
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) doc.exitFullscreen().catch?.(() => {})
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen().catch?.(() => {})
      }
      setIsFullscreen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isFullscreen])

  const handleStartGame = useCallback(() => {
    if (mode === 'pass_and_play' && !canStartPvp && isHost) return
    setHasConfirmedPlay(true)
    setIsGameOver(false)
    setIsRunning(true)
    setPlayerScore(0)
    setRestartKey((k: number) => k + 1)

    // Tự động bật toàn màn hình trực tiếp trên trình duyệt web (ẩn thanh URL và thanh điều hướng, không cần cài đặt PWA)
    const el = fullscreenContainerRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }) | null
    const doc = document as Document & { webkitFullscreenElement?: Element }
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement && el) {
      const requestFn = el.requestFullscreen || el.webkitRequestFullscreen
      if (requestFn) {
        requestFn.call(el).catch(() => {})
      }
    }
  }, [mode, canStartPvp, isHost])

  const handleHuyPhong = useCallback(() => {
    setHasConfirmedPlay(false)
    setIsRunning(false)
    setIsGameOver(false)
    setIsConfigOpen(false)
  }, [])

  const handleBackRoom = useCallback(() => {
    setHasConfirmedPlay(false)
    onBack?.()
  }, [onBack])

  // Đổi thiết lập độ khó
  const doiThietLap = useCallback((moi: ThietLapRan) => {
    setThietLap(moi)
    ghiThietLap(moi)
    if (isRunning) handleStartGame()
  }, [isRunning, handleStartGame])

  // ── PHÍM TẮT KEYBOARD TRÊN PC (Tối ưu 100% không gian, loại bỏ Vùng 1 trên đỉnh) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi người dùng đang nhập văn bản trong input / textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = e.key.toLowerCase()

      // 1. Phím F: Toàn màn hình & thu nhỏ lại
      if (key === 'f') {
        e.preventDefault()
        handleToggleFullscreen()
        return
      }

      // 2. Phím C: Mở / đóng Chat nổi toàn trường
      if (key === 'c') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('campus:toggle-chat'))
        return
      }

      // 3. Phím O hoặc S: Mở / đóng Cài đặt & Nhạc nền
      if (key === 'o' || key === 's') {
        e.preventDefault()
        setIsConfigOpen((prev: boolean) => !prev)
        return
      }

      // 4. Phím R: Chơi lại / ván mới
      if (key === 'r') {
        e.preventDefault()
        handleStartGame()
        return
      }

      // 5. Phím Q: Quay lại sảnh
      if (key === 'q') {
        e.preventDefault()
        handleBackRoom()
        return
      }

      // 6. Phím Escape: Nếu mở cài đặt -> đóng cài đặt. Nếu fullscreen -> thoát fullscreen.
      if (e.key === 'Escape') {
        if (isConfigOpen) {
          e.preventDefault()
          setIsConfigOpen(false)
          return
        }
        if (isFullscreen) {
          e.preventDefault()
          handleToggleFullscreen()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleToggleFullscreen, isSessionLocked, handleBackRoom, handleStartGame, isConfigOpen, isFullscreen])

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
      {/* ── 1. ĐẤU TRƯỜNG RẮN SĂN MỒI (TOÀN MÀN HÌNH 100%, KHÔNG CÒN VÙNG 1 TRÊN ĐỈNH) ── */}
      {/* Hỗ trợ chế độ chơi: 100% PVE, PVP + PVE, và 100% PVP */}
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
          pvpMembersList={realMembers.map((m: { id: string; name: string; isHost: boolean }) => ({
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

      {/* ── 2. CỤM NÚT THAO TÁC NHANH DƯỚI ĐÁY MÀN HÌNH (SÁT MÉP DƯỚI, CĂN GIỮA, CÁCH NHAU THÔNG THOÁNG) ── */}
      <div
        className={cn(
          'snake-quick-actions absolute z-30 flex items-center justify-center gap-3.5 sm:gap-4.5 pointer-events-auto select-none transition-colors pb-[env(safe-area-inset-bottom,0px)]',
          'bottom-2 sm:bottom-2.5 left-1/2 -translate-x-1/2'
        )}
        data-testid="snake-quick-actions"
      >
        <button
          type="button"
          onClick={handleBackRoom}
          title="Sảnh (Q)"
          aria-label="Sảnh"
          data-testid="nut-nhanh-sanh"
          className="size-9.5 sm:size-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-150"
        >
          <ArrowLeft className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsConfigOpen((prev: boolean) => !prev)}
          title="Cài đặt (O)"
          aria-label="Cài đặt"
          data-testid="nut-che-do-choi"
          className={cn(
            'size-9.5 sm:size-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-white/20 text-emerald-400 hover:text-emerald-300 flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-150',
            isConfigOpen && 'border-emerald-400 bg-emerald-950/80',
          )}
        >
          <Gamepad2 className="size-5" />
        </button>

        <button
          type="button"
          onClick={handleStartGame}
          title="Chơi lại (R)"
          aria-label="Chơi lại"
          data-testid="nut-nhanh-choi-lai"
          className="size-9.5 sm:size-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-white/20 text-amber-400 hover:text-amber-300 flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-150"
        >
          <RotateCcw className="size-5" />
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Thu nhỏ (F)' : 'Toàn màn hình (F)'}
          aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          data-testid="nut-nhanh-toan-man-hinh"
          className="size-9.5 sm:size-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-white/20 text-sky-400 hover:text-sky-300 flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-150"
        >
          {isFullscreen ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('campus:toggle-chat'))}
          title="Trò chuyện (C)"
          aria-label="Trò chuyện"
          data-testid="nut-nhanh-chat"
          className="size-9.5 sm:size-10 rounded-full bg-slate-900/90 hover:bg-slate-800 active:scale-95 backdrop-blur-md border border-white/20 text-sky-400 hover:text-sky-300 flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-150"
        >
          <MessageSquare className="size-5" />
        </button>
      </div>
    </div>
  )
}
