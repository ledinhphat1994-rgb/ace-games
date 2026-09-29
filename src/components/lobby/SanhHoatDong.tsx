// Mẫu sảnh chung cho mọi hoạt động (Platform Core — Discovery & Lobby): Học tập và từng trò chơi.
// Ba khung cao bằng nhau: bảng xếp hạng | sảnh | trò chuyện. Khung sảnh: thanh tìm + Tạo phòng + Chơi ngay,
// danh sách phòng cuộn bên trong (đang tải / đang kết nối lại / trống / có phòng). Vào phòng của bạn bè: bấm link được chia sẻ.

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Play, Plus, RefreshCw, Search, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

export interface HanhDongSanh {
  nhan: string
  onClick: () => void
  testId?: string
}

export interface ChiSoSanh {
  icon: LucideIcon
  /** Nhãn đọc màn hình / chú thích khi rê chuột. */
  nhan: string
  giaTri: number
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
  /** Các thẻ phòng — lưới do mẫu dựng, mỗi hoạt động tự vẽ thẻ của mình. */
  children?: ReactNode
}

export interface SanhHoatDongProps {
  tieuDe: string
  /** Hình nhận diện cạnh tiêu đề (ảnh trò chơi…). */
  bieuTuong?: ReactNode
  quayLai?: { nhan: string; toi: string }
  chiSo?: ChiSoSanh[]
  choiNgay?: HanhDongSanh
  taoPhong?: HanhDongSanh
  timKiem?: { giaTri: string; onDoi: (v: string) => void; goiY: string }
  danhSach?: DanhSachSanh
  /** Nội dung khung sảnh khi hoạt động không có phòng (trò chơi đơn). */
  noiDungGiua?: ReactNode
  cotTrai: ReactNode
  cotPhai: ReactNode
  /** Tiền tố data-testid: `${testId}-layout`, `${testId}-search-input`, `${testId}-lobby-loading`… */
  testId: string
}

/** Cùng chiều cao với cột bảng xếp hạng và cột trò chuyện: ba khung thẳng hàng. */
const CAO_KHUNG = 'lg:h-[700px] xl:h-[720px] 2xl:h-[740px]'

