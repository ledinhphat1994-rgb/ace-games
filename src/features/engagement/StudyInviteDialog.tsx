import { useState } from 'react'
import { Send, Users, Check, AlertCircle, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useCampusContext } from '@/app/CampusContext'

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
  const { socialState } = useCampusContext()
  const friends = socialState?.friends || []

  const [search, setSearch] = useState('')
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({})
  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const filteredFriends = friends.filter((f) =>
    f.displayName.toLowerCase().includes(search.toLowerCase()) ||
    f.username.toLowerCase().includes(search.toLowerCase()),
  )

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

      const data = await res.json()
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
      <DialogContent className="max-w-md p-5 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Mời bạn học cùng
                <Sparkles className="h-4 w-4 text-primary" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Gửi lời mời tham gia phòng học “{roomTitle}”
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3 my-2">
          {friends.length > 5 && (
            <Input
              placeholder="Tìm bạn bè theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs h-9"
            />
          )}

          {friends.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Bạn chưa có bạn bè nào để mời. Hãy kết bạn ở Sảnh Campus trước nhé!
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Không tìm thấy bạn bè phù hợp.
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {filteredFriends.map((friend) => {
                const isSent = sentMap[friend.id]
                const isLoading = loadingMap[friend.id]

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/40 bg-background/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 border border-border/50">
                        <AvatarImage src={friend.avatar || undefined} />
                        <AvatarFallback className="text-xs font-bold">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {friend.displayName}
                        </div>
                        {friend.lopTen && (
                          <div className="text-[10px] text-muted-foreground">
                            Lớp {friend.lopTen}
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSent ? 'secondary' : 'default'}
                      disabled={isSent || isLoading}
                      onClick={() => handleSendInvite(friend.id)}
                      className="h-8 px-3 text-xs gap-1.5 shrink-0"
                    >
                      {isSent ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Đã mời</span>
                        </>
                      ) : isLoading ? (
                        <span>Đang gửi...</span>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Mời</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
