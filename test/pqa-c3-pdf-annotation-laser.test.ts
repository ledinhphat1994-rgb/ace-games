// test/pqa-c3-pdf-annotation-laser.test.ts
// Digital Campus v2: Milestone PQA-C3 — PDF/Slide Annotation Layer & Laser Pointer Test Suite

import { describe, expect, it } from 'vitest'
import {
  LenhPhongSlide,
  type SlideAnnotationStroke,
} from '../shared/protocol/room'
import {
  downsampleStrokePoints,
  hitTestStrokes,
} from '../src/features/study/workspace/annotation-geometry'

import roomDoSource from '../worker/room-do.ts?raw'
import layerSource from '../src/features/study/workspace/SlideAnnotationLayer.tsx?raw'
// Công cụ chú thích / laser nay nằm trong khay "Công cụ" chung trên thanh dock (không còn thanh riêng trên trang).
import toolbarSource from '../src/features/study/workspace/ClassroomToolDock.tsx?raw'
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

    it('validates LenhPhongSlide annotation_remove action with stroke id', () => {
      const removeAction = LenhPhongSlide.safeParse({
        action: 'annotation_remove',
        id: 'stroke_abc_123',
      })
      expect(removeAction.success).toBe(true)

      const invalidRemove = LenhPhongSlide.safeParse({
        action: 'annotation_remove',
        id: '',
      })
      expect(invalidRemove.success).toBe(false)
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
    it('verifies RoomDO enforces moderator authority on slide actions', () => {
      expect(roomDoSource).toContain("case 'slide.action':")
      expect(roomDoSource).toContain('if (!laQuanTri) {')
      expect(roomDoSource).toContain('Chỉ chủ phòng hoặc người điều hành mới có quyền điều khiển tài liệu trình chiếu.')
    })

    it('verifies RoomDO maintains slide_annotations SQLite table and handles remove', () => {
      expect(roomDoSource).toContain('CREATE TABLE IF NOT EXISTS slide_annotations')
      expect(roomDoSource).toContain('INSERT OR REPLACE INTO slide_annotations')
      expect(roomDoSource).toContain('DELETE FROM slide_annotations WHERE page = ?1')
      expect(roomDoSource).toContain('DELETE FROM slide_annotations WHERE id = ?1')
      expect(roomDoSource).toContain("this.broadcast({ type: 'slide.annotation', action: 'remove', strokeId: d.id })")
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

    it('exposes sender callbacks sendSlideAnnotation, clearSlideAnnotations, removeSlideAnnotation, sendSlideLaser', () => {
      expect(useRoomSource).toContain('sendSlideAnnotation,')
      expect(useRoomSource).toContain('clearSlideAnnotations,')
      expect(useRoomSource).toContain('removeSlideAnnotation,')
      expect(useRoomSource).toContain('sendSlideLaser,')
    })

    it('processes slide.annotation add, remove, and clear events in ws.onmessage', () => {
      expect(useRoomSource).toContain("case 'slide.annotation':")
      expect(useRoomSource).toContain("goi.action === 'add'")
      expect(useRoomSource).toContain("goi.action === 'remove'")
      expect(useRoomSource).toContain("goi.action === 'clear'")
    })

    it('processes slide.laser realtime events in ws.onmessage', () => {
      expect(useRoomSource).toContain("case 'slide.laser':")
    })
  })

  describe('4. Stroke Point Compacting & Long Stroke Regression (No Stroke Loss)', () => {
    it('downsamples long input stroke (>300 points) to <= 300 points', () => {
      // Generate long 650-point stroke
      const rawPoints: [number, number][] = []
      for (let i = 0; i < 650; i++) {
        const t = i / 649
        rawPoints.push([t, Math.sin(t * Math.PI)])
      }
      expect(rawPoints.length).toBe(650)

      const compacted = downsampleStrokePoints(rawPoints, 300)
      expect(compacted.length).toBeLessThanOrEqual(300)
      expect(compacted.length).toBe(300)
    })

    it('strictly preserves the first and last point of long strokes', () => {
      const rawPoints: [number, number][] = []
      const firstPoint: [number, number] = [0.052, 0.114]
      const lastPoint: [number, number] = [0.895, 0.943]

      rawPoints.push(firstPoint)
      for (let i = 1; i < 450; i++) {
        rawPoints.push([0.052 + (i / 450) * 0.84, 0.114 + (i / 450) * 0.82])
      }
      rawPoints.push(lastPoint)

      const compacted = downsampleStrokePoints(rawPoints, 300)
      expect(compacted.length).toBe(300)

      // First point retained
      expect(compacted[0][0]).toBeCloseTo(firstPoint[0], 3)
      expect(compacted[0][1]).toBeCloseTo(firstPoint[1], 3)

      // Last point retained
      const finalCompacted = compacted[compacted.length - 1]
      expect(finalCompacted[0]).toBeCloseTo(lastPoint[0], 3)
      expect(finalCompacted[1]).toBeCloseTo(lastPoint[1], 3)
    })

    it('clamps all coordinates strictly to [0, 1]', () => {
      const outOfBounds: [number, number][] = [
        [-0.5, 1.5],
        [0.2, 0.3],
        [1.2, -0.1],
      ]
      const compacted = downsampleStrokePoints(outOfBounds, 300)
      for (const [x, y] of compacted) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(1)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(1)
      }
    })

    it('keeps short strokes (<=300 points) un-decimated', () => {
      const short: [number, number][] = [
        [0.1, 0.2],
        [0.3, 0.4],
        [0.5, 0.6],
      ]
      const compacted = downsampleStrokePoints(short, 300)
      expect(compacted.length).toBe(3)
      expect(compacted[0]).toEqual([0.1, 0.2])
      expect(compacted[2]).toEqual([0.5, 0.6])
    })
  })

  describe('5. Real Eraser Hit-Testing & Multi-Tool Suite', () => {
    const testStrokes: SlideAnnotationStroke[] = [
      {
        id: 'stroke_bottom',
        page: 1,
        tool: 'pen',
        points: [[0.1, 0.1], [0.5, 0.1]], // horizontal line at y=0.1
        color: '#000',
        size: 6,
      },
      {
        id: 'stroke_top',
        page: 1,
        tool: 'highlighter',
        points: [[0.3, 0.05], [0.3, 0.5]], // vertical line at x=0.3
        color: '#ff0',
        size: 22,
      },
    ]

    it('hit-tests stroke segment within threshold', () => {
      // Point close to horizontal stroke (0.2, 0.105)
      const hit = hitTestStrokes([0.2, 0.105], testStrokes, 0.03)
      expect(hit).toBe('stroke_bottom')
    })

    it('returns top-most (most recent) stroke when strokes intersect', () => {
      // Point at intersection (0.3, 0.1)
      const hit = hitTestStrokes([0.3, 0.1], testStrokes, 0.03)
      expect(hit).toBe('stroke_top') // stroke_top is last in array (on top)
    })

    it('returns null if click is far outside threshold', () => {
      const miss = hitTestStrokes([0.9, 0.9], testStrokes, 0.03)
      expect(miss).toBeNull()
    })

    it('supports eraser tool without clearing the entire page', () => {
      // Tẩy từng nét nằm ngay trên dock, tách khỏi nút Xoá hết
      expect(toolbarSource).toContain('data-testid="tool-btn-eraser"')
      expect(toolbarSource).toContain('data-testid="tool-btn-clear-all"')
      // Verify eraser invokes onRemoveStroke with hitId, not onClearPage
      expect(layerSource).toContain('onRemoveStroke?.(hitId)')
    })
  })

  describe('6. Permission Isolation & Floating Toolbar UI', () => {
    it('students cannot annotate slides or use laser / clear-page (presenter-only)', () => {
      // Lớp chú thích bỏ qua mọi thao tác khi không có quyền trình chiếu.
      expect(layerSource).toContain('if (!canAnnotate) return')
      // Chuột / bút / tẩy / xoá hết trên dock và công cụ vẽ trong khay chỉ dành cho người trình chiếu.
      expect(toolbarSource).toMatch(/\{canControl && \(\s*<>/)
      expect(toolbarSource).toMatch(/\{canControl && \(\s*<div className="grid grid-cols-4 gap-1">/)
    })

    it('provides tool selection for pointer, pen, highlighter, eraser, laser, and clear', () => {
      expect(toolbarSource).toContain('data-testid="tool-btn-pointer"')
      expect(toolbarSource).toContain('data-testid="tool-btn-pen"')
      expect(toolbarSource).toContain("testId: 'tool-btn-highlighter'")
      expect(toolbarSource).toContain('data-testid="tool-btn-eraser"')
      expect(toolbarSource).toContain("testId: 'tool-btn-laser'")
      expect(toolbarSource).toContain('data-testid="tool-btn-clear-all"')
    })

    it('tools tray offers text and one shape tool (pick the shape inside); colour / size only for tools that use them', () => {
      expect(toolbarSource).toContain("testId: 'tool-btn-text'")
      expect(toolbarSource).toContain("testId: 'tool-btn-shape'")
      expect(toolbarSource).toContain('data-testid="dock-shape-picker"')
      expect(toolbarSource).toContain('data-testid="dock-color-palette"')
      expect(toolbarSource).toContain('data-testid="dock-size-picker"')
      expect(toolbarSource).toContain('{canControl && congCuKhay && CONG_CU_CO_MAU.has(congCu) && <BangMau {...bangMau} />}')
      expect(toolbarSource).toContain('data-testid="dock-pen-tray"')
    })

    it('embeds SlideAnnotationLayer on both PDF canvas and Image viewer in DocumentStageView with onRemoveStroke', () => {
      expect(docStageSource).toContain('<SlideAnnotationLayer')
      expect(docStageSource).toContain('pageNumber={slideState.currentPage}')
      expect(docStageSource).toContain('pageNumber={1}')
      expect(docStageSource).toContain('onRemoveStroke={onRemoveSlideAnnotation}')
      // Công cụ lấy từ bộ chung của sân khấu.
      expect(docStageSource).toContain('const activeTool = CONG_CU_TREN_TRANG[congCu]')
      expect(docStageSource).not.toContain('<SlideAnnotationToolbar')
    })
  })
})
