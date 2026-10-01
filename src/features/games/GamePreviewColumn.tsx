import { useEffect, useState } from 'react'
import { Bot, MousePointerClick, Play, Sparkles, Swords } from 'lucide-react'
import type { BoardCell, GameType, PlayerSide } from '@shared/protocol/game'
import { kiemTraThangCaro, taoBanMoi } from '../../../worker/game-engine'
import { Button } from '@/components/ui/button'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { SoloGameModal, type SoloGameType } from './SoloGameModal'
import { GameArt } from './GameArt'

const MAU_QUAN: Record<PlayerSide, string> = {
  X: 'bg-brand/10 text-brand shadow-[0_0_5px_rgba(198,161,90,0.85)]',
  O: 'bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_5px_rgba(217,70,239,0.85)]',
}

const KICH_BAN: Partial<Record<GameType, [number, number][]>> = {
  caro_15: [[5, 7], [5, 6], [6, 7], [6, 6], [7, 7], [7, 6], [8, 7], [8, 6], [9, 7]],
}

function applyNuoc(
  board: BoardCell[][],
  x: number,
  y: number,
  turn: PlayerSide,
  gameType: GameType,
): { board: BoardCell[][]; win: boolean; draw: boolean } | null {
  if (gameType === 'caro_15') {
    if (board[y][x] !== null) return null
    const next = board.map((r) => [...r])
    next[y][x] = turn
    return { board: next, win: Boolean(kiemTraThangCaro(next, x, y, turn)), draw: next.every((r) => r.every((c) => c !== null)) }
  }
  return null
}

interface TrangThaiDemo {
  board: BoardCell[][]
  turn: PlayerSide
  ketQua: string | null
  buoc: number
}

const trangThaiKhoiTao = (gameType: GameType): TrangThaiDemo => ({
  board: taoBanMoi(gameType),
  turn: 'X',
  ketQua: null,
  buoc: 0,
})

interface GamePreviewColumnProps {
  gameType: GameType
  onEnterRoom: () => void
}

export function GamePreviewColumn({ gameType, onEnterRoom }: GamePreviewColumnProps) {
  const info = GAME_CATALOG_BY_ID[gameType]
  if (info.category === 'solo') return <XemTruocSolo gameType={gameType as SoloGameType} />
  if (gameType === 'chess' || gameType === 'xiangqi') {
    return <XemTruocCoChien gameType={gameType} onEnterRoom={onEnterRoom} />
  }
  return <MinhHoaDoiKhang gameType={gameType} onEnterRoom={onEnterRoom} />
}

function XemTruocSolo({ gameType }: { gameType: SoloGameType }) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const [dangChoi, setDangChoi] = useState(false)

  return (
    <div className="flex h-full flex-col gap-4">
      <GameHeader gameType={gameType} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-default bg-surface/50 p-6 text-center">
        <span className="text-5xl">{info.icon}</span>
        <p className="text-xs text-muted-foreground">Trò chơi rèn luyện trí tuệ — có chế độ Đấu với Máy (AI) và 2 Người (PvP).</p>
      </div>
      <Button
        type="button"
        onClick={() => setDangChoi(true)}
        className="h-11 w-full gap-1.5 bg-brand font-extrabold text-primary-foreground shadow-lg shadow-brand/25 hover:bg-brand-hover cursor-pointer"
      >
        <Play className="size-4 fill-slate-950" /> Chơi Ngay
      </Button>
      {dangChoi && <SoloGameModal gameType={gameType} onClose={() => setDangChoi(false)} />}
    </div>
  )
}

function XemTruocCoChien({ gameType, onEnterRoom }: { gameType: GameType; onEnterRoom: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4">
      <GameHeader gameType={gameType} />
      <div className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-canvas p-4 shadow-inner">
        <div className="w-full max-w-[280px] aspect-video overflow-hidden rounded-xl">
          <GameArt gameType={gameType} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Bot className="size-4 text-brand" />
          <span>Hỗ trợ Đấu với Máy AI & Đấu 1v1</span>
        </div>
      </div>
      <Button
        type="button"
        onClick={onEnterRoom}
        className="h-11 w-full gap-1.5 bg-brand font-extrabold text-primary-foreground shadow-lg shadow-brand/25 hover:bg-brand-hover cursor-pointer"
      >
        <Swords className="size-4" /> Vào Bàn Đấu Ngay
      </Button>
    </div>
  )
}

function GameHeader({ gameType }: { gameType: GameType }) {
  const info = GAME_CATALOG_BY_ID[gameType]
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{info.icon}</span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold text-foreground">{info.title}</h2>
          <p className="truncate text-xs text-muted-foreground">
            {info.subtitle}
            {info.boardLabel ? ` · ${info.boardLabel}` : ''}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{info.description}</p>
    </div>
  )
}

