import { useId, type ReactNode } from 'react'
import type { GameType } from '@shared/protocol/game'
import { cn } from '@/lib/utils'
import { mauNhanTroChoi } from './mau-tro-choi'

// Bảng màu thiết kế Digital Campus — tương phản cao trên nền đen sảnh game.
const MAU = {
  nen: '#020617',
  luoi: '#1e293b',
  quanX: '#06b6d4',
  quanO: '#e879f9',
  thang: '#fbbf24',
} as const


interface GameArtProps {
  gameType: GameType
  /**
   * `cover`: ảnh bìa 16:9 cho thẻ trò chơi. `icon`: biểu tượng vuông giản lược cho kích thước nhỏ (≤ 56px).
   * `glyph`: chỉ riêng biểu tượng trên nền trong suốt — không ô nền, không hào quang (khung trống hoạt hình).
   */
  variant?: 'cover' | 'icon' | 'glyph'
  className?: string
  /** Nhãn cho trình đọc màn hình; bỏ trống khi ảnh chỉ để trang trí cạnh tiêu đề đã có tên trò chơi. */
  label?: string
}

export function GameArt({ gameType, variant = 'cover', className, label }: GameArtProps) {
  const id = `ga${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const laGlyph = variant === 'glyph'
  const laIcon = variant === 'icon' || laGlyph
  const w = laIcon ? 48 : 320
  const h = laIcon ? 48 : 180
  const nhan = mauNhanTroChoi(gameType)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={cn('block h-full w-full', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <radialGradient id={`${id}-hao-quang`} cx="50%" cy={laIcon ? '50%' : '46%'} r={laIcon ? '75%' : '62%'}>
          <stop offset="0%" stopColor={nhan} stopOpacity={laIcon ? 0.34 : 0.3} />
          <stop offset="55%" stopColor={nhan} stopOpacity="0.07" />
          <stop offset="100%" stopColor={nhan} stopOpacity="0" />
        </radialGradient>
        {!laIcon && (
          <pattern id={`${id}-cham`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.9" fill="#ffffff" fillOpacity="0.05" />
          </pattern>
        )}
      </defs>
      {!laGlyph && <rect width={w} height={h} fill={MAU.nen} />}
      {!laIcon && <rect width={w} height={h} fill={`url(#${id}-cham)`} />}
      {!laGlyph && <rect width={w} height={h} fill={`url(#${id}-hao-quang)`} />}
      {laIcon ? BIEU_TUONG[gameType]?.(id) : ANH_BIA[gameType]?.(id)}
    </svg>
  )
}

type O = readonly [number, number]

// ═════════════════════════════════════════════════════════════════════════════
// Ảnh bìa 320×180
// ═════════════════════════════════════════════════════════════════════════════

const W = 320
const H = 180

const ANH_BIA: Record<GameType, (id: string) => ReactNode> = {
  chess: (id) => <BanCoVua id={id} />,
  xiangqi: (id) => <BanCoTuong id={id} />,
  caro_15: () => (
    <BanCaro soO={15} o={16} xoay={-8} quanX={CARO15_X} quanO={CARO15_O} duongThang={[[4, 10], [8, 6]]} goiY={null} />
  ),
  solo_memory: () => <BanTriNho />,
  solo_snake: () => <BanRan />,
}

// ── Cờ Vua ────────────────────────────────────────────────────────────────────

function BanCoVua({ id }: { id: string }) {
  const o = 18
  const kichThuoc = 8 * o
  const goc = -kichThuoc / 2

  return (
    <g transform={`translate(${W / 2} ${H / 2}) rotate(-5)`}>
      <defs>
        <linearGradient id={`${id}-wood-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <linearGradient id={`${id}-wood-dark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      {/* Khung gỗ viền ngoài */}
      <rect x={goc - 8} y={goc - 8} width={kichThuoc + 16} height={kichThuoc + 16} rx="12" fill="#451a03" stroke="#b45309" strokeWidth="2" />
      {/* Các ô cờ */}
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          const isLight = (r + c) % 2 === 0
          return (
            <rect
              key={`${r}-${c}`}
              x={goc + c * o}
              y={goc + r * o}
              width={o}
              height={o}
              fill={isLight ? `url(#${id}-wood-light)` : `url(#${id}-wood-dark)`}
            />
          )
        }),
      )}
      {/* Vua trắng tại e1 */}
      <text x={goc + 4.5 * o} y={goc + 7.5 * o + 5} fontSize="14" textAnchor="middle" fill="#ffffff" stroke="#78350f" strokeWidth="0.5">
        ♔
      </text>
      {/* Hậu đen tại d8 */}
      <text x={goc + 3.5 * o} y={goc + 0.5 * o + 5} fontSize="14" textAnchor="middle" fill="#1e293b">
        ♛
      </text>
      {/* Mã trắng tại f3 */}
      <text x={goc + 5.5 * o} y={goc + 5.5 * o + 5} fontSize="13" textAnchor="middle" fill="#ffffff" stroke="#78350f" strokeWidth="0.5">
        ♘
      </text>
      {/* Tượng đen tại c5 */}
      <text x={goc + 2.5 * o} y={goc + 3.5 * o + 5} fontSize="13" textAnchor="middle" fill="#1e293b">
        ♝
      </text>
    </g>
  )
}

