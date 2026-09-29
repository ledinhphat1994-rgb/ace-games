// src/features/study/workspace/PresentationStage.tsx
// Digital Campus v2: Sân khấu trung tâm — Tài liệu, Bảng, Video chạy đồng thời như các lớp chồng lên nhau.
// Mỗi lớp giữ nguyên chỗ trong cây React (chỉ đổi vai trò bằng class) nên video không bị tải lại khi đổi bố cục.

import {
  type SlideState,
  type MediaState,
  type WhiteboardStroke,
  type SlideAnnotationStroke,
  type MatNet,
  type LopLaser,
  type QuyenCongCu,
  quyenCuaNet,
} from '@shared/protocol/room'
import { FileText, MonitorPlay, PenLine } from 'lucide-react'
import { BangVe } from './BangVe'
import type { CongCu, CoVe, LoaiHinh } from './cong-cu'
import { DocumentStageView } from './DocumentStageView'
import { EmbeddedVideoPlayer } from './EmbeddedVideoPlayer'
import { KhungLop, NutKhung } from './KhungLop'
import { LopLaserTrinhChieu } from './LopLaserTrinhChieu'
import type { TiaLaserSanKhau, TiaLaserTrang } from '@/hooks/use-room'
import { dangHien, viTriCuaSo, type BoCuc, type KhungCuaSo, type LopId } from './stage-layout'

export interface PresentationStageProps {
  boCuc: BoCuc
  onPhongTo: (id: LopId) => void
  onThuNho: (id: LopId) => void
  onAn: (id: LopId) => void
  /** Người trình chiếu kéo / đổi cỡ cửa sổ nổi xong → khung mới (đồng bộ cho cả phòng). */
  onDoiKhung?: (id: LopId, khung: KhungCuaSo) => void
  /** Đang kéo / đổi cỡ: khung tạm để cả phòng thấy cửa sổ di chuyển theo ngay. */
  onKeoKhung?: (id: LopId, khung: KhungCuaSo) => void
  /** Tia laser trên video / bảng / tài liệu nhúng. */
  stageLasers?: TiaLaserSanKhau[]
  onSendStageLaser?: (lop: LopLaser, point: [number, number] | null) => void
  isHost: boolean
  canModerate?: boolean
  myActorKey?: string
  quyenCongCu?: Record<string, QuyenCongCu[]>
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
  slideLasers?: TiaLaserTrang[]
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
  onDoiKhung,
  onKeoKhung,
  stageLasers = [],
  onSendStageLaser,
  isHost,
  canModerate = false,
  myActorKey,
  quyenCongCu = {},
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
  slideLasers = [],
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
  const coLopHien = (['doc', 'video', 'board'] as const).some((id) => dangHien(boCuc[id]))
  // Video là lớp chính: khung sân khấu ôm đúng 16:9 (lớn nhất vừa chỗ) thay vì để YouTube chèn hai dải đen hai bên;
  // phần thừa quanh khung là quầng sáng mờ lấy từ ảnh bìa video. Toàn màn hình giữ nguyên (phủ kín màn hình).
  const videoChinh = boCuc.video === 'main' && !isFullscreen && Boolean(mediaState?.videoId)

