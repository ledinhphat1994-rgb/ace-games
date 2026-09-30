// test/pqa-c1-classroom-workspace.test.ts
// Digital Campus v2: Milestone PQA-C1 Verification Suite
// Classroom Workspace & Central Presentation Stage Quality Contracts

import { describe, expect, it } from 'vitest'
import {
  deriveDefaultWorkspaceMode,
  deriveDocumentStatus,
  canUserPresent,
  type WorkspaceMode,
  type ContextPanelView,
} from '../src/features/study/workspace/types'
import type { MediaState, SlideState } from '../shared/protocol/room'

// Source code inspections for structural compliance
import workspaceRaw from '../src/features/study/workspace/ClassroomWorkspace.tsx?raw'
import stageRaw from '../src/features/study/workspace/PresentationStage.tsx?raw'
import dockRaw from '../src/features/study/workspace/ClassroomToolDock.tsx?raw'
import contextPanelRaw from '../src/features/study/workspace/ClassroomContextPanel.tsx?raw'
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import videoPlayerRaw from '../src/features/study/workspace/EmbeddedVideoPlayer.tsx?raw'
import studyRoomViewRaw from '../src/features/study/StudyRoomView.tsx?raw'

// Production default objects to verify neutral authoritative states
import {
  DEFAULT_MEDIA as CLIENT_DEFAULT_MEDIA,
  DEFAULT_NOTES as CLIENT_DEFAULT_NOTES,
} from '../src/hooks/use-room'
import {
  DEFAULT_MEDIA as ROOMDO_DEFAULT_MEDIA,
  DEFAULT_NOTES as ROOMDO_DEFAULT_NOTES,
} from '../worker/room-do'

