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
import { ChevronUp, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ClassroomContextPanel } from './ClassroomContextPanel'
import { ClassroomToolDock } from './ClassroomToolDock'
import { ClassroomTopBar } from './ClassroomTopBar'
import { PresentationStage } from './PresentationStage'
import type { CongCu, CoVe, LoaiHinh } from './cong-cu'
import {
  anLop,
  bamLop,
  boCucBanDau,
  cungBoCuc,
  datKhung,
  goLop,
  hienLop,
  lamChinh,
  theoBoCucTrinhChieu,
  thuNho,
  type BoCuc,
  type BoCucMayChu,
  type KhungCuaSo,
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
  // Bố cục sân khấu do người trình chiếu đặt (RoomDO lưu + đồng bộ)
  stageLayout?: BoCucSanKhau | null
  daNhanAnhChup?: boolean
  onSendStageLayout?: (layout: BoCucSanKhau) => void
  // Slide
  slideState?: SlideState | null
  onPageChange?: (newPage: number, step?: number) => void
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
  const boCucMayChuRef = useRef<BoCucMayChu | null>(stageLayout)
  const boCucRef = useRef(boCuc)
  useEffect(() => {
    boCucRef.current = boCuc
  })
  // Đang kéo cửa sổ nổi: gửi khung tạm cho cả phòng (tối đa ~12 lần/giây, gói cuối không bị bỏ); thả chuột mới ghi vào bố cục.
  const keoRef = useRef<{ lanCuoi: number; hen: ReturnType<typeof setTimeout> | null; cho: BoCuc | null }>({
    lanCuoi: 0,
    hen: null,
    cho: null,
  })
  const guiKhungTam = (id: LopId, k: KhungCuaSo) => {
    if (!onSendStageLayout) return
    const t = keoRef.current
    const gui = (bc: BoCuc) => {
      t.lanCuoi = Date.now()
      boCucMayChuRef.current = bc
      onSendStageLayout(bc)
    }
    const bc = datKhung(boCucRef.current, id, k)
    // Cửa sổ đã chạm mép / chưa nhúc nhích: không gửi gói trùng.
    if (cungBoCuc(bc, t.cho ?? boCucMayChuRef.current)) return
    const conCho = 80 - (Date.now() - t.lanCuoi)
    if (conCho <= 0) {
      gui(bc)
      return
    }
    t.cho = bc
    t.hen ??= setTimeout(() => {
      t.hen = null
      if (t.cho) gui(t.cho)
      t.cho = null
    }, conCho)
  }
  useEffect(() => {
    const t = keoRef.current
    return () => {
      if (t.hen) clearTimeout(t.hen)
    }
  }, [])
  const ghiKhung = (id: LopId, k: KhungCuaSo) => {
    const t = keoRef.current
    if (t.hen) clearTimeout(t.hen)
    t.hen = null
    t.cho = null
    setBoCuc((bc) => datKhung(bc, id, k))
  }

  // Video mới (đổi video / phát từ danh sách) → hiện lớp video (chưa có lớp chính thì làm chính, có rồi thì giữ chỗ / cửa sổ nổi).
  // Phát, dừng, xem lại KHÔNG đổi bố cục: phóng to / thu nhỏ chỉ khi người trình chiếu bấm nút. Gỡ video → bỏ lớp.
  useEffect(() => {
    setBoCuc((bc) => (videoId ? hienLop(bc, 'video') : goLop(bc, 'video')))
  }, [videoId])

  // Mở tài liệu mới → đưa lên làm lớp chính; đóng tài liệu → bỏ lớp.
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
  const [hinh, setHinh] = useState<LoaiHinh>('chu_nhat')
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

  // Toàn màn hình: thanh công cụ tự thu xuống để không che sân khấu; rê chuột / chạm vào nút nhỏ ở đáy là hiện lại.
  // Đang mở khay (bút, công cụ) thì giữ nguyên.
  const [dockThuGon, setDockThuGon] = useState(false)
  const [khayDockMo, setKhayDockMo] = useState(false)
  const henThuGonRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const huyThuGon = () => {
    if (henThuGonRef.current) clearTimeout(henThuGonRef.current)
    henThuGonRef.current = null
  }
  const henThuGon = (ms: number) => {
    huyThuGon()
    henThuGonRef.current = setTimeout(() => setDockThuGon(true), ms)
  }
  const moDock = () => {
    huyThuGon()
    setDockThuGon(false)
  }
  useEffect(() => {
    if (isFullscreen) henThuGon(2000)
    else moDock()
    return huyThuGon
  }, [isFullscreen])
  const anDock = isFullscreen && dockThuGon && !khayDockMo

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
            onDoiKhung={laNguoiTrinhChieu ? ghiKhung : undefined}
            onKeoKhung={laNguoiTrinhChieu && daNhanAnhChup ? guiKhungTam : undefined}
            isHost={isHost}
            canModerate={canModerate}
            myActorKey={nguoiDung.actorKey}
            congCu={congCu}
            hinh={hinh}
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

      {/* ── 4. THANH CÔNG CỤ (toàn màn hình: nổi trên sân khấu, tự thu xuống, rê vào nút nhỏ ở đáy để hiện lại) ── */}
      <div className={isFullscreen ? 'pointer-events-none fixed inset-x-0 bottom-0 z-[110] flex justify-center' : undefined}>
        {anDock && (
          <button
            type="button"
            onPointerEnter={moDock}
            onClick={moDock}
            onFocus={moDock}
            className="pointer-events-auto absolute bottom-1.5 left-1/2 flex h-6 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/80 text-slate-300 shadow-lg backdrop-blur-md transition-colors hover:text-white cursor-pointer"
            title="Thanh công cụ"
            aria-label="Hiện thanh công cụ"
            data-testid="dock-handle"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
        <div
          className={
            isFullscreen
              ? `mb-2 transition-[transform,opacity] duration-300 ${anDock ? 'translate-y-[calc(100%+0.5rem)] opacity-0' : 'pointer-events-auto'}`
              : undefined
          }
          onPointerEnter={isFullscreen ? moDock : undefined}
          onPointerLeave={isFullscreen ? (e) => henThuGon(e.pointerType === 'touch' ? 2500 : 1200) : undefined}
          onFocusCapture={isFullscreen ? moDock : undefined}
          data-testid="dock-wrapper"
          data-thu-gon={anDock || undefined}
        >
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
            // Chọn công cụ không đổi bố cục: mỗi lớp (bảng, video, tài liệu) có mặt vẽ riêng nằm ngay trên nó.
            onChonCongCu={(c) => {
              if (!laNguoiTrinhChieu && c !== 'chuot') return
              setCongCu(c)
            }}
            hinh={hinh}
            onChonHinh={setHinh}
            mau={mau}
            onChonMau={setMau}
            co={co}
            onChonCo={setCo}
            onXoaHet={() => {
              onClearWhiteboard()
              onClearSlideAnnotations?.()
            }}
            onOpenCalculator={onOpenCalculator}
            onOpenSessionPanel={onOpenSessionPanel}
            onKhayMo={setKhayDockMo}
            myMic={myMic}
            onToggleMic={onToggleMic}
            voiceState={voiceState}
            audioInputs={audioInputs}
            audioOutputs={audioOutputs}
            isSinkIdSupported={isSinkIdSupported}
            onSetAudioInput={onSetAudioInput}
            onSetAudioOutput={onSetAudioOutput}
            onRefreshDevices={onRefreshDevices}
            isReconnecting={isReconnecting}
          />
        </div>
      </div>
    </div>
  )
}
