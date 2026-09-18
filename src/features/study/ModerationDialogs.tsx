import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  REPORT_CATEGORIES,
  type ReportCategory,
  type BannedMemberItem,
} from '@shared/protocol/room'
import { Ban, Flag, Loader2, ShieldAlert, UserX } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_LABELS: Record<ReportCategory, { label: string; desc: string }> = {
  harassment: { label: 'Quấy rối / Đe dọa', desc: 'Hành vi xúc phạm, đe dọa hoặc bắt nạt' },
  spam: { label: 'Spam / Tin nhắn rác', desc: 'Gửi tin nhắn rác hoặc quảng cáo lặp đi lặp lại' },
  inappropriate_content: { label: 'Nội dung phản cảm', desc: 'Hình ảnh, ngôn từ không phù hợp với trường học' },
  cheating: { label: 'Gian lận', desc: 'Hành vi gian lận trong học tập' },
  disruptive: { label: 'Gây rối trật tự', desc: 'Làm gián đoạn buổi học' },
  other: { label: 'Khác', desc: 'Vi phạm các quy định khác' },
}

// ── 1. Kick Member Dialog ────────────────────────────────────────────────────

interface KickMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: { actorKey: string; name: string } | null
  onConfirmKick: (targetActorKey: string, reason: string, banFromRoom: boolean) => Promise<void>
}

const QUICK_KICK_REASONS = [
  'Gây rối trật tự phòng học',
  'Spam chat / tin nhắn rác',
  'Bật âm thanh / tiếng ồn liên tục',
  'Vi phạm nội quy học tập',
]

