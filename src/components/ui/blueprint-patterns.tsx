import { cn } from '@/lib/utils'

interface BlueprintPatternProps {
  className?: string
  color?: string
}

/**
 * 1. Blueprint Arcade Schematic (Đấu trường Game)
 * Phân bổ cân đối: D-pad, Pacman ghost, bàn cờ, Tetris, Joystick, Quả táo, Sao 8-bit.
 */
export function BlueprintArcadePattern({
  className,
  color = 'rgba(56, 189, 248, 0.12)',
}: BlueprintPatternProps) {
  return (
    <svg
      viewBox="0 0 530 700"
      preserveAspectRatio="none"
      className={cn('pointer-events-none select-none overflow-hidden absolute inset-0 w-full h-full', className)}
      fill="none"
    >
      <g stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
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
          <path d="M78 62 H120 V85 H160" />
          <circle cx="160" cy="85" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Góc dưới bên phải: Ngôi sao vinh quang 8-bit & Mạch điện */}
        <g transform="translate(430, 570)">
          <path d="M70 70 H30 M70 70 V30" />
          <g transform="translate(18, 20)">
            <path d="M12 0 L15 8 L24 9 L17 15 L19 24 L12 19 L5 24 L7 15 L0 9 L9 8 Z" />
          </g>
          <path d="M-20 60 H15 V40" />
          <circle cx="-20" cy="60" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>
      </g>
    </svg>
  )
}

/**
 * 2. Blueprint Study Schematic (Trục Học tập & Phòng học)
 * Phân bổ cân đối: Sách mở, Compa, Thước eke, Kính hiển vi, Mũ cử nhân, Bút ngòi, Đồng hồ Pomodoro wireframe.
 */
export function BlueprintStudyPattern({
  className,
  color = 'rgba(56, 189, 248, 0.12)',
}: BlueprintPatternProps) {
  return (
    <svg
      viewBox="0 0 530 700"
      preserveAspectRatio="none"
      className={cn('pointer-events-none select-none overflow-hidden absolute inset-0 w-full h-full', className)}
      fill="none"
    >
      <g stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Góc trên bên trái: Thước đo kỹ thuật & Tọa độ học tập */}
        <path d="M16 36 H48 M16 36 V68" />
        <path d="M24 24 H34 M29 19 V29" />
        <path d="M60 28 H110 V42 H140" />
        <circle cx="140" cy="42" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        <circle cx="60" cy="28" r="1.5" fill="rgba(56, 189, 248, 0.2)" />

        {/* Góc trên bên phải: Mũ cử nhân & Sách mở wireframe */}
        <g transform="translate(300, 10)">
          {/* Mũ tốt nghiệp wireframe */}
          <g transform="translate(140, 15)">
            <polygon points="35,5 70,20 35,35 0,20" />
            <path d="M15,26.5 V42 C15,42 25,50 35,50 C45,50 55,42 55,42 V26.5" />
            <path d="M70,20 V45" />
            <circle cx="70" cy="47" r="2" fill="rgba(56, 189, 248, 0.2)" />
          </g>

          {/* Quyển sách mở wireframe */}
          <g transform="translate(120, 85)">
            <path d="M5 25 Q25 15 45 25 Q65 15 85 25 V55 Q65 45 45 55 Q25 45 5 55 Z" />
            <line x1="45" y1="25" x2="45" y2="55" />
            <path d="M15 32 Q27 27 38 32" />
            <path d="M15 40 Q27 35 38 40" />
            <path d="M52 32 Q63 27 75 32" />
            <path d="M52 40 Q63 35 75 40" />
          </g>
        </g>

        {/* Cạnh bên trái (giữa): Compa & Mạch tri thức */}
        <g transform="translate(16, 270)">
          {/* Compa kỹ thuật wireframe */}
          <path d="M15 10 L30 55 M15 10 L0 55" />
          <circle cx="15" cy="10" r="4" />
          <path d="M5 38 H25" />
          {/* Mạch điện */}
          <path d="M30 55 H50 V75 H70" />
          <circle cx="70" cy="75" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Cạnh bên phải (giữa): Thước E-ke tam giác wireframe */}
        <g transform="translate(480, 275)">
          <polygon points="30,10 0,60 30,60" />
          <polygon points="25,25 12,52 25,52" />
          <line x1="28" y1="35" x2="30" y2="35" />
          <line x1="26" y1="42" x2="30" y2="42" />
          <line x1="28" y1="49" x2="30" y2="49" />
        </g>

        {/* Góc dưới bên trái: Kính hiển vi wireframe */}
        <g transform="translate(20, 560)">
          <path d="M0 80 H40 M0 80 V40" />
          {/* Kính hiển vi */}
          <g transform="translate(25, 20)">
            <rect x="18" y="5" width="8" height="22" transform="rotate(-25 22 16)" />
            <path d="M16 26 C10 32 10 44 18 48 H28" />
            <line x1="12" y1="42" x2="28" y2="42" />
            <rect x="8" y="54" width="30" height="6" rx="2" />
            <line x1="23" y1="48" x2="23" y2="54" />
          </g>
          <path d="M75 75 H120 V50 H150" />
          <circle cx="150" cy="50" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Góc dưới bên phải: Đồng hồ Pomodoro wireframe */}
        <g transform="translate(440, 570)">
          <path d="M60 70 H25 M60 70 V35" />
          {/* Đồng hồ cát / Pomodoro */}
          <g transform="translate(10, 25)">
            <circle cx="20" cy="20" r="16" />
            <line x1="20" y1="20" x2="20" y2="10" />
            <line x1="20" y1="20" x2="28" y2="20" />
            <circle cx="20" cy="20" r="2" fill="rgba(56, 189, 248, 0.3)" />
          </g>
          <path d="M-15 65 H10 V45" />
          <circle cx="-15" cy="65" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>
      </g>
    </svg>
  )
}