export function SanhHoatDong({
  tieuDe,
  bieuTuong,
  quayLai,
  chiSo,
  choiNgay,
  taoPhong,
  timKiem,
  danhSach,
  noiDungGiua,
  cotTrai,
  cotPhai,
  testId,
}: SanhHoatDongProps) {
  const coThanhCongCu = Boolean(choiNgay || taoPhong || timKiem)

  return (
    <div className="space-y-5">
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
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {bieuTuong && <div className="size-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 sm:size-12">{bieuTuong}</div>}
          <PageHeader title={tieuDe} />
          {chiSo && chiSo.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2" data-testid={`${testId}-stats`}>
              {chiSo.map(({ icon: Icon, nhan, giaTri, mau }) => (
                <li
                  key={nhan}
                  title={nhan}
                  aria-label={`${nhan}: ${giaTri}`}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold tabular-nums text-text-primary"
                >
                  <Icon className={cn('size-3.5', mau ?? 'text-text-tertiary')} />
                  {giaTri}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Ba khung cao bằng nhau: bảng xếp hạng | sảnh | trò chuyện & bạn bè */}
      <div
        data-testid={`${testId}-layout`}
        className="grid w-full grid-cols-1 items-start gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px]"
      >
        <div className="order-2 min-w-0 lg:order-1">{cotTrai}</div>

        <section
          aria-label={tieuDe}
          className={cn(
            '@container order-1 flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:order-2',
            'bg-gradient-to-b from-[#0e1527]/95 to-[#080c1a]/95',
            CAO_KHUNG,
          )}
          data-testid={`${testId}-panel`}
        >
          {coThanhCongCu && (
            <div
              className="flex shrink-0 flex-col gap-2 border-b border-white/[0.06] p-3 @min-[34rem]:flex-row @min-[34rem]:items-center"
              data-testid={`${testId}-actions`}
            >
              {timKiem && (
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={timKiem.giaTri}
                    onChange={(e) => timKiem.onDoi(e.target.value)}
                    placeholder={timKiem.goiY}
                    aria-label="Tìm phòng"
                    data-testid={`${testId}-search-input`}
                    className="h-10 rounded-xl border-white/10 bg-white/[0.04] pr-9 pl-9"
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
              <div className="grid shrink-0 grid-cols-2 gap-2 @min-[34rem]:flex">
                {taoPhong && (
                  <Button variant="outline" onClick={taoPhong.onClick} data-testid={taoPhong.testId} className="h-10 rounded-xl">
                    <Plus />
                    {taoPhong.nhan}
                  </Button>
                )}
                {choiNgay && (
                  <Button
                    onClick={choiNgay.onClick}
                    data-testid={choiNgay.testId}
                    className={cn('h-10 rounded-xl px-5 font-bold shadow-lg shadow-brand/25', !taoPhong && 'col-span-2')}
                  >
                    <Play className="fill-current" />
                    {choiNgay.nhan}
                  </Button>
                )}
              </div>
            </div>
          )}

          {danhSach && <DanhSachPhong danhSach={danhSach} testId={testId} />}
          {noiDungGiua && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">{noiDungGiua}</div>}
        </section>

        <div className="order-3 min-w-0 lg:col-span-2 xl:col-span-1">{cotPhai}</div>
      </div>
    </div>
  )
}

function DanhSachPhong({ danhSach, testId }: { danhSach: DanhSachSanh; testId: string }) {
  const { tieuDe, soLuong, trangThai, onKetNoiLai, rong, noiDungRong, children } = danhSach
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2">
        <h2 className="tieu-de-cap-2 text-sm font-bold">{tieuDe}</h2>
        {trangThai === 'san_sang' && typeof soLuong === 'number' && (
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
            {soLuong}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
        {trangThai === 'dang_tai' && (
          <div
            data-testid={`${testId}-lobby-loading`}
            aria-busy="true"
            aria-label="Đang tải danh sách phòng"
            className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-2 @min-[60rem]:grid-cols-3"
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        )}

        {trangThai === 'dang_ket_noi_lai' && (
          <div
            data-testid={`${testId}-lobby-reconnecting`}
            className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 text-center"
          >
            <RefreshCw className="size-5 animate-spin text-warning" />
            <p className="text-sm font-semibold text-text-primary">Đang kết nối lại…</p>
            {onKetNoiLai && (
              <Button size="sm" variant="outline" onClick={onKetNoiLai}>
                Thử lại
              </Button>
            )}
          </div>
        )}

        {trangThai === 'san_sang' &&
          (rong ? (
            <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">{noiDungRong}</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-2 @min-[60rem]:grid-cols-3" data-testid={`${testId}-grid`}>
              {children}
            </div>
          ))}
      </div>
    </div>
  )
}

/** Khung trống gọn: hình minh hoạ + một dòng, thêm một nút khi thật sự cần (đăng nhập / xoá tìm kiếm). */
export function KhungTrongSanh({
  hinh,
  tieuDe,
  nut,
  testId,
}: {
  hinh?: ReactNode
  tieuDe: string
  nut?: { nhan: string; icon?: ReactNode; onClick: () => void; phu?: boolean }
  testId: string
}) {
  return (
    <div data-testid={testId} className="flex flex-col items-center px-6 py-8">
      {hinh}
      <p className={cn('text-sm font-semibold text-text-secondary', hinh && 'mt-4')}>{tieuDe}</p>
      {nut && (
        <Button variant={nut.phu ? 'outline' : 'default'} size="sm" onClick={nut.onClick} className="mt-4 rounded-xl">
          {nut.icon}
          {nut.nhan}
        </Button>
      )}
    </div>
  )
}
