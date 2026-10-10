import { useId, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface Icon3DProps extends SVGProps<SVGSVGElement> {
  className?: string
  size?: number | string
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. TẤT CẢ TRÒ CHƠI: TAY CẦM CHƠI GAME GAMEPAD ARCADE 3D (All Games / Gamepad 3D)
// Đồng bộ 100% phong cách App Icon Squircle Tím Sang Trọng chuẩn hình ảnh
// ─────────────────────────────────────────────────────────────────────────────
export function IconAllGames3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `gamepad${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D sâu thẳm */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Thân tay cầm Neon Cyan & Deep Navy 3D */}
        <linearGradient id={`${id}-pad-body`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
        <linearGradient id={`${id}-pad-bevel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Cụm phím D-pad & Analog */}
        <linearGradient id={`${id}-dpad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Nút bấm Candy A/B/X/Y */}
        <radialGradient id={`${id}-btn-amber`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <radialGradient id={`${id}-btn-rose`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
        <radialGradient id={`${id}-btn-emerald`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>

        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#080218" floodOpacity="0.8" />
        </filter>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── TAY CẦM CHƠI GAME ARCADE 3D ── */}
      <g filter={`url(#${id}-shadow)`}>
        <g transform="translate(10, 16)">
          {/* Đổ bóng tay cầm */}
          <path
            d="M5 12 C5 5 11 3 22 3 C33 3 39 5 39 12 C39 21 37 32 32 32 C28 32 26 23 22 23 C18 23 16 32 12 32 C7 32 5 21 5 12 Z"
            fill="#080218"
            transform="translate(0, 3)"
            opacity="0.8"
          />
          {/* Thân tay cầm 3D vát khối */}
          <path
            d="M5 12 C5 5 11 3 22 3 C33 3 39 5 39 12 C39 21 37 32 32 32 C28 32 26 23 22 23 C18 23 16 32 12 32 C7 32 5 21 5 12 Z"
            fill={`url(#${id}-pad-body)`}
            stroke={`url(#${id}-pad-bevel)`}
            strokeWidth="1.2"
          />
          {/* Vòm bóng gương trên đỉnh tay cầm */}
          <path
            d="M9 10 C10 6 15 5 22 5 C29 5 34 6 35 10 C30 12 14 12 9 10 Z"
            fill="#ffffff"
            opacity="0.5"
          />

          {/* D-PAD CHỮ THẬP (Bên trái) */}
          <g transform="translate(10, 10)">
            <rect x="3" y="0" width="3" height="9" rx="1" fill={`url(#${id}-dpad)`} stroke="#38bdf8" strokeWidth="0.5" />
            <rect x="0" y="3" width="9" height="3" rx="1" fill={`url(#${id}-dpad)`} stroke="#38bdf8" strokeWidth="0.5" />
            <circle cx="4.5" cy="4.5" r="1.2" fill="#0284c7" />
          </g>

          {/* 4 NÚT TRÒN CANDY A/B/X/Y (Bên phải) */}
          <g transform="translate(26, 8)">
            {/* Nút trên (X) */}
            <circle cx="4.5" cy="2" r="2.2" fill={`url(#${id}-btn-amber)`} stroke="#fef08a" strokeWidth="0.5" />
            {/* Nút trái (Y) */}
            <circle cx="1.5" cy="5.5" r="2.2" fill={`url(#${id}-btn-rose)`} stroke="#fecdd3" strokeWidth="0.5" />
            {/* Nút phải (A) */}
            <circle cx="7.5" cy="5.5" r="2.2" fill={`url(#${id}-btn-emerald)`} stroke="#bbf7d0" strokeWidth="0.5" />
            {/* Nút dưới (B) */}
            <circle cx="4.5" cy="9" r="2.2" fill={`url(#${id}-btn-amber)`} stroke="#fef08a" strokeWidth="0.5" />
          </g>

          {/* CẦN ANALOG KÉP (Ở giữa dưới) */}
          <g transform="translate(15, 17)">
            <circle cx="3" cy="3" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
            <circle cx="3" cy="2.5" r="1.8" fill="#38bdf8" />
            <circle cx="11" cy="3" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
            <circle cx="11" cy="2.5" r="1.8" fill="#38bdf8" />
          </g>
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CỜ VUA: QUÂN MÃ GỖ SÁNG & QUÂN XE MUN SẪM 3D (Wooden Knight & Rook 3D)
// Chuẩn thiết kế icon góc trên bên phải trong hình ảnh người dùng cung cấp
// ─────────────────────────────────────────────────────────────────────────────
export function IconCrown3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `chess${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D sâu thẳm */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Gỗ quân Mã sáng màu (White / Honey Knight) */}
        <linearGradient id={`${id}-knight-body`} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef3c7" />
          <stop offset="65%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`${id}-knight-shade`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Gỗ quân Xe sẫm màu (Dark Walnut Rook) */}
        <linearGradient id={`${id}-rook-body`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="35%" stopColor="#713f12" />
          <stop offset="70%" stopColor="#3b1d0b" />
          <stop offset="100%" stopColor="#1c0c04" />
        </linearGradient>
        <linearGradient id={`${id}-rook-top`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Đổ bóng 3D */}
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#0a031d" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng chuẩn hình ảnh ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      {/* Vòm kính phản quang nửa trên */}
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── QUÂN CỜ 3D ── */}
      <g filter={`url(#${id}-shadow)`}>
        {/* 1. QUÂN XE (ROOK) GỖ SẪM Ở PHÍA SAU BÊN PHẢI */}
        <g transform="translate(35, 16)">
          {/* Đổ bóng chân đế Xe */}
          <ellipse cx="14" cy="35" rx="10" ry="3.5" fill="#0c0418" opacity="0.6" />
          {/* Tầng đế dưới */}
          <ellipse cx="14" cy="33" rx="9.5" ry="3.5" fill="#291206" />
          <ellipse cx="14" cy="31" rx="8.5" ry="3" fill="#451a03" stroke="#92400e" strokeWidth="0.6" />
          {/* Tầng đế giữa */}
          <ellipse cx="14" cy="28" rx="7.5" ry="2.5" fill="#5c2406" />
          {/* Thân trụ tháp */}
          <path d="M7 28 C8.5 20 9 14 8 10 L20 10 C19 14 19.5 20 21 28 Z" fill={`url(#${id}-rook-body)`} />
          {/* Đỉnh viền răng cưa tháp canh (Crenellations) */}
          <ellipse cx="14" cy="10" rx="7" ry="2" fill="#78350f" />
          <path
            d="M6 10 L6 4 L8.5 4 L8.5 6.5 L11 6.5 L11 4 L17 4 L17 6.5 L19.5 6.5 L19.5 4 L22 4 L22 10 Z"
            fill={`url(#${id}-rook-top)`}
            stroke="#b45309"
            strokeWidth="0.6"
          />
          {/* Lòng tháp canh lõm */}
          <ellipse cx="14" cy="5" rx="5" ry="1.5" fill="#1c0a00" />
          {/* Ánh sáng phản chiếu thân xe */}
          <path d="M10 12 C10 18 9 24 8.5 27" stroke="#d97706" strokeWidth="0.8" opacity="0.4" strokeLinecap="round" />
        </g>

        {/* 2. QUÂN MÃ (KNIGHT) GỖ SÁNG BÓNG Ở PHÍA TRƯỚC BÊN TRÁI */}
        <g transform="translate(9, 14)">
          {/* Đổ bóng chân đế Mã */}
          <ellipse cx="16" cy="38" rx="12" ry="4" fill="#0c0418" opacity="0.65" />
          {/* Tầng đế dưới */}
          <ellipse cx="16" cy="36" rx="11" ry="3.8" fill="#78350f" />
          <ellipse cx="16" cy="34" rx="10" ry="3.2" fill="#d97706" />
          <ellipse cx="16" cy="31" rx="8.5" ry="2.8" fill="#f59e0b" stroke="#fef3c7" strokeWidth="0.8" />

          {/* Khối thân & đầu ngựa điêu khắc 3D uốn lượn */}
          {/* Lưng & bờm ngựa gợn sóng phía sau */}
          <path
            d="M18 31 C21 28 23 21 21 14 C20 11 18 9 17 6 C20 8 22 12 24 16 C25 21 24 26 21 31 Z"
            fill={`url(#${id}-knight-shade)`}
          />
          {/* Thân và cổ đầu ngựa chính */}
          <path
            d="M12 31 C10 26 10 21 12 17 C13 14 12 12 9 10 C7 9 5 11 6 13 C7 14 6 16 5 17 C3 18 3 20 6 20 C9 20 11 23 11 27 C11 29 11 30 12 31 Z"
            fill={`url(#${id}-knight-shade)`}
            opacity="0.8"
          />
          {/* Mặt diện đầu ngựa nổi khối sáng bóng */}
          <path
            d="M13 31 C11 25 11 19 13 15 C14 13 14 11 12 9 C14 7 17 6 18 9 C19 11 21 14 20 18 C19 23 19 27 18 31 Z"
            fill={`url(#${id}-knight-body)`}
            stroke="#fffbeb"
            strokeWidth="0.6"
          />

          {/* Đầu ngựa & Mõm ngựa cong đẹp */}
          <path
            d="M13 15 C11 14 8 13 7 15 C6 17 7 19 10 19 C12 19 14 18 15 16 Z"
            fill={`url(#${id}-knight-body)`}
          />
          {/* Mắt ngựa chấm khắc */}
          <circle cx="12" cy="13" r="1.2" fill="#451a03" />
          <circle cx="11.7" cy="12.7" r="0.4" fill="#ffffff" />
          {/* Mũi & Lỗ mũi ngựa */}
          <ellipse cx="7.5" cy="16.5" rx="0.8" ry="1.2" fill="#78350f" />
          {/* Tai ngựa vểnh nhọn */}
          <path d="M15 8 L17 3 L19 7 Z" fill="#fef3c7" stroke="#b45309" strokeWidth="0.6" />

          {/* Bờm ngựa khía 3D lượn sóng */}
          <path d="M17 7 C19 9 20 12 19 14" stroke="#fffbeb" strokeWidth="1" strokeLinecap="round" />
          <path d="M19 13 C21 15 22 18 20 21" stroke="#fffbeb" strokeWidth="1" strokeLinecap="round" />
          <path d="M20 20 C22 23 22 26 20 28" stroke="#fffbeb" strokeWidth="1" strokeLinecap="round" />

          {/* Vết sáng bóng gương (Specular Highlight) dọc sống cổ */}
          <path
            d="M14 16 C15 20 15 25 14 29"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CỜ TƯỚNG: QUÂN ĐỎ 帥 & QUÂN ĐEN 將 VA CHẠM NẢY TIA LỬA 3D (Xiangqi Clash 3D)
// Chuẩn thiết kế icon góc trên bên trái trong hình ảnh người dùng cung cấp
// ─────────────────────────────────────────────────────────────────────────────
export function IconXiangqiPiece3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `xq${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Sơn mài đỏ quân Soái (Red General 帥) */}
        <radialGradient id={`${id}-red-wood`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="25%" stopColor="#ef4444" />
          <stop offset="65%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#660e0e" />
        </radialGradient>
        <linearGradient id={`${id}-red-bevel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>

        {/* Gỗ mun đen bóng quân Tướng (Black General 將) */}
        <radialGradient id={`${id}-black-wood`} cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#57534e" />
          <stop offset="35%" stopColor="#292524" />
          <stop offset="75%" stopColor="#1c1917" />
          <stop offset="100%" stopColor="#0c0a09" />
        </radialGradient>
        <linearGradient id={`${id}-black-bevel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78716c" />
          <stop offset="50%" stopColor="#292524" />
          <stop offset="100%" stopColor="#0c0a09" />
        </linearGradient>

        {/* Vệt lửa va chạm (Spark Burst) */}
        <radialGradient id={`${id}-spark-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
        </radialGradient>

        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.85" />
        </filter>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#080218" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      {/* Vòm kính phản quang nửa trên */}
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── HAI QUÂN CỜ VÀ TIA LỬA VA CHẠM ── */}
      <g filter={`url(#${id}-shadow)`}>
        {/* 1. QUÂN ĐỎ (帥) Ở GÓC TRÊN BÊN TRÁI */}
        <g transform="translate(4, 4)">
          {/* Đổ bóng dày */}
          <circle cx="19" cy="22" r="13" fill="#3b0707" opacity="0.75" />
          {/* Thân vát cạnh 3D */}
          <circle cx="19" cy="19.5" r="13" fill={`url(#${id}-red-bevel)`} />
          <circle cx="19" cy="19.5" r="11.2" fill={`url(#${id}-red-wood)`} stroke="#f87171" strokeWidth="0.8" />
          {/* Rãnh tròn khắc trong */}
          <circle cx="19" cy="19.5" r="9.2" stroke="#7f1d1d" strokeWidth="0.7" opacity="0.6" strokeDasharray="1 0.8" />
          {/* Chữ Soái (帥) màu trắng kem nổi khối */}
          <text
            x="19"
            y="24.2"
            fontSize="12.5"
            fontFamily="serif"
            fontWeight="900"
            textAnchor="middle"
            fill="#fffbeb"
            stroke="#991b1b"
            strokeWidth="0.5"
          >
            帥
          </text>
          {/* Ánh sáng gương trên mặt cờ */}
          <path d="M12 14 C15 10 23 10 26 14" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* 2. QUÂN ĐEN (將) Ở GÓC DƯỚI BÊN PHẢI */}
        <g transform="translate(18, 16)">
          {/* Đổ bóng dày */}
          <circle cx="21" cy="23" r="13.5" fill="#0c0a09" opacity="0.8" />
          {/* Thân vát cạnh 3D */}
          <circle cx="21" cy="20.5" r="13.5" fill={`url(#${id}-black-bevel)`} />
          <circle cx="21" cy="20.5" r="11.5" fill={`url(#${id}-black-wood)`} stroke="#78716c" strokeWidth="0.8" />
          {/* Rãnh tròn khắc trong */}
          <circle cx="21" cy="20.5" r="9.5" stroke="#44403c" strokeWidth="0.7" opacity="0.6" strokeDasharray="1 0.8" />
          {/* Chữ Tướng (將) màu vàng gold óng ánh */}
          <text
            x="21"
            y="25.5"
            fontSize="13"
            fontFamily="serif"
            fontWeight="900"
            textAnchor="middle"
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth="0.5"
          >
            將
          </text>
          {/* Ánh sáng gương trên mặt cờ */}
          <path d="M14 15 C17 11 25 11 28 15" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.45" />
        </g>

        {/* 3. TIA LỬA VA CHẠM KỊCH TÍNH Ở TÂM (SPARKS & IMPACT FLASH) */}
        <g filter={`url(#${id}-glow)`} transform="translate(29, 26)">
          {/* Đốm hào quang tâm nổ */}
          <circle cx="2" cy="2" r="7" fill={`url(#${id}-spark-core)`} />
          <circle cx="2" cy="2" r="2.5" fill="#ffffff" />

          {/* Các tia sáng vàng cam xòe ra (Sparks) */}
          {/* Tia dài lên trên */}
          <path d="M2 2 L-2 -10" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 2 L6 -8" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
          {/* Tia sang trái */}
          <path d="M2 2 L-10 -1" stroke="#fef08a" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2 2 L-9 7" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
          {/* Tia xuống dưới */}
          <path d="M2 2 L1 11" stroke="#fef08a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 2 L-5 10" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" />
          {/* Tia sang phải */}
          <path d="M2 2 L11 1" stroke="#fef08a" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M2 2 L12 -6" stroke="#ea580c" strokeWidth="1.1" strokeLinecap="round" />

          {/* Các đốm lửa nhỏ bay quanh */}
          <circle cx="-5" cy="-7" r="1" fill="#fff" />
          <circle cx="8" cy="-5" r="0.8" fill="#fef08a" />
          <circle cx="-7" cy="5" r="0.8" fill="#fef08a" />
          <circle cx="9" cy="8" r="1.1" fill="#f59e0b" />
          <circle cx="3" cy="13" r="0.7" fill="#fff" />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CỜ CARO: HAI QUÂN CỜ X CYAN & O RUBY 3D ĐỐI ĐẦU (Caro Duel 3D)
// Đồng bộ phong cách App Icon Squircle Tím Sang Trọng
// ─────────────────────────────────────────────────────────────────────────────
export function IconCaroCubes3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `caro${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Khối cờ X Cyan 3D */}
        <linearGradient id={`${id}-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="85%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#034d75" />
        </linearGradient>

        {/* Khối cờ O Ruby 3D */}
        <linearGradient id={`${id}-ruby`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="40%" stopColor="#f43f5e" />
          <stop offset="85%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#710a24" />
        </linearGradient>

        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#080218" floodOpacity="0.8" />
        </filter>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── KHỐI QUÂN X VÀ O 3D ── */}
      <g filter={`url(#${id}-shadow)`}>
        {/* Quân X Cyan nổi khối ở góc trái */}
        <g transform="translate(8, 14)">
          {/* Đổ bóng dày */}
          <path
            d="M5 21L12 14L5 7L9 3L16 10L23 3L27 7L20 14L27 21L23 25L16 18L9 25Z"
            fill="#082f49"
            transform="translate(0, 3)"
            opacity="0.8"
          />
          {/* Thân X Cyan 3D */}
          <path
            d="M5 21L12 14L5 7L9 3L16 10L23 3L27 7L20 14L27 21L23 25L16 18L9 25Z"
            fill={`url(#${id}-cyan)`}
            stroke="#e0f2fe"
            strokeWidth="1"
          />
          {/* Vết sáng gương trên X */}
          <path d="M8 6L16 14L24 6" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
        </g>

        {/* Quân O Ruby Torus 3D ở góc phải */}
        <g transform="translate(26, 21)">
          {/* Đổ bóng dày */}
          <ellipse cx="14" cy="17" rx="13" ry="11" fill="#4c0519" opacity="0.8" />
          {/* Vòng ngoài O */}
          <ellipse cx="14" cy="14" rx="13" ry="11" fill={`url(#${id}-ruby)`} stroke="#ffe4e6" strokeWidth="1" />
          {/* Lỗ rỗng trong O */}
          <ellipse cx="14" cy="14" rx="6.5" ry="5.5" fill="#1b0946" stroke="#be123c" strokeWidth="1" />
          {/* Vết sáng gương trên O */}
          <path d="M7 10 C10 6 18 6 21 10" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
        </g>

        {/* Ngôi sao lấp lánh ở điểm giao giữa X và O */}
        <path
          d="M32 18 L33.5 22 L37.5 23.5 L33.5 25 L32 29 L30.5 25 L26.5 23.5 L30.5 22 Z"
          fill="#ffffff"
          filter={`url(#${id}-glow)`}
        />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRÍ NHỚ: LƯỚI 4 Ô THẺ BÀI LẬT MỞ CANDY 3D (Memory Cards 2x2 Grid 3D)
// Chuẩn thiết kế icon góc dưới bên trái trong hình ảnh người dùng cung cấp
// ─────────────────────────────────────────────────────────────────────────────
export function IconManaCrystal3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `mem${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Thẻ Candy xanh dương (Blue Card ?) */}
        <linearGradient id={`${id}-blue-card`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="35%" stopColor="#60a5fa" />
          <stop offset="75%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        {/* Thẻ Candy vàng cam ngôi sao (Gold Star Card ★) */}
        <linearGradient id={`${id}-gold-card`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#fcd34d" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <filter id={`${id}-card-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="1.5" floodColor="#0c0418" floodOpacity="0.75" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── LƯỚI 4 Ô THẺ BÀI 2x2 CANDY 3D ── */}
      <g filter={`url(#${id}-card-shadow)`}>
        {/* 1. Ô TRÊN TRÁI (XANH - ?) */}
        <g transform="translate(10, 10)">
          {/* Đổ bóng đáy thẻ */}
          <rect x="0" y="2.5" width="20" height="20" rx="5" fill="#1e3a8a" opacity="0.8" />
          {/* Khối thẻ bo tròn mềm mại */}
          <rect x="0" y="0" width="20" height="20" rx="5" fill={`url(#${id}-blue-card)`} stroke="#bfdbfe" strokeWidth="0.9" />
          {/* Vòm sáng bóng trên thẻ */}
          <path d="M1.5 5.5 C1.5 3 3 1.5 6 1.5 L14 1.5 C17 1.5 18.5 3 18.5 5.5 C15 7.5 5 7.5 1.5 5.5 Z" fill="#ffffff" opacity="0.45" />
          {/* Dấu chấm hỏi trắng to tròn "?" */}
          <text x="10" y="15" fontSize="14" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#ffffff">
            ?
          </text>
        </g>

        {/* 2. Ô TRÊN PHẢI (XANH - ?) */}
        <g transform="translate(34, 10)">
          <rect x="0" y="2.5" width="20" height="20" rx="5" fill="#1e3a8a" opacity="0.8" />
          <rect x="0" y="0" width="20" height="20" rx="5" fill={`url(#${id}-blue-card)`} stroke="#bfdbfe" strokeWidth="0.9" />
          <path d="M1.5 5.5 C1.5 3 3 1.5 6 1.5 L14 1.5 C17 1.5 18.5 3 18.5 5.5 C15 7.5 5 7.5 1.5 5.5 Z" fill="#ffffff" opacity="0.45" />
          <text x="10" y="15" fontSize="14" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#ffffff">
            ?
          </text>
        </g>

        {/* 3. Ô DƯỚI TRÁI (XANH - ?) */}
        <g transform="translate(10, 34)">
          <rect x="0" y="2.5" width="20" height="20" rx="5" fill="#1e3a8a" opacity="0.8" />
          <rect x="0" y="0" width="20" height="20" rx="5" fill={`url(#${id}-blue-card)`} stroke="#bfdbfe" strokeWidth="0.9" />
          <path d="M1.5 5.5 C1.5 3 3 1.5 6 1.5 L14 1.5 C17 1.5 18.5 3 18.5 5.5 C15 7.5 5 7.5 1.5 5.5 Z" fill="#ffffff" opacity="0.45" />
          <text x="10" y="15" fontSize="14" fontFamily="sans-serif" fontWeight="900" textAnchor="middle" fill="#ffffff">
            ?
          </text>
        </g>

        {/* 4. Ô DƯỚI PHẢI (VÀNG CAM - NGÔI SAO ★ LẬT MỞ THÀNH CÔNG) */}
        <g transform="translate(34, 34)">
          {/* Đổ bóng đáy thẻ vàng */}
          <rect x="0" y="2.5" width="20" height="20" rx="5" fill="#78350f" opacity="0.8" />
          {/* Khối thẻ vàng cam rực rỡ */}
          <rect x="0" y="0" width="20" height="20" rx="5" fill={`url(#${id}-gold-card)`} stroke="#fef08a" strokeWidth="0.9" />
          {/* Vòm sáng bóng trên thẻ */}
          <path d="M1.5 5.5 C1.5 3 3 1.5 6 1.5 L14 1.5 C17 1.5 18.5 3 18.5 5.5 C15 7.5 5 7.5 1.5 5.5 Z" fill="#ffffff" opacity="0.45" />
          {/* Ngôi sao 5 cánh màu cam sẫm ★ */}
          <polygon
            points="10,4.5 11.8,8.2 15.8,8.8 12.9,11.6 13.6,15.5 10,13.6 6.4,15.5 7.1,11.6 4.2,8.8 8.2,8.2"
            fill="#c2410c"
            stroke="#9a3412"
            strokeWidth="0.4"
          />
        </g>
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RẮN SĂN MỒI: RẮN XANH PIXEL ART & TÁO ĐỎ PIXEL (Pixel Snake & Apple 3D)
// Chuẩn thiết kế icon góc dưới bên phải trong hình ảnh người dùng cung cấp
// ─────────────────────────────────────────────────────────────────────────────
export function IconSnakeApple3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `snake${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#080218" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── RẮN XANH VÀ QUẢ TÁO ĐỎ PIXEL ART ── */}
      <g filter={`url(#${id}-shadow)`}>
        {/* 1. QUẢ TÁO ĐỎ PIXEL ART (Góc dưới bên trái) */}
        <g transform="translate(14, 34)">
          {/* Đổ bóng quả táo */}
          <rect x="0" y="8" width="10" height="3" fill="#0c0418" opacity="0.6" />
          {/* Thân táo pixel đỏ (6x6 px lưới) */}
          {/* Cuống táo nâu */}
          <rect x="4" y="-2" width="2" height="2" fill="#78350f" />
          {/* Thân táo */}
          <rect x="2" y="0" width="6" height="8" fill="#ef4444" />
          <rect x="0" y="2" width="10" height="5" fill="#ef4444" />
          <rect x="1" y="1" width="8" height="7" fill="#dc2626" />
          {/* Bóng đổ sẫm cạnh dưới */}
          <rect x="1" y="6" width="8" height="2" fill="#991b1b" />
          {/* Điểm sáng pixel trắng trên táo */}
          <rect x="2" y="2" width="2" height="2" fill="#fecaca" />
          <rect x="3" y="3" width="1" height="1" fill="#ffffff" />
        </g>

        {/* 2. CHÚ RẮN XANH LÁ CÂY PIXEL ART (Uốn lượn S-shape) */}
        <g transform="translate(20, 14)">
          {/* Lưỡi rắn đỏ thè ra hướng về quả táo */}
          <rect x="-3" y="10" width="3" height="1.8" fill="#ef4444" />
          <rect x="-4.5" y="10" width="1.8" height="3.2" fill="#ef4444" />

          {/* ĐẦU RẮN PIXEL (x: 0..16, y: 0..14) */}
          {/* Viền viền đầu rắn màu xanh lục đậm */}
          <rect x="4" y="0" width="12" height="14" fill="#15803d" />
          <rect x="2" y="2" width="16" height="11" fill="#15803d" />
          {/* Ruột đầu rắn màu xanh tươi */}
          <rect x="3" y="2" width="14" height="10" fill="#4ade80" />
          <rect x="5" y="1" width="10" height="11" fill="#22c55e" />

          {/* Mắt rắn pixel to ngây thơ */}
          <rect x="6" y="4" width="3.5" height="3.5" fill="#0f172a" />
          <rect x="6.5" y="4.5" width="1.5" height="1.5" fill="#ffffff" />

          {/* CỔ VÀ THÂN RẮN UỐN LƯỢN (Uốn sang phải rồi xuống dưới) */}
          {/* Khối thân 1: Cổ uốn sang phải */}
          <rect x="12" y="8" width="6" height="9" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          {/* Khối thân 2: Xuống dưới */}
          <rect x="13" y="15" width="6" height="10" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          {/* Khối thân 3: Uốn sang trái làm bụng */}
          <rect x="7" y="21" width="10" height="6" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          {/* Khối thân 4: Uốn lượn sang phải */}
          <rect x="14" y="24" width="11" height="6" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
          {/* Đuôi rắn vểnh lên */}
          <rect x="22" y="21" width="5" height="6" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />

          {/* VIỀN BỤNG MÀU VÀNG CHANH PIXEL NHẠT (Đặc trưng chú rắn trong hình) */}
          <rect x="7" y="25" width="7" height="2" fill="#fde047" />
          <rect x="14" y="27" width="9" height="2" fill="#fde047" />
          <rect x="24" y="23" width="2" height="4" fill="#fde047" />

          {/* Đốm vảy xanh lục đậm pixel trên lưng */}
          <rect x="9" y="1" width="3" height="1.5" fill="#16a34a" />
          <rect x="15" y="9" width="2" height="2" fill="#16a34a" />
          <rect x="16" y="17" width="2" height="3" fill="#16a34a" />
          <rect x="17" y="25" width="3" height="2" fill="#16a34a" />
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

// ─────────────────────────────────────────────────────────────────────────────
// 8. HỌC TẬP: MŨ CỬ NHÂN & CUỐN SÁCH TRI THỨC 3D (Study Cap & Wisdom Book 3D)
// Đồng bộ 100% phong cách App Icon Squircle Tím Sang Trọng
// ─────────────────────────────────────────────────────────────────────────────
export function IconStudy3D({ className, size = 32, ...props }: Icon3DProps) {
  const id = `study${useId().replace(/[^a-zA-Z0-9]/g, '')}`
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
        {/* Khung squircle tím 3D */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c146d" />
          <stop offset="50%" stopColor="#210d57" />
          <stop offset="100%" stopColor="#140638" />
        </linearGradient>
        <linearGradient id={`${id}-border`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        {/* Mũ cử nhân Sapphire & Navy 3D */}
        <linearGradient id={`${id}-cap-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="40%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={`${id}-cap-base`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>

        {/* Tua rua vàng kim óng ánh */}
        <linearGradient id={`${id}-tassel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Cuốn sách tri thức mở vàng gold & hổ phách */}
        <linearGradient id={`${id}-book-pages`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <linearGradient id={`${id}-book-cover`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="2.5" floodColor="#080218" floodOpacity="0.8" />
        </filter>
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* ── Khung Squircle Tím Sang Trọng ── */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${id}-bg)`} stroke={`url(#${id}-border)`} strokeWidth="2.5" />
      <rect x="4.5" y="4.5" width="55" height="55" rx="13.5" stroke="#1b0846" strokeWidth="1.5" />
      <path d="M5 20 C5 10 10 5 20 5 L44 5 C54 5 59 10 59 20 C59 28 50 34 32 34 C14 34 5 28 5 20 Z" fill={`url(#${id}-gloss)`} />

      {/* ── MŨ CỬ NHÂN & CUỐN SÁCH TRI THỨC 3D ── */}
      <g filter={`url(#${id}-shadow)`}>
        {/* 1. Cuốn sách mở ở phía dưới */}
        <g transform="translate(10, 32)">
          {/* Bìa sách dưới */}
          <path
            d="M2 13 C12 8 20 12 22 13 C24 12 32 8 42 13 L40 18 C30 13 24 16 22 17 C20 16 14 13 4 18 Z"
            fill={`url(#${id}-book-cover)`}
          />
          {/* Trang sách phát sáng uốn lượn */}
          <path
            d="M3 11 C13 6 20 10 22 11 C24 10 31 6 41 11 L40 15 C30 10 24 13 22 14 C20 13 14 10 4 15 Z"
            fill={`url(#${id}-book-pages)`}
            stroke="#fef08a"
            strokeWidth="0.6"
          />
          {/* Gáy sách trung tâm */}
          <line x1="22" y1="11" x2="22" y2="17" stroke="#b45309" strokeWidth="1" />
        </g>

        {/* 2. Mũ cử nhân 3D ở phía trên */}
        <g transform="translate(10, 11)">
          {/* Thân chóp tròn mũ */}
          <path
            d="M13 14 C13 18 17 21 22 21 C27 21 31 18 31 14 Z"
            fill={`url(#${id}-cap-base)`}
            stroke="#0284c7"
            strokeWidth="0.8"
          />
          {/* Vành phẳng hình thoi vát 3D (Mortarboard rhombus) */}
          <polygon
            points="22,3 42,10 22,17 2,10"
            fill={`url(#${id}-cap-top)`}
            stroke="#38bdf8"
            strokeWidth="1.2"
          />
          {/* Ánh sáng gương trên mặt phẳng mũ */}
          <path d="M7 10 L22 5 L37 10" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

          {/* Nút đính trung tâm */}
          <circle cx="22" cy="10" r="2.2" fill={`url(#${id}-tassel)`} stroke="#fef08a" strokeWidth="0.5" />

          {/* Dải dây tua rua vàng kim (Golden Tassel) uốn lượn */}
          <path
            d="M22 10 Q28 12 30 16 Q32 19 33 24"
            stroke={`url(#${id}-tassel)`}
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
          {/* Chùm quả chuông tua rua ở đuôi dây */}
          <rect x="31" y="24" width="4" height="6" rx="1.5" fill={`url(#${id}-tassel)`} stroke="#fef08a" strokeWidth="0.5" />
          <line x1="31.5" y1="30" x2="31.5" y2="33" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="33" y1="30" x2="33" y2="33.5" stroke="#fef08a" strokeWidth="0.8" />
          <line x1="34.5" y1="30" x2="34.5" y2="33" stroke="#f59e0b" strokeWidth="0.8" />
        </g>

        {/* 3. Ngôi sao tri thức lấp lánh bay lên */}
        <polygon
          points="13,8 14.2,11 17,11.5 14.8,13.5 15.5,16.5 13,15 10.5,16.5 11.2,13.5 9,11.5 11.8,11"
          fill="#fef08a"
          filter={`url(#${id}-glow)`}
        />
        <circle cx="50" cy="22" r="1.5" fill="#fef08a" filter={`url(#${id}-glow)`} />
      </g>
    </svg>
  )
}
