import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  REPORT_CATEGORIES,
  type ReportCategory,
  type BannedMemberItem,
} from '@shared/protocol/room'
import { Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const NHAN = 'text-xs font-medium text-text-secondary'
const O_NHAP =
  'w-full rounded-xl border border-border-default bg-canvas/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand/50 focus:outline-none'

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
      // oxlint-disable-next-line react/set-state-in-effect
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mời thành viên ra khỏi phòng</DialogTitle>
          <DialogDescription>
            <span className="font-medium break-words text-text-primary">{target.name}</span> sẽ bị ngắt kết nối ngay và
            không vào lại được trong 5 phút.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick pick reasons */}
          <div className="space-y-1.5">
            <p className={NHAN}>Lý do thường gặp</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_KICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  aria-pressed={reason === r}
                  className={cn(
                    'rounded-full border px-3 py-1 text-left text-xs transition-colors',
                    reason === r
                      ? 'border-destructive/50 bg-destructive/12 text-destructive'
                      : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Custom reason input */}
          <div className="space-y-1.5">
            <label htmlFor="kick-reason-input" className={NHAN}>
              Lý do cụ thể <span className="font-normal text-text-tertiary">(không bắt buộc)</span>
            </label>
            <Input
              id="kick-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: nói tục trong chat"
              maxLength={200}
              className="h-10"
            />
          </div>

          {/* Ban from room checkbox */}
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
              banFromRoom ? 'border-destructive/40 bg-destructive/10' : 'border-border-default hover:bg-surface-overlay/60',
            )}
          >
            <input
              type="checkbox"
              checked={banFromRoom}
              onChange={(e) => setBanFromRoom(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-destructive"
            />
            <span className="text-sm">
              <span className="font-medium text-text-primary">Cấm luôn khỏi phòng này</span>
              <span className="mt-0.5 block text-xs text-text-tertiary">
                Không vào lại được cho đến khi chủ phòng gỡ cấm.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Huỷ
          </Button>
          <Button type="button" variant="destructive" onClick={handleKick} disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Xác nhận mời ra
          </Button>
        </DialogFooter>
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
      // oxlint-disable-next-line react/set-state-in-effect
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
          <DialogDescription>
            Báo cáo <span className="font-medium break-words text-text-primary">{target.name}</span> tới thầy cô và ban
            quản lý trường để xem xét.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Content snippet preview if present */}
          {target.contentSnippet && (
            <div className="space-y-1.5">
              <p className={NHAN}>Nội dung tin nhắn vi phạm:</p>
              <blockquote className="rounded-xl border-l-2 border-warning/60 bg-surface-raised px-3 py-2 text-sm break-words whitespace-pre-wrap text-text-secondary">
                {target.contentSnippet}
              </blockquote>
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1.5">
            <label htmlFor="report-category-select" className={NHAN}>
              Loại vi phạm
            </label>
            <select
              id="report-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={O_NHAP}
            >
              {REPORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-surface text-text-primary">
                  {CATEGORY_LABELS[cat].label}
                </option>
              ))}
            </select>
            {/* Mô tả để dưới ô chọn — gộp vào tên lựa chọn thì ô chọn bị cắt chữ */}
            <p className="text-xs text-text-tertiary">
              {CATEGORY_LABELS[category as ReportCategory]?.desc}
            </p>
          </div>

          {/* Detailed reason textarea */}
          <div className="space-y-1.5">
            <label htmlFor="report-reason-input" className={NHAN}>
              Mô tả điều đã xảy ra
            </label>
            <textarea
              id="report-reason-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả ngắn gọn hành vi vi phạm"
              rows={3}
              maxLength={500}
              className={cn(O_NHAP, 'resize-none')}
            />
            <div className="flex justify-between text-[11px] text-text-tertiary tabular-nums">
              <span>Ít nhất 5 ký tự</span>
              <span>{reason.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Huỷ
          </Button>
          <Button type="button" onClick={handleReport} disabled={submitting || reason.trim().length < 5}>
            {submitting && <Loader2 className="animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── 3. Banned Members Management Dialog ─────────────────────────────────────

interface BannedMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoadBanned: () => Promise<{ bannedMembers: BannedMemberItem[] }>
  onUnban: (
    accountId: number,
    opts?: { expectedBanId?: number; expectedRevision?: number },
  ) => Promise<{
    ok: boolean
    loi?: string
    unbanned?: boolean
    cooldownCleared?: boolean
    cooldownClearError?: string
    partial?: boolean
    message?: string
  }>
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
      // oxlint-disable-next-line react/set-state-in-effect
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

  const handleUnban = async (item: BannedMemberItem) => {
    setUnbanningId(item.accountId)
    try {
      const res = await onUnban(item.accountId, {
        expectedBanId: item.id,
        expectedRevision: item.revision,
      })
      if (res.ok) {
        if (res.partial) {
          toast.warning(res.message || 'Đã gỡ cấm nhưng thời gian chờ tạm thời vẫn chưa được gỡ.')
        } else {
          toast.success('Đã gỡ cấm thành viên.')
        }
        setBannedList((prev) => prev.filter((m) => m.accountId !== item.accountId))
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thành viên bị cấm</DialogTitle>
          <DialogDescription>Những người dưới đây không vào được phòng này cho đến khi được gỡ cấm.</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-80 min-h-40 space-y-1 overflow-y-auto overscroll-contain px-1">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-text-tertiary">
              <Loader2 className="size-4 animate-spin" /> Đang tải danh sách…
            </div>
          ) : bannedList.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <ShieldAlert className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Chưa ai bị cấm</p>
              <p className="mt-1 text-xs text-text-tertiary">Mọi thành viên đủ điều kiện đều vào phòng bình thường.</p>
            </div>
          ) : (
            bannedList.map((item) => (
              <div key={item.accountId} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-raised/60">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words text-text-primary">
                    {item.displayName || item.username || `Tài khoản #${item.accountId}`}
                    {item.username && <span className="ml-1.5 text-xs font-normal text-text-tertiary">@{item.username}</span>}
                  </p>
                  {(item.reason || item.createdAt) && (
                    <p className="mt-0.5 text-xs break-words text-text-tertiary">
                      {item.reason ? `Lý do: ${item.reason}` : ''}
                      {item.reason && item.createdAt ? ' · ' : ''}
                      {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => handleUnban(item)}
                  disabled={unbanningId === item.accountId}
                  className="shrink-0"
                >
                  {unbanningId === item.accountId && <Loader2 className="animate-spin" />}
                  Gỡ cấm
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
