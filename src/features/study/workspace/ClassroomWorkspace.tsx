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
import type { CongCu, CoVe } from './cong-cu'
import {
  anLop,
  bamLop,
  batTatBangPhu,
  boCucBanDau,
  goLop,
  hienLop,
  lamChinh,
  thuNho,
  type BoCuc,
  type LopId,
} from './stage-layout'
import { deriveDefaultWorkspaceMode, type ContextPanelView } from './types'

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
  onSendStroke: (stroke: Omit<WhiteboardStroke, 'epoch'> | WhiteboardStroke) => void
  onRemoveStroke: (id: string) => void
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
  onCloseRoom?: () => Promise<void>
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
  onSendStroke,
  onRemoveStroke,
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
  onCloseRoom,
}: ClassroomWorkspaceProps) {
  const videoId = mediaState?.videoId?.trim() ?? ''
  const docUrl = slideState?.docUrl?.trim() ?? ''
  const videoDangPhat = Boolean(videoId) && mediaState?.status === 'playing'

  // Bố cục sân khấu (riêng từng người xem): suy lần đầu từ nội dung đang có trên máy chủ.
  const [boCuc, setBoCuc] = useState<BoCuc>(() =>
    boCucBanDau(deriveDefaultWorkspaceMode(mediaState, slideState), Boolean(videoId), Boolean(docUrl)),
  )

  // Nội dung đổi từ máy chủ (giáo viên mở video / tài liệu mới) → bảo đảm lớp đó hiện, không giành lớp chính của người xem.
  // Nội dung kết thúc (gỡ video, đóng tài liệu) → bỏ lớp khỏi sân khấu.
  useEffect(() => {
    setBoCuc((bc) => (videoId ? hienLop(bc, 'video') : goLop(bc, 'video')))
  }, [videoId])

  useEffect(() => {
    if (videoDangPhat) setBoCuc((bc) => hienLop(bc, 'video'))
  }, [videoDangPhat])

  useEffect(() => {
    setBoCuc((bc) => (docUrl ? hienLop(bc, 'doc') : goLop(bc, 'doc')))
  }, [docUrl])

  // Công cụ vẽ chung cho mọi lớp.
  const [congCu, setCongCu] = useState<CongCu>('chuot')
  const [mau, setMau] = useState<string>('#ef4444')
  const [co, setCo] = useState<CoVe>(1)

  // Contextual Rail: only ONE active at a time!
  const [contextPanel, setContextPanel] = useState<ContextPanelView>('closed')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return
    const thoat = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', thoat)
    return () => window.removeEventListener('keydown', thoat)
  }, [isFullscreen])

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

  const doiBoCuc = useCallback(
    (bienDoi: (bc: BoCuc, id: LopId) => BoCuc) => (id: LopId) => setBoCuc((bc) => bienDoi(bc, id)),
    [],
  )

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
        onCloseRoom={onCloseRoom}
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
            boCuc={boCuc}
            onPhongTo={doiBoCuc(lamChinh)}
            onThuNho={doiBoCuc(thuNho)}
            onAn={doiBoCuc(anLop)}
            onBatTatBangPhu={() => setBoCuc(batTatBangPhu)}
            isHost={isHost}
            canModerate={canModerate}
            myActorKey={nguoiDung.actorKey}
            congCu={congCu}
            mau={mau}
            co={co}
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
            onSendStroke={onSendStroke}
            onRemoveStroke={onRemoveStroke}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((v) => !v)}
            isReconnecting={isReconnecting}
            slideAnnotations={slideAnnotations}
            onSendSlideAnnotation={onSendSlideAnnotation}
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

      {/* ── 4. COMPACT PRESENTATION TOOL DOCK (vẫn dùng được khi toàn màn hình: nổi trên sân khấu) ── */}
      <div className={isFullscreen ? 'fixed bottom-2 left-1/2 z-[110] -translate-x-1/2' : undefined}>
        <ClassroomToolDock
          boCuc={boCuc}
          onBamLop={(id) => setBoCuc((bc) => bamLop(bc, id))}
          coTaiLieu={Boolean(docUrl)}
          videoDangPhat={videoDangPhat}
          isHost={isHost}
          canModerate={canModerate}
          congCu={congCu}
          onChonCongCu={setCongCu}
          mau={mau}
          onChonMau={setMau}
          co={co}
          onChonCo={setCo}
          onClearWhiteboard={onClearWhiteboard}
          onClearSlidePage={
            onClearSlideAnnotations && slideState ? () => onClearSlideAnnotations(slideState.currentPage) : undefined
          }
          onOpenCalculator={onOpenCalculator}
          onOpenSessionPanel={onOpenSessionPanel}
          isReconnecting={isReconnecting}
        />
      </div>
    </div>
  )
}
