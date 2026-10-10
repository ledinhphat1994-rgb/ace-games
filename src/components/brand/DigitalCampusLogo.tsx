import { memo } from 'react'
import { cn } from '@/lib/utils'

interface DigitalCampusLogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  animated?: boolean
  showGlow?: boolean
  loading?: boolean
}

/**
 * Biểu tượng thương hiệu Ace Games / Digital Campus chuẩn (chữ A cách điệu)
 * Thiết kế chuẩn icon ứng dụng Mobile squircle với hiệu ứng animated phát sáng rực rỡ
 * - Đã loại bỏ hoàn toàn dấu chấm tròn theo yêu cầu
 * - Hỗ trợ chế độ loading với tia sáng animated chạy dọc thân chữ A
 */
export const DigitalCampusLogo = memo(function DigitalCampusLogo({
  className,
  size = 'md',
  animated = true,
  showGlow = true,
  loading = false,
}: DigitalCampusLogoProps) {
  const sizeMap = {
    xs: 'size-6',
    sm: 'size-7 sm:size-8',
    md: 'size-9 sm:size-10',
    lg: 'size-11 sm:size-12',
    xl: 'size-14 sm:size-16',
    '2xl': 'size-20 sm:size-24',
  }

  const iconSizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-7.5 h-7.5',
    xl: 'w-10 h-10',
    '2xl': 'w-14 h-14 sm:w-16 sm:h-16',
  }

  return (
    <div
      className={cn(
        'relative shrink-0 flex items-center justify-center select-none group',
        sizeMap[size],
        className
      )}
    >
      {/* Vầng hào quang thở êm dịu (Ambient Breathing Aura) */}
      {showGlow && (
        <span
          className={cn(
            'absolute -inset-1.5 rounded-[30%] bg-gradient-to-tr from-sky-400/40 via-indigo-500/30 to-cyan-400/40 blur-[9px] pointer-events-none transition-opacity duration-500',
            (animated || loading) && 'animate-pulse'
          )}
        />
      )}

      {/* Khung Squircle kính mờ đa tầng chuẩn icon ứng dụng Mobile */}
      <div
        className={cn(
          'relative size-full rounded-[24%] flex items-center justify-center overflow-hidden border border-sky-300/40 dark:border-sky-400/50 shadow-[0_4px_16px_rgba(14,165,233,0.25)] transition-all duration-300',
          'bg-gradient-to-b from-white/95 via-sky-50/90 to-sky-100/90 dark:from-[#0d1d36] dark:via-[#091528] dark:to-[#050e1c]',
          'group-hover:scale-105 group-hover:border-sky-400 group-hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'
        )}
      >
        {/* Lớp viền phản quang trên (Top Bevel Highlight) */}
        <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/50 dark:from-sky-300/25 to-transparent pointer-events-none" />

        {/* Biểu tượng vector chữ A cách điệu */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            'relative drop-shadow-[0_2px_8px_rgba(2,132,199,0.5)] transition-transform duration-300 group-hover:scale-110',
            iconSizeMap[size]
          )}
        >
          <defs>
            {/* Gradient màu xanh Cyber/Sky đa tầng chuẩn nhận diện thương hiệu */}
            <linearGradient id="dc-logo-grad" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Gradient ánh sáng lướt nhẹ phản quang */}
            <linearGradient id="dc-logo-shine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            {/* Gradient tia sáng chạy dọc thân chữ A */}
            <linearGradient id="dc-trace-glow" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
            </linearGradient>

            {/* Mask cắt hình dáng chữ A cho hiệu ứng quét ánh sáng */}
            <mask id="dc-a-mask">
              <path
                d="M50 16C43.5 16 35.8 28.5 28.5 44.5C21.8 59.2 17.5 73.2 18.2 78.4C18.8 82.5 22.8 84.5 26.8 82.8C32.5 80.4 39.5 70.8 44.2 60.5C46.8 54.8 48.8 49.8 50 49.8C51.2 49.8 53.2 54.8 55.8 60.5C60.5 70.8 67.5 80.4 73.2 82.8C77.2 84.5 81.2 82.5 81.8 78.4C82.5 73.2 78.2 59.2 71.5 44.5C64.2 28.5 56.5 16 50 16Z"
                fill="#ffffff"
              />
            </mask>
          </defs>

          {/* Biểu tượng chữ A cách điệu: Vòm cong uyển chuyển vững chãi với đỉnh nhọn bo tròn */}
          <path
            d="M50 16C43.5 16 35.8 28.5 28.5 44.5C21.8 59.2 17.5 73.2 18.2 78.4C18.8 82.5 22.8 84.5 26.8 82.8C32.5 80.4 39.5 70.8 44.2 60.5C46.8 54.8 48.8 49.8 50 49.8C51.2 49.8 53.2 54.8 55.8 60.5C60.5 70.8 67.5 80.4 73.2 82.8C77.2 84.5 81.2 82.5 81.8 78.4C82.5 73.2 78.2 59.2 71.5 44.5C64.2 28.5 56.5 16 50 16Z"
            fill="url(#dc-logo-grad)"
          />

          {/* Đường gân phản quang dọc đỉnh vòm tăng chiều sâu 3D */}
          <path
            d="M50 20C47.2 20 42.8 28.2 37.8 40.2C33.2 51.5 29.5 63 29.8 68.2C32.8 66 37.8 58.2 42 49.5C45.2 42.8 48.2 36.8 50 36.8C51.8 36.8 54.8 42.8 58 49.5C62.2 58.2 67.2 66 70.2 68.2C70.5 63 66.8 51.5 62.2 40.2C57.2 28.2 52.8 20 50 20Z"
            fill="url(#dc-logo-shine)"
            opacity="0.65"
          />

          {/* Hiệu ứng animated chạy dọc chữ A khi chờ (loading) */}
          {loading && (
            <>
              {/* Lớp quét ánh sáng dọc thân chữ A */}
              <g mask="url(#dc-a-mask)">
                <rect
                  x="10"
                  y="10"
                  width="80"
                  height="26"
                  fill="url(#dc-logo-shine)"
                  opacity="0.75"
                  className="dc-a-scan-bar"
                />
              </g>

              {/* Tia sáng năng lượng neon chạy uốn lượn dọc sống lưng chữ A (từ chân trái lên đỉnh qua chân phải) */}
              <path
                d="M 23 81 C 31 67, 43 28, 50 17 C 57 28, 69 67, 77 81"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                className="dc-a-pulse-outer"
              />
              <path
                d="M 23 81 C 31 67, 43 28, 50 17 C 57 28, 69 67, 77 81"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="round"
                className="dc-a-pulse-inner"
              />
            </>
          )}
        </svg>

        {/* CSS Keyframes cho hiệu ứng animated chạy dọc chữ A */}
        {loading && (
          <style>
            {`
              @keyframes dcPulseTrace {
                0% {
                  stroke-dasharray: 40 160;
                  stroke-dashoffset: 160;
                  opacity: 0;
                }
                15% {
                  opacity: 1;
                }
                85% {
                  opacity: 1;
                }
                100% {
                  stroke-dasharray: 40 160;
                  stroke-dashoffset: -160;
                  opacity: 0;
                }
              }
              @keyframes dcScanFlow {
                0% {
                  transform: translateY(70px);
                  opacity: 0;
                }
                25% {
                  opacity: 0.85;
                }
                75% {
                  opacity: 0.85;
                }
                100% {
                  transform: translateY(-25px);
                  opacity: 0;
                }
              }
              .dc-a-pulse-outer {
                animation: dcPulseTrace 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                filter: drop-shadow(0 0 5px #38bdf8);
              }
              .dc-a-pulse-inner {
                animation: dcPulseTrace 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                filter: drop-shadow(0 0 2px #ffffff);
              }
              .dc-a-scan-bar {
                animation: dcScanFlow 1.6s ease-in-out infinite;
              }
            `}
          </style>
        )}
      </div>
    </div>
  )
})
