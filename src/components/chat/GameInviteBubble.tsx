import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Swords, Crown, Gamepad2, ArrowRight, Lock, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { type GameInviteData, parseGameInvite } from './game-invite-parser'

export { type GameInviteData, parseGameInvite }

/**
 * Component hiển thị thẻ Lời Mời Bàn Đấu với nút bấm Vào Bàn Ngay to rõ, trực quan
 */
export function GameInviteBubble({
  invite,
  isMe,
  className,
}: {
  invite: GameInviteData
  isMe?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success(`Đang vào ${invite.roomName}…`)
    navigate(invite.gamePath)
  }

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const full = invite.fullUrl.startsWith('http')
        ? invite.fullUrl
        : `${window.location.origin}${invite.gamePath}`
      await navigator.clipboard.writeText(full)
      setCopied(true)
      toast.success('Đã sao chép liên kết bàn đấu')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể sao chép liên kết')
    }
  }

  return (
    <div
      className={cn(
        'w-[250px] sm:w-[270px] p-3 rounded-2xl border transition-all duration-150 select-none shadow-lg flex flex-col gap-2.5',
        isMe
          ? 'bg-gradient-to-br from-brand/20 via-surface-overlay to-brand/10 border-brand/40 text-text-primary'
          : 'bg-gradient-to-br from-[#1c1815] via-[#161922] to-[#121620] border-amber-500/35 text-text-primary',
        className,
      )}
    >
      {/* Header card: Icon game + Tên phòng + Nút sao chép phụ */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon Game đại diện */}
          {invite.gameType === 'xiangqi' ? (
            <div className="relative size-9 rounded-full bg-gradient-to-br from-[#fffdf9] via-[#f7e8d0] to-[#d4a36e] border-2 border-[#9c6332] shadow-[0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0">
              <span className="font-han font-black text-base text-[#b91c1c] leading-none">帥</span>
            </div>
          ) : invite.gameType === 'chess' ? (
            <div className="size-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-md">
              <Crown className="size-5" />
            </div>
          ) : invite.gameType === 'caro' ? (
            <div className="size-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-md">
              <Swords className="size-5" />
            </div>
          ) : (
            <div className="size-9 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-300 flex items-center justify-center shrink-0 shadow-md">
              <Gamepad2 className="size-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <span className="block text-[10px] font-black tracking-wider uppercase text-amber-400/90 leading-tight">
              Lời Mời Bàn Đấu
            </span>
            <h4
              className="text-xs sm:text-sm font-bold text-white truncate leading-tight mt-0.5"
              title={invite.roomName}
            >
              {invite.roomName}
            </h4>
          </div>
        </div>

        {/* Nút sao chép link phụ ở góc */}
        <button
          type="button"
          onClick={handleCopyLink}
          className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Sao chép link mời"
          aria-label="Sao chép link mời"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Thông tin phụ: Badge riêng tư */}
      {invite.isPrivate && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-300 w-fit">
          <Lock className="size-2.5 text-amber-400" />
          <span>Bàn riêng tư (kèm mật khẩu)</span>
        </div>
      )}

      {/* Nút bấm VÀO BÀN NGAY to rõ, ấn tượng */}
      <button
        type="button"
        id="btn-join-invite-game"
        onClick={handleJoin}
        className="w-full h-9 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(245,158,11,0.35)] cursor-pointer active:scale-95 transition-all duration-150"
      >
        <Swords className="size-3.5 text-stone-950 shrink-0" />
        <span>Vào Bàn Ngay</span>
        <ArrowRight className="size-3.5 text-stone-950 shrink-0" />
      </button>
    </div>
  )
}
