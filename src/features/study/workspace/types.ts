// src/features/study/workspace/types.ts
// Digital Campus v2: PQA-C1 Classroom Workspace State & Types

import type { SlideState, MediaState } from '@shared/protocol/room'

export type WorkspaceMode = 'idle' | 'document' | 'video' | 'whiteboard'

export type ContextPanelView = 'closed' | 'chat' | 'members' | 'tools'

export type DocumentRenderStatus = 'no_document' | 'loading' | 'ready' | 'render_error' | 'unsupported'

export interface WorkspaceState {
  mode: WorkspaceMode
  contextPanel: ContextPanelView
  isFullscreen: boolean
  isReconnecting: boolean
}

/**
 * Derives default workspace mode from canonical room state.
 *
 * Strict Priority:
 * A. video exists AND playing => 'video'
 * B. document exists => 'document'
 * C. video exists but paused => 'video'
 * D. otherwise => 'idle'
 *
 * This keeps an actively playing video dominant, allows an active document
 * to take priority over a merely paused background video, but still restores
 * a paused-only video correctly after join/reconnect.
 */
export function deriveDefaultWorkspaceMode(
  mediaState?: MediaState | null,
  slideState?: SlideState | null,
): WorkspaceMode {
  const hasVideo = Boolean(mediaState?.videoId && mediaState.videoId.trim().length > 0)
  const isPlaying = mediaState?.status === 'playing'
  const hasDocument = Boolean(slideState?.docUrl && slideState.docUrl.trim().length > 0)

  // A. video exists AND playing => video
  if (hasVideo && isPlaying) {
    return 'video'
  }
  // B. document exists => document
  if (hasDocument) {
    return 'document'
  }
  // C. video exists but paused => video
  if (hasVideo) {
    return 'video'
  }
  // D. otherwise => idle
  return 'idle'
}

/**
 * Bản trình chiếu .pptx thật (không phải Word/Excel cùng nhóm Office, không phải Google Slides):
 * dựng ngay trên trình duyệt và chuyển trang đồng bộ như PDF.
 */
export function laTepPptx(slideState?: Pick<SlideState, 'fileType' | 'docName' | 'docUrl'> | null): boolean {
  if (!slideState || slideState.fileType !== 'pptx') return false
  if (slideState.docUrl.includes('docs.google.com/')) return false
  const duongDan = slideState.docUrl.split('?')[0]
  return /\.pptx$/i.test(slideState.docName || '') || /\.pptx$/i.test(duongDan)
}

/**
 * Derives truthful document presentation status.
 * Required distinctions:
 * - NO DOCUMENT: null or empty docUrl
 * - UNSUPPORTED: Office document other than a real .pptx (Word/Excel/.ppt via Office viewer, no live sync)
 * - RENDER ERROR: explicit error flag
 * - READY: valid image, pdf or .pptx loaded
 */
export function deriveDocumentStatus(
  slideState?: SlideState | null,
  hasRenderError?: boolean,
  isLoading?: boolean,
): DocumentRenderStatus {
  if (!slideState || !slideState.docUrl || slideState.docUrl.trim().length === 0) {
    return 'no_document'
  }
  if (hasRenderError) {
    return 'render_error'
  }
  if (isLoading) {
    return 'loading'
  }
  if (slideState.fileType === 'pptx' && !laTepPptx(slideState)) {
    return 'unsupported'
  }
  return 'ready'
}

/**
 * Checks if user is permitted to control presentation actions.
 */
export function canUserPresent(
  isHost?: boolean,
  canModerate?: boolean,
): boolean {
  return Boolean(isHost || canModerate)
}

export const ANNOTATION_COLORS = [
  { name: 'Đỏ', value: '#ef4444' },
  { name: 'Vàng', value: '#eab308' },
  { name: 'Xanh lục', value: '#22c55e' },
  { name: 'Xanh lam', value: '#3b82f6' },
] as const
