import { useCallback, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  GraduationCap,
  Loader2,
  Megaphone,
  ShieldAlert,
  Trophy,
  UserCheck,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import type { NotificationType } from '@shared/protocol/notification'
import { useCampusContext, type AppNotification } from '@/app/CampusContext'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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

const KIEU_THONG_BAO: Record<NotificationType, { icon: ComponentType<{ className?: string }>; mau: string }> = {
  friend_request: { icon: UserPlus, mau: 'bg-brand/12 text-brand' },
  friend_accept: { icon: UserCheck, mau: 'bg-success/12 text-success' },
  study_invite: { icon: GraduationCap, mau: 'bg-social/12 text-social' },
  study_invite_accepted: { icon: GraduationCap, mau: 'bg-social/12 text-social' },
  achievement_unlocked: { icon: Trophy, mau: 'bg-achievement/12 text-achievement' },
  moderation_notice: { icon: ShieldAlert, mau: 'bg-destructive/12 text-destructive' },
  system_announcement: { icon: Megaphone, mau: 'bg-surface-overlay text-text-secondary' },
}

// === single item ==============================================================

interface NotificationItemProps {
  n: AppNotification
  onDismiss: (id: string) => void
}

function NotificationItem({ n, onDismiss }: NotificationItemProps) {
  const navigate = useNavigate()
  const { acceptFriendRequest, rejectFriendRequest, socialState, lamMoiSocialState } = useCampusContext()
  const [busy, setBusy] = useState<'accept' | 'reject' | null>(null)

  const requestId = n.meta?.requestId
  const actorId = n.meta?.actorId
  const roomId = n.meta?.roomId
  const invitationId = n.meta?.invitationId
  const nid = n.id

  const daLaBan = Boolean(
    (actorId && socialState?.friends.some((f) => f.id === actorId)) ||
    (n.meta?.actorName &&
      socialState?.friends.some(
        (f) => f.displayName === n.meta?.actorName || f.username === n.meta?.actorName,
      )),
  )

  const coYeuCauCho = Boolean(
    requestId && socialState?.incomingRequests.some((r) => r.id === requestId),
  )

  const handleAccept = useCallback(async () => {
    if (!requestId) return
    setBusy('accept')
    const kq = await acceptFriendRequest(requestId)
    setBusy(null)
    if (kq.ok) {
      toast.success('Đã kết bạn!')
      onDismiss(nid)
    } else {
      if (kq.loi?.includes('không tồn tại') || kq.loi?.includes('đã được xử lý') || daLaBan) {
        onDismiss(nid)
        void lamMoiSocialState()
        if (daLaBan) {
          toast.success('Hai bạn đã là bạn bè rồi!')
        } else {
          toast.info('Lời mời kết bạn đã được xử lý.')
        }
      } else {
        toast.error(kq.loi ?? 'Không thể chấp nhận lời mời.')
      }
    }
  }, [requestId, nid, acceptFriendRequest, onDismiss, daLaBan, lamMoiSocialState])

  const handleReject = useCallback(async () => {
    if (!requestId) return
    setBusy('reject')
    const kq = await rejectFriendRequest(requestId)
    setBusy(null)
    if (kq.ok) {
      onDismiss(nid)
    } else {
      if (kq.loi?.includes('không tồn tại') || kq.loi?.includes('đã được xử lý')) {
        onDismiss(nid)
        void lamMoiSocialState()
      } else {
        toast.error(kq.loi ?? 'Không thể từ chối.')
      }
    }
  }, [requestId, nid, rejectFriendRequest, onDismiss, lamMoiSocialState])

  const handleRoomClick = useCallback(() => {
    onDismiss(nid)
    if (roomId) {
      navigate(`/room/phong-${roomId}`)
    }
  }, [roomId, nid, onDismiss, navigate])

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
      const res = await fetch(`/api/engagement/invites/${invitationId}/dismiss`, { method: 'POST' })
      const data = (await res.json()) as { ok?: boolean; loi?: string }
      if (res.ok && data.ok) {
        onDismiss(nid)
      } else {
        toast.error(data.loi || 'Không thể bỏ qua lời mời.')
      }
    } catch {
      toast.error('Lỗi kết nối khi bỏ qua lời mời.')
    } finally {
      setBusy(null)
    }
  }, [invitationId, nid, onDismiss])

  const kieu = KIEU_THONG_BAO[n.type] ?? KIEU_THONG_BAO.system_announcement
  const Icon = kieu.icon

  let hanhDong: ReactNode = null
  if (n.type === 'friend_request') {
    if (daLaBan) {
      hanhDong = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
          <Check className="size-3.5" />
          Đã là bạn bè
        </span>
      )
    } else if (socialState && !coYeuCauCho) {
      hanhDong = null
    } else if (n.read) {
      hanhDong = null
    } else if (requestId) {
      hanhDong = (
        <>
          <Button size="xs" disabled={busy !== null} onClick={handleAccept}>
            {busy === 'accept' ? <Loader2 className="animate-spin" /> : <Check />}
            Chấp nhận
          </Button>
          <Button size="xs" variant="outline" disabled={busy !== null} onClick={handleReject}>
            Từ chối
          </Button>
        </>
      )
    }
  } else if (n.type === 'study_invite' && n.meta?.invitationId) {
    hanhDong = (
      <>
        <Button size="xs" disabled={busy !== null} onClick={handleAcceptInvite}>
          {busy === 'accept' ? <Loader2 className="animate-spin" /> : <GraduationCap />}
          Vào học ngay
        </Button>
        <Button size="xs" variant="outline" disabled={busy !== null} onClick={handleDismissInvite}>
          Bỏ qua
        </Button>
      </>
    )
  } else if (n.type === 'study_invite_accepted' && n.meta?.roomId) {
    hanhDong = (
      <Button size="xs" variant="outline" onClick={handleRoomClick}>
        Vào phòng cùng
        <ArrowRight />
      </Button>
    )
  }

  return (
    <li
      onClick={() => {
        if (!n.read) onDismiss(n.id)
      }}
      className={cn(
        'group relative flex gap-3 px-4 py-3 transition-colors hover:bg-surface-overlay/50',
        !n.read && 'cursor-pointer bg-brand/[0.04]',
      )}
    >
      <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', kieu.mau)}>
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[0.8125rem] leading-snug break-words',
            n.read ? 'text-text-secondary' : 'font-medium text-text-primary',
          )}
        >
          {n.title}
        </p>
        {n.body && <p className="mt-0.5 text-xs leading-snug break-words text-text-tertiary">{n.body}</p>}
        <p className="mt-1 text-[11px] text-text-tertiary">{formatRelativeTime(n.timestamp)}</p>

        {hanhDong && (
          <div className="mt-2.5 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {hanhDong}
          </div>
        )}
      </div>

      {/* Chấm chưa đọc — di chuột hoặc dùng bàn phím thì hoá thành nút đánh dấu đã đọc */}
      {!n.read && (
        <button
          type="button"
          aria-label="Đánh dấu đã đọc"
          title="Đánh dấu đã đọc"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss(n.id)
          }}
          className="relative -mt-0.5 -mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-text-tertiary outline-none hover:bg-surface-overlay hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            aria-hidden
            className="size-2 rounded-full bg-brand transition-opacity group-focus-within:opacity-0 group-hover:opacity-0"
          />
          <Check
            aria-hidden
            className="absolute size-3.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          />
        </button>
      )}
    </li>
  )
}

