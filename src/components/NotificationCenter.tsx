import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Bell,
  Check,
  DoorOpen,
  Radio,
  UserPlus,
  X,
  GraduationCap,
  Trophy,
  Flame,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCampusContext, type AppNotification } from '@/app/CampusContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// === helpers =================================================================

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Vừa xong'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'friend_request') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
        <UserPlus className="h-4 w-4" />
      </div>
    )
  }
  if (type === 'friend_online') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
        <Radio className="h-4 w-4" />
      </div>
    )
  }
  if (type === 'study_invite') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
        <GraduationCap className="h-4 w-4" />
      </div>
    )
  }
  if (type === 'achievement_unlocked') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-achievement/30 bg-achievement/10 text-achievement">
        <Trophy className="h-4 w-4" />
      </div>
    )
  }
  if (type === 'challenge_completed') {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-warning/30 bg-warning/10 text-warning">
        <Flame className="h-4 w-4" />
      </div>
    )
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
      <DoorOpen className="h-4 w-4" />
    </div>
  )
}

// === single item ==============================================================

interface NotificationItemProps {
  n: AppNotification
  onDismiss: (id: string) => void
}

function NotificationItem({ n, onDismiss }: NotificationItemProps) {
  const navigate = useNavigate()
  const { acceptFriendRequest, rejectFriendRequest } = useCampusContext()
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)

  const handleAccept = useCallback(async () => {
    if (!n.meta?.requestId) return
    setBusy('accept')
    const kq = await acceptFriendRequest(n.meta.requestId)
    setBusy(null)
    if (kq.ok) {
      toast.success('Đã kết bạn!')
      onDismiss(n.id)
    } else {
      toast.error(kq.loi ?? 'Không thể chấp nhận lời mời.')
    }
  }, [n.meta?.requestId, n.id, acceptFriendRequest, onDismiss])

  const handleReject = useCallback(async () => {
    if (!n.meta?.requestId) return
    setBusy('reject')
    const kq = await rejectFriendRequest(n.meta.requestId)
    setBusy(null)
    if (kq.ok) {
      onDismiss(n.id)
    } else {
      toast.error(kq.loi ?? 'Không thể từ chối.')
    }
  }, [n.meta?.requestId, n.id, rejectFriendRequest, onDismiss])

  const roomId = n.meta?.roomId
  const invitationId = n.meta?.invitationId
  const nid = n.id

  const handleRoomClick = useCallback(() => {
    if (roomId) {
      navigate(`/room/phong-${roomId}`)
    }
  }, [roomId, navigate])

  const handleAcceptInvite = useCallback(async () => {
    if (!invitationId) return
    setBusy('accept')
    try {
      const res = await fetch(`/api/engagement/invites/${invitationId}/accept`, { method: 'POST' })
      const data = (await res.json()) as { ok: boolean; roomId?: number; loi?: string }
      if (data.ok && data.roomId) {
        toast.success('Đã vào phòng học!')
        onDismiss(nid)
        navigate(`/room/phong-${data.roomId}`)
      } else {
        toast.error(data.loi || 'Không thể chấp nhận lời mời.')
      }
    } catch {
      toast.error('Lỗi kết nối.')
    } finally {
      setBusy(null)
    }
  }, [invitationId, nid, onDismiss, navigate])

  const handleDismissInvite = useCallback(async () => {
    if (!invitationId) return
    setBusy('reject')
    try {
      await fetch(`/api/engagement/invites/${invitationId}/dismiss`, { method: 'POST' })
    } catch {}
    setBusy(null)
    onDismiss(nid)
  }, [invitationId, nid, onDismiss])

  return (
    <div
      className={`group relative flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 ${
        n.read ? 'opacity-70' : ''
      }`}
    >
      {!n.read && (
        <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-primary" />
      )}

      <NotificationIcon type={n.type} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{n.body}</p>
        <p className="text-[10px] text-muted-foreground/70">{formatRelativeTime(n.timestamp)}</p>

        {n.type === 'friend_request' && n.meta?.requestId && (
          <div className="mt-2 flex gap-1.5">
            <Button
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] font-semibold"
              disabled={busy !== null}
              onClick={handleAccept}
            >
              <Check className="h-3 w-3" />
              {busy === 'accept' ? 'Đang xử lý…' : 'Chấp nhận'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 px-2 text-[10px]"
              disabled={busy !== null}
              onClick={handleReject}
            >
              <X className="h-3 w-3" />
              Từ chối
            </Button>
          </div>
        )}

        {n.type === 'study_invite' && n.meta?.invitationId && (
          <div className="mt-2 flex gap-1.5">
            <Button
              size="sm"
              className="h-6 gap-1 px-2 text-[10px] font-semibold"
              disabled={busy !== null}
              onClick={handleAcceptInvite}
            >
              <Check className="h-3 w-3" />
              {busy === 'accept' ? 'Đang vào…' : 'Vào học ngay'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 px-2 text-[10px]"
              disabled={busy !== null}
              onClick={handleDismissInvite}
            >
              <X className="h-3 w-3" />
              Bỏ qua
            </Button>
          </div>
        )}

        {n.type === 'friend_in_room' && n.meta?.roomId && (
          <button
            type="button"
            onClick={handleRoomClick}
            className="mt-1 text-[10px] font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Vào phòng cùng →
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label="Bỏ qua thông báo"
        onClick={() => onDismiss(n.id)}
        className="invisible absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

// === main component ==========================================================

export function NotificationCenter() {
  const { notifications, unreadCount, dismissNotification, markAllRead } = useCampusContext()
  const [open, setOpen] = useState(false)
  const openedRef = useRef(false)

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next)
      if (next && !openedRef.current) {
        openedRef.current = true
        markAllRead()
      }
      if (!next) {
        openedRef.current = false
      }
    },
    [markAllRead],
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative">
        <PopoverTrigger
          id="notification-center-trigger"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        >
          <Bell className="h-4 w-4" />
        </PopoverTrigger>
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold">Thông báo</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-semibold">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 p-1">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onDismiss={dismissNotification}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
