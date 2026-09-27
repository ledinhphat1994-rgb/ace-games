// Hiệu ứng PowerPoint của .pptx dựng trên trình duyệt: đọc chuyển cảnh + chuỗi cú bấm từ XML slide (dạng PowerPoint xuất ra)
// và tính trạng thái hình sau N cú bấm — mọi máy trong phòng ra cùng một kết quả.
import { describe, expect, it } from 'vitest'
import {
  BUOC_HET,
  docKichBanSlide,
  docXml,
  khoaDich,
  trangThaiSauBuoc,
  trangThaiSauNhom,
} from '../src/features/study/pptx-hieu-ung'

const hanhVi = (spid: string, dur: string, dich = `<p:spTgt spid="${spid}"/>`) =>
  `<p:set><p:cBhvr><p:cTn id="90" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl>${dich}</p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="visible"/></p:to></p:set>` +
  `<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="91" dur="${dur}"/><p:tgtEl>${dich}</p:tgtEl></p:cBhvr></p:animEffect>`

const hieuUng = (thuocTinh: string, delay: string, noiDung: string) =>
  `<p:par><p:cTn id="80" ${thuocTinh} fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst>${noiDung}</p:childTnLst></p:cTn></p:par>`

const moc = (delay: string, noiDung: string) =>
  `<p:par><p:cTn id="70" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst><p:childTnLst>${noiDung}</p:childTnLst></p:cTn></p:par>`

const nhomBam = (noiDung: string, tuDong = false) =>
  `<p:par><p:cTn id="60" fill="hold"><p:stCondLst><p:cond delay="indefinite"/>${tuDong ? '<p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : ''}</p:stCondLst><p:childTnLst>${noiDung}</p:childTnLst></p:cTn></p:par>`