// === main component ==========================================================

export function NotificationCenter() {
  const { notifications, unreadCount, dismissNotification, markAllRead, lamMoiNotifications } = useCampusContext()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      void lamMoiNotifications()
    }
  }, [lamMoiNotifications])

  const handleMarkAllRead = async () => {
    const ok = await markAllRead()
    if (!ok) toast.error('Chưa đánh dấu được. Thử lại sau nhé.')
  }

  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id="notification-center-trigger"
        className="relative flex size-9 items-center justify-center rounded-xl text-text-secondary transition-colors outline-none hover:bg-surface-overlay hover:text-text-primary focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-surface-overlay data-popup-open:text-text-primary"
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none font-semibold text-text-primary tabular-nums ring-2 ring-canvas">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(24rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
          <p className="text-sm font-semibold text-text-primary">Thông báo</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="xs" className="-mr-2 text-text-secondary" onClick={() => void handleMarkAllRead()}>
              <CheckCheck />
              Đọc tất cả
            </Button>
          )}
        </div>

        <div className="flex gap-1.5 px-4 pb-3">
          <NutLoc dangChon={filter === 'all'} onClick={() => setFilter('all')}>
            Tất cả
          </NutLoc>
          <NutLoc dangChon={filter === 'unread'} onClick={() => setFilter('unread')}>
            Chưa đọc
            {unreadCount > 0 && <span className="tabular-nums opacity-80">{unreadCount}</span>}
          </NutLoc>
        </div>

        <div className="max-h-[min(26rem,calc(100svh-10rem))] overflow-y-auto overscroll-contain border-t border-border-subtle">
          {displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-overlay text-text-tertiary">
                <Bell className="size-5" />
              </span>
              <p className="mt-3 text-sm font-medium text-text-primary">
                {filter === 'unread' ? 'Đã đọc hết' : 'Chưa có thông báo'}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                {filter === 'unread'
                  ? 'Không còn thông báo nào chưa đọc.'
                  : 'Lời mời kết bạn, rủ học nhóm và huy hiệu mới sẽ hiện ở đây.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {displayedNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  n={n}
                  onDismiss={dismissNotification}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NutLoc({ dangChon, onClick, children }: { dangChon: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={dangChon}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
        dangChon
          ? 'border-brand/50 bg-brand/10 text-brand'
          : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
      )}
    >
      {children}
    </button>
  )
}
