// Mẫu thống kê nhanh chung cho mọi sảnh (Platform Core — Discovery & Lobby), chỉ Quản trị trường thấy.
// Một dải tổng quan (Đang diễn ra · Hôm nay · 7 ngày) + hộp Chi tiết (biểu đồ 7 ngày, bảng chi tiết).
// Mỗi hoạt động (Học tập, từng trò chơi) chỉ đổ số liệu thật của mình vào — không tự vẽ khung thống kê riêng.

import { useState, type ReactNode } from 'react'
import { BarChart3, ChevronRight, RefreshCw, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ngayNgan } from './ngay-thong-ke'

export interface ChiSoThongKe {
  icon: LucideIcon
  nhan: string
  /** null: phần lịch sử chưa tải xong / lỗi — hiện ô chờ, không hiện số 0 giả. */
  giaTri: number | null
  mau?: string
}

export interface NhomThongKe {
  tieuDe: string
  /** Số liệu thời gian thực (chấm xanh nhấp nháy). */
  trucTiep?: boolean
  chiSo: ChiSoThongKe[]
}

export interface BieuDoThongKe {
  tieuDe: string
  /** Màu cột (lớp nền Tailwind). */
  mau: string
  diem: { ngay: string; giaTri: number }[]
}

export interface BangThongKe {
  tieuDe: string
  cot: string[]
  dong: { khoa: string | number; nhan: ReactNode; giaTri: ReactNode[] }[]
  rong: string
}

export interface ThongKeNhanhProps {
  testId: string
  tieuDe: string
  nhom: NhomThongKe[]
  bieuDo?: BieuDoThongKe[]
  bang?: BangThongKe[]
  /** Phần lịch sử (máy chủ) đang tải lần đầu. */
  dangTai: boolean
  loi: boolean
  onThuLai: () => void
  /** Ngày hôm nay theo giờ trường (YYYY-MM-DD) để gắn nhãn cột "Hôm nay". */
  homNay?: string
}