  const khungCuaSo = (id: LopId) => ({
    khung: boCuc.khung?.[id],
    onDoiKhung: canControl && onDoiKhung ? (k: KhungCuaSo) => onDoiKhung(id, k) : undefined,
    onKeoKhung: canControl && onKeoKhung ? (k: KhungCuaSo) => onKeoKhung(id, k) : undefined,
  })

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
        toanManHinh={isFullscreen}
        onToanManHinh={onToggleFullscreen}
        chiXem={!canControl}
      />
    )
  }

  // Laser: chọn công cụ laser rồi rê chuột trên video / bảng / tài liệu nhúng — cả phòng thấy chấm đỏ.
  const laser = (lop: LopLaser, tiLe?: number) => {
    const coLaser = canControl || Boolean(myActorKey && quyenCongCu[myActorKey]?.includes('laser'))
    return (
      <LopLaserTrinhChieu
        dangChieu={Boolean(coLaser && congCu === 'laser')}
        tiaKhac={stageLasers.filter((t) => t.lop === lop && t.senderKey !== myActorKey)}
        onSend={(pt) => onSendStageLaser?.(lop, pt)}
        tiLe={tiLe}
        testId={`stage-laser-${lop}`}
      />
    )
  }

  // Bảng (mat trống) độc lập; video và tài liệu nhúng mỗi thứ một lớp vẽ tàng hình riêng, đi theo khung của nó.
  const bangVe = (laPhu: boolean, mat?: MatNet) => (
    <BangVe
      strokes={whiteboardStrokes}
      congCu={congCu}
      hinh={hinh}
      mau={mau}
      co={co}
      laPhu={laPhu}
      mat={mat}
      coTheVe={canControl || Boolean(myActorKey && quyenCongCu[myActorKey]?.includes(quyenCuaNet(congCu === 'chu' ? 'text' : congCu === 'to_sang' ? 'highlighter' : congCu === 'khung' ? 'shape' : 'pen')))}
      coTheTayMoiNet={canControl}
      khoaCuaToi={myActorKey}
      onSendStroke={onSendStroke}
      onRemoveStroke={onRemoveStroke}
    />
  )

  return (
    // Khung ngoài đo chỗ trống (container query) để tính khung 16:9; toàn màn hình thì `contents` — không tạo khối
    // chứa cho phần tử fixed. Luôn giữ cùng phần tử cha nên đổi chế độ không làm video tải lại.
    <div
      className={isFullscreen ? 'contents' : 'relative flex h-full w-full items-center justify-center [container-type:size]'}
      data-testid="stage-khung-ngoai"
    >
      {videoChinh && mediaState?.videoId && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" data-testid="stage-quang-video">
          <img
            src={`https://i.ytimg.com/vi/${encodeURIComponent(mediaState.videoId)}/hqdefault.jpg`}
            alt=""
            className="size-full scale-110 object-cover opacity-40 blur-3xl saturate-150"
          />
        </div>
      )}
      <section
        aria-label="Khu vực trình chiếu trung tâm"
        // Chỉ một trong hai: có cả `relative` lẫn `fixed` thì `relative` thắng và toàn màn hình không phủ kín.
        className={`flex flex-col overflow-hidden bg-[#090e18] shadow-2xl ${
          isFullscreen
            ? 'fixed inset-0 z-[100] h-full w-full'
            : `relative rounded-2xl border border-white/10 transition-[width,height] duration-300 ease-out ${
                videoChinh ? 'h-[min(100cqh,calc(100cqw*9/16))] w-[min(100cqw,calc(100cqh*16/9))]' : 'h-full w-full'
              }`
        }`}
        data-testid="presentation-stage-container"
        onDoubleClick={(e) => {
          const muc = (e.target as HTMLElement | null)?.closest('[data-keo-khung]')
          if (!muc || (e.target as HTMLElement | null)?.closest('button, input, select, a, [role="slider"]')) return
          onToggleFullscreen()
        }}
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
              {canControl && (Boolean(slideState?.docUrl) || Boolean(mediaState?.videoId)) && (
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
          <KhungLop id="doc" vaiTro={boCuc.doc} viTri={viTriCuaSo(boCuc, 'doc')} khoa={!canControl} {...khungCuaSo('doc')}>
            <DocumentStageView
              slideState={slideState}
              lopVeNhung={
                <>
                  {bangVe(true, 'tailieu')}
                  {laser('tailieu')}
                </>
              }
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
              slideLasers={slideLasers}
              onSendSlideLaser={onSendSlideLaser}
              coTheChuThich={canControl || Boolean(myActorKey && quyenCongCu[myActorKey]?.includes(quyenCuaNet(congCu === 'chu' ? 'text' : congCu === 'to_sang' ? 'highlighter' : congCu === 'khung' ? 'shape' : 'pen')))}
              coLaser={canControl || Boolean(myActorKey && quyenCongCu[myActorKey]?.includes('laser'))}
              coTheTayMoiNet={canControl}
              khoaCuaToi={myActorKey}
            />
          </KhungLop>
        )}

        {/* ── LỚP VIDEO ── */}
        {boCuc.video && (
          <KhungLop id="video" vaiTro={boCuc.video} viTri={viTriCuaSo(boCuc, 'video')} khoa={!canControl} {...khungCuaSo('video')}>
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
                lopVe={
                  <>
                    {bangVe(true, 'video')}
                    {laser('video', 16 / 9)}
                  </>
                }
                compact={boCuc.video === 'pip'}
                isReconnecting={isReconnecting}
                onCloseVideo={() => {
                  onSyncMedia('pause')
                  onAn('video')
                }}
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

        {/* ── LỚP BẢNG: lớp chính / cửa sổ nổi (độc lập, không phủ lên lớp khác) ── */}
        {boCuc.board && (
          <KhungLop id="board" vaiTro={boCuc.board} viTri={viTriCuaSo(boCuc, 'board')} khoa={!canControl} {...khungCuaSo('board')}>
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
              <div className="relative min-h-0 flex-1">
                {bangVe(false)}
                {laser('board', 16 / 9)}
              </div>
            </div>
          </KhungLop>
        )}
      </section>
    </div>
  )
}
