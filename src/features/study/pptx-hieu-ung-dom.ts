// Chạy hiệu ứng PowerPoint trên slide đã dựng (Web Animations API). Dùng thuộc tính translate / scale / rotate riêng lẻ
// nên không đè transform (xoay, lật) mà trình dựng đã đặt cho từng hình; hết hiệu ứng thì huỷ, chỉ giữ trạng thái cuối.

import type { SlideNode } from '@aiden0z/pptx-renderer'
import {
  apDung,
  khoaDich,
  nhomThu,
  trangThaiSauNhom,
  type ChuyenCanh,
  type HieuUng,
  type KichBanSlide,
  type TrangThaiDich,
} from './pptx-hieu-ung'

type NutXmlThuVien = SlideNode['source']

const LOAI_HINH = new Set(['sp', 'pic', 'grpSp', 'graphicFrame', 'cxnSp'])

function idTuXml(x: NutXmlThuVien): string | undefined {
  for (const c of x.allChildren()) {
    if (c.localName.startsWith('nv')) {
      const id = c.child('cNvPr').attr('id')
      if (id) return id
    }
  }
  return undefined
}

/** Phần tử chứa đúng `soCon` phần tử con (vỏ nhóm có thể lồng vài lớp div). */
function timHopCon(goc: HTMLElement, soCon: number): HTMLElement | undefined {
  const hang: { el: HTMLElement; sau: number }[] = [{ el: goc, sau: 0 }]
  while (hang.length > 0) {
    const { el, sau } = hang.shift()!
    if (el.children.length === soCon) return el
    if (sau < 4) for (const c of Array.from(el.children)) hang.push({ el: c as HTMLElement, sau: sau + 1 })
  }
  return undefined
}

function ganNhom(banDo: Map<string, HTMLElement>, el: HTMLElement, conXml: NutXmlThuVien[]) {
  const hop = timHopCon(el, conXml.length)
  if (!hop) return
  conXml.forEach((x, i) => {
    const elCon = hop.children[i] as HTMLElement | undefined
    const id = idTuXml(x)
    if (!elCon || !id) return
    banDo.set(id, elCon)
    if (x.localName === 'grpSp') ganNhom(banDo, elCon, x.allChildren().filter((c) => LOAI_HINH.has(c.localName)))
  })
}

/**
 * Id hình → phần tử DOM. Trình dựng gắn nền, hình của master, layout rồi mới tới từng hình của slide theo đúng thứ tự
 * `slide.nodes` (mỗi hình đúng một phần tử) — nên các phần tử cuối cùng của slide ứng với `nodes`.
 */
export function banDoHinh(slideEl: HTMLElement, nodes: SlideNode[]): Map<string, HTMLElement> {
  const banDo = new Map<string, HTMLElement>()
  const ds = Array.from(slideEl.children) as HTMLElement[]
  const dau = ds.length - nodes.length
  if (dau < 0) return banDo
  nodes.forEach((n, i) => {
    const el = ds[dau + i]
    banDo.set(n.id, el)
    if (n.nodeType === 'group') ganNhom(banDo, el, n.children)
  })
  return banDo
}

/** Đoạn văn thứ `doan` của hình: trình dựng tạo mỗi đoạn một div rộng 100% trong cùng một hộp chữ. */
function timDoanVan(hinh: HTMLElement, doan: number): HTMLElement | undefined {
  const hang: HTMLElement[] = [hinh]
  while (hang.length > 0) {
    const el = hang.shift()!
    const con = Array.from(el.children) as HTMLElement[]
    if (con.length > 0 && con.every((c) => c.tagName === 'DIV' && c.style.width === '100%' && c.style.boxSizing === 'border-box')) {
      return con[doan]
    }
    hang.push(...con)
  }
  return undefined
}

const HANG_KHONG = { x: 0, y: 0 }

export class DieuKhienHieuUng {
  private readonly phanTu = new Map<string, HTMLElement | null>()
  private dangChay: Animation[] = []
  private readonly rong: number
  private readonly cao: number
  private readonly banDo: Map<string, HTMLElement>
  private readonly kb: KichBanSlide
  private readonly giamChuyenDong: boolean

