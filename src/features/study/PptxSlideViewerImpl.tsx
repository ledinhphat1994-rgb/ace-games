// Trình chiếu .pptx ngay trên trình duyệt (thư viện mã nguồn mở @aiden0z/pptx-renderer, Apache-2.0): mỗi máy tự dựng
// slide từ tệp của phòng, chỉ số trang được đồng bộ qua RoomDO — không cần máy chủ chuyển đổi, không tốn phí.

import { PptxViewer, RECOMMENDED_ZIP_LIMITS, buildPresentation, parseZip } from '@aiden0z/pptx-renderer'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PptxSlideViewerProps } from './PptxSlideViewer'

interface BanTrinhChieu {
  viewer: PptxViewer
  /** Chỉ số slide (0-based) theo thứ tự trình chiếu, đã bỏ slide ẩn. */
  cacSlide: number[]
  tiLe: number
}

export function PptxSlideViewerImpl({ docUrl, trang, onSoTrang, onLoi, children }: PptxSlideViewerProps) {
  const khungRef = useRef<HTMLDivElement>(null)
  const hopRef = useRef<HTMLDivElement>(null)
  const banRef = useRef<BanTrinhChieu | null>(null)
  const luotDungRef = useRef(0)
  const [ban, setBan] = useState<BanTrinhChieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [coHop, setCoHop] = useState({ rong: 0, cao: 0 })

  const onSoTrangRef = useRef(onSoTrang)
  const onLoiRef = useRef(onLoi)
  useEffect(() => {
    onSoTrangRef.current = onSoTrang
    onLoiRef.current = onLoi
  })

  // 1. Tải + đọc tệp (một lần cho mỗi tài liệu).
  useEffect(() => {
    const huy = new AbortController()
    let viewer: PptxViewer | null = null
    setDangTai(true)
    setBan(null)
    ;(async () => {
      const res = await fetch(docUrl, { credentials: 'same-origin', signal: huy.signal })
      if (!res.ok) throw new Error(`Không tải được bản trình chiếu (${res.status}).`)
      const tep = await parseZip(await res.arrayBuffer(), RECOMMENDED_ZIP_LIMITS)
      if (huy.signal.aborted || !hopRef.current) return
      const trinhChieu = buildPresentation(tep)
      const khongAn = trinhChieu.slides.flatMap((s, i) => (s.hidden ? [] : [i]))
      const cacSlide = khongAn.length > 0 ? khongAn : trinhChieu.slides.map((_, i) => i)
      if (cacSlide.length === 0) throw new Error('Bản trình chiếu không có slide nào.')
      viewer = new PptxViewer(hopRef.current, { fitMode: 'contain', pdfjs: false })
      viewer.load(trinhChieu)
      const moi = { viewer, cacSlide, tiLe: trinhChieu.width / trinhChieu.height || 16 / 9 }
      banRef.current = moi
      setBan(moi)
      onSoTrangRef.current?.(cacSlide.length)
    })().catch((loi: unknown) => {
      if (huy.signal.aborted) return
      setDangTai(false)
      onLoiRef.current?.(loi instanceof Error ? loi : new Error(String(loi)))
    })
    return () => {
      huy.abort()
      banRef.current = null
      viewer?.destroy()
    }
  }, [docUrl])

  // 2. Khung slide giữ đúng tỉ lệ bản trình chiếu, vừa khít vùng hiển thị (lớp chú thích phủ đúng lên slide).
  useEffect(() => {
    const khung = khungRef.current
    if (!khung || !ban || typeof ResizeObserver === 'undefined') return
    const tinh = () => {
      const { width, height } = khung.getBoundingClientRect()
      if (width <= 0 || height <= 0) return
      const rong = Math.min(width, height * ban.tiLe)
      setCoHop({ rong: Math.floor(rong), cao: Math.floor(rong / ban.tiLe) })
    }
    tinh()
    const ro = new ResizeObserver(tinh)
    ro.observe(khung)
    return () => ro.disconnect()
  }, [ban])

  // 3. Dựng slide của trang đang trình chiếu (dựng lại khi đổi trang hoặc đổi cỡ khung); lượt mới nhất thắng.
  useEffect(() => {
    if (!ban || coHop.rong <= 0) return
    const chiSo = ban.cacSlide[Math.min(Math.max(1, trang), ban.cacSlide.length) - 1]
    const luot = ++luotDungRef.current
    ban.viewer
      .renderSlide(chiSo)
      .then(() => {
        if (luot === luotDungRef.current) setDangTai(false)
      })
      .catch((loi: unknown) => {
        if (luot !== luotDungRef.current) return
        setDangTai(false)
        onLoiRef.current?.(loi instanceof Error ? loi : new Error(String(loi)))
      })
  }, [ban, trang, coHop.rong, coHop.cao])

  return (
    <div ref={khungRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="relative overflow-hidden bg-white shadow-2xl"
        style={ban && coHop.rong > 0 ? { width: coHop.rong, height: coHop.cao } : { width: '100%', height: '100%' }}
        data-testid="pptx-slide-box"
        data-rendered-page={!dangTai && ban ? trang : ''}
      >
        <div ref={hopRef} className="absolute inset-0 overflow-hidden" />
        {ban && children}
      </div>
      {dangTai && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f18]/60">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-400" aria-label="Đang tải trình chiếu" />
        </div>
      )}
    </div>
  )
}
