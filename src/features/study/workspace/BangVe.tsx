// Bảng vẽ của lớp học: hệ toạ độ logic 1600×900 (16:9) nên nét vẽ nằm đúng chỗ trên mọi màn hình.
// Dùng làm lớp chính, cửa sổ nổi, hoặc phủ trong suốt lên video / tài liệu (laPhu).

import { BANG_VE_CAO, BANG_VE_RONG, type MatNet, type WhiteboardStroke } from '@shared/protocol/room'
import { getStroke } from 'perfect-freehand'
import { useEffect, useRef, useState } from 'react'
import {
  CONG_CU_VE,
  DO_MO_TO_SANG,
  doDayNet,
  netDuocCham,
  rutGonDiem,
  type CongCu,
  type CoVe,
  diemHinh,
  hopGioiHanNet,
  type LoaiHinh,
} from './cong-cu'

type NetGui = Omit<WhiteboardStroke, 'epoch'>

interface BangVeProps {
  strokes: WhiteboardStroke[]
  congCu: CongCu
  /** Kiểu hình khi đang chọn công cụ Hình. */
  hinh?: LoaiHinh
  mau: string
  co: CoVe
  /** Phủ trong suốt lên lớp khác: không nền, chỉ nhận chuột khi đang chọn công cụ vẽ. */
  laPhu?: boolean
  /** Mặt vẽ: lớp vẽ tàng hình của video / tài liệu nhúng. Không có = Bảng. Mỗi mặt chỉ thấy và tẩy nét của chính nó. */
  mat?: MatNet
  /** URL tài liệu hiện hành khi mat === 'tailieu' để nét vẽ gắn với từng tab riêng. */
  docUrl?: string
  coTheVe: boolean
  /** Chủ phòng / người điều hành tẩy được mọi nét; người khác chỉ tẩy nét của mình. */
  coTheTayMoiNet: boolean
  khoaCuaToi?: string
  onSendStroke: (stroke: NetGui) => void
  onRemoveStroke: (id: string) => void
}

const SO_DIEM_TOI_DA = 200
/** Đầu mũi tên tối đa (đơn vị bảng 1600×900). */
const DAU_MUI_TEN = 48
const NGUONG_TAY = 14

function duongVienNet(points: number[][], size: number, laToSang: boolean): string {
  const vien = getStroke(points, {
    size,
    thinning: laToSang ? 0 : 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  })
  if (!vien.length) return ''
  const d = vien.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...vien[0], 'Q'],
  )
  d.push('Z')
  return d.join(' ')
}

function VeNet({ net }: { net: Pick<WhiteboardStroke, 'points' | 'color' | 'size' | 'tool' | 'text' | 'opacity'> }) {
  if (net.tool === 'text' && net.text) {
    const [x, y] = net.points[0]
    const lines = net.text.split(/\r?\n/)
    const lineHeight = net.size * 1.25
    return (
      <text
        x={x}
        y={y}
        fill={net.color}
        fontSize={net.size}
        fontWeight={600}
        dominantBaseline="hanging"
        style={{ fontFamily: 'inherit', userSelect: 'none' }}
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={x} y={y + idx * lineHeight}>
            {line || '\u00A0'}
          </tspan>
        ))}
      </text>
    )
  }
  if (net.tool === 'shape') {
    return (
      <polyline
        points={net.points.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke={net.color}
        strokeWidth={net.size}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    )
  }
  const laToSang = net.tool === 'highlighter'
  return (
    <path
      d={duongVienNet(net.points, net.size, laToSang)}
      fill={net.color}
      opacity={net.opacity ?? (laToSang ? DO_MO_TO_SANG : 0.95)}
    />
  )
}