  constructor(slideEl: HTMLElement, banDo: Map<string, HTMLElement>, kb: KichBanSlide, giamChuyenDong: boolean) {
    this.banDo = banDo
    this.kb = kb
    this.giamChuyenDong = giamChuyenDong
    this.rong = parseFloat(slideEl.style.width) || slideEl.offsetWidth || 960
    this.cao = parseFloat(slideEl.style.height) || slideEl.offsetHeight || 540
  }

  private tim(khoa: string): HTMLElement | undefined {
    if (this.phanTu.has(khoa)) return this.phanTu.get(khoa) ?? undefined
    const [spid, doan] = khoa.split('#')
    let el = this.banDo.get(spid)
    if (el && doan !== undefined) el = timDoanVan(el, Number(doan))
    this.phanTu.set(khoa, el ?? null)
    return el
  }

  private dich(d: { x: number; y: number }): string {
    return `${d.x * this.rong}px ${d.y * this.cao}px`
  }

  private datMot(el: HTMLElement, tt: TrangThaiDich) {
    el.style.visibility = tt.hien ? '' : 'hidden'
    el.style.translate = tt.doi.x || tt.doi.y ? this.dich(tt.doi) : ''
  }

  dung() {
    for (const a of this.dangChay) a.cancel()
    this.dangChay = []
  }

  /** Đặt ngay trạng thái sau `soNhom` nhóm (không hiệu ứng). */
  datNhom(soNhom: number) {
    this.dung()
    for (const [khoa, tt] of trangThaiSauNhom(this.kb, soNhom)) {
      const el = this.tim(khoa)
      if (el) this.datMot(el, tt)
    }
  }

  /** Chạy nhóm thứ `i` (0: tự chạy khi vào slide, k: cú bấm thứ k) từ trạng thái ngay trước nhóm đó. */
  choiNhom(i: number) {
    this.datNhom(i)
    if (this.giamChuyenDong || typeof Element.prototype.animate !== 'function') {
      this.datNhom(i + 1)
      return
    }
    const tt = trangThaiSauNhom(this.kb, i)
    for (const h of nhomThu(this.kb, i)) {
      const khoa = khoaDich(h)
      const truoc = tt.get(khoa) ?? { hien: true, doi: HANG_KHONG }
      apDung(tt, h)
      const sau = tt.get(khoa) ?? truoc
      const el = this.tim(khoa)
      if (el) this.hoatHinh(el, h, truoc, sau)
    }
  }

  private hoatHinh(el: HTMLElement, h: HieuUng, truoc: TrangThaiDich, sau: TrangThaiDich) {
    const goc = this.dich(truoc.doi)
    const thoiLuong = Math.max(h.thoiLuong, 1)
    let khung: Keyframe[]
    let easing = 'ease-in-out'
    if (h.loai === 'nhan') {
      khung = h.kieu === 'quay' ? [{ rotate: '0deg' }, { rotate: '360deg' }] : [{ scale: '1' }, { scale: '1.12' }, { scale: '1' }]
    } else if (h.loai === 'duong') {
      khung = [{ translate: goc }, { translate: this.dich(sau.doi) }]
    } else {
      khung = this.khungVao(h, goc)
      easing = h.loai === 'vao' ? 'ease-out' : 'ease-in'
      if (h.loai === 'ra') khung = [...khung].reverse()
    }
    if (h.loai === 'vao') el.style.visibility = ''
    const hoat = el.animate(khung, {
      duration: h.kieu === 'xuat_hien' ? 1 : thoiLuong,
      delay: h.batDau,
      easing,
      // Hình sắp "vào" giữ khung đầu (ẩn) trong lúc chờ tới lượt.
      fill: h.loai === 'vao' ? 'backwards' : 'none',
    })
    this.dangChay.push(hoat)
    hoat.onfinish = () => {
      this.datMot(el, sau)
      hoat.cancel()
    }
  }

