import { useCallback, useEffect, useState } from 'react'
import { Crown, Eye, Flag, Link2, MessageCircle, RotateCcw, Swords, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import type { BoardCell, GameType, PlayerSide } from '@shared/protocol/game'
import { useGame } from '../../hooks/use-game'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { GameScreenHeader } from './GameScreenHeader'
import { KICH_THUOC_BAN } from './board-size'
import { QuanCo } from './GamePieces'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface GameBoardViewProps {
  gameId: string
  myActorKey?: string
  myActorName?: string
  onLeave: () => void
  /** Chỉ có khi VỪA tạo bàn từ sảnh — áp trò chơi/thời gian lượt đã chọn cho bàn còn trống. */
  intendedGameType?: GameType
  intendedTurnSeconds?: number
}

const EMOTE_LIST = ['🔥', '👏', '😱', '🤔', '😎', 'GG', 'Nước hay!', 'Nhanh lên bạn ơi!']

export function GameBoardView({
  gameId,
  myActorKey,
  onLeave,
  intendedGameType,
  intendedTurnSeconds,
}: GameBoardViewProps) {
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
  } = useGame(gameId, myActorKey, intendedGameType, intendedTurnSeconds)

  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [moBieuCam, setMoBieuCam] = useState(false)
  const [xacNhanDauHang, setXacNhanDauHang] = useState(false)
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

  const saoChepLinkMoi = async () => {
    const url = `${window.location.origin}/game/${encodeURIComponent(gameId)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Đã sao chép link mời — gửi cho bạn để vào bàn.')
    } catch {
      toast.error('Không sao chép được. Link bàn: ' + url)
    }
  }

  const isWinCell = (x: number, y: number) => meta.winLine?.some(([wx, wy]) => wx === x && wy === y) ?? false
  const isLastMoveCell = (x: number, y: number) => lastMove?.x === x && lastMove?.y === y
  const tenTro = GAME_CATALOG_BY_ID[meta.gameType]?.shortTitle ?? 'Bàn đấu'
  const daKetNoi = trangThai === 'da_ket_noi'
  const tenBen = (side: PlayerSide) =>
    side === 'X' ? meta.playerXName || (meta.playerX ? 'Người chơi X' : null) : meta.playerOName || (meta.playerO ? 'Người chơi O' : null)
  const tenNguoiThang = meta.winner === 'X' || meta.winner === 'O' ? tenBen(meta.winner) : null

  return (
    <div className="flex min-h-svh flex-col bg-background text-text-primary select-none">
      <GameScreenHeader
        title={tenTro}
        onBack={onLeave}
        backLabel="Rời bàn, về sảnh Game"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>Bàn {gameId}</span>
            <span aria-hidden>·</span>
            <span>{meta.turnTimerSeconds}s mỗi lượt</span>
          </span>
        }
        actions={
          <>
            {!daKetNoi && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-muted px-2.5 py-1 text-xs font-medium text-warning">
                <WifiOff className="size-3.5" />
                <span className="hidden sm:inline">
                  {trangThai === 'phien_bi_thay' ? 'Phiên đã mở ở nơi khác' : 'Đang kết nối lại…'}
                </span>
              </span>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-xs text-text-secondary tabular-nums"
              title={`${spectators} người xem`}
            >
              <Eye className="size-4 text-text-tertiary" />
              {spectators}
            </span>
            <Button variant="outline" size="sm" onClick={() => void saoChepLinkMoi()}>
              <Link2 />
              <span className="hidden sm:inline">Mời bạn</span>
            </Button>
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 px-4 py-5 sm:gap-5 sm:px-6">
        {/* Hai người chơi */}
        <div className="grid w-full max-w-[560px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <TheNguoiChoi
            gameType={meta.gameType}
            side="X"
            ten={tenBen('X')}
            diem={meta.scoreX}
            laBan={mySide === 'X'}
            dangLuot={meta.status === 'playing' && meta.currentTurn === 'X'}
            thang={meta.winner === 'X'}
            giayConLai={turnTimeRemaining}
          />
          <span className="text-xs font-semibold tracking-wider text-text-tertiary">VS</span>
          <TheNguoiChoi
            gameType={meta.gameType}
            side="O"
            ten={tenBen('O')}
            diem={meta.scoreO}
            laBan={mySide === 'O'}
            dangLuot={meta.status === 'playing' && meta.currentTurn === 'O'}
            thang={meta.winner === 'O'}
            giayConLai={turnTimeRemaining}
            canhPhai
          />
        </div>

        {/* Trạng thái ván + hành động chính */}
        <div className="flex min-h-10 flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center" aria-live="polite">
          {meta.status === 'waiting' && !mySide && (
            <>
              <p className="text-sm text-text-secondary">Bàn đang chờ đối thủ.</p>
              <Button size="sm" onClick={() => joinGame()} disabled={!daKetNoi}>
                <Swords />
                Vào chơi
              </Button>
            </>
          )}
          {meta.status === 'waiting' && mySide && (
            <>
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="size-2 animate-pulse rounded-full bg-brand" />
                Đang chờ đối thủ vào bàn…
              </p>
              <Button size="sm" variant="outline" onClick={() => void saoChepLinkMoi()}>
                <Link2 />
                Sao chép link mời
              </Button>
            </>
          )}
          {meta.status === 'playing' && (
            <p
              className={cn(
                'text-sm font-medium',
                isMyTurn ? 'text-brand' : 'text-text-secondary',
              )}
            >
              {isMyTurn ? 'Đến lượt bạn' : mySide ? 'Đang chờ đối thủ đi…' : 'Bạn đang xem trận đấu'}
            </p>
          )}
          {meta.status === 'ended' && (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Crown className="size-4 text-achievement" />
                {meta.winner === 'draw'
                  ? 'Hoà!'
                  : meta.winner === mySide
                    ? 'Bạn thắng!'
                    : `${tenNguoiThang ?? 'Đối thủ'} thắng`}
              </p>
              {mySide && (
                <Button size="sm" onClick={rematch}>
                  <RotateCcw />
                  Đấu lại
                </Button>
              )}
            </>
          )}
        </div>

        {/* Bàn cờ */}
        <div className="relative" style={KICH_THUOC_BAN}>
          {displayedEmote && (
            <div className="pointer-events-none absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 -translate-y-full items-center gap-2 rounded-full border border-border-default bg-surface-raised px-3.5 py-1.5 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
              <span className="text-text-tertiary">{displayedEmote.sender}:</span>
              <span className="font-semibold">{displayedEmote.emote}</span>
            </div>
          )}

          {(meta.gameType === 'caro_15' || meta.gameType === 'caro_9') && (
            <BanCaro
              board={board}
              gameType={meta.gameType}
              coTheDi={isMyTurn && meta.status === 'playing'}
              isWinCell={isWinCell}
              isLastMoveCell={isLastMoveCell}
              onCell={handleCellClick}
            />
          )}

          {meta.gameType === 'connect4' && (
            <BanConnect4
              board={board}
              coTheDi={isMyTurn && meta.status === 'playing'}
              mySide={mySide}
              hoverCol={hoverCol}
              setHoverCol={setHoverCol}
              isWinCell={isWinCell}
              isLastMoveCell={isLastMoveCell}
              onCol={(x) => handleCellClick(x, 0)}
            />
          )}

          {meta.gameType === 'reversi' && (
            <BanReversi
              board={board}
              coTheDi={isMyTurn && meta.status === 'playing'}
              isLastMoveCell={isLastMoveCell}
              onCell={handleCellClick}
            />
          )}
        </div>

        {/* Hành động phụ */}
        <div className="flex w-full max-w-[560px] items-center justify-between gap-3">
          <Popover open={moBieuCam} onOpenChange={setMoBieuCam}>
            <PopoverTrigger render={<Button variant="outline" size="sm" disabled={!daKetNoi} />}>
              <MessageCircle />
              Biểu cảm
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-64">
              <div className="day-loc-deu-co-gian [--the-nho-nhat:3rem]">
                {EMOTE_LIST.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      sendEmote(em)
                      setMoBieuCam(false)
                    }}
                    className="flex h-9 items-center rounded-xl border border-border-default px-2.5 text-sm transition-colors hover:border-brand/40 hover:bg-brand/10"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {meta.status === 'playing' && mySide && (
            <Button variant="destructive" size="sm" onClick={() => setXacNhanDauHang(true)}>
              <Flag />
              Đầu hàng
            </Button>
          )}
        </div>
      </main>

      <AlertDialog open={xacNhanDauHang} onOpenChange={setXacNhanDauHang}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đầu hàng ván này?</AlertDialogTitle>
            <AlertDialogDescription>
              Đối thủ sẽ được tính thắng ván hiện tại. Hai bạn vẫn có thể đấu lại ngay sau đó.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Chơi tiếp</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setXacNhanDauHang(false)
                surrender()
              }}
            >
              Đầu hàng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TheNguoiChoi({
  gameType,
  side,
  ten,
  diem,
  laBan,
  dangLuot,
  thang,
  giayConLai,
  canhPhai = false,
}: {
  gameType: GameType
  side: PlayerSide
  ten: string | null
  diem: number
  laBan: boolean
  dangLuot: boolean
  thang: boolean
  giayConLai: number
  canhPhai?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2.5 rounded-2xl border px-2.5 py-2 transition-colors duration-150 sm:gap-3 sm:px-3',
        dangLuot ? 'border-brand/50 bg-brand/[0.06]' : 'border-border-subtle bg-surface',
        canhPhai && 'flex-row-reverse text-right',
      )}
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-overlay sm:size-10">
        <QuanCo gameType={gameType} side={side} className="size-5 sm:size-6" />
        {thang && <Crown className="absolute -top-2 -right-1.5 size-4 text-achievement" />}
      </span>
      <div className="min-w-0">
        <p className={cn('text-sm leading-5 font-semibold break-words', ten ? 'text-text-primary' : 'text-text-tertiary')}>
          {ten ?? 'Đang chờ…'}
          {laBan && <span className="ml-1 text-xs font-medium text-brand">(bạn)</span>}
        </p>
        <p className="text-xs text-text-tertiary tabular-nums">
          {diem} điểm
          {dangLuot && <span className="ml-1.5 font-semibold text-brand">· {giayConLai}s</span>}
        </p>
      </div>
    </div>
  )
}

function BanCaro({
  board,
  gameType,
  coTheDi,
  isWinCell,
  isLastMoveCell,
  onCell,
}: {
  board: BoardCell[][]
  gameType: 'caro_15' | 'caro_9'
  coTheDi: boolean
  isWinCell: (x: number, y: number) => boolean
  isLastMoveCell: (x: number, y: number) => boolean
  onCell: (x: number, y: number) => void
}) {
  const soCot = board[0]?.length || (gameType === 'caro_15' ? 15 : 9)
  return (
    <div className="rounded-2xl border border-border-default bg-surface p-2 shadow-2xl shadow-black/30 sm:p-2.5">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#0b1322]">
        {/* Lưới vẽ bằng SVG crispEdges: nét 1px đều nhau ở mọi kích thước ô (kể cả khi ô lẻ pixel). */}
        <svg
          aria-hidden
          viewBox={`0 0 ${soCot} ${soCot}`}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <g stroke="#243049" strokeWidth="1" vectorEffect="non-scaling-stroke">
            {Array.from({ length: soCot - 1 }, (_, i) => (
              <g key={i}>
                <line x1={i + 1} y1={0} x2={i + 1} y2={soCot} vectorEffect="non-scaling-stroke" />
                <line x1={0} y1={i + 1} x2={soCot} y2={i + 1} vectorEffect="non-scaling-stroke" />
              </g>
            ))}
          </g>
        </svg>
        <div
          className="relative grid size-full"
          style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${soCot}, minmax(0, 1fr))` }}
          role="grid"
          aria-label={`Bàn cờ ${soCot}×${soCot}`}
        >
          {board.map((row, y) =>
            row.map((cell, x) => {
              const win = isWinCell(x, y)
              const last = isLastMoveCell(x, y)
              const trong = cell === null
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  disabled={!coTheDi || !trong}
                  onClick={() => onCell(x, y)}
                  aria-label={`Ô ${x + 1}, ${y + 1}${cell ? ` — ${cell}` : ''}`}
                  className={cn(
                    'relative flex items-center justify-center transition-colors duration-100',
                    trong && coTheDi && 'cursor-pointer hover:bg-white/[0.05]',
                    win && 'bg-achievement/20',
                    last && !win && 'bg-white/[0.07]',
                  )}
                >
                  {cell && <QuanCo gameType={gameType} side={cell} className="w-[74%]" />}
                  {win && <span className="pointer-events-none absolute inset-0 ring-2 ring-achievement/80 ring-inset" />}
                </button>
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}

function BanConnect4({
  board,
  coTheDi,
  mySide,
  hoverCol,
  setHoverCol,
  isWinCell,
  isLastMoveCell,
  onCol,
}: {
  board: BoardCell[][]
  coTheDi: boolean
  mySide: PlayerSide | null
  hoverCol: number | null
  setHoverCol: (c: number | null) => void
  isWinCell: (x: number, y: number) => boolean
  isLastMoveCell: (x: number, y: number) => boolean
  onCol: (x: number) => void
}) {
  const soCot = board[0]?.length || 7
  return (
    <div>
      {/* Hàng quân xem trước ở cột đang trỏ */}
      <div className="grid gap-1.5 px-3 pb-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))` }}>
        {Array.from({ length: soCot }, (_, x) => (
          <span key={x} className="flex aspect-[5/3] items-end justify-center">
            {coTheDi && hoverCol === x && mySide && <QuanCo gameType="connect4" side={mySide} className="w-[55%] opacity-60" />}
          </span>
        ))}
      </div>
      <div
        className="grid gap-1.5 rounded-2xl border-2 border-[#2563eb] bg-[#1e3a8a] p-3 shadow-2xl shadow-blue-950/40 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))` }}
        onMouseLeave={() => setHoverCol(null)}
        role="grid"
        aria-label="Bàn Connect 4"
      >
        {board.map((row, y) =>
          row.map((cell, x) => {
            const win = isWinCell(x, y)
            const last = isLastMoveCell(x, y)
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                disabled={!coTheDi}
                onMouseEnter={() => setHoverCol(x)}
                onFocus={() => setHoverCol(x)}
                onClick={() => onCol(x)}
                aria-label={`Thả quân vào cột ${x + 1}`}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-full bg-[#020617] transition-colors duration-100',
                  coTheDi && 'cursor-pointer',
                  coTheDi && hoverCol === x && cell === null && 'bg-[#0b1a3d]',
                )}
              >
                {cell && <QuanCo gameType="connect4" side={cell} className="w-[88%]" />}
                {(win || last) && (
                  <span
                    className={cn(
                      'pointer-events-none absolute inset-0 rounded-full ring-inset',
                      win ? 'ring-[3px] ring-achievement' : 'ring-2 ring-white/60',
                    )}
                  />
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}

function BanReversi({
  board,
  coTheDi,
  isLastMoveCell,
  onCell,
}: {
  board: BoardCell[][]
  coTheDi: boolean
  isLastMoveCell: (x: number, y: number) => boolean
  onCell: (x: number, y: number) => void
}) {
  const soCot = board[0]?.length || 8
  return (
    <div
      className="grid gap-1 rounded-2xl border border-[#047857]/70 bg-[#022c22] p-2 shadow-2xl shadow-black/30 sm:gap-1.5 sm:p-2.5"
      style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))` }}
      role="grid"
      aria-label="Bàn Reversi 8×8"
    >
      {board.map((row, y) =>
        row.map((cell, x) => {
          const last = isLastMoveCell(x, y)
          const trong = cell === null
          return (
            <button
              key={`${x}-${y}`}
              type="button"
              disabled={!coTheDi || !trong}
              onClick={() => onCell(x, y)}
              aria-label={`Ô ${x + 1}, ${y + 1}${cell ? ` — ${cell === 'X' ? 'đen' : 'trắng'}` : ''}`}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-md bg-[#065f46] transition-colors duration-100',
                trong && coTheDi && 'cursor-pointer hover:bg-[#047857]',
              )}
            >
              {cell && <QuanCo gameType="reversi" side={cell} className="w-[78%]" />}
              {last && <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-brand/80 ring-inset" />}
            </button>
          )
        }),
      )}
    </div>
  )
}
