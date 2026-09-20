import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, Sparkles, Trophy, Users, Zap } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { Button } from '@/components/ui/button'
import { GameLeaderboard } from './GameLeaderboard'
import { GameLobbyColumn } from './GameLobbyColumn'
import { GamePreviewColumn } from './GamePreviewColumn'
import { GameSelectorColumn } from './GameSelectorColumn'

interface GameLobbyViewProps {
  onBackToHub: () => void
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  onJoinExisting: (roomId: string) => void
}

type MobilePanel = 'preview' | 'lobby' | 'leaderboard'

const maBanNgauNhien = (gameType: GameType) =>
  `${gameType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

const MOBILE_TABS: { id: MobilePanel; label: string; icon: typeof Sparkles }[] = [
  { id: 'preview', label: 'Xem trước', icon: Sparkles },
  { id: 'lobby', label: 'Bàn đấu', icon: Users },
  { id: 'leaderboard', label: 'Xếp hạng', icon: Trophy },
]

// 4 cột: (1) chọn trò chơi — (2) xem trước/minh hoạ trò đang chọn — (3) sảnh bàn đang mở của đúng trò đó
// — (4) bảng xếp hạng của đúng trò đó. Dưới màn hình lớn (xl) chỉ 1 trong 3 cột sau hiện tại 1 lúc,
// chuyển bằng thanh tab ngay dưới cột chọn trò chơi (đã gộp thành dải cuộn ngang ở kích thước này).
export function GameLobbyView({ onBackToHub, onCreateRoom, onJoinExisting }: GameLobbyViewProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>('caro_15')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('preview')

  const { data: tablesData, isPending: tablesPending, isError: tablesError } = useGameRooms()
  const tables = useMemo<BanSanh[]>(() => tablesData ?? [], [tablesData])

  const waitingCounts = useMemo(() => {
    const dem: Partial<Record<GameType, number>> = {}
    for (const t of tables) {
      if (t.trangThai === 'waiting') dem[t.gameType] = (dem[t.gameType] ?? 0) + 1
    }
    return dem
  }, [tables])
  const soDangChoi = useMemo(() => tables.filter((t) => t.trangThai === 'playing').length, [tables])
  const tongNguoiXem = useMemo(() => tables.reduce((sum, t) => sum + t.soNguoiXem, 0), [tables])

  const openExisting = useCallback(
    (gameType: GameType): boolean => {
      const banCho = tables
        .filter((t) => t.gameType === gameType && t.trangThai === 'waiting')
        .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]
      if (banCho) {
        onJoinExisting(banCho.id)
        return true
      }
      return false
    },
    [tables, onJoinExisting],
  )

  const handleEnterSelected = useCallback(() => {
    if (openExisting(selectedGame)) return
    onCreateRoom(maBanNgauNhien(selectedGame), selectedGame, 30)
  }, [selectedGame, openExisting, onCreateRoom])

  const handleCreate = useCallback(
    (turnSeconds: number) => {
      onCreateRoom(maBanNgauNhien(selectedGame), selectedGame, turnSeconds)
    },
    [selectedGame, onCreateRoom],
  )

  const handleQuickMatch = useCallback(() => {
    const banBatKy = tables.filter((t) => t.trangThai === 'waiting').sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]
    if (banBatKy) {
      onJoinExisting(banBatKy.id)
      return
    }
    onCreateRoom(maBanNgauNhien('caro_15'), 'caro_15', 30)
  }, [tables, onJoinExisting, onCreateRoom])

  const handleSelectGame = useCallback((id: GameType) => {
    setSelectedGame(id)
    setMobilePanel('preview')
  }, [])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-canvas font-sans text-foreground">
      {/* Glow ambient background */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[300px] w-[600px] rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[350px] w-[500px] rounded-full bg-social/10 blur-[140px]" />

      {/* Top Header */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-surface/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border-default bg-surface-raised/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-overlay hover:text-foreground cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Sảnh chính</span>
          </button>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-foreground">
              <span className="text-xl">🎮</span>
              Đấu Trường Game
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              {tablesPending
                ? 'Đang tải dữ liệu…'
                : `${tables.length} bàn đang mở · ${soDangChoi} trận trực tiếp · ${tongNguoiXem} người đang xem`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleQuickMatch}
          className="h-9 gap-1.5 bg-gradient-to-r from-warning to-amber-600 px-3.5 font-black text-slate-950 shadow-lg shadow-warning/20 hover:from-amber-400 hover:to-orange-500 cursor-pointer"
        >
          <Zap className="size-3.5 fill-slate-950" />
          <span className="hidden sm:inline">⚡ Ghép Nhanh</span>
          <span className="sm:hidden">Ghép nhanh</span>
        </Button>
      </header>

      {/* 4 cột chính */}
      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 xl:grid xl:grid-cols-[14rem_1fr_20rem_18rem] xl:items-stretch xl:overflow-hidden xl:p-5"
        style={{ overflowAnchor: 'none' }}
      >
        {/* Cột 1: chọn trò chơi */}
        <div className="shrink-0 xl:h-full xl:min-h-0">
          <GameSelectorColumn selectedGame={selectedGame} onSelect={handleSelectGame} waitingCounts={waitingCounts} />
        </div>

        {/* Chuyển cột 2/3/4 trên di động & tablet (từ xl trở lên hiện đồng thời cả 3) */}
        <div className="flex shrink-0 gap-1 rounded-xl border border-border-default bg-surface/90 p-1 xl:hidden">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobilePanel(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                mobilePanel === tab.id ? 'bg-gradient-to-r from-brand to-cyan-600 text-slate-950 font-black shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="size-3" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cột 2: xem trước / minh hoạ */}
        <div
          className={`${mobilePanel === 'preview' ? 'flex' : 'hidden'} min-h-[420px] flex-col rounded-3xl border border-border-default bg-surface/70 p-5 shadow-lg backdrop-blur-md xl:flex xl:h-full xl:min-h-0 xl:overflow-y-auto`}
          style={{ overflowAnchor: 'none' }}
        >
          <GamePreviewColumn key={selectedGame} gameType={selectedGame} onEnterRoom={handleEnterSelected} />
        </div>

        {/* Cột 3: sảnh bàn đấu */}
        <div
          className={`${mobilePanel === 'lobby' ? 'flex' : 'hidden'} min-h-[420px] flex-col rounded-3xl border border-border-default bg-surface/70 p-4 shadow-lg backdrop-blur-md xl:flex xl:h-full xl:min-h-0 xl:overflow-hidden`}
        >
          <GameLobbyColumn
            gameType={selectedGame}
            tables={tables}
            isPending={tablesPending}
            isError={tablesError}
            onEnter={onJoinExisting}
            onCreate={handleCreate}
          />
        </div>

        {/* Cột 4: bảng xếp hạng */}
        <div
          className={`${mobilePanel === 'leaderboard' ? 'flex' : 'hidden'} min-h-[420px] flex-col rounded-3xl border border-border-default bg-surface/70 p-4 shadow-lg backdrop-blur-md xl:flex xl:h-full xl:min-h-0 xl:overflow-hidden`}
        >
          <GameLeaderboard gameType={selectedGame} />
        </div>
      </div>
    </div>
  )
}
