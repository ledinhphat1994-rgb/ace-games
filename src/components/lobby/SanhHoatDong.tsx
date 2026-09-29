// Mẫu sảnh chung cho mọi hoạt động (Platform Core — Discovery & Lobby): Học tập và từng trò chơi.
// Cùng một khung: tiêu đề + chỉ số, thanh hành động (Chơi ngay · Tạo phòng · Vào phòng) + tìm phòng,
// danh sách phòng đang mở (đang tải / đang kết nối lại / trống / có phòng), và bố cục 3 cột
// bảng xếp hạng | sảnh | trò chuyện. Mỗi hoạt động chỉ cấp dữ liệu và hành động của riêng nó.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, LogIn, Play, Plus, RefreshCw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

export interface HanhDongSanh {
  nhan: string
  onClick: () => void
  testId?: string
  tat?: boolean
}

export interface ChiSoSanh {
  nhan: string
  giaTri: number | undefined
  mau?: string
}

export interface DanhSachSanh {
  tieuDe: string
  /** Số phòng đang hiện; bỏ trống khi dữ liệu chưa sẵn sàng (không hiện số 0 giả). */
  soLuong?: number
  trangThai: 'dang_tai' | 'dang_ket_noi_lai' | 'san_sang'
  onKetNoiLai?: () => void
  /** Không có phòng nào để hiện (sau khi lọc). */
  rong: boolean
  noiDungRong: ReactNode
  /** Lưới phòng — mỗi hoạt động tự vẽ thẻ phòng của mình. */
  children?: ReactNode
}

export interface SanhHoatDongProps {
  tieuDe: string
  /** Hình / biểu tượng nhận diện cạnh tiêu đề (ảnh trò chơi…). */
  bieuTuong?: ReactNode
  quayLai?: { nhan: string; toi: string }
  chiSo?: ChiSoSanh[]
  choiNgay?: HanhDongSanh
  taoPhong?: HanhDongSanh
  vaoPhong?: HanhDongSanh
  timKiem?: { giaTri: string; onDoi: (v: string) => void; goiY: string }
  danhSach?: DanhSachSanh
  /** Nội dung giữa khi hoạt động không có phòng (trò chơi đơn). */
  noiDungGiua?: ReactNode
  cotTrai: ReactNode
  cotPhai: ReactNode
  /** Tiền tố data-testid: `${testId}-layout`, `${testId}-search-input`, `${testId}-lobby-loading`… */
  testId: string
}

