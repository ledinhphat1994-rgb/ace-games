// src/features/study/classroom-stage-state.ts
// Digital Campus v2: Milestone U2 — Classroom Stage State Derivation (Data-Truth)

import type { SlideState } from '../../../shared/protocol/room'

export interface DerivedStageState {
  hasActivePresentation: boolean
  docName: string | null
  currentPage: number | null
  totalPages: number | null
  docUrl: string | null
  fileType: 'pptx' | 'pdf' | 'image' | null
  emptyState: {
    title: string
    description: string
  }
}

/**
 * Derives classroom presentation state exclusively from actual canonical slide state.
 * Invariant:
 * - When slideState is null/empty:
 *   - hasActivePresentation: false
 *   - docName: null (NO fake "Toán học 10 · Khảo sát hàm số bậc hai")
 *   - currentPage: null, totalPages: null (NO fake 1/12)
 *   - docUrl: null (NO fake study_slide_math.webp masquerading as live presentation)
 * - When real slideState exists:
 *   - Derives currentPage, totalPages, docName, docUrl directly from actual state
 */
export function deriveStageState(
  slideState?: SlideState | null,
): DerivedStageState {
  const hasActivePresentation = Boolean(slideState && slideState.docUrl && slideState.docUrl.trim().length > 0)
  return {
    hasActivePresentation,
    docName: hasActivePresentation ? slideState!.docName : null,
    currentPage: hasActivePresentation ? slideState!.currentPage : null,
    totalPages: hasActivePresentation ? slideState!.totalPages : null,
    docUrl: hasActivePresentation ? slideState!.docUrl : null,
    fileType: hasActivePresentation ? slideState!.fileType : null,
    emptyState: {
      title: 'Màn Chiếu Phòng Học Trực Tuyến',
      description: 'Chưa có bài giảng hoặc tài liệu nào đang được trình chiếu. Thành viên có thể tải tài liệu slide, mở video YouTube bài giảng, hoặc viết trực tiếp lên bảng phấn.',
    },
  }
}