const SLIDE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Tiêu đề 1"/></p:nvSpPr><p:txBody><a:p><a:r><a:t>&lt;timing&gt; không phải hiệu ứng</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" Requires="p14"><p:transition spd="slow" p14:dur="1250"><p14:vortex dir="r"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>
<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>
${nhomBam(moc('0', hieuUng('presetID="1" presetClass="entr" presetSubtype="0" nodeType="afterEffect"', '0', hanhVi('5', '1'))), true)}
${nhomBam(
  moc(
    '0',
    hieuUng(
      'presetID="2" presetClass="entr" presetSubtype="4" grpId="0" nodeType="clickEffect"',
      '0',
      `${hanhVi('2', '1')}<p:anim calcmode="lin" valueType="num"><p:cBhvr additive="base"><p:cTn id="11" dur="500" fill="hold"/><p:tgtEl><p:spTgt spid="2"/></p:tgtEl><p:attrNameLst><p:attrName>ppt_y</p:attrName></p:attrNameLst></p:cBhvr></p:anim>`,
    ) + hieuUng('presetID="10" presetClass="entr" presetSubtype="0" nodeType="withEffect"', '250', hanhVi('4', '750')),
  ) + moc('750', hieuUng('presetID="22" presetClass="entr" presetSubtype="8" nodeType="afterEffect"', '0', hanhVi('6', '500'))),
)}
${nhomBam(moc('0', hieuUng('presetID="10" presetClass="entr" presetSubtype="0" grpId="0" nodeType="clickEffect"', '0', hanhVi('3', '500', '<p:spTgt spid="3"><p:txEl><p:pRg st="1" end="1"/></p:txEl></p:spTgt>'))))}
${nhomBam(
  moc(
    '0',
    hieuUng('presetID="2" presetClass="exit" presetSubtype="2" nodeType="clickEffect"', '0', hanhVi('2', '500')) +
      hieuUng(
        'presetID="42" presetClass="path" presetSubtype="0" nodeType="withEffect"',
        '0',
        '<p:animMotion origin="layout" path="M 0 0 L 0.25 -0.1 E" pathEditMode="relative"><p:cBhvr><p:cTn id="30" dur="2000" fill="hold"/><p:tgtEl><p:spTgt spid="4"/></p:tgtEl></p:cBhvr></p:animMotion>',
      ),
  ),
)}
<!-- nhóm không có hình đích bị bỏ qua -->
${nhomBam(moc('0', hieuUng('presetID="10" presetClass="entr" nodeType="clickEffect"', '0', '<p:animEffect transition="in" filter="fade"><p:cBhvr><p:cTn id="99" dur="500"/></p:cBhvr></p:animEffect>')))}
</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>
<p:bldLst><p:bldP spid="2" grpId="0"/><p:bldP spid="3" grpId="0" build="p"/></p:bldLst></p:timing>
</p:sld>`

describe('Đọc hiệu ứng PowerPoint từ XML slide', () => {
  const kb = docKichBanSlide(SLIDE)

  it('chuyển cảnh: kiểu lạ của p14 thì lấy kiểu dự phòng, thời lượng lấy p14:dur', () => {
    expect(kb.chuyenCanh).toMatchObject({ kieu: 'mo_dan', thoiLuong: 1250 })
  })

  it('hiệu ứng đặt "After Previous" ở đầu slide tự chạy khi vào slide; còn lại mỗi nhóm là một cú bấm', () => {
    expect(kb.tuDong).toEqual([expect.objectContaining({ spid: '5', loai: 'vao', kieu: 'xuat_hien', thoiLuong: 0 })])
    expect(kb.buoc).toHaveLength(3)
  })

  it('cú bấm 1: bay vào từ dưới, mờ dần cùng lúc (trễ 250ms), rồi quét từ trái sau khi xong', () => {
    expect(kb.buoc[0]).toEqual([
      expect.objectContaining({ spid: '2', loai: 'vao', kieu: 'bay', huong: { x: 0, y: 1 }, batDau: 0, thoiLuong: 500 }),
      expect.objectContaining({ spid: '4', loai: 'vao', kieu: 'mo_dan', batDau: 250, thoiLuong: 750 }),
      expect.objectContaining({ spid: '6', loai: 'vao', kieu: 'quet', huong: { x: -1, y: 0 }, batDau: 750, thoiLuong: 500 }),
    ])
  })

  it('cú bấm 2 hiện từng dòng chữ; cú bấm 3 bay ra sang phải + đi theo đường', () => {
    expect(kb.buoc[1]).toEqual([expect.objectContaining({ spid: '3', doan: 1, kieu: 'mo_dan' })])
    expect(kb.buoc[2]).toEqual([
      expect.objectContaining({ spid: '2', loai: 'ra', kieu: 'bay', huong: { x: 1, y: 0 } }),
      expect.objectContaining({ spid: '4', loai: 'duong', doi: { x: 0.25, y: -0.1 }, thoiLuong: 2000 }),
    ])
  })

  it('trạng thái hình theo số cú bấm (lùi về slide trước = hiện đủ)', () => {
    const vuaVao = trangThaiSauNhom(kb, 0)
    expect(vuaVao.get('5')?.hien).toBe(false)
    const dau = trangThaiSauBuoc(kb, 0)
    expect(dau.get('5')?.hien).toBe(true)
    expect(['2', '4', '6', '3#1'].map((k) => dau.get(k)?.hien)).toEqual([false, false, false, false])
    const mot = trangThaiSauBuoc(kb, 1)
    expect(['2', '4', '6', '3#1'].map((k) => mot.get(k)?.hien)).toEqual([true, true, true, false])
    const het = trangThaiSauBuoc(kb, BUOC_HET)
    expect(het.get('2')?.hien).toBe(false)
    expect(het.get('3#1')?.hien).toBe(true)
    expect(het.get('4')).toEqual({ hien: true, doi: { x: 0.25, y: -0.1 } })
    expect(khoaDich({ spid: '3', doan: 1 })).toBe('3#1')
  })

  it('slide không hiệu ứng / không chuyển cảnh; chuyển cảnh đẩy lên, không có kiểu thì bỏ qua', () => {
    expect(docKichBanSlide('<p:sld><p:cSld><p:spTree/></p:cSld></p:sld>')).toEqual({ tuDong: [], buoc: [], chuyenCanh: null })
    expect(docKichBanSlide('<p:sld><p:cSld/><p:transition spd="med"><p:push dir="u"/></p:transition></p:sld>').chuyenCanh).toEqual({
      kieu: 'day',
      huong: { x: 0, y: -1 },
      doc: false,
      ra: false,
      thoiLuong: 750,
    })
    expect(docKichBanSlide('<p:sld><p:cSld/><p:transition spd="slow"/></p:sld>').chuyenCanh).toBeNull()
  })

  it('bộ đọc XML: bỏ tiền tố, giải mã thực thể, bỏ qua chú thích / CDATA, thẻ tự đóng', () => {
    const goc = docXml('<?xml version="1.0"?><!-- <p:x/> --><p:a q="1 &amp; 2"><![CDATA[<b/>]]><p:b/><c:d k=\'v\'></c:d></p:a>')
    expect(goc.con).toHaveLength(1)
    expect(goc.con[0]).toEqual({
      ten: 'a',
      tt: { q: '1 & 2' },
      con: [
        { ten: 'b', tt: {}, con: [] },
        { ten: 'd', tt: { k: 'v' }, con: [] },
      ],
    })
  })
})
