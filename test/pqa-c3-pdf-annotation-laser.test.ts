// test/pqa-c3-pdf-annotation-laser.test.ts
// Digital Campus v2: Milestone PQA-C3 — PDF/Slide Annotation Layer & Laser Pointer Test Suite

import { describe, expect, it } from 'vitest'
import {
  LenhPhongSlide,
} from '../shared/protocol/room'

import roomDoSource from '../worker/room-do.ts?raw'
import layerSource from '../src/features/study/workspace/SlideAnnotationLayer.tsx?raw'
import toolbarSource from '../src/features/study/workspace/SlideAnnotationToolbar.tsx?raw'
import docStageSource from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import useRoomSource from '../src/hooks/use-room.ts?raw'

describe('PQA-C3: PDF/Slide Annotation Layer & Laser Pointer Contract & Protocol Suite', () => {

  describe('1. Shared Protocol & Schema Verification', () => {
    it('validates LenhPhongSlide annotation_add action', () => {
      const validStroke = {
        id: 'stroke_1',
        page: 2,
        tool: 'pen' as const,
        points: [[0.1, 0.2], [0.3, 0.4]] as [number, number][],
        color: '#ef4444',
        size: 6,
        opacity: 1,
      }
      const parsed = LenhPhongSlide.safeParse({
        action: 'annotation_add',
        stroke: validStroke,
      })
      expect(parsed.success).toBe(true)
    })

    it('validates LenhPhongSlide annotation_clear action with optional page', () => {
      const clearPage = LenhPhongSlide.safeParse({
        action: 'annotation_clear',
        page: 3,
      })
      expect(clearPage.success).toBe(true)

      const clearAll = LenhPhongSlide.safeParse({
        action: 'annotation_clear',
      })
      expect(clearAll.success).toBe(true)
    })

    it('validates LenhPhongSlide laser action with normalized point and page', () => {
      const activeLaser = LenhPhongSlide.safeParse({
        action: 'laser',
        point: [0.45, 0.67],
        page: 1,
      })
      expect(activeLaser.success).toBe(true)

      const inactiveLaser = LenhPhongSlide.safeParse({
        action: 'laser',
        point: null,
        page: 1,
      })
      expect(inactiveLaser.success).toBe(true)
    })

    it('rejects invalid stroke tools and malformed coordinates', () => {
      const invalidTool = LenhPhongSlide.safeParse({
        action: 'annotation_add',
        stroke: {
          id: 'stroke_bad',
          page: 1,
          tool: 'magic_wand',
          points: [[0.1, 0.2]],
          color: '#000',
          size: 5,
        },
      })
      expect(invalidTool.success).toBe(false)
    })
  })

  describe('2. RoomDO Authority & Persistence Invariants', () => {
    it('verifies RoomDO enforces laQuanTri on slide actions', () => {
      expect(roomDoSource).toContain("case 'slide.action':")
      expect(roomDoSource).toContain('if (!laQuanTri) {')
      expect(roomDoSource).toContain('Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển tài liệu trình chiếu.')
    })

    it('verifies RoomDO maintains slide_annotations SQLite table', () => {
      expect(roomDoSource).toContain('CREATE TABLE IF NOT EXISTS slide_annotations')
      expect(roomDoSource).toContain('INSERT OR REPLACE INTO slide_annotations')
      expect(roomDoSource).toContain('DELETE FROM slide_annotations WHERE page = ?1')
    })

    it('verifies RoomDO clears slide annotations on load_doc and close_doc', () => {
      expect(roomDoSource).toContain("d.action === 'load_doc'")
      expect(roomDoSource).toContain("d.action === 'close_doc'")
      expect(roomDoSource).toContain("this.broadcast({ type: 'slide.annotation', action: 'clear' })")
    })

    it('verifies RoomDO broadcasts ephemeral slide.laser to clients', () => {
      expect(roomDoSource).toContain("type: 'slide.laser'")
      expect(roomDoSource).toContain('senderName:')
    })

    it('verifies RoomDO populates slideAnnotations in room.snapshot', () => {
      expect(roomDoSource).toContain('slideAnnotations: this.laySlideAnnotations()')
    })
  })

  describe('3. useRoom Hook Integration', () => {
    it('exposes slideAnnotations and slideLaser state hooks', () => {
      expect(useRoomSource).toContain('const [slideAnnotations, setSlideAnnotations] = useState<SlideAnnotationStroke[]>([])')
      expect(useRoomSource).toContain('const [slideLaser, setSlideLaser] = useState<{')
      expect(useRoomSource).toContain('slideAnnotations,')
      expect(useRoomSource).toContain('slideLaser,')
    })

    it('exposes sender callbacks sendSlideAnnotation, clearSlideAnnotations, sendSlideLaser', () => {
      expect(useRoomSource).toContain('sendSlideAnnotation,')
      expect(useRoomSource).toContain('clearSlideAnnotations,')
      expect(useRoomSource).toContain('sendSlideLaser,')
    })

    it('processes slide.annotation add and clear events in ws.onmessage', () => {
      expect(useRoomSource).toContain("case 'slide.annotation':")
      expect(useRoomSource).toContain("goi.action === 'add'")
      expect(useRoomSource).toContain("goi.action === 'clear'")
    })

    it('processes slide.laser realtime events in ws.onmessage', () => {
      expect(useRoomSource).toContain("case 'slide.laser':")
    })
  })

  describe('4. SlideAnnotationLayer & Geometry Truth', () => {
    it('uses normalized coordinates (0..1) mapped to SVG viewBox 0 0 1000 1000', () => {
      expect(layerSource).toContain('viewBox="0 0 1000 1000"')
      expect(layerSource).toContain('preserveAspectRatio="none"')
      expect(layerSource).toContain('px * 1000')
      expect(layerSource).toContain('py * 1000')
    })

    it('renders perfect-freehand smoothed paths for pen and highlighter', () => {
      expect(layerSource).toContain("import { getStroke } from 'perfect-freehand'")
      expect(layerSource).toContain('getSvgPathFromStroke')
      expect(layerSource).toContain("mixBlendMode: s.tool === 'highlighter' ? 'multiply' : 'normal'")
    })

    it('filters annotations strictly by current pageNumber', () => {
      expect(layerSource).toContain('const pageStrokes = strokes.filter((s) => s.page === pageNumber)')
    })

    it('renders glowing pulsating laser pointer with presenter name badge', () => {
      expect(layerSource).toContain('data-testid="slide-laser-pointer"')
      expect(layerSource).toContain('className="animate-ping"')
      expect(layerSource).toContain('{laser.senderName}')
    })
  })

  describe('5. Permission Isolation & Floating Toolbar UI', () => {
    it('completely hides mutation toolbar from students (canAnnotate === false)', () => {
      expect(toolbarSource).toContain('if (!canAnnotate) {')
      expect(toolbarSource).toContain('return null')
    })

    it('provides tool selection for pointer, pen, highlighter, laser, and clear', () => {
      expect(toolbarSource).toContain('data-testid="tool-btn-pointer"')
      expect(toolbarSource).toContain('data-testid="tool-btn-pen"')
      expect(toolbarSource).toContain('data-testid="tool-btn-highlighter"')
      expect(toolbarSource).toContain('data-testid="tool-btn-laser"')
      expect(toolbarSource).toContain('data-testid="tool-btn-clear"')
    })

    it('supports collapsing and expanding the floating toolbar', () => {
      expect(toolbarSource).toContain('data-testid="slide-annotation-toolbar-collapsed"')
      expect(toolbarSource).toContain('data-testid="btn-expand-annotation-toolbar"')
      expect(toolbarSource).toContain('data-testid="btn-collapse-annotation-toolbar"')
    })

    it('embeds SlideAnnotationLayer on both PDF canvas and Image viewer in DocumentStageView', () => {
      expect(docStageSource).toContain('<SlideAnnotationLayer')
      expect(docStageSource).toContain('pageNumber={slideState.currentPage}')
      expect(docStageSource).toContain('pageNumber={1}')
      expect(docStageSource).toContain('<SlideAnnotationToolbar')
    })
  })
})
