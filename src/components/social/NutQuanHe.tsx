// Nút kết bạn theo quan hệ hiện tại: Kết bạn · Đã gửi (Hủy) · Chấp nhận / Từ chối · Bạn bè · Đã chặn.
// Trạng thái lấy từ SocialState thời gian thực; chưa tải xong thì dùng trạng thái máy chủ trả kèm kết quả tìm kiếm.

import { useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Check, Loader2, Star, UserCheck, UserMinus, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { RelationshipStatus } from '@shared/protocol/social'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { useCampus, type KetQuaThaoTac } from '@/hooks/use-campus'
import { useTopLayerZIndex } from '@/lib/top-layer'
import { cn } from '@/lib/utils'
import { suyRaQuanHe } from './quan-he'

interface NutQuanHeProps {
  id: number
  /** Trạng thái máy chủ báo kèm kết quả tìm kiếm — chỉ dùng khi SocialState chưa sẵn sàng. */
  trangThaiMayChu?: RelationshipStatus
  /** Nút rộng, cao hơn (trong hồ sơ); mặc định gọn để đặt cạnh một dòng. */
  day?: boolean
}

export function NutQuanHe({ id, trangThaiMayChu, day = false }: NutQuanHeProps) {
  const { nguoiDung, moAuthModal } = usePhien()
  const { socialState, guiLoiMoiKetBan, chapNhanKetBan, tuChoiKetBan, huyLoiMoi, unfriend, guiLoiMoiBanThan, huyBanThan } = useCampus()
  const [dangXuLy, setDangXuLy] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const { zIndex: optionsZIndex, bringToFront: bringOptionsToFront } = useTopLayerZIndex(optionsOpen, 'popover')

  if (id <= 0) return null

  const quanHe: RelationshipStatus | null =
    socialState && nguoiDung ? suyRaQuanHe(id, nguoiDung.accountId, socialState) : (trangThaiMayChu ?? null)
  const yeuCauDen = socialState?.incomingRequests.find((r) => r.sender?.id === id)
  const yeuCauDi = socialState?.outgoingRequests.find((r) => r.receiver?.id === id)

  const chay = async (viec: () => Promise<KetQuaThaoTac>, thanhCong: string) => {
    if (!nguoiDung || nguoiDung.accountId === 0) {
      toast.info('Vui lòng tạo Tag Name và mật khẩu để kết bạn!')
      moAuthModal('dang_ky')
      return
    }
    setDangXuLy(true)
    try {
      const kq = await viec()
      if (kq.ok) toast.success(thanhCong)
      else toast.error(kq.loi ?? 'Không thực hiện được, thử lại sau.')
    } finally {
      setDangXuLy(false)
    }
  }

  const kichCo = day ? 'min-h-11 min-w-0 rounded-xl px-3 whitespace-normal text-sm' : undefined
  const size = 'default'
  const nhan = cn('flex min-w-0 items-center gap-2 text-xs font-semibold', day && 'justify-center text-sm')

  switch (quanHe) {
    case 'self':
      if (day) return null
      return <span className="shrink-0 text-xs text-text-tertiary">Bạn</span>
    case null:
      if (day) {
        return (
          <div className="h-11 w-full animate-pulse rounded-xl bg-surface-overlay flex items-center justify-center" aria-label="Đang tải quan hệ">
            <Loader2 className="size-4 animate-spin text-text-tertiary" />
          </div>
        )
      }
      return <Loader2 className="size-3.5 animate-spin text-text-tertiary" />
    case 'friend':
    case 'close_friend': {
      const fr = socialState?.friends.find((f) => f.id === id)
      const isCloseFriend = quanHe === 'close_friend' || fr?.isCloseFriend === true
      const isCloseFriendPending = fr?.closeFriendPending === true

      if (day) {
        return (
          <Popover.Root open={optionsOpen} onOpenChange={setOptionsOpen}>
            <Popover.Trigger
              render={
                <Button
                  size="default"
                  variant="outline"
                  className={cn(
                    "group/friend w-full min-h-11 min-w-0 rounded-xl px-2 text-sm font-medium border-border-default bg-surface transition-colors cursor-pointer",
                    isCloseFriend
                      ? "border-warning/40 text-warning hover:bg-warning/10 hover:border-warning/60"
                      : "hover:border-destructive/30 hover:bg-surface-overlay",
                  )}
                  disabled={dangXuLy}
                  onPointerDown={() => bringOptionsToFront()}
                  data-testid={`ban-be-${id}`}
                  title={isCloseFriend ? "Bạn thân (Bấm để xem tùy chọn)" : "Bạn bè (Bấm để xem tùy chọn)"}
                  aria-label={isCloseFriend ? "Bạn thân, bấm để xem tùy chọn" : "Bạn bè, bấm để xem tùy chọn"}
                >
                  {dangXuLy ? (
                    <Loader2 className="size-4 animate-spin shrink-0" />
                  ) : (
                    <>
                      <span className={cn("flex items-center gap-1.5 group-hover/friend:hidden", isCloseFriend ? "text-warning" : "text-success")}>
                        {isCloseFriend ? <Star className="size-4 shrink-0 fill-warning" /> : <UserCheck className="size-4 shrink-0" />}
                        <span className="truncate">{isCloseFriend ? "⭐ Bạn thân" : "Bạn bè"}</span>
                      </span>
                      <span className="hidden items-center gap-1.5 group-hover/friend:flex text-destructive">
                        <UserMinus className="size-4 shrink-0" />
                        <span className="truncate">Tùy chọn bạn bè</span>
                      </span>
                    </>
                  )}
                </Button>
              }
            />
            <Popover.Portal>
              <Popover.Positioner side="top" sideOffset={6} style={{ zIndex: optionsZIndex }} className="z-[250]">
                <Popover.Popup
                  style={{ zIndex: optionsZIndex + 1 }}
                  onPointerDownCapture={bringOptionsToFront}
                  className="z-[251] w-52 rounded-xl border border-border-default bg-surface-raised p-1.5 shadow-xl flex flex-col gap-1 outline-none"
                >
                  {/* Tùy chọn 1: Bạn thân */}
                  {isCloseFriend ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-warning hover:bg-warning/10 cursor-pointer transition-colors text-left"
                      onClick={() => {
                        setOptionsOpen(false)
                        void chay(() => huyBanThan(id), 'Đã hủy bạn thân')
                      }}
                    >
                      <Star className="size-3.5 fill-warning shrink-0" />
                      <span className="truncate">Hủy bạn thân</span>
                    </button>
                  ) : isCloseFriendPending ? (
                    <div className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-text-tertiary bg-surface-overlay">
                      <Loader2 className="size-3.5 animate-spin shrink-0" />
                      <span className="truncate">Đang chờ xác nhận ⭐</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-text-primary hover:bg-warning/10 hover:text-warning cursor-pointer transition-colors text-left"
                      onClick={() => {
                        setOptionsOpen(false)
                        void chay(() => guiLoiMoiBanThan(id), 'Đã gửi lời mời')
                      }}
                    >
                      <Star className="size-3.5 text-warning shrink-0" />
                      <span className="truncate">Đặt làm bạn thân ⭐</span>
                    </button>
                  )}

                  {/* Tùy chọn 2: Hủy kết bạn */}
                  <button
                    type="button"
                    data-testid={`huy-ket-ban-${id}`}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer transition-colors text-left group-hover/friend:flex"
                    onClick={() => {
                      setOptionsOpen(false)
                      void chay(() => unfriend(id), 'Đã hủy kết bạn')
                    }}
                  >
                    <UserMinus className="size-3.5 shrink-0" />
                    <span className="truncate">Hủy kết bạn</span>
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        )
      }
      return (
        <Popover.Root open={optionsOpen} onOpenChange={setOptionsOpen}>
          <Popover.Trigger
            render={
              <button
                type="button"
                className={cn(nhan, isCloseFriend ? 'text-warning' : 'text-success', 'cursor-pointer hover:underline')}
                data-testid={`ban-be-${id}`}
                title="Bấm để xem tùy chọn bạn bè"
                onPointerDown={() => bringOptionsToFront()}
              >
                {isCloseFriend ? <Star className="size-3.5 fill-warning" /> : <UserCheck className="size-3.5" />}
                {isCloseFriend ? 'Bạn thân' : 'Bạn bè'}
              </button>
            }
          />
          <Popover.Portal>
            <Popover.Positioner side="top" sideOffset={6} style={{ zIndex: optionsZIndex }} className="z-[250]">
              <Popover.Popup
                style={{ zIndex: optionsZIndex + 1 }}
                onPointerDownCapture={bringOptionsToFront}
                className="z-[251] w-48 rounded-xl border border-border-default bg-surface-raised p-1.5 shadow-xl flex flex-col gap-1 outline-none"
              >
                {isCloseFriend ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-warning hover:bg-warning/10 cursor-pointer"
                    onClick={() => {
                      setOptionsOpen(false)
                      void chay(() => huyBanThan(id), 'Đã hủy bạn thân')
                    }}
                  >
                    <Star className="size-3.5 fill-warning shrink-0" />
                    <span>Hủy bạn thân</span>
                  </button>
                ) : isCloseFriendPending ? (
                  <div className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-text-tertiary">
                    <span>Đang chờ xác nhận ⭐</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-text-primary hover:bg-warning/10 hover:text-warning cursor-pointer"
                    onClick={() => {
                      setOptionsOpen(false)
                      void chay(() => guiLoiMoiBanThan(id), 'Đã gửi lời mời')
                    }}
                  >
                    <Star className="size-3.5 text-warning shrink-0" />
                    <span>Đặt làm bạn thân ⭐</span>
                  </button>
                )}
                <button
                  type="button"
                  data-testid={`huy-ket-ban-${id}`}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                  onClick={() => {
                    setOptionsOpen(false)
                    void chay(() => unfriend(id), 'Đã hủy kết bạn')
                  }}
                >
                  <UserMinus className="size-3.5 shrink-0" />
                  <span>Hủy kết bạn</span>
                </button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )
    }
    case 'blocked':
      return <span className={cn(nhan, 'text-destructive')}>Đã chặn</span>
    case 'pending_sent':
      if (day) {
        return (
          <Button
            size="default"
            variant="outline"
            className="group/sent w-full min-h-11 min-w-0 rounded-xl px-2 text-sm font-medium border-border-default bg-surface hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors cursor-pointer"
            disabled={dangXuLy || !yeuCauDi}
            onClick={() => yeuCauDi && void chay(() => huyLoiMoi(yeuCauDi.id), 'Đã hủy lời mời')}
            title="Đã gửi lời mời (Bấm để hủy)"
          >
            {dangXuLy ? (
              <Loader2 className="size-4 animate-spin shrink-0" />
            ) : (
              <>
                <span className="flex items-center gap-1.5 group-hover/sent:hidden text-warning">
                  <Check className="size-4 shrink-0" />
                  <span className="truncate">Đã gửi</span>
                </span>
                <span className="hidden items-center gap-1.5 group-hover/sent:flex text-destructive">
                  <X className="size-4 shrink-0" />
                  <span className="truncate">Hủy</span>
                </span>
              </>
            )}
          </Button>
        )
      }
      return (
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={cn(nhan, 'text-warning')}>Đã gửi</span>
          {yeuCauDi && (
            <Button
              size={size}
              variant="ghost"
              className="min-h-10 whitespace-normal text-sm text-text-tertiary hover:text-text-primary"
              disabled={dangXuLy}
              onClick={() => void chay(() => huyLoiMoi(yeuCauDi.id), 'Đã hủy lời mời')}
            >
              Hủy
            </Button>
          )}
        </span>
      )
    case 'pending_received':
      if (day) {
        return (
          <div className="grid grid-cols-[1fr_auto] gap-1.5 w-full">
            <Button
              size="default"
              variant="default"
              className="min-h-11 min-w-0 rounded-xl px-2 text-xs font-semibold gap-1 cursor-pointer"
              disabled={dangXuLy || !yeuCauDen}
              onClick={() => yeuCauDen && void chay(() => chapNhanKetBan(yeuCauDen.id), 'Đã kết bạn')}
              data-testid={`chap-nhan-${id}`}
              title="Chấp nhận lời mời kết bạn"
            >
              {dangXuLy ? <Loader2 className="size-3.5 animate-spin shrink-0" /> : <Check className="size-3.5 shrink-0" />}
              <span className="truncate">Đồng ý</span>
            </Button>
            <Button
              size="default"
              variant="outline"
              className="min-h-11 min-w-10 rounded-xl px-2 text-text-tertiary hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 cursor-pointer"
              disabled={dangXuLy || !yeuCauDen}
              onClick={() => yeuCauDen && void chay(() => tuChoiKetBan(yeuCauDen.id), 'Đã từ chối')}
              title="Từ chối"
              aria-label="Từ chối"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )
      }
      return (
        <span className="grid min-w-0 gap-2 grid-cols-[minmax(0,1fr)_40px]">
          <Button
            size={size}
            variant="default"
            className={cn(kichCo, 'min-h-10 whitespace-normal')}
            disabled={dangXuLy || !yeuCauDen}
            onClick={() => yeuCauDen && void chay(() => chapNhanKetBan(yeuCauDen.id), 'Đã kết bạn')}
            data-testid={`chap-nhan-${id}`}
          >
            {dangXuLy ? <Loader2 className="animate-spin" /> : <Check />}
            Chấp nhận
          </Button>
          <Button
            size={size}
            variant="outline"
            className={cn(kichCo, 'min-h-10 min-w-0 whitespace-normal')}
            disabled={dangXuLy || !yeuCauDen}
            onClick={() => yeuCauDen && void chay(() => tuChoiKetBan(yeuCauDen.id), 'Đã từ chối')}
            aria-label="Từ chối"
          >
            <X />
          </Button>
        </span>
      )
    default:
      if (day) {
        // Bố cục hàng đôi chuẩn: flex min-w-0 w-full items-center justify-between gap-3
        return (
          <Button
            size="default"
            variant="outline"
            className="w-full min-h-11 min-w-0 rounded-xl px-2 text-sm font-medium border-border-default hover:border-brand/50 hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
            disabled={dangXuLy}
            onClick={() => void chay(() => guiLoiMoiKetBan(id), 'Đã gửi lời mời')}
            data-testid={`ket-ban-${id}`}
            title="Gửi lời mời kết bạn"
          >
            {dangXuLy ? <Loader2 className="size-4 animate-spin shrink-0" /> : <UserPlus className="size-4 shrink-0" />}
            <span className="truncate">Kết bạn</span>
          </Button>
        )
      }
      return (
        <Button
          size={size}
          variant="default"
          className={cn(kichCo, 'min-h-10 min-w-0 whitespace-normal')}
          disabled={dangXuLy}
          onClick={() => void chay(() => guiLoiMoiKetBan(id), 'Đã gửi lời mời')}
          data-testid={`ket-ban-${id}`}
        >
          {dangXuLy ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Kết bạn
        </Button>
      )
  }
}
