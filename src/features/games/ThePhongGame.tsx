import { ArrowRight, Clock, Eye, Lock, Sparkles, Trophy, Users, Trash2 } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon } from './game-ids'

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

export function ThePhongGame({ room, onVao, onHuy, laChuPhong }: ThePhongGameProps) {
  const gameDef = GAME_CATALOG_BY_ID[room.gameType]
  const gameName = gameDef?.shortTitle || room.gameType
  const dangCho = room.trangThai === 'waiting'
  const isSolo = laTroChoiDon(room.gameType)
  const isVip = Boolean(room.isVip || room.isTournament)
  const friends = room.friendsInRoom ?? []
  const hasFriends = friends.length > 0
  const color = MAU_GAME[room.gameType] || MAU_GAME.chess

  // Trích xuất số phòng hiển thị dạng #1, #2...
  const soPhongHienThi = room.soPhong ?? (room.id.match(/\d+/) ? parseInt(room.id.replace(/\D/g, ''), 10) : room.id)

  return (
    <article
      data-testid={`game-room-card-${room.id}`}
      onClick={onVao}
      className={cn(
        'group relative flex flex-col justify-between gap-3.5 rounded-2xl p-4 transition-colors duration-150 cursor-pointer select-none h-full min-h-[168px]',
        isVip
          ? 'skeuo-subcard-active-amber'
          : hasFriends
            ? 'skeuo-subcard-active-cyan'
            : 'skeuo-subcard-base hover:border-sky-400/50',
      )}
    >
      {/* ── Hàng trên cùng: Nhãn game + Badge VIP / Bạn bè + Số phòng ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Tên game nhận diện dễ dàng */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border',
              color.badge,
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>{gameName}</span>
          </span>

          {/* Badge Giải đấu */}
          {isVip && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs">
              <Trophy className="size-3 text-amber-400" />
              <span>Giải đấu</span>
            </span>
          )}

          {/* Badge Bạn bè */}
          {hasFriends && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs"
              title={`Bạn bè: ${friends.join(', ')}`}
            >
              <Users className="size-3 text-sky-400" />
              <span>Có bạn bè</span>
            </span>
          )}

          {/* Badge Riêng tư có mật khẩu */}
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

        {/* Số phòng góc trên bên phải */}
        <span className="font-mono text-xs font-bold text-text-tertiary shrink-0">
          #{soPhongHienThi}
        </span>
      </div>

      {/* ── Phần giữa: Logo game to nổi bật (Vùng X) + Tiêu đề phòng + Tên chủ phòng mờ ── */}
      <div className="flex items-center gap-3.5">
        {/* Logo game to nổi bật như vùng X */}
        <div className="size-16 sm:size-18 shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised/80 flex items-center justify-center shadow-xs p-1 group-hover:scale-105 transition-transform duration-200">
          <GameArt gameType={room.gameType} variant="icon" className="size-full rounded-xl object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-bold text-text-primary leading-tight truncate group-hover:text-sky-400 transition-colors">
            {room.tieuDe || (room.tenChu ? `Bàn của ${room.tenChu}` : `Bàn #${soPhongHienThi}`)}
          </h3>

          {/* Dòng tên chủ phòng chữ ẩn mờ theo yêu cầu */}
          <p className="mt-1 text-xs text-text-tertiary font-normal truncate">
            {room.tenChu || 'Ẩn danh'}
          </p>
        </div>
      </div>

      {/* ── Hàng dưới cùng: Trạng thái / Đồng hồ / Người xem + Nút hành động ── */}
      <div className="mt-auto flex items-center justify-between gap-2 sm:gap-3 pt-2.5 border-t border-border-subtle/70">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-text-secondary min-w-0 flex-wrap">
          {/* Trạng thái ván đấu */}
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

          {/* Thời gian mỗi lượt */}
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

          {/* Người xem */}
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
              'h-8 px-3.5 rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs gap-1.5 transition-colors duration-150',
              dangCho || isSolo
                ? 'skeuo-btn-cta-amber'
                : 'skeuo-btn-cancel',
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
