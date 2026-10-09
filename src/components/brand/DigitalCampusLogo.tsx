import { memo } from 'react'
import { cn } from '@/lib/utils'

interface DigitalCampusLogoProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
  showGlow?: boolean
}

/**
 * Biểu tượng thương hiệu Digital Campus chuẩn (chữ A / vòm cánh chim tương lai)
 * Thiết kế chuẩn icon ứng dụng điện thoại squircle với hiệu ứng animated phát sáng rực rỡ
 */
export const DigitalCampusLogo = memo(function DigitalCampusLogo({
  className,
  size = 'md',
  animated = true,
  showGlow = true,
}: DigitalCampusLogoProps) {
  const sizeMap = {
    xs: 'size-6',
    sm: 'size-7 sm:size-8',
    md: 'size-9 sm:size-10',
    lg: 'size-11 sm:size-12',
    xl: 'size-14 sm:size-16',
  }

  const iconSizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-6 h-6',
    lg: 'w-7.5 h-7.5',
    xl: 'w-10 h-10',
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
            'absolute -inset-1 rounded-[28%] bg-gradient-to-tr from-sky-400/40 via-indigo-500/30 to-cyan-400/40 blur-[7px] pointer-events-none transition-opacity duration-500',
            animated && 'animate-pulse'
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

        {/* Biểu tượng vector chữ A / Vòm cất cánh đặc trưng của Digital Campus */}
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

            {/* Gradient ánh sáng lướt nhẹ */}
            <linearGradient id="dc-logo-shine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            <filter id="dc-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
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

          {/* Viên ngọc năng lượng lõi phát sáng ở tâm vòm */}
          <circle cx="50" cy="38" r="4.5" fill="#e0f2fe" filter="url(#dc-glow-filter)" />
        </svg>

        {/* Chấm tròn live signal ở góc trên bên phải */}
        <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex size-2">
          {animated && (
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-sky-400 opacity-75" />
          )}
          <span className="relative inline-flex size-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
        </span>
      </div>
    </div>
  )
})
