// test/move-tool-and-office-viewers.test.ts
// Digital Campus v2: Verification Suite for Move Tool & Client-Side Word/Excel Viewers

import { describe, expect, it } from 'vitest'
import {
  hopGioiHanNet,
  netDuocCham,
  diemHinh,
  type CongCu,
} from '../src/features/study/workspace/cong-cu'

// Raw source files for structural verification
import dockRaw from '../src/features/study/workspace/ClassroomToolDock.tsx?raw'
import bangVeRaw from '../src/features/study/workspace/BangVe.tsx?raw'
import slideLayerRaw from '../src/features/study/workspace/SlideAnnotationLayer.tsx?raw'
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import useRoomRaw from '../src/hooks/use-room.ts?raw'
import roomDoRaw from '../worker/room-do.ts?raw'
import xlsxViewerRaw from '../src/features/study/XlsxSpreadsheetViewer.tsx?raw'
import docxViewerRaw from '../src/features/study/DocxDocumentViewer.tsx?raw'
import khungLopRaw from '../src/features/study/workspace/KhungLop.tsx?raw'
import presentationStageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import roomProtoRaw from '../shared/protocol/room.ts?raw'
import videoPlayerRaw from '../src/features/study/workspace/EmbeddedVideoPlayer.tsx?raw'
import classInPollRaw from '../src/features/study/workspace/ClassInPollModal.tsx?raw'
import classroomWorkspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import classroomContextPanelRaw from '../src/features/study/workspace/ClassroomContextPanel.tsx?raw'
import workerIndexRaw from '../worker/index.ts?raw'
import studyRoomViewRaw from '../src/features/study/StudyRoomView.tsx?raw'

