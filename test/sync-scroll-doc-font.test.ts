import { describe, expect, it } from 'vitest'
import {
  cleanAndStitchVietnamese,
  assembleCoherentParagraphs,
} from '../src/features/study/docx-vietnamese-utils'
import { QUYEN_CONG_CU, LenhPhongSlide } from '../shared/protocol/room'

describe('Đồng bộ cuộn & Sửa font chữ tiếng Việt tệp Word (DocxDocumentViewer)', () => {
  it('Phục hồi chính xác các từ tiếng Việt bị chèn dấu nháy / backtick / tách âm tiết', () => {
    // Trường hợp 1: Tên sở ban ngành bị chèn backtick
    expect(cleanAndStitchVietnamese('SỞ GD&ĐT TP ĐỒ`NG NAI')).toBe('SỞ GD&ĐT TP ĐỒNG NAI')

    // Trường hợp 2: Tiêu đề báo cáo bị tách dấu sắc KẾ'T
    expect(
      cleanAndStitchVietnamese('BÁO CÁO KẾ\'T QUẢ NĂM HỌC 2025-2026 VÀ PHƯƠNG HƯỚNG')
    ).toBe('BÁO CÁO KẾT QUẢ NĂM HỌC 2025-2026 VÀ PHƯƠNG HƯỚNG')

    // Trường hợp 3: Mục 1 tóm tắt một số kết quả
    expect(
      cleanAndStitchVietnamese('1.Báo cáo tóm tắ\' t một số\' kế\' quả năm học 2025-2026')
    ).toBe('1. Báo cáo tóm tắt một số kết quả năm học 2025-2026')

    // Trường hợp 4: Bảo hiểm y tế và dấu hai chấm, phần trăm
    expect(
      cleanAndStitchVietnamese('- Học sinh tham gia bảo hiểm y tế\' : Đạt 100 %')
    ).toBe('- Học sinh tham gia bảo hiểm y tế: Đạt 100%')

    // Trường hợp 5: Xuất sắc + Giỏi bị chèn dấu nháy và dính dấu cộng
    expect(
      cleanAndStitchVietnamese('- Học sinh đạt danh hiệu Xuấ\' t sắ\' c+Giỏi: 69/958 đạt tỷ lệ 7,20%')
    ).toBe('- Học sinh đạt danh hiệu Xuất sắc + Giỏi: 69/958 đạt tỷ lệ 7,20%')

    // Trường hợp 6: Xếp loại cuối năm học
    expect(
      cleanAndStitchVietnamese('- Xế\' p loại 2 mặt giáo dục cuố\' i năm học:')
    ).toBe('- Xếp loại 2 mặt giáo dục cuối năm học:')
  })

  it('assembleCoherentParagraphs ghép các dòng bị phân mảnh do mã font nhị phân thành đoạn văn hoàn chỉnh', () => {
    const rawLines = [
      '- Tỷ lệ duy trì sĩ số \' đề',
      'n cuố',
      'i năm ho',
      'c: 958/1034 đạt tỷ lệ 92.6%',
      '- Học sinh tham gia bảo hiểm y tế\' : Đạt 100 %',
      '- Học sinh Giỏi lớp cấ\' p tỉnh THPT: 8 giải (1 Nhấ',
      't, 1 Nhì',
      ', 2 Ba, 4 KK)',
    ]

    const paragraphs = assembleCoherentParagraphs(rawLines)

    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toBe('- Tỷ lệ duy trì sĩ số đến cuối năm học: 958/1034 đạt tỷ lệ 92.6%')
    expect(paragraphs[1]).toBe('- Học sinh tham gia bảo hiểm y tế: Đạt 100%')
    expect(paragraphs[2]).toBe('- Học sinh Giỏi lớp cấp tỉnh THPT: 8 giải (1 Nhất, 1 Nhì, 2 Ba, 4 KK)')
  })

  it('QUYEN_CONG_CU hỗ trợ đầy đủ quyền cuộn trang ("cuon") và di chuyển khung ("di_chuyen")', () => {
    expect(QUYEN_CONG_CU).toContain('cuon')
    expect(QUYEN_CONG_CU).toContain('di_chuyen')
  })

  it('Lệnh slide hỗ trợ action "scroll" với scrollRatio', () => {
    const scrollCmd = {
      action: 'scroll',
      scrollRatio: 0.65,
      scrollTop: 650,
      scrollHeight: 1000,
      docUrl: 'https://example.com/test.docx',
    }

    const parsed = LenhPhongSlide.safeParse(scrollCmd)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.action).toBe('scroll')
      if (parsed.data.action === 'scroll') {
        expect(parsed.data.scrollRatio).toBe(0.65)
        expect(parsed.data.scrollTop).toBe(650)
      }
    }
  })

  it('DocxDocumentViewer bọc containerRef và children trong cùng relative wrapper để nét vẽ cuộn đồng bộ theo trang', async () => {
    const docxViewerRaw = (await import('../src/features/study/DocxDocumentViewer.tsx?raw')).default
    expect(docxViewerRaw).toContain('relative inline-block transition-transform duration-100 origin-top h-fit')
    expect(docxViewerRaw).toContain('data-testid="docx-annotation-overlay"')
    expect(docxViewerRaw).toContain('absolute inset-0 pointer-events-none z-10')
  })

  it('DocumentStageView gắn SlideAnnotationLayer vào bên trong DocxDocumentViewer (thay vì lớp tĩnh ngoài màn hình)', async () => {
    const docStageViewRaw = (await import('../src/features/study/workspace/DocumentStageView.tsx?raw')).default
    expect(docStageViewRaw).toContain('<DocxDocumentViewer')
    expect(docStageViewRaw).toContain('<SlideAnnotationLayer')
    expect(docStageViewRaw).toContain('onSendStroke={onSendSlideAnnotation}')
    expect(docStageViewRaw).toContain('onRemoveStroke={onRemoveSlideAnnotation}')
  })

  it('XlsxSpreadsheetViewer bọc table và children trong relative wrapper với excel-annotation-overlay và khoá cuộn khi !canScroll', async () => {
    const xlsxViewerRaw = (await import('../src/features/study/XlsxSpreadsheetViewer.tsx?raw')).default
    expect(xlsxViewerRaw).toContain('canScroll ? \'overflow-auto\' : \'overflow-hidden\'')
    expect(xlsxViewerRaw).toContain('data-testid="xlsx-viewport"')
    expect(xlsxViewerRaw).toContain('data-testid="excel-annotation-overlay"')
    expect(xlsxViewerRaw).toContain('absolute inset-0 pointer-events-none z-10')
  })

  it('DocumentStageView gắn SlideAnnotationLayer vào bên trong XlsxSpreadsheetViewer và truyền canScroll={coQuyenCuon}', async () => {
    const docStageViewRaw = (await import('../src/features/study/workspace/DocumentStageView.tsx?raw')).default
    expect(docStageViewRaw).toContain('<XlsxSpreadsheetViewer')
    expect(docStageViewRaw).toContain('canScroll={coQuyenCuon}')
    expect(docStageViewRaw).toContain('scrollRatio={')
    expect(docStageViewRaw).toContain('onScrollRatioChange={')
  })

  it('DocumentStageView khoá cuộn hình ảnh khi người tham gia không có quyền cuộn', async () => {
    const docStageViewRaw = (await import('../src/features/study/workspace/DocumentStageView.tsx?raw')).default
    expect(docStageViewRaw).toContain('coQuyenCuon ? \'overflow-auto\' : \'overflow-hidden')
    expect(docStageViewRaw).toContain('data-testid="doc-image-container"')
  })

  it('Lệnh slide hỗ trợ action "scroll" với zoom, panX, panY để đồng bộ viewport chủ phòng', () => {
    const scrollWithViewport = {
      action: 'scroll',
      scrollRatio: 0.45,
      scrollTop: 450,
      scrollHeight: 1000,
      docUrl: 'https://example.com/slide-image.png',
      zoom: 1.75,
      panX: 120,
      panY: -80,
    }

    const parsed = LenhPhongSlide.safeParse(scrollWithViewport)
    expect(parsed.success).toBe(true)
    if (parsed.success && parsed.data.action === 'scroll') {
      expect(parsed.data.zoom).toBe(1.75)
      expect(parsed.data.panX).toBe(120)
      expect(parsed.data.panY).toBe(-80)
    }
  })

  it('DocumentStageView khoá tỷ lệ ảnh với aspectRatio dựa trên naturalWidth/naturalHeight để tránh lệch nét dạ quang', async () => {
    const docStageViewRaw = (await import('../src/features/study/workspace/DocumentStageView.tsx?raw')).default
    expect(docStageViewRaw).toContain('aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : undefined')
    expect(docStageViewRaw).toContain('setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })')
    expect(docStageViewRaw).toContain('data-testid="doc-image-viewer"')
  })

  it('DocumentStageView đồng bộ zoomScale, effectivePan và cuộn ảnh theo góc nhìn chủ phòng (Host Follow Mode)', async () => {
    const docStageViewRaw = (await import('../src/features/study/workspace/DocumentStageView.tsx?raw')).default
    expect(docStageViewRaw).toContain('zoomScale')
    expect(docStageViewRaw).toContain('effectivePan')
    expect(docStageViewRaw).toContain('handleImageScroll')
    expect(docStageViewRaw).toContain('onScroll={handleImageScroll}')
    expect(docStageViewRaw).toContain('onSendSlideScroll(ratio, el.scrollTop, el.scrollHeight, slideState.docUrl, zoomScale, imagePan.x, imagePan.y)')
  })
})
