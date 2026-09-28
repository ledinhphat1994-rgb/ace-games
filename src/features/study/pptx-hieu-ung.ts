// Hiệu ứng PowerPoint cho .pptx dựng trên trình duyệt: đọc chuyển cảnh (p:transition) và chuỗi hiệu ứng theo cú bấm
// (p:timing → mainSeq) từ XML của slide. Phần thuần (không đụng DOM) để máy chủ test và mọi máy tính ra cùng một kết quả.

export interface NutXml {
  /** Tên cục bộ (bỏ tiền tố namespace: `p:par` → `par`). */
  ten: string
  tt: Record<string, string>
  con: NutXml[]
}

const THE_XML =
  /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<![^>]*>|<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g
const THUOC_TINH = /([\w.:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g

const tenCucBo = (ten: string) => ten.slice(ten.indexOf(':') + 1)

function giaiMa(s: string): string {
  return s.replace(/&(lt|gt|amp|quot|apos);/g, (_, k: string) => ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" })[k] ?? _)
}

/** Bộ đọc XML tối giản (chỉ thẻ + thuộc tính, bỏ chữ) — đủ cho phần hiệu ứng của slide, chạy được cả ngoài trình duyệt. */
export function docXml(xml: string): NutXml {
  const goc: NutXml = { ten: '#goc', tt: {}, con: [] }
  const ngan: NutXml[] = [goc]
  THE_XML.lastIndex = 0
  for (let m = THE_XML.exec(xml); m; m = THE_XML.exec(xml)) {
    const ten = m[2]
    if (!ten) continue
    if (m[1]) {
      const cucBo = tenCucBo(ten)
      for (let i = ngan.length - 1; i > 0; i--) {
        if (ngan[i].ten === cucBo) {
          ngan.length = i
          break
        }
      }
      continue
    }
    const tt: Record<string, string> = {}
    THUOC_TINH.lastIndex = 0
    for (let a = THUOC_TINH.exec(m[3]); a; a = THUOC_TINH.exec(m[3])) tt[tenCucBo(a[1])] = giaiMa(a[2] ?? a[3] ?? '')
    const nut: NutXml = { ten: tenCucBo(ten), tt, con: [] }
    ngan[ngan.length - 1].con.push(nut)
    if (!m[4]) ngan.push(nut)
  }
  return goc
}

const con = (n: NutXml | undefined, ten: string) => n?.con.find((c) => c.ten === ten)
const cacCon = (n: NutXml | undefined, ten: string) => n?.con.filter((c) => c.ten === ten) ?? []

function timDau(n: NutXml, ten: string): NutXml | undefined {
  for (const c of n.con) {
    if (c.ten === ten) return c
    const sau = timDau(c, ten)
    if (sau) return sau
  }
  return undefined
}

function timHet(n: NutXml, ten: string, ra: NutXml[] = []): NutXml[] {
  for (const c of n.con) {
    if (c.ten === ten) ra.push(c)
    timHet(c, ten, ra)
  }
  return ra
}

const soMs = (v: string | undefined) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

// ── Chuyển cảnh ──────────────────────────────────────────────────────────────

export type KieuChuyenCanh = 'cat' | 'mo_dan' | 'day' | 'quet' | 'phu' | 'keo' | 'tach' | 'phong'

export interface ChuyenCanh {
  kieu: KieuChuyenCanh
  /** Hướng chuyển động của slide (x, y ∈ −1..1): day/phu/keo/quet. */
  huong: { x: number; y: number }
  /** tach: dọc hay ngang; phong: vào hay ra. */
  doc?: boolean
  ra?: boolean
  thoiLuong: number
}

const KIEU_CHUYEN_CANH: Record<string, KieuChuyenCanh> = {
  cut: 'cat',
  fade: 'mo_dan',
  dissolve: 'mo_dan',
  push: 'day',
  pan: 'day',
  conveyor: 'day',
  ferris: 'day',
  gallery: 'day',
  wipe: 'quet',
  cover: 'phu',
  pull: 'keo',
  split: 'tach',
  doors: 'tach',
  window: 'tach',
  zoom: 'phong',
  flythrough: 'phong',
  warp: 'phong',
}

const HUONG_CHU: Record<string, { x: number; y: number }> = {
  l: { x: -1, y: 0 },
  r: { x: 1, y: 0 },
  u: { x: 0, y: -1 },
  d: { x: 0, y: 1 },
  lu: { x: -1, y: -1 },
  ru: { x: 1, y: -1 },
  ld: { x: -1, y: 1 },
  rd: { x: 1, y: 1 },
}

const TOC_DO: Record<string, number> = { fast: 500, med: 750, slow: 1000 }

function docChuyenCanh(goc: NutXml): ChuyenCanh | null {
  const cacTransition = timHet(goc, 'transition')
  if (cacTransition.length === 0) return null
  // mc:Choice (p14) đứng trước mc:Fallback: lấy kiểu đầu tiên hiểu được, thời lượng từ p14:dur nếu có.
  let kieu: KieuChuyenCanh | null = null
  let nutKieu: NutXml | undefined
  let coHieuUng = false
  for (const t of cacTransition) {
    for (const c of t.con) {
      if (c.ten === 'sndAc' || c.ten === 'extLst') continue
      coHieuUng = true
      const k = KIEU_CHUYEN_CANH[c.ten]
      if (k && !kieu) {
        kieu = k
        nutKieu = c
      }
    }
  }
  if (!coHieuUng) return null
  const t0 = cacTransition[0]
  const thoiLuong = t0.tt.dur ? soMs(t0.tt.dur) : (TOC_DO[t0.tt.spd ?? 'fast'] ?? 500)
  const tt = nutKieu?.tt ?? {}
  return {
    kieu: kieu ?? 'mo_dan',
    // Mặc định theo PowerPoint: đẩy / quét / phủ / kéo đi sang trái.
    huong: HUONG_CHU[tt.dir ?? 'l'] ?? HUONG_CHU.l,
    doc: tt.orient === 'vert' || tt.dir === 'vert',
    ra: tt.dir === 'out',
    thoiLuong: Math.min(Math.max(thoiLuong, 0), 5000),
  }
}

// ── Hiệu ứng theo cú bấm ─────────────────────────────────────────────────────

export type LoaiHieuUng = 'vao' | 'ra' | 'nhan' | 'duong'
export type KieuHieuUng = 'xuat_hien' | 'mo_dan' | 'bay' | 'quet' | 'phong' | 'noi' | 'xoay' | 'nay' | 'nhip' | 'quay'

export interface HieuUng {
  /** Id hình (cNvPr id). */
  spid: string
  /** Chỉ số đoạn văn trong hình (hiện từng dòng chữ); không có = cả hình. */
  doan?: number
  loai: LoaiHieuUng
  kieu: KieuHieuUng
  /** vao: hướng bay tới từ đâu; ra: hướng bay đi; (x, y ∈ −1..1). */
  huong: { x: number; y: number }
  /** Tính từ lúc bấm (ms). */
  batDau: number
  thoiLuong: number
  /** duong: độ dời cuối (tỉ lệ theo khổ slide). */
  doi?: { x: number; y: number }
}

export interface KichBanSlide {
  /** Tự chạy khi vào slide (hiệu ứng đầu tiên đặt "With/After Previous"). */
  tuDong: HieuUng[]
  /** Mỗi phần tử là một cú bấm. */
  buoc: HieuUng[][]
  chuyenCanh: ChuyenCanh | null
}

// presetID của PowerPoint → kiểu chuyển động gần đúng (vào / ra dùng chung bảng).
const KIEU_VAO_RA: Record<number, KieuHieuUng> = {
  1: 'xuat_hien',
  2: 'bay',
  7: 'bay',
  12: 'bay',
  29: 'bay',
  34: 'bay',
  38: 'bay',
  41: 'bay',
  48: 'bay',
  52: 'bay',
  3: 'quet',
  4: 'quet',
  5: 'quet',
  6: 'quet',
  8: 'quet',
  13: 'quet',
  14: 'quet',
  16: 'quet',
  18: 'quet',
  20: 'quet',
  22: 'quet',
  39: 'quet',
  17: 'phong',
  23: 'phong',
  31: 'phong',
  40: 'phong',
  43: 'phong',
  50: 'phong',
  53: 'phong',
  55: 'phong',
  30: 'noi',
  37: 'noi',
  42: 'noi',
  47: 'noi',
  15: 'xoay',
  19: 'xoay',
  21: 'xoay',
  35: 'xoay',
  45: 'xoay',
  49: 'xoay',
  25: 'nay',
  26: 'nay',
}

/** presetSubtype là mặt nạ bit: 1 trên, 2 phải, 4 dưới, 8 trái. */
function huongTuMaPhu(ma: number): { x: number; y: number } {
  return { x: (ma & 2 ? 1 : 0) - (ma & 8 ? 1 : 0), y: (ma & 4 ? 1 : 0) - (ma & 1 ? 1 : 0) }
}

function doiCuoiDuongDi(path: string | undefined): { x: number; y: number } | undefined {
  if (!path) return undefined
  const so = path.match(/-?\d*\.?\d+(?:e-?\d+)?/gi)?.map(Number) ?? []
  if (so.length < 2) return undefined
  const x = so[so.length - 2]
  const y = so[so.length - 1]
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined
}

const TOI_DA_HIEU_UNG_MOI_SLIDE = 400

function docHieuUng(nutPar: NutXml, lech: number, ra: HieuUng[]) {
  const cTn = con(nutPar, 'cTn')
  if (!cTn) return
  const lop = cTn.tt.presetClass
  const loai: LoaiHieuUng | null =
    lop === 'entr' ? 'vao' : lop === 'exit' ? 'ra' : lop === 'emph' ? 'nhan' : lop === 'path' ? 'duong' : null
  if (!loai) return
  const batDau = lech + soMs(con(con(cTn, 'stCondLst'), 'cond')?.tt.delay)
  const hanhVi = con(cTn, 'childTnLst')?.con ?? []
  let thoiLuong = 0
  let spTgt: NutXml | undefined
  let doiCuoi: { x: number; y: number } | undefined
  for (const h of hanhVi) {
    const cBhvr = con(h, 'cBhvr')
    const cTnHv = con(cBhvr, 'cTn')
    if (cTnHv && cTnHv.tt.dur !== 'indefinite') {
      thoiLuong = Math.max(thoiLuong, soMs(cTnHv.tt.dur) + soMs(con(con(cTnHv, 'stCondLst'), 'cond')?.tt.delay))
    }
    spTgt ??= timDau(h, 'spTgt')
    if (h.ten === 'animMotion') doiCuoi = doiCuoiDuongDi(h.tt.path)
  }
  const spid = spTgt?.tt.spid
  if (!spid) return
  const id = Number(cTn.tt.presetID)
  const maPhu = Number(cTn.tt.presetSubtype) || 0
  let kieu: KieuHieuUng
  let huong = huongTuMaPhu(maPhu)
  if (loai === 'nhan') kieu = id === 8 ? 'quay' : 'nhip'
  else if (loai === 'duong') kieu = 'bay'
  else {
    kieu = KIEU_VAO_RA[id] ?? 'mo_dan'
    if (kieu === 'noi') huong = id === 47 ? { x: 0, y: -1 } : { x: 0, y: 1 }
    else if ((kieu === 'bay' || kieu === 'quet') && huong.x === 0 && huong.y === 0) huong = { x: 0, y: 1 }
  }
  if (loai === 'duong' && !doiCuoi) return
  // Thời lượng 1ms (Appear) → hiện tức thì.
  const moc = { spid, loai, kieu, huong, batDau, thoiLuong: thoiLuong <= 1 ? 0 : Math.min(thoiLuong, 20000), ...(doiCuoi ? { doi: doiCuoi } : {}) }
  const pRg = spTgt ? timDau(spTgt, 'pRg') : undefined
  if (pRg) {
    const dau = Math.max(0, Number(pRg.tt.st) || 0)
    const cuoi = Math.min(dau + 100, Math.max(dau, Number(pRg.tt.end) || dau))
    for (let d = dau; d <= cuoi && ra.length < TOI_DA_HIEU_UNG_MOI_SLIDE; d++) ra.push({ ...moc, doan: d })
  } else if (ra.length < TOI_DA_HIEU_UNG_MOI_SLIDE) {
    ra.push(moc)
  }
}

/** Một nhóm cú bấm: các nhóm mốc thời gian (lệch = delay), bên trong là từng hiệu ứng. */
function docNhomBam(nhom: NutXml): { tuDong: boolean; hieuUng: HieuUng[] } {
  const cTn = con(nhom, 'cTn')
  const dieuKien = cacCon(con(cTn, 'stCondLst'), 'cond')
  const tuDong = dieuKien.some((c) => c.tt.evt === 'onBegin') || (dieuKien.length > 0 && dieuKien.every((c) => c.tt.delay !== 'indefinite'))
  const hieuUng: HieuUng[] = []
  for (const moc of cacCon(con(cTn, 'childTnLst'), 'par')) {
    const cTnMoc = con(moc, 'cTn')
    const lech = soMs(con(con(cTnMoc, 'stCondLst'), 'cond')?.tt.delay)
    for (const par of cacCon(con(cTnMoc, 'childTnLst'), 'par')) docHieuUng(par, lech, hieuUng)
  }
  hieuUng.sort((a, b) => a.batDau - b.batDau)
  return { tuDong, hieuUng }
}

export function docKichBanSlide(slideXml: string): KichBanSlide {
  // Chuyển cảnh + hiệu ứng nằm sau p:cSld — bỏ phần hình vẽ (lớn) cho nhanh.
  const sauCSld = slideXml.search(/<\/(?:[\w-]+:)?cSld>/)
  const goc = docXml(sauCSld >= 0 ? slideXml.slice(sauCSld) : slideXml)
  const kichBan: KichBanSlide = { tuDong: [], buoc: [], chuyenCanh: docChuyenCanh(goc) }
  const timing = timDau(goc, 'timing')
  if (!timing) return kichBan
  const mainSeq = timHet(timing, 'cTn').find((c) => c.tt.nodeType === 'mainSeq')
  for (const nhom of cacCon(con(mainSeq, 'childTnLst'), 'par')) {
    const { tuDong, hieuUng } = docNhomBam(nhom)
    if (hieuUng.length === 0) continue
    if (tuDong && kichBan.buoc.length === 0) kichBan.tuDong.push(...hieuUng)
    else kichBan.buoc.push(hieuUng)
  }
  return kichBan
}

// ── Trạng thái sau N cú bấm ─────────────────────────────────────────────────

export const khoaDich = (h: Pick<HieuUng, 'spid' | 'doan'>) => (h.doan === undefined ? h.spid : `${h.spid}#${h.doan}`)

export interface TrangThaiDich {
  hien: boolean
  doi: { x: number; y: number }
}

/** Nhóm 0: phần tự chạy khi vào slide; nhóm k (k ≥ 1): cú bấm thứ k. */
export const nhomThu = (kb: KichBanSlide, i: number): HieuUng[] => (i === 0 ? kb.tuDong : (kb.buoc[i - 1] ?? []))

/** Trạng thái mọi hình có hiệu ứng sau khi đã chạy `soNhom` nhóm đầu (0 = vừa dựng slide, chưa chạy gì). */
export function trangThaiSauNhom(kb: KichBanSlide, soNhom: number): Map<string, TrangThaiDich> {
  const kq = new Map<string, TrangThaiDich>()
  // Hình có hiệu ứng đầu tiên là "vào" thì ban đầu ẩn.
  for (let i = 0; i <= kb.buoc.length; i++) {
    for (const h of nhomThu(kb, i)) {
      const k = khoaDich(h)
      if (!kq.has(k)) kq.set(k, { hien: h.loai !== 'vao', doi: { x: 0, y: 0 } })
    }
  }
  const het = Math.min(Math.max(0, soNhom), kb.buoc.length + 1)
  for (let i = 0; i < het; i++) {
    for (const h of nhomThu(kb, i)) apDung(kq, h)
  }
  return kq
}

/** Trạng thái sau phần tự chạy và `buoc` cú bấm đầu. */
export const trangThaiSauBuoc = (kb: KichBanSlide, buoc: number) =>
  trangThaiSauNhom(kb, 1 + Math.min(Math.max(0, buoc), kb.buoc.length))

export function apDung(kq: Map<string, TrangThaiDich>, h: HieuUng) {
  const k = khoaDich(h)
  const cu = kq.get(k) ?? { hien: true, doi: { x: 0, y: 0 } }
  if (h.loai === 'vao') kq.set(k, { ...cu, hien: true })
  else if (h.loai === 'ra') kq.set(k, { ...cu, hien: false })
  else if (h.loai === 'duong' && h.doi) kq.set(k, { ...cu, doi: { x: cu.doi.x + h.doi.x, y: cu.doi.y + h.doi.y } })
}

/** Số bước cú bấm lớn tuỳ ý = đã chạy hết hiệu ứng (quay lại slide trước giống PowerPoint). */
export const BUOC_HET = 999
