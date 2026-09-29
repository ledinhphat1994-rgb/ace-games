// Hồ sơ người dùng: bấm vào ảnh một người (chat chung, tab Bạn bè, kết quả tìm kiếm) để xem thông tin và kết bạn.
// Thông tin lấy từ /api/social/profile/:id (chỉ dữ liệu công khai an toàn); quan hệ bạn bè theo SocialState thời gian thực.

import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { layHoSoNguoiDung } from '@/lib/api'
import { tinhLevel } from '@/features/games/GameLeaderboard'
import { AnhNguoiDung } from './AnhNguoiDung'
import { NutQuanHe } from './NutQuanHe'
import { nhanVaiTro } from './quan-he'

/** Người đang được xem: chỉ cần mã + những gì đã biết sẵn (tên trong chat) để hiện ngay trong lúc tải hồ sơ. */
export interface NguoiXem {
  id: number
  ten: string
  lopTen?: string | null
  vaiTro?: string | null
  avatar?: string | null
}

interface HoSoNguoiDungDialogProps {
  nguoi: NguoiXem | null
  onDong: () => void
}

export function HoSoNguoiDungDialog({ nguoi, onDong }: HoSoNguoiDungDialogProps) {
  return (
    <Dialog open={nguoi !== null} onOpenChange={(mo) => !mo && onDong()}>
      {nguoi && <NoiDungHoSo key={nguoi.id} nguoi={nguoi} />}
    </Dialog>
  )
}

function NoiDungHoSo({ nguoi }: { nguoi: NguoiXem }) {
  const { data: hoSo, isPending, isError } = useQuery({
    queryKey: ['ho-so-nguoi-dung', nguoi.id],
    queryFn: () => layHoSoNguoiDung(nguoi.id),
    staleTime: 60_000,
    retry: false,
  })

  const ten = hoSo?.displayName ?? nguoi.ten
  const avatar = hoSo?.avatar ?? nguoi.avatar ?? null
  const vaiTro = nhanVaiTro(hoSo?.role ?? nguoi.vaiTro)
  const lopTen = hoSo ? hoSo.lopTen : (nguoi.lopTen ?? null)
  const capDo = hoSo ? tinhLevel(hoSo.totalXp) : null

  return (
    <DialogContent className="max-w-xs gap-0 overflow-hidden p-0" data-testid="ho-so-nguoi-dung">
      <div className="flex flex-col items-center gap-2.5 px-6 pt-8 pb-5 text-center">
        <AnhNguoiDung ten={ten} avatar={avatar} className="size-20 text-2xl ring-2 ring-border-strong" />
        <DialogTitle className="text-lg leading-snug font-bold break-words text-text-primary">{ten}</DialogTitle>
        <DialogDescription className="sr-only">Thông tin người dùng</DialogDescription>

        {(vaiTro || lopTen) && (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {vaiTro && <span className="rounded-full bg-brand/12 px-2.5 py-0.5 text-xs font-semibold text-brand">{vaiTro}</span>}
            {lopTen && <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-text-secondary">{lopTen}</span>}
          </div>
        )}

        {hoSo?.tieuDeHoSo && <p className="max-w-full text-sm break-words text-text-secondary italic">“{hoSo.tieuDeHoSo}”</p>}
      </div>

      {isError ? (
        <p className="border-t border-border-subtle px-6 py-4 text-center text-sm text-text-tertiary" data-testid="ho-so-loi">
          Không tải được thông tin.
        </p>
      ) : (
        <dl className="grid grid-cols-2 divide-x divide-border-subtle border-t border-border-subtle">
          <div className="px-4 py-3 text-center">
            <dt className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">Cấp</dt>
            <dd className="mt-0.5 text-xl font-black tabular-nums text-text-primary" data-testid="ho-so-cap">
              {isPending ? <span className="mx-auto block h-6 w-8 animate-pulse rounded bg-white/10" /> : capDo}
            </dd>
          </div>
          <div className="px-4 py-3 text-center">
            <dt className="text-[11px] font-semibold tracking-wide text-text-tertiary uppercase">XP</dt>
            <dd className="mt-0.5 text-xl font-black tabular-nums text-amber-300" data-testid="ho-so-xp">
              {isPending ? (
                <span className="mx-auto block h-6 w-12 animate-pulse rounded bg-white/10" />
              ) : (
                (hoSo?.totalXp ?? 0).toLocaleString('vi-VN')
              )}
            </dd>
          </div>
        </dl>
      )}

      <div className="flex justify-center border-t border-border-subtle p-4">
        <NutQuanHe id={nguoi.id} day />
      </div>
    </DialogContent>
  )
}
