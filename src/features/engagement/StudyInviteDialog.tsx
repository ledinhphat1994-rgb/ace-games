import { useState } from 'react'
import { AlertCircle, Check, Loader2, Search, Send, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCampusContext } from '@/app/CampusContext'
import { cn, getInitials, tenLop } from '@/lib/utils'

interface StudyInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  roomTitle: string
}

export function StudyInviteDialog({
  open,
  onOpenChange,
  roomId,
  roomTitle,
}: StudyInviteDialogProps) {
  const { socialState, friendsPresence, presenceReady } = useCampusContext()
  const friends = socialState?.friends || []

  const [search, setSearch] = useState('')
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({})
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const tuKhoa = search.trim().toLowerCase()
  const trangThai = (id: number) => (presenceReady ? friendsPresence[id] : undefined)
  // Bạn đang trực tuyến lên đầu — mời họ thì mới có người vào ngay
  const filteredFriends = friends
    .filter(
      (f) => !tuKhoa || f.displayName.toLowerCase().includes(tuKhoa) || f.username.toLowerCase().includes(tuKhoa),
    )
    .map((f, viTri) => ({ friend: f, viTri, onl: trangThai(f.id)?.state === 'online' ? 0 : 1 }))
    .sort((a, b) => a.onl - b.onl || a.viTri - b.viTri)
    .map(({ friend }) => friend)

  const handleSendInvite = async (friendId: number) => {
    setErrorMsg(null)
    setLoadingMap((prev) => ({ ...prev, [friendId]: true }))

    try {
      const res = await fetch('/api/engagement/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: friendId,
          roomId,
          roomTitle,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data.loi || 'Không thể gửi lời mời.')
      } else {
        setSentMap((prev) => ({ ...prev, [friendId]: true }))
      }
    } catch {
      setErrorMsg('Lỗi kết nối khi gửi lời mời.')
    } finally {
      setLoadingMap((prev) => ({ ...prev, [friendId]: false }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mời bạn học cùng</DialogTitle>
          <DialogDescription>
            Bạn bè sẽ nhận thông báo mời vào <span className="font-medium break-words text-text-primary">“{roomTitle}”</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <p className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs text-destructive" role="alert">
            <AlertCircle className="mt-px size-4 shrink-0" />
            <span className="break-words">{errorMsg}</span>
          </p>
        )}

        {friends.length > 5 && (
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
            <Input
              placeholder="Tìm trong danh sách bạn bè"
              aria-label="Tìm bạn bè"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9"
            />
          </div>
        )}

        <div className="min-h-40">
          {friends.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center">
              <Users className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Bạn chưa có bạn bè để mời</p>
              <p className="mt-1 text-xs text-text-tertiary">Kết bạn ở trang Cộng đồng rồi quay lại mời nhé.</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <p className="flex min-h-40 items-center justify-center text-center text-sm text-text-tertiary">
              Không có ai khớp với “{search.trim()}”.
            </p>
          ) : (
            <ul className="-mx-1 max-h-[50svh] space-y-1 overflow-y-auto overscroll-contain px-1">
              {filteredFriends.map((friend) => {
                const isSent = sentMap[friend.id]
                const isLoading = loadingMap[friend.id]
                const presence = trangThai(friend.id)
                const dangOPhongNay = presence?.activity?.type === 'room' && presence.activity.roomId === roomId
                const dangTrucTuyen = presence?.state === 'online'

                return (
                  <li key={friend.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-raised/60">
                    <span className="relative shrink-0">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt="" className="size-9 rounded-full object-cover" />
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-9 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-secondary"
                        >
                          {getInitials(friend.displayName)}
                        </span>
                      )}
                      {dangTrucTuyen && (
                        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-surface" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words text-text-primary">{friend.displayName}</p>
                      <p className="text-xs break-words text-text-tertiary">
                        {dangOPhongNay
                          ? 'Đang ở trong phòng này'
                          : [friend.lopTen ? tenLop(friend.lopTen) : null, dangTrucTuyen ? 'đang trực tuyến' : null]
                              .filter(Boolean)
                              .join(' · ') || `@${friend.username}`}
                      </p>
                    </div>

                    {dangOPhongNay ? null : (
                      <Button
                        size="xs"
                        variant={isSent ? 'ghost' : 'default'}
                        disabled={isSent || isLoading}
                        onClick={() => handleSendInvite(friend.id)}
                        className={cn('shrink-0', isSent && 'text-success disabled:opacity-100')}
                      >
                        {isSent ? <Check /> : isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                        {isSent ? 'Đã mời' : 'Mời'}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
