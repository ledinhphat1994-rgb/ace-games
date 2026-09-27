import { Loader2 } from 'lucide-react'
import { lazy, Suspense, type ReactNode } from 'react'

// Trình dựng .pptx (thư viện + echarts ~1MB) chỉ tải khi thật sự mở một bản trình chiếu.
const PptxSlideViewerImpl = lazy(() =>
  import('./PptxSlideViewerImpl').then((m) => ({ default: m.PptxSlideViewerImpl })),
)

export interface PptxSlideViewerProps {
  /** Tệp .pptx của phòng (đường dẫn cùng nguồn, có kiểm quyền phòng). */
  docUrl: string
  /** Trang đang trình chiếu (1-based, chỉ đếm slide không ẩn) — đồng bộ qua RoomDO như PDF. */
  trang: number
  /** Số cú bấm hiệu ứng đã chạy trên trang này (đồng bộ qua RoomDO); lớn hơn số bước = đã hiện đủ. */
  buoc?: number
  /** Số slide trình chiếu được (slide ẩn bị bỏ qua), báo một lần sau khi đọc tệp. */
  onSoTrang?: (soTrang: number) => void
  /** Số cú bấm hiệu ứng của từng trang (theo thứ tự trình chiếu), báo một lần sau khi đọc tệp. */
  onSoBuoc?: (soBuocMoiTrang: number[]) => void
  /** Người trình chiếu bấm lên slide (công cụ chuột) → sang cú bấm / slide tiếp như PowerPoint. */
  onBamSlide?: () => void
  onLoi?: (loi: Error) => void
  /** Lớp chú thích / laser, đặt khít lên slide. */
  children?: ReactNode
}

export function PptxSlideViewer(props: PptxSlideViewerProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#0a0f18]">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" aria-label="Đang tải trình chiếu" />
        </div>
      }
    >
      <PptxSlideViewerImpl {...props} />
    </Suspense>
  )
}
