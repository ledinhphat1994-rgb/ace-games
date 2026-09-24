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
 * Priority:
 * 1. If media is actively playing or videoId is set -> 'video'
 * 2. Else if slide is actively presented -> 'document'
 * 3. Else -> 'idle'
 */
export function deriveDefaultWorkspaceMode(
  mediaState?: MediaState | null,
  slideState?: SlideState | null,
): WorkspaceMode {
  if (mediaState?.videoId && mediaState.videoId.trim().length > 0) {
    return 'video'
  }
  if (slideState?.docUrl && slideState.docUrl.trim().length > 0) {
    return 'document'
  }
  return 'idle'
}

/**
 * Derives truthful document presentation status.
 * Required distinctions:
 * - NO DOCUMENT: null or empty docUrl
 * - UNSUPPORTED: pptx file format (advisory only, no live presentation)
 * - RENDER ERROR: explicit error flag
 * - READY: valid image or pdf loaded
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
  if (slideState.fileType === 'pptx') {
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
