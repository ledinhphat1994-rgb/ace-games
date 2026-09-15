import { useEffect, useState } from 'react'
import { MousePointerClick, Play, Sparkles, Swords } from 'lucide-react'
import type { BoardCell, GameType, PlayerSide } from '@shared/protocol/game'
import {
  kiemTraThangCaro,
  kiemTraThangConnect4,
  kiemTraVaLatReversi,
  taoBanMoi,
} from '../../../worker/game-engine'
import { Button } from '@/components/ui/button'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { SoloGameModal, type SoloGameType } from './SoloGameModal'

const MAU_QUAN: Record<PlayerSide, string> = {
  X: 'bg-cyan-950 text-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.85)]',
  O: 'bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_5px_rgba(217,70,239,0.85)]',
}

// Kịch bản minh hoạ ĐÃ KIỂM CHỨNG hợp lệ với đúng luật thật — thắng hàng ngang giữa bàn.
// connect4 chỉ cần cột (x); y luôn để 0, applyNuoc tự tính hàng rơi thật.
const KICH_BAN: Partial<Record<GameType, [number, number][]>> = {
  caro_15: [[5, 7], [5, 6], [6, 7], [6, 6], [7, 7], [7, 6], [8, 7], [8, 6], [9, 7]],
  caro_9: [[2, 4], [2, 3], [3, 4], [3, 3], [4, 4], [4, 3], [5, 4], [5, 3], [6, 4]],
  connect4: [[0, 0], [6, 0], [1, 0], [6, 0], [2, 0], [6, 0], [3, 0]],
}

function timNuocReversi(board: BoardCell[][], turn: PlayerSide): [number, number] | null {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (board[y][x] !== null) continue
      if (kiemTraVaLatReversi(board, x, y, turn).hopLe) return [x, y]
    }
  }
  return null
}

function applyNuoc(
  board: BoardCell[][],
  x: number,
  y: number,
  turn: PlayerSide,
  gameType: GameType,
): { board: BoardCell[][]; win: boolean; draw: boolean } | null {
  if (gameType === 'caro_15' || gameType === 'caro_9') {
    if (board[y][x] !== null) return null
    const next = board.map((r) => [...r])
    next[y][x] = turn
    return { board: next, win: Boolean(kiemTraThangCaro(next, x, y, turn)), draw: next.every((r) => r.every((c) => c !== null)) }
  }
  if (gameType === 'connect4') {
    let dropY = -1
    for (let r = board.length - 1; r >= 0; r--) {
      if (board[r][x] === null) {
        dropY = r
        break
      }
    }
    if (dropY === -1) return null
    const next = board.map((r) => [...r])
    next[dropY][x] = turn
    return { board: next, win: Boolean(kiemTraThangConnect4(next, x, dropY, turn)), draw: next.every((r) => r.every((c) => c !== null)) }
  }
  // reversi
  const { hopLe, flipped } = kiemTraVaLatReversi(board, x, y, turn)
  if (!hopLe) return null
  const next = board.map((r) => [...r])
  next[y][x] = turn
  for (const [fx, fy] of flipped) next[fy][fx] = turn
  return { board: next, win: false, draw: false }
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

// Cột 2: xem trước trò chơi đang chọn — đối kháng thì minh hoạ tự động (đúng luật thật, có thể tự thử tay);
// chơi đơn thì mở thẳng trò chơi thật (không cần bàn), vì bản thân trò đó không dùng chung bàn cờ đối kháng.
export function GamePreviewColumn({ gameType, onEnterRoom }: GamePreviewColumnProps) {
  const info = GAME_CATALOG_BY_ID[gameType]
  if (info.category === 'solo') return <XemTruocSolo gameType={gameType as SoloGameType} />
  return <MinhHoaDoiKhang gameType={gameType} onEnterRoom={onEnterRoom} />
}

function XemTruocSolo({ gameType }: { gameType: SoloGameType }) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const [dangChoi, setDangChoi] = useState(false)

  return (
    <div className="flex h-full flex-col gap-4">
      <GameHeader gameType={gameType} />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center">
        <span className="text-5xl">{info.icon}</span>
        <p className="text-xs text-slate-500">Trò chơi một người — điểm số cao nhất được ghi vào bảng xếp hạng bên cạnh.</p>
      </div>
      <Button
        type="button"
        onClick={() => setDangChoi(true)}
        className="h-11 w-full gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
      >
        <Play className="size-4 fill-white" /> Chơi Ngay
      </Button>
      {dangChoi && <SoloGameModal gameType={gameType} onClose={() => setDangChoi(false)} />}
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
          <h2 className="truncate text-base font-extrabold text-white">{info.title}</h2>
          <p className="truncate text-xs text-slate-400">
            {info.subtitle}
            {info.boardLabel ? ` · ${info.boardLabel}` : ''}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{info.description}</p>
    </div>
  )
}

function MinhHoaDoiKhang({ gameType, onEnterRoom }: { gameType: GameType; onEnterRoom: () => void }) {
  const [demo, setDemo] = useState<TrangThaiDemo>(() => trangThaiKhoiTao(gameType))
  const [tuChoi, setTuChoi] = useState(false)
  // Component được remount theo key={gameType} ở nơi gọi, nên chỉ cần theo dõi tuChoi đổi để reset —
  // "adjust state while rendering" (React docs) thay vì useEffect+setState, tránh render thừa.
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
        const toaDo = kichBan ? (kichBan[truoc.buoc] ?? null) : timNuocReversi(truoc.board, truoc.turn)
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

  // Đợi người xem kịp thấy kết quả rồi mới lặp lại từ đầu, tách khỏi nhịp đi quân ở trên.
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
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          {tuChoi ? (
            <MousePointerClick className="size-3.5 text-cyan-400" />
          ) : (
            <Sparkles className="size-3.5 animate-pulse text-cyan-400" />
          )}
          {tuChoi ? 'Chế độ tự thử' : 'Minh hoạ tự động'}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setTuChoi((v) => !v)}
          className="h-7 shrink-0 border-slate-700 text-[11px] text-slate-300 hover:text-white"
        >
          {tuChoi ? 'Xem minh hoạ' : 'Tự thử luôn tay'}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950 p-3 shadow-inner">
        <div
          className="grid gap-[1.5px] rounded-lg bg-slate-800/60 p-[2px]"
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
                      ? 'cursor-pointer bg-slate-900/90 hover:bg-slate-800 disabled:cursor-default'
                      : 'bg-slate-900/90'
                    : MAU_QUAN[cell]
                }`}
              >
                {cell}
              </button>
            )),
          )}
        </div>
      </div>

      <p className="min-h-4 text-center text-[11px] font-semibold text-cyan-300">{demo.ketQua ?? ' '}</p>

      <Button
        type="button"
        onClick={onEnterRoom}
        className="h-11 w-full gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
      >
        <Swords className="size-4" /> Vào Đấu Ngay
      </Button>
    </div>
  )
}