function MinhHoaDoiKhang({ gameType, onEnterRoom }: { gameType: GameType; onEnterRoom: () => void }) {
  const [demo, setDemo] = useState<TrangThaiDemo>(() => trangThaiKhoiTao(gameType))
  const [tuChoi, setTuChoi] = useState(false)
  const [tuChoiDaXuLy, setTuChoiDaXuLy] = useState(tuChoi)
  if (tuChoi !== tuChoiDaXuLy) {
    setTuChoiDaXuLy(tuChoi)
    setDemo(trangThaiKhoiTao(gameType))
  }

  useEffect(() => {
    if (tuChoi) return
    const hen = setInterval(() => {
      setDemo((truoc) => {
        if (truoc.ketQua) return truoc
        const kichBan = KICH_BAN[gameType]
        const toaDo = kichBan ? (kichBan[truoc.buoc] ?? null) : null
        if (!toaDo) return { ...truoc, ketQua: 'Ván minh hoạ kết thúc — đang lặp lại…' }
        const kq = applyNuoc(truoc.board, toaDo[0], toaDo[1], truoc.turn, gameType)
        if (!kq) return { ...truoc, ketQua: 'Ván minh hoạ kết thúc — đang lặp lại…' }
        return {
          board: kq.board,
          turn: truoc.turn === 'X' ? 'O' : 'X',
          buoc: truoc.buoc + 1,
          ketQua: kq.win ? `Quân ${truoc.turn} thắng minh hoạ! 🎉` : kq.draw ? 'Hoà bàn minh hoạ!' : null,
        }
      })
    }, 800)
    return () => clearInterval(hen)
  }, [gameType, tuChoi])

  useEffect(() => {
    if (!demo.ketQua || tuChoi) return
    const t = setTimeout(() => setDemo(trangThaiKhoiTao(gameType)), 2200)
    return () => clearTimeout(t)
  }, [demo.ketQua, gameType, tuChoi])

  const datThuCong = (x: number, y: number) => {
    if (!tuChoi || demo.ketQua) return
    const kq = applyNuoc(demo.board, x, y, demo.turn, gameType)
    if (!kq) return
    setDemo({
      board: kq.board,
      turn: demo.turn === 'X' ? 'O' : 'X',
      buoc: demo.buoc + 1,
      ketQua: kq.win ? `Quân ${demo.turn} thắng! 🎉` : kq.draw ? 'Hoà bàn!' : null,
    })
  }

  const soCot = demo.board[0]?.length ?? 15

  return (
    <div className="flex h-full flex-col gap-3">
      <GameHeader gameType={gameType} />

      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
          {tuChoi ? (
            <MousePointerClick className="size-3.5 text-brand" />
          ) : (
            <Sparkles className="size-3.5 animate-pulse text-brand" />
          )}
          {tuChoi ? 'Chế độ tự thử' : 'Minh hoạ tự động'}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setTuChoi((v) => !v)}
          className="h-7 shrink-0 border-border-default text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-raised cursor-pointer"
        >
          {tuChoi ? 'Xem minh hoạ' : 'Tự thử luôn tay'}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-border-default bg-canvas p-3 shadow-inner">
        <div
          className="grid gap-[1.5px] rounded-lg bg-surface-raised/80 p-[2px]"
          style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))` }}
        >
          {demo.board.map((row, y) =>
            row.map((cell, x) => (
              <button
                key={`${x}-${y}`}
                type="button"
                onClick={() => datThuCong(x, y)}
                disabled={!tuChoi || Boolean(demo.ketQua)}
                className={`flex size-4 items-center justify-center rounded-[2px] text-[8px] font-black transition-colors sm:size-5 ${
                  cell === null
                    ? tuChoi
                      ? 'cursor-pointer bg-surface/90 hover:bg-surface-raised disabled:cursor-default'
                      : 'bg-surface/90'
                    : MAU_QUAN[cell]
                }`}
              >
                {cell}
              </button>
            )),
          )}
        </div>
      </div>

      <p className="min-h-4 text-center text-[11px] font-semibold text-brand">{demo.ketQua ?? ' '}</p>

      <Button
        type="button"
        onClick={onEnterRoom}
        className="h-11 w-full gap-1.5 bg-brand font-extrabold text-primary-foreground shadow-lg shadow-brand/25 hover:bg-brand-hover cursor-pointer"
      >
        <Swords className="size-4" /> Vào Đấu Ngay
      </Button>
    </div>
  )
}
