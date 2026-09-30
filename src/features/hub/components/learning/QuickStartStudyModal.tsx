import { useState } from 'react'
import { usePhien } from '@/app/phien'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
    description: 'Phòng học nhỏ tối đa 2 người với Pomodoro và bảng vẽ.',
    icon: Clock,
    defaultName: (name) => `Phòng tập trung · ${name}`,
    phamVi: 'truong',
    sucChua: 2,
  },
  {
    id: 'group_homework',
    title: 'Nhóm thảo luận bài tập',
    description: 'Cùng trao đổi kiến thức, giải đề và làm bài tập về nhà.',
    icon: Users,
    defaultName: (name, className) => className ? `Nhóm ôn bài · ${className}` : `Nhóm bài tập · ${name}`,
    phamVi: 'lop',
    sucChua: 10,
  },
  {
    id: 'exam_prep',
    title: 'Ôn thi & Luyện đề',
    description: 'Phòng học mở toàn trường cho mọi người cùng tham gia.',
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
        className="sm:max-w-md bg-[#0c1222] border-border-default text-text-primary p-5 sm:p-6 rounded-2xl shadow-2xl"
      >
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-brand border border-cyan-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-base sm:text-lg font-black text-text-primary">
              Bắt đầu học nhanh
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-secondary">
            Chọn mục tiêu để hệ thống chuẩn bị phòng học tức thì cho bạn.
          </DialogDescription>
        </DialogHeader>

        {/* Templates list */}
        <div className="space-y-2.5 py-3">
          {QUICK_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplate === tmpl.id
            const Icon = tmpl.icon

            return (
              <button
                key={tmpl.id}
                type="button"
                disabled={isInFlight}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/25'
                    : 'bg-surface/50 border-border-default hover:bg-surface-overlay'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-surface text-text-secondary border-border-default'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isSelected ? 'text-brand' : 'text-text-primary'}`}>
                      {tmpl.title}
                    </p>
                    <span className="text-[10px] text-text-secondary font-semibold">
                      Tối đa {tmpl.sucChua} người
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border-default">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false, onOpenChange)}
            disabled={isInFlight}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Hủy
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleStart}
            disabled={isInFlight}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 gap-2"
          >
            {isInFlight ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tạo phòng...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Vào phòng ngay</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
