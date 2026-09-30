// src/features/study/workspace/ClassroomToolDock.tsx
// Thanh dock lớp học: Mic · Tài liệu · Bảng · Video (bật / ẩn từng lớp, chạy đồng thời) · Chuột · Bút · Tẩy · Xoá hết · Công cụ.
// Màu và cỡ nét chỉ hiện khi chọn công cụ có dùng tới (bút, dạ quang, chữ, hình).

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { VoiceClientState } from '@/lib/voice-client'
import {
  ArrowUpRight,
  Calculator as CalcIcon,
  Circle,
  Clock,
  Eraser,
  FileText,
  Highlighter,
  Loader2,
  Mic,
  MicOff,
  Minus,
  MousePointer2,
  Pen,
  PenLine,
  Shapes,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Triangle,
  Type,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CAC_CO_VE, CAC_HINH, CONG_CU_CO_MAU, MAU_VE, type CongCu, type CoVe, type LoaiHinh } from './cong-cu'
import { dangHien, type BoCuc, type LopId } from './stage-layout'

export interface ClassroomToolDockProps {
  boCuc: BoCuc
  onBamLop: (id: LopId) => void
  coTaiLieu: boolean
  videoDangPhat: boolean
  isHost: boolean
  canModerate?: boolean
  // Công cụ vẽ chung
  congCu: CongCu
  onChonCongCu: (congCu: CongCu) => void
  hinh: LoaiHinh
  onChonHinh: (hinh: LoaiHinh) => void
  mau: string
  onChonMau: (mau: string) => void
  co: CoVe
  onChonCo: (co: CoVe) => void
  /** Xoá mọi nét vẽ, chữ, hình trên bảng và trên mọi trang tài liệu. */
  onXoaHet: () => void
  // Tiện ích
  onOpenCalculator: () => void
  onOpenSessionPanel: () => void
  // Mic (mọi người trong phòng)
  myMic: boolean
  onToggleMic: () => void
  voiceState: VoiceClientState
  audioInputs: MediaDeviceInfo[]
  audioOutputs: MediaDeviceInfo[]
  isSinkIdSupported: boolean
  onSetAudioInput: (deviceId: string) => void
  onSetAudioOutput: (deviceId: string) => void
  onRefreshDevices: () => void
  /** Có khay nào (bút / công cụ) đang mở — để thanh tự thu gọn khi toàn màn hình không ẩn mất khay. */
  onKhayMo?: (mo: boolean) => void
  isReconnecting?: boolean
  /**
   * Công cụ vẽ / laser người này dùng được: người trình chiếu có hết, người tham gia theo quyền chủ phòng cấp.
   * Chỉ để ẩn nút — máy chủ vẫn chặn gói của công cụ chưa được cấp.
   */
  coTheDung?: (congCu: CongCu) => boolean
  /** Được xoá hết nét vẽ (chủ phòng cấp quyền "Xoá hết"). */
  coTheXoa?: boolean
  /** Được bật mic (người tham gia cần chủ phòng cấp quyền mic). */
  coMic?: boolean
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

/** Công cụ trong khay "Công cụ" (chuột, bút, tẩy nằm ngay trên dock). */
const CONG_CU_KHAY: { id: CongCu; ten: string; icon: LucideIcon; testId: string }[] = [
  { id: 'to_sang', ten: 'Dạ quang', icon: Highlighter, testId: 'tool-btn-highlighter' },
  { id: 'chu', ten: 'Chữ', icon: Type, testId: 'tool-btn-text' },
  { id: 'khung', ten: 'Hình', icon: Shapes, testId: 'tool-btn-shape' },
  // Laser: rê chuột trên tài liệu / video / bảng, cả phòng thấy chấm đỏ.
  { id: 'laser', ten: 'Laser', icon: Sparkles, testId: 'tool-btn-laser' },
]

const ICON_HINH: Record<LoaiHinh, LucideIcon> = {
  chu_nhat: Square,
  tron: Circle,
  tam_giac: Triangle,
  thang: Minus,
  mui_ten: ArrowUpRight,
}

const NUT_LOP: { id: LopId; ten: string; testId: string }[] = [
  { id: 'doc', ten: 'Tài liệu', testId: 'dock-btn-document' },
  { id: 'board', ten: 'Bảng', testId: 'dock-btn-whiteboard' },
  { id: 'video', ten: 'Video', testId: 'dock-btn-video' },
]

function IconLop({ id, className }: { id: LopId; className?: string }) {
  if (id === 'doc') return <FileText className={className} />
  if (id === 'board') return <PenLine className={className} />
  return <YoutubeIcon className={className} />
}

// Điện thoại: chỉ còn biểu tượng để cả dock vừa một hàng.
const nutDock =
  'relative flex size-11 shrink-0 sm:h-14 sm:w-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand'
const nhanDock = 'hidden text-xs sm:block'
const dangChon = 'bg-brand/12 text-brand ring-1 ring-brand/30'
const khongChon = 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary'

const nutKhay =
  'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand'
const khayPopover =
  'space-y-2.5 rounded-2xl border border-border-default bg-surface-raised p-2.5 text-text-primary shadow-2xl'

function BangMau({ mau, onChonMau, co, onChonCo }: Pick<ClassroomToolDockProps, 'mau' | 'onChonMau' | 'co' | 'onChonCo'>) {
  return (
    <>
      <div className="flex items-center justify-between gap-1 rounded-xl bg-surface-overlay px-2 py-1.5" data-testid="dock-color-palette">
        {MAU_VE.map((m) => (
          <button
            key={m.gia}
            type="button"
            onClick={() => onChonMau(m.gia)}
            title={m.ten}
            aria-label={`Màu ${m.ten}`}
            aria-pressed={mau === m.gia}
            className={`h-5 w-5 rounded-full border border-border-default transition-transform cursor-pointer ${mau === m.gia ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'hover:scale-110'}`}
            style={{ backgroundColor: m.gia }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-1 rounded-xl bg-surface-overlay px-2 py-1" data-testid="dock-size-picker">
        {CAC_CO_VE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChonCo(c)}
            title={['Nhỏ', 'Vừa', 'To', 'Rất to'][c]}
            aria-label={`Cỡ ${['nhỏ', 'vừa', 'to', 'rất to'][c]}`}
            aria-pressed={co === c}
            className={`flex h-8 flex-1 items-center justify-center rounded-lg cursor-pointer ${co === c ? 'bg-surface-overlay' : 'hover:bg-surface-overlay'}`}
          >
            <span className="rounded-full" style={{ width: 4 + c * 4, height: 4 + c * 4, backgroundColor: mau }} />
          </button>
        ))}
      </div>
    </>
  )
}

export function ClassroomToolDock({
  boCuc,
  onBamLop,
  coTaiLieu,
  videoDangPhat,
  isHost,
  canModerate = false,
  congCu,
  onChonCongCu,
  hinh,
  onChonHinh,
  mau,
  onChonMau,
  co,
  onChonCo,
  onXoaHet,
  onOpenCalculator,
  onOpenSessionPanel,
  myMic,
  onToggleMic,
  voiceState,
  audioInputs,
  audioOutputs,
  isSinkIdSupported,
  onSetAudioInput,
  onSetAudioOutput,
  onRefreshDevices,
  onKhayMo,
  isReconnecting = false,
  coTheDung,
  coTheXoa,
  coMic = true,
}: ClassroomToolDockProps) {
  const canControl = !isReconnecting && (isHost || canModerate)
  const duocDung = (c: CongCu) => !isReconnecting && (coTheDung ? coTheDung(c) : canControl)
  const duocXoa = !isReconnecting && (coTheXoa ?? canControl)
  const khayDuocDung = CONG_CU_KHAY.filter((c) => duocDung(c.id))
  const coCongCuNao = duocDung('but') || duocDung('tay') || khayDuocDung.length > 0 || duocXoa
  const dangChay: Record<LopId, boolean> = { doc: coTaiLieu, board: false, video: videoDangPhat }
  const [moBut, setMoBut] = useState(false)
  const [moCongCu, setMoCongCu] = useState(false)
  const [moAmThanh, setMoAmThanh] = useState(false)
  const [moXacNhanXoaHet, setMoXacNhanXoaHet] = useState(false)
  useEffect(() => {
    onKhayMo?.(moBut || moCongCu || moAmThanh)
  }, [moBut, moCongCu, moAmThanh, onKhayMo])
  const congCuKhay = CONG_CU_KHAY.find((c) => c.id === congCu)
  const IconCongCu = congCuKhay?.icon ?? Wrench
  const bangMau = { mau, onChonMau, co, onChonCo }

  return (
    <nav
      aria-label="Thanh công cụ trình chiếu"
      className="flex items-center justify-center px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-30 select-none"
      data-testid="classroom-tool-dock"
    >
      {/* Điện thoại hẹp: thanh cuộn ngang bên trong, không tràn trang. */}
      <div className="flex min-w-0 max-w-[calc(100vw-1rem)] items-center gap-2 rounded-2xl border border-border-default bg-surface/95 p-1.5">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* ── 0. MIC + CÀI ĐẶT ÂM THANH (mọi người trong phòng) ── */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={voiceState.isConnecting || (!coMic && !myMic)}
          aria-pressed={myMic}
          title={!coMic && !myMic ? 'Chủ phòng chưa cấp quyền mic' : myMic ? 'Tắt micro' : 'Bật micro'}
          aria-label={myMic ? 'Tắt micro' : 'Bật micro'}
          data-testid="dock-btn-mic"
          className={`${nutDock} ${myMic ? 'bg-emerald-500/20 text-success ring-1 ring-emerald-400/40' : khongChon} ${voiceState.isConnecting ? 'cursor-wait opacity-60' : ''} ${!coMic && !myMic ? 'cursor-not-allowed opacity-40' : ''} ${voiceState.speakingActors.includes('local') ? 'ring-2 ring-emerald-400/80' : ''}`}
        >
          {voiceState.isConnecting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : myMic ? (
            <Mic className="h-4.5 w-4.5" />
          ) : (
            <MicOff className="h-4.5 w-4.5" />
          )}
          <span className={nhanDock}>Mic</span>
        </button>
        <Popover
          open={moAmThanh}
          onOpenChange={(mo) => {
            setMoAmThanh(mo)
            if (mo) onRefreshDevices()
          }}
        >
          <PopoverTrigger
            type="button"
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand ${moAmThanh ? dangChon : khongChon}`}
            title="Cài đặt âm thanh"
            aria-label="Cài đặt âm thanh"
            data-testid="dock-btn-audio-settings"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={10} className={`w-72 ${khayPopover}`} data-testid="dock-audio-tray">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">Âm thanh</span>
              <span className="text-xs text-text-secondary">{voiceState.connectionState === 'connected' ? 'Đã kết nối' : 'Sẵn sàng'}</span>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="voice-in-select" className="text-xs font-medium text-text-secondary">
                Micro
              </label>
              <select
                id="voice-in-select"
                value={voiceState.currentInputDeviceId || ''}
                onChange={(e) => onSetAudioInput(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface px-2 py-1.5 text-xs text-text-primary"
              >
                {audioInputs.length === 0 ? (
                  <option value="">Mặc định hệ thống</option>
                ) : (
                  audioInputs.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Micro ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>
            {isSinkIdSupported && (
              <div className="space-y-1.5">
                <label htmlFor="voice-out-select" className="text-xs font-medium text-text-secondary">
                  Loa / Tai nghe
                </label>
                <select
                  id="voice-out-select"
                  value={voiceState.currentOutputDeviceId || ''}
                  onChange={(e) => onSetAudioOutput(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-surface px-2 py-1.5 text-xs text-text-primary"
                >
                  {audioOutputs.length === 0 ? (
                    <option value="">Mặc định hệ thống</option>
                  ) : (
                    audioOutputs.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Loa ${i + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <div className="mx-0.5 sm:mx-1 h-7 w-px bg-border-strong" />

        {/* ── 1. BA LỚP NỘI DUNG: chỉ chủ phòng / người điều hành (không bao giờ cấp cho người tham gia) ── */}
        {canControl && (
          <>
            {NUT_LOP.map(({ id, ten, testId }) => {
              const hien = dangHien(boCuc[id])
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onBamLop(id)}
                  aria-pressed={hien}
                  title={ten}
                  aria-label={ten}
                  data-testid={testId}
                  className={`${nutDock} ${hien ? dangChon : khongChon}`}
                >
                  <IconLop id={id} className="h-4.5 w-4.5" />
                  <span className={nhanDock}>{ten}</span>
                  {dangChay[id] && (
                    <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  )}
                </button>
              )
            })}

            <div className="mx-0.5 sm:mx-1 h-7 w-px bg-border-strong" />
          </>
        )}

        {/* ── CÔNG CỤ VẼ HAY DÙNG: người trình chiếu, hoặc người tham gia được chủ phòng cấp quyền ── */}
        {coCongCuNao && (
          <>
            <button
              type="button"
              onClick={() => onChonCongCu('chuot')}
              aria-pressed={congCu === 'chuot'}
              title="Chuột"
              aria-label="Chuột"
              data-testid="tool-btn-pointer"
              className={`${nutDock} ${congCu === 'chuot' ? dangChon : khongChon}`}
            >
              <MousePointer2 className="h-4.5 w-4.5" />
              <span className={nhanDock}>Chuột</span>
            </button>

            {/* Bút: bấm là chọn bút và mở màu / cỡ nét ngay tại chỗ. */}
            {duocDung('but') && (
            <Popover open={moBut} onOpenChange={setMoBut}>
              <PopoverTrigger
                type="button"
                onClick={() => onChonCongCu('but')}
                aria-pressed={congCu === 'but'}
                title="Bút"
                aria-label="Bút"
                data-testid="tool-btn-pen"
                className={`${nutDock} ${congCu === 'but' ? dangChon : khongChon}`}
              >
                <Pen className="h-4.5 w-4.5" />
                <span className={nhanDock}>Bút</span>
                {congCu === 'but' && (
                  <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full ring-1 ring-white/40" style={{ backgroundColor: mau }} />
                )}
              </PopoverTrigger>
              <PopoverContent side="top" align="center" sideOffset={10} className={`w-64 ${khayPopover}`} data-testid="dock-pen-tray">
                <BangMau {...bangMau} />
              </PopoverContent>
            </Popover>
            )}

            {duocDung('tay') && (
            <button
              type="button"
              onClick={() => onChonCongCu('tay')}
              aria-pressed={congCu === 'tay'}
              title="Tẩy"
              aria-label="Tẩy"
              data-testid="tool-btn-eraser"
              className={`${nutDock} ${congCu === 'tay' ? dangChon : khongChon}`}
            >
              <Eraser className="h-4.5 w-4.5" />
              <span className={nhanDock}>Tẩy</span>
            </button>
            )}

            {duocXoa && (
            <>
              <button
                type="button"
                onClick={() => setMoXacNhanXoaHet(true)}
                title="Xoá hết"
                aria-label="Xoá hết"
                data-testid="tool-btn-clear-all"
                className={`${nutDock} text-text-secondary hover:bg-red-500/15 hover:text-red-300`}
              >
                <Trash2 className="h-4.5 w-4.5" />
                <span className={nhanDock}>Xoá hết</span>
              </button>

              <Dialog open={moXacNhanXoaHet} onOpenChange={setMoXacNhanXoaHet}>
                <DialogContent
                  className="sm:max-w-sm border-border-default bg-surface/95 backdrop-blur-2xl shadow-2xl p-6 text-text-primary text-center"
                  showCloseButton={true}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
                    <Trash2 className="h-7 w-7" />
                  </div>
                  <DialogHeader className="items-center text-center pr-0 gap-1.5 mt-2">
                    <DialogTitle className="text-base font-bold text-text-primary tracking-wide">
                      Xoá toàn bộ nét vẽ?
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-secondary leading-relaxed max-w-[260px] mx-auto">
                      Xoá hết nét vẽ, chữ và hình trên bảng và tài liệu. Hành động này không thể hoàn tác.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMoXacNhanXoaHet(false)}
                      className="flex-1 rounded-xl border border-border-default bg-surface-overlay py-2 text-xs font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text-primary transition-all cursor-pointer"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMoXacNhanXoaHet(false)
                        onXoaHet()
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-2 text-xs font-semibold text-text-primary shadow-lg shadow-red-600/30 hover:from-red-500 hover:to-rose-500 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Xoá hết</span>
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
            )}

            <div className="mx-0.5 sm:mx-1 h-7 w-px bg-border-strong" />
          </>
        )}

        </div>

        {/* ── 2. CÔNG CỤ: dạ quang, chữ, hình, laser (màu / cỡ hiện khi chọn), máy tính, phiên học ── */}
        <Popover open={moCongCu} onOpenChange={setMoCongCu}>
          <PopoverTrigger
            type="button"
            className={`${nutDock} ${congCuKhay ? dangChon : khongChon}`}
            title="Công cụ"
            aria-label="Công cụ"
            data-testid="dock-btn-secondary-tools"
          >
            <IconCongCu className="h-4.5 w-4.5" />
            <span className={nhanDock}>Công cụ</span>
            {congCuKhay && CONG_CU_CO_MAU.has(congCu) && (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full ring-1 ring-white/40" style={{ backgroundColor: mau }} />
            )}
          </PopoverTrigger>
          <PopoverContent side="top" align="center" sideOffset={10} className={`w-72 ${khayPopover}`} data-testid="dock-tools-tray">
            {khayDuocDung.length > 0 && (
              <div className="grid grid-cols-4 gap-1">
                {khayDuocDung.map(({ id, ten, icon: Icon, testId }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChonCongCu(id)}
                    aria-pressed={congCu === id}
                    title={ten}
                    data-testid={testId}
                    className={`${nutKhay} ${congCu === id ? 'bg-cyan-500/20 text-brand ring-1 ring-cyan-400/40' : 'text-text-secondary hover:bg-surface-overlay'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{ten}</span>
                  </button>
                ))}
              </div>
            )}

            {duocDung('khung') && congCu === 'khung' && (
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-surface-overlay p-1" data-testid="dock-shape-picker">
                {CAC_HINH.map(({ id, ten }) => {
                  const Icon = ICON_HINH[id]
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChonHinh(id)}
                      aria-pressed={hinh === id}
                      title={ten}
                      aria-label={ten}
                      data-testid={`shape-btn-${id}`}
                      className={`flex h-8 items-center justify-center rounded-lg cursor-pointer ${hinh === id ? 'bg-surface-overlay text-text-primary' : 'text-text-secondary hover:bg-surface-overlay'}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            )}

            {congCuKhay && duocDung(congCu) && CONG_CU_CO_MAU.has(congCu) && <BangMau {...bangMau} />}

            <div className={`grid grid-cols-4 gap-1 ${khayDuocDung.length > 0 ? 'border-t border-border-default pt-2' : ''}`}>
              <button type="button" onClick={onOpenCalculator} title="Máy tính" className={`${nutKhay} text-text-secondary hover:bg-surface-overlay`} data-testid="tool-btn-calculator">
                <CalcIcon className="h-4 w-4 text-brand" />
                <span>Máy tính</span>
              </button>
              <button type="button" onClick={onOpenSessionPanel} title="Phiên học" className={`${nutKhay} text-text-secondary hover:bg-surface-overlay`} data-testid="tool-btn-session">
                <Clock className="h-4 w-4 text-success" />
                <span>Phiên học</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
