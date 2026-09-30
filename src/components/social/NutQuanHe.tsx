// Nút kết bạn theo quan hệ hiện tại: Kết bạn · Đã gửi (Hủy) · Chấp nhận / Từ chối · Bạn bè · Đã chặn.
// Trạng thái lấy từ SocialState thời gian thực; chưa tải xong thì dùng trạng thái máy chủ trả kèm kết quả tìm kiếm.

import { useState } from 'react'
import { Check, Loader2, UserCheck, UserMinus, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { RelationshipStatus } from '@shared/protocol/social'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { useCampus, type KetQuaThaoTac } from '@/hooks/use-campus'
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
  const { nguoiDung } = usePhien()
  const { socialState, guiLoiMoiKetBan, chapNhanKetBan, tuChoiKetBan, huyLoiMoi, unfriend } = useCampus()
  const [dangXuLy, setDangXuLy] = useState(false)

  const quanHe: RelationshipStatus | null =
    socialState && nguoiDung ? suyRaQuanHe(id, nguoiDung.accountId, socialState) : (trangThaiMayChu ?? null)
  const yeuCauDen = socialState?.incomingRequests.find((r) => r.sender?.id === id)
  const yeuCauDi = socialState?.outgoingRequests.find((r) => r.receiver?.id === id)

  const chay = async (viec: () => Promise<KetQuaThaoTac>, thanhCong: string) => {
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
      if (day) {
        return (
          <div className="flex min-w-0 w-full flex-wrap items-center justify-between gap-3" data-testid={`ban-be-${id}`}>
            <span className={cn(nhan, 'text-success')}>
              <UserCheck className="size-4" />
              Bạn bè
            </span>
            <Button
              size="xs"
              variant="outline"
              className="min-h-10 whitespace-normal gap-2 rounded-xl text-sm text-text-secondary hover:text-destructive"
              disabled={dangXuLy}
              onClick={() => void chay(() => unfriend(id), 'Đã hủy kết bạn.')}
              data-testid={`huy-ket-ban-${id}`}
            >
              {dangXuLy ? <Loader2 className="size-3.5 animate-spin" /> : <UserMinus className="size-3.5" />}
              Hủy kết bạn
            </Button>
          </div>
        )
      }
      return (
        <span className={cn(nhan, 'text-success')} data-testid={`ban-be-${id}`}>
          <UserCheck className="size-3.5" />
          Bạn bè
        </span>
      )
    case 'blocked':
      return <span className={cn(nhan, 'text-destructive')}>Đã chặn</span>
    case 'pending_sent':
      return (
        <span className={cn('flex min-w-0 flex-wrap items-center gap-2', day && 'justify-between w-full')}>
          <span className={cn(nhan, 'text-warning')}>Đã gửi</span>
          {yeuCauDi && (
            <Button
              size={size}
              variant="ghost"
              className={cn('min-h-10 whitespace-normal text-sm text-text-tertiary hover:text-text-primary', day && 'min-h-11 rounded-xl text-sm')}
              disabled={dangXuLy}
              onClick={() => void chay(() => huyLoiMoi(yeuCauDi.id), 'Đã hủy lời mời.')}
            >
              Hủy
            </Button>
          )}
        </span>
      )
    case 'pending_received':
      return (
        <span className={cn('grid min-w-0 gap-2', day ? 'w-full grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))]' : 'grid-cols-[minmax(0,1fr)_40px]')}>
          <Button
            size={size}
            variant={day ? 'outline' : 'default'}
            className={cn(kichCo, 'min-h-10 whitespace-normal')}
            disabled={dangXuLy || !yeuCauDen}
            onClick={() => yeuCauDen && void chay(() => chapNhanKetBan(yeuCauDen.id), 'Đã trở thành bạn bè.')}
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
            onClick={() => yeuCauDen && void chay(() => tuChoiKetBan(yeuCauDen.id), 'Đã từ chối lời mời.')}
            aria-label="Từ chối"
          >
            <X />
            {day && 'Từ chối'}
          </Button>
        </span>
      )
    default:
      return (
        <Button
          size={size}
          variant={day ? 'outline' : 'default'}
          className={cn(kichCo, 'min-h-10 min-w-0 whitespace-normal', day && 'w-full')}
          disabled={dangXuLy}
          onClick={() => void chay(() => guiLoiMoiKetBan(id), 'Đã gửi lời mời kết bạn.')}
          data-testid={`ket-ban-${id}`}
        >
          {dangXuLy ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Kết bạn
        </Button>
      )
  }
}