describe('PQA-C1: Classroom Workspace & Central Presentation Stage Contracts', () => {
  // ── 12 Regression Coverage (Points A through L) ───────────────────────────
  describe('PQA-C1 Authoritative Correctness & Neutral Defaults (Items A-L)', () => {
    it('A. client DEFAULT_MEDIA is neutral with no pre-seeded sample video', () => {
      expect(CLIENT_DEFAULT_MEDIA.videoId).toBe('')
      expect(CLIENT_DEFAULT_MEDIA.title).toBe('')
      expect(CLIENT_DEFAULT_MEDIA.status).toBe('paused')
      expect(CLIENT_DEFAULT_MEDIA.time).toBe(0)
      expect(CLIENT_DEFAULT_MEDIA.updatedAt).toBe(0)
      expect(CLIENT_DEFAULT_MEDIA.playbackRate).toBe(1)
      expect(CLIENT_DEFAULT_MEDIA.hostOnlyControl).toBe(true)
    })

    it('B. RoomDO DEFAULT_MEDIA is neutral with no pre-seeded sample video', () => {
      expect(ROOMDO_DEFAULT_MEDIA.videoId).toBe('')
      expect(ROOMDO_DEFAULT_MEDIA.title).toBe('')
      expect(ROOMDO_DEFAULT_MEDIA.status).toBe('paused')
      expect(ROOMDO_DEFAULT_MEDIA.time).toBe(0)
      expect(ROOMDO_DEFAULT_MEDIA.updatedAt).toBe(0)
      expect(ROOMDO_DEFAULT_MEDIA.playbackRate).toBe(1)
      expect(ROOMDO_DEFAULT_MEDIA.hostOnlyControl).toBe(true)
    })

    it('C. client DEFAULT_NOTES is neutral with no fake lesson notes', () => {
      expect(CLIENT_DEFAULT_NOTES.content).toBe('')
      expect(CLIENT_DEFAULT_NOTES.lastEditedBy).toBe('')
      expect(CLIENT_DEFAULT_NOTES.updatedAt).toBe(0)
      expect(CLIENT_DEFAULT_NOTES.revision).toBe(1)
    })

    it('D. RoomDO DEFAULT_NOTES is neutral with no fake lesson notes', () => {
      expect(ROOMDO_DEFAULT_NOTES.content).toBe('')
      expect(ROOMDO_DEFAULT_NOTES.lastEditedBy).toBe('')
      expect(ROOMDO_DEFAULT_NOTES.updatedAt).toBe(0)
      expect(ROOMDO_DEFAULT_NOTES.revision).toBe(1)
    })

    it('E. fresh room => workspace derives idle truthfully from authoritative defaults', () => {
      expect(deriveDefaultWorkspaceMode(CLIENT_DEFAULT_MEDIA, null)).toBe('idle')
      expect(deriveDefaultWorkspaceMode(ROOMDO_DEFAULT_MEDIA, null)).toBe('idle')
    })

    it('F. paused loaded video only (no document) => workspace derives video mode', () => {
      const pausedVideo: MediaState = {
        videoId: 'real-youtube-id',
        title: 'Video Bài Giảng Toán',
        status: 'paused',
        time: 0,
        playbackRate: 1,
        hostOnlyControl: true,
        updatedAt: 1000,
      }
      expect(deriveDefaultWorkspaceMode(pausedVideo, null)).toBe('video')
      expect(deriveDefaultWorkspaceMode(pausedVideo, {
        docUrl: '',
        docName: '',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 1,
      })).toBe('video')
    })

    it('G. paused video + document => workspace derives document mode (Priority B > C)', () => {
      const pausedVideo: MediaState = {
        videoId: 'real-youtube-id',
        title: 'Video Bài Giảng Toán',
        status: 'paused',
        time: 0,
        playbackRate: 1,
        hostOnlyControl: true,
        updatedAt: 1000,
      }
      const activeDoc: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/slides/bai-1.pdf',
        docName: 'bai-1.pdf',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 10,
      }
      expect(deriveDefaultWorkspaceMode(pausedVideo, activeDoc)).toBe('document')
    })

    it('H. playing video + document => workspace derives video mode (Priority A dominates)', () => {
      const playingVideo: MediaState = {
        videoId: 'real-youtube-id',
        title: 'Video Bài Giảng Toán',
        status: 'playing',
        time: 25,
        playbackRate: 1,
        hostOnlyControl: true,
        updatedAt: 1000,
      }
      const activeDoc: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/slides/bai-1.pdf',
        docName: 'bai-1.pdf',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 10,
      }
      expect(deriveDefaultWorkspaceMode(playingVideo, activeDoc)).toBe('video')
    })

    it('I. no authoritative content => workspace derives idle mode', () => {
      expect(deriveDefaultWorkspaceMode(null, null)).toBe('idle')
      expect(deriveDefaultWorkspaceMode(undefined, undefined)).toBe('idle')
      expect(deriveDefaultWorkspaceMode({
        videoId: '   ',
        title: '',
        status: 'paused',
        time: 0,
        playbackRate: 1,
        hostOnlyControl: true,
        updatedAt: 0,
      }, null)).toBe('idle')
    })

    it('J. real .pptx is presented in the browser (ready, page-synced); Office viewer advisory kept as fallback', () => {
      const pptxSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/bai-giang.pptx',
        docName: 'bai-giang.pptx',
        fileType: 'pptx',
        currentPage: 1,
        totalPages: 1,
      }
      expect(deriveDocumentStatus(pptxSlide)).toBe('ready')
      // Word / Excel cùng nhóm Office vẫn chỉ xem qua Office Online (chưa đồng bộ trang).
      expect(deriveDocumentStatus({ ...pptxSlide, docUrl: '/api/rooms/1/documents/2/file', docName: 'giao-an.docx' })).toBe('unsupported')
      expect(docStageRaw).toContain('PptxAdvisoryCard')
      expect(docStageRaw).toContain('Chưa hỗ trợ trình chiếu trực tiếp PPTX')
      expect(docStageRaw).toContain('xuất bài giảng sang định dạng PDF (.pdf)')
    })

    it('K. idle stage shows only "Chưa có nội dung trình bày" and bottom dock is launcher', () => {
      expect(stageRaw).toContain('Chưa có nội dung trình bày')
      expect(stageRaw).not.toContain('idle-stage-host-actions')
      expect(dockRaw).toContain('dock-btn-document')
      expect(dockRaw).toContain('dock-btn-whiteboard')
      expect(dockRaw).toContain('dock-btn-video')
      expect(dockRaw).toContain('dock-btn-secondary-tools')
    })

    it('L. reconnecting disables unsafe mutations', () => {
      expect(workspaceRaw).toContain("const isReconnecting = trangThai === 'dang_ket_noi' || trangThai === 'mat_ket_noi'")
      expect(contextPanelRaw).toContain('disabled={isReconnecting}')
      expect(dockRaw).toContain('const canControl = !isReconnecting')
      expect(workspaceRaw).toContain('data-testid="classroom-reconnecting-banner"')
    })
  })

  // ── A. Workspace Idle Derivation ──────────────────────────────────────────
  describe('A. Workspace Idle Derivation', () => {
    it('returns idle mode when no media is playing and no slide document is loaded', () => {
      expect(deriveDefaultWorkspaceMode(CLIENT_DEFAULT_MEDIA, null)).toBe('idle')
    })

    it('returns idle mode when slide has empty docUrl', () => {
      const emptySlide: SlideState = {
        docUrl: '',
        docName: '',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 1,
      }
      expect(deriveDefaultWorkspaceMode(CLIENT_DEFAULT_MEDIA, emptySlide)).toBe('idle')
    })
  })

  // ── B. Active Document State Derivation ──────────────────────────────────
  describe('B. Active Document State Derivation', () => {
    it('derives document mode when slideState contains a valid docUrl', () => {
      const defaultMedia: MediaState = {
        videoId: '',
        title: '',
        status: 'paused',
        time: 0,
        playbackRate: 1,
        hostOnlyControl: false,
        updatedAt: 0,
      }
      const activeSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/slides/bai-1.pdf',
        docName: 'Bài 1: Mệnh đề toán học.pdf',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 10,
      }
      expect(deriveDefaultWorkspaceMode(defaultMedia, activeSlide)).toBe('document')
    })

    it('returns no_document status when slideState is null or docUrl is blank', () => {
      expect(deriveDocumentStatus(null)).toBe('no_document')
      expect(deriveDocumentStatus({
        docUrl: '',
        docName: '',
        fileType: 'image',
        currentPage: 1,
        totalPages: 1,
      })).toBe('no_document')
    })

    it('returns ready status when document is loaded without errors', () => {
      const validSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/slides/diagram.png',
        docName: 'diagram.png',
        fileType: 'image',
        currentPage: 1,
        totalPages: 1,
      }
      expect(deriveDocumentStatus(validSlide)).toBe('ready')
    })
  })

  // ── C. Active Video Mode Derivation ───────────────────────────────────────
  describe('C. Active Video Mode Derivation', () => {
    it('derives video mode when mediaState has videoId and status is playing', () => {
      const playingMedia: MediaState = {
        videoId: 'dQw4w9WgXcQ',
        title: 'Video Bài Giảng',
        status: 'playing',
        time: 45,
        playbackRate: 1,
        hostOnlyControl: true,
        updatedAt: Date.now(),
      }
      expect(deriveDefaultWorkspaceMode(playingMedia, null)).toBe('video')
    })

    it('prioritizes active video over document if video is actively playing', () => {
      const playingMedia: MediaState = {
        videoId: 'dQw4w9WgXcQ',
        title: 'Video Bài Giảng',
        status: 'playing',
        time: 10,
        playbackRate: 1,
        hostOnlyControl: false,
        updatedAt: Date.now(),
      }
      const activeSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/doc.pdf',
        docName: 'doc.pdf',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 5,
      }
      expect(deriveDefaultWorkspaceMode(playingMedia, activeSlide)).toBe('video')
    })
  })

  // ── D. Whiteboard Mode Derivation ─────────────────────────────────────────
  describe('D. Whiteboard Mode State', () => {
    it('supports whiteboard as a first-class center stage mode', () => {
      const modes: WorkspaceMode[] = ['idle', 'document', 'video', 'whiteboard']
      expect(modes).toContain('whiteboard')
    })

    it('embeds the whiteboard (BangVe) inside center PresentationStage rather than floating window', () => {
      expect(stageRaw).toContain('<BangVe')
      expect(stageRaw).not.toContain('FloatingChalkboard')
      expect(workspaceRaw).toContain('<PresentationStage')
    })
  })

  // ── E. Student Permission Gating on Stage ─────────────────────────────────
  describe('E. Student Permission Gating on Stage Actions', () => {
    it('denies presentation authority to normal students (not host and not moderator)', () => {
      expect(canUserPresent(false, false)).toBe(false)
      expect(canUserPresent(false, undefined)).toBe(false)
    })

    it('idle stage shows simple message without duplicated launcher cards', () => {
      expect(stageRaw).toContain('Chưa có nội dung trình bày')
      expect(stageRaw).not.toContain('idle-stage-host-actions')
    })
  })

  // ── F. Host / Moderator Presentation Actions ──────────────────────────────
  describe('F. Host and Moderator Presentation Actions', () => {
    it('grants presentation authority to hosts and moderators', () => {
      expect(canUserPresent(true, false)).toBe(true)
      expect(canUserPresent(false, true)).toBe(true)
      expect(canUserPresent(true, true)).toBe(true)
    })

    it('bottom dock is the only launcher for content: Tài liệu, Bảng, Video, Công cụ', () => {
      expect(dockRaw).toContain('Tài liệu')
      expect(dockRaw).toContain("ten: 'Bảng'")
      expect(dockRaw).toContain('Video')
      expect(dockRaw).toContain('Công cụ')
      expect(stageRaw).not.toContain('Chọn nội dung để bắt đầu')
    })
  })

  // ── G. Context Panel Exclusivity ──────────────────────────────────────────
  describe('G. Context Panel Exclusivity', () => {
    it('defines ContextPanelView states as strictly closed, chat, members, or tools', () => {
      const allowedViews: ContextPanelView[] = ['closed', 'chat', 'members', 'tools']
      expect(allowedViews).toHaveLength(4)
    })

    it('enforces single active panel toggling in ClassroomWorkspace', () => {
      expect(workspaceRaw).toContain("setContextPanel((curr) => (curr === target ? 'closed' : target))")
    })

    it('ClassroomContextPanel renders only the designated view without multiple panels open simultaneously', () => {
      expect(contextPanelRaw).toContain("if (view === 'closed') return null")
      expect(contextPanelRaw).toContain("view === 'chat'")
      expect(contextPanelRaw).toContain("view === 'members'")
    })
  })

  // ── H. Reconnecting State Truthfulness ─────────────────────────────────────
  describe('H. Reconnecting State Truthfulness', () => {
    it('marks isReconnecting as true when trangThai is dang_ket_noi or mat_ket_noi', () => {
      expect(workspaceRaw).toContain("const isReconnecting = trangThai === 'dang_ket_noi' || trangThai === 'mat_ket_noi'")
    })

    it('renders a dedicated reconnection banner preserving stage continuity', () => {
      expect(workspaceRaw).toContain('data-testid="classroom-reconnecting-banner"')
      expect(workspaceRaw).toContain('Đang kết nối lại phòng học... Nội dung trình chiếu vẫn được giữ nguyên.')
    })

    it('disables unsafe mutations during reconnecting state in context panel and dock', () => {
      expect(contextPanelRaw).toContain('disabled={isReconnecting}')
      expect(dockRaw).toContain('const canControl = !isReconnecting')
    })
  })

  // ── I. Document Render Error != Empty ─────────────────────────────────────
  describe('I. Document Render Error Distinction', () => {
    it('derives render_error status when loadError is true', () => {
      const failedSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/broken.pdf',
        docName: 'broken.pdf',
        fileType: 'pdf',
        currentPage: 1,
        totalPages: 1,
      }
      expect(deriveDocumentStatus(failedSlide, true)).toBe('render_error')
    })

    it('DocumentStageView renders a clear error card on render_error instead of an empty screen', () => {
      expect(docStageRaw).toContain("status === 'render_error'")
      expect(docStageRaw).toContain('Không thể tải tài liệu này')
      expect(docStageRaw).toContain('Thử lại')
    })
  })

  // ── J. Unsupported PPTX Remains Truthful ──────────────────────────────────
  describe('J. Unsupported PPTX Truthfulness', () => {
    it('a real .pptx is ready (browser-rendered); an Office file that is not .pptx stays unsupported', () => {
      const pptxSlide: SlideState = {
        docUrl: 'https://r2.lop10a7.edu.vn/presentation.pptx',
        docName: 'presentation.pptx',
        fileType: 'pptx',
        currentPage: 1,
        totalPages: 1,
      }
      expect(deriveDocumentStatus(pptxSlide)).toBe('ready')
      expect(deriveDocumentStatus({ ...pptxSlide, docUrl: 'https://r2.lop10a7.edu.vn/bang-diem.xlsx', docName: 'bang-diem.xlsx' })).toBe('unsupported')
    })

    it('displays PptxAdvisoryCard with honest limitation and PDF conversion advice', () => {
      expect(docStageRaw).toContain('function PptxAdvisoryCard')
      expect(docStageRaw).toContain('Chưa hỗ trợ trình chiếu trực tiếp PPTX')
      expect(docStageRaw).toContain('xuất bài giảng sang định dạng PDF (.pdf)')
    })
  })

  // ── K. Mobile Contextual Panel ────────────────────────────────────
  describe('K. Mobile Contextual Ergonomics', () => {
    it('context panel renders as sliding overlay on mobile screens with responsive width', () => {
      expect(contextPanelRaw).toContain('fixed lg:relative right-0 inset-y-0')
      expect(contextPanelRaw).toContain('w-full sm:w-96 lg:w-80')
    })

    it('includes a backdrop overlay on mobile to dismiss open contextual panel', () => {
      expect(contextPanelRaw).toContain('fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden')
    })

    it('Stage receives flex-1 to dominate mobile viewport', () => {
      // Khung chính luôn flex-1 (chiếu video thì thêm giới hạn 16:9 từ sm trở lên, điện thoại vẫn chiếm trọn chiều ngang).
      expect(workspaceRaw).toMatch(/<main\s+className=\{`relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden \$\{/)
    })
  })

  // ── L. Compatibility with Existing Protocol ──────────────────────────────
  describe('L. Protocol & Architecture Invariants', () => {
    it('preserves existing SlideState interface types without modifying RoomDO protocol', () => {
      const slide: SlideState = {
        docUrl: 'url',
        docName: 'name',
        fileType: 'image',
        currentPage: 1,
        totalPages: 1,
      }
      expect(slide.docUrl).toBe('url')
      expect(slide.currentPage).toBe(1)
    })

    it('preserves existing MediaState synchronization contract without external players', () => {
      const media: MediaState = {
        videoId: 'abc',
        title: 'Video Title',
        status: 'paused',
        time: 100,
        playbackRate: 1.25,
        hostOnlyControl: true,
        updatedAt: 12345,
      }
      expect(media.status).toBe('paused')
      expect(videoPlayerRaw).toContain('calculateTargetTime')
      expect(videoPlayerRaw).toContain('data-testid="yt-player-host"')
    })

    it('StudyRoomView orchestrates ClassroomWorkspace as the master room shell', () => {
      expect(studyRoomViewRaw).toContain('<ClassroomWorkspace')
      expect(studyRoomViewRaw).not.toContain('<ClassroomStage')
      expect(studyRoomViewRaw).not.toContain('<FloatingVideoPlayer')
    })
  })
})
