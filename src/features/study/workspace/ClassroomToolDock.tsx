// src/features/study/workspace/ClassroomToolDock.tsx
// Thanh dock lớp học: Tài liệu · Bảng · Video (bật / ẩn từng lớp, chạy đồng thời) và Công cụ (mọi công cụ vẽ gom một chỗ).

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Calculator as CalcIcon,
  Circle,
  Clock,
  Eraser,
  FileText,
  Highlighter,
  MousePointer2,
  Pen,
  PenLine,
  Sparkles,
  Square,
  Trash2,
  Type,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { CAC_CO_VE, MAU_VE, type CongCu, type CoVe } from './cong-cu'
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
  mau: string
  onChonMau: (mau: string) => void
  co: CoVe
  onChonCo: (co: CoVe) => void
  // Xoá
  onClearWhiteboard: () => void
  onClearSlidePage?: () => void
  // Tiện ích
  onOpenCalculator: () => void
  onOpenSessionPanel: () => void
  isReconnecting?: boolean
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const CONG_CU: { id: CongCu; ten: string; icon: LucideIcon; testId: string; chiNguoiDieuHanh?: boolean }[] = [
  { id: 'chuot', ten: 'Chuột', icon: MousePointer2, testId: 'tool-btn-pointer' },
  { id: 'but', ten: 'Bút', icon: Pen, testId: 'tool-btn-pen' },
  { id: 'to_sang', ten: 'Dạ quang', icon: Highlighter, testId: 'tool-btn-highlighter' },
  { id: 'tay', ten: 'Tẩy', icon: Eraser, testId: 'tool-btn-eraser' },
  { id: 'chu', ten: 'Chữ', icon: Type, testId: 'tool-btn-text' },
  { id: 'khung', ten: 'Khung', icon: Square, testId: 'tool-btn-rect' },
  { id: 'tron', ten: 'Tròn', icon: Circle, testId: 'tool-btn-ellipse' },
  // Laser chỉ hiện trên tài liệu và chỉ người trình chiếu dùng được.
  { id: 'laser', ten: 'Laser', icon: Sparkles, testId: 'tool-btn-laser', chiNguoiDieuHanh: true },
]

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

const nutDock =
  'relative flex h-11 w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer'

const nutKhay =
  'flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors cursor-pointer'

export function ClassroomToolDock({
  boCuc,
  onBamLop,
  coTaiLieu,
  videoDangPhat,
  isHost,
  canModerate = false,
  congCu,
  onChonCongCu,
  mau,
  onChonMau,
  co,
  onChonCo,
  onClearWhiteboard,
  onClearSlidePage,
  onOpenCalculator,
  onOpenSessionPanel,
  isReconnecting = false,
}: ClassroomToolDockProps) {
  const canControl = !isReconnecting && (isHost || canModerate)
  const congCuHienTai = CONG_CU.find((c) => c.id === congCu) ?? CONG_CU[0]
  const IconCongCu = congCu === 'chuot' ? Wrench : congCuHienTai.icon
  const dangChay: Record<LopId, boolean> = { doc: coTaiLieu, board: false, video: videoDangPhat }

  return (
    <nav
      aria-label="Thanh công cụ trình chiếu"
      className="flex items-center justify-center p-2 z-30 select-none"
      data-testid="classroom-tool-dock"
    >
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-slate-950/90 px-2 py-1 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
        {/* ── 1. BA LỚP NỘI DUNG: bật / ẩn, chạy đồng thời ── */}
        {NUT_LOP.map(({ id, ten, testId }) => {
          const hien = dangHien(boCuc[id])
          return (
            <button
              key={id}
              type="button"
              onClick={() => onBamLop(id)}
              aria-pressed={hien}
              title={ten}
              data-testid={testId}
              className={`${nutDock} ${hien ? 'bg-white/12 text-white ring-1 ring-white/15' : 'text-slate-400 hover:bg-white/8 hover:text-slate-200'}`}
            >
              <IconLop id={id} className={`h-4.5 w-4.5 ${MAU_NHAN[id]}`} />
              <span>{ten}</span>
              {dangChay[id] && (
                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-current text-emerald-400 animate-pulse" />
              )}
            </button>
          )
        })}

        <div className="mx-1 h-7 w-px bg-white/15" />

        {/* ── 2. CÔNG CỤ: bút, dạ quang, tẩy, chữ, khung, tròn, laser, màu, cỡ, máy tính… ── */}
        <Popover>
          <PopoverTrigger
            type="button"
            className={`${nutDock} ${congCu !== 'chuot' ? 'bg-white/12 text-white ring-1 ring-white/15' : 'text-slate-400 hover:bg-white/8 hover:text-slate-200'} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white`}
            title="Công cụ"
            data-testid="dock-btn-secondary-tools"
          >
            <IconCongCu className="h-4.5 w-4.5" />
            <span>Công cụ</span>
            {congCu !== 'chuot' && (
              <span className="absolute right-2 top-1.5 h-2 w-2 rounded-full ring-1 ring-white/40" style={{ backgroundColor: mau }} />
            )}
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={10}
            className="w-72 space-y-2.5 rounded-2xl border border-white/15 bg-slate-950/95 p-2.5 text-slate-200 shadow-2xl backdrop-blur-2xl"
            data-testid="dock-tools-tray"
          >
            {/* Công cụ vẽ */}
            <div className="grid grid-cols-4 gap-1">
              {CONG_CU.filter((c) => !c.chiNguoiDieuHanh || canControl).map(({ id, ten, icon: Icon, testId }) => (
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

            {/* Màu */}
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

            {/* Cỡ nét / cỡ chữ */}
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

            {/* Tiện ích */}
            <div className="grid grid-cols-4 gap-1 border-t border-white/10 pt-2">
              <button type="button" onClick={onOpenCalculator} title="Máy tính" className={`${nutKhay} text-slate-300 hover:bg-white/10`} data-testid="tool-btn-calculator">
                <CalcIcon className="h-4 w-4 text-cyan-400" />
                <span>Máy tính</span>
              </button>
              <button type="button" onClick={onOpenSessionPanel} title="Phiên học" className={`${nutKhay} text-slate-300 hover:bg-white/10`} data-testid="tool-btn-session">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Phiên học</span>
              </button>
              {canControl && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Xoá toàn bộ nét vẽ trên bảng?')) onClearWhiteboard()
                  }}
                  title="Xoá bảng"
                  className={`${nutKhay} text-slate-300 hover:bg-red-500/15 hover:text-red-300`}
                  data-testid="tool-btn-clear-board"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xoá bảng</span>
                </button>
              )}
              {canControl && coTaiLieu && onClearSlidePage && (
                <button
                  type="button"
                  onClick={onClearSlidePage}
                  title="Xoá chú thích trang"
                  className={`${nutKhay} text-slate-300 hover:bg-red-500/15 hover:text-red-300`}
                  data-testid="tool-btn-clear"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xoá trang</span>
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  )
}