export function SanhHoatDong({
  tieuDe,
  bieuTuong,
  quayLai,
  chiSo,
  choiNgay,
  taoPhong,
  vaoPhong,
  timKiem,
  danhSach,
  noiDungGiua,
  cotTrai,
  cotPhai,
  testId,
}: SanhHoatDongProps) {
  const coHanhDong = Boolean(choiNgay || taoPhong || vaoPhong || timKiem)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {quayLai && (
          <Link
            to={quayLai.toi}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-tertiary transition-colors hover:text-text-primary"
            data-testid={`${testId}-back`}
          >
            <ArrowLeft className="size-3.5" />
            {quayLai.nhan}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {bieuTuong && <div className="size-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 sm:size-14">{bieuTuong}</div>}
            <PageHeader title={tieuDe} />
          </div>
          {chiSo && chiSo.length > 0 && (
            <dl className="flex items-stretch divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.03]" data-testid={`${testId}-stats`}>
              {chiSo.map((c) => (
                <div key={c.nhan} className="flex min-w-20 flex-col items-center px-3 py-1.5">
                  <dt className="text-[10px] text-text-tertiary">{c.nhan}</dt>
                  <dd className={cn('text-sm font-bold tabular-nums', c.mau ?? 'text-text-primary')}>{c.giaTri ?? '–'}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      {/* Bố cục 3 cột như nhau cho mọi sảnh: bảng xếp hạng | sảnh | trò chuyện & bạn bè */}
      <div
        data-testid={`${testId}-layout`}
        className="grid w-full grid-cols-1 items-start gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px]"
      >
        <div className="order-2 min-w-0 lg:order-1">{cotTrai}</div>

        <section className="@container order-1 min-w-0 space-y-4 lg:order-2" aria-label={tieuDe}>
          {coHanhDong && (
            <div
              className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-surface/80 p-2.5 @min-[44rem]:flex-row @min-[44rem]:items-center"
              data-testid={`${testId}-actions`}
            >
              <div className="flex flex-wrap items-center gap-2">
                {choiNgay && (
                  <Button onClick={choiNgay.onClick} disabled={choiNgay.tat} data-testid={choiNgay.testId} className="h-10 px-5 font-bold shadow-md shadow-brand/20">
                    <Play className="fill-current" />
                    {choiNgay.nhan}
                  </Button>
                )}
                {taoPhong && (
                  <Button variant="outline" onClick={taoPhong.onClick} disabled={taoPhong.tat} data-testid={taoPhong.testId} className="h-10">
                    <Plus />
                    {taoPhong.nhan}
                  </Button>
                )}
                {vaoPhong && (
                  <Button variant="outline" onClick={vaoPhong.onClick} disabled={vaoPhong.tat} data-testid={vaoPhong.testId} className="h-10">
                    <LogIn className="text-brand" />
                    {vaoPhong.nhan}
                  </Button>
                )}
              </div>

              {timKiem && (
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={timKiem.giaTri}
                    onChange={(e) => timKiem.onDoi(e.target.value)}
                    placeholder={timKiem.goiY}
                    aria-label="Tìm phòng"
                    data-testid={`${testId}-search-input`}
                    className="h-10 pr-9 pl-9"
                  />
                  {timKiem.giaTri && (
                    <button
                      type="button"
                      onClick={() => timKiem.onDoi('')}
                      aria-label="Xóa tìm kiếm"
                      className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {danhSach && <DanhSachPhong danhSach={danhSach} testId={testId} />}
          {noiDungGiua}
        </section>

        <div className="order-3 min-w-0 lg:col-span-2 xl:col-span-1">{cotPhai}</div>
      </div>
    </div>
  )
}

function DanhSachPhong({ danhSach, testId }: { danhSach: DanhSachSanh; testId: string }) {
  const { tieuDe, soLuong, trangThai, onKetNoiLai, rong, noiDungRong, children } = danhSach
  return (
    <div className="space-y-3">
      <SectionHeader title={tieuDe} count={trangThai === 'san_sang' ? soLuong : undefined} />

      {/* Chiều cao tối thiểu cố định: đổi giữa đang tải / trống / có phòng không làm sụt bố cục. */}
      <div className="min-h-[320px]">
        {trangThai === 'dang_tai' && (
          <div
            data-testid={`${testId}-lobby-loading`}
            aria-busy="true"
            aria-label="Đang tải danh sách phòng"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-3"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border-subtle bg-surface p-5">
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-overlay" />
                <div className="mt-2.5 h-3 w-1/3 animate-pulse rounded-md bg-surface-overlay/70" />
                <div className="mt-8 flex items-end justify-between gap-4">
                  <div className="h-1 flex-1 animate-pulse rounded-full bg-surface-overlay/70" />
                  <div className="h-8 w-24 animate-pulse rounded-xl bg-surface-overlay" />
                </div>
              </div>
            ))}
          </div>
        )}

        {trangThai === 'dang_ket_noi_lai' && (
          <div
            data-testid={`${testId}-lobby-reconnecting`}
            className="flex flex-col gap-4 rounded-2xl border border-warning/25 bg-warning-muted/60 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin text-warning" />
              <p className="text-sm font-semibold text-text-primary">Đang kết nối lại sảnh…</p>
            </div>
            {onKetNoiLai && (
              <Button size="sm" variant="outline" onClick={onKetNoiLai} className="shrink-0">
                Thử lại ngay
              </Button>
            )}
          </div>
        )}

        {trangThai === 'san_sang' && (rong ? noiDungRong : children)}
      </div>
    </div>
  )
}
