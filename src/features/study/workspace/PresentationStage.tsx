// src/features/study/workspace/PresentationStage.tsx
// Digital Campus v2: Sân khấu trung tâm — Tài liệu, Bảng, Video chạy đồng thời như các lớp chồng lên nhau.
// Mỗi lớp giữ nguyên chỗ trong cây React (chỉ đổi vai trò bằng class) nên video không bị tải lại khi đổi bố cục.

import type { SlideState, MediaState, WhiteboardStroke, SlideAnnotationStroke } from '@shared/protocol/room'
import { FileText, MonitorPlay, PenLine } from 'lucide-react'
import { BangVe } from './BangVe'
import type { CongCu, CoVe, LoaiHinh } from './cong-cu'
import { DocumentStageView } from './DocumentStageView'
import { EmbeddedVideoPlayer } from './EmbeddedVideoPlayer'
import { KhungLop, NutKhung } from './KhungLop'
import { dangHien, lopChinh, viTriCuaSo, type BoCuc, type LopId } from './stage-layout'

export interface PresentationStageProps {
  boCuc: BoCuc
  onPhongTo: (id: LopId) => void
  onThuNho: (id: LopId) => void
  onAn: (id: LopId) => void
  onBatTatBangPhu: () => void
  isHost: boolean
  canModerate?: boolean
  /** Bố cục đang theo người trình chiếu (đồng bộ qua RoomDO): người xem thấy đúng lớp bảng giáo viên đang bật. */
  theoNguoiTrinhChieu?: boolean
  myActorKey?: string
  // Công cụ vẽ chung
  congCu: CongCu
  hinh: LoaiHinh
  mau: string
  co: CoVe
  // Document props
  slideState?: SlideState | null
  onPageChange?: (newPage: number, step?: number) => void
  onUploadSlide: () => void
  onCloseDoc?: () => void
  onSetTotalPages?: (totalPages: number) => void
  slideAnnotations?: SlideAnnotationStroke[]
  onSendSlideAnnotation?: (stroke: SlideAnnotationStroke) => void
  onRemoveSlideAnnotation?: (id: string) => void
  slideLaser?: { point: [number, number] | null; page: number; senderName?: string; updatedAt: number } | null
  onSendSlideLaser?: (point: [number, number] | null, page: number) => void
  // Video props
  mediaState?: MediaState | null
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  calculateTargetTime: () => number
  // Whiteboard props
  whiteboardStrokes: WhiteboardStroke[]
  onSendStroke: (stroke: Omit<WhiteboardStroke, 'epoch'> | WhiteboardStroke) => void
  onRemoveStroke: (id: string) => void
  // Stage container props
  isFullscreen: boolean
  onToggleFullscreen: () => void
  isReconnecting?: boolean
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function PresentationStage({
  boCuc,
  onPhongTo,
  onThuNho,
  onAn,
  onBatTatBangPhu,
  isHost,
  canModerate = false,
  theoNguoiTrinhChieu = false,
  myActorKey,
  congCu,
  hinh,
  mau,
  co,
  slideState,
  onPageChange,
  onUploadSlide,
  onCloseDoc,
  onSetTotalPages,
  slideAnnotations,
  onSendSlideAnnotation,
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
  isFullscreen,
  onToggleFullscreen,
  isReconnecting = false,
}: PresentationStageProps) {
  const canControl = !isReconnecting && (isHost || canModerate)
  const chinh = lopChinh(boCuc)
  const coLopHien = (['doc', 'video', 'board'] as const).some((id) => dangHien(boCuc[id]))

  const nutKhung = (id: LopId) => {
    const vaiTro = boCuc[id]
    if (!vaiTro) return null
    return (
      <NutKhung
        id={id}
        vaiTro={vaiTro}
        onPhongTo={() => onPhongTo(id)}
        onThuNho={() => onThuNho(id)}
        onAn={() => onAn(id)}
        onPhu={id === 'board' ? onBatTatBangPhu : undefined}
        coThePhu={id === 'board' && chinh !== null && chinh !== 'board'}
        toanManHinh={isFullscreen}
        onToanManHinh={onToggleFullscreen}
        choPhepAn={canControl}
      />
    )
  }

  const bangVe = (laPhu: boolean) => (
    <BangVe
      strokes={whiteboardStrokes}
      congCu={congCu}
      hinh={hinh}
      mau={mau}
      co={co}
      laPhu={laPhu}
      coTheVe={canControl}
      coTheTayMoiNet={canControl}
      khoaCuaToi={myActorKey}
      onSendStroke={onSendStroke}
      onRemoveStroke={onRemoveStroke}
    />
  )

  return (
    <section
      aria-label="Khu vực trình chiếu trung tâm"
      // Chỉ một trong hai: có cả `relative` lẫn `fixed` thì `relative` thắng và toàn màn hình không phủ kín.
      className={`flex h-full w-full flex-col overflow-hidden bg-[#090e18] shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-[100]' : 'relative rounded-2xl border border-white/10'
      }`}
      data-testid="presentation-stage-container"
    >
      {/* ── SÂN KHẤU TRỐNG: chưa bật lớp nào ── */}
      {!coLopHien && (
        <div
          className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none"
          data-testid="stage-idle-view"
        >
          <div className="flex flex-col items-center max-w-sm space-y-3" data-testid="idle-stage-empty-view">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
              <MonitorPlay className="h-7 w-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Chưa có nội dung trình bày
            </h2>
            {(Boolean(slideState?.docUrl) || Boolean(mediaState?.videoId)) && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1" data-testid="stage-restore-actions">
                {slideState?.docUrl && (
                  <button
                    type="button"
                    onClick={() => onPhongTo('doc')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-colors cursor-pointer"
                    data-testid="stage-restore-doc-btn"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Xem tài liệu</span>
                  </button>
                )}
                {mediaState?.videoId && (
                  <button
                    type="button"
                    onClick={() => onPhongTo('video')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-colors cursor-pointer"
                    data-testid="stage-restore-video-btn"
                  >
                    <YoutubeIcon className="h-3.5 w-3.5" />
                    <span>Xem video</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LỚP TÀI LIỆU ── */}
      {boCuc.doc && (
        <KhungLop id="doc" vaiTro={boCuc.doc} viTri={viTriCuaSo(boCuc, 'doc')}>
          <DocumentStageView
            slideState={slideState}
            isHost={isHost}
            canModerate={canModerate}
            onPageChange={onPageChange}
            onUploadSlide={onUploadSlide}
            onCloseDoc={onCloseDoc}
            onSetTotalPages={onSetTotalPages}
            dieuKhienKhung={nutKhung('doc')}
            compact={boCuc.doc === 'pip'}
            nhanPhim={boCuc.doc === 'main'}
            congCu={congCu}
            hinh={hinh}
            mau={mau}
            co={co}
            isReconnecting={isReconnecting}
            slideAnnotations={slideAnnotations}
            onSendSlideAnnotation={onSendSlideAnnotation}
            onRemoveSlideAnnotation={onRemoveSlideAnnotation}
            slideLaser={slideLaser}
            onSendSlideLaser={onSendSlideLaser}
          />
        </KhungLop>
      )}

      {/* ── LỚP VIDEO ── */}
      {boCuc.video && (
        <KhungLop id="video" vaiTro={boCuc.video} viTri={viTriCuaSo(boCuc, 'video')}>
          {mediaState && mediaState.videoId ? (
            <EmbeddedVideoPlayer
              mediaState={mediaState}
              isHost={isHost}
              canModerate={canModerate}
              canControlMedia={canControlMedia}
              volume={volume}
              onVolumeChange={onVolumeChange}
              onSyncMedia={onSyncMedia}
              onOpenSearchQueue={onOpenSearchQueue}
              calculateTargetTime={calculateTargetTime}
              dieuKhienKhung={nutKhung('video')}
              compact={boCuc.video === 'pip'}
              isReconnecting={isReconnecting}
            />
          ) : (
            <div className="flex h-full w-full flex-col bg-[#090d16] select-none" data-testid="video-stage-empty">
              <div data-keo-khung className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/85 px-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-white">
                  <YoutubeIcon className="h-4 w-4 text-red-500" />
                  Video
                </span>
                {nutKhung('video')}
              </div>
              <div className="flex flex-1 items-center justify-center p-4 text-center">
                {canControl ? (
                  <button
                    type="button"
                    onClick={onOpenSearchQueue}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                    data-testid="stage-open-yt-cta"
                  >
                    <YoutubeIcon className="h-3.5 w-3.5" />
                    <span>Chọn video</span>
                  </button>
                ) : (
                  <h3 className="text-sm font-bold text-white">Chưa có video</h3>
                )}
              </div>
            </div>
          )}
        </KhungLop>
      )}

      {/* ── LỚP BẢNG: lớp chính / cửa sổ nổi / phủ trong suốt lên lớp chính ── */}
      {boCuc.board && (
        <KhungLop id="board" vaiTro={boCuc.board} viTri={viTriCuaSo(boCuc, 'board')}>
          {boCuc.board === 'phu' ? (
            // Phủ đúng vùng nội dung của lớp chính: chừa thanh tiêu đề (và thanh điều khiển nếu lớp chính là video).
            <div
              className={`absolute inset-x-0 ${chinh === 'video' ? 'top-10 bottom-16' : 'top-11 bottom-0'}`}
              data-testid="whiteboard-stage"
            >
              {bangVe(true)}
              {canControl && (
                <div className="pointer-events-auto absolute left-2 top-2 z-30 flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-slate-950/85 py-0.5 pl-2 pr-0.5 shadow-lg backdrop-blur-md">
                  <PenLine className="h-3.5 w-3.5 text-emerald-400" />
                  {nutKhung('board')}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full w-full flex-col overflow-hidden bg-[#0a1611]" data-testid="whiteboard-stage">
              <div
                data-keo-khung
                className={`flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/80 ${boCuc.board === 'pip' ? 'h-9 px-2' : 'h-10 px-3 sm:px-4'}`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold text-white">
                  <PenLine className="h-4 w-4 text-emerald-400" />
                  Bảng
                </span>
                {nutKhung('board')}
              </div>
              <div className="relative min-h-0 flex-1">{bangVe(false)}</div>
            </div>
          )}
        </KhungLop>
      )}

      {/* Phòng chưa có bố cục của người trình chiếu: người xem vẫn thấy nét vẽ bảng phủ trên video / tài liệu */}
      {!canControl && !theoNguoiTrinhChieu && boCuc.board !== 'phu' && boCuc.board !== 'main' && whiteboardStrokes.length > 0 && (chinh === 'video' || chinh === 'doc') && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-20 ${chinh === 'video' ? 'top-10 bottom-16' : 'top-11 bottom-0'}`}
          data-testid="whiteboard-passive-overlay"
        >
          {bangVe(true)}
        </div>
      )}
    </section>
  )
}
