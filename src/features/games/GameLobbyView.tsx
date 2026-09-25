import { useCallback, useMemo, useState } from 'react'
import { Plus, Swords, Zap } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { LiveDot, PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'
import { GameCard } from './GameCard'
import { GameLeaderboard } from './GameLeaderboard'
import { GameTableCard } from './GameTableCard'
import { laTroChoiDon, taoMaBan } from './game-ids'
import { CAC_GAME_1V1, CAC_GAME_SOLO, GAME_CATALOG_BY_ID } from './game-catalog'

interface GameLobbyViewProps {
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  onJoinExisting: (roomId: string) => void
}

const THOI_GIAN_LUOT = [15, 30, 60] as const
const SO_BAN_HIEN_THI = 6

/** Bàn đang chờ lên trước (vào chơi được ngay), rồi bàn đông người xem, rồi bàn mới cập nhật. */
function xepBan(a: BanSanh, b: BanSanh) {
  const uuTien = (t: BanSanh) => (t.trangThai === 'waiting' ? 0 : 1)
  return uuTien(a) - uuTien(b) || b.soNguoiXem - a.soNguoiXem || b.capNhatLuc - a.capNhatLuc
}

export function GameLobbyView({ onCreateRoom, onJoinExisting }: GameLobbyViewProps) {
  const [hopThoaiBan, setHopThoaiBan] = useState<{ open: boolean; game: GameType }>({ open: false, game: 'caro_15' })
  const [turnSeconds, setTurnSeconds] = useState<number>(30)

  const { data: tablesData, isPending: tablesPending, isError: tablesError, refetch, isRefetching } = useGameRooms()
  // Bàn đã kết thúc không vào được nữa — chỉ hiện bàn đang chờ / đang đấu.
  const tables = useMemo<BanSanh[]>(
    () => (tablesData ?? []).filter((t) => t.trangThai !== 'ended').sort(xepBan),
    [tablesData],
  )

  const waitingCounts = useMemo(() => {
    const dem: Partial<Record<GameType, number>> = {}
    for (const t of tables) {
      if (t.trangThai === 'waiting') dem[t.gameType] = (dem[t.gameType] ?? 0) + 1
    }
    return dem
  }, [tables])

  const soDangCho = useMemo(() => tables.filter((t) => t.trangThai === 'waiting').length, [tables])
  const soDangChoi = tables.length - soDangCho
  const tongNguoiXem = useMemo(() => tables.reduce((sum, t) => sum + t.soNguoiXem, 0), [tables])

  // Chơi ngay: trò đơn mở phiên riêng; trò đối kháng vào bàn đang chờ đông người xem nhất, không có thì mở bàn mới.
  const handlePlayGame = useCallback(
    (gameType: GameType) => {
      if (laTroChoiDon(gameType)) {
        onCreateRoom(taoMaBan(gameType), gameType, 0)
        return
      }

      const waiting = tables
        .filter((t) => t.gameType === gameType && t.trangThai === 'waiting')
        .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]

      if (waiting) {
        onJoinExisting(waiting.id)
        return
      }

      onCreateRoom(taoMaBan(gameType), gameType, 30)
    },
    [tables, onJoinExisting, onCreateRoom],
  )

  const handleQuickMatch = useCallback(() => {
    const banBatKy = tables
      .filter((t) => t.trangThai === 'waiting')
      .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]

    if (banBatKy) {
      onJoinExisting(banBatKy.id)
      return
    }
    onCreateRoom(taoMaBan('caro_15'), 'caro_15', 30)
  }, [tables, onJoinExisting, onCreateRoom])

  const moHopThoaiBan = (game: GameType) => setHopThoaiBan({ open: true, game })
  const tableCuaTroDangMo = tables.filter((t) => t.gameType === hopThoaiBan.game)
  const troDangMo = GAME_CATALOG_BY_ID[hopThoaiBan.game]

  const moTaTrucTiep = tablesPending ? (
    <span className="inline-flex items-center gap-2">
      <LiveDot tone="muted" />
      Đang kết nối đấu trường…
    </span>
  ) : tablesError ? (
    <span className="inline-flex items-center gap-2 text-warning">
      <LiveDot tone="warning" />
      Chưa tải được danh sách bàn — hệ thống đang thử lại.
    </span>
  ) : (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <LiveDot tone={tables.length > 0 ? 'success' : 'muted'} />
      <span>
        <span className="font-semibold text-text-primary tabular-nums">{soDangCho}</span> bàn đang chờ
      </span>
      <span className="text-text-tertiary">·</span>
      <span>
        <span className="font-semibold text-text-primary tabular-nums">{soDangChoi}</span> trận đang diễn ra
      </span>
      <span className="text-text-tertiary">·</span>
      <span>
        <span className="font-semibold text-text-primary tabular-nums">{tongNguoiXem}</span> người xem
      </span>
    </span>
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Game"
        description={moTaTrucTiep}
        actions={
          <Button onClick={handleQuickMatch} data-testid="game-quick-match-btn">
            <Zap className="fill-current" />
            Ghép trận nhanh
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="game-1v1-heading" className="space-y-4">
            <SectionHeader
              id="game-1v1-heading"
              title="Đấu 1v1"
              description="Vào bàn bạn khác đang chờ, hoặc mở bàn mới và chờ đối thủ."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {CAC_GAME_1V1.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  waiting={waitingCounts[game.id] ?? 0}
                  onPlay={() => handlePlayGame(game.id)}
                  onOpenTables={() => moHopThoaiBan(game.id)}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="game-solo-heading" className="space-y-4">
            <SectionHeader
              id="game-solo-heading"
              title="Chơi đơn"
              description="Thử thách bản thân trong vài phút giải lao."
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {CAC_GAME_SOLO.map((game) => (
                <GameCard key={game.id} game={game} waiting={0} onPlay={() => handlePlayGame(game.id)} />
              ))}
            </div>
          </section>
        </div>

        <aside className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start lg:grid-cols-1 lg:self-start">
          <section
            aria-labelledby="game-open-tables-heading"
            className="overflow-hidden rounded-2xl border border-border-subtle bg-surface"
          >
            <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
              <h2
                id="game-open-tables-heading"
                className="flex items-baseline gap-2 text-[0.9375rem] leading-6 font-semibold text-text-primary"
              >
                Bàn đang mở
                {!tablesPending && !tablesError && (
                  <span className="text-sm font-medium tabular-nums text-text-tertiary">{tables.length}</span>
                )}
              </h2>
            </div>

            <div className="min-h-[196px] px-2 pb-2" style={{ overflowAnchor: 'none' }}>
              {tablesPending ? (
                <div className="space-y-1" aria-busy="true" aria-label="Đang tải danh sách bàn">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                      <div className="size-10 animate-pulse rounded-lg bg-surface-overlay" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-overlay" />
                        <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-overlay/70" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : tablesError ? (
                <div className="flex min-h-[188px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <p className="text-[0.8125rem] text-text-secondary">Không tải được danh sách bàn.</p>
                  <Button size="xs" variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
                    Thử lại
                  </Button>
                </div>
              ) : tables.length === 0 ? (
                <div className="flex min-h-[188px] flex-col items-center justify-center px-6 text-center">
                  <Swords className="size-5 text-text-tertiary" />
                  <p className="mt-2.5 text-[0.8125rem] font-medium text-text-primary">Chưa có bàn nào đang mở</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
                    Bấm “Chơi ngay” ở một trò 1v1 để mở bàn đầu tiên.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-0.5">
                    {tables.slice(0, SO_BAN_HIEN_THI).map((table) => (
                      <GameTableCard key={table.id} table={table} onEnter={() => onJoinExisting(table.id)} />
                    ))}
                  </div>
                  {tables.length > SO_BAN_HIEN_THI && (
                    <p className="px-2 pt-2 pb-1 text-xs text-text-tertiary">
                      Còn {tables.length - SO_BAN_HIEN_THI} bàn khác — chọn “Bàn” ở từng trò để xem đủ.
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface p-4">
            <GameLeaderboard gameType="solo_snake" verifiedOnly limit={5} />
          </section>
        </aside>
      </div>

      {/* ── Hộp thoại bàn của một trò đối kháng ───────────────── */}
      <Dialog open={hopThoaiBan.open} onOpenChange={(open) => setHopThoaiBan((s) => ({ ...s, open }))}>
        <DialogContent className="gap-0 p-0 sm:max-w-md">
          <div className="flex items-center gap-3 border-b border-border-subtle p-4 pr-12">
            <div className="size-11 shrink-0 overflow-hidden rounded-xl">
              <GameArt gameType={hopThoaiBan.game} variant="icon" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-6 font-semibold text-text-primary">
                {troDangMo.shortTitle}
              </DialogTitle>
              <DialogDescription className="text-[0.8125rem] text-text-secondary">
                Vào bàn đang chờ hoặc mở bàn mới.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <p className="text-xs font-medium text-text-secondary">Thời gian mỗi lượt</p>
            <div className="day-loc-deu [--the-nho-nhat:4.5rem]" role="group" aria-label="Thời gian mỗi lượt">
              {THOI_GIAN_LUOT.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={turnSeconds === s}
                  onClick={() => setTurnSeconds(s)}
                  className={cn(
                    'flex h-9 items-center rounded-xl border text-sm font-medium transition-colors duration-150',
                    turnSeconds === s
                      ? 'border-brand/60 bg-brand/10 text-brand'
                      : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                  )}
                >
                  {s} giây
                </button>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const g = hopThoaiBan.game
                setHopThoaiBan((s) => ({ ...s, open: false }))
                onCreateRoom(taoMaBan(g), g, turnSeconds)
              }}
            >
              <Plus />
              Mở bàn mới
            </Button>
          </div>

          <div className="border-t border-border-subtle p-4 pt-3">
            <p className="flex items-baseline gap-2 px-0 pb-1.5 text-xs font-medium text-text-secondary">
              Bàn đang mở
              <span className="tabular-nums text-text-tertiary">{tableCuaTroDangMo.length}</span>
            </p>
            <div className="-mx-2 max-h-64 min-h-[88px] overflow-y-auto" style={{ overflowAnchor: 'none' }}>
              {tableCuaTroDangMo.length === 0 ? (
                <p className="flex min-h-[88px] items-center justify-center px-4 text-center text-[0.8125rem] text-text-tertiary">
                  Chưa có bàn {troDangMo.shortTitle} nào. Mở bàn mới để mời đối thủ.
                </p>
              ) : (
                tableCuaTroDangMo.map((table) => (
                  <GameTableCard
                    key={table.id}
                    table={table}
                    hideGameBadge
                    onEnter={() => {
                      setHopThoaiBan((s) => ({ ...s, open: false }))
                      onJoinExisting(table.id)
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