/**
 * 3. Blueprint Community Schematic (Trục Cộng đồng, Hồ sơ & Bạn bè)
 * Phân bổ cân đối: Mạng lưới kết nối, Biểu tượng chat, Huy hiệu sao, Vòng tròn bạn bè, Trái tim wireframe.
 */
export function BlueprintCommunityPattern({
  className,
  color = 'rgba(56, 189, 248, 0.12)',
}: BlueprintPatternProps) {
  return (
    <svg
      viewBox="0 0 530 700"
      preserveAspectRatio="none"
      className={cn('pointer-events-none select-none overflow-hidden absolute inset-0 w-full h-full', className)}
      fill="none"
    >
      <g stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
        {/* Góc trên bên trái: Tọa độ kỹ thuật */}
        <path d="M16 36 H48 M16 36 V68" />
        <path d="M24 24 H34 M29 19 V29" />
        <path d="M60 28 H110 V42 H140" />
        <circle cx="140" cy="42" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        <circle cx="60" cy="28" r="1.5" fill="rgba(56, 189, 248, 0.2)" />

        {/* Góc trên bên phải: Mạng lưới người dùng & Hộp thoại chat wireframe */}
        <g transform="translate(320, 10)">
          {/* Hộp thoại chat kép */}
          <g transform="translate(100, 15)">
            <rect x="0" y="0" width="45" height="30" rx="5" />
            <path d="M12 30 L8 38 L22 30" />
            <line x1="10" y1="10" x2="35" y2="10" />
            <line x1="10" y1="18" x2="28" y2="18" />
          </g>

          {/* Node kết nối xã hội */}
          <g transform="translate(130, 80)">
            <circle cx="20" cy="15" r="8" />
            <circle cx="55" cy="5" r="5" />
            <circle cx="45" cy="40" r="6" />
            <line x1="28" y1="15" x2="50" y2="5" />
            <line x1="25" y1="21" x2="40" y2="35" />
            <line x1="53" y1="10" x2="46" y2="34" />
          </g>
        </g>

        {/* Cạnh bên trái (giữa): Biểu tượng Avatar wireframe */}
        <g transform="translate(16, 280)">
          <circle cx="18" cy="15" r="8" />
          <path d="M5 38 C5 28 31 28 31 38" />
          <path d="M31 30 H55 V50 H75" />
          <circle cx="75" cy="50" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Cạnh bên phải (giữa): Trái tim wireframe */}
        <g transform="translate(485, 285)">
          <path d="M15 28 C5 18 0 10 10 5 C15 2 20 6 22 9 C24 6 29 2 34 5 C44 10 39 18 29 28 L22 35 Z" />
        </g>

        {/* Góc dưới bên trái: Huy hiệu thành tựu ruy băng */}
        <g transform="translate(20, 560)">
          <path d="M0 80 H40 M0 80 V40" />
          <g transform="translate(25, 20)">
            <circle cx="20" cy="20" r="14" />
            <polygon points="20,10 23,17 30,17 24,22 26,29 20,24 14,29 16,22 10,17 17,17" />
            <path d="M13 32 L8 50 L20 44 L32 50 L27 32" />
          </g>
          <path d="M70 70 H120 V90 H150" />
          <circle cx="150" cy="90" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>

        {/* Góc dưới bên phải: Ngôi sao vinh danh & Thước đo kỹ thuật */}
        <g transform="translate(435, 570)">
          <path d="M65 70 H30 M65 70 V35" />
          <g transform="translate(20, 20)">
            <polygon points="18,0 23,12 36,13 26,22 29,35 18,28 7,35 10,22 0,13 13,12" />
          </g>
          <path d="M-15 65 H15 V45" />
          <circle cx="-15" cy="65" r="1.5" fill="rgba(56, 189, 248, 0.2)" />
        </g>
      </g>
    </svg>
  )
}