export function KickMemberDialog({
  open,
  onOpenChange,
  target,
  onConfirmKick,
}: KickMemberDialogProps) {
  const [reason, setReason] = useState('')
  const [banFromRoom, setBanFromRoom] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setBanFromRoom(false)
      setSubmitting(false)
    }
  }, [open])

  if (!target) return null

  const handleKick = async () => {
    setSubmitting(true)
    try {
      await onConfirmKick(target.actorKey, reason.trim() || 'Vi phạm nội quy phòng học', banFromRoom)
      onOpenChange(false)
    } catch {
      // Handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/15 bg-[#0d1424]/98 text-slate-200 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 sm:max-w-md">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400">
            <UserX className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-white">
              Mời thành viên ra khỏi phòng
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Thành viên <span className="font-semibold text-white">{target.name}</span> sẽ bị ngắt kết nối ngay lập tức và tạm thời không thể vào lại trong 5 phút.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          {/* Quick pick reasons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300">
              Lý do phổ biến
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_KICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition-colors text-left ${
                    reason === r
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-200 font-semibold'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason input */}
          <div className="space-y-1.5">
            <label htmlFor="kick-reason-input" className="text-[11px] font-semibold text-slate-300">
              Chi tiết lý do (tùy chọn)
            </label>
            <Input
              id="kick-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do cụ thể..."
              maxLength={200}
              className="h-9 border-white/15 bg-white/5 text-xs text-white placeholder:text-slate-500 focus-visible:ring-rose-500/40"
            />
          </div>

          {/* Ban from room checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 cursor-pointer hover:bg-rose-500/15 transition-colors">
            <input
              type="checkbox"
              checked={banFromRoom}
              onChange={(e) => setBanFromRoom(e.target.checked)}
              className="mt-0.5 rounded border-white/20 bg-white/5 text-rose-600 focus:ring-rose-500"
            />
            <div className="text-xs">
              <span className="font-semibold text-rose-300">Đồng thời cấm vào phòng vĩnh viễn</span>
              <p className="text-[10px] text-rose-300/70 mt-0.5">
                Thành viên sẽ không thể vào lại phòng này cho đến khi bạn gỡ cấm.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="text-xs text-slate-400 hover:text-white"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleKick}
            disabled={submitting}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 shadow-lg shadow-rose-600/20"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Xác nhận mời ra
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── 2. Report User Dialog ───────────────────────────────────────────────────

interface ReportUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: { accountId: number; name: string; contentSnippet?: string } | null
  onConfirmReport: (reportedAccountId: number, category: string, reason: string, contentSnippet?: string) => Promise<void>
}

export function ReportUserDialog({
  open,
  onOpenChange,
  target,
  onConfirmReport,
}: ReportUserDialogProps) {
  const [category, setCategory] = useState<string>('harassment')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory('harassment')
      setReason('')
      setSubmitting(false)
    }
  }, [open])

  if (!target) return null

  const handleReport = async () => {
    const trimmed = reason.trim()
    if (trimmed.length < 5) {
      toast.error('Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }
    setSubmitting(true)
    try {
      await onConfirmReport(target.accountId, category, trimmed, target.contentSnippet)
      onOpenChange(false)
    } catch {
      // Handled by caller
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/15 bg-[#0d1424]/98 text-slate-200 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 sm:max-w-md">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Flag className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-white">
              Báo cáo vi phạm
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Báo cáo thành viên <span className="font-semibold text-white">{target.name}</span> tới ban quản lý nhà trường và giáo viên để xem xét xử lý.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 my-2">
          {/* Content snippet preview if present */}
          {target.contentSnippet && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Nội dung tin nhắn vi phạm:
              </span>
              <p className="text-xs italic text-slate-300 bg-black/20 p-2 rounded-lg break-words">
                "{target.contentSnippet}"
              </p>
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1.5">
            <label htmlFor="report-category-select" className="text-[11px] font-semibold text-slate-300">
              Loại vi phạm
            </label>
            <select
              id="report-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
              {REPORT_CATEGORIES.map((cat) => {
                const info = CATEGORY_LABELS[cat]
                return (
                  <option key={cat} value={cat} className="bg-slate-900 text-white">
                    {info.label} — {info.desc}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Detailed reason textarea */}
          <div className="space-y-1.5">
            <label htmlFor="report-reason-input" className="text-[11px] font-semibold text-slate-300">
              Mô tả vi phạm <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="report-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vui lòng mô tả chi tiết hành vi vi phạm..."
              rows={3}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-white/15 bg-white/5 p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Tối thiểu 5 ký tự</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="text-xs text-slate-400 hover:text-white"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleReport}
            disabled={submitting || reason.trim().length < 5}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 shadow-lg shadow-amber-600/20"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            Gửi báo cáo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── 3. Banned Members Management Dialog ─────────────────────────────────────

interface BannedMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadBanned: () => Promise<{ bannedMembers: BannedMemberItem[] }>
  onUnban: (accountId: number) => Promise<{ ok: boolean; loi?: string }>
}

export function BannedMembersDialog({
  open,
  onOpenChange,
  onLoadBanned,
  onUnban,
}: BannedMembersDialogProps) {
  const [bannedList, setBannedList] = useState<BannedMemberItem[]>([])
  const [loading, setLoading] = useState(false)
  const [unbanningId, setUnbanningId] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      onLoadBanned()
        .then((res) => {
          setBannedList(res.bannedMembers || [])
        })
        .catch(() => {
          toast.error('Không thể tải danh sách cấm.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, onLoadBanned])

  const handleUnban = async (accountId: number) => {
    setUnbanningId(accountId)
    try {
      const res = await onUnban(accountId)
      if (res.ok) {
        toast.success('Đã gỡ cấm thành viên.')
        setBannedList((prev) => prev.filter((m) => m.accountId !== accountId))
      } else {
        toast.error(res.loi || 'Không thể gỡ cấm.')
      }
    } catch {
      toast.error('Lỗi khi thao tác.')
    } finally {
      setUnbanningId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/15 bg-[#0d1424]/98 text-slate-200 backdrop-blur-2xl shadow-2xl rounded-2xl p-6 sm:max-w-lg">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-rose-400">
            <Ban className="h-5 w-5" />
            <DialogTitle className="text-base font-bold text-white">
              Danh sách thành viên bị cấm
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-400">
            Các thành viên dưới đây bị chặn không thể truy cập vào phòng học này.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 max-h-72 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải danh sách...
            </div>
          ) : bannedList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500 space-y-1">
              <ShieldAlert className="h-8 w-8 text-slate-600 mb-1" />
              <p className="text-xs font-semibold text-slate-400">Chưa có thành viên nào bị cấm</p>
              <p className="text-[11px] text-slate-600">Mọi thành viên đủ điều kiện đều có thể vào phòng bình thường.</p>
            </div>
          ) : (
            bannedList.map((item) => (
              <div
                key={item.accountId}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition-colors"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {item.displayName || item.username || `Tài khoản #${item.accountId}`}
                    </span>
                    {item.username && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        @{item.username}
                      </span>
                    )}
                  </div>
                  {item.reason && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Lý do: <span className="italic">{item.reason}</span>
                    </p>
                  )}
                  {item.createdAt && (
                    <p className="text-[9px] text-slate-500 mt-0.5">
                      Cấm lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnban(item.accountId)}
                  disabled={unbanningId === item.accountId}
                  className="h-7 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-[11px] px-2.5 shrink-0"
                >
                  {unbanningId === item.accountId ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Gỡ cấm
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
