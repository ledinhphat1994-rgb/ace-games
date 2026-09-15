import { useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import type { BoardCell, GameType, PlayerSide } from '@shared/protocol/game'
import {
  coNuocDiHopLeReversi,
  demQuanReversi,
  kiemTraThangCaro,
  kiemTraThangConnect4,
  kiemTraVaLatReversi,
  taoBanMoi,
} from '../../../worker/game-engine'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface BoardPreviewSheetProps {
  gameType: GameType | null
  onOpenChange: (open: boolean) => void
}

const MAU_QUAN: Record<PlayerSide, string> = {
  X: 'bg-cyan-950 text-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.85)]',
  O: 'bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_5px_rgba(217,70,239,0.85)]',
}

// Khung thử nước cờ dùng ĐÚNG luật thật (worker/game-engine.ts, isomorphic) — không phải bàn giả lập
// riêng, để "cảm giác đánh cờ" ở đây khớp hệt bàn đấu thật khi vào phòng.
export function BoardPreviewSheet({ gameType, onOpenChange }: BoardPreviewSheetProps) {
  const [board, setBoard] = useState<BoardCell[][]>(() => taoBanMoi(gameType ?? 'caro_15'))
  const [turn, setTurn] = useState<PlayerSide>('X')
  const [thongBao, setThongBao] = useState<string | null>(null)
  // Bàn thử phải theo đúng trò chơi đang mở trong Sheet; dùng "adjust state while rendering" (React docs)
  // thay vì useEffect+setState để tránh render thừa mỗi lần đổi trò chơi.
  const [loaiDaXuLy, setLoaiDaXuLy] = useState<GameType | null>(gameType)

  const info = gameType ? GAME_CATALOG_BY_ID[gameType] : null

  if (gameType !== loaiDaXuLy) {
    setLoaiDaXuLy(gameType)
    setBoard(taoBanMoi(gameType ?? 'caro_15'))
    setTurn('X')
    setThongBao(null)
  }

  const datLai = (loai: GameType) => {
    setBoard(taoBanMoi(loai))
    setTurn('X')
    setThongBao(null)
  }

  const dat = (x: number, y: number) => {
    if (!gameType || thongBao) return

    if (gameType === 'caro_15' || gameType === 'caro_9') {
      if (board[y][x] !== null) return
      const banMoi = board.map((r) => [...r])
      banMoi[y][x] = turn
      setBoard(banMoi)
      if (kiemTraThangCaro(banMoi, x, y, turn)) {
        setThongBao(`Quân ${turn} thắng! 🎉`)
      } else if (banMoi.every((row) => row.every((c) => c !== null))) {
        setThongBao('Hoà bàn!')
      } else {
        setTurn(turn === 'X' ? 'O' : 'X')
      }
      return
    }

    if (gameType === 'connect4') {
      let dropY = -1
      for (let r = board.length - 1; r >= 0; r--) {
        if (board[r][x] === null) {
          dropY = r
          break
        }
      }
      if (dropY === -1) return
      const banMoi = board.map((r) => [...r])
      banMoi[dropY][x] = turn
      setBoard(banMoi)
      if (kiemTraThangConnect4(banMoi, x, dropY, turn)) {
        setThongBao(`Quân ${turn} thắng! 🎉`)
      } else if (banMoi.every((row) => row.every((c) => c !== null))) {
        setThongBao('Hoà bàn!')
      } else {
        setTurn(turn === 'X' ? 'O' : 'X')
      }
      return
    }

    if (gameType === 'reversi') {
      const { hopLe, flipped } = kiemTraVaLatReversi(board, x, y, turn)
      if (!hopLe) return
      const banMoi = board.map((r) => [...r])
      banMoi[y][x] = turn
      for (const [fx, fy] of flipped) banMoi[fy][fx] = turn
      setBoard(banMoi)

      const doiThu: PlayerSide = turn === 'X' ? 'O' : 'X'
      if (coNuocDiHopLeReversi(banMoi, doiThu)) {
        setTurn(doiThu)
      } else if (coNuocDiHopLeReversi(banMoi, turn)) {
        setTurn(turn)
      } else {
        const { scoreX, scoreO } = demQuanReversi(banMoi)
        setThongBao(scoreX === scoreO ? 'Hoà bàn!' : `Quân ${scoreX > scoreO ? 'X' : 'O'} thắng! 🎉`)
      }
    }
  }

  const soCot = board[0]?.length ?? 15

  return (
    <Sheet open={gameType !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-slate-800 pr-12">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Sparkles className="size-4 text-cyan-400" />
            Thử nước cờ · {info?.shortTitle ?? ''}
          </SheetTitle>
          <SheetDescription>Bấm trực tiếp vào bàn để thử cảm giác đánh cờ theo đúng luật thật.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {thongBao ?? (
                <>
                  Lượt hiện tại:{' '}
                  <span className={turn === 'X' ? 'font-bold text-cyan-400' : 'font-bold text-fuchsia-400'}>
                    Quân {turn} ({turn === 'X' ? 'Cyan' : 'Fuchsia'})
                  </span>
                </>
              )}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => gameType && datLai(gameType)}
              title="Chơi lại"
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          </div>

          <div className="flex justify-center rounded-2xl border border-slate-800/80 bg-slate-950 p-2 shadow-inner">
            <div
              className="grid gap-[1.5px] rounded-lg bg-slate-800/60 p-[2px]"
              style={{ gridTemplateColumns: `repeat(${soCot}, minmax(0, 1fr))` }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    onClick={() => dat(x, y)}
                    disabled={Boolean(thongBao)}
                    className={`flex size-4.5 items-center justify-center rounded-[2px] text-[9px] font-black transition-colors sm:size-5 ${
                      cell === null
                        ? 'cursor-pointer bg-slate-900/90 hover:bg-slate-800 disabled:cursor-default'
                        : MAU_QUAN[cell]
                    }`}
                  >
                    {cell}
                  </button>
                )),
              )}
            </div>
          </div>

          {thongBao && (
            <Button
              type="button"
              onClick={() => gameType && datLai(gameType)}
              className="w-full gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-bold hover:from-cyan-400 hover:to-blue-500"
            >
              <RefreshCw className="size-3.5" /> Chơi lại ván thử
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
