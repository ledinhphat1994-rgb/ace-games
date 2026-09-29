// Tia laser trên sân khấu (video / bảng / tài liệu nhúng / trang tài liệu): rê chuột tới đâu, cả phòng thấy chấm đỏ ở đó.
// Mượt ở cả hai phía:
// - Người trỏ: chấm của mình đặt thẳng vào DOM theo từng pointermove (không chờ React render, không chờ vòng mạng).
// - Người xem: gói tới ~30 lần/giây; chấm trượt tới vị trí mới bằng nội suy requestAnimationFrame thay vì nhảy cóc.
// Toạ độ 0..1 trong vùng nội dung (video, bảng: khung 16:9 căn giữa) nên khớp giữa các màn hình khác cỡ.
// Nhiều người được cấp laser trỏ cùng lúc: mỗi người một chấm kèm tên.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface TiaLaser {
  senderKey: string
  point: [number, number]
  senderName?: string
  /** Lúc nhận gói gần nhất (ms, đồng hồ máy này). */
  updatedAt: number
}

interface LopTiaLaserProps {
  /** Tôi đang chọn công cụ laser và có quyền: lớp này nhận chuột. */
  dangChieu: boolean
  /** Tia của người khác trên đúng lớp / trang này. */
  tiaKhac: TiaLaser[]
  onSend?: (point: [number, number] | null) => void
  /** Tỉ lệ khung nội dung (rộng / cao); bỏ trống = cả vùng. */
  tiLe?: number
  testId?: string
}

/** Tia của người khác tự tắt khi không còn nhận gói mới (người trỏ dừng tay / rời vùng / mất mạng). */
export const TAT_SAU_MS = 2000
const NHIP_GUI_MS = 33
/** Đứng yên chỉ vào một chỗ: gửi lại định kỳ để tia bên máy khác không tự tắt. */
const GIU_TIA_MS = 1000
/** Mỗi khung hình đi thêm 35% quãng còn lại tới đích: bắt kịp trong ~100 ms mà không giật. */
const HE_SO_TRUOT = 0.35

function vungNoiDung(rong: number, cao: number, tiLe?: number) {
  if (!tiLe || rong <= 0 || cao <= 0) return { trai: 0, tren: 0, rong, cao }
  const r = Math.min(rong, cao * tiLe)
  const c = r / tiLe
  return { trai: (rong - r) / 2, tren: (cao - c) / 2, rong: r, cao: c }
}

const lamTron = (v: number) => Math.round(v * 10000) / 10000

function HinhCham({ ten }: { ten?: string }) {
  return (
    <>
      <span className="absolute -left-4 -top-4 h-8 w-8 animate-ping rounded-full bg-red-500/40" />
      <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow-[0_0_14px_5px_rgba(239,68,68,0.75)]" />
      {ten && (
        <span className="absolute left-3.5 -top-7 whitespace-nowrap rounded-md border border-red-400/60 bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-bold text-red-100">
          {ten}
        </span>
      )}
    </>
  )
}

/** Chấm của người khác: trượt tới đích bằng requestAnimationFrame, ghi thẳng transform (không render lại React mỗi khung). */
function ChamLaserXa({ x, y, ten }: { x: number; y: number; ten?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const viTriRef = useRef<[number, number] | null>(null)
  const dichRef = useRef<[number, number]>([x, y])
  const rafRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    dichRef.current = [x, y]
    const el = ref.current
    if (!el) return
    // Lần đầu hiện: đặt ngay đúng chỗ, không trượt từ góc trái.
    if (!viTriRef.current) {
      viTriRef.current = [x, y]
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      return
    }
    if (rafRef.current !== null) return
    const buoc = () => {
      const [dx, dy] = dichRef.current
      const [cx, cy] = viTriRef.current ?? [dx, dy]
      const nx = cx + (dx - cx) * HE_SO_TRUOT
      const ny = cy + (dy - cy) * HE_SO_TRUOT
      const xong = Math.abs(dx - nx) < 0.5 && Math.abs(dy - ny) < 0.5
      viTriRef.current = xong ? [dx, dy] : [nx, ny]
      el.style.transform = `translate3d(${viTriRef.current[0]}px, ${viTriRef.current[1]}px, 0)`
      rafRef.current = xong ? null : requestAnimationFrame(buoc)
    }
    rafRef.current = requestAnimationFrame(buoc)
  }, [x, y])

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    },
    [],
  )

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 z-20 will-change-transform" data-testid="laser-cham-xa">
      <HinhCham ten={ten} />
    </div>
  )
}

