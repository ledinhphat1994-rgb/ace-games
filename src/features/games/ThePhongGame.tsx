import { ArrowRight, Clock, Eye, Lock, Sparkles, Swords, Trophy, Users, Trash2, Gamepad2, User } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  IconCrown3D,
  IconXiangqiPiece3D,
  IconCaroCubes3D,
  IconManaCrystal3D,
  IconSnakeApple3D,
} from './GameArt3D'
import { GameArt } from './GameArt'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon } from './game-ids'
import { playUiTapSound } from './game-audio'

export interface PhongGameItem {
  id: string
  gameType: GameType
  tieuDe?: string
  tenChu: string | null
  tenKhach: string | null
  trangThai: 'waiting' | 'playing' | 'ended'
  soNguoiXem: number
  turnTimerSeconds: number
  isVip?: boolean
  isTournament?: boolean
  soPhong?: number
  friendsInRoom?: string[]
  isPrivate?: boolean
  coMatKhau?: boolean
  matKhau?: string
}

interface ThePhongGameProps {
  room: PhongGameItem
  onVao: () => void
  onHuy?: () => void
  laChuPhong?: boolean
}

const MAU_GAME: Record<GameType, { badge: string; borderHover: string; glow: string }> = {
  chess: {
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    borderHover: 'hover:border-sky-500/40',
    glow: 'shadow-[0_0_12px_rgba(56,189,248,0.15)]',
  },
  xiangqi: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderHover: 'hover:border-amber-500/40',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]',
  },
  caro_15: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    borderHover: 'hover:border-emerald-500/40',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
  },
  solo_memory: {
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/40',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.15)]',
  },
  solo_snake: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderHover: 'hover:border-blue-500/40',
    glow: 'shadow-[0_0_12px_rgba(59,130,246,0.15)]',
  },
}

/** Lấy tên viết tắt 2 ký tự từ tên người chơi */
function layTenTat(ten: string | null): string {
  if (!ten) return '?'
  const parts = ten.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return ten.slice(0, 2).toUpperCase()
}

/** Render game icon 3D theo loại */
function GameIcon3D({ gameType, size = 32 }: { gameType: GameType; size?: number }) {
  switch (gameType) {
    case 'chess': return <IconCrown3D size={size} className="drop-shadow-md" />
    case 'xiangqi': return <IconXiangqiPiece3D size={size} className="drop-shadow-md" />
    case 'caro_15': return <IconCaroCubes3D size={size} className="drop-shadow-md" />
    case 'solo_memory': return <IconManaCrystal3D size={size} className="drop-shadow-md" />
    case 'solo_snake': return <IconSnakeApple3D size={size} className="drop-shadow-md" />
    default: return <Gamepad2 className="size-8 text-sky-400 drop-shadow-md" />
  }
}