export function ThongKeNhanh({ testId, tieuDe, nhom, bieuDo, bang, dangTai, loi, onThuLai, homNay }: ThongKeNhanhProps) {
  const [mo, setMo] = useState(false)
  const trucTiepNhom = nhom.find((n) => n.trucTiep)
  const coHoatDongTrucTiep = Boolean(
    trucTiepNhom && trucTiepNhom.chiSo.some((c) => (c.giaTri ?? 0) > 0),
  )

  return (
    <>
      <section
        aria-label={`Thống kê ${tieuDe}`}
        data-testid={testId}
        className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-surface-overlay/50 backdrop-blur-xs px-4 py-2 text-xs transition-colors hover:border-white/[0.12]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <BarChart3 className="size-4" />
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-semibold text-text-primary text-xs">Thống kê {tieuDe}</span>
            {coHoatDongTrucTiep ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                {trucTiepNhom?.chiSo
                  .filter((c) => (c.giaTri ?? 0) > 0)
                  .map((c) => `${c.giaTri} ${c.nhan.toLowerCase()}`)
                  .join(' · ')}
              </span>
            ) : (
              <span className="text-[11px] text-text-tertiary hidden sm:inline">
                Quản trị viên
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {loi && (
            <Button size="icon-sm" variant="ghost" onClick={onThuLai} aria-label="Tải lại thống kê" title="Tải lại thống kê">
              <RefreshCw className="size-3.5 text-warning" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMo(true)}
            className="h-8 rounded-xl px-3 text-xs font-medium text-text-secondary hover:text-text-primary gap-1"
            data-testid={`${testId}-mo-chi-tiet`}
          >
            Chi tiết
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </section>

      <Dialog open={mo} onOpenChange={setMo}>
        <DialogContent className="gap-5 sm:max-w-3xl" data-testid={`${testId}-chi-tiet`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-brand" />
              Thống kê {tieuDe}
            </DialogTitle>
            <DialogDescription className="sr-only">Tổng quan và chi tiết số liệu 7 ngày gần nhất</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid={`${testId}-nhom`}>
            {nhom.flatMap((n) =>
              n.chiSo.map((c) => (
                <div key={`${n.tieuDe}-${c.nhan}`} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                    <c.icon className={cn('size-3.5', c.mau ?? 'text-text-tertiary')} />
                    {c.nhan}
                  </p>
                  <p className="mt-1 flex items-baseline gap-1.5">
                    <GiaTri giaTri={c.giaTri} lon />
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase">{n.tieuDe}</span>
                  </p>
                </div>
              )),
            )}
          </div>

          {loi ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-text-secondary">
              Không tải được số liệu 7 ngày.
              <Button size="sm" variant="outline" onClick={onThuLai}>
                <RefreshCw />
                Thử lại
              </Button>
            </div>
          ) : dangTai ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Đang tải số liệu">
              {[0, 1].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : (
            bieuDo &&
            bieuDo.length > 0 && (
              <div className={cn('grid gap-3', bieuDo.length > 1 && 'sm:grid-cols-2')}>
                {bieuDo.map((b) => (
                  <BieuDoCot key={b.tieuDe} bieuDo={b} homNay={homNay} />
                ))}
              </div>
            )
          )}

          {bang?.map((b) => <BangChiTiet key={b.tieuDe} bang={b} />)}
        </DialogContent>
      </Dialog>
    </>
  )
}

function GiaTri({ giaTri, lon }: { giaTri: number | null; lon?: boolean }) {
  if (giaTri === null) {
    return <span className={cn('inline-block animate-pulse rounded bg-white/10', lon ? 'h-6 w-8' : 'h-3.5 w-5')} aria-label="Đang tải" />
  }
  return (
    <span className={cn('font-bold tabular-nums text-text-primary', lon ? 'text-xl leading-6' : 'text-sm')}>
      {giaTri.toLocaleString('vi-VN')}
    </span>
  )
}

function BieuDoCot({ bieuDo, homNay }: { bieuDo: BieuDoThongKe; homNay?: string }) {
  const lonNhat = Math.max(1, ...bieuDo.diem.map((d) => d.giaTri))
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-xs font-semibold text-text-secondary">{bieuDo.tieuDe}</p>
      <div className="mt-3 flex h-28 items-end gap-1.5">
        {bieuDo.diem.map((d) => (
          <div key={d.ngay} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1" title={`${ngayNgan(d.ngay)}: ${d.giaTri}`}>
            <span className="text-[10px] font-semibold tabular-nums text-text-secondary">{d.giaTri}</span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={cn('w-full max-w-7 rounded-t-md transition-[height] duration-500', d.giaTri > 0 ? bieuDo.mau : 'bg-white/[0.06]')}
                style={{ height: d.giaTri > 0 ? `${Math.max(6, (d.giaTri / lonNhat) * 100)}%` : '3px' }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {bieuDo.diem.map((d) => (
          <span
            key={d.ngay}
            className={cn('min-w-0 flex-1 truncate text-center text-[10px] tabular-nums', d.ngay === homNay ? 'font-bold text-brand' : 'text-text-tertiary')}
          >
            {ngayNgan(d.ngay)}
          </span>
        ))}
      </div>
    </div>
  )
}

function BangChiTiet({ bang }: { bang: BangThongKe }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold text-text-secondary">{bang.tieuDe}</h3>
      {bang.dong.length === 0 ? (
        <p className="rounded-xl bg-white/[0.02] px-3 py-4 text-center text-xs text-text-tertiary">{bang.rong}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white/[0.03] text-text-tertiary">
                {bang.cot.map((c, i) => (
                  <th key={c} className={cn('px-3 py-2 font-semibold whitespace-nowrap', i === 0 ? 'text-left' : 'text-right')}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bang.dong.map((d) => (
                <tr key={d.khoa} className="border-t border-white/[0.05]">
                  <td className="max-w-[14rem] truncate px-3 py-2 font-medium text-text-primary">{d.nhan}</td>
                  {d.giaTri.map((g, i) => (
                    <td key={i} className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-text-secondary">
                      {g}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