  /** Khung hình của hiệu ứng "vào" (hiệu ứng "ra" dùng ngược lại). Khung đầu luôn là lúc chưa thấy hình. */
  private khungVao(h: HieuUng, goc: string): Keyframe[] {
    const { x, y } = h.huong
    const lech = (dx: number, dy: number) =>
      `calc(${goc.split(' ')[0]} + ${dx}px) calc(${goc.split(' ')[1] ?? '0px'} + ${dy}px)`
    switch (h.kieu) {
      case 'xuat_hien':
        return [{ opacity: 0 }, { opacity: 0 }]
      case 'bay':
        return [{ translate: lech(x * this.rong, y * this.cao) }, { translate: goc }]
      case 'quet': {
        // Hướng "từ" đâu: từ dưới → lộ dần từ mép dưới lên.
        const batDau =
          y > 0 ? 'inset(100% 0 0 0)' : y < 0 ? 'inset(0 0 100% 0)' : x > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)'
        return [{ clipPath: batDau }, { clipPath: 'inset(0 0 0 0)' }]
      }
      case 'phong':
        return [
          { scale: '0.3', opacity: 0 },
          { scale: '1', opacity: 1 },
        ]
      case 'noi':
        return [
          { translate: lech(0, y * this.cao * 0.1), opacity: 0 },
          { translate: goc, opacity: 1 },
        ]
      case 'xoay':
        return [
          { rotate: '-360deg', scale: '0.5', opacity: 0 },
          { rotate: '0deg', scale: '1', opacity: 1 },
        ]
      case 'nay':
        return [
          { translate: lech(0, -this.cao * 0.3), opacity: 0 },
          { translate: goc, opacity: 1, offset: 0.4 },
          { translate: lech(0, -this.cao * 0.08), offset: 0.6 },
          { translate: goc, offset: 0.8 },
          { translate: lech(0, -this.cao * 0.02), offset: 0.9 },
          { translate: goc },
        ]
      default:
        return [{ opacity: 0 }, { opacity: 1 }]
    }
  }
}

/**
 * Chuyển cảnh giữa slide cũ (`cu`, đã dời ra lớp riêng) và slide mới (`moi`). Xong thì resolve để dọn slide cũ.
 * Hướng `huong` là hướng chuyển động: slide mới đi vào từ phía ngược lại.
 */
export function chayChuyenCanh(moi: HTMLElement, cu: HTMLElement, cc: ChuyenCanh | null, giamChuyenDong: boolean): Promise<void> {
  if (!cc || cc.kieu === 'cat' || cc.thoiLuong <= 0 || giamChuyenDong || typeof moi.animate !== 'function') {
    return Promise.resolve()
  }
  const { x, y } = cc.huong
  const tuyChon: KeyframeAnimationOptions = { duration: cc.thoiLuong, easing: 'ease-in-out' }
  const vao = `${-x * 100}% ${-y * 100}%`
  const ra = `${x * 100}% ${y * 100}%`
  const cacHoat: Animation[] = []
  switch (cc.kieu) {
    case 'day':
      cacHoat.push(moi.animate([{ translate: vao }, { translate: '0 0' }], tuyChon))
      cacHoat.push(cu.animate([{ translate: '0 0' }, { translate: ra }], tuyChon))
      break
    case 'phu':
      cacHoat.push(moi.animate([{ translate: vao }, { translate: '0 0' }], tuyChon))
      break
    case 'keo':
      cu.style.zIndex = '1'
      cacHoat.push(cu.animate([{ translate: '0 0' }, { translate: ra }], tuyChon))
      break
    case 'quet': {
      const batDau =
        x < 0 ? 'inset(0 0 0 100%)' : x > 0 ? 'inset(0 100% 0 0)' : y < 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)'
      cacHoat.push(moi.animate([{ clipPath: batDau }, { clipPath: 'inset(0 0 0 0)' }], tuyChon))
      break
    }
    case 'tach':
      cacHoat.push(
        moi.animate([{ clipPath: cc.doc ? 'inset(0 50% 0 50%)' : 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0 0 0 0)' }], tuyChon),
      )
      break
    case 'phong':
      if (cc.ra) {
        cu.style.zIndex = '1'
        cacHoat.push(cu.animate([{ scale: '1', opacity: 1 }, { scale: '1.4', opacity: 0 }], tuyChon))
      } else {
        cacHoat.push(moi.animate([{ scale: '0.3', opacity: 0 }, { scale: '1', opacity: 1 }], tuyChon))
      }
      break
    default:
      cacHoat.push(moi.animate([{ opacity: 0 }, { opacity: 1 }], tuyChon))
  }
  return Promise.allSettled(cacHoat.map((a) => a.finished)).then(() => {
    cu.style.zIndex = ''
  })
}
