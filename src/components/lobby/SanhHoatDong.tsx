// Mẫu sảnh chung cho mọi hoạt động (Platform Core — Discovery & Lobby): Học tập và từng trò chơi.
// Ba khung cao bằng nhau: bảng xếp hạng | sảnh | trò chuyện. Khung sảnh: (quay lại) + thanh tìm + Tạo phòng + Chơi ngay,
// danh sách phòng cuộn bên trong (đang tải / đang kết nối lại / trống / có phòng). Vào phòng của bạn bè: bấm link được chia sẻ.
// Số liệu chỉ dành cho Quản trị trường (khe `thongKe`, mẫu ThongKeNhanh) — người tham gia không thấy dải số.

import type { ReactNode } from 'react'
import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
import { Link } from 'react-router'
import { ArrowLeft, Play, Plus, RefreshCw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/layout/PageHeader'
import { cn } from '@/lib/utils'

export interface HanhDongSanh {
  nhan: string
  onClick: () => void
  testId?: string
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
  /** Nút quay lại đầu thanh công cụ (sảnh một trò chơi → danh sách trò chơi). */
  quayLai?: { nhan: string; toi: string }
  /** Dải thống kê nhanh — chỉ truyền khi người xem là Quản trị trường. */
  thongKe?: ReactNode
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
const CAO_KHUNG = 'min-h-[360px] xl:h-[max(420px,min(740px,calc(100dvh-10rem)))]'

export function SanhHoatDong({
  tieuDe,
  bieuTuong,
  quayLai,
  thongKe,
  choiNgay,
  taoPhong,
  timKiem,
  danhSach,
  noiDungGiua,
  cotTrai,
  cotPhai,
  testId,
}: SanhHoatDongProps) {
  const coThanhCongCu = Boolean(quayLai || choiNgay || taoPhong || timKiem)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {bieuTuong && <div className="size-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 sm:size-12">{bieuTuong}</div>}
        <PageHeader title={tieuDe} />
      </div>

      {thongKe}

      {/* Ba khung cao bằng nhau: bảng xếp hạng | sảnh | trò chuyện & bạn bè */}
      <ResponsiveActivityLayout testId={`${testId}-layout`} leaderboard={cotTrai} social={cotPhai}>

        <section
          aria-label={tieuDe}
          className={cn(
            '@container order-1 flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-default lg:order-2',
            'bg-surface',
            CAO_KHUNG,
          )}
          data-testid={`${testId}-panel`}
        >
          {coThanhCongCu && (
            // Một hàng co giãn: quay lại · tìm · nút. Khung hẹp: nút xuống hàng dưới và trải đủ bề ngang;
            // không có ô tìm thì nút quay lại đứng cùng hàng với các nút.
            <div
              className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border-subtle p-3"
              data-testid={`${testId}-actions`}
            >
              {quayLai && (
                <Link
                  to={quayLai.toi}
                  aria-label={quayLai.nhan}
                  title={quayLai.nhan}
                  data-testid={`${testId}-back`}
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-text-primary shadow-sm transition-all hover:-translate-x-0.5 hover:border-brand/50 hover:bg-brand/10 hover:text-brand active:scale-95"
                >
                  <ArrowLeft className="size-6" strokeWidth={2.4} />
                </Link>
              )}
              {timKiem && (
                <div className="relative min-w-0 flex-1 basis-48">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    value={timKiem.giaTri}
                    onChange={(e) => timKiem.onDoi(e.target.value)}
                    placeholder={timKiem.goiY}
                    aria-label="Tìm phòng"
                    data-testid={`${testId}-search-input`}
                    className="h-12 rounded-xl border-white/10 bg-white/[0.04] pr-12 pl-9 text-sm"
                  />
                  {timKiem.giaTri && (
                    <button
                      type="button"
                      onClick={() => timKiem.onDoi('')}
                      aria-label="Xóa tìm kiếm"
                      className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
              <div className="ml-auto flex flex-1 gap-2 @min-[34rem]:flex-none">
                {taoPhong && (
                  <Button
                    variant="outline"
                    onClick={taoPhong.onClick}
                    data-testid={taoPhong.testId}
                    className="h-12 flex-1 rounded-xl px-4 @min-[34rem]:flex-none"
                  >
                    <Plus />
                    {taoPhong.nhan}
                  </Button>
                )}
                {choiNgay && (
                  <Button
                    onClick={choiNgay.onClick}
                    data-testid={choiNgay.testId}
                    className="h-12 flex-1 rounded-xl px-5 font-semibold @min-[34rem]:flex-none"
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

      </ResponsiveActivityLayout>
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

      <div className="min-h-0 max-h-[max(280px,calc(100dvh-18rem))] flex-1 overflow-y-auto overscroll-contain px-3 pt-1.5 pb-3 xl:max-h-none">
        {trangThai === 'dang_tai' && (
          <div
            data-testid={`${testId}-lobby-loading`}
            aria-busy="true"
            aria-label="Đang tải danh sách phòng"
            className="grid grid-cols-1 gap-3 pt-1 @min-[34rem]:grid-cols-2 @min-[60rem]:grid-cols-3"
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
            <div className="grid grid-cols-1 gap-3 pt-1 @min-[34rem]:grid-cols-2 @min-[60rem]:grid-cols-3" data-testid={`${testId}-grid`}>
              {children}
            </div>
          ))}
      </div>
    </div>
  )
}

/**
 * Khung trống gọn: hình minh hoạ + một dòng, thêm một nút khi thật sự cần (đăng nhập / xoá tìm kiếm).
 * `hoatHinh`: hình trôi lơ lửng, hào quang phía sau "thở" theo nhịp, bóng dưới co giãn — không khung, không viền.
 */
export function KhungTrongSanh({
  hinh,
  hoatHinh,
  mauHaoQuang,
  tieuDe,
  nut,
  testId,
}: {
  hinh?: ReactNode
  hoatHinh?: boolean
  /** Màu hào quang (mặc định màu thương hiệu). */
  mauHaoQuang?: string
  tieuDe: string
  nut?: { nhan: string; icon?: ReactNode; onClick: () => void; phu?: boolean }
  testId: string
}) {
  return (
    <div data-testid={testId} className="flex flex-col items-center px-6 py-8">
      {hinh &&
        (hoatHinh ? (
          <div className="relative flex items-center justify-center py-2" data-testid={`${testId}-hoat-hinh`}>
            <span
              aria-hidden
              className="absolute size-32 rounded-full opacity-60 blur-2xl motion-safe:animate-hao-quang-tho"
              style={{ backgroundColor: mauHaoQuang ?? 'rgb(34 211 238 / 0.35)' }}
            />
            <div className="relative motion-safe:animate-troi-lo-lung">{hinh}</div>
            <span
              aria-hidden
              className="absolute -bottom-2 h-2.5 w-16 rounded-full bg-black/60 blur-[6px] motion-safe:animate-bong-troi"
            />
          </div>
        ) : (
          hinh
        ))}
      <p className={cn('text-sm font-semibold text-text-secondary', hinh && (hoatHinh ? 'mt-6' : 'mt-4'))}>{tieuDe}</p>
      {nut && (
        <Button variant={nut.phu ? 'outline' : 'default'} size="sm" onClick={nut.onClick} className="mt-4 rounded-xl">
          {nut.icon}
          {nut.nhan}
        </Button>
      )}
    </div>
  )
}