export function BangVe({
  strokes,
  congCu,
  hinh = 'chu_nhat',
  mau,
  co,
  laPhu = false,
  mat,
  docUrl,
  coTheVe,
  coTheTayMoiNet,
  khoaCuaToi,
  onSendStroke,
  onRemoveStroke,
}: BangVeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const khungRef = useRef<HTMLDivElement>(null)
  const dangVeRef = useRef(false)
  const diemRef = useRef<[number, number][]>([])
  const daTayRef = useRef<Set<string>>(new Set())
  const [nhap, setNhap] = useState<[number, number][]>([])
  const [oChu, setOChu] = useState<{ diem: [number, number]; left: number; top: number; coChuPx?: number } | null>(null)
  const [chuDangGo, setChuDangGo] = useState('')
  const oChuRef = useRef<HTMLTextAreaElement>(null)

  const netCuaMat = strokes.filter((s) => s.mat === mat).filter(
    (s) => !mat || mat !== 'tailieu' || !docUrl || !s.docUrl || s.docUrl === docUrl,
  )
  const laDiChuyen = congCu === 'di_chuyen'
  const nhanChuot = coTheVe && (CONG_CU_VE.has(congCu) || laDiChuyen)
  const doDay = doDayNet('bang', congCu, co)

  const dangKeoRef = useRef(false)
  const keoNetRef = useRef<WhiteboardStroke | null>(null)
  const diemBatDauRef = useRef<[number, number] | null>(null)
  const diemGocNetRef = useRef<[number, number][]>([])
  const rafKeoRef = useRef<number | null>(null)
  const offsetKeoRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const [keoNetId, setKeoNetId] = useState<string | null>(null)
  const [keoOffset, setKeoOffset] = useState<{ dx: number; dy: number } | null>(null)
  const [netDuocChon, setNetDuocChon] = useState<string | null>(null)

  // Ô gõ chữ vừa mở: lấy tiêu điểm nhưng không cuộn trang (Zero CLS).
  useEffect(() => {
    if (oChu) oChuRef.current?.focus({ preventScroll: true })
  }, [oChu])

  /** Toạ độ con trỏ trong hệ 1600×900 (đúng cả khi bảng bị viền đen hai bên). */
  const diemTrenBang = (e: React.PointerEvent): [number, number] | null => {
    const svg = svgRef.current
    const ma = svg?.getScreenCTM()
    if (!svg || !ma) return null
    const p = svg.createSVGPoint()
    p.x = e.clientX
    p.y = e.clientY
    const q = p.matrixTransform(ma.inverse())
    return [
      Math.round(Math.max(0, Math.min(BANG_VE_RONG, q.x)) * 10) / 10,
      Math.round(Math.max(0, Math.min(BANG_VE_CAO, q.y)) * 10) / 10,
    ]
  }

  const tayTai = (p: [number, number]) => {
    const coTheTay = netCuaMat.filter(
      (s) => !daTayRef.current.has(s.id) && (coTheTayMoiNet || (khoaCuaToi && s.by === khoaCuaToi)),
    )
    const trung = netDuocCham(p, coTheTay, NGUONG_TAY)
    if (trung) {
      daTayRef.current.add(trung.id)
      onRemoveStroke(trung.id)
    }
  }

  const guiChu = () => {
    const noiDung = chuDangGo.trimEnd().slice(0, 500)
    if (oChu && noiDung.trim()) {
      onSendStroke({
        id: `chu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        points: [oChu.diem],
        color: mau,
        size: doDayNet('bang', 'chu', co),
        v: 2,
        tool: 'text',
        text: noiDung,
        ...(mat ? { mat } : {}),
        ...(mat === 'tailieu' && docUrl ? { docUrl } : {}),
      })
    }
    setOChu(null)
    setChuDangGo('')
  }

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!nhanChuot) return
    const p = diemTrenBang(e)
    if (!p) return

    if (laDiChuyen) {
      const coTheDiChuyen = netCuaMat.filter(
        (s) => coTheTayMoiNet || (khoaCuaToi && s.by === khoaCuaToi) || !s.by,
      )
      let trung = null
      if (netDuocChon) {
        const daChon = coTheDiChuyen.find((s) => s.id === netDuocChon)
        if (daChon) {
          const hop = hopGioiHanNet(daChon, 1)
          if (hop) {
            const pad = 12
            if (p[0] >= hop.minX - pad && p[0] <= hop.maxX + pad && p[1] >= hop.minY - pad && p[1] <= hop.maxY + pad) {
              trung = daChon
            }
          }
        }
      }
      if (!trung) {
        trung = netDuocCham(p, coTheDiChuyen, 24, 1, true)
      }
      if (trung) {
        dangKeoRef.current = true
        keoNetRef.current = trung
        diemBatDauRef.current = p
        diemGocNetRef.current = trung.points.map(([x, y]) => [x, y])
        setKeoNetId(trung.id)
        setNetDuocChon(trung.id)
        setKeoOffset({ dx: 0, dy: 0 })
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {}
      } else {
        setNetDuocChon(null)
        setKeoNetId(null)
        setKeoOffset(null)
      }
      return
    }

    if (congCu === 'chu') {
      // Chặn hành vi mặc định: sau pointerdown trình duyệt dời tiêu điểm về trang, làm ô chữ vừa mở mất tiêu điểm
      // và tự đóng ngay (bấm xuống bảng mà không gõ được chữ).
      e.preventDefault()
      const khung = khungRef.current?.getBoundingClientRect()
      if (oChu) guiChu()
      // Kẹp trong khung: ô chữ gần mép phải / dưới không bị khung (overflow-hidden) cắt mất.
      if (khung) {
        const coChuNet = doDayNet('bang', 'chu', co)
        const scale = khung.height > 0 ? khung.height / BANG_VE_CAO : 1
        const coChuPx = Math.max(12, Math.round(coChuNet * scale))
        setOChu({
          diem: p,
          left: Math.max(0, Math.min(e.clientX - khung.left, khung.width - 200)),
          top: Math.max(0, Math.min(e.clientY - khung.top, khung.height - (coChuPx * 2 + 24))),
          coChuPx,
        })
      }
      return
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dangVeRef.current = true
    if (congCu === 'tay') {
      daTayRef.current = new Set()
      tayTai(p)
      return
    }
    diemRef.current = [p]
    setNhap([p])
  }

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const p = diemTrenBang(e)
    if (!p) return

    if (laDiChuyen) {
      if (dangKeoRef.current && diemBatDauRef.current && keoNetRef.current) {
        const dx = p[0] - diemBatDauRef.current[0]
        const dy = p[1] - diemBatDauRef.current[1]
        offsetKeoRef.current = { dx, dy }
        if (!rafKeoRef.current) {
          rafKeoRef.current = requestAnimationFrame(() => {
            rafKeoRef.current = null
            setKeoOffset({ dx, dy })
          })
        }
      }
      return
    }

    if (!dangVeRef.current) return
    if (congCu === 'tay') {
      tayTai(p)
      return
    }
    if (congCu === 'khung') {
      diemRef.current = [diemRef.current[0], p]
    } else {
      diemRef.current.push(p)
    }
    setNhap([...diemRef.current])
  }

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (laDiChuyen) {
      if (rafKeoRef.current !== null) {
        cancelAnimationFrame(rafKeoRef.current)
        rafKeoRef.current = null
      }
      const finalOffset = offsetKeoRef.current
      if (dangKeoRef.current && keoNetRef.current && diemGocNetRef.current.length) {
        const { dx, dy } = finalOffset
        if (Math.hypot(dx, dy) >= 2) {
          const newPoints: [number, number][] = diemGocNetRef.current.map(([x, y]) => [
            Math.round(Math.max(0, Math.min(BANG_VE_RONG, x + dx)) * 10) / 10,
            Math.round(Math.max(0, Math.min(BANG_VE_CAO, y + dy)) * 10) / 10,
          ])
          onSendStroke({
            ...keoNetRef.current,
            points: newPoints,
            ...(mat === 'tailieu' && docUrl ? { docUrl } : {}),
          })
        }
      }
      dangKeoRef.current = false
      keoNetRef.current = null
      diemBatDauRef.current = null
      offsetKeoRef.current = { dx: 0, dy: 0 }
      setKeoNetId(null)
      setKeoOffset(null)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {}
      return
    }

    if (!dangVeRef.current) return
    dangVeRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    const diem = diemRef.current
    diemRef.current = []
    setNhap([])
    if (congCu === 'tay') return

    const id = `net_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    if (congCu === 'khung') {
      const [a, b] = [diem[0], diem[diem.length - 1]]
      if (!a || !b || Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) return
      onSendStroke({
        id,
        points: diemHinh(hinh, a, b, 1, DAU_MUI_TEN).map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
        color: mau,
        size: doDay,
        v: 2,
        tool: 'shape',
        ...(mat ? { mat } : {}),
        ...(mat === 'tailieu' && docUrl ? { docUrl } : {}),
      })
      return
    }
    if (diem.length < 2) return
    const laToSang = congCu === 'to_sang'
    onSendStroke({
      id,
      points: rutGonDiem(diem, SO_DIEM_TOI_DA),
      color: mau,
      size: doDay,
      v: 2,
      tool: laToSang ? 'highlighter' : 'pen',
      ...(laToSang ? { opacity: DO_MO_TO_SANG } : {}),
      ...(mat ? { mat } : {}),
      ...(mat === 'tailieu' && docUrl ? { docUrl } : {}),
    })
  }

  // Nét đang vẽ dở (xem trước tại máy mình trước khi máy chủ phát lại).
  let xemTruoc: React.ReactNode = null
  if (nhap.length > 1 && congCu === 'khung') {
    const [a, b] = [nhap[0], nhap[nhap.length - 1]]
    xemTruoc = <VeNet net={{ points: diemHinh(hinh, a, b, 1, DAU_MUI_TEN), color: mau, size: doDay, tool: 'shape' }} />
  } else if (nhap.length > 1 && (congCu === 'but' || congCu === 'to_sang')) {
    xemTruoc = <VeNet net={{ points: nhap, color: mau, size: doDay, tool: congCu === 'to_sang' ? 'highlighter' : 'pen' }} />
  }

  return (
    <div
      ref={khungRef}
      className={`relative h-full w-full overflow-hidden select-none ${laPhu ? 'pointer-events-none bg-transparent' : 'bg-canvas'}`}
      data-testid={mat ? `lop-ve-${mat}` : laPhu ? 'whiteboard-overlay' : 'whiteboard-surface'}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BANG_VE_RONG} ${BANG_VE_CAO}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`absolute inset-0 h-full w-full touch-none ${nhanChuot ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          cursor:
            congCu === 'tay'
              ? 'cell'
              : congCu === 'chu'
                ? 'text'
                : laDiChuyen
                  ? dangKeoRef.current
                    ? 'grabbing'
                    : 'grab'
                  : nhanChuot
                    ? 'crosshair'
                    : 'default',
        }}
      >
        {!laPhu && (
          <>
            <defs>
              <pattern id="o-bang-ve" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width={BANG_VE_RONG} height={BANG_VE_CAO} className="fill-canvas" />
            <rect width={BANG_VE_RONG} height={BANG_VE_CAO} fill="url(#o-bang-ve)" />
          </>
        )}
        {netCuaMat.map((net) => {
          const laDangKeo = keoNetId === net.id && keoOffset !== null
          const dx = laDangKeo ? keoOffset.dx : 0
          const dy = laDangKeo ? keoOffset.dy : 0
          const laChon = laDiChuyen && (netDuocChon === net.id || keoNetId === net.id)
          const hop = laChon ? hopGioiHanNet(net) : null
          return (
            <g
              key={net.id}
              transform={laDangKeo ? `translate(${dx}, ${dy})` : undefined}
              filter={laDangKeo ? 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.45))' : undefined}
            >
              <VeNet net={net} />
              {hop && (
                <g className="pointer-events-none">
                  <rect
                    x={hop.minX - 4}
                    y={hop.minY - 4}
                    width={hop.width + 8}
                    height={hop.height + 8}
                    fill={laDangKeo ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.08)'}
                    stroke="#38bdf8"
                    strokeWidth={laDangKeo ? 2 : 1.5}
                    strokeDasharray="4 4"
                    rx={4}
                  />
                  <rect x={hop.minX - 7} y={hop.minY - 7} width={6} height={6} fill="#38bdf8" rx={1} />
                  <rect x={hop.maxX + 1} y={hop.minY - 7} width={6} height={6} fill="#38bdf8" rx={1} />
                  <rect x={hop.minX - 7} y={hop.maxY + 1} width={6} height={6} fill="#38bdf8" rx={1} />
                  <rect x={hop.maxX + 1} y={hop.maxY + 1} width={6} height={6} fill="#38bdf8" rx={1} />
                </g>
              )}
            </g>
          )
        })}
        {xemTruoc}
      </svg>

      {oChu && (
        <textarea
          ref={oChuRef}
          value={chuDangGo}
          onChange={(e) => setChuDangGo(e.target.value)}
          onBlur={guiChu}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOChu(null)
              setChuDangGo('')
            } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              guiChu()
            }
          }}
          maxLength={500}
          rows={Math.max(1, chuDangGo.split(/\r?\n/).length)}
          aria-label="Nhập chữ lên bảng"
          className="pointer-events-auto absolute z-10 min-w-44 max-w-md resize-none rounded-md border border-white/30 bg-black/75 px-2 py-1 font-semibold outline-none leading-snug shadow-xl"
          style={{
            left: oChu.left,
            top: oChu.top,
            color: mau,
            fontSize: oChu.coChuPx ? `${oChu.coChuPx}px` : undefined,
            lineHeight: 1.25,
          }}
        />
      )}
    </div>
  )
}
