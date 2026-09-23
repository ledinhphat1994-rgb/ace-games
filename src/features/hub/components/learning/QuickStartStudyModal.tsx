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
    title: 'Tự học tập trung',
    description: 'Không gian yên tĩnh với đồng hồ Pomodoro và bảng vẽ cá nhân.',
    icon: Clock,
    defaultName: (name) => `Tự học tập trung · ${name}`,
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayName = nguoiDung.ten || nguoiDung.username
  const className = nguoiDung.lop?.ten || (nguoiDung.lopId ? `Lớp ${nguoiDung.lopId}` : undefined)

  const handleStart = async () => {
    const template = QUICK_TEMPLATES.find((t) => t.id === selectedTemplate) || QUICK_TEMPLATES[0]
    const phamVi = template.phamVi === 'lop' && nguoiDung.lopId ? 'lop' : 'truong'
    const roomName = template.defaultName(displayName, className)

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ten: roomName,
          moTa: template.description,
          phamVi,
          lopId: phamVi === 'lop' ? nguoiDung.lopId : undefined,
          accessMode: 'public',
          sucChua: template.sucChua,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        throw new Error(data.loi || data.error || 'Không thể tạo phòng học nhanh.')
      }

      toast.success('Đã tạo phòng học thành công!')
      onOpenChange(false)
      onSuccess(data.room.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi khởi tạo phòng học.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0c1222] border-white/10 text-white p-5 sm:p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle className="text-base sm:text-lg font-black text-white">
              Bắt đầu học nhanh
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
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
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/25'
                    : 'bg-slate-900/50 border-white/10 hover:bg-white/5'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {tmpl.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Tối đa {tmpl.sucChua} người
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {tmpl.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs text-slate-400 hover:text-white"
          >
            Hủy
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleStart}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 gap-2"
          >
            {isSubmitting ? (
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
