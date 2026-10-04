import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface Icon3DProps extends SVGProps<SVGSVGElement> {
  className?: string
  size?: number | string
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CỜ VUA: VƯƠNG MIỆN HOÀNG KIM 3D (Golden Crown with Sapphire Gems)
// ─────────────────────────────────────────────────────────────────────────────
export function IconCrown3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `crown${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        {/* Vàng kim 3D ánh kim */}
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        {/* Bóng khối chân vương miện */}
        <linearGradient id={`${id}-base`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        {/* Ngọc Sapphire xanh lam */}
        <radialGradient id={`${id}-sapphire`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="80%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        {/* Hào quang vàng kim */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.45" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Thân vương miện 3D với 5 đỉnh nhọn và cánh vòm uốn lượn */}
        <path
          d="M6 34L9 16L17 26L24 10L31 26L39 16L42 34C42 37 39 39 36 39H12C9 39 6 37 6 34Z"
          fill={`url(#${id}-gold)`}
          stroke="#fef08a"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Khối nổi đệm phía trước tạo chiều sâu 3D */}
        <path
          d="M9 33C14 36 34 36 39 33L36 38C32 40 16 40 12 38L9 33Z"
          fill="#b45309"
          opacity="0.8"
        />

        {/* Vành đai vương miện đính ngọc */}
        <rect x="9" y="33" width="30" height="5" rx="2.5" fill={`url(#${id}-base)`} stroke="#fef08a" strokeWidth="0.8" />

        {/* 3 Viên ngọc Sapphire gắn ở vành */}
        <circle cx="16" cy="35.5" r="1.8" fill={`url(#${id}-sapphire)`} stroke="#ffffff" strokeWidth="0.5" />
        <circle cx="24" cy="35.5" r="2.2" fill={`url(#${id}-sapphire)`} stroke="#ffffff" strokeWidth="0.5" />
        <circle cx="32" cy="35.5" r="1.8" fill={`url(#${id}-sapphire)`} stroke="#ffffff" strokeWidth="0.5" />

        {/* Đỉnh ngọc trên 3 nhánh chính */}
        <circle cx="9" cy="15" r="2.5" fill={`url(#${id}-gold)`} stroke="#fef08a" strokeWidth="0.8" />
        <circle cx="24" cy="9" r="3.2" fill={`url(#${id}-sapphire)`} stroke="#fef08a" strokeWidth="0.8" />
        <circle cx="39" cy="15" r="2.5" fill={`url(#${id}-gold)`} stroke="#fef08a" strokeWidth="0.8" />

        {/* Vết sáng kim loại (Specular Highlight) */}
        <path
          d="M23 15L24 28L25 15"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CỜ TƯỚNG: QUÂN GỖ KHẮC ĐỎ 3D (Polished Wooden Piece with Crimson Carving)
// ─────────────────────────────────────────────────────────────────────────────
export function IconXiangqiPiece3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `xq${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        {/* Vân gỗ gụ bóng bẩy 3D */}
        <radialGradient id={`${id}-wood`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="30%" stopColor="#fed7aa" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
        {/* Viền vát cạnh 3D (Beveled Chamfer) */}
        <linearGradient id={`${id}-bevel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="50%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#431407" />
        </linearGradient>
        {/* Chữ khắc son đỏ sâu 3D */}
        <filter id={`${id}-carve`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="0.8" floodColor="#450a0a" floodOpacity="0.8" />
        </filter>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter={`url(#${id}-shadow)`}>
        {/* Đế quân cờ tạo độ dày 3D */}
        <circle cx="24" cy="26" r="20" fill="#431407" />

        {/* Mặt quân cờ vát tròn */}
        <circle cx="24" cy="23" r="19" fill={`url(#${id}-bevel)`} />
        <circle cx="24" cy="23" r="17" fill={`url(#${id}-wood)`} stroke="#7c2d12" strokeWidth="1" />

        {/* Vòng tròn khắc trong mặt cờ */}
        <circle cx="24" cy="23" r="14" stroke="#c2410c" strokeWidth="1" strokeDasharray="1 1" opacity="0.6" />

        {/* Chữ Tướng (將) thư pháp son đỏ khắc chìm 3D */}
        <text
          x="24"
          y="30"
          fontSize="17"
          fontFamily="serif"
          fontWeight="900"
          textAnchor="middle"
          fill="#dc2626"
          stroke="#991b1b"
          strokeWidth="0.6"
          filter={`url(#${id}-carve)`}
        >
          將
        </text>

        {/* Vệt bóng gương ánh sáng tự nhiên */}
        <path
          d="M13 14C17 9 31 9 35 14"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.45"
        />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CỜ CARO: CỤM BIỂU TƯỢNG X + O 3D PHÁT QUANG (Glowing 3D Isometric X, +, O)
// ─────────────────────────────────────────────────────────────────────────────
export function IconCaroCubes3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `caro${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="45%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <linearGradient id={`${id}-pink`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Quân X Cyan 3D nổi khối */}
        <g transform="translate(6, 12)">
          <path
            d="M4 18L10 12L4 6L7 3L13 9L19 3L22 6L16 12L22 18L19 21L13 15L7 21Z"
            fill="#0369a1"
            transform="translate(0, 2)"
          />
          <path
            d="M4 18L10 12L4 6L7 3L13 9L19 3L22 6L16 12L22 18L19 21L13 15L7 21Z"
            fill={`url(#${id}-cyan)`}
            stroke="#e0f2fe"
            strokeWidth="0.8"
          />
        </g>

        {/* Dấu cộng + trắng ánh bạc nổi ở giữa */}
        <g transform="translate(19, 4)">
          <path
            d="M4.5 0H7.5V4.5H12V7.5H7.5V12H4.5V7.5H0V4.5H4.5V0Z"
            fill="#ffffff"
            stroke="#bae6fd"
            strokeWidth="0.5"
            opacity="0.95"
          />
        </g>

        {/* Vòng tròn O Torus 3D */}
        <g transform="translate(25, 19)">
          <ellipse cx="10" cy="12" rx="9" ry="8" fill="#881337" />
          <ellipse cx="10" cy="10" rx="9" ry="8" fill={`url(#${id}-pink)`} stroke="#fecdd3" strokeWidth="0.8" />
          <ellipse cx="10" cy="10" rx="4.5" ry="4" fill="#0c182c" stroke="#9f1239" strokeWidth="0.8" />
          <circle cx="8" cy="7" r="1.5" fill="#ffffff" opacity="0.85" />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRÍ NHỚ: TINH THỂ MANA 3D ĐẾ HÀO QUANG (3D Glowing Mana Crystal & Pedestal)
// ─────────────────────────────────────────────────────────────────────────────
export function IconManaCrystal3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `gem${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-facet1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={`${id}-facet2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <linearGradient id={`${id}-facet3`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={`${id}-glow-base`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#c084fc" floodOpacity="0.75" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Vòng đế hào quang dưới chân tinh thể */}
        <ellipse cx="24" cy="41" rx="14" ry="4" fill={`url(#${id}-glow-base)`} />
        <ellipse cx="24" cy="41" rx="9" ry="2.5" stroke="#bae6fd" strokeWidth="0.8" opacity="0.7" />

        {/* Tinh thể đa giác 3D đa diện sắc sảo */}
        {/* Đỉnh chóp trên */}
        <polygon points="24,5 13,18 24,24" fill={`url(#${id}-facet1)`} stroke="#f5d0fe" strokeWidth="0.8" />
        <polygon points="24,5 35,18 24,24" fill={`url(#${id}-facet3)`} stroke="#f5d0fe" strokeWidth="0.8" />
        <polygon points="13,18 24,5 24,24" fill="#fae8ff" opacity="0.35" />

        {/* Khối chóp dưới */}
        <polygon points="13,18 24,40 24,24" fill={`url(#${id}-facet2)`} stroke="#e9d5ff" strokeWidth="0.8" />
        <polygon points="35,18 24,40 24,24" fill="#6b21a8" stroke="#e9d5ff" strokeWidth="0.8" />

        {/* Ánh sáng phản xạ chính giữa */}
        <polygon points="24,10 28,19 24,23 20,19" fill="#ffffff" opacity="0.75" />

        {/* Ngôi sao lấp lánh góc trên */}
        <path
          d="M34 8L35.5 12L39.5 13.5L35.5 15L34 19L32.5 15L28.5 13.5L32.5 12Z"
          fill="#ffffff"
          opacity="0.9"
        />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RẮN SĂN MỒI: RẮN NGỌC & TÁO ĐỎ 3D (3D Glossy Emerald Snake & Candy Apple)
// ─────────────────────────────────────────────────────────────────────────────
export function IconSnakeApple3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `snake${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        {/* Da rắn ngọc xanh bóng */}
        <linearGradient id={`${id}-snake`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="45%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        {/* Táo đỏ ngọt ngào 3D */}
        <radialGradient id={`${id}-apple`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="40%" stopColor="#ef4444" />
          <stop offset="85%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Thân rắn uốn lượn 3D */}
        <path
          d="M8 36C8 28 16 28 16 22C16 16 24 16 24 22C24 28 32 28 32 20"
          stroke="#065f46"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M8 34C8 26 16 26 16 20C16 14 24 14 24 20C24 26 32 26 32 18"
          stroke={`url(#${id}-snake)`}
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Đầu rắn 3D dễ thương */}
        <circle cx="8" cy="33" r="6" fill={`url(#${id}-snake)`} stroke="#a7f3d0" strokeWidth="0.8" />
        <circle cx="6" cy="31.5" r="1.8" fill="#ffffff" />
        <circle cx="5.5" cy="31.5" r="0.9" fill="#064e3b" />

        {/* Quả táo đỏ 3D */}
        <g transform="translate(24, 14)">
          {/* Bóng đổ táo */}
          <ellipse cx="11" cy="22" rx="9" ry="3.5" fill="#000000" opacity="0.3" />
          {/* Thân quả táo */}
          <circle cx="11" cy="14" r="9" fill={`url(#${id}-apple)`} stroke="#fecaca" strokeWidth="0.8" />
          {/* Cuống táo & lá xanh */}
          <path d="M11 6C11 3 13 1 15 1" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 4C15 2 18 3 17 6C15 6 13 5 12 4Z" fill="#34d399" />
          {/* Đốm sáng trên táo */}
          <ellipse cx="8" cy="11" rx="2.5" ry="1.5" transform="rotate(-25 8 11)" fill="#ffffff" opacity="0.75" />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CHẾ ĐỘ CÔNG KHAI: QUẢ CẦU HOLOGRAPHIC 3D (3D Glowing Hologram Globe)
// ─────────────────────────────────────────────────────────────────────────────
export function IconGlobe3D({ className, size = 28, ...props }: Icon3DProps) {
  const id = `globe${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="35%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#38bdf8" floodOpacity="0.7" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Quả cầu holographic */}
        <circle cx="18" cy="18" r="14" fill={`url(#${id}-core)`} stroke="#bae6fd" strokeWidth="1.2" />

        {/* Các đường kinh vĩ tuyến neon */}
        <ellipse cx="18" cy="18" rx="7" ry="13.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
        <line x1="4.5" y1="18" x2="31.5" y2="18" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
        <ellipse cx="18" cy="12" rx="11.5" ry="3.5" stroke="#ffffff" strokeWidth="0.6" opacity="0.45" />
        <ellipse cx="18" cy="24" rx="11.5" ry="3.5" stroke="#ffffff" strokeWidth="0.6" opacity="0.45" />

        {/* Vệt sáng lóa bề mặt */}
        <ellipse cx="13" cy="11" rx="4" ry="2" transform="rotate(-30 13 11)" fill="#ffffff" opacity="0.6" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. CHẾ ĐỘ RIÊNG TƯ: KHIÊN BẠC & KHÓA VÀNG 3D (3D Shield with Golden Padlock)
// ─────────────────────────────────────────────────────────────────────────────
export function IconShield3D({ className, size = 28, ...props }: Icon3DProps) {
  const id = `shield${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        {/* Kim loại thép bạc bóng bẩy */}
        <linearGradient id={`${id}-steel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="35%" stopColor="#94a3b8" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        {/* Khóa vàng kim */}
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Mặt khiên 3D */}
        <path
          d="M18 3L6 8V18C6 26 12 31 18 33C24 31 30 26 30 18V8L18 3Z"
          fill={`url(#${id}-steel)`}
          stroke="#e2e8f0"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Lòng trong khiên xanh saphire */}
        <path
          d="M18 5L8.5 9V17.5C8.5 24 13 28.5 18 30.5C23 28.5 27.5 24 27.5 17.5V9L18 5Z"
          fill="#0a1f4d"
          stroke="#38bdf8"
          strokeWidth="0.8"
        />

        {/* Ổ khóa vàng ở trung tâm */}
        {/* Vòng khóa */}
        <path
          d="M15 16V13C15 11.3 16.3 10 18 10C19.7 10 21 11.3 21 13V16"
          stroke={`url(#${id}-gold)`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Thân khóa */}
        <rect x="13.5" y="16" width="9" height="7.5" rx="2" fill={`url(#${id}-gold)`} stroke="#fef08a" strokeWidth="0.8" />
        {/* Lỗ khóa */}
        <circle cx="18" cy="19.5" r="1.2" fill="#451a03" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. TIA SÁNG LẤP LÁNH LENS FLARE (4-Point Golden Lens Flare Sparkle)
// ─────────────────────────────────────────────────────────────────────────────
export function IconStarSparkle({ className, size = 20, ...props }: Icon3DProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn('cyber-star-sparkle select-none', className)}
      fill="none"
      {...props}
    >
      <path
        d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z"
        fill="#ffffff"
      />
      <circle cx="12" cy="10" r="3" fill="#fde047" opacity="0.9" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RƯƠNG BÁU THẦN BÍ 3D (3D Glowing Magical Treasure Chest)
// ─────────────────────────────────────────────────────────────────────────────
export function IconChest3D({ className, size = 48, ...props }: Icon3DProps) {
  const id = `chest${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-wood`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Bóng dưới đáy rương */}
        <ellipse cx="32" cy="56" rx="26" ry="6" fill="#000000" opacity="0.4" />

        {/* Thùng rương chính */}
        <rect x="10" y="26" width="44" height="28" rx="4" fill={`url(#${id}-wood)`} stroke="#b45309" strokeWidth="1.5" />

        {/* Nắp vòm rương mở hé phát ánh sáng thần bí */}
        <path
          d="M8 24C8 14 20 8 32 8C44 8 56 14 56 24L54 27H10L8 24Z"
          fill={`url(#${id}-wood)`}
          stroke="#f59e0b"
          strokeWidth="1.5"
        />

        {/* Ánh sáng ma thuật tràn ra từ khe rương */}
        <rect x="11" y="24" width="42" height="3" fill="#38bdf8" opacity="0.9" />

        {/* Nẹp viền vàng kim loại gia cố */}
        <rect x="16" y="26" width="6" height="28" fill={`url(#${id}-gold)`} stroke="#fef08a" strokeWidth="0.8" />
        <rect x="42" y="26" width="6" height="28" fill={`url(#${id}-gold)`} stroke="#fef08a" strokeWidth="0.8" />
        <path d="M16 8C16 8 18 24 18 24H24C24 24 22 8 22 8H16Z" fill={`url(#${id}-gold)`} />
        <path d="M42 8C42 8 44 24 44 24H50C50 24 48 8 48 8H42Z" fill={`url(#${id}-gold)`} />

        {/* Khóa rương hoàng kim */}
        <rect x="28" y="22" width="8" height="9" rx="2" fill={`url(#${id}-gold)`} stroke="#ffffff" strokeWidth="1" />
        <circle cx="32" cy="26" r="1.5" fill="#451a03" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. FILE TÀI LIỆU PDF 3D NỔI (3D Embossed Study PDF Document)
// ─────────────────────────────────────────────────────────────────────────────
export function IconPdf3D({ className, size = 36, ...props }: Icon3DProps) {
  const id = `pdf${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 40 44"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Trang giấy dày 3D gập góc */}
        <path
          d="M6 4C6 2.3 7.3 1 9 1H26L36 11V39C36 40.7 34.7 42 33 42H9C7.3 42 6 40.7 6 39V4Z"
          fill={`url(#${id}-grad)`}
          stroke="#fecaca"
          strokeWidth="1.2"
        />
        {/* Góc gấp 3D */}
        <path d="M26 1V11H36" fill="#7f1d1d" stroke="#fecaca" strokeWidth="1.2" />

        {/* Chữ PDF nổi bật */}
        <text
          x="21"
          y="27"
          fontSize="10"
          fontWeight="900"
          fontFamily="sans-serif"
          textAnchor="middle"
          fill="#ffffff"
          letterSpacing="0.5"
        >
          PDF
        </text>

        {/* Các dòng mô phỏng văn bản */}
        <rect x="12" y="32" width="18" height="2" rx="1" fill="#ffffff" opacity="0.75" />
        <rect x="12" y="36" width="12" height="2" rx="1" fill="#ffffff" opacity="0.5" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. BẬC THẦM VINH DANH TOP 3 PODIUMS 3D (Gold, Silver, Bronze 3D Pedestals)
// ─────────────────────────────────────────────────────────────────────────────
export function PodiumTop3({
  rank,
  className,
  children,
}: {
  rank: 1 | 2 | 3
  className?: string
  children?: React.ReactNode
}) {
  const configs = {
    1: {
      height: 'h-24 sm:h-28',
      baseClass: 'cyber-podium-base-1',
      badgeColor: 'bg-amber-400 text-amber-950 shadow-amber-400/50',
      label: '1',
      crown: true,
    },
    2: {
      height: 'h-18 sm:h-20',
      baseClass: 'cyber-podium-base-2',
      badgeColor: 'bg-slate-200 text-slate-900 shadow-slate-300/50',
      label: '2',
      crown: false,
    },
    3: {
      height: 'h-14 sm:h-16',
      baseClass: 'cyber-podium-base-3',
      badgeColor: 'bg-orange-300 text-orange-950 shadow-orange-400/50',
      label: '3',
      crown: false,
    },
  }[rank]

  return (
    <div className={cn('flex flex-col items-center justify-end select-none', className)}>
      {/* Vùng người chơi / Avatar phía trên bục */}
      <div className="relative mb-2 flex flex-col items-center">
        {configs.crown && (
          <div className="absolute -top-7 z-10 animate-bounce">
            <IconCrown3D size={28} />
          </div>
        )}
        {children}
      </div>

      {/* Khối bục 3D vát kim loại */}
      <div
        className={cn(
          'w-20 sm:w-24 rounded-t-2xl flex flex-col items-center justify-start pt-2 font-black text-xl tracking-wider shadow-lg',
          configs.height,
          configs.baseClass,
        )}
      >
        <span
          className={cn(
            'size-7 rounded-full flex items-center justify-center text-sm font-black shadow-md',
            configs.badgeColor,
          )}
        >
          {configs.label}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. THANH KIẾM CHIẾN ĐẤU 3D CYAN PHÁT QUANG (Glowing 3D Cyber Sword)
// ─────────────────────────────────────────────────────────────────────────────
export function IconSword3D({ className, size = 28, ...props }: Icon3DProps) {
  const id = `sword${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        {/* Lưỡi kiếm phát quang Cyan */}
        <linearGradient id={`${id}-blade`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="80%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        {/* Cạnh phản chiếu ánh sáng */}
        <linearGradient id={`${id}-edge`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="70%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        {/* Chuôi kiếm thép xanh */}
        <linearGradient id={`${id}-hilt`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#38bdf8" floodOpacity="0.8" />
        </filter>
      </defs>

      <g filter={`url(#${id}-glow)`}>
        {/* Lưỡi kiếm chéo 45 độ hướng lên trên bên phải */}
        <path
          d="M17 31L35 13L39 9L35 5L31 9L13 27L17 31Z"
          fill={`url(#${id}-blade)`}
        />
        {/* Sống kiếm sắc nhọn */}
        <path
          d="M15 29L35 9L39 9L35 13L17 31"
          stroke={`url(#${id}-edge)`}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Chắn kiếm (Crossguard) */}
        <path
          d="M9 23L25 39L23 41L7 25Z"
          fill={`url(#${id}-hilt)`}
          stroke="#38bdf8"
          strokeWidth="0.8"
        />
        {/* Chuôi kiếm */}
        <path
          d="M10 38L6 42C5 43 4 43 3 42C2 41 2 40 3 39L7 35L10 38Z"
          fill="#0284c7"
          stroke="#38bdf8"
          strokeWidth="0.8"
        />
        {/* Ngọc chuôi kiếm */}
        <circle cx="4" cy="41" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
        {/* Tia lóe sáng ở mũi kiếm */}
        <circle cx="37" cy="7" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. CÚP VÀNG CHIẾN THẮNG 3D (3D Golden Victory Trophy)
// ─────────────────────────────────────────────────────────────────────────────
export function IconTrophyGold3D({ className, size = 36, ...props }: Icon3DProps) {
  const id = `trophy${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        {/* Quai cúp trái & phải */}
        <path d="M12 14C8 14 6 18 6 22C6 26 10 28 14 27" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 14C40 14 42 18 42 22C42 26 38 28 34 27" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
        {/* Thân cúp */}
        <path
          d="M12 10H36V20C36 27 30 32 24 32C18 32 12 27 12 20V10Z"
          fill={`url(#${id}-gold)`}
          stroke="#fef08a"
          strokeWidth="1.2"
        />
        {/* Cuống cúp */}
        <path d="M22 32H26V38H22V32Z" fill="#b45309" stroke="#fef08a" strokeWidth="0.8" />
        {/* Đế cúp tròn kim loại */}
        <ellipse cx="24" cy="40" rx="10" ry="3.5" fill={`url(#${id}-gold)`} stroke="#fde047" strokeWidth="1" />
        {/* Ngôi sao nổi trên thân cúp */}
        <path
          d="M24 16L25.5 19.5L29 20L26.5 22.5L27 26L24 24.2L21 26L21.5 22.5L19 20L22.5 19.5L24 16Z"
          fill="#ffffff"
          opacity="0.9"
        />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. HUY HIỆU XP ĐỒNG HOÀNG GIA 3D (3D Royal Bronze XP Medal)
// ─────────────────────────────────────────────────────────────────────────────
export function IconXpMedal3D({ className, size = 36, ...props }: Icon3DProps) {
  const id = `xpmed${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-bronze`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="80%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#ea580c" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        {/* Dải ruy băng phía sau */}
        <path d="M18 4L14 18L24 14L34 18L30 4Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
        {/* Huân chương đồng hoa văn răng cưa */}
        <circle cx="24" cy="26" r="16" fill="#7c2d12" />
        <circle cx="24" cy="26" r="14.5" fill={`url(#${id}-bronze)`} stroke="#ffedd5" strokeWidth="1" />
        <circle cx="24" cy="26" r="11" stroke="#ffedd5" strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.8" />
        {/* Chữ XP nổi 3D */}
        <text
          x="24"
          y="31"
          fontSize="11"
          fontFamily="sans-serif"
          fontWeight="900"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#9a3412"
          strokeWidth="0.5"
          letterSpacing="0.5"
        >
          XP
        </text>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. HUY HIỆU RANK VÀNG NGÔI SAO 3D (3D Golden Star Rank Insignia)
// ─────────────────────────────────────────────────────────────────────────────
export function IconRankStar3D({ className, size = 36, ...props }: Icon3DProps) {
  const id = `rank${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#f59e0b" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        {/* Cánh khiên chevron xếp lớp vàng 3D */}
        <path d="M12 16L24 8L36 16L24 24Z" fill={`url(#${id}-gold)`} stroke="#fde047" strokeWidth="1" />
        <path d="M10 24L24 16L38 24L24 33Z" fill={`url(#${id}-gold)`} stroke="#fde047" strokeWidth="1" />
        <path d="M8 32L24 23L40 32L24 42Z" fill={`url(#${id}-gold)`} stroke="#fde047" strokeWidth="1" />
        {/* Ngôi sao lấp lánh trung tâm */}
        <circle cx="24" cy="24" r="3" fill="#ffffff" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. KIM CƯƠNG VÒNG NGUYỆT QUẾ 3D (3D Prismatic Diamond with Laurel Wreath)
// ─────────────────────────────────────────────────────────────────────────────
export function IconLaurelDiamond3D({ className, size = 64, ...props }: Icon3DProps) {
  const id = `laurel${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn('shrink-0 select-none overflow-visible', className)}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient id={`${id}-diamond`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#a5f3fc" />
          <stop offset="70%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
        </filter>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        {/* Vòng nguyệt quế bạc uốn cong */}
        <path
          d="M12 40C8 30 14 16 26 12M52 40C56 30 50 16 38 12"
          stroke={`url(#${id}-silver)`}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Lá nguyệt quế xếp tầng */}
        {[
          { cx: 13, cy: 36, r: 3 },
          { cx: 10, cy: 28, r: 3 },
          { cx: 13, cy: 20, r: 3 },
          { cx: 20, cy: 14, r: 3 },
          { cx: 51, cy: 36, r: 3 },
          { cx: 54, cy: 28, r: 3 },
          { cx: 51, cy: 20, r: 3 },
          { cx: 44, cy: 14, r: 3 },
        ].map((leaf, idx) => (
          <circle key={idx} cx={leaf.cx} cy={leaf.cy} r={leaf.r} fill={`url(#${id}-silver)`} stroke="#ffffff" strokeWidth="0.5" />
        ))}
        {/* Kim cương lăng kính phát quang */}
        <g transform="translate(18, 14)">
          <path d="M14 0L24 12L14 34L4 12Z" fill={`url(#${id}-diamond)`} stroke="#ffffff" strokeWidth="1" />
          <path d="M14 0L14 34" stroke="#ffffff" strokeWidth="0.8" opacity="0.7" />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. ỐC VÍT KIM LOẠI 4 GÓC 3D (3D Metallic Corner Screws / Bolts)
// ─────────────────────────────────────────────────────────────────────────────
export function CornerBolts({ color = 'steel' }: { color?: 'steel' | 'brass' }) {
  const isBrass = color === 'brass'
  const boltBg = isBrass
    ? 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 border-amber-600/80 shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)]'
    : 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-slate-500/80 shadow-[0_1px_2px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.7)]'
  const slotColor = isBrass ? 'bg-amber-900/80' : 'bg-slate-800/80'

  return (
    <>
      {(['top-2.5 left-2.5', 'top-2.5 right-2.5', 'bottom-2.5 left-2.5', 'bottom-2.5 right-2.5'] as const).map((pos, i) => (
        <span
          key={i}
          className={cn(
            'absolute size-2.5 rounded-full border flex items-center justify-center pointer-events-none select-none z-10',
            pos,
            boltBg,
          )}
        >
          {/* Rãnh ốc vít */}
          <span className={cn('w-1.5 h-[1px] rotate-45 rounded-full', slotColor)} />
        </span>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 18. HỌA TIẾT THIẾT KẾ XANH MẠNG GAME SẢNH ĐẤU (Blueprint Arcade Schematic)
// ─────────────────────────────────────────────────────────────────────────────
export function BlueprintArcadePattern({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 530 700"
      preserveAspectRatio="none"
      className={cn('pointer-events-none select-none overflow-hidden absolute inset-0 w-full h-full', className)}
      fill="none"
    >
      <defs>
        <pattern id="grid-blueprint-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.6" fill="rgba(56, 189, 248, 0.08)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-blueprint-dots)" opacity="0.65" />

      {/* Đường viền tọa độ kỹ thuật góc và vi mạch chìm */}
      <g stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        {/* Góc trên bên trái: Mã định danh kỹ thuật & thước ngắm */}
        <path d="M16 36 H48 M16 36 V68" />
        <path d="M24 24 H34 M29 19 V29" />
        <path d="M60 28 H110 V42 H140" />
        <circle cx="140" cy="42" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        <circle cx="60" cy="28" r="1.5" fill="rgba(56, 189, 248, 0.2)" />

        {/* Góc trên bên phải: Đường dẫn mê cung Pac-Man & Ghost */}
        <g transform="translate(290, 0)">
          <path d="M140 10 H220 V80 H170 V120 H220" />
          <path d="M160 30 H200 V60 H160 Z" />
          <path d="M148 72 C148 64 153 59 160 59 C167 59 172 64 172 72 V82 L168 79 L164 82 L160 79 L156 82 L152 79 L148 82 Z" />
          <circle cx="153" cy="69" r="1.4" fill="rgba(56, 189, 248, 0.18)" />
          <circle cx="163" cy="69" r="1.4" fill="rgba(56, 189, 248, 0.18)" />

          {/* Bàn cờ Tic-Tac-Toe */}
          <g transform="translate(178, 68)">
            <line x1="12" y1="2" x2="12" y2="34" />
            <line x1="24" y1="2" x2="24" y2="34" />
            <line x1="2" y1="12" x2="34" y2="12" />
            <line x1="2" y1="24" x2="34" y2="24" />
            <line x1="4" y1="4" x2="10" y2="10" />
            <line x1="10" y1="4" x2="4" y2="10" />
            <circle cx="29" cy="18" r="3.5" />
          </g>

          {/* Quân Vua cờ wireframe */}
          <g transform="translate(112, 58)">
            <line x1="12" y1="2" x2="12" y2="8" />
            <line x1="9" y1="5" x2="15" y2="5" />
            <path d="M6 14 C8 10 16 10 18 14 L19 26 H5 Z" />
            <path d="M3 26 H21 V29 H3 Z" />
          </g>

          {/* Tay cầm chơi game / D-Pad & Buttons wireframe */}
          <g transform="translate(178, 126)">
            <rect x="0" y="0" width="36" height="22" rx="4" />
            <path d="M6 11 H14 M10 7 V15" />
            <circle cx="25" cy="9" r="1.8" />
            <circle cx="30" cy="13" r="1.8" />
          </g>
        </g>

        {/* Cạnh bên trái (giữa): Mạch điện vi tính & Khối Tetris wireframe */}
        <g transform="translate(14, 260)">
          <path d="M0 20 H30 V60 H15 V90 H45" />
          <circle cx="45" cy="90" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
          {/* Tetris L-block wireframe */}
          <g transform="translate(4, 30)">
            <rect x="0" y="0" width="8" height="8" />
            <rect x="0" y="8" width="8" height="8" />
            <rect x="0" y="16" width="8" height="8" />
            <rect x="8" y="16" width="8" height="8" />
          </g>
        </g>

        {/* Cạnh bên phải (giữa): Mạch điện vi tính */}
        <g transform="translate(490, 280)">
          <path d="M26 10 H0 V45 H15 V75 H-10" />
          <circle cx="15" cy="45" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Góc dưới bên trái: Cần gạt Arcade Joystick & Quả táo rắn săn mồi */}
        <g transform="translate(16, 560)">
          {/* Thước góc kỹ thuật */}
          <path d="M0 80 H40 M0 80 V40" />
          {/* Arcade Joystick wireframe */}
          <g transform="translate(20, 36)">
            <ellipse cx="14" cy="30" rx="14" ry="5" />
            <line x1="14" y1="30" x2="14" y2="12" />
            <circle cx="14" cy="8" r="6" />
          </g>
          {/* Snake Apple wireframe */}
          <g transform="translate(56, 52)">
            <circle cx="8" cy="10" r="7" />
            <path d="M8 3 Q10 0 13 1" />
          </g>
          {/* Mạch điện nối */}
          <path d="M78 62 H120 V85 H160" />
          <circle cx="160" cy="85" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Góc dưới bên phải: Ngôi sao vinh quang 8-bit & Mạch điện */}
        <g transform="translate(430, 570)">
          {/* Thước góc kỹ thuật */}
          <path d="M70 70 H30 M70 70 V30" />
          {/* Ngôi sao Pixel wireframe */}
          <g transform="translate(18, 20)">
            <path d="M12 0 L15 8 L24 9 L17 15 L19 24 L12 19 L5 24 L7 15 L0 9 L9 8 Z" />
          </g>
          {/* Mạch điện */}
          <path d="M-20 60 H15 V40" />
          <circle cx="-20" cy="60" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>
      </g>
    </svg>
  )
}
