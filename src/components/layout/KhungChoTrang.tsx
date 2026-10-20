import { DigitalCampusLogo } from '@/components/brand/DigitalCampusLogo'

// Màn hình loading duy nhất và cố định cho toàn bộ ứng dụng (AuthGate, Router Suspense, Page Chunks).
// Cố định tuyệt đối giữa viewport (fixed inset-0), đồng bộ 100% kích thước, vầng sáng và laser.
// Loại bỏ hoàn toàn hiện tượng nhảy kích thước, giật khựng hay lệch tọa độ (Zero CLS & Zero Stutter).
export function KhungChoTrang() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center select-none bg-[#020617] animate-in fade-in duration-150 pointer-events-auto"
      role="status"
      aria-busy="true"
      aria-label="Đang tải trang"
    >
      <DigitalCampusLogo size="2xl" loading showGlow />
    </div>
  )
}
