// Trình chiếu .pptx ngay trên trình duyệt (thư viện mã nguồn mở @aiden0z/pptx-renderer, Apache-2.0): mỗi máy tự dựng
// slide từ tệp của phòng, chỉ số trang + số cú bấm hiệu ứng được đồng bộ qua RoomDO — không cần máy chủ chuyển đổi.
// Thư viện chỉ dựng hình tĩnh; chuyển cảnh và hiệu ứng theo cú bấm đọc từ XML của slide (pptx-hieu-ung).

import { PptxViewer, RECOMMENDED_ZIP_LIMITS, buildPresentation, parseZip, type SlideNode } from '@aiden0z/pptx-renderer'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PptxSlideViewerProps } from './PptxSlideViewer'
import { docKichBanSlide, type KichBanSlide } from './pptx-hieu-ung'
import { DieuKhienHieuUng, banDoHinh, chayChuyenCanh } from './pptx-hieu-ung-dom'

interface BanTrinhChieu {
  viewer: PptxViewer
  /** Chỉ số slide (0-based) theo thứ tự trình chiếu, đã bỏ slide ẩn. */
  cacSlide: number[]
  kichBan: KichBanSlide[]
  hinh: SlideNode[][]
  tiLe: number
}

const KICH_BAN_TRONG: KichBanSlide = { tuDong: [], buoc: [], chuyenCanh: null }

