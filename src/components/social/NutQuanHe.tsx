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

  const kichCo = day ? 'h-10 rounded-xl px-4' : undefined
  const size = day ? 'default' : 'xs'
  const nhan = cn('flex shrink-0 items-center gap-1 text-xs font-semibold', day && 'justify-center text-sm')

  switch (quanHe) {
    case null:
    case 'self':
      return quanHe === 'self' ? <span className="shrink-0 text-xs text-text-tertiary">Bạn</span> : null
    case 'friend':
      if (day) {
        return (
          <div className="flex w-full items-center justify-between gap-2" data-testid={`ban-be-${id}`}>
            <span className={cn(nhan, 'text-success')}>
              <UserCheck className="size-4" />
              Bạn bè
            </span>
            <Button
              size="xs"
              variant="outline"
              className="h-8 gap-1 rounded-lg border-white/10 text-xs text-text-tertiary hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors"
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
        <span className={cn('flex shrink-0 items-center gap-1.5', day && 'justify-center')}>
          <span className={cn(nhan, 'text-warning')}>Đã gửi</span>
          {yeuCauDi && (
            <Button
              size={size}
              variant="ghost"
              className={cn('text-text-tertiary hover:text-text-primary', day && 'h-10 rounded-xl')}
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
        <span className={cn('flex shrink-0 items-center gap-1.5', day && 'w-full')}>
          <Button
            size={size}
            className={cn(kichCo, day && 'flex-1')}
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
            className={cn(kichCo)}
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
          className={cn(kichCo, day && 'w-full')}
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
