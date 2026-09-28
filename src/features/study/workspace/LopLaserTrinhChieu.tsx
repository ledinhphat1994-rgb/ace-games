// Tia laser của người trình chiếu trên video / bảng / tài liệu nhúng: rê chuột tới đâu, cả phòng thấy chấm đỏ ở đó.
// Toạ độ 0..1 tính trong vùng nội dung (video, bảng là khung 16:9 căn giữa) nên khớp giữa các màn hình khác cỡ.
// Trang PDF / ảnh / .pptx dùng laser theo trang của lớp chú thích.

import type { LopLaser } from '@shared/protocol/room'
import { useEffect, useRef, useState } from 'react'

export interface TiaLaser {
  lop: LopLaser
  point: [number, number] | null
  senderName?: string
  updatedAt: number
}

interface LopLaserTrinhChieuProps {
  lop: LopLaser
  /** Người trình chiếu đang chọn công cụ laser: lớp này nhận chuột. */
  dangChieu: boolean
  laser?: TiaLaser | null
  onSend?: (lop: LopLaser, point: [number, number] | null) => void
  /** Tỉ lệ khung nội dung (rộng / cao); bỏ trống = cả vùng. */
  tiLe?: number
}

/** Tia laser của người khác tự tắt khi không còn nhận gói mới (người trình chiếu dừng tay / rời vùng). */
const TAT_SAU_MS = 2000
const NHIP_GUI_MS = 33
/** Đứng yên chỉ vào một chỗ: gửi lại định kỳ để tia bên máy khác không tự tắt. */
const GIU_TIA_MS = 1000

function vungNoiDung(rong: number, cao: number, tiLe?: number) {
  if (!tiLe || rong <= 0 || cao <= 0) return { trai: 0, tren: 0, rong, cao }
  const r = Math.min(rong, cao * tiLe)
  const c = r / tiLe
  return { trai: (rong - r) / 2, tren: (cao - c) / 2, rong: r, cao: c }
}

function ChamLaser({ trai, tren, ten }: { trai: number; tren: number; ten?: string }) {
  return (
    <div className="pointer-events-none absolute z-20" style={{ left: trai, top: tren }}>
      <span className="absolute -left-4 -top-4 h-8 w-8 animate-ping rounded-full bg-red-500/40" />
      <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow-[0_0_14px_5px_rgba(239,68,68,0.75)]" />
      {ten && (
        <span className="absolute left-3.5 -top-7 whitespace-nowrap rounded-md border border-red-400/60 bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-bold text-red-100">
          {ten}
        </span>
      )}
    </div>
  )
}

export function LopLaserTrinhChieu({ lop, dangChieu, laser, onSend, tiLe }: LopLaserTrinhChieuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [co, setCo] = useState({ rong: 0, cao: 0 })
  const [cuaToi, setCuaToi] = useState<[number, number] | null>(null)
  const [hetHan, setHetHan] = useState<number | null>(null)
  const lanGuiRef = useRef(0)
  const dangGuiRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([muc]) => setCo({ rong: muc.contentRect.width, cao: muc.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Tia của người khác: tự tắt sau một lúc không có gói mới.
  const capNhat = laser?.lop === lop && laser.point ? laser.updatedAt : null
  useEffect(() => {
    if (capNhat === null) return
    const hen = setTimeout(() => setHetHan(capNhat), TAT_SAU_MS)
    return () => clearTimeout(hen)
  }, [capNhat])

  // Đứng yên chỉ vào một chỗ (không có pointermove): gửi lại định kỳ.
  useEffect(() => {
    if (!dangChieu || !cuaToi) return
    const hen = setInterval(() => {
      lanGuiRef.current = Date.now()
      onSend?.(lop, cuaToi)
    }, GIU_TIA_MS)
    return () => clearInterval(hen)
  }, [dangChieu, cuaToi, lop, onSend])

  // Thôi chọn laser: tắt tia của mình ở máy khác.
  useEffect(() => {
    if (dangChieu || !dangGuiRef.current) return
    dangGuiRef.current = false
    setCuaToi(null)
    onSend?.(lop, null)
  }, [dangChieu, lop, onSend])

  const vung = vungNoiDung(co.rong, co.cao, tiLe)

  const tat = () => {
    setCuaToi(null)
    if (dangGuiRef.current) {
      dangGuiRef.current = false
      onSend?.(lop, null)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dangChieu) return
    const r = e.currentTarget.getBoundingClientRect()
    const v = vungNoiDung(r.width, r.height, tiLe)
    const x = (e.clientX - r.left - v.trai) / v.rong
    const y = (e.clientY - r.top - v.tren) / v.cao
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) {
      tat()
      return
    }
    const diem: [number, number] = [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000]
    setCuaToi(diem)
    const bayGio = Date.now()
    if (bayGio - lanGuiRef.current >= NHIP_GUI_MS) {
      lanGuiRef.current = bayGio
      dangGuiRef.current = true
      onSend?.(lop, diem)
    }
  }

  const tiaKhac = laser?.lop === lop && laser.point && hetHan !== laser.updatedAt ? laser : null

  return (
    <div
      ref={ref}
      className={`absolute inset-0 z-[16] ${dangChieu ? 'pointer-events-auto cursor-none' : 'pointer-events-none'}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={tat}
      data-testid={`laser-${lop}`}
    >
      {dangChieu && cuaToi && <ChamLaser trai={vung.trai + cuaToi[0] * vung.rong} tren={vung.tren + cuaToi[1] * vung.cao} />}
      {!dangChieu && tiaKhac?.point && (
        <ChamLaser
          trai={vung.trai + tiaKhac.point[0] * vung.rong}
          tren={vung.tren + tiaKhac.point[1] * vung.cao}
          ten={tiaKhac.senderName}
        />
      )}
    </div>
  )
}
