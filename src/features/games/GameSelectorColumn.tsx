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
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
              category === tab.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon ? <tab.icon className="size-3" /> : null}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm trò chơi…"
          className="h-8 border-slate-800 bg-slate-900/90 pl-8 text-xs text-white placeholder:text-slate-500"
        />
      </div>

      <div
        className="flex min-h-0 flex-1 gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-x-visible xl:overflow-y-auto xl:pb-0"
        style={{ overflowAnchor: 'none' }}
      >
        {games.length === 0 ? (
          <div className="flex w-full items-center justify-center py-6 text-center text-xs text-slate-500">
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
                className={`flex w-44 shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all xl:w-full xl:shrink ${
                  active
                    ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/70 text-base">
                  {g.icon}
                </span>
                <span className="min-w-0">
                  <span className={`block truncate text-xs font-bold ${active ? 'text-cyan-300' : 'text-white'}`}>
                    {g.shortTitle}
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    {g.category === '1v1' ? (
                      soCho > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-cyan-400">
                          <span className="size-1 animate-pulse rounded-full bg-cyan-400" />⚡ {soCho} bàn chờ
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
