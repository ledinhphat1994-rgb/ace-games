// src/features/study/workspace/ClassroomWorkspace.tsx
// Digital Campus v2: Classroom Workspace Architecture (PQA-C1)

import type { NguoiDung } from '@/lib/api'
import type {
  MediaState,
  RoomChatMessage,
  SharedNotes,
  SlideState,
  SlideAnnotationStroke,
  ThanhVienPhong,
  WhiteboardStroke,
} from '@shared/protocol/room'
import type { VoiceClientState } from '@/lib/voice-client'
import type { TrangThaiKetNoiPhong } from '@/hooks/use-room'
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ClassroomContextPanel } from './ClassroomContextPanel'
import { ClassroomToolDock } from './ClassroomToolDock'
import { ClassroomTopBar } from './ClassroomTopBar'
import { PresentationStage } from './PresentationStage'
import {
  deriveDefaultWorkspaceMode,
  type ContextPanelView,
  type WorkspaceMode,
} from './types'

export interface ClassroomWorkspaceProps {
  roomId: string
  roomTitle: string
  nguoiDung: NguoiDung
  isHost: boolean
  canModerate?: boolean
  hostKey: string | null
  members: ThanhVienPhong[]
  trangThai: TrangThaiKetNoiPhong
  latencyMs: number | null
  // Slide
  slideState?: SlideState | null
  onPageChange?: (newPage: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  slideAnnotations?: SlideAnnotationStroke[]
  onSendSlideAnnotation?: (stroke: SlideAnnotationStroke) => void
  onClearSlideAnnotations?: (page?: number) => void
  onRemoveSlideAnnotation?: (id: string) => void
  slideLaser?: { point: [number, number] | null; page: number; senderName?: string; updatedAt: number } | null
  onSendSlideLaser?: (point: [number, number] | null, page: number) => void
  // Video
  mediaState?: MediaState | null
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  calculateTargetTime: () => number
  // Whiteboard
  whiteboardStrokes: WhiteboardStroke[]
  selectedColor: string
  onSelectColor: (color: string) => void
  selectedSize: number
  onSelectSize: (size: number) => void
  isEraser: boolean
  onToggleEraser: () => void
  onSendStroke: (stroke: Omit<WhiteboardStroke, 'epoch'> | WhiteboardStroke) => void
  onClearWhiteboard: () => void
  // Voice
  myMic: boolean
  onToggleMic: () => void
  voiceState: VoiceClientState
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  isSinkIdSupported: boolean
  onSetAudioInput: (deviceId: string) => void
  onSetAudioOutput: (deviceId: string) => void
  onRefreshDevices: () => void
  // Chat
  chatMessages: RoomChatMessage[]
  onSendChat: (text: string) => Promise<boolean>
  onReportMessage: (target: { accountId: number; name: string; contentSnippet?: string }) => void
  // Moderation
  onForceMute: (actorKey: string) => Promise<unknown>
  onKickMember: (target: { actorKey: string; name: string }) => void
  onReportUser: (target: { accountId: number; name: string }) => void
  onOpenInvite: () => void
  onOpenBannedList: () => void
  // Shared Notes
  sharedNotes: SharedNotes
  localNotes: string
  onChangeNotes: (text: string) => void
  notesConflict: { currentNotes: SharedNotes; rejectedContent: string } | null
  onResolveNotesConflict: (resolution: 'keep_server' | 'force_client') => void
  // Secondary Tools
  onOpenCalculator: () => void
  onOpenSessionPanel: () => void
  // Leave
  onLeaveRoom: () => void
}

export function ClassroomWorkspace({
  roomId,
  roomTitle,
  nguoiDung,
  isHost,
  canModerate = false,
  hostKey,
  members,
  trangThai,
  latencyMs,
  slideState,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  slideAnnotations,
  onSendSlideAnnotation,
  onClearSlideAnnotations,
  onRemoveSlideAnnotation,
  slideLaser,
  onSendSlideLaser,
  mediaState,
  canControlMedia = true,
  volume,
  onVolumeChange,
  onSyncMedia,
  onOpenSearchQueue,
  calculateTargetTime,
  whiteboardStrokes,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
  isEraser,
  onToggleEraser,
  onSendStroke,
  onClearWhiteboard,
  myMic,
  onToggleMic,
  voiceState,
  audioInputs,
  audioOutputs,
  isSinkIdSupported,
  onSetAudioInput,
  onSetAudioOutput,
  onRefreshDevices,
  chatMessages,
  onSendChat,
  onReportMessage,
  onForceMute,
  onKickMember,
  onReportUser,
  onOpenInvite,
  onOpenBannedList,
  sharedNotes,
  localNotes,
  onChangeNotes,
  notesConflict,
  onResolveNotesConflict,
  onOpenCalculator,
  onOpenSessionPanel,
  onLeaveRoom,
}: ClassroomWorkspaceProps) {
  // Derive initial workspace mode from server state
  const [mode, setMode] = useState<WorkspaceMode>(() =>
    deriveDefaultWorkspaceMode(mediaState, slideState)
  )

  // React to incoming media / slide updates without conflicting with user-selected views
  // NOTE: Synchronized presenter-surface selection across clients is deferred to a later milestone (C2/C3).
  // In C1, local workspace navigation (e.g. user toggling whiteboard or document) is intentionally preserved.
  // We only auto-transition when:
  // 1. A video begins actively playing (Priority A: video dominates).
  // 2. The workspace is currently 'idle' and authoritative content arrives from snapshot/host.
  // We explicitly avoid switching away when a video is merely paused to prevent layout flap/loops.
  useEffect(() => {
    const hasVideo = Boolean(mediaState?.videoId && mediaState.videoId.trim().length > 0)
    const isPlaying = mediaState?.status === 'playing'

    if (hasVideo && isPlaying) {
      setMode('video')
    } else if (mode === 'idle') {
      const derived = deriveDefaultWorkspaceMode(mediaState, slideState)
      if (derived !== 'idle') {
        setMode(derived)
      }
    }
  }, [mediaState?.videoId, mediaState?.status, slideState?.docUrl, mode])

  // Contextual Rail: only ONE active at a time!
  const [contextPanel, setContextPanel] = useState<ContextPanelView>('closed')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Unread chat tracking
  const [lastReadMessageId, setLastReadMessageId] = useState<number>(0)
  const isOnline = trangThai === 'da_ket_noi'
  const isReconnecting = trangThai === 'dang_ket_noi' || trangThai === 'mat_ket_noi'

  const highestMessageId = chatMessages.reduce((max, m) => {
    const id = parseInt(m.id, 10) || 0
    return id > max ? id : max
  }, 0)

  useEffect(() => {
    if (contextPanel === 'chat') {
      setLastReadMessageId(highestMessageId)
    }
  }, [contextPanel, highestMessageId])

  const unreadChatCount = contextPanel === 'chat'
    ? 0
    : chatMessages.filter((m) => (parseInt(m.id, 10) || 0) > lastReadMessageId).length

  const handleTogglePanel = useCallback((target: ContextPanelView) => {
    setContextPanel((curr) => (curr === target ? 'closed' : target))
  }, [])

  return (
    <div
      className="relative flex h-svh w-full flex-col overflow-hidden bg-[#070b14] text-slate-100 select-none font-sans"
      data-testid="classroom-workspace"
      data-room-id={roomId}
    >
      {/* ── 1. COMPACT ROOM HEADER ── */}
      <ClassroomTopBar
        roomTitle={roomTitle}
        isHost={isHost}
        isOnline={isOnline}
        isReconnecting={isReconnecting}
        latencyMs={latencyMs}
        myMic={myMic}
        onToggleMic={onToggleMic}
        voiceState={voiceState}
        audioInputs={audioInputs}
        audioOutputs={audioOutputs}
        isSinkIdSupported={isSinkIdSupported}
        onSetAudioInput={onSetAudioInput}
        onSetAudioOutput={onSetAudioOutput}
        onRefreshDevices={onRefreshDevices}
        activePanel={contextPanel}
        onTogglePanel={handleTogglePanel}
        unreadChatCount={unreadChatCount}
        memberCount={members.length}
        onLeaveRoom={onLeaveRoom}
      />

      {/* ── 2. RECONNECTING / STALE STATE WARNING BANNER ── */}
      {isReconnecting && (
        <div
          className="flex h-7 shrink-0 items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 text-xs font-semibold text-amber-300 z-20 backdrop-blur-md"
          data-testid="classroom-reconnecting-banner"
        >
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          <span>Đang kết nối lại phòng học... Nội dung trình chiếu vẫn được giữ nguyên.</span>
        </div>
      )}

      {/* ── 3. MAIN WORKSPACE VIEWPORT (STAGE + CONTEXTUAL RAIL) ── */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
        {/* Dominant Center Stage */}
        <main className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <PresentationStage
            mode={mode}
            onSelectMode={setMode}
            isHost={isHost}
            canModerate={canModerate}
            slideState={slideState}
            onPageChange={onPageChange}
            onUploadSlide={onUploadSlide}
            onCloseDoc={onCloseDoc}
            mediaState={mediaState}
            canControlMedia={canControlMedia}
            volume={volume}
            onVolumeChange={onVolumeChange}
            onSyncMedia={onSyncMedia}
            onOpenSearchQueue={onOpenSearchQueue}
            calculateTargetTime={calculateTargetTime}
            whiteboardStrokes={whiteboardStrokes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            isEraser={isEraser}
            onSendStroke={onSendStroke}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            isReconnecting={isReconnecting}
            slideAnnotations={slideAnnotations}
            onSendSlideAnnotation={onSendSlideAnnotation}
            onClearSlideAnnotations={onClearSlideAnnotations}
            onRemoveSlideAnnotation={onRemoveSlideAnnotation}
            slideLaser={slideLaser}
            onSendSlideLaser={onSendSlideLaser}
          />
        </main>

        {/* Single Contextual Right Panel */}
        <ClassroomContextPanel
          view={contextPanel}
          onClose={() => setContextPanel('closed')}
          nguoiDung={nguoiDung}
          isHost={isHost}
          canModerate={canModerate}
          hostKey={hostKey}
          chatMessages={chatMessages}
          onSendChat={onSendChat}
          onReportMessage={onReportMessage}
          members={members}
          voiceState={voiceState}
          onForceMute={onForceMute}
          onKickMember={onKickMember}
          onReportUser={onReportUser}
          onOpenInvite={onOpenInvite}
          onOpenBannedList={onOpenBannedList}
          sharedNotes={sharedNotes}
          localNotes={localNotes}
          onChangeNotes={onChangeNotes}
          notesConflict={notesConflict}
          onResolveNotesConflict={onResolveNotesConflict}
          isReconnecting={isReconnecting}
        />
      </div>

      {/* ── 4. COMPACT PRESENTATION TOOL DOCK ── */}
      {!isFullscreen && (
        <ClassroomToolDock
          mode={mode}
          onSelectMode={setMode}
          isHost={isHost}
          canModerate={canModerate}
          slideState={slideState}
          mediaState={mediaState}
          selectedColor={selectedColor}
          onSelectColor={onSelectColor}
          selectedSize={selectedSize}
          onSelectSize={onSelectSize}
          isEraser={isEraser}
          onToggleEraser={onToggleEraser}
          onClearWhiteboard={onClearWhiteboard}
          onOpenCalculator={onOpenCalculator}
          onOpenSessionPanel={onOpenSessionPanel}
          isReconnecting={isReconnecting}
        />
      )}
    </div>
  )
}