// ── Cờ Tướng ──────────────────────────────────────────────────────────────────

function BanCoTuong({ id }: { id: string }) {
  const dx = 16
  const dy = 16
  const rong = 8 * dx
  const cao = 9 * dy
  const x0 = (W - rong) / 2
  const y0 = (H - cao) / 2

  return (
    <g transform={`rotate(3 ${W / 2} ${H / 2})`}>
      <defs>
        <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="100%" stopColor="#2e1002" />
        </linearGradient>
      </defs>
      {/* Bàn cờ viền gỗ sang trọng */}
      <rect x={x0 - 12} y={y0 - 12} width={rong + 24} height={cao + 24} rx="12" fill={`url(#${id}-board)`} stroke="#d97706" strokeWidth="2" />
      {/* Lưới đường kẻ ngang */}
      {Array.from({ length: 10 }).map((_, r) => (
        <line key={`h-${r}`} x1={x0} y1={y0 + r * dy} x2={x0 + rong} y2={y0 + r * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
      ))}
      {/* Lưới đường kẻ dọc nửa trên và nửa dưới (chừa dòng sông Sở Hà Hán Giới) */}
      {Array.from({ length: 9 }).map((_, c) => (
        <g key={`v-${c}`}>
          {c === 0 || c === 8 ? (
            <line x1={x0 + c * dx} y1={y0} x2={x0 + c * dx} y2={y0 + cao} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
          ) : (
            <>
              <line x1={x0 + c * dx} y1={y0} x2={x0 + c * dx} y2={y0 + 4 * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
              <line x1={x0 + c * dx} y1={y0 + 5 * dy} x2={x0 + c * dx} y2={y0 + cao} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
            </>
          )}
        </g>
      ))}
      {/* Đường chéo cung tướng trên & dưới */}
      <line x1={x0 + 3 * dx} y1={y0} x2={x0 + 5 * dx} y2={y0 + 2 * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
      <line x1={x0 + 5 * dx} y1={y0} x2={x0 + 3 * dx} y2={y0 + 2 * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
      <line x1={x0 + 3 * dx} y1={y0 + 7 * dy} x2={x0 + 5 * dx} y2={y0 + 9 * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />
      <line x1={x0 + 5 * dx} y1={y0 + 7 * dy} x2={x0 + 3 * dx} y2={y0 + 9 * dy} stroke="#fef3c7" strokeWidth="1" strokeOpacity="0.7" />

      {/* Sông Sở Hà Hán Giới chữ mờ */}
      <text x={W / 2} y={y0 + 4.65 * dy} fill="#fde68a" fontSize="8" fontWeight="bold" textAnchor="middle" fillOpacity="0.8">
        SỞ HÀ — HÁN GIỚI
      </text>

      {/* Quân Tướng đỏ tại cung dưới */}
      <circle cx={x0 + 4 * dx} cy={y0 + 9 * dy} r="7" fill="#fef3c7" stroke="#b91c1c" strokeWidth="1.2" />
      <text x={x0 + 4 * dx} y={y0 + 9 * dy + 3} fill="#b91c1c" fontSize="9" fontWeight="bold" textAnchor="middle">
        帥
      </text>

      {/* Quân Tướng đen tại cung trên */}
      <circle cx={x0 + 4 * dx} cy={y0} r="7" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.2" />
      <text x={x0 + 4 * dx} y={y0 + 3} fill="#0f172a" fontSize="9" fontWeight="bold" textAnchor="middle">
        將
      </text>

      {/* Quân Pháo đỏ */}
      <circle cx={x0 + 1 * dx} cy={y0 + 7 * dy} r="6.5" fill="#fef3c7" stroke="#b91c1c" strokeWidth="1.2" />
      <text x={x0 + 1 * dx} y={y0 + 7 * dy + 3} fill="#b91c1c" fontSize="8.5" fontWeight="bold" textAnchor="middle">
        砲
      </text>

      {/* Quân Mã đen */}
      <circle cx={x0 + 2 * dx} cy={y0 + 2 * dy} r="6.5" fill="#fef3c7" stroke="#0f172a" strokeWidth="1.2" />
      <text x={x0 + 2 * dx} y={y0 + 2 * dy + 3} fill="#0f172a" fontSize="8.5" fontWeight="bold" textAnchor="middle">
        馬
      </text>
    </g>
  )
}

// ── Caro ──────────────────────────────────────────────────────────────────────

const CARO15_X: readonly O[] = [[4, 10], [5, 9], [6, 8], [7, 7], [8, 6], [6, 10], [9, 9], [10, 6], [7, 5]]
const CARO15_O: readonly O[] = [[3, 11], [5, 8], [7, 8], [6, 7], [8, 9], [9, 7], [5, 11], [8, 5]]

function DauX({ cx, cy, x, net }: { cx: number; cy: number; x: number; net: number }) {
  return (
    <g stroke={MAU.quanX} strokeWidth={net} strokeLinecap="round">
      <line x1={cx - x} y1={cy - x} x2={cx + x} y2={cy + x} />
      <line x1={cx - x} y1={cy + x} x2={cx + x} y2={cy - x} />
    </g>
  )
}

function DauO({ cx, cy, r, net }: { cx: number; cy: number; r: number; net: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="none" stroke={MAU.quanO} strokeWidth={net} />
}

function BanCaro({
  soO,
  o,
  xoay,
  quanX,
  quanO,
  duongThang,
  goiY,
}: {
  soO: number
  o: number
  xoay: number
  quanX: readonly O[]
  quanO: readonly O[]
  duongThang: readonly [O, O] | null
  goiY: O | null
}) {
  const kichThuoc = soO * o
  const goc = -kichThuoc / 2
  const tam = (c: number) => goc + (c + 0.5) * o
  const x = o * 0.28
  const r = o * 0.28
  const net = Math.max(1.8, o * 0.12)

  return (
    <g transform={`translate(${W / 2} ${H / 2 + 4}) rotate(${xoay})`}>
      <rect
        x={goc - 6}
        y={goc - 6}
        width={kichThuoc + 12}
        height={kichThuoc + 12}
        rx="14"
        fill="#020617"
        stroke={MAU.luoi}
        strokeWidth="1.2"
      />
      <g stroke={MAU.luoi} strokeWidth="1">
        {Array.from({ length: soO + 1 }).map((_, i) => (
          <g key={i}>
            <line x1={goc + i * o} y1={goc} x2={goc + i * o} y2={goc + kichThuoc} />
            <line x1={goc} y1={goc + i * o} x2={goc + kichThuoc} y2={goc + i * o} />
          </g>
        ))}
      </g>
      {duongThang && (
        <line
          x1={tam(duongThang[0][0])}
          y1={tam(duongThang[0][1])}
          x2={tam(duongThang[1][0])}
          y2={tam(duongThang[1][1])}
          stroke={MAU.thang}
          strokeWidth={net * 1.6}
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
      )}
      {goiY && (
        <circle
          cx={tam(goiY[0])}
          cy={tam(goiY[1])}
          r={r * 0.8}
          fill="none"
          stroke={MAU.quanX}
          strokeWidth="1.4"
          strokeDasharray="2 3"
        />
      )}
      {quanX.map(([c, h]) => (
        <DauX key={`x${c}-${h}`} cx={tam(c)} cy={tam(h)} x={x} net={net} />
      ))}
      {quanO.map(([c, h]) => (
        <DauO key={`o${c}-${h}`} cx={tam(c)} cy={tam(h)} r={r} net={net} />
      ))}
    </g>
  )
}

// ── Trí nhớ ───────────────────────────────────────────────────────────────────

function MatUpThe({ x, y, rong, cao }: { x: number; y: number; rong: number; cao: number }) {
  const mx = x + rong / 2
  const my = y + cao / 2
  return (
    <g>
      <rect x={x} y={y} width={rong} height={cao} rx="8" fill="#0f172a" stroke="#6366f1" strokeWidth="1.2" />
      <circle cx={mx} cy={my} r={rong * 0.28} fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 2" />
      <path
        d={`M ${mx} ${my - 5} L ${mx + 5} ${my} L ${mx} ${my + 5} L ${mx - 5} ${my} Z`}
        fill="#818cf8"
        fillOpacity="0.8"
      />
    </g>
  )
}

function MatMoThe({
  x,
  y,
  rong,
  cao,
  emoji,
}: {
  x: number
  y: number
  rong: number
  cao: number
  emoji: string
}) {
  return (
    <g>
      <rect x={x} y={y} width={rong} height={cao} rx="8" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.4" />
      <text x={x + rong / 2} y={y + cao / 2 + 5} fontSize="14" textAnchor="middle">
        {emoji}
      </text>
    </g>
  )
}

function BanTriNho() {
  return (
    <g transform={`translate(${W / 2 - 80} ${H / 2 - 45})`}>
      <MatUpThe x={0} y={0} rong={36} cao={48} />
      <MatMoThe x={42} y={0} rong={36} cao={48} emoji="💎" />
      <MatUpThe x={84} y={0} rong={36} cao={48} />
      <MatMoThe x={126} y={0} rong={36} cao={48} emoji="🚀" />

      <MatMoThe x={0} y={54} rong={36} cao={48} emoji="💎" />
      <MatUpThe x={42} y={54} rong={36} cao={48} />
      <MatMoThe x={84} y={54} rong={36} cao={48} emoji="🚀" />
      <MatUpThe x={126} y={54} rong={36} cao={48} />
    </g>
  )
}

// ── Rắn săn mồi ───────────────────────────────────────────────────────────────

function BanRan() {
  return (
    <g transform={`translate(${W / 2 - 70} ${H / 2 - 40})`}>
      {/* Grid cyber neon */}
      <rect x="-10" y="-10" width="160" height="100" rx="10" fill="#020617" stroke="#059669" strokeWidth="1.5" />
      {/* Thân rắn */}
      {[
        [20, 40],
        [35, 40],
        [50, 40],
        [65, 40],
        [65, 25],
        [80, 25],
        [95, 25],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="13"
          height="13"
          rx="4"
          fill={i === 6 ? '#34d399' : '#059669'}
          stroke="#10b981"
          strokeWidth="1"
        />
      ))}
      {/* Mồi táo đỏ */}
      <circle cx="120" cy="25" r="7" fill="#ef4444" />
      <circle cx="122" cy="23" r="2.5" fill="#fca5a5" />
    </g>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Biểu tượng nhỏ 48×48
// ═════════════════════════════════════════════════════════════════════════════

const BIEU_TUONG: Record<GameType, (id: string) => ReactNode> = {
  chess: () => <BieuTuongCoVua />,
  xiangqi: () => <BieuTuongCoTuong />,
  caro_15: () => <BieuTuongCaro />,
  solo_memory: () => (
    <g>
      <g transform="rotate(-10 20 25)">
        <MatUpThe x={9} y={12} rong={18} cao={24} />
      </g>
      <g transform="rotate(10 28 25)">
        <MatMoThe x={20} y={12} rong={18} cao={24} emoji="💎" />
      </g>
    </g>
  ),
  solo_snake: () => (
    <g>
      {[[12, 28], [19, 28], [26, 28], [26, 21]].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="6" height="6" rx="1.8" fill="#059669" fillOpacity={0.45 + i * 0.15} />
      ))}
      <rect x="25" y="13" width="8" height="8" rx="2.5" fill="#34d399" />
      <circle cx="36.5" cy="17" r="3" fill="#f43f5e" />
    </g>
  ),
}

function BieuTuongCoVua() {
  return (
    <g transform="translate(4 4)">
      <circle cx="20" cy="20" r="18" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="20" y="27" fontSize="22" textAnchor="middle" fill="#fef3c7">
        ♔
      </text>
    </g>
  )
}

function BieuTuongCoTuong() {
  return (
    <g transform="translate(4 4)">
      <circle cx="20" cy="20" r="18" fill="#451a03" stroke="#ef4444" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="14" fill="#fef3c7" stroke="#b91c1c" strokeWidth="1" />
      <text x="20" y="26" fontSize="16" fontWeight="bold" textAnchor="middle" fill="#b91c1c">
        帥
      </text>
    </g>
  )
}

function BieuTuongCaro() {
  return (
    <g>
      <g stroke={MAU.luoi} strokeWidth="1">
        <line x1="19" y1="9" x2="19" y2="39" />
        <line x1="29" y1="9" x2="29" y2="39" />
        <line x1="9" y1="19" x2="39" y2="19" />
        <line x1="9" y1="29" x2="39" y2="29" />
      </g>
      <DauX cx={14} cy={34} x={3} net={2.2} />
      <DauX cx={24} cy={24} x={3} net={2.2} />
      <DauO cx={34} cy={14} r={3.4} net={2.2} />
    </g>
  )
}