describe('Move Tool (Vùng 1) & Native Word/Excel Presentation Suite', () => {
  describe('1. Geometry & Hit-Testing for Move Tool (Bút, Chữ T, Hình, Dạ quang)', () => {
    const penStroke = {
      id: 'net_pen_1',
      points: [[100, 100], [150, 120], [200, 140]] as [number, number][],
      tool: 'pen',
      color: '#ef4444',
      size: 8,
    }

    const textStroke = {
      id: 'net_text_1',
      points: [[300, 300]] as [number, number][],
      tool: 'text',
      text: 'Xin chào 10A7',
      color: '#3b82f6',
      size: 32,
    }

    const shapeStroke = {
      id: 'net_shape_1',
      points: diemHinh('chu_nhat', [400, 400], [600, 550]),
      tool: 'shape',
      color: '#22c55e',
      size: 6,
    }

    const highlighterStroke = {
      id: 'net_hl_1',
      points: [[700, 200], [800, 200], [900, 200]] as [number, number][],
      tool: 'highlighter',
      color: '#facc15',
      size: 40,
    }

    const allStrokes = [penStroke, textStroke, shapeStroke, highlighterStroke]

    it('detects pen stroke hit test with both line proximity and grab margin', () => {
      const hit = netDuocCham([150, 122], allStrokes, 10, 1, true)
      expect(hit?.id).toBe('net_pen_1')
    })

    it('detects text stroke hit test within its estimated bounding box', () => {
      const hit = netDuocCham([340, 315], allStrokes, 10, 1, true)
      expect(hit?.id).toBe('net_text_1')
    })

    it('detects shape stroke hit test inside the shape body when chonCaBenTrong is true', () => {
      // Center of rectangle [400, 400] to [600, 550] is [500, 475]
      const hitInside = netDuocCham([500, 475], allStrokes, 10, 1, true)
      expect(hitInside?.id).toBe('net_shape_1')
    })

    it('detects highlighter stroke hit test with generous stroke thickness', () => {
      const hit = netDuocCham([800, 215], allStrokes, 10, 1, true)
      expect(hit?.id).toBe('net_hl_1')
    })

    it('hopGioiHanNet computes accurate bounding boxes for all 4 product types', () => {
      const penBox = hopGioiHanNet(penStroke)
      expect(penBox).not.toBeNull()
      expect(penBox!.minX).toBeLessThan(100)
      expect(penBox!.maxX).toBeGreaterThan(200)

      const textBox = hopGioiHanNet(textStroke)
      expect(textBox).not.toBeNull()
      expect(textBox!.width).toBeGreaterThan(50)
      expect(textBox!.height).toBeGreaterThan(20)

      const shapeBox = hopGioiHanNet(shapeStroke)
      expect(shapeBox).not.toBeNull()
      expect(shapeBox!.minX).toBeLessThanOrEqual(400)
      expect(shapeBox!.maxX).toBeGreaterThanOrEqual(600)
      expect(shapeBox!.minY).toBeLessThanOrEqual(400)
      expect(shapeBox!.maxY).toBeGreaterThanOrEqual(550)

      const hlBox = hopGioiHanNet(highlighterStroke)
      expect(hlBox).not.toBeNull()
      expect(hlBox!.width).toBeGreaterThanOrEqual(200)
    })
  })

  describe('2. Tool Dock (Vùng 1) Verification', () => {
    it('has di_chuyen tool in CongCu union', () => {
      const validTool: CongCu = 'di_chuyen'
      expect(validTool).toBe('di_chuyen')
    })

    it('contains Di chuyển button in Vùng 1 right next to Chuột', () => {
      expect(dockRaw).toContain('tool-btn-move')
      expect(dockRaw).toContain('Di chuyển')
      expect(dockRaw).toContain('tool-btn-pointer')
      // Ensure Move icon is imported from lucide-react
      expect(dockRaw).toMatch(/import\s*\{[^}]*Move[^}]*\}\s*from\s*['"]lucide-react['"]/)
    })
  })

  describe('3. Whiteboard & Slide Annotation Drag/Move Mechanics', () => {
    it('BangVe supports di_chuyen tool with grab/grabbing cursor and selection box', () => {
      expect(bangVeRaw).toContain("congCu === 'di_chuyen'")
      expect(bangVeRaw).toContain('dangKeoRef')
      expect(bangVeRaw).toContain('keoNetRef')
      expect(bangVeRaw).toContain('keoOffset')
      expect(bangVeRaw).toContain('hopGioiHanNet')
      expect(bangVeRaw).toContain('strokeDasharray="4 4"')
    })

    it('SlideAnnotationLayer supports move tool for slide annotations', () => {
      expect(slideLayerRaw).toContain("activeTool === 'move'")
      expect(slideLayerRaw).toContain('keoOffset')
      expect(slideLayerRaw).toContain('hopGioiHanNet')
      expect(slideLayerRaw).toContain("'grabbing'")
      expect(slideLayerRaw).toContain("'grab'")
    })
  })

  describe('4. Realtime Synchronization & Persistence for Moved Strokes', () => {
    it('use-room.ts replaces stroke when ID matches so moved strokes update in-place', () => {
      expect(useRoomRaw).toContain('const tonTai = prev.some((s) => s.id === st.id)')
      expect(useRoomRaw).toContain('return prev.map((s) => (s.id === st.id ? st : s))')
    })

    it('room-do.ts uses INSERT OR REPLACE so moved strokes overwrite SQLite database', () => {
      expect(roomDoRaw).toContain('INSERT OR REPLACE INTO whiteboard_strokes')
      expect(roomDoRaw).toContain('INSERT OR REPLACE INTO slide_annotations')
    })
  })

  describe('5. Client-Side Native Word & Excel Presentation (No Microsoft Office Live Failures)', () => {
    it('DocumentStageView imports and uses DocxDocumentViewer and XlsxSpreadsheetViewer', () => {
      expect(docStageRaw).toContain('import { DocxDocumentViewer } from \'../DocxDocumentViewer\'')
      expect(docStageRaw).toContain('import { XlsxSpreadsheetViewer } from \'../XlsxSpreadsheetViewer\'')
      expect(docStageRaw).toContain('data-testid="doc-word-viewer"')
      expect(docStageRaw).toContain('data-testid="doc-excel-viewer"')
    })

    it('DocumentStageView detects Word files (.docx, .doc)', () => {
      expect(docStageRaw).toContain('isWord')
      expect(docStageRaw).toMatch(/\\.\(docx\|doc\)\$/i)
    })

    it('DocumentStageView detects Excel files (.xlsx, .xls, .csv)', () => {
      expect(docStageRaw).toContain('isExcel')
      expect(docStageRaw).toMatch(/\\.\(xlsx\|xls\|csv\)\$/i)
    })

    it('DocumentStageView displays Word and Excel badges in the document header', () => {
      expect(docStageRaw).toContain("app === 'excel'")
      expect(docStageRaw).toContain("app === 'word'")
    })
  })

  describe('6. Multi-Document Capacity (Up to 3 Types) & Mini-Cards Switching (Vùng 1)', () => {
    it('room-do.ts manages loadedDocs with up to 3 slots (pptx, excel, word) and does not purge active slots', () => {
      expect(roomDoRaw).toContain('loadedDocs')
      expect(roomDoRaw).toContain('LoaiTaiLieuNap')
      expect(roomDoRaw).toContain("action === 'switch_doc'")
      // Ensures old document is only cleaned from R2 if it is NOT in loadedDocs
      expect(roomDoRaw).toContain('!loadedDocs.some((x) => x.docId === docCu)')
    })

    it('use-room.ts provides switchSlideDoc and supports selective closeSlideDoc with LoaiTaiLieuNap', () => {
      expect(useRoomRaw).toContain('switchSlideDoc')
      expect(useRoomRaw).toContain("action: 'switch_doc'")
      expect(useRoomRaw).toContain('closeSlideDoc = useCallback((loai?: LoaiTaiLieuNap')
      // Optimistic update in sendSlideAnnotation prevents network lag flicker
      expect(useRoomRaw).toContain('setSlideAnnotations((prev)')
    })

    it('DocumentStageView renders mini-cards when loadedDocs.length > 1 and allows switching', () => {
      expect(docStageRaw).toContain('data-testid="doc-loaded-tabs"')
      expect(docStageRaw).toContain('data-testid={`doc-tab-${app}`}')
      expect(docStageRaw).toContain('onSwitchDoc?.(app')
      // Supports document apps: PPTX, Excel, Word, Image
      expect(docStageRaw).toContain("app === 'image'")
      expect(docStageRaw).toContain('ImageIcon')
      // Eliminates redundant add button per user requirement
      expect(docStageRaw).not.toContain('data-testid="doc-btn-add-type"')
    })

    it('ClassroomToolDock renders doc count badge positioned safely inside button (Zero Overlap Invariant)', () => {
      expect(dockRaw).toContain('data-testid="dock-doc-count-badge"')
      expect(dockRaw).toContain('soLuongTaiLieu')
      // No negative offsets that cause parent overflow-x-auto clipping or overlap adjacent buttons
      expect(dockRaw).toContain('top-1 right-1')
      expect(dockRaw).not.toContain('-top-1 -right-1')
    })

    it('room-do.ts correctly classifies image documents and assigns loai: image', () => {
      expect(roomDoRaw).toContain("loai: LoaiTaiLieuNap")
      expect(roomDoRaw).toContain("d.fileType === 'image'")
      expect(roomDoRaw).toContain("isImage ? 'image'")
    })

    it('DocumentStageView supports smooth image pan with Move tool and prevents browser ghost drag', () => {
      expect(docStageRaw).toContain('imagePan')
      expect(docStageRaw).toContain('handlePanBackground')
      expect(docStageRaw).toContain('onDragStart={(e) => e.preventDefault()}')
      expect(slideLayerRaw).toContain('onPanBackground')
    })
  })

  describe('7. GPU Transform & Hardware Acceleration for Smooth Dragging (Vùng 2)', () => {
    it('BangVe uses transform="translate(dx, dy)" and RAF throttling for smooth 60fps drag', () => {
      expect(bangVeRaw).toContain('rafKeoRef')
      expect(bangVeRaw).toContain('requestAnimationFrame')
      expect(bangVeRaw).toContain('transform={laDangKeo ? `translate(${dx}, ${dy})` : undefined}')
    })

    it('SlideAnnotationLayer uses transform="translate(dx, dy)" and RAF throttling', () => {
      expect(slideLayerRaw).toContain('rafKeoRef')
      expect(slideLayerRaw).toContain('requestAnimationFrame')
      expect(slideLayerRaw).toContain('transform={laDangKeo ? `translate(${dx}, ${dy})` : undefined}')
    })

    it('KhungLop throttles window broadcast events with RAF to prevent websocket flood', () => {
      expect(khungLopRaw).toContain('rafKeoKhungRef')
      expect(khungLopRaw).toContain('requestAnimationFrame')
    })
  })

  describe('8. Single Canonical Toolbar & Unified View (Vùng 3)', () => {
    it('XlsxSpreadsheetViewer and DocxDocumentViewer support hideHeader defaulting to true', () => {
      expect(xlsxViewerRaw).toContain('hideHeader = true')
      expect(docxViewerRaw).toContain('hideHeader = true')
    })

    it('DocumentStageView passes hideHeader={true} and external zoom/search to eliminate duplicate toolbars', () => {
      expect(docStageRaw).toContain('hideHeader={true}')
      expect(docStageRaw).toContain('scale={zoomScale}')
      expect(docStageRaw).toContain('search={searchExcel}')
      expect(docStageRaw).toContain('data-testid="doc-excel-search"')
      expect(docStageRaw).toContain('data-testid="doc-zoom-controls"')
    })
  })

  describe('9. Multi-Document Switch, Floating Board Close & Scoped Document Actions', () => {
    it('shared/protocol/room.ts LenhPhongSlide allows image in switch_doc and close_doc (Vùng 1)', () => {
      expect(roomProtoRaw).toContain("loai: z.enum(['pptx', 'excel', 'word', 'image'])")
    })

    it('use-room.ts switchSlideDoc and closeSlideDoc update slideState optimistically (Vùng 1)', () => {
      expect(useRoomRaw).toContain('setSlideState((prev) =>')
      expect(useRoomRaw).toContain('prev.loadedDocs.find((x) => x.loai === loai)')
      expect(useRoomRaw).toContain('prev.loadedDocs.filter((x) => x.loai !== loai)')
    })

    it('PresentationStage passes onDong to NutKhung enabling X close button on floating board while omitting for doc (Vùng 2)', () => {
      expect(presentationStageRaw).toContain("onDong={id === 'doc' ? undefined : () => onAn(id)}")
      expect(presentationStageRaw).toContain("tieuDeDong={id === 'board' ? 'Tắt bảng'")
      expect(presentationStageRaw).toContain('testIdDong={`layer-${id}-close`}')
    })

    it('DocumentStageView top-right close button completely shuts down presentation mode (Vùng 2)', () => {
      expect(docStageRaw).toContain('onCloseDoc()')
      expect(docStageRaw).toContain('data-testid="doc-btn-close"')
      expect(docStageRaw).toContain('title="Tắt trình chiếu"')
    })

    it('DocumentStageView isolates zoom and fit settings per active document (Vùng 3)', () => {
      expect(docStageRaw).toContain('docViewSettings')
      expect(docStageRaw).toContain('currentDocKey')
    })
  })

  describe('10. Single Color Video Viewport, Smooth Drag Optimism & Tab-Scoped Stroke Persistence', () => {
    it('KhungLop enforces 16:9 aspect-video and locks proportional resizing for video layer (Vùng 1)', () => {
      expect(khungLopRaw).toContain("id === 'video' ? 'aspect-video' : ''")
      expect(khungLopRaw).toContain("aspectRatio: '16 / 9'")
      expect(khungLopRaw).toContain("moiCao = Math.round(moiRong * 9 / 16)")
      expect(khungLopRaw).toContain("moiRong = Math.round(moiCao * 16 / 9)")
    })

    it('EmbeddedVideoPlayer uses uniform #101010 background matching YouTube letterbox tone (Vùng 1)', () => {
      expect(videoPlayerRaw).toContain('bg-[#101010]')
      expect(videoPlayerRaw).not.toContain('bg-black select-none')
    })

    it('use-room.ts provides optimistic local updates for whiteboard and slide annotation strokes (Vùng 2)', () => {
      expect(useRoomRaw).toContain('setWhiteboardStrokes((prev) =>')
      expect(useRoomRaw).toContain('setSlideAnnotations((prev) =>')
    })

    it('BangVe and SlideAnnotationLayer elevate dragged stroke with drop shadow (Vùng 2)', () => {
      expect(bangVeRaw).toContain('filter={laDangKeo ?')
      expect(slideLayerRaw).toContain('filter={laDangKeo ?')
    })

    it('shared/protocol/room.ts includes optional docUrl on WhiteboardStroke and SlideAnnotationStroke (Vùng 3)', () => {
      expect(roomProtoRaw).toContain('docUrl?: string')
    })

    it('room-do.ts does not delete strokes on switch_doc and preserves strokes across document tabs (Vùng 3)', () => {
      const startIdx = roomDoRaw.indexOf("d.action === 'switch_doc'")
      const endIdx = roomDoRaw.indexOf("d.action === 'close_doc'", startIdx)
      const switchDocBlock = roomDoRaw.slice(startIdx, endIdx)
      expect(switchDocBlock).not.toContain('DELETE FROM slide_annotations')
      expect(switchDocBlock).not.toContain("xoaNetTheoMat('tailieu')")
      expect(roomDoRaw).toContain("xoaNetTheoMat(mat: MatNet, docUrl?: string)")
    })

    it('BangVe and SlideAnnotationLayer filter and persist strokes scoped by docUrl (Vùng 3)', () => {
      expect(bangVeRaw).toContain('docUrl?: string')
      expect(bangVeRaw).toContain('s.docUrl === docUrl')
      expect(slideLayerRaw).toContain('docUrl?: string')
      expect(slideLayerRaw).toContain('s.docUrl === docUrl')
    })
  })

  describe('11. Bounding Box Click-to-Move (Vùng 1), Dock Pin (Vùng 3) & ClassIn Quick Poll with Countdown', () => {
    it('BangVe & SlideAnnotationLayer allow dragging strokes by clicking anywhere inside bounding box (Vùng 1)', () => {
      expect(bangVeRaw).toContain('if (netDuocChon) {')
      expect(bangVeRaw).toContain('const hop = hopGioiHanNet(daChon, 1)')
      expect(bangVeRaw).toContain('p[0] >= hop.minX - pad')
      expect(slideLayerRaw).toContain('if (netDuocChon) {')
      expect(slideLayerRaw).toContain('const hop = hopGioiHanNet(daChon, tiLeNgang)')
      expect(slideLayerRaw).toContain('pt[0] >= hop.minX - padX')
    })

    it('ClassroomToolDock & ClassroomWorkspace support Pin dock to stay fixed without auto-collapse (Vùng 3)', () => {
      expect(dockRaw).toContain('data-testid="dock-btn-pin"')
      expect(dockRaw).toContain('dockPinned')
      expect(dockRaw).toContain('onTogglePin')
      expect(classroomWorkspaceRaw).toContain('c10a7_dock_pinned')
      expect(classroomWorkspaceRaw).toContain('toggleDockPinned')
      expect(classroomWorkspaceRaw).toContain('const anDock = dockThuGon && !khayDockMo')
      expect(classroomWorkspaceRaw).toContain('if (dockPinned) return')
    })

    it('ClassInPollModal provides ClassIn-style interactive poll with countdown timer', () => {
      expect(classInPollRaw).toContain('data-testid="classin-poll-modal"')
      expect(classInPollRaw).toContain('data-testid="poll-templates-grid"')
      expect(classInPollRaw).toContain('TIMER_PRESETS')
      expect(classInPollRaw).toContain('secondsRemaining')
      expect(dockRaw).toContain('data-testid="tool-btn-poll"')
    })

    it('ClassInPollModal divides layout into 5 distinct small cards', () => {
      expect(classInPollRaw).toContain('data-testid="poll-type-card"')
      expect(classInPollRaw).toContain('data-testid="poll-content-card"')
      expect(classInPollRaw).toContain('data-testid="poll-timer-card"')
      expect(classInPollRaw).toContain('data-testid="poll-action-card"')
      expect(classInPollRaw).toContain('data-testid="poll-stats-card"')
    })

    it('ClassInPollModal supports dynamic letter options (+/-), text answer type, and removes Tuỳ chỉnh/Tạo mới', () => {
      // Default starts with 1 letter ['A']
      expect(classInPollRaw).toContain("useState<string[]>(['A'])")
      // Plus and Minus buttons to add / remove options
      expect(classInPollRaw).toContain('handleAddOption')
      expect(classInPollRaw).toContain('handleRemoveOption')
      // Text question type
      expect(classInPollRaw).toContain('TEXT')
      expect(classInPollRaw).toContain('Điền text')
      // Removed Tuỳ chỉnh & Tạo mới
      expect(classInPollRaw).not.toContain('Tuỳ chỉnh')
      expect(classInPollRaw).not.toContain('Tùy chỉnh')
      expect(classInPollRaw).not.toContain('Tạo mới')
    })

    it('Vùng 2 (Dock) and Vùng 2+ (Chat Composer) share identical height and do not collide with stage/messages', () => {
      // Both dock and composer have matching heights h-[60px] sm:h-16
      expect(dockRaw).toContain('h-[60px] sm:h-16')
      expect(classroomContextPanelRaw).toContain('h-[60px] sm:h-16')

      // Vùng 3 (Stage) is separated from Vùng 2 (Dock) via gap-2 in ClassroomWorkspace
      expect(classroomWorkspaceRaw).toContain('gap-2')
      expect(classroomWorkspaceRaw).toContain('relative z-30 flex h-[60px] sm:h-16 shrink-0 items-center justify-center')

      // Vùng 4 (Messages list) is separated from Vùng 2+ (Composer) via gap-2 in ClassroomContextPanel
      expect(classroomContextPanelRaw).toContain('gap-2')
      expect(classroomContextPanelRaw).toContain('data-testid="context-panel-chat"')
    })

    it('shared/protocol/room.ts and worker/room-do.ts support durationSeconds, endsAt, and alarm expiry for polls', () => {
      expect(roomProtoRaw).toContain('durationSeconds: z.number().int().min(5).max(3600).optional()')
      expect(roomProtoRaw).toContain('endsAt?: number')
      expect(roomDoRaw).toContain('duration_seconds INTEGER NOT NULL DEFAULT 0')
      expect(roomDoRaw).toContain('ends_at INTEGER NOT NULL DEFAULT 0')
      expect(roomDoRaw).toContain('this.kiemTraVaCapNhatPoll(now)')
    })

    it('ClassInPollModal supports 2-col multiple choice inputs, marking correct option, uniform timer size, and viewing other answers toggle', () => {
      // 2 options per line with input and correct answer button
      expect(classInPollRaw).toContain('grid grid-cols-2 gap-2')
      expect(classInPollRaw).toContain('optionTexts')
      expect(classInPollRaw).toContain('correctOptionIndex')
      expect(classInPollRaw).toContain('Đáp án đúng')
      // Uniform timer button height & styling
      expect(classInPollRaw).toContain('h-9 w-full rounded-xl')
      // Toggle for viewing other candidates answers
      expect(classInPollRaw).toContain('allowViewOtherAnswers')
      expect(classInPollRaw).toContain('role="switch"')
      expect(classInPollRaw).toContain('Xem đáp án của người khác')
      // Protocol and DO support for allowViewOtherAnswers & correctOptionId
      expect(roomProtoRaw).toContain('allowViewOtherAnswers?: boolean')
      expect(roomProtoRaw).toContain('correctOptionId?: string')
      expect(roomDoRaw).toContain('allow_view_other_answers')
      expect(roomDoRaw).toContain('correct_option_id')
    })

    it('ClassInPollModal enforces participant restrictions and provides 2-tab creator workflow with poll history', () => {
      // 1. Participant restrictions: No drag, no close X button
      expect(classInPollRaw).toContain('onPointerDown={canControl ? handlePointerDown : undefined}')
      expect(classInPollRaw).toContain('{canControl && (')
      expect(classInPollRaw).toContain('title="Đóng bảng bình chọn"')

      // 2. Correct option letter is NOT obscured by checkmark
      expect(classInPollRaw).toContain('{badgeLetter}')
      expect(classInPollRaw).not.toContain('{isCorrect ? <Check className="size-3.5 stroke-[3]" /> : badgeLetter}')

      // 3. Removed public / private text from question metadata
      expect(classInPollRaw).not.toContain('<span>Công khai đáp án</span>')
      expect(classInPollRaw).not.toContain('<span>Ẩn đáp án</span>')

      // 4. Removed duplicate countdown in voted confirmation box
      expect(classInPollRaw).not.toContain('Còn ${secondsRemaining}s...')

      // 5. Host 2 main tabs: Soạn câu hỏi & Thống kê
      expect(classInPollRaw).toContain('Soạn câu hỏi')
      expect(classInPollRaw).toContain('Thống kê')
      expect(classInPollRaw).toContain("setCreatorTab('stats')")
      expect(classInPollRaw).toContain('Kết thúc bình chọn câu này')
      expect(classInPollRaw).toContain('Soạn câu tiếp theo')

      // 6. History preservation of past questions
      expect(classInPollRaw).toContain('pollHistory')
      expect(classInPollRaw).toContain('Lịch sử các câu đã hỏi')
    })

    it('Vùng 1 (ClassInPollModal): top anchor fixed, bottom collapse toggle, hide button, and real-time drag sync', () => {
      // 1. Fixed top anchor (items-start pt-14 sm:pt-20, not centered modal overlay)
      expect(classInPollRaw).toContain('items-start justify-center pt-14 sm:pt-20')
      expect(classInPollRaw).not.toContain('fixed inset-0 pointer-events-none z-50 flex items-center justify-center')

      // 2. Max height does not exceed stage and has scrollable body
      expect(classInPollRaw).toContain('max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-7rem)]')
      expect(classInPollRaw).toContain('overflow-y-auto')

      // 3. Vùng 2 (Bottom edge collapse bar) is cleanly deleted per user instruction
      expect(classInPollRaw).not.toContain('data-testid="poll-btn-collapse-toggle"')
      expect(classInPollRaw).not.toContain('setIsCollapsed')

      // 4. Initial question input starts empty (no pre-filled sample text)
      expect(classInPollRaw).toContain("const [question, setQuestion] = useState('')")

      // 5. Hide button (Minus icon) on Poll modal and across all document/stage layers in KhungLop
      expect(classInPollRaw).toContain('data-testid="poll-btn-hide"')
      expect(classInPollRaw).toContain('title="Ẩn bảng bình chọn"')
      expect(classInPollRaw).toContain('data-testid="poll-btn-close"')
      expect(khungLopRaw).toContain('<Minus className="h-3.5 w-3.5" />')
      expect(khungLopRaw).not.toContain('<EyeOff className="h-3.5 w-3.5" />')

      // 5. Real-time drag sync across participants
      expect(classInPollRaw).toContain('onMovePoll')
      expect(roomProtoRaw).toContain("'poll.move'")
      expect(roomProtoRaw).toContain('position?: { x: number; y: number }')
      expect(roomProtoRaw).toContain('session.poll.position')
      expect(roomDoRaw).toContain("case 'poll.move':")
      expect(roomDoRaw).toContain('session.poll.position')
      expect(classroomWorkspaceRaw).toContain('onMovePoll={onMovePoll}')
      expect(studyRoomViewRaw).toContain('onMovePoll={movePoll}')
    })

    it('Vùng 2 (EmbeddedVideoPlayer & RoomDO): close action resets media state and wipes video board annotations', () => {
      // Protocol supports close action
      expect(roomProtoRaw).toContain("z.literal('close')")

      // RoomDO handles close action: clears media and calls xoaNetTheoMat('video')
      expect(roomDoRaw).toContain("if (d.action === 'close')")
      expect(roomDoRaw).toContain("this.xoaNetTheoMat('video')")
      expect(roomDoRaw).toContain("videoId: ''")

      // PresentationStage and ClassroomWorkspace trigger 'close' action on close
      expect(presentationStageRaw).toContain("onSyncMedia('close')")
      expect(classroomWorkspaceRaw).toContain("if (id === 'video') onSyncMedia('close')")
      expect(videoPlayerRaw).toContain("'close'")
    })

    it('Vùng 3 (YouTube Live Search & Sorting): modern lockupViewModel parsing, sort parameters, and publishedTime', () => {
      // worker/index.ts parses both videoRenderer and lockupViewModel
      expect(workerIndexRaw).toContain('videoRenderer')
      expect(workerIndexRaw).toContain('lockupViewModel')
      expect(workerIndexRaw).toContain('publishedTime')
      expect(workerIndexRaw).toContain('sp=EgIIAw%253D%253D') // upload_date (Type=Video, Sort=Upload Date)
      expect(workerIndexRaw).toContain('sp=CAMSAhAB') // view_count
      expect(workerIndexRaw).toContain('parseUploadMinutesAgo')

      // StudyRoomView UI supports sorting modes and displays upload time
      expect(studyRoomViewRaw).toContain("'relevance' | 'upload_date' | 'view_count'")
      expect(studyRoomViewRaw).toContain('Mới nhất')
      expect(studyRoomViewRaw).toContain('Xem nhiều')
      expect(studyRoomViewRaw).toContain('v.publishedTime')
    })
  })
})
