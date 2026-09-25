import { useId, type ReactNode } from 'react'
import type { GameType } from '@shared/protocol/game'
import { cn } from '@/lib/utils'

// Ảnh bìa trò chơi vẽ bằng SVG thay cho ảnh bitmap cắt từ mockup: sắc nét ở mọi độ phân giải, nhẹ,
// và dùng đúng màu quân/ô của bàn chơi thật (GameBoardView, SoloGameModal, SnakeScene) để ảnh bìa
// phản ánh đúng thứ người chơi sẽ thấy khi vào trận.

const MAU = {
  nen: '#0a1120',
  ban: '#0f172a',
  luoi: '#243049',
  vien: 'rgba(255,255,255,0.10)',
  quanX: '#22d3ee',
  quanO: '#e879f9',
  thang: '#fbbf24',
} as const

/** Màu hào quang nền riêng từng trò — giúp phân biệt nhanh khi lướt danh sách. */
const MAU_NHAN: Record<GameType, string> = {
  caro_15: '#22d3ee',
  caro_9: '#f59e0b',
  connect4: '#3b82f6',
  reversi: '#10b981',
  solo_2048: '#f97316',
  solo_memory: '#8b5cf6',
  solo_snake: '#34d399',
}

interface GameArtProps {
  gameType: GameType
  /** `cover`: ảnh bìa 16:9 cho thẻ trò chơi. `icon`: biểu tượng vuông giản lược cho kích thước nhỏ (≤ 56px). */
  variant?: 'cover' | 'icon'
  className?: string
  /** Nhãn cho trình đọc màn hình; bỏ trống khi ảnh chỉ để trang trí cạnh tiêu đề đã có tên trò chơi. */
  label?: string
}

