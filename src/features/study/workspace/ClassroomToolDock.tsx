// src/features/study/workspace/ClassroomToolDock.tsx
// Thanh dock lớp học: Mic · Tài liệu · Bảng · Video (bật / ẩn từng lớp, chạy đồng thời) · Chuột · Bút · Tẩy · Xoá hết · Công cụ.
// Màu và cỡ nét chỉ hiện khi chọn công cụ có dùng tới (bút, dạ quang, chữ, hình).

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
  // Laser chỉ hiện trên tài liệu.
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

const MAU_NHAN: Record<LopId, string> = {
  doc: 'text-orange-400',
  board: 'text-emerald-400',
  video: 'text-red-500',
}

function IconLop({ id, className }: { id: LopId; className?: string }) {
  if (id === 'doc') return <FileText className={className} />
  if (id === 'board') return <PenLine className={className} />
  return <YoutubeIcon className={className} />
}

// Điện thoại: chỉ còn biểu tượng để cả dock vừa một hàng.
const nutDock =
  'relative flex h-11 w-10 sm:w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white'
const nhanDock = 'hidden sm:block'
const dangChon = 'bg-white/12 text-white ring-1 ring-white/15'
const khongChon = 'text-slate-400 hover:bg-white/8 hover:text-slate-200'

const nutKhay =
  'flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors cursor-pointer'
const khayPopover =
  'space-y-2.5 rounded-2xl border border-white/15 bg-slate-950/95 p-2.5 text-slate-200 shadow-2xl backdrop-blur-2xl'