/**
 * 4. Blueprint Global Ambient Background (Họa tiết nền mờ toàn diện cho toàn trang web)
 * Phân bổ cân đối, hài hòa khắp toàn bộ không gian:
 * - Lưới chấm kỹ thuật (Dot matrix blueprint grid 36x36)
 * - Vệt sáng nền nhẹ đa chiều (Cyan/Purple/Emerald ambient glows)
 * - Mạch điện và biểu tượng kỹ thuật đầy đủ ở 4 góc và 2 bên sườn
 * - Hoàn toàn không cản trở tương tác (pointer-events-none, z-0)
 */
export function BlueprintGlobalBackground({
  className,
  color = 'rgba(56, 189, 248, 0.10)',
}: BlueprintPatternProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed inset-0 pointer-events-none select-none z-0 overflow-hidden',
        className,
      )}
    >
      {/* 1. Dải sáng ambient cyber đa sắc nhẹ nhàng */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[650px] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.11),transparent_70%)]" />
      <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(168,85,247,0.06),transparent_70%)]" />
      <div className="absolute bottom-10 left-1/4 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(16,185,129,0.05),transparent_70%)]" />
      <div className="absolute top-2/3 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(56,189,248,0.05),transparent_70%)]" />

      {/* 2. SVG Ma trận Blueprint kỹ thuật */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern id="grid-global-blueprint-dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="rgba(56, 189, 248, 0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-global-blueprint-dots)" />

        <g stroke={color} strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          {/* ── Khu vực cột lề trái & nền Sidebar (x: 20..260) ── */}
          {/* 1. Đỉnh cột trái: Để trống sạch sẽ, không tạo hình vẽ cắt ngang đỉnh sidebar */}

          {/* 2. Giữa cột trái (x: 20..220, y: 380): Mạch vi xử lý & Bàn cờ nhỏ wireframe */}
          <g transform="translate(24, 380)">
            <path d="M10 0 V160 H70 V220 H140" />
            <circle cx="140" cy="220" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <path d="M10 80 H60 V110 H120" />
            <circle cx="120" cy="110" r="2" fill="rgba(56, 189, 248, 0.15)" />
            {/* Bàn cờ nhỏ wireframe */}
            <g transform="translate(45, 40)">
              <line x1="8" y1="0" x2="8" y2="24" />
              <line x1="16" y1="0" x2="16" y2="24" />
              <line x1="0" y1="8" x2="24" y2="8" />
              <line x1="0" y1="16" x2="24" y2="16" />
              <circle cx="20" cy="12" r="2" />
            </g>
          </g>

          {/* 3. Đáy cột trái (x: 20..220, y: 780): Cần gạt Arcade Joystick & Mạch bus */}
          <g transform="translate(24, 780)">
            <path d="M0 120 H90 M0 120 V40" />
            <path d="M20 100 H120 V60 H200" />
            <circle cx="20" cy="100" r="2" fill="rgba(56, 189, 248, 0.15)" />
            <circle cx="200" cy="60" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            {/* Joystick wireframe */}
            <g transform="translate(35, 20)">
              <ellipse cx="18" cy="44" rx="18" ry="7" />
              <line x1="18" y1="44" x2="18" y2="16" />
              <circle cx="18" cy="10" r="8" />
            </g>
          </g>

          {/* ── Khu vực thanh trên & lề trái sảnh chính (ngay cạnh Sidebar 256px) ── */}
          <g transform="translate(280, 24)">
            <path d="M0 48 H120 M0 48 V160" />
            <path d="M24 24 H56 M40 8 V40" />
            <path d="M120 32 H280 V64 H420" />
            <circle cx="120" cy="32" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <circle cx="420" cy="64" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <text x="24" y="68" fill="rgba(56, 189, 248, 0.22)" fontSize="10" fontFamily="monospace" letterSpacing="1.5">
              SYS.BLUEPRINT // DIGITAL_CAMPUS
            </text>
          </g>

          {/* ── Góc trên phải: Mạch học thuật SGK & Compa wireframe ── */}
          <g transform="translate(1560, 24)">
            <path d="M280 48 H160 M280 48 V160" />
            <path d="M60 32 H170 V70 H250" />
            <circle cx="60" cy="32" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <circle cx="250" cy="70" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            {/* Compa & Thước */}
            <g transform="translate(85, 55)">
              <line x1="24" y1="6" x2="6" y2="52" />
              <line x1="24" y1="6" x2="42" y2="52" />
              <circle cx="24" cy="6" r="3.5" />
              <path d="M12 30 A18 18 0 0 1 36 30" strokeDasharray="3,3" />
            </g>
          </g>

          {/* ── Cạnh phải: Khung định danh kỹ thuật ── */}
          <g transform="translate(1760, 410)">
            <path d="M80 0 V160 H20 V220 H-20" />
            <circle cx="-20" cy="220" r="2" fill="rgba(56, 189, 248, 0.15)" />
          </g>

          {/* ── Góc dưới trái lề sảnh: Joystick Arcade & Mạch bus nối ── */}
          <g transform="translate(280, 860)">
            <path d="M0 130 H110 M0 130 V45" />
            <path d="M120 120 H240 V80 H360" />
            <circle cx="120" cy="120" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <circle cx="360" cy="80" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
          </g>

          {/* ── Góc dưới phải: Tinh cầu mạng lưới & Ngôi sao vinh danh ── */}
          <g transform="translate(1540, 860)">
            <path d="M280 130 H170 M280 130 V45" />
            <path d="M70 110 H180 V135 H270" />
            <circle cx="70" cy="110" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            <circle cx="270" cy="135" r="2.5" fill="rgba(56, 189, 248, 0.15)" />
            {/* Ruy băng Ngôi sao Vinh danh */}
            <g transform="translate(110, 32)">
              <circle cx="28" cy="28" r="20" />
              <polygon points="28,14 32,24 42,24 34,31 37,41 28,34 19,41 22,31 14,24 24,24" />
              <path d="M17 45 L10 72 L28 63 L46 72 L39 45" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
