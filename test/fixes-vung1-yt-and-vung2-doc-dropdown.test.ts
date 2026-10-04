import { describe, expect, it } from 'vitest'
import studyRoomViewRaw from '../src/features/study/StudyRoomView.tsx?raw'
import documentStageViewRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import classroomWorkspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import docxViewerRaw from '../src/features/study/DocxDocumentViewer.tsx?raw'

describe('Kiểm tra sửa lỗi Vùng 1 (Lưu lịch sử YouTube) và Vùng 2 (Chọn tài liệu trong app & Phân quyền chủ phòng)', () => {
  describe('Vùng 1: Lưu lịch sử video từ lần tìm kiếm trước đó', () => {
    it('có STORAGE_KEY_YT_HISTORY và hàm nạp lịch sử từ localStorage', () => {
      expect(studyRoomViewRaw).toContain("STORAGE_KEY_YT_HISTORY = 'c10a7_yt_search_history'")
      expect(studyRoomViewRaw).toContain('function getYtCachedHistory()')
      expect(studyRoomViewRaw).toContain('localStorage.getItem(STORAGE_KEY_YT_HISTORY)')
    })

    it('khởi tạo ytSearch, ytSort, ytResults, ytDaTim từ localStorage', () => {
      expect(studyRoomViewRaw).toContain("useState(() => getYtCachedHistory()?.query || '')")
      expect(studyRoomViewRaw).toContain('() => getYtCachedHistory()?.results || []')
      expect(studyRoomViewRaw).toContain("useState(() => getYtCachedHistory()?.daTim || '')")
      expect(studyRoomViewRaw).toContain('getYtCachedHistory()?.sort')
    })

    it('doYtSearch lưu kết quả tìm kiếm vào localStorage', () => {
      expect(studyRoomViewRaw).toContain('localStorage.setItem(')
      expect(studyRoomViewRaw).toContain('STORAGE_KEY_YT_HISTORY')
      expect(studyRoomViewRaw).toContain('results: list')
    })

    it('handlePlayVideo và handlePickYtVideo KHÔNG xoá ytResults hay ytDaTim để giữ nguyên lịch sử', () => {
      // Đảm bảo không còn gọi setYtResults([]) hay setYtDaTim('') trong handlePickYtVideo
      const handlePickRegex = /const handlePickYtVideo = \([\s\S]*?toast\.success/
      const match = studyRoomViewRaw.match(handlePickRegex)
      expect(match).not.toBeNull()
      expect(match![0]).not.toContain('setYtResults([])')
      expect(match![0]).not.toContain("setYtDaTim('')")

      // Trong handlePlayVideo cũng không xoá kết quả tìm kiếm
      const handlePlayRegex = /const handlePlayVideo = async \([\s\S]*?toast\.success\('Đã nạp video YouTube/
      const playMatch = studyRoomViewRaw.match(handlePlayRegex)
      expect(playMatch).not.toBeNull()
      expect(playMatch![0]).not.toContain('setYtResults([])')
      expect(playMatch![0]).not.toContain("setYtDaTim('')")
    })
  })

  describe('Vùng 2: Chọn tài liệu khác trong cùng app, xóa "đóng ứng dụng", phân quyền người tham gia vs chủ phòng', () => {
    it('đã xoá handleClickOutside trên pointerdown gây lỗi tắt popover trước khi click chọn tài liệu', () => {
      expect(documentStageViewRaw).not.toContain("window.addEventListener('pointerdown', handleClickOutside)")
      expect(documentStageViewRaw).not.toContain('appMenuRef.current.contains')
    })

    it('đã xoá hoàn toàn dòng chữ "Đóng ứng dụng" trong dropdown menu', () => {
      expect(documentStageViewRaw).not.toContain('Đóng ứng dụng')
    })

    it('người tham gia (!canControl) chỉ thấy card tĩnh, không có popover trigger và không hiện dropdown khi click', () => {
      expect(documentStageViewRaw).toContain('if (!canControl) {')
      expect(documentStageViewRaw).toContain('cursor-default')
      expect(documentStageViewRaw).toContain('title={`${tenLoai}: ${activeDocInApp?.docName || \'Tài liệu\'}`}')
      // Phân quyền trước hasMultipleFiles
      const canControlIndex = documentStageViewRaw.indexOf('if (!canControl) {')
      const hasMultipleIndex = documentStageViewRaw.indexOf('if (hasMultipleFiles) {')
      expect(canControlIndex).toBeGreaterThan(0)
      expect(hasMultipleIndex).toBeGreaterThan(canControlIndex)
    })

    it('chủ phòng (canControl) thấy popover và có thể click chọn tài liệu khác trong app', () => {
      expect(documentStageViewRaw).toContain('if (hasMultipleFiles) {')
      expect(documentStageViewRaw).toContain('<Popover')
      expect(documentStageViewRaw).toContain('onSwitchDoc?.(app, file.docUrl)')
      expect(documentStageViewRaw).toContain('setOpenAppMenu(null)')
    })

    it('ClassroomWorkspace hỗ trợ tham số docUrl cho onSwitchDoc và handleCloseDoc', () => {
      expect(classroomWorkspaceRaw).toContain('onCloseDoc?: (loai?: LoaiTaiLieuNap, docUrl?: string) => void')
      expect(classroomWorkspaceRaw).toContain('onSwitchDoc?: (loai: LoaiTaiLieuNap, docUrl?: string) => void')
      expect(classroomWorkspaceRaw).toContain('handleCloseDoc = useCallback(')
      expect(classroomWorkspaceRaw).toContain('(loai?: LoaiTaiLieuNap, docUrl?: string) => {')
    })
  })

  describe('Fix Vùng 1 & 2: Không hiển thị ô tìm ô và số trang với người tham gia (!canControl)', () => {
    it('Col 2 (doc-excel-search và doc-page-nav) được bọc bởi canControl', () => {
      expect(documentStageViewRaw).toContain('VÙNG 1 & 2 (Chỉ hiển thị với chủ phòng canControl)')
      expect(documentStageViewRaw).toContain('<div className="flex items-center justify-center shrink-0">')
      expect(documentStageViewRaw).toContain('{canControl && (')
      expect(documentStageViewRaw).toContain('data-testid="doc-excel-search"')
      expect(documentStageViewRaw).toContain('data-testid="doc-page-nav"')
      expect(documentStageViewRaw).toContain('data-testid="doc-page-counter"')
    })
  })

  describe('Fix Vùng 3: Tìm kiếm YouTube nhiều video nhất (50 video) và tìm kiếm bằng link YouTube trực tiếp', () => {
    it('StudyRoomView duy trì 3 tab sắp xếp: Liên quan, Mới nhất, Xem nhiều', () => {
      expect(studyRoomViewRaw).toContain('Liên quan')
      expect(studyRoomViewRaw).toContain('Mới nhất')
      expect(studyRoomViewRaw).toContain('Xem nhiều')
      expect(studyRoomViewRaw).toContain("setYtSort('relevance')")
      expect(studyRoomViewRaw).toContain("setYtSort('upload_date')")
      expect(studyRoomViewRaw).toContain("setYtSort('view_count')")
    })

    it('StudyRoomView hỗ trợ nhập từ khóa hoặc dán link YouTube trong cùng thanh search', () => {
      expect(studyRoomViewRaw).toContain('placeholder="Tìm kiếm bài giảng hoặc dán link YouTube..."')
      expect(studyRoomViewRaw).toContain('void doYtSearch(ytSearch)')
    })
  })

  describe('Fix Vùng 5: Tài liệu Word hoạt động nội tại qua DocxDocumentViewer không phụ thuộc Office Live', () => {
    it('DocumentStageView chuyển toàn bộ file Word sang DocxDocumentViewer', () => {
      expect(documentStageViewRaw).toContain('isWord && slideState ? (')
      expect(documentStageViewRaw).toContain('<DocxDocumentViewer')
      expect(documentStageViewRaw).toContain('canControl={canControl}')
    })

    it('DocxDocumentViewer có bộ fallback nội tại cho .doc, HTML/WordML, RTF và nhị phân OLE2', () => {
      expect(docxViewerRaw).toContain('parseAndRenderFallbackWordDoc')
      expect(docxViewerRaw).toContain('extractUtf16Paragraphs')
      expect(docxViewerRaw).toContain('extract8BitParagraphs')
      expect(docxViewerRaw).toContain('renderParagraphs')
    })
  })
})
