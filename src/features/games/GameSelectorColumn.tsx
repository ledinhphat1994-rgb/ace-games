import { useState } from 'react'
import { Gamepad2, Search, Swords } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { Input } from '@/components/ui/input'
import { GAME_CATALOG } from './game-catalog'

type Category = 'all' | '1v1' | 'solo'

interface GameSelectorColumnProps {
  selectedGame: GameType
  onSelect: (id: GameType) => void
  waitingCounts: Partial<Record<GameType, number>>
}

const TABS: { id: Category; label: string; icon: typeof Swords | null }[] = [
  { id: 'all', label: 'Tất cả', icon: null },
  { id: '1v1', label: 'Đối kháng', icon: Swords },
  { id: 'solo', label: 'Solo', icon: Gamepad2 },
]

// Cột 1: chọn trò chơi — lọc theo thể loại + tìm kiếm, danh sách dọc (ngang khi thu gọn trên di động).
export function GameSelectorColumn({ selectedGame, onSelect, waitingCounts }: GameSelectorColumnProps) {
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')

  const tuKhoa = search.trim().toLowerCase()
  const games = GAME_CATALOG.filter((g) => {
    if (category === '1v1' && g.category !== '1v1') return false
    if (category === 'solo' && g.category !== 'solo') return false
    if (tuKhoa && !g.title.toLowerCase().includes(tuKhoa)) return false
    return true
  })

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex gap-1 rounded-xl border border-border-default bg-surface/90 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              category === tab.id
                ? 'bg-brand text-primary-foreground font-black shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon ? <tab.icon className="size-3" /> : null}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm trò chơi…"
          className="h-8 border-border-default bg-surface/80 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-brand/40"
        />
      </div>

      <div
        className="flex min-h-0 flex-1 gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:pb-0"
        style={{ overflowAnchor: 'none' }}
      >
        {games.length === 0 ? (
          <div className="flex w-full items-center justify-center py-6 text-center text-xs text-muted-foreground">
            Không tìm thấy trò chơi phù hợp.
          </div>
        ) : (
          games.map((g) => {
            const active = g.id === selectedGame
            const soCho = waitingCounts[g.id] ?? 0
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelect(g.id)}
                className={`flex w-44 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer xl:w-full xl:shrink ${
                  active
                    ? 'border-brand/60 bg-brand/10 shadow-[0_0_0_1px_rgba(198,161,90,0.25)]'
                    : 'border-border-default bg-surface/60 hover:border-border-strong hover:bg-surface-raised'
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-base">
                  {g.icon}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-xs font-bold ${active ? 'text-brand' : 'text-foreground'}`}>
                    {g.shortTitle}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {g.category === '1v1' ? (
                      soCho > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand">
                          <span className="size-1 animate-pulse rounded-full bg-brand" />⚡ {soCho} bàn chờ
                        </span>
                      ) : (
                        'Đối kháng 1v1'
                      )
                    ) : (
                      'Chơi đơn'
                    )}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