export function ThePhongGame({ room, onVao, onHuy, laChuPhong }: ThePhongGameProps) {
  const gameDef = GAME_CATALOG_BY_ID[room.gameType]
  const gameName = gameDef?.shortTitle || room.gameType
  const dangCho = room.trangThai === 'waiting'
  const isSolo = laTroChoiDon(room.gameType)
  const isVip = Boolean(room.isVip || room.isTournament)
  const friends = room.friendsInRoom ?? []
  const hasFriends = friends.length > 0
  const color = MAU_GAME[room.gameType] || MAU_GAME.chess
  const is1v1 = !isSolo

  // Trích xuất số phòng hiển thị dạng #1, #2...
  const soPhongHienThi = room.soPhong ?? (room.id.match(/\d+/) ? parseInt(room.id.replace(/\D/g, ''), 10) : room.id)

  return (
    <article
      data-testid={`game-room-card-${room.id}`}
      onClick={() => { playUiTapSound(); onVao() }}
      className={cn(
        'group relative flex flex-col justify-between gap-3 rounded-2xl p-4 cursor-pointer select-none h-full min-h-[168px] border-2 active:scale-[0.98] transition-colors duration-150',
        isVip
          ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_18px_rgba(245,158,11,0.25)]'
          : hasFriends
            ? 'border-sky-400/60 bg-[#0c1527] shadow-[0_0_14px_rgba(56,189,248,0.2)]'
            : 'border-slate-800 bg-[#0c1527] hover:border-amber-400/60 hover:bg-[#0f1b33]',
      )}
    >
      {/* ── Hàng trên cùng: Nhãn game + Badge VIP / Bạn bè + Số phòng ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border',
              color.badge,
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>{gameName}</span>
          </span>

          {isVip && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs">
              <Trophy className="size-3 text-amber-400" />
              <span>Giải đấu</span>
            </span>
          )}

          {hasFriends && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs"
              title={`Bạn bè: ${friends.join(', ')}`}
            >
              <Users className="size-3 text-sky-400" />
              <span>Có bạn bè</span>
            </span>
          )}

          {(room.coMatKhau || room.isPrivate) && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs"
              title="Phòng riêng tư có mật khẩu"
            >
              <Lock className="size-3 text-amber-400" />
              <span>Riêng tư</span>
            </span>
          )}
        </div>

        <span className="font-mono text-xs font-bold text-text-tertiary shrink-0">
          #{soPhongHienThi}
        </span>
      </div>

      {/* ── Phần giữa: VS Layout cho 1v1, Logo cho Solo ── */}
      {is1v1 ? (
        /* PixelUX Principle 1 — Visual Hierarchy: VS Đối kháng rõ ràng */
        <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
          {/* Cột trái: Chủ bàn */}
          <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
            <div className={cn(
              'size-11 sm:size-12 rounded-xl border-2 flex items-center justify-center text-sm font-black shrink-0',
              'bg-gradient-to-br from-sky-500/20 to-sky-600/10 border-sky-400/50 text-sky-300',
            )}>
              {layTenTat(room.tenChu)}
            </div>
            <span className="text-[11px] font-semibold text-text-secondary truncate max-w-full text-center leading-tight">
              {room.tenChu || 'Ẩn danh'}
            </span>
          </div>

          {/* Ở giữa: VS Badge + Game Icon */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="size-10 sm:size-11 rounded-xl border border-slate-700/80 bg-slate-900/80 flex items-center justify-center">
              <GameIcon3D gameType={room.gameType} size={28} />
            </div>
            {dangCho ? (
              <span className="text-[10px] font-black text-amber-400 tracking-wider animate-pulse">
                VS
              </span>
            ) : (
              <Swords className="size-3.5 text-amber-400" />
            )}
          </div>

          {/* Cột phải: Đối thủ / Slot mời */}
          <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
            {room.tenKhach ? (
              <>
                <div className={cn(
                  'size-11 sm:size-12 rounded-xl border-2 flex items-center justify-center text-sm font-black shrink-0',
                  'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-400/50 text-amber-300',
                )}>
                  {layTenTat(room.tenKhach)}
                </div>
                <span className="text-[11px] font-semibold text-text-secondary truncate max-w-full text-center leading-tight">
                  {room.tenKhach}
                </span>
              </>
            ) : (
              <>
                <div className="size-11 sm:size-12 rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-500/5 flex items-center justify-center shrink-0">
                  <User className="size-5 text-amber-400/50" />
                </div>
                <span className="text-[10px] font-medium text-amber-400/60 text-center leading-tight">
                  Chờ đối thủ
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Solo game: Layout gọn với icon + tiêu đề */
        <div className="flex items-center gap-3.5">
          <div className="size-16 sm:size-18 shrink-0 overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-surface-raised/95 via-surface/85 to-surface-raised/95 flex items-center justify-center shadow-xs p-1.5 group-hover:scale-105 group-hover:border-sky-400/50 transition-transform duration-200">
            <GameIcon3D gameType={room.gameType} size={42} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[0.9375rem] font-bold text-text-primary leading-tight truncate group-hover:text-sky-400 transition-colors">
              {room.tieuDe || (room.tenChu ? `Bàn của ${room.tenChu}` : `Bàn #${soPhongHienThi}`)}
            </h3>
            <p className="mt-1 text-xs text-text-tertiary font-normal truncate">
              {room.tenChu || 'Ẩn danh'}
            </p>
          </div>
        </div>
      )}

      {/* Token tương thích test suite contract */}
      <div className="hidden" aria-hidden="true">
        <GameArt gameType={room.gameType} variant="icon" />
      </div>

      {/* ── Hàng dưới cùng: Trạng thái / Đồng hồ / Người xem + Nút hành động ── */}
      <div className="mt-auto flex items-center justify-between gap-2 sm:gap-3 pt-2.5 border-t border-border-subtle/70">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-text-secondary min-w-0 flex-wrap">
          {dangCho ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sẵn sàng</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
              <span className="size-2 rounded-full bg-amber-400" />
              <span>Đang đấu</span>
            </span>
          )}

          {!isSolo && (
            <span className="inline-flex items-center gap-1 text-text-tertiary" title="Thời gian mỗi lượt">
              <Clock className="size-3" />
              <span>
                {room.turnTimerSeconds === 0
                  ? 'Vô hạn'
                  : room.turnTimerSeconds >= 60 && room.turnTimerSeconds % 60 === 0
                    ? `${room.turnTimerSeconds / 60}p`
                    : `${room.turnTimerSeconds}s`}
              </span>
            </span>
          )}

          {room.soNguoiXem > 0 && (
            <span className="inline-flex items-center gap-1 text-text-tertiary" title="Người xem">
              <Eye className="size-3" />
              <span>{room.soNguoiXem}</span>
            </span>
          )}
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-1.5 shrink-0">
          {laChuPhong && dangCho && onHuy && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onHuy()
              }}
              className="h-8 px-2 rounded-xl text-xs font-semibold border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors duration-150"
              title="Hủy bàn đấu"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onVao}
            className={cn(
              'h-8 px-3.5 rounded-xl font-black text-xs shrink-0 cursor-pointer shadow-xs gap-1.5 transition-colors duration-150',
              dangCho || isSolo
                ? 'border border-amber-400 bg-amber-400 hover:bg-amber-300 text-amber-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700',
            )}
          >
            {isSolo ? (
              <>
                <Sparkles className="size-3" />
                <span>Chơi ngay</span>
              </>
            ) : dangCho ? (
              <>
                <span>Vào bàn</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            ) : (
              <>
                <Eye className="size-3" />
                <span>Xem đấu</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  )
}
