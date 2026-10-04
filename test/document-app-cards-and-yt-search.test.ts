// test/document-app-cards-and-yt-search.test.ts
// Digital Campus v2: Verification Suite for Document App Cards, Multi-file Popover & Accurate YouTube Live Search

import { describe, expect, it } from 'vitest'
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import roomDoRaw from '../worker/room-do.ts?raw'
import roomProtoRaw from '../shared/protocol/room.ts?raw'
import useRoomRaw from '../src/hooks/use-room.ts?raw'
import workerIndexRaw from '../worker/index.ts?raw'

describe('Document App Cards, Multi-file Popover & Accurate YouTube Search', () => {
  describe('1. Vùng 1: App Cards Grouping, Hover Document Name & Multi-file Popover', () => {
    it('groups loaded documents by app type and renders App Cards with distinct brand styles', () => {
      expect(docStageRaw).toContain('docsByApp')
      expect(docStageRaw).toContain('activeApps')
      expect(docStageRaw).toContain('data-testid="doc-loaded-tabs"')
      expect(docStageRaw).toContain('data-testid={`doc-tab-${app}`}')
      expect(docStageRaw).toContain("app === 'excel'")
      expect(docStageRaw).toContain("app === 'word'")
      expect(docStageRaw).toContain("app === 'image'")
      expect(docStageRaw).toContain("tenLoai =")
    })

    it('displays active document name on hover via title tooltip', () => {
      expect(docStageRaw).toContain('title={`${tenLoai}: ${activeDocInApp?.docName || \'Tài liệu\'}`}')
    })

    it('renders multi-file popover on click with max 5 files capacity per app', () => {
      expect(docStageRaw).toContain('openAppMenu')
      expect(docStageRaw).toContain('data-testid={`doc-app-menu-${app}`}')
      expect(docStageRaw).toContain('({files.length}/5 tệp)')
      expect(docStageRaw).toContain('onSwitchDoc?.(app, file.docUrl)')
      expect(docStageRaw).toContain('onCloseDoc(app, file.docUrl)')
    })

    it('cleanly removes redundant add buttons from tabs toolbar', () => {
      expect(docStageRaw).not.toContain('data-testid="doc-btn-add-type"')
      expect(docStageRaw).not.toContain('data-testid="doc-btn-add-shortcut"')
      // Preserves top-right upload button for replacing / adding documents
      expect(docStageRaw).toContain('data-testid="doc-btn-replace"')
    })
  })

  describe('2. Vùng 2: Centered Document Pagination (Dead-Center CSS Grid)', () => {
    it('uses 3-column CSS Grid grid-cols-[1fr_auto_1fr] to guarantee 50% absolute centering', () => {
      expect(docStageRaw).toContain('grid grid-cols-[1fr_auto_1fr]')
      expect(docStageRaw).toContain('/* Center (Col 2): Căn giữa 50% tuyệt đối — VÙNG 2 */')
      expect(docStageRaw).toContain('data-testid="doc-page-nav"')
      expect(docStageRaw).toContain('data-testid="doc-page-counter"')
      expect(docStageRaw).toContain('data-testid="doc-btn-prev"')
      expect(docStageRaw).toContain('data-testid="doc-btn-next"')
    })
  })

  describe('3. Multi-file State Authority (RoomDO, Protocol & use-room)', () => {
    it('LenhPhongSlide supports optional docUrl for targeted switch_doc and close_doc', () => {
      expect(roomProtoRaw).toContain("action: z.literal('switch_doc')")
      expect(roomProtoRaw).toContain("action: z.literal('close_doc')")
      expect(roomProtoRaw).toContain('docUrl: z.string().optional()')
    })

    it('RoomDO retains up to 5 documents per app type without purging active slots', () => {
      expect(roomDoRaw).toContain('dsCungLoai.slice(-4)')
      expect(roomDoRaw).toContain('loadedDocs')
      expect(roomDoRaw).toContain("if (d.action === 'switch_doc')")
      expect(roomDoRaw).toContain("if (d.action === 'close_doc')")
      expect(roomDoRaw).toContain('d.docUrl')
    })

    it('use-room.ts provides optimistic switchSlideDoc and closeSlideDoc with docUrl support', () => {
      expect(useRoomRaw).toContain('switchSlideDoc = useCallback((loai: LoaiTaiLieuNap, docUrl?: string)')
      expect(useRoomRaw).toContain('closeSlideDoc = useCallback((loai?: LoaiTaiLieuNap, docUrl?: string)')
      expect(useRoomRaw).toContain('action: \'switch_doc\', loai, ...(docUrl ? { docUrl } : {})')
      expect(useRoomRaw).toContain('action: \'close_doc\', ...(loai ? { loai } : {}), ...(docUrl ? { docUrl } : {})')
    })
  })

  describe('4. YouTube Accurate Search & Sorting (Mới nhất lên đầu)', () => {
    it('uses protobuf sp=EgIIAw%253D%253D to enforce Video Type + Upload Date sorting', () => {
      expect(workerIndexRaw).toContain("sort === 'upload_date'")
      expect(workerIndexRaw).toContain("sp = '&sp=EgIIAw%253D%253D'")
    })

    it('sorts results chronologically descending via parseUploadMinutesAgo', () => {
      expect(workerIndexRaw).toContain('parseUploadMinutesAgo')
      expect(workerIndexRaw).toContain('results.sort((a, b) => parseUploadMinutesAgo(a.publishedTime) - parseUploadMinutesAgo(b.publishedTime))')
    })
  })
})