const giamChuyenDong = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function PptxSlideViewerImpl({ docUrl, trang, buoc = 0, onSoTrang, onSoBuoc, onBamSlide, onLoi, children }: PptxSlideViewerProps) {
  const khungRef = useRef<HTMLDivElement>(null)
  const hopRef = useRef<HTMLDivElement>(null)
  /** Slide cũ được dời sang đây trong lúc chạy chuyển cảnh. */
  const lopCuRef = useRef<HTMLDivElement>(null)
  const banRef = useRef<BanTrinhChieu | null>(null)
  const luotDungRef = useRef(0)
  const dangDungRef = useRef(false)
  const slideDaDungRef = useRef<{ index: number; element: HTMLElement } | null>(null)
  const dieuKhienRef = useRef<DieuKhienHieuUng | null>(null)
  /** Trang (1-based, đã kẹp) + số cú bấm đang hiển thị. */
  const dangHienRef = useRef<{ viTri: number; buoc: number } | null>(null)
  const [ban, setBan] = useState<BanTrinhChieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [coHop, setCoHop] = useState({ rong: 0, cao: 0 })

  const onSoTrangRef = useRef(onSoTrang)
  const onSoBuocRef = useRef(onSoBuoc)
  const onLoiRef = useRef(onLoi)
  useEffect(() => {
    onSoTrangRef.current = onSoTrang
    onSoBuocRef.current = onSoBuoc
    onLoiRef.current = onLoi
  })

  // Gắn bộ điều khiển hiệu ứng cho slide vừa dựng; trạng thái đặt ngay (không hiệu ứng).
  const ganDieuKhien = (b: BanTrinhChieu, viTri: number, element: HTMLElement, soNhom: number) => {
    dieuKhienRef.current?.dung()
    const dk = new DieuKhienHieuUng(element, banDoHinh(element, b.hinh[viTri - 1] ?? []), b.kichBan[viTri - 1] ?? KICH_BAN_TRONG, giamChuyenDong())
    dk.datNhom(soNhom)
    dieuKhienRef.current = dk
    return dk
  }

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
      const kichBan = cacSlide.map((i) => {
        try {
          return docKichBanSlide(tep.slides.get(trinhChieu.slides[i].slidePath) ?? '')
        } catch {
          return KICH_BAN_TRONG
        }
      })
      viewer = new PptxViewer(hopRef.current, {
        fitMode: 'contain',
        pdfjs: false,
        onSlideRendered: (index, element) => {
          slideDaDungRef.current = { index, element }
          // Thư viện tự dựng lại khi khung đổi cỡ: gắn lại hiệu ứng, giữ đúng số cú bấm đang hiển thị.
          const b = banRef.current
          const dang = dangHienRef.current
          if (dangDungRef.current || !b || !dang || b.cacSlide[dang.viTri - 1] !== index) return
          ganDieuKhien(b, dang.viTri, element, dang.buoc + 1)
        },
      })
      viewer.load(trinhChieu)
      const moi: BanTrinhChieu = {
        viewer,
        cacSlide,
        kichBan,
        hinh: cacSlide.map((i) => trinhChieu.slides[i].nodes),
        tiLe: trinhChieu.width / trinhChieu.height || 16 / 9,
      }
      banRef.current = moi
      setBan(moi)
      onSoTrangRef.current?.(cacSlide.length)
      onSoBuocRef.current?.(kichBan.map((k) => k.buoc.length))
    })().catch((loi: unknown) => {
      if (huy.signal.aborted) return
      setDangTai(false)
      onLoiRef.current?.(loi instanceof Error ? loi : new Error(String(loi)))
    })
    return () => {
      huy.abort()
      banRef.current = null
      dangHienRef.current = null
      dieuKhienRef.current?.dung()
      dieuKhienRef.current = null
      lopCuRef.current?.replaceChildren()
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

  // 3. Đổi trang → dựng slide mới (có chuyển cảnh, rồi chạy phần tự động); cùng trang mà thêm một cú bấm → chạy hiệu ứng
  //    của cú bấm đó; nhảy nhiều bước / lùi → đặt ngay trạng thái. Đổi cỡ khung do thư viện tự dựng lại (onSlideRendered).
  const coKhung = coHop.rong > 0
  useEffect(() => {
    if (!ban || !coKhung) return
    const viTri = Math.min(Math.max(1, trang), ban.cacSlide.length)
    const kb = ban.kichBan[viTri - 1] ?? KICH_BAN_TRONG
    const buocThat = Math.min(Math.max(0, buoc), kb.buoc.length)
    const truoc = dangHienRef.current
    const dk = dieuKhienRef.current

    if (truoc && truoc.viTri === viTri && dk && !dangDungRef.current) {
      if (buocThat !== truoc.buoc) {
        if (buocThat === truoc.buoc + 1) dk.choiNhom(buocThat)
        else dk.datNhom(buocThat + 1)
        dangHienRef.current = { viTri, buoc: buocThat }
      }
      return
    }

    const doiTrang = truoc !== null && truoc.viTri !== viTri
    const hop = hopRef.current
    const lopCu = lopCuRef.current
    dangHienRef.current = { viTri, buoc: buocThat }
    dieuKhienRef.current?.dung()
    dieuKhienRef.current = null
    if (doiTrang && hop && lopCu && hop.firstElementChild && !giamChuyenDong()) lopCu.replaceChildren(hop.firstElementChild)
    else lopCu?.replaceChildren()

    const luot = ++luotDungRef.current
    const chiSo = ban.cacSlide[viTri - 1]
    dangDungRef.current = true
    slideDaDungRef.current = null
    ban.viewer
      .renderSlide(chiSo)
      .then(() => {
        if (luot !== luotDungRef.current) return
        dangDungRef.current = false
        setDangTai(false)
        const daDung = slideDaDungRef.current
        if (!daDung || daDung.index !== chiSo || !hop || !lopCu) {
          lopCu?.replaceChildren()
          return
        }
        // Vừa sang slide mới: ẩn các hình chờ hiệu ứng, chạy chuyển cảnh rồi tới phần tự chạy.
        const vaoMoi = doiTrang && buocThat === 0
        const dkMoi = ganDieuKhien(ban, viTri, daDung.element, vaoMoi ? 0 : buocThat + 1)
        const xongChuyenCanh = doiTrang ? chayChuyenCanh(hop, lopCu, kb.chuyenCanh, giamChuyenDong()) : Promise.resolve()
        void xongChuyenCanh.then(() => {
          if (luot !== luotDungRef.current) return
          lopCu.replaceChildren()
          if (vaoMoi && dieuKhienRef.current === dkMoi && dangHienRef.current?.buoc === 0) dkMoi.choiNhom(0)
        })
      })
      .catch((loi: unknown) => {
        if (luot !== luotDungRef.current) return
        dangDungRef.current = false
        setDangTai(false)
        onLoiRef.current?.(loi instanceof Error ? loi : new Error(String(loi)))
      })
  }, [ban, trang, buoc, coKhung])

  return (
    <div ref={khungRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className={`relative overflow-hidden bg-white shadow-2xl ${onBamSlide ? 'cursor-pointer' : ''}`}
        style={ban && coHop.rong > 0 ? { width: coHop.rong, height: coHop.cao } : { width: '100%', height: '100%' }}
        data-testid="pptx-slide-box"
        data-rendered-page={!dangTai && ban ? trang : ''}
        onClick={onBamSlide}
      >
        <div ref={lopCuRef} className="absolute inset-0 overflow-hidden" aria-hidden />
        <div ref={hopRef} className="absolute inset-0 overflow-hidden" />
        {ban && children}
      </div>
      {dangTai && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f18]/60">
          <Loader2 className="h-5 w-5 animate-spin text-brand" aria-label="Đang tải trình chiếu" />
        </div>
      )}
    </div>
  )
}