export function LopTiaLaser({ dangChieu, tiaKhac, onSend, tiLe, testId }: LopTiaLaserProps) {
  const ref = useRef<HTMLDivElement>(null)
  const chamRef = useRef<HTMLDivElement>(null)
  const [co, setCo] = useState({ rong: 0, cao: 0 })
  const [bayGio, setBayGio] = useState(() => Date.now())
  const diemRef = useRef<[number, number] | null>(null)
  const lanGuiRef = useRef(0)
  const dangGuiRef = useRef(false)
  const henGuiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSendRef = useRef(onSend)
  useEffect(() => {
    onSendRef.current = onSend
  })

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([muc]) => setCo({ rong: muc.contentRect.width, cao: muc.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Tia người khác hết hạn: đồng hồ nhỏ chỉ chạy khi đang có tia.
  const coTia = tiaKhac.length > 0
  useEffect(() => {
    if (!coTia) return
    setBayGio(Date.now())
    const hen = setInterval(() => setBayGio(Date.now()), 400)
    return () => clearInterval(hen)
  }, [coTia])

  const gui = (diem: [number, number] | null) => {
    lanGuiRef.current = Date.now()
    dangGuiRef.current = diem !== null
    onSendRef.current?.(diem)
  }

  const tat = () => {
    diemRef.current = null
    if (henGuiRef.current) clearTimeout(henGuiRef.current)
    henGuiRef.current = null
    if (chamRef.current) chamRef.current.style.opacity = '0'
    if (dangGuiRef.current) gui(null)
  }

  // Đứng yên chỉ vào một chỗ (không có pointermove): gửi lại định kỳ để máy khác không tự tắt tia.
  useEffect(() => {
    if (!dangChieu) return
    const hen = setInterval(() => {
      const diem = diemRef.current
      if (!diem) return
      lanGuiRef.current = Date.now()
      dangGuiRef.current = true
      onSendRef.current?.(diem)
    }, GIU_TIA_MS)
    return () => clearInterval(hen)
  }, [dangChieu])

  // Thôi chọn laser (hoặc rời sân khấu): tắt tia của mình ở máy khác.
  useEffect(() => {
    if (dangChieu) return
    diemRef.current = null
    if (chamRef.current) chamRef.current.style.opacity = '0'
    if (dangGuiRef.current) {
      dangGuiRef.current = false
      onSendRef.current?.(null)
    }
  }, [dangChieu])
  useEffect(
    () => () => {
      if (henGuiRef.current) clearTimeout(henGuiRef.current)
      if (dangGuiRef.current) onSendRef.current?.(null)
    },
    [],
  )

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dangChieu) return
    const r = e.currentTarget.getBoundingClientRect()
    const v = vungNoiDung(r.width, r.height, tiLe)
    const px = e.clientX - r.left
    const py = e.clientY - r.top
    const x = (px - v.trai) / v.rong
    const y = (py - v.tren) / v.cao
    if (!(x >= 0 && x <= 1 && y >= 0 && y <= 1)) {
      tat()
      return
    }
    // Chấm của mình: ghi thẳng vào DOM, bám con trỏ từng khung hình.
    const el = chamRef.current
    if (el) {
      el.style.transform = `translate3d(${px}px, ${py}px, 0)`
      el.style.opacity = '1'
    }
    const diem: [number, number] = [lamTron(x), lamTron(y)]
    diemRef.current = diem
    const conCho = NHIP_GUI_MS - (Date.now() - lanGuiRef.current)
    if (conCho <= 0) {
      gui(diem)
      return
    }
    // Gói bị giãn nhịp vẫn đi sau đó: dừng tay giữa hai nhịp thì máy khác vẫn tới đúng điểm cuối.
    henGuiRef.current ??= setTimeout(() => {
      henGuiRef.current = null
      if (diemRef.current) gui(diemRef.current)
    }, conCho)
  }

  const vung = vungNoiDung(co.rong, co.cao, tiLe)
  const dangHien = tiaKhac.filter((t) => bayGio - t.updatedAt < TAT_SAU_MS)

  return (
    <div
      ref={ref}
      className={`absolute inset-0 z-[16] ${dangChieu ? 'pointer-events-auto cursor-none touch-none' : 'pointer-events-none'}`}
      onPointerDown={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerLeave={tat}
      onPointerCancel={tat}
      data-testid={testId}
    >
      <div ref={chamRef} className="pointer-events-none absolute left-0 top-0 z-20 opacity-0 will-change-transform" data-testid="laser-cham-cua-toi">
        <HinhCham />
      </div>
      {dangHien.map((t) => (
        <ChamLaserXa
          key={t.senderKey}
          x={vung.trai + t.point[0] * vung.rong}
          y={vung.tren + t.point[1] * vung.cao}
          ten={t.senderName}
        />
      ))}
    </div>
  )
}
