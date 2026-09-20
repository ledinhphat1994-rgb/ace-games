import { useState } from 'react'
import { Plus, Swords, Users } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { GameTableCard } from './GameTableCard'

type TableFilter = 'all' | 'waiting' | 'playing'

interface GameLobbyColumnProps {
  gameType: GameType
  tables: BanSanh[]
  isPending: boolean
  isError: boolean
  onEnter: (id: string) => void
  onCreate: (turnSeconds: number) => void
}

// Cột 3: sảnh bàn đang mở CHO ĐÚNG trò chơi đang chọn ở cột 1, kèm tạo bàn mới ngay tại chỗ
// (không cần modal chọn lại trò chơi vì đã chọn sẵn ở cột 1).
export function GameLobbyColumn({ gameType, tables, isPending, isError, onEnter, onCreate }: GameLobbyColumnProps) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const [filter, setFilter] = useState<TableFilter>('all')
  const [turnSeconds, setTurnSeconds] = useState(30)

  if (info.category === 'solo') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-default bg-surface/50 p-6 text-center">
        <Users className="size-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Trò chơi đơn không có bàn đấu — bấm "Chơi Ngay" ở cột bên để bắt đầu.</p>
      </div>
    )
  }

  const cuaGame = tables.filter((t) => t.gameType === gameType)
  const filtered = cuaGame.filter((t) => filter === 'all' || t.trangThai === filter)

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="shrink-0">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Users className="size-4 text-brand" /> Bàn {info.shortTitle}
        </h3>
        <div className="mt-2 flex gap-1.5">
          {(
            [
              { id: 'all', label: 'Tất cả' },
              { id: 'waiting', label: 'Đang chờ' },
              { id: 'playing', label: 'Đang chơi' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                filter === f.id ? 'bg-brand text-slate-950 font-black shadow-sm' : 'bg-surface-raised text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border-default bg-surface/60 p-2">
        <div className="flex flex-1 gap-1">
          {[15, 30, 60].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTurnSeconds(s)}
              className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                turnSeconds === s ? 'bg-brand text-slate-950 font-black' : 'bg-surface-raised text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => onCreate(turnSeconds)}
          className="h-7 shrink-0 gap-1 bg-brand text-slate-950 font-bold hover:bg-brand-hover cursor-pointer"
        >
          <Plus className="size-3" /> Tạo bàn
        </Button>
      </div>

      <div className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {isError ? (
          <div className="flex h-24 items-center justify-center text-xs text-destructive">Không tải được danh sách bàn.</div>
        ) : filtered.length > 0 ? (
          filtered.map((t) => <GameTableCard key={t.id} table={t} onEnter={() => onEnter(t.id)} hideGameBadge />)
        ) : (
          <div className="flex h-24 flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <Swords className="size-5 text-muted-foreground/60" />
            {isPending
              ? 'Đang tải…'
              : filter === 'waiting'
                ? 'Chưa có bàn nào đang chờ.'
                : filter === 'playing'
                  ? 'Chưa có trận nào đang diễn ra.'
                  : 'Chưa có bàn nào — hãy tạo bàn đầu tiên!'}
          </div>
        )}
      </div>
    </div>
  )
}
