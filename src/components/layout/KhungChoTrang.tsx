import { DigitalCampusLogo } from '@/components/brand/DigitalCampusLogo'

// Giữ chỗ trong lúc tải chunk của một trang: chiếm sẵn chiều cao để khung không sụt rồi nhảy (Zero CLS).
export function KhungChoTrang() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center select-none" aria-busy="true" aria-label="Đang tải trang">
      <DigitalCampusLogo size="xl" loading showGlow={false} />
    </div>
  )
}
