import React, { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { DigitalCampusLogo } from '@/components/brand/DigitalCampusLogo'

export interface GodotGameViewProps {
  gamePath?: string
  gameTitle?: string
  onScoreSubmit?: (score: number, metadata: Record<string, any>) => void
  onClose?: () => void
}

/**
 * GodotGameView — Component nhúng trò chơi Godot Web vào ứng dụng Ace Games
 * Hỗ trợ tự động kết nối Native Haptics, nhận điểm số, Toast thông báo và đóng game.
 */
export const GodotGameView: React.FC<GodotGameViewProps> = ({
  gamePath = '/games/godot/index.html',
  gameTitle = 'Ace Games',
  onScoreSubmit,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleScore = useCallback((score: number, meta: Record<string, any>) => {
    const starStr = meta.stars !== undefined && meta.stars > 0 ? `${'⭐'.repeat(meta.stars)} ` : ''
    const waveNum = meta.current_wave ?? meta.wave
    const waveStr = waveNum ? `Wave ${waveNum}` : ''
    const modeStr = meta.is_hardcore ? ' [THỬ THÁCH]' : (meta.is_endless_mode ? ' [VÔ TẬN]' : '')
    const mvpStr = meta.mvp_tower?.name && meta.mvp_tower.name !== 'Chưa có'
      ? ` | MVP: ${meta.mvp_tower.name} (Lv.${meta.mvp_tower.tier ?? meta.mvp_tower.level ?? 1})`
      : (meta.mvp ? ` | MVP: ${meta.mvp}` : '')
    const medalsCount = meta.medals?.unlocked_medals_count !== undefined
      ? ` | ${meta.medals.unlocked_medals_count}/3 Huy hiệu`
      : ''

    const desc = `${starStr}${waveStr}${modeStr}${mvpStr}${medalsCount}`.trim() || (meta.game ? `Trò chơi: ${meta.game}` : undefined)

    toast.success(`Đạt ${score.toLocaleString()} điểm kỷ lục!`, {
      description: desc,
    })
    if (onScoreSubmit) {
      onScoreSubmit(score, meta)
    }
  }, [onScoreSubmit])

  const handleToastMessage = useCallback((message: string, variant: string = 'info') => {
    if (variant === 'success') {
      toast.success(message)
    } else if (variant === 'error') {
      toast.error(message)
    } else if (variant === 'warning') {
      toast.warning(message)
    } else {
      toast.info(message)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }, [])

  const reloadGame = useCallback(() => {
    if (iframeRef.current) {
      setIsLoaded(false)
      iframeRef.current.src = `${gamePath}?t=${Date.now()}`
    }
  }, [gamePath])

  useEffect(() => {
    // 1. Nhận sự kiện từ iframe postMessage
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data) return

      if (data.type === 'campus:game:score') {
        handleScore(data.score, data.meta || {})
      } else if (data.type === 'campus:game:toast') {
        handleToastMessage(data.message, data.variant)
      } else if (data.type === 'campus:game:exit') {
        onClose?.()
      }
    }

    // 2. Nhận CustomEvent nội bộ (nếu chạy cùng context)
    const handleScoreEvent = (e: any) => {
      handleScore(e.detail.score, e.detail.meta || {})
    }

    const handleToastEvent = (e: any) => {
      handleToastMessage(e.detail.message, e.detail.variant)
    }

    const handleExitEvent = () => {
      onClose?.()
    }

    window.addEventListener('message', handleWindowMessage)
    window.addEventListener('campus:game:score', handleScoreEvent)
    window.addEventListener('campus:game:toast', handleToastEvent)
    window.addEventListener('campus:game:exit', handleExitEvent)

    return () => {
      window.removeEventListener('message', handleWindowMessage)
      window.removeEventListener('campus:game:score', handleScoreEvent)
      window.removeEventListener('campus:game:toast', handleToastEvent)
      window.removeEventListener('campus:game:exit', handleExitEvent)
    }
  }, [handleScore, handleToastMessage, onClose])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] flex flex-col bg-[#020c24] overflow-hidden select-none"
    >
      {/* Thanh công cụ tối giản phía trên */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/90 border-b border-cyan-500/20 z-10">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-sm tracking-wide">🎮 {gameTitle}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={reloadGame}
            title="Tải lại trò chơi"
            className="p-1.5 text-xs rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors duration-150 border border-slate-700/50"
          >
            🔄
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="p-1.5 text-xs rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 transition-colors duration-150 border border-slate-700/50"
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors duration-150 border border-rose-500/40"
            >
              Thoát
            </button>
          )}
        </div>
      </div>

      {/* Khung nhúng game Godot */}
      <div className="relative flex-1 w-full h-full">
        <iframe
          ref={iframeRef}
          src={gamePath}
          title={gameTitle}
          className="w-full h-full border-none"
          allow="autoplay; fullscreen; accelerometer; gyroscope"
          onLoad={() => setIsLoaded(true)}
          onError={() => setLoadError(true)}
        />

        {/* Màn hình chờ khi game đang tải */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] text-cyan-400 gap-3 z-0 select-none">
            <DigitalCampusLogo size="2xl" loading showGlow />
          </div>
        )}

        {/* Trạng thái khi chưa export game */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020c24] text-slate-300 p-6 text-center">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Chưa tìm thấy bản xuất bản Game</h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              Bạn hãy chạy lệnh <code className="text-cyan-300 bg-slate-800 px-1 py-0.5 rounded">npm run game:export</code> để xuất bản game Godot vào App nhé.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GodotGameView
