import { useState } from 'react'
import { usePhien } from '@/app/phien'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { BlueprintStudyPattern } from '@/components/ui/blueprint-patterns'
import { Sparkles, Users, BookOpen, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQuickStartLock } from './quick-start-controller'

export interface QuickStartStudyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (roomId: number) => void
}

interface QuickTemplate {
  id: string
  title: string
  description: string
  icon: typeof Sparkles
  defaultName: (userName: string, className?: string) => string
  phamVi: 'truong' | 'lop'
  sucChua: number
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'solo_focus',
    title: 'Học tập trung',
    description: 'Phòng học nhỏ tối đa 2 người',
    icon: Clock,
    defaultName: (name) => `Phòng tập trung · ${name}`,
    phamVi: 'truong',
    sucChua: 2,
  },
  {
    id: 'group_homework',
    title: 'Nhóm thảo luận bài tập',
    description: 'Cùng trao đổi kiến thức',
    icon: Users,
    defaultName: (name, className) => className ? `Nhóm ôn bài · ${className}` : `Nhóm bài tập · ${name}`,
    phamVi: 'lop',
    sucChua: 10,
  },
  {
    id: 'exam_prep',
    title: 'Ôn thi & Luyện đề',
    description: 'Phòng học mở toàn trường',
    icon: BookOpen,
    defaultName: (name) => `Luyện đề thi · ${name}`,
    phamVi: 'truong',
    sucChua: 25,
  },
]

export function QuickStartStudyModal({ open, onOpenChange, onSuccess }: QuickStartStudyModalProps) {
  const { nguoiDung } = usePhien()
  const [selectedTemplate, setSelectedTemplate] = useState<string>('solo_focus')
  const { isInFlight, handleOpenChange, execute } = useQuickStartLock()

  const displayName = nguoiDung?.ten || nguoiDung?.username || 'Bạn học'
  const className = nguoiDung?.lop?.ten || (nguoiDung?.lopId ? `Lớp ${nguoiDung.lopId}` : undefined)

  const handleStart = async () => {
    if (isInFlight) return

    const template = QUICK_TEMPLATES.find((t) => t.id === selectedTemplate) || QUICK_TEMPLATES[0]
    const phamVi = template.phamVi === 'lop' && nguoiDung?.lopId ? 'lop' : 'truong'
    const roomName = template.defaultName(displayName, className)

    await execute(
      async () => {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ten: roomName,
            moTa: template.description,
            phamVi,
            lopId: phamVi === 'lop' && nguoiDung ? nguoiDung.lopId : undefined,
            accessMode: 'public',
            sucChua: template.sucChua,
          }),
        })

        const data = await res.json()
        if (!res.ok || !data.ok) {
          throw new Error(data.loi || data.error || 'Không thể tạo phòng học nhanh.')
        }
        return data
      },
      {
        onSuccess: (data) => {
          toast.success('Đã tạo phòng học thành công!')
          onOpenChange(false)
          onSuccess(data.room.id)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : 'Lỗi khi khởi tạo phòng học.')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => handleOpenChange(newOpen, onOpenChange)}>
      <DialogContent
        showCloseButton={!isInFlight}
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(520px, calc(100svh - 88px))',
        }}
        className="w-[min(460px,calc(100vw-2rem))] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Study Schematic mờ chìm toàn diện */}
        <BlueprintStudyPattern className="opacity-80" />

        <DialogHeader className="relative z-10 shrink-0 pb-3 border-b border-sky-500/15">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Sparkles className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white tracking-wide">
              Bắt đầu học nhanh
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Bắt đầu học nhanh
          </DialogDescription>
        </DialogHeader>

        {/* Lưới Template chọn mục tiêu: Đồng đều chiều cao, viền 1px dải sáng 2 bên */}
        <div className="relative z-10 space-y-2.5 py-3 flex-1 overflow-y-auto pr-1">
          {QUICK_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id
            const Icon = tmpl.icon

            return (
              <button
                key={tmpl.id}
                type="button"
                disabled={isInFlight}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`w-full h-14 flex items-center gap-3.5 px-4 rounded-xl text-left cursor-pointer transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'skeuo-subcard-active-amber text-amber-200'
                    : 'skeuo-subcard-base text-slate-300 hover:text-white'
                }`}
              >
                <div
                  className={`size-9 shrink-0 rounded-xl flex items-center justify-center border ${
                    isSelected
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700/60'
                  }`}
                >
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className={`text-sm font-semibold truncate ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                    {tmpl.title}
                  </span>
                  <span className="text-xs text-slate-400 shrink-0 font-medium tabular-nums ml-2">
                    {tmpl.sucChua} người
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer CTA: Khoảng cách an toàn >= 14px, Nút vàng mật ong 3D Amber */}
        <div className="relative z-10 shrink-0 pt-4 mt-3 border-t border-sky-500/15 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleOpenChange(false, onOpenChange)}
            disabled={isInFlight}
            className="skeuo-btn-cancel h-10 px-5 text-sm"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleStart}
            disabled={isInFlight}
            className="skeuo-btn-cta-amber h-10 px-6 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInFlight ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang tạo phòng…</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Vào phòng ngay</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