function BangMau({ mau, onChonMau, co, onChonCo }: Pick<ClassroomToolDockProps, 'mau' | 'onChonMau' | 'co' | 'onChonCo'>) {
  return (
    <>
      <div className="flex items-center justify-between gap-1 rounded-xl bg-white/5 px-2 py-1.5" data-testid="dock-color-palette">
        {MAU_VE.map((m) => (
          <button
            key={m.gia}
            type="button"
            onClick={() => onChonMau(m.gia)}
            title={m.ten}
            aria-label={`Màu ${m.ten}`}
            aria-pressed={mau === m.gia}
            className={`h-5 w-5 rounded-full border border-white/25 transition-transform cursor-pointer ${mau === m.gia ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-950' : 'hover:scale-110'}`}
            style={{ backgroundColor: m.gia }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-1 rounded-xl bg-white/5 px-2 py-1" data-testid="dock-size-picker">
        {CAC_CO_VE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChonCo(c)}
            title={['Nhỏ', 'Vừa', 'To', 'Rất to'][c]}
            aria-label={`Cỡ ${['nhỏ', 'vừa', 'to', 'rất to'][c]}`}
            aria-pressed={co === c}
            className={`flex h-8 flex-1 items-center justify-center rounded-lg cursor-pointer ${co === c ? 'bg-white/15' : 'hover:bg-white/10'}`}
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
}: ClassroomToolDockProps) {
  const canControl = !isReconnecting && (isHost || canModerate)
  const dangChay: Record<LopId, boolean> = { doc: coTaiLieu, board: false, video: videoDangPhat }
  const [moBut, setMoBut] = useState(false)
  const [moCongCu, setMoCongCu] = useState(false)
  const [moAmThanh, setMoAmThanh] = useState(false)
  useEffect(() => {
    onKhayMo?.(moBut || moCongCu || moAmThanh)
  }, [moBut, moCongCu, moAmThanh, onKhayMo])
  const congCuKhay = CONG_CU_KHAY.find((c) => c.id === congCu)
  const IconCongCu = congCuKhay?.icon ?? Wrench
  const bangMau = { mau, onChonMau, co, onChonCo }

  return (
    <nav
      aria-label="Thanh công cụ trình chiếu"
      className="flex items-center justify-center p-2 z-30 select-none"
      data-testid="classroom-tool-dock"
    >
      {/* Điện thoại hẹp: thanh cuộn ngang bên trong, không tràn trang. */}
      <div className="flex max-w-[calc(100vw-1rem)] items-center gap-0.5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/90 px-1.5 py-1 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl [scrollbar-width:none] sm:gap-1 sm:px-2">
        {/* ── 0. MIC + CÀI ĐẶT ÂM THANH (mọi người trong phòng) ── */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={voiceState.isConnecting}
          aria-pressed={myMic}
          title={myMic ? 'Tắt micro' : 'Bật micro'}
          aria-label={myMic ? 'Tắt micro' : 'Bật micro'}
          data-testid="dock-btn-mic"
          className={`${nutDock} ${myMic ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40' : khongChon} ${voiceState.isConnecting ? 'cursor-wait opacity-60' : ''} ${voiceState.speakingActors.includes('local') ? 'ring-2 ring-emerald-400/80' : ''}`}
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
            className={`flex h-11 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${moAmThanh ? dangChon : khongChon}`}
            title="Cài đặt âm thanh"
            aria-label="Cài đặt âm thanh"
            data-testid="dock-btn-audio-settings"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={10} className={`w-72 ${khayPopover}`} data-testid="dock-audio-tray">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Âm thanh</span>
              <span className="text-xs text-slate-400">{voiceState.connectionState === 'connected' ? 'Đã kết nối' : 'Sẵn sàng'}</span>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="voice-in-select" className="text-xs font-medium text-slate-300">
                Micro
              </label>
              <select
                id="voice-in-select"
                value={voiceState.currentInputDeviceId || ''}
                onChange={(e) => onSetAudioInput(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-white"
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
                <label htmlFor="voice-out-select" className="text-xs font-medium text-slate-300">
                  Loa / Tai nghe
                </label>
                <select
                  id="voice-out-select"
                  value={voiceState.currentOutputDeviceId || ''}
                  onChange={(e) => onSetAudioOutput(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-1.5 text-xs text-white"
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

        <div className="mx-0.5 sm:mx-1 h-7 w-px bg-white/15" />

        {/* ── 1. BA LỚP NỘI DUNG + CÔNG CỤ VẼ HAY DÙNG: chỉ chủ phòng / người điều hành ── */}
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
                  <IconLop id={id} className={`h-4.5 w-4.5 ${MAU_NHAN[id]}`} />
                  <span className={nhanDock}>{ten}</span>
                  {dangChay[id] && (
                    <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-current text-emerald-400 animate-pulse" />
                  )}
                </button>
              )
            })}

            <div className="mx-0.5 sm:mx-1 h-7 w-px bg-white/15" />

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

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Xoá hết nét vẽ, chữ và hình trên bảng và tài liệu?')) onXoaHet()
              }}
              title="Xoá hết"
              aria-label="Xoá hết"
              data-testid="tool-btn-clear-all"
              className={`${nutDock} text-slate-400 hover:bg-red-500/15 hover:text-red-300`}
            >
              <Trash2 className="h-4.5 w-4.5" />
              <span className={nhanDock}>Xoá hết</span>
            </button>

            <div className="mx-0.5 sm:mx-1 h-7 w-px bg-white/15" />
          </>
        )}

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
            {canControl && (
              <div className="grid grid-cols-4 gap-1">
                {CONG_CU_KHAY.map(({ id, ten, icon: Icon, testId }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChonCongCu(id)}
                    aria-pressed={congCu === id}
                    title={ten}
                    data-testid={testId}
                    className={`${nutKhay} ${congCu === id ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40' : 'text-slate-300 hover:bg-white/10'}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{ten}</span>
                  </button>
                ))}
              </div>
            )}

            {canControl && congCu === 'khung' && (
              <div className="grid grid-cols-5 gap-1 rounded-xl bg-white/5 p-1" data-testid="dock-shape-picker">
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
                      className={`flex h-8 items-center justify-center rounded-lg cursor-pointer ${hinh === id ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  )
                })}
              </div>
            )}

            {canControl && congCuKhay && CONG_CU_CO_MAU.has(congCu) && <BangMau {...bangMau} />}

            <div className={`grid grid-cols-4 gap-1 ${canControl ? 'border-t border-white/10 pt-2' : ''}`}>
              <button type="button" onClick={onOpenCalculator} title="Máy tính" className={`${nutKhay} text-slate-300 hover:bg-white/10`} data-testid="tool-btn-calculator">
                <CalcIcon className="h-4 w-4 text-cyan-400" />
                <span>Máy tính</span>
              </button>
              <button type="button" onClick={onOpenSessionPanel} title="Phiên học" className={`${nutKhay} text-slate-300 hover:bg-white/10`} data-testid="tool-btn-session">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Phiên học</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