export function GameArt({ gameType, variant = 'cover', className, label }: GameArtProps) {
  const id = `ga${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const laIcon = variant === 'icon'
  const w = laIcon ? 48 : 320
  const h = laIcon ? 48 : 180
  const nhan = MAU_NHAN[gameType]

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
      <rect width={w} height={h} fill={MAU.nen} />
      {!laIcon && <rect width={w} height={h} fill={`url(#${id}-cham)`} />}
      <rect width={w} height={h} fill={`url(#${id}-hao-quang)`} />
      {laIcon ? BIEU_TUONG[gameType](id) : ANH_BIA[gameType](id)}
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
  caro_15: () => (
    <BanCaro soO={15} o={16} xoay={-8} quanX={CARO15_X} quanO={CARO15_O} duongThang={[[4, 10], [8, 6]]} goiY={null} />
  ),
  caro_9: () => <BanCaro soO={9} o={21} xoay={6} quanX={CARO9_X} quanO={CARO9_O} duongThang={null} goiY={[6, 2]} />,
  connect4: (id) => <BanConnect4 id={id} />,
  reversi: (id) => <BanReversi id={id} />,
  solo_2048: (id) => <Ban2048 id={id} />,
  solo_memory: () => <BanTriNho />,
  solo_snake: () => <BanRan />,
}

// ── Caro ──────────────────────────────────────────────────────────────────────

const CARO15_X: readonly O[] = [[4, 10], [5, 9], [6, 8], [7, 7], [8, 6], [6, 10], [9, 9], [10, 6], [7, 5]]
const CARO15_O: readonly O[] = [[3, 11], [5, 8], [7, 8], [6, 7], [8, 9], [9, 7], [5, 11], [8, 5]]
const CARO9_X: readonly O[] = [[2, 6], [3, 5], [4, 4], [5, 3], [3, 3], [5, 5]]
const CARO9_O: readonly O[] = [[1, 7], [4, 5], [5, 4], [4, 3], [3, 4]]

function DauX({ cx, cy, x, net }: { cx: number; cy: number; x: number; net: number }) {
  const d = `M${cx - x} ${cy - x}L${cx + x} ${cy + x}M${cx + x} ${cy - x}L${cx - x} ${cy + x}`
  return (
    <g stroke={MAU.quanX} strokeLinecap="round">
      <path d={d} strokeWidth={net * 2.6} strokeOpacity="0.14" />
      <path d={d} strokeWidth={net} />
    </g>
  )
}

function DauO({ cx, cy, r, net }: { cx: number; cy: number; r: number; net: number }) {
  return (
    <g fill="none" stroke={MAU.quanO}>
      <circle cx={cx} cy={cy} r={r} strokeWidth={net * 2.6} strokeOpacity="0.12" />
      <circle cx={cx} cy={cy} r={r} strokeWidth={net} />
    </g>
  )
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
  const net = o * 0.17
  const x = o * 0.26
  const r = o * 0.29
  // Đưa cụm quân về giữa khung: tâm cụm ≈ giữa bàn lệch theo vị trí các quân.
  const tatCa = [...quanX, ...quanO]
  const lechX = -(tatCa.reduce((s, [c]) => s + tam(c), 0) / tatCa.length)
  const lechY = -(tatCa.reduce((s, [, h]) => s + tam(h), 0) / tatCa.length)

  return (
    <g transform={`translate(${W / 2} ${H / 2}) rotate(${xoay}) translate(${lechX} ${lechY})`}>
      <rect x={goc - 8} y={goc - 8} width={kichThuoc + 16} height={kichThuoc + 16} rx="16" fill={MAU.ban} stroke={MAU.vien} />
      <g stroke={MAU.luoi} strokeWidth="1">
        {Array.from({ length: soO + 1 }, (_, i) => (
          <g key={i}>
            <line x1={goc + i * o} y1={goc} x2={goc + i * o} y2={-goc} />
            <line x1={goc} y1={goc + i * o} x2={-goc} y2={goc + i * o} />
          </g>
        ))}
      </g>
      {duongThang && (
        <g stroke={MAU.thang} strokeLinecap="round">
          <line x1={tam(duongThang[0][0])} y1={tam(duongThang[0][1])} x2={tam(duongThang[1][0])} y2={tam(duongThang[1][1])} strokeWidth={o * 0.9} strokeOpacity="0.16" />
          <line x1={tam(duongThang[0][0])} y1={tam(duongThang[0][1])} x2={tam(duongThang[1][0])} y2={tam(duongThang[1][1])} strokeWidth="1.5" strokeOpacity="0.9" />
        </g>
      )}
      {goiY && (
        <circle cx={tam(goiY[0])} cy={tam(goiY[1])} r={r + 1} fill="none" stroke={MAU.quanX} strokeWidth="1.3" strokeDasharray="3 3" strokeOpacity="0.75" />
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

// ── Connect 4 ─────────────────────────────────────────────────────────────────

// Hàng 0 là hàng trên cùng; 'r' = quân đỏ (X), 'y' = quân vàng (O) như GameBoardView.
const CONNECT4: readonly string[] = [
  '.......',
  '.......',
  '...r...',
  '..ry...',
  '.ryy.y.',
  'ryyrrr.',
]

function GradientQuanTron({ id, ten, sang, toi }: { id: string; ten: string; sang: string; toi: string }) {
  return (
    <radialGradient id={`${id}-${ten}`} cx="35%" cy="30%" r="75%">
      <stop offset="0%" stopColor={sang} />
      <stop offset="100%" stopColor={toi} />
    </radialGradient>
  )
}

function BanConnect4({ id }: { id: string }) {
  const o = 19
  const dem = 8
  const rong = 7 * o + dem * 2
  const cao = 6 * o + dem * 2
  const x0 = (W - rong) / 2
  const y0 = H - cao - 8
  const cotRoi = x0 + dem + 4.5 * o

  return (
    <g>
      <defs>
        <GradientQuanTron id={id} ten="do" sang="#fb7185" toi="#dc2626" />
        <GradientQuanTron id={id} ten="vang" sang="#fde68a" toi="#eab308" />
      </defs>
      {/* Quân vàng đang rơi vào cột 5 — bóng mờ phía trên tạo cảm giác chuyển động */}
      <circle cx={cotRoi} cy={y0 - 27} r="7.6" fill="#eab308" fillOpacity="0.1" />
      <circle cx={cotRoi} cy={y0 - 20} r="7.6" fill="#eab308" fillOpacity="0.22" />
      <circle cx={cotRoi} cy={y0 - 12} r="8" fill={`url(#${id}-vang)`} />
      <rect x={x0} y={y0} width={rong} height={cao} rx="14" fill="#1e3a8a" stroke="#2563eb" strokeWidth="1.5" />
      {CONNECT4.map((hang, h) =>
        Array.from(hang).map((kyTu, c) => {
          const cx = x0 + dem + (c + 0.5) * o
          const cy = y0 + dem + (h + 0.5) * o
          if (kyTu === '.') return <circle key={`${c}-${h}`} cx={cx} cy={cy} r="7.4" fill="#020617" />
          return <circle key={`${c}-${h}`} cx={cx} cy={cy} r="7.6" fill={`url(#${id}-${kyTu === 'r' ? 'do' : 'vang'})`} />
        }),
      )}
      {/* 4 quân đỏ chéo thắng */}
      <line
        x1={x0 + dem + 0.5 * o}
        y1={y0 + dem + 5.5 * o}
        x2={x0 + dem + 3.5 * o}
        y2={y0 + dem + 2.5 * o}
        stroke={MAU.thang}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
    </g>
  )
}

// ── Reversi ───────────────────────────────────────────────────────────────────

const REVERSI: readonly string[] = [
  '........',
  '........',
  '..wbw...',
  '..bbbw..',
  '..wbbb..',
  '...wb...',
  '....w...',
  '........',
]

function BanReversi({ id }: { id: string }) {
  const o = 18
  const kichThuoc = 8 * o
  const goc = -kichThuoc / 2

  return (
    <g transform={`translate(${W / 2} ${H / 2 + 2}) rotate(-6)`}>
      <defs>
        <GradientQuanTron id={id} ten="den" sang="#334155" toi="#020617" />
        <GradientQuanTron id={id} ten="trang" sang="#ffffff" toi="#cbd5e1" />
      </defs>
      <rect x={goc - 8} y={goc - 8} width={kichThuoc + 16} height={kichThuoc + 16} rx="16" fill="#022c22" stroke="#047857" strokeOpacity="0.8" />
      {REVERSI.map((hang, h) =>
        Array.from(hang).map((kyTu, c) => (
          <g key={`${c}-${h}`}>
            <rect x={goc + c * o + 0.8} y={goc + h * o + 0.8} width={o - 1.6} height={o - 1.6} rx="3" fill="#065f46" />
            {kyTu !== '.' && (
              <circle
                cx={goc + (c + 0.5) * o}
                cy={goc + (h + 0.5) * o}
                r={o * 0.37}
                fill={`url(#${id}-${kyTu === 'b' ? 'den' : 'trang'})`}
                stroke={kyTu === 'b' ? '#475569' : '#e2e8f0'}
                strokeWidth="0.6"
              />
            )}
          </g>
        )),
      )}
      {/* Nước đi hợp lệ gợi ý */}
      <circle cx={goc + 5.5 * o} cy={goc + 2.5 * o} r={o * 0.15} fill={MAU.quanX} fillOpacity="0.9" />
      <circle cx={goc + 1.5 * o} cy={goc + 3.5 * o} r={o * 0.15} fill={MAU.quanX} fillOpacity="0.9" />
    </g>
  )
}

// ── 2048 ──────────────────────────────────────────────────────────────────────

// Đúng bảng màu ô của Game2048View.
const MAU_O_2048: Record<number, { nen: string; chu: string }> = {
  2: { nen: '#fef3c7', chu: '#1e293b' },
  4: { nen: '#fde68a', chu: '#1e293b' },
  8: { nen: '#fb923c', chu: '#ffffff' },
  16: { nen: '#f97316', chu: '#ffffff' },
  32: { nen: '#f43f5e', chu: '#ffffff' },
  64: { nen: '#dc2626', chu: '#ffffff' },
  128: { nen: '#facc15', chu: '#0f172a' },
  512: { nen: '#06b6d4', chu: '#ffffff' },
  1024: { nen: '#22d3ee', chu: '#0f172a' },
}

const BAN_2048: readonly (readonly number[])[] = [
  [2, 4, 8, 0],
  [0, 16, 32, 64],
  [0, 4, 128, 512],
  [2, 0, 1024, 2048],
]

function Ban2048({ id }: { id: string }) {
  const o = 32
  const khe = 5
  const kichThuoc = 4 * o + 5 * khe
  const goc = -kichThuoc / 2

  return (
    <g transform={`translate(${W / 2} ${H / 2 + 2}) rotate(5)`}>
      <defs>
        <linearGradient id={`${id}-2048`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
      </defs>
      <rect x={goc} y={goc} width={kichThuoc} height={kichThuoc} rx="14" fill={MAU.ban} stroke={MAU.vien} />
      {BAN_2048.map((hang, h) =>
        hang.map((so, c) => {
          const x = goc + khe + c * (o + khe)
          const y = goc + khe + h * (o + khe)
          if (so === 0) return <rect key={`${c}-${h}`} x={x} y={y} width={o} height={o} rx="7" fill="#1e293b" fillOpacity="0.55" />
          const la2048 = so === 2048
          const mau = MAU_O_2048[so]
          return (
            <g key={`${c}-${h}`}>
              {la2048 && <rect x={x - 3} y={y - 3} width={o + 6} height={o + 6} rx="9" fill="#fbbf24" fillOpacity="0.22" />}
              <rect x={x} y={y} width={o} height={o} rx="7" fill={la2048 ? `url(#${id}-2048)` : mau.nen} />
              <text
                x={x + o / 2}
                y={y + o / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={so >= 1000 ? 10.5 : so >= 100 ? 12 : 14}
                fontWeight="700"
                fill={la2048 ? '#0f172a' : mau.chu}
                style={{ fontFamily: 'inherit' }}
              >
                {so}
              </text>
            </g>
          )
        }),
      )}
    </g>
  )
}

// ── Lật thẻ trí nhớ ───────────────────────────────────────────────────────────

type TrangThaiThe = 'up' | 'lat' | 'khop'
type HinhThe = 'sao' | 'tim' | 'tamGiac'

const THE_TRI_NHO: readonly (readonly [TrangThaiThe, HinhThe | null])[] = [
  ['up', null], ['khop', 'sao'], ['up', null], ['up', null],
  ['up', null], ['lat', 'tim'], ['up', null], ['khop', 'sao'],
  ['up', null], ['up', null], ['lat', 'tamGiac'], ['up', null],
]

function HinhTrenThe({ hinh, cx, cy, mau, co = 1 }: { hinh: HinhThe; cx: number; cy: number; mau: string; co?: number }) {
  if (hinh === 'sao') {
    const diem = Array.from({ length: 10 }, (_, i) => {
      const r = (i % 2 === 0 ? 8 : 3.6) * co
      const g = (Math.PI / 5) * i - Math.PI / 2
      return `${(cx + r * Math.cos(g)).toFixed(2)},${(cy + r * Math.sin(g)).toFixed(2)}`
    }).join(' ')
    return <polygon points={diem} fill={mau} />
  }
  if (hinh === 'tim') {
    const k = co
    return (
      <path
        d={`M${cx} ${cy + 6.5 * k}C${cx - 9 * k} ${cy}, ${cx - 7 * k} ${cy - 8 * k}, ${cx} ${cy - 3.5 * k}C${cx + 7 * k} ${cy - 8 * k}, ${cx + 9 * k} ${cy}, ${cx} ${cy + 6.5 * k}Z`}
        fill={mau}
      />
    )
  }
  return <path d={`M${cx} ${cy - 7 * co}L${cx + 7.5 * co} ${cy + 6 * co}L${cx - 7.5 * co} ${cy + 6 * co}Z`} fill={mau} />
}

function MatUpThe({ x, y, rong, cao }: { x: number; y: number; rong: number; cao: number }) {
  return (
    <g>
      <rect x={x} y={y} width={rong} height={cao} rx="7" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <rect x={x + 5} y={y + 5} width={rong - 10} height={cao - 10} rx="4" fill="none" stroke="#475569" strokeOpacity="0.6" strokeDasharray="2 2.5" />
      <circle cx={x + rong / 2} cy={y + cao / 2} r="2.2" fill="#64748b" />
    </g>
  )
}

function BanTriNho() {
  const rong = 34
  const cao = 42
  const khe = 7
  const gx = -(4 * rong + 3 * khe) / 2
  const gy = -(3 * cao + 2 * khe) / 2

  return (
    <g transform={`translate(${W / 2} ${H / 2 + 1}) rotate(-4)`}>
      {THE_TRI_NHO.map(([trangThai, hinh], i) => {
        const x = gx + (i % 4) * (rong + khe)
        const y = gy + Math.floor(i / 4) * (cao + khe)
        if (trangThai === 'up' || !hinh) return <MatUpThe key={i} x={x} y={y} rong={rong} cao={cao} />
        const khop = trangThai === 'khop'
        const mau = khop ? '#34d399' : '#22d3ee'
        return (
          <g key={i}>
            <rect x={x - 2.5} y={y - 2.5} width={rong + 5} height={cao + 5} rx="9" fill={mau} fillOpacity="0.12" />
            <rect x={x} y={y} width={rong} height={cao} rx="7" fill={khop ? '#022c22' : '#083344'} stroke={khop ? '#10b981' : '#06b6d4'} strokeWidth="1.2" />
            <HinhTrenThe hinh={hinh} cx={x + rong / 2} cy={y + cao / 2} mau={mau} />
          </g>
        )
      })}
    </g>
  )
}

// ── Rắn săn mồi ───────────────────────────────────────────────────────────────

// Toạ độ ô (cột, hàng) từ đầu rắn tới đuôi trên lưới 16px (nền và màu như SnakeScene).
const THAN_RAN: readonly O[] = [
  [13, 4], [12, 4], [11, 4], [10, 4], [10, 5], [10, 6], [9, 6], [8, 6], [7, 6], [6, 6],
  [6, 5], [6, 4], [5, 4], [4, 4],
]
const MOI_RAN: O = [16, 4]

function BanRan() {
  const o = 16
  const giua = (c: number) => c * o + o / 2
  const [dauC, dauH] = THAN_RAN[0]

  return (
    <g>
      <g stroke="#1e293b" strokeOpacity="0.5" strokeWidth="1">
        {Array.from({ length: W / o + 1 }, (_, i) => (
          <line key={`c${i}`} x1={i * o + 0.5} y1="0" x2={i * o + 0.5} y2={H} />
        ))}
        {Array.from({ length: Math.ceil(H / o) + 1 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * o + 0.5} x2={W} y2={i * o + 0.5} />
        ))}
      </g>
      {/* Mồi */}
      <circle cx={giua(MOI_RAN[0])} cy={giua(MOI_RAN[1])} r="12" fill="#f43f5e" fillOpacity="0.2" />
      <circle cx={giua(MOI_RAN[0])} cy={giua(MOI_RAN[1])} r="6" fill="#f43f5e" />
      <circle cx={giua(MOI_RAN[0]) - 1.8} cy={giua(MOI_RAN[1]) - 2} r="1.7" fill="#fecdd3" fillOpacity="0.85" />
      {/* Thân: đậm dần về phía đầu */}
      {THAN_RAN.slice(1)
        .map(([c, h], i) => (
          <rect
            key={`${c}-${h}`}
            x={c * o + 1.5}
            y={h * o + 1.5}
            width={o - 3}
            height={o - 3}
            rx="4"
            fill="#059669"
            fillOpacity={1 - (i / THAN_RAN.length) * 0.7}
          />
        ))
        .reverse()}
      {/* Đầu */}
      <rect x={dauC * o - 3} y={dauH * o - 3} width={o + 6} height={o + 6} rx="8" fill="#34d399" fillOpacity="0.22" />
      <rect x={dauC * o + 0.5} y={dauH * o + 0.5} width={o - 1} height={o - 1} rx="5" fill="#34d399" />
      <circle cx={giua(dauC) + 2.5} cy={giua(dauH) - 3} r="1.6" fill="#064e3b" />
      <circle cx={giua(dauC) + 2.5} cy={giua(dauH) + 3} r="1.6" fill="#064e3b" />
    </g>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// Biểu tượng vuông 48×48 — giản lược để còn đọc được ở 32–56px
// ═════════════════════════════════════════════════════════════════════════════

const O_2048_BIEU_TUONG: readonly (readonly [number, number, string])[] = [
  [10, 10, '#fef3c7'],
  [25, 10, '#fb923c'],
  [10, 25, '#f43f5e'],
  [25, 25, '#fbbf24'],
]

const BIEU_TUONG: Record<GameType, (id: string) => ReactNode> = {
  caro_15: () => <BieuTuongCaro />,
  caro_9: () => <BieuTuongCaro />,
  connect4: (id) => (
    <g>
      <defs>
        <GradientQuanTron id={id} ten="do" sang="#fb7185" toi="#dc2626" />
        <GradientQuanTron id={id} ten="vang" sang="#fde68a" toi="#eab308" />
      </defs>
      <rect x="9" y="11" width="30" height="26" rx="7" fill="#1e3a8a" stroke="#2563eb" strokeWidth="1.2" />
      {(['r', 'y', '.', 'y', 'r', 'r'] as const).map((k, i) => {
        const cx = 16 + (i % 3) * 8
        const cy = 19.5 + Math.floor(i / 3) * 9
        return <circle key={i} cx={cx} cy={cy} r="3.1" fill={k === '.' ? '#020617' : `url(#${id}-${k === 'r' ? 'do' : 'vang'})`} />
      })}
    </g>
  ),
  reversi: (id) => (
    <g>
      <defs>
        <GradientQuanTron id={id} ten="den" sang="#334155" toi="#020617" />
        <GradientQuanTron id={id} ten="trang" sang="#ffffff" toi="#cbd5e1" />
      </defs>
      <rect x="9" y="9" width="30" height="30" rx="7" fill="#022c22" stroke="#047857" />
      {[0, 1, 2, 3].map((i) => {
        const c = i % 2
        const h = Math.floor(i / 2)
        const den = (c + h) % 2 === 0
        return (
          <g key={i}>
            <rect x={12 + c * 12.5} y={12 + h * 12.5} width="11.5" height="11.5" rx="2.5" fill="#065f46" />
            <circle cx={17.75 + c * 12.5} cy={17.75 + h * 12.5} r="4.3" fill={`url(#${id}-${den ? 'den' : 'trang'})`} />
          </g>
        )
      })}
    </g>
  ),
  solo_2048: () => (
    <g>
      {O_2048_BIEU_TUONG.map(([x, y, mau]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="13" height="13" rx="3.5" fill={mau} />
      ))}
    </g>
  ),
  solo_memory: () => (
    <g>
      <g transform="rotate(-10 20 25)">
        <MatUpThe x={9} y={12} rong={18} cao={24} />
      </g>
      <g transform="rotate(8 29 24)">
        <rect x="21" y="11" width="18" height="24" rx="5" fill="#022c22" stroke="#10b981" strokeWidth="1.2" />
        <HinhTrenThe hinh="sao" cx={30} cy={23} mau="#34d399" co={0.72} />
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
