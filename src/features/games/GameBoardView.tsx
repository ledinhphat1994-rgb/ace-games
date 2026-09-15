import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  Clock,
  Crown,
  Eye,
  Flag,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react'
import { useGame } from '../../hooks/use-game'

interface GameBoardViewProps {
  gameId: string
  myActorKey?: string
  myActorName?: string
  onLeave: () => void
}

const EMOTE_LIST = ['🔥', '👏', '😱', '🤔', '😎', 'GG', 'Nước hay!', 'Nhanh lên bạn ơi!']

export function GameBoardView({ gameId, myActorKey, myActorName: _myActorName, onLeave }: GameBoardViewProps) {
  const {
    trangThai,
    meta,
    board,
    spectators,
    mySide,
    isMyTurn,
    turnTimeRemaining,
    lastMove,
    incomingEmote,
    joinGame,
    makeMove,
    surrender,
    rematch,
    sendEmote,
  } = useGame(gameId, myActorKey)

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [showEmotePicker, setShowEmotePicker] = useState(false)
  const [displayedEmote, setDisplayedEmote] = useState<{ sender: string; emote: string } | null>(null)
  const [prevEmoteId, setPrevEmoteId] = useState<number | null>(null)

  if (incomingEmote && incomingEmote.id !== prevEmoteId) {
    setPrevEmoteId(incomingEmote.id)
    setDisplayedEmote({ sender: incomingEmote.sender, emote: incomingEmote.emote })
  }

  useEffect(() => {
    if (!displayedEmote) return
    const t = setTimeout(() => setDisplayedEmote(null), 3000)
    return () => clearTimeout(t)
  }, [displayedEmote])

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!isMyTurn) return
      makeMove(x, y)
    },
    [isMyTurn, makeMove],
  )

  const isWinCell = (x: number, y: number) => {
    if (!meta.winLine) return false
    return meta.winLine.some(([wx, wy]) => wx === x && wy === y)
  }

  const isLastMoveCell = (x: number, y: number) => {
    return lastMove?.x === x && lastMove?.y === y
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative font-sans">
      {/* Background glow effects */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Emote Float Banner */}
      {displayedEmote && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 text-cyan-200 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm font-semibold">
          <span className="text-slate-400">{displayedEmote.sender}:</span>
          <span className="text-2xl">{displayedEmote.emote}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Rời bàn</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">
                {meta.gameType === 'caro_15' && 'Cờ Caro 15×15'}
                {meta.gameType === 'caro_9' && 'Cờ Caro Nhanh 9×9'}
                {meta.gameType === 'connect4' && 'Connect 4'}
                {meta.gameType === 'reversi' && 'Reversi (Othello) 8×8'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Bàn #{gameId.slice(0, 8)}
              </span>
              {trangThai !== 'da_ket_noi' && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <WifiOff className="w-3 h-3" /> Đang kết nối lại...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/50">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{spectators} người xem</span>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-md bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50"
            title={soundEnabled ? 'Tắt âm' : 'Bật âm'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Versus Player Strip */}
      <section className="px-4 py-2.5 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800/80 flex items-center justify-between gap-4 z-10">
        {/* Player X */}
        <div
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all border ${
            meta.currentTurn === 'X' && meta.status === 'playing'
              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'bg-slate-800/40 border-slate-800'
          }`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md">
              X
            </div>
            {meta.winner === 'X' && (
              <Crown className="w-5 h-5 text-amber-400 absolute -top-2.5 -right-2 drop-shadow-md animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white max-w-[120px] truncate">
                {meta.playerXName || (meta.playerX ? 'Đấu thủ X' : 'Đang chờ...')}
              </span>
              {mySide === 'X' && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  Bạn
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>Điểm: <strong className="text-cyan-400">{meta.scoreX}</strong></span>
              {meta.currentTurn === 'X' && meta.status === 'playing' && (
                <span className="flex items-center gap-1 text-cyan-300 font-mono font-bold animate-pulse">
                  <Clock className="w-3 h-3" />
                  {turnTimeRemaining}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Match Status */}
        <div className="flex flex-col items-center justify-center">
          {meta.status === 'waiting' && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> Chờ đối thủ vào bàn...
              </span>
              {!mySide && (
                <button
                  type="button"
                  onClick={() => joinGame()}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
                >
                  Tham gia thi đấu ⚔️
                </button>
              )}
            </div>
          )}

          {meta.status === 'playing' && (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Đang thi đấu</span>
              <div className="text-xs font-semibold mt-0.5">
                {isMyTurn ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold animate-pulse">
                    <Zap className="w-3.5 h-3.5" /> Lượt của bạn!
                  </span>
                ) : (
                  <span className="text-slate-400">Lượt của đối thủ...</span>
                )}
              </div>
            </div>
          )}

          {meta.status === 'ended' && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Trophy className="w-4 h-4 text-amber-400" />
                {meta.winner === 'draw'
                  ? 'Hòa ván cờ!'
                  : meta.winner === mySide
                    ? '🎉 BẠN ĐÃ CHIẾN THẮNG!'
                    : `Chiến thắng thuộc về ${meta.winner === 'X' ? meta.playerXName || 'X' : meta.playerOName || 'O'}!`}
              </div>
              <button
                type="button"
                onClick={rematch}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md transition-transform active:scale-95 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Đấu lại
              </button>
            </div>
          )}
        </div>

        {/* Player O */}
        <div
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all border ${
            meta.currentTurn === 'O' && meta.status === 'playing'
              ? 'bg-fuchsia-950/40 border-fuchsia-500/60 shadow-[0_0_15px_rgba(217,70,239,0.25)]'
              : 'bg-slate-800/40 border-slate-800'
          }`}
        >
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              {mySide === 'O' && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 rounded border border-fuchsia-500/30">
                  Bạn
                </span>
              )}
              <span className="font-semibold text-xs text-white max-w-[120px] truncate">
                {meta.playerOName || (meta.playerO ? 'Đấu thủ O' : 'Đang chờ...')}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2 text-[11px] text-slate-400 mt-0.5">
              {meta.currentTurn === 'O' && meta.status === 'playing' && (
                <span className="flex items-center gap-1 text-fuchsia-300 font-mono font-bold animate-pulse">
                  <Clock className="w-3 h-3" />
                  {turnTimeRemaining}s
                </span>
              )}
              <span>Điểm: <strong className="text-fuchsia-400">{meta.scoreO}</strong></span>
            </div>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center font-black text-lg text-white shadow-md">
              O
            </div>
            {meta.winner === 'O' && (
              <Crown className="w-5 h-5 text-amber-400 absolute -top-2.5 -right-2 drop-shadow-md animate-bounce" />
            )}
          </div>
        </div>
      </section>

      {/* Main Board Arena Viewport */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-3 sm:p-6 relative">
        {/* CARO 15x15 & CARO 9x9 */}
        {(meta.gameType === 'caro_15' || meta.gameType === 'caro_9') && (
          <div className="relative p-2.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
            <div
              className="grid gap-[2px] bg-slate-800/80 p-[2px] rounded-lg shadow-inner"
              style={{
                gridTemplateColumns: `repeat(${board[0]?.length || 15}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isWin = isWinCell(x, y)
                  const isLast = isLastMoveCell(x, y)
                  const cellSizeClass = meta.gameType === 'caro_15' ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-9 h-9 sm:w-11 sm:h-11'

                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      disabled={!isMyTurn || cell !== null || meta.status !== 'playing'}
                      onClick={() => handleCellClick(x, y)}
                      className={`
                        ${cellSizeClass} flex items-center justify-center rounded-[3px] text-xs sm:text-base font-black transition-all relative
                        ${cell === null && isMyTurn && meta.status === 'playing' ? 'hover:bg-slate-700/80 cursor-pointer' : 'cursor-default'}
                        ${cell === null ? 'bg-slate-950/80' : ''}
                        ${cell === 'X' ? 'bg-cyan-950/40 text-cyan-400' : ''}
                        ${cell === 'O' ? 'bg-fuchsia-950/40 text-fuchsia-400' : ''}
                        ${isWin ? 'ring-2 ring-amber-400 bg-amber-500/30 animate-pulse' : ''}
                        ${isLast && !isWin ? 'ring-1 ring-white/60 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}
                      `}
                    >
                      {cell === 'X' && <span className="drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">✕</span>}
                      {cell === 'O' && <span className="drop-shadow-[0_0_6px_rgba(217,70,239,0.8)]">◯</span>}
                      {cell === null && isMyTurn && (
                        <span className="opacity-0 hover:opacity-30 text-slate-400">
                          {mySide === 'X' ? '✕' : '◯'}
                        </span>
                      )}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        )}

        {/* CONNECT 4 (7 columns x 6 rows) */}
        {meta.gameType === 'connect4' && (
          <div className="relative p-4 rounded-3xl bg-blue-950/80 border-4 border-blue-600/80 shadow-2xl shadow-blue-500/20 backdrop-blur-xl">
            {/* Column Drop Indicator Buttons */}
            {isMyTurn && meta.status === 'playing' && (
              <div className="grid grid-cols-7 gap-2 mb-2">
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <button
                    key={`drop-${colIdx}`}
                    type="button"
                    onMouseEnter={() => setHoverCol(colIdx)}
                    onMouseLeave={() => setHoverCol(null)}
                    onClick={() => handleCellClick(colIdx, 0)}
                    className="h-8 rounded-lg bg-blue-800/40 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-xs flex items-center justify-center transition-colors shadow-sm"
                  >
                    ⬇
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-7 gap-2 bg-blue-900/90 p-3 rounded-2xl border border-blue-700/60 shadow-inner">
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isWin = isWinCell(x, y)
                  const isLast = isLastMoveCell(x, y)
                  const isHovered = hoverCol === x && cell === null

                  return (
                    <button
                      key={`c4-${x}-${y}`}
                      type="button"
                      disabled={!isMyTurn || meta.status !== 'playing'}
                      onClick={() => handleCellClick(x, 0)}
                      className={`
                        w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-inner border-2
                        ${cell === null ? 'bg-slate-950/90 border-blue-950' : ''}
                        ${cell === 'X' ? 'bg-gradient-to-br from-rose-500 to-red-600 border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : ''}
                        ${cell === 'O' ? 'bg-gradient-to-br from-amber-400 to-yellow-500 border-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.6)]' : ''}
                        ${isWin ? 'ring-4 ring-white animate-bounce' : ''}
                        ${isLast && !isWin ? 'ring-2 ring-white/80' : ''}
                        ${isHovered ? 'bg-blue-900/50' : ''}
                      `}
                    />
                  )
                }),
              )}
            </div>
          </div>
        )}

        {/* REVERSI 8x8 (Othello) */}
        {meta.gameType === 'reversi' && (
          <div className="relative p-4 rounded-3xl bg-emerald-950/90 border-4 border-emerald-700/80 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl">
            <div className="grid grid-cols-8 gap-1.5 bg-emerald-900/90 p-2.5 rounded-2xl border border-emerald-800 shadow-inner">
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isLast = isLastMoveCell(x, y)

                  return (
                    <button
                      key={`rev-${x}-${y}`}
                      type="button"
                      disabled={!isMyTurn || cell !== null || meta.status !== 'playing'}
                      onClick={() => handleCellClick(x, y)}
                      className={`
                        w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all bg-emerald-800/80 border border-emerald-700/50
                        ${cell === null && isMyTurn ? 'hover:bg-emerald-700 cursor-pointer' : ''}
                      `}
                    >
                      {cell === 'X' && (
                        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-slate-900 to-black border border-slate-700 shadow-lg ${isLast ? 'ring-2 ring-cyan-400' : ''}`} />
                      )}
                      {cell === 'O' && (
                        <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 border border-white shadow-lg ${isLast ? 'ring-2 ring-fuchsia-400' : ''}`} />
                      )}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Action / Emote Bar */}
      <footer className="px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmotePicker(!showEmotePicker)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <span>💬 Biểu cảm</span>
            </button>
            {showEmotePicker && (
              <div className="absolute bottom-11 left-0 bg-slate-900/95 border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-wrap gap-1.5 w-64 backdrop-blur-md z-30">
                {EMOTE_LIST.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      sendEmote(em)
                      setShowEmotePicker(false)
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-cyan-900/50 hover:text-cyan-300 text-slate-200 rounded-lg transition-colors border border-slate-700/60"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {meta.status === 'playing' && mySide && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xin hàng ván cờ này?')) {
                  surrender()
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-red-200 text-xs font-semibold border border-red-800/60 flex items-center gap-1.5 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Đầu hàng</span>
            </button>
          )}

          {meta.status === 'ended' && (
            <button
              type="button"
              onClick={rematch}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đấu ván mới</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
