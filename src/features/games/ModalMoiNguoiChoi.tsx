import { useState, useEffect, useMemo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { timKiemNguoiDung, guiTinNhanRieng } from '@/lib/api'
import type { SearchResultItem, FriendItem } from '@shared/protocol/social'
import { Search, UserPlus, Check, Copy, Users, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'
import { EloRankAvatarFrame } from './EloRankAvatarFrame'

export interface KhanGiaTrongPhong {
  key: string
  ten: string
  avatar?: string | null
  accountId?: number
}

interface ModalMoiNguoiChoiProps {
  open: boolean
  onClose: () => void
  gameId: string
  roomName: string
  isPrivate?: boolean
  password?: string
  spectators?: KhanGiaTrongPhong[]
  onInviteSpectator?: (key: string, name: string) => void
}

export function ModalMoiNguoiChoi({
  open,
  onClose,
  gameId,
  roomName,
  isPrivate,
  password,
  spectators,
  onInviteSpectator,
}: ModalMoiNguoiChoiProps) {
  const { nguoiDung, moAuthModal } = usePhien()
  const { socialState, friendsPresence } = useCampus()
  const [tuKhoa, setTuKhoa] = useState('')
  const [dangTimKiem, setDangTimKiem] = useState(false)
  const [ketQuaTimKiem, setKetQuaTimKiem] = useState<SearchResultItem[]>([])
  const [cacNguoiDaMoi, setCacNguoiDaMoi] = useState<Set<number>>(new Set())
  const [cacKhanGiaDaMoi, setCacKhanGiaDaMoi] = useState<Set<string>>(new Set())

  // Link mời trực tiếp (kèm mật khẩu nếu là phòng riêng tư)
  const linkMoi = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    const pwPart = isPrivate && password ? `?pass=${encodeURIComponent(password)}` : ''
    return `${origin}/game/${encodeURIComponent(gameId)}${pwPart}`
  }, [gameId, isPrivate, password])

  // Tìm kiếm người chơi theo từ khóa nhập (debounced)
  useEffect(() => {
    const q = tuKhoa.trim()
    if (!q) {
      setKetQuaTimKiem([])
      setDangTimKiem(false)
      return
    }

    setDangTimKiem(true)
    const timer = setTimeout(async () => {
      try {
        const results = await timKiemNguoiDung(q)
        setKetQuaTimKiem(results)
      } catch {
        setKetQuaTimKiem([])
      } finally {
        setDangTimKiem(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [tuKhoa])

  // Gửi lời mời tới 1 người chơi
  const handleMoiNguoiChoi = useCallback(
    async (targetId: number, targetName: string) => {
      if (!nguoiDung || nguoiDung.accountId === 0) {
        toast.info('Vui lòng tạo Tag Name và mật khẩu riêng để sử dụng tính năng mời bạn bè!')
        moAuthModal('dang_ky')
        return
      }

      try {
        const tinNhanMoi = `Lời mời tham gia bàn đấu ${roomName}: ${linkMoi}`
        await guiTinNhanRieng(targetId, tinNhanMoi)
        setCacNguoiDaMoi((prev) => new Set(prev).add(targetId))
        toast.success(`Đã gửi lời mời tới ${targetName}`)
      } catch {
        // Fallback sao chép link nếu không gửi được tin nhắn
        try {
          await navigator.clipboard.writeText(linkMoi)
          setCacNguoiDaMoi((prev) => new Set(prev).add(targetId))
          toast.success(`Đã sao chép liên kết bàn đấu của ${targetName}`)
        } catch {
          toast.error('Không thể gửi lời mời.')
        }
      }
    },
    [linkMoi, roomName, nguoiDung, moAuthModal],
  )

  // Sao chép link mời
  const handleSaoChepLink = async () => {
    try {
      await navigator.clipboard.writeText(linkMoi)
      toast.success('Đã sao chép liên kết bàn đấu!')
    } catch {
      toast.error('Không thể sao chép liên kết.')
    }
  }

  // Danh sách bạn bè để chọn nhanh khi chưa tìm kiếm
  const danhSachBanBe = socialState?.friends ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        style={{
          maxHeight: 'min(580px, calc(100svh - 2rem))',
        }}
        className="w-[min(480px,calc(100vw-2rem))] h-[520px] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Arcade Schematic mờ chìm toàn diện */}
        <BlueprintArcadePattern className="opacity-80" />

        <DialogHeader className="relative z-10 shrink-0 pb-3 border-b border-sky-500/15 mb-2">
          {/* Rule 6: Chỉ ghi tiêu đề, tuyệt đối cấm chú thích */}
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <UserPlus className="size-4" />
            </div>
            <DialogTitle className="text-base font-bold text-white tracking-wide">
              Mời người chơi vào bàn
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Mời người chơi vào bàn
          </DialogDescription>
        </DialogHeader>

        {/* Thông báo chế độ chơi nhanh cho khách */}
        {(!nguoiDung || nguoiDung.accountId === 0) && (
          <div className="relative z-10 shrink-0 mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
            <span className="text-amber-200">
              Chơi nhanh không hỗ trợ mời bạn qua tin nhắn. Tạo tài khoản để mở khóa!
            </span>
            <button
              type="button"
              onClick={() => {
                onClose()
                moAuthModal('dang_ky')
              }}
              className="px-2.5 py-1 rounded-lg bg-brand text-brand-foreground font-semibold shrink-0 cursor-pointer text-xs hover:bg-brand/90 transition-colors"
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Ô tìm kiếm người chơi */}
        <div className="relative z-10 shrink-0 mb-3">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Nhập tên hoặc tài khoản..."
            className="skeuo-input-deep w-full h-10 pl-10 pr-3.5 text-xs text-white"
          />
        </div>

        {/* Danh sách người chơi (Kết quả tìm kiếm hoặc Danh sách bạn bè) */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-1">
          {tuKhoa.trim() ? (
            dangTimKiem ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                <span>Đang tìm kiếm...</span>
              </div>
            ) : ketQuaTimKiem.length > 0 ? (
              ketQuaTimKiem.map((u) => {
                const daMoi = cacNguoiDaMoi.has(u.id)
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl skeuo-subcard-base transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <EloRankAvatarFrame
                        ten={u.displayName || u.username}
                        avatar={u.avatar}
                        sizeClassName="size-8"
                      />
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-semibold text-white truncate">
                          {u.displayName || u.username}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          @{u.username}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={daMoi}
                      onClick={() => handleMoiNguoiChoi(u.id, u.displayName || u.username)}
                      className={cn(
                        'h-8 px-3 text-xs font-bold rounded-lg shrink-0 transition-colors duration-150 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed',
                        daMoi
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'skeuo-btn-cta-amber',
                      )}
                    >
                      {daMoi ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span>Đã mời</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3" />
                          <span>Mời</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                <span>Không tìm thấy người chơi</span>
              </div>
            )
          ) : (spectators && spectators.length > 0) || danhSachBanBe.length > 0 ? (
            <div className="space-y-3">
              {/* 1. Người đang có mặt trong phòng đấu */}
              {spectators && spectators.length > 0 && (
                <div className="space-y-1.5 pb-2 border-b border-sky-500/15">
                  <div className="flex items-center justify-between px-1 pb-1 text-xs font-semibold text-sky-400">
                    <div className="flex items-center gap-1.5">
                      <Eye className="size-3.5 text-sky-400" />
                      <span>Người trong phòng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-normal">{spectators.length} người</span>
                  </div>
                  {spectators.map((s) => {
                    const daMoi = cacKhanGiaDaMoi.has(s.key)
                    return (
                      <div
                        key={s.key}
                        className="flex items-center justify-between p-2.5 rounded-xl skeuo-subcard-base transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <EloRankAvatarFrame
                            ten={s.ten}
                            avatar={s.avatar}
                            sizeClassName="size-8"
                          >
                            <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 ring-1 ring-slate-900 animate-pulse z-20" />
                          </EloRankAvatarFrame>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-xs font-semibold text-white truncate">
                              {s.ten}
                            </span>
                            <span className="text-[11px] text-emerald-400 truncate">
                              Đang xem
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={daMoi}
                          onClick={() => {
                            onInviteSpectator?.(s.key, s.ten)
                            setCacKhanGiaDaMoi((prev) => new Set(prev).add(s.key))
                          }}
                          className={cn(
                            'h-8 px-3 text-xs font-bold rounded-lg shrink-0 transition-colors duration-150 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed',
                            daMoi
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              : 'skeuo-btn-cta-amber',
                          )}
                        >
                          {daMoi ? (
                            <>
                              <Check className="size-3 text-emerald-400" />
                              <span>Đã mời</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="size-3" />
                              <span>Mời đấu</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 2. Danh sách bạn bè */}
              {danhSachBanBe.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 pb-1 text-xs font-semibold text-slate-300">
                    <Users className="size-3.5 text-sky-400" />
                    <span>Bạn bè</span>
                  </div>
              {danhSachBanBe.map((f: FriendItem) => {
                const daMoi = cacNguoiDaMoi.has(f.id)
                return (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2.5 rounded-xl skeuo-subcard-base transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <EloRankAvatarFrame
                        ten={f.displayName || f.username}
                        avatar={f.avatar}
                        sizeClassName="size-8"
                      >
                        {friendsPresence?.[f.id]?.state === 'online' && (
                          <span className="absolute bottom-0 right-0 size-2 rounded-full bg-emerald-400 ring-1 ring-slate-900 animate-pulse z-20" />
                        )}
                      </EloRankAvatarFrame>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-semibold text-white truncate">
                          {f.displayName || f.username}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">
                          @{f.username}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={daMoi}
                      onClick={() => handleMoiNguoiChoi(f.id, f.displayName || f.username)}
                      className={cn(
                        'h-8 px-3 text-xs font-bold rounded-lg shrink-0 transition-colors duration-150 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed',
                        daMoi
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'skeuo-btn-cta-amber',
                      )}
                    >
                      {daMoi ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span>Đã mời</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3" />
                          <span>Mời</span>
                        </>
                      )}
                    </button>
                    </div>
                  )
                })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              <span>Nhập tên để tìm kiếm người chơi</span>
            </div>
          )}
        </div>

        {/* Footer: Nút sao chép liên kết bàn và nút đóng */}
        <div className="relative z-10 pt-4 mt-3 border-t border-sky-500/15 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaoChepLink}
            className="flex-1 h-10 rounded-xl skeuo-btn-cancel text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Copy className="size-3.5 text-sky-400" />
            <span>Sao chép liên kết</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl skeuo-btn-cancel text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
