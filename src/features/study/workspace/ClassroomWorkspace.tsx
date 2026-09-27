// src/features/study/workspace/ClassroomWorkspace.tsx
// Digital Campus v2: Classroom Workspace Architecture (PQA-C1)

import type { NguoiDung } from '@/lib/api'
import type {
  BoCucSanKhau,
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
import { useCallback, useEffect, useRef, useState } from 'react'
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
  cungBoCuc,
  goLop,
  hienLop,
  lamChinh,
  phuBangDeVe,
  theoBoCucTrinhChieu,
  thuNho,
  type BoCuc,
  type LopId,
} from './stage-layout'
import { deriveDefaultWorkspaceMode, laTepPptx, type ContextPanelView } from './types'

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
  // Bố cục sân khấu do người trình chiếu đặt (RoomDO lưu + đồng bộ)
  stageLayout?: BoCucSanKhau | null
  daNhanAnhChup?: boolean
  onSendStageLayout?: (layout: BoCucSanKhau) => void
  // Slide
  slideState?: SlideState | null
  onPageChange?: (newPage: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  onSetTotalPages?: (totalPages: number) => void
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
  stageLayout = null,
  daNhanAnhChup = false,
  onSendStageLayout,
  slideState,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  onSetTotalPages,
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

  const laNguoiTrinhChieu = isHost || canModerate

  // Bố cục sân khấu: theo bố cục người trình chiếu đã lưu trên máy chủ; chưa có thì suy từ nội dung đang có.
  const [boCuc, setBoCuc] = useState<BoCuc>(() =>
    stageLayout
      ? theoBoCucTrinhChieu(stageLayout, Boolean(videoId), Boolean(docUrl))
      : boCucBanDau(deriveDefaultWorkspaceMode(mediaState, slideState), Boolean(videoId), Boolean(docUrl)),
  )
  /** Bố cục máy chủ đang giữ (lần nhận / gửi gần nhất) — chỉ gửi khi bố cục của người trình chiếu khác nó. */
  const boCucMayChuRef = useRef<BoCuc | null>(stageLayout)

  // Nội dung đổi từ máy chủ (giáo viên mở tài liệu mới / phát video) → tự động đưa lớp đó lên làm lớp chính để cả phòng cùng theo dõi đồng bộ.
  // Nội dung kết thúc (gỡ video, đóng tài liệu) → bỏ lớp khỏi sân khấu.
  useEffect(() => {
    if (videoId) {
      setBoCuc((bc) => (videoDangPhat ? lamChinh(bc, 'video') : hienLop(bc, 'video')))
    } else {
      setBoCuc((bc) => goLop(bc, 'video'))
    }
  }, [videoId, videoDangPhat])

  useEffect(() => {
    setBoCuc((bc) => (docUrl ? lamChinh(bc, 'doc') : goLop(bc, 'doc')))
  }, [docUrl])

  // Bố cục người trình chiếu gửi về (kể cả khi vào lại phòng) được áp sau cùng nên thắng các suy đoán theo nội dung ở trên.
  useEffect(() => {
    if (!stageLayout) return
    boCucMayChuRef.current = stageLayout
    setBoCuc(theoBoCucTrinhChieu(stageLayout, Boolean(videoId), Boolean(docUrl)))
  }, [stageLayout])

  // Người trình chiếu: bố cục đổi → gửi cho cả phòng (gộp các thay đổi liên tiếp).
  useEffect(() => {
    if (!laNguoiTrinhChieu || !daNhanAnhChup || !onSendStageLayout) return
    if (cungBoCuc(boCuc, boCucMayChuRef.current)) return
    const hen = setTimeout(() => {
      boCucMayChuRef.current = boCuc
      onSendStageLayout(boCuc)
    }, 150)
    return () => clearTimeout(hen)
  }, [boCuc, laNguoiTrinhChieu, daNhanAnhChup, onSendStageLayout])

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
            theoNguoiTrinhChieu={Boolean(stageLayout)}
            myActorKey={nguoiDung.actorKey}
            congCu={congCu}
            mau={mau}
            co={co}
            slideState={slideState}
            onPageChange={onPageChange}
            onUploadSlide={onUploadSlide}
            onCloseDoc={onCloseDoc}
            onSetTotalPages={onSetTotalPages}
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
          onBamLop={(id) => {
            if (id === 'doc' && !docUrl) {
              onUploadSlide()
              return
            }
            if (id === 'video' && !videoId) {
              onOpenSearchQueue()
              return
            }
            setBoCuc((bc) => bamLop(bc, id))
          }}
          coTaiLieu={Boolean(docUrl)}
          videoDangPhat={videoDangPhat}
          isHost={isHost}
          canModerate={canModerate}
          congCu={congCu}
          onChonCongCu={(c) => {
            if (!laNguoiTrinhChieu && c !== 'chuot') return
            setCongCu(c)
            if (c === 'chuot') return
            const taiLieuVeDuoc =
              slideState?.fileType === 'pdf' || slideState?.fileType === 'image' || laTepPptx(slideState)
            setBoCuc((bc) => phuBangDeVe(bc, taiLieuVeDuoc))
          }}
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
